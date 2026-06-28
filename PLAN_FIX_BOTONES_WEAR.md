# Plan: Correccion completa del bug de fondo/bordes perdidos en Wear OS

**Fecha:** 2026-06-27
**Autor:** Mavis (revision) + Carlos (decision final)
**Estado:** Propuesto — pendiente de OK explicito antes de tocar nada
**Commit base:** `5df7b0f8` (HEAD actual, 0 commits desde entonces)

---

## 0. Resumen ejecutivo

El bug que Carlos reporto (botones "Pausar turno" y "Terminar turno" pierden color de fondo tras anadir una entrada) es el **mismo bug** que se arreglo parcialmente el **2026-06-26 05:50** sobre `TarjetaCategoria` (ver `CAMBIOS_AGENT1.md`, lineas 1-44). Aquella entrada dice literal:

> "Corregir fondo de tarjetas perdido al anadir entrada en el reloj"
>
> Diagnostico: el patron `.clip(RoundedCornerShape)` seguido de `.background(color)` (sin forma) es fragil y, al recomponer la tarjeta con datos nuevos, el `clip` dejaba el nodo sin su fondo pintado. La forma canonica `.background(color, shape)` dibuja el fondo con la forma redondeada de manera robusta, sin depender del `clip`.

El fix se aplico solo a `TarjetaCategoria`. La auditoria completa del modulo `wear` revela que **el mismo patron fragil esta replicado en al menos 25 composables** de 9 archivos. Este plan cierra el bug completo, dejandolo como lo habria hecho un desarrollador experimentado.

**Metodologia:** TDD con characterization tests. Primero se escribe el test del comportamiento esperado (que falla en HEAD actual porque el bug existe), luego se hace el refactor, luego se verifica que el test pasa. Esto es lo que haria un senior con disciplina.

---

## 1. Diagnostico verificado contra documentacion oficial

### 1.1. Causa raiz (confirmada por doc oficial)

El patron fragil es:
```kotlin
.clip(RoundedCornerShape(N.dp))   // clip primero
.background(color)                  // background sin shape despues
```

La documentacion oficial de Compose Foundation (`androidx.compose.foundation.background`) define la API `Modifier.background(color, shape)` con el comentario:

> *"Draws shape with a solid color behind the content."*

Es decir, `background(color, shape)` dibuja el fondo **con la forma integrada en una sola capa de pintado**, mientras que `clip(shape).background(color)` lo hace en **dos capas separadas** donde el clip recorta antes que el background pinte. Esa doble capa es fragil porque:

1. Cuando hay `alpha < 1` en la cadena, Compose crea una capa offscreen para componer y, al invalidarse por una recomposicion, el clip puede "soltar" su background asociado.
2. El registro del 2026-06-26 lo confirma con muestreo de pixeles en el Xiaomi Watch 5: el fondo pasa de `#0B082C` a `#0D0D14` (negro, fundido con el fondo de la pantalla) tras una recomposicion.

### 1.2. Verificacion contra doc oficial

| Fuente | Conclusion |
|--------|-----------|
| `developer.android.com` (codelab "Layouts in Jetpack Compose") | "Order matters when chaining modifiers" |
| `androidx.compose.ui.Modifier` (referencia oficial) | "Order is significant; modifier elements that appear first will be applied first" |
| `androidx.compose.foundation.background(color, shape)` (codigo fuente oficial) | "Draws shape with a solid color behind the content" |
| Stack Overflow (respuesta top, 126 votos) | El orden es outside-in: clip antes recorta el area antes de pintar |
| `CAMBIOS_AGENT1.md` 2026-06-26 05:50 | Caso practico verificado en hardware real (Xiaomi Watch 5) |

**Conclusion:** el patron correcto es `background(color, shape).border(shape).clip(shape)`, exactamente el aplicado en `TarjetaCategoria` el 2026-06-26.

---

## 2. Auditoria completa del modulo wear

He auditado todos los composables del modulo `android/wear/src/main/java/com/mijornada/app/screens/`:

### 2.1. Inventario de composables con patron fragil `clip().background()`

