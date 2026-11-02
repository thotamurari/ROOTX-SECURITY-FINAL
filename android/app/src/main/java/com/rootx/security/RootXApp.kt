package com.rootx.security

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class RootXApp : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            if (FirebaseApp.getApps(this).isEmpty()) {
                val options = FirebaseOptions.Builder()
                    .setApiKey("AIzaSyDfGp-JA31ECvluaJJmOCaXNPto3H3zgpo")
                    .setApplicationId("1:781934102806:android:d43beb81e381695be42837")
                    .setProjectId("e-learning-18dcf")
                    .setStorageBucket("e-learning-18dcf.firebasestorage.app")
                    .build()
                FirebaseApp.initializeApp(this, options)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

