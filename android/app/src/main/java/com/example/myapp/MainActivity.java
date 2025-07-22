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
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "MainActivity";

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        setupWebView();

        // 改用更可靠的 loadLocalIndex 方法加载
        loadLocalIndex();

        // 验证 assets 目录下的关键文件
        verifyAssets();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        // 允许 file:// 协议访问本地资源
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
    }

    private void loadLocalIndex() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        // 1. 读取 assets/www/index.html 到字符串
        String html;
        try (InputStream is = getAssets().open("www/index.html");
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int len;
            while ((len = is.read(buf)) > 0) {
                baos.write(buf, 0, len);
            }
            html = baos.toString("UTF-8");
        } catch (IOException e) {
            Log.e(TAG, "读取 index.html 失败", e);
            return;
        }

        // 2. 用 loadDataWithBaseURL 指定基准路径
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d(TAG, "页面加载完成: " + url);
            }
        });
        webView.loadDataWithBaseURL(
                "file:///android_asset/www/",  // 基准目录
                html,                          // HTML 源码
                "text/html",
                "utf-8",
                null
        );
    }

    private void verifyAssets() {
        // index.html
        checkAsset("www/index.html");
        // 注意 assets 目录是小写 assets
        checkAsset("www/assets/cards/ace_of_hearts.svg");
    }

    private void checkAsset(String assetPath) {
        try {
            getAssets().open(assetPath).close();
            Log.i("AssetCheck", "资源存在: " + assetPath);
        } catch (IOException e) {
            Log.e("AssetCheck", "资源缺失: " + assetPath, e);
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