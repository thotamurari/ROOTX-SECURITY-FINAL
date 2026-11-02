package com.rootx.security.util

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import com.rootx.security.data.model.InstalledApp

data class AppRiskEvaluation(
    val riskLevel: String, // "Safe", "Caution", "High Risk", "Needs Review"
    val riskScore: Int, // 0 - 100
    val explanation: String,
    val isVerifiedStore: Boolean,
    val installerName: String,
    val flaggedPermissions: List<String>,
)

object AppRiskClassifier {

    private val VERIFIED_STORE_INSTALLERS = setOf(
        "com.android.vending",              // Google Play Store
        "com.google.android.packageinstaller",
        "com.vivo.appstore",               // Vivo App Store (V-Appstore)
        "com.bbk.appstore",
        "com.sec.android.app.samsungapps", // Samsung Galaxy Store
        "com.amazon.venezia",              // Amazon Appstore
        "com.xiaomi.mipicks",              // Xiaomi GetApps
        "com.xiaomi.market",
        "com.oppo.market",                 // Oppo Market
        "com.heytap.market",
        "com.realme.store",
        "com.huawei.appmarket",            // Huawei AppGallery
    )

    // Critical permissions that grant high-level execution or system control
    private val HIGH_IMPACT_PERMISSIONS = setOf(
        "android.permission.BIND_ACCESSIBILITY_SERVICE",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.BIND_DEVICE_ADMIN",
        "android.permission.REQUEST_INSTALL_PACKAGES",
    )

    // Communication & sensitive credential interception permissions
    private val SENSITIVE_INTERCEPT_PERMISSIONS = setOf(
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.SEND_SMS",
        "android.permission.READ_CALL_LOG",
        "android.permission.WRITE_CALL_LOG",
        "android.permission.PROCESS_OUTGOING_CALLS",
    )

    // Standard high-privilege hardware permissions (common in trusted media/social/commerce apps)
    private val HARDWARE_CAPABILITY_PERMISSIONS = setOf(
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS",
        "android.permission.BODY_SENSORS",
        "android.permission.POST_NOTIFICATIONS",
    )

