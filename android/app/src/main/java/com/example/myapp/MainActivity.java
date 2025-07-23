package com.example.myapp;

import android.net.Uri;
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

    WebView.setWebContentsDebuggingEnabled(true);

    // 2. 拦截两种请求方式，交给 AssetLoader 处理
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(
          WebView view, WebResourceRequest request) {
        return assetLoader.shouldInterceptRequest(request.getUrl());
      }

      @Override
      @Deprecated
      public WebResourceResponse shouldInterceptRequest(
          WebView view, String url) {
        return assetLoader.shouldInterceptRequest(Uri.parse(url));
      }
    });

    // 3. 加载伪 HTTPS 地址
    webView.loadUrl("https://appassets.androidplatform.net/www/index.html");
  }
}
