# Arquitectura vigente de Mi Turno Watch

## Estado del documento

Este documento es la unica fuente de verdad funcional para la integracion entre:

- Mi Turno Watch.
- La app Mi Turno instalada en el movil.
- La base local nativa Room del movil.
- El store de la app movil.
- Cloud Firestore.

Describe el comportamiento que debe conservarse. No es una lista de ideas ni de
fases pendientes.

Ultima revision: 2026-06-16 contra `HEAD` (sin commit separado; se regenera
manualmente cuando cambia el flujo Wear). Grafo de conocimiento del codigo en
`graphify-out/` (no versionado) como apoyo de exploracion.

## Objetivo

Mi Turno Watch funciona como mando de trabajo del movil.

El reloj permite:

- Consultar el estado del turno.
- Iniciar un turno.
- Pausar y reanudar el turno activo.
- Anadir entradas.
- Anadir notas.
- Editar y eliminar entradas.
- Terminar el turno.
- Consultar turnos guardados.
- Editar un turno cerrado (dinero, km, entradas/notas).

El reloj no escribe directamente en Firestore. Los comandos se procesan y
persisten primero en el movil. El reloj tampoco escribe por su cuenta: solo
publica el `DataItem` del comando y espera ACK.

## Fuente de verdad por responsabilidad

| Responsabilidad | Fuente de verdad |
|---|---|
| Comando pendiente de recibir confirmacion | Outbox persistente del reloj (`WatchOutbox`, SharedPreferences `watch_outbox`) |
| Estado operativo recibido desde el reloj | Room nativo del movil (DB `mi-turno-watch-<sha256(uid)[:32]>.db`) |
| Contabilidad del turno mostrada por el movil | Precalculada en TypeScript con `accounting.ts` y persistida en Room como subobjeto `contable` de cada turno (`totalTaximetro`, `miGanancia`, `totalADescontar`, `totalADar`) |
| Estado mostrado y editado por la app movil | Store de la app (Zustand), hidratado desde Room y Firestore |
| Sincronizacion remota entre dispositivos | `use-firestore-sync` con la sesion Firebase Auth actual |
| Calculos contables | Logica TypeScript existente de la app movil (`src/logic/accounting.ts` — archivo PROTEGIDO) |
| Superficies de solo lectura (tile y complicacion) | `TurnoStatusStore` en el reloj (ultimo STATUS confirmado) |

Room es la fuente nativa del flujo Wear. Firestore no sustituye a Room para
procesar comandos del reloj.

## Flujo principal

```text
Reloj
  -> genera un operationId unico
  -> bloquea si ya hay una operacion critica pendiente
  -> bloquea si no conoce la sesion confirmada por el movil
  -> guarda el comando en WatchOutbox (publishedAt=0) si es write
  -> adjunta userSessionId al JSON
  -> publica /watch-command/<operationId> mediante DataClient con setUrgent()

Movil nativo
  -> WearListenerService.onDataChanged recibe el DataItem
  -> encola WearCommandWorker (WorkManager, expedited)
  -> WatchNativeCommandHandler valida JSON, sesion, operationId
  -> WatchRepository aplica en una transaccion Room
    * inserta OperationEntity (PENDING)
    * procesa el comando (WatchCommandProcessor)
    * persiste estado actual + historial
    * finaliza OperationEntity (APPLIED/REJECTED, responseJson)
    * poda operaciones finalizadas con >90 dias
  -> publica ACK persistente en /watch-ack/<operationId> (setUrgent)
  -> envia respuesta rapida por MessageClient /watch-response (best effort)
  -> publica /turno/state con el estado actualizado
  -> notifica via WatchStateChangeNotifier (BroadcastReceiver interno)
  -> arranca o detiene TurnoForegroundService segun START/END_TURNO

Reloj
  -> MobileResponseService procesa la respuesta (DataClient o MessageClient)
  -> la encola en WearConstants.Response (SharedPreferences
     mobile_response_prefs) bajo RESPONSE_QUEUE
  -> si es terminal, retira el comando del outbox
  -> notifica a la Activity via SharedPreferences listener
  -> WearMainActivity aplica el feedback (toast + vibracion) y navega
  -> si era STATUS o TURNOS_STATUS, alimenta TurnoStatusStore
     (tile y complicacion se refrescan)
```

## Comportamiento con la app movil cerrada o el movil bloqueado

Los comandos del reloj no dependen del WebView de Capacitor para guardarse.

Si la app movil esta cerrada, esta en segundo plano o el movil esta bloqueado:

1. Google Play Services entrega el `DataItem` al movil cuando existe
   comunicacion.
2. `WearListenerService.onDataChanged` lo procesa.
3. `WearCommandWorker` (WorkManager, expedited) lo ejecuta.
4. El cambio se guarda en Room en una transaccion atomica.
5. El movil responde con ACK persistente al reloj y, si la red local lo
   permite, una respuesta rapida por `MessageClient` `/watch-response`.

En esta situacion, el cambio queda guardado localmente en Room aunque la parte
React de la app no este ejecutandose.

Firestore no se actualiza directamente desde Room. La sincronizacion con
Firestore ocurre cuando la app movil vuelve a ejecutar `watch-bridge` y
`use-firestore-sync` bajo una sesion valida.

## Comportamiento sin comunicacion entre reloj y movil

Un comando critico no se considera guardado definitivamente hasta recibir una
respuesta terminal del movil.

Si no hay comunicacion:

1. El reloj conserva el comando en `WatchOutbox` con `publishedAt=0`.
2. La interfaz debe indicar que la operacion sigue pendiente
   (`pendingOpsCount` + `WatchEntry.pendiente` o `WatchTurno.contablePendiente`
   en su caso) o que el movil no esta disponible (`NO_CONNECTED`).
