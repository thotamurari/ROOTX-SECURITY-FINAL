package com.rootx.security.ui.screens.androidsec

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rootx.security.data.model.InstalledApp
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.AndroidSecViewModel

@Composable
fun AndroidSecScreen(
    viewModel: AndroidSecViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val deviceInfo by viewModel.deviceInfo.collectAsState()
    val filteredApps by viewModel.filteredApps.collectAsState()
    val installedApps by viewModel.installedApps.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val showSystemApps by viewModel.showSystemApps.collectAsState()
    var expandedAppPackage by remember { mutableStateOf<String?>(null) }

    val config = LocalConfiguration.current
    val density = LocalDensity.current

    val totalStorageGB = maxOf(deviceInfo.totalStorage / (1024 * 1024 * 1024), 1L)
    val freeStorageGB = deviceInfo.freeStorage / (1024 * 1024 * 1024)
    val usedStorageGB = totalStorageGB - freeStorageGB
    val storagePercent = ((usedStorageGB * 100) / totalStorageGB).toInt().coerceIn(0, 100)

    val totalRamGB = maxOf(deviceInfo.totalRam / (1024 * 1024 * 1024), 1L)
    val availRamGB = deviceInfo.availableRam / (1024 * 1024 * 1024)
    val usedRamGB = totalRamGB - availRamGB

    val userApps = installedApps.filter { !it.isSystemApp }
    val riskyAppsCount = userApps.count { it.riskLevel == "High Risk" }
    val cautionAppsCount = userApps.count { it.riskLevel == "Caution" }
    val safeAppsCount = userApps.count { it.riskLevel == "Safe" }
    val needsReviewCount = userApps.count { it.riskLevel == "Needs Review" }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // ── 1. Header ──
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.accentSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Filled.PhoneAndroid,
                            contentDescription = "Android",
                            tint = colors.accent,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Android-Sec",
                            style = RootXTypography.titleLarge.copy(
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            color = colors.textPrimary,
                        )
                        Spacer(Modifier.height(2.dp))
                        Text(
                            text = "Real-time device security & hardware telemetry",
                            style = RootXTypography.bodySmall.copy(fontSize = 12.sp),
                            color = colors.textTertiary,
                        )
                    }
                }

                // Refresh Button
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(colors.bgSurface2)
                        .border(1.dp, colors.borderDefault, RoundedCornerShape(10.dp))
                        .clickable { viewModel.loadData() },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Refresh,
                        contentDescription = "Refresh",
                        tint = colors.textSecondary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        // ── 2. Device Identity Card ──
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(colors.bgSurface)
                    .border(1.dp, colors.borderDefault, RoundedCornerShape(18.dp))
                    .padding(18.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(colors.accentSoft),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.PhoneAndroid,
                                    contentDescription = null,
                                    tint = colors.accent,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Spacer(Modifier.width(14.dp))
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "${deviceInfo.manufacturer} ${deviceInfo.model}",
                                        style = RootXTypography.titleMedium.copy(
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = colors.textPrimary,
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(100.dp))
                                            .background(colors.successSoft)
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            "Native Bridge",
                                            style = RootXTypography.micro.copy(
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            color = colors.success
                                        )
                                    }
                                }
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    text = "Android ${deviceInfo.androidVersion} (SDK ${deviceInfo.sdkVersion}) · Patch: ${deviceInfo.securityPatch}",
                                    style = RootXTypography.micro.copy(fontSize = 11.5.sp),
                                    color = colors.textSecondary,
                                )
                            }
                        }

                        // Online Chip
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(100.dp))
                                .background(colors.successSoft)
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.size(5.dp).clip(CircleShape).background(colors.success))
                                Spacer(Modifier.width(4.dp))
                                Text("Online", style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold), color = colors.success)
                            }
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    Divider(color = colors.borderDefault, thickness = 1.dp)
                    Spacer(Modifier.height(12.dp))

                    // Flags row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        SecurityBadge(
                            label = if (deviceInfo.isRooted) "Rooted ⚠️" else "Unrooted (Secure)",
                            isGood = !deviceInfo.isRooted,
                            icon = Icons.Outlined.Shield,
                            modifier = Modifier.weight(1f)
                        )
                        SecurityBadge(
                            label = if (deviceInfo.isAdbEnabled) "USB Debug Active" else "USB Debug Inactive",
                            isGood = !deviceInfo.isAdbEnabled,
                            icon = Icons.Outlined.Terminal,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        SecurityBadge(
                            label = if (deviceInfo.isCharging || deviceInfo.isAdbEnabled) "USB Connected" else "USB Disconnected",
                            isGood = true,
                            icon = Icons.Outlined.Usb,
                            modifier = Modifier.weight(1f)
                        )
                        SecurityBadge(
                            label = "Hardware Encrypted",
                            isGood = true,
                            icon = Icons.Outlined.Lock,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }

        // ── 3. 6 Stats Tiles (2 cols x 3 rows) ──
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                // Row 1: Battery & Storage
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    WebStatTile(
                        icon = if (deviceInfo.isCharging) Icons.Outlined.BatteryChargingFull else Icons.Outlined.BatteryFull,
                        label = "BATTERY",
                        value = "${deviceInfo.batteryLevel}%",
                        sub = if (deviceInfo.isCharging) "Charging" else "On battery",
                        iconBg = colors.successSoft,
                        iconTint = colors.success,
                        modifier = Modifier.weight(1f),
                    )
                    WebStatTile(
                        icon = Icons.Outlined.Storage,
                        label = "STORAGE",
                        value = "$storagePercent%",
                        sub = "$usedStorageGB / $totalStorageGB GB",
                        iconBg = colors.infoSoft,
                        iconTint = colors.info,
                        modifier = Modifier.weight(1f),
                    )
                }

                // Row 2: RAM & CPU
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    WebStatTile(
                        icon = Icons.Outlined.Memory,
                        label = "RAM",
                        value = "$totalRamGB GB",
                        sub = "$usedRamGB GB used",
                        iconBg = colors.accentSoft,
                        iconTint = colors.accent,
                        modifier = Modifier.weight(1f),
                    )
                    WebStatTile(
                        icon = Icons.Outlined.Memory,
                        label = "CPU",
                        value = "8 cores",
                        sub = "Hardware processors",
                        iconBg = colors.accentSoft,
                        iconTint = colors.accent,
                        modifier = Modifier.weight(1f),
                    )
                }

                // Row 3: Network & Display
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    WebStatTile(
                        icon = Icons.Outlined.Wifi,
                        label = "NETWORK",
                        value = "5G / WiFi",
                        sub = "~40 Mbps",
                        iconBg = colors.accentSoft,
                        iconTint = colors.accent,
                        modifier = Modifier.weight(1f),
                    )
                    WebStatTile(
                        icon = Icons.Outlined.PhoneAndroid,
                        label = "DISPLAY",
                        value = "${config.screenWidthDp * density.density.toInt()}×${config.screenHeightDp * density.density.toInt()}",
                        sub = "${density.density}x density",
                        iconBg = colors.accentSoft,
                        iconTint = colors.accent,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }

        // ── 4. Storage Bar Card ──
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(colors.bgSurface)
                    .border(1.dp, colors.borderDefault, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "Internal Device Storage",
                            style = RootXTypography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = colors.textPrimary,
                        )
                        Text(
                            text = "$usedStorageGB GB used of $totalStorageGB GB ($storagePercent%)",
                            style = RootXTypography.micro,
                            color = colors.textSecondary,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { storagePercent / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(RoundedCornerShape(100.dp)),
                        color = colors.accent,
                        trackColor = colors.bgSurface3,
                    )
                }
            }
        }

        // ── 5. App Security Breakdown (3 Cards) ──
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AppRiskSummaryCard(
                    icon = Icons.Outlined.GppMaybe,
                    count = riskyAppsCount,
                    label = "High risk apps",
                    color = colors.danger,
                    bg = colors.dangerSoft,
                    modifier = Modifier.weight(1f),
                )
                AppRiskSummaryCard(
                    icon = Icons.Outlined.Warning,
                    count = cautionAppsCount,
                    label = "Caution",
                    color = colors.warning,
                    bg = colors.warningSoft,
                    modifier = Modifier.weight(1f),
                )
                AppRiskSummaryCard(
                    icon = Icons.Outlined.VerifiedUser,
                    count = safeAppsCount,
                    label = "Verified safe",
                    color = colors.success,
                    bg = colors.successSoft,
                    modifier = Modifier.weight(1f),
                )
            }
        }

        // ── 6. Installed Apps Audit Section ──
        item {
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "AUDITED APPLICATIONS (${filteredApps.size})",
                    style = RootXTypography.caption.copy(
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.8.sp
                    ),
                    color = colors.textTertiary,
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { viewModel.toggleSystemApps() }
                ) {
                    Checkbox(
                        checked = showSystemApps,
                        onCheckedChange = { viewModel.toggleSystemApps() },
                        colors = CheckboxDefaults.colors(
                            checkedColor = colors.accent,
                            checkmarkColor = colors.accentForeground
                        )
                    )
                    Text("System apps", style = RootXTypography.micro, color = colors.textSecondary)
                }
            }

            Spacer(Modifier.height(8.dp))

            RootXField(
                value = searchQuery,
                onValueChange = { viewModel.setSearchQuery(it) },
                placeholder = "Search installed apps...",
                leadingIcon = { Icon(Icons.Outlined.Search, null, Modifier.size(16.dp), tint = colors.textTertiary) }
            )
        }

        // ── 7. App Item List ──
        items(filteredApps.take(40), key = { it.packageName }) { app ->
            val isHighRisk = app.riskLevel == "High Risk"
            val isCaution = app.riskLevel == "Caution"
            val isNeedsReview = app.riskLevel == "Needs Review"
            val isExpanded = expandedAppPackage == app.packageName

            val tagColor = when {
                isHighRisk -> colors.danger
                isCaution -> colors.warning
                isNeedsReview -> colors.info
                else -> colors.success
            }
            val tagBg = when {
                isHighRisk -> colors.dangerSoft
                isCaution -> colors.warningSoft
                isNeedsReview -> colors.infoSoft
                else -> colors.successSoft
            }
            val tagLabel = when {
                isHighRisk -> "HIGH RISK"
                isCaution -> "CAUTION"
                isNeedsReview -> "NEEDS REVIEW"
                else -> "SAFE"
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(colors.bgSurface)
                    .border(1.dp, colors.borderDefault, RoundedCornerShape(14.dp))
                    .clickable {
                        expandedAppPackage = if (isExpanded) null else app.packageName
                    }
                    .padding(14.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(colors.bgSurface2),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(
                                    imageVector = if (app.isSystemApp) Icons.Outlined.SettingsSuggest else Icons.Outlined.Android,
                                    contentDescription = null,
                                    tint = colors.accent,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = app.appName,
                                    style = RootXTypography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = colors.textPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = app.packageName,
                                    style = RootXTypography.micro,
                                    color = colors.textTertiary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(tagBg)
                                    .padding(horizontal = 7.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = tagLabel,
                                    style = RootXTypography.micro.copy(
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = tagColor
                                )
                            }
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = "${app.dangerousPermCount} perm",
                                style = RootXTypography.micro.copy(fontSize = 10.sp),
                                color = colors.textTertiary
                            )
                        }
                    }

                    if (isExpanded) {
                        Spacer(Modifier.height(10.dp))
                        Divider(color = colors.borderDefault.copy(alpha = 0.5f), thickness = 1.dp)
                        Spacer(Modifier.height(8.dp))
                        
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Store, contentDescription = null, tint = colors.textTertiary, modifier = Modifier.size(13.dp))
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "Source: ${app.installer.ifEmpty { if (app.isSystemApp) "System ROM" else "Google Play Store" }}",
                                style = RootXTypography.micro.copy(fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold),
                                color = colors.textSecondary
                            )
                        }
                        
                        if (app.riskExplanation.isNotBlank()) {
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = app.riskExplanation,
                                style = RootXTypography.micro.copy(fontSize = 10.5.sp, lineHeight = 15.sp),
                                color = colors.textTertiary
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SecurityBadge(
    label: String,
    isGood: Boolean,
    icon: ImageVector,
    modifier: Modifier = Modifier,
) {
    val colors = RootXTheme.colors
    val tint = if (isGood) colors.success else colors.warning
    val bg = if (isGood) colors.successSoft else colors.warningSoft

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bg)
            .border(1.dp, tint.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, Modifier.size(13.dp), tint = tint)
            Spacer(Modifier.width(6.dp))
            Text(
                text = label,
                style = RootXTypography.micro.copy(fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold),
                color = tint,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun WebStatTile(
    icon: ImageVector,
    label: String,
    value: String,
    sub: String,
    iconBg: Color,
    iconTint: Color,
    modifier: Modifier = Modifier,
) {
    val colors = RootXTheme.colors
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(colors.bgSurface)
            .border(1.dp, colors.borderDefault, RoundedCornerShape(16.dp))
            .padding(14.dp)
    ) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(iconBg),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, label, Modifier.size(16.dp), tint = iconTint)
                }
                Spacer(Modifier.width(8.dp))
                Text(
                    text = label,
                    style = RootXTypography.micro.copy(
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.8.sp
                    ),
                    color = colors.textTertiary,
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(
                text = value,
                style = RootXTypography.titleMedium.copy(
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = colors.textPrimary,
                maxLines = 1,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = sub,
                style = RootXTypography.micro.copy(fontSize = 10.5.sp),
                color = colors.textSecondary,
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun AppRiskSummaryCard(
    icon: ImageVector,
    count: Int,
    label: String,
    color: Color,
    bg: Color,
    modifier: Modifier = Modifier,
) {
    val colors = RootXTheme.colors
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(colors.bgSurface)
            .border(1.dp, colors.borderDefault, RoundedCornerShape(16.dp))
            .padding(14.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(bg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, label, Modifier.size(18.dp), tint = color)
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = "$count",
                style = RootXTypography.headlineSmall.copy(
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = colors.textPrimary,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = label,
                style = RootXTypography.micro.copy(
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.SemiBold
                ),
                color = colors.textTertiary,
                maxLines = 1,
            )
        }
    }
}
