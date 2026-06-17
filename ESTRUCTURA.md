# Estructura del proyecto - Guía para añadir código nuevo

Esta guía explica cómo está organizado el proyecto y dónde colocar cada cosa nueva. Consúltala cada vez que vayas a añadir una función, una pantalla, un componente o un tipo, para que la app siga ordenada con el tiempo.

## La estructura de `src/`

| Carpeta | Qué contiene | Ejemplos |
|---|---|---|
| `src/main.tsx` | Punto de entrada de la app. No se mueve de la raíz. | `main.tsx` |
| `src/logic/` | Lógica de negocio y utilidades **puras**: funciones que calculan, transforman o formatean datos. No tocan Firebase, ni el navegador, ni React. | Ver lista completa abajo |
| `src/hooks/` | Custom Hooks de React. Todo código que use estados, efectos o referencias y encapsule lógica ligada a React sin renderizar UI. | `use-firestore-sync.ts`, `use-sync-status.ts`, `use-android-back-button.ts` |
| `src/services/` | Todo lo que habla con el exterior: Firebase, almacenamiento del dispositivo, plugins nativos, estado global. | Ver lista completa abajo |
| `src/screens/` | Pantallas completas de la app. | Ver lista completa abajo |
| `src/components/` | Piezas de interfaz reutilizables que se usan dentro de las pantallas. | Ver lista completa abajo |
| `src/shared/` | Tipos de TypeScript, constantes y configuración compartidas por todo el proyecto. | Ver lista completa abajo |
| `src/__tests__/` | Los tests. Uno por módulo. | `accounting-extraction.test.ts`, `liquidacion-semana.test.ts` |

---

## Inventario completo de archivos actuales

### `src/logic/` — 15 archivos

| Archivo | Qué hace |
|---|---|
| `accounting.ts` | ⚠️ **PROTEGIDO.** Calcula los turnos contables: porcentajes, descuentos, importe a dar al jefe. No tocar como efecto secundario. |
| `week-logic.ts` | ⚠️ **PROTEGIDO.** Calcula la liquidación semanal y las semanas contables. No tocar como efecto secundario. |
| `turnos.ts` | Ordenación, filtrado por mes/año, merge sin duplicados y gestión del `diaLibreContable` de la lista de turnos. |
| `state-loaders.ts` | Carga el estado inicial de la app desde `localStorage` (historial, configuración, turno en curso, etc.) usando las claves de `storage-keys.ts`. |
| `watch-command-processor.ts` | Procesa los comandos que llegan del reloj Wear OS de forma pura (sin efectos laterales). Función principal: `processWatchCommand`. Coordina el estado del turno en curso desde el reloj. |
| `android-back-button.ts` | Lógica pura del botón físico Atrás de Android: decide qué cerrar o a qué pantalla volver según el estado actual de la app. |
| `backup.ts` | Construye el payload de backup (serializa los dominios de estado a JSON) para exportar o importar datos del usuario. |
| `csv.ts` | Genera el CSV de exportación de historial de turnos. |
| `date-time.ts` | Utilidades de formato de fecha y hora (cadenas `HH:MM`, `YYYY-MM-DD`, etc.). |
| `date-labels.ts` | Etiquetas de mes en español: nombres completos, abreviados y función `getMesLabel`. |
| `calendar-date.ts` | Calcula días del mes y offset de inicio de semana para renderizar el calendario. |
| `formatters.ts` | Formateadores de importe (€), kilómetros y duración (`fmtDuration`). |
| `turno-entrega.ts` | Marca un turno como entregado/no entregado y actualiza `fechaEntrega`. Función pura sobre el array de turnos. |
| `turno-notas-logic.ts` | Extrae del historial los turnos que tienen notas generales o notas detalladas por entrada. |
| `update-flow.ts` | Lógica pura de actualización de la APK: compara versiones contra el último release de GitHub y devuelve la URL de descarga si hay novedad. |

### `src/hooks/` — 3 archivos