3. `OutboxWorker` (WorkManager, exponential backoff con
   `MIN_BACKOFF_MILLIS`, enqueued con tag `outbox-retry` y unique work
   `outbox-retry-unique`) reenvia solo los comandos con `publishedAt <= 0`
   (`WatchOutbox.unpublishedCommands`). El envio usa `DataClient` con
   `setUrgent()`.
4. Si `putDataItem` confirma, el comando se marca `publishedAt = now` y
   `DataClient` lo entrega al movil cuando se restablezca la comunicacion,
   sin retransmisiones periodicas adicionales.
5. Todos los reintentos reutilizan el mismo `operationId`.
6. Al recuperar la comunicacion, el movil procesa el comando una sola vez
   (Room deduplica por PK `operationId` y devuelve la respuesta original).

WorkManager es el unico responsable del backoff entre reintentos. `WatchOutbox`
conserva el comando pendiente hasta recibir una respuesta terminal, pero no
mantiene un segundo temporizador ni elimina comandos por numero de intentos.

Ademas de los comandos sin publicar, el reloj conserva en
`WatchConstants.Response` (SharedPreferences `mobile_response_prefs`) la cola
persistente de respuestas recibidas para que la Activity las procese en orden
incluso tras un reinicio. Cada respuesta encolada incrementa
`RESPONSE_SEQUENCE` y la Activity escucha ese cambio para sondear (`poll`).

El reloj no inventa estados de negocio: cualquier transformacion local es
optimismo reversible (ver «Presentacion de estado optimista»).

## Proteccion contra duplicados

Cada comando critico lleva un `operationId` no vacio y estable.

Room registra los identificadores ya procesados en la tabla `watch_operations`
(PK `operationId`). Al recibir un comando:

```text
operationId nuevo
  -> insertar OperationEntity(applied=false, resultType=PENDING)
  -> procesar el comando
  -> finalizar OperationEntity(applied, resultType, responseJson, processedAt)
  -> responder OK / DUPLICATE_IGNORED / ERROR

operationId ya registrado
  -> re-leer la OperationEntity previa
  -> devolver su responseJson original (incluido ERROR)
  -> no volver a aplicar
```

El ACK persistente se publica despues de guardar en Room el resultado
`APPLIED` o `REJECTED` (`/watch-ack/<operationId>` con `setUrgent()`). El
worker movil no termina hasta que `putDataItem` confirma la publicacion local
del ACK. Si el worker se repite, Room devuelve exactamente el resultado
original sin duplicar datos.

### Retencion y limites

Hay tres retenciones/límites que no se deben confundir:

| Capa | Mecanismo | Valor | Finalidad |
|---|---|---|---|
| Movil Room (`WatchRepository.operationRetentionMs`) | `OperationDao.pruneFinalizedBefore` | 90 dias | Podar operaciones finalizadas (no afecta a `PENDING`) |
| Reloj SharedPreferences (`MobileResponseService.HANDLED_TERMINAL_TTL_MS`) | Set de `operationId` ya manejados con timestamp | 90 dias | No re-encolar notificaciones ni re-marcar `WatchOutbox` ya vaciado tras un reinicio del servicio |
| Movil Room (`processedOperationLimit`) y TS (`MAX_PROCESSED_OPERATION_IDS`) | Cola de deduplicacion en memoria + persistida | 512 ids | Limite de la lista de estado enviada a la UI; la deduplicacion real la hace Room por PK, no esta ventana |
| Reloj (`WearConstants.HANDLED_OPERATION_LIMIT`) | Set `shownResponseOpIds` en la Activity | 128 ids | Evitar doble toast/vibracion cuando la misma respuesta llega por DataClient y por MessageClient |

La poda nunca borra operaciones `PENDING` (filtro `resultType != 'PENDING'`).

## Aislamiento entre usuarios

La integracion Wear debe impedir que datos de dos usuarios se mezclen.

### Preparacion de sesion

Cuando `use-firestore-sync` termina de cargar los datos de un usuario y
`dataLoaded` pasa a `true`:

1. Llama a `setupWatchBridge(uid)` (hook `use-firestore-sync.ts:438`).
2. El plugin nativo invoca `WearOsBridgePlugin.setPrepared({uid})` que delega
   en `WatchUserSession.prepare(context, uid)`.
3. Se genera o reutiliza un `sessionId` (UUID v4) asociado a ese `uid` y se
   guarda en `SharedPreferences("watch_user_session")`.
4. `WatchDatabaseProvider.getForUid(context, uid)` abre una base independiente
   con nombre `mi-turno-watch-<sha256(uid)[:32]>.db` (migrando el legacy
   `mi-turno-watch.db` la primera vez).
5. `WatchOsBridge.publishState` publica `/turno/state` con ese sessionId
   embebido en el `userSessionId` del STATUS.

Al cerrar o cambiar sesion, `teardownWatchBridge(uid)` invoca
`WearOsBridgePlugin.clearPrepared({uid})` que detiene el
`TurnoForegroundService` y borra el `DataItem` de `/turno/state`.

### Validacion de comandos

Los comandos criticos del reloj llevan `userSessionId`.

El movil rechaza un comando si su `userSessionId` no coincide con la sesion
preparada, respondiendo `USER_SESSION_MISMATCH`
(`WatchNativeCommandHandler.kt:143-150`).

El reloj no crea ni guarda un comando critico nuevo mientras desconoce la
sesion confirmada por el movil (`WearMainActivity.sendCommand:1083-1088`):
muestra `Esperando movil...` y dispara un `requestStatus()` para acelerar la
recuperacion.

Ademas, `WatchOutbox.commandsFromOtherSessions(context, userSessionId)`
enumera los comandos del outbox con `userSessionId` distinto al actual; el
`STATUS` los anuncia con un feedback suave para que el usuario los gestione.

### Escritura en Firestore

`use-firestore-sync` solo permite escribir cuando se cumplen todas estas
condiciones:

