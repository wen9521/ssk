package com.example.myapp;

import android.annotation.SuppressLint;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

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

        // Initialize WebViewAssetLoader with custom handlers
        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(APP_DOMAIN)
                .addPathHandler("/www/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/media/", new WebViewAssetLoader.InternalStoragePathHandler(
                        this, getFilesDir(), "media"))
                .build();

        webView = findViewById(R.id.webview);
        configureWebViewSettings();
        setupWebViewClient();
        
        // Load the main app URL
        webView.loadUrl(START_URL);
    }

    private void configureWebViewSettings() {
        WebSettings settings = webView.getSettings();
        
        // Enable essential features
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Security settings
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        
        // Performance optimizations
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        
        // Enable remote debugging
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
    }

    private void setupWebViewClient() {
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, 
                                                             WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return assetLoader.shouldInterceptRequest(Uri.parse(url));
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, 
                                        WebResourceError error) {
                handleLoadError(request.getUrl().toString(), error.getDescription().toString());
            }

            @Override
            @RequiresApi(api = android.os.Build.VERSION_CODES.M)
            public void onReceivedHttpError(WebView view, WebResourceRequest request, 
                                            WebResourceResponse errorResponse) {
                handleLoadError(request.getUrl().toString(), 
                               "HTTP " + errorResponse.getStatusCode());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Handle deep links or external URLs
                Uri uri = request.getUrl();
                if (!APP_DOMAIN.equals(uri.getHost())) {
                    // Open external URLs in browser
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    startActivity(intent);
                    return true;
                }
                return false;
            }
        });
    }

    private void handleLoadError(String url, String error) {
        if (url.equals(START_URL)) {
            runOnUiThread(() -> {
                // Show user-friendly error message
                webView.loadDataWithBaseURL(
                    null,
                    "<html><body><h1>App Loading Error</h1><p>Failed to load application. Please restart the app.</p></body></html>",
                    "text/html",
                    "UTF-8",
                    null
                );
                
                // Log error for debugging
                Log.e("WebViewError", "Failed to load URL: " + url + " | Error: " + error);
                
                // Optional: Show Toast notification
                Toast.makeText(MainActivity.this, 
                              "App loading failed. Please try again.", 
                              Toast.LENGTH_LONG).show();
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
    }

    @Override
    protected void onPause() {
        webView.onPause();
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
