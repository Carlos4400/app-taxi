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

El reloj no escribe directamente en Firestore. Los comandos se procesan y
persisten primero en el movil.

## Fuente de verdad por responsabilidad

| Responsabilidad | Fuente de verdad |
|---|---|
| Comando pendiente de recibir confirmacion | Outbox persistente del reloj |
| Estado operativo recibido desde el reloj | Room nativo del movil |
| Estado mostrado y editado por la app movil | Store de la app, hidratado desde Room y Firestore |
| Sincronizacion remota entre dispositivos | `use-firestore-sync` con la sesion Firebase Auth actual |
| Calculos contables | Logica TypeScript existente de la app movil |

Room es la fuente nativa del flujo Wear. Firestore no sustituye a Room para
procesar comandos del reloj.

## Flujo principal

```text
Reloj
  -> genera un operationId unico
  -> asocia el comando a la sesion de usuario confirmada por el movil
  -> guarda el comando critico en su outbox
  -> publica /watch-command/<operationId> mediante DataClient

Movil nativo
  -> WearListenerService recibe el comando
  -> WorkManager ejecuta WearCommandWorker
  -> valida sesion, operationId, JSON y reglas del comando
  -> WatchRepository aplica el cambio en una transaccion Room
  -> publica /watch-ack/<operationId>
  -> publica /turno/state
  -> notifica el cambio a la app movil si esta activa

App movil
  -> watch-bridge lee Room
  -> hidrata y fusiona el store
  -> use-firestore-sync sincroniza con Firestore
  -> solo escribe bajo la sesion Firebase Auth actual
```

## Comportamiento con la app movil cerrada o el movil bloqueado

Los comandos del reloj no dependen del WebView de Capacitor para guardarse.

Si la app movil esta cerrada, esta en segundo plano o el movil esta bloqueado:

1. Google Play Services entrega el `DataItem` al movil cuando existe
   comunicacion.
2. `WearListenerService` recibe el comando.
3. `WearCommandWorker` lo procesa.
4. El cambio se guarda en Room.
5. El movil responde con ACK al reloj.

En esta situacion, el cambio queda guardado localmente en Room aunque la parte
React de la app no este ejecutandose.

Firestore no se actualiza directamente desde Room. La sincronizacion con
Firestore ocurre cuando la app movil vuelve a ejecutar `watch-bridge` y
`use-firestore-sync` bajo una sesion valida.

## Comportamiento sin comunicacion entre reloj y movil

Un comando critico no se considera guardado definitivamente hasta recibir una
respuesta terminal del movil.

Si no hay comunicacion:

1. El reloj conserva el comando en `WatchOutbox`.
2. La interfaz debe indicar que la operacion sigue pendiente o que el movil no
   esta disponible.
3. `OutboxWorker` reintenta el mismo comando solo hasta que `putDataItem`
   confirma la publicacion local.
4. Tras la publicacion local, DataClient conserva el `DataItem` y lo sincroniza
   al recuperar la comunicacion, sin retransmisiones periodicas de la app.
5. Todos los reintentos utilizan el mismo `operationId`.
6. Al recuperar la comunicacion, el movil procesa el comando una sola vez.

WorkManager es el unico responsable del backoff entre reintentos. `WatchOutbox`
conserva el comando pendiente hasta recibir una respuesta terminal, pero no
mantiene un segundo temporizador ni elimina comandos por numero de intentos.
El reloj conserva ademas el comando ya publicado en el outbox hasta recibir una
respuesta terminal.

El reloj conserva pendientes de transporte. No aplica por su cuenta cambios de
negocio ni escribe en Firestore.

## Proteccion contra duplicados

Cada comando critico lleva un `operationId` no vacio y estable.

Room registra los identificadores ya procesados. Al recibir un comando:

```text
operationId nuevo
  -> validar
  -> aplicar una vez
  -> guardar operationId
  -> responder OK

operationId ya registrado
  -> no volver a aplicar
  -> responder exactamente el resultado original, incluido ERROR
```

El ACK se publica despues de guardar en Room el resultado `APPLIED` o
`REJECTED`. El worker movil no termina hasta que `putDataItem` confirma la
publicacion local del ACK. Si el worker se repite, Room devuelve exactamente el
resultado original sin duplicar datos.

