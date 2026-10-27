// F-licentie oefenen, Windows-versie: één programma met de website, de database en de accounts erin.
//
// Dubbelklikken start alles en opent de browser. Je gegevens (accounts en voortgang) staan in de map
// "F-licentie-data" naast dit bestand. Geen installatie en geen internet nodig.
//
// Onder de motor draait PocketBase (hetzelfde als in de Docker-versie). Dit programma:
//   1. pakt PocketBase en de databasemigratie uit naar de datamap (alleen als de versie nieuw is),
//   2. start PocketBase op een intern poortnummer,
//   3. serveert de website uit het programma zelf en stuurt /api en /_/ door naar PocketBase.
package main

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"
)

//go:embed site
var siteFS embed.FS

//go:embed assets
var assetsFS embed.FS

const version = "1.0"

func main() {
	port := flag.Int("port", 8090, "poort voor de website")
	lan := flag.Bool("lan", false, "ook bereikbaar maken voor andere apparaten in je netwerk (tablet, telefoon)")
	dataFlag := flag.String("data", "", "map voor de gegevens (standaard: F-licentie-data naast dit bestand)")
	noBrowser := flag.Bool("no-browser", false, "de browser niet automatisch openen")
	flag.Parse()

	if err := run(*port, *lan, *dataFlag, *noBrowser); err != nil {
		fmt.Println()
		fmt.Println("FOUT:", err)
		waitEnter()
		os.Exit(1)
	}
}

func waitEnter() {
	if runtime.GOOS == "windows" {
		fmt.Print("Druk op Enter om te sluiten…")
		bufio.NewReader(os.Stdin).ReadString('\n')
	}
}

func run(port int, lan bool, dataFlag string, noBrowser bool) error {
	// Op sommige Windows-computers staat .js in het register als text/plain; de site heeft de juiste typen nodig.
	for ext, t := range map[string]string{".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
		".html": "text/html; charset=utf-8", ".json": "application/json; charset=utf-8", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon"} {
		_ = mime.AddExtensionType(ext, t)
	}

	root, err := dataRoot(dataFlag)
	if err != nil {
		return err
	}
	pbBin, err := unpack(root)
	if err != nil {
		return fmt.Errorf("uitpakken mislukt: %w", err)
	}

	local := fmt.Sprintf("http://localhost:%d", port)
	// Draait er al een kopie? Dan alleen de browser openen.
	if alreadyRunning(port) {
		fmt.Println("F-licentie draait al:", local)
		if !noBrowser {
			openBrowser(local)
		}
		time.Sleep(1500 * time.Millisecond)
		return nil
	}

	pbPort, err := freePort()
	if err != nil {
		return err
	}
	logf, err := os.OpenFile(filepath.Join(root, "database.log"), os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	defer logf.Close()
	cmd := exec.Command(pbBin, "serve",
		fmt.Sprintf("--http=127.0.0.1:%d", pbPort),
		"--dir="+filepath.Join(root, "pb_data"),
		"--migrationsDir="+filepath.Join(root, "pb_migrations"))
	cmd.Stdout, cmd.Stderr = logf, logf
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("de database starten lukt niet: %w", err)
	}
	stop := func() {
		if cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
	}
	defer stop()
	exited := make(chan error, 1)
	go func() { exited <- cmd.Wait() }()

	pbURL := fmt.Sprintf("http://127.0.0.1:%d", pbPort)
	if err := waitHealthy(pbURL, exited); err != nil {
		return fmt.Errorf("de database werd niet klaar (zie %s): %w", filepath.Join(root, "database.log"), err)
	}

	target, _ := url.Parse(pbURL)
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.FlushInterval = -1
	sub, _ := fs.Sub(siteFS, "site")
	static := http.FileServer(http.FS(sub))
	mux := http.NewServeMux()
	mux.Handle("/api/", proxy)
	mux.Handle("/_/", proxy)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/img/") {
			w.Header().Set("Cache-Control", "public, max-age=3600")
		} else {
			w.Header().Set("Cache-Control", "no-cache")
		}
		static.ServeHTTP(w, r)
	})

	host := "127.0.0.1"
	if lan {
		host = "0.0.0.0"
	}
	ln, err := net.Listen("tcp", fmt.Sprintf("%s:%d", host, port))
	if err != nil {
		return fmt.Errorf("poort %d is al in gebruik door een ander programma. Sluit dat af, of start met --port 8091 (let op: je voortgang zonder account hoort bij het poortnummer): %w", port, err)
	}
	srv := &http.Server{Handler: mux}
	go func() { _ = srv.Serve(ln) }()

	fmt.Println("================================================")
	fmt.Println("  F-licentie oefenen  (versie " + version + ")")
	fmt.Println("================================================")
	fmt.Println("  Open in je browser:  " + local)
	if lan {
		for _, ip := range lanIPs() {
			fmt.Printf("  Op je tablet/telefoon: http://%s:%d\n", ip, port)
		}
	}
	fmt.Println("  Je gegevens staan in:", root)
	fmt.Println()
	fmt.Println("  Laat dit venster open zolang je oefent.")
	fmt.Println("  Sluit het venster om te stoppen.")
	if !noBrowser {
		openBrowser(local)
	}

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	select {
	case <-sig:
	case err := <-exited:
		return fmt.Errorf("de database is onverwacht gestopt (zie %s): %v", filepath.Join(root, "database.log"), err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	return nil
}

// dataRoot: F-licentie-data naast het programma; kan dat niet (bijv. Program Files), dan in %LOCALAPPDATA%.
func dataRoot(flagVal string) (string, error) {
	try := func(dir string) (string, error) {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return "", err
		}
		probe := filepath.Join(dir, ".schrijftest")
		if err := os.WriteFile(probe, []byte("x"), 0o644); err != nil {
			return "", err
		}
		_ = os.Remove(probe)
		return dir, nil
	}
	if flagVal != "" {
		return try(flagVal)
	}
	exe, err := os.Executable()
	if err == nil {
		if d, err := try(filepath.Join(filepath.Dir(exe), "F-licentie-data")); err == nil {
			return d, nil
		}
	}
	base, err := os.UserConfigDir()
	if err != nil {
		return "", errors.New("er is geen map om je gegevens in te bewaren")
	}
	return try(filepath.Join(base, "F-licentie"))
}

