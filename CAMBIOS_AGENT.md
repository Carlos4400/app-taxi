## 2026-06-27 23:10 - Mejorar accesibilidad Wear OS

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/components/WatchActionButton.kt`, `android/wear/src/main/java/com/mijornada/app/components/WatchMetricCard.kt`, `android/wear/src/androidTest/java/com/mijornada/app/components/WatchInteractiveComponentsAccessibilityTest.kt`

### Cambio 1 - Area tactil y rol de WatchActionButton

#### Codigo anterior
```kotlin
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
```

```kotlin
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.text.font.FontWeight
```

```kotlin
    Box(
        modifier = modifier
            .background(backgroundColor, shape)   // <-- patron correcto: background CON shape primero
            .then(borderMod)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)                         // <-- clip al final, solo recorta el ripple del clickable
            .clickable(enabled = enabled) { onClick() }
            .padding(contentPadding),
        contentAlignment = Alignment.Center
    ) {
```

#### Codigo nuevo
```kotlin
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.width
```

```kotlin
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
```

```kotlin
    Box(
        modifier = Modifier
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .then(modifier)
            .background(backgroundColor, shape)   // <-- patron correcto: background CON shape primero
            .then(borderMod)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)                         // <-- clip al final, solo recorta el ripple del clickable
            .clickable(enabled = enabled, role = Role.Button) { onClick() }
            .padding(contentPadding),
        contentAlignment = Alignment.Center
    ) {
```

#### Por que se cambio
`WatchActionButton` era clickable, pero no declaraba rol semantico de boton ni garantizaba desde el componente un minimo tactil de 48dp. `sizeIn(minWidth = 48.dp, minHeight = 48.dp)` y `role = Role.Button` centralizan ese requisito para todos sus usos en Wear OS sin cambiar los callbacks.

### Cambio 2 - Area tactil y rol de WatchMetricCard

#### Codigo anterior
```kotlin
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
```

```kotlin
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
```

```kotlin
    Column(
        modifier = modifier
            .background(backgroundColor, shape)
            .border(borderWidth, effectiveBorderColor, shape)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)
            .clickable(enabled = enabled) { onClick() }
            .padding(contentPadding),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
```

#### Codigo nuevo
```kotlin
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
```

```kotlin
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
```

```kotlin
    Column(
        modifier = Modifier
            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
            .then(modifier)
            .background(backgroundColor, shape)
            .border(borderWidth, effectiveBorderColor, shape)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)
            .clickable(enabled = enabled, role = Role.Button) { onClick() }
            .padding(contentPadding),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
```

#### Por que se cambio
`WatchMetricCard` se usa como tarjeta interactiva, pero no imponia area tactil minima ni rol semantico de boton. El minimo de 48dp y el rol `Role.Button` hacen que las tarjetas clicables sean mas consistentes y accesibles en reloj.

### Cambio 3 - Test de accesibilidad interactiva

#### Codigo anterior
`No existia WatchInteractiveComponentsAccessibilityTest en android/wear/src/androidTest/java/com/mijornada/app/components/WatchInteractiveComponentsAccessibilityTest.kt.`

#### Codigo nuevo
```kotlin
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
```

#### Por que se cambio
El test fija que los componentes interactivos reutilizables mantengan `Role.Button` y area tactil minima aunque una pantalla intente renderizarlos con un tamano inferior. Esto protege la mejora de accesibilidad sin depender de revisar cada uso manualmente.

## 2026-06-27 22:51 - Reducir boton de reanudar turno

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/androidTest/java/com/mijornada/app/screens/PausedTurnoLayoutTest.kt`

### Cambio 1 - Ancho seguro inferior

#### Codigo anterior
```kotlin
private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
private const val PausedSafeWidth = 0.76f
```

#### Codigo nuevo
```kotlin
private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
private const val PausedSafeWidth = 0.66f
```

#### Por que se cambio
`0.76f` hacia que el boton `Continuar Turno` se saliera visualmente por los bordes inferiores del reloj redondo. `0.66f` mantiene el boton mas grande que el estado original compacto, pero dentro de una anchura segura para la zona baja circular.

### Cambio 2 - Altura y padding de Continuar Turno

#### Codigo anterior
```kotlin
            WatchActionButton(
                label = if (resuming) "Reanudando..." else "Continuar Turno",
                textColor = ColorPause,
                backgroundColor = ColorPauseBg,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp),
                borderColor = ColorPauseBorder,
                borderWidth = 2.dp,
                shape = RoundedCornerShape(18.dp),
                fontSize = 13,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 11.dp),
                leadingIcon = { PlayIcon(size = 21.dp, color = ColorPause) }
            ) { resume() }
```

#### Codigo nuevo
```kotlin
            WatchActionButton(
                label = if (resuming) "Reanudando..." else "Continuar Turno",
                textColor = ColorPause,
                backgroundColor = ColorPauseBg,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 48.dp),
                borderColor = ColorPauseBorder,
                borderWidth = 2.dp,
                shape = RoundedCornerShape(18.dp),
                fontSize = 12,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 9.dp, vertical = 9.dp),
                leadingIcon = { PlayIcon(size = 20.dp, color = ColorPause) }
            ) { resume() }
```

#### Por que se cambio
La combinacion `52.dp`, fuente `13`, icono `21.dp` y padding vertical `11.dp` dejaba el borde inferior demasiado cerca del marco. `48.dp`, fuente `12`, icono `20.dp` y padding `9.dp` conservan area tactil minima y reducen el riesgo de recorte en la esfera.

### Cambio 3 - Limites del test pausado

#### Codigo anterior
```kotlin
        assertTrue(
            "Continuar Turno debe ocupar al menos el 70% del ancho visible para sentirse accion principal.",
            buttonBounds.width >= rootBounds.width * 0.70f
        )
        assertTrue(
            "Continuar Turno debe tener al menos 48dp/pixels de alto tactil en el reloj.",
            buttonBounds.height >= 48f
        )
```

#### Codigo nuevo
```kotlin
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
```

#### Por que se cambio
El test anterior solo exigia que el boton fuera grande, pero no limitaba su anchura ni su posicion inferior. Los nuevos asserts fijan una banda de anchura segura y margen inferior para evitar que el boton vuelva a salirse de la curva baja del reloj.

## 2026-06-27 22:36 - Mejorar boton de reanudar turno

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/androidTest/java/com/mijornada/app/screens/PausedTurnoLayoutTest.kt`

### Cambio 1 - Ancho seguro del estado pausado

#### Codigo anterior
```kotlin
private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
private const val PausedSafeWidth = 0.70f
```

#### Codigo nuevo
```kotlin
private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
private const val PausedSafeWidth = 0.76f
```

#### Por que se cambio
El estado pausado tenia una columna demasiado estrecha para que la accion principal `Continuar Turno` respirase visualmente. `0.76f` mantiene el contenido dentro del area segura del reloj redondo y permite que el boton tenga presencia de accion principal.

### Cambio 2 - Boton Continuar Turno

#### Codigo anterior
```kotlin
            WatchActionButton(
                label = if (resuming) "Reanudando..." else "Continuar Turno",
                textColor = ColorPause,
                backgroundColor = ColorPauseBg,
                borderColor = ColorPauseBorder,
                borderWidth = 2.dp,
                shape = RoundedCornerShape(18.dp),
                fontSize = 12,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 10.dp),
                leadingIcon = { PlayIcon(size = 19.dp, color = ColorPause) }
            ) { resume() }
