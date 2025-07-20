package com.example.myapp;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView myWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        myWebView = findViewById(R.id.webview);
        MyApplication.initializeWebView(myWebView); // 使用 Application 类中的方法来初始化

        // 添加 JavaScript 接口，命名为 "Android"
        myWebView.addJavascriptInterface(new WebAppInterface(this), "Android");
        
        myWebView.loadUrl("https://gewe.dpdns.org");
    }

    @Override
    public void onBackPressed() {
        if (myWebView.canGoBack()) {
            myWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    /**
     * WebAppInterface 类允许 JavaScript 控制 Android 原生功能
     */
    public class WebAppInterface {
        Activity activity;

        // Instantiate the interface and set the context
        WebAppInterface(Activity activity) {
            this.activity = activity;
        }

        // setOrientationToLandscape 方法
        @JavascriptInterface
        public void setOrientationToLandscape() {
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
        }

        /** 从 JavaScript 调用，将屏幕设置为竖屏 */
        @JavascriptInterface
        public void setOrientationToPortrait() {
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
    }
}
