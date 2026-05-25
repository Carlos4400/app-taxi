# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió. Las entradas se añaden al **principio** del archivo (las más recientes arriba).

## 2026-05-26 00:00 - Extraer pantalla de datapropina a src/screens/add-entry-screen.tsx

**Archivos modificados:** `src/screens/add-entry-screen.tsx`, `src/main.tsx`

### Cambio 1 - Pantalla de datapropina extraída

#### Código anterior
`No existía src/screens/add-entry-screen.tsx.`

#### Código nuevo
```tsx
import { type FC } from "react";
import { Shell } from "../components/shell";
import { G, P } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { CurrentState, Entry } from "../shared/types";

interface AddEntryScreenProps {
  activeField: string;
  setActiveField: React.Dispatch<React.SetStateAction<string>>;
  valP: string;
  setValP: React.Dispatch<React.SetStateAction<string>>;
  valD: string;
  setValD: React.Dispatch<React.SetStateAction<string>>;
  noteP: string;
  setNoteP: React.Dispatch<React.SetStateAction<string>>;
  noteD: string;
  setNoteD: React.Dispatch<React.SetStateAction<string>>;
  setCurrent: React.Dispatch<React.SetStateAction<CurrentState>>;
  setScreen: React.Dispatch<React.SetStateAction<string>>;
}

export const AddEntryScreen: FC<AddEntryScreenProps> = ({
  activeField, setActiveField, valP, setValP, valD, setValD,
  noteP, setNoteP, noteD, setNoteD, setCurrent, setScreen,
}) => {
  const setVal = activeField === "propina" ? setValP : setValD;
  const curVal = activeField === "propina" ? valP : valD;

  function kpAdd(v: string) {
    if (v === "DEL") { setVal((p) => p.slice(0, -1)); return; }
    if (v === ",") { if (!curVal.includes(",")) setVal((p) => p + ","); return; }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }

  function handleSaveAdd() {
    const p = parseFloat(valP.replace(",", "."));
    const d = parseFloat(valD.replace(",", "."));
    if (isNaN(p) && isNaN(d)) return;
    const now = timeNow();
    const newEntries: Entry[] = [];
    if (!isNaN(p) && p > 0) newEntries.push({ id: Date.now(), type: "propina", amount: p, note: noteP.trim(), time: now });
    if (!isNaN(d) && d > 0) newEntries.push({ id: Date.now() + 1, type: "datafono", amount: d, note: noteD.trim(), time: now });
    if (newEntries.length === 0) return;
    setCurrent((prev) => ({ ...prev, startTime: prev.startTime || now, startDate: prev.startDate || today(), entries: [...prev.entries, ...newEntries] }));
    setValP(""); setValD(""); setNoteP(""); setNoteD("");
    setScreen("main");
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button style={iconBtnStyle} onClick={() => setScreen("main")}><IconBack /></button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
            Añadir {activeField === "propina" ? "Propina" : "Datáfono"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div onClick={() => setActiveField("datafono")} style={{ flex: 1, padding: "16px", borderRadius: 16, background: activeField === "datafono" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${activeField === "datafono" ? P : "transparent"}`, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>DATÁFONO</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "datafono" ? P : "white" }}>{valD || "0"} €</div>
          </div>
          <div onClick={() => setActiveField("propina")} style={{ flex: 1, padding: "16px", borderRadius: 16, background: activeField === "propina" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${activeField === "propina" ? G : "transparent"}`, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>PROPINA</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "propina" ? G : "white" }}>{valP || "0"} €</div>
          </div>
        </div>
        <input placeholder={`Nota para ${activeField} (opcional)`} value={activeField === "propina" ? noteP : noteD}
          onChange={(e) => activeField === "propina" ? setNoteP(e.target.value) : setNoteD(e.target.value)}
          style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "none", color: "white", marginBottom: 12, outline: "none", flexShrink: 0 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flexShrink: 0 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
            <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
              onClick={() => kpAdd(k)} style={{ ...keyBtnStyle, padding: "20px 0", background: "rgba(255,255,255,0.05)", fontSize: 22, fontWeight: 700, color: "white" }}>
              {k === "DEL" ? <IconDel /> : k}
            </button>
          ))}
        </div>
        <button onClick={handleSaveAdd}
          style={{ width: "100%", padding: 18, marginTop: 12, borderRadius: 16, border: "none", background: activeField === "propina" ? G : P, color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>
          Guardar
        </button>
      </div>
    </Shell>
  );
};
```

#### Por qué se cambió
La pantalla `screen === "add"` (~106 líneas) es el teclado principal para añadir datapropina y propina. Extraerla a `src/screens/add-entry-screen.tsx` reduce `main.tsx` con frontera clara y 12 props.

### Cambio 2 - Reemplazar bloque ad en main.tsx

#### Código anterior
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";

if (screen === "add") {
  const setVal = activeField === "propina" ? setValP : setValD;
  const curVal = activeField === "propina" ? valP : valD;
  function kpAdd(v: string) {
    if (v === "DEL") { setVal((p) => p.slice(0, -1)); return; }
    if (v === ",") { if (!curVal.includes(",")) setVal((p) => p + ","); return; }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }
  function handleSveAdd() { /* creaba entradas tipo datapropina/propina */ }
  return (
    <Shell burst={false}>
      <div>...teclado datapropina con display, campo nota y botón guardar...</div>
    </Shell>
  );
}
```

#### Código nuevo
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";

if (screen === "add") {
  return (
    <AddEntryScreen
      activeField={activeField} setActiveField={setActiveField}
      valP={valP} setValP={setValP} valD={valD} setValD={setValD}
      noteP={noteP} setNoteP={setNoteP} noteD={noteD} setNoteD={setNoteD}
      setCurrent={setCurrent} setScreen={setScreen}
    />
  );
}
```

#### Por qué se cambió
El bloque inline que contenía las funciones kpAdd y handleSaveAdd y el JSX del teclado datapropina se reemplazó por el componente extraído.

## 2026-05-25 23:54 - Extraer pantalla de nota general a src/screens/add-nota-general-screen.tsx

**Archivos modificados:** `src/screens/add-nota-general-screen.tsx`, `src/main.tsx`

### Cambio 1 - Pantalla de nota general extraída

#### Código anterior
`No existía src/screens/add-nota-general-screen.tsx.`

#### Código nuevo
```tsx
import { type FC } from "react";
import { Shell } from "../components/shell";
import type { CurrentState } from "../shared/types";

interface AddNotaGeneralScreenProps {
  noteS: string;
  setNoteS: React.Dispatch<React.SetStateAction<string>>;
  setCurrent: React.Dispatch<React.SetStateAction<CurrentState>>;
  setScreen: React.Dispatch<React.SetStateAction<string>>;
}

export const AddNotaGeneralScreen: FC<AddNotaGeneralScreenProps> = ({
  noteS, setNoteS, setCurrent, setScreen,
}) => {
  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "12px 20px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", animation: "slideIn 0.25s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexShrink: 0 }}>
          <button style={iconBtnStyle} onClick={() => { setScreen("main"); setNoteS(""); }}><IconBack /></button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Añadir Nota</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <textarea placeholder="Escribe algo sobre el Turno..." value={noteS}
            onChange={(e) => setNoteS(e.target.value)}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 16, padding: 16, color: "white", fontSize: 16, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
        </div>
        <button onClick={() => {
          if (noteS.trim()) {
            const newEntry = { id: Date.now(), type: "nota" as const, amount: 0, note: noteS.trim(),
              time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) };
            setCurrent(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
          }
          setNoteS(""); setScreen("main");
        }}
          style={{ width: "100%", padding: 18, marginTop: 16, borderRadius: 16, border: "none", background: "white", color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>
          Añadir al Turno
        </button>
      </div>
    </Shell>
  );
};
```

#### Por qué se cambió
La pantalla `addNotaGeneral` es una responsabilidad autocontenida (campo de texto para nota + botón añadir). Extraerla a `src/screens/add-nota-general-screen.tsx` reduce `main.tsx` en ~56 líneas con frontera clara y 4 props.

### Cambio 2 - Reemplazar bloque addNotaGeneral en main.tsx

#### Código anterior
```tsx
import { AddNotaGeneralScreen } from "./screens/add-nota-general-screen";

if (screen === "addNotaGeneral") {
  return (
    <Shell burst={false}>
      <div>...textarea y botón...</div>
    </Shell>
  );
}
```

#### Código nuevo
```tsx
import { AddNotaGeneralScreen } from "./screens/add-nota-general-screen";

if (screen === "addNotaGeneral") {
  return (
    <AddNotaGeneralScreen
      noteS={noteS} setNoteS={setNoteS}
      setCurrent={setCurrent} setScreen={setScreen}
    />
  );
}
```

#### Por qué se cambió
El bloque inline se reemplazó por el componente extraído.

## 2026-05-25 23:47 - Extraer pantalla de entrada individual a src/screens/add-single-entry-screen.tsx

**Archivos modificados:** `src/screens/add-single-entry-screen.tsx`, `src/main.tsx`

### Cambio 1 - Pantalla de entrada individual extraída

#### Código anterior
`No existía src/screens/add-single-entry-screen.tsx.`

#### Código nuevo
```tsx
import { type FC, type CSSProperties } from "react";
import { Shell } from "../components/shell";
import { A, ABG, E, EBG, F, FBG, N, NBG } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { Entry } from "../shared/types";

type SingleMode = "agencia_bono" | "extra" | "gasolina" | "nulo";

interface AddSingleEntryScreenProps {
  singleMode: SingleMode;
  valS: string;
  setValS: React.Dispatch<React.SetStateAction<string>>;
  noteS: string;
  setNoteS: React.Dispatch<React.SetStateAction<string>>;
  setCurrent: React.Dispatch<React.SetStateAction<import("../shared/types").CurrentState>>;
  setSingleMode: React.Dispatch<React.SetStateAction<string | null>>;
  setScreen: React.Dispatch<React.SetStateAction<string>>;
}

export const AddSingleEntryScreen: FC<AddSingleEntryScreenProps> = ({
  singleMode, valS, setValS, noteS, setNoteS,
  setCurrent, setSingleMode, setScreen,
}: AddSingleEntryScreenProps) => {
  const cfg = {
    agencia_bono: { accent: A, bg: ABG, label: "Agencia/Bono" },
    extra: { accent: E, bg: EBG, label: "Extra" },
    gasolina: { accent: F, bg: FBG, label: "Gasolina" },
    nulo: { accent: N, bg: NBG, label: "Nulo" },
  }[singleMode] || { accent: E, bg: EBG, label: "Extra" };

  const { accent } = cfg;
  const label = cfg.label;

  function kpS(v: string) {
    if (v === "DEL") { setValS((p) => p.slice(0, -1)); return; }
    if (v === ",") { if (!valS.includes(",")) setValS((p) => p + ","); return; }
    if (valS.replace(",", "").length >= 6) return;
    setValS((p) => p + v);
  }

  const validS = valS && parseFloat(valS.replace(",", ".")) > 0;

  function saveS() {
    if (!validS) return;
    const now = timeNow();
    const entry: Entry = { id: Date.now(), type: singleMode, amount: parseFloat(valS.replace(",", ".")), note: noteS.trim(), time: now };
    setCurrent((prev) => ({ ...prev, startTime: prev.startTime || now, startDate: prev.startDate || today(), entries: [...prev.entries, entry] }));
    setValS(""); setNoteS(""); setSingleMode(null); setScreen("main");
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button style={iconBtnStyle} onClick={() => { setScreen("main"); setSingleMode(null); setValS(""); setNoteS(""); }}><IconBack /></button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Añadir {label}</div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: accent, marginBottom: 16, flexShrink: 0 }}>{valS || "0"} €</div>
        <input placeholder="Nota (opcional)" value={noteS} onChange={(e) => setNoteS(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "white", outline: "none", flexShrink: 0, marginBottom: 12 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flexShrink: 0 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
            <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
              onClick={() => kpS(k)} style={{ ...keyBtnStyle, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
              {k === "DEL" ? <IconDel /> : k}
            </button>
          ))}
        </div>
        <button onClick={saveS}
          style={{ width: "100%", padding: 15, marginTop: 12, borderRadius: 12, border: "none", background: accent, color: "black", fontWeight: 700, flexShrink: 0 }}>
          Guardar
        </button>
      </div>
    </Shell>
  );
};
```

#### Por qué se cambió
La pantalla de entrada individual es una responsabilidad autocontenida (teclado numérico para Agency/Bono, Extra, Gasolina o Nulo). Extraerla a `src/screens/add-single-entry-screen.tsx` reduce `main.tsx` en ~78 líneas con frontera clara.

### Cambio 2 - Reemplazar bloque addSingle en main.tsx

#### Código anterior
```tsx
import { AddSingleEntryScreen } from "./screens/add-single-entry-screen";

if (screen === "addSingle" && singleMode) {
  const cfg = { agencia_bono: { accent: A, bg: ABG, label: "Agencia/Bono" }, ... };
  function kpS(v: string) { /* lógica del teclado */ }
  function saveS() { /* guardaba entrada */ }
  return (
    <Shell burst={false}>
      <div>...teclado Agencia/Bono, Extra, Gasolina o Nulo...</div>
    </Shell>
  );
}
```

#### Código nuevo
```tsx
import { AddSingleEntryScreen } from "./screens/add-single-entry-screen";

if (screen === "addSingle" && singleMode) {
  return (
    <AddSingleEntryScreen
      singleMode={singleMode as "agencia_bono" | "extra" | "gasolina" | "nulo"}
      valS={valS} setValS={setValS} noteS={noteS} setNoteS={setNoteS}
      setCurrent={setCurrent} setSingleMode={setSingleMode} setScreen={setScreen}
    />
  );
}
```

#### Por qué se cambió
El bloque inline con funciones kpS y saveS y el JSX del teclado se reemplazó por el componente extraído.

## 2026-05-25 23:16 - Extraer IconPlay e IconPause a turno-control-icons.tsx

**Archivos modificados:** `src/components/turno-control-icons.tsx`, `src/main.tsx`

### Cambio 1 - IconPlay e IconPause extraídos

#### Código anterior
`No existía src/components/turno-control-icons.tsx.`

#### Código nuevo
```tsx
import type { FC } from 'react';

export const IconPlay: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M8 5.5L18.5 12L8 18.5V5.5Z" fill={c} />
  </svg>
);

export const IconPause: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="6.5" y="5" width="4.2" height="14" rx="1.7" fill={c} />
    <rect x="13.3" y="5" width="4.2" height="14" rx="1.7" fill={c} />
  </svg>
);
```

#### Por qué se cambió
IconPlay e IconPause se copiaban en línea dentro de main.tsx. Extraerlos a `src/components/turno-control-icons.tsx` elimina ~12 líneas duplicadas y centraliza los iconos del control de turno.

### Cambio 2 - Reemplazar los iconos inline en main.tsx

#### Código anterior
```tsx
// Inline en main.tsx (~12 líneas de definición por cada icono)
```

#### Código nuevos
```tsx
import { IconPlay } from "./components/turno-control-icons";
import { IconPause } from "./components/turno-control-icons";
```

#### Por qué se cambió
Los iconos inline se sustituyen por los imports de los componentes extraídos.

## 2026-05-25 22:30 - Extraer fmt a src/logic/formatters.ts

**Archivos modificados:** `src/logic/formatters.ts`, `src/main.tsx`

### Cambio 1 - Funciones fmt extraídas

#### Código anterior
`No existía src/logic/formatters.ts.`

#### Código nuevo
```ts
export const fmtKm = (km: number) =>
  `${km.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;

export const fmtMoney = (amount: number) =>
  `${amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
```

#### Por qué se cambió
Las funciones `fmtKm` y `fmtMoney` estaban definidas inline en `main.tsx`. Extraerlas a `src/logic/formatters.ts` las hace reutilizables y testeables.

### Cambio 2 - Reemplazar definiciones inline en main.tsx

#### Código anterior
```ts
// inline en main.tsx
const fmtKm = (km: number) => ...
const fmtMoney = (amount: number) => ...
```

#### Código nuevos
```ts
import { fmtKm, fmtMoney as fmtEuro } from "./logic/formatters";
```

#### Por qué se cambió
Las definiciones inline se sustituyen por los imports del módulo extraído.