Los resultados terminales se conservan en Room durante 90 dias y se podan por
fecha; nunca se poda una operacion `PENDING`. La lista de estado enviada a la
interfaz puede limitarse a los 512 identificadores aplicados mas recientes sin
reducir la ventana real de deduplicacion de Room.

## Aislamiento entre usuarios

La integracion Wear debe impedir que datos de dos usuarios se mezclen.

### Preparacion de sesion

Cuando `use-firestore-sync` termina de cargar los datos de un usuario:

1. Llama a `setupWatchBridge(uid)`.
2. El plugin nativo prepara `WatchUserSession`.
3. Se genera o reutiliza un `sessionId` asociado a ese `uid`.
4. Room abre una base independiente cuyo nombre deriva del `uid`.

### Validacion de comandos

Los comandos criticos del reloj incluyen `userSessionId`.

El movil rechaza un comando si su `userSessionId` no coincide con la sesion
preparada, respondiendo `USER_SESSION_MISMATCH`.

El reloj no crea ni guarda un comando critico nuevo mientras desconoce la sesion
confirmada por el movil.

### Escritura en Firestore

`use-firestore-sync` solo permite escribir cuando se cumplen todas estas
condiciones:

- Los datos terminaron de cargarse.
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
- `EDIT_TURNO` (edicion completa de un turno cerrado: dinero, km y entradas/notas; anula su contabilidad guardada hasta que la app movil la recalcula)

Solo puede existir una operacion critica pendiente a la vez desde la interfaz
actual del reloj. Esto evita encadenar acciones basadas en un estado aun no
confirmado por el movil.

Los comandos de lectura, como `GET_STATUS` y `GET_TURNOS`, no modifican datos de
negocio.

## Respuestas y cierre del outbox

El movil publica respuestas persistentes en:

```text
/watch-ack/<operationId>
```

Tambien puede utilizar `MessageClient` como respuesta rapida, pero la
confirmacion persistente es el ACK de DataClient.

El reloj elimina un comando del outbox cuando recibe:

- `OK`
- `DUPLICATE_IGNORED`
- Un `ERROR` terminal

Los errores `USER_NOT_PREPARED` y `APP_NOT_READY` no son terminales. El comando
se conserva para poder reintentarlo.

Las respuestas se escriben de forma sincronica en una cola persistente antes de
retirar el comando del outbox. La interfaz reconoce cada respuesta solo despues
de procesarla. Si la interfaz no esta visible, una respuesta terminal genera una
notificacion local con identificador estable y vibracion.

## Estado movil hacia reloj

Tras aplicar cambios, el movil publica el estado en:

```text
/turno/state
```

El estado permite que el reloj muestre la informacion confirmada por el movil:

- Turno activo o inactivo.
- Fecha y hora de inicio.
- Pausa activa.
- Inicio de la pausa.
- Minutos pausados acumulados.
- Entradas y totales.
- Identificador de sesion de usuario.

El historial se solicita de forma separada mediante `GET_TURNOS` y se responde
con `TURNOS_STATUS`.

El reloj no debe presentar un cambio pendiente como confirmado antes de recibir
el ACK o el estado actualizado.

## Presentacion de estado optimista (pendiente vs confirmado)

El reloj aplica los cambios criticos de forma optimista para responder al
instante (iniciar, pausar, reanudar, anadir, editar y borrar se reflejan en la
UI antes de recibir el ACK). Esto es deseable: el transporte Bluetooth, Doze y
el segundo plano introducen latencia que no debe penalizar la interaccion. Por
eso la politica adoptada es optimista, no "esperar al ACK para mostrar".

Para no contradecir la invariante de "no confirmar lo pendiente", la
presentacion optimista debe cumplir tres reglas:

1. Mostrar ya, pero marcado como pendiente. Cada cambio aplicado de forma
   optimista se muestra con un indicador de pendiente sobre la propia accion o
   entrada, no solo en el contador global. El usuario debe poder distinguir que
   ese dato concreto aun no esta confirmado por el movil.
2. Reconciliar al recibir respuesta. Al llegar el ACK (`OK`) o el `STATUS`
   actualizado, se retira la marca y el dato queda confirmado.
   `DUPLICATE_IGNORED` se trata igual que confirmado.
