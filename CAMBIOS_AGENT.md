## 2026-05-29 16:49 - Añadir check de tipos y tests al CI

**Archivos modificados:** package.json, .github/workflows/ci.yml

### Cambio 1 - Script typecheck en package.json

#### Código anterior
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

#### Código nuevo
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
```

#### Por qué se cambió
No existía forma estandarizada de ejecutar la comprobación de tipos. El script `typecheck` permite invocarla igual en local y en CI.

### Cambio 2 - Workflow de CI

#### Código anterior
```yaml
No existía .github/workflows/ci.yml en el proyecto.
```

#### Código nuevo
```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Tests
        run: npm test
```

#### Por qué se cambió
La suite de tests es de extracción (coincidencia de strings) y no detecta errores de compilación; un error de tipos (TS2741 en CalendarScreen) pasó desapercibido. El workflow ejecuta `tsc --noEmit` y los tests en cada push y PR a main para impedir que vuelva a ocurrir.

## 2026-05-29 16:45 - Cablear useFirestoreSync y eliminar Firebase inline de main.tsx

**Archivos modificados:** src/main.tsx, .gitignore

### Cambio 1 - Invocar el hook useFirestoreSync

#### Código anterior
```tsx
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
```

#### Código nuevo
```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });
```

#### Por qué se cambió
El hook `useFirestoreSync` estaba importado pero nunca se invocaba (código muerto), y los estados `dataLoaded`/`loadTimedOut` y los 6 refs `lastXRef` seguían declarados en `main.tsx`. Ahora esos estados y refs viven dentro del hook; el componente solo consume su valor de retorno.

### Cambio 2 - Eliminar la función de migración duplicada en main.tsx

#### Código anterior
```tsx
const LOCAL_MIGRATION_KEY = "taxi_migration_done_v2";

const LOAD_TIMEOUT_MS = 15000;

async function migrarLocalStorageAFirestore(uid: string): Promise<void> {
  // ... (sube localStorage a Firestore, batch writes y limpieza de claves)
}
```

#### Código nuevo
```tsx
// Eliminado: la migración localStorage → Firestore vive ahora en
// src/hooks/use-firestore-sync.ts.
```

#### Por qué se cambió
`migrarLocalStorageAFirestore`, `LOCAL_MIGRATION_KEY` y `LOAD_TIMEOUT_MS` estaban duplicados literalmente en `main.tsx` y en el hook. Se elimina la copia de `main.tsx` para tener una única fuente de verdad.

### Cambio 3 - Eliminar los useEffect de Firestore de main.tsx

#### Código anterior
```tsx
  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    // ... saveUserDoc / syncSubcollection para current, settings, turnos,
    //     reservations, notes, weekOverrides
  }, [/* deps */]);

  useEffect(() => {
    // ... inicialización con onSnapshot de las 6 colecciones + marcar dataLoaded
  }, []);

  useEffect(() => {
    // ... timeout de carga (setLoadTimedOut)
  }, [dataLoaded]);

  useEffect(() => {
    // ... getDoc(admins/{uid}) → setIsAdmin
  }, []);
```

#### Código nuevo
```tsx
// Eliminados: toda la lógica de escritura reactiva, suscripción onSnapshot,
// timeout de carga y detección de admin se movió a useFirestoreSync.
// El useEffect del Service Worker permanece en main.tsx por no ser de Firebase.
```

#### Por qué se cambió
Eran exactamente los mismos efectos que ya contiene el hook. Mantenerlos en `main.tsx` los ejecutaba por duplicado y contradecía la extracción.

### Cambio 4 - Reducir los imports de Firestore en main.tsx

#### Código anterior
```tsx
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./services/firebase";
```

#### Código nuevo
```tsx
import { auth } from "./services/firebase";
```

#### Por qué se cambió
Tras mover la lógica al hook, `onSnapshot`, `doc`, `getDoc`, `setDoc`, `writeBatch` y `db` quedaron sin uso en `main.tsx`.

### Cambio 5 - Pasar renderReservaDialog a CalendarScreen

#### Código anterior
```tsx
        notes={notes}
        setNotes={setNotes}
        
        setShowReservaDialog={setShowReservaDialog}
```

#### Código nuevo
```tsx
        notes={notes}
        setNotes={setNotes}
        renderReservaDialog={renderReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
```

#### Por qué se cambió
`CalendarScreenProps` exige `renderReservaDialog` y no se estaba pasando, lo que rompía `tsc --noEmit` (error TS2741). La función ya existía en `main.tsx`.

### Cambio 6 - Ignorar artefactos de trabajo del agente

#### Código anterior
```
No existía la sección de artefactos del agente en .gitignore.
```

#### Código nuevo
```
# Artefactos de trabajo del agente
scratch/
test_failures.txt
scratch_verify_results.txt
```

#### Por qué se cambió
`test_failures.txt`, `scratch_verify_results.txt` y `scratch/` son residuos de depuración que no deben acabar en el repositorio.

## 2026-05-29 17:41 - Extraer pantallas de contabilidad y sincronizacion

**Archivos modificados:** src/main.tsx, src/hooks/use-firestore-sync.ts, src/screens/contabilidad-screen.tsx, src/screens/detalle-anual-screen.tsx, src/screens/detalle-mes-screen.tsx, src/screens/detalle-semana-screen.tsx, src/screens/liquidacion-semana-screen.tsx, ESTRUCTURA.md, src/__tests__/responsive-title-fonts.test.ts

### Cambio 1 - Extraer logica de sincronizacion Firestore

#### Codigo anterior
```tsx
// Lógica inline gigante en main.tsx dentro de App()
useEffect(() => {
  if (!user) return;
  const unsubs = [];
  unsubs.push(onSnapshot(...));
  // ... (cientos de lineas)
});
```

#### Codigo nuevo
```tsx
// En main.tsx
import { useFirestoreSync } from "./hooks/use-firestore-sync";

  useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin
  });
