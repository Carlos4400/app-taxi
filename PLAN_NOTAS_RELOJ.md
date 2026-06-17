# Plan verificado — Mejorar notas detalladas en el reloj (Wear OS)

Estado: **propuesto, sin implementar**. Documento para seguir paso a paso.
Fecha de redacción: 2026-06-17.
Criterio rector: mantener el reloj lo más parecido a la app del móvil.

## Objetivo

Corregir cómo se muestran las notas en el reloj en tres situaciones:

1. **Botón de nota en el teclado de importe** (al añadir/editar una entrada): hoy muestra `✓ <12 caracteres>`. Se quiere: quitar el `✓`, mostrar la nota entera y poder desplazar la pantalla para llegar al botón inferior (incluido "Eliminar entrada" en modo edición).
2. **Lista "ÚLTIMAS ENTRADAS" del turno activo**: hoy la nota se corta a una línea con `…`. Se quiere mostrarla entera con salto de línea, como en la pantalla "Terminar turno".
3. **Confirmación de borrado de entrada** (Cambio C): hoy corta la nota a 32 caracteres. Se quiere mostrarla entera, por coherencia del flujo.

## Archivos afectados

- `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt` (Cambio A)
- `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt` (Cambios B1, B2)
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt` (Cambios B3, C)

Solo UI del módulo `wear`. **No** se tocan `src/logic/accounting.ts`, `src/logic/week-logic.ts` ni el protocolo Wear → no afecta a las invariantes de `ARQUITECTURA_RELOJ_WEAR_OS.md`.

## Verificación previa (hecha)

- **Doc oficial (Jetpack Compose):** `maxLines` + `TextOverflow.Ellipsis` es lo que produce el `…`. Sin `maxLines`, `Text` envuelve a varias líneas por defecto (`softWrap = true`). Fuente: developer.android.com/develop/ui/compose/text/configure-layout.
- **Referencia ya correcta en el propio código:** `EndTurnoScreen.NotaDetalladaRow` y `TurnoSummaryScreen.NoteRow` muestran `Text(entry.note, … Modifier.weight(1f))` sin `maxLines` → nota completa. Coincide con el móvil (`src/components/turno-notas.tsx`, que usa `overflowWrap:"anywhere"`).
- **`AddEntryScreen.kt` ya importa** `rememberScrollState` y `verticalScroll` (los usa `NotaEditor`) → no hacen falta imports nuevos para el scroll del teclado.
- **`RemoteInput` (`WearMainActivity.kt:1059`):** `setLabel(...)` es **solo la etiqueta/pista**, no rellena el campo editable. Quitar `take(24)` solo cambia la pista, **no** prefilla la nota al reeditar (limitación aparte, fuera del alcance de estas fotos).

---

## Cambio A — Nota completa en "ÚLTIMAS ENTRADAS"

Archivo: `ActiveTurnoScreen.kt`, función `EntradaHistorial` (≈ líneas 407-452).
Reestructurar de una sola `Row` a un `Column` con dos niveles.

### Antes
```kotlin
@Composable
private fun EntradaHistorial(entry: WatchEntry, bloqueado: Boolean = false, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            .alpha(if (entry.pendiente) 0.55f else 1f)
            .clickable(enabled = !bloqueado) { onClick() }
            .padding(horizontal = 12.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        CategoriaIcon(entry.type, meta.color, 14.dp)
        Spacer(modifier = Modifier.width(7.dp))
        Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
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

### Después
```kotlin
@Composable
private fun EntradaHistorial(entry: WatchEntry, bloqueado: Boolean = false, onClick: () -> Unit) {
    val meta = categoriaMeta(entry.type)
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            .alpha(if (entry.pendiente) 0.55f else 1f)
            .clickable(enabled = !bloqueado) { onClick() }
            .padding(horizontal = 12.dp, vertical = 9.dp)
    ) {
        // Nivel 1: icono + categoria + hora + (pendiente) + importe
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
        // Nivel 2: nota completa con salto de linea (como en Terminar turno y en el movil)
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

### Limpieza de import
Tras este cambio, `TextOverflow` deja de usarse en el archivo. Eliminar la línea de import (≈ línea 26):
```kotlin
import androidx.compose.ui.text.style.TextOverflow
```
(`TextAlign`, línea 25, sigue en uso → se mantiene.)

---

## Cambio B1 — Hacer desplazable el teclado de importe

Archivo: `AddEntryScreen.kt`, `Column` interior de la rama no-nota (≈ líneas 62-66).
Se adopta el patrón ya probado en `ActiveTurnoScreen`/`EndTurnoScreen`: scroll vertical, flujo desde arriba y `bottom = 44.dp` para que el último botón no lo recorte la curva inferior del círculo.

### Antes
```kotlin
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
```

### Después
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(top = 18.dp, bottom = 44.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

Notas:
- Se quita `verticalArrangement = Arrangement.Center`. Razón verificada: con `verticalScroll`, centrar y desbordar a la vez da problemas de alcance; el patrón fiable del propio proyecto es flujo desde arriba con padding. El contenido arranca un poco más alto que ahora (diferencia menor en una pantalla que ya ocupa casi todo el alto).
- `bottom = 44.dp` reutiliza la solución ya usada en este proyecto para que el botón inferior ("Eliminar entrada" en edición) quede accesible y no recortado.

---

## Cambio B2 — Botón de nota: quitar el "✓" y mostrar la nota entera

Archivo: `AddEntryScreen.kt`. Afecta a la llamada (≈ líneas 115-119) y a la definición de `NotaButton` (≈ líneas 180-202).

### Llamada — Antes
```kotlin
            NotaButton(
                text = if (note.isBlank()) "+ Nota" else "✓ ${note.take(12)}",
                selected = note.isNotBlank(),
                onClick = { onRequestNote(note) { result -> note = result } }
            )
```

### Llamada — Después
```kotlin
            NotaButton(
                note = note,
                onClick = { onRequestNote(note) { result -> note = result } }
            )
```

### Definición — Antes
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

### Definición — Después
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

### Import a añadir
`AddEntryScreen.kt` no importa `TextAlign`. Añadir:
```kotlin
import androidx.compose.ui.text.style.TextAlign
```
(`Column`, `Spacer`, `height` ya están disponibles vía `layout.*`.)

Resultado: se elimina el `✓`, se sustituye por una cabecera clara "✎ Nota", y la nota se muestra entera con salto de línea. Combinado con B1, el botón puede crecer y la pantalla se desplaza.

---

## Cambio B3 — Etiqueta del teclado del sistema (menor, opcional)

Archivo: `WearMainActivity.kt:1059`.

### Antes
```kotlin
                .setLabel(if (current.isBlank()) "Nota" else current.take(24))
```

### Después
```kotlin
                .setLabel(if (current.isBlank()) "Nota" else current)
```

Aclaración honesta: esto solo afecta a la **etiqueta/pista** del `RemoteInput`; **no** prefilla el campo editable (el sistema arranca vacío igualmente). Es un retoque cosmético menor. Si la nota es muy larga, la etiqueta podría verse aparatosa; valorar dejarlo como está. **Recomendación: opcional.**

---

## Cambio C — Nota completa al confirmar borrado

Archivo: `WearMainActivity.kt`, `ConfirmDeleteScreen` (≈ línea 1332-1334).

### Antes
```kotlin
            if (entry.note.isNotBlank()) {
                Text(entry.note.take(32), color = ColorGrey, fontSize = 11.sp)
            }
```

### Después
```kotlin
            if (entry.note.isNotBlank()) {
                Text(
                    entry.note,
                    color = ColorGrey,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(0.88f)
                )
            }
```

Verificar que `TextAlign`, `Modifier`, `fillMaxWidth` estén importados en `WearMainActivity.kt` (lo habitual en esa Activity). Si `TextAlign` no estuviera importado, añadir `import androidx.compose.ui.text.style.TextAlign`.

---

## Riesgo conocido y comprobación

- **B1 (scroll en el teclado):** el contenido pasa de centrado a flujo desde arriba. Comprobar en el reloj que el título superior no queda cortado por la curva; si hiciera falta, subir `top` de 18 a 20-22 dp.
- El resto son cambios de texto sin lógica; bajo riesgo.

## Checklist de verificación final (obligatorio antes de cerrar)

1. `npx tsc --noEmit` — sin errores (no se toca TS, pero se confirma).
2. `npm test` — en verde.
3. `npm run build` — compila.
4. `./gradlew :wear:assembleDebug` — compila el módulo del reloj.
5. `./gradlew :wear:lintDebug` — sin avisos nuevos (especial atención al import de `TextOverflow` eliminado).
6. Registrar la entrada en `CAMBIOS_AGENT.md` según `AGENTS.md` (una entrada, un bloque por cambio A/B1/B2/[B3]/C, con código anterior/nuevo/por qué).
7. Prueba física en el reloj: añadir entrada con nota larga, ver la nota entera en el botón; desplazar hasta "Eliminar entrada"; ver la nota entera en "Últimas entradas"; confirmar borrado mostrando la nota.

## Orden de ejecución sugerido

A → B1 → B2 → (B3 si se decide) → C → limpieza de imports → checklist.
