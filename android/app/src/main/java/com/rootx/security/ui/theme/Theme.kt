package com.rootx.security.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf

private val LocalRootXColors = staticCompositionLocalOf { DarkColorScheme }

/**
 * RootXTheme — wraps all app content and provides [RootXColorScheme]
 * tokens via [RootXTheme.colors].  Dark is the default, matching the
 * web app's default behaviour.
 */
@Composable
fun RootXTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColorScheme else LightColorScheme

    CompositionLocalProvider(LocalRootXColors provides colors) {
        content()
    }
}

/** Accessor for design tokens — usage: `RootXTheme.colors.accent` */
object RootXTheme {
    val colors: RootXColorScheme
        @Composable
        @ReadOnlyComposable
        get() = LocalRootXColors.current
}