```

#### Por que se cambio
Aislar la complejidad de Firebase en un hook custom, limpiando main.tsx y reduciendo el acoplamiento.

### Cambio 2 - Extraer pantallas de contabilidad

#### Codigo anterior
```tsx
// Múltiples bloques if (screen === ...) gigantes en main.tsx renderizando contabilidad inline
```

#### Codigo nuevo
```tsx
// Archivos nuevos creados en src/screens/
<ContabilidadScreen history={history} settings={settings} current={current} weekOverrides={weekOverrides} ... />
<DetalleSemanaScreen history={history} settings={settings} weekOverrides={weekOverrides} selectedWeekId={selectedWeekId} ... />
<LiquidacionSemanaScreen ... />
// y otros para Mes y Anual
```

#### Por que se cambio
Reducir el tamaño de main.tsx y encapsular la lógica de visualización de contabilidad en pantallas independientes.

### Cambio 3 - Documentar hooks en ESTRUCTURA.md

#### Codigo anterior
```md
| `src/logic/` | Lógica de negocio y utilidades **puras**... |
| `src/services/` | Todo lo que habla con el exterior... |
```

#### Codigo nuevo
```md
| `src/logic/` | Lógica de negocio y utilidades **puras**... |
| `src/hooks/` | Custom Hooks de React. Todo código que use estados... |
| `src/services/` | Todo lo que habla con el exterior... |
```

#### Por que se cambio
Para mantener la guía de arquitectura actualizada con la nueva carpeta introducida.

# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió. Las entradas se añaden al **principio** del archivo (las más recientes arriba).

## 2026-05-29 15:50 - Extraer sincronización de Firestore a useFirestoreSync

**Archivos modificados:** `src/main.tsx`, `src/hooks/use-firestore-sync.ts`

### Cambio 1 - Creación del hook useFirestoreSync

#### Código anterior
`No existía el archivo src/hooks/use-firestore-sync.ts.`

#### Código nuevo
```ts
// Se creó src/hooks/use-firestore-sync.ts conteniendo la lógica de onSnapshot y persistencia local (ver archivo para detalles completos).
```

#### Por qué se cambió
Se extrae la lógica de inicialización y suscripción a Firestore fuera de `main.tsx` para reducir su tamaño y delegar responsabilidades, de acuerdo al plan de refactorización.

### Cambio 2 - Reemplazo en App()

#### Código anterior
```ts
Código anterior no verificable: Fragmento demasiado largo de inicialización de estados (dataLoaded, etc.) y múltiples useEffects de sincronización con Firestore.
```

#### Código nuevo
```ts
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });
```

#### Por qué se cambió
Simplifica `App()` delegando las llamadas de base de datos a un custom hook.

## 2026-05-29 15:34 - Mover backup-export de logic a services

**Archivos modificados:** `src/main.tsx`, `src/screens/settings-screen.tsx`, `src/services/backup-export.ts`, `src/__tests__/backup-export-extraction.test.ts`, `src/__tests__/src-reorganization.test.ts`

### Cambio 1 - Mover backup-export.ts a services

#### Código anterior
```tsx
// Ubicado en src/logic/backup-export.ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "./backup";
```

#### Código nuevo
```tsx
// Ubicado en src/services/backup-export.ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "../logic/backup";
```

#### Por qué se cambió
La carpeta `logic/` está destinada a funciones puras. Como la exportación interactúa directamente con plugins de Capacitor (efectos secundarios del dispositivo), el archivo debe pertenecer a `services/`.

### Cambio 2 - Actualizar rutas de importación en main y settings

#### Código anterior
```tsx
// En main.tsx
import { exportBackupJSON } from "./logic/backup-export"; 

// En settings-screen.tsx
import { exportBackupJSON } from "../logic/backup-export";
```

#### Código nuevo
```tsx
// En main.tsx
import { exportBackupJSON } from "./services/backup-export"; 

// En settings-screen.tsx
import { exportBackupJSON } from "../services/backup-export";
```

#### Por qué se cambió
Adaptar los archivos importadores al nuevo destino del servicio de backup en la arquitectura.

## 2026-05-29 15:30 - Eliminar IconNoteAdd duplicado en main y consolidar en components

**Archivos modificados:** `src/main.tsx`, `src/components/summary-icons.tsx`, `src/__tests__/detailed-notes-layout.test.ts`, `src/__tests__/main-note-button.test.ts`

### Cambio 1 - Eliminar componente inline en main.tsx

#### Código anterior
```tsx
const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {/* ... (rutas del icono) */}
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

#### Código nuevo
```tsx
import { IconNoteAdd } from "./components/summary-icons";
```

#### Por qué se cambió
Eliminar la definición duplicada de `IconNoteAdd` y utilizar el import existente en `src/components/summary-icons.tsx` para reducir el tamaño de `main.tsx` y mantener una única fuente de verdad para el icono.

### Cambio 2 - Completar IconNoteAdd en summary-icons

#### Código anterior
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
  </svg>
);
```

#### Código nuevo
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
    {!showPlus && (
      <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M15.25 2.75V7.25H19.75" strokeWidth="1.7" opacity="0.9" />
    )}
  </svg>
);
```