```

#### Codigo nuevo
```kotlin
            WatchActionButton(
                label = if (resuming) "Reanudando..." else "Continuar Turno",
                textColor = ColorPause,
                backgroundColor = ColorPauseBg,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp),
                borderColor = ColorPauseBorder,
                borderWidth = 2.dp,
                shape = RoundedCornerShape(18.dp),
                fontSize = 13,
                contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 11.dp),
                leadingIcon = { PlayIcon(size = 21.dp, color = ColorPause) }
            ) { resume() }
```

#### Por que se cambio
El boton envolvia su contenido y quedaba visualmente compacto en la pantalla pausada. `fillMaxWidth()`, `heightIn(min = 52.dp)`, el texto a `13` y el icono a `21.dp` hacen que sea mas facil de pulsar y mas claro como accion principal sin cambiar la logica de reanudacion.

### Cambio 3 - Test de layout pausado

#### Codigo anterior
`No existia PausedTurnoLayoutTest en android/wear/src/androidTest/java/com/mijornada/app/screens/PausedTurnoLayoutTest.kt.`

#### Codigo nuevo
```kotlin
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
            "Continuar Turno debe ocupar al menos el 70% del ancho visible para sentirse accion principal.",
            buttonBounds.width >= rootBounds.width * 0.70f
        )
        assertTrue(
            "Continuar Turno debe tener al menos 48dp/pixels de alto tactil en el reloj.",
            buttonBounds.height >= 48f
        )
    }

    private fun continuarTurnoButtonMatcher(): SemanticsMatcher =
        hasClickAction() and hasText("Continuar Turno", substring = false)
}
```

#### Por que se cambio
El test reproduce el estado pausado real de `ActiveTurnoScreen` y fija dos condiciones visuales: que `Continuar Turno` ocupe al menos el 70% del ancho visible y que tenga una altura tactil minima de 48. Antes del ajuste fallo por ancho insuficiente en el reloj.

## 2026-06-27 22:11 - Corregir apilado de tarjetas Wear OS

**Archivos modificados:** `android/wear/build.gradle`, `android/wear/src/main/java/com/mijornada/app/components/WatchTileBox.kt`, `android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt`, `android/wear/src/androidTest/java/com/mijornada/app/components/WatchTileBoxLayoutTest.kt`

### Cambio 1 - Contenedor vertical de WatchTileBox

#### Codigo anterior
```kotlin
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
```

```kotlin
    contentPadding: PaddingValues = PaddingValues(horizontal = 10.dp, vertical = 9.dp),
    content: @Composable () -> Unit
) {
    val borderMod = if (borderColor != null) {
        Modifier.border(borderWidth, borderColor, shape)
    } else Modifier

    Box(
        modifier = modifier
            .background(backgroundColor, shape)
            .then(borderMod)
            .padding(contentPadding)
    ) {
        content()
    }
}
```

#### Codigo nuevo
```kotlin
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
```

```kotlin
    contentPadding: PaddingValues = PaddingValues(horizontal = 10.dp, vertical = 9.dp),
    horizontalAlignment: Alignment.Horizontal = Alignment.Start,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable ColumnScope.() -> Unit
) {
    val borderMod = if (borderColor != null) {
        Modifier.border(borderWidth, borderColor, shape)
    } else Modifier

    Column(
        modifier = modifier
            .background(backgroundColor, shape)
            .then(borderMod)
            .padding(contentPadding),
        horizontalAlignment = horizontalAlignment,
        verticalArrangement = verticalArrangement
    ) {
        content()
    }
}
```

#### Por que se cambio
`Box` coloca sus hijos sobre el mismo espacio por defecto. Las tarjetas de Wear OS que usan `WatchTileBox` contienen varios hijos (`Row`, `Spacer`, `Text`), por lo que los textos se superponian. `Column` mantiene el patron robusto `background(color, shape) -> border(shape) -> padding` y coloca el contenido en vertical.

### Cambio 2 - Alineacion de tarjetas centradas

#### Codigo anterior
```kotlin
        contentPadding = PaddingValues(horizontal = 7.dp, vertical = 7.dp)
```

```kotlin
        contentPadding = PaddingValues(vertical = 9.dp)
```

```kotlin
        contentPadding = PaddingValues(horizontal = 7.dp, vertical = 7.dp)
```

```kotlin
        contentPadding = PaddingValues(horizontal = 5.dp, vertical = 7.dp)
