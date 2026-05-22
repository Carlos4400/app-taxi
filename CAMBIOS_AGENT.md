# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió. Las entradas se añaden al **principio** del archivo (las más recientes arriba).

El formato completo de una entrada está documentado en `AGENTS.md`, sección "Ejemplo de entrada".


## 2026-05-22 19:40 - Reordenar notas del ticket impreso

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Título principal del ticket impreso

#### Código anterior
```tsx
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#000000" }}>LIQUIDACION SEMANAL</div>
```

#### Código nuevo
```tsx
            <div style={{ textAlign: "center", fontSize: 16, marginBottom: 4, color: "#000000" }}>LIQUIDACION SEMANAL</div>
```

#### Por qué se cambió
El título principal del ticket impreso debía mantenerse igual de tamaño y posición, pero sin negrita.

### Cambio 2 - Estructura de notas impresas

#### Código anterior
```tsx
                    {notasGenerales.map((entry) => (
                      <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                        <span>{entry.time}</span>
                        <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>Nota: {entry.note.trim()}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                          <span>{entry.time}</span>
                          <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{meta.label}: {entry.note.trim()} ({fmt(entry.amount)})</span>
                        </div>
                      );
                    })}
```

#### Código nuevo
```tsx
                    {notasGenerales.map((entry) => (
                      <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                        <span>{entry.time}</span>
                        <span>Nota:</span>
                        <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                          <span>{entry.time}</span>
                          <span>{meta.label}:</span>
                          <span>({fmt(entry.amount)})</span>
                          <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</span>
                        </div>
                      );
                    })}
```

#### Por qué se cambió
Las notas largas empezaban en una línea distinta porque etiqueta, texto e importe estaban dentro del mismo bloque flexible. Se separan en columnas para que la nota empiece alineada con las demás y el importe aparezca al principio, antes del texto.

### Cambio 3 - Test de notas impresas

#### Código anterior
```ts
    expect(printerTicketBlock).toContain('display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)"');
    expect(printerTicketBlock).toContain('entry.note.trim()');
```

#### Código nuevo
```ts
    expect(printerTicketBlock).toContain('textAlign: "center", fontSize: 16, marginBottom: 4, color: "#000000"');
    expect(printerTicketBlock).not.toContain('textAlign: "center", fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#000000"');
    expect(printerTicketBlock).toContain('display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(printerTicketBlock).toContain('display: "grid", gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
    expect(printerTicketBlock).toContain('<span>Nota:</span>');
    expect(printerTicketBlock).toContain('<span>{meta.label}:</span>');
    expect(printerTicketBlock).toContain('<span>({fmt(entry.amount)})</span>');
    expect(printerTicketBlock).toContain('{entry.note.trim()}</span>');
```

#### Por qué se cambió
La prueba protege que el título principal no vuelva a negrita y que las notas impresas mantengan columnas separadas para hora, etiqueta, importe y texto.


## 2026-05-22 19:33 - Mejorar ticket de impresora

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Fecha y bloque superior del ticket

#### Código anterior
```tsx
            <div style={{ textAlign: "center", fontSize: 13, marginBottom: 12, color: "#000000" }}>{formatWeekRangeFull(weekId)}</div>
            <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total KM</span><span>{fmtKmNumber(totalKMAcumulado)} KM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Comision Bruta Jefe</span><span>{fmt(brutoJefeAcumulado)}</span>
            </div>
```

#### Código nuevo
```tsx
            <div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#000000" }}>{formatWeekRangeFull(weekId)}</div>
            <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#000000", marginBottom: 4 }}>
              <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total KM</span><span>{fmtKmNumber(totalKMAcumulado)} KM</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Comision Bruta Jefe</span><span>{fmt(brutoJefeAcumulado)}</span>
            </div>
```

#### Por qué se cambió
La fecha de la semana del ticket impreso necesitaba más presencia y negrita. El total de taxímetro también debía ir en negrita, y el bloque de taxímetro/KM debía quedar separado de la comisión bruta.

### Cambio 2 - Notas largas del ticket de impresora

#### Código anterior
```tsx
                    {notasGenerales.map((entry) => (
                      <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8 }}>{entry.time} Nota: {entry.note.trim()}</div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8 }}>{entry.time} {meta.label}: {entry.note.trim()} ({fmt(entry.amount)})</div>
                      );
                    })}
```

#### Código nuevo
```tsx
                    {notasGenerales.map((entry) => (
                      <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                        <span>{entry.time}</span>
                        <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>Nota: {entry.note.trim()}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                          <span>{entry.time}</span>
                          <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{meta.label}: {entry.note.trim()} ({fmt(entry.amount)})</span>
                        </div>
                      );
                    })}
```

#### Por qué se cambió
Las notas largas llegaban hasta el borde del ticket y quedaban difíciles de leer. La fila pasa a una estructura con hora fija y texto flexible que rompe palabras largas dentro del ancho disponible.

### Cambio 3 - Test del ticket de impresora

#### Código anterior
```ts
`No existía la prueba "formats the printer ticket header and wraps long notes" en src/__tests__/liquidacion-semana.test.ts.`
```

#### Código nuevo
```ts
  it("formats the printer ticket header and wraps long notes", () => {
    const printerTicketBlock = source.match(
      /id="ticket-impresora"[\s\S]*?onClick=\{copyToClipboard\}/
    )?.[0] || "";

    expect(printerTicketBlock).toContain('fontSize: 15, fontWeight: 700, marginBottom: 12');
    expect(printerTicketBlock).toContain('fontWeight: 700, color: "#000000", marginBottom: 4');
    expect(printerTicketBlock).toContain('margin: "6px 0"');
    expect(printerTicketBlock).toContain('display: "grid", gridTemplateColumns: "46px minmax(0, 1fr)"');
    expect(printerTicketBlock).toContain('overflowWrap: "anywhere"');
    expect(printerTicketBlock).toContain('wordBreak: "break-word"');
    expect(printerTicketBlock).toContain('whiteSpace: "normal"');
    expect(printerTicketBlock).toContain('entry.note.trim()');
  });
```

#### Por qué se cambió
La prueba protege que el ticket impreso conserve la fecha destacada, el taxímetro en negrita, la separación con comisión y el ajuste de líneas para notas largas.


## 2026-05-22 19:28 - Corregir tamaño de notas semanales

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Título de notas de la semana

#### Código anterior
```tsx
              <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.6px", textShadow: "0 0 10px rgba(255,255,255,0.18)" }}>
```

#### Código nuevo
```tsx
              <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "white", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.6px", textShadow: "0 0 10px rgba(255,255,255,0.18)" }}>
```

#### Por qué se cambió
El título "Notas de la semana" debía tener el mismo tamaño que el rango de semana del principio del ticket, no el tamaño de las fechas internas de cada bloque de notas. También se aumenta la separación antes de la primera nota.

### Cambio 2 - Test del título de notas semanales

#### Código anterior
```ts
    expect(liquidacionBlock).toContain('paddingTop: 14, display: "flex", flexDirection: "column", gap: 14');
    expect(liquidacionBlock).toContain('fontSize: 13, fontWeight: 800, color: "white", textAlign: "center"');
```

#### Código nuevo
```ts
    expect(liquidacionBlock).toContain('paddingTop: 14, display: "flex", flexDirection: "column", gap: 18');
    expect(liquidacionBlock).toContain('fontSize: 20, fontWeight: 800, color: "white", textAlign: "center"');
```

#### Por qué se cambió
La prueba fija que el título queda al tamaño del rango de semana del ticket y que hay más separación vertical antes del primer bloque de notas.


## 2026-05-22 19:19 - Eliminar nulos acumulados de liquidación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Variable informativa de nulos en liquidación

#### Código anterior
```tsx
    let totalDescontarAcumulado = 0;
    let totalNetoAcumulado = 0;
    let totalNulosAcumulado = 0;
    let totalKMAcumulado = 0;
```

```tsx
      totalDescontarAcumulado += calc.totalDescontar;
      totalNetoAcumulado += calc.totalADar;
      totalNulosAcumulado += (t.totalN || 0);
      totalKMAcumulado += (t.km || 0);
```

```tsx
    totalDescontarAcumulado = roundMoney(totalDescontarAcumulado);
    totalNetoAcumulado = roundMoney(totalNetoAcumulado);
    totalNulosAcumulado = roundMoney(totalNulosAcumulado);
```

#### Código nuevo
```tsx
    let totalDescontarAcumulado = 0;
    let totalNetoAcumulado = 0;
    let totalKMAcumulado = 0;
```

```tsx
      totalDescontarAcumulado += calc.totalDescontar;
      totalNetoAcumulado += calc.totalADar;
      totalKMAcumulado += (t.km || 0);
```

```tsx
    totalDescontarAcumulado = roundMoney(totalDescontarAcumulado);
    totalNetoAcumulado = roundMoney(totalNetoAcumulado);
```

#### Por qué se cambió
`totalNulosAcumulado` solo alimentaba un dato informativo visible en liquidación. Al quitar ese dato, se elimina también su variable local para no dejar código muerto en la pantalla.

### Cambio 2 - Texto copiado de liquidación

#### Código anterior
```tsx
      const text = `📋 *LIQUIDACIÓN SEMANAL*\n📅 *Semana:* ${dates}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKMAcumulado)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefeAcumulado)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descDAcumulado)}\n  ⛽ Gasolina: -${fmt(descGAcumulado)}\n  🎟️ Agencias/Bonos: -${fmt(descAAcumulado)}\n  ➕ Extras: -${fmt(descEAcumulado)}\n💰 *Total Descuentos:* -${fmt(totalDescontarAcumulado)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNetoAcumulado)}* 👈\n\nℹ️ _Nulos acumulados: ${fmt(totalNulosAcumulado)}_${formatLiquidacionNotasText()}`;
```

#### Código nuevo
```tsx
      const text = `📋 *LIQUIDACIÓN SEMANAL*\n📅 *Semana:* ${dates}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKMAcumulado)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefeAcumulado)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descDAcumulado)}\n  ⛽ Gasolina: -${fmt(descGAcumulado)}\n  🎟️ Agencias/Bonos: -${fmt(descAAcumulado)}\n  ➕ Extras: -${fmt(descEAcumulado)}\n💰 *Total Descuentos:* -${fmt(totalDescontarAcumulado)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNetoAcumulado)}* 👈${formatLiquidacionNotasText()}`;
```

#### Por qué se cambió
El texto copiado debía coincidir con la liquidación visible y dejar de incluir la línea informativa de nulos acumulados.

### Cambio 3 - Pie informativo del ticket digital

#### Código anterior
```tsx
            {/* Informativos (Pie del ticket) */}
            <div style={{
              borderTop: "1px dashed rgba(255, 255, 255, 0.15)",
              paddingTop: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 15,
              color: "rgba(255, 255, 255, 0.35)",
              fontStyle: "italic"
            }}>
              <span>Total Nulos acumulados:</span>
              <span style={{ fontFamily: "monospace" }}>{fmt(totalNulosAcumulado)}</span>
            </div>

            {turnosConNotas.length > 0 && (
```

#### Código nuevo
```tsx
            {turnosConNotas.length > 0 && (
```

#### Por qué se cambió
La pantalla de liquidación no necesita mostrar el dato de nulos acumulados y queda más limpia sin ese pie informativo.

### Cambio 4 - Ticket de impresora

#### Código anterior
```tsx
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: "#000000", margin: "8px 0" }}>
              NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ fontSize: 12, color: "#000000", marginBottom: 4 }}>Nulos acumulados: {fmt(totalNulosAcumulado)}</div>
            {turnosConNotas.length > 0 && (
```

#### Código nuevo
```tsx
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: "#000000", margin: "8px 0" }}>
              NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
            </div>
            {turnosConNotas.length > 0 && (
```

#### Por qué se cambió
El ticket de impresora también debía dejar de incluir la línea de nulos acumulados para mantener el mismo contenido que la liquidación.

### Cambio 5 - Test de liquidación

#### Código anterior
```ts
    expect(source).toContain("NETO A ENTREGAR:");
    expect(source).toContain("Nulos acumulados:");
```

#### Código nuevo
```ts
    expect(source).toContain("NETO A ENTREGAR:");
    expect(source).not.toContain("Nulos acumulados:");
    expect(source).not.toContain("Total Nulos acumulados:");
    expect(source).not.toContain("totalNulosAcumulado");
```

#### Por qué se cambió
La prueba ahora protege que el dato de nulos acumulados no vuelva a aparecer en liquidación ni quede como variable local sin uso.


## 2026-05-20 22:28 - Extender alignItems start a notas detalladas de otras pantallas

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Notas detalladas en Ver Turno (modal)

#### Código anterior
```tsx
<div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'center', gap: 8, minWidth: 0 }}>
```

#### Código nuevo
```tsx
<div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'start', gap: 8, minWidth: 0 }}>
```

#### Por qué se cambió
En la pantalla de Ver Turno, las notas detalladas con texto largo quedaban desalineadas verticalmente con la hora y el importe. Se unifica el comportamiento con liquidacionSemana.

### Cambio 1b - Hora e importe anclados arriba en Ver Turno

#### Código anterior
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
<span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0, alignSelf: "start" }}>{e.time}</span>
<span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: "start" }}>{fmt(e.amount)}</span>
```

#### Por qué se cambió
alignSelf: "start" ancla hora e importe arriba sin depender de la altura que tome la nota al fluir hacia abajo.

### Cambio 2 - Notas detalladas en Terminar Turno (modal)

#### Código anterior
```tsx
<div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
```

#### Código nuevo
```tsx
<div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "start", gap: 8, minWidth: 0 }}>
```

#### Por qué se cambió
En la pantalla de Terminar Turno ocurría lo mismo: notas largas desalineadas con hora e importe. Se aplica el mismo ajuste.

### Cambio 3 - Hora e importe anclados arriba en Terminar Turno

#### Código anterior
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
<span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0, alignSelf: "start" }}>{e.time}</span>
<span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0, alignSelf: "start" }}>{fmt(e.amount)}</span>
```

#### Por qué se cambió
Con alignItems: "start" la nota fluye hacia abajo pero hora e importe flotaban a media altura. alignSelf: "start" los ancla arriba.

### Cambio 4 - Notas detalladas en tarjeta de turno del historial

#### Código anterior
```tsx
<div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 7, minWidth: 0 }}>
```

#### Código nuevo
```tsx
<div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "start", gap: 7, minWidth: 0 }}>
```

#### Por qué se cambió
La tarjeta de turno visible en el historial mensual también mostraba notas detalladas desalineadas. Se extiende el cambio a esa vista.

### Cambio 4b - Hora e importe anclados arriba en historial

#### Código anterior
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0 }}>{entry.time}</span>
<span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
```

#### Código nuevo
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0, alignSelf: "start" }}>{entry.time}</span>
<span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0, alignSelf: "start" }}>{fmt(entry.amount)}</span>
```

#### Por qué se cambió
Mismo problema: con alignItems: "start" la nota fluye y deja hora e importe flotando. alignSelf: "start" los ancla arriba.

### Cambio 5 - Entradas en pantalla de turno activo (main)

#### Código anterior
```tsx
display: "grid",
gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
alignItems: "center",
```

#### Código nuevo
```tsx
display: "grid",
gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
alignItems: "start",
```

#### Por qué se cambió
En la pantalla principal mientras el turno está activo, las filas de entradas con nota larga quedaban desalineadas verticalmente. Ahora hora e importe se alinean con la primera línea de la nota.

### Cambio 5b - Hora e importe anclados arriba en entradas de turno activo

#### Código anterior
```tsx
<span style={{
  fontSize: 12,
  color: "rgba(255,255,255,0.5)",
  flexShrink: 0,
}}>
  {e.time}
</span>
<span style={{ fontSize: 14, fontWeight: 700, color: meta.color, flexShrink: 0 }}>
  {e.type !== "nota" && `+${fmt(e.amount)}`}
</span>
```

#### Código nuevo
```tsx
<span style={{
  fontSize: 12,
  color: "rgba(255,255,255,0.5)",
  flexShrink: 0,
  alignSelf: "start",
}}>
  {e.time}
</span>
<span style={{ fontSize: 14, fontWeight: 700, color: meta.color, flexShrink: 0, alignSelf: "start" }}>
  {e.type !== "nota" && `+${fmt(e.amount)}`}
</span>
```

#### Por qué se cambió
Con alignItems: "start" la nota fluye hacia abajo, pero la columna del importe queda flotando a media altura si la nota tiene varias líneas. alignSelf: "start" en hora e importe los ancla arriba independientemente de la altura de la nota.


## 2026-05-20 22:23 - Alinear arriba hora y categoría en notas detalladas largas


**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Estado procesandoTicket

#### Código anterior
```tsx
  const [copiado, setCopiado] = useState(false);
```

#### Código nuevo
```tsx
  const [copiado, setCopiado] = useState(false);
  const [procesandoTicket, setProcesandoTicket] = useState(false);
```

#### Por qué se cambió
Se necesita un estado dedicado para deshabilitar el botón "Imprimir Ticket" mientras se genera la imagen y evitar doble pulsación.

### Cambio 2 - Función sharePrinterTicket

#### Código anterior
`No existía la función sharePrinterTicket en src/main.tsx.`

#### Código nuevo
```tsx
    const sharePrinterTicket = async () => {
      const element = document.getElementById("ticket-impresora");
      if (!element) return;
      setProcesandoTicket(true);
      // ... captura con html2canvas fondo blanco, escala 3x
      // ... guarda con Filesystem.writeFile y comparte con Share.share en Android
      // ... descarga PNG en web
    };
```

#### Por qué se cambió
Se necesita una función separada de `copyToClipboard` que capture el ticket de impresora (fondo blanco, fuente Courier) y lo comparta via `@capacitor/share` en Android o lo descargue en web.

### Cambio 3 - Ticket HTML oculto (id="ticket-impresora")

#### Código anterior
`No existía el elemento con id="ticket-impresora" en src/main.tsx.`

#### Código nuevo
```tsx
          <div
            id="ticket-impresora"
            style={{ position: "absolute", left: "-9999px", top: 0, width: 384,
              backgroundColor: "#ffffff", color: "#000000",
              fontFamily: "'Courier New', Courier, monospace", fontSize: 14,
              padding: "20px 16px", lineHeight: 1.5 }}
          >
            {/* Cabecera, totales, descuentos, neto, notas en negro puro sobre blanco */}
          </div>
```

#### Por qué se cambió
La impresora térmica espera PNG de fondo blanco con texto negro puro. El elemento se oculta fuera de pantalla (`left: -9999px`) para no interferir con el tema oscuro. Ancho 384px = papel estándar de 58mm.

### Cambio 4 - Botón "Imprimir Ticket"

#### Código anterior
`No existía el botón id="btn-imprimir-ticket" en src/main.tsx.`

#### Código nuevo
```tsx
            <button id="btn-imprimir-ticket" onClick={sharePrinterTicket} disabled={procesandoTicket}
              style={{ padding: "16px 0", borderRadius: 16,
                background: procesandoTicket ? "rgba(255,255,255,0.04)" : "rgba(37, 210, 252, 0.1)",
                border: procesandoTicket ? "..." : "1px solid rgba(37, 210, 252, 0.3)",
                color: procesandoTicket ? "rgba(255,255,255,0.35)" : "#25d2fc", ... }}>
              {procesandoTicket ? "Generando ticket..." : "Imprimir Ticket"}
            </button>
```

#### Por qué se cambió
El plan pedía añadir el botón encima de "Copiar Liquidación". Se usa color cian (`#25d2fc`) para diferenciarlo, se deshabilita mientras procesa y muestra feedback con "Generando ticket...".


## 2026-05-20 21:27 - Igualar horas de notas


**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Tamaño de hora detallada

#### Código anterior
```tsx
                                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{entry.time}</span>
```

#### Código nuevo
```tsx
                                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{entry.time}</span>
```

#### Por qué se cambió
La hora de las notas detalladas quedaba un punto más grande que la hora de las notas generales. Se igualó a `11` para probar todas las horas con el mismo tamaño.

### Cambio 2 - Prueba de hora detallada

#### Código anterior
```ts
No existía la expectativa de hora detallada en 11 en src/__tests__/liquidacion-semana.test.ts.
```

#### Código nuevo
```ts
    expect(liquidacionBlock).toContain('fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600');
```

