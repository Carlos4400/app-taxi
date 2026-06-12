package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*

@Composable
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    entradas: List<WatchEntry>,
    onConfirm: (dinero: Double, km: Double) -> Unit,
    onCancel: () -> Unit
) {
    var activeField by remember { mutableStateOf<String?>(null) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val notasTurno = entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = entradas.filter { it.type != "nota" && it.note.isNotBlank() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 18.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(0.86f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onCancel() })
                Text("Terminar Turno", color = ColorWhite, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(22.dp))
            }

            Spacer(modifier = Modifier.height(9.dp))

            Row(
                modifier = Modifier.fillMaxWidth(0.86f),
                horizontalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                CampoCierre(
                    label = "Total Taxímetro",
                    value = if (dineroText.isBlank()) "€" else "${dineroText}€",
                    style = metricCardStyle("taximetro"),
                    active = activeField == "dinero",
                    modifier = Modifier.weight(1f)
                ) { activeField = "dinero" }
                CampoCierre(
                    label = "Total KM",
                    value = if (kmText.isBlank()) "KM" else "$kmText km",
                    style = metricCardStyle("km"),
                    active = activeField == "km",
                    modifier = Modifier.weight(1f)
                ) { activeField = "km" }
            }

            Spacer(modifier = Modifier.height(10.dp))

            ResumenHoyCard(
                totalsPorTipo = totalsPorTipo,
                numPorTipo = numPorTipo,
                notasTurno = notasTurno
            )

            if (notasDetalladas.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                SectionTitle("Notas detalladas", ColorGasolina)
                notasDetalladas.forEach { entry ->
                    Spacer(modifier = Modifier.height(6.dp))
                    NotaDetalladaRow(entry)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            BotonPlano(
                label = if (saving) "Enviando..." else "Terminar Turno",
                textColor = ColorGasolina,
                bg = ColorGasolinaBg,
                modifier = Modifier.fillMaxWidth(0.86f),
                enabled = !saving,
                borderColor = ColorGasolina
            ) {
                if (!saving) {
                    saving = true
                    onConfirm(dinero, km)
                }
            }
            Spacer(modifier = Modifier.height(7.dp))
            BotonPlano("Cancelar", ColorGrey, ColorNuloBg, Modifier.fillMaxWidth(0.86f), onClick = onCancel)
        }

        val field = activeField
        if (field != null) {
            TecladoCierreOverlay(
                field = field,
                value = if (field == "dinero") dineroText else kmText,
                onKey = { key ->
                    if (field == "dinero") {
                        dineroText = applyKey(dineroText, key)
                    } else {
                        kmText = applyKey(kmText, key)
                    }
                },
                onDone = { activeField = null }
            )
        }
    }
}

