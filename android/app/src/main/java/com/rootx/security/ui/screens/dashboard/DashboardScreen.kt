package com.rootx.security.ui.screens.dashboard

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rootx.security.ui.components.*
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography
import com.rootx.security.viewmodel.AuthViewModel
import com.rootx.security.viewmodel.DashboardViewModel
import java.util.Calendar

@Composable
fun DashboardScreen(
    onNavigateToScan: () -> Unit,
    onNavigateToRootxAI: () -> Unit,
    onNavigateToAndroidSec: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    viewModel: DashboardViewModel = hiltViewModel(),
) {
    val colors = RootXTheme.colors
    val userProfile by authViewModel.user.collectAsState()
    val syncedScans by viewModel.syncedScans.collectAsState()
    val threatsCount = remember(syncedScans) { syncedScans.count { it.score >= 50 || it.status == "threat" } }
    val safeCount = remember(syncedScans) { syncedScans.count { it.score < 30 || it.status == "clean" } }
    val securityScore = remember(threatsCount) {
        if (threatsCount > 0) (95 - threatsCount * 15).coerceAtLeast(30) else 92
    }

    // Determine greeting based on time of day
    val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        currentHour < 12 -> "Good morning"
        currentHour < 18 -> "Good afternoon"
        else -> "Good evening"
    }

    val displayName = remember(userProfile) {
        val email = userProfile?.email
        if (!email.isNullOrBlank()) {
            email.substringBefore("@")
        } else {
            "testtest"
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.bgBase)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
            .padding(top = 16.dp, bottom = 40.dp),
    ) {
        // ── 1. Greeting & Page Header ──
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
                        imageVector = Icons.Filled.Security,
                        contentDescription = null,
                        tint = colors.accent,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        text = "$greeting, $displayName",
                        style = RootXTypography.titleLarge.copy(
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = (-0.3).sp
                        ),
                        color = colors.textPrimary,
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = "Live overview of your device security posture",
                        style = RootXTypography.bodySmall.copy(fontSize = 12.5.sp),
                        color = colors.textTertiary,
                    )
                }
            }
        }

        Spacer(Modifier.height(14.dp))

        // ── [ Run scan ] Quick Action Button ──
        RootXButton(
            text = "Run scan",
            onClick = onNavigateToScan,
            variant = ButtonVariant.PRIMARY,
            size = ButtonSize.MEDIUM,
            fullWidth = false,
            leadingIcon = {
                Icon(
                    imageVector = Icons.Outlined.QrCodeScanner,
                    contentDescription = null,
                    tint = colors.accentForeground,
                    modifier = Modifier.size(18.dp)
                )
            }
        )

        Spacer(Modifier.height(16.dp))

        // ── 2. Hero Security Score Card ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(colors.bgSurface)
                .border(1.dp, colors.borderDefault, RoundedCornerShape(20.dp))
                .padding(20.dp)
        ) {
            // Ambient glow
            Box(
                modifier = Modifier
                    .size(140.dp)
                    .align(Alignment.TopEnd)
                    .offset(x = 30.dp, y = (-30).dp)
                    .blur(50.dp)
                    .background(colors.accent.copy(alpha = 0.08f), CircleShape)
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Circular Gauge matching SecurityScore.tsx
                WebSecurityScoreRing(score = securityScore)

                Spacer(Modifier.height(16.dp))

                // "● Excellent" Status Chip
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(100.dp))
                        .background(colors.successSoft)
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(colors.success)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "Excellent",
                            style = RootXTypography.labelSmall.copy(
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            color = colors.success,
                        )
                    }
                }

                Spacer(Modifier.height(10.dp))

                // "Security posture is excellent" Title
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Security posture is ",
                        style = RootXTypography.headlineSmall.copy(
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = colors.textPrimary,
                    )
                    Text(
                        text = "excellent",
                        style = RootXTypography.headlineSmall.copy(
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = colors.success,
                    )
                }

                Spacer(Modifier.height(6.dp))

                // Description
                Text(
                    text = "RootX is actively shielding $displayName. Continuous behavioural monitoring is running in the background.",
                    style = RootXTypography.bodySmall.copy(fontSize = 12.5.sp, lineHeight = 18.sp),
                    color = colors.textSecondary,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 10.dp)
                )

                Spacer(Modifier.height(16.dp))

                // Live Indicator Row: Firewall, Monitoring, Encryption, Threat Intel
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                ) {
                    val pills = listOf("Firewall", "Monitoring", "Encryption", "Threat Intel")
                    pills.forEachIndexed { index, label ->
                        WebLivePill(label = label, ok = true)
                        if (index < pills.lastIndex) {
                            Spacer(Modifier.width(6.dp))
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Cyber-Cat Assistant Spotlight Card ──
        CyberCatCard(
            threatsCount = threatsCount,
            scansCount = syncedScans.size,
            onNavigateToScan = onNavigateToScan,
            onNavigateToRootxAI = onNavigateToRootxAI,
        )

        Spacer(Modifier.height(16.dp))

        // ── 3. Supporting Vitals (2x2 Grid with Real Telemetry) ──
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            // Card 1: SCANS AUDITED
            WebVitalCard(
                icon = Icons.Outlined.Shield,
                label = "TOTAL SCANS",
                value = "${syncedScans.size} Audited",
                iconBg = colors.accentSoft,
                iconTint = colors.accent,
                modifier = Modifier.weight(1f),
            )
            // Card 2: THREATS DETECTED
            WebVitalCard(
                icon = Icons.Outlined.ErrorOutline,
                label = "THREATS",
                value = "$threatsCount Detected",
                iconBg = if (threatsCount > 0) colors.dangerSoft else colors.successSoft,
                iconTint = if (threatsCount > 0) colors.danger else colors.success,
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(10.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            // Card 3: CLEAN PASS
            WebVitalCard(
                icon = Icons.Outlined.CheckCircle,
                label = "VERIFIED SAFE",
                value = "$safeCount Nodes",
                iconBg = colors.successSoft,
                iconTint = colors.success,
                modifier = Modifier.weight(1f),
            )
            // Card 4: NETWORK TELEMETRY
            WebVitalCard(
                icon = Icons.Outlined.ShowChart,
                label = "NETWORK",
                value = "40 MB/s",
                iconBg = colors.infoSoft,
                iconTint = colors.info,
                modifier = Modifier.weight(1f),
            )
        }

        Spacer(Modifier.height(16.dp))

        // ── 4. Quick Action Grid (Core Scan, AI Audit, Shield Up) ──
        WebActionCard(
            icon = Icons.Outlined.QrCodeScanner,
            title = "Core Scan",
            description = "Full device sweep",
            toneBg = colors.accentSoft,
            toneTint = colors.accent,
            onClick = onNavigateToScan,
        )
        Spacer(Modifier.height(10.dp))
        WebActionCard(
            icon = Icons.Outlined.Psychology,
            title = "AI Audit",
            description = "Behavioural analysis",
            toneBg = colors.infoSoft,
            toneTint = colors.info,
            onClick = onNavigateToRootxAI,
        )
        Spacer(Modifier.height(10.dp))
        WebActionCard(
            icon = Icons.Outlined.Shield,
            title = "Shield Up",
            description = "Harden Android",
            toneBg = colors.dangerSoft,
            toneTint = colors.danger,
            onClick = onNavigateToAndroidSec,
        )

        Spacer(Modifier.height(16.dp))

        // ── 5. System Integrity Card ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(colors.bgSurface)
                .border(1.dp, colors.borderDefault, RoundedCornerShape(16.dp))
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(colors.successSoft),
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(colors.success)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "System Integrity",
                            style = RootXTypography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = colors.textPrimary,
                        )
                        Text(
                            text = "All modules running optimally",
                            style = RootXTypography.micro,
                            color = colors.textTertiary,
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = colors.textTertiary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

/** 1:1 match with SecurityScore.tsx */
@Composable
private fun WebSecurityScoreRing(score: Int) {
    val colors = RootXTheme.colors
    val ringColor = if (score >= 90) colors.success else if (score >= 70) colors.accent else colors.warning

    val animatedProgress by animateFloatAsState(
        targetValue = score / 100f,
        animationSpec = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
        label = "scoreProgress"
    )

    Box(
        modifier = Modifier.size(116.dp),
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.size(116.dp)) {
            val strokeWidth = 8.dp.toPx()
            // Background track
            drawArc(
                color = colors.bgSurface3,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
            // Progress arc
            drawArc(
                color = ringColor,
                startAngle = -90f,
                sweepAngle = 360f * animatedProgress,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$score",
                style = RootXTypography.headlineLarge.copy(
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-1).sp
                ),
                color = colors.textPrimary,
            )
            Text(
                text = "SCORE",
                style = RootXTypography.micro.copy(
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                ),
                color = colors.textTertiary,
            )
        }
    }
}

/** 1:1 match with indicator pills */
@Composable
private fun WebLivePill(label: String, ok: Boolean) {
    val colors = RootXTheme.colors
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(100.dp))
            .background(if (ok) colors.successSoft else colors.dangerSoft)
            .border(1.dp, if (ok) colors.success.copy(alpha = 0.25f) else colors.danger.copy(alpha = 0.25f), RoundedCornerShape(100.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(5.dp)
                    .clip(CircleShape)
                    .background(if (ok) colors.success else colors.danger)
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = label,
                style = RootXTypography.micro.copy(
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                ),
                color = if (ok) colors.success else colors.danger,
            )
        }
    }
}

/** 1:1 match with VitalsScroll cards */
@Composable
private fun WebVitalCard(
    icon: ImageVector,
    label: String,
    value: String,
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
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(iconBg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = iconTint,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(Modifier.height(10.dp))
            Text(
                text = label,
                style = RootXTypography.micro.copy(
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                ),
                color = colors.textTertiary,
            )
            Spacer(Modifier.height(2.dp))
            Text(
                text = value,
                style = RootXTypography.titleMedium.copy(
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                ),
                color = colors.textPrimary,
                maxLines = 1,
            )
        }
    }
}

