package com.rootx.security.ui.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.components.RootXButton
import com.rootx.security.ui.components.ButtonVariant
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

data class DrawerItem(
    val screen: Screen,
    val label: String,
    val icon: ImageVector,
    val badge: String? = null,
)

val drawerItems = listOf(
    DrawerItem(Screen.ScanHistory, "Scan History", Icons.Outlined.History),
    DrawerItem(Screen.ApkScanner, "APK Scanner", Icons.Outlined.Shield),
    DrawerItem(Screen.Inbox, "Tactical Inbox", Icons.Outlined.Message),
    DrawerItem(Screen.News, "Cyber Intel", Icons.Outlined.Newspaper),
    DrawerItem(Screen.Community, "RootX Community", Icons.Outlined.Group, badge = "WhatsApp"),
    DrawerItem(Screen.Settings, "Settings", Icons.Outlined.Settings),
)

/**
 * BottomNavBar — 1:1 replica of the React MobileNav component.
 * 4 primary tabs + More drawer button with sliding Security Ops bottom sheet.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomNavBar(
    currentRoute: String?,
    onTabSelected: (Screen) -> Unit,
    onLogout: (() -> Unit)? = null,
    onToggleTheme: (() -> Unit)? = null,
    isDarkTheme: Boolean = true,
    showExternalDrawer: Boolean = false,
    onDismissExternalDrawer: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val colors = RootXTheme.colors
    var showMoreDrawer by remember { mutableStateOf(false) }
    val isDrawerOpen = showMoreDrawer || showExternalDrawer

    // Bottom Navigation Bar
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.bgSurface)
            .border(width = 1.dp, color = colors.borderDefault)
            .height(64.dp)
            .navigationBarsPadding(),
        horizontalArrangement = Arrangement.SpaceAround,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val primaryTabs = bottomNavItems.take(4)

        primaryTabs.forEach { item ->
            val isActive = currentRoute == item.screen.route
            val iconColor by animateColorAsState(
                if (isActive) colors.accent else colors.textTertiary,
                tween(200), label = "iconColor"
            )

            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                    ) { onTabSelected(item.screen) },
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .then(
                            if (isActive) Modifier
                                .clip(RoundedCornerShape(100.dp))
                                .background(colors.accentSoft)
                                .padding(horizontal = 14.dp, vertical = 4.dp)
                            else Modifier.padding(horizontal = 14.dp, vertical = 4.dp)
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = if (isActive) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label,
                        tint = iconColor,
                        modifier = Modifier.size(20.dp),
                    )
                }

                Spacer(Modifier.height(2.dp))

                Text(
                    text = item.label,
                    style = RootXTypography.micro.copy(
                        fontSize = 10.sp,
                        fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
                    ),
                    color = iconColor,
                )
            }
        }

        // 5th Tab: More button (opens drawer)
        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight()
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                ) { showMoreDrawer = true },
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Box(
                modifier = Modifier
                    .then(
                        if (isDrawerOpen) Modifier
                            .clip(RoundedCornerShape(100.dp))
                            .background(colors.accentSoft)
                            .padding(horizontal = 14.dp, vertical = 4.dp)
                        else Modifier.padding(horizontal = 14.dp, vertical = 4.dp)
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.MoreHoriz,
                    contentDescription = "More",
                    tint = if (isDrawerOpen) colors.accent else colors.textTertiary,
                    modifier = Modifier.size(20.dp),
                )
            }

            Spacer(Modifier.height(2.dp))

            Text(
                text = "More",
                style = RootXTypography.micro.copy(
                    fontSize = 10.sp,
                    fontWeight = if (isDrawerOpen) FontWeight.Bold else FontWeight.Normal
                ),
                color = if (isDrawerOpen) colors.accent else colors.textTertiary,
            )
        }
    }

    // Security Ops More Drawer (Modal Bottom Sheet)
    if (isDrawerOpen) {
        ModalBottomSheet(
            onDismissRequest = {
                showMoreDrawer = false
                onDismissExternalDrawer?.invoke()
            },
            containerColor = colors.bgSurface,
            scrimColor = colors.bgOverlay,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                BottomSheetDefaults.DragHandle(
                    color = colors.borderStrong
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 32.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "SECURITY OPS",
                        style = RootXTypography.labelLarge.copy(
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        ),
                        color = colors.textPrimary,
                    )
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(colors.bgSurface2)
                            .clickable {
                                showMoreDrawer = false
                                onDismissExternalDrawer?.invoke()
                            },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.Close, "Close", Modifier.size(16.dp), tint = colors.textSecondary)
                    }
                }

                Spacer(Modifier.height(8.dp))

                // Drawer Items
                drawerItems.forEach { item ->
                    val isActive = currentRoute == item.screen.route
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isActive) colors.accent else Color.Transparent)
                            .clickable {
                                showMoreDrawer = false
                                onDismissExternalDrawer?.invoke()
                                onTabSelected(item.screen)
                            }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.label,
                            tint = if (isActive) colors.accentForeground else colors.textSecondary,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.width(14.dp))
                        Text(
                            text = item.label,
                            style = RootXTypography.bodyMedium.copy(
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = if (isActive) colors.accentForeground else colors.textPrimary,
                            modifier = Modifier.weight(1f)
                        )
                        if (item.badge != null) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(100.dp))
                                    .background(colors.successSoft)
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = item.badge,
                                    style = RootXTypography.micro.copy(fontSize = 10.sp, fontWeight = FontWeight.Bold),
                                    color = colors.success,
                                )
                            }
                        }
                    }
                }

                Spacer(Modifier.height(12.dp))

                // Theme Toggle Row
                if (onToggleTheme != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(colors.bgSurface2)
                            .clickable(onClick = onToggleTheme)
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (isDarkTheme) Icons.Outlined.DarkMode else Icons.Outlined.LightMode,
                                contentDescription = "Theme",
                                tint = colors.textSecondary,
                                modifier = Modifier.size(18.dp),
                            )
                            Spacer(Modifier.width(14.dp))
                            Text(
                                text = if (isDarkTheme) "Dark Mode" else "Light Mode",
                                style = RootXTypography.bodyMedium.copy(fontSize = 14.sp),
                                color = colors.textPrimary,
                            )
                        }
                        Switch(
                            checked = isDarkTheme,
                            onCheckedChange = { onToggleTheme() },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = colors.accent,
                                checkedTrackColor = colors.accentSoftStrong,
                                uncheckedThumbColor = colors.textTertiary,
                                uncheckedTrackColor = colors.bgSurface3,
                            )
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                }

                // Logout Button
                if (onLogout != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(colors.dangerSoft)
                            .clickable {
                                showMoreDrawer = false
                                onLogout()
                            }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Logout",
                            tint = colors.danger,
                            modifier = Modifier.size(18.dp),
                        )
                        Spacer(Modifier.width(14.dp))
                        Text(
                            text = "Logout",
                            style = RootXTypography.bodyMedium.copy(
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = colors.danger
                            ),
                        )
                    }
                }
            }
        }
    }
}
