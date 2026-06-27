package com.mijornada.app.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.mijornada.app.theme.WatchTokens

/**
 * Caja decorativa (no interactiva) del modulo Wear OS. Encapsula el patron
 * robusto para tiles y tarjetas estaticas:
 *
 *   modifier = background(color, shape) -> border(shape) -> padding
 *
 * Usado por tiles que NO son clickables: ResumenHoyCard, ResumenCategoriaCard,
 * NotaTurnoRow, NotaDetalladaRow, SyncIndicator. El clip no aparece aqui
 * porque no hay clickable (no hay ripple que recortar).
 *
 * Forma parte del plan PLAN_FIX_BOTONES_WEAR.md (Fase 3c).
 */
@Composable
fun WatchTileBox(
    modifier: Modifier = Modifier,
    backgroundColor: Color,
    shape: Shape = WatchTokens.TileShape,
    borderColor: Color? = null,
    borderWidth: Dp = WatchTokens.CardBorderWidth,
    contentPadding: PaddingValues = PaddingValues(horizontal = 10.dp, vertical = 9.dp),
    horizontalAlignment: Alignment.Horizontal = Alignment.Start,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable ColumnScope.() -> Unit
) {
    val borderMod = if (borderColor != null) {
        Modifier.border(borderWidth, borderColor, shape)
    } else Modifier

    Column(
        modifier = modifier
            .background(backgroundColor, shape)
            .then(borderMod)
            .padding(contentPadding),
        horizontalAlignment = horizontalAlignment,
        verticalArrangement = verticalArrangement
    ) {
        content()
    }
}