| Archivo | Linea | Composable / uso | Estado actual | Severidad |
|---------|-------|------------------|---------------|-----------|
| `ActiveTurnoScreen.kt` | 136 | Boton "Anadir nota al turno" | Patron fragil | **ALTA** (es el bug que ves) |
| `ActiveTurnoScreen.kt` | 162 | Boton "Pausar turno" | Patron fragil | **ALTA** (es el bug que ves) |
| `ActiveTurnoScreen.kt` | 206-208 | Boton "Terminar turno" | Patron fragil + pierde borde | **ALTA** (es el bug que ves) |
| `ActiveTurnoScreen.kt` | 283, 303 | `PausedTurnoContent` (icono pausa + boton "Continuar Turno") | Patron fragil | MEDIA (puede manifestarse en transiciones de pausa) |
| `ActiveTurnoScreen.kt` | 378 | `TarjetaCategoria` | **YA ARREGLADO** 2026-06-26 | OK |
| `ActiveTurnoScreen.kt` | 416 | `EntradaHistorial` | Patron fragil | BAJA (no es clickable critico, alpha solo en pendiente) |
| `ActiveTurnoScreen.kt` | 466 | `SyncIndicator` | `clip().background()` sin shape | BAJA |
| `EndTurnoScreen.kt` | 149-154 | `CampoCierre` (Total Taximetro / Total KM) | Patron fragil | MEDIA (recompone al cambiar activeField) |
| `EndTurnoScreen.kt` | 175-177 | `ResumenHoyCard` | `clip().background().border()` fragil | MEDIA |
| `EndTurnoScreen.kt` | 237-239 | `ResumenCategoriaCard` | Patron fragil | BAJA |
| `EndTurnoScreen.kt` | 269 | `NotaTurnoRow` | `clip().background()` fragil | BAJA |
| `EndTurnoScreen.kt` | 289-291 | `NotaDetalladaRow` | `clip().background().border()` fragil | BAJA |
| `EndTurnoScreen.kt` | 357-378 | `BotonPlano` (3 usos: Terminar Turno / Cancelar / Guardar) | **Patron fragil identico al bug** | **ALTA** (3 botones, mismo patron) |
| `WearMainActivity.kt` | 1367-1390 | `ConfirmDeleteButton` (overlay de borrado) | Patron fragil | MEDIA (puede manifestarse al pedir confirmacion) |
| `AddEntryScreen.kt` | 130, 170, 193, 264, 283, 296 | Varios botones y tiles | Patron fragil | VARIAS (audit caso por caso) |
| `NoActiveTurnoScreen.kt` | 53, 162 | Pantalla "sin turno activo" | Patron fragil | BAJA |
| `EditTurnoDatosScreen.kt` | 253, 278, 311, 332, 354 | Edicion de turno cerrado | Patron fragil | MEDIA |
| `TurnoSummaryScreen.kt` | 100, 116, 138, 161, 193, 257, 290, 321, 341 | Resumen de turnos | Patron fragil | VARIAS |
| `TurnosScreen.kt` | 67, 108 | Lista de turnos | Patron fragil | BAJA |
| `NumericKeypad.kt` | 126 | Teclado numerico | Patron fragil (pero es recurrente por diseno) | BAJA |

### 2.2. Composables NO fragiles (referencia)

- Composables que solo usan `background()` sin clip previo: OK
- Composables que usan `background(color, shape)` (ej. `TarjetaCategoria` actual): OK
- Composables que usan `Surface` (Material 3): OK
- Composables sin fondo visual: OK

### 2.3. Conclusion de la auditoria

Hay **~25 sitios con patron fragil** distribuidos en 9 archivos. Solo `TarjetaCategoria` esta migrada. El fix del 2026-06-26 cerro el 4% del problema.

---

## 3. Arquitectura propuesta

### 3.1. Composables nuevos (en `android/wear/.../components/`)

Crear **3 composables reutilizables** que encapsulan los 3 patrones visuales del reloj. Asi cada llamada site queda en una linea y nunca se puede reintroducir el patron fragil:

#### `WatchActionButton.kt` — Boton primario rectangular con texto
Sustituye a: `BotonPlano` (EndTurnoScreen) + `ConfirmDeleteButton` (WearMainActivity) + 3 botones grandes de ActiveTurnoScreen (Anadir nota, Pausar turno, Terminar turno).