- Los datos terminaron de cargarse (`dataLoaded === true`).
- Existe `auth.currentUser.uid`.
- El UID autenticado coincide con el UID solicitado.
- El UID cargado en el hook coincide con ese mismo usuario.

Al cerrar o cambiar la sesion, `teardownWatchBridge(uid)` limpia la preparacion
Wear correspondiente.

## Comandos criticos

Los siguientes comandos se guardan en el outbox y requieren confirmacion:

- `START_TURNO`
- `PAUSE_TURNO`
- `RESUME_TURNO`
- `ADD_ENTRY`
- `ADD_NOTE`
- `EDIT_ENTRY`
- `DELETE_ENTRY`
- `END_TURNO`
- `EDIT_TURNO` (edicion completa de un turno cerrado: dinero, km y
  entradas/notas; anula su contabilidad guardada hasta que la app movil la
  recalcula)

Solo puede existir una operacion critica pendiente a la vez desde la interfaz
actual del reloj (`hasPendingCriticalOperation()`). Esto evita encadenar
acciones basadas en un estado aun no confirmado por el movil.

Los comandos de lectura, como `GET_STATUS` y `GET_TURNOS`, no modifican datos
de negocio y se envian directamente sin pasar por el outbox.

## Respuestas y cierre del outbox

El movil puede responder al reloj por dos canales:

1. **ACK persistente**: `DataClient` con path `/watch-ack/<operationId>`, campo
   `response` con el JSON de la respuesta. Es la fuente de verdad.
2. **Respuesta rapida**: `MessageClient` con path `/watch-response` y payload
   igual. Es best effort: si falla, no pasa nada porque el ACK persistente
   llegara despues.

El `MobileResponseService` del reloj escucha ambos canales
(`onDataChanged` y `onMessageReceived`) y los deduplica con el set
`shownResponseOpIds` (tamano maximo 128, FIFO). Asi, un mismo `operationId`
solo produce un toast/vibracion aunque llegue por las dos vias.

`WearConstants.isTerminalResponse(type, code)` (`WearConstants.kt:90-93`)
define que es terminal:

```text
type == "OK" || type == "DUPLICATE_IGNORED"   -> terminal
type == "ERROR" && code != "USER_NOT_PREPARED" && code != "APP_NOT_READY"
                                                 -> terminal
cualquier otro                                  -> no terminal
```

`STATUS` y `TURNOS_STATUS` no son terminales: actualizan datos sin cerrar el
outbox. Si llegan para un `operationId` ya en outbox, tambien limpian los
`DataItem` del comando y del ACK para no acumular basura en el DataClient.

El reloj elimina un comando del outbox solo cuando recibe una respuesta
terminal para su `operationId` y la cola de respuestas
(`WearConstants.Response.enqueue`) lo confirma. Ademas:

- Las respuestas se escriben sincronamente en `mobile_response_prefs` antes de
  retirar el comando.
- Si la interfaz no esta visible (`WearUiVisibility.isVisible == false`),
  `WearResponseNotification` muestra una notificacion en el canal
  `watch_responses` con vibracion (`IMPORTANCE_HIGH`).
- En primer plano, la `Activity` procesa las respuestas via un listener de
  `SharedPreferences` sobre `RESPONSE_SEQUENCE` y aplica feedback (toast +
  vibracion corta 65ms, fuerte 120ms).

### Codigos de error posibles

Emitidos por `WatchNativeCommandHandler` o `WatchCommandProcessor`:

| Codigo | Origen | Terminal | Significado |
|---|---|---|---|
| `USER_NOT_PREPARED` | `WatchNativeCommandHandler.userNotPrepared` (no hay `uid` preparado) | No | El usuario no ha abierto la app movil. El reloj lo muestra una sola vez (`movilNoPreparadoAvisado`) y reintenta con `scheduleResync(8000ms)`. |
| `USER_SESSION_MISMATCH` | `WatchNativeCommandHandler.kt:143-150` | Si | El `userSessionId` del comando no coincide con la sesion preparada. |
| `OPERATION_ID_MISMATCH` | `WatchNativeCommandHandler.kt:152-156` | Si | El `operationId` del path `/watch-command/...` no coincide con el del JSON. |
| `INVALID_OPERATION_ID` | `WatchCommandProcessor` / `WatchRepository` | Si | `operationId` vacio. |
| `MALFORMED_JSON` / `INVALID_PAYLOAD` / `INVALID_COMMAND` | `WatchCommandJson.parse` | Si | JSON malformado, campos requeridos faltantes, `entryType` desconocido, etc. |
| `ACTIVE_TURNO` / `NO_ACTIVE_TURNO` / `ALREADY_PAUSED` / `NOT_PAUSED` | `WatchCommandProcessor` | Si | Estado incoherente con el comando. |
| `INVALID_AMOUNT` / `INVALID_NOTE` / `INVALID_END_VALUES` / `INVALID_EDIT_VALUES` | `WatchCommandProcessor` | Si | Validacion de payload. |
| `ENTRY_NOT_FOUND` / `TURNO_NOT_FOUND` | `WatchCommandProcessor` | Si | El id no existe en el estado actual. |
| `UNKNOWN_COMMAND` | `WatchNativeCommandHandler.handleReadCommand` | Si | Tipo no reconocido en una operacion de lectura. |

El reloj reintenta automaticamente solo los no terminales
(`USER_NOT_PREPARED`); el resto son finales y muestran feedback fuerte.

## Estado movil hacia reloj

Tras aplicar cambios, el movil publica el estado en:

```text
/turno/state
```

`WatchStateDataPublisher.publish(context)` (movil nativo) lee Room con
`WatchRepository.readState(nowDate, nowTime, nowMs)`, lo serializa con
`WatchResponseJson.statusToJson` y lo publica en `/turno/state` con
`setUrgent()`. La respuesta incluye `userSessionId` para que el reloj
verifique aislamiento.

