package com.example.myapp;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

import java.io.IOException;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        setupWebView();

        // 使用构建配置中定义的路径加载本地内容
        final String baseUrl = BuildConfig.WEB_ASSET_BASE;
        String url = baseUrl + "index.html";
        webView.loadUrl(url);

        // 调试日志
        Log.d("MainActivity", "Loading URL: " + url);
        verifyAssets();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();

        // 关键设置
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        // 启用远程调试
        WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d("WebView", "Page loading finished: " + url);
            }
        });

        webView.setWebChromeClient(new WebChromeClient());
        
        // 添加 JS 接口
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private void verifyAssets() {
        checkAsset("www/index.html");
        checkAsset("www/Assets/cards/ace_of_hearts.svg");
    }

    private void checkAsset(String assetPath) {
        try {
            getAssets().open(assetPath).close();
            Log.i("AssetCheck", "资源存在: " + assetPath);
        } catch (IOException e) {
            Log.e("AssetCheck", "资源缺失: " + assetPath, e);
        }
    }
    
    public class WebAppInterface {
        Activity activity;

        WebAppInterface(Activity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void setOrientationToLandscape() {
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        }

        @JavascriptInterface
        public void setOrientationToPortrait() {
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
    }
}
