package com.example.myapp;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends AppCompatActivity {
  private static final String TAG = "MainActivity";
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    webView = findViewById(R.id.webview);
    setupWebView();
    loadLocalPage();
  }

  private void setupWebView() {
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowFileAccessFromFileURLs(true);
    settings.setAllowUniversalAccessFromFileURLs(true);
    WebView.setWebContentsDebuggingEnabled(true);

    webView.setWebChromeClient(new WebChromeClient() {
      @Override
      public boolean onConsoleMessage(ConsoleMessage msg) {
        Log.d(TAG, "JS Console: " + msg.message()
            + " @ line " + msg.lineNumber()
            + " of " + msg.sourceId());
        return true;
      }
    });

    webView.setWebViewClient(new WebViewClient() {
      @Override
      public void onPageStarted(WebView view, String url, Bitmap favicon) {
        Log.d(TAG, "Page start: " + url);
      }

      @Override
      public void onPageFinished(WebView view, String url) {
        Log.d(TAG, "Page finish: " + url);
      }

      @Override
      public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
        Log.e(TAG, "Load error: " + req.getUrl() + " → " + err.getDescription());
      }

      @Override
      public void onReceivedHttpError(WebView view, WebResourceRequest req, WebResourceResponse resp) {
        Log.e(TAG, "HTTP error: " + req.getUrl() + " → status " + resp.getStatusCode());
      }
    });
  }

  private void loadLocalPage() {
    try (InputStream is = getAssets().open("www/index.html");
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

      byte[] buf = new byte[1024];
      int len;
      while ((len = is.read(buf)) > 0) {
        baos.write(buf, 0, len);
      }
      String html = baos.toString("UTF-8");

      // ✅ 修复 HTML 内容
      html = html
        .replaceAll("<base href=\".*?\"", "<base href=\"file:///android_asset/www/\"")
        .replace("width=evice-width", "width=device-width")
        .replace("</scrip>", "</script>");

      webView.loadDataWithBaseURL(
        "file:///android_asset/www/",
        html,
        "text/html",
        "UTF-8",
        null
      );

      Log.d(TAG, "loadDataWithBaseURL done");

    } catch (IOException e) {
      Log.e(TAG, "Failed to load assets/www/index.html", e);
    }
  }
}