El estado permite que el reloj muestre la informacion confirmada por el movil:

- `userSessionId` (clave para rechazo de comandos de otra sesion).
- `activeTurno`, `startTime`, `startDate`.
- `isPaused`, `pauseStartTime`, `totalPausedMinutes`.
- `totals` (`porTipo` + `numPorTipo` + `numEntradas`) y `entradas` del turno
  en curso.

El historial se solicita de forma separada mediante `GET_TURNOS` y se
responde con `TURNOS_STATUS`. Esa respuesta envia **como maximo los 30
turnos mas recientes** (`WatchResponseJson.turnosStatusToJson:67`) y, para
cada turno:

- Los datos brutos (`dinero`, `km`, `entries`, `tiempoTrabajado`...).
- La contabilidad precalculada (`totalTaximetro`, `miGanancia`,
  `totalADescontar`, `totalADar`), que puede llegar como `null`.
- `contablePendiente: true` si cualquier campo contable falta: el reloj debe
  mostrarlo como «Pendiente» y nunca inventar numeros (`regla de oro`).
- Fallback: si `totalTaximetro` falta, el reloj calcula `dinero - nulos`
  localmente, porque no depende de ajustes (`WatchResponseJson.kt:75-76`).

El reloj no debe presentar un cambio pendiente como confirmado antes de recibir
el ACK o el estado actualizado.

## Presentacion de estado optimista (pendiente vs confirmado)

El reloj aplica los cambios criticos de forma optimista para responder al
instante. Las acciones `START/PAUSE/RESUME/ADD_ENTRY/ADD_NOTE/EDIT_ENTRY/
DELETE_ENTRY/EDIT_TURNO` se reflejan en la UI antes de recibir el ACK. Esto
es deseable: el transporte Bluetooth, Doze y el segundo plano introducen
latencia que no debe penalizar la interaccion. La politica es optimista, no
"esperar al ACK para mostrar".

Para no contradecir la invariante de "no confirmar lo pendiente", la
presentacion optimista debe cumplir tres reglas:

1. **Mostrar ya, pero marcado como pendiente.** Los `WatchEntry` que vienen de
   un comando optimista llevan `pendiente = true`
   (`WearMainActivity.applyOptimisticAddEntry:776`,
   `applyOptimisticEditEntry:791`). Para `EDIT_TURNO`, el `WatchTurno` entero
   recibe `contablePendiente = true` y los cuatro campos contables a 0
   (`applyOptimisticEditTurno:1033-1036`). El `dineroBase` (dinero - nulos)
   se actualiza en local porque no depende de ajustes.
2. **Reconciliar al recibir respuesta.** Al llegar el ACK (`OK`) o el
   `STATUS`/`TURNOS_STATUS` actualizado, se retira la marca y el dato queda
   confirmado. `DUPLICATE_IGNORED` se trata igual que confirmado.
3. **Revertir ante error terminal.** Ante un `ERROR` terminal, el cambio
   optimista se deshace o se re-sincroniza desde el `STATUS`/`GET_TURNOS`
   real, y se avisa al usuario. Los errores no terminales
   (`USER_NOT_PREPARED`, `APP_NOT_READY`) mantienen el dato como pendiente;
   no lo revierten, y disparan un reintento diferido a 8 segundos
   (`scheduleResync(8000L)`).

`pendingOpsCount` (cuenta de `WatchOutbox.pendingCommands`) y
`WatchEntry.pendiente` / `WatchTurno.contablePendiente` son las dos senales
disponibles para implementar esta politica: la primera es global, las otras
son por dato concreto. La pantalla usa ambas (badge global + marca en la
propia entrada/turno).

Para `EDIT_TURNO`, la regla de oro exige que la contabilidad guardada
(`totalTaximetro`, `miGanancia`, `totalADescontar`, `totalADar`) se anule al
editar y no se muestre ningun numero contable hasta que la app movil la
recalcule. Esto se aplica en dos puntos:

- Procesador puro (`WatchCommandProcessor.processEditTurno:233-242`): pone
  los cuatro campos a `null` y mantiene el `turno` actualizado con los
  nuevos datos brutos.
- WatchAppSnapshot: la TS calcula la contabilidad nueva con
  `calcularTurnoContable` y la embebe en el subobjeto `contable` de cada
  turno al sincronizar el store con Room
  (`watch-bridge.ts:194-205`, `WatchStateJson.snapshotFromJson:98`).
- Bridge Kotlin: `WatchResponseJson.turnosStatusToJson:72-74` marca
  `contablePendiente` si cualquiera de los cuatro campos falta, y el reloj
  lo pinta como tal sin inventar valores.

La marca de pendiente nunca altera los datos brutos enviados al movil ni la
contabilidad ya confirmada, que se sigue calculando en TypeScript al
hidratar.

## Restauracion tras recreacion o cierre del proceso

La Activity del reloj puede recrearse por un cambio de configuracion o ser
eliminada por Android en segundo plano. El estado de UI (pantalla actual,
seleccion, borradores de formulario) vive en memoria y se perderia.

Politica:

1. **Estado critico**: se reconstruye siempre. Los comandos pendientes viven
   en `WatchOutbox` (persistente) y se reintentan sin duplicar por
   `operationId`; los datos del turno se rehidratan del `STATUS` del movil
   al volver a primer plano. No requiere codigo de UI adicional.
2. **Navegacion**: `currentScreen` y la categoria seleccionada se guardan en
   `onSaveInstanceState` con las claves `wear_state_screen` y
   `wear_state_category` y se restauran en `onCreate`. Las pantallas que
   dependen de un objeto no serializable (`editingEntry`, `selectedTurno`)
   caen a un destino seguro por sus `LaunchedEffect` (a `ACTIVE_TURNO` o
   `TURNOS` segun guard), en lugar de restaurarse a medias.
