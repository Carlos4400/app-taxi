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
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.delay
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
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
    pauseStartTime: String = "",
    totalPausedMinutes: Int = 0,
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
            pauseStartTime = pauseStartTime,
            totalPausedMinutes = totalPausedMinutes,
            onResume = onTogglePause
        )
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
    ) {
        // P4: con una operacion critica pendiente solo puede haber una a la vez
        // (ver arquitectura Wear). Se deshabilitan por adelantado las acciones
        // criticas en vez de dejar pulsarlas y rechazarlas al final.
        val accionesBloqueadas = pendingOpsCount > 0
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
                // bottom 44: con 22 el último botón ("Terminar turno") quedaba
                // recortado por la curva inferior del círculo al final del scroll.
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 44.dp),
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
                TarjetaCategoria("datafono", totalsPorTipo, numPorTipo, grande = true, enabled = !accionesBloqueadas, modifier = Modifier.weight(1f)) { onSelectCategory("datafono") }
                TarjetaCategoria("propina", totalsPorTipo, numPorTipo, grande = true, enabled = !accionesBloqueadas, modifier = Modifier.weight(1f)) { onSelectCategory("propina") }
            }

            Spacer(modifier = Modifier.height(5.dp))

            Row(
                modifier = Modifier.fillMaxWidth(WatchSafeRowWidth),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TarjetaCategoria("agencia_bono", totalsPorTipo, numPorTipo, grande = false, enabled = !accionesBloqueadas, modifier = Modifier.weight(1f)) { onSelectCategory("agencia_bono") }
                TarjetaCategoria("extra", totalsPorTipo, numPorTipo, grande = false, enabled = !accionesBloqueadas, modifier = Modifier.weight(1f)) { onSelectCategory("extra") }
            }

            Spacer(modifier = Modifier.height(5.dp))

            Row(
                modifier = Modifier.fillMaxWidth(WatchSafeRowWidth),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                TarjetaCategoria("gasolina", totalsPorTipo, numPorTipo, grande = false, enabled = !accionesBloqueadas, modifier = Modifier.weight(1f)) { onSelectCategory("gasolina") }
                TarjetaCategoria("nulo", totalsPorTipo, numPorTipo, grande = false, enabled = !accionesBloqueadas, modifier = Modifier.weight(1f)) { onSelectCategory("nulo") }
            }

            Spacer(modifier = Modifier.height(8.dp))

            val notaBloqueada = pendingOpsCount > 0
            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (notaBloqueada) ColorDisabledBg else ColorNuloBg)
                    .clickable(enabled = !requestingNote && !notaBloqueada) {
                        onAddNote()
                    }
                    .padding(vertical = 9.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = when {
                        notaBloqueada -> "Sincronizando operación…"
                        requestingNote -> "Abriendo..."
                        else -> "✎  Añadir nota al turno"
                    },
                    color = if (notaBloqueada) ColorDisabledText else ColorWhite,
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
                    .alpha(if (accionesBloqueadas) 0.5f else 1f)
                    .clickable(enabled = !togglingPause && !accionesBloqueadas) {
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
                    // P3: una entrada pendiente aun tiene id temporal; editarla
                    // daria "Entrada no encontrada". Tampoco se edita con otra
                    // operacion en curso (P4).
                    EntradaHistorial(entry, bloqueado = entry.pendiente || accionesBloqueadas) { onEditEntry(entry) }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColorGasolinaBg)
                    .border(2.dp, ColorGasolina, RoundedCornerShape(16.dp))
                    .alpha(if (accionesBloqueadas) 0.5f else 1f)
                    .clickable(enabled = !accionesBloqueadas) { onEndTurno() }
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
    pauseStartTime: String,
    totalPausedMinutes: Int,
    onResume: () -> Boolean
) {
    var resuming by remember { mutableStateOf(false) }
    val resume = {
        if (!resuming) {
            resuming = onResume()
        }
    }
    // Tic de 30s para que el tiempo pausado avance en pantalla.
    var ahoraMs by remember { mutableStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(30_000L)
            ahoraMs = System.currentTimeMillis()
        }
    }
    val minutosPausado = minutosPausadoTotal(pauseStartTime, totalPausedMinutes, ahoraMs)

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
                // Icono compacto: al añadir la línea del contador la columna
                // (fija, sin scroll) se salía del círculo; se recupera la
                // altura aquí y en el título, el resto queda igual.
                modifier = Modifier
                    .size(62.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(ColorPauseBg)
                    .border(3.dp, ColorPauseBorder, RoundedCornerShape(18.dp))
                    .clickable(enabled = !resuming) { resume() },
                contentAlignment = Alignment.Center
            ) {
                PauseIcon(size = 34.dp, color = ColorPause)
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text("Tiempo Pausado", color = ColorWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(
                fmtMinutosPausa(minutosPausado),
                color = ColorPause,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(10.dp))
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
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val meta = categoriaMeta(type)
    val total = totalsPorTipo[type] ?: 0.0
    val count = numPorTipo[type] ?: 0
    val categoryTitleFontSize = if (type == "agencia_bono") 7.sp else if (grande) 11.sp else 10.sp
    // El fondo se pinta con su propia forma (background(color, shape)) y el clip
    // va despues, solo para recortar el ripple del clickable. El patron antiguo
    // clip(shape).background(color) perdia el fondo al recomponer la tarjeta con
    // entradas nuevas (la interaccion clip + alpha < 1 deja el nodo sin pintar).
    Column(
        modifier = modifier
            .background(meta.bg, RoundedCornerShape(14.dp))
            .border(1.dp, meta.border, RoundedCornerShape(14.dp))
            .clip(RoundedCornerShape(14.dp))
            .alpha(if (enabled) 1f else 0.5f)
            .clickable(enabled = enabled) { onClick() }
            .padding(horizontal = 8.dp, vertical = if (grande) 8.dp else 6.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, if (grande) 16.dp else 13.dp)
            Spacer(modifier = Modifier.width(5.dp))
            Text(
                meta.label,
                color = meta.color,
                fontSize = categoryTitleFontSize,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                softWrap = false
            )
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            fmtEur(total),
            color = meta.color,
            fontSize = if (grande) 18.sp else 14.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center
        )
        if (grande) {
            Text("$count ${if (count == 1) "entrada" else "entradas"}", color = ColorGrey, fontSize = 9.sp)
        }
    }
}

