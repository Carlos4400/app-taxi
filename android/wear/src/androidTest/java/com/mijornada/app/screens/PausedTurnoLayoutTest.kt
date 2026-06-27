package com.mijornada.app.screens

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onRoot
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Test visual de layout para el estado pausado: la accion principal debe tener
 * presencia de boton primario y area tactil comoda en reloj.
 */
@RunWith(AndroidJUnit4::class)
class PausedTurnoLayoutTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun boton_continuar_turno_es_ancho_y_comodo() {
        composeTestRule.setContent {
            ActiveTurnoScreen(
                fechaTurno = "Sabado, 27 de junio",
                startTime = "22:17",
                isPaused = true,
                totalsPorTipo = emptyMap(),
                numPorTipo = emptyMap(),
                entradas = emptyList(),
                pauseStartTime = "22:17",
                totalPausedMinutes = 1,
                onSelectCategory = {},
                onTogglePause = { true },
                onAddNote = { true },
                onEditEntry = {},
                onEndTurno = {}
            )
        }

        composeTestRule.waitForIdle()

        val rootBounds = composeTestRule.onRoot()
            .fetchSemanticsNode()
            .boundsInRoot
        val buttonBounds = composeTestRule.onNode(continuarTurnoButtonMatcher())
            .fetchSemanticsNode()
            .boundsInRoot

        assertTrue(
            "Continuar Turno debe ocupar al menos el 60% del ancho visible para sentirse accion principal.",
            buttonBounds.width >= rootBounds.width * 0.60f
        )
        assertTrue(
            "Continuar Turno no debe superar el 68% del ancho visible porque queda en la zona baja circular.",
            buttonBounds.width <= rootBounds.width * 0.68f
        )
        assertTrue(
            "Continuar Turno debe dejar margen inferior dentro del reloj redondo.",
            buttonBounds.bottom <= rootBounds.height * 0.88f
        )
        assertTrue(
            "Continuar Turno debe tener al menos 48dp/pixels de alto tactil en el reloj.",
            buttonBounds.height >= 48f
        )
    }

    private fun continuarTurnoButtonMatcher(): SemanticsMatcher =
        hasClickAction() and hasText("Continuar Turno", substring = false)
}