3. **Borrador**: el importe y la nota en curso usan `rememberSaveable`, por
   lo que sobreviven a la recreacion si la pantalla se restaura.

Una accion entrante desde la tile tiene prioridad sobre la pantalla
restaurada (`pendingTileAction`): si la sesion ya esta confirmada se ejecuta
de inmediato, si no se conserva y se procesa al llegar el proximo `STATUS`.

Nunca se restaura un estado que pueda reaplicar un comando ya enviado: la
reactivacion pasa siempre por el outbox con su `operationId`.

## Hidratacion de Room en la app movil

Cuando la app movil esta activa y preparada:

1. `use-firestore-sync` llama a `setupWatchBridge(uid)` (efecto con
   dependencias `[dataLoaded, uid]`).
2. `setupWatchBridge` invoca `WearOsBridge.setPrepared({uid})` y luego
   `queueNativeHydration()`.
3. `hydrateNativeWatchState()` llama a `getNativeState()` que devuelve
   `state` (JSON de `WatchStateJson.stateToJson`).
4. La TS fusiona los turnos nativos con el historial del store sin
   duplicarlos (`mergeTurnos` con match por `id` o por
   `startDate+startTime+endTime`).
5. Fusiona los `processedOperationIds` con deduplicacion y poda a los
   ultimos 512.
6. Actualiza el turno actual del store.
7. `startNativeStateSync()` suscribe `useAppStore` a cambios de `current`,
   `history`, `processedOperationIds` y `settings`. Cada cambio encola
   `syncNativeWatchState()` que serializa un snapshot canonico y lo envia
   via `syncState({state: snapshot})`.

### Snapshot canonico y contabilidad

`syncNativeWatchState` (`watch-bridge.ts:219-231`) calcula un hash estable
del estado canonico antes de enviar: si es igual al ultimo snapshot
sincronizado, no hace la llamada. El hash usa `stableHash` (ordenacion
recursiva de claves) sobre el estado completo.

Para cada turno, el snapshot incluye un subobjeto `contable` con los cuatro
campos contables precalculados por `calcularTurnoContable` de
`accounting.ts` (`watch-bridge.ts:194-205`). El nativo los absorbe en Room
(`WatchStateJson.snapshotFromJson:98-114`) y los persiste en columnas
`REAL DEFAULT NULL` en `watch_turnos` (migration 4_5).

El `replaceAppState` del nativo valida que el snapshot movil no es anterior
al estado nativo: si la diferencia `appliedOperationIds - snapshot.processedOperationIds`
no esta vacia, lanza `StaleWatchSnapshotException` y rechaza la
actualizacion. Esto evita que un estado remoto mas viejo pisotee cambios
locales.

## Sincronizacion con Firestore

`use-firestore-sync` es el unico canal de esta arquitectura que escribe los
cambios Wear en Firestore.

Cuando `watch-bridge` hidrata el store:

- Un turno activo actualizado provoca la escritura del documento `current`.
- Un turno finalizado incorporado al historial provoca la sincronizacion de
  la subcoleccion `turnos`.
- Las `reservations`, `notes`, `weekOverrides`, `settings` y
  `processedOperationIds` tambien se sincronizan, cada uno en su
  coleccion/documento.

La escritura utiliza siempre el UID autenticado y cargado actualmente, y se
marca primero en `pending-sync.ts` (`markUserPendingSync`) para que la UI
muestre el indicador «pendiente» correspondiente. Cuando la promesa de
escritura resuelve, `clearUserPendingSync` lo retira. Si la app se cierra
antes de la confirmacion, `waitForPendingWrites(db)` (efecto de
`use-firestore-sync:408-422`) limpia las marcas huerfanas de areas que
sabemos confirmadas por el backend.

Si no hay red:

1. La app conserva los datos localmente en `localStorage` (claves
   `taxi_*_v*` por usuario).
2. Marca la seccion correspondiente como pendiente (`PENDING_SYNC_CHANGED_EVENT`).
3. Reintenta la sincronizacion habitual cuando vuelve la conectividad.

## Pausar y reanudar

La pausa forma parte del estado persistido:

- `isPaused`
- `pauseStartTime`
- `totalPausedMinutes`

Al reanudar (`processResumeTurno`), se acumula el tiempo transcurrido desde
`pauseStartTime` en `totalPausedMinutes`. El reloj aplica esto de forma
optimista (`sendResumeTurno:730-734`) y el STATUS posterior lo confirma.

Si el turno termina estando pausado (`processEndTurno:189-193`), el tiempo de
la pausa abierta se incorpora a `totalPausedMinutes` antes de cerrar el
turno.

El tiempo trabajado mostrado (`WatchResponseJson.workedTime:138-150`) descuenta
los minutos pausados del total `endTime - startTime`.

## Finalizacion de turno

`END_TURNO` debe:

1. Validar que existe un turno activo (`current.startTime != null`).
2. Validar `dinero > 0` y `km > 0`.
3. Si esta pausado, incorporar la pausa abierta a `totalPausedMinutes`.
4. Crear el turno cerrado en `watch_turnos` con `notes`, `entries`,
   `startDate/Time`, `endTime`, `dinero`, `km`, y contabilidad a `null`
   (la precalcula la app al sincronizar).
5. Vaciar el turno actual en `watch_current_urno` (`clear()`).
6. Registrar el `operationId` en `watch_operations`.
7. Publicar ACK persistente y `/turno/state` actualizado.
8. Detener el `TurnoForegroundService` desde el worker.

La contabilidad final (`totalTaximetro`, `miGanancia`, `totalADescontar`,
`totalADar`) la calcula la TS al hidratar el turno desde
`calcularTurnoContable` (`accounting.ts`) y la embebe en `contable` al
sincronizar. El flujo nativo conserva los datos brutos necesarios y nunca
inventa valores.

