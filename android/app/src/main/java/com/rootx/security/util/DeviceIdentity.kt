package com.rootx.security.util

import android.content.Context
import android.os.Build
import android.provider.Settings

/** Stable per-install device identity, used for the Active Devices / remote
 *  logout feature (see safeopen-backend's device_sessions table). */
object DeviceIdentity {
    fun getId(context: Context): String =
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
            ?: "android-unknown"

    fun getName(): String {
        val manufacturer = Build.MANUFACTURER?.takeIf { it.isNotBlank() } ?: ""
        val model = Build.MODEL?.takeIf { it.isNotBlank() } ?: "Android device"
        return if (model.startsWith(manufacturer, ignoreCase = true)) model else "$manufacturer $model".trim()
    }
}