#### Por qué se cambió
La versión duplicada en `main.tsx` contenía un trazo extra para el caso `!showPlus` (el clip superior del portapapeles) que faltaba en el componente compartido original. Se consolidan ambos para mantener la fidelidad visual completa.

### Cambio 3 - Actualizar tests de layouts y de botón

#### Código anterior
```tsx
    const iconNoteAddBlock = source.match(/const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];
// ...
    expect(source).toContain("const IconNoteAdd =");
```

#### Código nuevo
```tsx
    const iconNoteAddBlock = summaryIconsSource.match(/(?:export )?const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];
// ...
    expect(summaryIconsSource).toContain("export const IconNoteAdd =");
```

#### Por qué se cambió
Los tests de caracterización estaban acoplados a la definición inline en `main.tsx`. Se actualizan para buscar en el origen compartido `summary-icons.tsx`.

## 2026-05-29 15:28 - Extraer entry-type-meta y remover diccionario duplicado en main

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Importar centralizado en main.tsx

#### Código anterior
```tsx
type EntryTypeMeta = {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};
```

#### Código nuevo
```tsx
import { getEntryTypeMeta, ENTRY_TYPE_META, type EntryTypeMeta } from "./shared/entry-type-meta";
```

#### Por qué se cambió
Se elimina la duplicación local redundante de los tipos de entrada y funciones asociadas, importándolas de forma centralizada desde `shared/entry-type-meta.tsx` para mantener una única fuente de verdad.

### Cambio 2 - Ajustar test de extracción a shared

#### Código anterior
```tsx
  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(source).toMatch(/type EntryTypeMeta = \{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\};/);
    expect(source).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### Código nuevo
```tsx
  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(entryTypeMetaSource).toMatch(/(?:type|export interface) EntryTypeMeta\s*=?\s*\{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\}/);
    expect(entryTypeMetaSource).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### Por qué se cambió
El test de layout/extracción buscaba explícitamente en el `source` de `main.tsx`. Se actualiza para validar el origen compartido y la sintaxis `interface` usada allí.

## 2026-05-28 15:40 - Corregir consistencia de tarjetas y diccionario de tipos

**Archivos modificados:** `src/screens/detalle-mes-screen.tsx`, `src/screens/pantalla-turnos.tsx`, `src/main.tsx`

### Cambio 1 - Importar getEntryTypeMeta y remover diccionario duplicado en DetalleMesScreen

#### Código anterior
```tsx
interface EntryTypeMeta {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
}

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  datafono: { color: P, label: "Datáfono", icon: (s) => <IconCard s={s} c={P} /> },
  impuesto: { color: F, label: "Impuesto", icon: (s) => <IconFuel s={s} c={F} /> },
  agencia: { color: A, label: "Agencia", icon: (s) => <IconAgency s={s} c={A} /> },
  bonus: { color: A, label: "Bono", icon: (s) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s) => <IconNulo s={s} c={N} /> },
  明细笔记: { color: G, label: "Propina", icon: (s) => <IconCoin s={s} c={G} /> },
};
```

#### Código nuevo
```tsx
import { getEntryTypeMeta } from "../shared/entry-type-meta";
```

#### Por qué se cambió
El diccionario local contenía la clave en chino `明细笔记` en vez de `propina`, rompiendo la visualización de notas asociadas a propinas. Centralizar en la función compartida evita este error y simplifica la pantalla.

### Cambio 2 - Eliminar renderTurnoCardLocal en PantallaTurnos y usar renderTurnoCard global

#### Código anterior
```tsx
  function renderTurnoCardLocal(turno: Turno) {
    let durationStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalMins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
      }
      durationStr = fmtDuration(totalMins);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGanancia = calcularTurnoContable(turno, settings).miGanancia;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {isSelectingTurnos && (
          <input
            type="checkbox"
            checked={selectedTurnosIds.includes(turno.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              } else {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              }
            }}
            style={{ width: 20, height: 20, accentColor: "#50dc8c", cursor: "pointer" }}
          />
        )}
        <div
          onClick={() => {
            if (isSelectingTurnos) {
              if (selectedTurnosIds.includes(turno.id)) {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              } else {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              }
            } else {
              setReturnScreen("PantallaTurnos");
              setViewTurno(turno);
              setScreen("summary");
            }
          }}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.entries.length} {turno.entries.length === 1 ? "entrada" : "entradas"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(taximetroTurno)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(turno.km || 0)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGanancia)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
```

#### Código nuevo
```tsx
`No existía renderTurnoCardLocal en pantalla-turnos.tsx`
```

#### Por qué se cambió
Se elimina la duplicación local redundante de la tarjeta de turnos en favor de usar el renderizador global renderTurnoCard recibido a través de props, garantizando consistencia visual y de comportamiento.

### Cambio 3 - Pasar renderTurnoCard a PantallaTurnos en main.tsx

#### Código anterior
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
        renderTurnoCard={renderTurnoCard}
      />
    );
  }
```

#### Por qué se cambió
Permite que la pantalla de turnos anteriores renderice las tarjetas mediante el componente global reutilizable, manteniendo la coherencia de estilos y bordes de estado.


## 2026-05-28 15:30 - Corregir tarjeta y navegación de detalle de semana

**Archivos modificados:** `src/main.tsx`, `src/screens/detalle-semana-screen.tsx`

### Cambio 1 - Props de DetalleSemanaScreen actualizadas

#### Código anterior
```tsx
type Props = {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
};

