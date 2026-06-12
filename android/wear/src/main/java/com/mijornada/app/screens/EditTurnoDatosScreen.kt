package com.mijornada.app.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*

/**
 * Edición completa de un turno cerrado (paridad con edit-turno-screen del
 * móvil): dinero y km, editar/borrar/añadir entradas, editar/borrar/añadir
 * notas, y guardado atómico. Todos los cambios son locales hasta pulsar
 * "Guardar cambios", que envía un único EDIT_TURNO por el outbox; la
 * contabilidad del turno queda "Pendiente" hasta que la app la recalcula.
 */
@Composable
fun EditTurnoDatosScreen(
    turno: WatchTurno,
    onRequestNote: (String, (String) -> Unit) -> Unit,
    onConfirm: (Double, Double, List<WatchEntry>) -> Unit,
    onCancel: () -> Unit
) {
    var dineroText by remember { mutableStateOf(amountToText(turno.dinero)) }
    var kmText by remember { mutableStateOf(amountToText(turno.km)) }
    var campoActivo by remember { mutableStateOf<String?>(null) }
    var entradas by remember { mutableStateOf(turno.entradas) }
    var editandoEntrada by remember { mutableStateOf<WatchEntry?>(null) }
    var nuevaCategoria by remember { mutableStateOf<String?>(null) }
    var enviando by remember { mutableStateOf(false) }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val valido = dinero > 0.0 && km > 0.0

    // Gesto atras dentro de la edicion: cierra solo la subpantalla abierta
    // (editor de entrada) en vez de expulsar de toda la edicion. Compose
    // invoca el BackHandler habilitado mas interno (orden LIFO oficial del
    // OnBackPressedDispatcher), asi que este tiene prioridad sobre el global
    // de la Activity mientras haya una subpantalla abierta.
    BackHandler(enabled = editandoEntrada != null || nuevaCategoria != null) {
        editandoEntrada = null
        nuevaCategoria = null
    }

    fun horaActual(): String =
        java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())

    // ── Subpantalla: editar una entrada existente (mismo editor del turno activo) ──
    val editando = editandoEntrada
    if (editando != null) {
        val meta = categoriaMeta(editando.type)
        AddEntryScreen(
            categoryLabel = categoriaLabelSingular(editando.type),
            categoryColor = meta.color,
            initialAmount = editando.amount,
            initialNote = editando.note,
            onSave = { amount, note ->
                entradas = entradas.map {
                    if (it.id == editando.id) it.copy(amount = if (it.type == "nota") it.amount else amount, note = note.trim()) else it
                }
                editandoEntrada = null
            },
            onCancel = { editandoEntrada = null },
            onRequestNote = onRequestNote,
            onDelete = {
                entradas = entradas.filter { it.id != editando.id }
                editandoEntrada = null
            },
            esNota = editando.type == "nota"
        )
        return
    }

    // ── Subpantalla: añadir entrada nueva (importe + nota de la categoría elegida) ──
    val categoria = nuevaCategoria
    if (categoria != null) {
        val meta = categoriaMeta(categoria)
        AddEntryScreen(
            categoryLabel = categoriaLabelSingular(categoria),
            categoryColor = meta.color,
            onSave = { amount, note ->
                entradas = entradas + WatchEntry(
                    id = System.currentTimeMillis(),
                    type = categoria,
                    amount = amount,
                    note = note.trim(),
                    time = horaActual(),
                )
                nuevaCategoria = null
            },
            onCancel = { nuevaCategoria = null },
            onRequestNote = onRequestNote
        )
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 36.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Editar turno", color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Text(formatFechaResumen(turno.startDate.ifBlank { turno.date }), color = ColorGrey, fontSize = 9.sp)
        Spacer(modifier = Modifier.height(8.dp))

        // ── Dinero y KM ──
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth(0.84f)) {
            CampoEditable(
                etiqueta = "Taxímetro",
                valor = if (dineroText.isBlank()) "0€" else dineroText + "€",
                color = ColorAgencia,
                bg = ColorAgenciaBg,
                activo = campoActivo == "dinero",
                modifier = Modifier.weight(1f)
            ) { campoActivo = if (campoActivo == "dinero") null else "dinero" }
            CampoEditable(
                etiqueta = "KM",
                valor = if (kmText.isBlank()) "0" else kmText,
                color = ColorExtra,
                bg = ColorExtraBg,
                activo = campoActivo == "km",
                modifier = Modifier.weight(1f)
            ) { campoActivo = if (campoActivo == "km") null else "km" }
        }

        if (campoActivo != null) {
            Spacer(modifier = Modifier.height(8.dp))
            NumericKeypad(
                onKey = { key ->
                    if (campoActivo == "dinero") dineroText = applyKey(dineroText, key)
                    else kmText = applyKey(kmText, key)
                },
                color = if (campoActivo == "dinero") ColorAgencia else ColorExtra
            )
        }

        // ── Entradas (sin notas) ──
        Spacer(modifier = Modifier.height(10.dp))
        SeccionTitulo("ENTRADAS")
        val soloEntradas = entradas.filter { it.type != "nota" }
        if (soloEntradas.isEmpty()) {
            Text("Sin entradas", color = ColorGrey, fontSize = 10.sp, fontStyle = FontStyle.Italic)
        } else {
            soloEntradas.forEach { entry ->
                Spacer(modifier = Modifier.height(5.dp))
                FilaEntrada(entry) { editandoEntrada = entry }
            }
        }
        // Anadir entrada: directamente la cuadricula de categorias (el boton
        // ancho era redundante; tocar una categoria ya abre el editor).
        Spacer(modifier = Modifier.height(10.dp))
        SeccionTitulo("AÑADIR ENTRADA")
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.fillMaxWidth(0.84f)) {
            listOf("datafono", "propina", "agencia_bono").forEach { tipo ->
                BotonCategoria(tipo, Modifier.weight(1f)) { nuevaCategoria = tipo }
            }
        }
        Spacer(modifier = Modifier.height(5.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(5.dp), modifier = Modifier.fillMaxWidth(0.84f)) {
            listOf("extra", "gasolina", "nulo").forEach { tipo ->
                BotonCategoria(tipo, Modifier.weight(1f)) { nuevaCategoria = tipo }
            }
        }

        // ── Notas del turno ──
        Spacer(modifier = Modifier.height(10.dp))
        SeccionTitulo("NOTAS DEL TURNO")
        val notas = entradas.filter { it.type == "nota" }
        if (notas.isEmpty()) {
            Text("Sin notas del turno", color = ColorGrey, fontSize = 10.sp, fontStyle = FontStyle.Italic)
        } else {
            notas.forEach { nota ->
                Spacer(modifier = Modifier.height(5.dp))
                FilaNota(
                    nota = nota,
                    onEdit = {
                        onRequestNote(nota.note) { texto ->
                            if (texto.isNotBlank()) {
                                entradas = entradas.map { if (it.id == nota.id) it.copy(note = texto.trim()) else it }
                            }
                        }
                    },
                    onDelete = { entradas = entradas.filter { it.id != nota.id } }
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        BotonAncho("✎ Añadir nota", ColorWhite, ColorNuloBg) {
            onRequestNote("") { texto ->
                if (texto.isNotBlank()) {
                    entradas = entradas + WatchEntry(
                        id = System.currentTimeMillis(),
                        type = "nota",
                        amount = 0.0,
                        note = texto.trim(),
                        time = horaActual(),
                    )
                }
            }
        }

        // ── Guardar / Cancelar ──
        Spacer(modifier = Modifier.height(12.dp))
        BotonAncho(
            if (enviando) "Guardando..." else "Guardar cambios",
            if (valido && !enviando) ColorPropina else ColorGrey.copy(alpha = 0.5f),
            ColorPropinaBg,
            enabled = valido && !enviando
        ) {
            enviando = true
            onConfirm(dinero, km, entradas)
        }
        Spacer(modifier = Modifier.height(6.dp))
        BotonAncho("Cancelar", ColorGrey, ColorNuloBg) { onCancel() }
    }
}

@Composable
private fun SeccionTitulo(titulo: String) {
    Text(titulo, color = ColorGrey, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(3.dp))
}

@Composable
private fun FilaEntrada(entry: WatchEntry, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .clip(RoundedCornerShape(11.dp))
            .background(Color(0xFF15151C))
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CategoriaIcon(entry.type, meta.color, 13.dp)
        Spacer(modifier = Modifier.width(6.dp))
        Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        if (entry.note.isNotBlank()) {
            Spacer(modifier = Modifier.width(5.dp))
            Text(entry.note, color = ColorGrey, fontSize = 9.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }
        Spacer(modifier = Modifier.width(5.dp))
        Text(fmtEur(entry.amount), color = meta.color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun FilaNota(nota: WatchEntry, onEdit: () -> Unit, onDelete: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .clip(RoundedCornerShape(11.dp))
            .background(Color(0xFF15151C))
            .padding(horizontal = 10.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(nota.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            nota.note,
            color = ColorWhite,
            fontSize = 9.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier
                .weight(1f)
                .clickable { onEdit() }
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            "✕",
            color = ColorGasolina,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.clickable { onDelete() }
        )
    }
}

@Composable
private fun BotonCategoria(tipo: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val meta = categoriaMeta(tipo)
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(meta.bg)
            .clickable { onClick() }
            .padding(vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        CategoriaIcon(tipo, meta.color, 15.dp)
    }
}

@Composable
private fun BotonAncho(
    etiqueta: String,
    color: Color,
    bg: Color,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth(0.84f)
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 9.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(etiqueta, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CampoEditable(
    etiqueta: String,
    valor: String,
    color: Color,
    bg: Color,
    activo: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .border(if (activo) 1.5.dp else 1.dp, if (activo) color else color.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(etiqueta, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(2.dp))
        Text(valor, color = color, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}