#### Por qué se cambió
La prueba debía cubrir que la hora plana de las notas detalladas también usa tamaño `11`, igual que la hora compacta de las notas generales.

## 2026-05-20 21:17 - Resaltar fechas de notas semanales

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Separación de grupos por fecha

#### Código anterior
```tsx
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>
                      {fmtDate(turno.date)}
                    </div>
```

#### Código nuevo
```tsx
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }, index) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: index === 0 ? 2 : 12, borderTop: index === 0 ? "none" : "1px dashed rgba(255,255,255,0.10)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>
                      <span style={{ width: 12, height: 1, background: "rgba(255,255,255,0.24)", flexShrink: 0 }} />
                      {fmtDate(turno.date)}
                    </div>
```

#### Por qué se cambió
Las fechas quedaban demasiado integradas entre las notas y se pasaban por alto. La separación por grupo y la línea previa hacen que cada día se lea como cabecera sin volver a usar cajas.

### Cambio 2 - Indentación de notas

#### Código anterior
```tsx
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, minWidth: 0 }}>
```

```tsx
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
```

#### Código nuevo
```tsx
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, minWidth: 0, marginLeft: 14 }}>
```

```tsx
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0, marginLeft: 14 }}>
```

#### Por qué se cambió
Las filas de notas quedaban demasiado pegadas al borde del grupo. El desplazamiento leve ordena visualmente el contenido bajo cada fecha.

### Cambio 3 - Cobertura de fechas visibles

#### Código anterior
```ts
    expect(liquidacionBlock).toContain('fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
```

#### Código nuevo
```ts
    expect(liquidacionBlock).toContain('fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)"');
    expect(liquidacionBlock).toContain("turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }, index)");
    expect(liquidacionBlock).toContain('paddingTop: index === 0 ? 2 : 12');
    expect(liquidacionBlock).toContain('borderTop: index === 0 ? "none" : "1px dashed rgba(255,255,255,0.10)"');
    expect(liquidacionBlock).toContain('width: 12, height: 1, background: "rgba(255,255,255,0.24)"');
    expect(liquidacionBlock).toContain("marginLeft: 14");
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
```

#### Por qué se cambió
La prueba ahora fija que las fechas de notas semanales tengan separación entre grupos y un marcador visual propio dentro del ticket.


## 2026-05-20 21:13 - Pulir notas del ticket semanal

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Título y fecha de notas

#### Código anterior
```tsx
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Notas de la semana
                </div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.56)" }}>
                      {fmtDate(turno.date)}
                    </div>
```

#### Código nuevo
```tsx
                <div style={{ fontSize: 15, fontWeight: 800, color: "white", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.6px", textShadow: "0 0 10px rgba(255,255,255,0.18)" }}>
                  Notas de la semana
                </div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>
                      {fmtDate(turno.date)}
                    </div>
```

#### Por qué se cambió
El título debía conservar el texto `Notas de la semana`, pero ganar presencia de recibo: centrado, blanco, tamaño de sección y con neón sutil. La fecha queda en su posición, más legible y discreta.

### Cambio 2 - Notas sin cajas pesadas

#### Código anterior
```tsx
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
```

```tsx
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
```

#### Código nuevo
```tsx
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, minWidth: 0 }}>
```

```tsx
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
```

#### Por qué se cambió
Las notas debían mantener hora, categoría, colores, importe y ajuste de texto largo, pero dejar de verse como tarjetas dentro del ticket.

### Cambio 3 - Cobertura del acabado informativo

#### Código anterior
```ts
    expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
```

#### Código nuevo
```ts
    expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
    expect(liquidacionBlock).toContain('fontSize: 15, fontWeight: 800, color: "white", textAlign: "center"');
    expect(liquidacionBlock).toContain('textShadow: "0 0 10px rgba(255,255,255,0.18)"');
    expect(liquidacionBlock).toContain('fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
    expect(liquidacionBlock).not.toContain('background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9');
    expect(liquidacionBlock).not.toContain('background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12');
```

#### Por qué se cambió
La prueba ahora protege que el título conserve el texto y adopte el estilo centrado/neón, que la fecha sea blanca discreta y que las notas pierdan las cajas tipo card.


## 2026-05-20 20:55 - Restaurar notas y revertir exportación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Revertir microcalibración de exportación

#### Código anterior
```tsx
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.015\s*\)/gi, "#101015")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.025\s*\)/gi, "#15151a")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/gi, "rgba(255, 255, 255, 0.06)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/gi, "rgba(255, 255, 255, 0.09)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/gi, "rgba(255, 255, 255, 0.16)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.35\s*\)/gi, "rgba(255, 255, 255, 0.38)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.45\s*\)/gi, "rgba(255, 255, 255, 0.46)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.5\s*\)/gi, "rgba(255, 255, 255, 0.50)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.6\s*\)/gi, "rgba(255, 255, 255, 0.62)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.7\s*\)/gi, "rgba(255, 255, 255, 0.72)")
              .replace(/rgba\(\s*80\s*,\s*220\s*,\s*140\s*,\s*0\.25\s*\)/gi, "rgba(38, 182, 61, 0.22)");
```

#### Código nuevo
```tsx
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.015\s*\)/gi, "#111116")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.025\s*\)/gi, "#17171c")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/gi, "rgba(255, 255, 255, 0.07)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/gi, "rgba(255, 255, 255, 0.10)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/gi, "rgba(255, 255, 255, 0.18)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.35\s*\)/gi, "rgba(255, 255, 255, 0.42)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.45\s*\)/gi, "rgba(255, 255, 255, 0.50)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.5\s*\)/gi, "rgba(255, 255, 255, 0.54)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.6\s*\)/gi, "rgba(255, 255, 255, 0.66)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.7\s*\)/gi, "rgba(255, 255, 255, 0.74)")
              .replace(/rgba\(\s*80\s*,\s*220\s*,\s*140\s*,\s*0\.25\s*\)/gi, "rgba(38, 182, 61, 0.28)");
```

#### Por qué se cambió
El último intento de afinar la imagen copiada dejaba peor el resultado visual. Se restauran los valores anteriores de exportación, que eran el punto más equilibrado.

### Cambio 2 - Restaurar notas semanales

#### Código anterior
```tsx
    const taximetroLimpio = roundMoney(resumen.dineroBase);

    const copyTextFallback = () => {
```

#### Código nuevo
```tsx
    const taximetroLimpio = roundMoney(resumen.dineroBase);
    const turnosConNotas = getTurnosNotasSemana(turnosSemana);

    const formatLiquidacionNotasText = () => {
      if (turnosConNotas.length === 0) return "";

      return `\n\n📝 *NOTAS DE LA SEMANA:*\n${turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => {
        const lineasGenerales = notasGenerales.map((entry) => `  ${entry.time} Nota: ${entry.note.trim()}`);
        const lineasDetalladas = notasDetalladas.map((entry) => {
          const meta = getEntryTypeMeta(entry.type);
          return `  ${entry.time} ${meta.label}: ${entry.note.trim()} (${fmt(entry.amount)})`;
        });
        return `*${fmtDate(turno.date)}*\n${[...lineasGenerales, ...lineasDetalladas].join("\n")}`;
      }).join("\n\n")}`;
    };

    const copyTextFallback = () => {
```

#### Por qué se cambió
La reversión anterior quitó por error las notas del ticket. Se restauran porque la petición real era revertir el último ajuste de copiado de liquidación.

### Cambio 3 - Restaurar sección visual de notas

#### Código anterior
```tsx
          </div>

          {/* Botones de acción */}
```

#### Código nuevo
```tsx
            {turnosConNotas.length > 0 && (
              <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Notas de la semana
                </div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.56)" }}>
                      {fmtDate(turno.date)}
                    </div>
                    {notasGenerales.map((entry) => (
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                        <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{entry.time}</span>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{entry.time}</span>
                          <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
```

#### Por qué se cambió
Se devuelve la sección de notas que se había eliminado por una interpretación incorrecta de la reversión solicitada.

### Cambio 4 - Restaurar expectativas de prueba

#### Código anterior
```ts
    expect(copyBlock).toContain('"#101015"');
    expect(copyBlock).toContain('"#15151a"');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.16)');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.46)');
    expect(copyBlock).toContain('rgba(38, 182, 61, 0.22)');
```

#### Código nuevo
```ts
    expect(copyBlock).toContain('"#111116"');
    expect(copyBlock).toContain('"#17171c"');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.18)');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.50)');
    expect(copyBlock).toContain('rgba(38, 182, 61, 0.28)');
```

#### Por qué se cambió
La prueba vuelve a fijar los valores de exportación anteriores al último retoque, que son los que se quieren conservar.


## 2026-05-20 20:50 - Revertir notas del ticket semanal

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Quitar notas calculadas en liquidación

#### Código anterior
```tsx
    const taximetroLimpio = roundMoney(resumen.dineroBase);
    const turnosConNotas = getTurnosNotasSemana(turnosSemana);

    const formatLiquidacionNotasText = () => {
      if (turnosConNotas.length === 0) return "";

      return `\n\n📝 *NOTAS DE LA SEMANA:*\n${turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => {
        const lineasGenerales = notasGenerales.map((entry) => `  ${entry.time} Nota: ${entry.note.trim()}`);
        const lineasDetalladas = notasDetalladas.map((entry) => {
          const meta = getEntryTypeMeta(entry.type);
          return `  ${entry.time} ${meta.label}: ${entry.note.trim()} (${fmt(entry.amount)})`;
        });
        return `*${fmtDate(turno.date)}*\n${[...lineasGenerales, ...lineasDetalladas].join("\n")}`;
      }).join("\n\n")}`;
    };

    const copyTextFallback = () => {
```

#### Código nuevo
```tsx
    const taximetroLimpio = roundMoney(resumen.dineroBase);

    const copyTextFallback = () => {
```

#### Por qué se cambió
La sección de notas añadía peso visual al ticket y hacía que la liquidación se viera menos limpia y profesional que el estado anterior.

### Cambio 2 - Restaurar fallback sin notas semanales

#### Código anterior
```tsx
      const text = `📋 *LIQUIDACIÓN SEMANAL*\n📅 *Semana:* ${dates}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKMAcumulado)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefeAcumulado)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descDAcumulado)}\n  ⛽ Gasolina: -${fmt(descGAcumulado)}\n  🎟️ Agencias/Bonos: -${fmt(descAAcumulado)}\n  ➕ Extras: -${fmt(descEAcumulado)}\n💰 *Total Descuentos:* -${fmt(totalDescontarAcumulado)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNetoAcumulado)}* 👈\n\nℹ️ _Nulos acumulados: ${fmt(totalNulosAcumulado)}_${formatLiquidacionNotasText()}`;
```

#### Código nuevo
```tsx
      const text = `📋 *LIQUIDACIÓN SEMANAL*\n📅 *Semana:* ${dates}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKMAcumulado)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefeAcumulado)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descDAcumulado)}\n  ⛽ Gasolina: -${fmt(descGAcumulado)}\n  🎟️ Agencias/Bonos: -${fmt(descAAcumulado)}\n  ➕ Extras: -${fmt(descEAcumulado)}\n💰 *Total Descuentos:* -${fmt(totalDescontarAcumulado)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNetoAcumulado)}* 👈\n\nℹ️ _Nulos acumulados: ${fmt(totalNulosAcumulado)}_`;
```

#### Por qué se cambió
El texto de liquidación debe volver a copiar solo el resumen económico del ticket, sin añadir notas semanales.

### Cambio 3 - Eliminar sección visual de notas

#### Código anterior
```tsx
            {turnosConNotas.length > 0 && (
              <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Notas de la semana
                </div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.56)" }}>
                      {fmtDate(turno.date)}
                    </div>
                    {notasGenerales.map((entry) => (
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                        <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{entry.time}</span>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{entry.time}</span>
                          <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
```

#### Código nuevo
```tsx
          </div>

          {/* Botones de acción */}
```

#### Por qué se cambió
El ticket recupera su cierre visual justo después de `Total Nulos acumulados`, evitando que la liquidación crezca con una sección informativa que perjudicaba la composición.

### Cambio 4 - Prueba de regresión sin notas

#### Código anterior
```ts
  it("adds weekly notes to the liquidation ticket and text fallback", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain("const turnosConNotas = getTurnosNotasSemana(turnosSemana);");
    expect(liquidacionBlock).toContain("*NOTAS DE LA SEMANA:*");
    expect(liquidacionBlock).toContain("turnosConNotas.length > 0 &&");
    expect(liquidacionBlock).toContain("Notas de la semana");
    expect(liquidacionBlock).toContain("notasGenerales.map");
    expect(liquidacionBlock).toContain("notasDetalladas.map");
    expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
  });
```

#### Código nuevo
```ts
  it("keeps weekly notes out of the liquidation ticket", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).not.toContain("const turnosConNotas = getTurnosNotasSemana(turnosSemana);");
    expect(liquidacionBlock).not.toContain("*NOTAS DE LA SEMANA:*");
    expect(liquidacionBlock).not.toContain("turnosConNotas.length > 0 &&");
    expect(liquidacionBlock).not.toContain("Notas de la semana");
    expect(liquidacionBlock).not.toContain("notasGenerales.map");
    expect(liquidacionBlock).not.toContain("notasDetalladas.map");
  });
```

#### Por qué se cambió
La cobertura ahora protege el diseño decidido: las notas semanales deben quedarse fuera de la pantalla de liquidación para conservar el ticket limpio.


## 2026-05-20 20:45 - Añadir notas al ticket semanal

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Notas disponibles para liquidación

#### Código anterior
```tsx
    const taximetroLimpio = roundMoney(resumen.dineroBase);

    const copyTextFallback = () => {
```

#### Código nuevo
```tsx
    const taximetroLimpio = roundMoney(resumen.dineroBase);
    const turnosConNotas = getTurnosNotasSemana(turnosSemana);

    const formatLiquidacionNotasText = () => {
      if (turnosConNotas.length === 0) return "";

      return `\n\n📝 *NOTAS DE LA SEMANA:*\n${turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => {
        const lineasGenerales = notasGenerales.map((entry) => `  ${entry.time} Nota: ${entry.note.trim()}`);
        const lineasDetalladas = notasDetalladas.map((entry) => {
          const meta = getEntryTypeMeta(entry.type);
          return `  ${entry.time} ${meta.label}: ${entry.note.trim()} (${fmt(entry.amount)})`;
        });
        return `*${fmtDate(turno.date)}*\n${[...lineasGenerales, ...lineasDetalladas].join("\n")}`;
      }).join("\n\n")}`;
    };

    const copyTextFallback = () => {
```

#### Por qué se cambió
La liquidación semanal necesitaba reutilizar las notas guardadas en los turnos de esa semana y tener un formateador específico para añadirlas al fallback de texto solo cuando existan.

### Cambio 2 - Fallback de texto con notas

#### Código anterior
```tsx
      const text = `📋 *LIQUIDACIÓN SEMANAL*\n📅 *Semana:* ${dates}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKMAcumulado)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefeAcumulado)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descDAcumulado)}\n  ⛽ Gasolina: -${fmt(descGAcumulado)}\n  🎟️ Agencias/Bonos: -${fmt(descAAcumulado)}\n  ➕ Extras: -${fmt(descEAcumulado)}\n💰 *Total Descuentos:* -${fmt(totalDescontarAcumulado)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNetoAcumulado)}* 👈\n\nℹ️ _Nulos acumulados: ${fmt(totalNulosAcumulado)}_`;
```

#### Código nuevo
```tsx
      const text = `📋 *LIQUIDACIÓN SEMANAL*\n📅 *Semana:* ${dates}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKMAcumulado)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefeAcumulado)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descDAcumulado)}\n  ⛽ Gasolina: -${fmt(descGAcumulado)}\n  🎟️ Agencias/Bonos: -${fmt(descAAcumulado)}\n  ➕ Extras: -${fmt(descEAcumulado)}\n💰 *Total Descuentos:* -${fmt(totalDescontarAcumulado)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNetoAcumulado)}* 👈\n\nℹ️ _Nulos acumulados: ${fmt(totalNulosAcumulado)}_${formatLiquidacionNotasText()}`;
```

#### Por qué se cambió
El texto copiado cuando no se puede generar imagen debía incluir también las notas semanales, manteniendo intacto el resto de la liquidación.

### Cambio 3 - Sección de notas en el ticket

#### Código anterior
`No existía la sección de notas semanales en src/main.tsx.`

#### Código nuevo
```tsx
            {turnosConNotas.length > 0 && (
              <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Notas de la semana
                </div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={`ticket-notas-${turno.id}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.56)" }}>
                      {fmtDate(turno.date)}
                    </div>
                    {notasGenerales.map((entry) => (
                      <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                        <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{entry.time}</span>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{entry.time}</span>
                          <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
```

#### Por qué se cambió
El ticket de liquidación necesitaba mostrar las notas de la semana como una parte más del recibo, con separador dashed, densidad compacta, notas generales y notas detalladas alineadas sin desbordar.

### Cambio 4 - Cobertura de notas semanales

#### Código anterior
`No existía la prueba "adds weekly notes to the liquidation ticket and text fallback" en src/__tests__/liquidacion-semana.test.ts.`

#### Código nuevo
```ts
  it("adds weekly notes to the liquidation ticket and text fallback", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain("const turnosConNotas = getTurnosNotasSemana(turnosSemana);");
    expect(liquidacionBlock).toContain("*NOTAS DE LA SEMANA:*");
    expect(liquidacionBlock).toContain("turnosConNotas.length > 0 &&");
    expect(liquidacionBlock).toContain("Notas de la semana");
    expect(liquidacionBlock).toContain("notasGenerales.map");
    expect(liquidacionBlock).toContain("notasDetalladas.map");
    expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
  });
```

#### Por qué se cambió
La prueba fija que la liquidación calcula notas de la semana, pinta la sección condicional en el ticket, conserva estilos compactos para notas generales y detalladas, y añade las notas al fallback de texto.


## 2026-05-20 20:32 - Afinar contraste de exportación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Neutros menos marcados en imagen copiada

#### Código anterior
```tsx
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.015\s*\)/gi, "#111116")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.025\s*\)/gi, "#17171c")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/gi, "rgba(255, 255, 255, 0.07)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/gi, "rgba(255, 255, 255, 0.10)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/gi, "rgba(255, 255, 255, 0.18)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.35\s*\)/gi, "rgba(255, 255, 255, 0.42)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.45\s*\)/gi, "rgba(255, 255, 255, 0.50)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.5\s*\)/gi, "rgba(255, 255, 255, 0.54)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.6\s*\)/gi, "rgba(255, 255, 255, 0.66)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.7\s*\)/gi, "rgba(255, 255, 255, 0.74)")
              .replace(/rgba\(\s*80\s*,\s*220\s*,\s*140\s*,\s*0\.25\s*\)/gi, "rgba(38, 182, 61, 0.28)");
```

#### Código nuevo
```tsx
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.015\s*\)/gi, "#101015")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.025\s*\)/gi, "#15151a")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/gi, "rgba(255, 255, 255, 0.06)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/gi, "rgba(255, 255, 255, 0.09)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/gi, "rgba(255, 255, 255, 0.16)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.35\s*\)/gi, "rgba(255, 255, 255, 0.38)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.45\s*\)/gi, "rgba(255, 255, 255, 0.46)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.5\s*\)/gi, "rgba(255, 255, 255, 0.50)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.6\s*\)/gi, "rgba(255, 255, 255, 0.62)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.7\s*\)/gi, "rgba(255, 255, 255, 0.72)")
              .replace(/rgba\(\s*80\s*,\s*220\s*,\s*140\s*,\s*0\.25\s*\)/gi, "rgba(38, 182, 61, 0.22)");
```

#### Por qué se cambió
La exportación anterior quedaba algo más contrastada que la UI: grises, bordes y glow verde se veían demasiado marcados. Estos valores reducen el contraste solo en la imagen copiada.

### Cambio 2 - Expectativas de microcalibración

#### Código anterior
```ts
    expect(copyBlock).toContain('rgba(38, 182, 61, 0.28)');
```

#### Código nuevo
```ts
    expect(copyBlock).toContain('"#101015"');
    expect(copyBlock).toContain('"#15151a"');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.16)');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.46)');
    expect(copyBlock).toContain('rgba(38, 182, 61, 0.22)');
