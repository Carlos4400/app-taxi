package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
    pendingOpsCount: Int = 0,
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
        if (pendingOpsCount > 0) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 6.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(ColorPropinaBg)
                    .padding(horizontal = 6.dp, vertical = 1.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "↻ Sincronizando",
                    color = ColorPropina,
                    fontSize = 8.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                )
            }
        }
        // Dimensiones ajustadas al area util de una pantalla redonda
        // (Xiaomi Watch 5): contenido total < diametro inscrito para que el
        // boton inferior no quede recortado por la curva.
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth(0.78f)
                .padding(vertical = 10.dp)
        ) {
            BrandTaxiLogo()
            Spacer(modifier = Modifier.height(3.dp))
            Text(
                text = "Mi Turno",
                color = ColorWhite,
                fontSize = 19.sp
            )
            Text(fechaLabel, color = ColorGrey, fontSize = 9.sp)
            Spacer(modifier = Modifier.height(10.dp))

            HomeActionButton(
                label = "Iniciar Turno",
                iconRes = R.drawable.ic_cohete,
                textColor = ColorPropina,
                bg = ColorPropinaBg,
                borderColor = ColorPropina,
                onClick = onStartTurno
            )
            Spacer(modifier = Modifier.height(7.dp))
            HomeActionButton(
                label = "Turnos",
                iconRes = R.drawable.ic_clipboard,
                textColor = ColorDatafono,
                bg = ColorDatafonoBg,
                borderColor = ColorDatafono,
                onClick = onOpenTurnos
            )
            Spacer(modifier = Modifier.height(8.dp))
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
            .fillMaxWidth(0.52f)
            .height(42.dp)
    )
}

@Composable
private fun HomeActionButton(
    label: String,
    iconRes: Int,
    textColor: androidx.compose.ui.graphics.Color,
    bg: androidx.compose.ui.graphics.Color,
    borderColor: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    // Debounce temporal en lugar de bloqueo permanente: el antiguo flag
    // `clicked` desactivaba el boton para siempre tras el primer toque,
    // dejando "Turnos" inutilizable si la navegacion no ocurria al instante.
    var lastClickMs by remember { mutableStateOf(0L) }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(bg)
            .border(1.5.dp, borderColor, RoundedCornerShape(16.dp))
            .clickable {
                val now = android.os.SystemClock.elapsedRealtime()
                if (now - lastClickMs > 600L) {
                    lastClickMs = now
                    onClick()
                }
            }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        // Icono + texto como los botones de la home del móvil; el vector es
        // blanco y se tinta con el color del botón.
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(id = iconRes),
                contentDescription = null,
                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(textColor),
                modifier = Modifier.size(15.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(label, color = textColor, fontSize = 13.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
        }
    }
}
