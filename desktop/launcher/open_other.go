//go:build !windows

package main

import (
	"os/exec"
	"runtime"
)

func openBrowser(u string) {
	if runtime.GOOS == "darwin" {
		_ = exec.Command("open", u).Start()
		return
	}
	_ = exec.Command("xdg-open", u).Start()
}
