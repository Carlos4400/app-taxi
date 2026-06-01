package com.mijornada.app.theme

import androidx.compose.runtime.Composable
import androidx.wear.compose.material.Colors
import androidx.wear.compose.material.MaterialTheme

private val WearColorPalette = Colors(
    primary = ColorPropina,
    primaryVariant = ColorPropinaBg,
    secondary = ColorDatafono,
    background = ColorBackground,
    onPrimary = ColorBackground,
    onSecondary = ColorBackground,
    onBackground = ColorWhite
)

@Composable
fun WearAppTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colors = WearColorPalette,
        typography = WearTypography,
        content = content
    )
}