    /**
     * Resolves the installer package name on Android (API 30+ uses InstallSourceInfo).
     */
    fun getInstallerPackageName(pm: PackageManager, packageName: String): String? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val info = pm.getInstallSourceInfo(packageName)
                info.installingPackageName ?: info.initiatingPackageName
            } else {
                @Suppress("DEPRECATION")
                pm.getInstallerPackageName(packageName)
            }
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Contextual risk assessment of an installed application.
     * Evaluates installation source, sensitive combinations, and necessity rather than raw count.
     */
    fun evaluate(
        app: InstalledApp,
        installerPackage: String? = null,
        isDebuggable: Boolean = false,
    ): AppRiskEvaluation {
        val permissions = app.permissions
        val isSystem = app.isSystemApp
        val installer = installerPackage ?: app.installer
        val isVerifiedStore = installer in VERIFIED_STORE_INSTALLERS || isSystem

        val installerFriendlyName = when {
            isSystem -> "System ROM (Pre-installed)"
            installer == "com.android.vending" -> "Google Play Store"
            installer == "com.vivo.appstore" || installer == "com.bbk.appstore" -> "Vivo V-Appstore"
            installer == "com.sec.android.app.samsungapps" -> "Samsung Galaxy Store"
            installer == "com.amazon.venezia" -> "Amazon Appstore"
            installer == "com.xiaomi.mipicks" || installer == "com.xiaomi.market" -> "Xiaomi GetApps"
            installer != null -> installer
            else -> "Sideloaded / Unverified Source"
        }

        // Check for specific dangerous permission patterns
        val hasOverlay = "android.permission.SYSTEM_ALERT_WINDOW" in permissions
        val hasAccessibility = "android.permission.BIND_ACCESSIBILITY_SERVICE" in permissions
        val hasInstallPackages = "android.permission.REQUEST_INSTALL_PACKAGES" in permissions
        val hasSms = permissions.any { it in SENSITIVE_INTERCEPT_PERMISSIONS }
        val hasBoot = "android.permission.RECEIVE_BOOT_COMPLETED" in permissions

        val flagged = permissions.filter { it in HIGH_IMPACT_PERMISSIONS || it in SENSITIVE_INTERCEPT_PERMISSIONS }

        // ── 1. High Risk Indicators ──
        // A: Overlay + Accessibility (Classic credential injection / banking trojan)
        if (hasOverlay && hasAccessibility) {
            return AppRiskEvaluation(
                riskLevel = "High Risk",
                riskScore = 88,
                explanation = "Requests both Screen Overlay and Accessibility Service — elevated risk of credential interception.",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // B: Sideloaded + Install Packages (Dropper pattern)
        if (!isVerifiedStore && hasInstallPackages && (hasBoot || hasSms)) {
            return AppRiskEvaluation(
                riskLevel = "High Risk",
                riskScore = 82,
                explanation = "Sideloaded application with Package Installer and background execution privileges (Dropper pattern).",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // C: Sideloaded + SMS read/receive + boot (OTP harvester pattern)
        if (!isVerifiedStore && hasSms && hasBoot) {
            return AppRiskEvaluation(
                riskLevel = "High Risk",
                riskScore = 78,
                explanation = "Sideloaded application with SMS interception and boot startup privileges.",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // D: Debuggable build outside of system apps
        if (!isSystem && isDebuggable && !isVerifiedStore) {
            return AppRiskEvaluation(
                riskLevel = "High Risk",
                riskScore = 75,
                explanation = "Non-production debuggable APK installed from an untrusted source.",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // ── 2. Caution Indicators ──
        // A: Verified store app with sensitive communication access (e.g. Truecaller reading SMS/Call log)
        if (isVerifiedStore && hasSms) {
            return AppRiskEvaluation(
                riskLevel = "Caution",
                riskScore = 32,
                explanation = "Verified via $installerFriendlyName. Accesses SMS/call history. Verify permission necessity.",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // B: Verified store app with screen overlay (e.g. Messenger chat heads or Truecaller caller ID)
        if (isVerifiedStore && hasOverlay) {
            return AppRiskEvaluation(
                riskLevel = "Caution",
                riskScore = 28,
                explanation = "Verified via $installerFriendlyName. Uses 'Draw over other apps' (e.g. floating window).",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // C: Sideloaded app with standard permissions (No malicious combo, but not store-verified)
        if (!isVerifiedStore && permissions.isNotEmpty()) {
            return AppRiskEvaluation(
                riskLevel = "Caution",
                riskScore = 35,
                explanation = "Installed outside official stores ($installerFriendlyName). Exercise caution with updates.",
                isVerifiedStore = isVerifiedStore,
                installerName = installerFriendlyName,
                flaggedPermissions = flagged,
            )
        }

        // ── 3. Unknown / Needs Review ──
        if (installer == null && !isSystem && permissions.isEmpty()) {
            return AppRiskEvaluation(
                riskLevel = "Needs Review",
                riskScore = 20,
                explanation = "Installation origin unavailable. Security telemetry needs manual verification.",
                isVerifiedStore = false,
                installerName = "Unknown origin",
                flaggedPermissions = emptyList(),
            )
        }

        // ── 4. Safe ──
        // Verified Play Store / Vendor Store / Pre-installed System application
        val storeScore = if (isSystem) 5 else 12
        return AppRiskEvaluation(
            riskLevel = "Safe",
            riskScore = storeScore,
            explanation = "Verified via $installerFriendlyName. Permissions conform to normal application operations.",
            isVerifiedStore = isVerifiedStore,
            installerName = installerFriendlyName,
            flaggedPermissions = emptyList(),
        )
    }
}
