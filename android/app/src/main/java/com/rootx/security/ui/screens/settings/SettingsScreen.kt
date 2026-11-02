package com.rootx.security.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.Divider
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.google.firebase.auth.FirebaseAuth
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    onNavigateToNews: () -> Unit,
    onNavigateToInbox: () -> Unit,
    onNavigateToCommunity: () -> Unit,
    onLogout: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val userEmail by viewModel.userEmail.collectAsState()
    val isUpdatingEmail by viewModel.isUpdatingEmail.collectAsState()
    val emailUpdateSuccess by viewModel.emailUpdateSuccess.collectAsState()
    val emailUpdateError by viewModel.emailUpdateError.collectAsState()

    var showEditEmailDialog by remember { mutableStateOf(false) }
    var editedEmailText by remember { mutableStateOf("") }

    val isDarkTheme by viewModel.isDarkTheme.collectAsState()
    val notifications by viewModel.notifications.collectAsState()
    val soundAlerts by viewModel.soundAlerts.collectAsState()
    val realTimeScanning by viewModel.realTimeScanning.collectAsState()
    val autoBlock by viewModel.autoBlock.collectAsState()

    if (showEditEmailDialog) {
        androidx.compose.material3.AlertDialog(
            onDismissRequest = { if (!isUpdatingEmail) showEditEmailDialog = false },
            title = {
                Text(
                    text = "Edit Account Email",
                    style = RootXTypography.titleMedium,
                    color = colors.textPrimary,
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Changes take effect immediately and sync with your Web app session.",
                        style = RootXTypography.bodySmall,
                        color = colors.textSecondary,
                    )
                    RootXField(
                        value = editedEmailText,
                        onValueChange = { editedEmailText = it },
                        placeholder = "user@domain.com",
                        leadingIcon = {
                            Icon(Icons.Outlined.Email, null, Modifier.size(18.dp), tint = colors.textTertiary)
                        }
                    )
                    if (emailUpdateError != null) {
                        Text(
                            text = emailUpdateError ?: "",
                            style = RootXTypography.caption,
                            color = colors.danger
                        )
                    }
                    if (emailUpdateSuccess != null) {
                        Text(
                            text = emailUpdateSuccess ?: "",
                            style = RootXTypography.caption,
                            color = colors.success
                        )
                    }
                }
            },
            confirmButton = {
                RootXButton(
                    text = if (isUpdatingEmail) "Saving..." else "Save",
                    size = ButtonSize.SMALL,
                    fullWidth = false,
                    onClick = {
                        viewModel.updateEmail(editedEmailText)
                    },
                    enabled = !isUpdatingEmail && editedEmailText.isNotBlank(),
                )
            },
            dismissButton = {
                RootXButton(
                    text = "Close",
                    variant = ButtonVariant.GHOST,
                    size = ButtonSize.SMALL,
                    fullWidth = false,
                    onClick = {
                        showEditEmailDialog = false
                        viewModel.clearEmailFeedback()
                    },
                    enabled = !isUpdatingEmail
                )
            },
            containerColor = colors.bgSurface,
            shape = RoundedCornerShape(16.dp),
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
            .padding(top = 16.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        PageHeader(
            title = "Settings",
            description = "Configure RootX for your security needs",
            icon = { Icon(Icons.Outlined.Settings, null, Modifier.size(24.dp), tint = colors.accent) },
        )

        // Account Profile Card
        RootXCard(padding = 16.dp) {
            Text("ACCOUNT", style = RootXTypography.caption, color = colors.textTertiary)
            Spacer(Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.accent),
                    contentAlignment = Alignment.Center,
                ) {
                    val initial = userEmail.firstOrNull()?.uppercase() ?: "R"
                    Text(initial, style = RootXTypography.headlineSmall, color = colors.accentForeground)
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        userEmail.ifEmpty { "Security Agent" },
                        style = RootXTypography.titleMedium,
                        color = colors.textPrimary,
                    )
                    Spacer(Modifier.height(2.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(colors.accentSoft)
                            .padding(horizontal = 8.dp, vertical = 2.dp),
                    ) {
                        Text("STANDARD PLAN", style = RootXTypography.micro, color = colors.accent)
                    }
                }

                // Edit Email Button
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(colors.bgSurface2)
                        .clickable {
                            editedEmailText = userEmail
                            viewModel.clearEmailFeedback()
                            showEditEmailDialog = true
                        }
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Edit Email",
                            tint = colors.accent,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            "Edit",
                            style = RootXTypography.caption.copy(fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold),
                            color = colors.accent
                        )
                    }
                }
            }
        }

        // Appearance
        RootXCard(padding = 16.dp) {
            Text("APPEARANCE", style = RootXTypography.caption, color = colors.textTertiary)
            Spacer(Modifier.height(8.dp))
            RootXSwitch(
                checked = isDarkTheme,
                onCheckedChange = { viewModel.setDarkTheme(it) },
                label = "Dark theme",
                description = "High contrast OLED-optimized dark UI",
            )
        }

        // Quick Navigation Hub
        RootXCard(padding = 16.dp) {
            Text("MORE MODULES", style = RootXTypography.caption, color = colors.textTertiary)
            Spacer(Modifier.height(8.dp))

            SettingsNavLink("Cyber Threat Intel", "Latest CVEs, malware & research", Icons.Outlined.Newspaper, onNavigateToNews)
            HorizontalDivider(color = colors.borderSubtle, modifier = Modifier.padding(vertical = 8.dp))
            SettingsNavLink("Security Inbox", "Alerts & threat advisories", Icons.Outlined.Notifications, onNavigateToInbox)
            HorizontalDivider(color = colors.borderSubtle, modifier = Modifier.padding(vertical = 8.dp))
            SettingsNavLink("Community Defense", "Crowdsourced intelligence", Icons.Outlined.Group, onNavigateToCommunity)
        }

        // Notifications
        RootXCard(padding = 16.dp) {
            Text("NOTIFICATIONS", style = RootXTypography.caption, color = colors.textTertiary)
            Spacer(Modifier.height(8.dp))

            RootXSwitch(
                checked = notifications,
                onCheckedChange = { viewModel.setNotifications(it) },
                label = "Push notifications",
                description = "Get alerted the moment a threat is detected",
            )
            HorizontalDivider(color = colors.borderSubtle)
            RootXSwitch(
                checked = soundAlerts,
                onCheckedChange = { viewModel.setSoundAlerts(it) },
                label = "Sound alerts",
                description = "Play an audible tone for critical threats",
            )
        }

        // Protection
        RootXCard(padding = 16.dp) {
            Text("PROTECTION", style = RootXTypography.caption, color = colors.textTertiary)
            Spacer(Modifier.height(8.dp))

            RootXSwitch(
                checked = realTimeScanning,
                onCheckedChange = { viewModel.setRealTimeScanning(it) },
                label = "Real-time scanning",
                description = "Continuously inspect device and background activity",
            )
            HorizontalDivider(color = colors.borderSubtle)
            RootXSwitch(
                checked = autoBlock,
                onCheckedChange = { viewModel.setAutoBlock(it) },
                label = "Auto-block",
                description = "Automatically terminate malicious socket streams",
            )
        }

        // Danger Zone
        RootXCard(padding = 16.dp) {
            Text("DANGER ZONE", style = RootXTypography.caption, color = colors.danger)
            Spacer(Modifier.height(14.dp))

            RootXButton(
                text = "Log out",
                onClick = onLogout,
                variant = ButtonVariant.SECONDARY,
                leadingIcon = { Icon(Icons.Filled.Logout, "Logout", Modifier.size(18.dp), tint = colors.danger) },
            )
        }
    }
}

@Composable
private fun SettingsNavLink(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
) {
    val colors = RootXTheme.colors
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(colors.bgSurface2),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, title, Modifier.size(18.dp), tint = colors.accent)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = RootXTypography.titleSmall, color = colors.textPrimary)
            Text(subtitle, style = RootXTypography.bodySmall, color = colors.textTertiary)
        }
        Icon(Icons.Filled.ChevronRight, "Navigate", Modifier.size(18.dp), tint = colors.textTertiary)
    }
}