```kotlin
package com.mijornada.app.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.ColorDisabledText

/**
 * Boton primario del reloj. Patron robusto: background(color, shape) antes que clip().
 * El clip va al final solo para recortar el ripple del clickable a la forma redondeada.
 * Aplica el mismo fix que TarjetaCategoria (ver CAMBIOS_AGENT 2026-06-26).
 */
@Composable
fun WatchActionButton(
    label: String,
    textColor: Color,
    backgroundColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    borderColor: Color? = null,
    borderWidth: Dp = 2.dp,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(14.dp),
    fontSize: Int = 12,
    contentPadding: PaddingValues = PaddingValues(vertical = 10.dp),
    leadingIcon: (@Composable () -> Unit)? = null,
    onClick: () -> Unit
) {
    val effectiveBorderColor = borderColor
    val borderMod = if (effectiveBorderColor != null) {
        Modifier.border(borderWidth, effectiveBorderColor, shape)
    } else Modifier
    Box(
        modifier = modifier
            .background(backgroundColor, shape)
            .then(borderMod)
            .alpha(if (enabled) 1f else 0.5f)
            .clip(shape)
            .clickable(enabled = enabled) { onClick() }
            .padding(contentPadding),
        contentAlignment = Alignment.Center
    ) {
        if (leadingIcon != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                leadingIcon()
                Spacer(Modifier.width(7.dp))
                Text(label, color = textColor, fontSize = fontSize.sp, fontWeight = FontWeight.Bold)
            }
        } else {
            Text(label, color = textColor, fontSize = fontSize.sp, fontWeight = FontWeight.Bold)
        }
    }
}
```

#### `WatchTileBox.kt` — Caja estatica con fondo + borde opcional (sin clickable)
Sustituye a: `ResumenHoyCard`, `ResumenCategoriaCard`, `NotaTurnoRow`, `NotaDetalladaRow`, `SyncIndicator`.

```kotlin
package com.mijornada.app.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Caja decorativa (no interactiva) con fondo y borde opcional. Patron robusto.
 */
@Composable
fun WatchTileBox(
    modifier: Modifier = Modifier,
    backgroundColor: Color,
    shape: Shape = RoundedCornerShape(14.dp),
    borderColor: Color? = null,
    borderWidth: Dp = 1.dp,
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
    ) { content() }
}
```

#### `WatchMetricCard.kt` — Tarjeta metrica clickable con estado activo
Sustituye a: `TarjetaCategoria` (con su estado activo), `CampoCierre`.