```

#### Por qué se cambió
La prueba debía fijar la nueva calibración de fondos, líneas, textos secundarios y glow para evitar volver a los neutros demasiado intensos.

## 2026-05-20 20:27 - Pulir exportación de liquidación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Captura con fuentes y mayor nitidez

#### Código anterior
```tsx
    const copyToClipboard = () => {
      const element = document.getElementById("ticket-digital");
      if (!element) {
        copyTextFallback();
        return;
      }

      html2canvas(element, {
        backgroundColor: "#121212",
        scale: 2,
        useCORS: true,
        logging: false,
```

#### Código nuevo
```tsx
    const copyToClipboard = async () => {
      const element = document.getElementById("ticket-digital");
      if (!element) {
        copyTextFallback();
        return;
      }

      try {
        await document.fonts?.ready;
      } catch {
      }

      html2canvas(element, {
        backgroundColor: "#0d0d14",
        scale: 3,
        useCORS: true,
        logging: false,
```

#### Por qué se cambió
La captura necesitaba esperar a que la fuente estuviera lista, usar el fondo real de la app y subir la escala para que la imagen copiada tenga texto e iconos más nítidos.

### Cambio 2 - Normalización export-only de tonos neutros

#### Código anterior
```tsx
          const elements = ticket.getElementsByTagName("*");
          const replaceOklch = (str: string) => {
            return str.replace(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/gi, (match, l, c, h) => {
              const lightness = parseFloat(l);
              const chroma = parseFloat(c);
              const hue = parseFloat(h);
              if (Math.abs(lightness - 0.85) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 85) < 5) return "#ffc200";
              if (Math.abs(lightness - 0.80) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 220) < 5) return "#25d2fc";
              if (Math.abs(lightness - 0.70) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 25) < 5) return "#fa6863";
              if (Math.abs(lightness - 0.68) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 145) < 5) return "#26b63d";
              if (Math.abs(lightness - 0.65) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 280) < 5) return "#7c79ff";
              if (Math.abs(lightness - 0.75) < 0.05 && Math.abs(chroma - 0.16) < 0.05 && Math.abs(hue - 70) < 5) return "#ed990e";
              if (Math.abs(lightness - 0.72) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 200) < 5) return "#00bec7";
              return match;
            });
          };

          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;

            const styleAttr = el.getAttribute("style");
            if (styleAttr) {
              el.setAttribute("style", replaceOklch(styleAttr));
            }
```

#### Código nuevo
```tsx
          const elements = [ticket, ...Array.from(ticket.getElementsByTagName("*"))] as HTMLElement[];
          const replaceOklch = (str: string) => {
            return str.replace(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/gi, (match, l, c, h) => {
              const lightness = parseFloat(l);
              const chroma = parseFloat(c);
              const hue = parseFloat(h);
              if (Math.abs(lightness - 0.85) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 85) < 5) return "#ffc200";
              if (Math.abs(lightness - 0.80) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 220) < 5) return "#25d2fc";
              if (Math.abs(lightness - 0.70) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 25) < 5) return "#fa6863";
              if (Math.abs(lightness - 0.68) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 145) < 5) return "#26b63d";
              if (Math.abs(lightness - 0.65) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 280) < 5) return "#7c79ff";
              if (Math.abs(lightness - 0.75) < 0.05 && Math.abs(chroma - 0.16) < 0.05 && Math.abs(hue - 70) < 5) return "#ed990e";
              if (Math.abs(lightness - 0.72) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 200) < 5) return "#00bec7";
              return match;
            });
          };
          const replaceExportNeutrals = (str: string) => {
            return str
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.015\s*\)/gi, "#111116")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.025\s*\)/gi, "#17171c")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/gi, "rgba(255, 255, 255, 0.07)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/gi, "rgba(255, 255, 255, 0.10)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/gi, "rgba(255, 255, 255, 0.18)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.35\s*\)/gi, "rgba(255, 255, 255, 0.42)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.45\s*\)/gi, "rgba(255, 255, 255, 0.50)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.5\s*\)/gi, "rgba(255, 255, 255, 0.54)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.6\s*\)/gi, "rgba(255, 255, 255, 0.66)")
              .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.7\s*\)/gi, "rgba(255, 255, 255, 0.74)")
              .replace(/rgba\(\s*80\s*,\s*220\s*,\s*140\s*,\s*0\.25\s*\)/gi, "rgba(38, 182, 61, 0.28)");
          };
          const normalizeExportColors = (str: string) => replaceExportNeutrals(replaceOklch(str));

          for (const el of elements) {
            const styleAttr = el.getAttribute("style");
            if (styleAttr) {
              el.setAttribute("style", normalizeExportColors(styleAttr));
            }
```

#### Por qué se cambió
La imagen copiada seguía perdiendo fidelidad en fondos, grises, bordes y glow; la normalización se aplica solo al DOM clonado para no cambiar la UI visible.

### Cambio 3 - Prueba de pulido de exportación

#### Código anterior
```ts
No existía la prueba "sharpens copied liquidation image without changing the visible UI styles" en src/__tests__/liquidacion-semana.test.ts.
```

#### Código nuevo
```ts
  it("sharpens copied liquidation image without changing the visible UI styles", () => {
    const copyBlock = source.match(
      /const copyToClipboard = async \(\) => \{[\s\S]*?html2canvas\(element, \{[\s\S]*?\}\)\.then/
    )?.[0] || "";

    expect(copyBlock).toContain("await document.fonts?.ready");
    expect(copyBlock).toContain('backgroundColor: "#0d0d14"');
    expect(copyBlock).toContain("scale: 3");
    expect(copyBlock).toContain("const normalizeExportColors = (str: string)");
    expect(copyBlock).toContain("replaceExportNeutrals");
    expect(copyBlock).toContain('rgba(38, 182, 61, 0.28)');

    expect(source).toContain('background: "rgba(255, 255, 255, 0.015)"');
    expect(source).toContain('textShadow: "0 0 12px rgba(80, 220, 140, 0.25)"');
  });
```

#### Por qué se cambió
La exportación necesitaba una prueba que fijara espera de fuentes, fondo real, escala alta, normalización export-only y conservación de los estilos visibles originales.

## 2026-05-20 20:19 - Ajustar colores de exportación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Paleta sRGB de la imagen copiada

#### Código anterior
```tsx
              if (Math.abs(lightness - 0.85) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 85) < 5) return "#f8c654";
              if (Math.abs(lightness - 0.80) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 220) < 5) return "#7e9ff9";
              if (Math.abs(lightness - 0.70) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 25) < 5) return "#c95a43";
              if (Math.abs(lightness - 0.68) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 145) < 5) return "#00b178";
              if (Math.abs(lightness - 0.65) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 280) < 5) return "#8d63f9";
              if (Math.abs(lightness - 0.75) < 0.05 && Math.abs(chroma - 0.16) < 0.05 && Math.abs(hue - 70) < 5) return "#d69c2d";
              if (Math.abs(lightness - 0.72) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 200) < 5) return "#79a9c4";
```

#### Código nuevo
```tsx
              if (Math.abs(lightness - 0.85) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 85) < 5) return "#ffc200";
              if (Math.abs(lightness - 0.80) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 220) < 5) return "#25d2fc";
              if (Math.abs(lightness - 0.70) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 25) < 5) return "#fa6863";
              if (Math.abs(lightness - 0.68) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 145) < 5) return "#26b63d";
              if (Math.abs(lightness - 0.65) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 280) < 5) return "#7c79ff";
              if (Math.abs(lightness - 0.75) < 0.05 && Math.abs(chroma - 0.16) < 0.05 && Math.abs(hue - 70) < 5) return "#ed990e";
              if (Math.abs(lightness - 0.72) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 200) < 5) return "#00bec7";
```

#### Por qué se cambió
Los colores anteriores eran aproximaciones apagadas para `html2canvas`; los nuevos hex son conversiones sRGB más fieles a los `oklch(...)` visibles sin tocar cómo se muestra la app.

### Cambio 2 - Prueba de paleta de exportación

#### Código anterior
```ts
No existía la prueba "uses faithful sRGB colors only for the copied liquidation image" en src/__tests__/liquidacion-semana.test.ts.
```

#### Código nuevo
```ts
  it("uses faithful sRGB colors only for the copied liquidation image", () => {
    expect(source).toContain('const G = "oklch(0.68 0.20 145)"');
    expect(source).toContain('oklch(0.70 0.18 25)');
    expect(source).toContain('oklch(0.72 0.14 200)');

    const exportColorBlock = source.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return match;/
    )?.[0] || "";

    expect(exportColorBlock).toContain('return "#ffc200"');
    expect(exportColorBlock).toContain('return "#25d2fc"');
    expect(exportColorBlock).toContain('return "#fa6863"');
    expect(exportColorBlock).toContain('return "#26b63d"');
    expect(exportColorBlock).toContain('return "#7c79ff"');
    expect(exportColorBlock).toContain('return "#ed990e"');
    expect(exportColorBlock).toContain('return "#00bec7"');

    expect(exportColorBlock).not.toContain('return "#f8c654"');
    expect(exportColorBlock).not.toContain('return "#7e9ff9"');
    expect(exportColorBlock).not.toContain('return "#c95a43"');
    expect(exportColorBlock).not.toContain('return "#00b178"');
    expect(exportColorBlock).not.toContain('return "#8d63f9"');
    expect(exportColorBlock).not.toContain('return "#d69c2d"');
    expect(exportColorBlock).not.toContain('return "#79a9c4"');
  });
```

#### Por qué se cambió
La exportación necesitaba cobertura que garantice que la imagen copiada usa la paleta sRGB fiel y que los colores visibles de la UI permanecen como `oklch(...)`.

## 2026-05-20 19:52 - Corregir scroll de liquidación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `CAMBIOS_AGENT.md`

### Cambio 1 - Contenedor scrolleable de liquidación

#### Código anterior
```tsx
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
```

#### Código nuevo
```tsx
        <div style={{ flex: 1, padding: "16px 20px 32px", minHeight: 0, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
```

#### Por qué se cambió
El contenedor scrolleable necesitaba `minHeight: 0` para que el scroll vertical funcione correctamente dentro del `Shell` con alto fijo y no fuerce compresión de sus hijos.

### Cambio 2 - Altura natural del ticket digital

#### Código anterior
```tsx
            gap: 16,
            position: "relative",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24)",
            overflow: "hidden"
```

#### Código nuevo
```tsx
            gap: 16,
            position: "relative",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24)",
            flexShrink: 0,
            overflow: "hidden"
```

#### Por qué se cambió
El ticket digital se comprimía cuando faltaba alto en pantallas de portátil; `flexShrink: 0` mantiene su altura natural y deja que el contenedor padre haga scroll.

### Cambio 3 - Altura natural de botones de acción

#### Código anterior
```tsx
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
```

#### Código nuevo
```tsx
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
```

#### Por qué se cambió
Los botones de acción también debían conservar su altura natural para que `Copiar Liquidación` y `Volver` sigan accesibles mediante scroll en viewports bajos.

### Cambio 4 - Cobertura del contrato responsive

#### Código anterior
```ts
No existía la prueba "keeps the liquidation ticket and actions scrollable on short desktop viewports" en src/__tests__/liquidacion-semana.test.ts.
```

#### Código nuevo
```ts
  it("keeps the liquidation ticket and actions scrollable on short desktop viewports", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toMatch(
      /padding: "16px 20px 32px"[\s\S]*?minHeight: 0[\s\S]*?overflowY: "auto"/
    );
    expect(liquidacionBlock).toMatch(
      /id="ticket-digital"[\s\S]*?flexShrink: 0[\s\S]*?overflow: "hidden"/
    );
    expect(liquidacionBlock).toMatch(
      /<div style=\{\{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 \}\}>/
    );
  });
```

#### Por qué se cambió
La pantalla necesitaba una prueba que fije el contrato de layout para viewports bajos: contenedor con scroll, ticket sin compresión y botones sin compresión.

## 2026-05-19 23:25 - Ajustar diseño de pantalla cuentasSemana

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Tarjetas de rendimiento y desglose del ticket cuentasSemana

#### Código anterior
```tsx
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => setScreen("detalleSemana")}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>
                Cuentas
              </div>
            </div>
          </div>

          {/* Ticket Digital */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 24,
            padding: "24px 20px",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            {/* Fechas de la semana */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Resumen Semanal
              </span>
              <div style={{ fontSize: "clamp(14px, 4vw, 17px)", fontWeight: 800, color: "white", marginTop: 4 }}>
                {formatWeekRangeFull(weekId)}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />

            {/* Kilometraje */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                <IconRoad s={18} c="rgba(255,255,255,0.5)" /> Kil?metros Totales
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmtKmNumber(totales.km || 0)} KM
              </span>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />

            {/* Datos Contables */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                Total Tax?metro
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmt(resumenContableSemana.dineroBase)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                Comisi?n Jefe
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmt(comisionBrutaJefeTotal)}
              </span>
            </div>

            {/* Descuentos si hay alguno */}
            {(descDTotal > 0 || descFTotal > 0 || descATotal > 0 || descETotal > 0) && (
              <>
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Descuentos
                </div>
                {descDTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Dat?fonos</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descDTotal)}</span>
                  </div>
                )}
                {descFTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Gasolina</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descFTotal)}</span>
                  </div>
                )}
                {descATotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Agencias / Bonos</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descATotal)}</span>
                  </div>
                )}
                {descETotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Extras</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descETotal)}</span>
                  </div>
                )}
              </>
            )}

            {/* Nulos Informativos */}
            {totales.totalN > 0 && (
              <>
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Nulos (Informativo)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{fmt(totales.totalN)}</span>
                </div>
              </>
            )}

            {/* Total Neto a Dar */}
            <div style={{ borderTop: "2px double rgba(255,255,255,0.2)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Total a Entregar al Jefe
              </span>
              <span style={{ fontSize: 32, fontWeight: 900, color: "oklch(0.68 0.20 145)", letterSpacing: "-0.5px" }}>
                {fmt(resumenContableSemana.totalADar)}
              </span>
            </div>
          </div>

          {/* Bot?n de Copiar */}
          <button
            onClick={() => {
              let txt = `?? *CUENTAS DE LA SEMANA* ??
?? Semana: ${formatWeekRangeFull(weekId)}

?? *Rendimiento:*
? Kil?metros: ${fmtKmNumber(totales.km || 0)} KM
? Total Tax?metro: ${fmt(resumenContableSemana.dineroBase)}

?? *C?lculo:*
? Comisi?n Jefe: ${fmt(comisionBrutaJefeTotal)}
`;

              if (descDTotal > 0 || descFTotal > 0 || descATotal > 0 || descETotal > 0) {
                txt += `
?? *Descuentos:*
`;
                if (descDTotal > 0) txt += `? Dat?fonos: - ${fmt(descDTotal)}
`;
                if (descFTotal > 0) txt += `? Gasolina: - ${fmt(descFTotal)}
`;
                if (descATotal > 0) txt += `? Agencias/Bonos: - ${fmt(descATotal)}
`;
                if (descETotal > 0) txt += `? Extras: - ${fmt(descETotal)}
`;
              }

              if (totales.totalN > 0) {
                txt += `
? *Nulos (Informativo):* ${fmt(totales.totalN)}
`;
              }

              txt += `
?? *Total a Entregar:* ${fmt(resumenContableSemana.totalADar)}`;

              navigator.clipboard.writeText(txt);
              alert("Cuentas copiadas al portapapeles. ?Ya puedes pegarlas en WhatsApp!");
            }}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              background: "rgba(80, 220, 140, 0.15)",
              border: "1px solid rgba(80, 220, 140, 0.3)",
              color: "#50dc8c",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
              transition: "all 0.2s"
            }}
          >
            <IconCopy s={20} c="#50dc8c" />
            Copiar cuentas para WhatsApp
          </button>

          {/* Bot?n Volver */}
          <button
            onClick={() => setScreen("detalleSemana")}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: "rgba(255, 255, 255, 0.08)",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 4,
              transition: "all 0.2s"
            }}
          >
            Volver al detalle
          </button>
        </div>
      </Shell>
    );
```

#### Código nuevo
```tsx
    const dineroV = (totales.dinero || 0) - (totales.totalN || 0);

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => setScreen("detalleSemana")}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>
                Cuentas
              </div>
            </div>
          </div>

          {/* Contenedor Superior Agrupado (Dos tarjetas de estilo visual original) */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Columna Izquierda: Taxímetro Neto */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)', letterSpacing: '-0.5px' }}>
                {fmt(dineroV)}
              </div>
            </div>
            {/* Columna Derecha: Kilómetros */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px 8px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>
                {fmtKmNumber(totales.km || 0)} <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>KM</span>
              </div>
            </div>
          </div>

          {/* Ticket Digital */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 24,
            padding: "24px 20px",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            {/* Rango de fechas de la semana */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Resumen Semanal
              </span>
              <div style={{ fontSize: "clamp(14px, 4vw, 17px)", fontWeight: 800, color: "white", marginTop: 4 }}>
                {formatWeekRangeFull(weekId)}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />

            {/* Datos Contables */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                Total Taxímetro (Bruto)
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmt(totales.dinero || 0)}
              </span>
            </div>

            {totales.totalN > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                  Nulos
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>
                  - {fmt(totales.totalN)}
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                Comisión Jefe
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmt(comisionBrutaJefeTotal)}
              </span>
            </div>

            {/* A Descontar si hay alguno */}
            {(descDTotal > 0 || descFTotal > 0 || descATotal > 0 || descETotal > 0) && (
              <>
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  A Descontar
                </div>
                {descDTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Datáfonos</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descDTotal)}</span>
                  </div>
                )}
                {descFTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Gasolina</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descFTotal)}</span>
                  </div>
                )}
                {descATotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Agencias / Bonos</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descATotal)}</span>
                  </div>
                )}
                {descETotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Extras</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descETotal)}</span>
                  </div>
                )}
              </>
            )}

            {/* Total Neto a Dar */}
            <div style={{ borderTop: "2px double rgba(255,255,255,0.2)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Total a Entregar al Jefe
              </span>
              <span style={{ fontSize: 32, fontWeight: 900, color: "oklch(0.68 0.20 145)", letterSpacing: "-0.5px" }}>
                {fmt(resumenContableSemana.totalADar)}
              </span>
            </div>
          </div>

          {/* Botón de Copiar */}
          <button
            onClick={() => {
              let txt = `🚕 *CUENTAS DE LA SEMANA* 🚕
📅 Semana: ${formatWeekRangeFull(weekId)}

📈 *Rendimiento:*
• Kilómetros: ${fmtKmNumber(totales.km || 0)} KM
• Total Taxímetro (Bruto): ${fmt(totales.dinero || 0)}
`;

              if (totales.totalN > 0) {
                txt += `• Nulos: - ${fmt(totales.totalN)}
`;
              }

              txt += `
💰 *Cálculo:*
• Comisión Jefe: ${fmt(comisionBrutaJefeTotal)}
`;

              if (descDTotal > 0 || descFTotal > 0 || descATotal > 0 || descETotal > 0) {
                txt += `
📉 *A Descontar:*
`;
                if (descDTotal > 0) txt += `• Datáfonos: - ${fmt(descDTotal)}
`;
                if (descFTotal > 0) txt += `• Gasolina: - ${fmt(descFTotal)}
`;
                if (descATotal > 0) txt += `• Agencias/Bonos: - ${fmt(descATotal)}
`;
                if (descETotal > 0) txt += `• Extras: - ${fmt(descETotal)}
`;
              }

              txt += `
💵 *Total a Entregar:* ${fmt(resumenContableSemana.totalADar)}`;

              navigator.clipboard.writeText(txt);
              alert("Cuentas copiadas al portapapeles. ¡Ya puedes pegarlas en WhatsApp!");
            }}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              background: "rgba(80, 220, 140, 0.15)",
              border: "1px solid rgba(80, 220, 140, 0.3)",
              color: "#50dc8c",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
              transition: "all 0.2s"
            }}
          >
            <IconCopy s={20} c="#50dc8c" />
            Copiar cuentas para WhatsApp
          </button>

          {/* Botón Volver */}
          <button
            onClick={() => setScreen("detalleSemana")}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: "rgba(255, 255, 255, 0.08)",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 4,
              transition: "all 0.2s"
            }}
          >
            Volver al detalle
          </button>
        </div>
      </Shell>
    );