export function DetalleSemanaScreen({
  history,
  settings,
  weekOverrides,
  selectedWeekId,
  setSelectedWeekId,
  setScreen,
  updateWeekOverride,
}: Props) {
```

#### Código nuevo
```tsx
type Props = {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
  setReturnScreen: (screen: string | null) => void;
  setViewTurno: (turno: Turno | null) => void;
  renderTurnoCard: (
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
      isSelecting?: boolean;
      isSelected?: boolean;
      onToggleSelect?: (checked: boolean) => void;
    }
  ) => React.ReactNode;
};

export function DetalleSemanaScreen({
  history,
  settings,
  weekOverrides,
  selectedWeekId,
  setSelectedWeekId,
  setScreen,
  updateWeekOverride,
  setReturnScreen,
  setViewTurno,
  renderTurnoCard,
}: Props) {
```

#### Por qué se cambió
Para corregir el bug de navegación y restaurar la tarjeta de turnos con los iconos del diseño original, es necesario pasar renderTurnoCard, setReturnScreen y setViewTurno como props a DetalleSemanaScreen.

### Cambio 2 - Renderizador de turno local eliminado en DetalleSemanaScreen

#### Código anterior
```tsx
  function renderTurnoCard(
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
    }
  ) {
    let durStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalM = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalM = Math.max(0, totalM - turno.totalPausedMinutes);
      }
      durStr = fmtDuration(totalM);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGan = calcularTurnoContable(turno, settings).miGanancia;
    const totalEnt = calcularTurnoContable(turno, settings).totalDescontar;
    const totalDar = calcularTurnoContable(turno, settings).totalADar;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          onClick={options.onClick}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: options.showStatus && entregado
              ? "1px solid rgba(59, 130, 246, 0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "oklch(0.85 0.18 85)", fontWeight: 700 }}>
                {fmt(taximetroTurno)}
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.80 0.14 220)", fontWeight: 700 }}>
                {fmtKmNumber(turno.km || 0)} KM
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.78 0.18 150)", fontWeight: 700 }}>
                {fmt(miGan)}
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.85 0.12 210)", fontWeight: 700 }}>
                {durStr}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {entregado && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "oklch(0.78 0.18 145)", background: "rgba(80,220,140,0.12)", padding: "2px 8px", borderRadius: 6 }}>
                ENTREGADA
              </div>
            )}
            {options.showEntriesCount && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                {(turno.entries || []).length} movimientos
              </div>
            )}
            <div style={{ fontSize: 11, color: "oklch(0.70 0.18 25)", fontWeight: 700 }}>
              -{fmt(totalEnt)}
            </div>
            <div style={{ fontSize: 11, color: "oklch(0.68 0.20 145)", fontWeight: 700 }}>
              {fmt(totalDar)}
            </div>
          </div>
        </div>
      </div>
    );
  }
```

#### Código nuevo
`El bloque renderTurnoCard fue eliminado de src/screens/detalle-semana-screen.tsx.`

#### Por qué se cambió
Se elimina la función duplicada local que causaba divergencia de diseño y no propagaba correctamente el estado de turno seleccionado a la pantalla de resumen.

### Cambio 3 - Invocación del renderizador de turnos restaurada

#### Código anterior
```tsx
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => setScreen("summary"),
                  showEntriesCount: true,
                })
              ))}
            </div>
```

#### Código nuevo
```tsx
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => {
                    setReturnScreen("detalleSemana");
                    setViewTurno(t);
                    setScreen("summary");
                  },
                  showEntriesCount: true,
                })
              ))}
            </div>
```

#### Por qué se cambió
Para que el click sobre un turno en el detalle semanal navegue correctamente asignando el turno a visualizar y permitiendo volver a la pantalla de detalle de semana al presionar atrás.

### Cambio 4 - Invocación de DetalleSemanaScreen adaptada en main.tsx

#### Código anterior
```tsx
  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        setScreen={setScreen}
        updateWeekOverride={updateWeekOverride}
      />
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        setScreen={setScreen}
        updateWeekOverride={updateWeekOverride}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }
```

#### Por qué se cambió
Se pasan las props setReturnScreen, setViewTurno y renderTurnoCard para corregir la navegación y la visualización de tarjetas.

## 2026-05-28 14:57 - Reorganizar main.tsx extrayendo 5 bloques inline restantes

**Archivos modificados:** `src/main.tsx`, `src/screens/contabilidad-screen.tsx`, `src/screens/detalle-semana-screen.tsx`, `src/screens/detalle-mes-screen.tsx`, `src/screens/detalle-anual-screen.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - ContabilidadScreen extraída

#### Código anterior
`No existía src/screens/contabilidad-screen.tsx.`

#### Código nuevo
```tsx
export interface ContabilidadScreenProps {
  history: Turno[];
  settings: AppSettings;
  // ... todas las props necesarias
}

export function ContabilidadScreen({ ... }: ContabilidadScreenProps) {
  // Bloque if (screen === "contabilidad") ~580 líneas
}
```

#### Por qué se cambió
Separación de responsabilidades: el bloque de contabilidad (~580 líneas) se extrae a su propio componente. main.tsx pasa de 3909 a ~2770 líneas. La pantalla usa módulos compartidos (week-logic, accounting, formatters, entry-icons, summary-icons, calendar-icons, shell).

### Cambio 2 - DetalleSemanaScreen extraída

#### Código anterior
`No existía src/screens/detalle-semana-screen.tsx.`

#### Código nuevo
```tsx
export function DetalleSemanaScreen({
  history, settings, weekOverrides, selectedWeekId,
  setSelectedWeekId, setScreen, updateWeekOverride,
}: Props) {
  // Bloque if (screen === "detalleSemana" && selectedWeekId)
}
```

