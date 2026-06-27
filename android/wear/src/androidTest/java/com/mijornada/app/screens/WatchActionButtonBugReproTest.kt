package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.activity.ComponentActivity
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.mijornada.app.components.WatchActionButton
import com.mijornada.app.theme.ColorBackground
import com.mijornada.app.theme.ColorPause
import com.mijornada.app.theme.ColorPauseBg
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Pixel test instrumentado de regresion para el componente real WatchActionButton.
 *
 * Requisitos para ejecutar este test:
 * - Dispositivo Wear OS conectado por ADB (recomendado: Xiaomi Watch 5, mismo hardware
 *   usado para verificar el fix del 2026-06-26).
 * - O un emulador Wear OS corriendo.
 *
 * Comando: ./gradlew :wear:connectedDebugAndroidTest
 *
 * NO corre en `./gradlew :wear:testDebugUnitTest` porque requiere Activity real.
 */
@RunWith(AndroidJUnit4::class)
class WatchActionButtonBugReproTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun watch_action_button_mantiene_fondo_tras_recomposicion() {
        // Estado observable desde fuera del setContent para forzar recomposicion.
        var recompositionKey by mutableStateOf(0)

        composeTestRule.setContent {
            Box(modifier = Modifier.background(ColorBackground)) {
                WatchActionButton(
                    label = "Pausar turno $recompositionKey",
                    textColor = ColorPause,
                    backgroundColor = ColorPauseBg,
                    modifier = Modifier
                        .size(200.dp, 60.dp)
                        .testTag("button")
                ) {}
            }
        }

        composeTestRule.waitForIdle()

        // Pixel interior alejado del texto y de las esquinas redondeadas.
        val pixelInicial = buttonPixel(x = 20, y = 30)
        assertEquals(
            "Primer render deberia pintar ColorPauseBg en el centro",
            ColorPauseBg.toArgb(),
            pixelInicial
        )

        // Forzar recomposicion sin cambiar enabled: si el fondo dependiera del
        // patron fragil, este muestreo podria volver al color de pantalla.
        composeTestRule.runOnUiThread {
            recompositionKey++
        }
        composeTestRule.waitForIdle()

        val pixelTrasRecomposicion = buttonPixel(x = 20, y = 30)
        assertEquals(
            "Tras recomposicion, el pixel interior debe seguir siendo ColorPauseBg.",
            ColorPauseBg.toArgb(),
            pixelTrasRecomposicion
        )
    }

    private fun buttonPixel(x: Int, y: Int): Int =
        composeTestRule.onNodeWithTag("button")
            .captureToImage()
            .asAndroidBitmap()
            .getPixel(x, y)
}

// Extension para .toArgb() en tests con Compose (Compose Color != android.graphics.Color).
private fun Color.toArgb(): Int = android.graphics.Color.argb(
    (alpha * 255).toInt(),
    (red * 255).toInt(),
    (green * 255).toInt(),
    (blue * 255).toInt()
)
