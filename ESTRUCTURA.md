# Estructura del proyecto - Guía para añadir código nuevo

Esta guía explica cómo está organizado el proyecto y dónde colocar cada cosa nueva. Consúltala cada vez que vayas a añadir una función, una pantalla, un componente o un tipo, para que la app siga ordenada con el tiempo.

## La estructura de `src/`

| Carpeta | Qué contiene | Ejemplos |
|---|---|---|
| `src/main.tsx` | Punto de entrada de la app. No se mueve de la raíz. | `main.tsx` |
| `src/logic/` | Lógica de negocio y utilidades **puras**: funciones que calculan, transforman o formatean datos. No tocan Firebase, ni el navegador, ni React. | `accounting.ts`, `week-logic.ts`, `csv.ts`, `date-time.ts`, `formatters.ts` |
| `src/services/` | Todo lo que habla con el exterior: Firebase, almacenamiento del dispositivo, plugins nativos. | `firebase.ts`, `firestore-sync.ts`, `user-storage.ts`, `apk-installer.ts` |
| `src/screens/` | Pantallas completas de la app. | `login-screen.tsx`, `admin-screens.tsx`, `auth-gate.tsx` |
| `src/components/` | Piezas de interfaz reutilizables que se usan dentro de las pantallas. | `shell.tsx`, `edit-entry-dialog.tsx`, `turno-notas.tsx` |
| `src/shared/` | Tipos de TypeScript y constantes compartidas por todo el proyecto. | `types.ts`, `action-ids.ts`, `storage-keys.ts` |
| `src/__tests__/` | Los tests. Uno por módulo. | `accounting-extraction.test.ts` |

## Dónde colocar algo nuevo

Pregúntate esto, en este orden, y para en la primera respuesta que sea "sí":

1. ¿Es una pantalla entera nueva? → `src/screens/`
2. ¿Es una pieza de interfaz reutilizable (un diálogo, una tarjeta, un botón)? → `src/components/`
3. ¿Habla con Firebase, con el almacenamiento del móvil o con un plugin nativo? → `src/services/`
4. ¿Es un cálculo, una transformación o una utilidad pura (sin React y sin red)? → `src/logic/`
5. ¿Es un tipo de datos o una constante que usarán varios sitios? → `src/shared/`

Regla general: **un archivo = una responsabilidad clara**, con un nombre que la describa.

## Cuándo crear una carpeta nueva

No crees una carpeta para un solo archivo: un archivo suelto va en la carpeta que le corresponda por su rol. Crea una carpeta nueva solo cuando aparezca un grupo claro de **tres o más** archivos relacionados que no encajen bien en las carpetas existentes. Nómbrala por su tema o rol, en minúsculas (por ejemplo `notifications/` o `reports/`). Si dudas, deja el archivo en la carpeta por rol más cercana; reagrupar más adelante es fácil y barato.

## Nombres de archivo

Usa minúsculas con guiones (kebab-case): `week-logic.ts`, `edit-entry-dialog.tsx`. Pon extensión `.ts` a la lógica sin interfaz y `.tsx` a cualquier archivo que contenga componentes de React. El nombre debe dejar claro qué hace el archivo sin necesidad de abrirlo.

## Tests

Cada módulo nuevo de `logic/` debería tener su test en `src/__tests__/`. Para la lógica de cálculo, usa tests que fijen resultados exactos (tests de caracterización), igual que ya se hace con la contabilidad: así, si un cambio altera un número sin querer, el test falla y te avisas. Antes de dar algo por terminado, `npm test` tiene que estar en verde.

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

La versión de la app tiene una única fuente. No escribas números de versión a mano en `public/manifest.json` ni en `public/sw.js`: ambos usan el marcador `__BUILD_VERSION__`, que el proceso de build sustituye automáticamente por la versión real. Tocar esos números a mano vuelve a desincronizar las versiones.

## Documentos relacionados

`AGENTS.md` explica cómo registrar cada cambio en `CAMBIOS_AGENT.md`. `ANALISIS_PLAN_PROFESIONAL.md` y `REVISION_IMPLEMENTACION.md` son los análisis previos del proyecto.

Mantén esta guía actualizada: si en el futuro se añade una carpeta nueva o cambia una convención, refléjalo aquí para que siga siendo la referencia fiable.