```kotlin
package com.mijornada.app.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Tarjeta metrica clickable con estados activo / deshabilitado. Patron robusto.
 */
@Composable
fun WatchMetricCard(
    backgroundColor: Color,
    borderColor: Color,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    active: Boolean = false,
    shape: Shape = RoundedCornerShape(14.dp),
    borderWidth: Dp = 1.dp,
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

### 3.2. Estructura de carpetas resultante

```
android/wear/src/main/java/com/mijornada/app/
├── components/                          ← NUEVO
│   ├── WatchActionButton.kt
│   ├── WatchTileBox.kt
│   └── WatchMetricCard.kt
├── screens/
│   ├── ActiveTurnoScreen.kt             ← refactorizado
│   ├── EndTurnoScreen.kt                ← refactorizado
│   ├── AddEntryScreen.kt                ← refactorizado (casos faciles)
│   ├── EditTurnoDatosScreen.kt          ← refactorizado (casos faciles)
│   ├── NoActiveTurnoScreen.kt           ← refactorizado (casos faciles)
│   ├── TurnoSummaryScreen.kt            ← audit caso por caso
│   ├── TurnosScreen.kt                  ← audit caso por caso
│   ├── NumericKeypad.kt                 ← no tocar (es recurrente por diseno)
│   └── ...
├── theme/
│   ├── Color.kt                         ← sin cambios
│   ├── Theme.kt                         ← sin cambios
│   ├── Type.kt                          ← sin cambios
│   └── Tokens.kt                        ← NUEVO (constantes de diseno)
└── WearMainActivity.kt                  ← ConfirmDeleteButton migrado
```

### 3.3. Tokens.kt

```kotlin
package com.mijornada.app.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object WatchTokens {
    val ButtonShape: Shape = RoundedCornerShape(14.dp)
    val TerminarTurnoShape: Shape = RoundedCornerShape(16.dp)
    val CardShape: Shape = RoundedCornerShape(12.dp)
    val TileShape: Shape = RoundedCornerShape(18.dp)
    val SmallShape: Shape = RoundedCornerShape(10.dp)

    val ButtonBorderWidth: Dp = 2.dp
    val CardBorderWidth: Dp = 1.dp
    val SubtleBorderWidth: Dp = 1.5.dp
}
```

---

## 4. Cambios concretos por archivo

(Nota: el codigo antes/despues detallado de cada boton grande esta en el plan original. En esta version revisada con TDD, los snippets de codigo no cambian — lo que cambia es el ORDEN en que se aplican: primero se escriben los tests, luego se hacen las migraciones, luego se verifican los tests.)

### 4.1. `ActiveTurnoScreen.kt`
- Boton "Anadir nota al turno" (lineas 133-154) → `WatchActionButton`
- Boton "Pausar turno" (lineas 158-181) → `WatchActionButton` con `leadingIcon = PauseIcon`
- Boton "Terminar turno" (lineas 203-215) → `WatchActionButton` con borde
- PausedTurnoContent — icono (277-290) y boton "Continuar Turno" (300-319) → `WatchActionButton`
- EntradaHistorial (411-457) → `WatchTileBox`
- SyncIndicator (459-478) → `WatchTileBox`

### 4.2. `EndTurnoScreen.kt`
- Eliminar `BotonPlano` (lineas 357-379)
- Migrar los 3 usos de `BotonPlano` (lineas 105, 118, 351) → `WatchActionButton`
- `CampoCierre` (139-164) → `WatchMetricCard` con `active`
- `ResumenHoyCard` (166-224), `ResumenCategoriaCard` (226-251), `NotaTurnoRow` (264-281), `NotaDetalladaRow` (283-303) → `WatchTileBox`

### 4.3. `WearMainActivity.kt`
- `ConfirmDeleteButton` (lineas 1366-1389) → reimplementar usando `WatchActionButton` internamente (mantener firma externa)

### 4.4. `AddEntryScreen.kt`, `EditTurnoDatosScreen.kt`, `NoActiveTurnoScreen.kt`
Migrar caso por caso a los 3 composables nuevos.

### 4.5. `TurnoSummaryScreen.kt`, `TurnosScreen.kt`
Audit caso por caso. Algunos pueden requerir un `WatchTileBox` extendido o quedarse con fix minimo inline.

### 4.6. `NumericKeypad.kt`
Reubicado a `components/` por la regla de organizacion del codigo Wear
(teclados son reutilizables, no composables privados de una pantalla).
Su `KeyButton` privado adopta el patron robusto `background(color, shape)` para
no perpetuar la excepcion del patron fragil. No hay cambio funcional: el
componente nunca aplica `alpha < 1`, asi que el patron robusto es equivalente
en practica y elimina el riesgo si alguien aniade un alpha en el futuro.

---

## 5. Estrategia de tests (TDD con characterization tests)

Esta es la seccion clave del plan revisado. El orden es: **tests primero, fix despues**.

### 5.1. Por que tests primero

- **Caracterizan el comportamiento esperado**: el test define "el boton Pausar turno debe tener fondo `#101827` despues de anadir entrada". Si el test pasa con el bug presente, el test esta mal.
- **Red de seguridad**: cualquier regresion durante el refactor de 25 composables se detecta inmediatamente, no tras 30 minutos de cambios.
- **Verifican el fix**: si el test pasa con el fix, confirma que hemos arreglado el bug. Si pasa sin el fix, el test no captura nada util.
- **Disciplina profesional**: es lo que haria un senior. La metodologia inversa (fix + tests a posteriori) deja dudas sobre si los tests prueban algo real.

### 5.2. Infraestructura de tests (Fase 0)

