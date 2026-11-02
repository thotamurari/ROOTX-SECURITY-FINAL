package com.rootx.security.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rootx.security.ui.theme.RootXTheme
import com.rootx.security.ui.theme.RootXTypography

/**
 * RootXField — 1:1 match of the React <Field> component.
 */
@Composable
fun RootXField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    label: String? = null,
    isPassword: Boolean = false,
    singleLine: Boolean = true,
    enabled: Boolean = true,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingIcon: @Composable (() -> Unit)? = null,
    error: String? = null,
) {
    val colors = RootXTheme.colors
    var isFocused by remember { mutableStateOf(false) }
    val shape = RoundedCornerShape(10.dp)

    val borderColor = when {
        error != null -> colors.danger
        isFocused -> colors.accent
        else -> colors.borderDefault
    }

    Column(modifier = modifier.fillMaxWidth()) {
        if (label != null) {
            Text(
                text = label.uppercase(),
                style = RootXTypography.labelSmall.copy(
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.8.sp
                ),
                color = colors.textTertiary,
                modifier = Modifier.padding(start = 2.dp, bottom = 6.dp),
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .clip(shape)
                .background(colors.bgSurface2, shape)
                .border(
                    width = if (isFocused || error != null) 1.5.dp else 1.dp,
                    color = borderColor,
                    shape = shape
                )
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (leadingIcon != null) {
                Box(
                    modifier = Modifier.size(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    leadingIcon()
                }
                Spacer(Modifier.width(10.dp))
            }

            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .weight(1f)
                    .onFocusChanged { isFocused = it.isFocused },
                textStyle = RootXTypography.bodyLarge.copy(color = colors.textPrimary),
                singleLine = singleLine,
                enabled = enabled,
                visualTransformation = if (isPassword) PasswordVisualTransformation() else VisualTransformation.None,
                cursorBrush = SolidColor(colors.accent),
                decorationBox = { innerTextField ->
                    Box(contentAlignment = Alignment.CenterStart) {
                        if (value.isEmpty()) {
                            Text(
                                text = placeholder,
                                style = RootXTypography.bodyLarge,
                                color = colors.textTertiary,
                            )
                        }
                        innerTextField()
                    }
                },
            )

            if (trailingIcon != null) {
                Spacer(Modifier.width(10.dp))
                Box(
                    modifier = Modifier.size(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    trailingIcon()
                }
            }
        }

        if (error != null) {
            Text(
                text = error,
                style = RootXTypography.labelSmall.copy(fontSize = 12.sp),
                color = colors.danger,
                modifier = Modifier.padding(top = 4.dp, start = 2.dp),
            )
        }
    }
}
