package com.example.myapp;

import androidx.multidex.MultiDexApplication;

/**
 * A custom Application class to ensure multidex is initialized correctly.
 */
public class MyApplication extends MultiDexApplication {
    @Override
    public void onCreate() {
        super.onCreate();
    }
}
