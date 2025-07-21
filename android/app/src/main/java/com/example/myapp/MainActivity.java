package com.example.myapp;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings; // 导入 WebSettings
import android.webkit.WebChromeClient; // 导入 WebChromeClient

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        myWebView = findViewById(R.id.webview);

        // 获取 WebSettings 对象
        WebSettings webSettings = myWebView.getSettings();

        // 启用 JavaScript
        webSettings.setJavaScriptEnabled(true);

        // 启用 DOM Storage
        webSettings.setDomStorageEnabled(true);

        // 允许通过 file:// 协议访问文件
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);

        // 设置 WebChromeClient 用于处理JS的对话框、网站图标、进度条等
        myWebView.setWebChromeClient(new WebChromeClient());
        // 保证跳转还在 WebView 内
        myWebView.setWebViewClient(new WebViewClient());

        // 添加 JS 接口
        myWebView.addJavascriptInterface(new WebAppInterface(this), "Android");
        
        // 启用 WebView 调试
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        // 加载本地 assets 目录下的 index.html
        myWebView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            super.onBackPressed();
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
