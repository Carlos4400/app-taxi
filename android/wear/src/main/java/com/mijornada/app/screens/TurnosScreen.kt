package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*

@Composable
fun TurnosScreen(
    turnos: List<WatchTurno>,
    isLoading: Boolean = false,
    onBack: () -> Unit,
    onOpenTurno: (WatchTurno) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Cabecera estrecha para que la flecha quede dentro del circulo.
        Row(
            modifier = Modifier.fillMaxWidth(0.68f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Turnos", color = ColorWhite, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(22.dp))
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading && turnos.isEmpty()) {
            Text("Cargando turnos…", color = ColorGrey, fontSize = 12.sp)
        } else if (turnos.isEmpty()) {
            Text("No hay Turnos Anteriores.", color = ColorGrey, fontSize = 12.sp)
        } else {
            turnos.forEach { turno ->
                TurnoCard(turno = turno, onClick = { onOpenTurno(turno) })
                Spacer(modifier = Modifier.height(9.dp))
            }
        }
    }
}

@Composable
private fun TurnoCard(turno: WatchTurno, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.90f)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(horizontal = 11.dp, vertical = 10.dp)
    ) {
        Text(formatFechaResumen(turno.startDate.ifBlank { turno.date }), color = ColorWhite, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(2.dp))
        Text("${turno.startTime} - ${turno.endTime}", color = ColorGrey, fontSize = 10.sp)
        Text("${turno.totals.numEntradas} ${if (turno.totals.numEntradas == 1) "entrada" else "entradas"}", color = ColorGrey, fontSize = 9.sp)

        Spacer(modifier = Modifier.height(8.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth()) {
            MiniMetric("taximetro", "Total Taxímetro", fmtEur(turno.totalTaximetro), ColorAgencia, ColorAgenciaBg, Modifier.weight(1f))
            // Contabilidad pendiente de la app: nunca mostrar un numero incorrecto.
            MiniMetric(
                "ganancia",
                "Mi Ganancia",
                if (turno.contablePendiente) "Pendiente" else fmtEur(turno.miGanancia),
                ColorPropina, ColorPropinaBg, Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(7.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth()) {
            MiniMetric("km", "Total KM", "${fmtKmNumber(turno.km)} km", ColorExtra, ColorExtraBg, Modifier.weight(1f))
            MiniMetric("tiempo", "Tiempo", turno.tiempoTrabajado, ColorNulo, ColorNuloBg, Modifier.weight(1f))
        }
    }
}

@Composable
private fun MiniMetric(
    iconType: String,
    label: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    bg: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(1.dp, color.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(horizontal = 7.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Icono + etiqueta, como las tarjetas de métricas de la app móvil.
        Row(verticalAlignment = Alignment.CenterVertically) {
            MetricIcon(iconType, color, 13.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(label, color = ColorGrey, fontSize = 7.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(3.dp))
        Text(value, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

fun fmtKmNumber(v: Double): String {
    val text = if (v % 1.0 == 0.0) String.format(java.util.Locale("es", "ES"), "%.0f", v) else String.format(java.util.Locale("es", "ES"), "%.1f", v)
    return text
}