```

#### Por qué se cambió
Se alinea la visualización al estilo de la app original agregando tarjetas de rendimiento para Taxímetro Neto y Kilómetros en la cabecera. Se renombra la sección de 'Descuentos' a 'A Descontar', y se clarifican las cuentas en el ticket distinguiendo entre Taxímetro (Bruto), Nulos (restados explícitamente) y Comisión Jefe, evitando números negativos inesperados debido a datos incoherentes del usuario.
\n\n## 2026-05-19 22:50 - Añadir pantalla Cuentas Semanal

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Icono de copiar

#### Código anterior
```tsx
const IconDel = () => (
```

#### Código nuevo
```tsx
const IconCopy = ({ s = 20, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path
      d="M8 4V16C8 17.1046 8.89543 18 10 18H20C21.1046 18 22 17.1046 22 16V4C22 2.89543 21.1046 2 20 2H10C8.89543 2 8 2.89543 8 4Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 18V20C16 21.1046 15.1046 22 14 22H4C2.89543 22 2 21.1046 2 20V8C2 6.89543 2.89543 6 4 6H6"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDel = () => (
```

#### Por qué se cambió
Se añade un nuevo icono SVG reutilizable para que el usuario pueda pulsar el botón de copiar y enviar las cuentas por WhatsApp de forma profesional.

### Cambio 2 - Título y botón en cabecera

#### Código anterior
```tsx
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("contabilidad"); setSelectedWeekId(null); }}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
                Detalle de Semana
              </div>
            </div>
          </div>
```

#### Código nuevo
```tsx
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("contabilidad"); setSelectedWeekId(null); }}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "clamp(15px, 4vw, 20px)", fontWeight: 800, color: "white" }}>
                Detalle de Semana
              </div>
            </div>
            <button onClick={() => setScreen('cuentasSemana')} style={{ background: 'rgba(80, 220, 140, 0.15)', border: '1px solid rgba(80, 220, 140, 0.3)', borderRadius: 12, padding: '6px 12px', color: '#50dc8c', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}><IconGive s={16} c="#50dc8c" />Cuentas</button>
          </div>
```

#### Por qué se cambió
Se reemplaza el tamaño de fuente estático de la cabecera por clamp responsivo para evitar desbordamientos y se inserta el botón "Cuentas" para acceder a la nueva pantalla de cuentas de la semana.

### Cambio 3 - Pantalla Cuentas Semanal

#### Código anterior
```tsx
`No existía el bloque de la pantalla cuentasSemana en src/main.tsx.`
```

#### Código nuevo
```tsx
  if (screen === "cuentasSemana" && selectedWeekId) {
    const weekId = selectedWeekId;
    const grupos = groupTurnosByWeek(history, settings.diaLibre);
    const turnosSemana = grupos.get(weekId) || [];
    const totales = calcularTotalesTurnos(turnosSemana);
    const resumenContableSemana = calcularResumenContableTurnos(turnosSemana, settings);

    let comisionBrutaJefeTotal = 0;
    let descDTotal = 0;
    let descATotal = 0;
    let descETotal = 0;
    let descFTotal = 0;
    for (const t of turnosSemana) {
      const c = calcularTurnoContable(t, settings);
      const dineroBaseTurno = (t.dinero || 0) - (t.totalN || 0);
      comisionBrutaJefeTotal += dineroBaseTurno * (c.config.porcentajeJefe / 100);
      descDTotal += c.descD;
      descATotal += c.descA;
      descETotal += c.descE;
      descFTotal += c.descF;
    }

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => setScreen("detalleSemana")}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>
                Cuentas
              </div>
            </div>
          </div>

          {/* Ticket Digital */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 24,
            padding: "24px 20px",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}>
            {/* Fechas de la semana */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Resumen Semanal
              </span>
              <div style={{ fontSize: "clamp(14px, 4vw, 17px)", fontWeight: 800, color: "white", marginTop: 4 }}>
                {formatWeekRangeFull(weekId)}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />

            {/* Kilometraje */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                <IconRoad s={18} c="rgba(255,255,255,0.5)" /> Kilómetros Totales
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmtKmNumber(totales.km || 0)} KM
              </span>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />

            {/* Datos Contables */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                Total Taxímetro
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmt(resumenContableSemana.dineroBase)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                Comisión Jefe
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {fmt(comisionBrutaJefeTotal)}
              </span>
            </div>

            {/* Descuentos si hay alguno */}
            {(descDTotal > 0 || descFTotal > 0 || descATotal > 0 || descETotal > 0) && (
              <>
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Descuentos
                </div>
                {descDTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Datáfonos</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descDTotal)}</span>
                  </div>
                )}
                {descFTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Gasolina</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descFTotal)}</span>
                  </div>
                )}
                {descATotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Agencias / Bonos</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descATotal)}</span>
                  </div>
                )}
                {descETotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Extras</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "oklch(0.70 0.18 25)" }}>- {fmt(descETotal)}</span>
                  </div>
                )}
              </>
            )}

            {/* Nulos Informativos */}
            {totales.totalN > 0 && (
              <>
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Nulos (Informativo)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{fmt(totales.totalN)}</span>
                </div>
              </>
            )}

            {/* Total Neto a Dar */}
            <div style={{ borderTop: "2px double rgba(255,255,255,0.2)", margin: "4px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>
                Total a Entregar al Jefe
              </span>
              <span style={{ fontSize: 32, fontWeight: 900, color: "oklch(0.68 0.20 145)", letterSpacing: "-0.5px" }}>
                {fmt(resumenContableSemana.totalADar)}
              </span>
            </div>
          </div>

          {/* Botón de Copiar */}
          <button
            onClick={() => {
              let txt = `🚕 *CUENTAS DE LA SEMANA* 🚕\n📅 Semana: ${formatWeekRangeFull(weekId)}\n\n📈 *Rendimiento:*\n• Kilómetros: ${fmtKmNumber(totales.km || 0)} KM\n• Total Taxímetro: ${fmt(resumenContableSemana.dineroBase)}\n\n💰 *Cálculo:*\n• Comisión Jefe: ${fmt(comisionBrutaJefeTotal)}\n`;

              if (descDTotal > 0 || descFTotal > 0 || descATotal > 0 || descETotal > 0) {
                txt += `\n📉 *Descuentos:*\n`;
                if (descDTotal > 0) txt += `• Datáfonos: - ${fmt(descDTotal)}\n`;
                if (descFTotal > 0) txt += `• Gasolina: - ${fmt(descFTotal)}\n`;
                if (descATotal > 0) txt += `• Agencias/Bonos: - ${fmt(descATotal)}\n`;
                if (descETotal > 0) txt += `• Extras: - ${fmt(descETotal)}\n`;
              }

              if (totales.totalN > 0) {
                txt += `\n❌ *Nulos (Informativo):* ${fmt(totales.totalN)}\n`;
              }

              txt += `\n💵 *Total a Entregar:* ${fmt(resumenContableSemana.totalADar)}`;

              navigator.clipboard.writeText(txt);
              alert("Cuentas copiadas al portapapeles. ¡Ya puedes pegarlas en WhatsApp!");
            }}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: "rgba(80, 220, 140, 0.15)",
              border: "1px solid rgba(80, 220, 140, 0.3)",
              color: "#50dc8c",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
              transition: "all 0.2s"
            }}
          >
            <IconCopy s={20} c="#50dc8c" />
            Copiar cuentas para WhatsApp
          </button>

          {/* Botón Volver */}
          <button
            onClick={() => setScreen("detalleSemana")}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: "rgba(255, 255, 255, 0.08)",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 4,
              transition: "all 0.2s"
            }}
          >
            Volver al detalle
          </button>
        </div>
      </Shell>
    );
  }
```

#### Por qué se cambió
Se añade la nueva vista "Cuentas" para la semana. Esta calcula la kilometrada, la base neta del taxímetro, la comisión bruta acumulada del jefe según el porcentaje configurado de cada turno en la semana, los descuentos reales desglosados y el neto final de la liquidación destacando la cifra final.

## 2026-05-19 02:04 - Rotar chincheta sin deformar

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Rotación completa de la chincheta

#### Código anterior
```tsx
    <path
      d="M9.3 5.1l6.9 1.9c0.7 0.2 1 0.8 0.8 1.5l-0.3 1c-0.1 0.5-0.5 0.8-1 0.9l-2 0.6-0.8 2.9 1.9 3.3-0.3 1.1-9.4-2.6 0.3-1.1 3.2-1.9 0.8-2.9-1.5-1.6c-0.3-0.4-0.4-0.8-0.3-1.3l0.3-1c0.2-0.7 0.8-1 1.5-0.8Z"
      fill={c}
      fillOpacity="0.16"
      stroke={c}
      strokeWidth="1.75"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    <path
      d="M8.6 17.1 5.2 21"
      stroke={c}
      strokeWidth="1.75"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
```

#### Código nuevo
```tsx
    <g transform="rotate(32 12 12)">
      <path
        d="M8.2 4.8h7.6c0.7 0 1.2 0.5 1.2 1.2v1.1c0 0.5-0.3 0.9-0.7 1.1l-1.8 1.1v3.1l2.7 2.7v1.2H6.8v-1.2l2.7-2.7V9.3L7.7 8.2C7.3 8 7 7.6 7 7.1V6c0-0.7 0.5-1.2 1.2-1.2Z"
        fill={c}
        fillOpacity="0.16"
        stroke={c}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 1px ${c})` }}
      />
      <path
        d="M12 16.3V21"
        stroke={c}
        strokeWidth="1.75"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 1px ${c})` }}
      />
    </g>
```

#### Por qué se cambió
La chincheta inclinada anterior apuntaba abajo-izquierda, pero se había deformado al dibujarla directamente inclinada. Se recupera la forma fiel y se rota el grupo completo para orientar la punta sin deformar la silueta.

### Cambio 2 - Test contra deformación

#### Código anterior
```ts
    expect(iconPinBlock).toMatch(/d="M9\.3 5\.1l6\.9 1\.9c0\.7 0\.2 1 0\.8 0\.8 1\.5l-0\.3 1c-0\.1 0\.5-0\.5 0\.8-1 0\.9l-2 0\.6-0\.8 2\.9 1\.9 3\.3-0\.3 1\.1-9\.4-2\.6 0\.3-1\.1 3\.2-1\.9 0\.8-2\.9-1\.5-1\.6c-0\.3-0\.4-0\.4-0\.8-0\.3-1\.3l0\.3-1c0\.2-0\.7 0\.8-1 1\.5-0\.8Z"/);
    expect(iconPinBlock).toMatch(/d="M8\.6 17\.1 5\.2 21"/);
```

#### Código nuevo
```ts
    expect(iconPinBlock).toMatch(/<g transform="rotate\(32 12 12\)">/);
    expect(iconPinBlock).toMatch(/d="M8\.2 4\.8h7\.6c0\.7 0 1\.2 0\.5 1\.2 1\.2v1\.1c0 0\.5-0\.3 0\.9-0\.7 1\.1l-1\.8 1\.1v3\.1l2\.7 2\.7v1\.2H6\.8v-1\.2l2\.7-2\.7V9\.3L7\.7 8\.2C7\.3 8 7 7\.6 7 7\.1V6c0-0\.7 0\.5-1\.2 1\.2-1\.2Z"/);
    expect(iconPinBlock).toMatch(/d="M12 16\.3V21"/);
    expect(iconPinBlock).not.toMatch(/d="M9\.3 5\.1l6\.9 1\.9/);
```

#### Por qué se cambió
El test ahora exige una chincheta fiel rotada como grupo completo y bloquea la silueta inclinada deformada.

## 2026-05-19 01:59 - Inclinar punta de chincheta

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Punta hacia abajo izquierda

#### Código anterior
```tsx
    <path
      d="M8.2 4.8h7.6c0.7 0 1.2 0.5 1.2 1.2v1.1c0 0.5-0.3 0.9-0.7 1.1l-1.8 1.1v3.1l2.7 2.7v1.2H6.8v-1.2l2.7-2.7V9.3L7.7 8.2C7.3 8 7 7.6 7 7.1V6c0-0.7 0.5-1.2 1.2-1.2Z"
      fill={c}
      fillOpacity="0.16"
      stroke={c}
      strokeWidth="1.75"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    <path
      d="M12 16.3V21"
      stroke={c}
      strokeWidth="1.75"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
```

#### Código nuevo
```tsx
    <path
      d="M9.3 5.1l6.9 1.9c0.7 0.2 1 0.8 0.8 1.5l-0.3 1c-0.1 0.5-0.5 0.8-1 0.9l-2 0.6-0.8 2.9 1.9 3.3-0.3 1.1-9.4-2.6 0.3-1.1 3.2-1.9 0.8-2.9-1.5-1.6c-0.3-0.4-0.4-0.8-0.3-1.3l0.3-1c0.2-0.7 0.8-1 1.5-0.8Z"
      fill={c}
      fillOpacity="0.16"
      stroke={c}
      strokeWidth="1.75"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    <path
      d="M8.6 17.1 5.2 21"
      stroke={c}
      strokeWidth="1.75"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
```

#### Por qué se cambió
La chincheta ya tenía una forma más fiel, pero la punta seguía apuntando recta hacia abajo. Se inclina el cuerpo y la punta para que apunte hacia la parte inferior izquierda.

### Cambio 2 - Test de inclinación

#### Código anterior
```ts
    expect(iconPinBlock).toMatch(/d="M8\.2 4\.8h7\.6c0\.7 0 1\.2 0\.5 1\.2 1\.2v1\.1c0 0\.5-0\.3 0\.9-0\.7 1\.1l-1\.8 1\.1v3\.1l2\.7 2\.7v1\.2H6\.8v-1\.2l2\.7-2\.7V9\.3L7\.7 8\.2C7\.3 8 7 7\.6 7 7\.1V6c0-0\.7 0\.5-1\.2 1\.2-1\.2Z"/);
    expect(iconPinBlock).toMatch(/d="M12 16\.3V21"/);
```

#### Código nuevo
```ts
    expect(iconPinBlock).toMatch(/d="M9\.3 5\.1l6\.9 1\.9c0\.7 0\.2 1 0\.8 0\.8 1\.5l-0\.3 1c-0\.1 0\.5-0\.5 0\.8-1 0\.9l-2 0\.6-0\.8 2\.9 1\.9 3\.3-0\.3 1\.1-9\.4-2\.6 0\.3-1\.1 3\.2-1\.9 0\.8-2\.9-1\.5-1\.6c-0\.3-0\.4-0\.4-0\.8-0\.3-1\.3l0\.3-1c0\.2-0\.7 0\.8-1 1\.5-0\.8Z"/);
    expect(iconPinBlock).toMatch(/d="M8\.6 17\.1 5\.2 21"/);
```

#### Por qué se cambió
El test ahora protege que la chincheta conserve la punta orientada hacia abajo-izquierda.

## 2026-05-19 01:48 - Redibujar chincheta fiel

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Silueta fiel de chincheta

#### Código anterior
```tsx
    <path
      d="M15.6 4.6l3.8 3.8-4.7 4.7 1.2 1.2-1.5 1.5-6.2-6.2 1.5-1.5 1.2 1.2 4.7-4.7Z"
      stroke={c}
      strokeWidth="1.75"
      strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    <path
      d="M9.2 14.8 5 19"
      stroke={c}
      strokeWidth="1.75"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
```

#### Código nuevo
```tsx
    <path
      d="M8.2 4.8h7.6c0.7 0 1.2 0.5 1.2 1.2v1.1c0 0.5-0.3 0.9-0.7 1.1l-1.8 1.1v3.1l2.7 2.7v1.2H6.8v-1.2l2.7-2.7V9.3L7.7 8.2C7.3 8 7 7.6 7 7.1V6c0-0.7 0.5-1.2 1.2-1.2Z"
      fill={c}
      fillOpacity="0.16"
      stroke={c}
      strokeWidth="1.75"
      strokeLinejoin="round"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    <path
      d="M12 16.3V21"
      stroke={c}
      strokeWidth="1.75"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
```

#### Por qué se cambió
La versión lineal anterior era limpia pero no representaba fielmente una chincheta. Se redibuja con cabeza superior, cuerpo central y punta vertical, manteniendo rojo suave y brillo discreto.

### Cambio 2 - Test de forma fiel

#### Código anterior
```ts
    expect(iconPinBlock).toMatch(/d="M15\.6 4\.6l3\.8 3\.8-4\.7 4\.7 1\.2 1\.2-1\.5 1\.5-6\.2-6\.2 1\.5-1\.5 1\.2 1\.2 4\.7-4\.7Z"/);
    expect(iconPinBlock).toMatch(/d="M9\.2 14\.8 5 19"/);
```

#### Código nuevo
```ts
    expect(iconPinBlock).toMatch(/d="M8\.2 4\.8h7\.6c0\.7 0 1\.2 0\.5 1\.2 1\.2v1\.1c0 0\.5-0\.3 0\.9-0\.7 1\.1l-1\.8 1\.1v3\.1l2\.7 2\.7v1\.2H6\.8v-1\.2l2\.7-2\.7V9\.3L7\.7 8\.2C7\.3 8 7 7\.6 7 7\.1V6c0-0\.7 0\.5-1\.2 1\.2-1\.2Z"/);
    expect(iconPinBlock).toMatch(/d="M12 16\.3V21"/);
    expect(iconPinBlock).toMatch(/fill=\{c\}/);
```

#### Por qué se cambió
El test ahora protege que el icono conserve una silueta reconocible de chincheta, no solo una forma diagonal genérica.

## 2026-05-19 01:40 - Refinar icono de chincheta

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Forma de la chincheta

#### Código anterior
```tsx
const IconPinNeon = ({ s = 24, c = F }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}
  >
    <g transform="rotate(45 12 12)">
      <path
        d="M12 17V22"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 4px ${c})` }}
      />
      <path
        d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V7a2 2 0 0 1 2-2h1a1 1 0 0 0 0-2H6a1 1 0 0 0 0 2h1a2 2 0 0 1 2 2Z"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 4px ${c})` }}
      />
    </g>
  </svg>
);
```

#### Código nuevo
```tsx
const IconPinNeon = ({ s = 24, c = "oklch(0.72 0.14 28)" }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}
  >
    <path
      d="M15.6 4.6l3.8 3.8-4.7 4.7 1.2 1.2-1.5 1.5-6.2-6.2 1.5-1.5 1.2 1.2 4.7-4.7Z"
      stroke={c}
      strokeWidth="1.75"
      strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    <path
      d="M9.2 14.8 5 19"
      stroke={c}
      strokeWidth="1.75"
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
  </svg>
);
```

#### Por qué se cambió
La chincheta anterior se veía pesada por la rotación del grupo, la silueta ancha y el brillo de `4px`. Se cambia a una chincheta lineal roja con brillo suave, más cercana al estilo del icono de nota.

### Cambio 2 - Uso del color propio del icono

#### Código anterior
```tsx
                  <IconPinNeon s={18} c={F} /> Notas detalladas
```

#### Código nuevo
```tsx
                  <IconPinNeon s={18} /> Notas detalladas
```

#### Por qué se cambió
Pasar `c={F}` forzaba el rojo más intenso de gasolina. Al usar el color por defecto de `IconPinNeon`, la chincheta conserva tono rojo pero con una intensidad más controlada.

### Cambio 3 - Test de chincheta refinada

#### Código anterior
```ts
No existía el test `uses a restrained line pin icon for detailed notes` en `src/__tests__/detailed-notes-layout.test.ts`.
```

#### Código nuevo
```ts
  it("uses a restrained line pin icon for detailed notes", () => {
    const iconPinBlock = source.match(/const IconPinNeon = \([\s\S]*?\n\);/)?.[0];

    expect(iconPinBlock).toBeDefined();
    expect(iconPinBlock).toMatch(/c = "oklch\(0\.72 0\.14 28\)"/);
    expect(iconPinBlock).toMatch(/drop-shadow\(0 0 1px \$\{c\}\)/);
    expect(iconPinBlock).toMatch(/d="M15\.6 4\.6l3\.8 3\.8-4\.7 4\.7 1\.2 1\.2-1\.5 1\.5-6\.2-6\.2 1\.5-1\.5 1\.2 1\.2 4\.7-4\.7Z"/);
    expect(iconPinBlock).toMatch(/d="M9\.2 14\.8 5 19"/);
    expect(iconPinBlock).not.toContain("rotate(45 12 12)");
    expect(iconPinBlock).not.toContain("drop-shadow(0 0 4px");
    expect(source).toMatch(/<IconPinNeon s=\{18\} \/> Notas detalladas/);
    expect(source).not.toContain("<IconPinNeon s={18} c={F} /> Notas detalladas");
  });
