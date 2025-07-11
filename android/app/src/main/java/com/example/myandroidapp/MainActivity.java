package com.example.myandroidapp;

import androidx.appcompat.app.AppCompatActivity;
import android.net.http.SslError;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.SslErrorHandler;

import android.os.Bundle;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 隐藏标题栏
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview); // Assuming your layout file has a WebView with id 'webview'
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true); // Enable JavaScript
        webSettings.setDomStorageEnabled(true); // Enable DOM storage
        webSettings.setAllowFileAccess(true); // Allow file access

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                Log.e(TAG, "WebView Error: " + errorCode + " - " + description + " for URL: " + failingUrl);
                // super.onReceivedError(view, errorCode, description, failingUrl);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                Log.e(TAG, "WebView SSL Error: " + error.getPrimaryError());
                // For development purposes, you might proceed:
                handler.proceed();
                // For production, you would likely want to cancel or show a warning: handler.cancel();
            }
        }); // Set a WebViewClient to handle redirects within the WebView

        // Load the local HTML file from the assets folder
        webView.loadUrl("file:///android_asset/index.html");
    }
}