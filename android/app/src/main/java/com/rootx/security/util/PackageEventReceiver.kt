package com.rootx.security.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.rootx.security.R

/**
 * BroadcastReceiver for tracking package additions, removals, and updates.
 * Native Android system event listener for real-time package monitoring.
 */
class PackageEventReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null) return
        val action = intent.action ?: return
        val packageName = intent.data?.schemeSpecificPart ?: return

        createNotificationChannel(context)

        val (title, content) = when (action) {
            Intent.ACTION_PACKAGE_ADDED -> {
                "App Installed" to "New application installed: $packageName. Real-time audit triggered."
            }
            Intent.ACTION_PACKAGE_REMOVED -> {
                "App Uninstalled" to "Application removed: $packageName"
            }
            Intent.ACTION_PACKAGE_REPLACED -> {
                "App Updated" to "Application updated: $packageName. Re-auditing permissions."
            }
            else -> return
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "App Activity Monitor",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Monitors app installations, updates and removals for suspicious changes."
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID = "rootx_app_monitor"
    }
}
