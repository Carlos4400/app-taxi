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

/**
 * Teclado numérico in-app (estilo app del móvil): 1-9, coma decimal y 0.
 * La última celda es la tecla Guardar (✓) si se pasa [onSave]; si no, es Borrar (⌫).
 * Cabe entero en pantalla redonda sin scroll (ancho 0.72, teclas compactas).
 */
@Composable
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
    val baseRows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9")
    )
    Column(
        modifier = modifier.fillMaxWidth(widthFraction),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        baseRows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                row.forEach { key ->
                    KeyButton(key, ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey(key) }
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            KeyButton(",", ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey("0") }
            if (onSave != null) {
                SaveKey(color, saveEnabled, keyHeight, keyFontSize, Modifier.weight(1f), onSave)
            } else {
                KeyButton("DEL", color, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey("DEL") }
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
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(keyHeight)
            .clip(RoundedCornerShape(9.dp))
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

@Composable
private fun SaveKey(
    color: Color,
    enabled: Boolean,
    keyHeight: Dp,
    keyFontSize: TextUnit,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(keyHeight)
            .clip(RoundedCornerShape(9.dp))
            .background(if (enabled) color else Color(0xFF1C1C24))
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "✓",
            color = if (enabled) Color(0xFF0D0D14) else Color(0xFF4A4A4A),
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
                current.length >= 9 -> current
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
