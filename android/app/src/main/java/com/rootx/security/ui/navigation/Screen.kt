package com.rootx.security.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.ui.graphics.vector.ImageVector

/** All navigation destinations in the app. */
sealed class Screen(val route: String, val title: String) {
    data object Login : Screen("login", "Login")
    data object Register : Screen("register", "Register")
    data object Dashboard : Screen("dashboard", "Home")
    data object AndroidSec : Screen("android-sec", "Android")
    data object ScanEngine : Screen("scan", "Scan")
    data object RootxAI : Screen("rootx-ai", "RootX-AI")
    data object News : Screen("news", "News")
    data object Settings : Screen("settings", "Settings")
    data object ScanHistory : Screen("scan-history", "History")
    data object ApkScanner : Screen("apk-scanner", "APK Scanner")
    data object Inbox : Screen("inbox", "Inbox")
    data object Community : Screen("community", "Community")
}

/** Bottom navigation tabs — mirrors the 5-tab MobileNav from the React app. */
data class BottomNavItem(
    val screen: Screen,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
)

val bottomNavItems = listOf(
    BottomNavItem(Screen.Dashboard, "Home", Icons.Filled.Dashboard, Icons.Outlined.Dashboard),
    BottomNavItem(Screen.AndroidSec, "Android", Icons.Filled.PhoneAndroid, Icons.Outlined.PhoneAndroid),
    BottomNavItem(Screen.ScanEngine, "Scan", Icons.Filled.QrCodeScanner, Icons.Outlined.QrCodeScanner),
    BottomNavItem(Screen.RootxAI, "RootX-AI", Icons.Filled.Psychology, Icons.Outlined.Psychology),
    BottomNavItem(Screen.Settings, "More", Icons.Filled.MoreHoriz, Icons.Outlined.MoreHoriz),
)
