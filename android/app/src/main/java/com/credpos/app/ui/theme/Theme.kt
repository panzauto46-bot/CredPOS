package com.credpos.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Primary Colors
val TezosBlue = Color(0xFF2C7DF7)
val TezosBlueLight = Color(0xFF64A7FF)
val TezosGreen = Color(0xFF00D1B2)

val SuiPurple = Color(0xFF6FBCF0)
val SuiPurpleLight = Color(0xFFA5D8FF)
val SuiBlue = Color(0xFF4DA2FF)

// Neutral Colors
val DarkBackground = Color(0xFF0D1117)
val DarkSurface = Color(0xFF161B22)
val DarkCard = Color(0xFF21262D)
val DarkBorder = Color(0xFF30363D)

val LightBackground = Color(0xFFFAFBFC)
val LightSurface = Color(0xFFFFFFFF)
val LightCard = Color(0xFFF3F4F6)
val LightBorder = Color(0xFFE1E4E8)

// Status Colors
val SuccessGreen = Color(0xFF2DA44E)
val WarningAmber = Color(0xFFF7B955)
val ErrorRed = Color(0xFFCF6679)
val InfoBlue = Color(0xFF58A6FF)

// Text Colors
val TextPrimary = Color(0xFFF0F6FC)
val TextSecondary = Color(0xFF8B949E)
val TextTertiary = Color(0xFF6E7681)

private val DarkColorScheme = darkColorScheme(
    primary = TezosBlue,
    onPrimary = Color.White,
    primaryContainer = TezosBlueLight,
    onPrimaryContainer = Color.White,
    secondary = SuiPurple,
    onSecondary = Color.White,
    secondaryContainer = SuiPurpleLight,
    onSecondaryContainer = Color.Black,
    tertiary = TezosGreen,
    onTertiary = Color.Black,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = TextSecondary,
    error = ErrorRed,
    onError = Color.White,
    outline = DarkBorder
)

private val LightColorScheme = lightColorScheme(
    primary = TezosBlue,
    onPrimary = Color.White,
    primaryContainer = TezosBlueLight,
    onPrimaryContainer = Color.Black,
    secondary = SuiBlue,
    onSecondary = Color.White,
    secondaryContainer = SuiPurpleLight,
    onSecondaryContainer = Color.Black,
    tertiary = TezosGreen,
    onTertiary = Color.Black,
    background = LightBackground,
    onBackground = Color.Black,
    surface = LightSurface,
    onSurface = Color.Black,
    surfaceVariant = LightCard,
    onSurfaceVariant = Color.DarkGray,
    error = ErrorRed,
    onError = Color.White,
    outline = LightBorder
)

@Composable
fun CredPOSTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