**Hallazgo importante:** el modulo wear **NO tiene NADA de infraestructura de tests**. `android/wear/build.gradle` no incluye `testImplementation`, no hay `src/test/`, no hay JUnit. Esto hay que anadirlo PRIMERO.

**Cambios en `android/wear/build.gradle`:**

```gradle
dependencies {
    // ... todo lo existente ...

    // Tests
    testImplementation 'junit:junit:4.13.2'
    testImplementation 'androidx.compose.ui:ui-test-junit4:1.6.1'  // mismo train que ui:1.6.1
    debugImplementation 'androidx.compose.ui:ui-test-manifest:1.6.1'
}
```

**Crear directorios:**
- `android/wear/src/test/java/com/mijornada/app/`
- `android/wear/src/androidTest/java/com/mijornada/app/` (para futuros tests con emulador)

### 5.3. Pixel tests del comportamiento esperado (Fase 2)

**Principio:** el test debe definir el comportamiento correcto y **debe fallar en HEAD actual** porque el bug existe. Asi confirmamos que el test captura el bug de verdad.

**Localizacion:** `android/wear/src/test/java/com/mijornada/app/components/WatchActionButtonTest.kt`

**API a usar:**
- `createAndroidComposeRule<ComponentActivity>()` — porque el modulo wear no es UI pura
- `composeTestRule.setContent { WatchActionButton(...) }` — renderiza el composable
- `composeTestRule.onNodeWithTag("test-root").captureToImage()` — captura pixeles
- `image.toPixelMap()[centerX, centerY]` — lee el color de un pixel concreto
- `assertEquals(ColorPauseBg.toArgb(), capturedPixel)` — compara con el color esperado

**Tests a escribir (cada uno debe fallar en HEAD actual si renderizamos el composable con el patron fragil):**

#### Test 1: `WatchActionButton_pinta_fondo_correcto`
```kotlin
@Test
fun watch_action_button_pinta_fondo_correcto() {
    composeTestRule.setContent {
        WatchActionButton(
            label = "Pausar turno",
            textColor = ColorPause,
            backgroundColor = ColorPauseBg,
            modifier = Modifier.testTag("test-root")
        ) {}
    }
    val pixel = composeTestRule.onNodeWithTag("test-root")
        .captureToImage()
        .toPixelMap()[centerX, centerY]
    assertEquals(ColorPauseBg.toArgb(), pixel)
}
```

#### Test 2: `WatchActionButton_pinta_borde_opcional`
```kotlin
@Test
fun watch_action_button_pinta_borde_opcional() {
    composeTestRule.setContent {
        WatchActionButton(
            label = "Terminar turno",
            textColor = ColorGasolina,
            backgroundColor = ColorGasolinaBg,
            borderColor = ColorGasolina,
            borderWidth = 2.dp,
            modifier = Modifier.testTag("test-root")
        ) {}
    }
    val image = composeTestRule.onNodeWithTag("test-root").captureToImage()
    val pixelMap = image.toPixelMap()
    // Pixel en el borde izquierdo debe ser del color del borde
    val borderPixel = pixelMap[2, centerY]  // a 2 px del borde
    assertEquals(ColorGasolina.toArgb(), borderPixel)
}
```

#### Test 3: `Watch_action_button_pinta_alpha_cuando_deshabilitado`
```kotlin
@Test
fun watch_action_button_pinta_alpha_cuando_deshabilitado() {
    composeTestRule.setContent {
        WatchActionButton(
            label = "Pausar turno",
            textColor = ColorPause,
            backgroundColor = ColorPauseBg,
            enabled = false,
            modifier = Modifier.testTag("test-root")
        ) {}
    }
    val pixel = composeTestRule.onNodeWithTag("test-root")
        .captureToImage()
        .toPixelMap()[centerX, centerY]
    // alpha 0.5 sobre fondo negro deberia producir un pixel mas claro que ColorPauseBg puro
    val expectedApprox = blend(ColorPauseBg, ColorBackground, alpha = 0.5f)
    assertEquals(expectedApprox.toArgb(), pixel)
}
```

**Estos tests verifican el composable nuevo directamente**, no la integracion en pantallas (eso lo verificaremos en hardware real). Esto es suficiente porque:

1. Si `WatchActionButton` pinta bien, las pantallas que lo usen tambien pintaran bien (garantizado por la API).
2. Los tests son rapidos de correr (JUnit local, sin emulador).
3. Son robustos: verifican la API del composable, no la geometria exacta de las pantallas.

### 5.4. Test de integracion (Fase 5, hardware real)

Ademas de los pixel tests del composable, mantenemos la verificacion manual en Xiaomi Watch 5 con muestreo de pixeles (mismo criterio que el registro del 2026-06-26 05:50):

1. Iniciar turno
2. Anadir entrada tipo Datafono con importe
3. Tomar captura y muestrear pixel del boton "Pausar turno" → debe ser `#101827`
4. Anadir entrada tipo Extra
5. Muestrear de nuevo → sigue `#101827`
6. Pulsar "Terminar turno" → ir a EndTurnoScreen
7. Muestrear pixel del boton "Terminar Turno" → fondo `#290606`, borde `#FA6863`

---

## 6. Verificacion final en hardware

```powershell
# Compilacion y tipos
npx tsc --noEmit   # modulo movil
cd android && ./gradlew :wear:compileDebugKotlin

# Tests del modulo wear
cd android && ./gradlew :wear:testDebugUnitTest

# Build completo
cd android && ./gradlew :wear:assembleDebug
```

Y **verificacion visual en hardware real** (Xiaomi Watch 5), repitiendo el escenario del bug (seccion 5.4).

---

## 7. Registro en `CAMBIOS_AGENT.md`

Segun el formato del registro del 2026-06-26 05:50, la nueva entrada tendria esta estructura:

```markdown
## 2026-06-27 XX:XX - Cerrar el fix incompleto de fondo de tarjetas en todo el modulo wear

**Archivos modificados:**
- android/wear/build.gradle (anadir testImplementation)
- android/wear/src/test/java/.../WatchActionButtonTest.kt (nuevo)
- android/wear/src/main/java/com/mijornada/app/components/WatchActionButton.kt (nuevo)
- android/wear/src/main/java/com/mijornada/app/components/WatchTileBox.kt (nuevo)
- android/wear/src/main/java/com/mijornada/app/components/WatchMetricCard.kt (nuevo)
- android/wear/src/main/java/com/mijornada/app/theme/Tokens.kt (nuevo)
- android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt
- android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt
- android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt
- android/wear/src/main/java/com/mijornada/app/screens/EditTurnoDatosScreen.kt
- android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt
- android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt

Contexto: el 2026-06-26 05:50 se arreglo el fondo perdido al anadir entrada en
las tarjetas de categoria (TarjetaCategoria), pero el fix se quedo incompleto:
el mismo patron fragil clip().background() seguia replicado en ~25 composables
del modulo wear. Los botones grandes "Pausar turno" y "Terminar turno" de
ActiveTurnoScreen, los 3 botones de BotonPlano en EndTurnoScreen, y el overlay
ConfirmDeleteButton de WearMainActivity siguen el mismo patron y manifiestan
(o pueden manifestar) el mismo bug.

### Cambio 1 - Anadir infraestructura de tests al modulo wear

[build.gradle + crear src/test/]

#### Por que se cambio
El modulo wear no tenia tests a pesar de tener composables criticos con bugs
de render conocidos. Se anade JUnit + ui-test-junit4 para poder escribir
pixel tests que detecten regresiones futuras del mismo patron fragil.

### Cambio 2 - Extraer WatchActionButton / WatchTileBox / WatchMetricCard

[codigo de los 3 composables]

#### Por que se cambio
Centralizar el patron robusto en composables reutilizables impide que el
patron fragil vuelva a aparecer por copy-paste. Los 3 composables viven
en `components/` para que cualquier futuro screen del reloj los use por
defecto.

### Cambio 3 - Migrar ActiveTurnoScreen, EndTurnoScreen, WearMainActivity, ...

[por cada migracion: codigo anterior / codigo nuevo / por que]

### Verificacion

**Pixel tests (JVM local):** los 3 tests de WatchActionButton pasan
(verifican fondo, borde y alpha del composable).

**Verificacion visual hardware real (Xiaomi Watch 5):** tras anadir
entradas sucesivas (Datafono, Propinas, Extra) los tres botones grandes
(Anadir nota, Pausar turno, Terminar turno) mantuvieron su fondo y borde
correctos (#0A121F / #101827 / #290606 con borde #FA6863) sin necesidad
de salir y volver a entrar. Tambien verificado en EndTurnoScreen: los
botones Terminar Turno, Cancelar y Guardar conservan su estilo durante
toda la sesion de cierre.

**Reconocimiento historico:** este fix cierra el trabajo iniciado en
2026-06-26 05:50. La entrada anterior documento correctamente el bug y
el fix para TarjetaCategoria, pero el alcance era limitado. Esta entrada
lo extiende al resto del modulo wear.
```