3. Revertir ante error terminal. Ante un `ERROR` terminal, el cambio optimista
   se deshace o se re-sincroniza desde el `STATUS`/`GET_TURNOS` real, y se avisa
   al usuario. Los errores no terminales (`USER_NOT_PREPARED`, `APP_NOT_READY`)
   mantienen el dato como pendiente; no lo revierten.

Senales de estado disponibles para implementar esta politica:

- `pendingOpsCount` y `SyncIndicator`: numero de operaciones pendientes (vista
  global). Punto de partida, pero insuficiente por si solo: no indica que dato
  concreto esta pendiente.
- `contablePendiente` (turnos): ya marca un turno cuyo recalculo contable no se
  ha confirmado. Es el modelo a replicar a nivel de accion y de entrada.

El flujo de edicion de turno cerrado (`EDIT_TURNO`) es el ejemplo correcto: ya
espera el ACK antes de volver al resumen y marca su contabilidad como pendiente.
El resto de acciones deben converger al mismo criterio: optimista en la UI,
pendiente hasta el ACK, reconciliado o revertido segun la respuesta.

La marca de pendiente nunca altera los datos brutos enviados al movil ni la
contabilidad, que se sigue calculando en TypeScript al hidratar.

## Restauracion tras recreacion o cierre del proceso

La Activity del reloj puede recrearse por un cambio de configuracion o ser
eliminada por Android en segundo plano. El estado de UI (pantalla actual,
seleccion, borradores de formulario) vive en memoria y se perderia.

Politica:

1. Estado critico: se reconstruye siempre. Los comandos pendientes viven en
   `WatchOutbox` (persistente) y se reintentan sin duplicar por `operationId`;
   los datos del turno se rehidratan del `STATUS` del movil al volver a primer
   plano. No requiere codigo de UI adicional.
2. Navegacion: `currentScreen` y la categoria seleccionada se guardan en
   `onSaveInstanceState` y se restauran en `onCreate`. Las pantallas que dependen
   de un objeto no serializado (`editingEntry`, `selectedTurno`) caen a un
   destino seguro por sus guards existentes, en lugar de restaurarse a medias.
3. Borrador: el importe y la nota en curso usan `rememberSaveable`, por lo que
   sobreviven a la recreacion si la pantalla se restaura.

Una accion entrante desde la tile tiene prioridad sobre la pantalla restaurada.
Nunca se restaura un estado que pueda reaplicar un comando ya enviado: la
reactivacion pasa siempre por la outbox con su `operationId`.

## Hidratacion de Room en la app movil

Cuando la app movil esta activa y preparada:

1. `watch-bridge` llama a `getNativeState()`.
2. Lee el estado de Room correspondiente al UID preparado.
3. Fusiona los turnos nativos con el historial del store sin duplicarlos.
4. Fusiona los `processedOperationIds`.
5. Actualiza el turno actual del store.

Los cambios del store se reflejan tambien hacia Room mediante `syncState()`.

La comparacion de snapshots es estable y recursiva para evitar sincronizaciones
innecesarias sin ignorar cambios internos.

## Sincronizacion con Firestore

`use-firestore-sync` es el unico canal de esta arquitectura que escribe los
cambios Wear en Firestore.

Cuando `watch-bridge` hidrata el store:

- Un turno activo actualizado provoca la escritura del documento `current`.
- Un turno finalizado incorporado al historial provoca la sincronizacion de la
  subcoleccion `turnos`.
- Los `processedOperationIds` tambien se sincronizan.

La escritura utiliza siempre el UID autenticado y cargado actualmente.

Si no hay red:

1. La app conserva los datos localmente.
2. Marca la seccion correspondiente como pendiente.
3. Reintenta la sincronizacion habitual cuando vuelve la conectividad.

## Pausar y reanudar

La pausa forma parte del estado persistido:

- `isPaused`
- `pauseStartTime`
- `totalPausedMinutes`

Al reanudar, se acumula el tiempo transcurrido desde `pauseStartTime`.

Si el turno termina estando pausado, el tiempo de la pausa abierta se incorpora
antes de cerrar el turno.

El tiempo trabajado mostrado debe descontar los minutos pausados.

## Finalizacion de turno

