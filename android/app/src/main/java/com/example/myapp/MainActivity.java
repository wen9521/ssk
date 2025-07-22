package com.example.myapp;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {
  private WebView webView;
  private WebViewAssetLoader assetLoader;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    // 1. 构造 AssetLoader，把 assets/www/ 映射到 https://appassets.androidplatform.net/www/
    assetLoader = new WebViewAssetLoader.Builder()
      .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
      .build();

    webView = findViewById(R.id.webview);
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    // file:// 权限不再需要，全部走 HTTPS

    WebView.setWebContentsDebuggingEnabled(true);

    // 2. 拦截请求，让 AssetLoader 处理 https://appassets.androidplatform.net/www/*
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(
          WebView view, WebResourceRequest request) {
        return assetLoader.shouldInterceptRequest(request.getUrl());
      }
    });

    // 3. 直接加载伪 HTTPS 地址
    webView.loadUrl("https://appassets.androidplatform.net/www/index.html");
  }
}
