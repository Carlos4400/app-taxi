# AGENTS.md

<INSTRUCTIONS>
## Registro obligatorio de cambios

Cada vez que modifiques archivos del proyecto, actualiza `CAMBIOS_AGENT.md`.

El registro debe documentar cambios de código de forma literal. No debe ser un resumen general.

Cada entrada debe añadirse al principio del archivo e incluir:

- Fecha.
- Archivos modificados.
- Un bloque por cada cambio relevante.

Cada bloque de cambio debe incluir:

- Código anterior.
- Código nuevo.
- Por qué se cambió.

`Código anterior` debe contener el fragmento exacto que existía antes del cambio.

`Código nuevo` debe contener el fragmento exacto que quedó después del cambio.

`Por qué se cambió` debe explicar el motivo concreto de sustituir ese código por el nuevo.

Si añades código nuevo que antes no existía, regístralo como cambio independiente. Esto incluye componentes, funciones, constantes, tipos, helpers, estilos, bloques JSX y assets.

No documentes solo dónde se usa el código nuevo. Documenta también la creación del bloque nuevo.

Para código nuevo, usa como código anterior: `No existía [nombre del bloque] en [archivo].`

Si no puedes verificar el código anterior literal, dilo explícitamente en la entrada.

No termines una tarea que haya modificado archivos sin actualizar `CAMBIOS_AGENT.md`.
</INSTRUCTIONS>
