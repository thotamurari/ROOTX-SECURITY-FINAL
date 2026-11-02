package com.rootx.security.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.rootx.security.ui.screens.androidsec.AndroidSecScreen
import com.rootx.security.ui.screens.community.CommunityScreen
import com.rootx.security.ui.screens.dashboard.DashboardScreen
import com.rootx.security.ui.screens.inbox.InboxScreen
import com.rootx.security.ui.screens.login.LoginScreen
import com.rootx.security.ui.screens.login.RegisterScreen
import com.rootx.security.ui.screens.news.NewsScreen
import com.rootx.security.ui.screens.rootxai.RootxAIScreen
import com.rootx.security.ui.screens.scan.ApkScannerScreen
import com.rootx.security.ui.screens.scan.ScanEngineScreen
import com.rootx.security.ui.screens.scan.ScanHistoryScreen
import com.rootx.security.ui.screens.settings.SettingsScreen
import com.rootx.security.viewmodel.AuthViewModel

@Composable
fun RootXNavGraph(
    navController: NavHostController,
    authViewModel: AuthViewModel,
    startDestination: String,
) {
    val animDuration = 250

    NavHost(
        navController = navController,
        startDestination = startDestination,
        enterTransition = { fadeIn(tween(animDuration)) },
        exitTransition = { fadeOut(tween(animDuration)) },
    ) {
        // ── Auth ──
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                authViewModel = authViewModel,
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onNavigateToLogin = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                authViewModel = authViewModel,
            )
        }

        // ── Main tabs ──
        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToScan = { navController.navigate(Screen.ScanEngine.route) },
                onNavigateToRootxAI = { navController.navigate(Screen.RootxAI.route) },
                onNavigateToAndroidSec = { navController.navigate(Screen.AndroidSec.route) },
                authViewModel = authViewModel,
            )
        }

        composable(Screen.AndroidSec.route) {
            AndroidSecScreen()
        }

        composable(Screen.ScanEngine.route) {
            ScanEngineScreen(
                onNavigateToHistory = { navController.navigate(Screen.ScanHistory.route) },
                onNavigateToApkScanner = { navController.navigate(Screen.ApkScanner.route) },
            )
        }

        composable(Screen.RootxAI.route) {
            RootxAIScreen()
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateToNews = { navController.navigate(Screen.News.route) },
                onNavigateToInbox = { navController.navigate(Screen.Inbox.route) },
                onNavigateToCommunity = { navController.navigate(Screen.Community.route) },
                onLogout = {
                    authViewModel.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                },
            )
        }

        // ── Sub-pages ──
        composable(Screen.ScanHistory.route) {
            ScanHistoryScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.ApkScanner.route) {
            ApkScannerScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.News.route) {
            NewsScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.Inbox.route) {
            InboxScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.Community.route) {
            CommunityScreen(onBack = { navController.popBackStack() })
        }
    }
}
