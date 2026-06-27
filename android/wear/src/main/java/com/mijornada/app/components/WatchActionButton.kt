package com.mijornada.app.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.ColorDisabledText
import com.mijornada.app.theme.WatchTokens

/**
 * Boton primario del modulo Wear OS. Encapsula el patron robusto para pintar
 * fondo con forma:
 *
 *   modifier = background(color, shape) -> border(shape) -> alpha -> clip(shape) -> clickable -> padding
 *
 * El patron fragil (clip antes que background sin shape) hace que tras una
 * recomposicion con alpha < 1, el clip "suelte" el fondo y el boton se quede
 * sin pintar (ver CAMBIOS_AGENT1.md, entrada 2026-06-26 05:50, y PLAN_FIX_BOTONES_WEAR.md).
 *
 * Patron verificado contra la documentacion oficial de Compose Foundation:
 * `Modifier.background(color, shape)` es la API canonica para pintar fondo
 * con forma de manera robusta, sin depender del `clip`.
 *
 * Usado por:
 * - ActiveTurnoScreen: 3 botones grandes (Anadir nota, Pausar turno, Terminar turno).
 * - ActiveTurnoScreen: PausedTurnoContent (icono pausa + boton "Continuar Turno").
 * - EndTurnoScreen: los 3 usos de BotonPlano (Terminar Turno, Cancelar, Guardar).
 * - WearMainActivity: ConfirmDeleteButton (overlay de borrado).
 *
 * Forma parte del plan PLAN_FIX_BOTONES_WEAR.md (Fase 3b).
 */
@Composable
fun WatchActionButton(
    label: String,
    textColor: Color,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    borderColor: Color? = null,
    borderWidth: Dp = WatchTokens.ButtonBorderWidth,
    shape: Shape = WatchTokens.ButtonShape,
    fontSize: Int = 12,
    contentPadding: PaddingValues = PaddingValues(vertical = 10.dp),
    leadingIcon: (@Composable () -> Unit)? = null,
    onClick: () -> Unit
) {
    // El borde se atenua al color disabled cuando enabled = false (mismo criterio que BotonPlano).
    val effectiveBorderColor = if (enabled) borderColor else borderColor?.let { ColorDisabledText }
    val borderMod = if (effectiveBorderColor != null) {
        Modifier.border(borderWidth, effectiveBorderColor, shape)
    } else Modifier

    Box(
        modifier = Modifier
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .then(modifier)
            .background(backgroundColor, shape)   // <-- patron correcto: background CON shape primero
            .then(borderMod)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)                         // <-- clip al final, solo recorta el ripple del clickable
            .clickable(enabled = enabled, role = Role.Button) { onClick() }
            .padding(contentPadding),
        contentAlignment = Alignment.Center
    ) {
        if (leadingIcon != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                leadingIcon()
                Spacer(Modifier.width(7.dp))
                Text(
                    text = label,
                    color = if (enabled) textColor else ColorDisabledText,
                    fontSize = fontSize.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Text(
                text = label,
                color = if (enabled) textColor else ColorDisabledText,
                fontSize = fontSize.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
