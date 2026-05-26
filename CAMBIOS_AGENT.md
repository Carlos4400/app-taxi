# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió. Las entradas se añaden al **principio** del archivo (las más recientes arriba).

## 2026-05-26 16:39 - Corregir notas detalladas al cerrar turno

**Archivos modificados:** `src/screens/confirm-end-screen.tsx`, `src/shared/entry-type-meta.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Metadata completa de tipos de entrada

#### Código anterior
```tsx
import { G, P, A, E, F, N } from "./ui-theme";
import { IconAgency } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";

export const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
};

export function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.agencia_bono;
}
```

#### Código nuevo
```tsx
import { G, P, A, E, F, N } from "./ui-theme";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";

export const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};

export function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}
```

#### Por qué se cambió
`ConfirmEndScreen` usaba esta metadata compartida para mostrar notas, pero el mapa solo contenía `agencia_bono` y cualquier otro tipo se etiquetaba como Agencia/Bono. Se restauró el mapa completo equivalente al comportamiento anterior de `main.tsx`.

### Cambio 2 - Notas detalladas en ConfirmEndScreen

#### Código anterior
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
```

```tsx
          {(() => {
            const gNotes = current.entries.filter(e => e.type === "nota");
            if (gNotes.length > 0) {
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
```

#### Código nuevo
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad, IconPinNeon } from "../components/summary-icons";
```

```tsx
          {(() => {
            const entriesWithNotes = current.entries.filter(e => e.type !== "nota" && e.note && e.note.trim());
            if (entriesWithNotes.length === 0) return null;
            return (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {entriesWithNotes.map(e => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                        <span style={NOTE_TIME_STYLE}>{e.time}</span>
                        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ color: meta.color, fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
```

#### Por qué se cambió
La extracción de `confirm-end-screen.tsx` había perdido la sección de notas detalladas para entradas con nota que no son de tipo `nota`. Se restauró esa sección siguiendo el `mainAntiguo.tsx` para que cerrar turno vuelva a mostrar notas de datáfono, propina, agencia, extras, gasolina y nulos.

### Cambio 3 - Test de layout adaptado a archivos extraídos

#### Código anterior
```ts
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

```ts
    const detailedRows = [
      /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/,
    ];

    for (const rowPattern of detailedRows) {
      const block = source.match(rowPattern)?.[0];
```

#### Código nuevo
```ts
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const entryTypeMetaSource = readFileSync(resolve("src/shared/entry-type-meta.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

```ts
    const detailedRows = [
      { source, pattern: /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/ },
      { source: confirmEndSource, pattern: /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/ },
      { source, pattern: /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/ },
    ];

    for (const { source: rowSource, pattern } of detailedRows) {
      const block = rowSource.match(pattern)?.[0];
```

#### Por qué se cambió
El test seguía buscando todos los bloques en `main.tsx`, aunque parte del código ahora vive en `confirm-end-screen.tsx` y la metadata compartida vive en `entry-type-meta.tsx`. Se adaptó la fuente inspeccionada sin cambiar la expectativa funcional.

## 2026-05-26 04:30 - Integrar pantallas extraídas en main.tsx

**Archivos modificados:** `src/main.tsx`, `src/screens/PantallaTurnos.tsx`

### Cambio 1 - Imports de pantallas en main.tsx

#### Código anterior
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";
import { Shell } from "./components/shell";
```

#### Código nuevo
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";
import { PantallaTurnos } from "./screens/PantallaTurnos";
import { TodayHistoryScreen } from "./screens/TodayHistoryScreen";
import { ConfirmEndScreen } from "./screens/ConfirmEndScreen";
import { Shell } from "./components/shell";
```

#### Por qué se cambió
Las pantallas extraídas en sesiones anteriores necesitaban ser importadas para su uso.

### Cambio 2 - Reemplazar bloque if PantallaTurnos con componente

#### Código anterior
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        </div>
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
      />
    );
  }
```

#### Por qué se cambió
Separación de responsabilidades: el bloque if de PantallaTurnos ahora usa el componente extraído.

### Cambio 3 - Reemplazar bloque if todayHistory con componente

#### Código anterior
```tsx
  if (screen === "todayHistory") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        </div>
        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
        {editEntry && (<EditEntryDialog />)}
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "todayHistory") {
    return (
      <TodayHistoryScreen
        current={current}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        editEntry={editEntry}
        editEntryAmount={editEntryAmount}
        editEntryNote={editEntryNote}
        setEditEntryAmount={setEditEntryAmount}
        setEditEntryNote={setEditEntryNote}
        openEditEntry={openEditEntry}
        saveEditEntry={saveEditEntry}
        deleteEditEntry={deleteEditEntry}
        setEditEntry={setEditEntry}
        setScreen={setScreen}
      />
    );
  }
```

#### Por qué se cambió
Separación de responsabilidades: el bloque if de todayHistory ahora usa el componente extraído.

### Cambio 4 - Reemplazar bloque if confirmEnd con componente

#### Código anterior
```tsx
  if (screen === "confirmEnd") {
    function kpEnd(v: string) { }
    return (
      <Shell burst={false}>
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "confirmEnd") {
    return (
      <ConfirmEndScreen
        current={current}
        dineroJ={dineroJ}
        setDineroJ={setDineroJ}
        kmJ={kmJ}
        setKmJ={setKmJ}
        endField={endField}
        setEndField={setEndField}
        totalP={totalP}
        totalD={totalD}
        totalA={totalA}
        totalE={totalE}
        totalF={totalF}
        totalN={totalN}
        propinas={propinas}
        datafonos={datafonos}
        agencias={agencias}
        extras={extras}
        gasolinas={gasolinas}
        nulos={nulos}
        onEndTurno={handleEndTurno}
        setScreen={setScreen}
      />
    );
  }
```

#### Por qué se cambió
Separación de responsabilidades: el bloque if de confirmEnd ahora usa el componente extraído con kpEnd inlined.

### Cambio 5 - Import de IconTaxiBadgeNeon e IconRoad corregido

#### Código anterior
```tsx
import { IconPencilNeon, IconTimer, IconMoneyBag, IconTaxiBadgeNeon, IconRoad } from "../components/calendar-icons";
```

#### Código nuevo
```tsx
import { IconPencilNeon, IconTimer, IconMoneyBag } from "../components/calendar-icons";
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
```

#### Por qué se cambió
IconTaxiBadgeNeon e IconRoad estaban mal importados desde calendar-icons, deben estar en summary-icons.

## 2026-05-26 03:15 - Extraer SettingsScreen a src/screens/settings-screen.tsx

**Archivos modificados:** `src/screens/settings-screen.tsx`, `src/components/settings-icons.tsx`, `src/components/summary-icons.tsx`, `src/main.tsx`

### Cambio 1 - Pantalla de ajustes extraída

#### Código anterior
`No existía src/screens/settings-screen.tsx.`

#### Código nuevo
```tsx
export const SettingsScreen: FC<SettingsScreenProps> = ({
  isAdmin, settings, setSettings, history, setHistory, current,
  weekOverrides, reservations, notes, activeSettingsField,
  setActiveSettingsField, settingsValStr, setSettingsValStr,
  showBackupMenu, setShowBackupMenu, confirmDialog, setConfirmDialog,
  updateState, updateMsg, downloadUrl, releaseUrl,
  setUpdateState, setUpdateMsg, setDownloadUrl, setReleaseUrl,
  onSetScreen,
}) => { ... }
```

#### Por qué se cambió
Separación de responsabilidades: la pantalla de ajustes ahora está en su propio archivo.

### Cambio 2 - Iconos de ajustes centralizados

#### Código anterior
`No existía src/components/settings-icons.tsx.`

#### Código nuevo
```tsx
export const IconReceipt = ({ s = 24, c = "white" }: { s?: number; c?: string }) => ( ... );
export const IconHoliday = ({ s = 24, c = "oklch(0.85 0.18 85)" }: { s?: number; c?: string }) => ( ... );
```

#### Por qué se cambió
IconReceipt e IconHoliday se usan en SettingsScreen y se extrajeron a su propio archivo de iconos.

### Cambio 3 - Iconos de resumen centralizados

#### Código anterior
`No existía src/components/summary-icons.tsx.`

#### Código nuevo
```tsx
export const IconGive = ( ... );
export const IconRoad = ( ... );
export const IconPinNeon = ( ... );
export const IconTaxiBadgeNeon = ( ... );
export const IconNoteAdd = ( ... );
```

#### Por qué se cambió
Iconos usados por SummaryScreen y posiblemente otros screens se centralizan para reutilización.

### Cambio 4 - Reemplazo del bloque settings en main.tsx

#### Código anterior
```tsx
if (screen === "settings") {
  const backupMenuActionIds = getBackupMenuActionIds(isAdmin);
  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", ... }}>
        {/* Bloque App Info */}
        {/* Bloque Porcentajes */}
        {/* Bloque Total a Descontar */}
        {/* Bloque Día Libre */}
        {/* Botón Añadir Turno */}
        {/* Menú Backup */}
      </div>
      {/* Modal de configuración de porcentaje */}
      {confirmDialog && <ConfirmDialog ... />}
    </Shell>
  );
}
```

#### Código nuevo
```tsx
if (screen === "settings") {
  return (
    <SettingsScreen
      isAdmin={isAdmin}
      settings={settings}
      setSettings={setSettings}
      history={history}
      setHistory={setHistory}
      current={current}
      weekOverrides={weekOverrides}
      reservations={reservations}
      notes={notes}
      activeSettingsField={activeSettingsField}
      setActiveSettingsField={setActiveSettingsField}
      settingsValStr={settingsValStr}
      setSettingsValStr={setSettingsValStr}
      showBackupMenu={showBackupMenu}
      setShowBackupMenu={setShowBackupMenu}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      updateState={updateState}
      updateMsg={updateMsg}
      downloadUrl={downloadUrl}
      releaseUrl={releaseUrl}
      setUpdateState={setUpdateState}
      setUpdateMsg={setUpdateMsg}
      setDownloadUrl={setDownloadUrl}
      setReleaseUrl={setReleaseUrl}
      onSetScreen={setScreen}
    />
  );
}
```

#### Por qué se cambió
El bloque if (screen === "settings") fue reemplazado por el componente SettingsScreen importado. Los IconReceipt e IconHoliday se mantienen en main.tsx porque SummaryScreen también los usa.

## 2026-05-26 02:00 - Extraer CalendarScreen a src/screens/calendar-screen.tsx

**Archivos modificados:** `src/screens/calendar-screen.tsx`, `src/components/calendar-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de calendario centralizados

#### Código anterior
`No existía src/components/calendar-icons.tsx.`

#### Código nuevo
```tsx
export const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* Definición SVG completa */}
  </svg>
);

export const IconTimer = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* Definición SVG completa */}
  </svg>
);

export const IconMoneyBag = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* Definición SVG completa */}
  </svg>
);
```

#### Por qué se cambió
Los iconos IconPencilNeon, IconTimer e IconMoneyBag eran definiciones inline en `main.tsx` usados exclusivamente por CalendarScreen. Extraerlos a `src/components/calendar-icons.tsx` centraliza iconos con responsabilidad clara.

### Cambio 2 - CalendarScreen extraída

#### Código anterior
`No existía src/screens/calendar-screen.tsx.`

#### Código nuevo
```tsx
import React from "react";
import { Shell } from "../components/shell";
import { ConfirmDialog } from "../components/common";
import { IconBack, IconCalendar } from "../components/navigation-icons";
import { IconPencilNeon, IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { fmt, fmtDuration } from "../logic/formatters";
import { getDiffMins, today } from "../logic/date-time";
import { getStartOffset, getDaysInMonth } from "../logic/calendar-date";
import { calcularTurnoContable } from "../logic/accounting";
import { C, G } from "../shared/ui-theme";
import type { AppSettings, NotaCalendario, NotaTipo, Reserva, Turno } from "../shared/types";

interface CalendarScreenProps {
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  calendarView: 'month' | 'agenda';
  setCalendarView: (v: 'month' | 'agenda') => void;
  showMonthPicker: boolean;
  setShowMonthPicker: React.Dispatch<React.SetStateAction<boolean>>;
  pickerYear: number;
  setPickerYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  showNotaDialog: boolean;
  setShowNotaDialog: (v: boolean) => void;
  notaTipo: NotaTipo;
  setNotaTipo: (t: NotaTipo) => void;
  notaTexto: string;
  setNotaTexto: (t: string) => void;
  editingNota: NotaCalendario | null;
  setEditingNota: (n: NotaCalendario | null) => void;
  notes: NotaCalendario[];
  setNotes: (n: NotaCalendario[] | ((prev: NotaCalendario[]) => NotaCalendario[])) => void;
  showReservaDialog: boolean;
  setShowReservaDialog: (v: boolean) => void;
  reservaTime: string;
  setReservaTime: (t: string) => void;
  reservaOrigen: string;
  setReservaOrigen: (o: string) => void;
  reservaDestino: string;
  setReservaDestino: (d: string) => void;
  reservaCliente: string;
  setReservaCliente: (c: string) => void;
  reservaTelefono: string;
  setReservaTelefono: (t: string) => void;
  reservaNotas: string;
  setReservaNotas: (n: string) => void;
  editingReserva: Reserva | null;
  setEditingReserva: (r: Reserva | null) => void;
  reservations: Reserva[];
  setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void;
  confirmDialog: { ... } | null;
  setConfirmDialog: (d: null | { ... }) => void;
  history: Turno[];
  settings: AppSettings;
  openNewReserva: (date?: string) => void;
}

export function CalendarScreen({ ... }: CalendarScreenProps) {
  // ~800 líneas de la pantalla calendario completa
}
```

#### Por qué se cambió
La pantalla de calendario (`screen === "calendar"`) era un bloque inline de ~767 líneas en `main.tsx`. Extraerla a `src/screens/calendar-screen.tsx` reduce significativamente el archivo principal y aísla la responsabilidad de calendario como componente independiente con frontera clara.

### Cambio 3 - Reemplazar bloque inline en main.tsx

#### Código anterior
```tsx
  if (screen === "calendar") {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = getStartOffset(year, month);
    return (
      <Shell burst={false}>
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "calendar") {
    return (
      <CalendarScreen
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        calendarView={calendarView}
        setCalendarView={setCalendarView}
        showMonthPicker={showMonthPicker}
        setShowMonthPicker={setShowMonthPicker}
        pickerYear={pickerYear}
        setPickerYear={setPickerYear}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showNotaDialog={showNotaDialog}
        setShowNotaDialog={setShowNotaDialog}
        notaTipo={notaTipo}
        setNotaTipo={setNotaTipo}
        notaTexto={notaTexto}
        setNotaTexto={setNotaTexto}
        editingNota={editingNota}
        setEditingNota={setEditingNota}
        notes={notes}
        setNotes={setNotes}
        showReservaDialog={showReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
        reservaTime={reservaTime}
        setReservaTime={setReservaTime}
        reservaOrigen={reservaOrigen}
        setReservaOrigen={setReservaOrigen}
        reservaDestino={reservaDestino}
        setReservaDestino={setReservaDestino}
        reservaCliente={reservaCliente}
        setReservaCliente={setReservaCliente}
        reservaTelefono={reservaTelefono}
        setReservaTelefono={setReservaTelefono}
        reservaNotas={reservaNotas}
        setReservaNotas={setReservaNotas}
        editingReserva={editingReserva}
        setEditingReserva={setEditingReserva}
        reservations={reservations}
        setReservations={setReservations}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        history={history}
        settings={settings}
        openNewReserva={openNewReserva}
      />
    );
  }
```

#### Por qué se cambió
El bloque inline de ~767 líneas se sustituye por el componente `CalendarScreen` importado. Los iconos IconPencilNeon, IconTimer e IconMoneyBag permanecen en `main.tsx` porque se usan en otras pantallas (no exclusivamente en calendario).

## 2026-05-26 01:28 - Extraer HomeScreen a src/screens/home-screen.tsx

**Archivos modificados:** `src/screens/home-screen.tsx`, `src/components/home-icons.tsx`, `src/main.tsx`

### Cambio 1 - HomeScreen extraída

#### Código anterior
`No existía src/screens/home-screen.tsx.`

#### Código nuevo
```tsx
export const HomeScreen: FC<HomeScreenProps> = ({
  isPaused,
  isAdmin,
  active,
  onSetScreen,
  onSetCalendarView,
  onOpenNewReserva,
  onSetAdminMode,
  onSetConfirmDialog,
  renderReservaDialog,
}) => {
  const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
  return (
    <Shell burst={false}>
    </Shell>
  );
};
```

#### Por qué se cambió
La pantalla principal de la app (home) estaba definida inline en `main.tsx`. Extraerla a `src/screens/home-screen.tsx` reduce ~270 líneas del archivo principal y la aísla como componente independiente.

### Cambio 2 - Iconos de HomeScreen centralizados

#### Código anterior
`No existía src/components/home-icons.tsx.`

#### Código nuevo
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconClipboard: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconChart: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconReservaWrite: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconAgenda: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconPlay: FC<{ s?: number; c?: string }> = (...) => (...);
```

#### Por qué se cambió
Estos 6 iconos eran definiciones inline en `main.tsx` usadas por HomeScreen. Centralizarlos en `src/components/home-icons.tsx` evita duplicación y permite que `home-screen.tsx` los importe sin depender de `main.tsx`.

### Cambio 3 - Reemplazar bloque inline en main.tsx

#### Código anterior
```tsx
  if (screen === "home") {
    const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
    return (
      <Shell burst={false}>
        {/* ... 270 líneas inline ... */}
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "home") {
    return (
      <HomeScreen
        isPaused={current.isPaused}
        isAdmin={isAdmin}
        active={active}
        onSetScreen={setScreen}
        onSetCalendarView={setCalendarView}
        onOpenNewReserva={openNewReserva}
        onSetAdminMode={setAdminMode}
        onSetConfirmDialog={setConfirmDialog}
        renderReservaDialog={renderReservaDialog}
      />
    );
  }
```

#### Por qué se cambió
El bloque inline de ~270 líneas se sustituye por el componente `HomeScreen` importado. main.tsx pasa de 6828 a 6574 líneas.

## 2026-05-26 01:00 - Extraer iconos de entradas a src/components/entry-icons.tsx

**Archivos modificados:** `src/components/entry-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de entradas extraídos

#### Código anterior
`No existía src/components/entry-icons.tsx.`

#### Código nuevo
```tsx
import { type FC } from "react";
import { A, E, F, N, P } from "../shared/ui-theme";

export const IconCoin: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <text x="12" y="17" textAnchor="middle" fill={c} fontSize="11" fontWeight="700" fontFamily="Outfit,sans-serif">€</text>
  </svg>
);

export const IconPercent: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M16 8L8 16" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="9" r="2" stroke={c} strokeWidth="2.5" />
    <circle cx="15" cy="15" r="2" stroke={c} strokeWidth="2.5" />
  </svg>
);

export const IconCard: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="13" rx="2.5" stroke={c} strokeWidth="1.8" />
    <rect x="3" y="10" width="18" height="3.5" fill={c} opacity="0.35" />
    <rect x="6" y="15.5" width="5" height="1.5" rx="0.75" fill={c} />
  </svg>
);

export const IconAgency: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 20V9L12 4L20 9V20" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 20V14H15V20" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M3 20H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconExtra: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 12H20" stroke={c} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" opacity="0.5" />
  </svg>
);

