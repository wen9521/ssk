package com.example.myapp;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    webView = findViewById(R.id.webview);

    // 1. 构造 Loader
    final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
      // 将虚拟路径 /www/ 映射到应用的 assets 目录
      .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
      .build();

    // 2. client 拦截请求
    webView.setWebViewClient(new WebViewClient() {
      @Override
      public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        return assetLoader.shouldInterceptRequest(request.getUrl());
      }
    });

    // 3. 启用 JS、DOM 存储等
    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(true); // 允许访问文件

    // 启用调试
    WebView.setWebContentsDebuggingEnabled(true);
    
    // 4. 直接用伪 HTTPS URL 加载
    webView.loadUrl("https://appassets.androidplatform.net/www/index.html");
  }
}