@Composable
private fun CampoCierre(
    label: String,
    value: String,
    style: CardVisualStyle,
    active: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(14.dp)
    Column(
        modifier = modifier
            .height(76.dp)
            .clip(shape)
            .background(style.bg)
            .border(1.dp, if (active) style.color else style.border, shape)
            .clickable { onClick() }
            .padding(horizontal = 7.dp, vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(label, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(5.dp))
        Text(value, color = style.color, fontSize = 18.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ResumenHoyCard(
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    notasTurno: List<WatchEntry>
) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(18.dp))
            .padding(horizontal = 10.dp, vertical = 11.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SectionTitle("Resumen de hoy", ColorGrey)
        Spacer(modifier = Modifier.height(8.dp))
        listOf(
            listOf("datafono", "propina"),
            listOf("agencia_bono", "extra"),
            listOf("gasolina", "nulo")
        ).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(7.dp)
            ) {
                row.forEach { type ->
                    ResumenCategoriaCard(
                        type = type,
                        total = totalsPorTipo[type] ?: 0.0,
                        count = numPorTipo[type] ?: 0,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            Spacer(modifier = Modifier.height(7.dp))
        }

        Spacer(modifier = Modifier.height(2.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(Color(0xFF252631))
        )
        Spacer(modifier = Modifier.height(8.dp))
        // Notas como en la app móvil: sin cabecera cuando no hay ninguna.
        if (notasTurno.isEmpty()) {
            Text("Sin notas del turno", color = ColorGrey, fontSize = 10.sp, fontStyle = FontStyle.Italic)
        } else {
            SectionTitle("Notas del turno", ColorDatafono)
            Spacer(modifier = Modifier.height(6.dp))
            notasTurno.forEach { entry ->
                NotaTurnoRow(entry)
                Spacer(modifier = Modifier.height(5.dp))
            }
        }
    }
}

@Composable
private fun ResumenCategoriaCard(
    type: String,
    total: Double,
    count: Int,
    modifier: Modifier = Modifier
) {
    val meta = categoriaMeta(type)
    val label = if (type == "agencia_bono") "Agencias/Bonos" else meta.label
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(meta.bg)
            .border(1.dp, meta.border, RoundedCornerShape(12.dp))
            .padding(horizontal = 7.dp, vertical = 8.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, 12.dp)
            Spacer(modifier = Modifier.width(4.dp))
            Text(label, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.height(3.dp))
        Text(fmtEur(total), color = meta.color, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        Text("$count ${if (count == 1) "entrada" else "entradas"}", color = ColorGrey, fontSize = 8.sp)
    }
}

@Composable
private fun SectionTitle(label: String, color: Color) {
    Text(
        text = label,
        color = color,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun NotaTurnoRow(entry: WatchEntry) {
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
        Text("Nota", color = ColorWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        // Nota completa, con salto de línea si es larga (antes se truncaba a 24).
        Text(entry.note, color = ColorWhite, fontSize = 9.sp, modifier = Modifier.weight(1f))
    }
}

@Composable
private fun NotaDetalladaRow(entry: WatchEntry) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(12.dp))
            .padding(horizontal = 9.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(entry.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        // Nota completa, con salto de línea si es larga (antes se truncaba a 16).
        Text(entry.note, color = ColorWhite, fontSize = 9.sp, modifier = Modifier.weight(1f))
        Text(fmtEur(entry.amount), color = meta.color, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun TecladoCierreOverlay(
    field: String,
    value: String,
    onKey: (String) -> Unit,
    onDone: () -> Unit
) {
    val color = metricCardStyle(if (field == "dinero") "taximetro" else "km").color
    // Pantalla completa diseñada para el círculo: sin tarjeta flotante ni
    // bordes que el marco redondo pueda cortar. Las medidas verticales son
    // fracciones del diámetro y cada fila del teclado se estrecha según la
    // cuerda del círculo a su altura, así cabe entero en cualquier reloj
    // redondo y aprovecha todo el ancho disponible.
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
    ) {
        val d = maxHeight
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = d * 0.07f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                if (field == "dinero") "Total Taxímetro" else "Total KM",
                color = color,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                "${value.ifBlank { "0" }} ${if (field == "dinero") "€" else "KM"}",
                color = color,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(d * 0.02f))
            NumericKeypadRedondo(
                onKey = onKey,
                color = color,
                keyHeight = d * 0.105f,
                keyFontSize = 15.sp,
                rowSpacing = d * 0.016f
            )
            Spacer(modifier = Modifier.height(d * 0.018f))
            BotonPlano("Guardar", ColorBackground, color, Modifier.fillMaxWidth(0.55f), onClick = onDone)
        }
    }
}

@Composable
private fun BotonPlano(
    label: String,
    textColor: Color,
    bg: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    borderColor: Color? = null,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(14.dp)
    val borderMod = if (borderColor != null) Modifier.border(2.dp, borderColor, shape) else Modifier
    Box(
        modifier = modifier
            .clip(shape)
            .background(bg)
            .then(borderMod)
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = if (enabled) textColor else ColorDisabledText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
