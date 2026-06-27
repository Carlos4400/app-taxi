package com.mijornada.app.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.components.WatchActionButton
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
    // rememberSaveable: el borrador (importe y nota) sobrevive a la recreacion
    // de la Activity (cambio de configuracion o muerte de proceso).
    var amountText by rememberSaveable { mutableStateOf(amountToText(initialAmount)) }
    var note by rememberSaveable { mutableStateOf(initialNote) }
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
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                // bottom 44: que el último botón ("Eliminar entrada" en edición)
                // no lo recorte la curva inferior del círculo al final del scroll.
                .padding(top = 18.dp, bottom = 44.dp),
            horizontalAlignment = Alignment.CenterHorizontally
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
                note = note,
                onClick = { onRequestNote(note) { result -> note = result } }
            )

            if (onDelete != null) {
                Spacer(modifier = Modifier.height(5.dp))
                WatchActionButton(
                    label = "Eliminar entrada",
                    textColor = ColorGasolina,
                    backgroundColor = ColorGasolinaBg,
                    modifier = Modifier.fillMaxWidth(0.72f),
                    fontSize = 11,
                    contentPadding = PaddingValues(vertical = 7.dp)
                ) { onDelete() }
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
    // Patron robusto: background(color, shape) sin clip previo. No usa
    // WatchActionButton porque tiene tamano fijo 42x34.dp (no flexible) y solo
    // muestra el caracter '✓', no una etiqueta.
    Box(
        modifier = Modifier
            .size(width = 42.dp, height = 34.dp)
            .background(if (enabled) color else ColorDisabledBg, RoundedCornerShape(12.dp))
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
    note: String,
    onClick: () -> Unit
) {
    val selected = note.isNotBlank()
    // Patron robusto: background(color, shape) -> clickable -> padding. El clip
    // se omite a proposito porque el ripple rectangular sobre un area pequena
    // apenas se nota y asi evitamos el patron fragil clip().background().
    // No usa WatchActionButton porque tiene contenido condicional (un Column
    // con cabecera + nota multilinea cuando hay texto).
    Box(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .background(ColorNuloBg, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        if (!selected) {
            Text(
                text = "+ Nota",
                color = ColorGrey,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        } else {
            // Nota completa con salto de linea (antes se mostraba "✓" + 12 chars).
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "✎ Nota",
                    color = ColorGrey,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = note,
                    color = ColorWhite,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
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

            // Patron robusto: background(color, shape) -> clickable -> padding. No usa
            // WatchTileBox porque necesita ser clickable.
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.86f)
                    .background(Color(0xFF15151C), RoundedCornerShape(12.dp))
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

            WatchActionButton(
                label = "Guardar",
                textColor = if (note.isNotBlank()) ColorBackground else ColorGrey,
                backgroundColor = if (note.isNotBlank()) ColorPropina else ColorNuloBg,
                modifier = Modifier.fillMaxWidth(0.86f),
                enabled = note.isNotBlank(),
                fontSize = 13,
                contentPadding = PaddingValues(vertical = 11.dp)
            ) { onSave() }
            if (onDelete != null) {
                Spacer(modifier = Modifier.height(6.dp))
                WatchActionButton(
                    label = "Eliminar nota",
                    textColor = ColorGasolina,
                    backgroundColor = ColorGasolinaBg,
                    modifier = Modifier.fillMaxWidth(0.86f),
                    fontSize = 12,
                    contentPadding = PaddingValues(vertical = 10.dp)
                ) { onDelete() }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