```

#### Por qué se cambió
El test protege que `Notas detalladas` use una chincheta lineal, sin rotación antigua, sin brillo exagerado y sin heredar el color `F`.

## 2026-05-19 01:25 - Reemplazar emoji de chincheta por IconPinNeon rojo

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Definición del icono de chincheta neón

#### Código anterior
```tsx
`No existía IconPinNeon en src/main.tsx.`
```

#### Código nuevo
```tsx
const IconPinNeon = ({ s = 24, c = F }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}
  >
    <g transform="rotate(45 12 12)">
      <path
        d="M12 17V22"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 4px ${c})` }}
      />
      <path
        d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.89A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.89A2 2 0 0 1 15 10.76V7a2 2 0 0 1 2-2h1a1 1 0 0 0 0-2H6a1 1 0 0 0 0 2h1a2 2 0 0 1 2 2Z"
        fill="none"
        stroke={c}
        strokeWidth="1.8"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 4px ${c})` }}
      />
    </g>
  </svg>
);
```

#### Por qué se cambió
Se crea un nuevo componente SVG interactivo con estilo neón, rotación de 45 grados y doble drop-shadow para sustituir el emoji de chincheta emoji clásico por una opción estética y premium.

### Cambio 2 - Reemplazo del emoji en pantalla Resumen del Turno

#### Código anterior
```tsx
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📌</span> Notas detalladas
                </div>
```

#### Código nuevo
```tsx
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconPinNeon s={18} c={F} /> Notas detalladas
                </div>
```

#### Por qué se cambió
Sustituye la cabecera con el emoji de chincheta clásico por el nuevo componente neón `IconPinNeon` de color rojo en la cabecera de la sección de notas detalladas del resumen de turno.

### Cambio 3 - Reemplazo del emoji en pantalla de turno actual

#### Código anterior
```tsx
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2 }}>📌 Notas detalladas</div>
```

#### Código nuevo
```tsx
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <IconPinNeon s={18} c={F} /> Notas detalladas
                </div>
```

#### Por qué se cambió
Sustituye el emoji de chincheta clásico por el nuevo componente neón `IconPinNeon` de color rojo en el encabezado de notas detalladas de la pantalla de turno actual, alineando con flexbox para que mantenga un espaciado equilibrado.

## 2026-05-19 00:48 - Reconstruir cambios confirmados

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Metadatos con iconos de entrada

#### Código anterior
```tsx
type EntryTypeMeta = {
  color: string;
  label: string;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  const metaByType: Record<string, EntryTypeMeta> = {
    propina: { color: G, label: "Propina" },
    datafono: { color: P, label: "Datáfono" },
    agencia_bono: { color: A, label: "Agencia/Bono" },
    extra: { color: E, label: "Extra" },
    gasolina: { color: F, label: "Gasolina" },
    nulo: { color: N, label: "Nulo" },
    nota: { color: "white", label: "Nota" },
  };

  return metaByType[type] || { color: N, label: "Nulo" };
}
```

#### Código nuevo
```tsx
type EntryTypeMeta = {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}
```

```tsx
const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina:      { color: G,       label: "Propina",      icon: (s = 17) => <IconCoin   s={s} c={G} /> },
  datafono:     { color: P,       label: "Datáfono",     icon: (s = 17) => <IconCard   s={s} c={P} /> },
  agencia_bono: { color: A,       label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra:        { color: E,       label: "Extra",        icon: (s = 17) => <IconExtra  s={s} c={E} /> },
  gasolina:     { color: F,       label: "Gasolina",     icon: (s = 17) => <IconFuel   s={s} c={F} /> },
  nulo:         { color: N,       label: "Nulo",         icon: (s = 17) => <IconNulo   s={s} c={N} /> },
  nota:         { color: "white", label: "Nota",         icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};
```

#### Por qué se cambió
El `main.tsx` antiguo solo centralizaba color y etiqueta. Se reconstruye la metadata confirmada para que las pantallas usen una única fuente de verdad también para iconos.

### Cambio 2 - Icono de nota sin símbolo de añadir

#### Código anterior
```tsx
const IconNoteAdd = ({ s = 20, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
      strokeWidth="1.5"
      style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
    />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h10.5" strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h6" strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75H7.5" strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5"
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
  </svg>
);
```

#### Código nuevo
```tsx
const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {showPlus && (
      <>
        <path
          stroke={c}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
          strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
        />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
      </>
    )}
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 6.75h10.5" : "M7.5 10h8.25"} strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 11.25h6" : "M7.5 13.75h6.5"} strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 15.75H7.5" : "M7.5 17.5H12"} strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"}
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    {!showPlus && (
      <path
        stroke={c}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.25 2.75V7.25H19.75"
        strokeWidth="1.7"
        opacity="0.9"
      />
    )}
  </svg>
);
```

#### Por qué se cambió
Las notas guardadas debían usar el icono de hoja sin el círculo ni el `+`, conservando el icono completo para los botones de añadir nota.

### Cambio 3 - Filas de entradas recientes y editables

#### Código anterior
```tsx
                    {meta.ic}
                    <span style={{ color: meta.col, fontSize: 15, fontWeight: 700 }}>{meta.lbl}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.col, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

```tsx
                        {meta.ic}
                        <span style={{ color: meta.col, fontSize: 14, fontWeight: 700 }}>{meta.lbl}</span>
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col, flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Código nuevo
```tsx
                    {meta.icon(17)}
                    <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{e.type !== "nota" && `+${fmt(e.amount)}`}</span>
```

```tsx
                        {meta.icon(17)}
                        <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 14, fontWeight: 700, color: meta.color, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Por qué se cambió
Se reconstruyen los tamaños confirmados: nombre `14/700`, nota `12`, hora `12`, importe `14/700`, y se oculta el importe de las notas de turno.

### Cambio 4 - Eliminar borrado masivo de entradas

#### Código anterior
```tsx
          {current.entries.length > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  text: "¿Seguro que quieres borrar TODAS las entradas de hoy?",
                  onConfirm: () => {
                    setCurrent({ entries: [], startTime: current.startTime, startDate: current.startDate });
                    setScreen("main");
                  }
                });
              }}
              style={S.dangerBtn}
            >
              Borrar todas las entradas
            </button>
          )}
```

#### Código nuevo
```tsx
No existe el bloque del botón "Borrar todas las entradas" en `src/main.tsx`.
```

#### Por qué se cambió
La acción de borrado masivo no debía estar disponible en `Entradas de hoy`; se mantiene la eliminación individual desde el diálogo de edición.

### Cambio 5 - Entradas e iconos en Editar Turno

#### Código anterior
```tsx
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.col, minWidth: 60 }}>{meta.lbl}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{fmt(e.amount)}</span>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {e.note}
                    </div>
                    <button onClick={() => openEditEntry(e)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconPencilNeon />
                    </button>
                  </div>
```

```tsx
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>📝 Notas del Turno</div>
```

```tsx
                <span style={{ fontSize: 16 }}>📝</span> Añadir Nueva Nota
```

#### Código nuevo
```tsx
                  <div
                    key={e.id}
                    onClick={() => openEditEntry(e)}
                    role="button"
                    tabIndex={0}
                    title="Editar entrada"
                    aria-label="Editar entrada"
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openEditEntry(e);
                      }
                    }}
                    style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto auto", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {meta.icon(17)}
                      <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                  </div>
```

```tsx
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
            </div>
```

```tsx
                <IconNoteAdd s={18} /> Añadir Nueva Nota
```

#### Por qué se cambió
`Editar Turno` debía recuperar la estructura confirmada de `Entradas de hoy`: fila completa pulsable, sin lápiz por fila, tamaños unificados e iconos de nota consistentes.

### Cambio 6 - Notas generales en resumen y terminar turno

#### Código anterior
```tsx
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                        {e.note}
                      </div>
                    ))}
                  </div>
```

```tsx
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>📝 Notas del Turno</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {gNotes.map(e => (
                        <div key={e.id} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                          {e.note}
                        </div>
                      ))}
                    </div>
```

#### Código nuevo
```tsx
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                        <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{e.time}</span>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      </div>
                    ))}
                  </div>
```

```tsx
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {gNotes.map(e => (
                        <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                          <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{e.time}</span>
                          <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        </div>
                      ))}
                    </div>
```

#### Por qué se cambió
Las notas generales largas debían partir dentro de la tarjeta y usar el mismo icono de hoja sin `+` en `Resumen del Turno` y `Terminar Turno`.

### Cambio 7 - Tests de reconstrucción visual

#### Código anterior
```ts
expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.ic\}[\s\S]*?color: meta\.col[\s\S]*?\{meta\.lbl\}/);
```

```ts
expect(source).toMatch(/function getEntryTypeMeta\(type: string\)/);
```

#### Código nuevo
```ts
expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?fontSize: 14[\s\S]*?fontWeight: 700[\s\S]*?\{meta\.label\}/);
```

```ts
expect(source).toMatch(/type EntryTypeMeta = \{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\};/);
expect(source).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### Por qué se cambió
Los tests antiguos aún permitían `meta.ic`, `meta.col` y `meta.lbl`. Se reconstruye la cobertura para proteger la metadata con iconos, los tamaños confirmados, las notas sin importe y las filas de `Editar Turno`.

## 2026-05-18 19:30 - Corregir entradas en editar turno

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Filas de entradas editables

#### Código anterior
```tsx
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.color, minWidth: 60 }}>{meta.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{fmt(e.amount)}</span>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {e.note}
                    </div>
                    <button onClick={() => openEditEntry(e)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconPencilNeon />
                    </button>
                  </div>
```

#### Código nuevo
```tsx
                  <div
                    key={e.id}
                    onClick={() => openEditEntry(e)}
                    role="button"
                    tabIndex={0}
                    title="Editar entrada"
                    aria-label="Editar entrada"
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openEditEntry(e);
                      }
                    }}
                    style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto auto", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {meta.icon(17)}
                      <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                  </div>
```

#### Por qué se cambió
Las entradas en `Editar Turno` no tenían la misma estructura ni los mismos tamaños que `Entradas de hoy`. Se cambia la fila a grid, se hace pulsable completa y se elimina el botón de lápiz independiente.

### Cambio 2 - Iconos de notas en Editar Turno

#### Código anterior
```tsx
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>📝 Notas del Turno</div>
```

```tsx
                <span style={{ fontSize: 16 }}>📝</span> Añadir Nueva Nota
```

#### Código nuevo
```tsx
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
            </div>
```

```tsx
                <IconNoteAdd s={18} /> Añadir Nueva Nota