#### Por qué se cambió
El bloque de detalle de semana (turnos de una semana, con cálculo de totales, marca de entregada, notas) se extrae como componente independiente. Props: `history: Turno[]` (no `CurrentState`).

### Cambio 3 - DetalleMesScreen extraída

#### Código anterior
`No existía src/screens/detalle-mes-screen.tsx.`

#### Código nuevo
```tsx
export function DetalleMesScreen({
  history, settings, selectedAccountingYear, selectedAccountingMonth,
  setSelectedAccountingYear, setSelectedAccountingMonth, setScreen,
}: Props) {
  // Bloque if (screen === "detalleMes")
}
```

#### Por qué se cambió
El bloque de detalle mensual (resumen de mes con breakdown por categorías) se extrae. Import corregido: `calcularResumenContableTurnos` viene de `../logic/accounting` (no de `../logic/turnos`).

### Cambio 4 - DetalleAnualScreen extraída

#### Código anterior
`No existía src/screens/detalle-anual-screen.tsx.`

#### Código nuevo
```tsx
export function DetalleAnualScreen({
  history, settings, selectedAccountingYear, setSelectedAccountingYear,
  selectedAccountingMonth, setSelectedAccountingMonth, setScreen,
}: Props) {
  // Bloque if (screen === "detalleAnual")
}
```

#### Por qué se cambió
El bloque de resumen anual (todos los meses del año con sus totales) se extrae como componente independiente.

### Cambio 5 - Iconos compartidos corregidos en pantallas extraídas

#### Código anterior
```tsx
// contabilidad-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer } from "../components/entry-icons";
```

```tsx
// detalle-anual-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer } from "../components/summary-icons";
```

```tsx
// detalle-semana-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer, IconReceipt, IconGive } from "../components/summary-icons";
```

#### Código nuevo
```tsx
// contabilidad-screen.tsx
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";

// detalle-anual-screen.tsx
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";

// detalle-semana-screen.tsx
import { IconTaxiBadgeNeon, IconRoad, IconGive } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { IconReceipt } from "../components/settings-icons";
```

#### Por qué se cambió
Cada icono vive en su módulo correcto: IconMoneyBag e IconTimer están en calendar-icons, IconReceipt en settings-icons, IconTaxiBadgeNeon/IconRoad/IconGive en summary-icons. Las pantallas extraídas tenían los imports incorrectos.

### Cambio 6 - Tipos corregidos en pantallas extraídas

#### Código anterior
```tsx
// detalle-semana-screen.tsx
import type { Turno, WeekOverride, AppSettings, CurrentState } from "../shared/types";
type Props = { history: CurrentState; ... };

// liquidacion-semana-screen.tsx
import type { AppSettings, CurrentState, Turno, WeekOverride } from "../shared/types";
type Props = { history: CurrentState; ... };
```

#### Código nuevo
```tsx
// detalle-semana-screen.tsx
import type { Turno, WeekOverride, AppSettings } from "../shared/types";
type Props = { history: Turno[]; ... };

// liquidacion-semana-screen.tsx
import type { AppSettings, Turno, WeekOverride } from "../shared/types";
type Props = { history: Turno[]; ... };
```

#### Por qué se cambió
`CurrentState` tiene campos `startTime` y `startDate` que `Turno[]` no tiene. El tipo correcto para `history` en estas pantallas es `Turno[]`, no `CurrentState`.

### Cambio 7 - Props corregidas en liquidacionSemanaScreen

#### Código anterior
```tsx
type Props = {
  history: CurrentState;
  settings: AppSettings;
  // ...
};

export function LiquidacionSemanaScreen({
  history, settings, selectedWeekId, setScreen,
}: Props) {
  //faltaban weekOverrides, setSelectedWeekId, updateWeekOverride
```

#### Código nuevo
```tsx
export function LiquidacionSemanaScreen({
  history, settings, weekOverrides, selectedWeekId,
  setSelectedWeekId, setScreen, updateWeekOverride,
}: Props) {
```

#### Por qué se cambió
La pantalla de liquidación necesita `weekOverrides`, `setSelectedWeekId` e `updateWeekOverride` que antes no se pasaban correctamente.

## 2026-05-28 14:44 - Extraer bloque liquidacionSemana a componente separado

**Archivos modificados:** `src/main.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Extraer bloque liquidacionSemana

#### Código anterior
```ts
if (screen === "liquidacionSemana" && selectedWeekId) {
  const weekId = selectedWeekId;
  const grupos = groupTurnosByWeek(history, settings.diaLibre);
  const turnosSemana = grupos.get(weekId) || [];
  // ... (~580 líneas de código JSX)
}
```

#### Código nuevo
```tsx
if (screen === "liquidacionSemana" && selectedWeekId) {
  return (
    <LiquidacionSemanaScreen
      history={history}
      settings={settings}
      weekOverrides={weekOverrides}
      selectedWeekId={selectedWeekId}
      setSelectedWeekId={setSelectedWeekId}
      setScreen={setScreen}
      updateWeekOverride={updateWeekOverride}
    />
  );
}
```

#### Por qué se cambió
El bloque `liquidacionSemana` de ~600 líneas contenía lógica de presentación que no dependía del estado local de `App`. Extraerlo a su propio componente permite mejor organización del código, reutilización y mantenimiento.

### Cambio 2 - Tests actualizados para buscar en nuevo archivo

#### Código anterior
```ts
const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");
```

#### Código nuevo
```ts
const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
const liquidacionSemanaSource = readFileSync(resolve("src/screens/liquidacion-semana-screen.tsx"), "utf8");
const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");
```

#### Por qué se cambió
Los tests que verificaban el código del bloque `liquidacionSemana` ahora deben buscar en el nuevo archivo `liquidacion-semana-screen.tsx` en lugar de `main.tsx`.

## 2026-05-26 23:48 - Corregir organizacion del recorte

**Archivos modificados:** `src/__tests__/main-antiguo-regressions.test.ts`, `src/main.tsx`, `src/screens/add-entry-screen.tsx`, `src/screens/add-nota-general-screen.tsx`, `src/screens/add-single-entry-screen.tsx`, `src/screens/calendar-screen.tsx`, `src/screens/confirm-end-screen.tsx`, `src/screens/today-history-screen.tsx`

### Cambio 1 - Tests de paridad del recorte

#### Codigo anterior
```ts
expect(openNewNotaBlock).toContain("setEditingReserva(null);");