export const IconFuel: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="11.5" height="15" rx="2" stroke={c} strokeWidth="1.8" />
    <path d="M15.5 9L19 7V17L15.5 15" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    <rect x="7" y="8" width="5.5" height="4.5" rx="1" fill={c} opacity="0.4" />
  </svg>
);

export const IconNulo: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <path d="M6 18L18 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
```

#### Por qué se cambió
Los iconos de tipo de entrada (IconCoin, IconPercent, IconCard, IconAgency, IconExtra, IconFuel, IconNulo) estaban definidos inline en `main.tsx`. Extraerlos a `src/components/entry-icons.tsx` los centraliza y elimina ~70 líneas duplicadas.

### Cambio 2 - Reemplazar iconos inline en main.tsx

#### Código anterior
```tsx
const IconCoin = ({ s = 24, c = G }: { s?: number; c?: string }) => ( ... );
const IconPercent = ({ s = 24, c = G }: { s?: number; c?: string }) => ( ... );
const IconCard = ({ s = 24, c = P }: { s?: number; c?: string }) => ( ... );
const IconAgency = ({ s = 24, c = A }: { s?: number; c?: string }) => ( ... );
const IconExtra = ({ s = 24, c = E }: { s?: number; c?: string }) => ( ... );
const IconFuel = ({ s = 24, c = F }: { s?: number; c?: string }) => ( ... );
const IconNulo = ({ s = 24, c = N }: { s?: number; c?: string }) / ... );
```

#### Código nuevo
```tsx
import { IconCoin, IconPercent, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "./components/entry-icons";
```

#### Por qué se cambió
Las definiciones inline se sustituyen por los imports del módulo extraído. La modificación real a main.tsx (borrado de las 7 definiciones inline e importación desde entry-icons) se completó el 2026-05-26 01:14 como parte de finalizar esta fase.

## 2026-05-26 01:00 - Extraer iconos de navegación a src/components/navigation-icons.tsx

**Archivos modificados:** `src/components/navigation-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de navegación extraídos

#### Código anterior
`No existía src/components/navigation-icons.tsx.`

#### Código nuevo
```tsx
import { type FC } from "react";

export const IconBack: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M14 18L7 11L14 4" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconDel: FC = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z" stroke="rgba(255,255,255,0.45)" strokeWidth="1.7" fill="none" />
    <path d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const IconRefresh: FC<{ s?: number; c?: string }> = ({ s = 20, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 4V9H9" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20V15H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 9C18.8289 5.50429 15.6836 3 12 3C7.02944 3 3 7.02944 3 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15C5.17112 18.4957 8.31641 21 12 21C16.9706 21 21 16.9706 21 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconDownload: FC<{ s?: number; c?: string }> = ({ s = 20, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V16" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11L12 16L17 11" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20H4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconUpload: FC<{ s?: number; c?: string }> = ({ s = 20, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 20V8" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 13L12 8L17 13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4H4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCalendar: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="16" rx="3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2V6M8 2V6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 9H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="7.5" cy="13.5" r="1" fill={c} />
    <circle cx="12" cy="13.5" r="1" fill={c} />
    <circle cx="16.5" cy="13.5" r="1" fill={c} />
    <circle cx="7.5" cy="17.5" r="1" fill={c} opacity="0.6" />
    <circle cx="12" cy="17.5" r="1" fill={c} opacity="0.6" />
    <circle cx="16.5" cy="17.5" r="1" fill={c} opacity="0.6" />
  </svg>
);

export const IconSettings: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconHomeNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M4.2 11.2L12 5.2L19.8 11.2" stroke="#ffb347" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,190,77,0.75)) drop-shadow(0 0 4px rgba(255,139,61,0.28))" }} />
    <path d="M6.7 10.3V19H17.3V10.3" stroke="#ffb347" strokeWidth="2" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,190,77,0.75)) drop-shadow(0 0 4px rgba(255,139,61,0.28))" }} />
    <path d="M10 19V14.2H14V19" stroke="#ffe071" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 11.7H15" stroke="#ffd56a" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </svg>
);

export const IconLogoutNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(180 12 12)">
      <path d="M10.5 5.2H5.8C4.8 5.2 4 6 4 7V17C4 18 4.8 18.8 5.8 18.8H10.5" stroke="#ff7a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,122,138,0.8)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }} />
      <path d="M11 12H19" stroke="#ffb1bc" strokeWidth="2.2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,177,188,0.75)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }} />
      <path d="M16 8.5L19.5 12L16 15.5" stroke="#ffb1bc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,177,188,0.75)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }} />
    </g>
  </svg>
);

export const IconAdminNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 3.4L19 6.1V11.4C19 15.8 16.2 19.4 12 20.8C7.8 19.4 5 15.8 5 11.4V6.1L12 3.4Z" stroke="#7dd3ff" strokeWidth="2" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(125,211,255,0.8)) drop-shadow(0 0 5px rgba(66,165,245,0.32))" }} />
    <path d="M9 12.2L11 14.2L15.4 9.8" stroke="#b9f6ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(185,246,255,0.78)) drop-shadow(0 0 5px rgba(66,165,245,0.28))" }} />
  </svg>
);
```

#### Por qué se cambió
Los iconos de navegación (IconBack, IconDel, IconRefresh, IconDownload, IconUpload, IconCalendar, IconSettings, IconHomeNeon, IconLogoutNeon, IconAdminNeon) estaban definidos inline en `main.tsx`. Extraerlos a `src/components/navigation-icons.tsx` los centraliza y elimina ~100 líneas duplicadas.

### Cambio 2 - Reemplazar iconos inline en main.tsx

#### Código anterior
```tsx
const IconBack = () => ( ... );
const IconDel = () => ( ... );
const IconRefresh = ({ s = 20, c = "currentColor" }) => ( ... );
const IconDownload = ({ s = 20, c = "currentColor" }) => ( ... );
const IconUpload = ({ s = 20, c = "currentColor" }) => ( ... );
const IconCalendar = ({ s = 24, c = "white" }) => ( ... );
const IconSettings = ({ s = 24, c = "white" }) => ( ... );
const IconHomeNeon = ({ s = 24 }) => ( ... );
const IconLogoutNeon = ({ s = 24 }) => ( ... );
const IconAdminNeon = ({ s = 24 }) => ( ... );
```

#### Código nuevo
```tsx
import { IconBack, IconDel, IconRefresh, IconDownload, IconUpload, IconCalendar, IconSettings, IconHomeNeon, IconLogoutNeon, IconAdminNeon } from "./components/navigation-icons";
```

#### Por qué se cambió
Las definiciones inline se sustituyen por los imports del módulo extraído. La modificación real a main.tsx (borrado de las 10 definiciones inline e importación desde navigation-icons) se completó el 2026-05-26 01:14 como parte de finalizar esta fase.

## 2026-05-26 00:32 - Actualizar guías del recorte de main

**Archivos modificados:** `RECORTAR_MAIN_TSX_MEJORADO.md`, `ESTRUCTURA.md`

### Cambio 1 - Estado actual del recorte

#### Código anterior
`No existía la sección "Estado actual del recorte" en RECORTAR_MAIN_TSX_MEJORADO.md.`

#### Código nuevo
```md
## Estado actual del recorte

Estas pantallas ya están extraídas de `src/main.tsx` y no deben volver a duplicarse dentro del archivo principal:

- `src/screens/add-entry-screen.tsx`: pantalla para añadir datáfono y propina.
- `src/screens/add-nota-general-screen.tsx`: pantalla para añadir una nota general al turno.
- `src/screens/add-single-entry-screen.tsx`: pantalla para añadir Agencia/Bono, Extra, Gasolina o Nulo.

Las siguientes fases deben continuar por responsabilidades naturales:

- pantallas completas pendientes
- componentes reutilizables reales
- lógica pura no contable
- servicios aislados

No extraer piezas demasiado pequeñas por inercia. Un icono suelto, un estilo aislado o un helper mínimo solo deben extraerse si forman parte de un bloque reutilizable claro, si reducen una dependencia real o si encajan con una responsabilidad ya existente.

Para las pantallas, el criterio profesional es primero separar la pantalla completa cuando tenga frontera clara. Después, si varias pantallas repiten una pieza de interfaz con responsabilidad propia, esa pieza puede moverse a `src/components/` en una fase posterior.
```

#### Por qué se cambió
El documento necesitaba reflejar que las pantallas de entrada ya están extraídas y orientar las siguientes fases hacia responsabilidades naturales, no hacia piezas sueltas sin frontera clara.

### Cambio 2 - Reglas del registro documental

#### Código anterior
```md
- `Código anterior` debe contener el fragmento literal que estaba en `main.tsx` antes de extraerlo, o el texto literal de ausencia exigido por `AGENTS.md` si el bloque no existía.
- `Código nuevo` debe contener el fragmento literal que quedó después, normalmente el nuevo import, el nuevo export o el nuevo bloque en el archivo destino.
- Si el código ya no existe en `main.tsx`, no usar frases sueltas mal formateadas. Usar un bloque Markdown válido que muestre el import/export nuevo o una frase literal válida dentro de un fence correcto.
- Los fences Markdown deben estar bien formados: abrir con triple backtick y cerrar con triple backtick.
- No usar backticks mezclados, fences rotos ni combinaciones como `` `texto` `` envueltas en backticks sueltos.
```

#### Código nuevo
```md
- `Código anterior` debe contener el fragmento literal que estaba en `main.tsx` antes de extraerlo, o el texto literal de ausencia exigido por `AGENTS.md` si el bloque no existía.
- `Código nuevo` debe contener el fragmento literal que quedó después, normalmente el nuevo import, el nuevo export o el nuevo bloque en el archivo destino.
- Si el código ya no existe en `main.tsx`, no usar frases sueltas mal formateadas. Usar un bloque Markdown válido que muestre el import/export nuevo o una frase literal válida dentro de un fence correcto.
- No usar `...`, placeholders, resúmenes ni comentarios inventados como sustituto del código literal dentro de `Código anterior` o `Código nuevo`.
- El texto documental de la entrada debe escribirse en español. Evitar inglés innecesario cuando exista una forma clara en español.
- Los fences Markdown deben estar bien formados: abrir con triple backtick y cerrar con triple backtick.
- No usar backticks mezclados, fences rotos ni combinaciones como `` `texto` `` envueltas en backticks sueltos.
```

#### Por qué se cambió
Las fases recientes mostraron que el registro podía quedar con placeholders, resúmenes o texto en inglés. Se reforzó la regla para que `CAMBIOS_AGENT.md` sea literal y revisable.

### Cambio 3 - Registro de cambios del documento de recorte

#### Código anterior
`No existía el punto 11 en el "Registro de cambios respecto a la versión original" de RECORTAR_MAIN_TSX_MEJORADO.md.`

#### Código nuevo
```md
11. **Estado actual del recorte.** Nueva sección. Se deja constancia de las pantallas de entrada ya extraídas y se aclara que las fases siguientes deben continuar por responsabilidades naturales, evitando piezas demasiado pequeñas salvo que formen un bloque reutilizable claro. También se refuerza que `CAMBIOS_AGENT.md` no debe usar placeholders, resúmenes ni texto documental en inglés cuando pueda escribirse en español.
```

#### Por qué se cambió
El documento mantiene un registro interno de mejoras respecto a la versión original. La nueva sección y el refuerzo documental debían quedar reflejados allí.

### Cambio 4 - Ejemplos y criterio de pantallas

#### Código anterior
```md
| `src/screens/` | Pantallas completas de la app. | `login-screen.tsx`, `admin-screens.tsx`, `auth-gate.tsx` |
```

#### Código nuevo
```md
| `src/screens/` | Pantallas completas de la app. | `add-entry-screen.tsx`, `add-nota-general-screen.tsx`, `add-single-entry-screen.tsx`, `login-screen.tsx`, `admin-screens.tsx`, `auth-gate.tsx` |
```

#### Por qué se cambió
La guía de estructura debía mostrar las pantallas de entrada ya extraídas como ejemplos reales de `src/screens/`.

### Cambio 5 - Criterio entre screens y components

#### Código anterior
```md
Regla general: **un archivo = una responsabilidad clara**, con un nombre que la describa.
```

#### Código nuevo
```md
Regla general: **un archivo = una responsabilidad clara**, con un nombre que la describa.

Una pantalla completa va en `src/screens/`. Las piezas de interfaz reutilizables que se usen dentro de varias pantallas van en `src/components/`.

Si una extracción empieza como código privado de una pantalla, puede quedarse dentro del archivo de esa pantalla. Solo se mueve a `src/components/` cuando se reutiliza, cuando tiene responsabilidad propia clara o cuando evita duplicación real entre pantallas.
```

#### Por qué se cambió
La guía necesitaba aclarar cuándo una extracción debe quedarse como pantalla y cuándo conviene mover piezas compartidas a componentes reutilizables.

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
La pantalla `screen === "add"` (~106 líneas) es el teclado principal para añadir datapropina y propina. Extraerla a `src/screens/add-entry-screen.tsx` reduce `main.tsx` con frontera clara y 12 propiedades.

### Cambio 2 - Reemplazar bloque add en main.tsx

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
La pantalla `addNotaGeneral` es una responsabilidad autocontenida (campo de texto para nota + botón añadir). Extraerla a `src/screens/add-nota-general-screen.tsx` reduce `main.tsx` en ~56 líneas con frontera clara y 4 propiedades.

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
La pantalla de entrada individual es una responsabilidad autocontenida (teclado numérico para Agencia/Bono, Extra, Gasolina o Nulo). Extraerla a `src/screens/add-single-entry-screen.tsx` reduce `main.tsx` en ~78 líneas con frontera clara.

### Cambio 2 - Reemplazar bloque addSingle en main.tsx

#### Código anterior
```tsx
import { AddSingleEntryScreen } from "./screens/add-single-entry-screen";

  if (screen === "addSingle" && singleMode) {
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
// las definitions inline de IconPlay e IconPause en main.tsx
```

#### Código nuevo
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
// las definitions inline de fmtKm y fmtMoney en main.tsx
```

#### Código nuevo
```ts
import { fmtKm, fmtMoney as fmtEuro } from "./logic/formatters";
```

#### Por qué se cambió
Las definiciones inline se sustituyen por los imports del módulo extraído.