## Servicio de primer plano

`TurnoForegroundService` mantiene visible el turno activo para favorecer la
continuidad del proceso Android:

- `foregroundServiceType="connectedDevice"` (declarado en el
  `AndroidManifest.xml` del movil).
- Canal de notificacion `turno_activo` con `IMPORTANCE_LOW`, ID `4102`.
- Arranca al `START_TURNO` exitoso (en el `WearCommandWorker.doWork`).
- Se detiene al `END_TURNO` exitoso o al `clearPrepared` cuando coincide el
  `uid`.
- Pide `POST_NOTIFICATIONS` (Android 13+) y `BLUETOOTH_CONNECT` (Android 12+);
  si faltan, hace `stopSelf()` con `START_NOT_STICKY`.

Este servicio no sustituye a Room ni a la proteccion por `operationId`.

## Superficies de solo lectura (Tile y Complicacion)

`TurnoTileService` (cuadricula) y `TurnoComplicationService` (complicacion
de esfera) son consumidores pasivos del ultimo `STATUS` confirmado por el
movil, persistido en `TurnoStatusStore` (SharedPreferences
`turno_status_store`). La Activity y el `MobileResponseService` lo
actualizan; las superficies solo lo leen.

### Tile (`TurnoTileService`)

- `RESOURCES_VERSION = "4"`.
- `freshnessIntervalMillis = 5 * 60 * 1000` (5 min) para que el sistema
  refresque periodicamente.
- Estructura: logo + boton principal segun estado (`Iniciar Turno` /
  `Continuar Turno` / `Turno Pausado`) + boton `Turnos`.
- Acciones del boton: `iniciar_turno`, `continuar`, `turnos`. La accion
  `abrir` abre la app sin disparar nada.
- Tocar un boton abre la app con `EXTRA_ACCION_TILE`; el circuito Wear
  normal (outbox, operationId, sesion) sigue intacto. La tile nunca escribe
  por su cuenta.

### Complicacion (`TurnoComplicationService`)

- Tipos soportados: `MONOCHROMATIC_IMAGE`, `SMALL_IMAGE`, `SHORT_TEXT`.
- Muestra el logo de la app ("Mi Turno") sin texto de estado ni hora, con
  version ambiente segura para burn-in (trazos blancos finos).
- Refresco limitado a 1 por minuto (`MIN_COMPLICATION_UPDATE_MS = 60_000L`)
  para respetar la recomendacion oficial de no spammear `requestUpdate`.

## Casos esperados

### Reloj y movil comunicados

```text
Accion en reloj
  -> Room actualizado
  -> ACK recibido
  -> reloj confirma
  -> app movil hidrata cuando esta activa
  -> Firestore sincroniza con la sesion actual
```

### Movil bloqueado o app cerrada

```text
Accion en reloj
  -> servicio nativo del movil procesa
  -> Room actualizado
  -> ACK recibido por el reloj
  -> Firestore queda pendiente hasta que la app movil ejecute su sincronizacion
```

### Sin comunicacion con el movil

```text
Accion en reloj
  -> queda en outbox (publishedAt=0)
  -> OutboxWorker reintenta con backoff exponencial
  -> al reenviar, marca publishedAt=now
  -> no se muestra como confirmada (pendiente)
```

### Cambio o cierre de usuario

```text
teardown de la sesion anterior
  -> se limpia la preparacion Wear anterior
  -> los comandos con otra sesion son rechazados (USER_SESSION_MISMATCH)
  -> la nueva sesion utiliza su propia base Room
```

## Invariantes obligatorias

Estas reglas no deben romperse en futuras modificaciones:

1. El reloj nunca escribe directamente en Firestore.
2. Un comando critico no desaparece del outbox sin respuesta terminal.
3. Un mismo `operationId` nunca se aplica dos veces (PK Room + `setUrgent`
   DataClient + respuesta deduplicada en `shownResponseOpIds`).
4. Room se separa por UID (DB por `sha256(uid)[:32]`).
5. Un comando de otra sesion se rechaza (`USER_SESSION_MISMATCH`).
6. `use-firestore-sync` solo escribe bajo el UID autenticado y cargado.
7. La app movil debe poder recuperar desde Room cambios hechos con el WebView
   cerrado.
8. Firestore no debe considerarse actualizado hasta que la app movil ejecute la
   sincronizacion.
9. El reloj no debe inventar estado ni confirmar acciones pendientes. Todo
   cambio optimista se muestra marcado como pendiente hasta el ACK/`STATUS` y
   se reconcilia o revierte segun la respuesta (ver «Presentacion de estado
   optimista»).
10. La integracion Wear no debe modificar como efecto secundario
    `src/logic/accounting.ts` ni `src/logic/week-logic.ts`.
11. La contabilidad de un turno (`totalTaximetro`, `miGanancia`,
    `totalADescontar`, `totalADar`) se calcula en `accounting.ts` y se
    persiste en Room. Si falta en el JSON que llega al reloj, este debe
    mostrar el turno como «Pendiente», nunca inventar el numero.

## Verificacion obligatoria

Antes de considerar terminada una modificacion relacionada con Wear:

### Automatizada

- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `./gradlew :app:testDebugUnitTest`
- `./gradlew :app:assembleDebug`
- `./gradlew :wear:assembleDebug`
- `./gradlew :app:lintDebug`
- `./gradlew :wear:lintDebug`

### Tests especificos del flujo Wear

- `src/__tests__/android-wear-bridge.test.ts` — comandos y respuestas
  nativas (`WatchCommand`, `WatchResponse`, serializacion JSON).
- `src/__tests__/watch-bridge.test.ts` — hidratacion, snapshot canonico,
  deduplicacion, listeners.
- `src/__tests__/watch-command-processor.test.ts` — procesador puro
  (`processWatchCommand` y auxiliares: `computeWatchTotals`,
  `buildWatchEntradas`, `buildWatchTurnos`).