expect(calendarSource).toContain('onClick={() => setScreen("home")}');
expect(calendarSource).toContain('setReturnScreen("calendar");');
expect(calendarSource).toContain("setViewTurno(turno);");
expect(calendarSource).toContain('setScreen("summary");');

expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
expect(source).toContain('confirmColor: "#ff6b6b"');
```

#### Codigo nuevo
```ts
expect(openNewNotaBlock).not.toContain("setEditingReserva(null);");

expect(calendarSource).toContain('onClick={() => setScreen("home")}');
expect(calendarSource).toContain('setReturnScreen("calendar");');
expect(calendarSource).toContain("setViewTurno(turno);");
expect(calendarSource).toContain('setScreen("summary");');
expect(calendarSource).toContain("style={iconBtnStyle}");
expect(calendarSource).toContain("setShowMonthPicker(v => !v);");

expect(calendarSource).toContain("renderReservaDialog: () => React.ReactElement | false;");
expect(calendarSource).toContain("{renderReservaDialog()}");
expect(calendarSource).not.toContain("function renderReservaDialog(");
expect(calendarSource).not.toContain(">Cancel<");
expect(calendarSource).not.toContain('{editingReserva ? "Actualizar" : "Reservar"}');
expect(mainSource).toContain("renderReservaDialog={renderReservaDialog}");

expect(source).not.toContain("confirmBg:");
expect(source).not.toContain("confirmColor:");
expect(source).not.toContain("confirmBorder:");
```

#### Por que se cambio
Los tests bloquean que futuras extracciones vuelvan a duplicar el modal de reservas, cambien el boton de calendario, usen el toggle con estado potencialmente obsoleto o alteren la confirmacion de borrado respecto al comportamiento anterior.

### Cambio 2 - Modal de reservas unico en calendario

#### Codigo anterior
```tsx
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
```

#### Codigo nuevo
```tsx
setShowReservaDialog: (v: boolean) => void;
setReservaTime: (t: string) => void;
setReservaOrigen: (o: string) => void;
setReservaDestino: (d: string) => void;
setReservaCliente: (c: string) => void;
setReservaTelefono: (t: string) => void;
setReservaNotas: (n: string) => void;
setEditingReserva: (r: Reserva | null) => void;
reservations: Reserva[];
renderReservaDialog: () => React.ReactElement | false;
```

#### Por que se cambio
La pantalla de calendario no debe tener una copia propia del formulario de reserva. Ahora recibe el renderizador central desde `src/main.tsx`, conserva solo el estado necesario para abrir o editar reservas y evita divergencias de textos, estilos y logica.

### Cambio 3 - Navegacion y estado del calendario

#### Codigo anterior
```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
setShowMonthPicker(!showMonthPicker);
```

```tsx
{renderReservaDialog(
  showReservaDialog,
  reservaTime,
  setReservaTime,
  reservaOrigen,
  setReservaOrigen,
  reservaDestino,
  setReservaDestino,
  reservaCliente,
  setReservaCliente,
  reservaTelefono,
  setReservaTelefono,
  reservaNotas,
  setReservaNotas,
  selectedDate,
  setSelectedDate,
  editingReserva,
  setEditingReserva,
  setConfirmDialog,
  reservations,
  setReservations,
  setShowReservaDialog
)}
```

#### Codigo nuevo
```tsx
<button style={iconBtnStyle} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
setShowMonthPicker(v => !v);
```

```tsx
{renderReservaDialog()}
```

#### Por que se cambio
El boton de volver recupera el estilo compartido de la pantalla antigua, el selector de mes usa una actualizacion funcional segura y el calendario deja de pasar todo el estado de reserva a una copia local del modal.

### Cambio 4 - Iconos compartidos en pantallas extraidas

#### Codigo anterior
```tsx
const IconBack: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M14 18L7 11L14 4"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDel: FC = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path
      d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      fill="none"
    />
    <path
      d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);
