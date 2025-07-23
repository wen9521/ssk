package com.example.myapp;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final String APP_DOMAIN = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + APP_DOMAIN + "/www/index.html";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 1. AssetLoader：将 /www/ 映射到 assets/www/
        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .setDomain(APP_DOMAIN)
            .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        WebView webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                Log.d(TAG + ":JS", msg.message() + " — line " + msg.lineNumber());
                return true;
            }
        });

        // 修复点：移除了修改响应头的代码
        webView.setWebViewClient(new WebViewClient() {
            // 资源拦截 - 不再修改响应头
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view,
                                                             WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            // 页面加载完成
            @Override
            public void onPageFinished(WebView view, String url) {
                Log.i(TAG, "✅ 页面加载完成: " + url);
            }

            // 旧版网络或资源错误回调
            @Override
            public void onReceivedError(WebView view,
                                        int errorCode,
                                        String description,
                                        String failingUrl) {
                Log.e(TAG, "❌ 加载失败: " + failingUrl + " — " + description);
                view.loadData(
                    "<html><body><h2 style='color:red;'>❌ 页面加载失败</h2>" +
                    "<p>错误码：" + errorCode + "</p></body></html>",
                    "text/html", "UTF-8"
                );
            }

            // HTTP 层面的错误
            @Override
            public void onReceivedHttpError(WebView view,
                                            WebResourceRequest request,
                                            WebResourceResponse errorResponse) {
                if (request.isForMainFrame()) {
                    Log.e(TAG, "❌ HTTP 错误: " +
                        request.getUrl() + " — code=" + errorResponse.getStatusCode());
                }
            }

            // SSL 错误处理
            @Override
            public void onReceivedSslError(WebView view,
                                           android.webkit.SslErrorHandler handler,
                                           android.net.http.SslError error) {
                Log.e(TAG, "❌ SSL 错误: " + error.toString());
                handler.proceed();
            }
        });

        // 渲染优化
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        } else {
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
        }

        Log.i(TAG, "📦 加载页面: " + START_URL);
        webView.loadUrl(START_URL);
    }
}