- `src/__tests__/pending-sync.test.ts` — marcas de pendiente y
  `PENDING_SYNC_CHANGED_EVENT`.

### En dispositivos reales

1. Ejecutar una accion con el movil desbloqueado y la app abierta.
2. Ejecutar una accion con el movil bloqueado.
3. Ejecutar una accion con la app movil cerrada desde recientes.
4. Perder comunicacion, crear un pendiente y recuperarla.
5. Reenviar el mismo `operationId` y comprobar que no duplica.
6. Cambiar de usuario y comprobar que no aparecen datos del usuario anterior.
7. Terminar un turno desde el reloj y comprobar Room, app movil y Firestore.
8. Editar un turno cerrado desde el reloj y comprobar que la contabilidad
   aparece como «Pendiente» hasta que la app la recalcula.

Las pruebas automatizadas verifican la implementacion y las reglas conocidas.
La prueba fisica es necesaria para confirmar el comportamiento real del
fabricante, Google Play Services, Bluetooth, Wi-Fi, Doze y restricciones de
segundo plano.

## Archivos responsables

### Reloj (`android/wear/src/main/java/com/mijornada/app/`)

- `WearMainActivity.kt` — `ComponentActivity` Compose con el enum
  `ScreenState` (13 pantallas: `NO_CONNECTED`, `NO_ACTIVE_TURNO`,
  `ACTIVE_TURNO`, `TURNOS`, `TURNO_SUMMARY`, `EDIT_TURNO_DATOS`,
  `ADD_ENTRY`, `EDIT_ENTRY`, `CONFIRM_START_TURNO`, `CONFIRM_PAUSE_TURNO`,
  `CONFIRM_DELETE`, `END_TURNO`, `PAUSED_MENU`). Procesa respuestas en vivo
  via listener de `SharedPreferences`, aplica feedback (toast/vibracion),
  mantiene `pendingOpsCount` y aplica los `applyOptimistic*` cuando un
  comando sale.
- `WatchOutbox.kt` — Outbox persistente (SharedPreferences
  `watch_outbox`, JSON). Guarda comandos con `publishedAt=0`; expone
  `unpublishedCommands` y `commandsFromOtherSessions`.
- `OutboxWorker.kt` — `CoroutineWorker` con exponential backoff. Reenvia
  `unpublishedCommands` por `DataClient` con `setUrgent()` y marca
  `publishedAt=now` al confirmar.
- `MobileResponseService.kt` — `WearableListenerService` que escucha
  `/watch-ack/<operationId>`, `/turno/state` y `/watch-response` (Message).
  Encola respuestas en `WearConstants.Response`, retira del outbox las
  terminales, deduplica con `handledTerminalOperationIds` (90d TTL en
  SharedPreferences) y dispara notificaciones en background.
- `WearConstants.kt` — `HANDLED_OPERATION_LIMIT = 128`,
  `isTerminalResponse(type, code)`, y el object `Response` con la cola
  persistente de respuestas.
- `WearResponseNotification.kt` — Notificaciones en background (canal
  `watch_responses`, `IMPORTANCE_HIGH`, vibracion, abre la app al tap).
- `TurnoStatusStore.kt` — Persistencia del ultimo `STATUS` confirmado
  para alimentar tile y complicacion; pide refresh con un suelo de
  60 segundos.
- `TurnoTileService.kt` — Tile cuadricula con logo + botones
  (`iniciar_turno`, `continuar`, `turnos`, `abrir`).
- `TurnoComplicationService.kt` — Complicacion de esfera
  (`MONOCHROMATIC_IMAGE`, `SMALL_IMAGE`, `SHORT_TEXT`) con version
  ambiente burn-in safe.
- `screens/` — Composables de cada pantalla (`ActiveTurnoScreen`,
  `NoActiveTurnoScreen`, `NoConnectedScreen`, `ConfirmStartTurnoScreen`,
  `ConfirmPauseTurnoScreen`, `ConfirmDeleteScreen`, `AddEntryScreen`,
  `EndTurnoScreen`, `EditTurnoDatosScreen`, `TurnosScreen`,
  `TurnoSummaryScreen`, `NumericKeypad`, `CategoriaIcons`).

### Movil nativo (`android/app/src/main/java/com/mijornada/app/`)

- `WearListenerService.java` — Solo `onDataChanged` para
  `/watch-command/<operationId>`; encola `WearCommandWorker` por cada
  comando. **No** implementa `onMessageReceived` ni
  `onCapabilityChanged` aunque el manifest los declara (filtra por path
  `/watch-command/`).
- `WearOsBridgePlugin.java` — Plugin Capacitor. Metodos:
  `setPrepared({uid})`, `clearPrepared({uid})`, `sendResponse({response,
  nodeId?})`, `getNativeState()`, `syncState({state})`. Publica ACKs
  persistentes por DataClient (`/watch-ack/<id>`, `setUrgent()`) y
  respuestas rapidas por MessageClient (`/watch-response`). El receiver
  de `WatchStateChangeNotifier` dispara `notifyListeners("onNativeStateChanged")`
  para que la TS rehidrate.
- `TurnoForegroundService.kt` — `foregroundServiceType=connectedDevice`,
  canal `turno_activo`, ID 4102. Arranca/para segun el worker.