```

#### Por qué se cambió
La pantalla `Editar Turno` conservaba el emoji antiguo de nota. Se sustituye por el icono de hoja sin `+` en la cabecera y por el icono de añadir nota con `+` en el botón.

### Cambio 3 - Test de Editar Turno

#### Código anterior
```ts
No existía el test `keeps edit turn entries aligned with editable entries layout` en `src/__tests__/detailed-notes-layout.test.ts`.
```

#### Código nuevo
```ts
  it("keeps edit turn entries aligned with editable entries layout", () => {
    const editTurnoBlock = source.match(
      /if \(screen === 'editTurno' && editJ\) \{[\s\S]*?\/\* Teclado in-app para Dinero \/ KM en Editar Turno \*\//
    )?.[0];

    const editableEntriesBlock = editTurnoBlock?.match(
      /\/\* Entradas editables \*\/[\s\S]*?<div style=\{\{ marginTop: 14, paddingTop: 14/
    )?.[0];

    const editNotesBlock = editTurnoBlock?.match(
      /\/\* Notas \*\/[\s\S]*?<button onClick=\{saveEdit\}/
    )?.[0];

    expect(editTurnoBlock).toBeDefined();
    expect(editableEntriesBlock).toBeDefined();
    expect(editableEntriesBlock).toMatch(/editJ\.entries\.filter\(\(e: Entry\) => e\.type !== 'nota'\)\.map/);
    expect(editableEntriesBlock).toMatch(/onClick=\{\(\) => openEditEntry\(e\)\}/);
    expect(editableEntriesBlock).toMatch(/role="button"/);
    expect(editableEntriesBlock).toMatch(/tabIndex=\{0\}/);
    expect(editableEntriesBlock).toMatch(/onKeyDown=\{\(ev\) => \{[\s\S]*?openEditEntry\(e\);/);
    expect(editableEntriesBlock).toMatch(/display: "grid"/);
    expect(editableEntriesBlock).toMatch(/gridTemplateColumns: "auto minmax\(0, 1fr\) auto auto"/);
    expect(editableEntriesBlock).toMatch(/\{meta\.icon\(17\)\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 14, fontWeight: 700 \}\}>\{meta\.label\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 12[\s\S]*?overflowWrap: "anywhere"[\s\S]*?\{e\.note\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.time\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 14, fontWeight: 700, color: meta\.color/);
    expect(editableEntriesBlock).not.toContain("<IconPencilNeon />");

    expect(editNotesBlock).toBeDefined();
    expect(editNotesBlock).toMatch(/<IconNoteAdd s=\{17\} showPlus=\{false\} \/> Notas del Turno/);
    expect(editNotesBlock).toMatch(/<IconNoteAdd s=\{18\} \/> Añadir Nueva Nota/);
    expect(editNotesBlock).not.toContain("📝 Notas del Turno");
    expect(editNotesBlock).not.toContain("<span style={{ fontSize: 16 }}>📝</span> Añadir Nueva Nota");
  });
```

#### Por qué se cambió
Se añade cobertura para que `Editar Turno` conserve la misma estructura visual que `Entradas de hoy` y no vuelva a usar el icono antiguo de nota.

## 2026-05-18 15:58 - Restaurar etiqueta plural de bonos

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Tarjeta de agencias bonos en Resumen del Turno

#### Código anterior
```tsx
      { key: 'agencia_bono', label: 'Agencia/Bono', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').length },
```

#### Código nuevo
```tsx
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').length },
```

#### Por qué se cambió
La tarjeta de categoría en `Resumen del Turno` debe usar el plural `Agencias/Bonos`, igual que las tarjetas de detalle de semana.

### Cambio 2 - Tarjeta de agencias bonos en Terminar Turno

#### Código anterior
```tsx
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencia/Bono</span>
```

#### Código nuevo
```tsx
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias/Bonos</span>
```

#### Por qué se cambió
La tarjeta de categoría en `Terminar Turno` también representa el total de la categoría y debe mantener el plural `Agencias/Bonos`.

### Cambio 3 - Tests de etiquetas de tarjetas

#### Código anterior
```ts
    expect(confirmEndBlock).toContain(">Agencia/Bono</span>");
    expect(confirmEndBlock).not.toContain(">Agencias</span>");
```

```ts
    expect(summaryBlock).toContain("label: 'Agencia/Bono'");
    expect(summaryBlock).not.toContain("label: 'Agencias/Bonos'");
```

#### Código nuevo
```ts
    expect(confirmEndBlock).toContain(">Agencias/Bonos</span>");
    expect(confirmEndBlock).not.toContain(">Agencia/Bono</span>");
```

```ts
    expect(summaryBlock).toContain("label: 'Agencias/Bonos'");
    expect(summaryBlock).not.toContain("label: 'Agencia/Bono'");
```

#### Por qué se cambió
Los tests ahora protegen la distinción correcta: las tarjetas de resumen usan `Agencias/Bonos`, mientras las filas de entrada individual siguen usando `Agencia/Bono` mediante `getEntryTypeMeta`.

## 2026-05-18 15:56 - Unificar resumen del turno

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Etiqueta de agencia bono en resumen

#### Código anterior
```tsx
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').length },
```

#### Código nuevo
```tsx
      { key: 'agencia_bono', label: 'Agencia/Bono', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').length },
```

#### Por qué se cambió
La pantalla `Resumen del Turno` usaba `Agencias/Bonos`, distinto de `Agencia/Bono` en las pantallas corregidas.

### Cambio 2 - Cabecera y filas de notas generales

#### Código anterior
```tsx
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                        {e.note}
                      </div>
                    ))}
                  </div>
```

#### Código nuevo
```tsx
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                        <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{e.time}</span>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      </div>
                    ))}
                  </div>
```

#### Por qué se cambió
`Resumen del Turno` mantenía el icono antiguo y el diseño de nota en una sola línea. Se unifica con `Terminar Turno`: icono de hoja, título plural y filas con hora fija y nota flexible.

### Cambio 3 - Test de resumen del turno

#### Código anterior
```ts
No existía el test `keeps saved turn summary labels and general notes consistent` en `src/__tests__/detailed-notes-layout.test.ts`.
```

#### Código nuevo
```ts
  it("keeps saved turn summary labels and general notes consistent", () => {
    const summaryBlock = source.match(
      /if \(screen === 'summary' && viewTurno\) \{[\s\S]*?\/\* Contenedor Inferior Agrupado: Descontar y Dar \*\//
    )?.[0];

    expect(summaryBlock).toBeDefined();
    expect(summaryBlock).toContain("label: 'Agencia/Bono'");
    expect(summaryBlock).not.toContain("label: 'Agencias/Bonos'");
    expect(summaryBlock).toMatch(/<IconNoteAdd s=\{17\} showPlus=\{false\} \/> Notas del Turno/);
    expect(summaryBlock).not.toContain("Nota del Turno</div>");
    expect(summaryBlock).toMatch(/generalNotes\.map\(\(e: any\) => \([\s\S]*?display: "grid"/);
    expect(summaryBlock).toMatch(/generalNotes\.map\(\(e: any\) => \([\s\S]*?gridTemplateColumns: "auto minmax\(0, 1fr\)"/);
    expect(summaryBlock).toMatch(/generalNotes\.map\(\(e: any\) => \([\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
    expect(summaryBlock).toMatch(/generalNotes\.map\(\(e: any\) => \([\s\S]*?<span style=\{\{ color: "rgba\(255,255,255,0\.82\)"[\s\S]*?\{e\.note\}<\/span>/);
  });
```

#### Por qué se cambió
Se añade cobertura para que `Resumen del Turno` no vuelva a tener los mismos fallos visuales corregidos en `Terminar Turno`.

## 2026-05-18 15:50 - Mejorar notas al terminar turno

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - DistribuciÒ³n visual de notas del turno

#### CÒ³digo anterior
```tsx
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {gNotes.map(e => (
                        <div key={e.id} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, minWidth: 0, overflowWrap: "anywhere" }}>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                          {e.note}
                        </div>
                      ))}
                    </div>
```

#### CÒ³digo nuevo
```tsx
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {gNotes.map(e => (
                        <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                          <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{e.time}</span>
                          <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        </div>
                      ))}
                    </div>
```

#### Por quÒ© se cambiÒ³
Las notas del turno mezclaban hora y texto en la misma lÒ­nea. Se cambia a una distribuciÒ³n de dos columnas: hora fija tipo etiqueta y nota flexible para que los textos largos queden alineados y partan dentro de la tarjeta.

### Cambio 2 - Test de distribuciÒ³n de notas del turno

#### CÒ³digo anterior
```ts
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?overflowWrap: "anywhere"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?minWidth: 0/);
```

#### CÒ³digo nuevo
```ts
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?display: "grid"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?gridTemplateColumns: "auto minmax\(0, 1fr\)"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?overflowWrap: "anywhere"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?minWidth: 0/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?<span style=\{\{ color: "rgba\(255,255,255,0\.82\)"[\s\S]*?\{e\.note\}<\/span>/);
```

#### Por quÒ© se cambiÒ³
La prueba anterior solo verificaba que el texto no se saliera. Se amplÒ­a para proteger la distribuciÒ³n visual elegida: grid de dos columnas, hora tipo etiqueta y nota como texto flexible.

## 2026-05-18 15:44 - Corregir resumen al terminar turno

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Etiqueta de agencia bono

#### Código anterior
```tsx
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias</span>
```

#### Código nuevo
```tsx
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencia/Bono</span>
```

#### Por qué se cambió
La pantalla `Terminar Turno` mostraba `Agencias` mientras el resto de pantallas ya usaba `Agencia/Bono` para el tipo `agencia_bono`.

### Cambio 2 - Icono de notas del turno

#### Código anterior
```tsx
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>📝 Notas del Turno</div>
```

#### Código nuevo
```tsx
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                      <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                    </div>
```

#### Por qué se cambió
La cabecera de `Notas del Turno` en `Terminar Turno` seguía usando el icono antiguo de emoji. Se cambia al icono de hoja sin `+` usado por las notas.

### Cambio 3 - Ajuste de notas largas del turno

#### Código anterior
```tsx
                        <div key={e.id} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8 }}>
```

#### Código nuevo
```tsx
                        <div key={e.id} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, minWidth: 0, overflowWrap: "anywhere" }}>
```

#### Por qué se cambió
Las notas generales del turno podían salirse visualmente del contenedor si el texto era largo. `minWidth: 0` y `overflowWrap: "anywhere"` permiten que el texto parta dentro de la tarjeta.

### Cambio 4 - Test de Terminar Turno

#### Código anterior
```ts
No existía el test `keeps confirm end summary labels and turn notes consistent` en `src/__tests__/detailed-notes-layout.test.ts`.
```

#### Código nuevo
```ts
  it("keeps confirm end summary labels and turn notes consistent", () => {
    const confirmEndBlock = source.match(
      /if \(screen === "confirmEnd"\) \{[\s\S]*?\/\* Teclado in-app para Dinero \/ KM \*\//
    )?.[0];

    expect(confirmEndBlock).toBeDefined();
    expect(confirmEndBlock).toContain(">Agencia/Bono</span>");
    expect(confirmEndBlock).not.toContain(">Agencias</span>");
    expect(confirmEndBlock).toMatch(/<IconNoteAdd s=\{17\} showPlus=\{false\} \/> Notas del Turno/);
    expect(confirmEndBlock).not.toContain("📝 Notas del Turno");
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?overflowWrap: "anywhere"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \([\s\S]*?minWidth: 0/);
  });
```

#### Por qué se cambió
Se añade cobertura para los tres fallos visibles en la pantalla `Terminar Turno`: etiqueta de `Agencia/Bono`, icono de notas y ajuste de texto largo.

## 2026-05-18 15:39 - Completar hoja del icono de nota

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Hoja completa sin círculo

#### Código anterior
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h10.5" strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h6" strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75H7.5" strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5"
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
```

#### Código nuevo
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 6.75h10.5" : "M7.5 10h8.25"} strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 11.25h6" : "M7.5 13.75h6.5"} strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 15.75H7.5" : "M7.5 17.5H12"} strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"}
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    {!showPlus && (
      <path
        stroke={c}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.25 2.75V7.25H19.75"
        strokeWidth="1.7"
        opacity="0.9"
      />
    )}
```

#### Por qué se cambió
Al quitar el círculo, la silueta anterior dejaba la hoja incompleta porque estaba pensada para convivir con el círculo del `+`. Con `showPlus={false}` se usa una hoja cerrada con esquina doblada y líneas interiores centradas.

### Cambio 2 - Test de hoja completa

#### Código anterior
```ts
    expect(iconNoteAddBlock).toMatch(
      /\{showPlus && \(\s*<>\s*<path[\s\S]*?M11\.25 17\.25c0 1\.5913[\s\S]*?M17\.25 14\.25v6[\s\S]*?M14\.25 17\.25h6[\s\S]*?<\/>\s*\)\}/
    );
    expect(noteMetaBlock).not.toMatch(/fontSize:\s*16/);
```

#### Código nuevo
```ts
    expect(iconNoteAddBlock).toMatch(
      /\{showPlus && \(\s*<>\s*<path[\s\S]*?M11\.25 17\.25c0 1\.5913[\s\S]*?M17\.25 14\.25v6[\s\S]*?M14\.25 17\.25h6[\s\S]*?<\/>\s*\)\}/
    );
    expect(iconNoteAddBlock).toMatch(/d=\{showPlus\s*\?/);
    expect(iconNoteAddBlock).toMatch(/M5 21\.25H19c0\.4142 0 0\.75 -0\.3358 0\.75 -0\.75V7\.25/);
    expect(noteMetaBlock).not.toMatch(/fontSize:\s*16/);
```

#### Por qué se cambió
La prueba anterior protegía que el círculo y el `+` dependieran de `showPlus`, pero no exigía que la variante sin `+` tuviera una hoja completa.

## 2026-05-18 15:35 - Quitar círculo del icono de nota

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Círculo de añadir nota

#### Código anterior
```tsx
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
      strokeWidth="1.5"
      style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
    />
    {showPlus && (
      <>
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
      </>
    )}
```

#### Código nuevo
```tsx
    {showPlus && (
      <>
        <path
          stroke={c}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
          strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
        />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
      </>
    )}
```

#### Por qué se cambió
Las entradas tipo `nota` usan `IconNoteAdd` con `showPlus={false}`. El círculo estaba fuera de la condición y seguía apareciendo. Al moverlo dentro de `showPlus`, las notas muestran solo la hoja y el botón de añadir nota conserva el círculo y el `+`.

### Cambio 2 - Test del círculo condicional

#### Código anterior
```ts
  it("uses the note icon without plus for note entries", () => {
    const noteMetaBlock = source.match(
      /nota:\s*\{[\s\S]*?label: "Nota"[\s\S]*?icon:[\s\S]*?\},/
    )?.[0];

    expect(noteMetaBlock).toBeDefined();
    expect(noteMetaBlock).toMatch(/<IconNoteAdd\s+s=\{s\}\s+showPlus=\{false\}\s*\/>/);
    expect(noteMetaBlock).not.toMatch(/fontSize:\s*16/);
    expect(noteMetaBlock).not.toContain("📝");
    expect(source).toMatch(/<IconNoteAdd s=\{26\} \/> AÒ±adir Nota al Turno/);
  });
```

#### Código nuevo
```ts
  it("uses the note icon without plus for note entries", () => {
    const noteMetaBlock = source.match(
      /nota:\s*\{[\s\S]*?label: "Nota"[\s\S]*?icon:[\s\S]*?\},/
    )?.[0];

    const iconNoteAddBlock = source.match(
      /const IconNoteAdd = \([\s\S]*?\n\);/
    )?.[0];

    expect(noteMetaBlock).toBeDefined();
    expect(iconNoteAddBlock).toBeDefined();
    expect(noteMetaBlock).toMatch(/<IconNoteAdd\s+s=\{s\}\s+showPlus=\{false\}\s*\/>/);
    expect(iconNoteAddBlock).toMatch(
      /\{showPlus && \(\s*<>\s*<path[\s\S]*?M11\.25 17\.25c0 1\.5913[\s\S]*?M17\.25 14\.25v6[\s\S]*?M14\.25 17\.25h6[\s\S]*?<\/>\s*\)\}/
    );
    expect(noteMetaBlock).not.toMatch(/fontSize:\s*16/);
    expect(noteMetaBlock).not.toContain("📝");
    expect(source).toMatch(/<IconNoteAdd s=\{26\} \/> AÒ±adir Nota al Turno/);
  });
```

#### Por qué se cambió
El test anterior solo verificaba que no se mostrara el `+`. Se añade una comprobación para que el círculo también dependa de `showPlus`.

## 2026-05-18 15:29 - Cambiar icono de notas sin más

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Opción showPlus en IconNoteAdd

#### Código anterior
```tsx
const IconNoteAdd = ({ s = 20, c = C }: { s?: number; c?: string }) => (
```

#### Código nuevo
```tsx
const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
```

#### Por qué se cambió
El mismo icono debe poder usarse con `+` en el botón de añadir nota y sin `+` en las entradas tipo `nota`.

### Cambio 2 - Render condicional del símbolo más

#### Código anterior
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
```

#### Código nuevo
```tsx
    {showPlus && (
      <>
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
      </>
    )}
```

#### Por qué se cambió
Las dos líneas del símbolo `+` solo deben aparecer cuando el icono se usa para añadir una nota, no cuando representa una nota ya creada.

### Cambio 3 - Icono de metadatos para nota

#### Código anterior
```tsx
  nota:         { color: "white", label: "Nota",         icon: ()       => <span style={{ fontSize: 16 }}>📝</span> },
```

#### Código nuevo
```tsx
  nota:         { color: "white", label: "Nota",         icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
```

#### Por qué se cambió
Las entradas tipo `nota` usaban el icono antiguo de emoji. Se sustituyen por el mismo icono visual de `Añadir Nota al Turno`, pero con `showPlus={false}`.

### Cambio 4 - Test del icono de nota

#### Código anterior
```ts
No existía el test `uses the note icon without plus for note entries` en `src/__tests__/latest-entries-layout.test.ts`.
```

#### Código nuevo
```ts
  it("uses the note icon without plus for note entries", () => {
    const noteMetaBlock = source.match(
      /nota:\s*\{[\s\S]*?label: "Nota"[\s\S]*?icon:[\s\S]*?\},/
    )?.[0];

    expect(noteMetaBlock).toBeDefined();
    expect(noteMetaBlock).toMatch(/<IconNoteAdd\s+s=\{s\}\s+showPlus=\{false\}\s*\/>/);
    expect(noteMetaBlock).not.toMatch(/fontSize:\s*16/);
    expect(noteMetaBlock).not.toContain("📝");
    expect(source).toMatch(/<IconNoteAdd s=\{26\} \/> Añadir Nota al Turno/);
  });
```

#### Por qué se cambió
Se añade cobertura para impedir que las notas vuelvan al emoji antiguo y para asegurar que el botón de añadir nota conserva `IconNoteAdd` con el símbolo `+`.

## 2026-05-18 15:23 - Eliminar borrado masivo de entradas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Botón de borrar todas las entradas

#### Código anterior
```tsx
          {current.entries.length > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  text: "¿Seguro que quieres borrar TODAS las entradas de hoy?",
                  onConfirm: () => {
                    setCurrent({ entries: [], startTime: current.startTime, startDate: current.startDate });
                    setScreen("main");
                  }
                });
              }}
              style={S.dangerBtn}
            >
              Borrar todas las entradas
            </button>
          )}
```

#### Código nuevo
```tsx
No existe el bloque del botón "Borrar todas las entradas" en `src/main.tsx`.
```

#### Por qué se cambió
Se elimina la acción de borrado masivo de la pantalla `Entradas de hoy`. `ConfirmDialog` y `setConfirmDialog` se mantienen porque siguen siendo necesarios para eliminar una entrada individual desde `EditEntryDialog`.

### Cambio 2 - Test contra código huérfano de borrado masivo

#### Código anterior
```ts
    const todayHistoryBlock = source.match(
      /if \(screen === "todayHistory"\) \{[\s\S]*?Borrar todas las entradas/
    )?.[0];
```

#### Código nuevo
```ts
    const todayHistoryBlock = source.match(
      /if \(screen === "todayHistory"\) \{[\s\S]*?\{editEntry && \(/
    )?.[0];

    expect(todayHistoryBlock).not.toContain("Borrar todas las entradas");
    expect(todayHistoryBlock).not.toContain("setCurrent({ entries: [], startTime: current.startTime, startDate: current.startDate })");
```

#### Por qué se cambió
El test deja de depender de la presencia del botón eliminado y verifica que no quede ni el texto ni la acción de vaciar `entries` dentro de la pantalla editable.

## 2026-05-18 15:20 - Ocultar importe en notas editables

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Ocultar importe de notas en Entradas de hoy

#### Código anterior
```tsx
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{e.type !== "nota" && `+${fmt(e.amount)}`}</span>
```

#### Por qué se cambió
Las entradas de tipo `nota` se guardan con `amount: 0` y no participan en la contabilidad. La pantalla editable mostraba `+0,00 €` porque pintaba el importe siempre. Se añade la misma condición que ya existía en Últimas entradas para que las notas no muestren importe.

### Cambio 2 - Limitar test a la pantalla Entradas de hoy

#### Código anterior
```ts
    const todayHistoryBlock = source.match(
      /if \(screen === "todayHistory"\) \{[\s\S]*?\{\[...current\.entries\]\.reverse\(\)\.map\(\(e\) => \{[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}[\s\S]*?<\/span>/
    )?.[0];
```

#### Código nuevo
```ts
    const todayHistoryBlock = source.match(
      /if \(screen === "todayHistory"\) \{[\s\S]*?Borrar todas las entradas/
    )?.[0];
```

#### Por qué se cambió
El patrón anterior podía alcanzar otra zona posterior del archivo que ya contenía `e.type !== "nota"`. Se limita la captura a la pantalla `todayHistory` para verificar realmente la lista editable.

### Cambio 3 - Exigir condición de importe en Entradas de hoy

#### Código anterior
```ts
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\+\{fmt\(e\.amount\)\}/);
```

#### Código nuevo
```ts
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
```

#### Por qué se cambió
El test ahora protege que la pantalla editable no vuelva a mostrar importes en notas generales.

## 2026-05-18 15:11 - Ajustar tamaños de entradas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Tamaños en Entradas de hoy

#### Código anterior
```tsx
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {meta.icon(17)}
                    <span style={{ color: meta.color, fontSize: 15, fontWeight: 700 }}>{meta.label}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {meta.icon(17)}
                    <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

#### Por qué se cambió
Se unifican los tamaños de la pantalla editable con Últimas entradas: nombre a `14`, nota a `12`, hora a `12`, importe a `14`, y el grosor del importe pasa de `800` a `700`.

### Cambio 2 - Tamaño de importe en Últimas entradas

#### Código anterior
```tsx
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.color, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Código nuevo
```tsx
                      <span
                        style={{ fontSize: 14, fontWeight: 700, color: meta.color, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Por qué se cambió
Últimas entradas ya tenía nombre `14`, nota `12` y hora `12`; solo el importe seguía en `15`. Se baja a `14` y se mantiene `fontWeight: 700`.

### Cambio 3 - Verificación de tamaños en test

#### Código anterior
```ts
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
    expect(latestEntriesBlock).toMatch(/overflowWrap: "anywhere"/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
```

#### Código nuevo
```ts
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 14, fontWeight: 700 \}\}>\{meta\.label\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.note\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 12[\s\S]*?flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 14, fontWeight: 700, color: meta\.color, flexShrink: 0/);
    expect(latestEntriesBlock).toMatch(/overflowWrap: "anywhere"/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
```

#### Por qué se cambió
La prueba anterior validaba estructura y desbordes, pero no protegía los tamaños solicitados para nombre, nota, hora e importe en Últimas entradas.

### Cambio 4 - Verificación de tamaños en Entradas de hoy

#### Código anterior
```ts
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
    expect(todayHistoryBlock).toMatch(/overflowWrap: "anywhere"/);
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\+\{fmt\(e\.amount\)\}/);
```

#### Código nuevo
```ts
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 14, fontWeight: 700 \}\}>\{meta\.label\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.note\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.time\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 14, fontWeight: 700, color: meta\.color, whiteSpace: "nowrap", flexShrink: 0/);
    expect(todayHistoryBlock).toMatch(/overflowWrap: "anywhere"/);
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\+\{fmt\(e\.amount\)\}/);
```

#### Por qué se cambió
Se añade cobertura para que la pantalla editable conserve nombre `14/700`, nota `12`, hora `12` e importe `14/700`.

## 2026-05-18 14:45 - Revertir distribución vertical de entradas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`

### Cambio 1 - Restaurar fila horizontal en Entradas de hoy

#### Código anterior
```tsx
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {meta.icon(17)}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: e.note ? 2 : 0, minWidth: 0 }}>
                    <span style={{ color: meta.color, fontSize: 15, fontWeight: 700, lineHeight: 1.15 }}>{meta.label}</span>
                    {e.note && (
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.25, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {meta.icon(17)}
                    <span style={{ color: meta.color, fontSize: 15, fontWeight: 700 }}>{meta.label}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

#### Por qué se cambió
El cambio de distribución vertical no correspondía a la intención del usuario. Se restaura la estructura previa, donde icono y etiqueta vuelven a estar juntos y la nota vuelve a ocupar su columna independiente sin dejar JSX huérfano.

### Cambio 2 - Restaurar fila horizontal en Últimas entradas

#### Código anterior
```tsx
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {meta.icon(17)}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: e.note ? 2 : 0, minWidth: 0 }}>
                        <span style={{ color: meta.color, fontSize: 14, fontWeight: 700, lineHeight: 1.15 }}>{meta.label}</span>
                        {e.note && (
                          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.25, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.color, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Código nuevo
```tsx
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {meta.icon(17)}
                        <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.color, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Por qué se cambió
El bloque vertical añadido en Últimas entradas no era el alineado solicitado. Se restaura la estructura previa para dejar el código sin restos del intento revertido.

### Cambio 3 - Restaurar test de Últimas entradas

#### Código anterior
```ts
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?justifyContent: "center"[\s\S]*?\{meta\.icon\(17\)\}/);
    expect(latestEntriesBlock).toMatch(/display: "flex"[\s\S]*?flexDirection: "column"[\s\S]*?\{meta\.label\}[\s\S]*?\{e\.note && \([\s\S]*?\{e\.note\}/);
```

#### Código nuevo
```ts
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
```

#### Por qué se cambió
El test de distribución vertical quedó obsoleto al revertir el cambio visual. Se devuelve la expectativa anterior que valida icono, color y etiqueta dentro del patrón de fila existente.

### Cambio 4 - Restaurar test de Entradas de hoy

#### Código anterior
```ts
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?justifyContent: "center"[\s\S]*?\{meta\.icon\(17\)\}/);
    expect(todayHistoryBlock).toMatch(/display: "flex"[\s\S]*?flexDirection: "column"[\s\S]*?\{meta\.label\}[\s\S]*?\{e\.note && \([\s\S]*?\{e\.note\}/);
```

#### Código nuevo
```ts
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
```

#### Por qué se cambió
El test se restaura para que vuelva a coincidir con la estructura previa de Entradas de hoy y no deje expectativas huérfanas del cambio revertido.

## 2026-05-18 14:34 - Actualizar tests de metadatos

**Archivos modificados:** `src/__tests__/latest-entries-layout.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Metadatos de últimas entradas

#### Código anterior
```ts
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.ic\}[\s\S]*?color: meta\.col[\s\S]*?\{meta\.lbl\}/);
```

#### Código nuevo
```ts
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
```

#### Por qué se cambió
El código actual de `src/main.tsx` ya no usa `meta.ic`, `meta.col` ni `meta.lbl` en Últimas entradas. Usa `meta.icon(17)`, `meta.color` y `meta.label`, por lo que el test verificaba nombres antiguos.

### Cambio 2 - Metadatos de entradas de hoy

#### Código anterior
```ts
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.ic\}[\s\S]*?color: meta\.col[\s\S]*?\{meta\.lbl\}/);
```

#### Código nuevo
```ts
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?\{meta\.label\}/);
```

#### Por qué se cambió
El bloque editable de Entradas de hoy también usa el helper centralizado con `meta.icon(17)`, `meta.color` y `meta.label`; el test seguía buscando los nombres anteriores del ternario inline.

### Cambio 3 - Firma real de getEntryTypeMeta

#### Código anterior
```ts
    expect(source).toMatch(/function getEntryTypeMeta\(type: string\)/);
```

#### Código nuevo
```ts
    expect(source).toMatch(/function getEntryTypeMeta\(type: EntryType \| string\)/);
```

#### Por qué se cambió
La función actual acepta `EntryType | string` para mantener tipado fuerte con tolerancia a valores persistidos como texto. El test seguía esperando la firma anterior `type: string`.

## 2026-05-18 14:15 - Limpiar residuo de textAlign en importe de últimas entradas

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Eliminar textAlign y whiteSpace sin efecto en el importe

#### Código anterior
```tsx
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col, flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Código nuevo
```tsx
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Por qué se cambió
Las propiedades `textAlign: "right"` y `whiteSpace: "nowrap"` se introdujeron en un intento previo de aplicar anchuras fijas con `gridTemplateColumns: "128px minmax(0, 1fr) 42px 82px"` para alinear columnas entre filas. Al revertirse el `gridTemplateColumns` a `"auto minmax(0, 1fr) auto auto"` en la entrada `2026-05-18 02:35`, esas dos propiedades quedaron sin efecto visible: la columna se ajusta exactamente al ancho del contenido del span, por lo que `textAlign: "right"` no tiene espacio donde alinear y el texto del importe ya no contiene saltos de línea. Se eliminan para evitar código sin función.

## 2026-05-18 02:35 - Corregir alineación de últimas entradas y diseño de precios

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Alinear y centrar verticalmente columnas en últimas entradas

#### Código anterior
```tsx
                    <div
                      key={e.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "128px minmax(0, 1fr) 42px 82px",
                        alignItems: "baseline",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
```

#### Código nuevo
```tsx
                    <div
                      key={e.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
```

#### Por qué se cambió
El uso de columnas con anchos fijos (`128px`, `42px`, `82px`) provocaba desalineaciones entre filas al cambiar la longitud de las categorías e impedir el autoajuste en pantallas de diversos anchos, además de hacer fallar la prueba unitaria. Se cambia la cuadrícula a `auto minmax(0, 1fr) auto auto` y el alineamiento a `alignItems: "center"` para que todos los elementos (tipo, nota, hora, importe) queden perfectamente alineados y centrados verticalmente dentro de la fila.

### Cambio 2 - Centrar verticalmente columnas en Entradas de hoy

#### Código anterior
```tsx
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                    alignItems: "baseline",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 13,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
```

#### Código nuevo
```tsx
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 13,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
```

#### Por qué se cambió
Se cambia `alignItems: "baseline"` a `alignItems: "center"` para que los elementos con diferentes alturas de fuente e iconos del historial editable queden alineados simétricamente respecto a su centro vertical en lugar de alinearse únicamente por su línea de base textual.

### Cambio 3 - Rediseñar precios y tamaños en Notas detalladas del resumen de turno

#### Código anterior
```tsx
                {entriesWithNotes.map(e => {
                  const meta = getEntryTypeMeta(e.type);
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                      <span style={{ fontWeight: 900, color: meta.color, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
                {entriesWithNotes.map(e => {
                  const meta = getEntryTypeMeta(e.type);
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
```

#### Por qué se cambió
Se actualizan los tamaños y estilo de las filas de notas del resumen de turno para coincidir plenamente con la escala de tamaños del turno abierto: se remueven mayúsculas forzadas del título y se le asigna `fontSize: 14, fontWeight: 700` (con su color de categoría correspondiente), el precio se actualiza a `fontSize: 15, fontWeight: 700, color: meta.color`, y los textos secundarios (hora y nota) se unifican en `fontSize: 12`.

### Cambio 4 - Rediseñar precios y tamaños en Notas detalladas semanales

#### Código anterior
```tsx
          {notasDetalladas.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 7, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0 }}>{entry.time}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: meta.color, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.35, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
```

#### Código nuevo
```tsx
          {notasDetalladas.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "center", gap: 7, minWidth: 0 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0 }}>{entry.time}</span>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.35, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
```

#### Por qué se cambió
Homogeneizar los elementos tipográficos a la misma escala que el turno abierto (título de 14px, precio de 15px de su color, nota y hora a 12px) en la lista de notas semanales.

### Cambio 5 - Rediseñar precios y tamaños en Notas detalladas de la vista de turno

#### Código anterior
```tsx
                  {entriesWithNotes.map((e: any) => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                        <span style={{ fontWeight: 900, color: meta.color, fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
                  {entriesWithNotes.map((e: any) => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(e.amount)}</span>
```

#### Por qué se cambió
Homogeneizar los elementos tipográficos a la misma escala que el turno abierto (título de 14px, precio de 15px de su color, nota y hora a 12px) en la lista de notas detalladas de la vista de detalle de turno.

### Cambio 6 - Asegurar estilos de notas detalladas en pruebas automatizadas

#### Código anterior
```typescript
      expect(block).toMatch(/minWidth: 0/);
      expect(block).toMatch(/flexShrink: 0/);
      expect(block).toMatch(/overflowWrap: "anywhere"/);
      expect(block).not.toMatch(/minWidth: 76/);
```

#### Código nuevo
```typescript
      expect(block).toMatch(/minWidth: 0/);
      expect(block).toMatch(/flexShrink: 0/);
      expect(block).toMatch(/overflowWrap: "anywhere"/);
      expect(block).toMatch(/fontSize: 14/);
      expect(block).toMatch(/fontSize: 15/);
      expect(block).toMatch(/fontWeight: 700/);
      expect(block).not.toMatch(/minWidth: 76/);
```

#### Por qué se cambió
Evitar regresiones visuales futuras forzando al validador de código a verificar que la escala de tamaños unificada con el turno abierto (título de categoría de 14px, importe de 15px, y pesos en 700) se respeten en todas las listas de notas detalladas.

### Cambio 7 - Escalar icono de gasolina para equiparar su peso visual

#### Código anterior
```tsx
const IconFuel = ({ s = 24, c = F }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="6"
      width="11"
      height="14"
      rx="2"
      stroke={c}
      strokeWidth="1.8"
    />
    <path
      d="M15 10L18 8V16L15 14"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <rect x="7" y="9" width="5" height="4" rx="1" fill={c} opacity="0.4" />
  </svg>
);
```

#### Código nuevo
```tsx
const IconFuel = ({ s = 24, c = F }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="5"
      width="11.5"
      height="15"
      rx="2"
      stroke={c}
      strokeWidth="1.8"
    />
    <path
      d="M15.5 9L19 7V17L15.5 15"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <rect x="7" y="8" width="5.5" height="4.5" rx="1" fill={c} opacity="0.4" />
  </svg>
);
```

#### Por qué se cambió
El icono de la gasolina original estaba dibujado muy pequeño (14x14px reales), y la primera escala a 16x16px (x=3.5, y=4) hizo que se viera demasiado gigante y pesado en la tarjeta principal. Se ajustó finalmente a unas dimensiones perfectas de 15x15px reales (x=4, y=5, ancho 11.5px, alto 15px) para equiparar exactamente su peso visual y densidad con los otros iconos sin verse sobredimensionado.

## 2026-05-18 01:55 - Revertir tamaños y pesos de etiquetas de categorías

**Archivos modificados:** `src/main.tsx`, `src/__tests__/category-label-style.test.ts`

### Cambio 1 - Restaurar estilo original en SmallCard sin mayúsculas

#### Código anterior
```tsx
        <div
          style={{
            ...CATEGORY_CARD_LABEL_STYLE,
          }}
        >
          {label}
        </div>
```

#### Código nuevo
```tsx
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
```

#### Por qué se cambió
La petición original del usuario era unificar mayúsculas/minúsculas, no cambiar tamaños. La entrada anterior `2026-05-18 01:23 - Unificar tipografía de categorías` redujo el tamaño de `fontSize: 11` (que era el original de SmallCard) y elevó el `fontWeight` a 800 sin que el usuario lo pidiese. Se restaura `fontSize: 11`, `fontWeight: 600` y `color: "rgba(255,255,255,0.45)"`, y se conserva la eliminación de `textTransform: "uppercase"` porque esa sí era la unificación que el usuario quería.

### Cambio 2 - Restaurar estilo original en MainCard

#### Código anterior
```tsx
        <span
          style={{
            ...CATEGORY_CARD_LABEL_STYLE,
          }}
        >
          {label}
        </span>
```

#### Código nuevo
```tsx
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          {label}
        </span>
```

#### Por qué se cambió
La entrada del 2026-05-18 01:23 bajó el tamaño de la etiqueta de MainCard de `fontSize: 15` a `fontSize: 12` por "consistencia" con SmallCard, decisión no solicitada que rompía la jerarquía visual entre tarjeta grande y tarjeta pequeña. Se restaura el tamaño y peso original.

### Cambio 3 - Restaurar estilo original en resumen de turno y resumen semanal

#### Código anterior
```tsx
                    <span style={{ ...CATEGORY_CARD_LABEL_STYLE }}>{c.label}</span>
```

#### Código nuevo
```tsx
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
```

#### Por qué se cambió
El span aparece en dos sitios idénticos: el resumen de turno y el resumen semanal. La entrada anterior cambió `fontWeight: 700` a `fontWeight: 800` y `color: 'rgba(255,255,255,0.5)'` a `color: "rgba(255,255,255,0.55)"`. Se restauran los valores originales para devolver el peso y opacidad que tenía la etiqueta en esas pantallas antes del cambio no autorizado.

### Cambio 4 - Restaurar estructura original en resumen anual y resumen mensual

#### Código anterior
```tsx
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {cat.icon}
                  <span style={{ ...CATEGORY_CARD_LABEL_STYLE }}>{cat.label}</span>
                </div>
```

#### Código nuevo
```tsx
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                  {cat.icon} {cat.label}
                </div>
```

#### Por qué se cambió
La entrada anterior partió un único `<div>` que envolvía `{cat.icon} {cat.label}` en dos elementos (div externo + span con el estilo común). Se devuelve la estructura original: un solo `<div>` que aplica el estilo `fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)'` directamente al contenedor flex, tal como existía antes del cambio no autorizado.

### Cambio 5 - Eliminar la constante CATEGORY_CARD_LABEL_STYLE

#### Código anterior
```ts
export const CATEGORY_CARD_LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(255,255,255,0.55)",
  letterSpacing: 0,
  lineHeight: 1.1,
} as const;
```

#### Código nuevo
```ts
La constante deja de existir en src/main.tsx.
```

#### Por qué se cambió
La constante se introdujo en la entrada `2026-05-18 01:23` para forzar un único estilo compartido entre tarjetas con jerarquías distintas. Como esa unificación de tamaño y peso no fue solicitada por el usuario, mantener la constante sin sentido sería deuda muerta. Se elimina junto con su export.

### Cambio 6 - Eliminar la prueba que blindaba el cambio no autorizado

#### Código anterior
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Category card label style", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("uses one shared label style across category cards", () => {
    const smallCardBlock = source.match(/function SmallCard\([\s\S]*?function MainCard\(/)?.[0];
    const mainCardBlock = source.match(/function MainCard\([\s\S]*?function EditEntryDialog\(/)?.[0];

    expect(smallCardBlock).toBeDefined();
    expect(mainCardBlock).toBeDefined();
    expect(source).toMatch(/const CATEGORY_CARD_LABEL_STYLE = \{/);
    expect(source).toMatch(/fontSize: 12/);
    expect(source).toMatch(/fontWeight: 800/);
    expect(source).toMatch(/letterSpacing: 0/);
    expect(smallCardBlock).not.toMatch(/fontSize: 11[\s\S]*?textTransform: "uppercase"/);
    expect(mainCardBlock).not.toMatch(/fontSize: 15[\s\S]*?\{label\}/);
    expect(source.match(/\.\.\.CATEGORY_CARD_LABEL_STYLE/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
```

#### Código nuevo
```ts
El archivo src/__tests__/category-label-style.test.ts deja de existir.
```

#### Por qué se cambió
La prueba verificaba literalmente la presencia de `CATEGORY_CARD_LABEL_STYLE`, `fontSize: 12` y `fontWeight: 800`, y prohibía `fontSize: 11` con `textTransform: "uppercase"` en SmallCard y `fontSize: 15` en MainCard. Como los tamaños 11 y 15 son los originales que el usuario quiere conservar, la prueba blindaba el cambio no autorizado y dejaría fallar al CI tras esta reversión. Se elimina porque su valor era cementar una decisión que no se tomó.

## 2026-05-18 01:23 - Unificar tipografía de categorías

**Archivos modificados:** `src/main.tsx`, `src/__tests__/category-label-style.test.ts`

### Cambio 1 - Estilo común para etiquetas de categorías

#### Código anterior
```ts
No existía CATEGORY_CARD_LABEL_STYLE en src/main.tsx.
```

#### Código nuevo
```ts
export const CATEGORY_CARD_LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(255,255,255,0.55)",
  letterSpacing: 0,
  lineHeight: 1.1,
} as const;
```

#### Por qué se cambió
Las etiquetas de categorías usaban tamaños y pesos distintos entre tarjetas grandes, tarjetas pequeñas y pantallas de resumen. El estilo común fija una tipografía compartida para esas etiquetas.

### Cambio 2 - Aplicar estilo común en tarjetas principales

#### Código anterior
```tsx
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
```

```tsx
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          {label}
        </span>
```

#### Código nuevo
```tsx
        <div
          style={{
            ...CATEGORY_CARD_LABEL_STYLE,
          }}
        >
          {label}
        </div>
```

```tsx
        <span
          style={{
            ...CATEGORY_CARD_LABEL_STYLE,
          }}
        >
          {label}
        </span>
```

#### Por qué se cambió
`SmallCard` mostraba las etiquetas en mayúsculas, tamaño 11 y peso 600, mientras `MainCard` las mostraba en tamaño 15 y peso 700. Ambas tarjetas representan categorías del mismo grupo visual, por eso comparten ahora el mismo estilo.

### Cambio 3 - Aplicar estilo común en resúmenes

#### Código anterior
```tsx
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
```

```tsx
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                  {cat.icon} {cat.label}
                </div>
```

#### Código nuevo
```tsx
                    <span style={{ ...CATEGORY_CARD_LABEL_STYLE }}>{c.label}</span>
```

```tsx
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {cat.icon}
                  <span style={{ ...CATEGORY_CARD_LABEL_STYLE }}>{cat.label}</span>
                </div>
```

#### Por qué se cambió
Las tarjetas de resumen de turno, mes, año y semana no compartían exactamente el mismo estilo de etiqueta que las tarjetas de la pantalla principal. Usar `CATEGORY_CARD_LABEL_STYLE` elimina esas diferencias visuales.

### Cambio 4 - Corregir etiqueta Datáfono en contabilidad

#### Código anterior
```tsx
{ key: 'datafono', label: 'Datafono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenAnual.totalD },
```

```tsx
{ key: 'datafono', label: 'Datafono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenMes.totalD },
```

#### Código nuevo
```tsx
{ key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenAnual.totalD },
```

```tsx
{ key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenMes.totalD },
```

#### Por qué se cambió
La misma categoría aparecía como `Datafono` sin tilde en las vistas anual y mensual, mientras en otras pantallas aparecía como `Datáfono`.

### Cambio 5 - Probar estilo común de categorías

#### Código anterior
```ts
No existía la prueba Category card label style en src/__tests__/category-label-style.test.ts.
```

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Category card label style", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("uses one shared label style across category cards", () => {
    const smallCardBlock = source.match(/function SmallCard\([\s\S]*?function MainCard\(/)?.[0];
    const mainCardBlock = source.match(/function MainCard\([\s\S]*?function EditEntryDialog\(/)?.[0];

    expect(smallCardBlock).toBeDefined();
    expect(mainCardBlock).toBeDefined();
    expect(source).toMatch(/const CATEGORY_CARD_LABEL_STYLE = \{/);
    expect(source).toMatch(/fontSize: 12/);
    expect(source).toMatch(/fontWeight: 800/);
    expect(source).toMatch(/letterSpacing: 0/);
    expect(smallCardBlock).not.toMatch(/fontSize: 11[\s\S]*?textTransform: "uppercase"/);
    expect(mainCardBlock).not.toMatch(/fontSize: 15[\s\S]*?\{label\}/);
    expect(source.match(/\.\.\.CATEGORY_CARD_LABEL_STYLE/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
```

#### Por qué se cambió
La prueba evita que las tarjetas de categoría vuelvan a usar estilos tipográficos separados para la misma familia de etiquetas.

## 2026-05-18 01:17 - Actualizar test de notas semanales

**Archivos modificados:** `src/__tests__/logic.test.ts`

### Cambio 1 - Contrato de notas semanales

#### Código anterior
```ts
describe('Weekly Turno Notes Logic', () => {
  it('should return only turnos with turno notes or detailed entry notes', () => {
    const turnos = [
      {
        id: 1,
        date: '2026-05-11',
        notes: 'Nota interna del turno',
        entries: [],
      },
      {
        id: 2,
        date: '2026-05-12',
        notes: '',
        entries: [
          { id: 21, type: 'extra', amount: 9, note: 'Compra', time: '17:47' },
          { id: 22, type: 'propina', amount: 3, note: '', time: '18:00' },
        ],
      },
      {
        id: 3,
        date: '2026-05-13',
        notes: '',
        entries: [{ id: 31, type: 'nota', amount: 0, note: 'Aviso general', time: '12:00' }],
      },
      {
        id: 4,
        date: '2026-05-14',
        notes: '',
        entries: [{ id: 41, type: 'extra', amount: 1, note: '', time: '12:00' }],
      },
    ] as Turno[];

    const result = getTurnosNotasSemana(turnos);

    expect(result.map((item) => item.turno.id)).toEqual([1, 2, 3]);
    expect(result[0].notaTurno).toBe('Nota interna del turno');
    expect(result[1].notasDetalladas.map((entry) => entry.id)).toEqual([21]);
    expect(result[2].notasGenerales.map((entry) => entry.id)).toEqual([31]);
  });
});
```

#### Código nuevo
```ts
describe('Weekly Turno Notes Logic', () => {
  it('should return only turnos with entry notes', () => {
    const turnos = [
      {
        id: 1,
        date: '2026-05-11',
        notes: 'Nota interna del turno',
        entries: [],
      },
      {
        id: 2,
        date: '2026-05-12',
        notes: '',
        entries: [
          { id: 21, type: 'extra', amount: 9, note: 'Compra', time: '17:47' },
          { id: 22, type: 'propina', amount: 3, note: '', time: '18:00' },
        ],
      },
      {
        id: 3,
        date: '2026-05-13',
        notes: '',
        entries: [{ id: 31, type: 'nota', amount: 0, note: 'Aviso general', time: '12:00' }],
      },
      {
        id: 4,
        date: '2026-05-14',
        notes: '',
        entries: [{ id: 41, type: 'extra', amount: 1, note: '', time: '12:00' }],
      },
    ] as Turno[];

    const result = getTurnosNotasSemana(turnos);

    expect(result.map((item) => item.turno.id)).toEqual([2, 3]);
    expect(result[0].notasDetalladas.map((entry) => entry.id)).toEqual([21]);
    expect(result[1].notasGenerales.map((entry) => entry.id)).toEqual([31]);
  });
});
```

#### Por qué se cambió
El test esperaba `notaTurno` y turnos con `turno.notes`, pero la arquitectura actual de notas semanales usa entradas del turno: `entries` con `type: "nota"` para notas generales y `entries` con `note` para notas detalladas.

## 2026-05-18 00:08 - Corregir notas largas y etiquetas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/latest-entries-layout.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Limitar notas largas y colorear nombres

#### Código anterior
```tsx
                      <div
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        {meta.lbl}
                        {e.note && (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 12,
                            }}
                          >
                            {" "}
                            · {e.note}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          marginRight: 6,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Código nuevo
```tsx
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.75)",
                          overflow: "hidden",
                        }}
                      >
                        <span style={{ color: meta.col, fontWeight: 700 }}>{meta.lbl}</span>
                        {e.note && (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 12,
                              display: "inline-block",
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              verticalAlign: "bottom",
                            }}
                          >
                            {" "}
                            · {e.note}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          marginRight: 6,
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col, flexShrink: 0 }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
```

#### Por qué se cambió
Una nota larga sin espacios podía impedir que el bloque de texto se encogiera dentro de la fila flexible y desplazar fuera de la vista la hora y el importe. `minWidth: 0` permite el encogimiento del bloque textual, `textOverflow: "ellipsis"` limita la nota visible, `flexShrink: 0` conserva el espacio de hora e importe y `color: meta.col` aplica al nombre el color correspondiente a su categoría.

### Cambio 2 - Probar el límite visual de notas largas

#### Código anterior
`No existía la prueba Latest entries layout en src/__tests__/latest-entries-layout.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Latest entries layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("prevents long notes from pushing the time and amount out of the row", () => {
    const latestEntriesBlock = source.match(
      /<span>Últimas entradas<\/span>[\s\S]*?\{\[...current\.entries\][\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}[\s\S]*?<\/span>/
    )?.[0];

    expect(latestEntriesBlock).toBeDefined();
    expect(latestEntriesBlock).toMatch(/flex: 1,[\s\S]*?minWidth: 0,[\s\S]*?overflow: "hidden"/);
    expect(latestEntriesBlock).toMatch(/<span style=\{\{ color: meta\.col, fontWeight: 700 \}\}>\{meta\.lbl\}<\/span>/);
    expect(latestEntriesBlock).toMatch(/display: "inline-block"[\s\S]*?maxWidth: "100%"[\s\S]*?overflow: "hidden"[\s\S]*?textOverflow: "ellipsis"[\s\S]*?whiteSpace: "nowrap"/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
  });
});
```

#### Por qué se cambió
La prueba verifica que el bloque "Últimas entradas" conserva las reglas de estilo necesarias para que una nota larga no empuje la hora ni el importe fuera de la fila y para que el nombre use el color de su categoría.

### Cambio 3 - Añadir metadatos de tipos de entrada

#### Código anterior
`No existía EntryTypeMeta ni getEntryTypeMeta en src/main.tsx.`

#### Código nuevo
```tsx
type EntryTypeMeta = {
  color: string;
  label: string;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  const metaByType: Record<string, EntryTypeMeta> = {
    propina: { color: G, label: "Propina" },
    datafono: { color: P, label: "Datáfono" },
    agencia_bono: { color: A, label: "Agencia/Bono" },
    extra: { color: E, label: "Extra" },
    gasolina: { color: F, label: "Gasolina" },
    nulo: { color: N, label: "Nulo" },
    nota: { color: "white", label: "Nota" },
  };

  return metaByType[type] || { color: N, label: "Nulo" };
}
```

#### Por qué se cambió
Centralizar la etiqueta visible y el color de cada tipo evita que pantallas distintas muestren el valor interno `agencia_bono` y permite usar siempre `Agencia/Bono` como texto de presentación.

### Cambio 4 - Etiquetar notas detalladas del resumen

#### Código anterior
```tsx
                  {entriesWithNotes.map((e: any) => {
                    const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : e.type === 'agencia_bono' ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{e.time}</span>
                        <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: 'uppercase', minWidth: 60 }}>{e.type}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{e.note}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
```

#### Código nuevo
```tsx
                  {entriesWithNotes.map((e: any) => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                        <span style={{ fontWeight: 900, color: meta.color, fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
```

#### Por qué se cambió
El resumen del turno imprimía `e.type` literalmente, por lo que `agencia_bono` podía mostrarse como `AGENCIA_BONO` al aplicar `textTransform: 'uppercase'`. Usar `meta.label` muestra `Agencia/Bono`; `gridTemplateColumns: 'auto auto minmax(0, 1fr) auto'` evita el hueco de una columna fija y mantiene la nota como única columna flexible.

### Cambio 5 - Etiquetar notas detalladas al terminar turno

#### Código anterior
```tsx
                {entriesWithNotes.map(e => {
                  const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : (e.type === 'agencia_bono') ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{e.time}</span>
                      <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: "uppercase", minWidth: 60 }}>{e.type === 'agencia_bono' ? 'agencia/bono' : e.type}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{e.note}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{fmt(e.amount)}</span>
                    </div>
                  );
                })}
```

#### Código nuevo
```tsx
                {entriesWithNotes.map(e => {
                  const meta = getEntryTypeMeta(e.type);
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{e.time}</span>
                      <span style={{ fontWeight: 900, color: meta.color, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                    </div>
                  );
                })}
```

#### Por qué se cambió
La pantalla de terminar turno tenía una conversión local solo para `agencia_bono`, pero seguía usando valores internos para el resto de tipos. El helper común evita etiquetas técnicas y el grid de columnas automáticas elimina huecos artificiales sin desproteger la nota larga.

### Cambio 6 - Etiquetar notas detalladas semanales

#### Código anterior
```tsx
          {notasDetalladas.map((entry) => {
            const meta = entry.type === "propina" ? { color: G, label: "Propina" }
              : entry.type === "datafono" ? { color: P, label: "Datafono" }
                : entry.type === "agencia_bono" ? { color: A, label: "Agencia/Bono" }
                  : entry.type === "extra" ? { color: E, label: "Extra" }
                    : entry.type === "gasolina" ? { color: F, label: "Gasolina" }
                      : { color: N, label: "Nulo" };
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>{entry.time}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: meta.color, textTransform: "uppercase", minWidth: 58 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.35, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(entry.amount)}</span>
              </div>
            );
          })}
```

#### Código nuevo
```tsx
          {notasDetalladas.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0 }}>{entry.time}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: meta.color, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.35, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
              </div>
            );
          })}
```

#### Por qué se cambió
Las notas detalladas del detalle semanal tenían una conversión local duplicada y una etiqueta `Datafono` sin tilde. El helper común unifica las etiquetas visibles y el grid con `minmax(0, 1fr)` evita desbordes sin reservar un ancho fijo excesivo para etiquetas cortas.

### Cambio 7 - Probar etiquetas de notas detalladas

#### Código anterior
`No existía la prueba Detailed notes layout en src/__tests__/detailed-notes-layout.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("uses display labels and constrained flex rows for detailed entry notes", () => {
    expect(source).toMatch(/function getEntryTypeMeta\(type: string\)/);
    expect(source).toMatch(/agencia_bono:[\s\S]*?label: "Agencia\/Bono"/);
    expect(source).not.toContain("{e.type}</span>");
    expect(source).not.toContain("{e.type === 'agencia_bono' ? 'agencia/bono' : e.type}</span>");

    const detailedRows = [
      /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
    ];

    for (const rowPattern of detailedRows) {
      const block = source.match(rowPattern)?.[0];
      expect(block).toBeDefined();
      expect(block).toMatch(/getEntryTypeMeta\(/);
      expect(block).toMatch(/display: ['"]grid['"]/);
      expect(block).toMatch(/gridTemplateColumns: ['"]auto auto minmax\(0, 1fr\) auto['"]/);
      expect(block).toMatch(/minWidth: 0/);
      expect(block).toMatch(/flexShrink: 0/);
      expect(block).toMatch(/overflowWrap: "anywhere"/);
      expect(block).not.toMatch(/minWidth: 76/);
    }
  });
});
```

#### Por qué se cambió
La prueba fija que las notas detalladas usan etiquetas de presentación, no valores internos como `agencia_bono`, y que las filas usan grid sin `minWidth: 76` para evitar huecos en etiquetas cortas.

### Cambio 8 - Aplicar grid a Entradas de hoy

#### Código anterior
```tsx
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 13,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  {meta.ic}
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                    {meta.lbl}
                    {e.note && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}> · {e.note}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginRight: 8 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.col }}>+{fmt(e.amount)}</span>
```

#### Código nuevo
```tsx
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                    alignItems: "baseline",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 13,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {meta.ic}
                    <span style={{ color: meta.col, fontSize: 15, fontWeight: 700 }}>{meta.lbl}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.col, whiteSpace: "nowrap", flexShrink: 0 }}>+{fmt(e.amount)}</span>
```

#### Por qué se cambió
El historial de "Entradas de hoy" mantenía el tipo y la nota dentro del mismo bloque flexible, por lo que una nota larga sin espacios podía salirse horizontalmente. El grid separa el grupo icono-nombre, la nota, la hora y el importe; el grupo icono-nombre usa `inline-flex` con `alignItems: "center"` para mantener ambos centrados.

### Cambio 9 - Aplicar grid a Últimas entradas

#### Código anterior
```tsx
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
                      {meta.ic}
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.75)",
                          overflow: "hidden",
                        }}
                      >
                        <span style={{ color: meta.col, fontWeight: 700 }}>{meta.lbl}</span>
                        {e.note && (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 12,
                              display: "inline-block",
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              verticalAlign: "bottom",
                            }}
                          >
                            {" "}
                            · {e.note}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          marginRight: 6,
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
```

#### Código nuevo
```tsx
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                        alignItems: "baseline",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {meta.ic}
                        <span style={{ color: meta.col, fontSize: 14, fontWeight: 700 }}>{meta.lbl}</span>
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          flexShrink: 0,
                        }}
                      >
                        {e.time}
                      </span>
```

#### Por qué se cambió
La nota de "Últimas entradas" usaba `maxWidth: "100%"` dentro del mismo bloque que el nombre de categoría, así que el cálculo de corte no descontaba el ancho del nombre. El grid evita ese cálculo incorrecto y el grupo `inline-flex` mantiene icono y nombre centrados entre sí.

### Cambio 10 - Probar grid en entradas actuales

#### Código anterior
```ts
    expect(latestEntriesBlock).toMatch(/flex: 1,[\s\S]*?minWidth: 0,[\s\S]*?overflow: "hidden"/);
    expect(latestEntriesBlock).toMatch(/<span style=\{\{ color: meta\.col, fontWeight: 700 \}\}>\{meta\.lbl\}<\/span>/);
    expect(latestEntriesBlock).toMatch(/display: "inline-block"[\s\S]*?maxWidth: "100%"[\s\S]*?overflow: "hidden"[\s\S]*?textOverflow: "ellipsis"[\s\S]*?whiteSpace: "nowrap"/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
```

#### Código nuevo
```ts
    expect(latestEntriesBlock).toBeDefined();
    expect(latestEntriesBlock).toMatch(/display: "grid"[\s\S]*?gridTemplateColumns: "auto minmax\(0, 1fr\) auto auto"/);
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.ic\}[\s\S]*?color: meta\.col[\s\S]*?\{meta\.lbl\}/);
    expect(latestEntriesBlock).toMatch(/overflowWrap: "anywhere"/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
  });

  it("uses the same constrained grid pattern in today's editable entries", () => {
    const todayHistoryBlock = source.match(
      /if \(screen === "todayHistory"\) \{[\s\S]*?\{\[...current\.entries\]\.reverse\(\)\.map\(\(e\) => \{[\s\S]*?\+\{fmt\(e\.amount\)\}[\s\S]*?<\/span>/
    )?.[0];

    expect(todayHistoryBlock).toBeDefined();
    expect(todayHistoryBlock).toMatch(/display: "grid"[\s\S]*?gridTemplateColumns: "auto minmax\(0, 1fr\) auto auto"/);
    expect(todayHistoryBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.ic\}[\s\S]*?color: meta\.col[\s\S]*?\{meta\.lbl\}/);
    expect(todayHistoryBlock).toMatch(/overflowWrap: "anywhere"/);
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\{e\.time\}/);
    expect(todayHistoryBlock).toMatch(/flexShrink: 0[\s\S]*?\+\{fmt\(e\.amount\)\}/);
```

#### Por qué se cambió
La prueba ahora cubre tanto "Últimas entradas" como "Entradas de hoy" para que ambas usen el mismo patrón de grid sin desbordes de notas largas.

## 2026-05-17 22:46 - Simplificar edición de entradas y limpiar botones

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Añadir texto informativo en Entradas de hoy

#### Código anterior
```tsx
          Entradas de hoy
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
```

#### Código nuevo
```tsx
          Entradas de hoy
        </div>
      </div>
      {current.entries.length > 0 && (
        <div style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.4)",
          marginTop: -8,
          marginBottom: 2,
          fontStyle: "italic",
        }}>
          Toca una entrada para editar
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
```

#### Por qué se cambió
Añadir una indicación visual instructiva para que el usuario sepa que ahora puede tocar directamente las tarjetas para editarlas.

### Cambio 2 - Hacer interactivas las tarjetas de Entradas de hoy y retirar lápiz individual

#### Código anterior
```tsx
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 13,
                padding: "10px 14px",
              }}
            >
              {meta.ic}
              <div style={{ flex: 1, paddingLeft: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                  {e.type}
                </div>
                {e.note && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                    {e.note}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginRight: 8 }}>{e.time}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: meta.col }}>+{fmt(e.amount)}</span>
              <button
                onClick={() => openEditEntry(e)}
                title="Editar entrada"
                aria-label="Editar entrada"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: 7,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 8,
                }}
              >
                <IconPencilNeon />
              </button>
            </div>
