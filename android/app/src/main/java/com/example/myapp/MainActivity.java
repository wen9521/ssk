package com.example.myapp;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

public class MainActivity extends AppCompatActivity {
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    webView = findViewById(R.id.webview);

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowFileAccessFromFileURLs(true);
    settings.setAllowUniversalAccessFromFileURLs(true);

    WebView.setWebContentsDebuggingEnabled(true);
    webView.setWebViewClient(new WebViewClient());

    String html = loadHtmlFromAssets("www/index.html");
    html = fixHtmlPaths(html);

    webView.loadDataWithBaseURL(
      "file:///android_asset/www/",
      html,
      "text/html",
      "UTF-8",
      null
    );
  }

  private String loadHtmlFromAssets(String filename) {
    try {
      BufferedReader reader = new BufferedReader(
        new InputStreamReader(getAssets().open(filename))
      );
      StringBuilder builder = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        builder.append(line).append("\n");
      }
      reader.close();
      return builder.toString();
    } catch (IOException e) {
      e.printStackTrace();
      return "<h1>加载失败</h1>";
    }
  }

  private String fixHtmlPaths(String html) {
    return html
      .replaceAll("<base href=\"[^\"]*\"", "<base href=\"file:///android_asset/www/\"")
      .replaceAll("src=\"\\./", "src=\"")
      .replaceAll("href=\"\\./", "href=\"")
      .replaceAll("src=\"/", "src=\"")
      .replaceAll("href=\"/", "href=\"");
  }
}
