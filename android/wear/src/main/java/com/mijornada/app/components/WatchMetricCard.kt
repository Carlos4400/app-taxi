package com.mijornada.app.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.mijornada.app.theme.WatchTokens

/**
 * Tarjeta metrica clickable del modulo Wear OS. Encapsula el patron robusto:
 *
 *   modifier = background(color, shape) -> border(shape) -> alpha -> clip(shape) -> clickable -> padding
 *
 * Pensada para tarjetas con estado activo (por ejemplo, cuando un campo esta
 * focused) y deshabilitado (cuando hay operacion pendiente). El borde se atenua
 * al 50% de alpha cuando NO esta activa, para indicar visualmente el cambio
 * de estado.
 *
 * Usado por TarjetaCategoria (migrada parcialmente el 2026-06-26) y CampoCierre
 * de EndTurnoScreen. La migracion completa se hace en Commit 10 (ActiveTurnoScreen).
 *
 * Forma parte del plan PLAN_FIX_BOTONES_WEAR.md (Fase 3d).
 */
@Composable
fun WatchMetricCard(
    backgroundColor: Color,
    borderColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    active: Boolean = false,
    shape: Shape = WatchTokens.CardShape,
    borderWidth: Dp = WatchTokens.CardBorderWidth,
    contentPadding: PaddingValues = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
    onClick: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    val effectiveBorderColor = if (active) borderColor else borderColor.copy(alpha = 0.5f)

    Column(
        modifier = modifier
            .background(backgroundColor, shape)
            .border(borderWidth, effectiveBorderColor, shape)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)
            .clickable(enabled = enabled) { onClick() }
            .padding(contentPadding),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        content()
    }
}