- `MainActivity.java` — Launcher activity (Capacitor, no del flujo Wear).
- `watch/` (subpaquete Kotlin dedicado a Wear):
  - `WatchCommandWorker.kt` — `CoroutineWorker` expedited que enruta a
    `WatchNativeCommandHandler.handleCommand` (writes) o
    `handleReadCommand` (reads), publica ACK por DataClient y respuesta
    rapida por MessageClient, y dispara `TurnoForegroundService.start/stop`
    segun el comando.
  - `WatchNativeCommandHandler.kt` — Despacho de comandos. Valida sesion
    (`USER_SESSION_MISMATCH`) y consistencia del `operationId`
    (`OPERATION_ID_MISMATCH`); delega en `WatchRepository`.
  - `WatchRepository.kt` — Transacciones Room. `applyCommand` inserta
    `OperationEntity` (PENDING), procesa, persiste, finaliza y poda con
    90 dias. `replaceAppState` rechaza snapshots mas viejos que el estado
    nativo (`StaleWatchSnapshotException`).
  - `WatchDatabaseProvider.kt` — DB por `sha256(uid)[:32]`, con migracion
    del legacy `mi-turno-watch.db` y migraciones Room 1_2 a 5_6.
  - `WatchUserSession.kt` — `prepare/getUid/getSessionId/clearIfMatches`
    sobre SharedPreferences `watch_user_session`.
  - `WatchDatabase.kt` — `RoomDatabase` version 6 con entidades
    `OperationEntity`, `CurrentTurnoEntity`, `TurnoEntity` y las 5
    migraciones (incluye las columnas de contabilidad en 4_5 y de
    `resultType`/`responseJson` en 5_6).
  - `WatchDaos.kt` — `OperationDao` (insert/get/finalize/prune/exists),
    `CurrentTurnoDao`, `TurnoDao`.
  - `WatchEntities.kt` — Las 3 entidades Room.
  - `WatchModels.kt` — `WatchEntry`, `WatchCurrentState`, `WatchTurno`
    (con `totalTaximetro/miGanancia/totalADescontar/totalADar` nuleables),
    `WatchProcessorState`, `WatchProcessorResult`, `WatchAppSnapshot`,
    `WatchResponse` (sealed), `WatchCommand` (sealed con sus 9 tipos).
  - `WatchCommandJson.kt` — Parser del comando con
    `MalformedJsonException` / `InvalidPayloadException` /
    `InvalidCommandException`. Lista cerrada de `entryType`.
  - `WatchResponseJson.kt` — Serializa `WatchResponse` a JSON y
    `statusToJson` / `turnosStatusToJson` (limita a 30 turnos y marca
    `contablePendiente` si falta contabilidad).
  - `WatchStateJson.kt` — `stateToJson` (sin contable, solo datos brutos)
    y `snapshotFromJson` (lee el subobjeto `contable` por turno).
  - `WatchStateDataPublisher.kt` — Publica `/turno/state` tras cada
    cambio de Room (con `setUrgent`).
  - `WatchStateChangeNotifier.kt` — Broadcast interno
    (`com.mijornada.app.WATCH_STATE_CHANGED`) que la TS escucha como
    `onNativeStateChanged`.

### Capa TypeScript (`src/`)

- `services/watch-bridge.ts` — Bridge TS↔nativo. `setupWatchBridge(uid)` y
  `teardownWatchBridge(uid)`. Serializa el snapshot canonico (con
  `contable` por turno calculado con `calcularTurnoContable`); hidrata
  desde `getNativeState()`; deduplica `processedOperationIds` a 512.
- `hooks/use-firestore-sync.ts` — Suscripciones Firestore, montaje del
  bridge Wear, gestion de `pending-sync`, espera de `waitForPendingWrites`
  para limpiar marcas huerfanas.
- `services/pending-sync.ts` — Marcas por area (`current`, `settings`,
  `turnos`, `reservations`, `notes`, `weekOverrides`,
  `processedOperationIds`) + evento `PENDING_SYNC_CHANGED_EVENT`.
- `shared/watch-commands.ts` — Tipos del protocolo
  (`WatchCommand`/`WatchCommandResponse` y auxiliares). El `STATUS`
  incluye `userSessionId` opcional.
- `logic/watch-command-processor.ts` — Procesador puro
  (`processWatchCommand`, `computeWatchTotals`, `buildWatchEntradas`,
  `buildWatchTurnos`). Maneja `EDIT_TURNO` recomputando totales por
  categoria; el contable derivado se rellena via `syncState` y Room.
- `logic/accounting.ts` — **PROTEGIDO.** Implementa
  `calcularTurnoContable` (usado por la TS) y `buildTurnoConfigFromSettings`.
- `logic/turnos.ts` — `mergeTurnos` y `sortTurnosByDateDesc` (usados por
  el bridge para fusionar historial nativo con el del store).
- `services/firestore-sync.ts` — Primitivas de lectura/escritura Firestore
  (`userMetaDocRef`, `userSubcollectionRef`, `saveUserDoc`,
  `syncSubcollection`, `userHasFirestoreData`).

## Limites conocidos

- La sincronizacion Room hacia Firestore necesita que la parte app movil
  ejecute `watch-bridge` y `use-firestore-sync`.
- Android y el fabricante pueden retrasar entregas o trabajos en segundo
  plano. El `TurnoForegroundService` mitiga esto parcialmente.
- La comunicacion real depende de Google Play Services y del enlace
  disponible entre ambos dispositivos.
- La deduplicacion por PK Room es la unica garantia dura contra
  duplicados; la ventana de 512 ids es solo para la lista que ve la UI.
- La contabilidad precalculada en `accounting.ts` es la unica fuente de
  verdad para `totalTaximetro/miGanancia/totalADescontar/totalADar`. Si
  la app se cierra entre el `END_TURNO` y la primera sincronizacion
  `syncState`, el reloj mostrara el turno como «Pendiente» hasta que la
  TS lo rellene.
- El manifest del movil declara `MESSAGE_RECEIVED` y `CAPABILITY_CHANGED`
  en `WearListenerService` pero solo esta implementado `onDataChanged`. La
  respuesta rapida `MessageClient` la envia el movil al reloj
  (`/watch-response`), no al reves.
- Ninguna prueba automatizada sustituye la validacion fisica completa.
