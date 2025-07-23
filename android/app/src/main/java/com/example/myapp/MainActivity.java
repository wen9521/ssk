package com.example.myapp;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";
    private static final String APP_DOMAIN = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + APP_DOMAIN + "/www/index.html";

    private WebViewAssetLoader assetLoader;
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 初始化 Assets Loader
        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain(APP_DOMAIN)
            .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/media/",
                new WebViewAssetLoader.InternalStoragePathHandler(
                    this, new File(getFilesDir(), "media")))
            .build();

        webView = findViewById(R.id.webview);
        configureWebView();
        webView.loadUrl(START_URL);
    }

    @SuppressLint("NewApi")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        // 启用 JS、DOMStorage
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 只允许 http/https 访问，关闭 file://
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        // 混合内容模式，允许 HTTPS 页面加载 HTTP 资源（遇到跨协议时可开启）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(
                WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            );
        }

        // 仅 DEBUG 构建启用调试
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        // 捕获 console.log / 错误
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG + ":JS", consoleMessage.message()
                    + " — line " + consoleMessage.lineNumber()
                    + " of " + consoleMessage.sourceId());
                return true;
            }
        });

        // 拦截本地资源 & 日志 page load
        webView.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                // 本地资源走 AssetLoader
                if (APP_DOMAIN.equals(host)) {
                    WebResourceResponse resp = assetLoader.shouldInterceptRequest(uri);

                    // 移除可能干扰的 Permissions-Policy 头
                    if (resp != null && Build.VERSION.SDK_INT >= 21) {
                        Map<String, String> headers = resp.getResponseHeaders();
                        if (headers != null) {
                            headers.remove("Permissions-Policy");
                            resp.setResponseHeaders(headers);
                        }
                    }
                    return resp;
                }

                // 其他域名正常走外部
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.i(TAG, "页面加载完成: " + url);
            }
        });

        // 硬件加速
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        } else {
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        webView.evaluateJavascript(
            "if(window.appResume) appResume();", null
        );
    }

    @Override
    protected void onPause() {
        webView.onPause();
        webView.evaluateJavascript(
            "if(window.appPause) appPause();", null
        );
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
