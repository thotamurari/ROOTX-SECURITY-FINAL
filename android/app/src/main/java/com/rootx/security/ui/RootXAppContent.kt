package com.rootx.security.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.rootx.security.ui.navigation.BottomNavBar
import com.rootx.security.ui.navigation.RootXNavGraph
import com.rootx.security.ui.navigation.Screen
import com.rootx.security.ui.navigation.bottomNavItems
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.AuthViewModel

/**
 * Root composable — hosts the Scaffold with TopBar, BottomNavBar + NavHost.
 * 1:1 match with React AppShell.tsx and MobileNav.tsx.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun RootXAppContent(authViewModel: AuthViewModel) {
    val navController = rememberNavController()
    val colors = RootXTheme.colors
    val isAuthenticated by authViewModel.isAuthenticated.collectAsState()
    val isDarkTheme by authViewModel.isDarkTheme.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val startDestination = if (isAuthenticated) Screen.Dashboard.route else Screen.Login.route

    // Show top and bottom nav on authenticated main screens
    val mainTabRoutes = bottomNavItems.map { it.screen.route }
    val showBars = isAuthenticated && (currentRoute in mainTabRoutes || currentRoute == Screen.Dashboard.route)

    var showDrawerFromTopBar by remember { mutableStateOf(false) }
    val userProfile by authViewModel.user.collectAsState()

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = RootXTheme.colors.bgBase,
            topBar = {
                if (showBars) {
                    // Mobile Top Bar matching AppShell.tsx
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(colors.bgSurface)
                            .border(width = 1.dp, color = colors.borderDefault)
                            .statusBarsPadding()
                            .height(56.dp)
                            .padding(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // Left: Hamburger menu
                        IconButton(
                            onClick = { showDrawerFromTopBar = true },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Menu,
                                contentDescription = "Menu",
                                tint = colors.textSecondary,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        // Center: Shield Logo + ROOTX-SECURITY
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable {
                                navController.navigate(Screen.Dashboard.route) {
                                    popUpTo(Screen.Dashboard.route) { inclusive = false }
                                }
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(colors.accent),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Shield,
                                    contentDescription = "RootX",
                                    tint = colors.accentForeground,
                                    modifier = Modifier.size(14.dp)
                                )
                            }
                            Spacer(Modifier.width(8.dp))
                            Row {
                                Text(
                                    text = "ROOTX-",
                                    style = RootXTypography.titleMedium.copy(
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 0.5.sp
                                    ),
                                    color = colors.textPrimary,
                                )
                                Text(
                                    text = "SECURITY",
                                    style = RootXTypography.titleMedium.copy(
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 0.5.sp
                                    ),
                                    color = colors.accent,
                                )
                            }
                        }

                        // Right: Notification Bell with unread dot
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .clickable {
                                    navController.navigate(Screen.Inbox.route)
                                },
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Notifications,
                                contentDescription = "Inbox",
                                tint = if (currentRoute == Screen.Inbox.route) colors.accent else colors.textTertiary,
                                modifier = Modifier.size(22.dp)
                            )
                            // Red notification indicator
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .align(Alignment.TopEnd)
                                    .offset(x = (-4).dp, y = 4.dp)
                                    .clip(CircleShape)
                                    .background(colors.danger)
                                    .border(1.5.dp, colors.bgSurface, CircleShape)
                            )
                        }
                    }
                }
            },
            bottomBar = {
                if (showBars && !WindowInsets.isImeVisible) {
                    BottomNavBar(
                        currentRoute = currentRoute,
                        onTabSelected = { screen ->
                            navController.navigate(screen.route) {
                                launchSingleTop = true
                            }
                        },
                        onLogout = {
                            authViewModel.logout()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        },
                        onToggleTheme = { authViewModel.toggleTheme() },
                        isDarkTheme = isDarkTheme,
                    )
                }
            },
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                RootXNavGraph(
                    navController = navController,
                    authViewModel = authViewModel,
                    startDestination = startDestination,
                )
            }
        }

        // Sidebar Left Sliding Drawer
        com.rootx.security.ui.navigation.SidebarDrawer(
            isOpen = showDrawerFromTopBar,
            onClose = { showDrawerFromTopBar = false },
            currentRoute = currentRoute,
            onNavigate = { screen ->
                navController.navigate(screen.route) {
                    launchSingleTop = true
                }
            },
            userProfile = userProfile,
            onLogout = {
                authViewModel.logout()
                navController.navigate(Screen.Login.route) {
                    popUpTo(0) { inclusive = true }
                }
            },
            onToggleTheme = { authViewModel.toggleTheme() },
            isDarkTheme = isDarkTheme,
        )
    }
}
