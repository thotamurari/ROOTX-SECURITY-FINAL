package com.rootx.security.ui.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.R
import com.rootx.security.data.model.UserProfile
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

data class SidebarNavItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector,
    val badge: String? = null,
    val isExternal: Boolean = false,
)

val primaryNavItems = listOf(
    SidebarNavItem(Screen.Dashboard, "Dashboard", Icons.Outlined.GridView),
    SidebarNavItem(Screen.AndroidSec, "AndroidSEC", Icons.Outlined.Smartphone),
    SidebarNavItem(Screen.ScanEngine, "Scan Engine", Icons.Outlined.QrCodeScanner),
    SidebarNavItem(Screen.ScanHistory, "Scan History", Icons.Outlined.History),
    SidebarNavItem(Screen.RootxAI, "RootX-AI", Icons.Outlined.Psychology),
    SidebarNavItem(Screen.ApkScanner, "APK Scanner", Icons.Outlined.Shield),
    SidebarNavItem(Screen.Settings, "Settings", Icons.Outlined.Settings),
)

val opsNavItems = listOf(
    SidebarNavItem(Screen.Inbox, "Inbox", Icons.Outlined.Message, badge = "7"),
    SidebarNavItem(Screen.News, "News", Icons.Outlined.Newspaper, badge = "12"),
    SidebarNavItem(Screen.Community, "Community", Icons.Outlined.Group, badge = "New"),
)

/**
 * 1:1 match with React Sidebar.tsx component.
 * Supports sliding animated left drawer with operations badges, branding avatar, and user node profile.
 */
@Composable
fun SidebarDrawer(
    isOpen: Boolean,
    onClose: () -> Unit,
    currentRoute: String?,
    onNavigate: (Screen) -> Unit,
    userProfile: UserProfile?,
    onLogout: () -> Unit,
    onToggleTheme: () -> Unit,
    isDarkTheme: Boolean,
) {
    val colors = RootXTheme.colors

    if (isOpen) {
        androidx.activity.compose.BackHandler { onClose() }

        Box(modifier = Modifier.fillMaxSize()) {
            // Scrim backdrop
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.6f))
                    .clickable { onClose() }
            )

            // Sliding drawer
            Column(
                modifier = Modifier
                    .width(290.dp)
                    .fillMaxHeight()
                    .background(colors.bgSurface)
                    .border(width = 1.dp, color = colors.borderDefault)
                    .statusBarsPadding()
                    .navigationBarsPadding()
                    .clickable(enabled = false) {}, // Prevent clicking through
            ) {
                // ── 1. Header with Avatar & Logo ──
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 18.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(colors.accentSoft)
                            .border(1.dp, colors.accent.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.anime_guardian),
                            contentDescription = "Avatar",
                            modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp))
                        )
                    }
                    Spacer(Modifier.width(10.dp))
                    Row {
                        Text(
                            text = "ROOTX-",
                            style = RootXTypography.titleMedium.copy(
                                fontSize = 14.5.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            ),
                            color = colors.textPrimary,
                        )
                        Text(
                            text = "SECURITY",
                            style = RootXTypography.titleMedium.copy(
                                fontSize = 14.5.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp
                            ),
                            color = colors.accent,
                        )
                    }
                }

                Divider(color = colors.borderDefault, thickness = 1.dp)

                // ── 2. Primary Navigation Links ──
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 12.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    primaryNavItems.forEach { item ->
                        val isActive = currentRoute == item.screen.route
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isActive) colors.accentSoft else Color.Transparent)
                                .clickable {
                                    onClose()
                                    onNavigate(item.screen)
                                }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (isActive) {
                                Box(
                                    modifier = Modifier
                                        .width(3.dp)
                                        .height(18.dp)
                                        .clip(RoundedCornerShape(2.dp))
                                        .background(colors.accent)
                                )
                                Spacer(Modifier.width(8.dp))
                            }
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label,
                                tint = if (isActive) colors.accent else colors.textSecondary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = item.label,
                                style = RootXTypography.bodyMedium.copy(
                                    fontSize = 13.sp,
                                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
                                ),
                                color = if (isActive) colors.accent else colors.textSecondary,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    // ── 3. OPERATIONS Section ──
                    Text(
                        text = "OPERATIONS",
                        style = RootXTypography.micro.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.2.sp
                        ),
                        color = colors.textTertiary,
                        modifier = Modifier.padding(start = 12.dp, top = 4.dp, bottom = 6.dp)
                    )

                    opsNavItems.forEach { item ->
                        val isActive = currentRoute == item.screen.route
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (isActive) colors.accentSoft else Color.Transparent)
                                .clickable {
                                    onClose()
                                    onNavigate(item.screen)
                                }
                                .padding(horizontal = 12.dp, vertical = 9.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label,
                                tint = if (isActive) colors.accent else colors.textSecondary,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                text = item.label,
                                style = RootXTypography.bodyMedium.copy(
                                    fontSize = 12.5.sp,
                                    fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium
                                ),
                                color = if (isActive) colors.accent else colors.textSecondary,
                                modifier = Modifier.weight(1f)
                            )
                            if (item.badge != null) {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(100.dp))
                                        .background(colors.danger)
                                        .padding(horizontal = 6.dp, vertical = 2.dp),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        text = item.badge,
                                        style = RootXTypography.micro.copy(
                                            fontSize = 9.5.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = Color.White,
                                    )
                                }
                            }
                        }
                    }
                }

                // ── 4. Bottom Profile Section ──
                Divider(color = colors.borderDefault, thickness = 1.dp)

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(colors.bgSurface2.copy(alpha = 0.5f))
                        .padding(12.dp),
                ) {
                    // Profile Box
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(colors.bgSurface)
                            .border(1.dp, colors.borderDefault, RoundedCornerShape(12.dp))
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        val email = userProfile?.email ?: "saveetha76652@gmail.com"
                        val initial = email.firstOrNull()?.uppercaseChar()?.toString() ?: "S"

                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(colors.accent),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = initial,
                                style = RootXTypography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = colors.accentForeground,
                            )
                        }

                        Spacer(Modifier.width(10.dp))

                        Column(Modifier.weight(1f)) {
                            Text(
                                text = email.substringBefore("@"),
                                style = RootXTypography.labelMedium.copy(
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = colors.textPrimary,
                                maxLines = 1,
                            )
                            Text(
                                text = "SECURITY NODE #042",
                                style = RootXTypography.micro.copy(fontSize = 9.sp),
                                color = colors.textTertiary,
                            )
                        }

                        // Theme toggle moon icon
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.bgSurface2)
                                .clickable { onToggleTheme() },
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = if (isDarkTheme) Icons.Outlined.DarkMode else Icons.Outlined.LightMode,
                                contentDescription = "Theme",
                                tint = colors.textSecondary,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }

                    Spacer(Modifier.height(8.dp))

                    // Logout Button
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .clickable {
                                onClose()
                                onLogout()
                            }
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Logout,
                            contentDescription = "Log out",
                            tint = colors.danger,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(10.dp))
                        Text(
                            text = "Log out",
                            style = RootXTypography.bodySmall.copy(
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = colors.danger,
                        )
                    }
                }
            }
        }
    }
}
