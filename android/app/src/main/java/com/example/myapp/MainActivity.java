package com.example.myapp;

import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
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
      public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
        Log.d(TAG, consoleMessage.message() 
          + " -- From line " + consoleMessage.lineNumber() 
          + " of " + consoleMessage.sourceId());
        return true;
      }
    });
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public void onPageFinished(WebView view, String url) {
        Log.d(TAG, "Page loaded: " + url);
      }
    });
  }

  private void loadLocalPage() {
    try {
      InputStream is = getAssets().open("www/index.html");
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      byte[] buffer = new byte[1024];
      int read;
      while ((read = is.read(buffer)) != -1) {
        baos.write(buffer, 0, read);
      }
      is.close();
      String html = baos.toString("UTF-8");

      webView.loadDataWithBaseURL(
        "file:///android_asset/www/", html, "text/html", "utf-8", null);

      Log.d(TAG, "loadDataWithBaseURL done");
    } catch (IOException e) {
      Log.e(TAG, "Failed to load assets/www/index.html", e);
    }
  }
}