| Archivo | Qué hace |
|---|---|
| `use-android-back-button.ts` | Registra el listener del botón físico «Atrás» de Android (Capacitor) y mantiene el snapshot de estado para decidir qué cerrar (capas abiertas, navegación, salir de la app). Devuelve `registerLocalAndroidBackHandler` para que las pantallas instalen handlers locales. |
| `use-firestore-sync.ts` | Hook principal de sincronización con Firestore. Escucha cambios en la nube y los aplica al store; gestiona la migración desde `localStorage`. |
| `use-sync-status.ts` | Devuelve el estado de sincronización actual (`loading`, `offline`, `pending`, `synced`, `error`) combinando el estado de red, `dataLoaded` y los pendientes de sync. |

### `src/services/` — 11 archivos

| Archivo | Qué hace |
|---|---|
| `firebase.ts` | Inicializa la app de Firebase, exporta `auth`, `db` (Firestore) y la configuración. |
| `firestore-sync.ts` | Funciones de lectura y escritura directa sobre Firestore (no el hook, sino las primitivas). |
| `user-storage.ts` | Lectura y escritura en `localStorage` con tipado (`readLocalJSON`, `writeLocalJSON`). |
| `store.ts` | **Store global de la app (Zustand v5).** Contiene dos slices: negocio (turnos, configuración, notas, reservas, semanas) y navegación (pantalla activa, historial de navegación, `setScreen`, `goBack`, `resetNavigation`). Es el único estado global de React de la aplicación. |
| `pending-sync.ts` | Cola de operaciones pendientes de subir a Firestore. Persiste en `localStorage` y emite el evento `PENDING_SYNC_CHANGED_EVENT` cuando cambia. |
| `apk-installer.ts` | Instala la APK descargada usando el plugin nativo de Capacitor. |
| `backup-export.ts` | Descarga el backup como fichero `.json` en el dispositivo. |
| `companion-device.ts` | Detecta si hay un dispositivo Wear OS emparejado y gestiona la selección del companion device. |
| `haptics.ts` | Wrapper sobre el plugin de haptics de Capacitor (vibración táctil). |
| `service-worker-registration.ts` | Registra el Service Worker de la PWA y detecta actualizaciones disponibles. |
| `watch-bridge.ts` | Puente con el reloj Wear OS: escucha comandos en Firestore, los procesa con `watch-command-processor.ts` y escribe la respuesta de vuelta. |

### `src/screens/` — 20 archivos

| Archivo | Pantalla |
|---|---|
| `auth-gate.tsx` | Barrera de autenticación. Muestra login o app según el estado de sesión. |
| `login-screen.tsx` | Pantalla de inicio de sesión con email y contraseña. |
| `home-screen.tsx` | Pantalla de inicio: turno en curso o acceso rápido al historial. |
| `add-entry-screen.tsx` | Añadir una entrada (propina, datáfono, agencia, extra, gasolina, nulo) al turno en curso. |
| `add-single-entry-screen.tsx` | Añadir una única entrada rápida al turno en curso. |
| `add-nota-general-screen.tsx` | Añadir una nota libre al turno en curso. |
| `confirm-end-screen.tsx` | Confirmación y cierre del turno: introduce taxímetro y km. |
| `today-history-screen.tsx` | Historial de entradas del turno del día actual. |
| `pantalla-turnos.tsx` | Lista resumida de turnos del historial. |
| `edit-turno-screen.tsx` | Edición completa de un turno ya guardado (taxímetro, km, entradas). |
| `summary-screen.tsx` | Resumen global de ganancias por períodos. |
| `contabilidad-screen.tsx` | Detalle contable de un turno: cálculo de porcentajes y entrega. |
| `liquidacion-semana-screen.tsx` | Liquidación semanal: semanas contables, entrega al jefe, marcar como entregada. |
| `liquidacion-turno-screen.tsx` | Liquidación de un turno suelto fuera de semana: genera ticket, copia liquidación e imprime ticket. |
| `detalle-semana-screen.tsx` | Detalle de todos los turnos de una semana contable. |
| `detalle-mes-screen.tsx` | Detalle de todos los turnos de un mes. |
| `detalle-anual-screen.tsx` | Detalle de todos los turnos de un año. |
| `calendar-screen.tsx` | Vista de calendario mensual con turnos y reservas marcados por día. |
| `settings-screen.tsx` | Configuración de la app: porcentajes, día libre, actualización de APK, backup, cuenta. |
| `admin-screens.tsx` | Pantallas de administrador: gestión de usuarios. Solo accesible con cuenta admin. |