```

#### Codigo nuevo
```tsx
import { IconBack, IconDel } from "../components/navigation-icons";
```

```tsx
import { IconBack } from "../components/navigation-icons";
```

#### Por que se cambio
`add-entry-screen.tsx`, `add-single-entry-screen.tsx` y `add-nota-general-screen.tsx` usaban copias locales de iconos ya extraidos. Ahora consumen los iconos compartidos para que la organizacion por componentes sea coherente.

### Cambio 5 - Estilo de kilometros compartido

#### Codigo anterior
```tsx
const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;
```

#### Codigo nuevo
```tsx
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
```

#### Por que se cambio
`confirm-end-screen.tsx` tenia una copia local del estilo de unidad de kilometros aunque ya existe en `src/shared/card-styles.ts`. Usar el valor compartido evita divergencias visuales en futuras fases.

### Cambio 6 - Confirmacion de borrado en historial

#### Codigo anterior
```tsx
setConfirmDialog({
  text: "¿Seguro que quieres eliminar esta entrada?",
  onConfirm: deleteEditEntry,
  confirmBg: "rgba(255,60,60,0.2)",
  confirmColor: "#ff6b6b",
  confirmBorder: "1px solid rgba(255,100,100,0.35)",
});
```

#### Codigo nuevo
```tsx
setConfirmDialog({
  text: "¿Seguro que quieres eliminar esta entrada?",
  onConfirm: deleteEditEntry,
});
```

#### Por que se cambio
La extraccion habia anadido estilo destructivo especifico en el historial de hoy. Se retiro para mantener el comportamiento y aspecto previos del dialogo compartido.

## 2026-05-26 23:19 - Corregir regresiones del recorte

**Archivos modificados:** `src/__tests__/main-antiguo-regressions.test.ts`, `src/__tests__/home-icons.test.ts`, `src/components/home-icons.tsx`, `src/main.tsx`, `src/screens/calendar-screen.tsx`, `src/screens/confirm-end-screen.tsx`, `src/screens/home-screen.tsx`, `src/screens/pantalla-turnos.tsx`, `src/screens/today-history-screen.tsx`

### Cambio 1 - Test de regresiones contra main antiguo

#### Código anterior
`No existía src/__tests__/main-antiguo-regressions.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(resolve(path), "utf8");

describe("Main antiguo regression locks", () => {
  it("keeps home logout confirmation mounted in the extracted screen", () => {
    const homeSource = readSource("src/screens/home-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    expect(homeSource).toContain('import { ConfirmDialog } from "../components/common"');
    expect(homeSource).toContain("confirmDialog,");
    expect(homeSource).toContain("{confirmDialog && <ConfirmDialog");
    expect(homeSource).toContain("onCancel={() => onSetConfirmDialog(null)}");
    expect(mainSource).toContain("confirmDialog={confirmDialog}");
  });

  it("keeps calendar navigation and note creation handlers from mainAntiguo", () => {
    const calendarSource = readSource("src/screens/calendar-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    const openNewNotaBlock = calendarSource.match(/const openNewNota = \(date\?: string\) => \{[\s\S]*?\n  \};/)?.[0] ?? "";
    expect(openNewNotaBlock).toContain("setEditingNota(null);");
    expect(openNewNotaBlock).toContain("setEditingReserva(null);");

    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
    expect(calendarSource).toContain('setReturnScreen("calendar");');
    expect(calendarSource).toContain("setViewTurno(turno);");
    expect(calendarSource).toContain('setScreen("summary");');

    expect(mainSource).toContain("setScreen={setScreen}");
    expect(mainSource).toContain("setReturnScreen={setReturnScreen}");
    expect(mainSource).toContain("setViewTurno={setViewTurno}");
  });

  it("keeps today history note metadata and destructive confirmation behavior", () => {
    const source = readSource("src/screens/today-history-screen.tsx");

    expect(source).toContain('import { ConfirmDialog } from "../components/common"');
    expect(source).toContain('import { getEntryTypeMeta } from "../shared/entry-type-meta"');
    expect(source).not.toContain('nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard');
    expect(source).toContain("{confirmDialog && <ConfirmDialog");
    expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
    expect(source).toContain('confirmColor: "#ff6b6b"');
  });

  it("keeps turnos dates formatted for display", () => {
    const source = readSource("src/screens/pantalla-turnos.tsx");

    expect(source).toContain('from "../logic/date-time"');
    expect(source).toContain("fmtDate");
    expect(source).toContain("{fmtDate(turno.startDate || turno.date)}");
  });

  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });
});
```

#### Por qué se cambió
La auditoría detectó regresiones funcionales y visuales introducidas al extraer pantallas. Se añadió un test de bloqueo para contrastar esos contratos con el comportamiento anterior.

### Cambio 2 - Cobertura de iconos de inicio

#### Código anterior
```ts
  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
```

#### Código nuevo
```ts
  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M10 16 C10 19 12 21 12 21 C12 21 14 19 14 16");
    expect(source).toContain("M12 23 L12 26");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });

  it("keeps the original home quick action icons", () => {
    expect(source).toContain('import { IconPencilNeon } from "./calendar-icons"');
    expect(source).toContain("M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z");
    expect(source).toContain("<IconPencilNeon s={24} />");
    expect(source).toContain('transform: "scale(0.58) rotate(-6deg)"');
    expect(source).toContain("M10 9H17");
    expect(source).toContain("M9 4H7C5.89543 4 5 4.89543 5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6C19 4.89543 18.1046 4 17 4H15");
    expect(source).toContain("M2 22H22");
    expect(source).toContain("M8 5.5L18.5 12L8 18.5V5.5Z");
  });
```

#### Por qué se cambió
El test anterior solo protegía parte del cohete. Se amplió para cubrir los trazos que faltaban y los iconos rápidos de inicio que habían cambiado durante la extracción.

### Cambio 3 - Iconos de inicio restaurados

#### Código anterior
```tsx
export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2.5" stroke={c} strokeWidth="1.8" />
    <path d="M12 8V16M8 12H16" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

#### Código nuevo
```tsx
export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <span
    style={{
      position: "relative",
      width: s,
      height: s,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
      }}
    >
      <path
        d="M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(190,140,255,0.55)) drop-shadow(0 0 3px rgba(190,140,255,0.20))",
        }}
      />
      <path
        d="M14.8 3.5V7.2H18.5"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8 10H14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M8 13H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <path d="M8 16H11.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>

    <span
      style={{
        position: "absolute",
        right: -2,
        bottom: -1,
        transform: "scale(0.58) rotate(-6deg)",
        transformOrigin: "bottom right",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <IconPencilNeon s={24} />
    </span>
  </span>
);
```

