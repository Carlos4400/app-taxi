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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*

@Composable
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var activeField by remember { mutableStateOf("dinero") }
    var confirming by remember { mutableStateOf(false) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val reviewLabel = when {
        dinero <= 0.0 -> "Falta €"
        km <= 0.0 -> "Falta km"
        else -> "Revisar"
    }
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        if (confirming) {
            ConfirmarCierre(
                totalsPorTipo = totalsPorTipo,
                dinero = dinero,
                kmText = kmText,
                note = note,
                onBack = { confirming = false },
                onConfirm = { onConfirm(dinero, km, note) }
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(start = 28.dp, end = 28.dp, top = 14.dp, bottom = 18.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("Terminar turno", color = ColorWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(0.82f),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    CampoCierre(
                        label = "Taxímetro",
                        value = "${dineroText.ifEmpty { "0" }}€",
                        color = ColorAgencia,
                        active = activeField == "dinero",
                        modifier = Modifier.weight(1f)
                    ) { activeField = "dinero" }
                    CampoCierre(
                        label = "Km",
                        value = "${kmText.ifEmpty { "0" }} km",
                        color = ColorExtra,
                        active = activeField == "km",
                        modifier = Modifier.weight(1f)
                    ) { activeField = "km" }
                }

                Spacer(modifier = Modifier.height(4.dp))

                NumericKeypad(
                    onKey = { key ->
                        if (activeField == "dinero") {
                            dineroText = applyKey(dineroText, key)
                        } else {
                            kmText = applyKey(kmText, key)
                        }
                    },
                    color = activeColor,
                    keyHeight = 20.dp,
                    keyFontSize = 12.sp
                )

                Spacer(modifier = Modifier.height(4.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.72f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (note.isBlank()) ColorNuloBg else Color(0xFF2A2A33))
                        .clickable { onRequestNote(note) { result -> note = result } }
                        .padding(vertical = 5.dp, horizontal = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (note.isBlank()) "+ Nota" else "✓ ${note.take(14)}", color = ColorWhite, fontSize = 10.sp)
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(0.78f),
                    horizontalArrangement = Arrangement.spacedBy(7.dp)
                ) {
                    BotonPlano("Atrás", ColorGrey, ColorNuloBg, Modifier.weight(1f)) { onCancel() }
                    BotonPlano(
                        reviewLabel,
                        if (canReview) ColorBackground else ColorDisabledText,
                        if (canReview) ColorPropina else ColorDisabledBg,
                        Modifier.weight(1f),
                        enabled = canReview
                    ) { confirming = true }
                }
            }
        }
    }
}

@Composable
private fun CampoCierre(
    label: String,
    value: String,
    color: Color,
    active: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val shape = RoundedCornerShape(12.dp)
    Column(
        modifier = modifier
            .clip(shape)
            .background(if (active) color.copy(alpha = 0.18f) else ColorNuloBg)
            .border(1.dp, if (active) color else Color.Transparent, shape)
            .clickable { onClick() }
            .padding(horizontal = 7.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(label, color = color, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Text(value, color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ConfirmarCierre(
    totalsPorTipo: Map<String, Double>,
    dinero: Double,
    kmText: String,
    note: String,
    onBack: () -> Unit,
    onConfirm: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(vertical = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("¿Terminar turno?", color = ColorGasolina, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(7.dp))
        ResumenFila("Taxímetro", fmtEur(dinero), ColorAgencia)
        ResumenFila("Kilómetros", "${kmText.ifEmpty { "0" }} km", ColorExtra)
        listOf("propina", "datafono", "agencia_bono", "extra", "gasolina", "nulo").forEach { tipo ->
            val v = totalsPorTipo[tipo] ?: 0.0
            if (v > 0.0) {
                val meta = categoriaMeta(tipo)
                ResumenFila(meta.label, fmtEur(v), meta.color)
            }
        }
        if (note.isNotBlank()) ResumenFila("Nota", note.take(14), ColorWhite)
        Spacer(modifier = Modifier.height(9.dp))
        Row(
            modifier = Modifier.fillMaxWidth(0.76f),
            horizontalArrangement = Arrangement.spacedBy(7.dp)
        ) {
            BotonPlano("Atrás", ColorGrey, ColorNuloBg, Modifier.weight(1f), onClick = onBack)
            BotonPlano("Cerrar", ColorWhite, ColorGasolina, Modifier.weight(1f), onClick = onConfirm)
        }
        Spacer(modifier = Modifier.height(18.dp))
    }
}

@Composable
private fun BotonPlano(
    label: String,
    textColor: Color,
    bg: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(13.dp))
            .background(bg)
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 7.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = if (enabled) textColor else ColorDisabledText, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ResumenFila(label: String, value: String, color: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = ColorGrey, fontSize = 10.sp)
        Spacer(modifier = Modifier.weight(1f))
        Text(value, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
