package com.mijornada.app.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
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

/**
 * Iconos de las tarjetas de métricas, calcados trazo a trazo de los SVG de la
 * app móvil (IconTaxiBadgeNeon, IconMoneyBag, IconRoad, IconTimer, IconReceipt,
 * IconGive) sobre el mismo viewBox virtual 24x24 que CategoriaIcon.
 */
@Composable
fun MetricIcon(type: String, color: Color, size: Dp) {
    Box(modifier = Modifier.size(size), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.size(size)) {
            val u = this.size.minDimension / 24f
            val sw = 1.8f * u
            fun off(x: Float, y: Float) = Offset(x * u, y * u)
            when (type) {
                "taximetro" -> {
                    // IconTaxiBadgeNeon: placa de techo TAXI, escala 1.4 desde el centro.
                    fun s14(v: Float) = (12f + (v - 12f) * 1.4f) * u
                    val asa = Path().apply {
                        moveTo(s14(9.4f), s14(9.05f)); lineTo(s14(9.4f), s14(8.2f))
                        cubicTo(s14(9.4f), s14(7.51f), s14(9.96f), s14(6.95f), s14(10.65f), s14(6.95f))
                        lineTo(s14(13.35f), s14(6.95f))
                        cubicTo(s14(14.04f), s14(6.95f), s14(14.6f), s14(7.51f), s14(14.6f), s14(8.2f))
                        lineTo(s14(14.6f), s14(9.05f))
                    }
                    drawPath(asa, color, style = Stroke(1.6f * u * 1.0f, cap = StrokeCap.Round))
                    val alas = Path().apply {
                        moveTo(s14(10.65f), s14(9.05f)); lineTo(s14(9.5f), s14(6.2f))
                        cubicTo(s14(9.35f), s14(5.6f), s14(9.8f), s14(5f), s14(10.4f), s14(5f))
                        lineTo(s14(13.6f), s14(5f))
                        cubicTo(s14(14.2f), s14(5f), s14(14.65f), s14(5.6f), s14(14.5f), s14(6.2f))
                        lineTo(s14(13.35f), s14(9.05f))
                    }
                    drawPath(alas, color, style = Stroke(1.6f * u, cap = StrokeCap.Round))
                    val placa = Path().apply {
                        moveTo(s14(6.75f), s14(9.05f)); lineTo(s14(17.25f), s14(9.05f))
                        cubicTo(s14(17.84f), s14(9.05f), s14(18.34f), s14(9.47f), s14(18.45f), s14(10.04f))
                        lineTo(s14(19.18f), s14(13.96f))
                        cubicTo(s14(19.36f), s14(14.92f), s14(18.62f), s14(15.8f), s14(17.64f), s14(15.8f))
                        lineTo(s14(6.36f), s14(15.8f))
                        cubicTo(s14(5.38f), s14(15.8f), s14(4.64f), s14(14.92f), s14(4.82f), s14(13.96f))
                        lineTo(s14(5.55f), s14(10.04f))
                        cubicTo(s14(5.66f), s14(9.47f), s14(6.16f), s14(9.05f), s14(6.75f), s14(9.05f))
                        close()
                    }
                    drawPath(placa, color, style = Stroke(1.7f * u))
                }
                "ganancia" -> {
                    // IconMoneyBag: saco con lazo, símbolo S y destellos laterales.
                    drawCircle(color, radius = 1f * u, center = off(3.5f, 10.5f))
                    drawCircle(color, radius = 0.8f * u, center = off(2f, 13.5f))
                    drawCircle(color, radius = 1f * u, center = off(20.5f, 10.5f))
                    drawCircle(color, radius = 0.8f * u, center = off(22f, 13.5f))
                    val lazo = Path().apply {
                        moveTo(8f * u, 8f * u); lineTo(6.5f * u, 4f * u)
                        quadraticBezierTo(9f * u, 6f * u, 12f * u, 3f * u)
                        quadraticBezierTo(15f * u, 6f * u, 17.5f * u, 4f * u)
                        lineTo(16f * u, 8f * u)
                    }
                    drawPath(lazo, color, style = Stroke(sw, cap = StrokeCap.Round))
                    drawRoundRect(color, topLeft = off(8f, 8f), size = Size(8f * u, 2.5f * u), cornerRadius = CornerRadius(1f * u, 1f * u), style = Stroke(sw))
                    val cuerpo = Path().apply {
                        moveTo(8.5f * u, 10.5f * u)
                        cubicTo(4f * u, 12f * u, 2.5f * u, 17.5f * u, 6f * u, 20.5f * u)
                        cubicTo(8f * u, 22.5f * u, 16f * u, 22.5f * u, 18f * u, 20.5f * u)
                        cubicTo(21.5f * u, 17.5f * u, 20f * u, 12f * u, 15.5f * u, 10.5f * u)
                    }
                    drawPath(cuerpo, color, style = Stroke(sw, cap = StrokeCap.Round))
                    drawLine(color, off(12f, 12f), off(12f, 20f), strokeWidth = sw, cap = StrokeCap.Round)
                    val ese = Path().apply {
                        moveTo(14f * u, 13.5f * u)
                        cubicTo(14f * u, 12f * u, 10f * u, 12f * u, 10f * u, 14f * u)
                        cubicTo(10f * u, 16f * u, 14f * u, 16f * u, 14f * u, 18f * u)
                        cubicTo(14f * u, 20f * u, 10f * u, 20f * u, 10f * u, 18.5f * u)
                    }
                    drawPath(ese, color, style = Stroke(sw, cap = StrokeCap.Round))
                }
                "km" -> {
                    // IconRoad: bordes anchos + discontinua central.
                    drawLine(color, off(3f, 22f), off(9f, 2f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(color, off(21f, 22f), off(15f, 2f), strokeWidth = sw, cap = StrokeCap.Round)
                    val c = color.copy(alpha = 0.6f)
                    drawLine(c, off(12f, 22f), off(12f, 18f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(c, off(12f, 14f), off(12f, 10f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(c, off(12f, 6f), off(12f, 2f), strokeWidth = sw, cap = StrokeCap.Round)
                }
                "tiempo" -> {
                    // IconTimer: esfera abierta, corona, aguja y puntos.
                    drawArc(color, startAngle = -90f, sweepAngle = 339f, useCenter = false, topLeft = off(4f, 5f), size = Size(16f * u, 16f * u), style = Stroke(sw, cap = StrokeCap.Round))
                    drawLine(color, off(12f, 2f), off(12f, 5f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(color, off(10f, 2f), off(14f, 2f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(color, off(12f, 13f), off(15.5f, 8.5f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawCircle(color, radius = 1.2f * u, center = off(12f, 13f))
                    drawCircle(color.copy(alpha = 0.6f), radius = 1f * u, center = off(17.5f, 8.5f))
                }
                "descontar" -> {
                    // IconReceipt: recibo con borde inferior dentado y líneas.
                    val recibo = Path().apply {
                        moveTo(4.5f * u, 21f * u); lineTo(4.5f * u, 3f * u)
                        cubicTo(4.5f * u, 2.45f * u, 4.95f * u, 2f * u, 5.5f * u, 2f * u)
                        lineTo(18.5f * u, 2f * u)
                        cubicTo(19.05f * u, 2f * u, 19.5f * u, 2.45f * u, 19.5f * u, 3f * u)
                        lineTo(19.5f * u, 21f * u)
                        lineTo(15.75f * u, 19.5f * u); lineTo(12f * u, 21f * u)
                        lineTo(8.25f * u, 19.5f * u); close()
                    }
                    drawPath(recibo, color, style = Stroke(sw, cap = StrokeCap.Round))
                    drawLine(color, off(8f, 7f), off(16f, 7f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(color, off(8f, 11f), off(16f, 11f), strokeWidth = sw, cap = StrokeCap.Round)
                    drawLine(color, off(8f, 15f), off(13f, 15f), strokeWidth = sw, cap = StrokeCap.Round)
                }
                "dar" -> {
                    // IconGive: maletín con asa (el € lo superpone el Text).
                    val asa = Path().apply {
                        moveTo(8f * u, 8f * u); lineTo(8f * u, 5.5f * u)
                        cubicTo(8f * u, 4.67f * u, 8.67f * u, 4f * u, 9.5f * u, 4f * u)
                        lineTo(14.5f * u, 4f * u)
                        cubicTo(15.33f * u, 4f * u, 16f * u, 4.67f * u, 16f * u, 5.5f * u)
                        lineTo(16f * u, 8f * u)
                    }
                    drawPath(asa, color, style = Stroke(sw, cap = StrokeCap.Round))
                    val cuerpo = Path().apply {
                        moveTo(4.5f * u, 8f * u); lineTo(19.5f * u, 8f * u)
                        cubicTo(20.6f * u, 8f * u, 21.5f * u, 8.9f * u, 21.5f * u, 10f * u)
                        lineTo(21.5f * u, 18.5f * u)
                        cubicTo(21.5f * u, 19.9f * u, 20.4f * u, 21f * u, 19f * u, 21f * u)
                        lineTo(5f * u, 21f * u)
                        cubicTo(3.6f * u, 21f * u, 2.5f * u, 19.9f * u, 2.5f * u, 18.5f * u)
                        lineTo(2.5f * u, 10f * u)
                        cubicTo(2.5f * u, 8.9f * u, 3.4f * u, 8f * u, 4.5f * u, 8f * u)
                        close()
                    }
                    drawPath(cuerpo, color, style = Stroke(sw))
                }
            }
        }
        when (type) {
            // Texto superpuesto como en los SVG del móvil.
            "taximetro" -> Text(
                "TAXI", color = color, fontSize = (size.value * 0.26f).sp, fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = (size.value * 0.10f).dp)
            )
            "dar" -> Text(
                "€", color = color, fontSize = (size.value * 0.42f).sp, fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = (size.value * 0.17f).dp)
            )
        }
    }
}
