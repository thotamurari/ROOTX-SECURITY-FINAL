package com.rootx.security.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rootx.security.ui.theme.RootXTheme

/**
 * RootXCard — the glass-card pattern from the web app.
 * bgSurface background + borderSubtle border + shadow.
 */
@Composable
fun RootXCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    padding: Dp = 16.dp,
    cornerRadius: Dp = 14.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = RootXTheme.colors
    val shape = RoundedCornerShape(cornerRadius)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .shadow(2.dp, shape, clip = false, ambientColor = colors.bgBase, spotColor = colors.bgBase)
            .clip(shape)
            .background(colors.bgSurface, shape)
            .border(1.dp, colors.borderSubtle, shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(padding),
        content = content,
    )
}

@Composable
fun RootXCardNoPadding(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    cornerRadius: Dp = 14.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = RootXTheme.colors
    val shape = RoundedCornerShape(cornerRadius)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .shadow(2.dp, shape, clip = false, ambientColor = colors.bgBase, spotColor = colors.bgBase)
            .clip(shape)
            .background(colors.bgSurface, shape)
            .border(1.dp, colors.borderSubtle, shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        content = content,
    )
}
