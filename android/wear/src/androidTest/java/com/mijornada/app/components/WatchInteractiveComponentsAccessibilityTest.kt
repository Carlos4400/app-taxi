package com.mijornada.app.components

import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.wear.compose.material.Text
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Test de accesibilidad para componentes interactivos Wear OS.
 * Los botones/tarjetas deben conservar area tactil minima y rol de boton.
 */
@RunWith(AndroidJUnit4::class)
class WatchInteractiveComponentsAccessibilityTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun watch_action_button_expone_rol_y_area_tactil_minima() {
        composeTestRule.setContent {
            WatchActionButton(
                label = "Accion",
                textColor = Color.White,
                backgroundColor = Color(0xFF15151C),
                modifier = Modifier
                    .size(width = 32.dp, height = 24.dp)
                    .testTag("action_button"),
                contentPadding = PaddingValues(0.dp),
                shape = RoundedCornerShape(8.dp)
            ) {}
        }

        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithTag("action_button")
            .assert(hasButtonRole())

        val bounds = composeTestRule.onNodeWithTag("action_button")
            .fetchSemanticsNode()
            .boundsInRoot

        assertTrue("WatchActionButton debe medir al menos 48dp de ancho tactil.", bounds.width >= 48f)
        assertTrue("WatchActionButton debe medir al menos 48dp de alto tactil.", bounds.height >= 48f)
    }

    @Test
    fun watch_metric_card_expone_rol_y_area_tactil_minima() {
        composeTestRule.setContent {
            WatchMetricCard(
                backgroundColor = Color(0xFF15151C),
                borderColor = Color(0xFF36CFFF),
                modifier = Modifier
                    .size(width = 32.dp, height = 24.dp)
                    .testTag("metric_card"),
                contentPadding = PaddingValues(0.dp),
                shape = RoundedCornerShape(8.dp),
                onClick = {}
            ) {
                Column {
                    Text("Dato", color = Color.White)
                }
            }
        }

        composeTestRule.waitForIdle()

        composeTestRule.onNodeWithTag("metric_card")
            .assert(hasButtonRole())

        val bounds = composeTestRule.onNodeWithTag("metric_card")
            .fetchSemanticsNode()
            .boundsInRoot

        assertTrue("WatchMetricCard debe medir al menos 48dp de ancho tactil.", bounds.width >= 48f)
        assertTrue("WatchMetricCard debe medir al menos 48dp de alto tactil.", bounds.height >= 48f)
    }

    private fun hasButtonRole(): SemanticsMatcher =
        SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)
}
