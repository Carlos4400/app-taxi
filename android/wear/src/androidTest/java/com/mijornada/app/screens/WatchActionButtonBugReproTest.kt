package com.mijornada.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import androidx.activity.ComponentActivity
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.mijornada.app.theme.ColorPauseBg
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Pixel test instrumentado que REPRODUCE el bug del patron fragil clip().background()
 * en los botones del reloj (ver PLAN_FIX_BOTONES_WEAR.md, Fase 2).
 *
 * Antes del fix (estado actual): el test DEBE FALLAR. El pixel central del boton
 * pasa de #101827 (ColorPauseBg) a #0D0D14 (fondo de pantalla) tras la recomposicion
 * disparada por el cambio de alpha. Esto confirma que el bug existe.
 *
 * Tras el fix (Commit 5: usar WatchActionButton en lugar del dummy BuggyWatchButton):
 * el test DEBE PASAR. El pixel central se mantiene estable en #101827.
 *
 * Requisitos para ejecutar este test:
 * - Dispositivo Wear OS conectado por ADB (recomendado: Xiaomi Watch 5, mismo hardware
 *   usado para verificar el fix del 2026-06-26).
 * - O un emulador Wear OS corriendo.
 *
 * Comando: ./gradlew :wear:connectedDebugAndroidTest
 *
 * NO corre en `./gradlew :wear:testDebugUnitTest` porque requiere Activity real.
 *
 * Verificado en hardware real (Xiaomi Watch 5) con muestreo de pixeles:
 * el fondo del boton "Pausar turno" pasa de #101827 (ColorPauseBg) a #0D0D14
 * (fondo de pantalla) tras anadir una entrada. Ver CAMBIOS_AGENT1.md,
 * entrada 2026-06-26 05:50.
 */
@RunWith(AndroidJUnit4::class)
class WatchActionButtonBugReproTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    /**
     * Reproduccion EXACTA del patron viejo fragil que causa el bug.
     * Usado solo en este test para confirmar que el patron existe.
     * Sera eliminado en el Commit 5 cuando WatchActionButton (patron nuevo) lo sustituya.
     */
    @Composable
    private fun BuggyWatchButton(
        label: String,
        textColor: Color,
        backgroundColor: Color,
        modifier: Modifier = Modifier,
        enabled: Boolean = true,
        onClick: () -> Unit
    ) {
        val shape = RoundedCornerShape(14.dp)
        Box(
            modifier = modifier
                .clip(shape)                        // patron viejo: clip antes de background
                .background(backgroundColor)        // patron viejo: background sin shape
                .alpha(if (enabled) 1f else 0.5f)  // cambio de alpha = recomposicion
                .clickable(enabled = enabled) { onClick() }
                .padding(vertical = 10.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(label, color = textColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }

    @Test
    fun boton_pausar_turno_pierde_fondo_tras_recomposicion_con_patron_viejo() {
        // Estado observable desde fuera del setContent para forzar recomposicion.
        var toggleEnabled by mutableStateOf(true)

        composeTestRule.setContent {
            BuggyWatchButton(
                label = "Pausar turno",
                textColor = Color.White,
                backgroundColor = ColorPauseBg,  // #101827
                enabled = toggleEnabled,
                modifier = Modifier
                    .size(200.dp, 60.dp)
                    .testTag("button")
            ) {}
        }

        composeTestRule.waitForIdle()

        // Primer render: el pixel central deberia ser ColorPauseBg (#101827).
        val pixelInicial = composeTestRule.onNodeWithTag("button")
            .captureToImage()
            .asAndroidBitmap()
            .getPixel(100, 30)
        assertEquals(
            "Primer render deberia pintar ColorPauseBg en el centro",
            ColorPauseBg.toArgb(),
            pixelInicial
        )

        // Forzar recomposicion cambiando enabled (alpha 1.0 -> 0.5).
        // Esto reproduce la situacion del bug: tras anadir entrada, pendingOpsCount
        // cambia brevemente y alpha varia, dejando el clip sin fondo pintado.
        composeTestRule.runOnUiThread {
            toggleEnabled = false
        }
        composeTestRule.waitForIdle()

        // Segundo render: el pixel central deberia SEGUIR siendo ColorPauseBg.
        // Si el bug existe, el pixel sera ColorBackground (#0D0D14) y este assert FALLARA.
        val pixelTrasRecomposicion = composeTestRule.onNodeWithTag("button")
            .captureToImage()
            .asAndroidBitmap()
            .getPixel(100, 30)
        assertEquals(
            "Tras recomposicion con alpha < 1, el pixel central deberia seguir siendo ColorPauseBg. " +
                "Si falla con ColorBackground, el patron fragil esta reproducido.",
            ColorPauseBg.toArgb(),
            pixelTrasRecomposicion
        )
    }
}

// Extension para .toArgb() en tests con Compose (Compose Color != android.graphics.Color).
private fun Color.toArgb(): Int = android.graphics.Color.argb(
    (alpha * 255).toInt(),
    (red * 255).toInt(),
    (green * 255).toInt(),
    (blue * 255).toInt()
)