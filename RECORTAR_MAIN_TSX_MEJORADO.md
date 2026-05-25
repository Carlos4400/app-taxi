# Recortar `src/main.tsx` (versión mejorada)

> Esta es una versión revisada del documento original de recorte de `src/main.tsx`.
> Mantiene **literalmente** el texto original donde ya funcionaba bien y solo añade
> correcciones concretas. Todos los cambios respecto a la versión original están
> listados al final, en la sección «Registro de cambios respecto a la versión original».
> Esta versión NO reemplaza al original por sí sola: Carlos decide si la adopta.

Este documento tiene prioridad sobre cualquier intento de optimizar, embellecer, simplificar o reescribir código durante el recorte.
La misión no es mejorar la app: la misión es reducir `src/main.tsx` sin cambiar comportamiento.

## Objetivo

Reducir progresivamente `src/main.tsx` moviendo responsabilidades a módulos pequeños, claros y testeados.
El resultado debe respetar la estructura oficial de la app, mantener el comportamiento actual y conservar exactamente los resultados contables.

## Regla absoluta: contabilidad congelada

La contabilidad no se modifica.
Está prohibido cambiar, simplificar, reordenar, reinterpretar, deduplicar o "mejorar" cualquier código que afecte directa o indirectamente a:

- sumas y restas de importes
- porcentajes
- redondeos monetarios
- datáfono
- propinas
- agencias/bonos
- extras
- gasolina
- nulos
- dinero base
- total a descontar
- total a dar
- ganancia del conductor
- entregas
- semanas contables
- día libre
- asignación de turnos a semanas
- liquidación semanal
- orden, filtrado o agrupación usado para calcular cuentas

Aunque el código parezca mejorable, repetido, largo o feo, no se toca durante una tarea de recorte de `main.tsx`.

Solo se permite mover código contable si se cumplen todas estas condiciones:

1. El comportamiento queda idéntico.
2. No se cambian fórmulas ni reglas de negocio.
3. Hay tests de caracterización con importes exactos **escritos y pasando en verde ANTES de mover el bloque** (ver sección «Tests de caracterización: cuándo se escriben»).
4. Los resultados antes y después son iguales.
5. Los tests contables siguen pasando.

Si una extracción exige tocar una fórmula contable, parar y pedir confirmación a Carlos.
Si falla un test contable, no ajustar importes esperados para que pase. El fallo bloquea la tarea hasta entenderlo.

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

### Tests de seguridad contable congelados

Los tests no son la contabilidad real de la app. Son candados para detectar si alguien cambia una cuenta sin querer.

Los siguientes archivos de test están congelados:

- `accounting-extraction.test.ts`
- `liquidacion-semana.test.ts`

No se modifica nada de ellos: ni los casos, ni los importes esperados, ni la lógica, ni los `import`, ni el formato.
Estos archivos son intocables durante cualquier tarea de recorte de `main.tsx`.

Consecuencia práctica para las extracciones:

- Si una extracción mueve una función contable que estos tests importan, **mantener un re-export compatible** desde la ubicación original (por ejemplo, re-exportar desde `src/main.tsx` o desde el módulo que ya importaban), de forma que la ruta de `import` de estos tests siga siendo válida **sin tocarlos**.
- Si la extracción hace imposible mantener ese re-export sin tocar uno de estos dos archivos, **PARAR** y pedir confirmación a Carlos. No se edita el archivo congelado por iniciativa propia, ni siquiera para "solo arreglar un import".
- Si uno de estos tests falla tras una extracción, el fallo bloquea la tarea. No se ajusta el test: se entiende el fallo o se revierte la fase.

Los demás tests contables (`week-logic-extraction.test.ts`, `logic.test.ts` y similares) no están congelados, pero se les aplica la regla del documento original: si se mueve una función ya cubierta, se actualizan rutas/imports **sin cambiar expectativas**. Ante la duda sobre si un cambio en ellos altera una expectativa, parar y preguntar.

## Tests de caracterización: cuándo se escriben

Esta sección corrige una ambigüedad de la versión original.

