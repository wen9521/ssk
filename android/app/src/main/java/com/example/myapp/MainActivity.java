package com.example.myapp;

import android.annotation.SuppressLint;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import java.util.HashMap;
import java.util.Map;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final String APP_DOMAIN = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + APP_DOMAIN + "/www/index.html";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .setDomain(APP_DOMAIN)
            .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView = findViewById(R.id.webview);

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

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse resp = assetLoader.shouldInterceptRequest(request.getUrl());
                if (resp != null && Build.VERSION.SDK_INT >= 21) {
                    Map<String, String> headers = resp.getResponseHeaders();
                    if (headers != null) {
                        headers = new HashMap<>(headers);
                        headers.remove("Content-Security-Policy");
                        headers.remove("Permissions-Policy");
                        resp.setResponseHeaders(headers);
                    }
                }
                return resp;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.i(TAG, "✅ 页面加载完成: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                Log.e(TAG, "❌ 页面加载错误: " + request.getUrl() + " — " + errorResponse.getStatusCode());
                view.loadData(
                    "<html><body><h2 style='color:red;'>❌ 页面加载失败</h2><p>请检查资源路径或构建结果。</p></body></html>",
                    "text/html", "UTF-8"
                );
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                Log.e(TAG, "❌ HTTP 错误: " + request.getUrl() + " — " + errorResponse.getStatusCode());
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        } else {
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
        }

        Log.i(TAG, "📦 加载页面: " + START_URL);
        webView.loadUrl(START_URL);
    }
}
