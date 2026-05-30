# Incremento 2 — Migración de pantallas a selectores del store

> Estado de partida: Incremento 1 completado (store Zustand + slice de navegación + back de Android, `useFirestoreSync` ya lee/escribe del store). `App` en `main.tsx` (~3073 líneas) sigue siendo el contenedor que distribuye props a las ~14 pantallas.

## 1. Hallazgo que condiciona todo el incremento

Medición real de props pasadas por `App` a cada pantalla y cuántas son **estado del store** (las demás son callbacks/acciones, valores derivados o estado de UI local):

| Pantalla | Props totales | Estado de store consumido | Props eliminables solo con selectores |
|---|---|---|---|
| AddNotaGeneralScreen | 4 | setCurrent, setScreen | 2 |
| AddSingleEntryScreen | 8 | setCurrent, setScreen | 2 |
| DetalleAnualScreen | 7 | history, settings, setScreen | 3 |
| LiquidacionSemanaScreen | 7 | history, settings, weekOverrides, setScreen | 4 |
| DetalleMesScreen | 10 | history, settings, setScreen | 3 |
| DetalleSemanaScreen | 10 | history, settings, weekOverrides, setScreen | 4 |
| PantallaTurnos | 11 | history, settings, setScreen | 3 |
| AddEntryScreen | 12 | setCurrent, setScreen | 2 |
| TodayHistoryScreen | 13 | current, setScreen | 2 |
| ContabilidadScreen | 16 | history, settings, weekOverrides, setScreen | 4 |
| ConfirmEndScreen | 21 | current, setScreen | 2 |
| SettingsScreen | 26 | current, history, reservations, notes, settings, weekOverrides, setHistory, setSettings, setScreen, isAdmin | 10 |
| CalendarScreen | 38 | history, reservations, notes, settings, setNotes, setScreen | 6 |
| HomeScreen | 10 | current(→isPaused/active), setScreen, isAdmin | 3 |

**Conclusión:** eliminar el *prop drilling* de verdad exige dos frentes, no uno:
- **2A — Acciones al store.** Mover las acciones de negocio puras que hoy viven en `App` para que las pantallas las invoquen directamente, en lugar de recibirlas como callbacks.
- **2B — Estado por selectores.** Que cada pantalla lea su estado del store en vez de recibirlo por props.

Hacer solo 2B deja la mayoría de props (los callbacks) intactas. Por eso 2A va primero.

## 2. Frente 2A — Acciones de negocio al store

Acciones identificadas en `App` candidatas a moverse al `actionsSlice` del store (todas operan sobre los 6 dominios ya centralizados):

| Acción actual en App | Destino en store | Notas |
|---|---|---|
| `updateWeekOverride(weekId, partial)` | `updateWeekOverride` | Pura sobre `weekOverrides`. Mover directo. |
| `togglePause()` | `togglePause` | Pura sobre `current`. |
| `handleEndTurno()` | `endTurno(payload)` | Pura sobre `current`+`history`. Extraer cálculo a `logic/` si tiene efectos (alert/navegación) y dejar solo la mutación en el store. |
| `saveReserva()` / `openNewReserva()` | `saveReserva` / sigue requiriendo estado de formulario | El formulario de reserva usa ~8 `useState` de UI; ver decisión D2. |
| `openEditEntry` / `saveEditEntry` / `deleteEditEntry` | parcial | Dependen de `editEntry`/`editJ` (estado de diálogo). Solo la mutación de `current.entries` se mueve; el diálogo se queda local o pasa a su propio slice de UI. |
| Alta de entradas (AddEntry/AddSingle/AddNota) | `addEntryToCurrent(entry)` | Hoy llaman `setCurrent(prev=>…)`. Encapsular en una acción semántica. |

**Regla:** al store solo van **mutaciones puras de estado**. Nada de `alert()`, `navigate`, `Share`, `html2canvas` ni `Filesystem` dentro del store. Esos efectos se quedan en la pantalla/`App` o en `logic/`/`services/`.

## 3. Frente 2B — Pantallas por selectores

Patrón único por pantalla (ejemplo `DetalleAnualScreen`):

```tsx
// Antes
<DetalleAnualScreen history={history} settings={settings} onSetScreen={setScreen} ... />

// Después
<DetalleAnualScreen ... />   // sin props de datos
// y dentro de la pantalla:
const history  = useAppStore(s => s.history);
const settings = useAppStore(s => s.settings);
const setScreen = useAppStore(s => s.setScreen);
```