- Para **código contable o cercano a contabilidad**: el test de caracterización con importes exactos se escribe y se ejecuta en verde **ANTES de mover nada**, sobre el código original. Es una condición previa, no un paso posterior. Sin ese test verde sobre el código original, no existe el "antes" con el que comparar, y la condición "los resultados antes y después son iguales" no se puede verificar de verdad. Para este tipo de código no aplica el criterio "cuando sea razonable": el test es obligatorio.
- Para **código no contable**: se mantiene el criterio del original. Añadir o actualizar un test de caracterización cuando sea razonable, normalmente después de la extracción.

Un test de caracterización no comprueba que algo "es correcto": comprueba que el comportamiento **no cambió**. Por eso debe escribirse capturando el resultado actual exacto, antes de tocar el bloque.

## Fase 0 obligatoria: línea base

Antes de la primera fase de recorte de una sesión, ejecutar una fase 0 de comprobación (no modifica código):

1. Confirmar que existen de verdad los tests contables (`accounting-extraction.test.ts`, `liquidacion-semana.test.ts`, `week-logic-extraction.test.ts`, `liquidacion-semana.test.ts`, `logic.test.ts`) y revisar que comprueban **importes exactos**, no solo que "no crashea".
2. Ejecutar `npm test` completo y confirmar que todo está en **verde** como línea base.
3. Ejecutar `npx tsc --noEmit` y confirmar que no hay errores previos.
4. Confirmar que el árbol de trabajo de git está limpio (sin cambios sin commitear).

Si la cobertura contable es débil, incompleta o no comprueba importes exactos, **PARAR** y avisar a Carlos antes de empezar a recortar. La seguridad de todo el plan depende de esa red de tests; si la red no existe, "contabilidad congelada" es una promesa sin respaldo.

## Método obligatorio

Trabajar siempre en fases pequeñas.
Una fase debe extraer una sola responsabilidad clara:

- un helper
- una constante
- un tipo
- una función pura
- un componente
- una pantalla
- un servicio
- un bloque de lógica aislado

No hacer refactors grandes.
No mezclar extracción con cambios visuales, cambios funcionales, limpieza estética, renombrados masivos o reorganización general.

## Nombre obligatorio de cada fase

Antes de modificar archivos, la fase debe tener un nombre concreto con este formato:

`Extraer <bloque> a <ruta destino>`

Ejemplos válidos:

- `Extraer DurationCardValue a src/components/duration-card-value.tsx`
- `Extraer helpers de calendario a src/logic/calendar-date.ts`
- `Extraer registro del service worker a src/services/service-worker-registration.ts`
- `Extraer AuthGate a src/screens/auth-gate.tsx`

Ejemplos no válidos:

- `Refactorizar main.tsx`
- `Limpiar código`
- `Mover varias cosas`
- `Ordenar componentes`
- `Mejorar estructura`
- `Extraer componentes y helpers`

Si el nombre necesita decir "y", "varios", "cosas", "limpiar", "mejorar" u "ordenar", la fase es demasiado grande o demasiado ambigua.

Cada fase debe poder resumirse en una sola frase. Si no se puede nombrar con precisión, no se debe empezar.

El título de la entrada en `CAMBIOS_AGENT.md` debe corresponder a esa misma fase y empezar con un verbo en infinitivo, como exige `AGENTS.md`.

## Nombre de los bloques extraídos

El nombre del archivo, función, componente, tipo o constante extraída debe describir la responsabilidad real del bloque, no el lugar del que salió.

Reglas:

- Usar nombres específicos y estables.
- Usar kebab-case para archivos: `duration-card-value.tsx`, `service-worker-registration.ts`.
- Usar PascalCase para componentes React: `DurationCardValue`, `EditEntryDialog`.
- Usar camelCase para funciones y helpers: `getDaysInMonth`, `buildBackupPayload`.
- Usar UPPER_SNAKE_CASE para constantes compartidas: `KEY_CURRENT`, `TIME_CARD_UNIT_STYLE`.
- No usar nombres genéricos nuevos como `helpers.ts`, `utils.ts`, `misc.ts`, `main-utils.ts` o `extracted-from-main.ts`.
- No usar nombres que dependan de `main.tsx`, como `mainHelpers` o `mainComponents`.
- No agrupar cosas distintas en un archivo solo porque salieron en la misma sesión.