### `src/components/` — 14 archivos

| Archivo | Qué contiene |
|---|---|
| `shell.tsx` | Contenedor principal de la app con la barra de navegación inferior. |
| `edit-entry-dialog.tsx` | Diálogo modal para editar o eliminar una entrada de un turno. |
| `turno-notas.tsx` | Componente de notas del turno: lista de notas generales y detalladas. |
| `sync-indicator.tsx` | Indicador visual del estado de sincronización con Firestore (usa `use-sync-status`). |
| `common.tsx` | Componentes genéricos reutilizables: `Spinner`, `ErrorBanner`, `EmptyState`, etc. |
| `duration-card-value.tsx` | Tarjeta de valor de duración de turno (horas y minutos). |
| `brand-assets.tsx` | Logo y assets de marca de la app. |
| `entry-icons.tsx` | Iconos SVG de tipos de entrada: propina, datáfono, agencia, extra, gasolina, nulo. |
| `home-icons.tsx` | Iconos SVG de la pantalla de inicio y acciones rápidas. |
| `navigation-icons.tsx` | Iconos SVG de la barra de navegación inferior. |
| `summary-icons.tsx` | Iconos SVG de la pantalla de resumen. |
| `calendar-icons.tsx` | Iconos SVG de la pantalla de calendario. |
| `settings-icons.tsx` | Iconos SVG de la pantalla de ajustes. |
| `turno-control-icons.tsx` | Iconos SVG de control del turno (pausa, reanudación, fin). |

### `src/shared/` — 8 archivos

| Archivo | Qué contiene |
|---|---|
| `types.ts` | Todos los tipos de dominio: `Turno`, `Entry`, `AppSettings`, `CurrentState`, `Reserva`, `NotaCalendario`, `WeekOverride`, etc. |
| `action-ids.ts` | Constantes de identificadores de acción para el historial de navegación y eventos. |
| `storage-keys.ts` | Claves de `localStorage` usadas en toda la app (`KEY_HISTORY`, `KEY_SETTINGS`, etc.). |
| `app-version.ts` | Expone la constante `APP_VERSION`, inyectada en build por Vite a partir de `__APP_VERSION__`. |
| `ui-theme.ts` | Colores del tema en formato `oklch`: constantes `G`, `P`, `A`, `E`, `F`, `N` y sus fondos (`GBG`, `PBG`, etc.) para los tipos de entrada. |
| `card-styles.ts` | Constantes de estilos inline reutilizables para tarjetas: tamaños de texto responsivos, estilos de unidad km y tiempo. |
| `entry-type-meta.tsx` | Mapa `ENTRY_TYPE_META` con el color, la etiqueta y el icono de cada tipo de entrada. **Usa extensión `.tsx`** porque renderiza JSX (iconos). Excepción válida a la regla `.ts` en `shared/`. |
| `watch-commands.ts` | Tipos del protocolo de comunicación con Wear OS: `WatchCommand`, `WatchCommandResponse`, `WatchEntry`, `WatchTurno`, `WatchTurnoTotals`. |

---

## Dónde colocar algo nuevo

Pregúntate esto, en este orden, y para en la primera respuesta que sea "sí":

1. ¿Es una pantalla entera nueva? → `src/screens/`
2. ¿Es una pieza de interfaz reutilizable (un diálogo, una tarjeta, un botón)? → `src/components/`
3. ¿Habla con Firebase, con el almacenamiento del móvil o con un plugin nativo? → `src/services/`
4. ¿Es un cálculo, una transformación o una utilidad pura (sin React y sin red)? → `src/logic/`
5. ¿Es un tipo de datos o una constante que usarán varios sitios? → `src/shared/`

Regla general: **un archivo = una responsabilidad clara**, con un nombre que la describa.