```

#### Código nuevo
```tsx
            <div
              key={e.id}
              onClick={() => openEditEntry(e)}
              role="button"
              tabIndex={0}
              title="Editar entrada"
              aria-label="Editar entrada"
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  openEditEntry(e);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 13,
                padding: "10px 14px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(ev) => {
                (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(ev) => {
                (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
              }}
            >
              {meta.ic}
              <div style={{ flex: 1, paddingLeft: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                  {e.type}
                </div>
                {e.note && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                    {e.note}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginRight: 8 }}>{e.time}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: meta.col }}>+{fmt(e.amount)}</span>
            </div>
```

#### Por qué se cambió
Simplificar la interacción de edición. Al hacer que toda la tarjeta sea cliqueable (con cursor de tipo pointer y efectos de brillo al hacer hover), se elimina el botón de lápiz individual redundante, mejorando el diseño visual de la tarjeta y su accesibilidad (roles, tabIndex y teclado).

### Cambio 3 - Reubicar el botón de edición de entradas en Últimas entradas

#### Código anterior
```tsx
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 10,
        }}
      >
        Últimas entradas
      </div>
      {current.entries.length === 0 ? (
```

#### Código nuevo
```tsx
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Últimas entradas</span>
        {current.entries.length > 0 && (
          <button
            onClick={() => setScreen("todayHistory")}
            title="Editar entradas"
            aria-label="Editar entradas"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 7,
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
              cursor: "pointer",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPencilNeon />
          </button>
        )}
      </div>
      {current.entries.length === 0 ? (
```

#### Por qué se cambió
Proporcionar un único punto de acceso de edición limpio desde el panel principal. El botón de lápiz general se ubica al lado del título "Últimas entradas", sirviendo como atajo para ir a la pantalla de historial del día donde se pueden gestionar todas las entradas.

### Cambio 4 - Remover botones de lápiz individuales y enlace Ver todas en Últimas entradas

#### Código anterior
```tsx
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: e.type === "nota" ? "rgba(255,255,255,0.3)" : meta.col,
                    }}
                  >
                    {e.type !== "nota" && `+${fmt(e.amount)}`}
                  </span>
                  <button
                    onClick={() => openEditEntry(e)}
                    title="Editar entrada"
                    aria-label="Editar entrada"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      borderRadius: 7,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                      cursor: "pointer",
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 6,
                    }}
                  >
                    <IconPencilNeon />
                  </button>
                </div>
              );
            })}
          {current.entries.length > 4 && (
            <button
              onClick={() => setScreen("todayHistory")}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                fontSize: 13,
                cursor: "pointer",
                padding: "4px 0",
                textAlign: "left",
              }}
            >
              Ver todas ({current.entries.length}) →
            </button>
          )}
        </div>
      )}