Excepción: respetar archivos genéricos ya existentes, como `src/components/common.tsx`, pero no crear nuevos módulos genéricos sin necesidad clara.

Si el bloque extraído contiene más de una responsabilidad, dividirlo en fases separadas.

## Estructura obligatoria

Respetar `ESTRUCTURA.md`.
Destino según responsabilidad:

- `src/logic/`: cálculos, fechas, parsing, transformación y lógica pura sin React ni efectos externos.
- `src/services/`: Firebase, Firestore, localStorage, Capacitor, service worker y comunicación con el exterior.
- `src/components/`: componentes reutilizables de UI.
- `src/screens/`: pantallas completas.
- `src/shared/`: tipos, claves, estilos y constantes compartidas.
- `src/__tests__/`: tests.

`src/main.tsx` debe seguir siendo el punto de entrada principal, pero con menos responsabilidades internas.

## Orden recomendado

1. Lógica pura sin React.
2. Helpers de fecha, formato, parsing o transformación.
3. Tipos y constantes compartidas.
4. Servicios externos.
5. Componentes pequeños reutilizables.
6. Componentes grandes.
7. Pantallas completas.
8. Reorganización de carpetas solo si ya está clara y testeada.

Priorizar bloques con menor riesgo y dependencias claras.
La lógica contable o cercana a contabilidad solo se mueve con tests fuertes y sin cambiar comportamiento.

## Código con efectos secundarios y orden de ejecución

"Mover sin cambiar comportamiento" no cubre por sí solo un riesgo real: el **orden y el momento de ejecución**.

Hay código que se ejecuta por el simple hecho de importarse (código a nivel de módulo): registro del service worker, inicialización de Firebase/Firestore, lectura inicial de `localStorage`, configuración de Capacitor, listeners globales. Si ese código se saca a otro archivo, puede ejecutarse en un momento distinto aunque el código sea idéntico carácter a carácter.

Reglas para este tipo de bloques:

- Antes de mover, identificar si el bloque tiene efectos secundarios al importarse o si depende del momento en que corre.
- Mantener el mismo punto y orden de invocación. Si en `main.tsx` se llamaba en un sitio concreto, el módulo nuevo debe exportar una función que `main.tsx` siga llamando en ese mismo punto, en lugar de ejecutar el efecto al importarse.
- No convertir código que se ejecutaba explícitamente en código que se ejecuta "solo" al importar, ni al revés.
- Si no está claro si un bloque tiene efectos al importarse, tratarlo como si los tuviera.

Este tipo de cambio no afecta a las fórmulas contables, pero sí puede cambiar comportamiento visible. Por eso entra en el método con el mismo cuidado.

## Proceso por cada fase

### Antes de modificar

1. Leer `src/main.tsx` y los módulos relacionados.
2. Identificar el bloque exacto a extraer.
3. Identificar imports, exports, tipos y dependencias.
4. Confirmar la ruta destino según `ESTRUCTURA.md`.
5. Comprobar si el bloque afecta a contabilidad.
6. Si el bloque es contable o cercano a contabilidad: escribir el test de caracterización con importes exactos y dejarlo en verde sobre el código original **antes** de mover nada.
7. Comprobar si el bloque tiene efectos secundarios al importarse u orden de ejecución sensible.
8. Definir el nombre de la fase con el formato obligatorio.

### Durante la extracción

1. Mover el bloque sin cambiar comportamiento.
2. Mantener nombres y contratos cuando sea posible.
3. Mantener imports y exports compatibles.
4. Si el bloque está cubierto por un archivo de test congelado (`accounting-extraction.test.ts` o `liquidacion-semana.test.ts`), mantener un re-export compatible para no tener que tocar ese archivo.
5. Evitar ciclos de importación.
6. Si un componente necesita datos visuales, iconos o metadata de `main.tsx`, pasarlos por props.
7. No aprovechar para reescribir lógica.
8. No cambiar diseño visual.
9. No tocar archivos no relacionados.

