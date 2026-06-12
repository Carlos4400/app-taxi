package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*

private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
private const val PausedSafeWidth = 0.70f

@Composable
fun ActiveTurnoScreen(
    fechaTurno: String,
    startTime: String,
    isPaused: Boolean,
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    entradas: List<WatchEntry>,
    pendingOpsCount: Int = 0,
    onSelectCategory: (String) -> Unit,
    onTogglePause: () -> Boolean,
    onAddNote: () -> Boolean,
    requestingNote: Boolean = false,
    onEditEntry: (WatchEntry) -> Unit,
    onEndTurno: () -> Unit
) {
    if (isPaused) {
        PausedTurnoContent(
            fechaTurno = fechaTurno,
            startTime = startTime,
            pendingOpsCount = pendingOpsCount,
            onResume = onTogglePause
        )
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
    ) {
        if (pendingOpsCount > 0) {
            SyncIndicator(
                count = pendingOpsCount,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 4.dp)
            )
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 22.dp),
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
                    .clickable(enabled = !requestingNote) {
                        onAddNote()
                    }
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (requestingNote) "Abriendo..." else "✎  Añadir nota al turno",
                    color = ColorWhite,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(7.dp))

            var togglingPause by remember { mutableStateOf(false) }
            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(14.dp))
                    .background(ColorPauseBg)
                    .clickable(enabled = !togglingPause) {
                        togglingPause = onTogglePause()
                    }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    PauseIcon(size = 18.dp, color = ColorPause)
                    Spacer(modifier = Modifier.width(7.dp))
                    Text(
                        text = if (togglingPause) "Procesando..." else "Pausar turno",
                        color = ColorPause,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(7.dp))

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

            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColorGasolinaBg)
                    .border(2.dp, ColorGasolina, RoundedCornerShape(16.dp))
                    .clickable { onEndTurno() }
                    .padding(vertical = 11.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun PausedTurnoContent(
    fechaTurno: String,
    startTime: String,
    pendingOpsCount: Int,
    onResume: () -> Boolean
) {
    var resuming by remember { mutableStateOf(false) }
    val resume = {
        if (!resuming) {
            resuming = onResume()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        if (pendingOpsCount > 0) {
            SyncIndicator(
                count = pendingOpsCount,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 6.dp)
            )
        }
        Column(
            modifier = Modifier
                .fillMaxWidth(PausedSafeWidth)
                .offset(y = (-8).dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                if (fechaTurno.isBlank()) "Turno activo" else fechaTurno,
                color = ColorWhite,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                if (startTime.isBlank()) "" else "desde $startTime",
                color = ColorGrey,
                fontSize = 10.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .size(82.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(ColorPauseBg)
                    .border(3.dp, ColorPauseBorder, RoundedCornerShape(24.dp))
                    .clickable(enabled = !resuming) { resume() },
                contentAlignment = Alignment.Center
            ) {
                PauseIcon(size = 46.dp, color = ColorPause)
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text("Turno Pausado", color = ColorWhite, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(ColorPauseBg)
                    .border(2.dp, ColorPauseBorder, RoundedCornerShape(18.dp))
                    .clickable(enabled = !resuming) { resume() }
                    .padding(vertical = 10.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                PlayIcon(size = 19.dp, color = ColorPause)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    if (resuming) "Reanudando..." else "Continuar Turno",
                    color = ColorPause,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun PauseIcon(size: androidx.compose.ui.unit.Dp, color: Color) {
    Row(
        modifier = Modifier.size(size),
        horizontalArrangement = Arrangement.spacedBy(size * 0.18f, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(2) {
            Box(
                modifier = Modifier
                    .width(size * 0.24f)
                    .height(size * 0.66f)
                    .clip(RoundedCornerShape(size * 0.10f))
                    .background(color)
            )
        }
    }
}

@Composable
private fun PlayIcon(size: androidx.compose.ui.unit.Dp, color: Color) {
    Canvas(modifier = Modifier.size(size)) {
        val triangle = Path().apply {
            moveTo(this@Canvas.size.width * 0.25f, this@Canvas.size.height * 0.12f)
            lineTo(this@Canvas.size.width * 0.84f, this@Canvas.size.height * 0.50f)
            lineTo(this@Canvas.size.width * 0.25f, this@Canvas.size.height * 0.88f)
            close()
        }
        drawPath(triangle, color)
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
        // Nota de la entrada visible como en la app móvil (antes no se mostraba).
        if (entry.note.isNotBlank()) {
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                entry.note,
                color = ColorGrey,
                fontSize = 10.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(6.dp))
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }
        Text(entry.time, color = ColorGrey, fontSize = 10.sp)
        Spacer(modifier = Modifier.width(8.dp))
        if (entry.type == "nota") {
            Text("✎", color = ColorWhite, fontSize = 12.sp)
        } else {
            Text(fmtEurSigned(entry.amount), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SyncIndicator(
    count: Int,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(ColorPropinaBg)
            .padding(horizontal = 6.dp, vertical = 1.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = if (count == 1) "↻ Sincronizando..." else "↻ Sincronizando $count",
            color = ColorPropina,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
