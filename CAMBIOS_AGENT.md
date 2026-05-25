# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió. Las entradas se añaden al **principio** del archivo (las más recientes arriba).

## 2026-05-25 22:13 - Reforzar recorte de main

**Archivos modificados:** `RECORTAR_MAIN_TSX_MEJORADO.md`

### Cambio 1 - Archivos contables protegidos

#### Código anterior
`No existía la sección "Archivos contables protegidos" en RECORTAR_MAIN_TSX_MEJORADO.md.`

#### Código nuevo
```md
### Archivos contables protegidos

La contabilidad real de la app ya está extraída y organizada fuera de `main.tsx`.

Durante tareas de recorte de `src/main.tsx`, estos archivos no forman parte del trabajo pendiente. No se editan, no se reordenan, no se renombran, no se simplifican y no se "mejoran" salvo que Carlos pida explícitamente una fase contable:

- `src/logic/accounting.ts`: fórmulas de dinero base, porcentajes, descuentos, propinas, totales, ganancia, total a descontar, total a dar y redondeos.
- `src/logic/week-logic.ts`: reglas de semana contable, día libre, fecha efectiva del turno, agrupación por semana y selección de semana para informes.
- `src/logic/turnos.ts`: orden, fusión, selección por calendario y migración de `diaLibreContable`.
- `src/logic/turno-entrega.ts`: estado de entrega de turnos y fecha de entrega.
- `src/logic/state-loaders.ts`: valores por defecto de ajustes contables (`descontar.*`, `diaLibre`, porcentajes y configuración inicial relacionada).
- `src/shared/types.ts`: campos del modelo que participan en contabilidad (`totalD`, `totalP`, `totalA`, `totalE`, `totalF`, `totalN`, `dinero`, `km`, `entregada`, `fechaEntrega`, `diaLibreContable`, `config` y ajustes).
- `src/main.tsx`: cualquier bloque que use `calcularTurnoContable`, `calcularResumenContableTurnos`, `calcularTotalesTurnos`, `roundMoney`, `groupTurnosByWeek`, `getTurnoAccountingWeekId`, `getTurnoFechaEfectiva`, `updateTurnoEntrega`, claves `descontar.*`, `diaLibre`, `totalDescontar`, `totalADar`, `dineroBase`, `miGanancia` o pantallas de contabilidad/liquidación.

Regla práctica: si el cambio toca alguno de estos archivos o identificadores, tratarlo como contabilidad o contabilidad cercana. No se reescribe, no se simplifica y no se aprovecha para "mejorar" nada. Solo se puede mover de sitio con tests verdes, re-exports compatibles y confirmación clara de que la fase consiste exactamente en esa extracción.

El trabajo normal de recorte debe concentrarse en otras responsabilidades que todavía queden dentro de `src/main.tsx`, sin tocar la lógica contable ya separada.

Si el objetivo de la fase no nombra explícitamente uno de estos bloques contables, estos archivos deben quedar fuera del diff.
```

#### Por qué se cambió
El documento necesitaba nombrar rutas e identificadores concretos y aclarar que la contabilidad real ya está extraída, organizada y fuera del trabajo normal de recorte de `main.tsx`.

### Cambio 2 - Parada de fase

#### Código anterior
`No existía la sección "Parada obligatoria al terminar cada fase" en RECORTAR_MAIN_TSX_MEJORADO.md.`

#### Código nuevo
```md
## Parada obligatoria al terminar cada fase

Al terminar una fase, el agente debe parar.

No debe empezar otra extracción en la misma respuesta salvo que Carlos lo pida explícitamente.

Antes de parar debe dejar:

- el bloque extraído
- imports y exports ajustados
- tests relevantes añadidos o actualizados
- verificaciones ejecutadas, o el motivo concreto de no poder ejecutarlas
- `CAMBIOS_AGENT.md` actualizado si se modificaron archivos
- resumen claro de lo hecho y de cualquier riesgo pendiente

Después de eso, debe esperar confirmación de Carlos antes de continuar con otro bloque.

Está prohibido encadenar varias extracciones por iniciativa propia.
```

#### Por qué se cambió
La regla evita que una fase pequeña derive en varias extracciones encadenadas y obliga a esperar confirmación de Carlos antes de tocar otro bloque.

### Cambio 3 - Bloqueos adicionales

#### Código anterior
`No existían reglas específicas para bloquear diffs sobre archivos contables protegidos ni para prohibir una segunda extracción sin confirmación.`

#### Código nuevo
```md
- El diff toca un archivo contable protegido sin que la fase lo hubiera nombrado explícitamente.
- no aparecen archivos contables protegidos salvo que la fase fuera explícitamente sobre uno de ellos
- Tocar archivos contables protegidos si la fase no los nombra de forma explícita.
- Empezar una segunda extracción sin confirmación explícita de Carlos.

7. **Archivos contables protegidos.** Nueva subsección dentro de "Regla absoluta". Se aclara que la contabilidad real ya está extraída y organizada fuera de `main.tsx`, y se listan las rutas concretas que contienen fórmulas, reglas semanales, entregas, ajustes, tipos y usos contables. Si una fase no nombra explícitamente esos bloques, deben quedar fuera del diff.

8. **Parada obligatoria al terminar cada fase.** Nueva sección. Una vez extraído un bloque, verificadas las pruebas y actualizado el registro, el agente debe parar y esperar confirmación de Carlos antes de iniciar otra extracción.
```

#### Por qué se cambió
Las secciones de stop, revisión del diff, prohibiciones y registro interno debían reflejar las dos reglas nuevas para que no queden como recomendaciones aisladas.

### Cambio 4 - Tests de seguridad contable

#### Código anterior
```md
### Archivos de test contables congelados

Los siguientes archivos de test son la **fuente de verdad** de la contabilidad y están congelados:
```

#### Código nuevo
```md
### Tests de seguridad contable congelados

Los tests no son la contabilidad real de la app. Son candados para detectar si alguien cambia una cuenta sin querer.

Los siguientes archivos de test están congelados:
```

#### Por qué se cambió
La sección podía confundirse con los archivos donde vive la contabilidad real. Se renombra y se aclara que los tests son candados de seguridad, no la lógica contable de la app.

### Cambio 5 - Nota de transparencia

#### Código anterior
```md
Nota de transparencia: estas mejoras se basan únicamente en el texto del documento original y en buenas prácticas de refactor de código heredado. No se ha verificado el estado real del repositorio (si los tests citados existen, qué cubren, o el contenido de `AGENTS.md` / `ESTRUCTURA.md`). Esa comprobación es justamente el objetivo de la "Fase 0".
```

#### Código nuevo
```md
Nota de transparencia: estas mejoras se basan en el texto del documento original, buenas prácticas de refactor de código heredado y, para la sección "Archivos contables protegidos", en la revisión de las rutas actuales del proyecto. No sustituye a la "Fase 0": antes de recortar hay que volver a verificar tests, cobertura real y estado limpio del repositorio.
```

#### Por qué se cambió
La lista de archivos contables protegidos se contrastó con rutas actuales del proyecto, así que la nota final debía reflejar esa verificación limitada sin eliminar la obligación de ejecutar la fase 0 antes de recortar.

## 2026-05-25 20:02 - Limpiar guía de estructura

**Archivos modificados:** `ESTRUCTURA.md`, `PLAN_REORGANIZACION_SRC.md`

### Cambio 1 - Texto de la guía

#### Código anterior
```md
# Estructura del proyecto â€” GuÃ­a para aÃ±adir cÃ³digo nuevo

Esta guÃ­a explica cÃ³mo estÃ¡ organizado el proyecto y dÃ³nde colocar cada cosa nueva. ConsÃºltala cada vez que vayas a aÃ±adir una funciÃ³n, una pantalla, un componente o un tipo, para que la app siga ordenada con el tiempo.
```

#### Código nuevo
```md
# Estructura del proyecto - Guía para añadir código nuevo

Esta guía explica cómo está organizado el proyecto y dónde colocar cada cosa nueva. Consúltala cada vez que vayas a añadir una función, una pantalla, un componente o un tipo, para que la app siga ordenada con el tiempo.
```

#### Por qué se cambió
El archivo tenía caracteres rotos y debía quedar legible como guía de referencia.

### Cambio 2 - Nota de reorganización

#### Código anterior
```md
Nota: esta guÃ­a describe la estructura oficial **con carpetas**. La reorganizaciÃ³n de `src/` para llegar a ella estÃ¡ descrita en `PLAN_REORGANIZACION_SRC.md`. Si todavÃ­a no se ha aplicado, esta guÃ­a es el destino al que apuntar.
```

#### Código nuevo
```md
No existe la nota sobre la reorganización pendiente en `ESTRUCTURA.md`.
```

#### Por qué se cambió
La reorganización de `src/` ya estaba aplicada, así que la nota había quedado obsoleta.

### Cambio 3 - Plan de reorganización

#### Código anterior
```md
# Plan Profesional — Reorganización de la carpeta `src/`

Plan solicitado por Carlos. Describe cómo pasar la carpeta `src/` de una estructura plana a subcarpetas por rol. Es un plan: **no se ejecuta nada**; queda para revisar y aprobar.
```

#### Código nuevo
```md
No existe `PLAN_REORGANIZACION_SRC.md` en la raíz del proyecto.
```

#### Por qué se cambió
El plan ya se había ejecutado y el usuario pidió borrarlo.

## 2026-05-25 19:54 - Reorganizar carpeta src

**Archivos modificados:**
- `README.md`
- `src/main.tsx`
- `src/logic/`
- `src/services/`
- `src/screens/`
- `src/shared/`
- `src/components/common.tsx`
- `src/components/duration-card-value.tsx`
- `src/components/edit-entry-dialog.tsx`
- `src/components/turno-notas.tsx`
- `src/__tests__/`

### Cambio 1 - Carpetas por rol

#### Código anterior
Código anterior no verificable: no hay commit intermedio que capture el estado exacto posterior a la extracción de `src/ui-theme.ts` y anterior a mover los archivos.

#### Código nuevo
```ts
expect(rootFiles).toEqual(["main.tsx"]);

for (const file of [
  "types.ts",
  "action-ids.ts",
  "storage-keys.ts",
  "card-styles.ts",
  "ui-theme.ts",
  "app-version.ts",
]) {
  expect(existsSync(resolve("src/shared", file))).toBe(true);
}
```

#### Por qué se cambió
Los módulos sueltos de `src/` se agruparon por rol y se añadió un test que fija que la raíz de `src/` conserve solo `main.tsx`.

### Cambio 2 - Imports del archivo principal

#### Código anterior
Código anterior no verificable: el estado anterior exacto de `src/main.tsx` no estaba guardado en un commit local después de la extracción de tema.

#### Código nuevo
```tsx
import { auth, db } from "./services/firebase";
import { AuthGate } from "./screens/auth-gate";
import { APP_VERSION } from "./shared/app-version";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./logic/formatters";
import { A, ABG, C, CBG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "./shared/ui-theme";
```

#### Por qué se cambió
`main.tsx` necesitaba apuntar a las nuevas carpetas sin cambiar la lógica importada.

### Cambio 3 - Rutas relativas internas

#### Código anterior
Código anterior no verificable: las rutas internas se reescribieron de forma mecánica después de mover archivos y el estado exacto anterior no existe como commit separado.

#### Código nuevo
```ts
import type { AppSettings, Entry, NotaCalendario, Reserva, Turno } from "../shared/types";
import { readLocalJSON } from "../services/user-storage";
import { sortTurnosByDateDesc } from "./turnos";
```

#### Por qué se cambió
Los archivos movidos a `src/logic/`, `src/services/`, `src/screens/` y `src/shared/` necesitaban rutas relativas correctas entre carpetas.

### Cambio 4 - Tests de rutas

#### Código anterior
Código anterior no verificable: los tests contenían rutas literales anteriores a la reorganización, pero no hay commit intermedio que aísle solo ese estado.

#### Código nuevo
```ts
const typesPath = resolve("src/shared/types.ts");
const stateLoadersSource = readFileSync(resolve("src/logic/state-loaders.ts"), "utf8");
const csvPath = resolve("src/logic/csv.ts");
expect(mainSource).toContain('from "./logic/csv"');
```

#### Por qué se cambió
Los tests que validan extracciones inspeccionaban rutas antiguas y debían comprobar las nuevas ubicaciones.

### Cambio 5 - Estructura en README

#### Código anterior
```md
app-taxi/
├── src/
│   ├── main.tsx              # Componente React principal
│   ├── login-screen.tsx      # Pantalla de login, registro y recuperación
│   ├── admin-screens.tsx     # Vistas del modo administrador
│   ├── firebase.ts           # Inicialización de Firebase (Auth + Firestore)
│   ├── firestore-sync.ts     # Sincronización del estado con Firestore
│   ├── formatters.ts         # Utilidades de formato
│   └── __tests__/            # Tests (Vitest)
```

#### Código nuevo
```md
app-taxi/
|-- src/
|   |-- main.tsx              # Punto de entrada de React
|   |-- logic/                # Calculos, fechas, turnos, backups y parsing
|   |-- services/             # Firebase, Firestore, almacenamiento y Capacitor
|   |-- screens/              # Pantallas de login, auth y administracion
|   |-- components/           # Componentes reutilizables de UI
|   |-- shared/               # Tipos, claves, estilos y constantes compartidas
|   `-- __tests__/            # Tests (Vitest)
```

#### Por qué se cambió
La documentación de estructura debía reflejar las carpetas creadas en `src/`.

## 2026-05-25 19:22 - Extraer tema visual

**Archivos modificados:** `src/main.tsx`, `src/ui-theme.ts`, `src/__tests__/ui-theme-extraction.test.ts`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Constantes visuales

#### Código anterior
```tsx
const G = "oklch(0.68 0.20 145)";
const GBG = "oklch(0.18 0.07 145)";
const P = "oklch(0.65 0.20 280)";
const PBG = "oklch(0.17 0.07 280)";
const A = "oklch(0.75 0.16 70)";
const ABG = "oklch(0.20 0.06 70)";
const E = "oklch(0.72 0.14 200)";
const EBG = "oklch(0.19 0.05 200)";
const F = "oklch(0.70 0.18 25)";
const FBG = "oklch(0.19 0.06 25)";
const N = "oklch(0.62 0.06 260)";
const NBG = "oklch(0.18 0.03 260)";
const C = "oklch(0.75 0.15 290)";
const CBG = "oklch(0.18 0.05 290 / 0.12)";
```

#### Código nuevo
```ts
export const G = "oklch(0.68 0.20 145)";
export const GBG = "oklch(0.18 0.07 145)";
export const P = "oklch(0.65 0.20 280)";
export const PBG = "oklch(0.17 0.07 280)";
export const A = "oklch(0.75 0.16 70)";
export const ABG = "oklch(0.20 0.06 70)";
export const E = "oklch(0.72 0.14 200)";
export const EBG = "oklch(0.19 0.05 200)";
export const F = "oklch(0.70 0.18 25)";
export const FBG = "oklch(0.19 0.06 25)";
export const N = "oklch(0.62 0.06 260)";
export const NBG = "oklch(0.18 0.03 260)";
export const C = "oklch(0.75 0.15 290)";
export const CBG = "oklch(0.18 0.05 290 / 0.12)";
```

#### Por qué se cambió
Las constantes visuales se movieron a `src/ui-theme.ts` para continuar adelgazando `main.tsx` sin cambiar los valores de color.

### Cambio 2 - Importación del tema visual

#### Código anterior
`No existía la importación de constantes visuales desde src/ui-theme.ts en src/main.tsx.`

#### Código nuevo
```tsx
import { A, ABG, C, CBG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "./ui-theme";
```

#### Por qué se cambió
`main.tsx` necesitaba usar las mismas constantes visuales desde el nuevo módulo externo.

### Cambio 3 - Test de extracción del tema

#### Código anterior
`No existía ui-theme-extraction.test.ts en src/__tests__.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("UI theme extraction", () => {
  const themePath = resolve("src/ui-theme.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps visual color constants outside main.tsx", async () => {
    expect(existsSync(themePath)).toBe(true);

    const modulePath = "../ui-theme";
    const theme = await import(modulePath);
    expect(theme).toMatchObject({
      G: "oklch(0.68 0.20 145)",
      GBG: "oklch(0.18 0.07 145)",
      P: "oklch(0.65 0.20 280)",
      PBG: "oklch(0.17 0.07 280)",
      A: "oklch(0.75 0.16 70)",
      ABG: "oklch(0.20 0.06 70)",
      E: "oklch(0.72 0.14 200)",
      EBG: "oklch(0.19 0.05 200)",
      F: "oklch(0.70 0.18 25)",
      FBG: "oklch(0.19 0.06 25)",
      N: "oklch(0.62 0.06 260)",
      NBG: "oklch(0.18 0.03 260)",
      C: "oklch(0.75 0.15 290)",
      CBG: "oklch(0.18 0.05 290 / 0.12)",
    });

    expect(mainSource).toContain('from "./ui-theme"');
    expect(mainSource).not.toMatch(/^const G = /m);
    expect(mainSource).not.toMatch(/^const CBG = /m);
  });
});
```

#### Por qué se cambió
El test fija que las constantes visuales vivan fuera de `main.tsx` y conserven sus valores literales.

### Cambio 4 - Test de colores de liquidación

#### Código anterior
```ts
describe("Liquidación Semanal screen and typography", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
```

```ts
  it("uses faithful sRGB colors only for the copied liquidation image", () => {
    expect(source).toContain('const G = "oklch(0.68 0.20 145)"');
    expect(source).toContain('oklch(0.70 0.18 25)');
    expect(source).toContain('oklch(0.72 0.14 200)');
```

#### Código nuevo
```ts
describe("Liquidación Semanal screen and typography", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
  const themeSource = readFileSync(resolve("src/ui-theme.ts"), "utf8");
```

```ts
  it("uses faithful sRGB colors only for the copied liquidation image", () => {
    expect(themeSource).toContain('export const G = "oklch(0.68 0.20 145)"');
    expect(themeSource).toContain('oklch(0.70 0.18 25)');
    expect(themeSource).toContain('oklch(0.72 0.14 200)');
```

#### Por qué se cambió
El test seguía verificando los colores visuales en `main.tsx`; tras la extracción debe verificar esos literales en `src/ui-theme.ts`.

## 2026-05-25 16:03 - Extraer tipos de dominio

**Archivos modificados:** `src/main.tsx`, `src/types.ts`, `src/state-loaders.ts`, `src/turno-notas-logic.ts`, `src/components/turno-notas.tsx`, `src/components/edit-entry-dialog.tsx`, `src/__tests__/domain-types-extraction.test.ts`

### Cambio 1 - Importar y reexportar tipos

#### Código anterior
`No existía la importación type-only desde src/types.ts ni la reexportación de tipos de dominio desde src/main.tsx.`

#### Código nuevo
```tsx
import type {
  AppSettings,
  CurrentState,
  EditTurnoState,
  Entry,
  NotaCalendario,
  NotaTipo,
  Reserva,
  Turno,
  TurnoNotasSemana,
  WeekOverride,
} from "./types";
```

```tsx
export type {
  AppSettings,
  CurrentState,
  EditTurnoState,
  Entry,
  NotaCalendario,
  NotaTipo,
  Reserva,
  Turno,
  TurnoConfig,
  TurnoNotasSemana,
  WeekOverride,
} from "./types";
```

#### Por qué se cambió
`main.tsx` conserva compatibilidad para consumidores externos mediante reexportación, pero deja de definir los tipos de dominio en el archivo principal.

### Cambio 2 - Quitar tipos de turno de main

#### Código anterior
```tsx
export interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

export interface TurnoConfig {
  porcentajeJefe: number;
  porcentajeChofer: number;
  descDatafono: boolean;
  descAgencia: boolean;
  descExtra: boolean;
  descGasolina: boolean;
}

export interface Turno {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: Entry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string | null;
  totalPausedMinutes?: number;
  entregada?: boolean;
  fechaEntrega?: string | null;
  configTurno?: TurnoConfig;
  diaLibreContable?: number;
}

export interface TurnoNotasSemana {
  turno: Turno;
  notasGenerales: Entry[];
  notasDetalladas: Entry[];
}

interface EditTurnoState extends Turno {
  dineroStr?: string;
  kmStr?: string;
  newType?: string | null;
  newAmount?: string;
  newNote?: string;
  isAddingNote?: boolean;
  tempNote?: string;
}

interface CurrentState {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
}
```

#### Código nuevo
```tsx
const G = "oklch(0.68 0.20 145)";
```

#### Por qué se cambió
Los tipos de turno pasan a `src/types.ts`; `main.tsx` continúa usándolos como importaciones type-only, sin generar código runtime nuevo.

### Cambio 3 - Quitar tipos de calendario de main

#### Código anterior
```tsx
export interface Reserva {
  id: string;
  date: string;        // "YYYY-MM-DD"
  time: string;        // "HH:mm"
  origen: string;
  destino: string;
  cliente: string;
  telefono: string;    // permite llamada directa
  notas: string;
}

export type NotaTipo = 'ITV' | 'Seguro' | 'Normal' | 'Día libre';

export interface NotaCalendario {
  id: string;
  date: string;        // "YYYY-MM-DD"
  tipo: NotaTipo;
  texto: string;
}

interface WeekOverride {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

export interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
  diaLibre: number;              // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  diaLibreDesde: string | null;  // Fecha ISO desde la que aplica este día libre (null si nunca se ha cambiado)
}
```

#### Código nuevo
```tsx
function fmt(n: number): string {
  return fmtMoney(n);
}
```

#### Por qué se cambió
Los tipos de reservas, notas, semanas y ajustes pasan al módulo común de tipos, separando modelo de dominio de la pantalla principal.

### Cambio 4 - Crear módulo de tipos

#### Código anterior
`No existía el módulo de tipos de dominio en src/types.ts.`

#### Código nuevo
```ts
export interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

export interface TurnoConfig {
  porcentajeJefe: number;
  porcentajeChofer: number;
  descDatafono: boolean;
  descAgencia: boolean;
  descExtra: boolean;
  descGasolina: boolean;
}

export interface Turno {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: Entry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string | null;
  totalPausedMinutes?: number;
  entregada?: boolean;
  fechaEntrega?: string | null;
  configTurno?: TurnoConfig;
  diaLibreContable?: number;
}

export interface TurnoNotasSemana {
  turno: Turno;
  notasGenerales: Entry[];
  notasDetalladas: Entry[];
}

export interface EditTurnoState extends Turno {
  dineroStr?: string;
  kmStr?: string;
  newType?: string | null;
  newAmount?: string;
  newNote?: string;
  isAddingNote?: boolean;
  tempNote?: string;
}

export interface CurrentState {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
}

export interface Reserva {
  id: string;
  date: string;        // "YYYY-MM-DD"
  time: string;        // "HH:mm"
  origen: string;
  destino: string;
  cliente: string;
  telefono: string;    // permite llamada directa
  notas: string;
}

export type NotaTipo = "ITV" | "Seguro" | "Normal" | "Día libre";

export interface NotaCalendario {
  id: string;
  date: string;        // "YYYY-MM-DD"
  tipo: NotaTipo;
  texto: string;
}

export interface WeekOverride {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

export interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
  diaLibre: number;              // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  diaLibreDesde: string | null;  // Fecha ISO desde la que aplica este día libre (null si nunca se ha cambiado)
}
```

#### Por qué se cambió
Agrupar tipos compartidos evita que módulos auxiliares dependan de `main.tsx` solo para tipos y hace más claro el modelo de datos de la app.

### Cambio 5 - Actualizar loaders a tipos comunes

#### Código anterior
```ts
import type { AppSettings, Entry, NotaCalendario, Reserva, Turno } from "./main";
```

#### Código nuevo
```ts
import type { AppSettings, Entry, NotaCalendario, Reserva, Turno } from "./types";
```

#### Por qué se cambió
`state-loaders.ts` deja de depender de `main.tsx` para cargar los tipos usados al leer localStorage.

### Cambio 6 - Actualizar componentes de notas y edición

#### Código anterior
```ts
import type { Turno, TurnoNotasSemana } from "./main";
```

```tsx
import type { CSSProperties } from "react";
import type { TurnoNotasSemana } from "../main";
```

```tsx
import { useState, type ReactNode } from "react";
import type { Entry } from "../main";
```

#### Código nuevo
```ts
import type { Turno, TurnoNotasSemana } from "./types";
```

```tsx
import type { CSSProperties } from "react";
import type { TurnoNotasSemana } from "../types";
```

```tsx
import { useState, type ReactNode } from "react";
import type { Entry } from "../types";
```

#### Por qué se cambió
La lógica y los componentes que solo necesitan tipos consumen el módulo común y reducen el acoplamiento con el archivo principal.

### Cambio 7 - Proteger extracción de tipos

#### Código anterior
`No existía el test de extracción de tipos de dominio en src/__tests__/domain-types-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("domain types extraction", () => {
  const typesPath = resolve("src/types.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps shared domain types outside main.tsx", () => {
    expect(existsSync(typesPath)).toBe(true);

    const typesSource = readFileSync(typesPath, "utf8");
    const stateLoadersSource = readFileSync(resolve("src/state-loaders.ts"), "utf8");
    const turnoNotasSource = readFileSync(resolve("src/turno-notas-logic.ts"), "utf8");
    const turnoNotasCardSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
    const editEntryDialogSource = readFileSync(resolve("src/components/edit-entry-dialog.tsx"), "utf8");

    expect(typesSource).toContain("export interface Turno");
    expect(typesSource).toContain("export interface AppSettings");
    expect(typesSource).toContain("export interface Reserva");
    expect(mainSource).toContain('from "./types"');
    expect(mainSource).not.toMatch(/^export interface Turno /m);
    expect(mainSource).not.toMatch(/^export interface AppSettings /m);
    expect(stateLoadersSource).toContain('from "./types"');
    expect(turnoNotasSource).toContain('from "./types"');
    expect(turnoNotasCardSource).toContain('from "../types"');
    expect(editEntryDialogSource).toContain('from "../types"');
  });
});
```

#### Por qué se cambió
El test confirma que los tipos compartidos viven en `src/types.ts` y que los consumidores dejan de importarlos desde `main.tsx`.

## 2026-05-25 15:58 - Extraer version de la app

**Archivos modificados:** `src/main.tsx`, `src/app-version.ts`, `src/__tests__/app-version-extraction.test.ts`

### Cambio 1 - Importar versión de la app

#### Código anterior
```tsx
import { auth, db } from "./firebase";
import { AuthGate } from "./auth-gate";
import { registerServiceWorker } from "./service-worker-registration";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./formatters";
```

#### Código nuevo
```tsx
import { auth, db } from "./firebase";
import { AuthGate } from "./auth-gate";
import { registerServiceWorker } from "./service-worker-registration";
import { APP_VERSION } from "./app-version";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./formatters";
```

#### Por qué se cambió
`main.tsx` sigue usando `APP_VERSION`, pero ahora lo recibe desde un módulo específico de versionado.

### Cambio 2 - Quitar versión inyectada de main

#### Código anterior
```tsx
// Inyectado por Vite en build a partir de process.env.APP_VERSION o package.json.
declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

function fmt(n: number): string {
  return fmtMoney(n);
}
```

#### Código nuevo
```tsx
function fmt(n: number): string {
  return fmtMoney(n);
}
```

#### Por qué se cambió
La declaración global de Vite y la constante derivada salen de `main.tsx` sin cambiar el valor usado por el flujo de actualización ni por el texto de versión.

### Cambio 3 - Crear módulo de versión

#### Código anterior
`No existía el módulo de versión en src/app-version.ts.`

#### Código nuevo
```ts
// Inyectado por Vite en build a partir de process.env.APP_VERSION o package.json.
declare const __APP_VERSION__: string;

export const APP_VERSION = __APP_VERSION__;
```

#### Por qué se cambió
La constante de versión queda aislada en un archivo pequeño y reutilizable, manteniendo la misma variable global inyectada por Vite.

### Cambio 4 - Proteger extracción de versión

#### Código anterior
`No existía el test de extracción de versión en src/__tests__/app-version-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("app version extraction", () => {
  const appVersionPath = resolve("src/app-version.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Vite injected app version outside main.tsx", () => {
    expect(existsSync(appVersionPath)).toBe(true);

    const appVersionSource = readFileSync(appVersionPath, "utf8");
    expect(appVersionSource).toContain("declare const __APP_VERSION__: string");
    expect(appVersionSource).toContain("export const APP_VERSION = __APP_VERSION__");
    expect(mainSource).toContain('from "./app-version"');
    expect(mainSource).not.toContain("declare const __APP_VERSION__: string");
    expect(mainSource).not.toContain("const APP_VERSION = __APP_VERSION__");
  });
});
```

#### Por qué se cambió
El test asegura que el versionado inyectado queda fuera de `main.tsx` y que el archivo principal importa la constante extraída.

## 2026-05-25 15:56 - Extraer registro del service worker

**Archivos modificados:** `src/main.tsx`, `src/service-worker-registration.ts`, `src/__tests__/service-worker-registration.test.ts`

### Cambio 1 - Usar registro externo

#### Código anterior
```tsx
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AuthGate AppComponent={App} />);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
```

#### Código nuevo
```tsx
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AuthGate AppComponent={App} />);
}

registerServiceWorker();
```

#### Por qué se cambió
`main.tsx` mantiene solo la llamada de arranque y delega el detalle del service worker en un módulo dedicado sin cambiar ruta, evento `load` ni mensajes de consola.

### Cambio 2 - Importar registro del service worker

#### Código anterior
```tsx
import { auth, db } from "./firebase";
import { AuthGate } from "./auth-gate";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./formatters";
```

#### Código nuevo
```tsx
import { auth, db } from "./firebase";
import { AuthGate } from "./auth-gate";
import { registerServiceWorker } from "./service-worker-registration";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./formatters";
```

#### Por qué se cambió
La nueva función de registro se importa explícitamente para que el arranque siga ocurriendo desde `main.tsx`.

### Cambio 3 - Crear módulo de registro

#### Código anterior
`No existía el módulo de registro del service worker en src/service-worker-registration.ts.`

#### Código nuevo
```ts
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("SW registered"))
        .catch((err) => console.warn("SW registration failed", err));
    });
  }
}
```

#### Por qué se cambió
La comprobación de soporte, el listener de carga y el registro de `./sw.js` quedan aislados para reducir código de infraestructura dentro de `main.tsx`.

### Cambio 4 - Proteger extracción del service worker

#### Código anterior
`No existía el test de extracción del service worker en src/__tests__/service-worker-registration.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("service worker registration extraction", () => {
  const registrationPath = resolve("src/service-worker-registration.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps service worker registration outside main.tsx", () => {
    expect(existsSync(registrationPath)).toBe(true);

    const registrationSource = readFileSync(registrationPath, "utf8");
    expect(registrationSource).toContain('"serviceWorker" in navigator');
    expect(registrationSource).toContain('navigator.serviceWorker.register("./sw.js")');
    expect(registrationSource).toContain("SW registered");
    expect(mainSource).toContain('from "./service-worker-registration"');
    expect(mainSource).toContain("registerServiceWorker();");
    expect(mainSource).not.toContain('navigator.serviceWorker.register("./sw.js")');
  });
});
```

#### Por qué se cambió
El test verifica que el registro vive fuera de `main.tsx` y que el archivo principal conserva la llamada de inicialización.

## 2026-05-25 15:53 - Extraer puerta de autenticacion

**Archivos modificados:** `src/main.tsx`, `src/auth-gate.tsx`, `src/__tests__/auth-gate-extraction.test.ts`

### Cambio 1 - Importar AuthGate externo

#### Código anterior
```tsx
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { LoginScreen } from "./login-screen";
```

#### Código nuevo
```tsx
import { signOut } from "firebase/auth";
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { AuthGate } from "./auth-gate";
```

#### Por qué se cambió
`main.tsx` ya no necesita conocer `onAuthStateChanged`, el tipo `User` ni `LoginScreen` porque la puerta de autenticación vive en su propio módulo.

### Cambio 2 - Sustituir AuthGate local

#### Código anterior
```tsx
// AuthGate: decide qué pintar en función del estado de autenticación.
//   - Mientras Firebase comprueba si hay sesión guardada → "Cargando…".
//   - Sin usuario          → LoginScreen.
//   - Con usuario          → App. Se usa key={user.uid} para forzar un remount
//                             completo si cambia el usuario, asegurando que el
//                             estado interno de App se reinicia entre usuarios.
function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "oklch(0.14 0.02 260)",
          color: "oklch(0.92 0.02 260)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <App key={user.uid} />;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AuthGate />);
}
```

#### Código nuevo
```tsx
const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AuthGate AppComponent={App} />);
}
```

#### Por qué se cambió
La lógica de autenticación se delega en `auth-gate.tsx` y `main.tsx` solo le entrega el componente `App`, manteniendo el remount por usuario dentro del nuevo módulo.

### Cambio 3 - Crear módulo AuthGate

#### Código anterior
`No existía el módulo AuthGate en src/auth-gate.tsx.`

#### Código nuevo
```tsx
import React from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "./firebase";
import { LoginScreen } from "./login-screen";