### Después de modificar

1. Para código no contable: añadir o actualizar un test de caracterización cuando sea razonable. Para código contable: el test ya debe existir desde el paso previo.
2. Revisar `git diff`.
3. Ejecutar `npx tsc --noEmit`.
4. Ejecutar `npm test`.
5. Ejecutar `npm run build` siempre que el cambio afecte a imports, Vite, pantallas, servicios o módulos compartidos (en la práctica, casi cualquier extracción cambia imports, así que normalmente toca ejecutarlo).
6. Actualizar `CAMBIOS_AGENT.md` según `AGENTS.md`.
7. Hacer **un commit de git por fase**, con un mensaje que coincida con el nombre de la fase. Una fase = un commit. Esto permite revisar y revertir cada fase de forma aislada si algo sale mal.

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

## Tests obligatorios

Cada extracción debe quedar protegida por test cuando sea razonable.
Para lógica contable o cercana a contabilidad, los tests deben comprobar importes exactos. No basta con comprobar que no crashea.

Tests especialmente importantes:

- `accounting-extraction.test.ts` (congelado, intocable)
- `week-logic-extraction.test.ts`
- `liquidacion-semana.test.ts` (congelado, intocable)
- `logic.test.ts`
- tests específicos del módulo extraído

Si se mueve una función ya cubierta por tests, actualizar rutas/imports sin cambiar expectativas. Excepción: los archivos congelados no se tocan; para ellos se usa un re-export compatible o se para y se pregunta.
Si se crea un módulo nuevo de lógica, crear o actualizar su test correspondiente.

## Señales de stop

Parar y pedir confirmación a Carlos si ocurre cualquiera de estos casos:

- La extracción obliga a tocar una fórmula contable.
- Un test de contabilidad falla.
- El diff toca un archivo contable protegido sin que la fase lo hubiera nombrado explícitamente.
- La extracción obliga a modificar `accounting-extraction.test.ts` o `liquidacion-semana.test.ts` (aunque solo sea un import).
- No se puede mantener un re-export compatible para un archivo de test congelado.
- No está claro si un bloque afecta a liquidación, semanas o entregas.
- Hay que cambiar importes esperados en tests.
- La extracción requiere modificar varios módulos a la vez.
- Aparecen cambios no relacionados en `git diff`.
- Se detecta un ciclo de imports difícil de resolver.
- La fase ya no se puede describir con una sola frase concreta.
- En la fase 0, la cobertura de tests contables es débil o no comprueba importes exactos.

## Revisión obligatoria del diff

Antes de terminar, revisar `git diff` y confirmar que:

- solo se tocaron archivos relacionados con la fase
- no hay cambios accidentales en contabilidad
- no aparecen archivos contables protegidos salvo que la fase fuera explícitamente sobre uno de ellos
- `accounting-extraction.test.ts` y `liquidacion-semana.test.ts` no aparecen modificados
- no hay cambios visuales mezclados
- no hay renombrados masivos innecesarios
- no hay archivos autogenerados modificados sin motivo
- `CAMBIOS_AGENT.md` documenta la sesión

## Prohibido

- Cambiar fórmulas contables.
- Ajustar expectativas contables sin autorización de Carlos.
- Tocar archivos contables protegidos si la fase no los nombra de forma explícita.
- Modificar `accounting-extraction.test.ts` o `liquidacion-semana.test.ts` (contenido, casos, importes esperados o imports).
- Hacer una extracción masiva.
- Empezar una segunda extracción sin confirmación explícita de Carlos.
- Mezclar recorte con rediseño visual.
- Mezclar recorte con cambios funcionales.
- Borrar exports públicos sin comprobar consumidores.
- Mover archivos a carpetas que no correspondan a `ESTRUCTURA.md`.
- Reescribir código solo porque parece feo.
- Crear módulos genéricos tipo cajón desastre.
- Tocar archivos no relacionados.
- Terminar una tarea con archivos modificados sin actualizar `CAMBIOS_AGENT.md`.
- Mover código contable sin un test de caracterización verde escrito previamente sobre el código original.

