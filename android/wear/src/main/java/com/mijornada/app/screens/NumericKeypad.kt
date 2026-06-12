package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.ColorWhite

private const val MAX_AMOUNT_LENGTH = 9

/**
 * Teclado numérico in-app (estilo app del móvil): 1-9, coma decimal y 0.
 * La última fila mantiene el orden de la app móvil: borrar, 0 y coma.
 * Cabe entero en pantalla redonda sin scroll (ancho 0.72, teclas compactas).
 */
@Composable
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
    val rows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9"),
        listOf("DEL", "0", ",")
    )
    Column(
        modifier = modifier.fillMaxWidth(widthFraction),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                row.forEach { key ->
                    val keyColor = if (key == "DEL") color else ColorWhite
                    KeyButton(
                        label = key,
                        color = keyColor,
                        keyHeight = keyHeight,
                        keyFontSize = keyFontSize,
                        modifier = Modifier.weight(1f)
                    ) { onKey(key) }
                }
            }
        }
    }
}

/**
 * Teclado para pantallas de cierre a círculo completo: cada fila se estrecha
 * según la cuerda del círculo a su altura (las filas centrales aprovechan más
 * ancho que la primera y la última). Las teclas son píldoras altas, pensadas
 * para tamaños proporcionales al diámetro (keyHeight ≈ 10.5% del diámetro).
 */
@Composable
fun NumericKeypadRedondo(
    onKey: (String) -> Unit,
    color: Color,
    keyHeight: Dp,
    keyFontSize: TextUnit,
    rowSpacing: Dp,
    anchosFilas: List<Float> = listOf(0.78f, 0.84f, 0.84f, 0.78f),
    modifier: Modifier = Modifier
) {
    val rows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9"),
        listOf("DEL", "0", ",")
    )
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(rowSpacing),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        rows.forEachIndexed { i, row ->
            Row(
                modifier = Modifier.fillMaxWidth(anchosFilas.getOrElse(i) { 0.8f }),
                horizontalArrangement = Arrangement.spacedBy(rowSpacing)
            ) {
                row.forEach { key ->
                    KeyButton(
                        label = key,
                        color = color,
                        keyHeight = keyHeight,
                        keyFontSize = keyFontSize,
                        cornerRadius = keyHeight / 2,
                        modifier = Modifier.weight(1f)
                    ) { onKey(key) }
                }
            }
        }
    }
}

@Composable
private fun KeyButton(
    label: String,
    color: Color,
    keyHeight: Dp,
    keyFontSize: TextUnit,
    cornerRadius: Dp = 9.dp,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(keyHeight)
            .clip(RoundedCornerShape(cornerRadius))
            .background(Color(0xFF1C1C24))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (label == "DEL") "⌫" else label,
            color = if (label == "DEL") color else ColorWhite,
            fontSize = keyFontSize,
            fontWeight = FontWeight.Bold
        )
    }
}

/**
 * Aplica una tecla al importe en curso (texto, ej. "12,50").
 * Limita a 2 decimales y evita ceros a la izquierda.
 */
fun applyKey(current: String, key: String): String {
    return when (key) {
        "DEL" -> if (current.isNotEmpty()) current.dropLast(1) else current
        "," -> when {
            current.contains(",") -> current
            current.isEmpty() -> "0,"
            else -> "$current,"
        }
        else -> {
            val commaIdx = current.indexOf(",")
            when {
                commaIdx >= 0 && current.length - commaIdx > 2 -> current
                current == "0" -> key
                current.length >= MAX_AMOUNT_LENGTH -> current
                else -> current + key
            }
        }
    }
}

/** Convierte el texto del importe a Double. "" o "0," -> 0.0 */
fun parseAmount(text: String): Double =
    text.replace(",", ".").trimEnd('.').toDoubleOrNull() ?: 0.0

/** Convierte un Double a texto editable del teclado (coma decimal, sin ceros sobrantes). */
fun amountToText(v: Double): String {
    if (v <= 0.0) return ""
    if (v == v.toLong().toDouble()) return v.toLong().toString()
    return java.util.Locale("es", "ES").let {
        String.format(it, "%.2f", v).trimEnd('0').trimEnd(',')
    }
}