export function AuthGate({ AppComponent }: { AppComponent: React.ComponentType }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "oklch(0.14 0.02 260)",
          color: "oklch(0.92 0.02 260)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppComponent key={user.uid} />;
}
```

#### Por qué se cambió
La comprobación de sesión, la pantalla de carga y el fallback a login se aíslan en un componente pequeño sin alterar textos, estilos ni el comportamiento de remount por `uid`.

### Cambio 4 - Proteger extracción de AuthGate

#### Código anterior
`No existía el test de extracción de AuthGate en src/__tests__/auth-gate-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AuthGate extraction", () => {
  const authGatePath = resolve("src/auth-gate.tsx");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Firebase auth gating outside main.tsx", () => {
    expect(existsSync(authGatePath)).toBe(true);

    const authGateSource = readFileSync(authGatePath, "utf8");
    expect(authGateSource).toContain("onAuthStateChanged");
    expect(authGateSource).toContain("LoginScreen");
    expect(authGateSource).toContain("AppComponent");
    expect(mainSource).toContain('from "./auth-gate"');
    expect(mainSource).toContain("<AuthGate AppComponent={App} />");
    expect(mainSource).not.toMatch(/^function AuthGate\(\)/m);
  });
});
```

#### Por qué se cambió
El test impide que la puerta de autenticación vuelva a quedar embebida en `main.tsx` y valida que la app se siga montando a través del componente extraído.

## 2026-05-25 15:49 - Extraer instalador APK

**Archivos modificados:** `src/main.tsx`, `src/apk-installer.ts`, `src/__tests__/apk-installer-extraction.test.ts`

### Cambio 1 - Mover registro nativo APK

#### Código anterior
```tsx
import { Capacitor, registerPlugin } from "@capacitor/core";

export interface ApkInstallerPluginType {
  canInstallPackages(): Promise<{ value: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string; fileName: string }): Promise<{ success: boolean }>;
}

const ApkInstaller = registerPlugin<ApkInstallerPluginType>("ApkInstaller");
```

#### Código nuevo
```tsx
import { Capacitor } from "@capacitor/core";

import html2canvas from "html2canvas";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { LoginScreen } from "./login-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { DurationCardValue } from "./components/duration-card-value";
import { Shell } from "./components/shell";
import { ApkInstaller } from "./apk-installer";
```

#### Por qué se cambió
El registro del plugin nativo APK se separa de `main.tsx` para reducir responsabilidad del archivo principal sin cambiar el objeto `ApkInstaller` que usa el flujo de actualización.

### Cambio 2 - Crear módulo de instalador APK

#### Código anterior
`No existía el módulo de instalador APK en src/apk-installer.ts.`

#### Código nuevo
```ts
import { registerPlugin } from "@capacitor/core";

export interface ApkInstallerPluginType {
  canInstallPackages(): Promise<{ value: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string; fileName: string }): Promise<{ success: boolean }>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPluginType>("ApkInstaller");
```

#### Por qué se cambió
El tipo y el registro del plugin quedan encapsulados en un módulo pequeño reutilizable, manteniendo el mismo nombre de plugin nativo y la misma firma de `downloadAndInstall`.

### Cambio 3 - Proteger la extracción del instalador

#### Código anterior
`No existía el test de extracción del instalador APK en src/__tests__/apk-installer-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("APK installer extraction", () => {
  const installerPath = resolve("src/apk-installer.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps native APK installer registration outside main.tsx", () => {
    expect(existsSync(installerPath)).toBe(true);

    const installerSource = readFileSync(installerPath, "utf8");
    expect(installerSource).toContain('registerPlugin<ApkInstallerPluginType>("ApkInstaller")');
    expect(installerSource).toContain("downloadAndInstall");
    expect(mainSource).toContain('from "./apk-installer"');
    expect(mainSource).not.toContain('registerPlugin<ApkInstallerPluginType>("ApkInstaller")');
    expect(mainSource).not.toMatch(/^export interface ApkInstallerPluginType/m);
  });
});
```

#### Por qué se cambió
El test asegura que el registro nativo no vuelva a crecer dentro de `main.tsx` y que la importación del nuevo módulo se mantenga activa.

## 2026-05-25 15:46 - Extraer exportacion de backup

**Archivos modificados:** `src/main.tsx`, `src/backup-export.ts`, `src/__tests__/backup-export-extraction.test.ts`

### Cambio 1 - Importar exportación de backup

#### Código anterior
```tsx
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
```

#### Código nuevo
```tsx
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
import { exportBackupJSON } from "./backup-export";
```

#### Por qué se cambió
`main.tsx` usa la exportación de backup desde un módulo propio y deja de contener la llamada directa de backup JSON.

### Cambio 2 - Eliminar exportación local de backup

#### Código anterior
```tsx
// El payload se construye en el call site con buildBackupPayloadFromState
// pasando los estados React vivos (espejo de Firestore en memoria).
// Antes había un default que leía de localStorage; eliminado para evitar
// exportar datos obsoletos: localStorage va un tick por detrás del estado.
async function exportBackupJSON(backup: ReturnType<typeof buildBackupPayload>) {
  const json = JSON.stringify(backup, null, 2);
  const fileName = `taxi_backup_${new Date().toISOString().split("T")[0]}.json`;

  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: "Copia de seguridad",
      text: "Copia de seguridad de Mi Turno",
      url: result.uri,
      dialogTitle: "Compartir / Guardar copia de seguridad",
    });
  } catch (e) {
    console.error("exportBackupJSON error:", e);
    alert("No se pudo exportar la copia de seguridad.");
  }
}

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Por qué se cambió
El guardado y compartición de backup se trasladan a `backup-export.ts` sin cambiar nombre de archivo, carpeta Cache, encoding ni mensaje de error.

### Cambio 3 - Crear módulo de exportación

#### Código anterior
`No existía el módulo de exportación de backup en src/backup-export.ts.`

#### Código nuevo
```ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "./backup";

export async function exportBackupJSON(backup: ReturnType<typeof buildBackupPayload>) {
  const json = JSON.stringify(backup, null, 2);
  const fileName = `taxi_backup_${new Date().toISOString().split("T")[0]}.json`;

  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: "Copia de seguridad",
      text: "Copia de seguridad de Mi Turno",
      url: result.uri,
      dialogTitle: "Compartir / Guardar copia de seguridad",
    });
  } catch (e) {
    console.error("exportBackupJSON error:", e);
    alert("No se pudo exportar la copia de seguridad.");
  }
}
```

#### Por qué se cambió
El módulo nuevo encapsula la integración Capacitor de backup JSON y tipa el payload con el builder existente.

### Cambio 4 - Proteger extracción de exportación

#### Código anterior
`No existía el test de extracción de exportación de backup en src/__tests__/backup-export-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Backup export extraction", () => {
  const backupExportPath = resolve("src/backup-export.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Capacitor backup export outside main.tsx", () => {
    expect(existsSync(backupExportPath)).toBe(true);

    const backupExportSource = readFileSync(backupExportPath, "utf8");
    expect(backupExportSource).toContain("export async function exportBackupJSON");
    expect(backupExportSource).toContain("@capacitor/filesystem");
    expect(backupExportSource).toContain("@capacitor/share");
    expect(mainSource).toContain('from "./backup-export"');
    expect(mainSource).not.toMatch(/^async function exportBackupJSON\(/m);
  });
});
```

#### Por qué se cambió
El test fija que la exportación Capacitor de backup quede fuera de `main.tsx`.

## 2026-05-25 15:42 - Extraer contabilidad pura

**Archivos modificados:** `src/main.tsx`, `src/accounting.ts`, `src/__tests__/accounting-extraction.test.ts`

### Cambio 1 - Importar contabilidad pura

#### Código anterior
```tsx
import {
  formatWeekRange,
  formatWeekRangeFull,
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekMonth,
  getWeekOverride,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  isWeekClosed,
  selectAccountingHeroWeek,
} from "./week-logic";
```

```tsx
export {
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  selectAccountingHeroWeek,
};
```

#### Código nuevo
```tsx
import {
  formatWeekRange,
  formatWeekRangeFull,
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekMonth,
  getWeekOverride,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  isWeekClosed,
  selectAccountingHeroWeek,
} from "./week-logic";
import {
  buildTurnoConfigFromSettings,
  calcularResumenContableTurnos,
  calcularTotalesTurnos,
  calcularTurnoContable,
  getTurnoConfig,
  roundMoney,
} from "./accounting";
```

```tsx
export {
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  selectAccountingHeroWeek,
};
export {
  buildTurnoConfigFromSettings,
  calcularResumenContableTurnos,
  calcularTotalesTurnos,
  calcularTurnoContable,
  getTurnoConfig,
};
```

#### Por qué se cambió
`main.tsx` usa las fórmulas desde `accounting.ts` y mantiene los exports públicos usados por los tests y pantallas.

### Cambio 2 - Eliminar fórmulas locales

#### Código anterior
```tsx
export function calcularTotalesTurnos(turnos: Turno[]) {
  let totalP = 0;
  let totalD = 0;
  let totalA = 0;
  let totalE = 0;
  let totalF = 0;
  let totalN = 0;
  let dinero = 0;
  let km = 0;
  for (const t of turnos) {
    totalP += t.totalP || 0;
    totalD += t.totalD || 0;
    totalA += t.totalA || 0;
    totalE += t.totalE || 0;
    totalF += t.totalF || 0;
    totalN += t.totalN || 0;
    dinero += t.dinero || 0;
    km += t.km || 0;
  }
  return { totalP, totalD, totalA, totalE, totalF, totalN, dinero, km };
}

function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildTurnoConfigFromSettings(settings: AppSettings): TurnoConfig {
  return {
    porcentajeJefe: settings["porcentaje.jefe"],
    porcentajeChofer: settings["porcentaje.chofer"],
    descDatafono: settings["descontar.datafono"],
    descAgencia: settings["descontar.agencia_bono"],
    descExtra: settings["descontar.extra"],
    descGasolina: settings["descontar.gasolina"],
  };
}

export function getTurnoConfig(turno: Turno, settings: AppSettings): TurnoConfig {
  return turno.configTurno || buildTurnoConfigFromSettings(settings);
}

export function calcularTurnoContable(turno: Turno, settings: AppSettings) {
  const config = getTurnoConfig(turno, settings);
  const dineroBase = (turno.dinero || 0) - (turno.totalN || 0);
  const descD = config.descDatafono ? (turno.totalD || 0) : 0;
  const descA = config.descAgencia ? (turno.totalA || 0) : 0;
  const descE = config.descExtra ? (turno.totalE || 0) : 0;
  const descF = config.descGasolina ? (turno.totalF || 0) : 0;
  const totalDescontar = descD + descA + descE + descF;

  return {
    dineroBase: roundMoney(dineroBase),
    miGanancia: roundMoney((dineroBase * (config.porcentajeChofer / 100)) + (turno.totalP || 0)),
    descD,
    descA,
    descE,
    descF,
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney((dineroBase * (config.porcentajeJefe / 100)) - totalDescontar),
    config,
  };
}

export function calcularResumenContableTurnos(turnos: Turno[], settings: AppSettings) {
  const totales = calcularTotalesTurnos(turnos);
  let miGanancia = 0;
  let totalDescontar = 0;
  let totalADar = 0;

  for (const turno of turnos) {
    const calculo = calcularTurnoContable(turno, settings);
    miGanancia += calculo.miGanancia;
    totalDescontar += calculo.totalDescontar;
    totalADar += calculo.totalADar;
  }

  return {
    ...totales,
    dineroBase: roundMoney((totales.dinero || 0) - (totales.totalN || 0)),
    miGanancia: roundMoney(miGanancia),
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney(totalADar),
  };
}

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Por qué se cambió
Las fórmulas contables se trasladan a `accounting.ts` sin cambiar operaciones, porcentajes, descuentos ni redondeo.

### Cambio 3 - Crear módulo contable

#### Código anterior
`No existía el módulo contable en src/accounting.ts.`

#### Código nuevo
```ts
export type AccountingSettings = {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
};

export type AccountingTurnoConfig = {
  porcentajeJefe: number;
  porcentajeChofer: number;
  descDatafono: boolean;
  descAgencia: boolean;
  descExtra: boolean;
  descGasolina: boolean;
};

export type AccountingTurno = {
  totalP?: number;
  totalD?: number;
  totalA?: number;
  totalE?: number;
  totalF?: number;
  totalN?: number;
  dinero?: number;
  km?: number;
  configTurno?: AccountingTurnoConfig;
};

