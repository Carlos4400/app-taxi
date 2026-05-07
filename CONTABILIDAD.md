# Sistema de Contabilidad Semanal

> Documentación funcional y técnica del sistema de cuentas semanales.
> Última actualización: refleja la corrección de `getWeekRange` (+5 días) y la
> lógica matizada de turnos a caballo entre día libre y día laboral.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Manual de usuario](#2-manual-de-usuario)
3. [Arquitectura técnica](#3-arquitectura-técnica)
4. [Cómo se asignan los turnos a cada semana](#4-cómo-se-asignan-los-turnos-a-cada-semana)
5. [Estados de una semana](#5-estados-de-una-semana)
6. [Cambio de día libre y congelado de semanas](#6-cambio-de-día-libre-y-congelado-de-semanas)
7. [Casos límite y comportamientos especiales](#7-casos-límite-y-comportamientos-especiales)
8. [Histórico de decisiones aplicadas](#8-histórico-de-decisiones-aplicadas)
9. [Lo que NO está implementado](#9-lo-que-no-está-implementado)

---

## 1. Visión general

El sistema de contabilidad agrupa los turnos diarios en **semanas laborales** que terminan el día anterior al día libre y reinician al día siguiente. La pantalla "Contabilidad" muestra:

- Una **tarjeta destacada** con la semana en curso (acumulado parcial).
- Un listado de **semanas anteriores agrupadas por mes**, con los meses en orden cronológico inverso (más reciente primero).
- Una **pantalla detalle** para cada semana donde se ve el resumen de totales, las notas, los turnos individuales, y se puede marcar la semana como entregada al jefe.

El sistema está pensado para funcionar **durante años** y se adapta automáticamente al cambiar de día libre, congelando las semanas anteriores tal y como estaban en el momento del cambio.

---

## 2. Manual de usuario

### 2.1. Configurar tu día libre

En **Ajustes → Día Libre Semanal** se selecciona el día de la semana en que se libra. Por defecto está configurado en **Martes**.

Al cambiar el día libre, la app pide confirmación con un diálogo. Si se confirma, las semanas anteriores quedan **congeladas** tal y como estaban (ver sección 6) y a partir de la fecha del cambio las semanas se calculan con el nuevo día libre.

### 2.2. Pantalla Contabilidad

Se accede desde la pantalla principal pulsando "Contabilidad".

**Tarjeta "EN CURSO":** muestra siempre arriba con borde destacado.
- Rango de fechas de la semana actual (primer día laboral → último día laboral).
- Indicador "Día X de 6".
- Acumulado parcial del taxímetro.
- Aparece aunque no haya turnos registrados todavía.

**Semanas anteriores:** debajo, agrupadas por cabecera de mes (ej. "MAYO 2026", "ABRIL 2026"). Cada semana muestra:
- Rango de fechas.
- Número de turnos.
- Total bruto del taxímetro.
- Indicador ❄️ si la semana está congelada.
- Badge "Pendiente" o "✓ Entregada".

### 2.3. Pantalla Detalle de Semana

Se accede tocando cualquier tarjeta de semana en Contabilidad. Tiene scroll vertical y contiene en orden:

1. **Cabecera** con rango completo y badges de estado (entregada/pendiente, congelada).
2. **Resumen de la semana** con Total Taxímetro, Total KM y las 6 categorías (Datáfono, Propinas, Agencias, Extras, Gasolina, Nulos).
3. **Notas de la semana** editables con un campo de texto multilínea.
4. **Lista de turnos de la semana** ordenados del más reciente al más antiguo. Tocar un turno lleva a la pantalla `summary` del turno (donde se puede ver y editar).
5. **Botón "✓ Marcar como entregada"** al final.

### 2.4. Marcar como entregada

El botón "Marcar como entregada" registra la semana con la **fecha de hoy automáticamente**. Aparece en el badge superior con formato DD/MM/YYYY.

Si la semana ya está entregada, el botón cambia a "Desmarcar entregada" y al pulsarlo pide confirmación antes de revertir el estado.

### 2.5. Notas

Cada semana tiene un campo de notas libre. Al pulsar "Añadir" o "Editar" aparece un cuadro de texto. Las notas se guardan al pulsar "Guardar" y se pueden cancelar con "Cancelar". Si se sale sin guardar, los cambios se pierden.

### 2.6. Cierre automático de la semana

**Las semanas no se cierran por una acción manual.** El sistema funciona de forma pasiva:

- Una semana está **en curso** mientras la fecha de hoy sea anterior o igual al último día laboral de la semana.
- Una semana se considera **cerrada** automáticamente cuando la fecha de hoy supera el último día laboral.

Con día libre = Martes, una semana que termina el Lunes 11 estará en curso durante todo el lunes y pasará a aparecer como semana anterior cuando llegue el Martes 12 (00:00 en adelante). No hay ningún botón ni proceso que cierre la semana: simplemente al pasar el tiempo, la semana deja de mostrarse en la tarjeta "EN CURSO" y aparece debajo con badge "Pendiente".

---

## 3. Arquitectura técnica

### 3.1. Claves en localStorage

| Clave | Contenido |
|---|---|
| `taxi_current_v3` | Turno en curso (entradas, hora de inicio, fecha) |
| `taxi_history_v3` | Array de turnos cerrados (`Turno[]`) |
| `taxi_settings_v3` | Configuración: porcentajes, día libre, fecha desde |
| `taxi_week_overrides_v1` | Datos editables por semana (notas, entregada, fechaEntrega) |
| `taxi_weeks_frozen_v1` | Snapshots de semanas congeladas |

### 3.2. Estructuras de datos

```typescript
interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  diaLibre: number;              // 0=Domingo ... 6=Sábado
  diaLibreDesde: string | null;  // Fecha ISO del último cambio
}

interface WeekOverride {
  weekId: string;                // YYYY-MM-DD del primer día laboral
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

interface FrozenWeek {
  weekId: string;
  fechaInicio: string;
  fechaFin: string;
  diaLibreUsado: number;         // qué día libre regía cuando se congeló
  totales: {
    totalP, totalD, totalA, totalE, totalF, totalN, dinero, km: number;
  };
  turnoIds: number[];            // referencias, NO copia de los turnos
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
  numTurnos: number;
}
```

### 3.3. Identificador de semana (`weekId`)

El `weekId` es la **fecha ISO del primer día laboral de la semana** en formato `YYYY-MM-DD`.

Ejemplo con día libre = Martes (2):
- Semana laboral: Miércoles → Lunes.
- Una semana que arranca el miércoles 6 de mayo de 2026 tiene `weekId = "2026-05-06"`.

### 3.4. Rango de una semana

`getWeekRange(weekId)` devuelve `{ inicio, fin }` donde:

- `inicio` = primer día laboral (mismo valor que `weekId`).
- `fin` = `inicio + 5 días` = último día laboral.

Ejemplo: `weekId = "2026-05-06"` (Miércoles) → `fin = "2026-05-11"` (Lunes).

### 3.5. Funciones lógicas principales

| Función | Qué hace |
|---|---|
| `getWeekStartDate(fechaISO, diaLibre)` | Devuelve la fecha del primer día laboral de la semana a la que pertenece esa fecha |
| `getWeekId(fechaISO, diaLibre)` | Alias del anterior, devuelve el `weekId` |
| `getWeekRange(weekId)` | Devuelve `{ inicio, fin }` (fin = inicio + 5 días = último día laboral) |
| `getTurnoFechaEfectiva(turno, diaLibre)` | Devuelve la fecha "efectiva" para asignar el turno a una semana (ver sección 4) |
| `groupTurnosByWeek(turnos, diaLibre)` | Devuelve `Map<weekId, Turno[]>` |
| `isWeekClosed(weekId, hoyISO)` | True si la semana ya terminó (`hoyISO > fin`) |
| `calcularTotalesTurnos(turnos)` | Suma totales de un grupo de turnos |
| `freezeOldWeeks(...)` | Genera snapshots al cambiar día libre |
| `getWeekMonth(weekId, diaLibre)` | Decide a qué mes pertenece una semana |

---

## 4. Cómo se asignan los turnos a cada semana

### 4.1. Regla aplicada

La función `getTurnoFechaEfectiva(turno, diaLibre)` devuelve la fecha que decide a qué semana pertenece el turno. Lógica:

1. Si el turno NO tiene `startDate`, se usa `date` (fecha de fin) directamente.
2. Si la fecha de inicio cae en un **día laboral** → se usa la fecha de inicio.
3. Si la fecha de inicio cae en el **día libre** Y la fecha de fin cae en un día laboral distinto → se usa la fecha de fin.
4. En cualquier otro caso → se usa la fecha de inicio.

A partir de esa fecha, `getWeekId` calcula a qué semana pertenece según el día libre actual.

### 4.2. Ejemplos con día libre = Martes (2)

| Inicio | Fin | Fecha efectiva | Semana asignada |
|---|---|---|---|
| Lun 11 May 12:00 | Lun 11 May 23:00 | Lun 11 May | Semana del Mié 6 al Lun 11 |
| Lun 11 May 22:00 | Mar 12 May 02:00 | Lun 11 May | Semana del Mié 6 al Lun 11 |
| Mar 12 May 22:00 | Mié 13 May 02:00 | Mié 13 May | Semana del Mié 13 al Lun 18 (semana NUEVA) |
| Mié 13 May 10:00 | Mié 13 May 22:00 | Mié 13 May | Semana del Mié 13 al Lun 18 |

### 4.3. Asignación al mes

Una semana se asigna al mes **donde tiene más días**. Si los 6 días caen en el mismo mes, la asignación es trivial. Si la semana cruza dos meses:

- Mes con más días gana.
- Si hay **empate 3-3 días**, la app abre un diálogo al entrar en Contabilidad pidiendo al usuario que elija. La elección se guarda en memoria mientras la app esté abierta (no persiste en localStorage).

---

## 5. Estados de una semana

Una semana puede estar en uno de los siguientes estados:

### 5.1. Semana en curso

- Se calcula al vuelo desde el historial de turnos.
- Su `isWeekClosed` devuelve `false` porque hoy aún no es posterior a su fin.
- Aparece en la tarjeta destacada superior de la pantalla Contabilidad.
- Se muestra siempre, aunque no haya turnos registrados.

### 5.2. Semana cerrada (no congelada)

- Se calcula al vuelo desde el historial.
- Hoy es posterior a su fin (`isWeekClosed = true`).
- Si se edita un turno antiguo de esta semana, los totales **se recalculan automáticamente**.
- Se puede asociar a un `WeekOverride` que guarda notas y estado de entrega.

### 5.3. Semana congelada

- Existe como snapshot en `taxi_weeks_frozen_v1`.
- Sus totales son **fijos**: se guardaron en el momento del cambio de día libre.
- Si se edita un turno que pertenece a una semana congelada, el snapshot **NO se recalcula** (decisión consciente, ver sección 8).
- Se identifica visualmente con el icono ❄️.
- Las notas, entrega y fecha de entrega de una semana congelada **sí son editables**, pero los totales no.

---

## 6. Cambio de día libre y congelado de semanas

### 6.1. Por qué se congelan

El sistema permite cambiar el día libre en cualquier momento. Sin congelado, las semanas pasadas se reagruparían con el nuevo día libre y los totales históricos cambiarían.

Para evitar eso, **al cambiar el día libre, las semanas pasadas se congelan tal y como estaban**, conservando el día libre con que se calcularon originalmente.

### 6.2. Cómo funciona el congelado

Cuando el usuario confirma el cambio de día libre en Ajustes:

1. Se llama a `freezeOldWeeks(history, diaLibreAnterior, fechaCambio, frozenWeeks, weekOverrides)`.
2. La función agrupa los turnos según el día libre **anterior**.
3. Para cada semana cuyo `fin < fechaCambio` (es decir, que ya había terminado antes del cambio):
   - Se calcula el snapshot de totales.
   - Se copian los datos del override existente (notas, entregada, fechaEntrega).
   - Se guarda como `FrozenWeek` con `diaLibreUsado = diaLibreAnterior`.
4. Las semanas que **ya estaban congeladas previamente** se preservan intactas.
5. La **semana en curso NO se congela**: pasará a recalcularse con el nuevo día libre.
6. Después se guardan los nuevos `frozenWeeks` y se actualizan `settings.diaLibre` y `settings.diaLibreDesde`.

### 6.3. Convivencia entre semanas congeladas y semanas calculadas

La pantalla Contabilidad mezcla ambas en una misma lista:

- Las semanas congeladas se leen de `taxi_weeks_frozen_v1` y se muestran con sus totales fijos.
- Las semanas posteriores al último cambio de día libre se calculan al vuelo con el día libre actual.
- Si una semana ya está congelada, **no se vuelve a calcular** aunque exista en el historial.

---

## 7. Casos límite y comportamientos especiales

### 7.1. Semana en curso siempre visible

Aunque no haya ningún turno en la semana actual, la tarjeta "EN CURSO" aparece siempre con `0,00 €` y "0 turnos registrados". Esto se logra con un fallback en la pantalla Contabilidad que crea una semana vacía si no existe.

### 7.2. Edición de turno en semana cerrada (no congelada)

Si se edita un turno antiguo que pertenece a una semana cerrada pero **no congelada**, los totales de esa semana **se recalculan automáticamente** la próxima vez que se abra la pantalla Contabilidad o el detalle, porque se calculan al vuelo.

### 7.3. Edición de turno en semana congelada

Si se edita un turno que pertenece a una semana **congelada**:

- El turno se actualiza en el historial.
- La lista de turnos de la semana detalle muestra la versión actualizada del turno.
- **Los totales del snapshot NO se recalculan**: siguen mostrando los del momento del cierre.

Esto es una decisión consciente: las semanas congeladas son "fotos fijas" del momento en que se cerró el ejercicio.

### 7.4. Turnos que cruzan medianoche

Cuando un turno empieza un día y termina al siguiente, la asignación a semana se decide así:

- **Lunes noche → Martes madrugada (con día libre = Martes):** el turno cuenta para la semana del lunes (la que está terminando). El día libre que llega ya con el turno cerrado no afecta.
- **Martes noche → Miércoles madrugada (con día libre = Martes):** el turno cuenta para la **semana nueva del miércoles**. Aunque empezara en día libre, al haber terminado en día laboral, se asigna a la semana del día de fin.
- **Cualquier otro caso normal:** el turno se asigna a la semana de su fecha de inicio.

### 7.5. Diálogo de empate de mes

Si hay alguna semana con 3-3 días entre dos meses, **al abrir Contabilidad** aparece un diálogo modal pidiendo al usuario que elija el mes. La elección queda guardada en memoria (`tieResolutions`, un `Map`) mientras la app esté abierta.

Al cerrar y volver a abrir la app, el diálogo aparecerá de nuevo si la semana sigue en estado de empate.

### 7.6. Datos huérfanos en localStorage

Las versiones anteriores del sistema incluían un campo `ajustes` (extra/descuento) en `WeekOverride` y `FrozenWeek`. Ese campo se eliminó por completo de las interfaces y de la lógica.

Si en el dispositivo del usuario hay datos antiguos guardados con ese campo, **siguen en localStorage como propiedades extra ignoradas**. No causan errores ni se muestran. Son inocuos.

---

## 8. Histórico de decisiones aplicadas

Las decisiones que están **realmente reflejadas en el código actual**:

1. **Definición de semana laboral.** Termina el día anterior al día libre y empieza al día siguiente. Implementado en `getWeekStartDate`. La función `getWeekRange` devuelve correctamente 6 días laborales (`inicio + 5 días`).

2. **Día libre configurable manualmente.** Selector de 7 botones (D, L, M, X, J, V, S) en la pantalla Ajustes con confirmación antes del cambio.

3. **Cambio de día libre congela las semanas pasadas.** Implementado en `freezeOldWeeks`.

4. **Edición de turno en semana congelada NO recalcula el snapshot.** Implementado: el snapshot guarda totales fijos.

5. **Asignación al mes con más días trabajados.** Implementado en `getWeekMonth` contando los 6 días laborales.

6. **Empate 3-3 → diálogo cada vez al abrir Contabilidad.** Implementado con `tieResolutions` que vive en memoria de la sesión.

7. **Pantalla detalle en una sola pantalla larga con scroll.** Implementado en el bloque `screen === "detalleSemana"`.

8. **Notas con textarea editable.** Implementado.

9. **Botón "Marcar como entregada" usa fecha de hoy automática.** Implementado.

10. **No hay botón "Exportar CSV de esta semana".** Confirmado: no existe en la pantalla detalle.

11. **Bloque de Ajustes manuales (extra/descuento) eliminado por completo** de interfaces, estados, JSX y diálogos.

12. **No hay cálculo de "Mi parte" / "Parte del jefe" a nivel semana.** Aplazado por decisión del usuario para una fase final posterior.

13. **Lógica matizada de turno a caballo entre día libre y día laboral.** Si un turno empieza en día libre y termina en día laboral, se asigna a la semana del día de fin. Implementado en `getTurnoFechaEfectiva(turno, diaLibre)`.

---

## 9. Lo que NO está implementado

### 9.1. Turnos sueltos como tarjetas separadas

Se discutió que los turnos completamente contenidos dentro del día libre (empiezan y terminan en día libre, sin cruzar a día laboral) podrían aparecer como "Turnos sueltos" intercalados cronológicamente entre las semanas con tarjeta separada (🚕).

**Estado actual:** la pantalla Contabilidad **sí tiene código** preparado para detectar `key.startsWith("__suelto__")` pero `groupTurnosByWeek` no genera esas claves. Un turno completamente dentro del día libre se asignaría a la semana adyacente según la lógica de `getTurnoFechaEfectiva`.

En la práctica, este caso es muy raro (trabajar exclusivamente durante el día libre sin cruzar a día laboral) y no afecta al uso normal.

### 9.2. Cálculo de "Mi parte" y "Parte del jefe" semanal

Decidido aplazar al "paso final". No hay tarjetas de "Mi parte" ni "Parte del jefe" en la pantalla detalle. Sólo se muestran totales brutos.

### 9.3. Ajustes manuales por semana (extra/descuento)

Decidido eliminar por completo. No existen.

### 9.4. Botón "Exportar CSV de esta semana"

Decidido no incluir. El CSV global existe en la pantalla Turnos, no a nivel semana.

---

*Fin del documento*