```

#### Código nuevo
```tsx
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: e.type === "nota" ? "rgba(255,255,255,0.3)" : meta.col,
                    }}
                  >
                    {e.type !== "nota" && `+${fmt(e.amount)}`}
                  </span>
                </div>
              );
            })}
        </div>
      )}
```

#### Por qué se cambió
Limpiar visualmente la lista rápida de "Últimas entradas". Al mover el acceso de edición a la cabecera del panel y permitir editar todas de forma organizada, los botones de lápiz individuales por cada elemento y el enlace inferior se vuelven obsoletos, descongestionando el espacio del panel principal.

## 2026-05-17 16:45 - Aumentar legibilidad de fechas en tarjetas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/responsive-title-fonts.test.ts`

### Cambio 1 - Aumentar tamaño responsive del título de resumen de turno

#### Código anterior
```tsx
fontSize: "clamp(15px, 4.2vw, 20px)",
```

#### Código nuevo
```tsx
fontSize: "clamp(17px, 4.6vw, 22px)",
```

#### Por qué se cambió
Se cambió `clamp(15px, 4.2vw, 20px)` por `clamp(17px, 4.6vw, 22px)` porque en la captura del resumen de turno la fecha se veía demasiado pequeña para su papel como encabezado de la tarjeta.

### Cambio 2 - Aumentar tamaño responsive del rango de fechas de detalle de semana

#### Código anterior
```tsx
fontSize: "clamp(15px, 4.2vw, 20px)",
```

#### Código nuevo
```tsx
fontSize: "clamp(17px, 4.6vw, 22px)",
```

#### Por qué se cambió
Se cambió `clamp(15px, 4.2vw, 20px)` por `clamp(17px, 4.6vw, 22px)` para que el rango de fechas del detalle de semana mantenga la misma legibilidad visual que el título de resumen de turno.

### Cambio 3 - Actualizar comprobación literal del tamaño responsive

#### Código anterior
```tsx
expect(source).toMatch(
  /aria-label="Fecha del turno"[\s\S]*?fontSize: "clamp\(15px, 4\.2vw, 20px\)"/
);
expect(source).toMatch(
  /aria-label="Rango de fechas de la semana"[\s\S]*?fontSize: "clamp\(15px, 4\.2vw, 20px\)"/
);
```

#### Código nuevo
```tsx
expect(source).toMatch(
  /aria-label="Fecha del turno"[\s\S]*?fontSize: "clamp\(17px, 4\.6vw, 22px\)"/
);
expect(source).toMatch(
  /aria-label="Rango de fechas de la semana"[\s\S]*?fontSize: "clamp\(17px, 4\.6vw, 22px\)"/
);
```

#### Por qué se cambió
Se actualizó la comprobación literal para que valide el nuevo valor `clamp(17px, 4.6vw, 22px)` que quedó aplicado en los dos títulos.

## 2026-05-17 14:30 - Añadir IconNoteAdd y ajustar tipografía responsive

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Añadir componente IconNoteAdd

#### Código anterior
```txt
No existía el componente `IconNoteAdd` en `src/main.tsx`.
```

#### Código nuevo
```tsx
const IconNoteAdd = ({ s = 20, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
      strokeWidth="1.5"
      style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
    />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h10.5" strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 11.25h6" strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M3.75 15.75H7.5" strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5"
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
  </svg>
);
```

#### Por qué se cambió
Se añadió `IconNoteAdd` para disponer de un icono SVG propio de nota con símbolo de añadir y efecto de brillo, reutilizable en el botón `Añadir Nota al Turno`.

### Cambio 2 - Sustituir emoji por IconNoteAdd en el botón Añadir Nota al Turno

#### Código anterior
```tsx
style={{
  width: "100%",
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.6)",
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  transition: "all 0.2s"
}}
>
  <span style={{ fontSize: 18 }}>📝</span> Añadir Nota al Turno
</button>
```

#### Código nuevo
```tsx
style={{
  width: "100%",
  height: 48,
  padding: "0 16px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.6)",
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "all 0.2s"
}}
>
  <IconNoteAdd s={26} /> Añadir Nota al Turno
</button>
```

#### Por qué se cambió
Se cambió el emoji `📝` por `IconNoteAdd` para usar un icono SVG propio con estilo neón. También se cambió el padding por `height: 48` y `padding: "0 16px"` para que el botón tenga una altura fija y más estable.

### Cambio 3 - Corregir filtros de brillo en IconNoteAdd

#### Código anterior
```tsx
style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c}66)` }}
```

```tsx
style={{ filter: `drop-shadow(0 0 1px ${c}88)` }}
```

#### Código nuevo
```tsx
style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
```

```tsx
style={{ filter: `drop-shadow(0 0 1px ${c})` }}
```

#### Por qué se cambió
Se eliminaron los sufijos `${c}66` y `${c}88` porque `c` puede ser un color `oklch(...)`, y concatenar esos sufijos genera un valor CSS inválido.

### Cambio 4 - Ajustar tamaño responsive del título de resumen de turno

#### Código anterior
```tsx
fontSize: "clamp(10px, 3.4cqw, 17px)",
```

#### Código nuevo
```tsx
fontSize: "clamp(15px, 4.2vw, 20px)",
```

#### Por qué se cambió
Se cambió el tamaño anterior por `clamp(15px, 4.2vw, 20px)` para que el título de fecha del resumen mantenga legibilidad y se adapte mejor al ancho del móvil.

### Cambio 5 - Ajustar tamaño responsive del título de detalle de semana

#### Código anterior
```tsx
fontSize: 20,
```

#### Código nuevo
```tsx
fontSize: "clamp(15px, 4.2vw, 20px)",
```

#### Por qué se cambió
Se cambió el tamaño fijo `20` por `clamp(15px, 4.2vw, 20px)` para que el rango de fechas de la semana use el mismo comportamiento responsive que el título del resumen de turno.