@Composable
private fun EntradaHistorial(entry: WatchEntry, bloqueado: Boolean = false, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            // Atenuar la fila mientras el cambio esta pendiente de confirmacion.
            .alpha(if (entry.pendiente) 0.55f else 1f)
            .clickable(enabled = !bloqueado) { onClick() }
            .padding(horizontal = 12.dp, vertical = 9.dp)
    ) {
        // Nivel 1: icono + categoria + hora + (pendiente) + importe.
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CategoriaIcon(entry.type, meta.color, 14.dp)
            Spacer(modifier = Modifier.width(7.dp))
            Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Text(entry.time, color = ColorGrey, fontSize = 10.sp)
            Spacer(modifier = Modifier.width(8.dp))
            // Icono de pendiente (reloj) mientras el movil no ha confirmado.
            if (entry.pendiente) {
                Text("⏱", color = ColorTaximetro, fontSize = 11.sp)
                Spacer(modifier = Modifier.width(6.dp))
            }
            if (entry.type == "nota") {
                Text("✎", color = ColorWhite, fontSize = 12.sp)
            } else {
                Text(fmtEurSigned(entry.amount), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        // Nivel 2: nota completa con salto de linea, como en "Terminar turno" y
        // en la app movil (antes se truncaba a una linea con ellipsis).
        if (entry.note.isNotBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                entry.note,
                color = ColorGrey,
                fontSize = 10.sp,
                modifier = Modifier.fillMaxWidth()
            )
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

/**
 * Minutos de pausa acumulados del turno: las pausas ya cerradas
 * (totalPausedMinutes, el dato que luego descuenta el tiempo trabajado) más
 * la pausa en curso desde pauseStartTime ("HH:mm"). Mismo criterio de cruce
 * de medianoche (+24h) que elapsedMinutes en el procesador del móvil.
 * ahoraMs entra como parámetro para que Compose recomponga con cada tic.
 */
private fun minutosPausadoTotal(pauseStartTime: String, totalPausedMinutes: Int, ahoraMs: Long): Int {
    val partes = pauseStartTime.split(":")
    val inicio = if (partes.size >= 2) {
        val h = partes[0].toIntOrNull()
        val m = partes[1].toIntOrNull()
        if (h != null && m != null) h * 60 + m else null
    } else {
        null
    }
    val enCurso = if (inicio != null) {
        val cal = java.util.Calendar.getInstance().apply { timeInMillis = ahoraMs }
        val ahora = cal.get(java.util.Calendar.HOUR_OF_DAY) * 60 + cal.get(java.util.Calendar.MINUTE)
        val dif = ahora - inicio
        if (dif >= 0) dif else dif + 24 * 60
    } else {
        0
    }
    return totalPausedMinutes + enCurso
}

private fun fmtMinutosPausa(minutos: Int): String =
    if (minutos < 60) "$minutos min" else "${minutos / 60} h ${minutos % 60} min"
