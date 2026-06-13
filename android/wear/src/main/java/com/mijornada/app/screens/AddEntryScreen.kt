package com.mijornada.app.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*

@Composable
fun AddEntryScreen(
    categoryLabel: String,
    categoryColor: Color,
    onSave: (amount: Double, note: String) -> Boolean,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit,
    initialAmount: Double = 0.0,
    initialNote: String = "",
    onDelete: (() -> Unit)? = null,
    esNota: Boolean = false
) {
    var amountText by remember { mutableStateOf(amountToText(initialAmount)) }
    var note by remember { mutableStateOf(initialNote) }
    var saving by remember { mutableStateOf(false) }

    val amount = parseAmount(amountText)

    if (esNota) {
        NotaEditor(
            note = note,
            onEditarTexto = { onRequestNote(note) { result -> note = result } },
            onSave = {
                if (note.isNotBlank() && !saving) {
                    saving = onSave(0.0, note)
                }
            },
            onCancel = onCancel,
            onDelete = onDelete
        )
        return
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(0.78f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onCancel() })
                EntryTitle(
                    categoryLabel = categoryLabel,
                    categoryColor = categoryColor,
                    editing = onDelete != null
                )
                Spacer(modifier = Modifier.width(22.dp))
            }

            Spacer(modifier = Modifier.height(3.dp))

            Row(
                modifier = Modifier.fillMaxWidth(0.74f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "${if (amountText.isEmpty()) "0" else amountText}€",
                    color = ColorWhite,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(9.dp))
                GuardarImporteButton(
                    enabled = amount > 0.0 && !saving,
                    color = categoryColor,
                    onClick = {
                        if (!saving) {
                            saving = onSave(amount, note)
                        }
                    }
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            NumericKeypad(
                onKey = { key -> amountText = applyKey(amountText, key) },
                color = categoryColor
            )

            Spacer(modifier = Modifier.height(7.dp))

            NotaButton(
                text = if (note.isBlank()) "+ Nota" else "✓ ${note.take(12)}",
                selected = note.isNotBlank(),
                onClick = { onRequestNote(note) { result -> note = result } }
            )

            if (onDelete != null) {
                Spacer(modifier = Modifier.height(5.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.72f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(ColorGasolinaBg)
                        .clickable { onDelete() }
                        .padding(vertical = 7.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Eliminar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun EntryTitle(
    categoryLabel: String,
    categoryColor: Color,
    editing: Boolean
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        if (editing) {
            Text("Editar", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(4.dp))
        }
        Text(categoryLabel, color = categoryColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun GuardarImporteButton(
    enabled: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(width = 42.dp, height = 34.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (enabled) color else ColorDisabledBg)
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "✓",
            color = if (enabled) ColorBackground else ColorDisabledText,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun NotaButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .clip(RoundedCornerShape(12.dp))
            .background(ColorNuloBg)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) ColorWhite else ColorGrey,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun NotaEditor(
    note: String,
    onEditarTexto: () -> Unit,
    onSave: () -> Unit,
    onCancel: () -> Unit,
    onDelete: (() -> Unit)?
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(22.dp))
            Row(
                modifier = Modifier.fillMaxWidth(0.86f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onCancel() })
                Text("Nota del turno", color = ColorWhite, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(16.dp))
            }

            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(0.86f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFF15151C))
                    .clickable { onEditarTexto() }
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (note.isBlank()) "Toca para escribir…" else note,
                    color = if (note.isBlank()) ColorGrey else ColorWhite,
                    fontSize = 13.sp
                )
            }
            Text("✎ Editar texto", color = ColorGrey, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp).clickable { onEditarTexto() })

            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(0.86f)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (note.isNotBlank()) ColorPropina else ColorNuloBg)
                    .clickable(enabled = note.isNotBlank()) { onSave() }
                    .padding(vertical = 11.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Guardar", color = if (note.isNotBlank()) ColorBackground else ColorGrey, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
            if (onDelete != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.86f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(ColorGasolinaBg)
                        .clickable { onDelete() }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Eliminar nota", color = ColorGasolina, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
