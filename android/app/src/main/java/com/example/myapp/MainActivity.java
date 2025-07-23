package com.example.myapp;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebSettings; 
import android.widget.Toast;
import java.io.File; 

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public class MainActivity extends AppCompatActivity {
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
        
        webView.loadUrl(START_URL);
    }

    private void configureWebView() {
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT); 
        
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(true);
        webView.getSettings().setAllowFileAccessFromFileURLs(false);
        webView.getSettings().setAllowUniversalAccessFromFileURLs(false);
        
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        webView.setWebViewClient(new LocalContentWebViewClient());
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        } else {
            webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
        }
    }

    private class LocalContentWebViewClient extends WebViewClientCompat {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return assetLoader.shouldInterceptRequest(request.getUrl());
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return assetLoader.shouldInterceptRequest(Uri.parse(url));
        }

        @Override
        public void onReceivedError(WebView view, int errorCode, 
                                   String description, String failingUrl) {
            // 关键修复：添加显式外部类引用
            MainActivity.this.handleLoadError(failingUrl, "Error: " + description);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, 
                                       WebResourceResponse errorResponse) {
            String errorMsg = "HTTP " + errorResponse.getStatusCode();
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                errorMsg += " - " + errorResponse.getReasonPhrase();
            }
            // 关键修复：添加显式外部类引用
            MainActivity.this.handleLoadError(request.getUrl().toString(), errorMsg);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String host = uri.getHost();
            
            if (APP_DOMAIN.equals(host)) {
                return false;
            }
            
            if ("tel".equals(uri.getScheme()) || "mailto".equals(uri.getScheme())) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                } catch (Exception e) {
                    Log.w("URL Handling", "No app to handle " + uri.getScheme() + " link");
                }
            }
            
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return true;
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "无法打开链接", Toast.LENGTH_SHORT).show();
            }
            return false;
        }
    }

    private void handleLoadError(String url, String error) {
        Log.e("WebViewError", "Failed to load: " + url + " | Error: " + error);
        
        if (url.equals(START_URL)) {
            runOnUiThread(() -> {
                String errorHtml = "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
                        "<title>应用加载错误</title><style>" +
                        "body{font-family:sans-serif;text-align:center;padding:20% 20px;}" +
                        "h1{color:#d32f2f;}.btn{margin-top:20px;padding:10px 20px;" +
                        "background:#1976d2;color:white;border:none;border-radius:4px;}" +
                        "</style></head><body>" +
                        "<h1>应用加载失败</h1>" +
                        "<p>无法加载应用程序，请检查网络连接或重启应用。</p>" +
                        "<button class='btn' onclick='location.reload()'>重试</button>" +
                        "</body></html>";
                
                webView.loadDataWithBaseURL(
                    "https://" + APP_DOMAIN,
                    errorHtml,
                    "text/html",
                    "UTF-8",
                    null
                );
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        webView.evaluateJavascript("if (typeof appResume === 'function') appResume();", null);
    }

    @Override
    protected void onPause() {
        webView.onPause();
        webView.evaluateJavascript("if (typeof appPause === 'function') appPause();", null);
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