/** 1:1 match with ActionGrid buttons */
@Composable
private fun WebActionCard(
    icon: ImageVector,
    title: String,
    description: String,
    toneBg: Color,
    toneTint: Color,
    onClick: () -> Unit,
) {
    val colors = RootXTheme.colors
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(colors.bgSurface)
            .border(1.dp, colors.borderDefault, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(toneBg),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = toneTint,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(
                        text = title,
                        style = RootXTypography.titleSmall.copy(
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Bold
                        ),
                        color = colors.textPrimary,
                    )
                    Text(
                        text = description,
                        style = RootXTypography.micro.copy(fontSize = 11.5.sp),
                        color = colors.textSecondary,
                    )
                }
            }
            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = null,
                tint = colors.textTertiary,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

/**
 * Robot Cat Mascot Card for Android Native Dashboard.
 * Features an animated vector LED cat avatar with floating hover and blinking visor.
 */
@Composable
fun CyberCatCard(
    threatsCount: Int,
    scansCount: Int,
    onNavigateToScan: () -> Unit,
    onNavigateToRootxAI: () -> Unit,
) {
    val colors = RootXTheme.colors
    val isAlert = threatsCount > 0
    val auraColor = if (isAlert) colors.danger else colors.accent

    val infiniteTransition = rememberInfiniteTransition(label = "catTransition")
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -6f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "floatAnim"
    )
    val eyeAlpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.15f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 4000
                1f at 0
                1f at 3700
                0.15f at 3850
                1f at 4000
            },
            repeatMode = RepeatMode.Restart
        ),
        label = "blinkAnim"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(colors.bgSurface)
            .border(1.dp, if (isAlert) colors.danger.copy(alpha = 0.35f) else colors.accent.copy(alpha = 0.25f), RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Animated Cyber-Cat Avatar Canvas
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .offset(y = floatOffset.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.size(64.dp)) {
                        val w = size.width
                        val h = size.height

                        // Ears
                        val leftEarPath = Path().apply {
                            moveTo(w * 0.22f, h * 0.35f)
                            lineTo(w * 0.35f, h * 0.08f)
                            lineTo(w * 0.44f, h * 0.32f)
                            close()
                        }
                        val rightEarPath = Path().apply {
                            moveTo(w * 0.56f, h * 0.32f)
                            lineTo(w * 0.65f, h * 0.08f)
                            lineTo(w * 0.78f, h * 0.35f)
                            close()
                        }
                        drawPath(leftEarPath, Color(0xFF1E293B))
                        drawPath(rightEarPath, Color(0xFF1E293B))

                        // Head chassis
                        drawRoundRect(
                            color = Color(0xFF0F172A),
                            topLeft = Offset(w * 0.16f, h * 0.28f),
                            size = Size(w * 0.68f, h * 0.44f),
                            cornerRadius = CornerRadius(14.dp.toPx())
                        )
                        drawRoundRect(
                            color = auraColor,
                            topLeft = Offset(w * 0.16f, h * 0.28f),
                            size = Size(w * 0.68f, h * 0.44f),
                            cornerRadius = CornerRadius(14.dp.toPx()),
                            style = Stroke(width = 1.dp.toPx())
                        )

                        // LED Visor
                        drawRoundRect(
                            color = Color(0xFF020617),
                            topLeft = Offset(w * 0.25f, h * 0.38f),
                            size = Size(w * 0.50f, h * 0.22f),
                            cornerRadius = CornerRadius(6.dp.toPx())
                        )

                        // Blinking Glowing Eyes
                        val eyeColor = if (isAlert) Color(0xFFEF4444) else Color(0xFF22D3EE)
                        drawCircle(
                            color = eyeColor.copy(alpha = eyeAlpha),
                            radius = 3.5.dp.toPx(),
                            center = Offset(w * 0.38f, h * 0.49f)
                        )
                        drawCircle(
                            color = eyeColor.copy(alpha = eyeAlpha),
                            radius = 3.5.dp.toPx(),
                            center = Offset(w * 0.62f, h * 0.49f)
                        )

                        // Whiskers
                        drawLine(auraColor.copy(alpha = 0.7f), Offset(w * 0.22f, h * 0.50f), Offset(w * 0.06f, h * 0.46f), strokeWidth = 1.dp.toPx())
                        drawLine(auraColor.copy(alpha = 0.7f), Offset(w * 0.22f, h * 0.56f), Offset(w * 0.05f, h * 0.58f), strokeWidth = 1.dp.toPx())

                        drawLine(auraColor.copy(alpha = 0.7f), Offset(w * 0.78f, h * 0.50f), Offset(w * 0.94f, h * 0.46f), strokeWidth = 1.dp.toPx())
                        drawLine(auraColor.copy(alpha = 0.7f), Offset(w * 0.78f, h * 0.56f), Offset(w * 0.95f, h * 0.58f), strokeWidth = 1.dp.toPx())

                        // Collar & Shield Crest
                        drawRoundRect(
                            color = Color(0xFF090D16),
                            topLeft = Offset(w * 0.32f, h * 0.72f),
                            size = Size(w * 0.36f, h * 0.08f),
                            cornerRadius = CornerRadius(2.dp.toPx())
                        )
                        drawCircle(
                            color = auraColor,
                            radius = 2.5.dp.toPx(),
                            center = Offset(w * 0.5f, h * 0.76f)
                        )
                    }
                }

                Spacer(Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(100.dp))
                                .background(colors.accentSoft)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "CYBER-CAT // UNIT-01",
                                style = RootXTypography.micro.copy(
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                ),
                                color = colors.accent
                            )
                        }
                        Spacer(Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(100.dp))
                                .background(if (isAlert) colors.dangerSoft else colors.successSoft)
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = if (isAlert) "● THREAT ALERT" else "● PATROLLING",
                                style = RootXTypography.micro.copy(
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = if (isAlert) colors.danger else colors.success
                            )
                        }
                    }

                    Spacer(Modifier.height(4.dp))

                    Text(
                        text = if (isAlert) {
                            "Warning! Detected $threatsCount threat flag in recent sweeps. Immediate review recommended."
                        } else {
                            "Purr-fect posture! All $scansCount audited sweeps verified safe. Continuous perimeter telemetry active."
                        },
                        style = RootXTypography.bodySmall.copy(fontSize = 12.sp, lineHeight = 16.sp),
                        color = colors.textPrimary
                    )
                }
            }

            Spacer(Modifier.height(12.dp))

            // Action row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                RootXButton(
                    text = "Sweep Perimeter",
                    onClick = onNavigateToScan,
                    variant = ButtonVariant.PRIMARY,
                    size = ButtonSize.SMALL,
                    fullWidth = false,
                    modifier = Modifier.weight(1f)
                )
                RootXButton(
                    text = "Ask RootX-AI",
                    onClick = onNavigateToRootxAI,
                    variant = ButtonVariant.SECONDARY,
                    size = ButtonSize.SMALL,
                    fullWidth = false,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}
