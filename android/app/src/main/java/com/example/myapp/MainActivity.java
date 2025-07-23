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
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
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

        assetLoader = new WebViewAssetLoader.Builder()
            .setDomain(APP_DOMAIN)
            .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
            .addPathHandler("/media/", new WebViewAssetLoader.InternalStoragePathHandler(
                this, new File(getFilesDir(), "media")))
            .build();

        webView = findViewById(R.id.webview);
        configureWebView();
        Log.i(TAG, "Loading URL: " + START_URL);
        webView.loadUrl(START_URL);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                Log.d(TAG + ":JS", msg.message() + " — line " + msg.lineNumber() + " of " + msg.sourceId());
                return true;
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_DOMAIN.equals(uri.getHost())) {
                    WebResourceResponse resp = assetLoader.shouldInterceptRequest(uri);
                    if (resp != null && Build.VERSION.SDK_INT >= 21) {
                        Map<String, String> headers = resp.getResponseHeaders();
                        if (headers != null) {
                            headers = new HashMap<>(headers);
                            headers.remove("Permissions-Policy");
                            resp.setResponseHeaders(headers);
                        }
                    }
                    return resp;
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.i(TAG, "页面加载完成: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceResponse errorResponse) {
                Log.e(TAG, "加载失败: " + req.getUrl() + " — " + errorResponse.getStatusCode());
                showErrorPage();
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                Log.e(TAG, "加载失败: " + failingUrl + " — " + description);
                showErrorPage();
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        } else {
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
        }
    }

    private void showErrorPage() {
        String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
            "<title>加载失败</title><style>" +
            "body{font-family:sans-serif;text-align:center;padding:20% 20px;}" +
            "h1{color:#d32f2f;}button{margin-top:20px;padding:10px 20px;" +
            "background:#1976d2;color:white;border:none;border-radius:4px;}" +
            "</style></head><body>" +
            "<h1>应用加载失败</h1>" +
            "<p>请检查网络连接或稍后重试。</p>" +
            "<button onclick='location.reload()'>重试</button>" +
            "</body></html>";

        webView.loadDataWithBaseURL(
            "https://" + APP_DOMAIN,
            html,
            "text/html",
            "UTF-8",
            null
        );
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
        webView.evaluateJavascript("if(window.appResume) appResume();", null);
    }

    @Override
    protected void onPause() {
        webView.onPause();
        webView.evaluateJavascript("if(window.appPause) appPause();", null);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