Reglas de selectores (evita re-renders innecesarios — punto que faltaba en el borrador original):
- Un selector por valor: `useAppStore(s => s.history)`, no `useAppStore(s => s)`.
- Para valores derivados caros (resúmenes contables), calcular con `useMemo` dentro de la pantalla a partir del selector, no recalcular en `App`.
- Nunca devolver objetos/arrays nuevos dentro del selector (provoca re-render en cada render). Si hace falta combinar, usar `useShallow` de `zustand/react/shallow`.

## 4. Orden de ejecución (de menor a mayor riesgo)

Una pantalla por commit, con build+typecheck+tests en verde antes de pasar a la siguiente.

1. **AddNotaGeneralScreen** (4 props) — piloto. Valida el patrón end-to-end.
2. **AddSingleEntryScreen** (8) y **AddEntryScreen** (12) — usan `setCurrent`; introducir `addEntryToCurrent`.
3. **DetalleAnualScreen, DetalleMesScreen, LiquidacionSemanaScreen, DetalleSemanaScreen** — solo lectura de `history/settings/weekOverrides`. Bajo riesgo.
4. **PantallaTurnos, TodayHistoryScreen** — lectura + navegación.
5. **ContabilidadScreen** (16) — lectura + derivados contables a `useMemo`.
6. **ConfirmEndScreen** (21) — introduce `endTurno`; cuidado con efectos (alert/navegación quedan en la pantalla).
7. **CalendarScreen** (38) — alto volumen; `setNotes` + diálogos de reserva/nota.
8. **SettingsScreen** (26) y **HomeScreen** — últimas; tocan más dominios y `isAdmin`.

## 5. Qué NO se mueve (se queda en App o pasa a slice de UI)

- Estado de UI local de diálogos y formularios: `confirmDialog`, `editEntry/editJ`, formulario de reserva (`reservaTime`, `reservaOrigen`…), `showBackupMenu`, `calendarMonth`, `pickerYear`, etc. → opcional: un `uiSlice` separado en una fase posterior, no en este incremento.
- Helpers de render JSX: `renderReservaDialog`, `renderTurnoCard`, `renderReservaSection` → idealmente se extraen como componentes propios, fuera del alcance de 2B.
- Efectos de plataforma (update APK, export/share, html2canvas) → permanecen en `App`/`services`.

## 6. Decisiones abiertas (requieren tu confirmación antes de ejecutar)

- **D1 — Navegación:** mantener el stack manual del store o migrar a un router (p. ej. enrutado por estado más formal). Recomendación: mantener el stack en este incremento; router como Incremento 3.
- **D2 — Formularios/diálogos:** ¿creamos ya un `uiSlice` para el estado de formularios de reserva/nota, o los dejamos como props en CalendarScreen en este incremento? Recomendación: dejarlos esta vez para acotar riesgo; `uiSlice` en fase posterior.
- **D3 — Acciones con efectos (`endTurno`):** confirmar que el cálculo se extrae a `logic/` y el store solo recibe el resultado ya calculado.

## 7. Verificación por paso

1. `npm run typecheck` limpio.
2. `npx vitest run` — los 122 tests actuales en verde + test nuevo por pantalla migrada que verifique que renderiza leyendo del store (montar con un store inicializado y comprobar contenido).
3. `npx vite build` exit 0.
4. Prueba manual en dispositivo de cada flujo migrado (alta de entrada, cierre de turno, navegación + back físico).

## 8. Riesgos y controles

- **Re-renders:** selectores granulares + `useShallow`; medir con React DevTools si alguna pantalla pesada (Calendar/Contabilidad) re-renderiza de más.
- **Doble fuente de verdad transitoria:** durante la migración, una pantalla puede leer del store mientras `App` aún le pasa props; mantener una sola por dominio y eliminar la prop en el mismo commit en que se añade el selector.
- **Tamaño de `main.tsx`:** cada edición sobre un archivo de 3073 líneas es frágil. Editar invocación de pantalla y su archivo en el mismo commit, y verificar con build tras cada uno.
- **Índice de git corrupto** (preexistente): reconstruir con `rm .git/index && git reset` antes de empezar a commitear.