// unpack zet PocketBase en de migratie klaar in de datamap. Bij een nieuwe versie wordt PocketBase vervangen; de database blijft staan.
func unpack(root string) (string, error) {
	zipBytes, err := assetsFS.ReadFile("assets/pocketbase.zip")
	if err != nil {
		return "", err
	}
	sum := sha256.Sum256(zipBytes)
	ver := hex.EncodeToString(sum[:8])
	binDir := filepath.Join(root, "bin")
	name := "pocketbase"
	if runtime.GOOS == "windows" {
		name += ".exe"
	}
	bin := filepath.Join(binDir, name)
	if b, err := os.ReadFile(filepath.Join(binDir, ".versie")); err != nil || string(b) != ver {
		if err := os.MkdirAll(binDir, 0o755); err != nil {
			return "", err
		}
		zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
		if err != nil {
			return "", err
		}
		found := false
		for _, f := range zr.File {
			if f.Name != name {
				continue
			}
			rc, err := f.Open()
			if err != nil {
				return "", err
			}
			tmp := bin + ".nieuw"
			out, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
			if err != nil {
				rc.Close()
				return "", err
			}
			_, err = io.Copy(out, rc)
			rc.Close()
			out.Close()
			if err != nil {
				return "", err
			}
			_ = os.Remove(bin)
			if err := os.Rename(tmp, bin); err != nil {
				return "", err
			}
			found = true
		}
		if !found {
			return "", fmt.Errorf("%s zit niet in het pakket", name)
		}
		_ = os.WriteFile(filepath.Join(binDir, ".versie"), []byte(ver), 0o644)
	}
	// migraties: bestaande bestanden met dezelfde naam worden niet overschreven
	migDir := filepath.Join(root, "pb_migrations")
	if err := os.MkdirAll(migDir, 0o755); err != nil {
		return "", err
	}
	ents, _ := assetsFS.ReadDir("assets/migrations")
	for _, e := range ents {
		dst := filepath.Join(migDir, e.Name())
		if _, err := os.Stat(dst); err == nil {
			continue
		}
		b, _ := assetsFS.ReadFile("assets/migrations/" + e.Name())
		if err := os.WriteFile(dst, b, 0o644); err != nil {
			return "", err
		}
	}
	return bin, nil
}

func freePort() (int, error) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

func alreadyRunning(port int) bool {
	c := http.Client{Timeout: 700 * time.Millisecond}
	resp, err := c.Get(fmt.Sprintf("http://127.0.0.1:%d/api/health", port))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

func waitHealthy(base string, exited chan error) error {
	c := http.Client{Timeout: time.Second}
	deadline := time.Now().Add(60 * time.Second)
	for time.Now().Before(deadline) {
		select {
		case err := <-exited:
			return fmt.Errorf("gestopt: %v", err)
		default:
		}
		if resp, err := c.Get(base + "/api/health"); err == nil {
			resp.Body.Close()
			if resp.StatusCode == 200 {
				return nil
			}
		}
		time.Sleep(250 * time.Millisecond)
	}
	return errors.New("time-out")
}

func lanIPs() []string {
	var out []string
	addrs, _ := net.InterfaceAddrs()
	for _, a := range addrs {
		if n, ok := a.(*net.IPNet); ok && !n.IP.IsLoopback() && n.IP.To4() != nil && n.IP.IsPrivate() {
			out = append(out, n.IP.String())
		}
	}
	return out
}