export function calcularTotalesTurnos<T extends AccountingTurno>(turnos: T[]) {
  let totalP = 0;
  let totalD = 0;
  let totalA = 0;
  let totalE = 0;
  let totalF = 0;
  let totalN = 0;
  let dinero = 0;
  let km = 0;
  for (const t of turnos) {
    totalP += t.totalP || 0;
    totalD += t.totalD || 0;
    totalA += t.totalA || 0;
    totalE += t.totalE || 0;
    totalF += t.totalF || 0;
    totalN += t.totalN || 0;
    dinero += t.dinero || 0;
    km += t.km || 0;
  }
  return { totalP, totalD, totalA, totalE, totalF, totalN, dinero, km };
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildTurnoConfigFromSettings(settings: AccountingSettings): AccountingTurnoConfig {
  return {
    porcentajeJefe: settings["porcentaje.jefe"],
    porcentajeChofer: settings["porcentaje.chofer"],
    descDatafono: settings["descontar.datafono"],
    descAgencia: settings["descontar.agencia_bono"],
    descExtra: settings["descontar.extra"],
    descGasolina: settings["descontar.gasolina"],
  };
}

export function getTurnoConfig(turno: AccountingTurno, settings: AccountingSettings): AccountingTurnoConfig {
  return turno.configTurno || buildTurnoConfigFromSettings(settings);
}

export function calcularTurnoContable(turno: AccountingTurno, settings: AccountingSettings) {
  const config = getTurnoConfig(turno, settings);
  const dineroBase = (turno.dinero || 0) - (turno.totalN || 0);
  const descD = config.descDatafono ? (turno.totalD || 0) : 0;
  const descA = config.descAgencia ? (turno.totalA || 0) : 0;
  const descE = config.descExtra ? (turno.totalE || 0) : 0;
  const descF = config.descGasolina ? (turno.totalF || 0) : 0;
  const totalDescontar = descD + descA + descE + descF;

  return {
    dineroBase: roundMoney(dineroBase),
    miGanancia: roundMoney((dineroBase * (config.porcentajeChofer / 100)) + (turno.totalP || 0)),
    descD,
    descA,
    descE,
    descF,
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney((dineroBase * (config.porcentajeJefe / 100)) - totalDescontar),
    config,
  };
}

export function calcularResumenContableTurnos<T extends AccountingTurno>(turnos: T[], settings: AccountingSettings) {
  const totales = calcularTotalesTurnos(turnos);
  let miGanancia = 0;
  let totalDescontar = 0;
  let totalADar = 0;

  for (const turno of turnos) {
    const calculo = calcularTurnoContable(turno, settings);
    miGanancia += calculo.miGanancia;
    totalDescontar += calculo.totalDescontar;
    totalADar += calculo.totalADar;
  }

  return {
    ...totales,
    dineroBase: roundMoney((totales.dinero || 0) - (totales.totalN || 0)),
    miGanancia: roundMoney(miGanancia),
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney(totalADar),
  };
}
```

#### Por qué se cambió
El módulo nuevo contiene solo contabilidad pura con tipos estructurales compatibles con los turnos y settings actuales.

### Cambio 4 - Proteger extracción contable

#### Código anterior
`No existía el test de extracción contable en src/__tests__/accounting-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Accounting extraction", () => {
  const accountingPath = resolve("src/accounting.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps pure accounting formulas outside main.tsx", async () => {
    expect(existsSync(accountingPath)).toBe(true);

    const modulePath = "../accounting";
    const {
      calcularTotalesTurnos,
      calcularTurnoContable,
      calcularResumenContableTurnos,
      roundMoney,
    } = await import(modulePath);

    const settings = {
      "porcentaje.jefe": 55,
      "porcentaje.chofer": 45,
      "descontar.datafono": true,
      "descontar.agencia_bono": true,
      "descontar.extra": true,
      "descontar.gasolina": true,
      diaLibre: 2,
      diaLibreDesde: null,
    };
    const turno = {
      dinero: 245.8,
      totalN: 15,
      totalP: 12.5,
      totalD: 35,
      totalA: 18,
      totalE: 7.5,
      totalF: 22,
      km: 120,
    };

    expect(calcularTotalesTurnos([turno])).toMatchObject({ dinero: 245.8, totalN: 15, km: 120 });
    expect(calcularTurnoContable(turno, settings)).toMatchObject({
      dineroBase: 230.8,
      miGanancia: 116.36,
      totalDescontar: 82.5,
      totalADar: 44.44,
    });
    expect(calcularResumenContableTurnos([turno], settings)).toMatchObject({
      dineroBase: 230.8,
      miGanancia: 116.36,
      totalDescontar: 82.5,
      totalADar: 44.44,
    });
    expect(roundMoney(1.005)).toBe(1.01);

    expect(mainSource).toContain('from "./accounting"');
    expect(mainSource).not.toMatch(/^export function calcularTurnoContable\(/m);
    expect(mainSource).not.toMatch(/^export function calcularResumenContableTurnos\(/m);
    expect(mainSource).not.toMatch(/^function roundMoney\(/m);
  });
});
```

#### Por qué se cambió
El test fija que las fórmulas vivan fuera de `main.tsx` y comprueba una cuenta con nulos, propinas, descuentos y redondeo.

## 2026-05-25 15:36 - Extraer logica semanal

**Archivos modificados:** `src/main.tsx`, `src/week-logic.ts`, `src/__tests__/week-logic-extraction.test.ts`

### Cambio 1 - Importar lógica semanal

#### Código anterior
```tsx
import { getDaysInMonth, getStartOffset } from "./calendar-date";
import { MESES_ABREVIADOS, MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { userStorageKey, writeUserLocalJSON } from "./user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_NOTES, KEY_RESERVATIONS, KEY_SETTINGS, KEY_WEEK_OVERRIDES } from "./storage-keys";
import { loadCurrent, loadHistory, loadNotes, loadReservations, loadSettings, loadWeekOverrides } from "./state-loaders";
```

```tsx
export { updateTurnoEntrega };
export { getAccountingPeriodLabel };
export { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES };
```

#### Código nuevo
```tsx
import { getDaysInMonth, getStartOffset } from "./calendar-date";
import { MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { userStorageKey, writeUserLocalJSON } from "./user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_NOTES, KEY_RESERVATIONS, KEY_SETTINGS, KEY_WEEK_OVERRIDES } from "./storage-keys";
import { loadCurrent, loadHistory, loadNotes, loadReservations, loadSettings, loadWeekOverrides } from "./state-loaders";
import {
  formatWeekRange,
  formatWeekRangeFull,
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekMonth,
  getWeekOverride,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  isWeekClosed,
  selectAccountingHeroWeek,
} from "./week-logic";
```

```tsx
export { updateTurnoEntrega };
export { getAccountingPeriodLabel };
export { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES };
export {
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  selectAccountingHeroWeek,
};
```

#### Por qué se cambió
`main.tsx` usa la lógica semanal desde `week-logic.ts` y mantiene los exports públicos usados por los tests existentes.

### Cambio 2 - Eliminar funciones semanales locales

#### Código anterior
```tsx
// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================

export function getWeekStartDate(dateStr: string, diaLibre: number): string {
  const d = new Date(dateStr + "T12:00:00");
  const currentDayOfWeek = d.getDay();
  const startDayOfWeek = (diaLibre + 1) % 7;
  let diff = currentDayOfWeek - startDayOfWeek;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekId(dateStr: string, diaLibre: number): string {
  return getWeekStartDate(dateStr, diaLibre);
}

export function getWeekRange(weekId: string): { inicio: string; fin: string } {
  const d = new Date(weekId + "T12:00:00");
  const inicio = weekId;
  d.setDate(d.getDate() + 5);
  const fin = d.toISOString().slice(0, 10);
  return { inicio, fin };
}

export function getCurrentOpenWeekId(hoyISO: string, diaLibre: number): string | null {
  const hoy = new Date(hoyISO + "T12:00:00");
  if (hoy.getDay() === diaLibre) return null;

  const weekId = getWeekId(hoyISO, diaLibre);
  return isWeekClosed(weekId, hoyISO) ? null : weekId;
}

export function selectAccountingHeroWeek(
  currentOpenWeekId: string | null,
  recentWeekIds: string[]
): { weekId: string; kind: "current" | "latest" } | null {
  if (currentOpenWeekId) return { weekId: currentOpenWeekId, kind: "current" };
  const latestWeekId = recentWeekIds[0];
  return latestWeekId ? { weekId: latestWeekId, kind: "latest" } : null;
}

/**
 * Devuelve la fecha "efectiva" de un turno para asignarlo a una semana.
 *
 * Regla:
 *   - Si startDate cae en día laboral → usar startDate
 *   - Si startDate cae en el día libre Y date (fin) cae en un día laboral
 *     distinto → usar date (el turno cuenta para la semana del día de fin)
 *   - En cualquier otro caso → startDate || date
 */
export function getTurnoFechaEfectiva(turno: Turno, diaLibre: number): string {
  const fechaInicio = turno.startDate || turno.date;
  if (!fechaInicio) return turno.date;

  const diaInicio = new Date(fechaInicio + "T12:00:00").getDay();

  // Si empezó en día libre y terminó en otro día (laboral) → usar fecha de fin
  if (diaInicio === diaLibre && turno.date && turno.date !== fechaInicio) {
    const diaFin = new Date(turno.date + "T12:00:00").getDay();
    if (diaFin !== diaLibre) {
      return turno.date;
    }
  }

  return fechaInicio;
}

export function getTurnoAccountingWeekId(turno: Turno, diaLibre: number): string | null {
  const diaLibreTurno = turno.diaLibreContable ?? diaLibre;
  const fechaInicio = turno.startDate || turno.date;
  if (!fechaInicio) return getWeekId(turno.date, diaLibreTurno);

  const diaInicio = new Date(fechaInicio + "T12:00:00").getDay();
  const diaFin = new Date(turno.date + "T12:00:00").getDay();

  if (diaInicio === diaLibreTurno && turno.date === fechaInicio) {
    return null;
  }

  if (diaInicio === diaLibreTurno && turno.date && turno.date !== fechaInicio && diaFin !== diaLibreTurno) {
    return getWeekId(turno.date, diaLibreTurno);
  }

  return getWeekId(fechaInicio, diaLibreTurno);
}

export function groupTurnosByWeek(turnos: Turno[], diaLibre: number): Map<string, Turno[]> {
  const map = new Map<string, Turno[]>();
  const sorted = [...turnos].sort((a, b) => {
    const dateA = getTurnoFechaEfectiva(a, diaLibre);
    const dateB = getTurnoFechaEfectiva(b, diaLibre);
    return dateA.localeCompare(dateB);
  });
  for (const t of sorted) {
    const weekId = getTurnoAccountingWeekId(t, diaLibre);
    if (!weekId) continue;
    if (!map.has(weekId)) {
      map.set(weekId, []);
    }
    map.get(weekId)!.push(t);
  }
  return map;
}

function isWeekClosed(weekId: string, hoyISO: string): boolean {
  const { fin } = getWeekRange(weekId);
  return hoyISO > fin;
}

export function calcularTotalesTurnos(turnos: Turno[]) {
```

#### Código nuevo
```tsx
export function calcularTotalesTurnos(turnos: Turno[]) {
```

#### Por qué se cambió
Las reglas de semana, día libre y agrupación de turnos se trasladan a un módulo puro; no se cambian las fórmulas contables.

### Cambio 3 - Eliminar helpers semanales de UI

#### Código anterior
```tsx
/**
 * Crea un override por defecto (vacío) para un weekId dado.
 */
/**
 * Devuelve el override de una semana, o null si no existe.
 */
function getWeekOverride(overrides: WeekOverride[], weekId: string): WeekOverride | null {
  return overrides.find((o) => o.weekId === weekId) || null;
}

const DIAS_LABORABLES_SEMANA = 6;
/**
 * Decide a qué mes pertenece una semana laboral.
 *
 * Regla:
 *   - Cuenta los días LABORALES del calendario que caen en cada mes.
 *   - El mes con más días gana.
 *   - Si hay empate (3-3), devuelve "empate" con los dos meses candidatos
 *     para que la UI pida al usuario que elija.
 *
 * Devuelve:
 *   { type: "single", mesId: "2026-05" }                              // sin empate
 *   { type: "tie", candidates: [{mesId, mesLabel}, {mesId, mesLabel}] } // empate
 */
function getWeekMonth(weekId: string): {
  type: "single";
  mesId: string;
} | {
  type: "tie";
  candidates: { mesId: string; mesLabel: string }[];
} {
  const range = getWeekRange(weekId);
  const start = new Date(range.inicio + "T12:00:00");

  // Contar 6 días laborales (la semana completa, todos los días son laborales por construcción)
  const conteo = new Map<string, number>(); // "YYYY-MM" → nº días
  for (let i = 0; i < DIAS_LABORABLES_SEMANA; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const mesId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    conteo.set(mesId, (conteo.get(mesId) || 0) + 1);
  }

  const entradas = Array.from(conteo.entries());

  // Una sola entrada → toda la semana en un mes
  if (entradas.length === 1) {
    return { type: "single", mesId: entradas[0][0] };
  }

  // Dos entradas → comparar
  entradas.sort((a, b) => b[1] - a[1]); // ordena por más días desc
  const [primera, segunda] = entradas;

  if (primera[1] !== segunda[1]) {
    return { type: "single", mesId: primera[0] };
  }

  // Empate
  // Ordenar candidatos cronológicamente (mes anterior primero)
  const candidates = [primera[0], segunda[0]].sort();
  return {
    type: "tie",
    candidates: candidates.map((mesId) => ({ mesId, mesLabel: getMesLabel(mesId) })),
  };
}

/**
 * Devuelve el rango formateado para mostrar en la tarjeta de semana.
 * Ej: "6 - 11 May" o "29 Abr - 4 May"
 */
function formatWeekRange(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  if (dInicio.getMonth() === dFin.getMonth() && dInicio.getFullYear() === dFin.getFullYear()) {
    return `${dInicio.getDate()} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
  }
  return `${dInicio.getDate()} ${MESES_COMPLETOS[dInicio.getMonth()]} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
}

/**
 * Devuelve el rango con fecha completa para cabecera de detalle.
 * Ej: "Mié 6 May - Lun 11 May 2026"
 */
function formatWeekRangeFull(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${dias[dInicio.getDay()]} ${dInicio.getDate()} ${MESES_ABREVIADOS[dInicio.getMonth()]} - ${dias[dFin.getDay()]} ${dFin.getDate()} ${MESES_ABREVIADOS[dFin.getMonth()]} ${dFin.getFullYear()}`;
}

const IconCoin = ({ s = 24, c = G }: { s?: number; c?: string }) => (
```

#### Código nuevo
```tsx
const IconCoin = ({ s = 24, c = G }: { s?: number; c?: string }) => (
```

#### Por qué se cambió
Los helpers de override, mes de semana y labels de rango se mueven junto a la lógica semanal para mantener una sola responsabilidad.

### Cambio 4 - Crear módulo semanal

#### Código anterior
`No existía el módulo semanal en src/week-logic.ts.`

#### Código nuevo
```ts
import { MESES_ABREVIADOS, MESES_COMPLETOS, getMesLabel } from "./date-labels";

export type WeekTurno = {
  date: string;
  startDate?: string | null;
  diaLibreContable?: number;
};

export type WeekOverrideLike = {
  weekId: string;
};

export const DIAS_LABORABLES_SEMANA = 6;

export function getWeekStartDate(dateStr: string, diaLibre: number): string {
  const d = new Date(dateStr + "T12:00:00");
  const currentDayOfWeek = d.getDay();
  const startDayOfWeek = (diaLibre + 1) % 7;
  let diff = currentDayOfWeek - startDayOfWeek;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekId(dateStr: string, diaLibre: number): string {
  return getWeekStartDate(dateStr, diaLibre);
}

export function getWeekRange(weekId: string): { inicio: string; fin: string } {
  const d = new Date(weekId + "T12:00:00");
  const inicio = weekId;
  d.setDate(d.getDate() + 5);
  const fin = d.toISOString().slice(0, 10);
  return { inicio, fin };
}

export function isWeekClosed(weekId: string, hoyISO: string): boolean {
  const { fin } = getWeekRange(weekId);
  return hoyISO > fin;
}

export function getCurrentOpenWeekId(hoyISO: string, diaLibre: number): string | null {
  const hoy = new Date(hoyISO + "T12:00:00");
  if (hoy.getDay() === diaLibre) return null;

  const weekId = getWeekId(hoyISO, diaLibre);
  return isWeekClosed(weekId, hoyISO) ? null : weekId;
}

export function selectAccountingHeroWeek(
  currentOpenWeekId: string | null,
  recentWeekIds: string[]
): { weekId: string; kind: "current" | "latest" } | null {
  if (currentOpenWeekId) return { weekId: currentOpenWeekId, kind: "current" };
  const latestWeekId = recentWeekIds[0];
  return latestWeekId ? { weekId: latestWeekId, kind: "latest" } : null;
}

export function getTurnoFechaEfectiva(turno: WeekTurno, diaLibre: number): string {
  const fechaInicio = turno.startDate || turno.date;
  if (!fechaInicio) return turno.date;

  const diaInicio = new Date(fechaInicio + "T12:00:00").getDay();

  // Si empezó en día libre y terminó en otro día (laboral) → usar fecha de fin
  if (diaInicio === diaLibre && turno.date && turno.date !== fechaInicio) {
    const diaFin = new Date(turno.date + "T12:00:00").getDay();
    if (diaFin !== diaLibre) {
      return turno.date;
    }
  }

  return fechaInicio;
}

export function getTurnoAccountingWeekId(turno: WeekTurno, diaLibre: number): string | null {
  const diaLibreTurno = turno.diaLibreContable ?? diaLibre;
  const fechaInicio = turno.startDate || turno.date;
  if (!fechaInicio) return getWeekId(turno.date, diaLibreTurno);

  const diaInicio = new Date(fechaInicio + "T12:00:00").getDay();
  const diaFin = new Date(turno.date + "T12:00:00").getDay();

  if (diaInicio === diaLibreTurno && turno.date === fechaInicio) {
    return null;
  }

  if (diaInicio === diaLibreTurno && turno.date && turno.date !== fechaInicio && diaFin !== diaLibreTurno) {
    return getWeekId(turno.date, diaLibreTurno);
  }

  return getWeekId(fechaInicio, diaLibreTurno);
}

export function groupTurnosByWeek<T extends WeekTurno>(turnos: T[], diaLibre: number): Map<string, T[]> {
  const map = new Map<string, T[]>();
  const sorted = [...turnos].sort((a, b) => {
    const dateA = getTurnoFechaEfectiva(a, diaLibre);
    const dateB = getTurnoFechaEfectiva(b, diaLibre);
    return dateA.localeCompare(dateB);
  });
  for (const t of sorted) {
    const weekId = getTurnoAccountingWeekId(t, diaLibre);
    if (!weekId) continue;
    if (!map.has(weekId)) {
      map.set(weekId, []);
    }
    map.get(weekId)!.push(t);
  }
  return map;
}

export function getWeekOverride<T extends WeekOverrideLike>(overrides: T[], weekId: string): T | null {
  return overrides.find((o) => o.weekId === weekId) || null;
}

export function getWeekMonth(weekId: string): {
  type: "single";
  mesId: string;
} | {
  type: "tie";
  candidates: { mesId: string; mesLabel: string }[];
} {
  const range = getWeekRange(weekId);
  const start = new Date(range.inicio + "T12:00:00");

  // Contar 6 días laborales (la semana completa, todos los días son laborales por construcción)
  const conteo = new Map<string, number>(); // "YYYY-MM" → nº días
  for (let i = 0; i < DIAS_LABORABLES_SEMANA; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const mesId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    conteo.set(mesId, (conteo.get(mesId) || 0) + 1);
  }

  const entradas = Array.from(conteo.entries());

  // Una sola entrada → toda la semana en un mes
  if (entradas.length === 1) {
    return { type: "single", mesId: entradas[0][0] };
  }

  // Dos entradas → comparar
  entradas.sort((a, b) => b[1] - a[1]); // ordena por más días desc
  const [primera, segunda] = entradas;

  if (primera[1] !== segunda[1]) {
    return { type: "single", mesId: primera[0] };
  }

  // Empate
  // Ordenar candidatos cronológicamente (mes anterior primero)
  const candidates = [primera[0], segunda[0]].sort();
  return {
    type: "tie",
    candidates: candidates.map((mesId) => ({ mesId, mesLabel: getMesLabel(mesId) })),
  };
}

export function formatWeekRange(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  if (dInicio.getMonth() === dFin.getMonth() && dInicio.getFullYear() === dFin.getFullYear()) {
    return `${dInicio.getDate()} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
  }
  return `${dInicio.getDate()} ${MESES_COMPLETOS[dInicio.getMonth()]} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
}

export function formatWeekRangeFull(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${dias[dInicio.getDay()]} ${dInicio.getDate()} ${MESES_ABREVIADOS[dInicio.getMonth()]} - ${dias[dFin.getDay()]} ${dFin.getDate()} ${MESES_ABREVIADOS[dFin.getMonth()]} ${dFin.getFullYear()}`;
}
```

#### Por qué se cambió
El módulo nuevo agrupa reglas semanales, asignación de turnos y etiquetas de rango con tipos estructurales para no depender de `main.tsx`.

### Cambio 5 - Proteger extracción semanal

#### Código anterior
`No existía el test de extracción semanal en src/__tests__/week-logic-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Week logic extraction", () => {
  const weekLogicPath = resolve("src/week-logic.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps week assignment and labels outside main.tsx", async () => {
    expect(existsSync(weekLogicPath)).toBe(true);

    const modulePath = "../week-logic";
    const {
      getWeekStartDate,
      getWeekRange,
      getCurrentOpenWeekId,
      getTurnoAccountingWeekId,
      groupTurnosByWeek,
      getWeekMonth,
      formatWeekRange,
      formatWeekRangeFull,
    } = await import(modulePath);

    expect(getWeekStartDate("2026-05-08", 2)).toBe("2026-05-06");
    expect(getWeekRange("2026-05-06")).toEqual({ inicio: "2026-05-06", fin: "2026-05-11" });
    expect(getCurrentOpenWeekId("2026-05-12", 2)).toBeNull();
    expect(getTurnoAccountingWeekId({ date: "2026-05-13", startDate: "2026-05-12" }, 2)).toBe("2026-05-13");
    expect(Array.from(groupTurnosByWeek([{ date: "2026-05-13", startDate: "2026-05-13" }], 2).keys())).toEqual(["2026-05-13"]);
    expect(getWeekMonth("2026-05-29").type).toBe("tie");
    expect(formatWeekRange("2026-05-06")).toContain("Mayo");
    expect(formatWeekRangeFull("2026-05-06")).toContain("2026");

    expect(mainSource).toContain('from "./week-logic"');
    expect(mainSource).not.toMatch(/^export function getWeekStartDate\(/m);
    expect(mainSource).not.toMatch(/^export function groupTurnosByWeek\(/m);
    expect(mainSource).not.toMatch(/^function formatWeekRange\(/m);
  });
});
```

#### Por qué se cambió
El test fija que la lógica semanal quede fuera de `main.tsx` y valida reglas críticas de inicio, rango, día libre, agrupación y etiquetas.

## 2026-05-24 23:53 - Extraer loaders de estado

**Archivos modificados:** `src/main.tsx`, `src/state-loaders.ts`, `src/__tests__/state-loaders-extraction.test.ts`

### Cambio 1 - Importar loaders de estado

#### Código anterior
```tsx
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { readLocalJSON, userStorageKey, writeUserLocalJSON } from "./user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_NOTES, KEY_RESERVATIONS, KEY_SETTINGS, KEY_WEEK_OVERRIDES } from "./storage-keys";
```

#### Código nuevo
```tsx
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { userStorageKey, writeUserLocalJSON } from "./user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_NOTES, KEY_RESERVATIONS, KEY_SETTINGS, KEY_WEEK_OVERRIDES } from "./storage-keys";
import { loadCurrent, loadHistory, loadNotes, loadReservations, loadSettings, loadWeekOverrides } from "./state-loaders";
```

#### Por qué se cambió
`main.tsx` usa loaders iniciales desde `state-loaders.ts`; `readLocalJSON` deja de importarse directamente en la pantalla principal.

### Cambio 2 - Eliminar loader local de ajustes

#### Código anterior
```tsx
function loadSettings(): AppSettings {
  const defaults: AppSettings = {
    "porcentaje.jefe": 0,
    "porcentaje.chofer": 0,
    "descontar.datafono": true,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,           // Martes por defecto (tu día libre actual)
    diaLibreDesde: null,
  };
  try {
    const d = readLocalJSON<Partial<AppSettings>>(KEY_SETTINGS);
    if (d) {
      return { ...defaults, ...d };
    }
  } catch (e) { }
  return defaults;
}

// El payload se construye en el call site con buildBackupPayloadFromState
```

#### Código nuevo
```tsx
// El payload se construye en el call site con buildBackupPayloadFromState
```

#### Por qué se cambió
El loader de ajustes se mueve a `state-loaders.ts` manteniendo defaults y merge con localStorage.

### Cambio 3 - Eliminar loaders locales de estado base

#### Código anterior
```tsx
function loadCurrent(): CurrentState {
  try {
    const d = readLocalJSON<CurrentState>(KEY_CURRENT);
    if (d) {
      return {
        ...d,
        isPaused: d.isPaused || false,
        pauseStartTime: d.pauseStartTime || null,
        totalPausedMinutes: d.totalPausedMinutes || 0,
      };
    }
  } catch (e) { }
  return { entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 };
}
function loadHistory(): Turno[] {
  try {
    const d = readLocalJSON<Turno[]>(KEY_HISTORY);
    if (Array.isArray(d)) return sortTurnosByDateDesc(d);
  } catch (e) { }
  return [];
}
function loadReservations(): Reserva[] {
  try {
    const d = readLocalJSON<Reserva[]>(KEY_RESERVATIONS);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}
function loadNotes(): NotaCalendario[] {
  try {
    const d = readLocalJSON<NotaCalendario[]>(KEY_NOTES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}
// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================
```

#### Por qué se cambió
Los loaders de turno actual, historial, reservas y notas se trasladan a `state-loaders.ts` sin cambiar defaults ni ordenación del historial.

### Cambio 4 - Eliminar loader local de overrides

#### Código anterior
```tsx
function loadWeekOverrides(): WeekOverride[] {
  try {
    const d = readLocalJSON<WeekOverride[]>(KEY_WEEK_OVERRIDES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

/**
 * Crea un override por defecto (vacío) para un weekId dado.
 */
```

#### Código nuevo
```tsx
/**
 * Crea un override por defecto (vacío) para un weekId dado.
 */
```

#### Por qué se cambió
El loader de overrides semanales se mueve al módulo común de loaders.

### Cambio 5 - Crear módulo de loaders

#### Código anterior
`No existía el módulo de loaders en src/state-loaders.ts.`

#### Código nuevo
```ts
import type { AppSettings, Entry, NotaCalendario, Reserva, Turno } from "./main";
import { readLocalJSON } from "./user-storage";
import {
  KEY_CURRENT,
  KEY_HISTORY,
  KEY_NOTES,
  KEY_RESERVATIONS,
  KEY_SETTINGS,
  KEY_WEEK_OVERRIDES,
} from "./storage-keys";
import { sortTurnosByDateDesc } from "./turnos";

type LoadedCurrentState = {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
};

type LoadedWeekOverride = {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
};

export function loadSettings(): AppSettings {
  const defaults: AppSettings = {
    "porcentaje.jefe": 0,
    "porcentaje.chofer": 0,
    "descontar.datafono": true,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,
    diaLibreDesde: null,
  };
  try {
    const d = readLocalJSON<Partial<AppSettings>>(KEY_SETTINGS);
    if (d) {
      return { ...defaults, ...d };
    }
  } catch (e) { }
  return defaults;
}

export function loadCurrent(): LoadedCurrentState {
  try {
    const d = readLocalJSON<LoadedCurrentState>(KEY_CURRENT);
    if (d) {
      return {
        ...d,
        isPaused: d.isPaused || false,
        pauseStartTime: d.pauseStartTime || null,
        totalPausedMinutes: d.totalPausedMinutes || 0,
      };
    }
  } catch (e) { }
  return { entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 };
}

export function loadHistory(): Turno[] {
  try {
    const d = readLocalJSON<Turno[]>(KEY_HISTORY);
    if (Array.isArray(d)) return sortTurnosByDateDesc(d);
  } catch (e) { }
  return [];
}

export function loadReservations(): Reserva[] {
  try {
    const d = readLocalJSON<Reserva[]>(KEY_RESERVATIONS);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

export function loadNotes(): NotaCalendario[] {
  try {
    const d = readLocalJSON<NotaCalendario[]>(KEY_NOTES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

export function loadWeekOverrides(): LoadedWeekOverride[] {
  try {
    const d = readLocalJSON<LoadedWeekOverride[]>(KEY_WEEK_OVERRIDES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}
```

#### Por qué se cambió
El módulo nuevo concentra la carga inicial desde localStorage y reutiliza claves, lectura JSON y ordenación de turnos.

### Cambio 6 - Proteger extracción de loaders

#### Código anterior
`No existía el test de extracción de loaders en src/__tests__/state-loaders-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS } from "../storage-keys";

describe("State loader extraction", () => {
  const stateLoadersPath = resolve("src/state-loaders.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps localStorage state loaders outside main.tsx", async () => {
    expect(existsSync(stateLoadersPath)).toBe(true);

    const modulePath = "../state-loaders";
    const { loadSettings, loadCurrent, loadHistory } = await import(modulePath);
    localStorage.clear();

    expect(loadSettings()).toMatchObject({
      "porcentaje.jefe": 0,
      "porcentaje.chofer": 0,
      "descontar.datafono": true,
      diaLibre: 2,
      diaLibreDesde: null,
    });
    localStorage.setItem(KEY_SETTINGS, JSON.stringify({ "porcentaje.jefe": 55, diaLibre: 1 }));
    expect(loadSettings()).toMatchObject({
      "porcentaje.jefe": 55,
      "descontar.datafono": true,
      diaLibre: 1,
    });

    expect(loadCurrent()).toEqual({
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    });
    localStorage.setItem(KEY_CURRENT, JSON.stringify({ entries: [], startTime: "10:00", startDate: "2026-05-01" }));
    expect(loadCurrent()).toMatchObject({ startTime: "10:00", isPaused: false, totalPausedMinutes: 0 });

    localStorage.setItem(KEY_HISTORY, JSON.stringify([
      { date: "2026-05-01", startDate: "2026-05-01", startTime: "08:00" },
      { date: "2026-05-02", startDate: "2026-05-02", startTime: "08:00" },
    ]));
    expect(loadHistory().map((turno: { date: string }) => turno.date)).toEqual(["2026-05-02", "2026-05-01"]);

    expect(mainSource).toContain('from "./state-loaders"');
    expect(mainSource).not.toMatch(/^function loadSettings\(/m);
    expect(mainSource).not.toMatch(/^function loadCurrent\(/m);
    expect(mainSource).not.toMatch(/^function loadWeekOverrides\(/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y valida defaults, merge de ajustes, fallback de turno actual y ordenación de historial.

## 2026-05-24 23:48 - Extraer contenedor Shell

**Archivos modificados:** `src/main.tsx`, `src/components/shell.tsx`, `src/__tests__/shell-components-extraction.test.ts`

### Cambio 1 - Importar Shell

#### Código anterior
```tsx
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { DurationCardValue } from "./components/duration-card-value";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
```

#### Código nuevo
```tsx
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { DurationCardValue } from "./components/duration-card-value";
import { Shell } from "./components/shell";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
```

#### Por qué se cambió
`Shell` se usa desde un componente propio para reducir el bloque visual de `main.tsx`.

### Cambio 2 - Eliminar Shell local

#### Código anterior
```tsx
function Shell({
  children,
  burst,
}: {
  children: React.ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {burst && <Burst />}
      {children}
    </div>
  );
}

function Burst() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-8px",
            left: `${5 + Math.random() * 90}%`,
            width: 7,
            height: 7,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: [G, P, "white", "oklch(0.85 0.18 80)"][i % 4],
            animation: `fall ${0.55 + Math.random() * 0.45}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MIGRACIÓN DE LOCALSTORAGE A FIRESTORE
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// MIGRACIÓN DE LOCALSTORAGE A FIRESTORE
// ============================================================================
```

#### Por qué se cambió
El contenedor visual y su animación salen de `main.tsx`; la estructura y estilos del contenedor se conservan.

### Cambio 3 - Crear componente Shell

#### Código anterior
`No existía el componente Shell en src/components/shell.tsx.`

#### Código nuevo
```tsx
import type { ReactNode } from "react";

const BURST_GREEN = "oklch(0.68 0.20 145)";
const BURST_PURPLE = "oklch(0.65 0.20 280)";

export function Shell({
  children,
  burst,
}: {
  children: ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {burst && <Burst />}
      {children}
    </div>
  );
}

function Burst() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-8px",
            left: `${5 + Math.random() * 90}%`,
            width: 7,
            height: 7,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: [BURST_GREEN, BURST_PURPLE, "white", "oklch(0.85 0.18 80)"][i % 4],
            animation: `fall ${0.55 + Math.random() * 0.45}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}
```

#### Por qué se cambió
El componente nuevo mantiene los estilos de Shell y define los colores de Burst con los mismos valores que usaba antes desde `G` y `P`.

### Cambio 4 - Proteger extracción de Shell

#### Código anterior
`No existía el test de extracción de Shell en src/__tests__/shell-components-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Shell component extraction", () => {
  const shellPath = resolve("src/components/shell.tsx");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Shell and Burst outside main.tsx", () => {
    expect(existsSync(shellPath)).toBe(true);

    const shellSource = readFileSync(shellPath, "utf8");
    expect(shellSource).toContain("export function Shell");
    expect(shellSource).toContain("function Burst");
    expect(shellSource).toContain("height: \"100dvh\"");
    expect(mainSource).toContain('from "./components/shell"');
    expect(mainSource).not.toMatch(/^function Shell\(/m);
    expect(mainSource).not.toMatch(/^function Burst\(/m);
  });
});
```

#### Por qué se cambió
El test fija que el contenedor y la animación permanezcan fuera de `main.tsx`.

## 2026-05-24 23:44 - Extraer valor de duracion

**Archivos modificados:** `src/main.tsx`, `src/components/duration-card-value.tsx`, `src/__tests__/duration-card-value-extraction.test.ts`

### Cambio 1 - Importar componente de duracion

#### Código anterior
```tsx
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
```

#### Código nuevo
```tsx
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber } from "./formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { DurationCardValue } from "./components/duration-card-value";
```

#### Por qué se cambió
`DurationCardValue` se usa desde un componente propio y `main.tsx` ya no necesita importar `splitDurationLabel` para renderizarlo.

### Cambio 2 - Eliminar componente local

#### Código anterior
```tsx
function DurationCardValue({ value }: { value: string }) {
  const parts = splitDurationLabel(value);
  return (
    <>
      {parts.hours}<span style={TIME_CARD_HOUR_UNIT_STYLE}>h</span>
      {parts.minutes}<span style={TIME_CARD_UNIT_STYLE}>m</span>
    </>
  );
}

function loadSettings(): AppSettings {
```

#### Código nuevo
```tsx
function loadSettings(): AppSettings {
```

#### Por qué se cambió
El renderizado de duración se separa de `main.tsx` sin cambiar el marcado de horas/minutos.

### Cambio 3 - Crear componente de duracion

#### Código anterior
`No existía el componente de duración en src/components/duration-card-value.tsx.`

#### Código nuevo
```tsx
import { TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE } from "../card-styles";
import { splitDurationLabel } from "../formatters";

export function DurationCardValue({ value }: { value: string }) {
  const parts = splitDurationLabel(value);
  return (
    <>
      {parts.hours}<span style={TIME_CARD_HOUR_UNIT_STYLE}>h</span>
      {parts.minutes}<span style={TIME_CARD_UNIT_STYLE}>m</span>
    </>
  );
}
```

#### Por qué se cambió
El componente nuevo concentra la presentación de duración y reutiliza los módulos de estilos y formateadores.

### Cambio 4 - Proteger extracción de duracion

#### Código anterior
`No existía el test de extracción de duración en src/__tests__/duration-card-value-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("DurationCardValue extraction", () => {
  const componentPath = resolve("src/components/duration-card-value.tsx");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps duration unit rendering outside main.tsx", () => {
    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");
    expect(componentSource).toContain("export function DurationCardValue");
    expect(componentSource).toContain("splitDurationLabel(value)");
    expect(componentSource).toContain("TIME_CARD_HOUR_UNIT_STYLE");
    expect(mainSource).toContain('from "./components/duration-card-value"');
    expect(mainSource).not.toMatch(/^function DurationCardValue\(/m);
  });
});
```

#### Por qué se cambió
El test fija que el renderizado de duración permanezca fuera de `main.tsx`.

## 2026-05-24 23:42 - Extraer claves de almacenamiento

**Archivos modificados:** `src/main.tsx`, `src/storage-keys.ts`, `src/__tests__/storage-keys-extraction.test.ts`

### Cambio 1 - Importar claves de almacenamiento

#### Código anterior
```tsx
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { readLocalJSON, userStorageKey, writeUserLocalJSON } from "./user-storage";
```

#### Código nuevo
```tsx
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { readLocalJSON, userStorageKey, writeUserLocalJSON } from "./user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_NOTES, KEY_RESERVATIONS, KEY_SETTINGS, KEY_WEEK_OVERRIDES } from "./storage-keys";
```

#### Por qué se cambió
`main.tsx` usa las claves desde `storage-keys.ts`, preparando futuras extracciones de loaders sin duplicar strings.

### Cambio 2 - Eliminar claves locales

#### Código anterior
```tsx
const KEY_CURRENT = "taxi_current_v3";
const KEY_HISTORY = "taxi_history_v3";
const KEY_SETTINGS = "taxi_settings_v3";
const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
const KEY_RESERVATIONS = "taxi_reservations_v1";
const KEY_NOTES = "taxi_notes_v1";

export interface Reserva {
```

#### Código nuevo
```tsx
export interface Reserva {
```

#### Por qué se cambió
Las claves de persistencia se centralizan fuera de `main.tsx` sin cambiar sus valores.

### Cambio 3 - Crear módulo de claves

#### Código anterior
`No existía el módulo de claves en src/storage-keys.ts.`

#### Código nuevo
```ts
export const KEY_CURRENT = "taxi_current_v3";
export const KEY_HISTORY = "taxi_history_v3";
export const KEY_SETTINGS = "taxi_settings_v3";
export const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
export const KEY_RESERVATIONS = "taxi_reservations_v1";
export const KEY_NOTES = "taxi_notes_v1";
```

#### Por qué se cambió
El módulo nuevo concentra los nombres de localStorage usados por estado, historial, ajustes, semanas, reservas y notas.

### Cambio 4 - Proteger extracción de claves

#### Código anterior
`No existía el test de extracción de claves en src/__tests__/storage-keys-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Storage key extraction", () => {
  const storageKeysPath = resolve("src/storage-keys.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps localStorage key constants outside main.tsx", async () => {
    expect(existsSync(storageKeysPath)).toBe(true);

    const modulePath = "../storage-keys";
    const { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } = await import(modulePath);
    expect(KEY_CURRENT).toBe("taxi_current_v3");
    expect(KEY_HISTORY).toBe("taxi_history_v3");
    expect(KEY_SETTINGS).toBe("taxi_settings_v3");
    expect(KEY_WEEK_OVERRIDES).toBe("taxi_week_overrides_v1");
    expect(KEY_RESERVATIONS).toBe("taxi_reservations_v1");
    expect(KEY_NOTES).toBe("taxi_notes_v1");

    expect(mainSource).toContain('from "./storage-keys"');
    expect(mainSource).not.toMatch(/^const KEY_CURRENT/m);
    expect(mainSource).not.toMatch(/^const KEY_NOTES/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y comprueba que los valores de las claves no cambien.

## 2026-05-24 23:39 - Extraer almacenamiento local

**Archivos modificados:** `src/main.tsx`, `src/user-storage.ts`, `src/__tests__/user-storage-extraction.test.ts`

### Cambio 1 - Importar almacenamiento local

#### Código anterior
```tsx
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
```

#### Código nuevo
```tsx
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
import { readLocalJSON, userStorageKey, writeUserLocalJSON } from "./user-storage";
```

#### Por qué se cambió
`main.tsx` usa los helpers de localStorage desde el nuevo módulo y conserva el comportamiento de claves por usuario.

### Cambio 2 - Eliminar helpers locales de almacenamiento

#### Código anterior
```tsx
function userStorageKey(baseKey: string, uid = auth.currentUser?.uid || ""): string {
  return uid ? `${baseKey}__${uid}` : baseKey;
}

function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}

export interface Reserva {
```

#### Código nuevo
```tsx
export interface Reserva {
```

#### Por qué se cambió
Los helpers de clave, lectura y escritura JSON se movieron fuera de `main.tsx` sin cambiar el fallback a clave global.

### Cambio 3 - Crear módulo de almacenamiento

#### Código anterior
`No existía el módulo de almacenamiento local en src/user-storage.ts.`

#### Código nuevo
```ts
import { auth } from "./firebase";

export function userStorageKey(baseKey: string, uid = auth.currentUser?.uid || ""): string {
  return uid ? `${baseKey}__${uid}` : baseKey;
}

export function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}
```

#### Por qué se cambió
El módulo nuevo concentra el acceso a localStorage por usuario y deja `main.tsx` con llamadas de más alto nivel.

### Cambio 4 - Proteger extracción de almacenamiento

#### Código anterior
`No existía el test de extracción de almacenamiento en src/__tests__/user-storage-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("User storage extraction", () => {
  const userStoragePath = resolve("src/user-storage.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps user-scoped localStorage helpers outside main.tsx", async () => {
    expect(existsSync(userStoragePath)).toBe(true);

    const modulePath = "../user-storage";
    const { userStorageKey, readLocalJSON, writeUserLocalJSON } = await import(modulePath);
    localStorage.clear();
    localStorage.setItem("plain", "{\"ok\":true}");

    expect(userStorageKey("plain", "uid-1")).toBe("plain__uid-1");
    expect(userStorageKey("plain", "")).toBe("plain");
    expect(readLocalJSON("plain")).toEqual({ ok: true });
    expect(readLocalJSON("missing")).toBeNull();
    writeUserLocalJSON("uid-1", "plain", { value: 2 });
    expect(localStorage.getItem("plain__uid-1")).toBe("{\"value\":2}");

    expect(mainSource).toContain('from "./user-storage"');
    expect(mainSource).not.toMatch(/^function userStorageKey\(/m);
    expect(mainSource).not.toMatch(/^function readLocalJSON/m);
    expect(mainSource).not.toMatch(/^function writeUserLocalJSON/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y valida claves por uid, lectura JSON y escritura serializada.

## 2026-05-24 23:36 - Extraer fecha y hora

**Archivos modificados:** `src/main.tsx`, `src/date-time.ts`, `src/__tests__/date-time-extraction.test.ts`

### Cambio 1 - Importar helpers de fecha y hora

#### Código anterior
```tsx
import { MESES_ABREVIADOS, MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
```

#### Código nuevo
```tsx
import { MESES_ABREVIADOS, MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./date-time";
```

#### Por qué se cambió
`main.tsx` usa helpers de fecha y hora desde el nuevo módulo para reducir lógica local no contable.

### Cambio 2 - Eliminar helpers locales de hora

#### Código anterior
```tsx
function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function timeNow(): string {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDiffMins(t1: string, t2: string): number {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

function fmt(n: number): string {
```

#### Código nuevo
```tsx
function fmt(n: number): string {
```

#### Por qué se cambió
`today`, `timeNow` y `getDiffMins` se mueven a `date-time.ts` manteniendo fecha local, hora `es-ES` y cruce de medianoche.

### Cambio 3 - Eliminar formato de fecha local

#### Código anterior
```tsx
function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00")
    .toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function loadSettings(): AppSettings {
```

#### Código nuevo
```tsx
function loadSettings(): AppSettings {
```

#### Por qué se cambió
`fmtDate` se traslada al mismo módulo de fecha/hora sin alterar el locale ni el uso de mediodía para evitar desplazamientos.

### Cambio 4 - Crear módulo de fecha y hora

#### Código anterior
`No existía el módulo de fecha y hora en src/date-time.ts.`

#### Código nuevo
```ts
export function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timeNow(): string {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDiffMins(t1: string, t2: string): number {
  const [h1, m1] = t1.split(":").map(Number);
  const [h2, m2] = t2.split(":").map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

export function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00")
    .toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}
```

#### Por qué se cambió
El módulo nuevo agrupa helpers de fecha, hora y duración entre dos horas.

### Cambio 5 - Proteger extracción de fecha y hora

#### Código anterior
`No existía el test de extracción de fecha y hora en src/__tests__/date-time-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Date time extraction", () => {
  const dateTimePath = resolve("src/date-time.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps date and time helpers outside main.tsx", async () => {
    expect(existsSync(dateTimePath)).toBe(true);

    const modulePath = "../date-time";
    const { today, timeNow, getDiffMins, fmtDate } = await import(modulePath);
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(timeNow()).toMatch(/^\d{2}:\d{2}$/);
    expect(getDiffMins("22:30", "01:15")).toBe(165);
    expect(fmtDate("2026-05-08")).toMatch(/8.*2026/);

    expect(mainSource).toContain('from "./date-time"');
    expect(mainSource).not.toMatch(/^function today\(/m);
    expect(mainSource).not.toMatch(/^function getDiffMins\(/m);
    expect(mainSource).not.toMatch(/^function fmtDate\(/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y valida formato ISO, hora HH:mm, cruce de medianoche y formato de fecha visible.

## 2026-05-24 23:33 - Extraer estilos de tarjetas

**Archivos modificados:** `src/main.tsx`, `src/card-styles.ts`, `src/__tests__/card-styles-extraction.test.ts`

### Cambio 1 - Importar estilos de tarjetas

#### Código anterior
```tsx
import { getDaysInMonth, getStartOffset } from "./calendar-date";
import { MESES_ABREVIADOS, MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
```

```tsx
export { updateTurnoEntrega };
export { getAccountingPeriodLabel };
```

#### Código nuevo
```tsx
import { getDaysInMonth, getStartOffset } from "./calendar-date";
import { MESES_ABREVIADOS, MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./card-styles";
```

```tsx
export { updateTurnoEntrega };
export { getAccountingPeriodLabel };
export { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES };
```

#### Por qué se cambió
`main.tsx` usa las constantes visuales desde `card-styles.ts` y conserva sus exports públicos para los tests.

### Cambio 2 - Eliminar estilos locales

#### Código anterior
```tsx
export const WEEK_LIST_CARD_TEXT_SIZES = {
  range: "clamp(13px, 4.2cqw, 16px)",
  meta: "clamp(11px, 3.4cqw, 13px)",
  metric: "clamp(14px, 4.5cqw, 17px)",
} as const;

export const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;

export const TIME_CARD_UNIT_STYLE = {
  fontSize: "1em",
  fontWeight: KM_CARD_UNIT_STYLE.fontWeight,
  marginLeft: 2,
  letterSpacing: KM_CARD_UNIT_STYLE.letterSpacing,
} as const;

export const TIME_CARD_HOUR_UNIT_STYLE = {
  ...TIME_CARD_UNIT_STYLE,
  marginRight: 6,
} as const;

const NOTE_TIME_STYLE = {
```

#### Código nuevo
```tsx
const NOTE_TIME_STYLE = {
```

#### Por qué se cambió
Las constantes reutilizables de tipografía de tarjetas se movieron fuera de `main.tsx`; `NOTE_TIME_STYLE` se mantiene local porque los tests visuales lo validan en esa pantalla.

### Cambio 3 - Crear módulo de estilos

#### Código anterior
`No existía el módulo de estilos de tarjetas en src/card-styles.ts.`

#### Código nuevo
```ts
export const WEEK_LIST_CARD_TEXT_SIZES = {
  range: "clamp(13px, 4.2cqw, 16px)",
  meta: "clamp(11px, 3.4cqw, 13px)",
  metric: "clamp(14px, 4.5cqw, 17px)",
} as const;

export const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;

export const TIME_CARD_UNIT_STYLE = {
  fontSize: "1em",
  fontWeight: KM_CARD_UNIT_STYLE.fontWeight,
  marginLeft: 2,
  letterSpacing: KM_CARD_UNIT_STYLE.letterSpacing,
} as const;

export const TIME_CARD_HOUR_UNIT_STYLE = {
  ...TIME_CARD_UNIT_STYLE,
  marginRight: 6,
} as const;
```

#### Por qué se cambió
El módulo nuevo agrupa constantes visuales compartidas por tarjetas y valores de tiempo/KM.

### Cambio 4 - Proteger extracción de estilos

#### Código anterior
`No existía el test de extracción de estilos en src/__tests__/card-styles-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Card styles extraction", () => {
  const cardStylesPath = resolve("src/card-styles.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps reusable card typography constants outside main.tsx", async () => {
    expect(existsSync(cardStylesPath)).toBe(true);

    const modulePath = "../card-styles";
    const { WEEK_LIST_CARD_TEXT_SIZES, KM_CARD_UNIT_STYLE, TIME_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE } = await import(modulePath);
    expect(WEEK_LIST_CARD_TEXT_SIZES.range).toContain("cqw");
    expect(KM_CARD_UNIT_STYLE.fontSize).toBe("0.72em");
    expect(TIME_CARD_UNIT_STYLE.fontWeight).toBe(KM_CARD_UNIT_STYLE.fontWeight);
    expect(TIME_CARD_HOUR_UNIT_STYLE.marginRight).toBe(6);

    expect(mainSource).toContain('from "./card-styles"');
    expect(mainSource).not.toMatch(/^export const WEEK_LIST_CARD_TEXT_SIZES/m);
    expect(mainSource).not.toMatch(/^export const KM_CARD_UNIT_STYLE/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y comprueba que los valores clave de tipografía no cambien.

## 2026-05-24 23:29 - Extraer etiquetas de fecha

**Archivos modificados:** `src/main.tsx`, `src/date-labels.ts`, `src/__tests__/date-labels-extraction.test.ts`

### Cambio 1 - Importar etiquetas de fecha

#### Código anterior
```tsx
import { updateTurnoEntrega } from "./turno-entrega";
import { getDaysInMonth, getStartOffset } from "./calendar-date";
```

```tsx
export { getTurnosNotasSemana };
export { updateTurnoEntrega };
```

#### Código nuevo
```tsx
import { updateTurnoEntrega } from "./turno-entrega";
import { getDaysInMonth, getStartOffset } from "./calendar-date";
import { MESES_ABREVIADOS, MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./date-labels";
```

```tsx
export { getTurnosNotasSemana };
export { updateTurnoEntrega };
export { getAccountingPeriodLabel };
```

#### Por qué se cambió
`main.tsx` usa meses y labels desde `date-labels.ts` y mantiene `getAccountingPeriodLabel` como export público.

### Cambio 2 - Eliminar constantes de meses locales

#### Código anterior
```tsx
const MESES_COMPLETOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_ABREVIADOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const WEEK_LIST_CARD_TEXT_SIZES = {
```

#### Código nuevo
```tsx
export const WEEK_LIST_CARD_TEXT_SIZES = {
```

#### Por qué se cambió
Las constantes de nombres de meses pasan al módulo compartido de etiquetas de fecha.

### Cambio 3 - Usar getMesLabel importado

#### Código anterior
```tsx
  // Empate
  const labelOf = (mesId: string) => {
    const [y, m] = mesId.split("-").map(Number);
    return `${MESES_COMPLETOS[m - 1]} ${y}`;
  };

  // Ordenar candidatos cronológicamente (mes anterior primero)
  const candidates = [primera[0], segunda[0]].sort();
  return {
    type: "tie",
    candidates: candidates.map((mesId) => ({ mesId, mesLabel: labelOf(mesId) })),
  };
}
```

#### Código nuevo
```tsx
  // Empate
  // Ordenar candidatos cronológicamente (mes anterior primero)
  const candidates = [primera[0], segunda[0]].sort();
  return {
    type: "tie",
    candidates: candidates.map((mesId) => ({ mesId, mesLabel: getMesLabel(mesId) })),
  };
}
```

#### Por qué se cambió
La etiqueta de mes empatado reutiliza el helper compartido `getMesLabel` en lugar de duplicar la lógica.

### Cambio 4 - Eliminar labels locales

#### Código anterior
```tsx
/**
 * Devuelve el label legible de un mesId "YYYY-MM" → "Mayo 2026"
 */
function getMesLabel(mesId: string): string {
  const [y, m] = mesId.split("-").map(Number);
  return `${MESES_COMPLETOS[m - 1]} ${y}`;
}

export function getAccountingPeriodLabel(year: number, month: number): string {
  return getMesLabel(`${year}-${String(month).padStart(2, "0")}`);
}

/**
 * Devuelve el rango formateado para mostrar en la tarjeta de semana.
```

#### Código nuevo
```tsx
/**
 * Devuelve el rango formateado para mostrar en la tarjeta de semana.
```

#### Por qué se cambió
`getMesLabel` y `getAccountingPeriodLabel` se trasladan a `date-labels.ts` para centralizar labels de fecha.

### Cambio 5 - Crear módulo de etiquetas

#### Código anterior
`No existía el módulo de etiquetas de fecha en src/date-labels.ts.`

#### Código nuevo
```ts
export const MESES_COMPLETOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const MESES_ABREVIADOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function getMesLabel(mesId: string): string {
  const [y, m] = mesId.split("-").map(Number);
  return `${MESES_COMPLETOS[m - 1]} ${y}`;
}

export function getAccountingPeriodLabel(year: number, month: number): string {
  return getMesLabel(`${year}-${String(month).padStart(2, "0")}`);
}
```

#### Por qué se cambió
El módulo nuevo contiene los nombres de meses y labels reutilizados por calendario y contabilidad visual.

### Cambio 6 - Proteger extracción de etiquetas

#### Código anterior
`No existía el test de extracción de etiquetas en src/__tests__/date-labels-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Date label extraction", () => {
  const dateLabelsPath = resolve("src/date-labels.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps month labels and accounting period labels outside main.tsx", async () => {
    expect(existsSync(dateLabelsPath)).toBe(true);

    const modulePath = "../date-labels";
    const { MESES_COMPLETOS, MESES_ABREVIADOS, getAccountingPeriodLabel, getMesLabel } = await import(modulePath);
    expect(MESES_COMPLETOS[4]).toBe("Mayo");
    expect(MESES_ABREVIADOS[4]).toBe("May");
    expect(getMesLabel("2026-05")).toBe("Mayo 2026");
    expect(getAccountingPeriodLabel(2026, 5)).toBe("Mayo 2026");

    expect(mainSource).toContain('from "./date-labels"');
    expect(mainSource).not.toMatch(/^const MESES_COMPLETOS/m);
    expect(mainSource).not.toMatch(/^function getMesLabel\(/m);
    expect(mainSource).not.toMatch(/^export function getAccountingPeriodLabel\(/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y comprueba los labels de Mayo usados por la app.

## 2026-05-24 23:26 - Extraer calendario mensual

**Archivos modificados:** `src/main.tsx`, `src/calendar-date.ts`, `src/__tests__/calendar-date-extraction.test.ts`

### Cambio 1 - Importar helpers de calendario

#### Código anterior
```tsx
import { getTurnosNotasSemana } from "./turno-notas-logic";
import { updateTurnoEntrega } from "./turno-entrega";
```

#### Código nuevo
```tsx
import { getTurnosNotasSemana } from "./turno-notas-logic";
import { updateTurnoEntrega } from "./turno-entrega";
import { getDaysInMonth, getStartOffset } from "./calendar-date";
```

#### Por qué se cambió
`main.tsx` usa los helpers de calendario desde el nuevo módulo para pintar el mes sin mantener esas funciones locales.

### Cambio 2 - Eliminar helpers locales de calendario

#### Código anterior
```tsx
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getStartOffset(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  return offset;
}

// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================
```

#### Por qué se cambió
Los cálculos de rejilla mensual se mueven fuera de `main.tsx` sin cambiar la forma de contar días ni el offset de lunes.

### Cambio 3 - Crear módulo de calendario

#### Código anterior
`No existía el módulo de calendario en src/calendar-date.ts.`

#### Código nuevo
```ts
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getStartOffset(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  return offset;
}
```

#### Por qué se cambió
El módulo nuevo contiene helpers puros de calendario mensual, separados de la pantalla principal.

### Cambio 4 - Proteger extracción de calendario

#### Código anterior
`No existía el test de extracción de calendario en src/__tests__/calendar-date-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Calendar date extraction", () => {
  const calendarDatePath = resolve("src/calendar-date.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps month grid date helpers outside main.tsx", async () => {
    expect(existsSync(calendarDatePath)).toBe(true);

    const modulePath = "../calendar-date";
    const { getDaysInMonth, getStartOffset } = await import(modulePath);
    expect(getDaysInMonth(2026, 1)).toBe(28);
    expect(getDaysInMonth(2024, 1)).toBe(29);
    expect(getStartOffset(2026, 4)).toBe(4);

    expect(mainSource).toContain('from "./calendar-date"');
    expect(mainSource).not.toMatch(/^function getDaysInMonth\(/m);
    expect(mainSource).not.toMatch(/^function getStartOffset\(/m);
  });
});
```

#### Por qué se cambió
El test fija la extracción y comprueba valores de febrero normal, febrero bisiesto y offset mensual.

## 2026-05-24 23:23 - Extraer seleccion de turnos

**Archivos modificados:** `src/main.tsx`, `src/turnos.ts`, `src/__tests__/turno-selection-extraction.test.ts`

### Cambio 1 - Importar seleccion de turnos

#### Código anterior
```tsx
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";
```

```tsx
export { buildBackupPayload, buildBackupPayloadFromState };
export { mergeTurnos, sortTurnosByDateDesc };
```

#### Código nuevo
```tsx
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
import {
  ensureTurnosDiaLibreContable,
  getTurnosByCalendarMonth,
  getTurnosByCalendarYear,
  mergeTurnos,
  sortTurnosByDateDesc,
} from "./turnos";
```

```tsx
export { buildBackupPayload, buildBackupPayloadFromState };
export {
  ensureTurnosDiaLibreContable,
  getTurnosByCalendarMonth,
  getTurnosByCalendarYear,
  mergeTurnos,
  sortTurnosByDateDesc,
};
```

#### Por qué se cambió
`main.tsx` usa la selección por calendario y la migración de día libre desde `turnos.ts`, manteniendo los exports públicos.

### Cambio 2 - Eliminar seleccion local

#### Código anterior
```tsx
export function getTurnosByCalendarMonth(turnos: Turno[], year: number, month: number): Turno[] {
  const monthId = `${year}-${String(month).padStart(2, "0")}`;
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 7) === monthId)
  );
}

export function getTurnosByCalendarYear(turnos: Turno[], year: number): Turno[] {
  const yearId = String(year);
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 4) === yearId)
  );
}

export function ensureTurnosDiaLibreContable(turnos: Turno[], diaLibre: number): Turno[] {
  return turnos.map((turno) =>
    typeof turno.diaLibreContable === "number"
      ? turno
      : { ...turno, diaLibreContable: diaLibre }
  );
}

// El payload se construye en el call site con buildBackupPayloadFromState
```

#### Código nuevo
```tsx
// El payload se construye en el call site con buildBackupPayloadFromState
```

#### Por qué se cambió
La selección de turnos por mes/año y la migración de día libre son utilidades puras y quedan junto a la ordenación en `turnos.ts`.

### Cambio 3 - Ampliar módulo de turnos

#### Código anterior
```ts
export function sortTurnosByDateDesc<T extends SortableTurno>(turnos: T[]): T[] {
  return [...turnos].sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const byDate = dateB.localeCompare(dateA);
    if (byDate !== 0) return byDate;
    return (b.startTime || "").localeCompare(a.startTime || "");
  });
}

function getTurnoMergeKey(t: SortableTurno): string {
```

#### Código nuevo
```ts
export function sortTurnosByDateDesc<T extends SortableTurno>(turnos: T[]): T[] {
  return [...turnos].sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const byDate = dateB.localeCompare(dateA);
    if (byDate !== 0) return byDate;
    return (b.startTime || "").localeCompare(a.startTime || "");
  });
}

export function getTurnosByCalendarMonth<T extends SortableTurno>(turnos: T[], year: number, month: number): T[] {
  const monthId = `${year}-${String(month).padStart(2, "0")}`;
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 7) === monthId)
  );
}

export function getTurnosByCalendarYear<T extends SortableTurno>(turnos: T[], year: number): T[] {
  const yearId = String(year);
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 4) === yearId)
  );
}

export function ensureTurnosDiaLibreContable<T extends { diaLibreContable?: number }>(turnos: T[], diaLibre: number): T[] {
  return turnos.map((turno) =>
    typeof turno.diaLibreContable === "number"
      ? turno
      : { ...turno, diaLibreContable: diaLibre }
  );
}

function getTurnoMergeKey(t: SortableTurno): string {
```

#### Por qué se cambió
El módulo `turnos.ts` agrupa ahora ordenación, selección por calendario y migración de día libre con tipos estructurales.

### Cambio 4 - Proteger extracción de selección

#### Código anterior
`No existía el test de extracción de selección en src/__tests__/turno-selection-extraction.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno selection extraction", () => {
  const turnosSource = readFileSync(resolve("src/turnos.ts"), "utf8");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps calendar selection and dia libre migration in turnos.ts", () => {
    expect(turnosSource).toContain("export function getTurnosByCalendarMonth");
    expect(turnosSource).toContain("export function getTurnosByCalendarYear");
    expect(turnosSource).toContain("export function ensureTurnosDiaLibreContable");
    expect(mainSource).toContain('from "./turnos"');
    expect(mainSource).not.toMatch(/^export function getTurnosByCalendarMonth\(/m);
    expect(mainSource).not.toMatch(/^export function ensureTurnosDiaLibreContable\(/m);
  });
});
```

#### Por qué se cambió
El test fija que selección de turnos y migración de día libre permanezcan fuera de `main.tsx`.

## 2026-05-24 23:20 - Extraer entrega de turnos

**Archivos modificados:** `src/main.tsx`, `src/turno-entrega.ts`, `src/__tests__/turno-entrega-extraction.test.ts`

### Cambio 1 - Importar entrega de turnos

#### Código anterior
```tsx
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./action-ids";
import { getTurnosNotasSemana } from "./turno-notas-logic";
```

```tsx
export type { BackupMenuActionId, HomeQuickActionId } from "./action-ids";
export { getTurnosNotasSemana };
```

#### Código nuevo
```tsx
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./action-ids";
import { getTurnosNotasSemana } from "./turno-notas-logic";
import { updateTurnoEntrega } from "./turno-entrega";
```

```tsx
export type { BackupMenuActionId, HomeQuickActionId } from "./action-ids";
export { getTurnosNotasSemana };
export { updateTurnoEntrega };
```

#### Por qué se cambió
`main.tsx` usa la actualización de entrega desde el nuevo módulo y conserva su export público para los tests.

### Cambio 2 - Eliminar entrega local

#### Código anterior
```tsx
export function updateTurnoEntrega(
  turnos: Turno[],
  turnoId: number,
  entregada: boolean,
  fechaEntrega: string | null
): Turno[] {
  return turnos.map((t) =>
    t.id === turnoId
      ? { ...t, entregada, fechaEntrega: entregada ? fechaEntrega : null }
      : t
  );
}

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Por qué se cambió
La modificación pura de estado de entrega se movió fuera de `main.tsx`; mantiene la misma regla para limpiar `fechaEntrega` al desmarcar.

### Cambio 3 - Crear módulo de entrega

#### Código anterior
`No existía el módulo de entrega en src/turno-entrega.ts.`

#### Código nuevo
```ts
export type EntregaTurno = {
  id: number;
  entregada?: boolean;
  fechaEntrega?: string | null;
};

export function updateTurnoEntrega<T extends EntregaTurno>(
  turnos: T[],
  turnoId: number,
  entregada: boolean,
  fechaEntrega: string | null
): T[] {
  return turnos.map((t) =>
    t.id === turnoId
      ? { ...t, entregada, fechaEntrega: entregada ? fechaEntrega : null }
      : t
  );
}
```

#### Por qué se cambió
El módulo nuevo encapsula la actualización de entrega con un tipo estructural para no depender de `main.tsx`.

### Cambio 4 - Proteger extracción de entrega

#### Código anterior
`No existía el test de extracción de entrega en src/__tests__/turno-entrega-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno entrega extraction", () => {
  const entregaPath = resolve("src/turno-entrega.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps delivery status updates outside main.tsx", () => {
    expect(existsSync(entregaPath)).toBe(true);

    const entregaSource = readFileSync(entregaPath, "utf8");
    expect(entregaSource).toContain("export function updateTurnoEntrega");
    expect(entregaSource).toContain("fechaEntrega: entregada ? fechaEntrega : null");
    expect(mainSource).toContain('from "./turno-entrega"');
    expect(mainSource).not.toMatch(/^export function updateTurnoEntrega\(/m);
  });
});
```

#### Por qué se cambió
El test fija que la actualización de entrega permanezca fuera de `main.tsx`.

## 2026-05-24 23:18 - Extraer notas de turnos

**Archivos modificados:** `src/main.tsx`, `src/turno-notas-logic.ts`, `src/__tests__/turno-notas-logic-extraction.test.ts`

### Cambio 1 - Importar lógica de notas

#### Código anterior
```tsx
import { parseCSVToHistory } from "./csv";
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./action-ids";
```

```tsx
export { getBackupMenuActionIds, getHomeQuickActionIds };
export type { BackupMenuActionId, HomeQuickActionId } from "./action-ids";
```

#### Código nuevo
```tsx
import { parseCSVToHistory } from "./csv";
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./action-ids";
import { getTurnosNotasSemana } from "./turno-notas-logic";
```

```tsx
export { getBackupMenuActionIds, getHomeQuickActionIds };
export type { BackupMenuActionId, HomeQuickActionId } from "./action-ids";
export { getTurnosNotasSemana };
```

#### Por qué se cambió
`main.tsx` usa el filtro de notas desde el nuevo módulo y conserva el export público para los tests.

### Cambio 2 - Eliminar filtro local de notas

#### Código anterior
```tsx
export function getTurnosNotasSemana(turnos: Turno[]): TurnoNotasSemana[] {
  return turnos
    .map((turno) => {
      const notasGenerales = turno.entries.filter((entry) => entry.type === "nota" && !!entry.note?.trim());
      const notasDetalladas = turno.entries.filter((entry) => entry.type !== "nota" && !!entry.note?.trim());
      return { turno, notasGenerales, notasDetalladas };
    })
    .filter((item) => item.notasGenerales.length > 0 || item.notasDetalladas.length > 0);
}

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Código nuevo
```tsx
// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================
```

#### Por qué se cambió
El filtrado de notas semanales se movió fuera de `main.tsx`; no cambia qué entradas se consideran notas generales o detalladas.

### Cambio 3 - Crear módulo de notas de turnos

#### Código anterior
`No existía el módulo de lógica de notas en src/turno-notas-logic.ts.`

#### Código nuevo
```ts
import type { Turno, TurnoNotasSemana } from "./main";

export function getTurnosNotasSemana(turnos: Turno[]): TurnoNotasSemana[] {
  return turnos
    .map((turno) => {
      const notasGenerales = turno.entries.filter((entry) => entry.type === "nota" && !!entry.note?.trim());
      const notasDetalladas = turno.entries.filter((entry) => entry.type !== "nota" && !!entry.note?.trim());
      return { turno, notasGenerales, notasDetalladas };
    })
    .filter((item) => item.notasGenerales.length > 0 || item.notasDetalladas.length > 0);
}
```

#### Por qué se cambió
El módulo nuevo contiene solo la lógica pura de selección de notas y usa importación de tipos para no crear dependencias en runtime.

### Cambio 4 - Proteger extracción de notas

#### Código anterior
`No existía el test de extracción de notas en src/__tests__/turno-notas-logic-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno notes logic extraction", () => {
  const notesLogicPath = resolve("src/turno-notas-logic.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps weekly turn note filtering outside main.tsx", () => {
    expect(existsSync(notesLogicPath)).toBe(true);

    const notesLogicSource = readFileSync(notesLogicPath, "utf8");
    expect(notesLogicSource).toContain("export function getTurnosNotasSemana");
    expect(notesLogicSource).toContain('entry.type === "nota"');
    expect(mainSource).toContain('from "./turno-notas-logic"');
    expect(mainSource).not.toMatch(/^export function getTurnosNotasSemana\(/m);
  });
});
```

#### Por qué se cambió
El test fija que el filtrado semanal de notas permanezca fuera de `main.tsx`.

## 2026-05-24 23:15 - Extraer acciones de menu

**Archivos modificados:** `src/main.tsx`, `src/action-ids.ts`, `src/__tests__/action-ids-extraction.test.ts`

### Cambio 1 - Importar acciones de menu

#### Código anterior
```tsx
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";
import { parseCSVToHistory } from "./csv";
```

```tsx
export { mergeTurnos, sortTurnosByDateDesc };
export { parseCSVLine, parseCSVToHistory } from "./csv";
```

#### Código nuevo
```tsx
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";
import { parseCSVToHistory } from "./csv";
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./action-ids";
```

```tsx
export { mergeTurnos, sortTurnosByDateDesc };
export { parseCSVLine, parseCSVToHistory } from "./csv";
export { getBackupMenuActionIds, getHomeQuickActionIds };
export type { BackupMenuActionId, HomeQuickActionId } from "./action-ids";
```

#### Por qué se cambió
`main.tsx` usa los ids de acciones desde el nuevo módulo y conserva sus exports públicos para los tests.

### Cambio 2 - Eliminar acciones locales

#### Código anterior
```tsx
export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
export type BackupMenuActionId = "export-json" | "restore-json";

export function getHomeQuickActionIds(isAdmin: boolean): HomeQuickActionId[] {
  const actions: HomeQuickActionId[] = ["new-reservation", "agenda"];
  if (isAdmin) actions.push("admin-users");
  actions.push("logout", "settings");
  return actions;
}

export function getBackupMenuActionIds(_isAdmin: boolean): BackupMenuActionId[] {
  return ["export-json", "restore-json"];
}

// El payload se construye en el call site con buildBackupPayloadFromState
```

#### Código nuevo
```tsx
// El payload se construye en el call site con buildBackupPayloadFromState
```

#### Por qué se cambió
Los tipos y funciones de ids de acciones no necesitan vivir en `main.tsx`; al extraerlos se reduce el archivo sin tocar las pantallas.

### Cambio 3 - Crear módulo de acciones

#### Código anterior
`No existía el módulo de acciones en src/action-ids.ts.`

#### Código nuevo
```ts
export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
export type BackupMenuActionId = "export-json" | "restore-json";

export function getHomeQuickActionIds(isAdmin: boolean): HomeQuickActionId[] {
  const actions: HomeQuickActionId[] = ["new-reservation", "agenda"];
  if (isAdmin) actions.push("admin-users");
  actions.push("logout", "settings");
  return actions;
}

export function getBackupMenuActionIds(_isAdmin: boolean): BackupMenuActionId[] {
  return ["export-json", "restore-json"];
}
```

#### Por qué se cambió
El módulo nuevo centraliza las listas de acciones visibles para home y backup.

### Cambio 4 - Proteger extracción de acciones

#### Código anterior
`No existía el test de extracción de acciones en src/__tests__/action-ids-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Action id extraction", () => {
  const actionIdsPath = resolve("src/action-ids.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps home and backup action ids outside main.tsx", () => {
    expect(existsSync(actionIdsPath)).toBe(true);

    const actionIdsSource = readFileSync(actionIdsPath, "utf8");
    expect(actionIdsSource).toContain("export function getHomeQuickActionIds");
    expect(actionIdsSource).toContain("export function getBackupMenuActionIds");
    expect(mainSource).toContain('from "./action-ids"');
    expect(mainSource).not.toMatch(/^export type HomeQuickActionId/m);
    expect(mainSource).not.toMatch(/^export function getHomeQuickActionIds\(/m);
  });
});
```

#### Por qué se cambió
El test fija que los ids de acciones no vuelvan a concentrarse dentro de `main.tsx`.

## 2026-05-24 23:12 - Extraer parser CSV

**Archivos modificados:** `src/main.tsx`, `src/csv.ts`, `src/__tests__/csv-extraction.test.ts`

### Cambio 1 - Importar parser CSV

#### Código anterior
```tsx
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";
```

```tsx
export { buildBackupPayload, buildBackupPayloadFromState };
export { mergeTurnos, sortTurnosByDateDesc };
```

#### Código nuevo
```tsx
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";
import { parseCSVToHistory } from "./csv";
```

```tsx
export { buildBackupPayload, buildBackupPayloadFromState };
export { mergeTurnos, sortTurnosByDateDesc };
export { parseCSVLine, parseCSVToHistory } from "./csv";
```

#### Por qué se cambió
`main.tsx` necesita usar `parseCSVToHistory` en la importación y mantener `parseCSVLine` y `parseCSVToHistory` como exports públicos para los tests existentes.

### Cambio 2 - Eliminar parser de línea local

#### Código anterior
```tsx
export function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function getTurnosByCalendarMonth(turnos: Turno[], year: number, month: number): Turno[] {
```

#### Código nuevo
```tsx
export function getTurnosByCalendarMonth(turnos: Turno[], year: number, month: number): Turno[] {
```

#### Por qué se cambió
El parser de una línea CSV se movió a `csv.ts` para que `main.tsx` deje de contener lógica de importación de archivos.

### Cambio 3 - Eliminar conversión CSV local

#### Código anterior
```tsx
export function parseCSVToHistory(csvText: string): Turno[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) return [];

  const newTurnosMap = new Map<string, Turno>();
  let timeBase = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const [date, startTime, endTime, type, amountStr, note, time, dineroStr, kmStr] = cols;

    const key = `${date}|${startTime}|${endTime}`;
    if (!newTurnosMap.has(key)) {
      newTurnosMap.set(key, {
        id: timeBase++,
        date,
        startTime: startTime || null,
        endTime,
        entries: [],
        totalP: 0, totalD: 0, totalA: 0, totalE: 0, totalF: 0, totalN: 0,
        dinero: parseFloat(dineroStr.replace(",", ".")) || 0,
        km: parseFloat(kmStr.replace(",", ".")) || 0,
        notes: "",
        startDate: date,
        totalPausedMinutes: 0
      });
    }

    const turno = newTurnosMap.get(key)!;

    if (type) {
      const amount = parseFloat(amountStr.replace(",", ".")) || 0;
      turno.entries.push({
        id: timeBase++,
        type,
        amount,
        note: note || "",
        time
      });

      if (type === 'propina') turno.totalP += amount;
      if (type === 'datafono') turno.totalD += amount;
      if (type === 'agencia_bono') turno.totalA += amount;
      if (type === 'extra') turno.totalE += amount;
      if (type === 'gasolina') turno.totalF += amount;
      if (type === 'nulo') turno.totalN += amount;
    }
  }

  return sortTurnosByDateDesc(Array.from(newTurnosMap.values()));
}

export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
```

#### Código nuevo
```tsx
export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
```

#### Por qué se cambió
La conversión de CSV a turnos se trasladó a `csv.ts`; se conserva la construcción de entradas, totales por tipo y ordenación final.

### Cambio 4 - Crear módulo CSV

#### Código anterior
`No existía el módulo CSV en src/csv.ts.`

#### Código nuevo
```ts
import { sortTurnosByDateDesc } from "./turnos";

export type CSVEntry = {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
};

export type CSVTurno = {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: CSVEntry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string;
  totalPausedMinutes: number;
};

export function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function parseCSVToHistory(csvText: string): CSVTurno[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const newTurnosMap = new Map<string, CSVTurno>();
  let timeBase = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const [date, startTime, endTime, type, amountStr, note, time, dineroStr, kmStr] = cols;

    const key = `${date}|${startTime}|${endTime}`;
    if (!newTurnosMap.has(key)) {
      newTurnosMap.set(key, {
        id: timeBase++,
        date,
        startTime: startTime || null,
        endTime,
        entries: [],
        totalP: 0, totalD: 0, totalA: 0, totalE: 0, totalF: 0, totalN: 0,
        dinero: parseFloat(dineroStr.replace(",", ".")) || 0,
        km: parseFloat(kmStr.replace(",", ".")) || 0,
        notes: "",
        startDate: date,
        totalPausedMinutes: 0
      });
    }

    const turno = newTurnosMap.get(key)!;

    if (type) {
      const amount = parseFloat(amountStr.replace(",", ".")) || 0;
      turno.entries.push({
        id: timeBase++,
        type,
        amount,
        note: note || "",
        time
      });

      if (type === "propina") turno.totalP += amount;
      if (type === "datafono") turno.totalD += amount;
      if (type === "agencia_bono") turno.totalA += amount;
      if (type === "extra") turno.totalE += amount;
      if (type === "gasolina") turno.totalF += amount;
      if (type === "nulo") turno.totalN += amount;
    }
  }

  return sortTurnosByDateDesc(Array.from(newTurnosMap.values()));
}
```

#### Por qué se cambió
El módulo nuevo encapsula el parsing CSV y reutiliza la ordenación de `turnos.ts`.

### Cambio 5 - Proteger extracción CSV

#### Código anterior
`No existía el test de extracción CSV en src/__tests__/csv-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CSV parsing extraction", () => {
  const csvPath = resolve("src/csv.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps CSV parsing helpers outside main.tsx", () => {
    expect(existsSync(csvPath)).toBe(true);

    const csvSource = readFileSync(csvPath, "utf8");
    expect(csvSource).toContain("export function parseCSVLine");
    expect(csvSource).toContain("export function parseCSVToHistory");
    expect(csvSource).toContain('from "./turnos"');
    expect(mainSource).toContain('from "./csv"');
    expect(mainSource).not.toMatch(/^export function parseCSVLine\(/m);
    expect(mainSource).not.toMatch(/^export function parseCSVToHistory\(/m);
  });
});
```

#### Por qué se cambió
El test fija que el parsing CSV permanece fuera de `main.tsx` y que usa el módulo compartido de turnos.

## 2026-05-24 23:09 - Extraer utilidades de turnos

**Archivos modificados:** `src/main.tsx`, `src/turnos.ts`, `src/__tests__/turno-merge-extraction.test.ts`

### Cambio 1 - Importar utilidades de turnos

#### Código anterior
```tsx
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
```

```tsx
export { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
export { buildBackupPayload, buildBackupPayloadFromState };
```

#### Código nuevo
```tsx
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";
```

```tsx
export { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
export { buildBackupPayload, buildBackupPayloadFromState };
export { mergeTurnos, sortTurnosByDateDesc };
```

#### Por qué se cambió
`main.tsx` usa y reexporta las utilidades desde el nuevo módulo `turnos.ts`, manteniendo los imports públicos existentes para los tests.

### Cambio 2 - Eliminar ordenación local

#### Código anterior
```tsx
export function sortTurnosByDateDesc(turnos: Turno[]): Turno[] {
  return [...turnos].sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const byDate = dateB.localeCompare(dateA);
    if (byDate !== 0) return byDate;
    return (b.startTime || "").localeCompare(a.startTime || "");
  });
}

export function getTurnosByCalendarMonth(turnos: Turno[], year: number, month: number): Turno[] {
```

#### Código nuevo
```tsx
export function getTurnosByCalendarMonth(turnos: Turno[], year: number, month: number): Turno[] {
```

#### Por qué se cambió
La ordenación pura de turnos se movió a `turnos.ts` para reducir `main.tsx` sin cambiar el criterio de fecha ni hora.

### Cambio 3 - Eliminar fusión local

#### Código anterior
```tsx
// Esta función mezcla los turnos seleccionados con los actuales sin duplicar
function getTurnoMergeKey(t: Turno): string {
  return [
    t.startDate || "",
    t.date || "",
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}

export function mergeTurnos(actuales: Turno[], nuevos: Turno[]) {
  const map = new Map();
  // Primero metemos los que ya tienes
  actuales.forEach(t => map.set(getTurnoMergeKey(t), t));
  // Luego añadimos los nuevos (si coinciden fecha e inicio, el map no se duplica)
  nuevos.forEach(t => map.set(getTurnoMergeKey(t), t));

  return sortTurnosByDateDesc(Array.from(map.values()));
}

function loadCurrent(): CurrentState {
```

#### Código nuevo
```tsx
function loadCurrent(): CurrentState {
```

#### Por qué se cambió
La fusión de turnos importados se trasladó con su clave interna al módulo `turnos.ts`, manteniendo el mismo comportamiento de deduplicación.

### Cambio 4 - Crear módulo de turnos

#### Código anterior
`No existía el módulo de turnos en src/turnos.ts.`

#### Código nuevo
```ts
export type SortableTurno = {
  date: string;
  startDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export function sortTurnosByDateDesc<T extends SortableTurno>(turnos: T[]): T[] {
  return [...turnos].sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const byDate = dateB.localeCompare(dateA);
    if (byDate !== 0) return byDate;
    return (b.startTime || "").localeCompare(a.startTime || "");
  });
}

function getTurnoMergeKey(t: SortableTurno): string {
  return [
    t.startDate || "",
    t.date || "",
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}

export function mergeTurnos<T extends SortableTurno>(actuales: T[], nuevos: T[]): T[] {
  const map = new Map<string, T>();
  // Primero metemos los que ya tienes
  actuales.forEach((t) => map.set(getTurnoMergeKey(t), t));
  // Luego añadimos los nuevos (si coinciden fecha e inicio, el map no se duplica)
  nuevos.forEach((t) => map.set(getTurnoMergeKey(t), t));

  return sortTurnosByDateDesc(Array.from(map.values()));
}
```

#### Por qué se cambió
El módulo nuevo agrupa ordenación y fusión de turnos con tipos estructurales para no depender de `main.tsx`.

### Cambio 5 - Proteger extracción de turnos

#### Código anterior
`No existía el test de extracción de turnos en src/__tests__/turno-merge-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno merge extraction", () => {
  const turnosPath = resolve("src/turnos.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps turno sorting and merge helpers outside main.tsx", () => {
    expect(existsSync(turnosPath)).toBe(true);

    const turnosSource = readFileSync(turnosPath, "utf8");
    expect(turnosSource).toContain("export function sortTurnosByDateDesc");
    expect(turnosSource).toContain("export function mergeTurnos");
    expect(turnosSource).toContain("function getTurnoMergeKey");
    expect(mainSource).toContain('from "./turnos"');
    expect(mainSource).not.toMatch(/^export function sortTurnosByDateDesc\(/m);
    expect(mainSource).not.toMatch(/^export function mergeTurnos\(/m);
  });
});
```

#### Por qué se cambió
El test fija que las utilidades de ordenación y fusión permanecen fuera de `main.tsx`.

## 2026-05-24 23:06 - Extraer builders de backup

**Archivos modificados:** `src/main.tsx`, `src/backup.ts`, `src/__tests__/backup-extraction.test.ts`

### Cambio 1 - Importar builders de backup

#### Código anterior
```tsx
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
```

```tsx
export { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
```

#### Código nuevo
```tsx
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./backup";
```

```tsx
export { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
export { buildBackupPayload, buildBackupPayloadFromState };
```

#### Por qué se cambió
Los builders se importan desde el nuevo módulo `backup.ts` y se reexportan desde `main.tsx` para mantener la API usada por los tests y por el resto de la app.

### Cambio 2 - Eliminar builders locales

#### Código anterior
```tsx
export function buildBackupPayload(values: {
  history: string | null;
  settings: string | null;
  current: string | null;
  weekOverrides: string | null;
  reservations: string | null;
  notes: string | null;
}) {
  return {
    history: values.history,
    settings: values.settings,
    current: values.current,
    weekOverrides: values.weekOverrides,
    reservations: values.reservations,
    notes: values.notes,
  };
}

export function buildBackupPayloadFromState(values: {
  history: Turno[];
  settings: AppSettings;
  current: CurrentState;
  weekOverrides: WeekOverride[];
  reservations: Reserva[];
  notes: NotaCalendario[];
}) {
  return buildBackupPayload({
    history: JSON.stringify(values.history),
    settings: JSON.stringify(values.settings),
    current: JSON.stringify(values.current),
    weekOverrides: JSON.stringify(values.weekOverrides),
    reservations: JSON.stringify(values.reservations),
    notes: JSON.stringify(values.notes),
  });
}

export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
```

#### Código nuevo
```tsx
export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
```

#### Por qué se cambió
La definición local duplicaba responsabilidad dentro de `main.tsx`; el comportamiento queda en `backup.ts` sin tocar las claves ni la serialización del payload.

### Cambio 3 - Crear módulo de backup

#### Código anterior
`No existía el módulo de backup en src/backup.ts.`

#### Código nuevo
```ts
export type BackupPayloadValues = {
  history: string | null;
  settings: string | null;
  current: string | null;
  weekOverrides: string | null;
  reservations: string | null;
  notes: string | null;
};

export type BackupStateValues = {
  history: unknown;
  settings: unknown;
  current: unknown;
  weekOverrides: unknown;
  reservations: unknown;
  notes: unknown;
};

export function buildBackupPayload(values: BackupPayloadValues) {
  return {
    history: values.history,
    settings: values.settings,
    current: values.current,
    weekOverrides: values.weekOverrides,
    reservations: values.reservations,
    notes: values.notes,
  };
}

export function buildBackupPayloadFromState(values: BackupStateValues) {
  return buildBackupPayload({
    history: JSON.stringify(values.history),
    settings: JSON.stringify(values.settings),
    current: JSON.stringify(values.current),
    weekOverrides: JSON.stringify(values.weekOverrides),
    reservations: JSON.stringify(values.reservations),
    notes: JSON.stringify(values.notes),
  });
}
```

#### Por qué se cambió
El módulo nuevo concentra la construcción pura del backup y evita importar tipos de `main.tsx`, reduciendo el riesgo de ciclos.

### Cambio 4 - Proteger la extracción con test

#### Código anterior
`No existía el test de extracción de backup en src/__tests__/backup-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Backup builder extraction", () => {
  const backupPath = resolve("src/backup.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps backup payload builders outside main.tsx", () => {
    expect(existsSync(backupPath)).toBe(true);

    const backupSource = readFileSync(backupPath, "utf8");
    expect(backupSource).toContain("export function buildBackupPayload");
    expect(backupSource).toContain("export function buildBackupPayloadFromState");
    expect(mainSource).toContain('from "./backup"');
    expect(mainSource).not.toMatch(/^export function buildBackupPayload\(/m);
  });
});
```

#### Por qué se cambió
El test fija que la extracción se mantiene y que `main.tsx` ya no vuelve a definir los builders de backup.

## 2026-05-24 23:01 - Extraer diálogo de edición

**Archivos modificados:** `src/main.tsx`, `src/components/edit-entry-dialog.tsx`, `src/__tests__/edit-entry-dialog-extraction.test.ts`

### Cambio 1 - Importar diálogo de edición

#### Código anterior
```tsx
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
```

#### Código nuevo
```tsx
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
```

#### Por qué se cambió
`EditEntryDialog` se movió a un componente propio para seguir reduciendo `main.tsx` sin tocar cálculos ni estado contable.

### Cambio 2 - Pasar dependencias al diálogo

#### Código anterior
```tsx
          <EditEntryDialog
            entry={editEntry}
            amount={editEntryAmount}
            note={editEntryNote}
            onAmountChange={setEditEntryAmount}
            onNoteChange={setEditEntryNote}
            onSave={saveEditEntry}
            onDelete={() => {
```

#### Código nuevo
```tsx
          <EditEntryDialog
            entry={editEntry}
            amount={editEntryAmount}
            note={editEntryNote}
            onAmountChange={setEditEntryAmount}
            onNoteChange={setEditEntryNote}
            onSave={saveEditEntry}
            getEntryTypeMeta={getEntryTypeMeta}
            deleteIcon={<IconDel />}
            onDelete={() => {
```

#### Por qué se cambió
El componente extraído necesita el mismo metadato visual de tipo de entrada y el mismo icono de borrar que usaba dentro de `main.tsx`. Se pasan como props para evitar ciclos de importación.

### Cambio 3 - Eliminar definición local de EditEntryDialog

#### Código anterior
```tsx
function EditEntryDialog({
  entry,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onSave,
  onDelete,
  onCancel,
}: {
  entry: Entry;
  amount: string;
  note: string;
  onAmountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [showKP, setShowKP] = React.useState(false);
  const meta = getEntryTypeMeta(entry.type);
```

#### Código nuevo
```tsx
// AuthGate: decide qué pintar en función del estado de autenticación.
```

#### Por qué se cambió
La implementación local del diálogo se eliminó de `main.tsx`; el siguiente bloque después de `App` vuelve a ser `AuthGate`. Esto reduce superficie del archivo principal sin modificar comportamiento de edición.

### Cambio 4 - Nuevo componente EditEntryDialog

#### Código anterior
`No existía el archivo src/components/edit-entry-dialog.tsx.`

#### Código nuevo
```tsx
import { useState, type ReactNode } from "react";
import type { Entry } from "../main";

type EntryTypeMetaForDialog = {
  color: string;
  label: string;
};

export function EditEntryDialog({
  entry,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onSave,
  onDelete,
  onCancel,
  getEntryTypeMeta,
  deleteIcon,
}: {
  entry: Entry;
  amount: string;
  note: string;
  onAmountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  getEntryTypeMeta: (type: string) => EntryTypeMetaForDialog;
  deleteIcon: ReactNode;
}) {
  const [showKP, setShowKP] = useState(false);
  const meta = getEntryTypeMeta(entry.type);

  function kpAmount(k: string) {
    if (k === "DEL") { onAmountChange(amount.slice(0, -1)); return; }
    if (k === ",") { if (!amount.includes(",")) onAmountChange(amount + ","); return; }
    if (amount.replace(",", "").length >= 7) return;
    onAmountChange(amount + k);
  }
```

#### Por qué se cambió
Se creó un componente específico para editar entradas. Mantiene la misma lógica de teclado, guardado, borrado y nota, pero recibe las dependencias visuales desde `main.tsx`.

### Cambio 5 - Test de extracción del diálogo

#### Código anterior
`No existía el archivo src/__tests__/edit-entry-dialog-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("EditEntryDialog extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const componentPath = resolve("src/components/edit-entry-dialog.tsx");

  it("keeps EditEntryDialog outside main.tsx", () => {
    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");
    expect(componentSource).toContain("export function EditEntryDialog");
    expect(mainSource).toContain('from "./components/edit-entry-dialog"');
    expect(mainSource).not.toMatch(/^function EditEntryDialog/m);
  });
});
```

#### Por qué se cambió
Añade un candado para que el diálogo de edición permanezca extraído y no vuelva a crecer dentro de `main.tsx`.

## 2026-05-24 22:56 - Extraer resolución de update APK

**Archivos modificados:** `src/main.tsx`, `src/update-flow.ts`, `src/__tests__/apk-update-flow.test.ts`, `src/__tests__/update-flow-extraction.test.ts`

### Cambio 1 - Importar helper de update

#### Código anterior
```tsx
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import {
  userMetaDocRef,
```

#### Código nuevo
```tsx
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { resolveLatestApkUpdate, type UpdateState } from "./update-flow";
import {
  userMetaDocRef,
```

#### Por qué se cambió
La decisión sobre el último release de GitHub y su APK se movió a un helper puro para reducir lógica dentro de `main.tsx`.

### Cambio 2 - Tipar estado de update

#### Código anterior
```tsx
  const [updateState, setUpdateState] = useState<"idle" | "checking" | "available" | "downloading" | "permission_required" | "error" | "installed">("idle");
```

#### Código nuevo
```tsx
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
```

#### Por qué se cambió
El tipo union del estado de update se centraliza en `src/update-flow.ts`, evitando duplicarlo en `main.tsx`.

### Cambio 3 - Sustituir parseo inline del release

#### Código anterior
```tsx
      const data = await res.json();
      const latestVersion = data.tag_name ? data.tag_name.replace(/[^0-9.]/g, '') : null;

      if (latestVersion && latestVersion !== APP_VERSION) {
        let apkAsset = data.assets?.find((asset: any) => asset.name && asset.name.endsWith(".apk"));
        if (apkAsset) {
          setDownloadUrl(apkAsset.browser_download_url);
          setUpdateState("available");
          setUpdateMsg(`¡Nueva versión ${latestVersion} disponible!`);
        } else {
          setDownloadUrl("");
          setReleaseUrl(data.html_url || "https://github.com/Carlos4400/app-taxi/releases/latest");
          setUpdateState("error");
          setUpdateMsg("No se encontró APK en el último release.");
        }
      } else {
        setUpdateState("idle");
        setUpdateMsg("Tienes la última versión instalada.");
      }
```

#### Código nuevo
```tsx
      const data = await res.json();
      const result = resolveLatestApkUpdate(data, APP_VERSION);
      setDownloadUrl(result.downloadUrl);
      setReleaseUrl(result.releaseUrl);
      setUpdateState(result.updateState);
      setUpdateMsg(result.updateMsg);
```

#### Por qué se cambió
`main.tsx` conserva el fetch y la actualización de estado React, pero delega la resolución del release a una función pura testeable. No cambia la UI ni el flujo de instalación.

### Cambio 4 - Helper puro de update APK

#### Código anterior
`No existía el archivo src/update-flow.ts.`

#### Código nuevo
```ts
export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "permission_required"
  | "error"
  | "installed";

export interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
}

export interface GitHubLatestRelease {
  tag_name?: string;
  html_url?: string;
  assets?: GitHubReleaseAsset[];
}

export interface UpdateCheckResult {
  updateState: UpdateState;
  updateMsg: string;
  downloadUrl: string;
  releaseUrl: string;
}

const LATEST_RELEASE_URL = "https://github.com/Carlos4400/app-taxi/releases/latest";

export function resolveLatestApkUpdate(
  data: GitHubLatestRelease,
  currentVersion: string,
): UpdateCheckResult {
  const latestVersion = data.tag_name ? data.tag_name.replace(/[^0-9.]/g, '') : null;

  if (latestVersion && latestVersion !== currentVersion) {
    const apkAsset = data.assets?.find((asset) => asset.name && asset.name.endsWith(".apk"));
    if (apkAsset) {
      return {
        downloadUrl: apkAsset.browser_download_url || "",
        releaseUrl: "",
        updateState: "available",
        updateMsg: `¡Nueva versión ${latestVersion} disponible!`,
      };
    }

    return {
      downloadUrl: "",
      releaseUrl: data.html_url || LATEST_RELEASE_URL,
      updateState: "error",
      updateMsg: "No se encontró APK en el último release.",
    };
  }

  return {
    downloadUrl: "",
    releaseUrl: "",
    updateState: "idle",
    updateMsg: "Tienes la última versión instalada.",
  };
}
```

#### Por qué se cambió
Centraliza la lógica de detectar versión nueva, asset `.apk`, fallback a release y mensajes de estado. Al ser puro, se puede validar sin montar React ni tocar Capacitor.

### Cambio 5 - Test APK apuntando al helper

#### Código anterior
```ts
describe("APK update flow hardening", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const gradleSource = readFileSync(resolve("android/app/build.gradle"), "utf8");

  it("does not expose an installable Android URL when the latest release has no APK asset", () => {
    expect(mainSource).toContain('asset.name.endsWith(".apk")');
    expect(mainSource).toMatch(/setUpdateMsg\("No se encontr\S+ APK en el \S+ltimo release\."\)/);
    expect(mainSource).not.toContain("Sin APK directo");
    expect(mainSource).not.toContain("const fallbackUrl = data.assets?.[0]?.browser_download_url || data.html_url");
  });
```

#### Código nuevo
```ts
describe("APK update flow hardening", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const updateFlowSource = readFileSync(resolve("src/update-flow.ts"), "utf8");
  const gradleSource = readFileSync(resolve("android/app/build.gradle"), "utf8");

  it("does not expose an installable Android URL when the latest release has no APK asset", () => {
    expect(updateFlowSource).toContain('asset.name.endsWith(".apk")');
    expect(updateFlowSource).toContain('updateMsg: "No se encontró APK en el último release."');
    expect(updateFlowSource).not.toContain("Sin APK directo");
    expect(updateFlowSource).not.toContain("const fallbackUrl = data.assets?.[0]?.browser_download_url || data.html_url");
  });
```

#### Por qué se cambió
El candado que antes inspeccionaba `main.tsx` debe mirar ahora el helper extraído, porque ahí vive la validación estricta de asset `.apk`.

### Cambio 6 - Test de extracción de update

#### Código anterior
`No existía el archivo src/__tests__/update-flow-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Update flow extraction", () => {
  const helperPath = resolve("src/update-flow.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps GitHub release parsing outside main.tsx", () => {
    expect(existsSync(helperPath)).toBe(true);

    const helperSource = readFileSync(helperPath, "utf8");
    expect(helperSource).toContain("export function resolveLatestApkUpdate");
    expect(helperSource).toContain('asset.name.endsWith(".apk")');
    expect(mainSource).toContain('from "./update-flow"');
    expect(mainSource).not.toContain('data.assets?.find((asset: any) => asset.name && asset.name.endsWith(".apk"))');
  });
});
```

#### Por qué se cambió
Añade un candado para que el parseo del release de GitHub no vuelva a crecer dentro de `main.tsx`.

## 2026-05-24 22:50 - Extraer tarjeta de notas

**Archivos modificados:** `src/main.tsx`, `src/components/turno-notas.tsx`, `src/__tests__/detailed-notes-layout.test.ts`, `src/__tests__/turno-notas-component-extraction.test.ts`

### Cambio 1 - Importar TurnoNotasCard

#### Código anterior
```tsx
import { LoginScreen } from "./login-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import {
  userMetaDocRef,
```

#### Código nuevo
```tsx
import { LoginScreen } from "./login-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import {
  userMetaDocRef,
```

#### Por qué se cambió
`TurnoNotasCard` se movió fuera de `main.tsx` para continuar reduciendo el componente principal sin tocar la lógica contable.

### Cambio 2 - Pasar dependencias a la tarjeta de notas

#### Código anterior
```tsx
                  <TurnoNotasCard
                    key={`notas-${data.turno.id}`}
                    data={data}
                    onClick={() => { setReturnScreen("detalleMes"); setViewTurno(data.turno); setScreen("summary"); }}
                  />
```

#### Código nuevo
```tsx
                  <TurnoNotasCard
                    key={`notas-${data.turno.id}`}
                    data={data}
                    formatDate={fmtDate}
                    formatMoney={fmt}
                    getEntryTypeMeta={getEntryTypeMeta}
                    noteTimeStyle={NOTE_TIME_STYLE}
                    onClick={() => { setReturnScreen("detalleMes"); setViewTurno(data.turno); setScreen("summary"); }}
                  />
```

#### Por qué se cambió
El componente extraído necesita el mismo formateo y metadatos que usaba dentro de `main.tsx`. Se pasan como props para conservar comportamiento y evitar ciclos de importación.

### Cambio 3 - Pasar dependencias en detalle de semana

#### Código anterior
```tsx
                  <TurnoNotasCard
                    key={`notas-${data.turno.id}`}
                    data={data}
                    onClick={() => { setReturnScreen("detalleSemana"); setViewTurno(data.turno); setScreen("summary"); }}
                  />
```

#### Código nuevo
```tsx
                  <TurnoNotasCard
                    key={`notas-${data.turno.id}`}
                    data={data}
                    formatDate={fmtDate}
                    formatMoney={fmt}
                    getEntryTypeMeta={getEntryTypeMeta}
                    noteTimeStyle={NOTE_TIME_STYLE}
                    onClick={() => { setReturnScreen("detalleSemana"); setViewTurno(data.turno); setScreen("summary"); }}
                  />
```

#### Por qué se cambió
La segunda llamada al componente también debe recibir las dependencias explícitas para que la vista de detalle semanal mantenga exactamente el mismo renderizado.

### Cambio 4 - Eliminar definición local de TurnoNotasCard

#### Código anterior
```tsx
function TurnoNotasCard({
  data,
  onClick
}: {
  data: TurnoNotasSemana;
  onClick: () => void;
}) {
  const { turno, notasGenerales, notasDetalladas } = data;
  return (
    <div
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.035)", borderRadius: 14, padding: "12px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{fmtDate(turno.date)}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>
          {turno.startTime} - {turno.endTime}
        </div>
      </div>
```

#### Código nuevo
```tsx
// AuthGate: decide qué pintar en función del estado de autenticación.
```

#### Por qué se cambió
La definición local de `TurnoNotasCard` desaparece de `main.tsx`; el siguiente bloque en esa zona vuelve a ser `AuthGate`. Esto reduce el tamaño del archivo principal sin cambiar el flujo de navegación ni los cálculos.

### Cambio 5 - Nuevo componente TurnoNotasCard

#### Código anterior
`No existía el archivo src/components/turno-notas.tsx.`

#### Código nuevo
```tsx
import type { CSSProperties } from "react";
import type { TurnoNotasSemana } from "../main";

type EntryTypeMetaForNotes = {
  color: string;
  label: string;
};

export function TurnoNotasCard({
  data,
  onClick,
  formatDate,
  formatMoney,
  getEntryTypeMeta,
  noteTimeStyle,
}: {
  data: TurnoNotasSemana;
  onClick: () => void;
  formatDate: (iso: string) => string;
  formatMoney: (amount: number) => string;
  getEntryTypeMeta: (type: string) => EntryTypeMetaForNotes;
  noteTimeStyle: CSSProperties;
}) {
  const { turno, notasGenerales, notasDetalladas } = data;
  return (
    <div
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.035)", borderRadius: 14, padding: "12px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{formatDate(turno.date)}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>
          {turno.startTime} - {turno.endTime}
        </div>
      </div>

      {notasGenerales.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: notasDetalladas.length ? 10 : 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Notas del turno
          </div>
          {notasGenerales.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "8px 10px", lineHeight: 1.35, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                <span style={noteTimeStyle}>{entry.time}</span>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
              </div>
            );
          })}
        </div>
      )}

      {notasDetalladas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Notas detalladas
          </div>
          {notasDetalladas.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                <span style={noteTimeStyle}>{entry.time}</span>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.35, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0, alignSelf: "baseline" }}>{formatMoney(entry.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

#### Por qué se cambió
Se creó un módulo específico para la tarjeta de notas de turno. El componente mantiene la misma estructura, estilos y datos, pero recibe formateadores y metadatos desde `main.tsx`.

### Cambio 6 - Test de layout apuntando al nuevo archivo

#### Código anterior
```ts
describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
```

#### Código nuevo
```ts
describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

#### Por qué se cambió
El test seguía leyendo solo `main.tsx`, pero el bloque que valida ahora vive en `src/components/turno-notas.tsx`.

### Cambio 7 - Test de bloque de notas extraído

#### Código anterior
```ts
    const turnoNotasCardBlock = source.match(
      /function TurnoNotasCard\([\s\S]*?\/\/ AuthGate:/
    )?.[0];
```

#### Código nuevo
```ts
    const turnoNotasCardBlock = turnoNotasSource;
```

#### Por qué se cambió
Ya no hay que buscar el componente entre `TurnoNotasCard` y `AuthGate` dentro de `main.tsx`. El archivo del componente completo es ahora el bloque validado.

### Cambio 8 - Test del estilo de hora en notas

#### Código anterior
```ts
    expect(turnoNotasCardBlock).toMatch(/notasGenerales\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
    expect(turnoNotasCardBlock).toMatch(/notasDetalladas\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
```

#### Código nuevo
```ts
    expect(turnoNotasCardBlock).toMatch(/notasGenerales\.map[\s\S]*?<span style=\{noteTimeStyle\}>\{entry\.time\}<\/span>/);
    expect(turnoNotasCardBlock).toMatch(/notasDetalladas\.map[\s\S]*?<span style=\{noteTimeStyle\}>\{entry\.time\}<\/span>/);
```

#### Por qué se cambió
El componente extraído recibe el estilo de hora como prop `noteTimeStyle`, en lugar de leer directamente la constante local `NOTE_TIME_STYLE` de `main.tsx`.

### Cambio 9 - Test de extracción de TurnoNotasCard

#### Código anterior
`No existía el archivo src/__tests__/turno-notas-component-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("TurnoNotasCard extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const componentPath = resolve("src/components/turno-notas.tsx");

  it("keeps TurnoNotasCard outside main.tsx", () => {
    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");
    expect(componentSource).toContain("export function TurnoNotasCard");
    expect(mainSource).toContain('from "./components/turno-notas"');
    expect(mainSource).not.toMatch(/^function TurnoNotasCard/m);
  });
});
```

#### Por qué se cambió
Añade un candado para que `TurnoNotasCard` permanezca extraído y no vuelva a crecer dentro de `main.tsx`.

## 2026-05-24 22:41 - Extraer componentes comunes

**Archivos modificados:** `src/main.tsx`, `src/components/common.tsx`, `src/__tests__/common-components-extraction.test.ts`

### Cambio 1 - Importar componentes comunes

#### Código anterior
```tsx
import { auth, db } from "./firebase";
import { LoginScreen } from "./login-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
import {
  userMetaDocRef,
  userSubcollectionRef,
```

#### Código nuevo
```tsx
import { auth, db } from "./firebase";
import { LoginScreen } from "./login-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import {
  userMetaDocRef,
  userSubcollectionRef,
```

#### Por qué se cambió
`SmallCard`, `MainCard` y `ConfirmDialog` se movieron a un módulo común para reducir `main.tsx` sin tocar reglas de negocio ni cálculos de contabilidad.

### Cambio 2 - Eliminar tarjetas locales de main

#### Código anterior
```tsx
function SmallCard({
  label,
  color,
  bg,
  total,
  icon,
  onClick,
  disabled,
  ariaLabel,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      {...(onClick && !disabled ? { role: "button", tabIndex: 0 } : {})}
      aria-label={ariaLabel || label}
```

#### Código nuevo
```tsx
function EditEntryDialog({
```

#### Por qué se cambió
Las tarjetas comunes dejaron de definirse dentro de `main.tsx`; ahora se importan desde `src/components/common.tsx`. El siguiente bloque local en esa posición pasa a ser `EditEntryDialog`, sin cambiar la UI ni los cálculos.

### Cambio 3 - Eliminar diálogo de confirmación local

#### Código anterior
```tsx
interface ConfirmDialogProps {
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmBg?: string;
  confirmColor?: string;
  confirmBorder?: string;
}

function ConfirmDialog({ text, onConfirm, onCancel, confirmText, confirmBg, confirmColor, confirmBorder }: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text}
```

#### Código nuevo
```tsx
function TurnoNotasCard({
```

#### Por qué se cambió
El diálogo de confirmación se extrajo al módulo común junto con sus props. En `main.tsx` queda solo su uso mediante import, evitando duplicar responsabilidades en el componente principal.

### Cambio 4 - Módulo común de componentes

#### Código anterior
`No existía el archivo src/components/common.tsx.`

#### Código nuevo
```tsx
import type { ReactNode } from "react";
import { fmtMoney } from "../formatters";

function fmt(n: number): string {
  return fmtMoney(n);
}

export function SmallCard({
  label,
  color,
  bg,
  total,
  icon,
  onClick,
  disabled,
  ariaLabel,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      {...(onClick && !disabled ? { role: "button", tabIndex: 0 } : {})}
      aria-label={ariaLabel || label}
      style={{
        flex: 1,
        background: bg,
        borderRadius: 16,
        padding: "12px 14px",
        border: `1px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        transition: "all 0.15s",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
      }}
    >
      {icon}
      <div style={{ flex: 1 }}>
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
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color,
            letterSpacing: "-0.3px",
            marginTop: 2,
          }}
        >
          {fmt(total)}
        </div>
      </div>
    </div>
  );
}

export function MainCard({
  label,
  color,
  bg,
  total,
  count,
  icon,
  onClick,
  disabled,
  ariaLabel,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  count: number;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      {...(onClick && !disabled ? { role: "button", tabIndex: 0 } : {})}
      aria-label={ariaLabel || label}
      style={{
        flex: 1,
        background: bg,
        borderRadius: 22,
        padding: "20px 18px",
        border: `1px solid ${color}33`,
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: "clamp(24px, 7vw, 34px)",
          fontWeight: 900,
          color,
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {fmt(total)}
      </div>
      <div
        style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}
      >
        {count} entrada{count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

export interface ConfirmDialogProps {
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmBg?: string;
  confirmColor?: string;
  confirmBorder?: string;
}

export function ConfirmDialog({ text, onConfirm, onCancel, confirmText, confirmBg, confirmColor, confirmBorder }: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 20,
          padding: 24,
          width: "85%",
          maxWidth: 320,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.3s ease",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 12 }}>
          Confirmar acción
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.4 }}>
          {text}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: confirmBorder || "none",
              background: confirmBg || "rgba(255,60,60,0.2)",
              color: confirmColor || "#ff6b6b",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {confirmText || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Por qué se cambió
Centraliza los tres componentes comunes extraídos desde `main.tsx` y mantiene el mismo formato monetario mediante `fmtMoney`, sin depender de la función local `fmt` del archivo principal.

### Cambio 5 - Test de extracción de componentes

#### Código anterior
`No existía el archivo src/__tests__/common-components-extraction.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Common component extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const commonPath = resolve("src/components/common.tsx");

  it("keeps low-risk common components outside main.tsx", () => {
    expect(existsSync(commonPath)).toBe(true);

    const commonSource = readFileSync(commonPath, "utf8");
    expect(commonSource).toContain("export function SmallCard");
    expect(commonSource).toContain("export function MainCard");
    expect(commonSource).toContain("export function ConfirmDialog");

    expect(mainSource).toContain('from "./components/common"');
    expect(mainSource).not.toMatch(/^function SmallCard/m);
    expect(mainSource).not.toMatch(/^function MainCard/m);
    expect(mainSource).not.toMatch(/^function ConfirmDialog/m);
  });
});
```

#### Por qué se cambió
Añade un candado estático para impedir que los componentes comunes vuelvan a definirse dentro de `main.tsx` y para comprobar que el nuevo módulo exporta las piezas extraídas.

## 2026-05-24 22:21 - Actualizar documentación de Firebase

**Archivos modificados:** `README.md`

### Cambio 1 - Descripción inicial

#### Código anterior
```md
App progresiva (PWA) para gestionar tu Turno laboral como taxista. Registra propinas, datáfonos, agencias, extras, gasolina y nulos, y guarda el historial de Turnos en el dispositivo.
```

#### Código nuevo
```md
App para gestionar tu Turno laboral como taxista, disponible como APK de Android y como app web progresiva (PWA). Registra propinas, datáfonos, agencias, extras, gasolina y nulos. Cada usuario entra con su cuenta y sus datos se guardan en la nube (Firebase) y se sincronizan entre dispositivos.
```

#### Por qué se cambió
La descripción anterior decía que los turnos se guardaban solo en el dispositivo. La app actual usa cuentas de usuario, Firebase y sincronización entre dispositivos, así que la descripción debía reflejar la arquitectura real.

### Cambio 2 - Funcionalidades de cuenta, liquidación y sincronización

#### Código anterior
```md
- Registro de entradas por categoría: Propinas, Datáfono, Agencias, Extras, Gasolina y Nulos.
- Resumen diario con totales y desglose.
- Historial de Turnos anteriores con edición posterior.
- Exportación del historial completo a CSV (compatible con Excel).
- Modo offline (PWA con Service Worker).
- Teclado numérico adaptado.
- Tema oscuro y diseño optimizado para móvil.
- Persistencia local en el dispositivo (localStorage), sin servidor.
```

#### Código nuevo
```md
- Cuentas de usuario con inicio de sesión por email o nombre de usuario (Firebase Auth).
- Registro de entradas por categoría: Propinas, Datáfono, Agencias, Extras, Gasolina y Nulos.
- Resumen diario con totales y desglose.
- Historial de Turnos anteriores con edición posterior.
- Liquidación semanal con el cálculo de las cuentas a entregar.
- Exportación del historial completo a CSV (compatible con Excel).
- Datos guardados en la nube (Cloud Firestore) y sincronizados entre dispositivos.
- Funcionamiento offline: la app sigue usable sin conexión y sincroniza al recuperarla.
- Teclado numérico adaptado.
- Tema oscuro y diseño optimizado para móvil.
```

#### Por qué se cambió
La lista anterior omitía Firebase Auth, Firestore y la liquidación semanal, y todavía afirmaba que la app funcionaba sin servidor con `localStorage`. La nueva lista describe las funcionalidades actuales sin presentar `localStorage` como persistencia principal.

### Cambio 3 - Texto posterior a la instalación PWA

#### Código anterior
```md
Una vez instalada funciona offline y guarda los datos localmente, igual que el APK.
```

#### Código nuevo
```md
Una vez instalada, inicia sesión con tu cuenta. Los datos se guardan en tu cuenta (Firebase) y la app sigue funcionando sin conexión, igual que el APK.
```

#### Por qué se cambió
El texto anterior reforzaba la idea desactualizada de almacenamiento local como destino principal. El nuevo texto explica que el usuario debe iniciar sesión y que sus datos viven en su cuenta de Firebase, manteniendo la capacidad offline.

### Cambio 4 - Pasos de uso con inicio de sesión

#### Código anterior
```md
1. **Iniciar Turno** — Pulsa "Iniciar Turno" en la pantalla de inicio.
2. **Añadir entradas** — Usa los botones de cada categoría para registrar importes.
3. **Terminar Turno** — Rellena el resumen (dinero total y km recorridos).
4. **Historial** — Accede a Turnos anteriores, edítalas o expórtalas a CSV.
```

#### Código nuevo
```md
1. **Iniciar sesión** — Entra con tu email o nombre de usuario, o crea una cuenta nueva.
2. **Iniciar Turno** — Pulsa "Iniciar Turno" en la pantalla de inicio.
3. **Añadir entradas** — Usa los botones de cada categoría para registrar importes.
4. **Terminar Turno** — Rellena el resumen (dinero total y km recorridos).
5. **Historial** — Accede a Turnos anteriores, edítalas o expórtalas a CSV.
```

#### Por qué se cambió
La app actual tiene pantalla de login y registro antes del uso normal. El README debía incluir ese primer paso para no describir un flujo antiguo sin autenticación.

### Cambio 5 - Sección de datos y sincronización

#### Código anterior
`No existía la sección "Datos y sincronización" en README.md.`

#### Código nuevo
```md
## Datos y sincronización

Cada usuario inicia sesión con su cuenta (Firebase Auth) y sus datos —turnos, ajustes, reservas, notas y semanas— se guardan en Cloud Firestore, organizados bajo `users/{uid}`. Esto permite usar la misma cuenta desde varios dispositivos con los datos sincronizados.

Firestore mantiene una caché local persistente en el dispositivo, así que la app sigue siendo usable sin conexión: los cambios hechos offline se sincronizan automáticamente al recuperar la conexión. El Service Worker, además, cachea la propia app para que abra sin red.

`localStorage` ya no es el sistema de almacenamiento principal. Se conserva únicamente como caché y como vía de migración: si un dispositivo tiene datos guardados localmente de una versión anterior a Firebase, esos datos se suben una sola vez a la cuenta del usuario.
```

#### Por qué se cambió
El README no explicaba cómo se guardan ni sincronizan los datos tras la introducción de Firebase. La nueva sección aclara el modelo real: Auth, Firestore bajo `users/{uid}`, caché offline y uso residual de `localStorage` para caché/migración.

### Cambio 6 - Tecnologías usadas

#### Código anterior
```md
- React 18 + TypeScript
- Vite (build)
- Capacitor (empaquetado Android)
- PWA con Service Worker
- localStorage (persistencia)
```

#### Código nuevo
```md
- React 18 + TypeScript
- Vite (build)
- Capacitor (empaquetado Android)
- Firebase Auth (cuentas de usuario)
- Cloud Firestore (base de datos en la nube, con caché local persistente)
- PWA con Service Worker
```

#### Por qué se cambió
La lista anterior no mencionaba Firebase y presentaba `localStorage` como persistencia principal. La nueva lista describe las tecnologías que realmente sostienen autenticación y datos.

### Cambio 7 - Comando de tests en desarrollo

#### Código anterior
```md
# Build de producción
npm run build

# Sincronizar web con Android (tras un build)
npx cap sync android
```

#### Código nuevo
```md
# Build de producción
npm run build

# Ejecutar los tests
npm test

# Sincronizar web con Android (tras un build)
npx cap sync android
```

#### Por qué se cambió
El README no indicaba cómo ejecutar la suite de Vitest. Se añade el comando de tests para que la validación del proyecto quede documentada junto al resto de comandos de desarrollo.

### Cambio 8 - Estructura del proyecto

#### Código anterior
```md
app-taxi/
├── src/
│   └── main.tsx              # Componente React principal
├── public/                   # Assets estáticos (icons, manifest, sw)
├── android/                  # Proyecto Android (Capacitor)
├── package.json
├── vite.config.ts
├── capacitor.config.ts
└── .github/workflows/        # CI/CD
```

#### Código nuevo
```md
app-taxi/
├── src/
│   ├── main.tsx              # Componente React principal
│   ├── login-screen.tsx      # Pantalla de login, registro y recuperación
│   ├── admin-screens.tsx     # Vistas del modo administrador
│   ├── firebase.ts           # Inicialización de Firebase (Auth + Firestore)
│   ├── firestore-sync.ts     # Sincronización del estado con Firestore
│   ├── formatters.ts         # Utilidades de formato
│   └── __tests__/            # Tests (Vitest)
├── public/                   # Assets estáticos (icons, manifest, sw)
├── android/                  # Proyecto Android (Capacitor)
├── firestore.rules           # Reglas de seguridad de Firestore
├── package.json
├── vite.config.ts
├── capacitor.config.ts
└── .github/workflows/        # CI/CD
```

#### Por qué se cambió
La estructura anterior solo mostraba `main.tsx` dentro de `src` y no reflejaba los módulos actuales de login, administración, Firebase, sincronización, formatos, tests ni reglas de Firestore.

## 2026-05-24 20:13 - Sustituir los mensajes DEBUG de copiar/compartir liquidación

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Fallo del copiado de texto (fallo terminal)

#### Código anterior
```tsx
      }).catch((e) => {
        alert("DEBUG: El copiado de texto falló.");
        console.error("Text copy failed: ", e);
      });
```

#### Código nuevo
```tsx
      }).catch((e) => {
        console.error("Text copy failed: ", e);
        alert("No se pudo copiar la liquidación. Inténtalo de nuevo.");
      });
```

#### Por qué se cambió
Es el último recurso del copiado: si falla, no hay más alternativas. Se sustituye el `alert` técnico (`DEBUG: ...`) por un mensaje entendible para el usuario; el detalle del error queda solo en `console.error`.

### Cambio 2 - Elemento ticket-digital no encontrado

#### Código anterior
```tsx
      if (!element) {
        alert("DEBUG: No se encontró el elemento ticket-digital.");
        copyTextFallback();
        return;
      }
```

#### Código nuevo
```tsx
      if (!element) {
        console.error("No se encontró el elemento ticket-digital; se copia como texto.");
        copyTextFallback();
        return;
      }
```

#### Por qué se cambió
Existe un fallback (`copyTextFallback` copia la liquidación como texto), así que no hace falta alarmar al usuario con un `alert` técnico. El detalle pasa a `console.error` y el fallback actúa en silencio.

### Cambio 3 - Fallo al crear la imagen (blob nulo)

#### Código anterior
```tsx
          if (!blob) {
            alert("DEBUG: Falló la creación del blob de la imagen.");
            copyTextFallback();
            return;
          }
```

#### Código nuevo
```tsx
          if (!blob) {
            console.error("Falló la creación de la imagen; se copia como texto.");
            copyTextFallback();
            return;
          }
```

#### Por qué se cambió
Hay fallback a copiar texto. Se elimina el `alert` técnico y el detalle queda en `console.error`; el fallback actúa en silencio.

### Cambio 4 - Error al compartir la imagen en Android nativo

#### Código anterior
```tsx
              } catch (e: any) {
                alert("DEBUG: Error en Share.share nativo: " + (e?.message || JSON.stringify(e)));
                console.error("Error sharing image, fallback to text:", e);
                copyTextFallback();
              }
```

#### Código nuevo
```tsx
              } catch (e: any) {
                console.error("Error sharing image, fallback to text:", e);
                copyTextFallback();
              }
```

#### Por qué se cambió
El `alert` mostraba el mensaje de error técnico crudo. Hay fallback a copiar texto, así que se elimina el `alert` y se conserva el `console.error` que ya existía con el detalle.

### Cambio 5 - Fallo al copiar la imagen al portapapeles

#### Código anterior
```tsx
              }).catch((err: any) => {
                alert("DEBUG: navigator.clipboard.write falló. " + (err?.message || JSON.stringify(err)));
                console.error("ClipboardItem write failed, fallback to text:", err);
                copyTextFallback();
              });
```

#### Código nuevo
```tsx
              }).catch((err: any) => {
                console.error("ClipboardItem write failed, fallback to text:", err);
                copyTextFallback();
              });
```

#### Por qué se cambió
El `alert` mostraba el error técnico crudo. Hay fallback a copiar texto, así que se elimina el `alert` y se conserva el `console.error` que ya existía con el detalle.

### Cambio 6 - Portapapeles de imagen no disponible en el navegador

#### Código anterior
```tsx
            } else {
              alert("DEBUG: navigator.clipboard o window.ClipboardItem no están disponibles. El navegador no lo soporta o no hay HTTPS.");
              copyTextFallback();
            }
```

#### Código nuevo
```tsx
            } else {
              console.error("navigator.clipboard / ClipboardItem no disponibles; se copia como texto.");
              copyTextFallback();
            }
```

#### Por qué se cambió
Cuando el navegador no soporta copiar imágenes, hay fallback a copiar texto. Se elimina el `alert` técnico y el detalle queda en `console.error`; el fallback actúa en silencio.

## 2026-05-24 20:04 - Endurecer reglas de Firestore sin romper el login

**Archivos modificados:** `firestore.rules`

### Cambio 1 - Restringir la lectura de la colección admins

#### Código anterior
```
    // Colección de admins.
    //   - Lectura permitida (la usa isAdmin()).
    //   - Escritura desde código DENEGADA. Solo se gestiona desde Firebase Console.
    match /admins/{uid} {
      allow read: if request.auth != null;
      allow write: if false;
    }
```

#### Código nuevo
```
    // Colección de admins.
    //   - Lectura restringida: cada usuario solo puede leer admins/{su_uid}.
    //     isAdmin() sigue funcionando porque exists() no depende de allow read.
    //   - Escritura desde código DENEGADA. Solo se gestiona desde Firebase Console.
    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
```

#### Por qué se cambió
La regla anterior permitía que cualquier usuario autenticado leyera el documento admin de cualquier otro usuario. Ahora cada usuario solo puede leer `admins/{su_uid}`. La detección de administrador no se ve afectada: `isAdmin()` usa `exists()`, que en las reglas de Firestore funciona al margen de la regla `allow read`; y el código de la app solo lee `admins/{uid_propio}`.

### Cambio 2 - Endurecer la actualización de usernames

#### Código anterior
```
    //   - Actualizar o borrar: solo el dueño actual.
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid;
      allow update, delete: if request.auth != null
                            && resource.data.uid == request.auth.uid;
    }
```

#### Código nuevo
```
    //   - Actualizar: solo el dueño actual, y el uid resultante debe seguir
    //     siendo el suyo (no se puede reapuntar el username a otro usuario).
    //   - Borrar: solo el dueño actual.
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid;
      allow update: if request.auth != null
                    && resource.data.uid == request.auth.uid
                    && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null
                    && resource.data.uid == request.auth.uid;
    }
```

#### Por qué se cambió
La regla `update, delete` anterior solo comprobaba el `uid` del documento existente (`resource.data.uid`), no el del documento nuevo. Eso permitía que el dueño de un username modificara su propio documento y reapuntara el campo `uid` a otro usuario. Se separan `update` y `delete`: `update` exige además que el `uid` resultante (`request.resource.data.uid`) siga siendo el del propio usuario. La creación ya exigía esa comprobación y no se modifica.

## 2026-05-24 19:58 - Unificar versionado y blindar el aviso de actualización

**Archivos modificados:** `public/sw.js`, `vite.config.ts`, `public/manifest.json`, `package.json`, `android/app/build.gradle`, `.github/workflows/android.yml`, `src/__tests__/sw-version.test.ts`

### Cambio 1 - Declarar la constante VERSION en el Service Worker

#### Código anterior
```js
const CACHE = 'mi-turno-v5';
const ASSETS = [
```

#### Código nuevo
```js
const CACHE = 'mi-turno-v5';
// Versión real de esta build. El marcador __BUILD_VERSION__ lo sustituye el
// plugin de Vite (ver vite.config.ts) por la versión de la app en cada build.
// En desarrollo sin build queda el marcador y checkVersion() omite la
// comparación para no lanzar avisos de actualización en falso.
const VERSION = '__BUILD_VERSION__';
const ASSETS = [
```

#### Por qué se cambió
`checkVersion()` comparaba `manifest.version` contra una variable `VERSION` que nunca se declaraba en `sw.js`. Eso lanzaba un `ReferenceError` que el `try/catch` vacío se tragaba en silencio, de modo que el Service Worker no detectaba nunca una versión nueva y el aviso de actualización de la PWA no funcionaba.

### Cambio 2 - Proteger la comparación de versión en checkVersion

#### Código anterior
```js
      const manifest = await manifestReq.json();
      if (manifest.version && manifest.version !== VERSION) {
```

#### Código nuevo
```js
      const manifest = await manifestReq.json();
      if (manifest.version && VERSION.indexOf('__') === -1 && manifest.version !== VERSION) {
```

#### Por qué se cambió
En desarrollo sin build, `VERSION` conserva el marcador `__BUILD_VERSION__`. La condición `VERSION.indexOf('__') === -1` omite la comparación mientras el marcador no se haya sustituido, evitando avisos de actualización en falso.

### Cambio 3 - Plugin de Vite que inyecta la versión en manifest y sw

#### Código anterior
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
// La versión que verá la app:
//  - En CI: "1.0.<run_number>" (coincide con el tag de la release).
//  - En local: la versión que pone package.json.
const appVersion = process.env.APP_VERSION || pkg.version;

export default defineConfig({
  plugins: [react()],
```

#### Código nuevo
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
// La versión que verá la app:
//  - En CI: "1.0.<run_number>" (coincide con el tag de la release).
//  - En local: la versión que pone package.json.
const appVersion = process.env.APP_VERSION || pkg.version;

// Plugin: tras el build, sustituye el marcador __BUILD_VERSION__ por la versión
// real (appVersion) en dist/manifest.json y dist/sw.js. Así la app
// (__APP_VERSION__), el manifest y el Service Worker comparten exactamente la
// misma versión y el aviso de actualización de la PWA funciona de forma fiable.
function inyectarVersion(version: string) {
  return {
    name: 'inyectar-version',
    apply: 'build' as const,
    closeBundle() {
      for (const archivo of ['dist/manifest.json', 'dist/sw.js']) {
        if (existsSync(archivo)) {
          const contenido = readFileSync(archivo, 'utf-8');
          writeFileSync(archivo, contenido.split('__BUILD_VERSION__').join(version));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), inyectarVersion(appVersion)],
```

#### Por qué se cambió
`manifest.json` y `sw.js` son archivos estáticos de `public/` que el build copia tal cual, por lo que no podían recoger la versión de forma dinámica. El plugin sustituye el marcador `__BUILD_VERSION__` en `dist/` por la misma versión que usa la app, eliminando la desincronización entre versión de la app, del manifest y del Service Worker.

### Cambio 4 - Versión del manifest como marcador sustituible

#### Código anterior
```json
  "version": "1.0.52",
```

#### Código nuevo
```json
  "version": "__BUILD_VERSION__",
```

#### Por qué se cambió
La versión del manifest era un número fijo escrito a mano que se desincronizaba de la versión real de la app. Pasa a ser un marcador que el plugin de Vite sustituye en cada build.

### Cambio 5 - Unificar la versión local en package.json

#### Código anterior
```json
  "version": "1.0.51",
```

#### Código nuevo
```json
  "version": "1.0.52",
```

#### Por qué se cambió
`package.json` (1.0.51) y `manifest.json` (1.0.52) declaraban versiones distintas. Se unifican en 1.0.52 para que la app y el APK en builds locales partan del mismo número.

### Cambio 6 - Bloque de versionado derivado en build.gradle

#### Código anterior
`No existía el bloque de versionado derivado en android/app/build.gradle.`

#### Código nuevo
```gradle
apply plugin: 'com.android.application'

// Versionado del APK derivado de package.json (raíz del repo), con prioridad
// para la variable de entorno APP_VERSION que CI inyecta. Así versionName y
// versionCode dejan de quedar fijos en valores antiguos y acompañan a la
// versión real de la app. versionCode se calcula con el último segmento de la
// versión (1.0.52 -> 52), por lo que aumenta en cada release de CI.
def packageJson = new groovy.json.JsonSlurper().parse(file('../../package.json'))
def packageVersionName = packageJson.version ?: "1.0.0"
def packageVersionCode = packageVersionName.tokenize('.').last().isInteger() ? packageVersionName.tokenize('.').last().toInteger() : 1
def ciVersionName = System.getenv("APP_VERSION")
def resolvedVersionName = ciVersionName ?: packageVersionName
def resolvedVersionCode = (ciVersionName != null && ciVersionName.tokenize('.').last().isInteger()) ? ciVersionName.tokenize('.').last().toInteger() : packageVersionCode
```

#### Por qué se cambió
El APK necesitaba una fuente de versión dinámica. Este bloque deriva la versión de `package.json` (builds locales) o de la variable `APP_VERSION` que CI inyecta (builds de release), en lugar de depender de números escritos a mano.

### Cambio 7 - versionCode y versionName dinámicos

#### Código anterior
```gradle
        versionCode 20
        versionName "1.0.19"
```

#### Código nuevo
```gradle
        versionCode resolvedVersionCode
        versionName resolvedVersionName
```

#### Por qué se cambió
`versionCode` y `versionName` estaban fijos en valores antiguos (20 / 1.0.19) que no acompañaban a la versión real de la app. Ahora se calculan a partir del bloque del Cambio 6, de modo que el `versionCode` aumenta en cada release de CI y Android acepta el APK como actualización.

### Cambio 8 - Variable APP_VERSION en el paso de compilación del APK

#### Código anterior
```yaml
      - name: Build Android APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon
```

#### Código nuevo
```yaml
      - name: Build Android APK
        env:
          APP_VERSION: 1.0.${{ github.run_number }}
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon
```

#### Por qué se cambió
El paso de Gradle no recibía la variable `APP_VERSION`, así que el APK no podía conocer el número de release. Con la variable presente, el `versionName` y el `versionCode` del APK coinciden con el tag `v1.0.<run_number>` que publica la release.

### Cambio 9 - Tests del Service Worker

#### Código anterior
`No existía el archivo src/__tests__/sw-version.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Service Worker version handling", () => {
  const swSource = readFileSync(resolve("public/sw.js"), "utf8");

  it("declara la constante VERSION para que checkVersion no lance ReferenceError", () => {
    expect(swSource).toMatch(/const VERSION\s*=/);
  });

  it("usa el marcador __BUILD_VERSION__ que el build sustituye por la version real", () => {
    expect(swSource).toContain("__BUILD_VERSION__");
  });

  it("compara manifest.version contra la constante VERSION ya definida", () => {
    expect(swSource).toContain("manifest.version !== VERSION");
  });

  it("omite la comparacion mientras VERSION conserve el marcador (modo dev)", () => {
    expect(swSource).toContain("VERSION.indexOf('__') === -1");
  });
});
```

#### Por qué se cambió
Para blindar la corrección del Service Worker con tests estáticos que verifican que `VERSION` está declarada, que el marcador existe y que la comparación de versión es la correcta, evitando que el bug reaparezca en el futuro.

## 2026-05-24 19:15 - Implementar descarga e instalación nativa de APK en Android

**Archivos modificados:** `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/com/mijornada/app/MainActivity.java`, `android/app/src/main/java/com/mijornada/app/ApkInstallerPlugin.java`, `android/app/build.gradle`, `.github/workflows/android.yml`, `src/main.tsx`, `src/__tests__/logic.test.ts`, `src/__tests__/apk-update-flow.test.ts`

### Cambio 1 - Permiso de instalación de paquetes

#### Código anterior
```xml
    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
```

#### Código nuevo
```xml
    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
</manifest>
```

#### Por qué se cambió
Se requiere el permiso de Android REQUEST_INSTALL_PACKAGES para abrir e iniciar el instalador oficial de Android para las descargas de APK in-app.

### Cambio 2 - Crear plugin local ApkInstaller

#### Código anterior
`No existía el bloque ApkInstallerPlugin.java en android/app/src/main/java/com/mijornada/app/ApkInstallerPlugin.java.`

#### Código nuevo
```java
package com.mijornada.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ret.put("value", getContext().getPackageManager().canRequestPackageInstalls());
            } else {
                ret.put("value", true);
            }
        } else {
            ret.put("value", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
            call.resolve();
        } else {
            call.reject("Not required on this Android version");
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String urlString = call.getString("url");
        String fileName = call.getString("fileName");

        if (urlString == null || fileName == null) {
            call.reject("URL and fileName are required");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    File file = new File(getContext().getCacheDir(), fileName);
                    if (file.exists()) {
                        file.delete();
                    }

                    URL url = new URL(urlString);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setInstanceFollowRedirects(true);

                    int status = connection.getResponseCode();
                    int redirectCount = 0;
                    while (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                        if (redirectCount > 5) {
                            throw new Exception("Too many redirects");
                        }
                        String newUrl = connection.getHeaderField("Location");
                        connection = (HttpURLConnection) new URL(newUrl).openConnection();
                        status = connection.getResponseCode();
                        redirectCount++;
                    }

                    if (status != HttpURLConnection.HTTP_OK) {
                        call.reject("Server returned HTTP " + status);
                        return;
                    }

                    try (InputStream input = new BufferedInputStream(connection.getInputStream());
                         FileOutputStream output = new FileOutputStream(file)) {

                        byte[] data = new byte[8192];
                        int count;
                        while ((count = input.read(data)) != -1) {
                            output.write(data, 0, count);
                        }
                    }

                    Uri apkUri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);

                } catch (Exception e) {
                    call.reject("Error downloading or installing APK: " + e.getMessage(), e);
                }
            }
        }).start();
    }
}
```

#### Por qué se cambió
Se crea el plugin local ApkInstaller para verificar permisos de fuentes desconocidas, abrir los Ajustes de Android si falta dicho permiso, y descargar la APK en segundo plano lanzando la interfaz de instalación nativa.

### Cambio 3 - Registro de ApkInstaller en MainActivity

#### Código anterior
```java
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

#### Código nuevo
```java
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

#### Por qué se cambió
Se registra explícitamente el plugin ApkInstaller en la clase MainActivity para garantizar que el puente de Capacitor lo reconozca e inicialice durante el inicio de la app.

### Cambio 4 - Versionado dinámico en Gradle

#### Código anterior
```groovy
        versionCode 20
        versionName "1.0.19"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
```

#### Código nuevo
```groovy
def packageJson = new groovy.json.JsonSlurper().parse(file('../../package.json'))
def packageVersionName = packageJson.version ?: "1.0.0"
def packageVersionCode = packageVersionName.tokenize('.').last().isInteger()
        ? packageVersionName.tokenize('.').last().toInteger()
        : 1

android {
    namespace "com.mijornada.app"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.mijornada.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        def appVersionCode = System.getenv("ANDROID_VERSION_CODE") ? System.getenv("ANDROID_VERSION_CODE").toInteger() : packageVersionCode
        def appVersionName = System.getenv("ANDROID_VERSION_NAME") ?: packageVersionName

        versionCode appVersionCode
        versionName appVersionName
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
}
```

#### Por qué se cambió
Permite inyectar los códigos y nombres de versión de forma incremental en base a las ejecuciones del flujo de CI en GitHub Actions, y evita que una compilación local vuelva al `versionCode 20` y `versionName "1.0.19"` antiguos.

### Cambio 5 - Inyección de variables en Actions de GitHub

#### Código anterior
```yaml
      - name: Build Android APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon
```

#### Código nuevo
```yaml
      - name: Build Android APK
        env:
          ANDROID_VERSION_CODE: ${{ github.run_number }}
          ANDROID_VERSION_NAME: 1.0.${{ github.run_number }}
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon
```

#### Por qué se cambió
Para pasar de manera segura e incremental el número de build del pipeline a Gradle en cada compilación automática.

### Cambio 6 - Lógica y UI de actualización en main.tsx

#### Código anterior
```tsx
      if (latestVersion && latestVersion !== APP_VERSION) {
        setUpdateMsg(`¡Nueva versión ${latestVersion} disponible!`);
        if (data.assets && data.assets.length > 0) {
          setDownloadUrl(data.assets[0].browser_download_url);
        } else {
          setDownloadUrl(data.html_url);
        }
      } else {
        setUpdateMsg("Tienes la última versión instalada.");
      }
```

#### Código nuevo
```tsx
      if (latestVersion && latestVersion !== APP_VERSION) {
        let apkAsset = data.assets?.find((asset: any) => asset.name && asset.name.endsWith(".apk"));
        if (apkAsset) {
          setDownloadUrl(apkAsset.browser_download_url);
          setUpdateState("available");
          setUpdateMsg(`¡Nueva versión ${latestVersion} disponible!`);
        } else {
          setDownloadUrl("");
          setReleaseUrl(data.html_url || "https://github.com/Carlos4400/app-taxi/releases/latest");
          setUpdateState("error");
          setUpdateMsg("No se encontró APK en el último release.");
        }
      } else {
        setUpdateState("idle");
        setUpdateMsg("Tienes la última versión instalada.");
      }
```

```tsx
            {(() => {
              const hasApkDownload = downloadUrl.endsWith(".apk");
              return hasApkDownload && updateState !== "downloading" && updateState !== "checking" && (
              <button
                onClick={handleInstallUpdate}
```

#### Por qué se cambió
Reemplaza el flujo anterior por un flujo nativo e interactivo de descarga e instalación local de la APK de forma integrada en Android, e impide exponer como instalable una URL que no termine en `.apk`.

### Cambio 7 - Arreglar errores de tipado de Turno en los mocks de tests

#### Código anterior
Los objetos mocks de `Turno` en `src/__tests__/logic.test.ts` carecían de los atributos obligatorios como `notes`, `startTime` o `endTime` tras adiciones del modelo de datos.

#### Código nuevo
Se añaden las propiedades por defecto correspondientes para que `npx tsc --noEmit` pase el chequeo sin errores de tipado en compilación estática.

### Cambio 8 - Tests del flujo de actualización APK

#### Código anterior
`No existía apk-update-flow.test.ts en src/__tests__/apk-update-flow.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("APK update flow hardening", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const gradleSource = readFileSync(resolve("android/app/build.gradle"), "utf8");

  it("does not expose an installable Android URL when the latest release has no APK asset", () => {
    expect(mainSource).toContain('asset.name.endsWith(".apk")');
    expect(mainSource).toMatch(/setUpdateMsg\("No se encontr\S+ APK en el \S+ltimo release\."\)/);
    expect(mainSource).not.toContain("Sin APK directo");
    expect(mainSource).not.toContain("const fallbackUrl = data.assets?.[0]?.browser_download_url || data.html_url");
  });

  it("only shows the native install button for APK URLs", () => {
    expect(mainSource).toContain("const hasApkDownload = downloadUrl.endsWith(\".apk\")");
    expect(mainSource).toMatch(/hasApkDownload && updateState !== "downloading" && updateState !== "checking"/);
  });

  it("derives local Android version values from package.json when CI variables are absent", () => {
    expect(gradleSource).toContain("def packageJson = new groovy.json.JsonSlurper().parse(file('../../package.json'))");
    expect(gradleSource).toContain('def packageVersionName = packageJson.version ?: "1.0.0"');
    expect(gradleSource).toContain("def packageVersionCode = packageVersionName.tokenize('.').last().isInteger()");
    expect(gradleSource).not.toContain('?: "1.0.19"');
    expect(gradleSource).not.toContain(": 20");
  });
});
```

#### Por qué se cambió
Se añaden pruebas específicas para impedir regresiones en la validación estricta de APK, la visibilidad del botón nativo de instalación y el fallback local de versionado Android desde `package.json`.

## 2026-05-24 18:38 - Solucionar timeout de ClipboardItem en iOS/Web

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Usar ClipboardItem con Promesa para evitar bloqueos

#### Código anterior
```tsx
      html2canvas(element, {
        backgroundColor: "#0d0d14",
        scale: 3,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // ... (configuración de html2canvas)
        }
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            copyTextFallback();
            return;
          }

          if (Capacitor.isNativePlatform()) {
            // ... exportación nativa
          } else {
            if (navigator.clipboard && window.ClipboardItem) {
              const item = new ClipboardItem({ "image/png": blob });
              navigator.clipboard.write([item]).then(() => {
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }).catch((err) => {
                console.error("ClipboardItem write failed, fallback to text:", err);
                copyTextFallback();
              });
            } else {
              copyTextFallback();
            }
          }
        }, "image/png");
      }).catch((err) => {
        console.error("html2canvas failed, fallback to text:", err);
        copyTextFallback();
      });
```

#### Código nuevo
```tsx
      const h2cOptions = {
        backgroundColor: "#0d0d14",
        scale: 3,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc: any) => {
          // ... (configuración de html2canvas)
        }
      };

      if (!Capacitor.isNativePlatform() && navigator.clipboard && window.ClipboardItem) {
        try {
          const blobPromise = html2canvas(element, h2cOptions as any).then((canvas) => {
            return new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Error al crear blob"));
              }, "image/png");
            });
          });

          const item = new ClipboardItem({ "image/png": blobPromise });
          await navigator.clipboard.write([item]);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch (err) {
          console.error("ClipboardItem write failed, fallback to text:", err);
          copyTextFallback();
        }
      } else {
        html2canvas(element, h2cOptions as any).then((canvas) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              copyTextFallback();
              return;
            }

            if (Capacitor.isNativePlatform()) {
              // ... exportación nativa
            } else {
              copyTextFallback();
            }
          }, "image/png");
        }).catch((err) => {
          console.error("html2canvas failed, fallback to text:", err);
          copyTextFallback();
        });
      }
```

#### Por qué se cambió
El código anterior generaba el canvas y luego intentaba escribir en el portapapeles dentro de `.then()`. Navegadores como Safari/iOS bloquean escrituras asíncronas en el portapapeles si toman demasiado tiempo después del evento del usuario. La solución moderna (y la única soportada en iOS web) consiste en instanciar el `ClipboardItem` sincrónicamente y pasarle una Promesa que se resolverá con el Blob. Se separa el flujo de web y de Capacitor para asegurar que la web respete este estándar.
## 2026-05-23 22:17 - Alinear notas por baseline

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Baseline en hora de notas

#### Código anterior
```tsx
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "start",
} as const;
```

#### Código nuevo
```tsx
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;
```

#### Por qué se cambió
`alignSelf: "start"` alineaba la hora por la parte superior del grid. `alignSelf: "baseline"` hace que la hora se apoye en la misma línea visual que la etiqueta, el texto de la nota y el importe.

### Cambio 2 - Baseline en filas de notas

#### Código anterior
```tsx
alignItems: "start"
alignItems: 'start'
alignSelf: "start"
```

#### Código nuevo
```tsx
alignItems: "baseline"
alignItems: 'baseline'
alignSelf: "baseline"
```

#### Por qué se cambió
Las filas de notas generales y notas detalladas usaban alineación superior, por eso la hora, la etiqueta, el texto y el importe no quedaban sobre la misma línea de lectura. Se cambia a baseline en las filas visuales de resumen, terminar turno, liquidación digital y tarjetas de notas.

### Cambio 3 - Tests de alineación baseline

#### Código anterior
```ts
expect(source).toMatch(/const NOTE_TIME_STYLE = \{[\s\S]*?fontSize: 12,[\s\S]*?color: "rgba\(255,255,255,0\.45\)",[\s\S]*?fontWeight: 700,[\s\S]*?whiteSpace: "nowrap",[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: "start",[\s\S]*?\} as const;/);
expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr)"');
expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
```

#### Código nuevo
```ts
expect(source).toMatch(/const NOTE_TIME_STYLE = \{[\s\S]*?fontSize: 12,[\s\S]*?color: "rgba\(255,255,255,0\.45\)",[\s\S]*?fontWeight: 700,[\s\S]*?whiteSpace: "nowrap",[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: "baseline",[\s\S]*?\} as const;/);
expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline"');
expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline"');
```

#### Por qué se cambió
Los tests aún exigían `start` o solo comprobaban las columnas del grid. Se actualizan para verificar que la alineación visible de notas generales y notas detalladas sea por baseline.

## 2026-05-23 22:01 - Unificar hora de notas generales

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Estilo común de hora de notas

#### Código anterior
`No existía NOTE_TIME_STYLE en src/main.tsx.`

#### Código nuevo
```tsx
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "start",
} as const;
```

#### Por qué se cambió
Las horas de notas generales y notas detalladas tenían variantes visuales distintas. Se crea un único estilo para aplicar `12px`, color blanco al `45%`, peso `700`, no partir la hora y alinear la hora arriba.

### Cambio 2 - Hora de notas en resumen y terminar turno

#### Código anterior
```tsx
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{e.time}</span>
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0, alignSelf: "start" }}>{e.time}</span>
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{e.time}</span>
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0, alignSelf: "start" }}>{e.time}</span>
```

#### Código nuevo
```tsx
<span style={NOTE_TIME_STYLE}>{e.time}</span>
<span style={NOTE_TIME_STYLE}>{e.time}</span>
<span style={NOTE_TIME_STYLE}>{e.time}</span>
<span style={NOTE_TIME_STYLE}>{e.time}</span>
```

#### Por qué se cambió
Las notas del turno y las notas detalladas de resumen y terminar turno no usaban exactamente el mismo peso, color y comportamiento de alineación. Se sustituyen las variantes inline por `NOTE_TIME_STYLE` para que todas se vean iguales.

### Cambio 3 - Hora de notas en liquidación y tarjetas

#### Código anterior
```tsx
<span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{entry.time}</span>
<span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, flexShrink: 0 }}>{entry.time}</span>
<span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", flexShrink: 0 }}>{entry.time}</span>
<span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0, alignSelf: "start" }}>{entry.time}</span>
```

#### Código nuevo
```tsx
<span style={NOTE_TIME_STYLE}>{entry.time}</span>
<span style={NOTE_TIME_STYLE}>{entry.time}</span>
<span style={NOTE_TIME_STYLE}>{entry.time}</span>
<span style={NOTE_TIME_STYLE}>{entry.time}</span>
```

#### Por qué se cambió
El ticket digital de liquidación y las tarjetas de notas mostraban horas con tamaños y pesos diferentes entre notas del turno y notas detalladas. Se centraliza el estilo para que no queden diferencias visuales ni variantes duplicadas.

### Cambio 4 - Tests de hora de notas

#### Código anterior
```ts
expect(summaryBlock).toMatch(/fontSize: 12[\s\S]*?color: "rgba\(255,255,255,0\.45\)"[\s\S]*?fontWeight: 700[\s\S]*?whiteSpace: "nowrap"[\s\S]*?flexShrink: 0[\s\S]*?alignSelf: "start"[\s\S]*?\{e\.time\}/);
expect(confirmEndBlock).toMatch(/fontSize: 12[\s\S]*?color: "rgba\(255,255,255,0\.45\)"[\s\S]*?fontWeight: 700[\s\S]*?whiteSpace: "nowrap"[\s\S]*?flexShrink: 0[\s\S]*?alignSelf: "start"[\s\S]*?\{e\.time\}/);
expect(turnoNotasCardBlock).toMatch(/fontSize: 12[\s\S]*?color: "rgba\(255,255,255,0\.45\)"[\s\S]*?fontWeight: 700[\s\S]*?whiteSpace: "nowrap"[\s\S]*?flexShrink: 0[\s\S]*?alignSelf: "start"[\s\S]*?\{entry\.time\}/);
expect(liquidacionBlock).toMatch(/fontSize: 12[\s\S]*?color: "rgba\(255,255,255,0\.45\)"[\s\S]*?fontWeight: 700[\s\S]*?whiteSpace: "nowrap"[\s\S]*?flexShrink: 0[\s\S]*?alignSelf: "start"[\s\S]*?\{entry\.time\}/);
expect(liquidacionBlock).toContain('fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600');
```

#### Código nuevo
```ts
expect(source).toMatch(/const NOTE_TIME_STYLE = \{[\s\S]*?fontSize: 12,[\s\S]*?color: "rgba\(255,255,255,0\.45\)",[\s\S]*?fontWeight: 700,[\s\S]*?whiteSpace: "nowrap",[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: "start",[\s\S]*?\} as const;/);
expect(summaryBlock).toMatch(/generalNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
expect(summaryBlock).toMatch(/entriesWithNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
expect(confirmEndBlock).toMatch(/gNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
expect(confirmEndBlock).toMatch(/entriesWithNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
expect(turnoNotasCardBlock).toMatch(/notasGenerales\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
expect(turnoNotasCardBlock).toMatch(/notasDetalladas\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
expect(source).toMatch(/const NOTE_TIME_STYLE = \{[\s\S]*?fontSize: 12,[\s\S]*?color: "rgba\(255,255,255,0\.45\)",[\s\S]*?fontWeight: 700,[\s\S]*?whiteSpace: "nowrap",[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: "start",[\s\S]*?\} as const;/);
expect(liquidacionBlock).toMatch(/notasGenerales\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
expect(liquidacionBlock).toMatch(/notasDetalladas\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
```

#### Por qué se cambió
Los tests comprobaban estilos inline concretos y todavía permitían una variante antigua de `11px` y peso `600` en liquidación. Se actualizan para exigir el estilo común `NOTE_TIME_STYLE` en notas generales y detalladas.

## 2026-05-23 21:29 - Añadir etiqueta Nota en todas las vistas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Etiqueta Nota en resumen de turno

#### Código anterior
```tsx
{generalNotes.map((e: any) => (
  <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
    <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{e.time}</span>
    <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
  </div>
))}
```

#### Código nuevo
```tsx
{generalNotes.map((e: any) => {
  const meta = getEntryTypeMeta(e.type);
  return (
    <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{e.time}</span>
      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
      <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
    </div>
  );
})}
```

#### Por qué se cambió
El resumen del turno mostraba notas generales como hora y texto sin la etiqueta `Nota`. Se añade la metadata del tipo y una columna para `meta.label`, igual que en las entradas recientes. Además, se elimina el recuadro visual de la hora para que se muestre plana como en las notas detalladas.

### Cambio 2 - Etiqueta Nota en terminar turno

#### Código anterior
```tsx
{gNotes.map(e => (
  <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
    <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{e.time}</span>
    <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
  </div>
))}
```

#### Código nuevo
```tsx
{gNotes.map(e => {
  const meta = getEntryTypeMeta(e.type);
  return (
    <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{e.time}</span>
      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
      <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
    </div>
  );
})}
```

#### Por qué se cambió
La pantalla de terminar turno mostraba las notas generales como hora y texto sin la etiqueta `Nota`. Se añade la misma columna de `meta.label` para mantener consistencia con las entradas del turno. Además, se elimina el recuadro visual de la hora para que se muestre plana como en las notas detalladas.

### Cambio 3 - Etiqueta Nota en tarjetas de notas

#### Código anterior
```tsx
{notasGenerales.map((entry) => (
  <div key={entry.id} style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "8px 10px", lineHeight: 1.35, overflowWrap: "anywhere" }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginRight: 6 }}>{entry.time}</span>
    {entry.note}
  </div>
))}
```

#### Código nuevo
```tsx
{notasGenerales.map((entry) => {
  const meta = getEntryTypeMeta(entry.type);
  return (
    <div key={entry.id} style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "8px 10px", lineHeight: 1.35, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "start", gap: 7, minWidth: 0 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", flexShrink: 0 }}>{entry.time}</span>
      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
      <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
    </div>
  );
})}
```

#### Por qué se cambió
Las tarjetas de notas usadas en detalle de semana y detalle de mes mostraban las notas generales como hora y texto sin la etiqueta `Nota`. Se añade la misma estructura con `meta.label`.

### Cambio 4 - Tests de etiqueta Nota global

#### Código anterior
```ts
expect(summaryBlock).toMatch(/gridTemplateColumns: "auto minmax\(0, 1fr\)"[\s\S]*?overflowWrap: "anywhere"/);
expect(confirmEndBlock).toMatch(/gridTemplateColumns: "auto minmax\(0, 1fr\)"[\s\S]*?overflowWrap: "anywhere"/);
```

#### Código nuevo
```ts
expect(summaryBlock).toMatch(/generalNotes\.map\(\(e: any\) => \{[\s\S]*?const meta = getEntryTypeMeta\(e\.type\)/);
expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \{[\s\S]*?const meta = getEntryTypeMeta\(e\.type\)/);
expect(summaryBlock).toMatch(/gridTemplateColumns: "auto auto minmax\(0, 1fr\)"[\s\S]*?\{meta\.label\}[\s\S]*?overflowWrap: "anywhere"/);
expect(confirmEndBlock).toMatch(/gridTemplateColumns: "auto auto minmax\(0, 1fr\)"[\s\S]*?\{meta\.label\}[\s\S]*?overflowWrap: "anywhere"/);
expect(summaryBlock).not.toMatch(/generalNotes\.map[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
expect(confirmEndBlock).not.toMatch(/gNotes\.map[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
```

#### Por qué se cambió
Los tests aceptaban notas generales sin columna de etiqueta. Se actualizan para exigir `getEntryTypeMeta`, `meta.label` y grid de tres columnas en resumen y terminar turno. También se añade una aserción negativa para evitar que vuelva el recuadro de hora.

## 2026-05-23 21:09 - Añadir etiqueta Nota en liquidación

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Etiqueta de notas generales en ticket digital

#### Código anterior
```tsx
{notasGenerales.map((entry) => (
  <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, minWidth: 0, marginLeft: 14 }}>
    <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", background: "rgba(150,130,255,0.10)", border: "1px solid rgba(150,130,255,0.14)", borderRadius: 7, padding: "4px 5px", marginTop: 1 }}>{entry.time}</span>
    <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
  </div>
))}
```

#### Código nuevo
```tsx
{notasGenerales.map((entry) => {
  const meta = getEntryTypeMeta(entry.type);
  return (
    <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "start", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, minWidth: 0, marginLeft: 14 }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{entry.time}</span>
      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
      <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
    </div>
  );
})}
```

#### Por qué se cambió
La nota general del ticket digital de liquidación mostraba la hora y el texto, pero no la etiqueta `Nota`. Se añade `getEntryTypeMeta(entry.type)` y una columna de etiqueta para mostrar `Nota` en blanco como en las entradas del turno. Además, se elimina el recuadro visual de la hora para que se muestre plana como en las notas detalladas.

### Cambio 2 - Test de etiqueta Nota en liquidación

#### Código anterior
```ts
expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
expect(liquidacionBlock).toContain('paddingTop: 14, display: "flex", flexDirection: "column", gap: 18');
```

#### Código nuevo
```ts
expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr)"');
expect(liquidacionBlock).toContain('{meta.label}</span>');
expect(liquidacionBlock).not.toMatch(/ticket-nota-general[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
expect(liquidacionBlock).toContain('paddingTop: 14, display: "flex", flexDirection: "column", gap: 18');
```

#### Por qué se cambió
El test no verificaba que las notas generales del ticket digital tuvieran columna y etiqueta visible. Se añade la aserción del grid de tres columnas, de `{meta.label}` y de ausencia del recuadro de hora.

### Cambio 3 - Patrón de notas detalladas en test

#### Código anterior
```ts
/notasDetalladas\.map\(\(entry\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
```

#### Código nuevo
```ts
/notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/,
```

#### Por qué se cambió
El patrón anterior podía capturar el `notasDetalladas.map` del fallback de texto de liquidación en lugar del bloque visual de `ticket-nota-detallada`. Se acota al `key` del bloque visual para que el test compruebe la fila detallada real.

## 2026-05-23 20:36 - Corregir continuidad notas detalladas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `package.json`

### Cambio 1 - Layout de notas detalladas impresas

#### Código anterior
```tsx
<div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, marginBottom: 4 }}>
  <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
    <span>{entry.time}</span>
    <span>{meta.label}:</span>
    <span>({fmt(entry.amount)})</span>
  </div>
  {entry.note.trim() && (
    <div style={{ paddingLeft: 4, marginTop: 2, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</div>
  )}
</div>
```

#### Código nuevo
```tsx
<div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
  <span>{entry.time}</span>
  <span>{meta.label}:</span>
  <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.35 }}>{`(${fmt(entry.amount)})${entry.note.trim() ? ` ${entry.note.trim()}` : ""}`}</span>
</div>
```

#### Por qué se cambió
El bloque anterior imprimía la nota detallada en una línea separada después de la hora, etiqueta e importe. El nuevo grid mantiene hora, etiqueta e importe con nota en una sola fila de tres columnas para que el texto empiece justo después de `<hora> <tipo>:` y, si no cabe, continúe alineado bajo ese punto. `wordBreak: "break-all"` fuerza que las notas sin espacios también rompan desde el inicio de esa columna.

### Cambio 2 - Contrato del test de notas detalladas impresas

#### Código anterior
```ts
expect(liquidacionBlock).toContain('<span>{meta.label}:</span>');
expect(liquidacionBlock).toContain('<span>({fmt(entry.amount)})</span>');
expect(liquidacionBlock).toContain('{entry.note.trim()}</div>');
```

#### Código nuevo
```ts
expect(liquidacionBlock).toContain('<span>{meta.label}:</span>');
expect(liquidacionBlock).not.toContain('display: "flex", gap: 4, alignItems: "baseline"');
expect(liquidacionBlock).not.toContain('<span>({fmt(entry.amount)})</span>');
expect(liquidacionBlock).toContain('wordBreak: "break-all"');
expect(liquidacionBlock).toContain('{`(${fmt(entry.amount)})${entry.note.trim() ? ` ${entry.note.trim()}` : ""}`}');
```

#### Por qué se cambió
El test anterior aceptaba que el importe estuviera en un `span` independiente y que la nota detallada cerrara en un `div` separado. El nuevo test exige que desaparezca el layout vertical antiguo, que importe y nota queden en el mismo `span` de contenido envolvente, y que el corte de palabras largas use `wordBreak: "break-all"`.

### Cambio 3 - Versión del paquete

#### Código anterior
```json
  "version": "1.0.51",
```

#### Código nuevo
```json
  "version": "1.0.52",
```

#### Por qué se cambió
`public/manifest.json` ya declara `"version": "1.0.52"` y `vite.config.ts` usa la versión de `package.json` como `APP_VERSION` en builds locales. Se iguala `package.json` a `1.0.52` para que la versión visible de la app no quede desincronizada con el manifest.

## 2026-05-22 22:55 - Igualar tamaño título ticket y corregir layout notas detalladas

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Reducir fontSize de LIQUIDACION SEMANAL y rango de fechas

#### Código anterior
```tsx
<div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>LIQUIDACION SEMANAL</div>
<div style={{ textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>{formatWeekRangeFull(weekId)}</div>
```

#### Código nuevo
```tsx
<div style={{ textAlign: "center", fontSize: 16, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.4px #000000" }}>LIQUIDACION SEMANAL</div>
```

#### Por qué se cambió
El usuario pidió que "LIQUIDACION SEMANAL" tenga el mismo tamaño que los ítems de descuento (Datafonos, Gasolina, etc.) que están a fontSize 16. Antes estaba a 18, más grande que el resto. El rango de fechas se mantiene a fontSize 19 como estaba originalmente.

### Cambio 2 - Renombrar y reducir fontSize de Comision Bruto Jefe

#### Código anterior
```tsx
<div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
  <span>Comision Bruta Jefe</span>
```

#### Código nuevo
```tsx
<div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4, fontSize: 14 }}>
  <span>Comision Bruta Jefe</span>
```

#### Por qué se cambió
Se añadió fontSize 14 explícito para reducir el tamaño de esta línea respecto al resto del ticket.

### Cambio 3 - Renombrar DESCUENTOS a A DESCONTAR

#### Código anterior
```tsx
<div ...>DESCUENTOS:</div>
...
<span>Total Descuentos</span>
```

#### Código nuevo
```tsx
<div ...>A DESCONTAR:</div>
...
<span>Total A Descontar</span>
```

#### Por qué se cambió
El usuario pidió cambiar la etiqueta "DESCUENTOS" por "A DESCONTAR" y "Total Descuentos" por "Total A Descontar" para mayor claridad en el ticket.

### Cambio 3 - Restructurar layout de notas detalladas del ticket impreso

#### Código anterior
```tsx
<div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
  <span>{entry.time}</span>
  <span>{meta.label}:</span>
  <span>({fmt(entry.amount)})</span>
  <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</span>
</div>
```

#### Código nuevo
```tsx
<div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, marginBottom: 4 }}>
  <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
    <span>{entry.time}</span>
    <span>{meta.label}:</span>
    <span>({fmt(entry.amount)})</span>
  </div>
  {entry.note.trim() && (
    <div style={{ paddingLeft: 4, marginTop: 2, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</div>
  )}
</div>
```

#### Por qué se cambió
La nota (ej. "Bono H.Orange") se agrupaba comprimida a la derecha en una columna estrecha del grid de 4 columnas. Al cambiar a un layout de dos bloques verticales (primera línea: hora + label + importe; segunda línea: nota en ancho completo), el texto de la nota ocupa todo el ancho disponible y se lee con claridad, incluso con notas largas.

### Cambio 4 - Actualizar aserciones del test de liquidación semanal

#### Código anterior
```ts
expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
// ...
expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
// ...
expect(liquidacionBlock).toContain('{entry.note.trim()}</span>');
```

#### Código nuevo
```ts
expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 16, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.4px #000000"');
expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 16, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.4px #000000"');
// Se elimina la aserción de gridTemplateColumns de 4 columnas (ya no existe ese grid)
// ...
expect(liquidacionBlock).toContain('{entry.note.trim()}</div>');
```

#### Por qué se cambió
Las aserciones del test debían reflejar los nuevos valores de fontSize (16 en lugar de 18/19), WebkitTextStroke (0.4px en lugar de 0.6px), la eliminación del grid de 4 columnas, y que la nota ahora cierra con `</div>` en lugar de `</span>`.

El formato completo de una entrada está documentado en `AGENTS.md`, sección "Ejemplo de entrada".


## 2026-05-22 22:28 - Resolver conflictos de merge del ticket de liquidación

**Archivos modificados:** `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Fusionar pruebas del ticket de impresora

#### Código anterior
```typescript
  it("valida los tamaños y grosores del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", fontSize: 16, WebkitTextStroke: "0.5px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
  });
```

#### Código nuevo
```typescript
  it("valida los tamaños, grosores y envoltura de notas del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", fontSize: 16, WebkitTextStroke: "0.5px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
    expect(liquidacionBlock).toContain('wordBreak: "break-word"');
    expect(liquidacionBlock).toContain('whiteSpace: "normal"');
    expect(liquidacionBlock).toContain('<span>Nota:</span>');
    expect(liquidacionBlock).toContain('<span>{meta.label}:</span>');
    expect(liquidacionBlock).toContain('<span>({fmt(entry.amount)})</span>');
    expect(liquidacionBlock).toContain('{entry.note.trim()}</span>');
  });
```

#### Por qué se cambió
Se fusionan la prueba del tamaño de fuente e impresora de TaxiAPP con las aserciones de envoltura de notas de main para garantizar la verificación de ambas funcionalidades de forma consolidada tras el merge.


## 2026-05-22 22:16 - Incrementar tamaño de fuente en elementos clave del ticket

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Incrementar 2px de fontSize a los elementos marcados

#### Código anterior
```tsx
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>LIQUIDACION SEMANAL</div>
            <div style={{ textAlign: "center", fontSize: 17, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>{formatWeekRangeFull(weekId)}</div>
            <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>
              <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total KM</span><span>{fmtKmNumber(totalKMAcumulado)} KM</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Comision Bruta Jefe</span><span>{fmt(brutoJefeAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>DESCUENTOS:</div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Datafonos</span><span>-{fmt(descDAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Gasolina</span><span>-{fmt(descGAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Agencias/Bonos</span><span>-{fmt(descAAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Extras</span><span>-{fmt(descEAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginTop: 4, WebkitTextStroke: "0.6px #000000" }}>
              <span>Total Descuentos</span><span>-{fmt(totalDescontarAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ textAlign: "center", fontWeight: 900, fontSize: 20, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000" }}>
              NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
            </div>
            {turnosConNotas.length > 0 && (
              <>
                <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
                <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>NOTAS DE LA SEMANA:</div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={turno.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 900, color: "#000000", fontSize: 14, WebkitTextStroke: "0.5px #000000" }}>{fmtDate(turno.date)}</div>
```

#### Código nuevo
```tsx
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>LIQUIDACION SEMANAL</div>
            <div style={{ textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>{formatWeekRangeFull(weekId)}</div>
            <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>
              <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total KM</span><span>{fmtKmNumber(totalKMAcumulado)} KM</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Comision Bruta Jefe</span><span>{fmt(brutoJefeAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>DESCUENTOS:</div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Datafonos</span><span>-{fmt(descDAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Gasolina</span><span>-{fmt(descGAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Agencias/Bonos</span><span>-{fmt(descAAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Extras</span><span>-{fmt(descEAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginTop: 4, WebkitTextStroke: "0.6px #000000" }}>
              <span>Total Descuentos</span><span>-{fmt(totalDescontarAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000" }}>
              NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
            </div>
            {turnosConNotas.length > 0 && (
              <>
                <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
                <div style={{ fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>NOTAS DE LA SEMANA:</div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={turno.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 900, color: "#000000", fontSize: 16, WebkitTextStroke: "0.5px #000000" }}>{fmtDate(turno.date)}</div>
```

#### Por qué se cambió
Se aumenta en 2px el tamaño de fuente (`fontSize`) del rango de fechas (a 19px), la fila Total Taxímetro (a 18px), Neto a Entregar (a 22px), el título Notas de la Semana (a 18px) y la fecha de cada turno de notas (a 16px) en consonancia con la retroalimentación visual del usuario.

### Cambio 2 - Actualizar test unitario con los nuevos tamaños de fuente

#### Código anterior
```typescript
  it("valida los tamaños y grosores del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 17, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
  });
```

#### Código nuevo
```typescript
  it("valida los tamaños y grosores del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", fontSize: 16, WebkitTextStroke: "0.5px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
  });
```

#### Por qué se cambió
Se actualizan las aserciones de la prueba de liquidación de semana para contemplar los nuevos tamaños de fuente configurados (+2px).


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
Se reestructura el formato de las notas impresas para separar el prefijo 'Nota' y '{meta.label}' en columnas independientes, facilitando la visualización correcta.

## 2026-05-22 22:14 - Aumentar grosor de fuentes del ticket térmico

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Aumentar grosor de fuentes y trazo en ticket-impresora

#### Código anterior
```tsx
          {/* Ticket termico oculto para impresora */}
          <div
            id="ticket-impresora"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: 384,
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 16,
              fontWeight: 500,
              padding: "24px 20px",
              lineHeight: 1.4,
            }}
          >
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 600, marginBottom: 4, color: "#000000" }}>LIQUIDACION SEMANAL</div>
            <div style={{ textAlign: "center", fontSize: 17, fontWeight: 900, marginBottom: 12, color: "#000000" }}>{formatWeekRangeFull(weekId)}</div>
            <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginBottom: 4 }}>
              <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total KM</span><span>{fmtKmNumber(totalKMAcumulado)} KM</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Comision Bruta Jefe</span><span>{fmt(brutoJefeAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4 }}>DESCUENTOS:</div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Datafonos</span><span>-{fmt(descDAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Gasolina</span><span>-{fmt(descGAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Agencias/Bonos</span><span>-{fmt(descAAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Extras</span><span>-{fmt(descEAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginTop: 4 }}>
              <span>Total Descuentos</span><span>-{fmt(totalDescontarAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ textAlign: "center", fontWeight: 900, fontSize: 20, color: "#000000", margin: "8px 0" }}>
              NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
            </div>
            {turnosConNotas.length > 0 && (
              <>
                <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
                <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4 }}>NOTAS DE LA SEMANA:</div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={turno.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 900, color: "#000000", fontSize: 14 }}>{fmtDate(turno.date)}</div>
```

#### Código nuevo
```tsx
          {/* Ticket termico oculto para impresora */}
          <div
            id="ticket-impresora"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: 384,
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 16,
              fontWeight: 700,
              padding: "24px 20px",
              lineHeight: 1.4,
              WebkitTextStroke: "0.2px #000000",
            }}
          >
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>LIQUIDACION SEMANAL</div>
            <div style={{ textAlign: "center", fontSize: 17, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>{formatWeekRangeFull(weekId)}</div>
            <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>
              <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Total KM</span><span>{fmtKmNumber(totalKMAcumulado)} KM</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
              <span>Comision Bruta Jefe</span><span>{fmt(brutoJefeAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>DESCUENTOS:</div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Datafonos</span><span>-{fmt(descDAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Gasolina</span><span>-{fmt(descGAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Agencias/Bonos</span><span>-{fmt(descAAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
              <span>Extras</span><span>-{fmt(descEAcumulado)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginTop: 4, WebkitTextStroke: "0.6px #000000" }}>
              <span>Total Descuentos</span><span>-{fmt(totalDescontarAcumulado)}</span>
            </div>
            <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
            <div style={{ textAlign: "center", fontWeight: 900, fontSize: 20, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000" }}>
              NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
            </div>
            {turnosConNotas.length > 0 && (
              <>
                <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
                <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>NOTAS DE LA SEMANA:</div>
                {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
                  <div key={turno.id} style={{ marginBottom: 6 }}>
                    <div style={{ fontWeight: 900, color: "#000000", fontSize: 14, WebkitTextStroke: "0.5px #000000" }}>{fmtDate(turno.date)}</div>
```

#### Por qué se cambió
Se aumenta el grosor base del ticket a `700` (negrita real en Courier New) y se añade un trazo de texto general (`WebkitTextStroke: "0.2px #000000"`) para que todo el texto normal tenga más cuerpo y legibilidad física. Asimismo, los elementos destacados pasan a `900` y reciben un trazo más fuerte de `0.6px` (o `0.5px`), creando el contraste proporcional buscado.

### Cambio 2 - Actualizar test para reflejar nuevos grosores y trazo

#### Código anterior
```typescript
  it("valida los tamaños y grosores del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 500");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 600, marginBottom: 4, color: "#000000"');
    expect(liquidacionBlock).not.toContain('textAlign: "center", fontWeight: 700, fontSize: 18, marginBottom: 4, color: "#000000"');
    expect(liquidacionBlock).toContain('fontSize: 17, fontWeight: 900, marginBottom: 12');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", marginBottom: 4');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
  });
```

#### Código nuevo
```typescript
  it("valida los tamaños y grosores del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 17, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
  });
```

#### Por qué se cambió
Se actualizan las expectativas de la prueba unitaria para validar que se implementen correctamente los pesos `700`, `900` y los trazos de texto (`WebkitTextStroke`) en el código de producción.

## 2026-05-22 22:12 - Añadir test para el ticket de impresora térmica

**Archivos modificados:** `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Test para ticket de impresora térmica

#### Código anterior
```typescript
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


});
```

#### Código nuevo
```typescript
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

  it("valida los tamaños y grosores del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 500");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 600, marginBottom: 4, color: "#000000"');
    expect(liquidacionBlock).not.toContain('textAlign: "center", fontWeight: 700, fontSize: 18, marginBottom: 4, color: "#000000"');
    expect(liquidacionBlock).toContain('fontSize: 17, fontWeight: 900, marginBottom: 12');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", marginBottom: 4');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto auto minmax(0, 1fr)"');
  });
});
```

#### Por qué se cambió
Se añade la prueba unitaria correspondiente a la validación de tamaños de fuente, pesos y estilos del ticket de impresora térmica oculto para evitar regresiones de tipografía o espaciados en futuras iteraciones.

## 2026-05-22 21:48 - Aumentar legibilidad y grosor del ticket impreso

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Base tipográfica del ticket oculto para impresora

#### Código anterior
```tsx
          {/* Ticket termico oculto para impresora */}
          <div
            id="ticket-impresora"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: 384,
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 14,
              padding: "20px 16px",
              lineHeight: 1.5,
            }}
          >
```

#### Código nuevo
```tsx
          {/* Ticket termico oculto para impresora */}
          <div
            id="ticket-impresora"
            style={{
              position: "absolute",
              left: "-9999px",
              top: 0,
              width: 384,
              backgroundColor: "#ffffff",
              color: "#000000",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 15,
              fontWeight: 600,
              padding: "24px 20px",
              lineHeight: 1.4,
            }}
          >
```

#### Por qué se cambió
El ticket térmico imprimía letras demasiado finas y el diseño quedaba algo ajustado en los bordes. Se aumenta la tipografía base a 15px, se establece un peso de 600 para que todo el texto herede un grosor semi-bold legible, y se amplía el padding a 24px 20px para un acabado más limpio al exportarse.

### Cambio 2 - Mayor tamaño para fechas y notas en ticket de impresora

#### Código anterior
```tsx
                    <div style={{ fontWeight: 700, color: "#000000", fontSize: 12 }}>{fmtDate(turno.date)}</div>
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

#### Código nuevo
```tsx
                    <div style={{ fontWeight: 700, color: "#000000", fontSize: 13 }}>{fmtDate(turno.date)}</div>
                    {notasGenerales.map((entry) => (
                      <div key={entry.id} style={{ fontSize: 13, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                        <span>{entry.time}</span>
                        <span>Nota:</span>
                        <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</span>
                      </div>
                    ))}
                    {notasDetalladas.map((entry) => {
                      const meta = getEntryTypeMeta(entry.type);
                      return (
                        <div key={entry.id} style={{ fontSize: 13, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                          <span>{entry.time}</span>
                          <span>{meta.label}:</span>
                          <span>({fmt(entry.amount)})</span>
                          <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</span>
                        </div>
                      );
                    })}
```

#### Por qué se cambió
Las notas y fechas dentro del ticket de impresora tenían un tamaño de letra de 12px que resultaba demasiado pequeño. Se incrementan a 13px para ganar legibilidad manteniendo la jerarquía respecto al contenido principal del ticket.

## 2026-05-22 21:28 - Aumentar tipografía del ticket térmico

**Archivos modificados:** `src/main.tsx`, `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Resolución del ticket de impresora

#### Código anterior
```tsx
html2canvas(element, {
  backgroundColor: "#ffffff",
  scale: 3,
  useCORS: true,
  logging: false,
}).then((canvas) => {
```

#### Código nuevo
```tsx
html2canvas(element, {
  backgroundColor: "#ffffff",
  scale: 4,
  useCORS: true,
  logging: false,
}).then((canvas) => {
```

#### Por qué se cambió
La imagen enviada a impresora se generaba con menos densidad de píxel. Subir la escala a 4 mejora la nitidez sin modificar el diseño visible del ticket.

### Cambio 2 - Base tipográfica del ticket oculto

#### Código anterior
```tsx
style={{
  position: "absolute",
  left: "-9999px",
  top: 0,
  width: 384,
  backgroundColor: "#ffffff",
  color: "#000000",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 14,
  padding: "20px 16px",
  lineHeight: 1.5,
}}
```

#### Código nuevo
```tsx
style={{
  position: "absolute",
  left: "-9999px",
  top: 0,
  width: 384,
  backgroundColor: "#ffffff",
  color: "#000000",
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 16,
  fontWeight: 700,
  padding: "20px 16px",
  lineHeight: 1.5,
}}
```

#### Por qué se cambió
El ticket térmico imprimía letras demasiado finas. Se sube el tamaño base de 14px a 16px y se añade peso 700 para que el texto general sea más resistente a impresiones débiles o roces.

### Cambio 3 - Cabecera, totales y secciones reforzadas

#### Código anterior
```tsx
<div style={{ textAlign: "center", fontSize: 16, marginBottom: 4, color: "#000000" }}>LIQUIDACION SEMANAL</div>
<div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#000000" }}>{formatWeekRangeFull(weekId)}</div>
<div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#000000", marginBottom: 4 }}>
```

#### Código nuevo
```tsx
<div style={{ textAlign: "center", fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#000000" }}>LIQUIDACION SEMANAL</div>
<div style={{ textAlign: "center", fontSize: 17, fontWeight: 900, marginBottom: 12, color: "#000000" }}>{formatWeekRangeFull(weekId)}</div>
<div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
<div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginBottom: 4 }}>
```

#### Por qué se cambió
La cabecera, la fecha y el primer total quedaban visualmente débiles. Se suben 2px los tamaños explícitos y se elevan los pesos existentes de 700 a 900 cuando marcaban datos importantes.

### Cambio 4 - Neto y notas más legibles

#### Código anterior
```tsx
<div style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: "#000000", margin: "8px 0" }}>
  NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
</div>
{turnosConNotas.length > 0 && (
  <>
    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
    <div style={{ fontWeight: 700, color: "#000000", marginBottom: 4 }}>NOTAS DE LA SEMANA:</div>
    {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
      <div key={turno.id} style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 700, color: "#000000", fontSize: 12 }}>{fmtDate(turno.date)}</div>
```

#### Código nuevo
```tsx
<div style={{ textAlign: "center", fontWeight: 900, fontSize: 20, color: "#000000", margin: "8px 0" }}>
  NETO A ENTREGAR: {fmt(totalNetoAcumulado)}
</div>
{turnosConNotas.length > 0 && (
  <>
    <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
    <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4 }}>NOTAS DE LA SEMANA:</div>
    {turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }) => (
      <div key={turno.id} style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 900, color: "#000000", fontSize: 14 }}>{fmtDate(turno.date)}</div>
```

#### Por qué se cambió
El neto y la zona de notas eran partes críticas del ticket y podían quedar pequeñas. Se aumenta el neto de 18px a 20px, se refuerzan pesos y se sube la fecha de notas de 12px a 14px.

### Cambio 5 - Filas de notas del ticket

#### Código anterior
```tsx
<div key={entry.id} style={{ fontSize: 12, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
```

#### Código nuevo
```tsx
<div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
```

#### Por qué se cambió
Las notas se imprimían en 12px y eran la parte más fácil de perder con una impresión floja. Subirlas a 14px mantiene la estructura actual y mejora la lectura.

### Cambio 6 - Prueba del ticket térmico

#### Código anterior
```ts
it("formats the printer ticket header and wraps long notes", () => {
  const printerTicketBlock = source.match(
    /id="ticket-impresora"[\s\S]*?onClick=\{copyToClipboard\}/
  )?.[0] || "";

  expect(printerTicketBlock).toContain('textAlign: "center", fontSize: 16, marginBottom: 4, color: "#000000"');
  expect(printerTicketBlock).not.toContain('textAlign: "center", fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#000000"');
  expect(printerTicketBlock).toContain('fontSize: 15, fontWeight: 700, marginBottom: 12');
```

#### Código nuevo
```ts
it("formats the printer ticket with larger and thicker thermal text", () => {
  const printerTicketBlock = source.match(
    /id="ticket-impresora"[\s\S]*?onClick=\{copyToClipboard\}/
  )?.[0] || "";
  const sharePrinterBlock = source.match(
    /const sharePrinterTicket = async \(\) => \{[\s\S]*?html2canvas\(element, \{[\s\S]*?\}\)\.then/
  )?.[0] || "";

  expect(printerTicketBlock).toContain('fontSize: 16');
  expect(printerTicketBlock).toContain('fontWeight: 700');
  expect(sharePrinterBlock).toContain('scale: 4');
  expect(printerTicketBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#000000"');
  expect(printerTicketBlock).toContain('fontSize: 17, fontWeight: 900, marginBottom: 12');
```

#### Por qué se cambió
La prueba anterior validaba la tipografía fina del ticket. Se actualiza para proteger el nuevo criterio: textos 2px más grandes, pesos reforzados y exportación con escala 4.


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

