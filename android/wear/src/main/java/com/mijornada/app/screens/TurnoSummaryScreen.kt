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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.components.WatchActionButton
import com.mijornada.app.components.WatchTileBox
import com.mijornada.app.theme.*

private val CardTitleFontSize = 9.sp
private val BottomSummaryTitleFontSize = 8.sp

@Composable
fun TurnoSummaryScreen(
    turno: WatchTurno,
    onBack: () -> Unit,
    onHome: () -> Unit,
    onEdit: () -> Unit = {}
) {
    val notasTurno = turno.entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = turno.entradas.filter { it.type != "nota" && it.note.isNotBlank() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Cabecera estrecha (0.68) para que flecha y lapiz queden dentro del
        // area util del circulo (arriba el ancho visible es menor) y lapiz
        // funcional: abre la edicion de dinero/km del turno.
        Row(
            modifier = Modifier.fillMaxWidth(0.68f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Resumen", color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text("✎", color = ColorAgencia, fontSize = 15.sp, modifier = Modifier.clickable { onEdit() })
        }

        Spacer(modifier = Modifier.height(10.dp))
        HeaderPill(turno)
        Spacer(modifier = Modifier.height(10.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth(0.88f)) {
            SummaryMetric("taximetro", "Total Taxímetro", fmtEur(turno.totalTaximetro), metricCardStyle("taximetro"), Modifier.weight(1f))
            // Contabilidad pendiente de calcular por la app: no inventar numeros.
            SummaryMetric(
                "ganancia",
                "Mi Ganancia",
                if (turno.contablePendiente) "Pendiente" else fmtEur(turno.miGanancia),
                metricCardStyle("ganancia"), Modifier.weight(1f)
            )
        }
        Spacer(modifier = Modifier.height(7.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth(0.88f)) {
            SummaryMetric("km", "Total KM", "${fmtKmNumber(turno.km)} km", metricCardStyle("km"), Modifier.weight(1f))
            SummaryMetric("tiempo", "Tiempo trabajado", turno.tiempoTrabajado, metricCardStyle("tiempo"), Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(10.dp))
        CategorySummary(turno, notasTurno)

        if (notasDetalladas.isNotEmpty()) {
            Spacer(modifier = Modifier.height(10.dp))
            DetailedNotesBlock(notasDetalladas)
        }

        Spacer(modifier = Modifier.height(10.dp))
        BottomSummary(turno)
        if (turno.contablePendiente) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                "Abre la app del móvil para calcular la contabilidad",
                color = ColorGrey,
                fontSize = 8.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier.fillMaxWidth(0.72f)
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        WatchActionButton(
            label = "Volver al inicio",
            textColor = ColorGrey,
            backgroundColor = Color(0xFF1B1C23),
            modifier = Modifier.fillMaxWidth(0.88f),
            shape = RoundedCornerShape(16.dp),
            contentPadding = PaddingValues(vertical = 11.dp)
        ) { onHome() }
    }
}

@Composable
private fun HeaderPill(turno: WatchTurno) {
    WatchTileBox(
        modifier = Modifier.fillMaxWidth(0.88f),
        backgroundColor = Color(0xFF15151C),
        shape = RoundedCornerShape(15.dp),
        borderColor = Color(0xFF252631),
        borderWidth = 1.dp,
        contentPadding = PaddingValues(vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(formatFechaResumen(turno.startDate.ifBlank { turno.date }), color = ColorWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Text("${turno.startTime} - ${turno.endTime}", color = ColorGrey, fontSize = 10.sp)
    }
}

@Composable
private fun SummaryMetric(
    iconType: String,
    label: String,
    value: String,
    style: CardVisualStyle,
    modifier: Modifier = Modifier
) {
    WatchTileBox(
        modifier = modifier.height(64.dp),
        backgroundColor = style.bg,
        shape = RoundedCornerShape(13.dp),
        borderColor = style.border,
        borderWidth = 1.dp,
        contentPadding = PaddingValues(horizontal = 7.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Icono + etiqueta, como las tarjetas de métricas de la app móvil.
        Row(verticalAlignment = Alignment.CenterVertically) {
            MetricIcon(iconType, style.color, 13.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(label, color = ColorGrey, fontSize = CardTitleFontSize, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(value, color = style.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CategorySummary(turno: WatchTurno, notasTurno: List<WatchEntry>) {
    WatchTileBox(
        modifier = Modifier.fillMaxWidth(0.88f),
        backgroundColor = Color(0xFF15151C),
        shape = RoundedCornerShape(18.dp),
        borderColor = Color(0xFF252631),
        borderWidth = 1.dp,
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 11.dp)
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
        CategoryNotes(notasTurno)
    }
}

@Composable
private fun CategoryBox(type: String, total: Double, count: Int, modifier: Modifier = Modifier) {
    val meta = categoriaMeta(type)
    val categoryTitleFontSize = if (type == "agencia_bono") 7.sp else CardTitleFontSize
    WatchTileBox(
        modifier = modifier,
        backgroundColor = meta.bg,
        shape = RoundedCornerShape(12.dp),
        borderColor = meta.border,
        borderWidth = 1.dp,
        contentPadding = PaddingValues(horizontal = 7.dp, vertical = 8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, 11.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                meta.label,
                color = ColorGrey,
                fontSize = categoryTitleFontSize,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                softWrap = false
            )
        }
        Spacer(modifier = Modifier.height(3.dp))
        Text(
            fmtEur(total),
            color = meta.color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth(),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Text("$count ${if (count == 1) "entrada" else "entradas"}", color = ColorGrey, fontSize = 7.sp)
    }
}

@Composable
private fun CategoryNotes(entries: List<WatchEntry>) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(ColorWhite.copy(alpha = 0.06f))
    )
    Spacer(modifier = Modifier.height(9.dp))
    if (entries.isEmpty()) {
        Text(
            "Sin notas del turno",
            color = ColorGrey,
            fontSize = 9.sp,
            fontStyle = FontStyle.Italic,
            modifier = Modifier.fillMaxWidth(),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
    } else {
        Text("Notas del turno", color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(6.dp))
        entries.forEach { entry ->
            NoteRow(entry, general = true)
            Spacer(modifier = Modifier.height(5.dp))
        }
    }
}

@Composable
private fun BottomSummary(turno: WatchTurno) {
    WatchTileBox(
        modifier = Modifier.fillMaxWidth(0.88f),
        backgroundColor = Color(0xFF15151C),
        shape = RoundedCornerShape(18.dp),
        borderColor = Color(0xFF252631),
        borderWidth = 1.dp,
        contentPadding = PaddingValues(10.dp)
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth()) {
            BottomSummaryCard(
                iconType = "descontar",
                label = "Total a descontar",
                value = if (turno.contablePendiente) "Pendiente" else fmtEur(turno.totalADescontar),
                style = metricCardStyle("descontar"),
                modifier = Modifier.weight(1f)
            )
            BottomSummaryCard(
                iconType = "dar",
                label = "Total a dar",
                value = if (turno.contablePendiente) "Pendiente" else fmtEur(turno.totalADar),
                style = metricCardStyle("dar"),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun BottomSummaryCard(
    iconType: String,
    label: String,
    value: String,
    style: CardVisualStyle,
    modifier: Modifier = Modifier
) {
    WatchTileBox(
        modifier = modifier.height(70.dp),
        backgroundColor = style.bg,
        shape = RoundedCornerShape(13.dp),
        borderColor = style.border,
        borderWidth = 1.dp,
        contentPadding = PaddingValues(horizontal = 5.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            MetricIcon(iconType, style.color, 13.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                label.uppercase().replace(" A ", " A\n"),
                color = ColorGrey,
                fontSize = BottomSummaryTitleFontSize,
                fontWeight = FontWeight.Bold,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(value, color = style.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun DetailedNotesBlock(entries: List<WatchEntry>) {
    WatchTileBox(
        modifier = Modifier.fillMaxWidth(0.88f),
        backgroundColor = Color(0xFF15151C),
        shape = RoundedCornerShape(16.dp),
        borderColor = Color(0xFF252631),
        borderWidth = 1.dp,
        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 10.dp)
    ) {
        Text("Notas detalladas", color = ColorGasolina, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(6.dp))
        entries.forEach { entry ->
            NoteRow(entry, general = false)
            Spacer(modifier = Modifier.height(5.dp))
        }
    }
}

@Composable
private fun NoteRow(entry: WatchEntry, general: Boolean) {
    val meta = categoriaMeta(entry.type)
    WatchTileBox(
        modifier = Modifier.fillMaxWidth(),
        backgroundColor = Color(0xFF1B1C23),
        shape = RoundedCornerShape(10.dp),
        borderColor = null,
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 7.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(entry.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(6.dp))
            Text(if (general) "Nota" else categoriaLabelSingular(entry.type), color = if (general) ColorWhite else meta.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(6.dp))
            // Nota completa, con salto de línea si es larga (antes se truncaba a 18).
            Text(entry.note, color = ColorWhite, fontSize = 8.sp, modifier = Modifier.weight(1f))
            if (!general) Text(fmtEur(entry.amount), color = meta.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        }
    }
}