`END_TURNO` debe:

1. Validar que existe un turno activo.
2. Validar los datos requeridos del cierre.
3. Incorporar la pausa abierta si existe.
4. Crear el turno cerrado en Room.
5. Vaciar el turno actual en Room.
6. Registrar el `operationId`.
7. Publicar ACK y estado actualizado.
8. Detener el servicio de primer plano del turno.

La contabilidad final sigue calculandose en TypeScript al hidratar el turno en
la app movil. El flujo nativo conserva los datos brutos necesarios.

## Servicio de primer plano

`TurnoForegroundService` mantiene visible el turno activo para favorecer la
continuidad del proceso Android:

- Arranca al iniciar un turno.
- Se mantiene durante el turno activo.
- Se detiene al terminar el turno o limpiar la sesion preparada.

Este servicio no sustituye a Room ni a la proteccion por `operationId`.

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
  -> queda en outbox
  -> se reintenta con el mismo operationId
  -> no se muestra como confirmada
```

### Cambio o cierre de usuario

```text
teardown de la sesion anterior
  -> se limpia la preparacion Wear anterior
  -> los comandos con otra sesion son rechazados
  -> la nueva sesion utiliza su propia base Room
```

## Invariantes obligatorias

Estas reglas no deben romperse en futuras modificaciones:

1. El reloj nunca escribe directamente en Firestore.
2. Un comando critico no desaparece del outbox sin respuesta terminal.
3. Un mismo `operationId` nunca se aplica dos veces.
4. Room se separa por UID.
5. Un comando de otra sesion se rechaza.
6. `use-firestore-sync` solo escribe bajo el UID autenticado y cargado.
7. La app movil debe poder recuperar desde Room cambios hechos con el WebView
   cerrado.
8. Firestore no debe considerarse actualizado hasta que la app movil ejecute la
   sincronizacion.
9. El reloj no debe inventar estado ni confirmar acciones pendientes. Todo
   cambio optimista se muestra marcado como pendiente hasta el ACK/`STATUS` y se
   reconcilia o revierte segun la respuesta (ver «Presentacion de estado
   optimista»).
10. La integracion Wear no debe modificar como efecto secundario
    `src/logic/accounting.ts` ni `src/logic/week-logic.ts`.

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

### En dispositivos reales

1. Ejecutar una accion con el movil desbloqueado y la app abierta.
2. Ejecutar una accion con el movil bloqueado.
3. Ejecutar una accion con la app movil cerrada desde recientes.
4. Perder comunicacion, crear un pendiente y recuperarla.
5. Reenviar el mismo `operationId` y comprobar que no duplica.
6. Cambiar de usuario y comprobar que no aparecen datos del usuario anterior.
7. Terminar un turno desde el reloj y comprobar Room, app movil y Firestore.

Las pruebas automatizadas verifican la implementacion y las reglas conocidas.
La prueba fisica es necesaria para confirmar el comportamiento real del
fabricante, Google Play Services, Bluetooth, Wi-Fi, Doze y restricciones de
segundo plano.

## Archivos responsables

### Reloj

- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/src/main/java/com/mijornada/app/TurnoTileService.kt` (tile de solo lectura)
- `android/wear/src/main/java/com/mijornada/app/TurnoComplicationService.kt` (complicacion de solo lectura)
- `android/wear/src/main/java/com/mijornada/app/TurnoStatusStore.kt` (ultimo STATUS para tile/complicacion)
- `android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt`
- `android/wear/src/main/java/com/mijornada/app/OutboxWorker.kt`
- `android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt`

### Movil nativo

- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchNativeCommandHandler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchUserSession.kt`

### App movil

- `src/services/watch-bridge.ts`
- `src/hooks/use-firestore-sync.ts`
- `src/services/pending-sync.ts`
- `src/shared/watch-commands.ts`

## Limites conocidos

- La sincronizacion Room hacia Firestore necesita que la parte app movil ejecute
  `watch-bridge` y `use-firestore-sync`.
- Android y el fabricante pueden retrasar entregas o trabajos en segundo plano.
- La comunicacion real depende de Google Play Services y del enlace disponible
  entre ambos dispositivos.
- Ninguna prueba automatizada sustituye la validacion fisica completa.
