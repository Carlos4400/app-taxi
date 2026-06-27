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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.components.WatchActionButton
import com.mijornada.app.components.WatchMetricCard
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
    onConfirm: (Double, Double, List<WatchEntry>) -> Boolean,
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
                true
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
                true
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
        WatchActionButton(
            label = "✎ Añadir nota",
            textColor = ColorWhite,
            backgroundColor = ColorNuloBg,
            modifier = Modifier.fillMaxWidth(0.84f),
            contentPadding = PaddingValues(vertical = 9.dp)
        ) {
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
        WatchActionButton(
            label = if (enviando) "Guardando..." else "Guardar cambios",
            textColor = if (valido && !enviando) ColorPropina else ColorGrey.copy(alpha = 0.5f),
            backgroundColor = ColorPropinaBg,
            modifier = Modifier.fillMaxWidth(0.84f),
            enabled = valido && !enviando,
            contentPadding = PaddingValues(vertical = 9.dp)
        ) {
            enviando = onConfirm(dinero, km, entradas)
        }
        Spacer(modifier = Modifier.height(6.dp))
        WatchActionButton(
            label = "Cancelar",
            textColor = ColorGrey,
            backgroundColor = ColorNuloBg,
            modifier = Modifier.fillMaxWidth(0.84f),
            contentPadding = PaddingValues(vertical = 9.dp)
        ) { onCancel() }
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
    // Patron robusto: background(color, shape) -> clickable -> padding. No usa
    // WatchTileBox ni WatchActionButton porque es una Row compleja con icono +
    // label + nota + importe.
    Row(
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .background(Color(0xFF15151C), RoundedCornerShape(11.dp))
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
    // Patron robusto: background(color, shape) -> padding. No usa WatchTileBox
    // porque tiene un Text con clickable interno (para editar).
    Row(
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .background(Color(0xFF15151C), RoundedCornerShape(11.dp))
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
    // Patron robusto: background(color, shape) -> clickable -> padding. No usa
    // WatchActionButton porque solo muestra un icono, no texto.
    Box(
        modifier = modifier
            .background(meta.bg, RoundedCornerShape(10.dp))
            .clickable { onClick() }
            .padding(vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        CategoriaIcon(tipo, meta.color, 15.dp)
    }
}

// BotonAncho eliminado: los 3 usos ahora llaman directamente a WatchActionButton
// (componente reutilizable en components/WatchActionButton.kt), que encapsula
// el patron robusto background(color, shape) -> border(shape) -> clip(shape) -> clickable.

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
    // Patron robusto: delega en WatchMetricCard (background(color, shape) -> border(shape) -> clip(shape)).
    // El parametro active controla el alpha del borde (WatchMetricCard atenua al 50% cuando no esta activo).
    WatchMetricCard(
        backgroundColor = bg,
        borderColor = color,
        modifier = modifier,
        active = activo,
        shape = RoundedCornerShape(12.dp),
        borderWidth = if (activo) 1.5.dp else 1.dp,
        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 7.dp),
        onClick = onClick
    ) {
        Text(etiqueta, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(2.dp))
        Text(valor, color = color, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}
