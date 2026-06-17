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
