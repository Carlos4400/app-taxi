package com.mijornada.app.components

import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.wear.compose.material.Text
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Test de regresion para tarjetas estaticas Wear OS: el contenido de
 * WatchTileBox debe colocarse en vertical, no superponerse.
 */
@RunWith(AndroidJUnit4::class)
class WatchTileBoxLayoutTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun watch_tile_box_coloca_los_hijos_en_vertical() {
        composeTestRule.setContent {
            Box(
                modifier = Modifier
                    .background(Color.Black)
                    .padding(8.dp)
            ) {
                WatchTileBox(
                    backgroundColor = Color(0xFF15151C),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Text("Primero", color = Color.White, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Segundo", color = Color.White, fontSize = 16.sp)
                }
            }
        }

        composeTestRule.waitForIdle()

        val primero = composeTestRule.onNodeWithText("Primero")
            .fetchSemanticsNode()
            .boundsInRoot
        val segundo = composeTestRule.onNodeWithText("Segundo")
            .fetchSemanticsNode()
            .boundsInRoot

        assertTrue(
            "WatchTileBox debe apilar el contenido: 'Segundo' debe quedar debajo de 'Primero'.",
            segundo.top >= primero.bottom
        )
    }
}
