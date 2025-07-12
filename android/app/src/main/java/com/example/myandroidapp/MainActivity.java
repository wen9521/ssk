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
        progressBar = findViewById(R.id.progressBar); // 假设你的 layout 中有一个 ProgressBar

        // --- 核心 WebView 设置 ---

        // 1. 开启调试 (仅在 Debug 版本中开启，更安全)
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);      // 必须：允许执行 JavaScript
        webSettings.setDomStorageEnabled(true);      // 必须：允许 DOM Storage API (localStorage)
        webSettings.setDatabaseEnabled(true);        // 允许数据库存储 API
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT); // 使用默认缓存策略

        // 2. 改进的资源加载方式 (更推荐)
        // 使用 WebViewAssetLoader 可以让 WebView 正确处理 Service Worker 和其他高级 Web 功能
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        // 3. 设置 WebViewClient：处理页面导航、错误等
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest request) {
                // 将所有请求都通过 AssetLoader 来处理，以正确加载本地资源
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                Log.e(TAG, "WebView Error: " + errorCode + " - " + description + " at " + failingUrl);
                // 可以在这里加载一个本地的错误页面
                // webView.loadUrl("file:///android_asset/error.html");
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // 在生产环境中，不应该忽略 SSL 错误。
                // 这通常意味着中间人攻击或服务器证书配置错误。
                Log.e(TAG, "WebView SSL Error: " + error.toString());
                if (BuildConfig.DEBUG) {
                    handler.proceed(); // 调试时可以接受自签名证书
                } else {
                    handler.cancel(); // 生产环境中拒绝
                }
            }
        });

        // 4. 设置 WebChromeClient：处理浏览器 UI 相关事件
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

        // 5. 加载入口页面
        // 使用 AssetLoader 的推荐方式加载
        webView.loadUrl("https://appassets.androidplatform.net/index.html");
    }

    // 6. 处理返回键逻辑
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack(); // 如果 WebView 内部有历史记录，则后退
        } else {
            super.onBackPressed(); // 否则执行默认的退出应用操作
        }
    }
}
