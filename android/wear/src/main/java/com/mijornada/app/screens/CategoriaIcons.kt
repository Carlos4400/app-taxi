package com.mijornada.app.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.ColorWhite

/**
 * Iconos de categoría recreados de la app del móvil (entry-icons.tsx), dibujados
 * en un viewBox virtual de 24x24 y escalados al tamaño pedido.
 */
@Composable
fun CategoriaIcon(type: String, color: Color, size: Dp) {
    Box(modifier = Modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(size)) {
            val u = this.size.minDimension / 24f
            val sw = 1.8f * u
            fun off(x: Float, y: Float) = Offset(x * u, y * u)
            when (type) {
                "propina" -> {
                    drawCircle(color, radius = 9f * u, center = off(12f, 12f), style = Stroke(sw))
                }
                "datafono" -> {
                    drawRoundRect(color, topLeft = off(3f, 6f), size = Size(18f * u, 13f * u), cornerRadius = CornerRadius(2.5f * u, 2.5f * u), style = Stroke(sw))
                    drawRoundRect(color.copy(alpha = 0.35f), topLeft = off(3f, 10f), size = Size(18f * u, 3.5f * u))
                    drawRoundRect(color, topLeft = off(6f, 15.5f), size = Size(5f * u, 1.5f * u), cornerRadius = CornerRadius(0.75f * u, 0.75f * u))
                }
                "agencia_bono" -> {
                    val techo = Path().apply {
                        moveTo(4f * u, 20f * u); lineTo(4f * u, 9f * u); lineTo(12f * u, 4f * u); lineTo(20f * u, 9f * u); lineTo(20f * u, 20f * u)
                    }
                    drawPath(techo, color, style = Stroke(sw))
                    val puerta = Path().apply {
                        moveTo(9f * u, 20f * u); lineTo(9f * u, 14f * u); lineTo(15f * u, 14f * u); lineTo(15f * u, 20f * u)
                    }
                    drawPath(puerta, color, style = Stroke(sw))
                    drawLine(color, off(3f, 20f), off(21f, 20f), strokeWidth = sw, cap = StrokeCap.Round)
                }
                "extra" -> {
                    drawCircle(color.copy(alpha = 0.5f), radius = 9f * u, center = off(12f, 12f), style = Stroke(1.6f * u))
                    drawLine(color, off(12f, 4f), off(12f, 20f), strokeWidth = 2f * u, cap = StrokeCap.Round)
                    drawLine(color, off(4f, 12f), off(20f, 12f), strokeWidth = 2f * u, cap = StrokeCap.Round)
                }
                "gasolina" -> {
                    drawRoundRect(color, topLeft = off(4f, 5f), size = Size(11.5f * u, 15f * u), cornerRadius = CornerRadius(2f * u, 2f * u), style = Stroke(sw))
                    val manguera = Path().apply {
                        moveTo(15.5f * u, 9f * u); lineTo(19f * u, 7f * u); lineTo(19f * u, 17f * u); lineTo(15.5f * u, 15f * u)
                    }
                    drawPath(manguera, color, style = Stroke(sw))
                    drawRoundRect(color.copy(alpha = 0.4f), topLeft = off(7f, 8f), size = Size(5.5f * u, 4.5f * u), cornerRadius = CornerRadius(1f * u, 1f * u))
                }
                "nulo" -> {
                    drawCircle(color, radius = 9f * u, center = off(12f, 12f), style = Stroke(sw))
                    drawLine(color, off(6f, 18f), off(18f, 6f), strokeWidth = sw, cap = StrokeCap.Round)
                }
                "nota" -> {
                    drawLine(color, off(6f, 18f), off(16f, 8f), strokeWidth = 2f * u, cap = StrokeCap.Round)
                    drawLine(color, off(16f, 8f), off(18f, 10f), strokeWidth = 2f * u, cap = StrokeCap.Round)
                    drawLine(color, off(6f, 18f), off(8f, 16f), strokeWidth = 2f * u, cap = StrokeCap.Round)
                }
            }
        }
        if (type == "propina") {
            Text("€", color = color, fontSize = (size.value * 0.46f).sp, fontWeight = FontWeight.Bold)
        }
    }
}