Una pantalla completa va en `src/screens/`. Las piezas de interfaz reutilizables que se usen dentro de varias pantallas van en `src/components/`.

Si una extracción empieza como código privado de una pantalla, puede quedarse dentro del archivo de esa pantalla. Solo se mueve a `src/components/` cuando se reutiliza, cuando tiene responsabilidad propia clara o cuando evita duplicación real entre pantallas.

## Cuándo crear una carpeta nueva

No crees una carpeta para un solo archivo: un archivo suelto va en la carpeta que le corresponda por su rol. Crea una carpeta nueva solo cuando aparezca un grupo claro de **tres o más** archivos relacionados que no encajen bien en las carpetas existentes. Nómbrala por su tema o rol, en minúsculas (por ejemplo `notifications/` o `reports/`). Si dudas, deja el archivo en la carpeta por rol más cercana; reagrupar más adelante es fácil y barato.

## Nombres de archivo

Usa minúsculas con guiones (kebab-case): `week-logic.ts`, `edit-entry-dialog.tsx`. Pon extensión `.ts` a la lógica sin interfaz y `.tsx` a cualquier archivo que contenga componentes de React. El nombre debe dejar claro qué hace el archivo sin necesidad de abrirlo.

**Excepción documentada:** `src/shared/entry-type-meta.tsx` tiene extensión `.tsx` porque renderiza JSX (los iconos de cada tipo de entrada). Es la única excepción en `shared/` y está justificada.

## Tests

Cada módulo nuevo de `logic/` debería tener su test en `src/__tests__/`. Para la lógica de cálculo, usa tests que fijen resultados exactos (tests de caracterización), igual que ya se hace con la contabilidad: así, si un cambio altera un número sin querer, el test falla y te avisa. Antes de dar algo por terminado, `npm test` tiene que estar en verde.

## La regla de oro: la contabilidad

Los cálculos de turnos, liquidación semanal, porcentajes, descuentos, semanas contables y entregas son las cuentas que se dan al jefe: no pueden fallar. Esa lógica vive en `src/logic/accounting.ts` y `src/logic/week-logic.ts`.

No cambies esas fórmulas como efecto secundario de otra tarea. Si algo exige tocarlas, hazlo de forma consciente y déjalo avisado. Están protegidas por tests de caracterización con importes exactos: si las alteras sin querer, esos tests fallan. Respétalos y no los "ajustes" para que pasen sin entender por qué fallaron.

## Antes de dar algo por terminado

Comprueba estas cuatro cosas:

1. `npx tsc --noEmit` no da errores de tipos.
2. `npm test` está en verde.
3. `npm run build` compila sin errores.
4. `CAMBIOS_AGENT.md` está actualizado según las reglas de `AGENTS.md`.

## Versionado

La versión de la app tiene una única fuente de verdad. El proceso de build de Vite (`vite.config.ts`) hace dos cosas:

1. Inyecta la constante global `__APP_VERSION__` en el código de la app. La constante `APP_VERSION` de `src/shared/app-version.ts` la consume.
2. Tras compilar, sustituye el marcador `__BUILD_VERSION__` en `dist/manifest.json` y `dist/sw.js` por la versión real.

La versión proviene de `process.env.APP_VERSION` (CI) o de `package.json` (local). **No escribas números de versión a mano** en `public/manifest.json` ni en `public/sw.js`: desincronizaría la versión que ve la app de la que usa el Service Worker.

## Documentos relacionados

- `AGENTS.md` — reglas de registro de cambios en `CAMBIOS_AGENT.md`.
- `ARQUITECTURA_RELOJ_WEAR_OS.md` — arquitectura del bridge con Wear OS; consúltalo si el cambio toca `watch-bridge.ts`, `watch-command-processor.ts`, `companion-device.ts` o `watch-commands.ts`.
- `graphify-out/GRAPH_REPORT.md` — vista global del código si la revisión se atasca y necesitas orientarte.

Mantén esta guía actualizada: si en el futuro se añade un archivo nuevo, una carpeta nueva o cambia una convención, refléjalo aquí para que siga siendo la referencia fiable.
