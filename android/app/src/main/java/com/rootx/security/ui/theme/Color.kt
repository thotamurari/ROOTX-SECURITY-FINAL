package com.rootx.security.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * RootX design tokens — exact 1:1 match of the CSS variables in index.css.
 * Every token has a dark variant (default) and a light variant.
 */
object RootXColors {

    // ── Dark theme ──
    val DarkBgBase        = Color(0xFF0A0B0D)
    val DarkBgSurface     = Color(0xFF131417)
    val DarkBgSurface2    = Color(0xFF1A1C21)
    val DarkBgSurface3    = Color(0xFF22252B)
    val DarkBgOverlay     = Color(0xB8060709) // ~72% opacity

    val DarkTextPrimary   = Color(0xFFF5F6F7)
    val DarkTextSecondary = Color(0xFF9CA3AF)
    val DarkTextTertiary  = Color(0xFF6B7280)

    val DarkBorderSubtle  = Color(0x0FFFFFFF) // ~6% white
    val DarkBorderDefault = Color(0x1AFFFFFF) // ~10% white
    val DarkBorderStrong  = Color(0x29FFFFFF) // ~16% white

    val DarkAccent           = Color(0xFF3B82F6)
    val DarkAccentHover      = Color(0xFF2563EB)
    val DarkAccentActive     = Color(0xFF1D4ED8)
    val DarkAccentSoft       = Color(0x243B82F6) // ~14% accent
    val DarkAccentSoftStrong = Color(0x3D3B82F6) // ~24% accent
    val DarkAccentForeground = Color(0xFFFFFFFF)

    val DarkSuccess     = Color(0xFF22C55E)
    val DarkSuccessSoft = Color(0x2422C55E)
    val DarkWarning     = Color(0xFFF59E0B)
    val DarkWarningSoft = Color(0x24F59E0B)
    val DarkDanger      = Color(0xFFF5473D)
    val DarkDangerHover = Color(0xFFDC352B)
    val DarkDangerSoft  = Color(0x24F5473D)
    val DarkInfo        = Color(0xFF38BDF8)
    val DarkInfoSoft    = Color(0x2438BDF8)

    // ── Light theme ──
    val LightBgBase        = Color(0xFFF6F7F9)
    val LightBgSurface     = Color(0xFFFFFFFF)
    val LightBgSurface2    = Color(0xFFF1F3F6)
    val LightBgSurface3    = Color(0xFFE7E9EE)
    val LightBgOverlay     = Color(0x730F172A) // ~45%

    val LightTextPrimary   = Color(0xFF0F172A)
    val LightTextSecondary = Color(0xFF475569)
    val LightTextTertiary  = Color(0xFF94A3B8)

    val LightBorderSubtle  = Color(0x0F0F172A)
    val LightBorderDefault = Color(0x1A0F172A)
    val LightBorderStrong  = Color(0x2E0F172A)

    val LightAccent           = Color(0xFF2563EB)
    val LightAccentHover      = Color(0xFF1D4ED8)
    val LightAccentActive     = Color(0xFF1E40AF)
    val LightAccentSoft       = Color(0x1A2563EB)
    val LightAccentSoftStrong = Color(0x2E2563EB)
    val LightAccentForeground = Color(0xFFFFFFFF)

    val LightSuccess     = Color(0xFF16A34A)
    val LightSuccessSoft = Color(0x1A16A34A)
    val LightWarning     = Color(0xFFD97706)
    val LightWarningSoft = Color(0x1AD97706)
    val LightDanger      = Color(0xFFDC2626)
    val LightDangerHover = Color(0xFFB91C1C)
    val LightDangerSoft  = Color(0x1ADC2626)
    val LightInfo        = Color(0xFF0284C7)
    val LightInfoSoft    = Color(0x1A0284C7)
}

/** Immutable color scheme consumed by composables via RootXTheme.colors */
data class RootXColorScheme(
    val bgBase: Color,
    val bgSurface: Color,
    val bgSurface2: Color,
    val bgSurface3: Color,
    val bgOverlay: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textTertiary: Color,
    val borderSubtle: Color,
    val borderDefault: Color,
    val borderStrong: Color,
    val accent: Color,
    val accentHover: Color,
    val accentActive: Color,
    val accentSoft: Color,
    val accentSoftStrong: Color,
    val accentForeground: Color,
    val success: Color,
    val successSoft: Color,
    val warning: Color,
    val warningSoft: Color,
    val danger: Color,
    val dangerHover: Color,
    val dangerSoft: Color,
    val info: Color,
    val infoSoft: Color,
)

val DarkColorScheme = RootXColorScheme(
    bgBase = RootXColors.DarkBgBase,
    bgSurface = RootXColors.DarkBgSurface,
    bgSurface2 = RootXColors.DarkBgSurface2,
    bgSurface3 = RootXColors.DarkBgSurface3,
    bgOverlay = RootXColors.DarkBgOverlay,
    textPrimary = RootXColors.DarkTextPrimary,
    textSecondary = RootXColors.DarkTextSecondary,
    textTertiary = RootXColors.DarkTextTertiary,
    borderSubtle = RootXColors.DarkBorderSubtle,
    borderDefault = RootXColors.DarkBorderDefault,
    borderStrong = RootXColors.DarkBorderStrong,
    accent = RootXColors.DarkAccent,
    accentHover = RootXColors.DarkAccentHover,
    accentActive = RootXColors.DarkAccentActive,
    accentSoft = RootXColors.DarkAccentSoft,
    accentSoftStrong = RootXColors.DarkAccentSoftStrong,
    accentForeground = RootXColors.DarkAccentForeground,
    success = RootXColors.DarkSuccess,
    successSoft = RootXColors.DarkSuccessSoft,
    warning = RootXColors.DarkWarning,
    warningSoft = RootXColors.DarkWarningSoft,
    danger = RootXColors.DarkDanger,
    dangerHover = RootXColors.DarkDangerHover,
    dangerSoft = RootXColors.DarkDangerSoft,
    info = RootXColors.DarkInfo,
    infoSoft = RootXColors.DarkInfoSoft,
)

val LightColorScheme = RootXColorScheme(
    bgBase = RootXColors.LightBgBase,
    bgSurface = RootXColors.LightBgSurface,
    bgSurface2 = RootXColors.LightBgSurface2,
    bgSurface3 = RootXColors.LightBgSurface3,
    bgOverlay = RootXColors.LightBgOverlay,
    textPrimary = RootXColors.LightTextPrimary,
    textSecondary = RootXColors.LightTextSecondary,
    textTertiary = RootXColors.LightTextTertiary,
    borderSubtle = RootXColors.LightBorderSubtle,
    borderDefault = RootXColors.LightBorderDefault,
    borderStrong = RootXColors.LightBorderStrong,
    accent = RootXColors.LightAccent,
    accentHover = RootXColors.LightAccentHover,
    accentActive = RootXColors.LightAccentActive,
    accentSoft = RootXColors.LightAccentSoft,
    accentSoftStrong = RootXColors.LightAccentSoftStrong,
    accentForeground = RootXColors.LightAccentForeground,
    success = RootXColors.LightSuccess,
    successSoft = RootXColors.LightSuccessSoft,
    warning = RootXColors.LightWarning,
    warningSoft = RootXColors.LightWarningSoft,
    danger = RootXColors.LightDanger,
    dangerHover = RootXColors.LightDangerHover,
    dangerSoft = RootXColors.LightDangerSoft,
    info = RootXColors.LightInfo,
    infoSoft = RootXColors.LightInfoSoft,
)
