package com.rootx.security.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.R
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

/**
 * RootXLogo — 1:1 exact match of the React <Logo> component using the official logo image.
 */
@Composable
fun RootXLogo(
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
    glow: Boolean = true,
) {
    val colors = RootXTheme.colors
    val infiniteTransition = rememberInfiniteTransition(label = "logoGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 0.55f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "glowAlpha",
    )

    val shape = RoundedCornerShape(size * 0.28f)

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center,
    ) {
        // Ambient soft glow
        if (glow) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .blur(size / 3)
                    .background(colors.accent.copy(alpha = glowAlpha), CircleShape)
            )
        }

        // Logo Container with gradient & image
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(shape)
                .background(
                    Brush.linearGradient(
                        colors = listOf(colors.bgSurface2, colors.bgSurface)
                    )
                )
                .border(
                    width = 1.dp,
                    color = colors.borderDefault,
                    shape = shape
                ),
            contentAlignment = Alignment.Center,
        ) {
            // Actual Web App Logo Image
            Image(
                painter = painterResource(id = R.drawable.rootx_logo),
                contentDescription = "RootX Logo",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(shape)
            )

            // Top highlight overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.08f),
                                Color.Transparent
                            )
                        )
                    )
            )
        }
    }
}

/**
 * GoogleIcon — Authentic 4-color Google G icon drawn natively on Compose Canvas.
 */
@Composable
fun GoogleIcon(modifier: Modifier = Modifier.size(18.dp)) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val cx = w / 2f
        val cy = h / 2f
        val r = w * 0.45f
        val strokeW = w * 0.18f

        val blue = Color(0xFF4285F4)
        val red = Color(0xFFEA4335)
        val yellow = Color(0xFFFBBC05)
        val green = Color(0xFF34A853)

        // Draw horizontal blue bar in the middle
        drawLine(
            color = blue,
            start = Offset(cx, cy),
            end = Offset(w, cy),
            strokeWidth = strokeW,
            cap = StrokeCap.Square
        )

        // Draw the 4 colored arcs
        val arcStyle = Stroke(width = strokeW, cap = StrokeCap.Butt)
        // Blue (315 to 45 deg)
        drawArc(blue, -45f, 90f, false, topLeft = Offset(cx - r, cy - r), size = Size(r * 2, r * 2), style = arcStyle)
        // Green (45 to 135 deg)
        drawArc(green, 45f, 90f, false, topLeft = Offset(cx - r, cy - r), size = Size(r * 2, r * 2), style = arcStyle)
        // Yellow (135 to 225 deg)
        drawArc(yellow, 135f, 90f, false, topLeft = Offset(cx - r, cy - r), size = Size(r * 2, r * 2), style = arcStyle)
        // Red (225 to 315 deg)
        drawArc(red, 225f, 90f, false, topLeft = Offset(cx - r, cy - r), size = Size(r * 2, r * 2), style = arcStyle)
    }
}

/**
 * LiveStatusPill — Real-time indicator pill matching web hero indicators.
 */
@Composable
fun LiveStatusPill(
    label: String,
    ok: Boolean,
    modifier: Modifier = Modifier,
) {
    val colors = RootXTheme.colors
    val bg = if (ok) colors.successSoft else colors.dangerSoft
    val textC = if (ok) colors.success else colors.danger
    val borderC = (if (ok) colors.success else colors.danger).copy(alpha = 0.25f)

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(100.dp))
            .background(bg)
            .border(1.dp, borderC, RoundedCornerShape(100.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(5.dp)
                .background(textC, CircleShape)
        )
        Text(
            text = label,
            style = RootXTypography.labelSmall.copy(fontSize = 10.5.sp),
            color = textC,
        )
    }
}

/**
 * PageHeader — matches the React <PageHeader> component.
 */
@Composable
fun PageHeader(
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    icon: @Composable (() -> Unit)? = null,
    actions: @Composable (() -> Unit)? = null,
) {
    val colors = RootXTheme.colors
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (icon != null) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(colors.accentSoft),
                contentAlignment = Alignment.Center,
            ) { icon() }
            Spacer(Modifier.width(12.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = RootXTypography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = colors.textPrimary,
            )
            if (description != null) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = description,
                    style = RootXTypography.bodySmall,
                    color = colors.textSecondary,
                )
            }
        }
        if (actions != null) {
            Spacer(Modifier.width(12.dp))
            actions()
        }
    }
}

/**
 * LoadingSpinner — animated circular spinner with optional text.
 */
@Composable
fun LoadingSpinner(
    modifier: Modifier = Modifier,
    text: String? = null,
    size: Dp = 44.dp,
    color: Color = RootXTheme.colors.accent,
) {
    val infiniteTransition = rememberInfiniteTransition(label = "spinner")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = LinearEasing),
            repeatMode = RepeatMode.Restart,
        ),
        label = "rotation",
    )

    Column(
        modifier = modifier.fillMaxWidth().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Canvas(modifier = Modifier.size(size)) {
            drawArc(
                color = color.copy(alpha = 0.15f),
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round),
                topLeft = Offset.Zero,
                size = Size(this.size.width, this.size.height),
            )
            drawArc(
                color = color,
                startAngle = rotation,
                sweepAngle = 100f,
                useCenter = false,
                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round),
                topLeft = Offset.Zero,
                size = Size(this.size.width, this.size.height),
            )
        }
        if (text != null) {
            Spacer(Modifier.height(14.dp))
            Text(
                text = text,
                style = RootXTypography.bodyMedium,
                color = RootXTheme.colors.textTertiary,
            )
        }
    }
}

/**
 * EmptyState — matches the React <EmptyState> component.
 */
@Composable
fun EmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    icon: @Composable (() -> Unit)? = null,
    action: @Composable (() -> Unit)? = null,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (icon != null) {
            icon()
            Spacer(Modifier.height(16.dp))
        }
        Text(
            text = title,
            style = RootXTypography.titleLarge,
            color = RootXTheme.colors.textPrimary,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = message,
            style = RootXTypography.bodyMedium,
            color = RootXTheme.colors.textTertiary,
        )
        if (action != null) {
            Spacer(Modifier.height(20.dp))
            action()
        }
    }
}

/**
 * SecurityScoreRing — the circular security score from Dashboard.
 */
@Composable
fun SecurityScoreRing(
    score: Int,
    modifier: Modifier = Modifier,
    size: Dp = 120.dp,
    strokeWidth: Dp = 7.dp,
) {
    val colors = RootXTheme.colors
    val scoreColor = when {
        score >= 80 -> colors.success
        score >= 50 -> colors.warning
        else -> colors.danger
    }
    val animatedSweep by animateFloatAsState(
        targetValue = score / 100f * 360f,
        animationSpec = tween(1200, easing = FastOutSlowInEasing),
        label = "scoreSweep",
    )

    Box(modifier = modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
            // Background track
            drawArc(
                color = scoreColor.copy(alpha = 0.12f),
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = stroke,
            )
            // Score arc
            drawArc(
                color = scoreColor,
                startAngle = -90f,
                sweepAngle = animatedSweep,
                useCenter = false,
                style = stroke,
            )
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$score",
                style = RootXTypography.displayMedium.copy(fontWeight = FontWeight.ExtraBold),
                color = scoreColor,
            )
            Text(
                text = "/ 100",
                style = RootXTypography.micro,
                color = colors.textTertiary,
            )
        }
    }
}
