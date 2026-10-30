package nl.flicentie.trainer;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Dunne schil om de F-licentie-trainer: een scherm om het serveradres in te vullen (eenmalig) en daarna een WebView
 * die die website toont. Omdat de pagina van je eigen server komt, werken inloggen en synchroniseren precies zoals in de browser.
 */
public class MainActivity extends Activity {
    private static final String PREFS = "flic";
    private static final String KEY_SERVER = "server";
    private static final int REQ_FILE = 42;

    private WebView web;
    private String server;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        server = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER, null);
        if (server == null) showSetup(null); else showWeb();
    }

    // ---- serveradres invullen ----
    private void showSetup(String error) {
        web = null;
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_VERTICAL);
        box.setPadding(pad, pad, pad, pad);
        box.setBackgroundColor(Color.parseColor("#0F1419"));

        TextView title = new TextView(this);
        title.setText("F-licentie oefenen");
        title.setTextColor(Color.WHITE);
        title.setTextSize(24);
        box.addView(title);

        TextView info = new TextView(this);
        info.setText("Vul het adres in van je eigen server waarop de app draait, bijvoorbeeld https://flic.jouwdomein.nl of http://192.168.1.10:8090. Dit hoeft maar één keer.");
        info.setTextColor(Color.parseColor("#8B98A9"));
        info.setPadding(0, pad / 2, 0, pad / 2);
        box.addView(info);

        final EditText input = new EditText(this);
        input.setHint("https://");
        input.setText(server != null ? server : "https://");
        input.setSelection(input.getText().length());
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setImeOptions(EditorInfo.IME_ACTION_GO);
        input.setTextColor(Color.WHITE);
        input.setHintTextColor(Color.parseColor("#8B98A9"));
        box.addView(input);

        final TextView err = new TextView(this);
        err.setTextColor(Color.parseColor("#F85149"));
        err.setText(error == null ? "" : error);
        box.addView(err);

        Button go = new Button(this);
        go.setText("Opslaan en openen");
        box.addView(go, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        final Runnable save = new Runnable() {
            @Override public void run() {
                String url = input.getText().toString().trim();
                if (!url.matches("(?i)^https?://[^\\s/]+.*$")) { err.setText("Begin met http:// of https://"); return; }
                while (url.endsWith("/")) url = url.substring(0, url.length() - 1);
                server = url;
                getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(KEY_SERVER, server).apply();
                showWeb();
            }
        };
        go.setOnClickListener(new View.OnClickListener() { @Override public void onClick(View v) { save.run(); } });
        input.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override public boolean onEditorAction(TextView v, int actionId, android.view.KeyEvent e) { save.run(); return true; }
        });
        setContentView(box);
    }

    // ---- de website ----
    private void showWeb() {
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0F1419"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage: hier staat je voortgang
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.addJavascriptInterface(new Bridge(), "FlicApp");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("flic-app".equals(u.getScheme())) {
                    if ("change".equals(u.getHost())) changeServer(); else v.loadUrl(server);
                    return true;
                }
                Uri base = Uri.parse(server);
                if (u.getHost() != null && u.getHost().equalsIgnoreCase(base.getHost())) return false;   // onze eigen site
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) {
                    String html = "<html><body style='background:#0f1419;color:#e6edf3;font-family:sans-serif;padding:24px'>"
                        + "<h2>Geen verbinding met de server</h2><p style='color:#8b98a9'>" + server + "</p>"
                        + "<p>Controleer je internetverbinding en of de server aanstaat.</p>"
                        + "<p><a style='color:#4da3ff;font-size:1.2em' href='flic-app://retry'>Opnieuw proberen</a></p>"
                        + "<p><a style='color:#4da3ff' href='flic-app://change'>Serveradres wijzigen</a></p></body></html>";
                    v.loadDataWithBaseURL(server, html, "text/html", "utf-8", null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try { startActivityForResult(p.createIntent(), REQ_FILE); } catch (Exception e) { fileCallback = null; return false; }
                return true;
            }
        });
        setContentView(web);
        web.loadUrl(server);
    }

    private void changeServer() {
        runOnUiThread(new Runnable() { @Override public void run() { showSetup(null); } });
    }

    /** Voor de website zelf: knop "Serveradres van de app wijzigen" (zie tabblad Meer). */
    private class Bridge {
        @JavascriptInterface public void changeServer() { MainActivity.this.changeServer(); }
        @JavascriptInterface public String server() { return server; }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(res == RESULT_OK ? WebChromeClient.FileChooserParams.parseResult(res, data) : null);
            fileCallback = null;
        } else super.onActivityResult(req, res, data);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override protected void onPause() { super.onPause(); if (web != null) web.onPause(); }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
}