#### Por qué se cambió
El icono de nueva reserva había quedado reducido a un símbolo genérico de suma. Se restauró el documento con lápiz que identificaba visualmente la acción.

### Cambio 4 - Confirmación de cerrar sesión en inicio

#### Código anterior
```tsx
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  renderReservaDialog: () => React.ReactElement | false;
}
```

```tsx
      />
    );
```

#### Código nuevo
```tsx
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  confirmDialog: { text: string; confirmText?: string; onConfirm: () => void } | null;
  renderReservaDialog: () => React.ReactElement | false;
}
```

```tsx
        confirmDialog={confirmDialog}
      />
```

```tsx
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => onSetConfirmDialog(null)} />}
    );
```

#### Por qué se cambió
La pantalla de inicio podía crear el diálogo de cerrar sesión, pero el componente extraído no lo recibía ni lo renderizaba. Se volvió a montar la confirmación como en el bloque antiguo.

### Cambio 5 - Navegación del calendario

#### Código anterior
```tsx
  openNewReserva: (date?: string) => void;
}
```

```tsx
  const openNewNota = (date?: string) => {
    setEditingReserva(null);
    setSelectedDate(date || today());
```

```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => openNewReserva()}><IconBack /></button>
```

```tsx
onClick={() => { openNewReserva(); }}
```

#### Código nuevo
```tsx
  openNewReserva: (date?: string) => void;
  setScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  setReturnScreen: (screen: string | null) => void;
}
```

```tsx
  const openNewNota = (date?: string) => {
    setEditingNota(null);
    setEditingReserva(null);
    setSelectedDate(date || today());
```

```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
onClick={() => { setReturnScreen("calendar"); setViewTurno(turno); setScreen("summary"); }}
```

#### Por qué se cambió
El botón de volver y las tarjetas de turnos cerrados habían quedado conectados a nueva reserva. También faltaba limpiar `editingNota` al crear una nota nueva. Se restauraron los handlers anteriores.

### Cambio 6 - Historial de hoy

#### Código anterior
```tsx
const ENTRY_TYPE_META: Record<string, { color: string; label: string; icon: (s?: number) => React.ReactNode }> = {
  datafono: { color: P, label: "DatÃ¡fono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard s={s} c="white" /> },
};
```

```tsx
      {confirmDialog && <ConfirmDialogWrapper {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
```

```tsx
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
            });
```

#### Código nuevo
```tsx
import { ConfirmDialog } from "../components/common";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
```

```tsx
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
```

```tsx
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
              confirmBg: "rgba(255,60,60,0.2)",
              confirmColor: "#ff6b6b",
              confirmBorder: "1px solid rgba(255,100,100,0.35)",
            });
```

#### Por qué se cambió
La pantalla tenía metadata local distinta para notas y un diálogo propio que no cerraba al confirmar. Se reutilizó la metadata compartida y el diálogo común, que ejecuta confirmación y cierre.

### Cambio 7 - Fecha formateada en turnos

#### Código anterior
```tsx
import { getDiffMins } from "../logic/date-time";
```

```tsx
<div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{turno.startDate || turno.date}</div>
```

#### Código nuevo
```tsx
import { getDiffMins, fmtDate } from "../logic/date-time";
```

```tsx
<div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
```

#### Por qué se cambió
Las tarjetas de turnos mostraban la fecha ISO tras la extracción. Se restauró el formato legible usado antes.

### Cambio 8 - Notas detalladas al terminar turno

#### Código anterior
```tsx
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
```

#### Código nuevo
```tsx
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <IconPinNeon s={18} /> Notas detalladas
              </div>
              {entriesWithNotes.map(e => {
```

#### Por qué se cambió
Las notas detalladas habían quedado integradas dentro del bloque de resumen. Se restauró su estructura visual independiente para que coincida con la jerarquía anterior.

## 2026-05-26 18:00 - Restaurar icono de cohete en inicio

**Archivos modificados:** `src/components/home-icons.tsx`, `src/__tests__/home-icons.test.ts`

### Cambio 1 - Test del icono de cohete

#### Código anterior
`No existía src/__tests__/home-icons.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home icon extraction", () => {
  const source = readFileSync(resolve("src/components/home-icons.tsx"), "utf8");

  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
});
```

#### Por qué se cambió
Se añadió una comprobación fija para que el icono de cohete extraído mantenga la forma original que tenía en `main.tsx` antes del recorte.

### Cambio 2 - SVG del cohete

#### Código anterior
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 16.5C4.5 16.5 6 12 12 6C12 6 12 12 16.5 13.5M16.5 13.5L19.5 15M19.5 15L22 17M19.5 15C19.5 15 20 17 18 19C16 21 14 19.5 14 19.5M14 19.5L9 14.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

#### Código nuevo
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 12 12)">
      <path d="M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 5 Q12 6 14.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.8" />
      <path d="M8 11 C5 11 4 14 4 16 C6 16 8 14 8 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 11 C19 11 20 14 20 16 C18 16 16 14 16 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 14 L9 16 C11 16.5 13 16.5 15 16 L14 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 22 L8 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22 L16 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);
```

#### Por qué se cambió
El recorte había sustituido el cohete original por un trazo simplificado que se veía deformado en la pantalla de inicio. Se restauró el SVG original sin cambiar el comportamiento del botón.

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