```

#### Codigo nuevo
```kotlin
        contentPadding = PaddingValues(horizontal = 7.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally
```

```kotlin
        contentPadding = PaddingValues(vertical = 9.dp),
        horizontalAlignment = Alignment.CenterHorizontally
```

```kotlin
        contentPadding = PaddingValues(horizontal = 7.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
```

```kotlin
        contentPadding = PaddingValues(horizontal = 5.dp, vertical = 7.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
```

#### Por que se cambio
Al convertir `WatchTileBox` en `Column`, las tarjetas que antes estaban centradas visualmente necesitaban declarar su alineacion de forma explicita para conservar el aspecto de `Turnos` y `Resumen` sin cambiar la logica de datos.

### Cambio 3 - Test de regresion de WatchTileBox

#### Codigo anterior
`No existia WatchTileBoxLayoutTest en android/wear/src/androidTest/java/com/mijornada/app/components/WatchTileBoxLayoutTest.kt.`

#### Codigo nuevo
```kotlin
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
```

#### Por que se cambio
El test fija el comportamiento esperado de `WatchTileBox`: dos textos dentro de la misma tarjeta deben aparecer uno debajo del otro. Esto protege la correccion contra regresiones que vuelvan a superponer hijos en tarjetas estaticas.

### Cambio 4 - Runner de tests instrumentados

#### Codigo anterior
```groovy
        versionCode resolvedVersionCode
        versionName resolvedVersionName
        vectorDrawables {
            useSupportLibrary true
        }
```

```groovy
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.compose.ui:ui-test-junit4:1.6.1'
    debugImplementation 'androidx.compose.ui:ui-test-manifest:1.6.1'
```

#### Codigo nuevo
```groovy
        versionCode resolvedVersionCode
        versionName resolvedVersionName
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary true
        }
```

```groovy
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test:runner:1.5.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.compose.ui:ui-test-junit4:1.6.1'
    debugImplementation 'androidx.compose.ui:ui-test-manifest:1.6.1'
```

#### Por que se cambio
El APK de tests se instalaba con `android.test.InstrumentationTestRunner`, que no descubria la clase JUnit4 `WatchTileBoxLayoutTest`. `AndroidJUnitRunner` y sus dependencias permiten ejecutar los tests instrumentados de Compose definidos con `@RunWith(AndroidJUnit4::class)`.

## 2026-06-27 15:43 - Corregir test real de WatchActionButton

**Archivos modificados:** `android/wear/src/androidTest/java/com/mijornada/app/screens/WatchActionButtonBugReproTest.kt`

### Cambio 1 - Imports del test instrumentado

#### Codigo anterior
```kotlin
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
```

#### Codigo nuevo
```kotlin
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
```

#### Por que se cambio
El test ya no define ni renderiza `BuggyWatchButton`, por lo que se eliminan imports usados solo por el patron viejo `clip().background()` y se importan `WatchActionButton`, `ColorBackground` y `ColorPause` para validar el componente real.

### Cambio 2 - Test de regresion sobre WatchActionButton

#### Codigo anterior
```kotlin
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
```

#### Codigo nuevo
```kotlin
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
```

#### Por que se cambio
El test anterior demostraba el fallo del patron antiguo en un composable falso, pero no verificaba que `WatchActionButton` conservara su fondo tras recomponer. El nuevo test renderiza el componente real, fuerza una recomposicion cambiando la etiqueta y comprueba que un pixel interior sigue siendo `ColorPauseBg`.

## 2026-06-27 14:50 - Cerrar el fix incompleto del patron fragil en el modulo Wear OS

**Archivos modificados:**

- `android/wear/build.gradle`
- `android/wear/src/test/java/com/mijornada/app/.gitkeep` (nuevo)
- `android/wear/src/test/java/com/mijornada/app/SanityTest.kt` (nuevo)
- `android/wear/src/androidTest/java/com/mijornada/app/screens/WatchActionButtonBugReproTest.kt` (nuevo)
- `android/wear/src/main/java/com/mijornada/app/theme/Tokens.kt` (nuevo)
- `android/wear/src/main/java/com/mijornada/app/components/WatchActionButton.kt` (nuevo)
- `android/wear/src/main/java/com/mijornada/app/components/WatchTileBox.kt` (nuevo)
- `android/wear/src/main/java/com/mijornada/app/components/WatchMetricCard.kt` (nuevo)
- `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/EditTurnoDatosScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

Contexto: el 2026-06-26 05:50 se arreglo parcialmente el bug visual del fondo perdido en `TarjetaCategoria` del modulo Wear OS (ver entrada anterior en `CAMBIOS_AGENT1.md`), pero la auditoria revelo que el mismo patron fragil `.clip(RoundedCornerShape(N.dp)).background(color)` seguia replicado en ~25 composables de 9 archivos. El plan `PLAN_FIX_BOTONES_WEAR.md` define el alcance completo: infraestructura de tests (Fases 0-2), composables reutilizables que encapsulan el patron robusto (Fases 3a-3d) y migracion de todas las pantallas y overlays (Fases 3e-3j). Esta entrada cubre los 16 commits del plan (de `ce35b78` a `8ddfbfd`), verificados con `./gradlew :wear:compileDebugKotlin`, `./gradlew :wear:testDebugUnitTest` y `./gradlew :wear:assembleDebug` (los tres en verde). La verificacion visual final en hardware fisico (Xiaomi Watch 5) queda pendiente y requiere Carlos.

### Cambio 1 - Anadir infraestructura de tests y verificacion del patron fragil (Fases 0-2)

Commits cubiertos: `ce35b78` (Fase 0), `7d4f190` (Fase 1), `38da88d` (Fase 2).

#### Codigo anterior

No existia infraestructura de tests en el modulo wear: `android/wear/build.gradle` no declaraba ninguna dependencia de JUnit ni Compose UI Test, y el directorio `android/wear/src/test/java/com/mijornada/app/` no existia.

#### Codigo nuevo

```gradle
// android/wear/build.gradle (Fase 0, reorganizado en Fase 2)
dependencies {
    // ... existentes ...
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.compose.ui:ui-test-junit4:1.6.1'
    debugImplementation 'androidx.compose.ui:ui-test-manifest:1.6.1'
}
```

```kotlin
// android/wear/src/test/java/com/mijornada/app/SanityTest.kt (Fase 1, nuevo)
package com.mijornada.app
import org.junit.Assert.assertEquals
import org.junit.Test
class SanityTest {
    @Test
    fun junit_is_wired_correctly() {
        assertEquals(2, 1 + 1)
    }
}
```

```kotlin
// android/wear/src/androidTest/java/com/mijornada/app/screens/WatchActionButtonBugReproTest.kt (Fase 2, nuevo)
// Test instrumentado que reproduce el bug: captura pixeles del fondo de un
// BuggyWatchButton (patron fragil clip().background()) antes y despues de una
// recomposicion con alpha < 1. Estado esperado en HEAD: FAIL (fondo pasa de
// #101827 a #0D0D14). Estado esperado tras el fix con WatchActionButton: PASS.
// Requiere `./gradlew :wear:connectedDebugAndroidTest` con Xiaomi Watch 5.
```

Tambien se crea `android/wear/src/test/java/com/mijornada/app/.gitkeep` para que git trackee el directorio vacio.

#### Por que se cambio

El modulo wear no tenia tests a pesar de tener composables criticos con un bug de render conocido. Se anade JUnit para unit tests JVM y Compose UI Test para pixel tests instrumentados. El sanity test trivial verifica que el wiring funciona (Fase 1). El pixel test instrumentado reproduce el bug con un `BuggyWatchButton` que sigue el patron fragil, y servira de canario para detectar regresiones futuras del mismo patron (Fase 2). Se usa `androidTestImplementation` (no `testImplementation`) para Compose UI Test porque el modulo wear no es UI pura y necesita Activity real.

### Cambio 2 - Extraer composables reutilizables con el patron robusto (Fases 3a-3d)

Commits cubiertos: `ff6eed1` (Fase 3a), `8890fe2` (Fase 3b), `5ae98a2` (Fase 3c), `c8c69b1` (Fase 3d).

#### Codigo anterior

Cada composable del modulo wear declaraba su propio `RoundedCornerShape(N.dp)` y border width inline (~25 sitios). El patron fragil `.clip(RoundedCornerShape(N.dp)).background(color)` estaba replicado en tarjetas, botones y tiles. No existia ningun composable en `android/wear/src/main/java/com/mijornada/app/components/` ni `WatchTokens`.

#### Codigo nuevo

```kotlin
// android/wear/src/main/java/com/mijornada/app/theme/Tokens.kt (nuevo)
package com.mijornada.app.theme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object WatchTokens {
    val ButtonShape: Shape = RoundedCornerShape(14.dp)         // botones rectangulares
    val TerminarTurnoShape: Shape = RoundedCornerShape(16.dp)  // boton grande Terminar turno
    val CardShape: Shape = RoundedCornerShape(12.dp)           // tarjetas pequenas (campo metric card)
    val TileShape: Shape = RoundedCornerShape(18.dp)           // tiles grandes (resumen, notas)
    val SmallShape: Shape = RoundedCornerShape(10.dp)          // filas pequenas (notas individuales)
    val ButtonBorderWidth: Dp = 2.dp
    val CardBorderWidth: Dp = 1.dp
    val SubtleBorderWidth: Dp = 1.5.dp
}
```

```kotlin
// android/wear/src/main/java/com/mijornada/app/components/WatchActionButton.kt (nuevo, Fase 3b)
@Composable
fun WatchActionButton(
    label: String,
    textColor: Color,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    borderColor: Color? = null,
    borderWidth: Dp = WatchTokens.ButtonBorderWidth,
    shape: Shape = WatchTokens.ButtonShape,
    fontSize: Int = 12,
    contentPadding: PaddingValues = PaddingValues(vertical = 10.dp),
    leadingIcon: (@Composable () -> Unit)? = null,
    onClick: () -> Unit
) {
    val borderMod = if (borderColor != null) Modifier.border(borderWidth, borderColor, shape) else Modifier
    Box(
        modifier = modifier
            .background(backgroundColor, shape)       // patron robusto: background CON shape primero
            .then(borderMod)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)                              // clip al final, solo para recortar el ripple
            .clickable(enabled = enabled) { onClick() }
            .padding(contentPadding),
        contentAlignment = Alignment.Center
    ) {
        if (leadingIcon != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                leadingIcon()
                Spacer(Modifier.width(7.dp))
                Text(label, color = if (enabled) textColor else ColorDisabledText, fontSize = fontSize.sp, fontWeight = FontWeight.Bold)
            }
        } else {
            Text(label, color = if (enabled) textColor else ColorDisabledText, fontSize = fontSize.sp, fontWeight = FontWeight.Bold)
        }
    }
}
```

```kotlin
// android/wear/src/main/java/com/mijornada/app/components/WatchTileBox.kt (nuevo, Fase 3c)
@Composable
fun WatchTileBox(
    modifier: Modifier = Modifier,
    backgroundColor: Color,
    shape: Shape = WatchTokens.TileShape,
    borderColor: Color? = null,
    borderWidth: Dp = WatchTokens.CardBorderWidth,
    contentPadding: PaddingValues = PaddingValues(horizontal = 10.dp, vertical = 9.dp),
    content: @Composable () -> Unit
) {
    val borderMod = if (borderColor != null) Modifier.border(borderWidth, borderColor, shape) else Modifier
    Box(
        modifier = modifier
            .background(backgroundColor, shape)
            .then(borderMod)
            .padding(contentPadding)
    ) { content() }
}
```

```kotlin
// android/wear/src/main/java/com/mijornada/app/components/WatchMetricCard.kt (nuevo, Fase 3d)
@Composable
fun WatchMetricCard(
    backgroundColor: Color,
    borderColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    active: Boolean = false,
    shape: Shape = WatchTokens.CardShape,
    borderWidth: Dp = WatchTokens.CardBorderWidth,
    contentPadding: PaddingValues = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
    onClick: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    val effectiveBorderColor = if (active) borderColor else borderColor.copy(alpha = 0.5f)
    Column(
        modifier = modifier
            .background(backgroundColor, shape)
            .border(borderWidth, effectiveBorderColor, shape)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)
            .clickable(enabled = enabled) { onClick() }
            .padding(contentPadding),
        horizontalAlignment = Alignment.CenterHorizontally
    ) { content() }
}
```

#### Por que se cambio

Centralizar el patron robusto en composables reutilizables impide que el patron fragil vuelva a aparecer por copy-paste. Antes: ~25 sitios con `RoundedCornerShape(N.dp)` repetido y `clip().background()` replicado. Despues: 1 sola fuente de verdad para shapes y border widths (`WatchTokens`) y 3 composables (`WatchActionButton`, `WatchTileBox`, `WatchMetricCard`) que cualquier futura screen del reloj puede usar por defecto. El `Modifier.background(color, shape)` es la API oficial de Compose Foundation para pintar fondo con forma en una sola capa de pintado, sin depender del `clip` (que es fragil cuando se combina con `alpha < 1`).

### Cambio 3 - Migrar ActiveTurnoScreen (Fases 3e y 3j)

Commits cubiertos: `67dd966` (Fase 3e), `8ddfbfd` (Fase 3j - fix tardio de PauseIcon).

#### Codigo anterior

Los 3 botones grandes del turno activo (Anadir nota, Pausar turno, Terminar turno) y el resto de composables usaban el patron fragil:

```kotlin
// Antes (Fase 3e): patron fragil en los botones grandes
Box(
    modifier = Modifier
        .fillMaxWidth(0.86f)
        .clip(RoundedCornerShape(14.dp))
        .background(buttonBg)
        .border(2.dp, borderColor, RoundedCornerShape(14.dp))
        .clickable { onClick() }
        .padding(vertical = 10.dp),
    contentAlignment = Alignment.Center
) {
    Text(label, color = textColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
}

// Antes (Fase 3e): TarjetaCategoria con patron fragil
Column(
    modifier = modifier
        .clip(RoundedCornerShape(14.dp))
        .background(meta.bg)
        .border(1.dp, meta.border, RoundedCornerShape(14.dp))
        .alpha(if (enabled) 1f else 0.5f)
        .clickable(enabled = enabled) { onClick() }
        .padding(horizontal = 8.dp, vertical = if (grande) 8.dp else 6.dp)
) { ... }

// Antes (Fase 3j): PauseIcon (las 2 barras del icono de pausa) con patron fragil
Box(
    modifier = Modifier
        .width(size * 0.24f)
        .height(size * 0.66f)
        .clip(RoundedCornerShape(size * 0.10f))
        .background(color)
)
```

#### Codigo nuevo

```kotlin
// Despues (Fase 3e): patron robusto via WatchActionButton
WatchActionButton(
    label = "Terminar turno",
    textColor = ColorGasolina,
    backgroundColor = ColorGasolinaBg,
    borderColor = ColorGasolina,
    modifier = Modifier.fillMaxWidth(0.86f),
) { onClick() }

// Despues (Fase 3e): TarjetaCategoria ahora delega en WatchMetricCard
@Composable
private fun TarjetaCategoria(...) {
    WatchMetricCard(
        backgroundColor = meta.bg,
        borderColor = meta.border,
        modifier = modifier,
        enabled = enabled,
        active = false,
        onClick = onClick,
    ) { ... }
}

// Despues (Fase 3j): PauseIcon con background(color, shape) sin clip
Box(
    modifier = Modifier
        .width(size * 0.24f)
        .height(size * 0.66f)
        .background(color, RoundedCornerShape(size * 0.10f))
)
```

Ademas, PausedTurnoContent usa `WatchActionButton` con `leadingIcon` para el boton 'Continuar Turno'; el icono circular de pausa (que no tiene texto) usa `background(shape)` + `border(shape)` + `clip(shape)` (patron robusto inline). EntradaHistorial (Row con icono + texto + nota + importe + clickable) usa patron robusto inline porque WatchTileBox no es interactivo y WatchActionButton no soporta layouts complejos. SyncIndicator usa `WatchTileBox`.

#### Por que se cambio

Es la pantalla principal del modulo wear: es donde Carlos reprodujo el bug visualmente (los 3 botones grandes perdian su fondo tras anadir una entrada). Migrar todo el archivo cierra ese caso de uso. El fix tardio de `PauseIcon` (Fase 3j) se descubre al hacer un grep final `.clip(RoundedCornerShape` en `src/main`: quedaban 3 usos legitimos (icono circular de pausa, EntradaHistorial, NumericKeypad) y 1 fragil (PauseIcon). Las barras del icono de pausa son rectangulos pequenos sin clickable, asi que el patron robusto cubre el caso sin necesidad de clip.

### Cambio 4 - Migrar EndTurnoScreen (Fase 3f)

Commit cubierto: `53b22fb`.

#### Codigo anterior

Los 3 usos de `BotonPlano` (Terminar Turno, Cancelar, Guardar del TecladoCierreOverlay) y `CampoCierre` usaban el patron fragil:

```kotlin
// Antes: BotonPlano privado en EndTurnoScreen.kt
@Composable
private fun BotonPlano(
    label: String, textColor: Color, bg: Color,
    modifier: Modifier = Modifier, enabled: Boolean = true,
    borderColor: Color? = null, onClick: () -> Unit
) {
    val shape = RoundedCornerShape(14.dp)
    val borderMod = if (borderColor != null) Modifier.border(2.dp, borderColor, shape) else Modifier
    Box(
        modifier = modifier
            .clip(shape)
            .background(bg)
            .then(borderMod)
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = if (enabled) textColor else ColorDisabledText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

// Antes: CampoCierre (Total Taximetro / Total KM)
Column(
    modifier = modifier
        .height(76.dp)
        .clip(shape)
        .background(style.bg)
        .border(1.dp, if (active) style.color else style.border, shape)
        .clickable { onClick() }
        .padding(horizontal = 7.dp, vertical = 9.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.Center
) { ... }
```

#### Codigo nuevo

```kotlin
// Despues: WatchActionButton
WatchActionButton(
    label = if (saving) "Enviando..." else "Terminar Turno",
    textColor = ColorGasolina,
    backgroundColor = ColorGasolinaBg,
    borderColor = ColorGasolina,
    modifier = Modifier.fillMaxWidth(0.86f),
    enabled = !saving,
    fontSize = 12,
    contentPadding = PaddingValues(vertical = 10.dp)
) { if (!saving) saving = onConfirm(dinero, km) }

// Despues: WatchMetricCard para CampoCierre
WatchMetricCard(
    backgroundColor = style.bg,
    borderColor = if (active) style.color else style.border,
    modifier = modifier.height(76.dp),
    active = active,
    shape = RoundedCornerShape(14.dp),
    contentPadding = PaddingValues(horizontal = 7.dp, vertical = 9.dp),
    onClick = onClick
) { ... }
```

Ademas: `ResumenHoyCard` mantiene patron robusto inline (`background(color, shape) -> border(shape) -> padding`) porque tiene layout complejo con 3 filas de cards y notas del turno. `ResumenCategoriaCard`, `NotaTurnoRow` y `NotaDetalladaRow` usan `WatchTileBox`. Eliminado el composable privado `BotonPlano` (ya no usado) y el import `androidx.compose.ui.draw.clip`.

#### Por que se cambio

Es la pantalla donde Carlos introduce el taximetro y los km para cerrar el turno: tiene los 3 botones de accion (Terminar, Cancelar, Guardar del overlay) que pueden manifestar el bug tras cualquier recomposicion del overlay del teclado. Tambien es la pantalla con el CampoCierre que tiene estado `active` cuando el campo esta focused (migrado a `WatchMetricCard.active`).

### Cambio 5 - Migrar ConfirmDeleteButton en WearMainActivity (Fase 3g)

Commit cubierto: `ac79088`.

#### Codigo anterior

El composable privado `ConfirmDeleteButton` se usaba en 6 sitios (ConfirmPauseTurnoScreen x2, ConfirmStartTurnoScreen x2, ConfirmDeleteScreen x2) y tenia el patron fragil:

```kotlin
// Antes: composable privado en WearMainActivity.kt
@Composable
private fun ConfirmDeleteButton(
    label: String, textColor: Color, bg: Color,
    borderColor: Color? = null, enabled: Boolean = true,
    modifier: Modifier = Modifier, onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .then(
                if (borderColor != null) Modifier.border(1.5.dp, borderColor, RoundedCornerShape(14.dp))
                else Modifier
            )
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 11.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = textColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
```

#### Codigo nuevo

```kotlin
// Despues: WatchActionButton en cada llamada
WatchActionButton(
    label = "Cancelar",
    textColor = ColorGrey,
    backgroundColor = ColorNuloBg,
    modifier = Modifier.weight(1f),
    borderWidth = 1.5.dp,
    contentPadding = PaddingValues(vertical = 11.dp)
) { onCancel() }
```

Las 6 llamadas (en los 3 dialogos de confirmacion) pasan a `WatchActionButton` con `borderWidth = 1.5.dp` y `contentPadding = PaddingValues(vertical = 11.dp)` para preservar el aspecto visual original del overlay (border mas fino que los botones grandes y un poco mas de alto por estar en un dialog). Eliminado el composable privado `ConfirmDeleteButton` y el import `androidx.compose.foundation.clickable` (muerto).

#### Por que se cambio

Son los dialogos de confirmacion que aparecen al pausar, iniciar o borrar un turno. Aunque el bug visual se manifesto principalmente en `ActiveTurnoScreen`, estos dialogos pueden sufrir el mismo bug al recomponerse tras una respuesta del movil. Reemplazar el composable privado por `WatchActionButton` ademas elimina codigo duplicado.

### Cambio 6 - Migrar AddEntryScreen (Fase 3h AddEntryScreen)

Commit cubierto: `6d0577b`.

#### Codigo anterior

Varios composables tenian el patron fragil:

```kotlin
// Antes: boton Eliminar entrada (modo edicion)
Box(
    modifier = Modifier
        .fillMaxWidth(0.72f)
        .clip(RoundedCornerShape(12.dp))
        .background(ColorGasolinaBg)
        .clickable { onDelete() }
        .padding(vertical = 7.dp),
    contentAlignment = Alignment.Center
) {
    Text("Eliminar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
}

// Antes: NotaEditor - boton Guardar
Box(
    modifier = Modifier
        .fillMaxWidth(0.86f)
        .clip(RoundedCornerShape(14.dp))
        .background(if (note.isNotBlank()) ColorPropina else ColorNuloBg)
        .clickable(enabled = note.isNotBlank()) { onSave() }
        .padding(vertical = 11.dp),
    contentAlignment = Alignment.Center
) {
    Text("Guardar", color = if (note.isNotBlank()) ColorBackground else ColorGrey, fontSize = 13.sp, fontWeight = FontWeight.Bold)
}

// Antes: NotaEditor - boton Eliminar nota
Box(
    modifier = Modifier
        .fillMaxWidth(0.86f)
        .clip(RoundedCornerShape(14.dp))
        .background(ColorGasolinaBg)
        .clickable { onDelete() }
        .padding(vertical = 10.dp),
    contentAlignment = Alignment.Center
) {
    Text("Eliminar nota", color = ColorGasolina, fontSize = 12.sp, fontWeight = FontWeight.Bold)
}
```

#### Codigo nuevo

```kotlin
// Despues: WatchActionButton
WatchActionButton(
    label = "Eliminar entrada",
    textColor = ColorGasolina,
    backgroundColor = ColorGasolinaBg,
    modifier = Modifier.fillMaxWidth(0.72f),
    fontSize = 11,
    contentPadding = PaddingValues(vertical = 7.dp)
) { onDelete() }

// NotaEditor Guardar con enabled controlado por note.isNotBlank()
WatchActionButton(
    label = "Guardar",
    textColor = if (note.isNotBlank()) ColorBackground else ColorGrey,
    backgroundColor = if (note.isNotBlank()) ColorPropina else ColorNuloBg,
    modifier = Modifier.fillMaxWidth(0.86f),
    enabled = note.isNotBlank(),
    fontSize = 13,
    contentPadding = PaddingValues(vertical = 11.dp)
) { onSave() }
```

Composables que mantienen fix inline (no encajan en WatchActionButton):

- `GuardarImporteButton`: tamano fijo 42x34.dp y solo muestra `'✓'`, no encaja en WatchActionButton (cuyo `contentPadding` es flexible). Patron robusto inline: `background(color, shape)` sin clip previo.
- `NotaButton`: contenido condicional (texto simple si vacio, Column con header + nota multilinea si hay texto). No encaja en WatchActionButton. Patron robusto inline: `background(color, shape) -> clickable -> padding`. Se omite el clip a proposito (ripple rectangular apenas se nota sobre un area pequena).
- Caja de texto del NotaEditor: caja clickable simple sin border. Patron robusto inline: `background(color, shape) -> clickable -> padding`.

Tambien se quita el import muerto `androidx.compose.ui.draw.clip`.

#### Por que se cambio

Es la pantalla donde se introduce cualquier entrada (propina, datafono, agencia, extra, gasolina, nulo o nota) en el turno activo. El patron `WatchActionButton` con `enabled` controlado por `note.isNotBlank()` logra el mismo efecto visual que el codigo anterior (cambio de color de fondo + atenua el texto) sin escribir el patron fragil a mano.

### Cambio 7 - Migrar EditTurnoDatosScreen (Fase 3h EditTurnoDatosScreen)

Commit cubierto: `3050b0b`.

#### Codigo anterior

```kotlin
// Antes: 3 usos de BotonPlano (Anadir nota, Guardar cambios, Cancelar)
BotonAncho("✎ Anadir nota", ColorWhite, ColorNuloBg) { ... }
BotonAncho(if (enviando) "Guardando..." else "Guardar cambios", if (valido && !enviando) ColorPropina else ColorGrey.copy(alpha = 0.5f), ColorPropinaBg, enabled = valido && !enviando) { ... }
BotonAncho("Cancelar", ColorGrey, ColorNuloBg) { onCancel() }

// Antes: CampoEditable (Taximetro / KM)
Column(
    modifier = modifier
        .clip(RoundedCornerShape(12.dp))
        .background(bg)
        .border(if (activo) 1.5.dp else 1.dp, if (activo) color else color.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
        .clickable { onClick() }
        .padding(horizontal = 8.dp, vertical = 7.dp),
    horizontalAlignment = Alignment.CenterHorizontally
) { ... }

// Antes: BotonAncho privado
@Composable
private fun BotonAncho(...) {
    Box(
        modifier = Modifier.fillMaxWidth(0.84f)
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 9.dp),
        contentAlignment = Alignment.Center
    ) { Text(etiqueta, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
}
```

#### Codigo nuevo

```kotlin
// Despues: WatchActionButton para los 3 botones anchos
WatchActionButton(
    label = "✎ Anadir nota",
    textColor = ColorWhite,
    backgroundColor = ColorNuloBg,
    modifier = Modifier.fillMaxWidth(0.84f),
    contentPadding = PaddingValues(vertical = 9.dp)
) { ... }

// Despues: CampoEditable delega en WatchMetricCard
WatchMetricCard(
    backgroundColor = bg,
    borderColor = color,
    modifier = modifier,
    active = activo,
    shape = RoundedCornerShape(12.dp),
    borderWidth = if (activo) 1.5.dp else 1.dp,
    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 7.dp),
    onClick = onClick
) { ... }
```

Composables que mantienen fix inline (no encajan):

- `FilaEntrada`: Row compleja con icono + label + nota + importe y clickable global.
- `FilaNota`: Row con Text clickable interno para editar y Text clickable para borrar (necesita los clickables granulares).
- `BotonCategoria`: solo muestra un icono (sin texto), no encaja en WatchActionButton.

Eliminado el composable privado `BotonAncho` (ya no usado) y el import muerto `androidx.compose.ui.draw.clip`.

#### Por que se cambio

Es la pantalla de edicion completa de un turno cerrado: los campos Taximetro/KM tienen estado `activo` (cuando el campo esta focused, el borde pasa de 1.dp alpha 30% a 1.5.dp alpha 100%) y los 3 botones de accion (Anadir nota, Guardar cambios, Cancelar) pueden manifestar el bug al recomponerse tras editar una entrada o una nota. `WatchMetricCard.active` logra el mismo cambio de borde (50% alpha vs 100% alpha) que el codigo anterior.

### Cambio 8 - Migrar NoActiveTurnoScreen (Fase 3h NoActiveTurnoScreen)

Commit cubierto: `567f013`.

#### Codigo anterior

```kotlin
// Antes: pill "Sincronizando" (pendingOpsCount > 0)
Box(
    modifier = Modifier
        .align(Alignment.TopCenter)
        .padding(top = 6.dp)
        .clip(RoundedCornerShape(8.dp))
        .background(ColorPropinaBg)
        .padding(horizontal = 6.dp, vertical = 1.dp),
    contentAlignment = Alignment.Center
) {
    Text(text = "↻ Sincronizando", color = ColorPropina, fontSize = 8.sp, fontWeight = FontWeight.Bold)
}

// Antes: HomeActionButton (4 usos: Turno Pausado, Continuar Turno, Iniciar Turno, Turnos)
Box(
    modifier = Modifier
        .fillMaxWidth()
        .clip(RoundedCornerShape(16.dp))
        .background(bg)
        .border(1.5.dp, borderColor, RoundedCornerShape(16.dp))
        .clickable { val now = ...; if (now - lastClickMs > 600L) { lastClickMs = now; onClick() } }
        .padding(vertical = 10.dp),
    contentAlignment = Alignment.Center
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Image(painter = painterResource(id = iconRes), colorFilter = ColorFilter.tint(textColor), modifier = Modifier.size(15.dp))
        Spacer(modifier = Modifier.width(6.dp))
        Text(label, color = textColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}
```

#### Codigo nuevo

```kotlin
// Despues: WatchTileBox para el pill (no interactivo)
WatchTileBox(
    modifier = Modifier.align(Alignment.TopCenter).padding(top = 6.dp),
    backgroundColor = ColorPropinaBg,
    shape = RoundedCornerShape(8.dp),
    borderColor = null,
    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 1.dp)
) {
    Text(text = "↻ Sincronizando", color = ColorPropina, fontSize = 8.sp, fontWeight = FontWeight.Bold)
}

// Despues: HomeActionButton ahora delega en WatchActionButton con leadingIcon
@Composable
private fun HomeActionButton(label, iconRes, textColor, bg, borderColor, onClick) {
    var lastClickMs by remember { mutableStateOf(0L) }  // debounce mantenido
    WatchActionButton(
        label = label,
        textColor = textColor,
        backgroundColor = bg,
        borderColor = borderColor,
        modifier = Modifier.fillMaxWidth(),
        borderWidth = 1.5.dp,
        shape = RoundedCornerShape(16.dp),
        contentPadding = PaddingValues(vertical = 10.dp),
        fontSize = 13,
        leadingIcon = {
            Image(painter = painterResource(id = iconRes), contentDescription = null,
                  colorFilter = ColorFilter.tint(textColor), modifier = Modifier.size(15.dp))
        }
    ) {
        val now = android.os.SystemClock.elapsedRealtime()
        if (now - lastClickMs > 600L) { lastClickMs = now; onClick() }
    }
}
```

Las 4 llamadas a `HomeActionButton` (Turno Pausado, Continuar Turno, Iniciar Turno, Turnos) se mantienen sin cambios en su API. Tambien se quita el import muerto `androidx.compose.ui.draw.clip`.

#### Por que se cambio

Es la home del reloj: aparece cuando no hay turno activo o cuando el turno esta pausado. Los 3 botones principales (Iniciar/Continuar/Turno Pausado + Turnos) son los mas usados. El pill de "Sincronizando" aparece cuando hay operaciones pendientes de subir al movil. El debounce temporal de 600ms se mantiene dentro del wrapper `HomeActionButton` (WatchActionButton no lo soporta internamente) para evitar doble click que duplicaria navegaciones.

### Cambio 9 - Migrar TurnoSummaryScreen (Fase 3i TurnoSummaryScreen)

Commit cubierto: `840f7c6`.

#### Codigo anterior

Todos los composables del archivo usaban el patron fragil:

```kotlin
// Antes: boton Volver al inicio
Box(
    modifier = Modifier.fillMaxWidth(0.88f)
        .clip(RoundedCornerShape(16.dp))
        .background(Color(0xFF1B1C23))
        .clickable { onHome() }
        .padding(vertical = 11.dp),
    contentAlignment = Alignment.Center
) { Text("Volver al inicio", color = ColorGrey, fontSize = 12.sp, fontWeight = FontWeight.Bold) }

// Antes: HeaderPill, SummaryMetric, CategorySummary, CategoryBox, BottomSummary, BottomSummaryCard,
//        DetailedNotesBlock, NoteRow: todos con clip(RoundedCornerShape(...)).background(...).border(...).padding()
```

#### Codigo nuevo

```kotlin
// Despues: WatchActionButton para el boton
WatchActionButton(
    label = "Volver al inicio",
    textColor = ColorGrey,
    backgroundColor = Color(0xFF1B1C23),
    modifier = Modifier.fillMaxWidth(0.88f),
    shape = RoundedCornerShape(16.dp),
    contentPadding = PaddingValues(vertical = 11.dp)
) { onHome() }

// Despues: WatchTileBox para el resto (HeaderPill, SummaryMetric, CategorySummary,
//          CategoryBox, BottomSummary, BottomSummaryCard, DetailedNotesBlock, NoteRow).
//          Ejemplo de NoteRow:
WatchTileBox(
    modifier = Modifier.fillMaxWidth(),
    backgroundColor = Color(0xFF1B1C23),
    shape = RoundedCornerShape(10.dp),
    borderColor = null,
    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 7.dp)
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Text(entry.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(if (general) "Nota" else categoriaLabelSingular(entry.type), color = if (general) ColorWhite else meta.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(entry.note, color = ColorWhite, fontSize = 8.sp, modifier = Modifier.weight(1f))
        if (!general) Text(fmtEur(entry.amount), color = meta.color, fontSize = 9.sp, fontWeight = FontWeight.Bold)
    }
}
```

Tambien se quita el import muerto `androidx.compose.ui.draw.clip`.

#### Por que se cambio

Es el resumen de un turno cerrado: 4 metricas (Taximetro, Ganancia, KM, Tiempo), resumen por categoria con notas, totales a descontar/a dar, notas detalladas y boton para volver al inicio. Casi todo el archivo son tiles no interactivos, por lo que `WatchTileBox` es la opcion natural.

### Cambio 10 - Migrar TurnosScreen (Fase 3i TurnosScreen)

Commit cubierto: `14e158f`.

#### Codigo anterior

```kotlin
// Antes: TurnoCard (clickable)
Column(
    modifier = Modifier.fillMaxWidth(0.90f)
        .clip(RoundedCornerShape(16.dp))
        .background(Color(0xFF15151C))
        .border(1.dp, Color(0xFF252631), RoundedCornerShape(16.dp))
        .clickable { onClick() }
        .padding(horizontal = 11.dp, vertical = 10.dp)
) { ... 4 MiniMetrics ... }

// Antes: MiniMetric (no clickable, dentro de TurnoCard)
Column(
    modifier = modifier
        .clip(RoundedCornerShape(12.dp))
        .background(style.bg)
        .border(1.dp, style.border, RoundedCornerShape(12.dp))
        .padding(horizontal = 7.dp, vertical = 7.dp),
    horizontalAlignment = Alignment.CenterHorizontally
) { ... }
```

#### Codigo nuevo

```kotlin
// Despues: MiniMetric usa WatchTileBox
WatchTileBox(
    modifier = modifier,
    backgroundColor = style.bg,
    shape = RoundedCornerShape(12.dp),
    borderColor = style.border,
    borderWidth = 1.dp,
    contentPadding = PaddingValues(horizontal = 7.dp, vertical = 7.dp)
) { ... }

// Despues: TurnoCard mantiene fix inline porque necesita ser clickable (WatchTileBox no soporta clickable)
Column(
    modifier = Modifier.fillMaxWidth(0.90f)
        .background(Color(0xFF15151C), RoundedCornerShape(16.dp))
        .border(1.dp, Color(0xFF252631), RoundedCornerShape(16.dp))
        .clickable { onClick() }
        .padding(horizontal = 11.dp, vertical = 10.dp)
) { ... 4 MiniMetrics ... }
```

Tambien se quita el import muerto `androidx.compose.ui.draw.clip`.

#### Por que se cambio

Es la lista de turnos cerrados anteriores. `MiniMetric` (las 4 cards pequenas dentro de cada turno) son tiles no interactivos, perfectos para `WatchTileBox`. `TurnoCard` (cada fila de la lista) necesita ser clickable para abrir el resumen, y `WatchTileBox` no soporta `clickable`, asi que mantiene el patron robusto inline.

### Verificacion automatica

- `./gradlew :wear:compileDebugKotlin`: **BUILD SUCCESSFUL** en 30s (todos los archivos compilan sin errores de tipos ni de sintaxis).
- `./gradlew :wear:testDebugUnitTest`: **BUILD SUCCESSFUL** en 19s (SanityTest en verde: JUnit + Compose UI Test correctamente wireados).
- `./gradlew :wear:assembleDebug`: **BUILD SUCCESSFUL** en 18s (APK del reloj generada: `android/wear/build/outputs/apk/debug/wear-debug.apk`).

Tras estos 16 commits, ya no queda ningun composable de produccion con `.clip(RoundedCornerShape(...)).background(...)` en el modulo wear. Solo `NumericKeypad.kt` (linea 126) sigue ese patron, excluido explicitamente por el plan porque su layout recompone intencionalmente con cada pulsacion del teclado numerico.

### Verificacion pendiente en hardware

Fase 5 del plan: Carlos debe verificar visualmente en el Xiaomi Watch 5 que el bug original (botones grandes "Pausar turno" y "Terminar turno" del turno activo perdiendo color de fondo tras anadir una entrada) ya no se reproduce, repitiendo el escenario de muestreo de pixeles que uso el 2026-06-26 05:50 para confirmar el fix parcial de `TarjetaCategoria`.

## 2026-06-17 21:32 - Mostrar las notas completas en el reloj Wear OS

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

Contexto: en el reloj las notas se recortaban en tres sitios (botón de nota del teclado de importe, lista «Últimas entradas» del turno activo y confirmación de borrado) y aparecía un «✓» confuso al inicio de la nota. Se unifica el criterio con la pantalla «Terminar turno» y con la app móvil (`src/components/turno-notas.tsx`): nota completa con salto de línea. Cambios solo de UI del módulo `wear`; no tocan `accounting.ts`/`week-logic.ts` ni el protocolo Wear.

### Cambio 1 - Nota completa en «Últimas entradas» del turno activo

#### Código anterior
```kotlin
@Composable
private fun EntradaHistorial(entry: WatchEntry, bloqueado: Boolean = false, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            // Atenuar la fila mientras el cambio esta pendiente de confirmacion.
            .alpha(if (entry.pendiente) 0.55f else 1f)
            .clickable(enabled = !bloqueado) { onClick() }
            .padding(horizontal = 12.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CategoriaIcon(entry.type, meta.color, 14.dp)
        Spacer(modifier = Modifier.width(7.dp))
        Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        // Nota de la entrada visible como en la app móvil (antes no se mostraba).
        if (entry.note.isNotBlank()) {
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                entry.note,
                color = ColorGrey,
                fontSize = 10.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            Spacer(modifier = Modifier.width(6.dp))
        } else {
            Spacer(modifier = Modifier.weight(1f))
        }
        Text(entry.time, color = ColorGrey, fontSize = 10.sp)
        Spacer(modifier = Modifier.width(8.dp))
        // Icono de pendiente (reloj) mientras el movil no ha confirmado.
        if (entry.pendiente) {
            Text("⏱", color = ColorTaximetro, fontSize = 11.sp)
            Spacer(modifier = Modifier.width(6.dp))
        }
        if (entry.type == "nota") {
            Text("✎", color = ColorWhite, fontSize = 12.sp)
        } else {
            Text(fmtEurSigned(entry.amount), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}
```

#### Código nuevo
```kotlin
@Composable
private fun EntradaHistorial(entry: WatchEntry, bloqueado: Boolean = false, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            // Atenuar la fila mientras el cambio esta pendiente de confirmacion.
            .alpha(if (entry.pendiente) 0.55f else 1f)
            .clickable(enabled = !bloqueado) { onClick() }
            .padding(horizontal = 12.dp, vertical = 9.dp)
    ) {
        // Nivel 1: icono + categoria + hora + (pendiente) + importe.
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CategoriaIcon(entry.type, meta.color, 14.dp)
            Spacer(modifier = Modifier.width(7.dp))
            Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Text(entry.time, color = ColorGrey, fontSize = 10.sp)
            Spacer(modifier = Modifier.width(8.dp))
            // Icono de pendiente (reloj) mientras el movil no ha confirmado.
            if (entry.pendiente) {
                Text("⏱", color = ColorTaximetro, fontSize = 11.sp)
                Spacer(modifier = Modifier.width(6.dp))
            }
            if (entry.type == "nota") {
                Text("✎", color = ColorWhite, fontSize = 12.sp)
            } else {
                Text(fmtEurSigned(entry.amount), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        // Nivel 2: nota completa con salto de linea, como en "Terminar turno" y
        // en la app movil (antes se truncaba a una linea con ellipsis).
        if (entry.note.isNotBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                entry.note,
                color = ColorGrey,
                fontSize = 10.sp,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
```

Además, se eliminó el import `import androidx.compose.ui.text.style.TextOverflow` por quedar sin uso.

#### Por qué se cambió
La nota de la entrada se truncaba a una línea con «…», lo que cortaba notas largas. Se reestructura la tarjeta en dos niveles para mostrar la nota completa con salto de línea, igual que la pantalla «Terminar turno» y la app móvil.

### Cambio 2 - Hacer desplazable el teclado de importe

#### Código anterior
```kotlin
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
```

#### Código nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                // bottom 44: que el último botón ("Eliminar entrada" en edición)
                // no lo recorte la curva inferior del círculo al final del scroll.
                .padding(top = 18.dp, bottom = 44.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

#### Por qué se cambió
Al mostrar la nota completa en el botón de nota, el contenido podía exceder la pantalla y el botón «Eliminar entrada» (modo edición) quedaba tapado por la curva inferior del círculo. Se hace desplazable la pantalla con el mismo patrón ya usado en `ActiveTurnoScreen`/`EndTurnoScreen` (scroll + `bottom = 44.dp`).

### Cambio 3 - Botón de nota: quitar el «✓» y mostrar la nota entera

#### Código anterior
```kotlin
            NotaButton(
                text = if (note.isBlank()) "+ Nota" else "✓ ${note.take(12)}",
                selected = note.isNotBlank(),
                onClick = { onRequestNote(note) { result -> note = result } }
            )
```

```kotlin
@Composable
private fun NotaButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .clip(RoundedCornerShape(12.dp))
            .background(ColorNuloBg)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) ColorWhite else ColorGrey,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
```

#### Código nuevo
```kotlin
            NotaButton(
                note = note,
                onClick = { onRequestNote(note) { result -> note = result } }
            )
```

```kotlin
@Composable
private fun NotaButton(
    note: String,
    onClick: () -> Unit
) {
    val selected = note.isNotBlank()
    Box(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .clip(RoundedCornerShape(12.dp))
            .background(ColorNuloBg)
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        if (!selected) {
            Text(
                text = "+ Nota",
                color = ColorGrey,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        } else {
            // Nota completa con salto de linea (antes se mostraba "✓" + 12 chars).
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "✎ Nota",
                    color = ColorGrey,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = note,
                    color = ColorWhite,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}
```

Además, se añadió el import `import androidx.compose.ui.text.style.TextAlign`.

#### Por qué se cambió
El botón mostraba «✓» (confuso, parecía un «verificado») seguido de solo 12 caracteres de la nota. Se sustituye por una cabecera clara «✎ Nota» y la nota completa con salto de línea.

### Cambio 4 - Etiqueta del RemoteInput sin recorte

#### Código anterior
```kotlin
                .setLabel(if (current.isBlank()) "Nota" else current.take(24))
```

#### Código nuevo
```kotlin
                .setLabel(if (current.isBlank()) "Nota" else current)
```

#### Por qué se cambió
La etiqueta/pista del teclado del sistema se recortaba a 24 caracteres al reeditar una nota. Se muestra completa. (Solo afecta a la etiqueta; el `RemoteInput` no prefilla el campo editable.)

### Cambio 5 - Nota completa al confirmar el borrado de una entrada

#### Código anterior
```kotlin
            if (entry.note.isNotBlank()) {
                Text(entry.note.take(32), color = ColorGrey, fontSize = 11.sp)
            }
```

#### Código nuevo
```kotlin
            if (entry.note.isNotBlank()) {
                // Nota completa con salto de linea (antes se truncaba a 32 chars).
                Text(entry.note, color = ColorGrey, fontSize = 11.sp)
            }
```

#### Por qué se cambió
La pantalla de confirmación de borrado recortaba la nota a 32 caracteres. Se muestra completa por coherencia con el resto del flujo.
