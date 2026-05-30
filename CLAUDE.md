# Instrucciones para el agente — APP Taxi

## Usar graphify para entender el código

Este proyecto tiene un grafo de conocimiento del código ya generado en la carpeta `graphify-out/` (presente en disco; está en `.gitignore`, no se versiona).

Cuando haya que responder cómo funciona la app, flujos, dependencias entre módulos o dónde vive algo en el código, **usa el skill `graphify`** (tratar la pregunta como una consulta al grafo) en lugar de explorar solo a mano con `grep`/`find`/lectura directa.

Si tras cambios grandes el grafo parece desactualizado, regenéralo con graphify antes de consultarlo.

## Otras convenciones del proyecto

- Registrar cada cambio en `CAMBIOS_AGENT.md` según las reglas de `AGENTS.md` (obligatorio).
- Estructura de carpetas y "regla de oro" de la contabilidad: ver `ESTRUCTURA.md`.
- Antes de dar algo por terminado: `npx tsc --noEmit`, `npm test` y `npm run build` en verde.