## Criterio de tarea terminada

Una fase está terminada solo si:

- `main.tsx` quedó más pequeño o con menos responsabilidad.
- El comportamiento visible no cambió.
- La contabilidad produce los mismos resultados.
- Los tests relevantes pasan.
- `accounting-extraction.test.ts` y `liquidacion-semana.test.ts` siguen pasando y sin modificar.
- TypeScript no da errores.
- El build compila si aplica.
- `git diff` solo contiene cambios esperados.
- La fase quedó en un commit propio.
- `CAMBIOS_AGENT.md` documenta literalmente el cambio.

## Regla final

Si hay duda entre avanzar rápido o proteger la contabilidad, proteger la contabilidad.
Si hay duda entre hacer una fase grande o dividirla, dividirla.
Si hay duda entre reescribir y mover sin cambiar, mover sin cambiar.

---

## Registro de cambios respecto a la versión original

1. **Tests de seguridad contable congelados.** Nueva subsección dentro de "Regla absoluta". `accounting-extraction.test.ts` y `liquidacion-semana.test.ts` quedan intocables: ni contenido, ni importes esperados, ni imports. Se aclara que no son la contabilidad real de la app, sino candados para detectar cambios accidentales. Para no tener que tocarlos al mover una función que importan, se exige mantener un re-export compatible; si no es posible, es señal de stop. Añadido también a "Prohibido", "Señales de stop", "Revisión del diff" y "Criterio de tarea terminada".

2. **Tests de caracterización: cuándo se escriben.** Nueva sección que corrige una contradicción del original. El original ponía el test como condición previa para mover código contable (Regla absoluta, punto 3), pero el "Proceso por cada fase" lo colocaba en el paso *Después de modificar* con "cuando sea razonable". Ahora, para código contable, el test es obligatorio y va **antes** de mover nada; el "cuando sea razonable" solo aplica a código no contable.

3. **Fase 0 obligatoria: línea base.** Nueva sección. Antes de empezar a recortar, comprobar que los tests contables existen de verdad y comprueban importes exactos, ejecutar la suite completa en verde, comprobar `tsc` y el árbol de git limpio. Si la cobertura contable es débil, parar y avisar a Carlos.

4. **Código con efectos secundarios y orden de ejecución.** Nueva sección. "Mover sin cambiar comportamiento" no cubre cambios en el momento de ejecución de código a nivel de módulo (service worker, Firebase, `localStorage`, listeners). Se exige conservar el mismo punto y orden de invocación.

5. **Un commit de git por fase.** Añadido al "Proceso por cada fase" y al "Criterio de tarea terminada". Cada fase queda en su propio commit para poder revisarla y revertirla de forma aislada.

6. **`npm run build`.** Aclarado que, como casi cualquier extracción cambia imports, en la práctica el build debe ejecutarse en casi todas las fases.

7. **Archivos contables protegidos.** Nueva subsección dentro de "Regla absoluta". Se aclara que la contabilidad real ya está extraída y organizada fuera de `main.tsx`, y se listan las rutas concretas que contienen fórmulas, reglas semanales, entregas, ajustes, tipos y usos contables. Si una fase no nombra explícitamente esos bloques, deben quedar fuera del diff.

8. **Parada obligatoria al terminar cada fase.** Nueva sección. Una vez extraído un bloque, verificadas las pruebas y actualizado el registro, el agente debe parar y esperar confirmación de Carlos antes de iniciar otra extracción.

Nota de transparencia: estas mejoras se basan en el texto del documento original, buenas prácticas de refactor de código heredado y, para la sección "Archivos contables protegidos", en la revisión de las rutas actuales del proyecto. No sustituye a la "Fase 0": antes de recortar hay que volver a verificar tests, cobertura real y estado limpio del repositorio.
