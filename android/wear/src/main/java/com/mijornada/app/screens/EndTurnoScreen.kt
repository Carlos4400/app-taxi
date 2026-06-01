package com.mijornada.app.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.mijornada.app.theme.*

@Composable
fun EndTurnoScreen(
    onConfirm: (dinero: Double, km: Double) -> Unit,
    onCancel: () -> Unit
) {
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: Kilometros
    var dinero by remember { mutableStateOf(0) }
    var km by remember { mutableStateOf(0) }

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
            if (step == 1) {
                item {
                    Text("Total Taxímetro", color = ColorAgencia, fontSize = 14.sp)
                }
                item {
                    Text("${dinero}€", color = ColorWhite, fontSize = 24.sp)
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(0.9f),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        IncrementButton(text = "+5", onClick = { dinero += 5 }, color = ColorAgencia, modifier = Modifier.weight(1f))
                        IncrementButton(text = "+20", onClick = { dinero += 20 }, color = ColorAgencia, modifier = Modifier.weight(1f))
                        IncrementButton(text = "+50", onClick = { dinero += 50 }, color = ColorAgencia, modifier = Modifier.weight(1f))
                        IncrementButton(text = "+100", onClick = { dinero += 100 }, color = ColorAgencia, modifier = Modifier.weight(1f))
                    }
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(0.9f),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Chip(
                            onClick = { dinero = 0 },
                            label = { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Borrar", color = ColorGrey, fontSize = 12.sp) } },
                            colors = ChipDefaults.chipColors(backgroundColor = ColorNuloBg),
                            border = ChipDefaults.chipBorder(BorderStroke(1.dp, ColorGrey)),
                            modifier = Modifier.weight(1f)
                        )
                        Chip(
                            onClick = { if (dinero > 0) step = 2 },
                            enabled = dinero > 0,
                            label = { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Siguiente", color = ColorPropina, fontSize = 12.sp) } },
                            colors = ChipDefaults.chipColors(backgroundColor = ColorPropinaBg),
                            border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorPropina)),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                item {
                    Spacer(modifier = Modifier.height(6.dp))
                }
                item {
                    Chip(
                        onClick = onCancel,
                        label = { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Cancelar", color = ColorNulo, fontSize = 12.sp) } },
                        colors = ChipDefaults.chipColors(backgroundColor = ColorNuloBg),
                        border = ChipDefaults.chipBorder(BorderStroke(1.1.dp, ColorNulo)),
                        modifier = Modifier.fillMaxWidth(0.5f)
                    )
                }
            } else {
                item {
                    Text("Kilómetros Recorridos", color = ColorExtra, fontSize = 14.sp)
                }
                item {
                    Text("${km} km", color = ColorWhite, fontSize = 24.sp)
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(0.9f),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        IncrementButton(text = "+10", onClick = { km += 10 }, color = ColorExtra, modifier = Modifier.weight(1f))
                        IncrementButton(text = "+50", onClick = { km += 50 }, color = ColorExtra, modifier = Modifier.weight(1f))
                        IncrementButton(text = "+100", onClick = { km += 100 }, color = ColorExtra, modifier = Modifier.weight(1f))
                        IncrementButton(text = "+200", onClick = { km += 200 }, color = ColorExtra, modifier = Modifier.weight(1f))
                    }
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(0.9f),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Chip(
                            onClick = { step = 1 },
                            label = { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Atrás", color = ColorGrey, fontSize = 12.sp) } },
                            colors = ChipDefaults.chipColors(backgroundColor = ColorNuloBg),
                            border = ChipDefaults.chipBorder(BorderStroke(1.dp, ColorGrey)),
                            modifier = Modifier.weight(1f)
                        )
                        Chip(
                            onClick = { if (km > 0) onConfirm(dinero.toDouble(), km.toDouble()) },
                            enabled = km > 0,
                            label = { Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) { Text("Finalizar", color = ColorGasolina, fontSize = 12.sp) } },
                            colors = ChipDefaults.chipColors(backgroundColor = ColorGasolinaBg),
                            border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorGasolina)),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}
