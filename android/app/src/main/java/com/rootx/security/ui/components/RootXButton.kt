package com.rootx.security.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

/**
 * RootXButton — 1:1 match of React <Button> component.
 */
@Composable
fun RootXButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.PRIMARY,
    size: ButtonSize = ButtonSize.LARGE,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    fullWidth: Boolean = true,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
) {
    val colors = RootXTheme.colors
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val bgColor by animateColorAsState(
        targetValue = when {
            !enabled -> when (variant) {
                ButtonVariant.PRIMARY -> colors.accent.copy(alpha = 0.5f)
                ButtonVariant.SECONDARY -> colors.bgSurface2.copy(alpha = 0.5f)
                ButtonVariant.OUTLINE -> Color.Transparent
                ButtonVariant.GHOST -> Color.Transparent
                ButtonVariant.DANGER -> colors.danger.copy(alpha = 0.5f)
            }
            isPressed -> when (variant) {
                ButtonVariant.PRIMARY -> colors.accentActive
                ButtonVariant.SECONDARY -> colors.bgSurface3
                ButtonVariant.OUTLINE -> colors.bgSurface2
                ButtonVariant.GHOST -> colors.bgSurface2
                ButtonVariant.DANGER -> colors.dangerHover
            }
            else -> when (variant) {
                ButtonVariant.PRIMARY -> colors.accent
                ButtonVariant.SECONDARY -> colors.bgSurface2
                ButtonVariant.OUTLINE -> Color.Transparent
                ButtonVariant.GHOST -> Color.Transparent
                ButtonVariant.DANGER -> colors.danger
            }
        },
        label = "buttonBg"
    )

    val contentColor = when (variant) {
        ButtonVariant.PRIMARY -> colors.accentForeground
        ButtonVariant.SECONDARY -> colors.textPrimary
        ButtonVariant.OUTLINE -> colors.textPrimary
        ButtonVariant.GHOST -> colors.textSecondary
        ButtonVariant.DANGER -> Color.White
    }

    val height = when (size) {
        ButtonSize.SMALL -> 34.dp
        ButtonSize.MEDIUM -> 40.dp
        ButtonSize.LARGE -> 48.dp
    }

    val borderStroke = when (variant) {
        ButtonVariant.SECONDARY, ButtonVariant.OUTLINE -> BorderStroke(1.dp, colors.borderDefault)
        else -> null
    }

    val shape = RoundedCornerShape(10.dp)

    Box(
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
            .height(height)
            .clip(shape)
            .background(bgColor, shape)
            .then(if (borderStroke != null) Modifier.border(borderStroke, shape) else Modifier)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = enabled && !isLoading,
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(18.dp),
                color = contentColor,
                strokeWidth = 2.dp,
            )
        } else {
            Row(
                modifier = Modifier.padding(horizontal = if (fullWidth) 16.dp else 14.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (leadingIcon != null) {
                    leadingIcon()
                    Spacer(Modifier.width(8.dp))
                }
                Text(
                    text = text,
                    style = RootXTypography.labelLarge.copy(
                        fontSize = if (size == ButtonSize.LARGE) 14.sp else 13.sp,
                        fontWeight = FontWeight.SemiBold
                    ),
                    color = contentColor,
                )
                if (trailingIcon != null) {
                    Spacer(Modifier.width(8.dp))
                    trailingIcon()
                }
            }
        }
    }
}

enum class ButtonVariant { PRIMARY, SECONDARY, OUTLINE, GHOST, DANGER }
enum class ButtonSize { SMALL, MEDIUM, LARGE }
