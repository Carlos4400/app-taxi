package com.mijornada.app.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.*
import com.mijornada.app.theme.*

@Composable
fun ActiveTurnoScreen(
    startTime: String,
    onSelectCategory: (String) -> Unit,
    onAddNote: () -> Unit,
    onEndTurno: () -> Unit
) {
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
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Turno Activo",
                        color = ColorPropina,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Desde $startTime",
                        color = ColorGrey,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CategoryChip(
                        label = "Propina",
                        color = ColorPropina,
                        bgColor = ColorPropinaBg,
                        onClick = { onSelectCategory("propina") },
                        modifier = Modifier.weight(1f)
                    )
                    CategoryChip(
                        label = "Datáfono",
                        color = ColorDatafono,
                        bgColor = ColorDatafonoBg,
                        onClick = { onSelectCategory("datafono") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CategoryChip(
                        label = "Extra",
                        color = ColorExtra,
                        bgColor = ColorExtraBg,
                        onClick = { onSelectCategory("extra") },
                        modifier = Modifier.weight(1f)
                    )
                    CategoryChip(
                        label = "Gasolina",
                        color = ColorGasolina,
                        bgColor = ColorGasolinaBg,
                        onClick = { onSelectCategory("gasolina") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CategoryChip(
                        label = "Nulo",
                        color = ColorNulo,
                        bgColor = ColorNuloBg,
                        onClick = { onSelectCategory("nulo") },
                        modifier = Modifier.weight(1f)
                    )
                    CategoryChip(
                        label = "Nota",
                        color = ColorWhite,
                        bgColor = ColorNuloBg,
                        onClick = onAddNote,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(8.dp))
            }

            item {
                Chip(
                    onClick = onEndTurno,
                    label = { Text("Terminar turno", color = ColorGasolina) },
                    colors = ChipDefaults.chipColors(
                        backgroundColor = ColorGasolinaBg,
                        contentColor = ColorGasolina
                    ),
                    border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorGasolina)),
                    modifier = Modifier.fillMaxWidth(0.9f)
                )
            }
        }
    }
}

@Composable
fun CategoryChip(
    label: String,
    color: Color,
    bgColor: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Chip(
        onClick = onClick,
        label = {
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                Text(label, color = color, fontSize = 12.sp)
            }
        },
        colors = ChipDefaults.chipColors(
            backgroundColor = bgColor,
            contentColor = color
        ),
        border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, color)),
        modifier = modifier
    )
}
