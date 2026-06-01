package com.mijornada.app.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.*
import com.mijornada.app.theme.*

@Composable
fun AddEntryScreen(
    categoryLabel: String,
    categoryColor: Color,
    onSave: (amount: Double, note: String) -> Unit,
    onCancel: () -> Unit
) {
    var amount by remember { mutableStateOf(0) }
    var note by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            item {
                Text(
                    text = categoryLabel,
                    color = categoryColor,
                    fontSize = 14.sp
                )
            }

            item {
                Text(
                    text = "${amount}€",
                    color = ColorWhite,
                    fontSize = 24.sp
                )
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(0.9f),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    IncrementButton(text = "+1", onClick = { amount += 1 }, color = categoryColor, modifier = Modifier.weight(1f))
                    IncrementButton(text = "+2", onClick = { amount += 2 }, color = categoryColor, modifier = Modifier.weight(1f))
                    IncrementButton(text = "+5", onClick = { amount += 5 }, color = categoryColor, modifier = Modifier.weight(1f))
                    IncrementButton(text = "+10", onClick = { amount += 10 }, color = categoryColor, modifier = Modifier.weight(1f))
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(0.9f),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Chip(
                        onClick = { amount = 0 },
                        label = {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text("C", color = ColorGrey, fontSize = 12.sp)
                            }
                        },
                        colors = ChipDefaults.chipColors(
                            backgroundColor = ColorNuloBg,
                            contentColor = ColorGrey
                        ),
                        border = ChipDefaults.chipBorder(BorderStroke(1.dp, ColorGrey)),
                        modifier = Modifier.weight(1f)
                    )
                    Chip(
                        onClick = {
                            // Entrada de nota sencilla (opcional, en esta fase fija)
                            note = if (note.isEmpty()) "Reloj" else ""
                        },
                        label = {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text(if (note.isEmpty()) "+Nota" else "✓Nota", color = ColorWhite, fontSize = 12.sp)
                            }
                        },
                        colors = ChipDefaults.chipColors(
                            backgroundColor = ColorNuloBg,
                            contentColor = ColorWhite
                        ),
                        border = ChipDefaults.chipBorder(BorderStroke(1.dp, ColorWhite)),
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(6.dp))
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(0.9f),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Chip(
                        onClick = onCancel,
                        label = {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text("Volver", color = ColorNulo, fontSize = 12.sp)
                            }
                        },
                        colors = ChipDefaults.chipColors(
                            backgroundColor = ColorNuloBg,
                            contentColor = ColorNulo
                        ),
                        border = ChipDefaults.chipBorder(BorderStroke(1.dp, ColorNulo)),
                        modifier = Modifier.weight(1f)
                    )
                    Chip(
                        onClick = {
                            if (amount > 0) {
                                onSave(amount.toDouble(), note)
                            }
                        },
                        enabled = amount > 0,
                        label = {
                            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                Text("Guardar", color = ColorPropina, fontSize = 12.sp)
                            }
                        },
                        colors = ChipDefaults.chipColors(
                            backgroundColor = ColorPropinaBg,
                            contentColor = ColorPropina
                        ),
                        border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorPropina)),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
fun IncrementButton(
    text: String,
    onClick: () -> Unit,
    color: Color,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(
            backgroundColor = ColorBackground,
            contentColor = color
        ),
        border = ButtonDefaults.buttonBorder(BorderStroke(1.dp, color)),
        modifier = modifier.height(32.dp)
    ) {
        Text(text, color = color, fontSize = 11.sp)
    }
}
