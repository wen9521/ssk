package com.example.myandroidapp;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebChromeClient; // 引入 WebChromeClient
import android.util.Log; // 引入 Log

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        WebView myWebView = (WebView) findViewById(R.id.webview);
        
        // --- 开启 WebView 调试的关键设置 ---
        // 允许在Chrome桌面版上进行远程调试
        WebView.setWebContentsDebuggingEnabled(true);

        WebSettings webSettings = myWebView.getSettings();
        // 必须开启 JavaScript
        webSettings.setJavaScriptEnabled(true);
        // 允许 DOM 存储，对于现代Web应用是必需的
        webSettings.setDomStorageEnabled(true);
        // 允许文件访问
        webSettings.setAllowFileAccess(true);
        // 允许内容访问
        webSettings.setAllowContentAccess(true);

        myWebView.setWebViewClient(new WebViewClient());

        // --- 添加 WebChromeClient 以捕获网页的控制台日志 ---
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onConsoleMessage(String message, int lineNumber, String sourceID) {
                // 将网页的 console 信息打印到 Android 的 Logcat 中
                // 我们给它一个独特的标签 "WebAppLogs" 以便过滤
                Log.d("WebAppLogs", message + " -- from " + sourceID + ":" + lineNumber);
            }
        });

        // 加载您的网站
        myWebView.loadUrl("https://gewe.dpdns.org");
    }
}
