package com.mijornada.app.screens

import androidx.compose.foundation.background
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

private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f

@Composable
fun ActiveTurnoScreen(
    fechaTurno: String,
    startTime: String,
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    entradas: List<WatchEntry>,
    onSelectCategory: (String) -> Unit,
    onAddNote: () -> Unit,
    onEditEntry: (WatchEntry) -> Unit,
    onEndTurno: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 88.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (fechaTurno.isBlank()) "Turno activo" else fechaTurno,
                    color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold
                )
                Text(
                    text = if (startTime.isBlank()) "" else "desde $startTime",
                    color = ColorGrey, fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.height(7.dp))

            Row(
                modifier = Modifier.fillMaxWidth(WatchSafeRowWidth),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TarjetaCategoria("datafono", totalsPorTipo, numPorTipo, grande = true, modifier = Modifier.weight(1f)) { onSelectCategory("datafono") }
                TarjetaCategoria("propina", totalsPorTipo, numPorTipo, grande = true, modifier = Modifier.weight(1f)) { onSelectCategory("propina") }
            }

            Spacer(modifier = Modifier.height(5.dp))

            Row(
                modifier = Modifier.fillMaxWidth(WatchSafeRowWidth),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TarjetaCategoria("agencia_bono", totalsPorTipo, numPorTipo, grande = false, modifier = Modifier.weight(1f)) { onSelectCategory("agencia_bono") }
                TarjetaCategoria("extra", totalsPorTipo, numPorTipo, grande = false, modifier = Modifier.weight(1f)) { onSelectCategory("extra") }
            }

            Spacer(modifier = Modifier.height(5.dp))

            Row(
                modifier = Modifier.fillMaxWidth(WatchSafeRowWidth),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TarjetaCategoria("gasolina", totalsPorTipo, numPorTipo, grande = false, modifier = Modifier.weight(1f)) { onSelectCategory("gasolina") }
                TarjetaCategoria("nulo", totalsPorTipo, numPorTipo, grande = false, modifier = Modifier.weight(1f)) { onSelectCategory("nulo") }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(14.dp))
                    .background(ColorNuloBg)
                    .clickable { onAddNote() }
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("✎  Añadir nota al turno", color = ColorWhite, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }

            if (entradas.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "ÚLTIMAS ENTRADAS",
                    color = ColorGrey, fontSize = 10.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 4.dp)
                )
                entradas.forEach { entry ->
                    Spacer(modifier = Modifier.height(6.dp))
                    EntradaHistorial(entry) { onEditEntry(entry) }
                }
            }

        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
                .fillMaxWidth(WatchSafeButtonWidth)
                .clip(RoundedCornerShape(16.dp))
                .background(ColorGasolinaBg)
                .clickable { onEndTurno() }
                .padding(vertical = 11.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun TarjetaCategoria(
    type: String,
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    grande: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val meta = categoriaMeta(type)
    val total = totalsPorTipo[type] ?: 0.0
    val count = numPorTipo[type] ?: 0
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(meta.bg)
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = if (grande) 8.dp else 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, if (grande) 16.dp else 13.dp)
            Spacer(modifier = Modifier.width(5.dp))
            Text(meta.label, color = meta.color, fontSize = if (grande) 11.sp else 10.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            fmtEur(total),
            color = meta.color,
            fontSize = if (grande) 18.sp else 14.sp,
            fontWeight = FontWeight.Bold
        )
        if (grande) {
            Text("$count ${if (count == 1) "entrada" else "entradas"}", color = ColorGrey, fontSize = 9.sp)
        }
    }
}

@Composable
private fun EntradaHistorial(entry: WatchEntry, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CategoriaIcon(entry.type, meta.color, 14.dp)
        Spacer(modifier = Modifier.width(7.dp))
        Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.weight(1f))
        Text(entry.time, color = ColorGrey, fontSize = 10.sp)
        Spacer(modifier = Modifier.width(8.dp))
        if (entry.type == "nota") {
            Text("✎", color = ColorWhite, fontSize = 12.sp)
        } else {
            Text(fmtEurSigned(entry.amount), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}