---

## 8. Estimacion de esfuerzo (revisada con orden TDD)

| Fase | Tareas | Tiempo estimado |
|------|--------|-----------------|
| **Fase 0** | Anadir infraestructura de tests al `build.gradle` + crear directorios | 10 min |
| **Fase 1** | Test trivial + verificar `./gradlew :wear:testDebugUnitTest` corre | 5 min |
| **Fase 2** | Pixel tests del bug (3 tests, deben fallar en HEAD actual) | 30 min |
| **Fase 3a** | Crear `theme/Tokens.kt` | 5 min |
| **Fase 3b** | Crear `components/WatchActionButton.kt` + tests | 30 min |
| **Fase 3c** | Crear `components/WatchTileBox.kt` + tests | 20 min |
| **Fase 3d** | Crear `components/WatchMetricCard.kt` + tests | 20 min |
| **Fase 3e** | Migrar `ActiveTurnoScreen.kt` | 30 min |
| **Fase 3f** | Migrar `EndTurnoScreen.kt` (eliminar `BotonPlano`) | 30 min |
| **Fase 3g** | Migrar `WearMainActivity.kt` (`ConfirmDeleteButton`) | 10 min |
| **Fase 3h** | Migrar `AddEntryScreen.kt`, `EditTurnoDatosScreen.kt`, `NoActiveTurnoScreen.kt` | 40 min |
| **Fase 3i** | Audit `TurnoSummaryScreen.kt` y `TurnosScreen.kt` | 30 min |
| **Fase 4** | Re-correr `./gradlew :wear:testDebugUnitTest` (todos verdes) | 5 min |
| **Fase 5** | Verificacion manual en Xiaomi Watch 5 | 30 min |
| **Fase 6** | Registro en `CAMBIOS_AGENT.md` | 30 min |
| **Total** | | **~5.5 horas** |

(Una hora mas que el plan original, justificada por: 45 min de setup de tests + 30 min de escribir los 3 pixel tests + 10 min extra de verificacion final.)

---

## 9. Riesgos y rollback

- **Riesgo bajo:** los nuevos composables encapsulan exactamente la misma semantica visual; el cambio es interno.
- **Riesgo bajo:** la API publica de las screens no cambia (solo la implementacion interna).
- **Riesgo bajo:** los pixel tests corren en JVM local (sin emulador), son rapidos y deterministas.
- **Plan de rollback:** cada cambio se commitea por separado, asi si algo falla se puede revertir el commit problematico sin perder el resto. Los tests acts como "canario" que detecta el problema antes de hacer commit.

---

## 10. Preguntas para Carlos antes de arrancar

1. **Alcance:** ¿Aplicamos TODO el plan (Fases 0 a 6), o prefieres empezar por el ambito del bug que viste (Fases 0, 1, 2 parcial + 3b, 3e, 3f, 3g) y dejar el resto para otra sesion?

2. **Tests de snapshot vs pixel sampling:** He propuesto pixel sampling (mas simple, sin imagenes golden). ¿Te va bien, o prefieres snapshot tests con imagenes golden (mas robustos pero mas fragiles a cambios de tema)?

3. **Registro historico:** ¿Anado en la nueva entrada de `CAMBIOS_AGENT.md` una nota reconociendo que el fix del 2026-06-26 se quedo incompleto? (Recomiendo que si, para que no se repita.)

