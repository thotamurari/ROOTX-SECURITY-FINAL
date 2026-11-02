package com.rootx.security.ui.screens.scan

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rootx.security.data.model.ScanResult
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.ScanViewModel

import androidx.compose.material.icons.automirrored.filled.ArrowForward

@Composable
fun ScanEngineScreen(
    onNavigateToHistory: () -> Unit,
    onNavigateToApkScanner: () -> Unit = {},
    viewModel: ScanViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val context = LocalContext.current
    val activeTab by viewModel.activeTab.collectAsState()
    val input by viewModel.input.collectAsState()
    val isScanning by viewModel.isScanning.collectAsState()
    val scanResult by viewModel.scanResult.collectAsState()
    val error by viewModel.error.collectAsState()
    val historyCount by viewModel.historyCount.collectAsState()

    var pickedFileName by remember { mutableStateOf<String?>(null) }

    // Android System File Picker for APK, PDF, binaries
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val name = getFileName(context, uri) ?: "scanned_package.apk"
            pickedFileName = name
            val bytes = readUriBytes(context, uri)
            if (bytes != null) {
                viewModel.scanFileBytes(name, bytes)
            } else {
                viewModel.scanFile(name)
            }
        }
    }

    val tabs = listOf(
        "URL Scan" to Icons.Outlined.Link,
        "File Audit" to Icons.Outlined.Description,
        "Social Intel" to Icons.Outlined.Shield,
    )

    val sampleUrls = listOf(
        "https://evil.com",
        "https://update-bank-security.xyz",
        "https://google.com",
        "https://bit.ly/kyc-urgent-verify"
    )

    val sampleFiles = listOf(
        "payload_dropper.apk",
        "invoice_march.pdf",
        "system_update.dex",
        "keygen_crack.exe"
    )

    val sampleMessages = listOf(
        "URGENT: Your SBI bank account is suspended. Verify KYC now at bit.ly/sbi-kyc",
        "Congratulations! You won ₹50,000 cash prize. Click link to claim: http://lottery-win.top",
        "Hey! Are we still meeting for lunch at 1 PM today?"
    )

    // Pulsing green dot animation
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
            .padding(top = 16.dp, bottom = 40.dp),
    ) {
        // Top Header matching Web App 1:1
        PageHeader(
            title = "Scan Engine",
            description = "Threat detection for links, files and messages",
            icon = {
                Icon(Icons.Filled.Search, "Scan", Modifier.size(22.dp), tint = colors.accent)
            },
            actions = {
                RootXButton(
                    text = if (historyCount > 0) "History ($historyCount)" else "History",
                    onClick = onNavigateToHistory,
                    variant = ButtonVariant.SECONDARY,
                    size = ButtonSize.SMALL,
                    fullWidth = false,
                    leadingIcon = {
                        Icon(Icons.Outlined.History, null, Modifier.size(16.dp), tint = colors.accent)
                    },
                )
            },
        )

        Spacer(Modifier.height(10.dp))

        // Device APK Scanner Quick Banner
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(colors.accentSoft)
                .border(1.dp, colors.accent.copy(alpha = 0.25f), RoundedCornerShape(14.dp))
                .clickable { onNavigateToApkScanner() }
                .padding(horizontal = 14.dp, vertical = 11.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(colors.accent),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Shield, null, tint = colors.accentForeground, modifier = Modifier.size(16.dp))
                    }
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Device APK Scanner",
                            style = RootXTypography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 12.5.sp),
                            color = colors.textPrimary
                        )
                        Text(
                            text = "Audit installed apps, uninstall risks & inspect APKs",
                            style = RootXTypography.micro.copy(fontSize = 10.5.sp),
                            color = colors.textSecondary
                        )
                    }
                }
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = "Open APK Scanner",
                    tint = colors.accent,
                    modifier = Modifier.size(16.dp)
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // 3-Segment Tab Bar (URL Scan / File Audit / Social Intel)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(colors.bgSurface2)
                .border(1.dp, colors.borderSubtle, RoundedCornerShape(14.dp))
                .padding(4.dp),
        ) {
            tabs.forEachIndexed { index, (label, icon) ->
                val isSelected = activeTab == index
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (isSelected) colors.bgSurface else Color.Transparent)
                        .clickable {
                            viewModel.setActiveTab(index)
                            viewModel.clearResult()
                        }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            icon,
                            contentDescription = label,
                            modifier = Modifier.size(16.dp),
                            tint = if (isSelected) colors.accent else colors.textTertiary
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = label,
                            style = RootXTypography.labelMedium.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 12.5.sp
                            ),
                            color = if (isSelected) colors.textPrimary else colors.textSecondary
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Main Interaction Card
        RootXCard(padding = 18.dp) {
            val descriptions = listOf(
                "Analyze links for phishing and malicious redirects",
                "Deep malware detection on APK, PDF and executables",
                "Inspect SMS and messages for smishing and social engineering lures",
            )

            Text(
                descriptions[activeTab],
                style = RootXTypography.bodyMedium,
                color = colors.textSecondary
            )

            Spacer(Modifier.height(6.dp))

            // Detection engine status with pulsing dot
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(colors.success.copy(alpha = pulseAlpha))
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "Detection engine ready",
                    style = RootXTypography.labelSmall,
                    color = colors.textTertiary
                )
            }

            Spacer(Modifier.height(16.dp))

            // TAB 0: URL Scan
            if (activeTab == 0) {
                RootXField(
                    value = input,
                    onValueChange = { viewModel.setInput(it) },
                    placeholder = "https://example.com/suspicious-link",
                    leadingIcon = {
                        Icon(Icons.Outlined.Link, null, Modifier.size(18.dp), tint = colors.textTertiary)
                    },
                )

                Spacer(Modifier.height(14.dp))

                RootXButton(
                    text = "Scan URL with 4 Tools",
                    onClick = { viewModel.scanUrl() },
                    isLoading = isScanning,
                    enabled = input.isNotBlank(),
                    leadingIcon = {
                        Icon(Icons.Filled.QrCodeScanner, null, Modifier.size(18.dp), tint = colors.accentForeground)
                    },
                )

                Spacer(Modifier.height(14.dp))

                // 4 Security Intelligence Badges
                val engines = listOf(
                    "VirusTotal (70+ Engines)",
                    "urlscan.io",
                    "Google Safe Browsing",
                    "Sucuri SiteCheck"
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    engines.take(2).forEach { engine ->
                        EngineBadge(engine, modifier = Modifier.weight(1f))
                    }
                }
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    engines.drop(2).forEach { engine ->
                        EngineBadge(engine, modifier = Modifier.weight(1f))
                    }
                }

                Spacer(Modifier.height(10.dp))
                Text(
                    text = "Queries all 4 major security intelligence engines simultaneously.",
                    style = RootXTypography.micro,
                    color = colors.textTertiary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(Modifier.height(14.dp))
                Text("Sample targets to test:", style = RootXTypography.micro, color = colors.textTertiary)
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    sampleUrls.take(3).forEach { sample ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.bgSurface2)
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp))
                                .clickable { viewModel.setInput(sample) }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                sample.replace("https://", ""),
                                style = RootXTypography.micro.copy(fontSize = 11.sp),
                                color = colors.accent,
                                maxLines = 1
                            )
                        }
                    }
                }
            }

            // TAB 1: File Audit (Matching the Dashed Dropzone screenshot 1:1)
            if (activeTab == 1) {
                val borderStrokeColor = colors.borderStrong
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(colors.bgSurface2.copy(alpha = 0.5f))
                        .drawBehind {
                            val strokeWidth = 2.dp.toPx()
                            val dashEffect = PathEffect.dashPathEffect(floatArrayOf(18f, 14f), 0f)
                            drawRoundRect(
                                color = borderStrokeColor,
                                style = Stroke(width = strokeWidth, pathEffect = dashEffect),
                                cornerRadius = CornerRadius(16.dp.toPx(), 16.dp.toPx())
                            )
                        }
                        .clickable { filePickerLauncher.launch("*/*") }
                        .padding(vertical = 32.dp, horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(colors.accentSoft),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                if (pickedFileName != null) Icons.Outlined.CheckCircle else Icons.Outlined.CloudUpload,
                                contentDescription = "Upload",
                                modifier = Modifier.size(28.dp),
                                tint = if (pickedFileName != null) colors.success else colors.accent
                            )
                        }

                        Spacer(Modifier.height(14.dp))

                        Text(
                            text = pickedFileName ?: "Drop a file to scan",
                            style = RootXTypography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = colors.textPrimary,
                            textAlign = TextAlign.Center,
                            maxLines = 1
                        )

                        Spacer(Modifier.height(4.dp))

                        Text(
                            text = "or use the button below to browse your device",
                            style = RootXTypography.bodySmall,
                            color = colors.textSecondary,
                            textAlign = TextAlign.Center
                        )

                        Spacer(Modifier.height(8.dp))

                        Text(
                            text = "APK, PDF or EXE · up to 50 MB",
                            style = RootXTypography.micro,
                            color = colors.textTertiary,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                Spacer(Modifier.height(14.dp))

                RootXButton(
                    text = "Browse files",
                    onClick = { filePickerLauncher.launch("*/*") },
                    variant = ButtonVariant.SECONDARY,
                    size = ButtonSize.LARGE,
                    fullWidth = true,
                    leadingIcon = {
                        Icon(Icons.Outlined.FolderOpen, null, Modifier.size(18.dp), tint = colors.accent)
                    }
                )

                Spacer(Modifier.height(14.dp))

                Text("Quick test binaries:", style = RootXTypography.micro, color = colors.textTertiary)
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    sampleFiles.take(3).forEach { sample ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.bgSurface2)
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp))
                                .clickable {
                                    pickedFileName = sample
                                    viewModel.scanFile(sample)
                                }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                sample,
                                style = RootXTypography.micro.copy(fontSize = 11.sp),
                                color = colors.accent,
                                maxLines = 1
                            )
                        }
                    }
                }
            }

            // TAB 2: Social Intel
            if (activeTab == 2) {
                RootXField(
                    value = input,
                    onValueChange = { viewModel.setInput(it) },
                    placeholder = "Paste suspicious SMS or WhatsApp message...",
                    singleLine = false,
                    leadingIcon = {
                        Icon(Icons.Outlined.ChatBubbleOutline, null, Modifier.size(18.dp), tint = colors.textTertiary)
                    },
                )

                Spacer(Modifier.height(10.dp))

                Text("Sample messages:", style = RootXTypography.micro, color = colors.textTertiary)
                Spacer(Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val labels = listOf("SBI Bank SMS", "Lottery Win", "Normal Chat")
                    labels.forEachIndexed { i, label ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.bgSurface2)
                                .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp))
                                .clickable { viewModel.setInput(sampleMessages[i]) }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                label,
                                style = RootXTypography.micro.copy(fontSize = 11.sp),
                                color = colors.accent,
                                maxLines = 1
                            )
                        }
                    }
                }

                Spacer(Modifier.height(14.dp))

                RootXButton(
                    text = "Analyze Message with AI",
                    onClick = { viewModel.scanMessage() },
                    isLoading = isScanning,
                    enabled = input.isNotBlank(),
                    leadingIcon = {
                        Icon(Icons.Filled.Psychology, null, Modifier.size(18.dp), tint = colors.accentForeground)
                    },
                )
            }
        }

        // Error banner
        AnimatedVisibility(visible = error != null) {
            Spacer(Modifier.height(12.dp))
            RootXCard(padding = 12.dp) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Error, null, Modifier.size(18.dp), tint = colors.danger)
                    Spacer(Modifier.width(10.dp))
                    Text(error ?: "", style = RootXTypography.bodySmall, color = colors.danger)
                }
            }
        }

        // Scan Result Card
        AnimatedVisibility(visible = scanResult != null) {
            scanResult?.let { result ->
                val statusColor = when (result.status) {
                    "threat" -> colors.danger
                    "suspicious", "unverified" -> colors.warning
                    else -> colors.success
                }
                val statusBg = when (result.status) {
                    "threat" -> colors.dangerSoft
                    "suspicious", "unverified" -> colors.warningSoft
                    else -> colors.successSoft
                }
                val statusIcon = when (result.status) {
                    "threat" -> Icons.Filled.Warning
                    "suspicious", "unverified" -> Icons.Filled.Error
                    else -> Icons.Filled.CheckCircle
                }
                val verdictLabel = result.verdictLabel.ifBlank {
                    when (result.status) {
                        "threat" -> "PHISHING"
                        "suspicious" -> "SUSPICIOUS"
                        "unverified" -> "UNVERIFIED"
                        else -> "SAFE"
                    }
                }

                Spacer(Modifier.height(16.dp))
                RootXCard(padding = 18.dp) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(statusBg),
                                contentAlignment = Alignment.Center,
                            ) {
                                Icon(statusIcon, null, Modifier.size(24.dp), tint = statusColor)
                            }
                            Spacer(Modifier.width(12.dp))
                            Column {
                                Text(
                                    verdictLabel,
                                    style = RootXTypography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = statusColor,
                                )
                                Text(result.input, style = RootXTypography.micro, color = colors.textTertiary, maxLines = 1)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(statusBg)
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                "Score: ${result.score}/100",
                                style = RootXTypography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = statusColor,
                            )
                        }
                    }

                    if (result.verdict.isNotBlank()) {
                        Spacer(Modifier.height(10.dp))
                        Text(
                            result.verdict,
                            style = RootXTypography.bodySmall,
                            color = colors.textSecondary,
                        )
                    }

                    if (result.threats.isNotEmpty()) {
                        Spacer(Modifier.height(14.dp))
                        Text("DETECTED THREAT INDICATORS", style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold), color = colors.textPrimary)
                        Spacer(Modifier.height(6.dp))
                        result.threats.forEach { threat ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(colors.bgSurface2)
                                    .padding(10.dp)
                                    .padding(bottom = 4.dp)
                            ) {
                                Column {
                                    Text("• ${threat.name}", style = RootXTypography.labelSmall.copy(fontWeight = FontWeight.Bold), color = colors.danger)
                                    Spacer(Modifier.height(2.dp))
                                    Text(threat.description, style = RootXTypography.micro, color = colors.textSecondary)
                                }
                            }
                            Spacer(Modifier.height(6.dp))
                        }
                    }

                    if (result.engines.isNotEmpty()) {
                        Spacer(Modifier.height(14.dp))
                        Text("SECURITY INTELLIGENCE ENGINES", style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold), color = colors.textPrimary)
                        Spacer(Modifier.height(6.dp))
                        result.engines.forEach { engine ->
                            val engineIsThreat = engine.status == "threat"
                            Row(
                                Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(engine.name, style = RootXTypography.labelSmall, color = colors.textPrimary)
                                    if (engine.detail.isNotBlank()) {
                                        Text(engine.detail, style = RootXTypography.micro, color = colors.textTertiary)
                                    }
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(if (engineIsThreat) colors.dangerSoft else colors.successSoft)
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        if (engineIsThreat) "THREAT" else "CLEAN",
                                        style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold),
                                        color = if (engineIsThreat) colors.danger else colors.success,
                                    )
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    RootXButton(
                        text = "Clear Scan",
                        onClick = {
                            pickedFileName = null
                            viewModel.clearResult()
                        },
                        variant = ButtonVariant.SECONDARY,
                        size = ButtonSize.SMALL,
                    )
                }
            }
        }

        // Security Advisories section (Matching the 2 cards on the Web screenshots 1:1)
        if (!isScanning) {
            Spacer(Modifier.height(24.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Lightbulb, null, Modifier.size(16.dp), tint = colors.textTertiary)
                Spacer(Modifier.width(8.dp))
                Text(
                    "SECURITY ADVISORIES",
                    style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.sp),
                    color = colors.textTertiary
                )
            }
            Spacer(Modifier.height(10.dp))

            // Advisory Card 1: SMS Warning
            RootXCard(modifier = Modifier.padding(bottom = 8.dp), padding = 12.dp) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.successSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Outlined.VerifiedUser, null, Modifier.size(18.dp), tint = colors.success)
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(
                        "Avoid opening suspicious links received over SMS",
                        style = RootXTypography.bodySmall,
                        color = colors.textSecondary,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Advisory Card 2: System Update
            RootXCard(modifier = Modifier.padding(bottom = 8.dp), padding = 12.dp) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.warningSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Filled.ElectricBolt, null, Modifier.size(18.dp), tint = colors.warning)
                    }
                    Spacer(Modifier.width(12.dp))
                    Text(
                        "Keep your system software up to date",
                        style = RootXTypography.bodySmall,
                        color = colors.textSecondary,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun EngineBadge(name: String, modifier: Modifier = Modifier) {
    val colors = RootXTheme.colors
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(colors.bgSurface2)
            .border(1.dp, colors.borderSubtle, RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(CircleShape)
                .background(colors.success)
        )
        Spacer(Modifier.width(6.dp))
        Text(
            name,
            style = RootXTypography.micro.copy(fontSize = 11.sp),
            color = colors.textSecondary,
            maxLines = 1
        )
    }
}

