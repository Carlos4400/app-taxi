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
fun TurnoSummaryScreen(
    turno: WatchTurno,
    onBack: () -> Unit
) {
    val notasTurno = turno.entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = turno.entradas.filter { it.type != "nota" && it.note.isNotBlank() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(0.88f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Resumen del Turno", color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text("✎", color = ColorAgencia, fontSize = 15.sp)
        }

        Spacer(modifier = Modifier.height(10.dp))
        HeaderPill(turno)
        Spacer(modifier = Modifier.height(10.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth(0.88f)) {
            SummaryMetric("Total Taxímetro", fmtEur(turno.totalTaximetro), ColorAgencia, ColorAgenciaBg, Modifier.weight(1f))
            // Contabilidad pendiente de calcular por la app: no inventar numeros.
            SummaryMetric(
                "Mi Ganancia",
                if (turno.contablePendiente) "Pendiente" else fmtEur(turno.miGanancia),
                ColorPropina, ColorPropinaBg, Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(7.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth(0.88f)) {
            SummaryMetric("Total KM", "${fmtKmNumber(turno.km)} km", ColorExtra, ColorExtraBg, Modifier.weight(1f))
            SummaryMetric("Tiempo trabajado", turno.tiempoTrabajado, ColorNulo, ColorNuloBg, Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(10.dp))
        CategorySummary(turno)

        Spacer(modifier = Modifier.height(10.dp))
        NotesBlock("Notas del turno", notasTurno, general = true)

        if (notasDetalladas.isNotEmpty()) {
            Spacer(modifier = Modifier.height(10.dp))
            NotesBlock("Notas detalladas", notasDetalladas, general = false)
        }

        Spacer(modifier = Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth(0.88f)) {
            SummaryMetric(
                "Total a descontar",
                if (turno.contablePendiente) "Pendiente" else fmtEur(turno.totalADescontar),
                ColorGasolina, ColorGasolinaBg, Modifier.weight(1f)
            )
            SummaryMetric(
                "Total a dar",
                if (turno.contablePendiente) "Pendiente" else fmtEur(turno.totalADar),
                ColorPropina, ColorPropinaBg, Modifier.weight(1f)
            )
        }
        if (turno.contablePendiente) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                "Abre la app del móvil para calcular la contabilidad",
                color = ColorGrey,
                fontSize = 8.sp
            )
        }
    }
}

@Composable
private fun HeaderPill(turno: WatchTurno) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(15.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(15.dp))
            .padding(vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(formatFechaResumen(turno.startDate.ifBlank { turno.date }), color = ColorWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Text("${turno.startTime} - ${turno.endTime}", color = ColorGrey, fontSize = 10.sp)
    }
}

@Composable
private fun SummaryMetric(
    label: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    bg: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .height(64.dp)
            .clip(RoundedCornerShape(13.dp))
            .background(bg)
            .border(1.dp, color.copy(alpha = 0.28f), RoundedCornerShape(13.dp))
            .padding(horizontal = 7.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(label, color = ColorGrey, fontSize = 7.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Text(value, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CategorySummary(turno: WatchTurno) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(18.dp))
            .padding(horizontal = 10.dp, vertical = 11.dp)
    ) {
        listOf(
            listOf("datafono", "propina"),
            listOf("agencia_bono", "extra"),
            listOf("gasolina", "nulo")
        ).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { type ->
                    CategoryBox(
                        type = type,
                        total = turno.totals.porTipo[type] ?: 0.0,
                        count = turno.totals.numPorTipo[type] ?: 0,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            Spacer(modifier = Modifier.height(7.dp))
        }
    }
}

@Composable
private fun CategoryBox(type: String, total: Double, count: Int, modifier: Modifier = Modifier) {
    val meta = categoriaMeta(type)
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(meta.bg)
            .padding(horizontal = 7.dp, vertical = 8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, 11.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(if (type == "agencia_bono") "Agencias/Bonos" else meta.label, color = ColorGrey, fontSize = 7.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(3.dp))
        Text(fmtEur(total), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text("$count ${if (count == 1) "entrada" else "entradas"}", color = ColorGrey, fontSize = 7.sp)
    }
}

@Composable
private fun NotesBlock(title: String, entries: List<WatchEntry>, general: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(16.dp))
            .padding(horizontal = 10.dp, vertical = 10.dp)
    ) {
        Text(title, color = if (general) ColorDatafono else ColorGasolina, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(6.dp))
        if (entries.isEmpty()) {
            Text("Sin notas del turno", color = ColorGrey, fontSize = 9.sp)
        } else {
            entries.forEach { entry ->
                NoteRow(entry, general)
                Spacer(modifier = Modifier.height(5.dp))
            }
        }
    }
}

@Composable
private fun NoteRow(entry: WatchEntry, general: Boolean) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFF1B1C23))
            .padding(horizontal = 8.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(entry.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(if (general) "Nota" else categoriaLabelSingular(entry.type), color = if (general) ColorWhite else meta.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        // Nota completa, con salto de línea si es larga (antes se truncaba a 18).
        Text(entry.note, color = ColorWhite, fontSize = 8.sp, modifier = Modifier.weight(1f))
        if (!general) Text(fmtEur(entry.amount), color = meta.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}