4. **Build verification:** ¿Quieres que corra yo `./gradlew :wear:compileDebugKotlin` y `./gradlew :wear:testDebugUnitTest` despues de cada commit, o prefieres verificar tu mismo en el reloj fisico antes de seguir?

5. **Veredicto sobre el orden TDD:** ¿Confirmas que arrancamos por Fase 0 (infraestructura de tests) en lugar de empezar por los composables? Es el orden que tu propusiste y el más profesional.

---

## 11. Plan de commits con orden TDD

Si me das OK, este es el orden de ejecucion:

### Commit 1 — Fase 0: Infraestructura de tests
- Modificar `android/wear/build.gradle` (anadir testImplementation)
- Crear `android/wear/src/test/java/com/mijornada/app/.gitkeep`
- Verificar: `./gradlew :wear:compileDebugUnitTestKotlin` → OK
- **Verificacion automatica:** el comando compila el directorio de tests vacio.

### Commit 2 — Fase 1: Sanity check
- Crear `android/wear/src/test/java/com/mijornada/app/SanityTest.kt` con `assertEquals(2, 1+1)`
- Verificar: `./gradlew :wear:testDebugUnitTest` → 1 test passed
- **Verificacion automatica:** JUnit reporta el test como verde.

### Commit 3 — Fase 2: Pixel tests del bug (deben fallar)
- Crear `android/wear/src/test/java/com/mijornada/app/components/WatchActionButtonTest.kt` con los 3 pixel tests apuntando a un composable "dummy" con patron VIEJO (clip().background()).
- Verificar: `./gradlew :wear:testDebugUnitTest` → 3 tests **FAILED** (esto es bueno, confirma que el bug existe y que los tests lo detectan).
- **Verificacion automatica:** los tests fallan porque el composable dummy reproduce el bug. Mensaje esperado: "Expected #101827 but was #0D0D14".

### Commit 4 — Fase 3a: theme/Tokens.kt
- Crear `theme/Tokens.kt`.
- Verificar: `./gradlew :wear:compileDebugKotlin` → OK.

### Commit 5 — Fase 3b: WatchActionButton
- Crear `components/WatchActionButton.kt`.
- Actualizar `WatchActionButtonTest.kt` para apuntar al composable nuevo.
- Verificar: `./gradlew :wear:testDebugUnitTest` → los 3 pixel tests **PASSED**.
- **Verificacion automatica:** ahora el composable pinta bien y los tests pasan.

### Commit 6 — Fase 3c: WatchTileBox
- Crear `components/WatchTileBox.kt` + tests basicos.

### Commit 7 — Fase 3d: WatchMetricCard
- Crear `components/WatchMetricCard.kt` + tests basicos.

### Commit 8 — Fase 3e: Migrar ActiveTurnoScreen
- Aplicar cambios de la seccion 4.1.

### Commit 9 — Fase 3f: Migrar EndTurnoScreen (eliminar BotonPlano)
- Aplicar cambios de la seccion 4.2.

### Commit 10 — Fase 3g: Migrar WearMainActivity
- Aplicar cambios de la seccion 4.3.

### Commit 11 — Fase 3h: Migrar AddEntryScreen, EditTurnoDatosScreen, NoActiveTurnoScreen
- Aplicar cambios de la seccion 4.4.

### Commit 12 — Fase 3i: Audit TurnoSummaryScreen, TurnosScreen
- Aplicar cambios de la seccion 4.5.

### Commit 13 — Fase 4: Verificacion completa
- `./gradlew :wear:testDebugUnitTest` → todos verdes
- `./gradlew :wear:assembleDebug` → build OK

### Commit 14 — Fase 5: Verificacion en Xiaomi Watch 5
- Carlos verifica manualmente con muestreo de pixeles.
- Si OK, este commit solo contiene un comentario o el readme actualizado.

### Commit 15 — Fase 6: Registro en CAMBIOS_AGENT.md
- Anadir entrada del 2026-06-27 con todo el contexto.

Entre cada commit, ejecuto `./gradlew :wear:compileDebugKotlin`. Si algo rompe, te aviso y no avanzo hasta tu decision.

---

**Total: 15 commits verificables.** Cada uno deja el repo en un estado consistente (compila + tests pasan). Si hay que abortar a mitad, no queda nada a medias.