private fun getFileName(context: Context, uri: Uri): String? {
    var name: String? = null
    if (uri.scheme == "content") {
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val colIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (colIndex != -1 && cursor.moveToFirst()) {
                name = cursor.getString(colIndex)
            }
        }
    }
    return name ?: uri.path?.substringAfterLast('/')
}

private fun readUriBytes(context: Context, uri: Uri): ByteArray? {
    return try {
        context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
    } catch (_: Exception) {
        null
    }
}

// ── Scan History Screen ──
@Composable
fun ScanHistoryScreen(
    onBack: () -> Unit,
    viewModel: ScanViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val history by viewModel.scanHistory.collectAsState()
    var selectedFilter by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }

    val filteredList = history.filter { item ->
        val matchesFilter = when (selectedFilter) {
            "Clean" -> item.status == "clean"
            "Threat" -> item.status == "threat"
            else -> true
        }
        val matchesSearch = searchQuery.isBlank() ||
                item.input.contains(searchQuery, ignoreCase = true) ||
                item.verdict.contains(searchQuery, ignoreCase = true)
        matchesFilter && matchesSearch
    }

    LaunchedEffect(Unit) { viewModel.loadHistory() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .statusBarsPadding()
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(8.dp))
        RootXButton(
            text = "Back", onClick = onBack,
            variant = ButtonVariant.GHOST, size = ButtonSize.SMALL, fullWidth = false,
            leadingIcon = { Icon(Icons.Filled.ChevronLeft, "Back", Modifier.size(18.dp), tint = colors.textSecondary) },
        )
        Spacer(Modifier.height(8.dp))
        PageHeader(
            title = "Scan History & Logs",
            description = "Review past security audits, re-scan suspicious targets, and inspect threat reports",
            icon = { Icon(Icons.Outlined.History, null, Modifier.size(22.dp), tint = colors.accent) },
        )

        // Filter Pills & Cloud Sync Status
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("All", "Clean", "Threat").forEach { filter ->
                    val isActive = selectedFilter == filter
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(100.dp))
                            .background(if (isActive) colors.accent else colors.bgSurface2)
                            .clickable { selectedFilter = filter }
                            .padding(horizontal = 14.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = filter,
                            style = RootXTypography.labelSmall.copy(fontWeight = if (isActive) FontWeight.Bold else FontWeight.Medium),
                            color = if (isActive) colors.accentForeground else colors.textSecondary,
                        )
                    }
                }
            }

            // Real-time Cloud Sync Pill
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(100.dp))
                    .background(colors.successSoft)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                contentAlignment = Alignment.Center,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(5.dp).clip(CircleShape).background(colors.success))
                    Spacer(Modifier.width(5.dp))
                    Text(
                        "Cloud Synced",
                        style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold),
                        color = colors.success
                    )
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        RootXField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = "Search scan logs...",
            leadingIcon = { Icon(Icons.Outlined.Search, "Search", Modifier.size(16.dp), tint = colors.textTertiary) },
        )

        Spacer(Modifier.height(14.dp))

        if (filteredList.isEmpty()) {
            val noScansYet = history.isEmpty()
            EmptyState(
                title = if (noScansYet) "No scans yet" else "No scans found",
                message = if (noScansYet)
                    "Run your first URL, file, or message scan to see results here."
                else
                    "No scan logs match your search criteria.",
            )
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 60.dp),
            ) {
                items(filteredList, key = { it.id }) { result ->
                    val statusColor = when (result.status) {
                        "clean" -> colors.success
                        "threat" -> colors.danger
                        else -> colors.warning
                    }
                    val statusBg = when (result.status) {
                        "clean" -> colors.successSoft
                        "threat" -> colors.dangerSoft
                        else -> colors.warningSoft
                    }

                    RootXCard(padding = 14.dp) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(colors.bgSurface3)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(result.type.uppercase(), style = RootXTypography.micro, color = colors.textSecondary)
                            }

                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(statusBg)
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(result.status.uppercase(), style = RootXTypography.micro.copy(fontWeight = FontWeight.Bold), color = statusColor)
                            }
                        }

                        Spacer(Modifier.height(8.dp))
                        Text(result.input, style = RootXTypography.titleSmall.copy(fontWeight = FontWeight.SemiBold), color = colors.textPrimary, maxLines = 2)

                        if (result.verdict.isNotBlank()) {
                            Spacer(Modifier.height(4.dp))
                            Text(result.verdict, style = RootXTypography.bodySmall, color = colors.textTertiary)
                        }

                        Spacer(Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("Risk Score: ${result.score} / 100", style = RootXTypography.micro, color = colors.textTertiary)
                            Text(if (result.timestamp.isNotBlank()) result.timestamp else "Inspected", style = RootXTypography.micro, color = colors.accent)
                        }
                    }
                }
            }
        }
    }
}
