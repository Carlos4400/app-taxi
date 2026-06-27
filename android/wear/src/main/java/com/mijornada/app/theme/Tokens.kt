package com.mijornada.app.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Tokens de diseno del modulo Wear OS: shapes y border widths reutilizables.
 *
 * Centralizar estos valores evita el "magic number" repetido en cada composable
 * (antes cada uno declaraba su propio `RoundedCornerShape(N.dp)`), facilita ajustes
 * globales y mejora la coherencia visual entre pantallas.
 *
 * Antes: ~25 composables declaraban shapes/widths inline, cada uno a su manera.
 * Despues: 1 sola fuente de verdad, importada por los composables en `components/`
 * y por las screens que los usan.
 *
 * Forma parte del plan PLAN_FIX_BOTONES_WEAR.md (Fase 3a).
 */
object WatchTokens {
    // Shapes por tipo de superficie
    val ButtonShape: Shape = RoundedCornerShape(14.dp)         // botones rectangulares (Accion, Plan, Sincronizar)
    val TerminarTurnoShape: Shape = RoundedCornerShape(16.dp) // boton grande de Terminar turno (mas esquinas)
    val CardShape: Shape = RoundedCornerShape(12.dp)          // tarjetas pequenas (campo metric card)
    val TileShape: Shape = RoundedCornerShape(18.dp)          // tiles grandes (resumen, notas)
    val SmallShape: Shape = RoundedCornerShape(10.dp)         // filas pequenas (notas individuales)

    // Border widths
    val ButtonBorderWidth: Dp = 2.dp      // borde de botones de accion (Terminar turno, Guardar)
    val CardBorderWidth: Dp = 1.dp        // borde por defecto de tarjetas
    val SubtleBorderWidth: Dp = 1.5.dp    // borde sutil (ConfirmDeleteButton)
}