package com.example.myandroidapp;

import androidx.appcompat.app.AppCompatActivity;
import android.net.http.SslError;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ProgressBar progressBar;
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 隐藏标题栏
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);

        // --- 核心 WebView 设置 ---

        // 1. 开启调试 (仅在 Debug 版本中开启，更安全)
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // 2. WebSettings 配置 (已补充关键权限)
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);      // 必须：允许执行 JavaScript
        webSettings.setDomStorageEnabled(true);      // 必须：允许 DOM Storage API (localStorage)
        webSettings.setDatabaseEnabled(true);        // 允许数据库存储 API
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT); // 使用默认缓存策略
        
        // --- 关键修复 ---
        webSettings.setAllowFileAccess(true);            // 允许访问文件
        webSettings.setAllowContentAccess(true);         // 允许访问内容
        webSettings.setAllowFileAccessFromFileURLs(true); // 允许文件URL中访问其他文件URL
        webSettings.setAllowUniversalAccessFromFileURLs(true); // 允许文件URL中进行通用访问

        // 3. 使用 WebViewAssetLoader 加载本地资源
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        // 4. 设置 WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.e(TAG, "WebView Error: " + errorCode + " - " + description + " at " + failingUrl);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                Log.e(TAG, "WebView SSL Error: " + error.toString());
                if (BuildConfig.DEBUG) {
                    handler.proceed();
                } else {
                    handler.cancel();
                }
            }
        });

        // 5. 设置 WebChromeClient
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        // 6. 加载入口页面
        webView.loadUrl("https://appassets.androidplatform.net/index.html");
    }

    // 7. 处理返回键逻辑
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
