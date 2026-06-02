package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.R
import com.mijornada.app.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun NoActiveTurnoScreen(
    onStartTurno: () -> Unit,
    onOpenTurnos: () -> Unit
) {
    val fechaLabel = LocalDate.now()
        .format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", Locale("es", "ES")))
        .replaceFirstChar { it.uppercase(Locale("es", "ES")) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth(0.86f)
                .padding(vertical = 18.dp)
        ) {
            BrandTaxiLogo()
            Spacer(modifier = Modifier.height(5.dp))
            Text(
                text = "Mi Turno",
                color = ColorWhite,
                fontSize = 24.sp
            )
            Text(fechaLabel, color = ColorGrey, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(18.dp))

            HomeActionButton(
                label = "🚀  Iniciar Turno",
                textColor = ColorPropina,
                bg = ColorPropinaBg,
                borderColor = ColorPropina,
                onClick = onStartTurno
            )
            Spacer(modifier = Modifier.height(9.dp))
            HomeActionButton(
                label = "Turnos",
                textColor = ColorDatafono,
                bg = ColorDatafonoBg,
                borderColor = ColorDatafono,
                onClick = onOpenTurnos
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text("Móvil conectado", color = ColorPropina, fontSize = 9.sp)
        }
    }
}

@Composable
private fun BrandTaxiLogo() {
    Image(
        painter = painterResource(id = R.drawable.brand_taxi_logo),
        contentDescription = "Mi Turno Taxi",
        contentScale = ContentScale.Fit,
        modifier = Modifier
            .fillMaxWidth(0.66f)
            .height(58.dp)
    )
}

@Composable
private fun HomeActionButton(
    label: String,
    textColor: androidx.compose.ui.graphics.Color,
    bg: androidx.compose.ui.graphics.Color,
    borderColor: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(bg)
            .border(1.5.dp, borderColor, RoundedCornerShape(18.dp))
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = textColor, fontSize = 14.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
    }
}
