package com.mijornada.app.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import com.mijornada.app.theme.*

@Composable
fun NoActiveTurnoScreen(
    onStartTurno: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Sin turno activo",
                color = ColorWhite,
                fontSize = 16.sp
            )
            Spacer(modifier = Modifier.height(20.dp))
            Chip(
                onClick = onStartTurno,
                label = { Text("Iniciar turno", color = ColorPropina) },
                colors = ChipDefaults.chipColors(
                    backgroundColor = ColorPropinaBg,
                    contentColor = ColorPropina
                ),
                border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorPropina)),
                modifier = Modifier.width(130.dp)
            )
        }
    }
}
