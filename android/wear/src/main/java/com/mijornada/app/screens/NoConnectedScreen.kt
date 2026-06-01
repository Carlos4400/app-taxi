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
fun NoConnectedScreen(
    onRetry: () -> Unit
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
                text = "⚠️",
                fontSize = 24.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Móvil no conectado",
                color = ColorGrey,
                fontSize = 14.sp
            )
            Spacer(modifier = Modifier.height(16.dp))
            Chip(
                onClick = onRetry,
                label = { Text("Reintentar", color = ColorExtra) },
                colors = ChipDefaults.chipColors(
                    backgroundColor = ColorExtraBg,
                    contentColor = ColorExtra
                ),
                border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorExtra)),
                modifier = Modifier.width(120.dp)
            )
        }
    }
}
