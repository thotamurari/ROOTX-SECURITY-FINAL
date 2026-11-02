package com.rootx.security.ui.components

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

/**
 * RootXSwitch — matches the React <Switch> component row layout.
 */
@Composable
fun RootXSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "",
    description: String = "",
) {
    val colors = RootXTheme.colors

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = RootXTypography.titleSmall,
                color = colors.textPrimary,
            )
            if (description.isNotEmpty()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = description,
                    style = RootXTypography.bodySmall,
                    color = colors.textTertiary,
                )
            }
        }
        Spacer(Modifier.width(12.dp))
        ToggleThumb(checked = checked)
    }
}

@Composable
private fun ToggleThumb(checked: Boolean) {
    val colors = RootXTheme.colors
    val trackWidth = 44.dp
    val trackHeight = 24.dp
    val thumbSize = 18.dp
    val thumbPadding = 3.dp

    val thumbOffset by animateDpAsState(
        targetValue = if (checked) trackWidth - thumbSize - thumbPadding * 2 else 0.dp,
        animationSpec = tween(200),
        label = "thumbOffset",
    )

    val trackColor = if (checked) colors.accent else colors.bgSurface3

    Box(
        modifier = Modifier
            .width(trackWidth)
            .height(trackHeight)
            .clip(RoundedCornerShape(12.dp))
            .background(trackColor),
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            modifier = Modifier
                .padding(start = thumbPadding + thumbOffset)
                .size(thumbSize)
                .clip(CircleShape)
                .background(if (checked) colors.accentForeground else colors.textTertiary),
        )
    }
}
