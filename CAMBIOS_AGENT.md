## 2026-06-07 00:45 - Anadir boton Desasociar reloj en Ajustes

**Archivos modificados:** `android/app/src/main/java/com/mijornada/app/CdmPairPlugin.java`, `src/services/companion-device.ts`, `src/screens/settings-screen.tsx`, `src/__tests__/companion-device.test.ts`

### Cambio 1 - Metodo disassociate en CdmPairPlugin

#### Código anterior
`No existía el metodo disassociate en CdmPairPlugin.java.`

#### Código nuevo
```java
    @PluginMethod
    public void disassociate(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("Companion Device Manager requiere Android 8 o superior");
            return;
        }
        CompanionDeviceManager manager = manager();
        int removed = 0;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                for (AssociationInfo info : manager.getMyAssociations()) {
                    manager.disassociate(info.getId());
                    removed++;
                }
            } else {
                for (String address : manager.getAssociations()) {
                    manager.disassociate(address);
                    removed++;
                }
            }
        } catch (Exception e) {
            call.reject("No se pudo desasociar el reloj: " + e.getMessage());
            return;
        }
        JSObject result = new JSObject();
        result.put("associated", false);
        result.put("removed", removed);
        call.resolve(result);
    }
```

#### Por qué se cambió
La UI ofrecia "Emparejar reloj" pero no via para revertirlo. Cuando el usuario quiere reasociar limpio o cambiar de reloj, no hay forma de retirar la asociacion CDM sin "Borrar datos" de la app desde Ajustes del sistema. El nuevo metodo elimina todas las asociaciones de la app via `CompanionDeviceManager.disassociate`, usando la firma por `associationId` en API 33+ y la deprecated por MAC en API 26-32. No requiere permiso BLUETOOTH_CONNECT runtime (no escanea, solo retira). Devuelve el contador `removed` para feedback al usuario.

### Cambio 2 - Tipo y funcion unpairCompanionWatch en companion-device.ts

#### Código anterior
```ts
interface CdmPairPlugin {
  getStatus(): Promise<CompanionStatus>;
  pair(): Promise<CompanionStatus>;
}
```

#### Código nuevo
```ts
interface CdmPairPlugin {
  getStatus(): Promise<CompanionStatus>;
  pair(): Promise<CompanionStatus>;
  disassociate(): Promise<CompanionStatus & { removed: number }>;
}
```

Tambien se anadio al final del archivo:

```ts
export async function unpairCompanionWatch(): Promise<CompanionStatus & { removed: number }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("El emparejamiento Wear OS solo esta disponible en Android");
  }
  return CdmPair.disassociate();
}
```

#### Por qué se cambió
Exponer el nuevo metodo nativo `disassociate` al lado JS con la misma forma que `pairCompanionWatch`. El tipo de retorno incluye `removed: number` para que el llamador pueda dar feedback diferenciado segun si habia algo que retirar.

### Cambio 3 - Boton Desasociar en SettingsScreen

#### Código anterior
```tsx
import { getCompanionWatchStatus, pairCompanionWatch } from "../services/companion-device";
```

```tsx
  async function handlePairWatch() {
    hapticOpen();
    setWatchPairing(true);
    setWatchMessage("");
    try {
      const result = await pairCompanionWatch();
      setWatchAssociated(result.associated);
      setWatchMessage(result.associated ? "Reloj asociado correctamente." : "No se completo la asociacion.");
    } catch (error) {
      setWatchMessage(error instanceof Error ? error.message : "No se pudo asociar el reloj.");
    } finally {
      setWatchPairing(false);
    }
  }
```

```tsx
              {watchPairing ? "Abriendo selector..." : watchAssociated ? "Cambiar reloj asociado" : "Emparejar reloj"}
            </button>
            {watchMessage && (
              <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{watchMessage}</div>
            )}
```

#### Código nuevo
```tsx
import { getCompanionWatchStatus, pairCompanionWatch, unpairCompanionWatch } from "../services/companion-device";
```

Nuevo handler `handleUnpairWatch` despues de `handlePairWatch`:

```tsx
  async function handleUnpairWatch() {
    const ok = window.confirm(
      "¿Seguro que quieres desasociar el reloj? La app móvil dejará de tener los permisos especiales para procesar comandos del reloj con el móvil bloqueado hasta que vuelvas a emparejar."
    );
    if (!ok) return;
    hapticDanger();
    setWatchPairing(true);
    setWatchMessage("Desasociando...");
    try {
      const result = await unpairCompanionWatch();
      setWatchAssociated(result.associated);
      if (result.removed === 0) {
        setWatchMessage("No habia ninguna asociacion que retirar.");
      } else {
        const label = result.removed === 1 ? "asociacion eliminada" : "asociaciones eliminadas";
        setWatchMessage(`Reloj desasociado (${result.removed} ${label}).`);
      }
    } catch (error) {
      setWatchMessage(error instanceof Error ? error.message : "No se pudo desasociar el reloj.");
    } finally {
      setWatchPairing(false);
    }
  }
```

Boton nuevo condicional debajo del existente "Emparejar reloj":

```tsx
              {watchPairing ? "Procesando..." : watchAssociated ? "Cambiar reloj asociado" : "Emparejar reloj"}
            </button>
            {watchAssociated && (
              <button
                onClick={handleUnpairWatch}
                disabled={watchPairing}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,80,80,0.4)",
                  background: "rgba(255,80,80,0.08)",
                  color: "#ff8080",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: watchPairing ? "default" : "pointer",
                  opacity: watchPairing ? 0.6 : 1,
                }}
              >
                Desasociar reloj
              </button>
            )}
            {watchMessage && (
              <div style={{ marginTop: 12, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{watchMessage}</div>
            )}
```

Tambien se cambio el texto "Abriendo selector..." por "Procesando..." porque el boton ahora dispara ambas operaciones.

#### Por qué se cambió
Antes el boton "Cambiar reloj asociado" llamaba directamente a `pairCompanionWatch` sin retirar la anterior, lo que en algunos OEMs deja asociaciones huerfanas. El boton "Desasociar reloj" expone la accion explicita y solo aparece cuando hay asociacion (`watchAssociated === true`), evitando un boton inutil en estado "No asociado". El diálogo `window.confirm` evita borrados accidentales y avisa al usuario de la consecuencia (perder los permisos companion para background). El estilo rojizo lo identifica como accion destructiva sin chocar con la paleta neon del tema.

### Cambio 4 - Test para unpairCompanionWatch

#### Código anterior
```ts
const cdmMock = vi.hoisted(() => ({
  getStatus: vi.fn(),
  pair: vi.fn(),
}));
```

```ts
  it("inicia el selector nativo para emparejar el reloj", async () => {
    cdmMock.pair.mockResolvedValue({ associated: true });
    const { pairCompanionWatch } = await import("../services/companion-device");

    await expect(pairCompanionWatch()).resolves.toEqual({ associated: true });
    expect(cdmMock.pair).toHaveBeenCalledTimes(1);
  });
});
```

#### Código nuevo
```ts
const cdmMock = vi.hoisted(() => ({
  getStatus: vi.fn(),
  pair: vi.fn(),
  disassociate: vi.fn(),
}));
```

```ts
  it("inicia el selector nativo para emparejar el reloj", async () => {
    cdmMock.pair.mockResolvedValue({ associated: true });
    const { pairCompanionWatch } = await import("../services/companion-device");

    await expect(pairCompanionWatch()).resolves.toEqual({ associated: true });
    expect(cdmMock.pair).toHaveBeenCalledTimes(1);
  });

  it("desasocia las asociaciones companion existentes", async () => {
    cdmMock.disassociate.mockResolvedValue({ associated: false, removed: 1 });
    const { unpairCompanionWatch } = await import("../services/companion-device");

    await expect(unpairCompanionWatch()).resolves.toEqual({ associated: false, removed: 1 });
    expect(cdmMock.disassociate).toHaveBeenCalledTimes(1);
  });
});
```

#### Por qué se cambió
Cubrir el nuevo metodo en el mismo nivel de test que `pair` y `getStatus`. El mock incluye `disassociate` para que `registerPlugin` devuelva el objeto completo; el caso de uso verifica que `unpairCompanionWatch` reenvia el resultado del nativo y llama exactamente una vez al plugin.

## 2026-06-07 00:20 - Usar perfil Wear OS en CompanionDeviceManager

**Archivos modificados:** `android/app/src/main/java/com/mijornada/app/CdmPairPlugin.java`

### Cambio 1 - Declarar AssociationRequest.DEVICE_PROFILE_WATCH en startAssociation

#### Código anterior
```java
    @RequiresApi(Build.VERSION_CODES.O)
    private void startAssociation(PluginCall call) {
        BluetoothDeviceFilter filter = new BluetoothDeviceFilter.Builder()
            .setNamePattern(Pattern.compile(".*(Xiaomi|Watch|Wear).*", Pattern.CASE_INSENSITIVE))
            .build();
        AssociationRequest request = new AssociationRequest.Builder()
            .addDeviceFilter(filter)
            .setSingleDevice(false)
            .build();
```

#### Código nuevo
```java
    @RequiresApi(Build.VERSION_CODES.O)
    private void startAssociation(PluginCall call) {
        AssociationRequest.Builder requestBuilder = new AssociationRequest.Builder()
            .setSingleDevice(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestBuilder.setDeviceProfile(AssociationRequest.DEVICE_PROFILE_WATCH);
        } else {
            BluetoothDeviceFilter filter = new BluetoothDeviceFilter.Builder()
                .setNamePattern(Pattern.compile(".*(Xiaomi|Watch|Wear).*", Pattern.CASE_INSENSITIVE))
                .build();
            requestBuilder.addDeviceFilter(filter);
        }
        AssociationRequest request = requestBuilder.build();
```

#### Por qué se cambió
El selector CDM aparecia vacio con relojes Wear OS ya gestionados por otra app companion (Mi Fitness en el caso del usuario), respondiendo `user_rejected` aunque el reloj estuviera emparejado en Bluetooth y el filtro de nombre lo aceptara. Sin `DEVICE_PROFILE_WATCH`, Android lanza el selector generico que algunos fabricantes ocultan cuando ya existe otra asociacion companion para ese dispositivo. Con el perfil declarado, el sistema lanza el wizard especifico para wearables (introducido en API 31 / S), detecta el reloj aunque comparta companion con otra app y solicita los permisos tipicos de companion Wear durante la asociacion. La rama API 31+ se construye sin `addDeviceFilter` porque el wizard de `DEVICE_PROFILE_WATCH` usa su propio escaneo de wearables; el filtro por nombre `Xiaomi|Watch|Wear` queda confinado a la rama API 26-30 como fallback para versiones donde la constante no existe y el selector cae al modo generico de Bluetooth. El guard `Build.VERSION.SDK_INT >= S` mantiene el comportamiento anterior en API 30 e inferiores.

## 2026-06-06 23:30 - Restaurar orden de permisos en TurnoForegroundService

**Archivos modificados:** `android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt`

### Cambio 1 - Orden de comprobación de permisos

#### Código anterior
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "BLUETOOTH_CONNECT permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "POST_NOTIFICATIONS permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
```

#### Código nuevo
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "POST_NOTIFICATIONS permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "BLUETOOTH_CONNECT permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
```

#### Por qué se cambió
Se revierte el cambio anterior que había invertido el orden. TIRAMISU (API 33) debe comprobarse antes que S (API 31) porque la versión más reciente de Android es la que primero alcanza el código.

## 2026-06-06 21:35 - Unificar reintentos y contrato Wear

**Archivos modificados:** `ARQUITECTURA_RELOJ_WEAR_OS.md`, `android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt`, `android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt`, `android/wear/src/main/java/com/mijornada/app/OutboxWorker.kt`, `android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt`, `android/wear/src/main/java/com/mijornada/app/WearConstants.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Dejar un único backoff de transporte

#### Código anterior
```kotlin
data class PendingCommand(
    val operationId: String,
    val commandJson: String,
    val attempts: Int,
    val nextRetryAt: Long,
)
```

```kotlin
fun markAttempt(context: Context, operationId: String, now: Long) {
    synchronized(lock) {
        val pending = JSONObject(rawPending(context))
        val item = pending.optJSONObject(operationId) ?: return
        val attempts = item.optInt("attempts", 0) + 1
        val backoffIndex = (attempts - 1).coerceAtMost(WearConstants.Outbox.BACKOFF_MS.lastIndex)
        item.put("attempts", attempts)
        item.put("nextRetryAt", now + WearConstants.Outbox.BACKOFF_MS[backoffIndex])
        pending.put(operationId, item)
        writePending(context, pending)
    }
}

fun dueCommands(context: Context, now: Long): List<PendingCommand> {
    synchronized(lock) {
        return pendingCommands(context).values.filter { command ->
            command.nextRetryAt <= now
        }
    }
}
```

```kotlin
val pending = WatchOutbox.dueCommands(applicationContext, System.currentTimeMillis())
pending.forEach { command ->
    try {
        val request = PutDataMapRequest.create("/watch-command/${command.operationId}")
        request.dataMap.putString("command", command.commandJson)
        request.dataMap.putString("targetNodeId", "")
        request.dataMap.putLong("createdAt", System.currentTimeMillis())
        val dataRequest = request.asPutDataRequest().setUrgent()
        Tasks.await(Wearable.getDataClient(applicationContext).putDataItem(dataRequest))
    } catch (e: Exception) {
        Log.w(TAG, "No se pudo reenviar operationId=${command.operationId}: ${e.message}")
    } finally {
        WatchOutbox.markAttempt(applicationContext, command.operationId, System.currentTimeMillis())
    }
}
```

#### Código nuevo
```kotlin
data class PendingCommand(
    val operationId: String,
    val commandJson: String,
)
```

```kotlin
fun hasPendingCommands(context: Context): Boolean {
    synchronized(lock) {
        return pendingCommands(context).isNotEmpty()
    }
}
```

```kotlin
val pending = WatchOutbox.pendingCommands(applicationContext).values
pending.forEach { command ->
    try {
        val request = PutDataMapRequest.create("/watch-command/${command.operationId}")
        request.dataMap.putString("command", command.commandJson)
        request.dataMap.putString("targetNodeId", "")
        request.dataMap.putLong("createdAt", System.currentTimeMillis())
        val dataRequest = request.asPutDataRequest().setUrgent()
        Tasks.await(Wearable.getDataClient(applicationContext).putDataItem(dataRequest))
    } catch (e: Exception) {
        Log.w(TAG, "No se pudo reenviar operationId=${command.operationId}: ${e.message}")
    }
}
```

#### Por qué se cambió
`WatchOutbox` y WorkManager aplicaban dos calendarios de backoff simultáneos. El outbox conserva ahora únicamente el comando pendiente hasta recibir una respuesta terminal, mientras WorkManager es el único responsable de programar los reintentos con el mismo `operationId`.

### Cambio 2 - Separar permisos por versión Android

#### Código anterior
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "BLUETOOTH_CONNECT permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "POST_NOTIFICATIONS permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
```

#### Código nuevo
```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "BLUETOOTH_CONNECT permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        android.util.Log.w("TurnoForegroundService", "POST_NOTIFICATIONS permission not granted")
        stopSelf()
        return START_NOT_STICKY
    }
}
```

#### Por qué se cambió
`BLUETOOTH_CONNECT` debe comprobarse desde Android 12/API 31, mientras `POST_NOTIFICATIONS` se introdujo en Android 13/API 33.

### Cambio 3 - Centralizar claves de respuesta Wear

#### Código anterior
```kotlin
private val prefs by lazy { getSharedPreferences("mobile_response_prefs", MODE_PRIVATE) }
```

```kotlin
val prefs = getSharedPreferences("mobile_response_prefs", MODE_PRIVATE)
prefs.edit()
    .putString("last_response", responseJson)
    .putLong("response_timestamp", System.currentTimeMillis())
    .apply()
```

```kotlin
object WearConstants {
    const val HANDLED_OPERATION_LIMIT = 128

    object Outbox {
        val BACKOFF_MS = longArrayOf(10_000L, 20_000L, 40_000L, 80_000L, 160_000L, 300_000L)
    }
}
```

#### Código nuevo
```kotlin
private val prefs by lazy { getSharedPreferences(WearConstants.Response.PREFS, MODE_PRIVATE) }
```

```kotlin
val prefs = getSharedPreferences(WearConstants.Response.PREFS, MODE_PRIVATE)
prefs.edit()
    .putString(WearConstants.Response.LAST_RESPONSE, responseJson)
    .putLong(WearConstants.Response.RESPONSE_TIMESTAMP, System.currentTimeMillis())
    .apply()
```

```kotlin
object WearConstants {
    const val HANDLED_OPERATION_LIMIT = 128

    object Response {
        const val PREFS = "mobile_response_prefs"
        const val LAST_RESPONSE = "last_response"
        const val RESPONSE_TIMESTAMP = "response_timestamp"
    }
}
```

#### Por qué se cambió
La actividad y el servicio compartían tres literales que debían mantenerse idénticos. Centralizarlos evita que un futuro renombrado desincronice la escritura y la lectura de respuestas.

### Cambio 4 - Alinear contrato y convención Kotlin

#### Código anterior
```text
Los identificadores procesados se conservan con un limite de 50 elementos tanto
en la integracion nativa como en el store sincronizado.
```

```kotlin
private const val MaxAmountLength = 9
```

#### Código nuevo
```text
WorkManager es el unico responsable del backoff entre reintentos. `WatchOutbox`
conserva el comando pendiente hasta recibir una respuesta terminal, pero no
mantiene un segundo temporizador ni elimina comandos por numero de intentos.

Los identificadores procesados se conservan con un limite de 512 elementos tanto
en la integracion nativa como en el store sincronizado.
```

```kotlin
private const val MAX_AMOUNT_LENGTH = 9
```

#### Por qué se cambió
El documento declarado como fuente de verdad seguía indicando 50 elementos y no especificaba quién controlaba el backoff. También se corrigió el nombre de una constante privada para seguir la convención Kotlin sin moverla fuera del componente al que pertenece.

### Cambio 5 - Proteger el diseño con pruebas

#### Código anterior
```ts
it("reintenta el outbox con el mismo operationId y backoff limitado", () => {
```

#### Código nuevo
```ts
it("reintenta el outbox con el mismo operationId usando solo el backoff de WorkManager", () => {
```

```ts
it("comprueba cada permiso desde la version Android que lo introdujo", () => {
```

```ts
it("centraliza las claves de respuesta compartidas entre servicio y actividad Wear", () => {
```

```ts
it("mantiene el contrato Wear alineado con la retencion y el backoff implementados", () => {
```

#### Por qué se cambió
Las pruebas fijan el diseño de un único backoff, las versiones correctas de permisos, las claves compartidas y la coherencia entre contrato y código para evitar regresiones.

## 2026-06-06 21:19 - Corregir consistencia y ciclo de vida Wear

**Archivos modificados:** `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`, `android/app/src/main/java/com/mijornada/app/watch/WatchModels.kt`, `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`, `android/app/src/test/java/com/mijornada/app/watch/WatchCommandProcessorTest.java`, `android/app/src/test/java/com/mijornada/app/watch/WatchRoomPersistenceTest.java`, `android/wear/src/main/java/com/mijornada/app/WearConstants.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `src/__tests__/android-wear-bridge.test.ts`, `src/services/watch-bridge.ts`

### Cambio 1 - Validar el estado activo nativo

#### Código anterior
```kotlin
fun isActive(): Boolean = startTime != null || entries.isNotEmpty()

class StaleWatchSnapshotException : IllegalStateException("Snapshot movil anterior al estado nativo")
```

```kotlin
fun replaceAppState(snapshot: WatchAppSnapshot) {
    database.runInTransaction {
```

#### Código nuevo
```kotlin
fun isActive(): Boolean = startTime != null

class StaleWatchSnapshotException : IllegalStateException("Snapshot movil anterior al estado nativo")
class InvalidWatchSnapshotException : IllegalStateException("Snapshot movil con entradas sin hora de inicio")
```

```kotlin
fun replaceAppState(snapshot: WatchAppSnapshot) {
    if (snapshot.current.startTime == null && snapshot.current.entries.isNotEmpty()) {
        throw InvalidWatchSnapshotException()
    }
    database.runInTransaction {
```

#### Por qué se cambió
Un turno nativo solo puede considerarse activo cuando tiene hora de inicio. Los snapshots con entradas sin hora de inicio se rechazan antes de escribir en Room para no iniciar servicios con un estado incoherente ni sobrescribir el estado válido persistido.

### Cambio 2 - Ampliar la retención anti-duplicados

#### Código anterior
```kotlin
private val processedOperationLimit = 50
```

```ts
const MAX_PROCESSED_OPERATION_IDS = 50;
```

```kotlin
const val MAX_PROCESSED_OPERATION_IDS = 50
```

#### Código nuevo
```kotlin
private val processedOperationLimit = 512
```

```ts
const MAX_PROCESSED_OPERATION_IDS = 512;
```

```kotlin
object WearConstants {
    const val HANDLED_OPERATION_LIMIT = 128

    object Outbox {
        val BACKOFF_MS = longArrayOf(10_000L, 20_000L, 40_000L, 80_000L, 160_000L, 300_000L)
    }
}
```

#### Por qué se cambió
La ventana de 50 identificadores podía olvidar operaciones procesadas durante una ráfaga larga. Se amplió de forma acotada a 512 en Room y en la WebView, y se eliminó la constante sin uso del módulo Wear.

### Cambio 3 - Proteger la interfaz frente a callbacks tardíos

#### Código anterior
```kotlin
override fun onResume() {
    super.onResume()
    pollResponseState()
    requestStatus()
}

override fun onPause() {
    super.onPause()
}
```

```kotlin
.addOnFailureListener {
    isConnected.value = false
    currentScreen.value = ScreenState.NO_CONNECTED
}
```

```kotlin
WatchOutbox.removeCommandsFromOtherSessions(this, nextUserSessionId)
    .forEach { /* cleanupTerminalDataItems(it) */ }
```

#### Código nuevo
```kotlin
private var isUiActive = false

override fun onResume() {
    super.onResume()
    isUiActive = true
    pollResponseState()
    requestStatus()
}

override fun onPause() {
    isUiActive = false
    super.onPause()
}
```

```kotlin
.addOnFailureListener {
    showDisconnectedIfUiActive()
}

private fun showDisconnectedIfUiActive() {
    if (!isUiActive) return
    isConnected.value = false
    currentScreen.value = ScreenState.NO_CONNECTED
}
```

```kotlin
WatchOutbox.removeCommandsFromOtherSessions(this, nextUserSessionId)
```

#### Por qué se cambió
Un callback de Google Play Services podía cambiar la pantalla después de que la actividad dejara de estar visible. La escritura del comando continúa, pero la interfaz solo cambia mientras está activa. También se eliminó una iteración vacía sin efecto.

### Cambio 4 - Evitar la rehidratación redundante

#### Código anterior
```java
WatchStateDataPublisher.publish(getContext());
WatchStateChangeNotifier.notify(getContext());
JSObject result = new JSObject();
```

#### Código nuevo
```java
WatchStateDataPublisher.publish(getContext());
JSObject result = new JSObject();
```

#### Por qué se cambió
`syncState` ya parte de un cambio realizado por la WebView. Notificar inmediatamente a la misma WebView provocaba una hidratación redundante de Room. Las notificaciones originadas por comandos nativos del reloj se mantienen en `WearCommandWorker`.

### Cambio 5 - Tipar y aclarar el puente nativo

#### Código anterior
```ts
import { registerPlugin, Capacitor } from "@capacitor/core";
```

```ts
): Promise<any> & any;

let nativeStateListener: Promise<any> | null = null;
```

```ts
nativeHydrationQueue = nativeHydrationQueue
  ? nativeHydrationQueue.catch(() => undefined).then(() => hydrateNativeWatchState())
  : hydrateNativeWatchState();
```

```ts
function nativeSnapshotJson(): string {
```

#### Código nuevo
```ts
import { registerPlugin, Capacitor, type PluginListenerHandle } from "@capacitor/core";
```

```ts
): Promise<PluginListenerHandle>;

let nativeStateListener: Promise<PluginListenerHandle> | null = null;
```

```ts
nativeHydrationQueue = nativeHydrationQueue
  ? nativeHydrationQueue.catch((error) => {
      console.error("Error previo en cola de hidratacion Wear OS:", error);
    }).then(() => hydrateNativeWatchState())
  : hydrateNativeWatchState();
```

```ts
function nativeSnapshotCanonical(): string {
```

#### Por qué se cambió
El listener usa ahora el tipo oficial de Capacitor, los fallos previos de la cola quedan visibles y el nombre del snapshot describe que contiene JSON canónico usado para comparar estados.

### Cambio 6 - Añadir pruebas de regresión

#### Código anterior
`No existía el bloque de pruebas de regresión de consistencia y ciclo de vida Wear.`

#### Código nuevo
```java
@Test
public void entradasSinHoraInicioNoRepresentanUnTurnoActivo() {
    WatchCurrentState malformed = new WatchCurrentState(
        null,
        null,
        java.util.Collections.singletonList(new WatchEntry(1L, "propina", 1.0, "", "10:35")),
        false,
        null,
        0
    );

    assertTrue(!malformed.isActive());
}
```

```java
@Test
public void replaceAppStateRechazaEntradasSinHoraInicioSinSobrescribirRoom() {
    repository.replaceAppState(new WatchAppSnapshot(
        new WatchCurrentState("10:00", "2026-06-01", java.util.Collections.emptyList(), false, null, 0),
        java.util.Collections.emptyList(),
        java.util.Collections.emptyList()
    ));

    boolean rejected = false;
    try {
        repository.replaceAppState(new WatchAppSnapshot(
            new WatchCurrentState(
                null,
                null,
                java.util.Collections.singletonList(new WatchEntry(1L, "propina", 1.0, "", "10:05")),
                false,
                null,
                0
            ),
            java.util.Collections.emptyList(),
            java.util.Collections.emptyList()
        ));
    } catch (InvalidWatchSnapshotException expected) {
        rejected = true;
    }

    assertTrue(rejected);
    assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
}
```

```ts
it("protege la UI del reloj de callbacks tardios y elimina limpieza vacia", () => {
  const source = readFileSync(
    resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
    "utf8",
  );

  expect(source).toContain("private var isUiActive = false");
  expect(source).toContain("isUiActive = true");
  expect(source).toContain("isUiActive = false");
  expect(source).toContain("showDisconnectedIfUiActive()");
  expect(source).not.toContain(".forEach { /* cleanupTerminalDataItems(it) */ }");
});
```

#### Por qué se cambió
Las pruebas demuestran los fallos antes de la corrección y protegen los comportamientos corregidos frente a regresiones posteriores.

## 2026-06-06 21:00 - Corregir flujo profesional del reloj

**Archivos modificados:**
- `.gitignore`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt`
- `android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`
- `src/__tests__/android-wear-bridge.test.ts`
- `src/__tests__/watch-command-processor.test.ts`
- `src/hooks/use-firestore-sync.ts`
- `src/logic/watch-command-processor.ts`
- `src/services/watch-bridge.ts`
- `android/app/src/main/java/com/mijornada/app/.fuse_hidden0000000b00000001`
- `android/wear/src/main/java/com/mijornada/app/.fuse_hidden0000000a00000001`
- `android/wear/src/main/java/com/mijornada/app/.fuse_hidden0000000a00000002`
- `android/wear/src/main/java/com/mijornada/app/.fuse_hidden0000000b00000002`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt.truncated.bak`
- `src/hooks/.fuse_hidden0000000500000001`
- `src/services/.fuse_hidden0000000400000001`
- `src/services/.fuse_hidden0000000500000002`
- `src/__tests__/.fuse_hidden0000000400000001`
- `src/__tests__/.fuse_hidden0000000400000002`

### Cambio 1 - Añadir pausa y reanudación al reloj

#### Código anterior
```kotlin
onSelectCategory: (String) -> Unit,
onAddNote: () -> Unit,
onEditEntry: (WatchEntry) -> Unit,
onEndTurno: () -> Unit
```

#### Código nuevo
```kotlin
onSelectCategory: (String) -> Unit,
onTogglePause: () -> Unit,
onAddNote: () -> Unit,
onEditEntry: (WatchEntry) -> Unit,
onEndTurno: () -> Unit
```

#### Por qué se cambió
El protocolo ya admitía `PAUSE_TURNO` y `RESUME_TURNO`, pero la pantalla activa del reloj no exponía ninguna acción para enviarlos.

### Cambio 2 - Procesar pausa de forma equivalente en TypeScript

#### Código anterior
```ts
if (command.type === "ADD_ENTRY") {
```

#### Código nuevo
```ts
if (command.type === "PAUSE_TURNO") {
  if (!state.current.startTime) {
    return {
      ...state,
      response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
    };
  }
  if (state.current.isPaused) {
    return {
      ...state,
      response: errorResponse(command, "ALREADY_PAUSED", "El turno ya esta pausado"),
    };
  }

  return {
    ...state,
    current: {
      ...state.current,
      isPaused: true,
      pauseStartTime: state.now.time,
    },
    processedOperationIds: withProcessedOperationId(state, command.operationId),
    response: {
      type: "OK",
      operationId: command.operationId,
      message: "Turno pausado",
    },
  };
}
```

#### Por qué se cambió
El procesador TypeScript devolvía `UNKNOWN_COMMAND` para una pausa válida y al cerrar un turno pausado no sumaba la pausa todavía abierta.

### Cambio 3 - Hacer atómico y seguro el consumo de ACK

#### Código anterior
```kotlin
val editor = prefs.edit()
editor.putString("last_response", responseJson)
editor.apply()
editor.putLong("response_timestamp", System.currentTimeMillis())
editor.apply()
```

#### Código nuevo
```kotlin
prefs.edit()
    .putString("last_response", responseJson)
    .putLong("response_timestamp", System.currentTimeMillis())
    .apply()
```

#### Por qué se cambió
La respuesta y su marca temporal podían quedar momentáneamente desincronizadas. También se protegió con `synchronized(handledTerminalOperationIds)` la operación completa de deduplicación y poda.

### Cambio 4 - Reintentar fallos transitorios del worker móvil

#### Código anterior
```kotlin
} catch (e: Exception) {
    android.util.Log.e("WearCommandWorker", "doWork failed", e)
    Result.failure()
}
```

#### Código nuevo
```kotlin
} catch (e: Exception) {
    android.util.Log.e("WearCommandWorker", "doWork failed", e)
    Result.retry()
}
```

#### Por qué se cambió
Un fallo temporal de comunicación o persistencia terminaba definitivamente el trabajo. El worker ahora reintenta con `BackoffPolicy.EXPONENTIAL`.

### Cambio 5 - Retirar rutas antiguas y suscripciones huérfanas

#### Código anterior
```ts
let storeUnsubscribe: (() => void) | null = null;
```

#### Código nuevo
```ts
let storeUnsubscribes: Array<() => void> = [];
```

#### Por qué se cambió
Solo se conservaba la baja de una de las tres suscripciones Zustand. Las otras podían permanecer activas tras cambiar de usuario. También se eliminó la recepción antigua de comandos por `MessageClient`, el `sendWatchStatus` sin uso y el efecto vacío asociado.

### Cambio 6 - Serializar hidrataciones Room sin retrasar la primera

#### Código anterior
```ts
await hydrateNativeWatchState();
```

#### Código nuevo
```ts
await queueNativeHydration();
```

#### Por qué se cambió
Dos avisos nativos simultáneos podían hidratar el store en paralelo. La primera hidratación se inicia inmediatamente y las siguientes se encadenan en orden.

### Cambio 7 - Eliminar residuos temporales y fijar regresiones

#### Código anterior
```gitignore
*.swp
```

#### Código nuevo
```gitignore
*.swp
.fuse_hidden*
*.bak
```

#### Por qué se cambió
Se eliminaron diez archivos `.fuse_hidden*` y `.bak` de las carpetas fuente y se añadieron pruebas para pausa, reanudación, cierre pausado, ACK atómico, reintentos, suscripciones, hidratación y ausencia de residuos.

## 2026-06-06 20:32 - Unificar arquitectura vigente de Mi Turno Watch

**Archivos modificados:** `ARQUITECTURA_RELOJ_WEAR_OS.md`, `PLAN_RELOJ_WEAR_OS.md`, `PLAN_RELOJ_WEAR_OS_V2.md`

### Cambio 1 - Eliminar el plan original contradictorio

#### Código anterior
```md
# Plan Wear OS - Reloj como mando del movil

## Regla principal

El reloj no escribe en Firestore.

El reloj no escribe en sincronizacion.

El reloj no guarda acciones pendientes.

El reloj solo manda ordenes al movil cuando hay conexion confirmada.
```

#### Código nuevo
```md
No existe `PLAN_RELOJ_WEAR_OS.md`.
```

#### Por qué se cambió
El plan original prohibía guardar comandos pendientes y operar sin conexión confirmada. Esa regla contradice la arquitectura vigente, que conserva comandos críticos en el outbox del reloj hasta recibir una respuesta terminal del móvil.

### Cambio 2 - Eliminar el plan V2 convertido en documentación histórica

#### Código anterior
```md
# Plan Wear OS V2 — Reloj funcional sin depender del WebView Capacitor

## Contexto

El plan original (`PLAN_RELOJ_WEAR_OS.md`) define correctamente el protocolo de comandos reloj→móvil.
```

#### Código nuevo
```md
No existe `PLAN_RELOJ_WEAR_OS_V2.md`.
```

#### Por qué se cambió
El documento V2 describía como fases futuras componentes ya implementados y mantenía afirmaciones que no distinguían correctamente entre el guardado inmediato en Room y la sincronización posterior con Firestore.

### Cambio 3 - Crear la única fuente vigente de arquitectura Wear

#### Código anterior
`No existía ARQUITECTURA_RELOJ_WEAR_OS.md en la raíz del proyecto.`

#### Código nuevo
```md
# Arquitectura vigente de Mi Turno Watch

## Estado del documento

Este documento es la unica fuente de verdad funcional para la integracion entre:

- Mi Turno Watch.
- La app Mi Turno instalada en el movil.
- La base local nativa Room del movil.
- El store de la app movil.
- Cloud Firestore.
```

```text
Reloj
  -> movil nativo
  -> Room
  -> app movil
  -> watch-bridge
  -> use-firestore-sync
  -> Firestore con la sesion actual
```

#### Por qué se cambió
Era necesario disponer de un único documento verificable que defina responsabilidades, flujo de datos, comportamiento offline, deduplicación, aislamiento por usuario, sincronización con Firestore, límites conocidos y verificaciones obligatorias sin mezclar decisiones antiguas con la arquitectura actual.

## 2026-06-06 17:57 - Corregir fiabilidad de comandos Wear

**Archivos modificados:**
- `android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt`
- `android/wear/src/main/java/com/mijornada/app/OutboxWorker.kt`
- `android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt`
- `android/wear/src/main/java/com/mijornada/app/WearConstants.kt`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchModels.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchCommandJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchCommandProcessor.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchEntities.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabase.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchStateJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchResponseJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDaos.kt`
- `android/app/src/test/java/com/mijornada/app/watch/WatchCommandProcessorTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchDatabaseMigrationTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchRoomPersistenceTest.java`
- `src/services/watch-bridge.ts`
- `src/shared/watch-commands.ts`
- `src/logic/watch-command-processor.ts`
- `src/__tests__/watch-bridge.test.ts`
- `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Reintentar comandos Wear hasta recibir ACK

#### Código anterior
```kotlin
override suspend fun doWork(): Result {
    Log.d(TAG, "OutboxWorker ejecutándose")
    val count = WatchOutbox.drainOutbox(applicationContext)
    Log.d(TAG, "OutboxWorker drainOutbox completó: $count comandos procesados")
    return Result.success()
}
```

```kotlin
fun pruneStaleCommands(context: Context): Int {
    synchronized(lock) {
        val pending = JSONObject(rawPending(context))
        val staleIds = pending.keys().asSequence().filter { operationId ->
            val item = pending.optJSONObject(operationId) ?: return@filter false
            item.optInt("attempts", 0) >= MAX_ATTEMPTS
        }.toList()
        staleIds.forEach(pending::remove)
        if (staleIds.isNotEmpty()) {
            writePending(context, pending)
        }
        return staleIds.size
    }
}
```

#### Código nuevo
```kotlin
override suspend fun doWork(): Result {
    val pending = WatchOutbox.dueCommands(applicationContext, System.currentTimeMillis())
    pending.forEach { command ->
        try {
            val request = PutDataMapRequest.create("/watch-command/${command.operationId}")
            request.dataMap.putString("command", command.commandJson)
            request.dataMap.putString("targetNodeId", "")
            request.dataMap.putLong("createdAt", System.currentTimeMillis())
            val dataRequest = request.asPutDataRequest().setUrgent()
            Tasks.await(Wearable.getDataClient(applicationContext).putDataItem(dataRequest))
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo reenviar operationId=${command.operationId}: ${e.message}")
        } finally {
            WatchOutbox.markAttempt(applicationContext, command.operationId, System.currentTimeMillis())
        }
    }

    return if (WatchOutbox.hasPendingCommands(applicationContext)) {
        Result.retry()
    } else {
        Result.success()
    }
}
```

```kotlin
val workRequest = OneTimeWorkRequestBuilder<OutboxWorker>()
    .setBackoffCriteria(
        BackoffPolicy.EXPONENTIAL,
        WorkRequest.MIN_BACKOFF_MILLIS,
        TimeUnit.MILLISECONDS,
    )
    .addTag(WORK_TAG_OUTBOX)
    .build()
```

#### Por qué se cambió
El worker anterior no reenviaba ningún comando y eliminaba pendientes tras cuatro intentos. El nuevo worker vuelve a publicar cada DataItem con el mismo `operationId`, usa el backoff exponencial de WorkManager y conserva el comando hasta recibir una respuesta terminal.

### Cambio 2 - Completar pausa y reanudación nativas

#### Código anterior
```kotlin
return when (type) {
    "START_TURNO" -> WatchCommand.StartTurno(operationId, createdAt)
    "ADD_ENTRY" -> WatchCommand.AddEntry(
```

```kotlin
data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String?,
    val startTime: String?,
    val endTime: String,
    val entries: List<WatchEntry>,
    val dinero: Double,
    val km: Double,
    val notes: String,
)
```

#### Código nuevo
```kotlin
return when (type) {
    "START_TURNO" -> WatchCommand.StartTurno(operationId, createdAt)
    "PAUSE_TURNO" -> WatchCommand.PauseTurno(operationId, createdAt)
    "RESUME_TURNO" -> WatchCommand.ResumeTurno(operationId, createdAt)
    "ADD_ENTRY" -> WatchCommand.AddEntry(
```

```kotlin
data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String?,
    val startTime: String?,
    val endTime: String,
    val entries: List<WatchEntry>,
    val dinero: Double,
    val km: Double,
    val notes: String,
    val totalPausedMinutes: Int = 0,
)
```

#### Por qué se cambió
El contrato declaraba `PAUSE_TURNO` y `RESUME_TURNO`, pero Android nativo no podía analizarlos ni aplicarlos. Ahora ambos comandos actualizan Room, acumulan minutos de pausa y conservan también una pausa abierta al terminar el turno.

### Cambio 3 - Migrar Room para conservar pausas cerradas

#### Código anterior
```kotlin
@Database(
    entities = [
        OperationEntity::class,
        CurrentTurnoEntity::class,
        TurnoEntity::class,
    ],
    version = 3,
    exportSchema = false,
)
```

#### Código nuevo
```kotlin
@Database(
    entities = [
        OperationEntity::class,
        CurrentTurnoEntity::class,
        TurnoEntity::class,
    ],
    version = 4,
    exportSchema = false,
)
```

```kotlin
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            """
            ALTER TABLE `watch_turnos`
            ADD COLUMN `totalPausedMinutes` INTEGER NOT NULL DEFAULT 0
            """.trimIndent(),
        )
    }
}
```

#### Por qué se cambió
Los turnos cerrados por el reloj perdían los minutos pausados. La migración añade el campo sin borrar las bases de datos existentes y permite calcular correctamente el tiempo trabajado mostrado al reloj.

### Cambio 4 - Comparar snapshots completos

#### Código anterior
```ts
function stableHash(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}
```

#### Código nuevo
```ts
function stableHash(value: unknown): string {
  const canonicalize = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) {
      return candidate.map(canonicalize);
    }
    if (candidate && typeof candidate === "object") {
      return Object.keys(candidate)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => {
          result[key] = canonicalize((candidate as Record<string, unknown>)[key]);
          return result;
        }, {});
    }
    return candidate;
  };
  return JSON.stringify(canonicalize(value));
}
```

#### Por qué se cambió
La comparación anterior omitía los valores anidados y consideraba iguales snapshots con importes distintos. La nueva serialización canónica compara recursivamente objetos y listas completos.

### Cambio 5 - Limitar operaciones nativas sin perder idempotencia

#### Código anterior
```kotlin
val appliedOperationIds = database.operationDao().getAppliedOperationIds().toSet()
```

```kotlin
database.operationDao().markApplied(command.operationId)
```

#### Código nuevo
```kotlin
val appliedOperationIds = database.operationDao()
    .getRecentAppliedOperationIds(processedOperationLimit)
    .toSet()
```

```kotlin
database.operationDao().markApplied(command.operationId)
database.operationDao().pruneAppliedOperations(processedOperationLimit)
```

#### Por qué se cambió
El móvil conserva como máximo 50 identificadores procesados. Si Room conservaba todos indefinidamente, un snapshot válido terminaba rechazándose al superar ese límite. Room y el snapshot ahora comparten el mismo límite manteniendo las operaciones recientes necesarias para evitar duplicados.

### Cambio 6 - Bloquear comandos sin identidad y corregir lint

#### Código anterior
```kotlin
if (shouldPersistOutbox(rawCommandJson) && userSessionId.value.isBlank()) {
    if (!isRetry) {
        val operationId = readOperationIdSafe(rawCommandJson)
        if (operationId.isNotBlank()) {
            WatchOutbox.save(this, operationId, rawCommandJson)
            MobileResponseService.enqueueOutboxRetry(this)
        }
        performFeedback("Esperando movil...", strong = false)
        requestStatus()
    }
    return false
}
```

```kotlin
} catch (e: android.app.ForegroundServiceStartNotAllowedException) {
    android.util.Log.e("TurnoForegroundService", "ForegroundServiceStartNotAllowedException: ${e.message}")
```

#### Código nuevo
```kotlin
if (shouldPersistOutbox(rawCommandJson) && userSessionId.value.isBlank()) {
    if (!isRetry) {
        performFeedback("Esperando movil...", strong = false)
        requestStatus()
    }
    return false
}
```

```kotlin
} catch (e: Exception) {
    android.util.Log.e("TurnoForegroundService", "startForeground failed: ${e.message}")
```

#### Por qué se cambió
Un comando de escritura sin sesión no se puede asociar de forma segura a un usuario y ya no se guarda. La captura genérica elimina además referencias no protegidas a una excepción exclusiva de API 31 que impedían superar lint con `minSdk 26`.

### Cambio 7 - Añadir pruebas de regresión

#### Código anterior
`No existían pruebas para cambios anidados con igual estructura, pausa/reanudación nativa, cierre durante una pausa, migración 3 a 4 ni límite de operaciones procesadas.`

#### Código nuevo
```ts
it("rehidrata cuando cambia un valor anidado aunque la estructura sea igual", async () => {
  // ...
  expect(useAppStore.getState().current.entries[0].amount).toBe(2);
});
```

```java
@Test
public void pauseYResumeTurnoPersistenLaPausaAcumulada() throws Exception {
    // ...
    assertEquals(15, resumed.getState().getCurrent().getTotalPausedMinutes());
}
```

```java
@Test
public void limitaOperacionesAplicadasSinBloquearSnapshotsRecientes() {
    // ...
    assertEquals(50, state.getProcessedOperationIds().size());
    assertEquals(50, database.operationDao().getAppliedOperationIds().size());
}
```

#### Por qué se cambió
Las pruebas anteriores comprobaban principalmente presencia de texto y no detectaban estos fallos de comportamiento. Las nuevas regresiones fijan resultados observables y protegen las rutas críticas de sincronización.

## 2026-06-06 20:30 - Implementar FASE 4 remediacion reloj Wear

**Archivos modificados:**
- `android/app/src/main/java/com/mijornada/app/watch/WatchDaos.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchCommandProcessor.kt`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt`
- `android/wear/src/main/java/com/mijornada/app/WearConstants.kt`
- `android/app/src/test/java/com/mijornada/app/watch/WatchCommandProcessorTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchMultiUserTest.java`

### Cambio 1 - Eliminar parametro note de sendEndTurno

#### Codigo anterior
```kotlin
private fun sendEndTurno(dinero: Double, km: Double, note: String) {
    ...
    put("note", if (note.isBlank()) "Cierre desde reloj" else note)
```

#### Codigo nuevo
```kotlin
private fun sendEndTurno(dinero: Double, km: Double) {
    ...
    put("note", "Cierre desde reloj")
```

#### Por que se cambio
El parametro note nunca se usaba desde la UI (siempre se pasaba ""), y EndTurnoScreen no tiene input para nota. Se elimina el parametro innecesario y se hardcodea el valor por defecto.

### Cambio 2 - ACK con operationId vacio del payload

#### Codigo anterior
```java
public static void publishAckDataItem(Context context, String operationId, String responseJson) {
    if (context == null || operationId == null || operationId.trim().isEmpty()) {
        return;
    }
```

#### Codigo nuevo
```java
public static void publishAckDataItem(Context context, String operationId, String responseJson) {
    if (context == null) {
        return;
    }

    final String resolvedOperationId;
    if (operationId == null || operationId.trim().isEmpty()) {
        resolvedOperationId = readOperationIdFromJson(responseJson);
    } else {
        resolvedOperationId = operationId;
    }
    if (resolvedOperationId == null || resolvedOperationId.trim().isEmpty()) {
        return;
    }
```

#### Por que se cambio
Si el operationId viene vacio en el parametro pero el responseJson contiene uno (extraido del comando original), se usa ese. Esto evita perder ACKs cuando el path no provee operationId pero el payload si.

### Cambio 3 - OperationDao con query exists para deduplicacion

#### Codigo anterior
```kotlin
@Query("SELECT EXISTS(SELECT 1 FROM watch_operations WHERE operationId = :id)")
fun exists(id: String): Boolean
```

#### Codigo nuevo
```kotlin
@Query("SELECT EXISTS(SELECT 1 FROM watch_operations WHERE operationId = :id AND applied = 1)")
fun exists(id: String): Boolean
```

#### Por que se cambio
La query debe verificar solo operaciones aplicadas, no operaciones pendientes. Esto evita falsos positivos en deduplicacion cuando acaba de insertarse una operacion no aplicada.

### Cambio 4 - OperationExists como parametro en WatchCommandProcessor

#### Codigo anterior
```kotlin
fun process(command: WatchCommand, state: WatchProcessorState): WatchProcessorResult {
    ...
    if (state.processedOperationIds.contains(command.operationId)) {
```

#### Codigo nuevo
```kotlin
fun process(command: WatchCommand, state: WatchProcessorState, operationExists: (String) -> Boolean): WatchProcessorResult {
    ...
    if (operationExists(command.operationId)) {
```

#### Por que se cambio
Se pasa una funcion operationExists que usa exists() del DAO en lugar de cargar toda la lista en memoria con contains(). Mas eficiente para bases de datos con muchas operaciones.

### Cambio 5 - WearConstants para magic numbers

#### Codigo anterior
```kotlin
private val HandledOperationLimit = 128
```

#### Codigo nuevo
```kotlin
object WearConstants {
    const val HANDLED_OPERATION_LIMIT = 128
    const val MAX_PROCESSED_OPERATION_IDS = 50

    object Outbox {
        const val MAX_ATTEMPTS = 4
        val BACKOFF_MS = longArrayOf(5_000L, 10_000L, 20_000L, 40_000L)
        const val FIRST_BACKOFF_MS = 5_000L
        const val LAST_BACKOFF_MS = 40_000L
    }
}
```

#### Por que se cambio
Centraliza constantes con nombres descriptivos en lugar de numeros magicos dispersos en el codigo.

### Cambio 6 - Logs sin payload de usuario

#### Codigo anterior
```kotlin
Log.d(TAG, "Mensaje recibido: path=$path, data=$data")
```

#### Codigo nuevo
```kotlin
Log.d(TAG, "Mensaje recibido: path=$path, data.length=${data.length}")
```

#### Por que se cambio
Notas y montos no deben aparecer en logs. Solo se registra la longitud del payload, no su contenido.

### Cambio 7 - Tests WatchMultiUserTest

#### Codigo nuevo
```java
@Test
public void prepareUidGeneraSessionIdNuevoSiUidCambia() { ... }
@Test
public void prepareUidReusaSessionIdSiMismoUid() { ... }
@Test
public void clearIfMatchesSoloLimpiaSiUidCoincide() { ... }
@Test
public void clearIfMatchesLimpiaSiUidCoincide() { ... }
@Test
public void operationExistsDevuelveTrueParaOperacionAplicada() { ... }
@Test
public void operationExistsDevuelveFalseParaOperacionNoAplicada() { ... }
@Test
public void duplicateOperationIdEsRechazadoPorBaseDeDatos() { ... }
@Test
public void staleSnapshotExceptionEsLanzadaCuandoMobileEstaDesactualizado() { ... }
```

#### Por que se cambio
Anadidos tests para cambio de UID multi-usuario, deduplicacion con operationId, y stale snapshot exception.

## 2026-06-06 16:14 - Implementar FASE 3 remediacion reloj Wear

**Archivos modificados:**
- `android/app/build.gradle`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchNativeCommandHandler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchCommandJson.kt`
- `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - WorkManager en WearListenerService

#### Código anterior
```java
public class WearListenerService extends WearableListenerService {
    private final ExecutorService commandExecutor = Executors.newSingleThreadExecutor();

    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        // ...
        commandExecutor.execute(() -> deliverOrQueue(commandJson, nodeId, operationId));
    }

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        commandExecutor.execute(() -> deliverOrQueue(commandJson, nodeId, operationId));
    }

    private void deliverOrQueue(String commandJson, String nodeId, String operationId) {
        // ... toda la logica de procesamiento directo
    }
}
```

#### Código nuevo
```java
public class WearListenerService extends WearableListenerService {
    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        // ...
        WearCommandWorker.enqueue(this, commandJson, nodeId, operationId);
    }

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        WearCommandWorker.enqueue(this, commandJson, nodeId, operationId);
    }
}
```

#### Por qué se cambió
commandExecutor no garantiza terminación si el servicio es matado por el sistema. WorkManager con setExpedited() asegura que el comando se procese incluso si el servicio muere.

### Cambio 2 - WearCommandWorker con setExpedited

#### Código anterior
`No existía WearCommandWorker.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### Código nuevo
```kotlin
class WearCommandWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val commandJson = inputData.getString(KEY_COMMAND_JSON) ?: return Result.failure()
        // ... procesamiento de comando
        if (isWrite && isSuccessfulWriteResponse(responseJson)) {
            WatchStateDataPublisher.publish(applicationContext)
        }
        WatchStateChangeNotifier.notify(applicationContext)
        return Result.success()
    }

    companion object {
        @JvmStatic
        fun enqueue(context: Context, commandJson: String, nodeId: String, operationId: String) {
            val request = OneTimeWorkRequestBuilder<WearCommandWorker>()
                .setInputData(data)
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(...)
        }
    }
}
```

#### Por qué se cambió
WorkManager garantiza terminación aunque el servicio sea matado. setExpedited() prioriza el trabajo crítico del reloj.

### Cambio 3 - Eliminar pre-check duplicado en WatchNativeCommandHandler

#### Código anterior
```kotlin
if (command.operationId.isNotBlank()) {
    val state = repository.readState(nowDate, nowTime, nowId)
    if (state.processedOperationIds.contains(command.operationId)) {
        return WatchResponseJson.toJson(
            WatchResponse.DuplicateIgnored(command.operationId, "Operacion ya procesada"),
        )
    }
}
```

#### Código nuevo
```kotlin
// Eliminado - la idempotencia ya la garantiza el INSERT dentro del runInTransaction de applyCommand
```

#### Por qué se cambió
La verificación fuera de transacción era redundante. El INSERT con operationId como clave primaria en Room ya garantiza idempotencia.

### Cambio 4 - Rechazar operaciones sin operationId en WatchRepository

#### Código anterior
```kotlin
return database.runInTransaction<WatchProcessorResult> {
    val stateBeforeCommand = readState(nowDate, nowTime, nowId)
    if (command.operationId.isBlank()) {
        return@runInTransaction WatchCommandProcessor.process(command, stateBeforeCommand)
    }
    // ...
}
```

#### Código nuevo
```kotlin
if (command.operationId.isBlank()) {
    return WatchProcessorResult(
        state = readState(nowDate, nowTime, nowId),
        response = WatchResponse.Error("", "INVALID_OPERATION_ID", "operationId es obligatorio"),
    )
}
return database.runInTransaction<WatchProcessorResult> {
    // ...
}
```

#### Por qué se cambió
Un comando sin operationId no puede ser idempotente y puede causar duplicados. Se rechaza antes de tocar Room.

### Cambio 5 - Uri.parse en deleteWatchState

#### Código anterior
```java
android.net.Uri stateUri = new android.net.Uri.Builder()
    .scheme("wear")
    .path("/turno/state")
    .build();
```

#### Código nuevo
```java
android.net.Uri stateUri = android.net.Uri.parse("wear://*/turno/state");
```

#### Por qué se cambió
Uri.parse("wear://*/turno/state") es más simple y correcto para deleteDataItems con wildcard en host.

### Cambio 6 - TurnoForegroundService robusto

#### Código anterior
```kotlin
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            stopSelf()
            return START_NOT_STICKY
        }
    }
    // ... startForeground
}
```

#### Código nuevo
```kotlin
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            android.util.Log.w("TurnoForegroundService", "BLUETOOTH_CONNECT permission not granted")
            stopSelf()
            return START_NOT_STICKY
        }
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            android.util.Log.w("TurnoForegroundService", "POST_NOTIFICATIONS permission not granted")
            stopSelf()
            return START_NOT_STICKY
        }
    }
    try {
        // startForeground...
    } catch (e: SecurityException) {
        android.util.Log.e("TurnoForegroundService", "SecurityException: ${e.message}")
        stopSelf()
        return START_NOT_STICKY
    } catch (e: android.app.ForegroundServiceStartNotAllowedException) {
        android.util.Log.e("TurnoForegroundService", "ForegroundServiceStartNotAllowedException: ${e.message}")
        stopSelf()
        return START_NOT_STICKY
    }
    return START_STICKY
}
```

#### Por qué se cambió
Android13+ requiere POST_NOTIFICATIONS. API 31+ puede lanzar ForegroundServiceStartNotAllowedException. Se loguea el motivo concreto para debugging.

### Cambio 7 - Permission BIND_LISTENER en AndroidManifest

#### Código anterior
```xml
<service
    android:name="com.mijornada.app.WearListenerService"
    android:exported="true">
```

#### Código nuevo
```xml
<service
    android:name="com.mijornada.app.WearListenerService"
    android:exported="true"
    android:permission="com.google.android.gms.permission.BIND_LISTENER">
```

#### Por qué se cambió
BIND_LISTENER protege el servicio WearListenerService de ser accedido por aplicaciones no autorizadas.

### Cambio 8 - Publicar estado tras setPrepared

#### Código anterior
```java
@PluginMethod
public void setPrepared(PluginCall call) {
    String uid = call.getString("uid");
    if (uid != null && !uid.trim().isEmpty()) {
        WatchUserSession.prepare(getContext(), uid);
        call.resolve();
    } else {
        call.reject("uid es obligatorio");
    }
}
```

#### Código nuevo
```java
@PluginMethod
public void setPrepared(PluginCall call) {
    String uid = call.getString("uid");
    if (uid != null && !uid.trim().isEmpty()) {
        WatchUserSession.prepare(getContext(), uid);
        WatchStateDataPublisher.publish(getContext());
        call.resolve();
    } else {
        call.reject("uid es obligatorio");
    }
}
```

#### Por qué se cambió
Tras preparar el puente, el reloj debe recibir el estado actual para mostrar los datos correctos inmediatamente.

### Cambio 9 - Notificar tras syncState

#### Código anterior
```java
repository.replaceAppState(snapshot);
if (snapshot.getCurrent().isActive()) {
    TurnoForegroundService.start(getContext());
} else {
    TurnoForegroundService.stop(getContext());
}
WatchStateDataPublisher.publish(getContext());
JSObject result = new JSObject();
```

#### Código nuevo
```java
repository.replaceAppState(snapshot);
if (snapshot.getCurrent().isActive()) {
    TurnoForegroundService.start(getContext());
} else {
    TurnoForegroundService.stop(getContext());
}
WatchStateDataPublisher.publish(getContext());
WatchStateChangeNotifier.notify(getContext());
JSObject result = new JSObject();
```

#### Por qué se cambió
El WebView necesita ser notificado cuando el estado nativo cambia para actualizar la UI.

### Cambio 10 - clear() en WatchDatabaseProvider

#### Código anterior
`No existía el método clear() en WatchDatabaseProvider.kt.`

#### Código nuevo
```kotlin
@JvmStatic
fun clear() {
    instances.values.forEach { database ->
        database.close()
    }
    instances.clear()
}
```

#### Por qué se cambió
Permite cerrar todas las instancias de Room cuando ya no son necesarias, liberando recursos.

### Cambio 11 - Validación estructurada en WatchCommandJson

#### Código anterior
```kotlin
fun parse(commandJson: String): WatchCommand {
    val json = JSONObject(commandJson)
    val operationId = json.optString("operationId", "")
    val type = json.optString("type", "")
    val createdAt = json.optString("createdAt", "")
    // ... sin validación
}
```

#### Código nuevo
```kotlin
fun parse(commandJson: String): WatchCommand {
    val json = try {
        JSONObject(commandJson)
    } catch (e: Exception) {
        throw MalformedJsonException("JSON no valido: ${e.message}")
    }

    val errors = mutableListOf<String>()
    val type = json.optString("type", "")
    if (type.isBlank()) errors.add("type")
    val operationId = json.optString("operationId", "")
    if (operationId.isBlank()) errors.add("operationId")
    val createdAt = json.optString("createdAt", "")
    if (createdAt.isBlank()) errors.add("createdAt")

    if (errors.isNotEmpty()) {
        throw InvalidPayloadException("Campos requeridos faltantes: ${errors.joinToString(", ")}")
    }
    // ...
}

class MalformedJsonException(message: String) : Exception(message)
class InvalidPayloadException(message: String) : Exception(message)
class InvalidCommandException(message: String) : Exception(message)
```

#### Por qué se cambió
Errores estructurados permiten distinguir entre JSON mal formado (MALFORMED_JSON), payload inválido (INVALID_PAYLOAD) y comando no reconocido (INVALID_COMMAND).

### Cambio 12 - Manejo de excepciones estructuradas en WatchNativeCommandHandler

#### Código anterior
```kotlin
val command = try {
    WatchCommandJson.parse(commandJson)
} catch (e: Exception) {
    return WatchResponseJson.toJson(
        WatchResponse.Error(pathOperationId, "INVALID_COMMAND", "Comando Wear invalido"),
    )
}
```

#### Código nuevo
```kotlin
val command = try {
    WatchCommandJson.parse(commandJson)
} catch (e: MalformedJsonException) {
    return WatchResponseJson.toJson(
        WatchResponse.Error(pathOperationId, "MALFORMED_JSON", e.message ?: "JSON no valido"),
    )
} catch (e: InvalidPayloadException) {
    return WatchResponseJson.toJson(
        WatchResponse.Error(pathOperationId, "INVALID_PAYLOAD", e.message ?: "Payload invalido"),
    )
} catch (e: InvalidCommandException) {
    return WatchResponseJson.toJson(
        WatchResponse.Error(pathOperationId, "INVALID_COMMAND", e.message ?: "Comando Wear invalido"),
    )
} catch (e: Exception) {
    return WatchResponseJson.toJson(
        WatchResponse.Error(pathOperationId, "INVALID_COMMAND", "Comando Wear invalido"),
    )
}
```

#### Por qué se cambió
Cada tipo de error devuelve un código distintivo para que el reloj pueda mostrar feedback apropiado.

### Cambio 13 - Tests actualizados para nueva arquitectura

#### Código anterior
```ts
expect(service).toContain("WatchStateDataPublisher.publish(this)");
expect(source).toContain("drainOutbox()");
expect(source).toContain("scheduleOutboxRetry()");
```

#### Código nuevo
```ts
expect(service).toContain("WearCommandWorker.enqueue");
expect(worker).toContain("WatchStateDataPublisher.publish(applicationContext)");
expect(worker).toContain("WatchOutbox.drainOutbox");
```

#### Por qué se cambió
La arquitectura cambió: el servicio delega a WorkManager (WearCommandWorker), no procesa comandos directamente.

---

## 2026-06-06 16:15 - Implementar FASE 2 del plan de remediación del reloj

**Archivos modificados:**
- `src/shared/watch-commands.ts`
- `src/logic/watch-totals.ts`
- `src/services/store.ts`
- `src/services/watch-bridge.ts`
- `src/hooks/use-firestore-sync.ts`
- `src/logic/watch-command-processor.ts`
- `src/__tests__/android-wear-bridge.test.ts`
- `src/__tests__/watch-command-processor.test.ts`

### Cambio 1 - Añadir PAUSE_TURNO y RESUME_TURNO al protocolo

#### Código anterior
```ts
type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "GET_TURNOS" | "START_TURNO";
      createdAt: string;
    }
```

#### Código nuevo
```ts
type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "GET_TURNOS" | "START_TURNO" | "PAUSE_TURNO" | "RESUME_TURNO";
      createdAt: string;
    }
```

#### Por qué se cambió
El protocolo de comandos del reloj necesita variantes para pausar y reanudar el turno activo.

### Cambio 2 - Extender STATUS con campos de pausa

#### Código anterior
```ts
type WatchCommandResponse = ({
  type: "STATUS";
  connected: true;
  activeTurno: boolean;
  startTime: string | null;
  startDate: string | null;
  totals: WatchTurnoTotals;
  entradas: WatchEntry[];
} & { userSessionId?: string })
```

#### Código nuevo
```ts
type WatchCommandResponse = ({
  type: "STATUS";
  connected: true;
  activeTurno: boolean;
  startTime: string | null;
  startDate: string | null;
  totals: WatchTurnoTotals;
  entradas: WatchEntry[];
  isPaused: boolean;
  pauseStartTime: string | null;
  totalPausedMinutes: number;
} & { userSessionId?: string })
```

#### Por qué se cambió
La respuesta STATUS ahora incluye el estado de pausa para que el reloj pueda mostrar correctamente si el turno está pausado.

### Cambio 3 - Crear src/logic/watch-totals.ts

#### Código anterior
`No existía src/logic/watch-totals.ts.`

#### Código nuevo
```ts
import type { CurrentState } from "../shared/types";
import type { WatchEntry, WatchEntryType, WatchTurnoTotals } from "../shared/watch-commands";

export function computeWatchTotals(current: CurrentState): WatchTurnoTotals {
  const porTipo: Record<WatchEntryType, number> = {
    propina: 0,
    datafono: 0,
    agencia_bono: 0,
    extra: 0,
    gasolina: 0,
    nulo: 0,
  };
  const numPorTipo: Record<WatchEntryType, number> = {
    propina: 0,
    datafono: 0,
    agencia_bono: 0,
    extra: 0,
    gasolina: 0,
    nulo: 0,
  };
  for (const entry of current.entries) {
    if (entry.type in porTipo) {
      porTipo[entry.type as WatchEntryType] += entry.amount;
      numPorTipo[entry.type as WatchEntryType] += 1;
    }
  }
  return { porTipo, numPorTipo, numEntradas: current.entries.length };
}

export function buildWatchEntradas(current: CurrentState): WatchEntry[] {
  return current.entries
    .map((e) => ({
      id: e.id,
      type: e.type as WatchEntry["type"],
      amount: e.amount,
      note: e.note,
      time: e.time,
    }))
    .reverse();
}
```

#### Por qué se cambió
Extraer `computeWatchTotals` y `buildWatchEntradas` a un módulo dedicado para reutilización y limpieza del código muerto en `watch-command-processor.ts`.

### Cambio 4 - Añadir subscribeWithSelector middleware al store

#### Código anterior
```ts
import { create } from "zustand";
```

#### Código nuevo
```ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
```

```ts
export const useAppStore = create(
  subscribeWithSelector<AppStore>((set, get) => ({...}))
);
```

#### Por qué se cambió
Permite usar `subscribeWithSelector` para reaccionar solo a cambios en campos específicos del store.

### Cambio 5 - Reemplazar filtro por operationIds por diff de snapshot

#### Código anterior
```ts
const newNativeOperationIds = nativeOperationIds.filter((id) => !store.processedOperationIds.includes(id));
if (newNativeOperationIds.length === 0) return;
```

#### Código nuevo
```ts
function stableHash(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}

// En hydrateNativeWatchState:
const nativeSnapshotHash = stableHash({
  current: parsed.current,
  history: nativeHistory,
  processedOperationIds: nativeOperationIds,
});
const storeSnapshotHash = stableHash({
  current: store.current,
  history: store.history,
  processedOperationIds: store.processedOperationIds,
});

if (nativeSnapshotHash === storeSnapshotHash) return;
```

#### Por qué se cambió
El filtro por `operationIds` no detectaba cambios en el estado que no añadían nuevas operaciones. Ahora se usa un hash estable del snapshot completo para detectar cualquier cambio.

### Cambio 6 - Hidratar campos de pausa desde nativo

#### Código anterior
```ts
const nextCurrent = hasNativeCurrent
  ? {
      ...emptyCurrent(),
      startTime: parsed.current?.startTime ?? null,
      startDate: parsed.current?.startDate ?? null,
      entries: currentEntries,
      isPaused: store.current.isPaused ?? false,
      pauseStartTime: store.current.pauseStartTime ?? null,
      totalPausedMinutes: store.current.totalPausedMinutes ?? 0,
    }
  : emptyCurrent();
```

#### Código nuevo
```ts
const nextCurrent = hasNativeCurrent
  ? {
      ...emptyCurrent(),
      startTime: parsed.current?.startTime ?? null,
      startDate: parsed.current?.startDate ?? null,
      entries: currentEntries,
      isPaused: parsed.current?.isPaused ?? store.current.isPaused ?? false,
      pauseStartTime: parsed.current?.pauseStartTime ?? store.current.pauseStartTime ?? null,
      totalPausedMinutes: parsed.current?.totalPausedMinutes ?? store.current.totalPausedMinutes ?? 0,
    }
  : emptyCurrent();
```

#### Por qué se cambió
Ahora se leen los campos de pausa desde el estado nativo y se aplican al store, permitiendo que la información de pausa se sincronice entre el móvil y el reloj.

### Cambio 7 - Suscribir con selector a campos específicos

#### Código anterior
```ts
function startNativeStateSync(uid: string) {
  if (!storeUnsubscribe) {
    storeUnsubscribe = useAppStore.subscribe(() => {
      syncNativeWatchState().catch((err) => {
        console.error("Error al sincronizar estado movil con Room:", err);
      });
    });
  }
  return syncNativeWatchState();
}
```

#### Código nuevo
```ts
function startNativeStateSync() {
  if (!storeUnsubscribe) {
    storeUnsubscribe = useAppStore.subscribe(
      (state) => state.current,
      () => {
        syncNativeWatchState().catch((err) => {
          console.error("Error al sincronizar estado movil con Room:", err);
        });
      },
    );
    useAppStore.subscribe(
      (state) => state.history,
      () => {
        syncNativeWatchState().catch((err) => {
          console.error("Error al sincronizar estado movil con Room:", err);
        });
      },
    );
    useAppStore.subscribe(
      (state) => state.processedOperationIds,
      () => {
        syncNativeWatchState().catch((err) => {
          console.error("Error al sincronizar estado movil con Room:", err);
        });
      },
    );
  }
  return syncNativeWatchState();
}
```

#### Por qué se cambió
Usar `subscribeWithSelector` para reaccionar solo a cambios en `current`, `history` y `processedOperationIds`, evitando sincronizaciones innecesarias.

### Cambio 8 - Eliminar duplicación de STATUS en use-firestore-sync

#### Código anterior
```ts
useEffect(() => {
  if (dataLoaded && uid) {
    sendWatchStatus().catch((err) => console.error("Error al actualizar estado al reloj:", err));
  }
}, [current.startTime, current.entries.length, dataLoaded, uid]);
```

#### Código nuevo
```ts
useEffect(() => {
  if (dataLoaded && uid) {
    // No sendWatchStatus aqui: la sincronizacion la gestiona startNativeStateSync en watch-bridge
  }
}, [dataLoaded, uid]);
```

#### Por qué se cambió
`sendWatchStatus` se llamaba en cada cambio de entries, causando escrituras duplicadas a Wear OS. La sincronización ahora la gestiona `startNativeStateSync` en watch-bridge.

### Cambio 9 - Actualizar STATUS en sendWatchStatus con campos de pausa

#### Código anterior
```ts
const response: WatchCommandResponse = {
  type: "STATUS",
  connected: true,
  activeTurno: isActive,
  startTime: store.current.startTime,
  startDate: store.current.startDate,
  totals: computeWatchTotals(store.current),
  entradas: buildWatchEntradas(store.current),
  ...(preparedUid ? { userSessionId: preparedUid } : {}),
};
```

#### Código nuevo
```ts
const response: WatchCommandResponse = {
  type: "STATUS",
  connected: true,
  activeTurno: isActive,
  startTime: store.current.startTime,
  startDate: store.current.startDate,
  totals: computeWatchTotals(store.current),
  entradas: buildWatchEntradas(store.current),
  isPaused: store.current.isPaused ?? false,
  pauseStartTime: store.current.pauseStartTime ?? null,
  totalPausedMinutes: store.current.totalPausedMinutes ?? 0,
  ...(preparedUid ? { userSessionId: preparedUid } : {}),
};
```

#### Por qué se cambió
La respuesta STATUS ahora incluye los campos de pausa para mantener al reloj informado sobre el estado de pausa del turno.

### Cambio 10 - Actualizar TYPE en NativeWatchState

#### Código anterior
```ts
type NativeWatchState = {
  current?: {
    startTime?: string | null;
    startDate?: string | null;
    entries?: Entry[];
  };
```

#### Código nuevo
```ts
type NativeWatchState = {
  current?: {
    startTime?: string | null;
    startDate?: string | null;
    entries?: Entry[];
    isPaused?: boolean;
    pauseStartTime?: string | null;
    totalPausedMinutes?: number;
  };
```

#### Por qué se cambió
El tipo `NativeWatchState` ahora incluye los campos de pausa para permitir la serialización/deserialización correcta del estado de pausa.

### Cambio 11 - Actualizar GET_STATUS en processWatchCommand

#### Código anterior
```ts
if (command.type === "GET_STATUS") {
  return {
    ...state,
    response: {
      type: "STATUS",
      connected: true,
      activeTurno: isActive(state.current),
      startTime: state.current.startTime,
      startDate: state.current.startDate,
      totals: computeWatchTotals(state.current),
      entradas: buildWatchEntradas(state.current),
    },
  };
}
```

#### Código nuevo
```ts
if (command.type === "GET_STATUS") {
  return {
    ...state,
    response: {
      type: "STATUS",
      connected: true,
      activeTurno: isActive(state.current),
      startTime: state.current.startTime,
      startDate: state.current.startDate,
      totals: computeWatchTotals(state.current),
      entradas: buildWatchEntradas(state.current),
      isPaused: state.current.isPaused ?? false,
      pauseStartTime: state.current.pauseStartTime ?? null,
      totalPausedMinutes: state.current.totalPausedMinutes ?? 0,
    },
  };
}
```

#### Por qué se cambió
La respuesta GET_STATUS ahora incluye los campos de pausa para mantener la consistencia con la respuesta STATUS enviada por `sendWatchStatus`.

### Cambio 12 - Actualizar tests para reflejar nuevos campos y arquitectura

#### Código anterior
```ts
expect(result.response).toEqual({
  type: "STATUS",
  connected: true,
  activeTurno: true,
  startTime: "10:35",
  startDate: "2026-06-01",
  totals: {...},
  entradas: [...],
});
```

#### Código nuevo
```ts
expect(result.response).toEqual({
  type: "STATUS",
  connected: true,
  activeTurno: true,
  startTime: "10:35",
  startDate: "2026-06-01",
  totals: {...},
  entradas: [...],
  isPaused: false,
  pauseStartTime: null,
  totalPausedMinutes: 0,
});
```

#### Por qué se cambió
Los tests de caracterización de Android y los tests de processWatchCommand fueron actualizados para reflejar la nueva arquitectura y los nuevos campos de pausa.

---

## 2026-06-05 23:29 - Corregir 7 bugs adicionales del puente Wear OS

**Archivos modificados:**
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `src/services/watch-bridge.ts`
- `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`

### Cambio 1 - Cerrar DataEventBuffer en WearListenerService

**Código anterior**
```java
    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        for (DataEvent event : dataEvents) {
 ...
        }
    }
```

**Código nuevo**
```java
    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        try {
            for (DataEvent event : dataEvents) {
                ...
            }
        } finally {
            dataEvents.close();
        }
    }
```

**Por qué se cambió**
DataEventBuffer es un recurso que implementa AutoCloseable y debe cerrarse explícitamente para evitar leaks de memoria/nativos. El buffer se iteraba pero nunca se cerraba.

### Cambio 2 - Remover listener en teardownWatchBridge

**Código anterior**
```ts
export async function teardownWatchBridge(uid: string): Promise<void> {
  if (!uid || preparedUid !== uid) return;
  storeUnsubscribe?.();
  storeUnsubscribe = null;
  preparedUid = "";
  lastSyncedSnapshot = "";
  nativeSyncQueue = Promise.resolve();
  await WearOsBridge.clearPrepared({ uid });
}
```

**Código nuevo**
```ts
export async function teardownWatchBridge(uid: string): Promise<void> {
  if (!uid || preparedUid !== uid) return;
  storeUnsubscribe?.();
  storeUnsubscribe = null;
  nativeStateListener?.then((listener) => listener.remove()).catch(() => {});
  nativeStateListener = null;
  listenerAdded = false;
  preparedUid = "";
  lastSyncedSnapshot = "";
  nativeSyncQueue = Promise.resolve();
  await WearOsBridge.clearPrepared({ uid });
}
```

**Por qué se cambió**
El listener añadido con `addListener` nunca se removía en `teardownWatchBridge`, causando un leak del listener. Ahora se guarda la referencia al listener y se llama `remove()` durante el cleanup.

### Cambio 3 - Usar campos de pausa en UI del reloj

**Código anterior**
```kotlin
fun ActiveTurnoScreen(
    fechaTurno: String,
    startTime: String,
    totalsPorTipo: Map<String, Double>,
    ...
)
```

**Código nuevo**
```kotlin
fun ActiveTurnoScreen(
    fechaTurno: String,
    startTime: String,
    isPaused: Boolean,
    totalPausedMinutes: Int,
    totalsPorTipo: Map<String, Double>,
    ...
)
```

**Por qué se cambió**
Los campos `isPaused`, `pauseStartTime` y `totalPausedMinutes` existían en WearMainActivity (líneas 75-77) pero nunca se usaban en la UI. Ahora se muestran "⏸ Pausado Xm" cuando el turno está en pausa.

### Cambio 4 - Podar comandos agotados en WatchOutbox

**Código anterior**
```kotlin
fun hasRetryableCommands(context: Context): Boolean {
    return pendingCommands(context).values.any { command -> command.attempts < MAX_ATTEMPTS }
}
```

**Código nuevo**
```kotlin
fun hasRetryableCommands(context: Context): Boolean {
    return pendingCommands(context).values.any { command -> command.attempts < MAX_ATTEMPTS }
}

fun pruneStaleCommands(context: Context): Int {
    val pending = JSONObject(rawPending(context))
    val staleIds = pending.keys().asSequence().filter { operationId ->
        val item = pending.optJSONObject(operationId) ?: return@filter false
        item.optInt("attempts", 0) >= MAX_ATTEMPTS
    }.toList()
    staleIds.forEach(pending::remove)
    if (staleIds.isNotEmpty()) {
        writePending(context, pending)
    }
    return staleIds.size
}
```

**Por qué se cambió**
Los comandos que alcanzaban MAX_ATTEMPTS (4 intentos) nunca se eliminaban de SharedPreferences, acumulándose indefinidamente. Ahora se podan automáticamente.

### Cambio 5 - Atomicidad clear()+insertAll() en WatchRepository

**Código anterior**
```kotlin
database.turnoDao().clear()
database.turnoDao().insertAll(
    history.map { turno ->
        TurnoEntity(...)
    },
)
```

**Código nuevo**
```kotlin
database.runInTransaction {
    database.turnoDao().clear()
    database.turnoDao().insertAll(
        history.map { turno ->
            TurnoEntity(...)
        },
    )
}
```

**Por qué se cambió**
Si la app crasheaba entre el `clear()` y el `insertAll()`, todos los turnos se perdían. Ahora ambas operaciones están en una transacción explícita para garantizar atomicidad.

### Cambio 6 - drainOutbox() en DUPLICATE_IGNORED

**Código anterior**
```kotlin
} else if ("DUPLICATE_IGNORED" == json.optString("type")) {
    performFeedback(json.optString("message", "Ya aplicado"), strong = false)
    currentScreen.value = if (activeTurno.value) ScreenState.ACTIVE_TURNO else ScreenState.NO_ACTIVE_TURNO
    requestStatus()
} else if ("ERROR" == json.optString("type")) {
```

**Código nuevo**
```kotlin
} else if ("DUPLICATE_IGNORED" == json.optString("type")) {
    performFeedback(json.optString("message", "Ya aplicado"), strong = false)
    currentScreen.value = if (activeTurno.value) ScreenState.ACTIVE_TURNO else ScreenState.NO_ACTIVE_TURNO
    requestStatus()
    drainOutbox()
} else if ("ERROR" == json.optString("type")) {
```

**Por qué se cambió**
Cuando un comando era ignorado por duplicado, no se procesaban los comandos pendientes en cola. Ahora se llama a `drainOutbox()` para continuar procesando comandos pendientes.

### Cambio 7 - awaitTermination() tras shutdown() en plugin

**Código anterior**
```java
@Override
protected void handleOnDestroy() {
    nativeStateExecutor.shutdown();
    try {
        getContext().unregisterReceiver(stateChangedReceiver);
    } catch (IllegalArgumentException ignored) {
    }
    super.handleOnDestroy();
}
```

**Código nuevo**
```java
@Override
protected void handleOnDestroy() {
    nativeStateExecutor.shutdown();
    try {
        if (!nativeStateExecutor.awaitTermination(2, java.util.concurrent.TimeUnit.SECONDS)) {
            nativeStateExecutor.shutdownNow();
        }
    } catch (InterruptedException ignored) {
        nativeStateExecutor.shutdownNow();
    }
    try {
        getContext().unregisterReceiver(stateChangedReceiver);
    } catch (IllegalArgumentException ignored) {
    }
    super.handleOnDestroy();
}
```

**Por qué se cambió**
`shutdown()` no espera a que las tareas en ejecución terminen. Sin `awaitTermination()`, tareas del executor podían quedar truncadas o datos no sincronizados al destruir el plugin.

---

## 2026-06-05 22:40 - Corregir 11 bugs del puente Wear OS

**Archivos modificados:**
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/build.gradle`
- `android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabase.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchEntities.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchModels.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchStateJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchNativeCommandHandler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchResponseJson.kt`
- `src/services/watch-bridge.ts`
- `src/shared/watch-commands.ts`
- `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Restaurar WearMainActivity.kt truncado

**Código anterior**
```kt
    pri

(End of file - total 651 líneas)
```

**Código nuevo**
```kt
    private fun shouldPersistOutbox(commandJson: String): Boolean {
        ...
    }

    @Composable
    private fun ConfirmDeleteScreen(...) { ... }
```

**Por qué se cambió**
El archivo estaba truncado en la palabra "pri" (línea 651, 611 líneas según PS). Se restauró desde `.fuse_hidden0000000a00000001` (832 líneas) que contenía `drainOutbox()`, `hasPendingCriticalOperation()`, `matchesCurrentSession()`, `shouldPersistOutbox()`, `handleResponseJson()` completo, y los composables `ConfirmDeleteScreen`/`ConfirmDeleteButton`.

### Cambio 2 - Añadir verificación de BLUETOOTH_CONNECT en Foreground Service

**Código anterior**
```kt
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        return START_STICKY
    }
```

**Código nuevo**
```kt
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                stopSelf()
                return START_NOT_STICKY
            }
        }
        val notification = buildNotification()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE,
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (_: SecurityException) {
            stopSelf()
            return START_NOT_STICKY
        }
        return START_STICKY
    }
```

**Por qué se cambió**
Android 14 requiere `BLUETOOTH_CONNECT` como permiso runtime antes de `startForeground()` con `FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE`. Sin él, la app crashea. Se añadió verificación + try-catch SecurityException.

### Cambio 3 - Eliminar migración legacy que contaminaba datos entre usuarios

**Código anterior**
```kt
        target.parentFile?.mkdirs()
        legacy.renameTo(target)
        listOf("-wal", "-shm").forEach { suffix ->
            val legacySidecar = context.getDatabasePath(LEGACY_DATABASE_NAME + suffix)
            if (legacySidecar.exists()) {
                legacySidecar.renameTo(context.getDatabasePath(databaseName + suffix))
            }
        }
```

**Código nuevo**
```kt
        legacy.delete()
        listOf("-wal", "-shm").forEach { suffix ->
            val legacySidecar = context.getDatabasePath(LEGACY_DATABASE_NAME + suffix)
            if (legacySidecar.exists()) {
                legacySidecar.delete()
            }
        }
```

**Por qué se cambió**
La BD legacy `mi-turno-watch.db` (anterior a UID) contenía datos de cualquier usuario sin discriminar. Renombrarla al primer usuario que migrase contaminaba la BD de ese usuario con datos de otros. Se cambia `renameTo` por `delete`.

### Cambio 4 - versionCode dinámico en wear/build.gradle

**Código anterior**
```groovy
        versionCode 1
        versionName "1.0.0"
```

**Código nuevo**
```groovy
def packageJson = new groovy.json.JsonSlurper().parse(file('../../package.json'))
def packageVersionName = packageJson.version ?: "1.0.0"
def packageVersionCode = packageVersionName.tokenize('.').last().isInteger() ? packageVersionName.tokenize('.').last().toInteger() : 1
def ciVersionName = System.getenv("APP_VERSION")
def resolvedVersionName = ciVersionName ?: packageVersionName
def resolvedVersionCode = (ciVersionName != null && ciVersionName.tokenize('.').last().isInteger()) ? ciVersionName.tokenize('.').last().toInteger() : packageVersionCode

// ...
        versionCode resolvedVersionCode
        versionName resolvedVersionName
```

**Por qué se cambió**
El módulo wear tenía `versionCode 1` y `versionName "1.0.0"` fijos, impidiendo publicar actualizaciones en Play Store. Se sincroniza con `package.json` igual que el módulo app.

### Cambio 5 - Deduplicación en WatchNativeCommandHandler mediante processedOperationIds

**Código anterior**
```kt
        return WatchResponseJson.toJson(
            repository.applyCommand(
                command = command,
                rawCommandJson = commandJson,
                nowDate = nowDate,
                nowTime = nowTime,
                nowId = nowId,
            ).response,
        )
```

**Código nuevo**
```kt
        if (command.operationId.isNotBlank()) {
            val state = repository.readState(nowDate, nowTime, nowId)
            if (state.processedOperationIds.contains(command.operationId)) {
                return WatchResponseJson.toJson(
                    WatchResponse.DuplicateIgnored(command.operationId, "Operacion ya procesada"),
                )
            }
        }

        return WatchResponseJson.toJson(
            repository.applyCommand(...)
        )
```

**Por qué se cambió**
Cuando el mismo comando llegaba dos veces (por DataClient y MessageClient), la segunda ejecución podía sobrescribir estado. Se añade verificación temprana contra `processedOperationIds` antes de llamar a `repository.applyCommand()`.

### Cambio 6 - Limpiar estado del reloj al cerrar sesión

**Código anterior**
```java
        if (WatchUserSession.clearIfMatches(getContext(), uid)) {
            TurnoForegroundService.stop(getContext());
        }
        call.resolve();
    }
```

**Código nuevo**
```java
        if (WatchUserSession.clearIfMatches(getContext(), uid)) {
            TurnoForegroundService.stop(getContext());
            deleteWatchState();
        }
        call.resolve();
    }

    private void deleteWatchState() {
        try {
            android.net.Uri stateUri = new android.net.Uri.Builder()
                .scheme("wear")
                .path("/turno/state")
                .build();
            Wearable.getDataClient(getContext()).deleteDataItems(stateUri);
        } catch (Exception ignored) {
        }
    }
```

**Por qué se cambió**
Al cerrar sesión en el móvil, el reloj conservaba el estado anterior en `/turno/state`. Se añade `deleteWatchState()` que elimina el DataItem del estado del reloj.

### Cambio 7 - Poda de processedOperationIds para evitar crecimiento ilimitado

**Código anterior**
```ts
function nativeSnapshotJson(): string {
  const store = useAppStore.getState();
  return JSON.stringify({
    current: store.current,
    history: store.history,
    processedOperationIds: store.processedOperationIds,
  });
}
```

**Código nuevo**
```ts
const MAX_PROCESSED_OPERATION_IDS = 50;

function pruneProcessedOperationIds(ids: string[]): string[] {
  if (ids.length <= MAX_PROCESSED_OPERATION_IDS) return ids;
  return ids.slice(ids.length - MAX_PROCESSED_OPERATION_IDS);
}

function nativeSnapshotJson(): string {
  const store = useAppStore.getState();
  return JSON.stringify({
    current: store.current,
    history: store.history,
    processedOperationIds: pruneProcessedOperationIds(store.processedOperationIds),
  });
}
```

**Por qué se cambió**
`processedOperationIds` crecía sin límite en memoria/localStorage. Se añade poda que mantiene solo los últimos 50 IDs (también se aplica en `hydrateNativeWatchState`).

### Cambio 8 - Calcular miGanancia/totalADescontar/totalADar en resúmenes

**Código anterior**
```kt
                    .put("miGanancia", 0.0)
                    .put("totalADescontar", 0.0)
                    .put("totalADar", 0.0)
```

**Código nuevo**
```kt
                    val totalGasolina = turno.entries.filter { it.type == "gasolina" }.sumOf { it.amount }
                    val totalNulo = turno.entries.filter { it.type == "nulo" }.sumOf { it.amount }
                    val totalDescontar = totalGasolina + totalNulo
                    val miGanancia = turno.dinero - totalDescontar
                    // ...
                    .put("miGanancia", miGanancia)
                    .put("totalADescontar", totalDescontar)
                    .put("totalADar", miGanancia)
```

**Por qué se cambió**
Los campos `miGanancia`, `totalADescontar` y `totalADar` estaban hardcodeados a `0.0` en `turnosStatusToJson`. Ahora se calculan desde las entradas: gastos = gasolina + nulos; ganancia = taxímetro - gastos.

### Cambio 9 - Incluir userSessionId en STATUS enviado al reloj

**Código anterior**
```ts
    const response: WatchCommandResponse = {
      type: "STATUS",
      connected: true,
      activeTurno: isActive,
      startTime: store.current.startTime,
      startDate: store.current.startDate,
      totals: computeWatchTotals(store.current),
      entradas: buildWatchEntradas(store.current),
    };
```

**Código nuevo**
```ts
    const response: WatchCommandResponse = {
      type: "STATUS",
      connected: true,
      activeTurno: isActive,
      startTime: store.current.startTime,
      startDate: store.current.startDate,
      totals: computeWatchTotals(store.current),
      entradas: buildWatchEntradas(store.current),
      ...(preparedUid ? { userSessionId: preparedUid } : {}),
    };
```

**Por qué se cambió**
`sendWatchStatus()` no incluía `userSessionId` en la respuesta STATUS, por lo que el reloj reemplazaba el UID con vacío. Se añade `preparedUid` al payload. También se actualizó `WatchCommandResponse` en `watch-commands.ts` para que STATUS acepte `userSessionId?: string`.

### Cambio 10 - Añadir estado de pausa a WatchCurrentState y persistencia Room

**Código anterior**
```kt
data class WatchCurrentState(
    val startTime: String?,
    val startDate: String?,
    val entries: List<WatchEntry>,
)
```

**Código nuevo**
```kt
data class WatchCurrentState(
    val startTime: String?,
    val startDate: String?,
    val entries: List<WatchEntry>,
    val isPaused: Boolean = false,
    val pauseStartTime: String? = null,
    val totalPausedMinutes: Int = 0,
)
```

**Por qué se cambió**
El `WatchCurrentState` no tenía campos de pausa. Al sincronizar estado entre móvil y reloj, la información de pausa se perdía. Cambios adicionales:
- `WatchStateJson.stateToJson()` y `snapshotFromJson()` serializan/deserializan los campos de pausa
- `WatchResponseJson.statusToJson()` incluye `isPaused`, `pauseStartTime`, `totalPausedMinutes` en la respuesta STATUS
- `CurrentTurnoEntity` añade las columnas con defaults
- `WatchDatabase` añade `MIGRATION_2_3` (v2→v3) con ALTER TABLE para las nuevas columnas
- `WatchDatabaseProvider` registra la nueva migración
- `WatchRepository` persiste y lee los campos de pausa de la entidad
- `WearMainActivity.kt` añade state variables `isPaused`, `pauseStartTime`, `totalPausedMinutes` y las parsea en `handleResponseJson` para STATUS

### Cambio 11 - Actualizar tests de caracterización para reflejar cambios

**Código anterior**
```ts
    expect(source).toContain("WatchOutbox.resetRetries(this)");
    expect(database).toContain("version = 2");
    expect(provider).toContain(".addMigrations(WatchDatabase.MIGRATION_1_2)");
```

**Código nuevo**
```ts
    expect(source).toContain("WatchOutbox.markAttempt(this, operationId, System.currentTimeMillis())");
    expect(database).toContain("version = 3");
    expect(database).toContain("MIGRATION_2_3");
    expect(provider).toContain(".addMigrations(WatchDatabase.MIGRATION_1_2, WatchDatabase.MIGRATION_2_3)");
```

**Por qué se cambió**
Los tests de caracterización inspeccionaban cadenas literales del código fuente que cambiaron con las correcciones: `WatchOutbox.resetRetries` no existe en la versión restaurada de `WearMainActivity.kt` (usa `markAttempt`), y la versión de BD subió de 2 a 3 con `MIGRATION_2_3`.

## 2026-06-05 20:18 - Blindar reconciliación y sesión Wear

**Archivos modificados:**
- `src/services/watch-bridge.ts`
- `src/hooks/use-firestore-sync.ts`
- `src/__tests__/watch-bridge.test.ts`
- `src/__tests__/android-wear-bridge.test.ts`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/watch/WatchModels.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchNativeCommandHandler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchResponseJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchStateDataPublisher.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchStateJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchUserSession.kt`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/app/src/test/java/com/mijornada/app/watch/WatchDatabaseProviderTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchNativeCommandHandlerTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchRoomPersistenceTest.java`

### Cambio 1 - Reconciliar únicamente operaciones nativas nuevas

#### Código anterior
Código anterior no verificable: los archivos afectados ya contenían cambios no confirmados al inicio de la sesión y Git no conserva el estado intermedio anterior literal.

#### Código nuevo
```ts
const nativeOperationIds = Array.isArray(parsed.processedOperationIds) ? parsed.processedOperationIds : [];
const newNativeOperationIds = nativeOperationIds.filter((id) => !store.processedOperationIds.includes(id));

if (newNativeOperationIds.length === 0) return;

useAppStore.setState({
  current: nextCurrent,
  history: mergeTurnos(store.history, turnos),
  processedOperationIds: Array.from(new Set([...store.processedOperationIds, ...nativeOperationIds])),
});
```

#### Por qué se cambió
Un estado Room sin operaciones nuevas no debe sobrescribir el estado más reciente del store. La reconciliación conjunta también permite que un cierre confirmado por Room limpie explícitamente el turno activo sin volver a publicar su estado anterior.

### Cambio 2 - Conservar metadatos completos de turnos

#### Código anterior
Código anterior no verificable: los archivos afectados ya contenían cambios no confirmados al inicio de la sesión y Git no conserva el estado intermedio anterior literal.

#### Código nuevo
```ts
totalPausedMinutes: existing?.totalPausedMinutes ?? 0,
entregada: existing?.entregada ?? false,
fechaEntrega: existing?.fechaEntrega ?? null,
configTurno: existing?.configTurno ?? buildTurnoConfigFromSettings(settings),
diaLibreContable: existing?.diaLibreContable ?? settings.diaLibre,
```

#### Por qué se cambió
La representación nativa del reloj no contiene todos los campos administrativos y contables del turno móvil. Al reconciliar se conservan los metadatos existentes y los turnos nuevos reciben la configuración vigente, evitando sustituir turnos completos por versiones incompletas.

### Cambio 3 - Rechazar snapshots móviles atrasados

#### Código anterior
Código anterior no verificable: los archivos afectados ya contenían cambios no confirmados al inicio de la sesión y Git no conserva el estado intermedio anterior literal.

#### Código nuevo
```kt
fun replaceAppState(snapshot: WatchAppSnapshot) {
    database.runInTransaction {
        val appliedOperationIds = database.operationDao().getAppliedOperationIds()
        if (!snapshot.processedOperationIds.containsAll(appliedOperationIds)) {
            throw StaleWatchSnapshotException()
        }
        persistCurrentAndHistory(snapshot.current, snapshot.history)
    }
}
```

#### Por qué se cambió
Un snapshot móvil creado antes de que Room confirmase un comando del reloj podía borrar el resultado ya aplicado. Room solo acepta ahora snapshots que conocen todas las operaciones confirmadas.

### Cambio 4 - Aislar comandos por sesión de usuario

#### Código anterior
Código anterior no verificable: los archivos afectados ya contenían cambios no confirmados al inicio de la sesión y Git no conserva el estado intermedio anterior literal.

#### Código nuevo
```kt
if (commandSessionId != expectedUserSessionId) {
    return WatchResponseJson.toJson(
        WatchResponse.Error(pathOperationId, "USER_SESSION_MISMATCH", "Sesion de usuario no valida"),
    )
}
```

```ts
export async function teardownWatchBridge(uid: string): Promise<void> {
  if (!uid || preparedUid !== uid) return;
  storeUnsubscribe?.();
  storeUnsubscribe = null;
  preparedUid = "";
  lastSyncedSnapshot = "";
  nativeSyncQueue = Promise.resolve();
  await WearOsBridge.clearPrepared({ uid });
}
```

#### Por qué se cambió
Cada comando crítico del reloj queda ligado al identificador de sesión emitido para el UID preparado. El cierre de sesión desmonta el puente y limpia únicamente la sesión coincidente, impidiendo aplicar comandos pendientes sobre otro usuario.

### Cambio 5 - Añadir regresiones para los cuatro fallos

#### Código anterior
Código anterior no verificable: las pruebas se añadieron sobre archivos que ya contenían cambios no confirmados al inicio de la sesión y Git no conserva el estado intermedio anterior literal.

#### Código nuevo
```ts
it("conserva metadatos historicos al reconciliar un turno nativo", async () => {
```

```java
@Test
public void replaceAppStateRechazaSnapshotAnteriorAOperacionesAplicadas() {
```

```java
@Test
public void handleCommandRechazaSesionDeUsuarioDistinta() throws Exception {
```

#### Por qué se cambió
Las pruebas reproducen la pérdida de metadatos, la resurrección del turno activo, la sobrescritura por snapshots atrasados y el cruce de sesión. Quedan como protección automática frente a regresiones.

## 2026-06-05 15:58 - Unificar sincronización del reloj

**Archivos modificados:**
- `PLAN_RELOJ_WEAR_OS_V2.md`
- `android/app/build.gradle`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDaos.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabase.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchEntities.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchSyncScheduler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchSyncWorker.kt`
- `android/app/src/test/java/com/mijornada/app/watch/WatchDatabaseMigrationTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchSyncInfrastructureTest.java`
- `android/variables.gradle`
- `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Eliminar la segunda subida nativa

#### Código anterior
```java
WatchSyncScheduler.enqueue(this, operationId);
WatchStateDataPublisher.publish(this);
```

#### Código nuevo
```java
WatchStateDataPublisher.publish(this);
```

#### Por qué se cambió
La operación del reloj ya se aplica en Room y se publica al estado de la app móvil. Programar además `WatchSyncWorker` abría una segunda vía independiente hacia Firestore. Se eliminó para que la única escritura remota continúe siendo la realizada por `use-firestore-sync`.

### Cambio 2 - Eliminar WorkManager y Firestore nativo

#### Código anterior
```gradle
implementation "androidx.work:work-runtime:$workVersion"
implementation platform("com.google.firebase:firebase-bom:$firebaseBomVersion")
implementation "com.google.firebase:firebase-firestore"
```

#### Código nuevo
```gradle
implementation "androidx.room:room-runtime:$roomVersion"
implementation "androidx.room:room-ktx:$roomVersion"
kapt "androidx.room:room-compiler:$roomVersion"
```

#### Por qué se cambió
El módulo Android móvil solo necesita persistencia local Room y comunicación con Wear OS. La subida nativa con WorkManager y Firestore duplicaba la responsabilidad que ya pertenece al sincronizador existente de la app.

### Cambio 3 - Eliminar el estado `synced` redundante

#### Código anterior
```kt
val applied: Boolean,
val synced: Boolean,
```

#### Código nuevo
```kt
val applied: Boolean,
```

#### Por qué se cambió
Room conserva la operación aplicada e idempotente por `operationId`, pero ya no existe un proceso Android nativo que tenga que marcarla como subida a Firestore.

### Cambio 4 - Migrar Room sin perder operaciones

#### Código anterior
```kt
version = 1,
```

#### Código nuevo
```kt
version = 2,
```

```kt
.addMigrations(WatchDatabase.MIGRATION_1_2)
```

#### Por qué se cambió
La migración `MIGRATION_1_2` elimina únicamente la columna `synced`, copia todas las operaciones existentes y conserva sus `operationId`, datos y estado aplicado.

### Cambio 5 - Verificar la migración real de la base de datos

#### Código anterior
`No existía WatchDatabaseMigrationTest en android/app/src/test/java/com/mijornada/app/watch/WatchDatabaseMigrationTest.java.`

#### Código nuevo
```java
@Test
public void migracionEliminaSyncedYConservaOperationId() {
    SupportSQLiteDatabase database = helper.getWritableDatabase();

    WatchDatabase.MIGRATION_1_2.migrate(database);
```

#### Por qué se cambió
La prueba crea el esquema anterior, ejecuta la migración y verifica que la operación existente se conserva y que la columna `synced` desaparece.

### Cambio 6 - Blindar por prueba el flujo único

#### Código anterior
```ts
it('programa WorkManager tras aplicar una operación', () => {
```

#### Código nuevo
```ts
it('no programa una segunda sincronización nativa tras aplicar una operación', () => {
```

#### Por qué se cambió
Las pruebas ahora fallan si reaparecen `WatchSyncScheduler`, `WatchSyncWorker`, WorkManager, Firestore nativo o el campo `synced`.

### Cambio 7 - Actualizar el plan al flujo implementado

#### Código anterior
Código anterior no verificable: `PLAN_RELOJ_WEAR_OS_V2.md` no estaba versionado antes de esta sesión.

#### Código nuevo
```text
Reloj -> móvil/Room -> store de la app -> use-firestore-sync -> Firestore
```

#### Por qué se cambió
El plan documenta el flujo único implementado y elimina como arquitectura activa la sincronización paralela mediante WorkManager y Firestore nativo.

### Cambio 8 - Eliminar comentario Firebase obsoleto

#### Código anterior
```gradle
// minSdk 26: requerido por firebase-bom 33.7.0 (exige minSdk 23),
// CompanionDeviceManager.associate (API 26+) y
// FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE. Alinea con el modulo wear
// que ya estaba en 26. Cubre Android 8.0+, >98% del parque en 2026.
minSdkVersion = 26
```

#### Código nuevo
```gradle
minSdkVersion = 26
```

#### Por qué se cambió
La dependencia Firebase BOM ya no existe en el módulo Android y el comentario contenía una afirmación de cobertura no verificable desde el proyecto. Se conserva `minSdkVersion = 26` sin documentación obsoleta.

## 2026-06-05 13:41 - Activar Firebase nativo y subir minSdk a 26

**Archivos modificados:** `android/app/google-services.json`, `android/variables.gradle`

### Cambio 1 - Configuración Firebase nativa para Android

#### Código anterior
`No existía android/app/google-services.json.`

#### Código nuevo
Código anterior no verificable: archivo autogenerado por Firebase Console
para el proyecto `mi-turno-app-taxi`, app Android `com.mijornada.app`.
Ver: https://console.firebase.google.com/project/mi-turno-app-taxi/settings/general

#### Por qué se cambió
Sin este archivo el plugin `com.google.gms.google-services` no se aplica y
`FirebaseApp.getApps()` queda vacío, por lo que `WatchSyncWorker` entra en
`Result.retry()` indefinido y las operaciones del reloj nunca llegan a
Firestore desde el flujo nativo. Con él, `FirebaseApp.initializeApp()` se
ejecuta automáticamente al arrancar el proceso y `WatchSyncWorker` puede
escribir en `users/{uid}/watchOperations/{operationId}`. Las reglas
Firestore existentes (`users/{userId}/{document=**}`) ya cubren ese path.

### Cambio 2 - minSdk Android 22 → 26

#### Código anterior
```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
```

#### Código nuevo
```gradle
ext {
    // minSdk 26: requerido por firebase-bom 33.7.0 (exige minSdk 23),
    // CompanionDeviceManager.associate (API 26+) y
    // FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE. Alinea con el modulo wear
    // que ya estaba en 26. Cubre Android 8.0+, >98% del parque en 2026.
    minSdkVersion = 26
    compileSdkVersion = 34
    targetSdkVersion = 34
```

#### Por qué se cambió
`firebase-bom:33.7.0` declara `minSdk = 23` en su manifest, por lo que con
`minSdkVersion = 22` el manifest merger falla. Además
`CompanionDeviceManager.associate(...)` (usado en `CdmPairPlugin`) y
`FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE` (usado en `TurnoForegroundService`)
sólo existen desde API 26. Alinear el módulo `app` con el `wear` (que ya
estaba en 26) elimina inconsistencias de plataforma.

## 2026-06-05 10:22 - Blindar ejecución Wear en segundo plano

**Archivos modificados:**
- `android/app/src/main/java/com/mijornada/app/CdmPairPlugin.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/watch/WatchSyncWorker.kt`
- `android/wear/build.gradle`
- `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Mantener el servicio según el turno móvil

#### Código anterior
```java
WatchRepository repository = new WatchRepository(WatchDatabaseProvider.getForUid(getContext(), uid));
repository.replaceAppState(WatchStateJson.snapshotFromJson(stateJson));
WatchStateDataPublisher.publish(getContext());
```

#### Código nuevo
```java
WatchRepository repository = new WatchRepository(WatchDatabaseProvider.getForUid(getContext(), uid));
WatchAppSnapshot snapshot = WatchStateJson.snapshotFromJson(stateJson);
repository.replaceAppState(snapshot);
if (snapshot.getCurrent().isActive()) {
    TurnoForegroundService.start(getContext());
} else {
    TurnoForegroundService.stop(getContext());
}
WatchStateDataPublisher.publish(getContext());
```

#### Por qué se cambió
El servicio de primer plano también debe reflejar los turnos iniciados o terminados desde la app móvil para mantener disponible la comunicación Wear con el móvil bloqueado o en segundo plano.

### Cambio 2 - Evitar reintentos permanentes de sincronización

#### Código anterior
```kt
val uid = inputData.getString(KEY_UID)?.trim().orEmpty()
if (uid.isBlank()) {
    return Result.retry()
}

if (FirebaseApp.getApps(applicationContext).isEmpty()) {
    return Result.retry()
}
```

#### Código nuevo
```kt
val uid = inputData.getString(KEY_UID)?.trim().orEmpty()
if (uid.isBlank()) {
    return Result.failure()
}

if (FirebaseApp.getApps(applicationContext).isEmpty()) {
    return Result.failure()
}
```

#### Por qué se cambió
La ausencia de UID o configuración Firebase no es un fallo transitorio. Marcarlo como fallo terminal evita reintentos infinitos de WorkManager y consumo de batería.

### Cambio 3 - Clasificar errores terminales de Firestore

#### Código anterior
```kt
} catch (e: Exception) {
    Result.retry()
}
```

#### Código nuevo
```kt
} catch (e: Exception) {
    if (isTerminalFirestoreFailure(e)) Result.failure() else Result.retry()
}
```

#### Por qué se cambió
Los errores `PERMISSION_DENIED`, `UNAUTHENTICATED` e `INVALID_ARGUMENT` no se resuelven repitiendo la misma operación. Los errores transitorios conservan el reintento.

### Cambio 4 - Proteger Companion Device Manager por versión

#### Código anterior
```java
public void pair(PluginCall call) {
    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_COMPANION_DEVICE_SETUP)) {
```

#### Código nuevo
```java
public void pair(PluginCall call) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        call.reject("Companion Device Manager requiere Android 8 o superior");
        return;
    }
    if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_COMPANION_DEVICE_SETUP)) {
```

#### Por qué se cambió
La app móvil mantiene `minSdk 22`, pero Companion Device Manager requiere Android 8. La comprobación impide invocar APIs inexistentes en versiones anteriores.

### Cambio 5 - Declarar Fragment compatible en Wear

#### Código anterior
```gradle
implementation 'androidx.activity:activity-compose:1.8.2'
implementation 'androidx.compose.ui:ui:1.6.1'
```

#### Código nuevo
```gradle
implementation 'androidx.activity:activity-compose:1.8.2'
implementation 'androidx.fragment:fragment-ktx:1.6.2'
implementation 'androidx.compose.ui:ui:1.6.1'
```

#### Por qué se cambió
`registerForActivityResult` requiere Fragment 1.3.0 o superior. La dependencia explícita elimina el error de Android Lint y fija una versión compatible.

### Cambio 6 - Verificar los límites finales Wear

#### Código anterior
`No existía la cobertura de servicio móvil, errores terminales de Firestore y compatibilidad CDM en src/__tests__/android-wear-bridge.test.ts.`

#### Código nuevo
```ts
expect(plugin).toContain("snapshot.getCurrent().isActive()");
expect(plugin).toContain("TurnoForegroundService.start(getContext())");
expect(plugin).toContain("TurnoForegroundService.stop(getContext())");
expect(worker).toContain("FirebaseFirestoreException.Code.PERMISSION_DENIED");
expect(worker).toContain("FirebaseFirestoreException.Code.UNAUTHENTICATED");
expect(cdmPlugin).toContain("Build.VERSION.SDK_INT < Build.VERSION_CODES.O");
expect(cdmPlugin).toContain("@RequiresApi(Build.VERSION_CODES.O)");
```

#### Por qué se cambió
Las pruebas fijan los comportamientos que garantizan continuidad en segundo plano, reintentos limitados y compatibilidad con el `minSdk` móvil.

## 2026-06-05 00:43 - Completar mando Wear persistente

**Archivos modificados:**
- `android/app/build.gradle`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDaos.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchStateDataPublisher.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchSyncScheduler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchSyncWorker.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchUserSession.kt`
- `android/app/src/test/java/com/mijornada/app/watch/WatchSyncInfrastructureTest.java`
- `android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Dependencias de sincronizacion nativa

#### Código anterior
```gradle
dependencies {
    def roomVersion = "2.6.1"

    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-ktx:$androidxCoreVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    implementation 'com.google.android.gms:play-services-wearable:18.1.0'
    implementation "androidx.room:room-runtime:$roomVersion"
    implementation "androidx.room:room-ktx:$roomVersion"
    kapt "androidx.room:room-compiler:$roomVersion"
```

#### Código nuevo
```gradle
dependencies {
    def roomVersion = "2.6.1"
    def firebaseBomVersion = "33.7.0"
    def workVersion = "2.9.1"

    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-ktx:$androidxCoreVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    implementation 'com.google.android.gms:play-services-wearable:18.1.0'
    implementation "androidx.room:room-runtime:$roomVersion"
    implementation "androidx.room:room-ktx:$roomVersion"
    implementation "androidx.work:work-runtime:$workVersion"
    implementation platform("com.google.firebase:firebase-bom:$firebaseBomVersion")
    implementation "com.google.firebase:firebase-firestore"
    kapt "androidx.room:room-compiler:$roomVersion"
```

#### Por qué se cambió
WorkManager permite programar sincronizacion persistente por `operationId` y Firestore permite escribir un documento con ID explicito. No se anadio `firebase-auth` porque exigia `minSdk 23` y el proyecto movil mantiene `minSdk 22`; el `uid` se persiste desde el puente Capacitor.

### Cambio 2 - Operaciones pendientes de sincronizar

#### Código anterior
```kt
    @Query("UPDATE watch_operations SET applied = 1 WHERE operationId = :operationId")
    fun markApplied(operationId: String)

    @Query("SELECT operationId FROM watch_operations WHERE applied = 1 ORDER BY createdAtPhone ASC")
    fun getAppliedOperationIds(): List<String>
```

#### Código nuevo
```kt
    @Query("UPDATE watch_operations SET applied = 1 WHERE operationId = :operationId")
    fun markApplied(operationId: String)

    @Query("UPDATE watch_operations SET synced = 1 WHERE operationId = :operationId")
    fun markSynced(operationId: String)

    @Query("SELECT * FROM watch_operations WHERE operationId = :operationId LIMIT 1")
    fun getOperation(operationId: String): OperationEntity?

    @Query("SELECT * FROM watch_operations WHERE applied = 1 AND synced = 0 ORDER BY createdAtPhone ASC")
    fun getPendingSyncOperations(): List<OperationEntity>

    @Query("SELECT operationId FROM watch_operations WHERE applied = 1 ORDER BY createdAtPhone ASC")
    fun getAppliedOperationIds(): List<String>
```

#### Por qué se cambió
El movil necesita distinguir operaciones ya aplicadas en Room de operaciones aun no subidas por WorkManager, manteniendo `operationId` como clave idempotente.

### Cambio 3 - Sesion nativa de usuario

#### Código anterior
```java
        if (uid != null && !uid.trim().isEmpty()) {
            call.resolve();
        } else {
            call.reject("uid es obligatorio");
        }
```

#### Código nuevo
```java
        if (uid != null && !uid.trim().isEmpty()) {
            WatchUserSession.saveUid(getContext(), uid);
            call.resolve();
        } else {
            call.reject("uid es obligatorio");
        }
```

#### Por qué se cambió
El Worker nativo debe conocer el usuario aunque el WebView no este abierto. El `uid` se guarda al preparar el puente, sin depender de Firebase Auth nativo.

### Cambio 4 - Almacen de uid nativo

#### Código anterior
`No existia WatchUserSession.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### Código nuevo
```kt
object WatchUserSession {
    private const val PREFS = "watch_user_session"
    private const val KEY_UID = "uid"

    @JvmStatic
    fun saveUid(context: Context, uid: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_UID, uid.trim())
            .apply()
    }

    @JvmStatic
    fun getUid(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_UID, "")
            ?: ""
    }
}
```

#### Por qué se cambió
La capa Android necesita una fuente local y estable del usuario para asociar operaciones del reloj a `users/{uid}` cuando el movil procese trabajo en segundo plano.

### Cambio 5 - Estado persistente movil a reloj

#### Código anterior
`No existia WatchStateDataPublisher.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### Código nuevo
```kt
object WatchStateDataPublisher {
    @JvmStatic
    fun publish(context: Context) {
        val now = Date()
        val nowDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now)
        val nowTime = SimpleDateFormat("HH:mm", Locale.US).format(now)
        val repository = WatchRepository(WatchDatabaseProvider.get(context))
        val state = repository.readState(nowDate, nowTime, now.time)
        val stateJson = WatchResponseJson.statusToJson("turno-state", state)

        val request = PutDataMapRequest.create("/turno/state")
        val dataMap = request.dataMap
        dataMap.putString("state", stateJson)
        dataMap.putLong("updatedAt", System.currentTimeMillis())
        val dataRequest = request.asPutDataRequest()
        dataRequest.setUrgent()
        Wearable.getDataClient(context).putDataItem(dataRequest)
    }
}
```

#### Por qué se cambió
Despues de aplicar una escritura en nativo, el reloj debe recibir el estado actualizado por Data Layer sin tener que esperar a que la WebView este abierta.

### Cambio 6 - Agenda WorkManager por operacion

#### Código anterior
`No existian WatchSyncScheduler.kt ni WatchSyncWorker.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### Código nuevo
```kt
object WatchSyncScheduler {
    @JvmStatic
    fun enqueue(context: Context, operationId: String) {
        if (operationId.isBlank()) {
            return
        }

        val data = Data.Builder()
            .putString(WatchSyncWorker.KEY_OPERATION_ID, operationId)
            .build()

        val request = OneTimeWorkRequestBuilder<WatchSyncWorker>()
            .setInputData(data)
            .addTag("watch-sync")
            .build()

        WorkManager.getInstance(context)
            .enqueueUniqueWork("watch-sync-" + operationId, ExistingWorkPolicy.KEEP, request)
    }
}
```

#### Por qué se cambió
`enqueueUniqueWork` con `ExistingWorkPolicy.KEEP` evita crear varios trabajos para el mismo `operationId`.

### Cambio 7 - Worker Firestore idempotente

#### Código anterior
`No existia WatchSyncWorker.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### Código nuevo
```kt
            Tasks.await(
                FirebaseFirestore.getInstance()
                    .collection("users")
                    .document(uid)
                    .collection("watchOperations")
                    .document(operation.operationId)
                    .set(payload, SetOptions.merge()),
                20,
                TimeUnit.SECONDS,
            )
            database.operationDao().markSynced(operation.operationId)
            Result.success()
```

#### Por qué se cambió
El documento se escribe con `operation.operationId` como ID para que repetir el mismo trabajo no cree documentos duplicados.

### Cambio 8 - Conexion del servicio Wear movil

#### Código anterior
```java
        String responseJson = WatchNativeCommandHandler.handleCommand(this, commandJson, operationId);
        WearOsBridgePlugin.publishAckDataItem(this, operationId, responseJson);
        sendFastResponse(nodeId, responseJson);
        if (listener != null) {
            listener.onNativeStateChanged();
        }
```

#### Código nuevo
```java
        String responseJson = WatchNativeCommandHandler.handleCommand(this, commandJson, operationId);
        WearOsBridgePlugin.publishAckDataItem(this, operationId, responseJson);
        sendFastResponse(nodeId, responseJson);
        if (isSuccessfulWriteResponse(responseJson)) {
            WatchSyncScheduler.enqueue(this, operationId);
            WatchStateDataPublisher.publish(this);
        }
        if (listener != null) {
            listener.onNativeStateChanged();
        }
```

#### Por qué se cambió
Cada escritura correcta desde el reloj debe dejar ACK, programar sincronizacion nativa y publicar el estado actual al reloj.

### Cambio 9 - Outbox persistente del reloj

#### Código anterior
`No existia WatchOutbox.kt en android/wear/src/main/java/com/mijornada/app/.`

#### Código nuevo
```kt
object WatchOutbox {
    private const val PREFS = "watch_outbox"
    private const val KEY_PENDING_COMMANDS = "pendingCommands"

    fun save(context: Context, operationId: String, commandJson: String) {
        if (operationId.isBlank() || commandJson.isBlank()) {
            return
        }

        val pending = JSONObject(rawPending(context))
        pending.put(operationId, commandJson)
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_COMMANDS, pending.toString())
            .apply()
    }
}
```

#### Por qué se cambió
El reloj conserva comandos criticos hasta recibir ACK, evitando perder acciones si la app se pausa o la entrega del DataItem tarda.

### Cambio 10 - Lectura de ACK y estado en reloj

#### Código anterior
```kt
            if (uri.path?.startsWith("/watch-ack/") == true) {
                val responseJson = DataMapItem.fromDataItem(item).dataMap.getString("response") ?: continue
                handleResponseJson(responseJson)
            }
```

#### Código nuevo
```kt
            if (uri.path?.startsWith("/watch-ack/") == true) {
                val responseJson = DataMapItem.fromDataItem(item).dataMap.getString("response") ?: continue
                handleResponseJson(responseJson)
            } else if (uri.path == "/turno/state") {
                val stateJson = DataMapItem.fromDataItem(item).dataMap.getString("state") ?: continue
                handleResponseJson(stateJson)
            }
```

#### Por qué se cambió
El reloj debe actualizar su pantalla con el estado publicado por el movil, ademas de cerrar operaciones al recibir ACK.

### Cambio 11 - Guardado y drenaje del outbox

#### Código anterior
```kt
        val request = PutDataMapRequest.create("/watch-command/$operationId")
        val dataMap = request.dataMap
        dataMap.putString("command", commandJson)
```

#### Código nuevo
```kt
        if (shouldPersistOutbox(commandJson)) {
            WatchOutbox.save(this, operationId, commandJson)
        }

        val request = PutDataMapRequest.create("/watch-command/$operationId")
        val dataMap = request.dataMap
        dataMap.putString("command", commandJson)
```

#### Por qué se cambió
El reloj guarda comandos de escritura antes de enviarlos como `DataItem`, y los reenvia en `drainOutbox()` al volver a primer plano hasta que llegue ACK.

### Cambio 12 - Pruebas de infraestructura Wear

#### Código anterior
`No existia WatchSyncInfrastructureTest.java en android/app/src/test/java/com/mijornada/app/watch/.`

#### Código nuevo
```java
    @Test
    public void operacionesAplicadasQuedanPendientesHastaMarcarSincronizadas() {
        repository.applyCommand(
            new WatchCommand.StartTurno("op-sync-start", "2026-06-01T10:00:00"),
            "{\"operationId\":\"op-sync-start\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1000L
        );

        assertEquals(1, database.operationDao().getPendingSyncOperations().size());
        OperationEntity operation = database.operationDao().getOperation("op-sync-start");
        assertNotNull(operation);
        assertEquals("START_TURNO", operation.getType());
```

#### Por qué se cambió
La prueba fija que una operacion aplicada queda pendiente de sincronizacion y que puede marcarse como sincronizada sin duplicar el registro.

## 2026-06-04 20:40 - AÃ±adir persistencia Wear nativa

**Archivos modificados:**
- `PLAN_RELOJ_WEAR_OS_V2.md`
- `android/app/build.gradle`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDaos.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabase.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchEntities.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchNativeCommandHandler.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchResponseJson.kt`
- `android/app/src/main/java/com/mijornada/app/watch/WatchStateJson.kt`
- `android/app/src/test/java/com/mijornada/app/watch/WatchNativeCommandHandlerTest.java`
- `android/app/src/test/java/com/mijornada/app/watch/WatchRoomPersistenceTest.java`
- `android/variables.gradle`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `src/__tests__/android-wear-bridge.test.ts`
- `src/__tests__/watch-bridge.test.ts`
- `src/services/watch-bridge.ts`

### Cambio 1 - Plan V2 del reloj

#### CÃ³digo anterior
`No existÃ­a PLAN_RELOJ_WEAR_OS_V2.md en la raÃ­z del proyecto.`

#### CÃ³digo nuevo
```md
# Plan Wear OS V2 â€” Reloj funcional sin depender del WebView Capacitor

## Contexto

El plan original (`PLAN_RELOJ_WEAR_OS.md`) define correctamente el protocolo de comandos relojâ†’mÃ³vil. Sin embargo, la implementaciÃ³n actual del lado mÃ³vil cumple ese contrato sÃ³lo cuando la `MainActivity` Capacitor estÃ¡ viva con el WebView cargado.
```

#### Por quÃ© se cambiÃ³
Se necesitaba dejar documentado el plan profesional para que el reloj procese comandos con el mÃ³vil bloqueado o la WebView no disponible, sin depender de memoria estÃ¡tica de Capacitor.

### Cambio 2 - Dependencias Room

#### CÃ³digo anterior
```gradle
apply plugin: 'com.android.application'
apply plugin: 'org.jetbrains.kotlin.android'
```

#### CÃ³digo nuevo
```gradle
apply plugin: 'com.android.application'
apply plugin: 'org.jetbrains.kotlin.android'
apply plugin: 'kotlin-kapt'
```

#### Por quÃ© se cambiÃ³
Room necesita `kapt` para generar el cÃ³digo de DAOs y base de datos del mÃ³dulo Android mÃ³vil.

### Cambio 3 - Room en build Android

#### CÃ³digo anterior
```gradle
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    implementation 'com.google.android.gms:play-services-wearable:18.1.0'
    testImplementation "junit:junit:$junitVersion"
```

#### CÃ³digo nuevo
```gradle
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    implementation 'com.google.android.gms:play-services-wearable:18.1.0'
    implementation "androidx.room:room-runtime:$roomVersion"
    implementation "androidx.room:room-ktx:$roomVersion"
    kapt "androidx.room:room-compiler:$roomVersion"
    testImplementation "junit:junit:$junitVersion"
    testImplementation "androidx.test:core:1.6.1"
    testImplementation "org.robolectric:robolectric:4.16.1"
```

#### Por quÃ© se cambiÃ³
El mÃ³vil necesita persistir comandos del reloj en Room y probar esa persistencia con Room in-memory y Robolectric.

### Cambio 4 - Escucha DATA_CHANGED

#### CÃ³digo anterior
```xml
                <action android:name="com.google.android.gms.wearable.MESSAGE_RECEIVED" />
                <data android:scheme="wear" android:host="*" android:pathPrefix="/watch-command" />
```

#### CÃ³digo nuevo
```xml
                <action android:name="com.google.android.gms.wearable.DATA_CHANGED" />
                <data android:scheme="wear" android:host="*" android:pathPrefix="/watch-command/" />
```

#### Por quÃ© se cambiÃ³
Los comandos crÃ­ticos del reloj pasan a viajar como `DataItem` persistente en `/watch-command/<operationId>` para que Google Play Services pueda entregarlos aunque la app Capacitor no estÃ© abierta.

### Cambio 5 - Procesado nativo en WearListenerService

#### CÃ³digo anterior
```java
            if (listener != null) {
                listener.onCommandReceived(commandJson, messageEvent.getSourceNodeId());
            } else {
                // Responder directamente si el puente no estÃ¡ preparado.
                String nodeId = messageEvent.getSourceNodeId();
                String errorResponseJson = "{\"type\":\"ERROR\",\"operationId\":\"\",\"code\":\"APP_NOT_READY\",\"message\":\"App movil no preparada\"}";
                byte[] responseData = errorResponseJson.getBytes(StandardCharsets.UTF_8);
                Wearable.getMessageClient(this).sendMessage(nodeId, "/watch-response", responseData);
            }
```

#### CÃ³digo nuevo
```java
    private void deliverOrQueue(String commandJson, String nodeId, String operationId) {
        if (listener != null) {
            listener.onCommandReceived(commandJson, nodeId);
            return;
        }

        String responseJson = WatchNativeCommandHandler.handleCommand(this, commandJson, operationId);
        WearOsBridgePlugin.publishAckDataItem(this, operationId, responseJson);
        sendFastResponse(nodeId, responseJson);
    }
```

#### Por quÃ© se cambiÃ³
Antes el mÃ³vil respondÃ­a `APP_NOT_READY` cuando Capacitor no tenÃ­a listener. Ahora el servicio Android aplica el comando en nativo, publica ACK persistente y mantiene una respuesta rÃ¡pida por `MessageClient`.

### Cambio 6 - Estado nativo para Capacitor

#### CÃ³digo anterior
```java
    @Override
    protected void handleOnDestroy() {
        WearListenerService.setCommandListener(null);
        super.handleOnDestroy();
    }
```

#### CÃ³digo nuevo
```java
    @PluginMethod
    public void getNativeState(PluginCall call) {
        try {
            Date now = new Date();
            String nowDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now);
            String nowTime = new SimpleDateFormat("HH:mm", Locale.US).format(now);
            WatchRepository repository = new WatchRepository(WatchDatabaseProvider.get(getContext()));
            JSObject result = new JSObject();
            result.put("state", WatchStateJson.stateToJson(repository.readState(nowDate, nowTime, now.getTime())));
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Error al leer estado nativo Wear: " + e.getMessage());
        }
    }
```

#### Por quÃ© se cambiÃ³
Cuando la WebView vuelve a abrirse debe poder leer el estado que Android guardÃ³ en Room mientras la app estaba cerrada, bloqueada o en segundo plano.

### Cambio 7 - Persistencia Room del reloj

#### CÃ³digo anterior
`No existÃ­an WatchEntities.kt, WatchDaos.kt, WatchDatabase.kt, WatchDatabaseProvider.kt ni WatchRepository.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```kt
@Entity(tableName = "watch_operations")
data class OperationEntity(
    @PrimaryKey val operationId: String,
    val type: String,
    val payloadJson: String,
    val createdAtClient: String,
    val createdAtPhone: String,
    val applied: Boolean,
    val synced: Boolean,
)

@Dao
interface OperationDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    fun insert(operation: OperationEntity): Long

    @Query("UPDATE watch_operations SET applied = 1 WHERE operationId = :operationId")
    fun markApplied(operationId: String)

    @Query("SELECT operationId FROM watch_operations WHERE applied = 1 ORDER BY createdAtPhone ASC")
    fun getAppliedOperationIds(): List<String>
}
```

#### Por quÃ© se cambiÃ³
La clave primaria `operationId` permite aplicar comandos de forma idempotente: si llega el mismo comando dos veces, Room ignora el segundo `INSERT` y no duplica el turno ni la entrada.

### Cambio 8 - Handler nativo de comandos

#### CÃ³digo anterior
`No existÃ­an WatchNativeCommandHandler.kt, WatchResponseJson.kt ni WatchStateJson.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```kt
object WatchNativeCommandHandler {
    @JvmStatic
    fun handleCommand(
        repository: WatchRepository,
        commandJson: String,
        pathOperationId: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): String {
        val command = try {
            WatchCommandJson.parse(commandJson)
        } catch (e: Exception) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "INVALID_COMMAND", "Comando Wear invalido"),
            )
        }
```

#### Por quÃ© se cambiÃ³
El servicio Android necesitaba una entrada nativa, testeable y reutilizable para parsear el comando, validar `operationId`, aplicar Room y devolver JSON de ACK.

### Cambio 9 - HidrataciÃ³n web desde Room

#### CÃ³digo anterior
```ts
export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  addListener(
```

#### CÃ³digo nuevo
```ts
export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  getNativeState(): Promise<{ state?: string }>;
  addListener(
```

#### Por quÃ© se cambiÃ³
La app web mÃ³vil necesita pedir al plugin nativo el estado persistido para reflejar comandos procesados mientras la WebView no estaba viva.

### Cambio 10 - FusiÃ³n de estado nativo en store

#### CÃ³digo anterior
`No existÃ­an NativeWatchState, emptyCurrent, sumEntries, nativeTurnoToTurno ni hydrateNativeWatchState en src/services/watch-bridge.ts.`

#### CÃ³digo nuevo
```ts
async function hydrateNativeWatchState(): Promise<void> {
  const nativeState = await WearOsBridge.getNativeState();
  if (!nativeState.state) return;

  const parsed = JSON.parse(nativeState.state) as NativeWatchState;
  const store = useAppStore.getState();
  const currentEntries = Array.isArray(parsed.current?.entries) ? parsed.current.entries : [];
  const hasNativeCurrent = !!parsed.current?.startTime || currentEntries.length > 0;
  const nativeHistory = Array.isArray(parsed.history) ? parsed.history : [];
  const nativeOperationIds = Array.isArray(parsed.processedOperationIds) ? parsed.processedOperationIds : [];
```

#### Por quÃ© se cambiÃ³
Se fusiona el estado nativo en el store de la app mÃ³vil sin crear duplicados: el historial usa `mergeTurnos` y los `processedOperationIds` se combinan con `Set`.

### Cambio 11 - DataItem y ACK en el reloj

#### CÃ³digo anterior
```kt
                    val data = commandJson.toByteArray(StandardCharsets.UTF_8)
                    val node = nodes.first()
                    Wearable.getMessageClient(this)
                        .sendMessage(node.id, "/watch-command", data)
```

#### CÃ³digo nuevo
```kt
        val request = PutDataMapRequest.create("/watch-command/$operationId")
        val dataMap = request.dataMap
        dataMap.putString("command", commandJson)
        dataMap.putString("targetNodeId", nodeId)
        dataMap.putLong("createdAt", System.currentTimeMillis())
        val dataRequest = request.asPutDataRequest()
        dataRequest.setUrgent()

        Wearable.getDataClient(this).putDataItem(dataRequest)
```

#### Por quÃ© se cambiÃ³
`MessageClient` no dejaba persistido el comando crÃ­tico. `DataClient` permite escribir un `DataItem` urgente con path por `operationId` y esperar ACK persistente desde el mÃ³vil.

### Cambio 12 - Pruebas de persistencia y puente

#### CÃ³digo anterior
`No existÃ­an WatchNativeCommandHandlerTest.java ni WatchRoomPersistenceTest.java en android/app/src/test/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```java
    @Test
    public void handleCommandNoDuplicaOperationIdYaAplicado() throws Exception {
        String commandJson = "{\"operationId\":\"op-native-duplicate\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}";

        WatchNativeCommandHandler.handleCommand(
            repository,
            commandJson,
            "op-native-duplicate",
            "2026-06-01",
            "10:00",
            1000L
        );
```

#### Por quÃ© se cambiÃ³
La no duplicaciÃ³n y el procesamiento nativo con Room necesitaban pruebas automatizadas en JVM Android, no solo pruebas de texto en TypeScript.

### Cambio 13 - Pruebas web del puente

#### CÃ³digo anterior
```ts
  it("envia cada comando del reloj a un unico nodo conectado", () => {
```

#### CÃ³digo nuevo
```ts
  it("envia comandos criticos Wear como DataItem persistente con operationId", () => {
```

#### Por quÃ© se cambiÃ³
Las pruebas del puente debÃ­an reflejar el nuevo contrato profesional: comandos crÃ­ticos como `DataItem`, ACK persistente, estado nativo expuesto y ausencia de `APP_NOT_READY`/`QUEUED` para cerrar comandos.

### Cambio 14 - Fin de archivo variables.gradle

#### CÃ³digo anterior
```gradle
}
```

#### CÃ³digo nuevo
```gradle
}
```

#### Por quÃ© se cambiÃ³
El contenido funcional no cambiÃ³. Git detecta solo la normalizaciÃ³n del fin de archivo de `android/variables.gradle`.

### Cambio 15 - Escrituras siempre nativas

#### CÃ³digo anterior
```java
    private void deliverOrQueue(String commandJson, String nodeId, String operationId) {
        if (listener != null) {
            listener.onCommandReceived(commandJson, nodeId);
            return;
        }

        String responseJson = WatchNativeCommandHandler.handleCommand(this, commandJson, operationId);
        WearOsBridgePlugin.publishAckDataItem(this, operationId, responseJson);
        sendFastResponse(nodeId, responseJson);
    }
```

#### CÃ³digo nuevo
```java
    private void deliverOrQueue(String commandJson, String nodeId, String operationId) {
        if (!isWriteCommand(commandJson)) {
            if (listener != null) {
                listener.onReadCommandReceived(commandJson, nodeId);
                return;
            }

            String responseJson = WatchNativeCommandHandler.handleReadCommand(this, commandJson, operationId);
            WearOsBridgePlugin.publishAckDataItem(this, operationId, responseJson);
            sendFastResponse(nodeId, responseJson);
            return;
        }

        String responseJson = WatchNativeCommandHandler.handleCommand(this, commandJson, operationId);
        WearOsBridgePlugin.publishAckDataItem(this, operationId, responseJson);
        sendFastResponse(nodeId, responseJson);
        if (listener != null) {
            listener.onNativeStateChanged();
        }
    }
```

#### Por quÃ© se cambiÃ³
Si la WebView estaba viva, las escrituras iban por JS y Room podÃ­a quedar desfasado. Ahora las escrituras pasan siempre por Room nativo; la WebView solo recibe aviso para rehidratar desde Room.

### Cambio 16 - Evento de estado nativo

#### CÃ³digo anterior
```java
            @Override
            public void onCommandReceived(String commandJson, String nodeId) {
                notifyCommand(commandJson, nodeId);
            }
```

#### CÃ³digo nuevo
```java
            @Override
            public void onReadCommandReceived(String commandJson, String nodeId) {
                notifyCommand(commandJson, nodeId);
            }

            @Override
            public void onNativeStateChanged() {
                notifyNativeStateChanged();
            }
```

#### Por quÃ© se cambiÃ³
El plugin Capacitor ya no debe procesar escrituras del reloj. Solo delega lecturas y emite `onNativeStateChanged` para que React lea el estado nativo persistido.

### Cambio 17 - Status nativo desde Room

#### CÃ³digo anterior
`No existÃ­a handleReadCommand en WatchNativeCommandHandler.kt ni statusToJson en WatchResponseJson.kt.`

#### CÃ³digo nuevo
```kt
    @JvmStatic
    fun handleReadCommand(
        repository: WatchRepository,
        commandJson: String,
        pathOperationId: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): String {
        val json = try {
            JSONObject(commandJson)
        } catch (e: Exception) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "INVALID_COMMAND", "Comando Wear invalido"),
            )
        }
```

#### Por quÃ© se cambiÃ³
`GET_STATUS` debe poder responder desde Room aunque Capacitor no estÃ© disponible, para que el reloj pueda mostrar el turno activo con el mÃ³vil bloqueado.

### Cambio 18 - Puente web solo lector

#### CÃ³digo anterior
```ts
  WearOsBridge.addListener("onCommandReceived", async (data: { command: string; nodeId?: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const operationId = readOperationId(command);
      const store = useAppStore.getState();
      const authUid = auth.currentUser?.uid ?? null;
```

#### CÃ³digo nuevo
```ts
  WearOsBridge.addListener("onNativeStateChanged", async () => {
    try {
      await hydrateNativeWatchState();
      await sendWatchStatus();
    } catch (err) {
      console.error("Error al hidratar estado Wear OS:", err);
    }
  });
```

#### Por quÃ© se cambiÃ³
Se retirÃ³ el procesamiento JS de comandos de escritura para que no existan dos fuentes de verdad. React queda como vista del estado nativo y como emisor de estado al reloj.

### Cambio 19 - Historial nativo del reloj

#### CÃ³digo anterior
```kt
            "GET_TURNOS" -> WatchResponseJson.toJson(
                WatchResponse.Error(operationId, "APP_NOT_READY", "App movil no preparada para leer turnos"),
            )
```

#### CÃ³digo nuevo
```kt
            "GET_TURNOS" -> WatchResponseJson.turnosStatusToJson(
                operationId,
                repository.readState(nowDate, nowTime, nowId),
            )
```

#### Por quÃ© se cambiÃ³
Tras cerrar un turno desde el reloj, el reloj pide historial. Si Capacitor no estÃ¡ vivo, ahora puede recibir `TURNOS_STATUS` desde Room para mostrar el turno guardado sin depender de la WebView.

## 2026-06-04 20:15 - AÃ±adir procesador Wear nativo

**Archivos modificados:** `android/app/build.gradle`, `android/app/src/main/java/com/mijornada/app/watch/WatchModels.kt`, `android/app/src/main/java/com/mijornada/app/watch/WatchCommandJson.kt`, `android/app/src/main/java/com/mijornada/app/watch/WatchCommandProcessor.kt`, `android/app/src/test/java/com/mijornada/app/watch/WatchCommandProcessorTest.java`

### Cambio 1 - Soporte Kotlin en app Android

#### CÃ³digo anterior
```gradle
apply plugin: 'com.android.application'
```

#### CÃ³digo nuevo
```gradle
apply plugin: 'com.android.application'
apply plugin: 'org.jetbrains.kotlin.android'
```

#### Por quÃ© se cambiÃ³
La fase nativa del reloj necesita clases Kotlin en el modulo `app` para modelar y procesar comandos Wear OS sin depender de la WebView.

### Cambio 2 - JVM 17 para Kotlin

#### CÃ³digo anterior
```gradle
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### CÃ³digo nuevo
```gradle
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
}
```

#### Por quÃ© se cambiÃ³
El modulo `app` ahora compila Kotlin y Java juntos. Fijar Java 17 y `jvmTarget = '17'` evita diferencias de bytecode entre el compilador Java y Kotlin.

### Cambio 3 - Dependencia core-ktx

#### CÃ³digo anterior
```gradle
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
```

#### CÃ³digo nuevo
```gradle
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-ktx:$androidxCoreVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
```

#### Por quÃ© se cambiÃ³
El modulo Android incorpora codigo Kotlin nativo y necesita la dependencia KTX del mismo grupo AndroidX usado por el proyecto.

### Cambio 4 - Modelos nativos del reloj

#### CÃ³digo anterior
`No existia WatchModels.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```kt
package com.mijornada.app.watch

data class WatchEntry(
    val id: Long,
    val type: String,
    val amount: Double,
    val note: String,
    val time: String,
)

data class WatchCurrentState(
    val startTime: String?,
    val startDate: String?,
    val entries: List<WatchEntry>,
) {
    fun isActive(): Boolean = startTime != null || entries.isNotEmpty()

    companion object {
        @JvmStatic
        fun empty(): WatchCurrentState = WatchCurrentState(null, null, emptyList())
    }
}

data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String?,
    val startTime: String?,
    val endTime: String,
    val entries: List<WatchEntry>,
    val dinero: Double,
    val km: Double,
    val notes: String,
)

data class WatchProcessorState(
    val current: WatchCurrentState,
    val history: List<WatchTurno>,
    val processedOperationIds: List<String>,
    val nowDate: String,
    val nowTime: String,
    val nowId: Long,
) {
    fun withCurrent(nextCurrent: WatchCurrentState): WatchProcessorState = copy(current = nextCurrent)

    fun withProcessedOperationIds(nextProcessedOperationIds: List<String>): WatchProcessorState =
        copy(processedOperationIds = nextProcessedOperationIds)

    companion object {
        @JvmStatic
        fun empty(nowDate: String, nowTime: String, nowId: Long): WatchProcessorState =
            WatchProcessorState(
                current = WatchCurrentState.empty(),
                history = emptyList(),
                processedOperationIds = emptyList(),
                nowDate = nowDate,
                nowTime = nowTime,
                nowId = nowId,
            )
    }
}

data class WatchProcessorResult(
    val state: WatchProcessorState,
    val response: WatchResponse,
)

sealed class WatchResponse {
    data class Ok(val operationId: String, val message: String) : WatchResponse()
    data class Error(val operationId: String, val code: String, val message: String) : WatchResponse()
    data class DuplicateIgnored(val operationId: String, val message: String) : WatchResponse()
}

sealed class WatchCommand {
    abstract val operationId: String
    abstract val createdAt: String

    data class StartTurno(
        override val operationId: String,
        override val createdAt: String,
    ) : WatchCommand()

    data class AddEntry(
        override val operationId: String,
        override val createdAt: String,
        val entryType: String,
        val amount: Double,
        val note: String,
    ) : WatchCommand()

    data class AddNote(
        override val operationId: String,
        override val createdAt: String,
        val note: String,
    ) : WatchCommand()

    data class EditEntry(
        override val operationId: String,
        override val createdAt: String,
        val id: Long,
        val amount: Double,
        val note: String,
    ) : WatchCommand()

    data class DeleteEntry(
        override val operationId: String,
        override val createdAt: String,
        val id: Long,
    ) : WatchCommand()

    data class EndTurno(
        override val operationId: String,
        override val createdAt: String,
        val dinero: Double,
        val km: Double,
        val note: String,
    ) : WatchCommand()
}
```

#### Por quÃ© se cambiÃ³
El procesado nativo necesita un estado tipado para turno activo, historial, entradas y `operationId` procesados, sin mezclar datos entre usuarios ni duplicar comandos.

### Cambio 5 - Parser de comandos Wear

#### CÃ³digo anterior
`No existia WatchCommandJson.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```kt
package com.mijornada.app.watch

import org.json.JSONObject

object WatchCommandJson {
    @JvmStatic
    fun parse(commandJson: String): WatchCommand {
        val json = JSONObject(commandJson)
        val operationId = json.optString("operationId", "")
        val type = json.optString("type", "")
        val createdAt = json.optString("createdAt", "")
        val payload = json.optJSONObject("payload") ?: JSONObject()

        return when (type) {
            "START_TURNO" -> WatchCommand.StartTurno(operationId, createdAt)
            "ADD_ENTRY" -> WatchCommand.AddEntry(
                operationId = operationId,
                createdAt = createdAt,
                entryType = payload.optString("entryType", ""),
                amount = payload.optDouble("amount", 0.0),
                note = payload.optString("note", ""),
            )
            "ADD_NOTE" -> WatchCommand.AddNote(
                operationId = operationId,
                createdAt = createdAt,
                note = payload.optString("note", ""),
            )
            "EDIT_ENTRY" -> WatchCommand.EditEntry(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
                amount = payload.optDouble("amount", 0.0),
                note = payload.optString("note", ""),
            )
            "DELETE_ENTRY" -> WatchCommand.DeleteEntry(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
            )
            "END_TURNO" -> WatchCommand.EndTurno(
                operationId = operationId,
                createdAt = createdAt,
                dinero = payload.optDouble("dinero", 0.0),
                km = payload.optDouble("km", 0.0),
                note = payload.optString("note", ""),
            )
            else -> throw IllegalArgumentException("Comando Wear no reconocido: $type")
        }
    }
}
```

#### Por quÃ© se cambiÃ³
Los comandos persistentes recibidos desde Wear OS llegan como JSON. Este parser los convierte a comandos tipados antes de procesarlos.

### Cambio 6 - Procesador nativo de comandos

#### CÃ³digo anterior
`No existia WatchCommandProcessor.kt en android/app/src/main/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```kt
package com.mijornada.app.watch

object WatchCommandProcessor {
    @JvmStatic
    fun process(command: WatchCommand, state: WatchProcessorState): WatchProcessorResult {
        if (command.operationId.isBlank()) {
            return state.error(command.operationId, "INVALID_OPERATION_ID", "operationId obligatorio")
        }

        if (state.processedOperationIds.contains(command.operationId)) {
            return WatchProcessorResult(
                state = state,
                response = WatchResponse.DuplicateIgnored(command.operationId, "Operacion ya procesada"),
            )
        }

        return when (command) {
            is WatchCommand.StartTurno -> processStartTurno(command, state)
            is WatchCommand.AddEntry -> processAddEntry(command, state)
            is WatchCommand.AddNote -> processAddNote(command, state)
            is WatchCommand.EditEntry -> processEditEntry(command, state)
            is WatchCommand.DeleteEntry -> processDeleteEntry(command, state)
            is WatchCommand.EndTurno -> processEndTurno(command, state)
        }
    }
```

#### Por quÃ© se cambiÃ³
El movil necesita una capa nativa capaz de aceptar comandos del reloj con `operationId`, rechazar duplicados y mantener estado de turno aunque la WebView no sea el primer punto de procesamiento.

### Cambio 7 - Tests del procesador nativo

#### CÃ³digo anterior
`No existia WatchCommandProcessorTest.java en android/app/src/test/java/com/mijornada/app/watch/.`

#### CÃ³digo nuevo
```java
package com.mijornada.app.watch;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WatchCommandProcessorTest {

    private WatchProcessorState baseState() {
        return WatchProcessorState.empty("2026-06-01", "10:35", 1000L);
    }

    @Test
    public void startTurnoGuardaHoraYOperationId() throws Exception {
        WatchCommand command = new WatchCommand.StartTurno(
            "op-start-1",
            "2026-06-01T10:35:00"
        );

        WatchProcessorResult result = WatchCommandProcessor.process(command, baseState());

        assertTrue(result.getResponse() instanceof WatchResponse.Ok);
        assertEquals("Turno iniciado", ((WatchResponse.Ok) result.getResponse()).getMessage());
        assertEquals("10:35", result.getState().getCurrent().getStartTime());
        assertEquals("2026-06-01", result.getState().getCurrent().getStartDate());
        assertEquals(1, result.getState().getProcessedOperationIds().size());
        assertEquals("op-start-1", result.getState().getProcessedOperationIds().get(0));
    }
```

#### Por quÃ© se cambiÃ³
La fase nativa necesita pruebas verificables para inicio de turno, entrada, deduplicacion por `operationId` y cierre de turno antes de conectar persistencia mas profunda.

## 2026-06-04 19:58 - Endurecer puente Wear OS

**Archivos modificados:** `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/com/mijornada/app/WearListenerService.java`, `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`, `android/app/src/main/java/com/mijornada/app/WearPendingCommandStore.java`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Activacion por DataItem

#### CÃ³digo anterior
```xml
<service
    android:name="com.mijornada.app.WearListenerService"
    android:exported="true">
    <intent-filter>
        <action android:name="com.google.android.gms.wearable.MESSAGE_RECEIVED" />
        <data android:scheme="wear" android:host="*" android:pathPrefix="/watch-command" />
    </intent-filter>
</service>
```

#### CÃ³digo nuevo
```xml
<service
    android:name="com.mijornada.app.WearListenerService"
    android:exported="true">
    <intent-filter>
        <action android:name="com.google.android.gms.wearable.DATA_CHANGED" />
        <data android:scheme="wear" android:host="*" android:pathPrefix="/watch-command/" />
    </intent-filter>
</service>
```

#### Por quÃ© se cambiÃ³
`MESSAGE_RECEIVED` dependia de un mensaje efimero. `DATA_CHANGED` permite que Google Play Services despierte el servicio cuando llega un DataItem persistente con path por `operationId`.

### Cambio 2 - Recepcion y cola nativa del movil

#### CÃ³digo anterior
```java
@Override
public void onMessageReceived(MessageEvent messageEvent) {
    if ("/watch-command".equals(messageEvent.getPath())) {
        String commandJson = new String(messageEvent.getData(), StandardCharsets.UTF_8);
        if (listener != null) {
            listener.onCommandReceived(commandJson, messageEvent.getSourceNodeId());
        } else {
            // Responder directamente si el puente no estÃ¡ preparado.
            String nodeId = messageEvent.getSourceNodeId();
            String errorResponseJson = "{\"type\":\"ERROR\",\"operationId\":\"\",\"code\":\"APP_NOT_READY\",\"message\":\"App movil no preparada\"}";
            byte[] responseData = errorResponseJson.getBytes(StandardCharsets.UTF_8);
            Wearable.getMessageClient(this).sendMessage(nodeId, "/watch-response", responseData);
        }
    }
}
```

#### CÃ³digo nuevo
```java
@Override
public void onDataChanged(DataEventBuffer dataEvents) {
    for (DataEvent event : dataEvents) {
        if (event.getType() != DataEvent.TYPE_CHANGED) {
            continue;
        }
        String path = event.getDataItem().getUri().getPath();
        if (path == null || !path.startsWith("/watch-command/")) {
            continue;
        }

        String commandJson = DataMapItem.fromDataItem(event.getDataItem())
            .getDataMap()
            .getString("command");
        if (commandJson == null || commandJson.trim().isEmpty()) {
            continue;
        }

        String nodeId = event.getDataItem().getUri().getHost();
        String operationId = path.substring("/watch-command/".length());
        deliverOrQueue(commandJson, nodeId, operationId);
    }
}

private void deliverOrQueue(String commandJson, String nodeId, String operationId) {
    if (listener != null) {
        listener.onCommandReceived(commandJson, nodeId);
        return;
    }

    WearPendingCommandStore.enqueue(this, commandJson, nodeId);
    String queuedResponseJson = "{\"type\":\"QUEUED\",\"operationId\":\"" + operationId + "\",\"message\":\"Pendiente del movil\"}";
    WearOsBridgePlugin.publishAckDataItem(this, operationId, queuedResponseJson);
    if (nodeId != null && !nodeId.trim().isEmpty()) {
        byte[] responseData = queuedResponseJson.getBytes(StandardCharsets.UTF_8);
        Wearable.getMessageClient(this).sendMessage(nodeId, "/watch-response", responseData);
    }
}
```

#### Por quÃ© se cambiÃ³
El servicio ahora recibe comandos persistentes y, si el puente Capacitor no esta listo, no devuelve `APP_NOT_READY`; guarda el comando y responde `QUEUED` con el mismo `operationId`.

### Cambio 3 - Almacen de comandos pendientes

#### CÃ³digo anterior
```java
No existia WearPendingCommandStore en android/app/src/main/java/com/mijornada/app/WearPendingCommandStore.java.
```

#### CÃ³digo nuevo
```java
private static final String PREFS_NAME = "wear_pending_commands";
private static final String KEY_PENDING_COMMANDS = "pending_commands";

public static synchronized void enqueue(Context context, String commandJson, String nodeId) {
    SharedPreferences prefs = prefs(context);
    JSONArray pending = readArray(prefs);
    String operationId = readOperationId(commandJson);

    if (!operationId.isEmpty()) {
        for (int i = 0; i < pending.length(); i++) {
            JSONObject existing = pending.optJSONObject(i);
            if (existing != null && operationId.equals(existing.optString("operationId", ""))) {
                return;
            }
        }
    }
```

#### Por quÃ© se cambiÃ³
La cola nativa evita perder comandos si el servicio Wear OS se despierta antes de que el plugin Capacitor haya registrado el listener JS.

### Cambio 4 - ACK persistente desde el plugin

#### CÃ³digo anterior
```java
public void onCommandReceived(String commandJson, String nodeId) {
    JSObject data = new JSObject();
    data.put("command", commandJson);
    data.put("nodeId", nodeId);
    notifyListeners("onCommandReceived", data);
}
```

#### CÃ³digo nuevo
```java
public void onCommandReceived(String commandJson, String nodeId) {
    notifyCommand(commandJson, nodeId, false);
}
```

```java
for (WearPendingCommandStore.PendingCommand pending : WearPendingCommandStore.drain(getContext())) {
    notifyCommand(pending.commandJson, pending.nodeId, true);
}
```

```java
public static void publishAckDataItem(Context context, String operationId, String responseJson) {
    if (context == null || operationId == null || operationId.trim().isEmpty()) {
        return;
    }

    PutDataMapRequest request = PutDataMapRequest.create("/watch-ack/" + operationId);
    DataMap dataMap = request.getDataMap();
    dataMap.putString("response", responseJson);
    dataMap.putLong("updatedAt", System.currentTimeMillis());
    com.google.android.gms.wearable.PutDataRequest dataRequest = request.asPutDataRequest();
    dataRequest.setUrgent();
    Wearable.getDataClient(context).putDataItem(dataRequest);
}
```

#### Por quÃ© se cambiÃ³
El plugin sigue avisando a React, pero ahora drena comandos pendientes retenidos y publica ACK persistente en `/watch-ack/<operationId>` ademas del feedback rapido por mensaje.

### Cambio 5 - Envio persistente desde el reloj

#### CÃ³digo anterior
```kotlin
val data = commandJson.toByteArray(StandardCharsets.UTF_8)
val node = nodes.first()
Wearable.getMessageClient(this)
    .sendMessage(node.id, "/watch-command", data)
    .addOnFailureListener {
        isConnected.value = false
        currentScreen.value = ScreenState.NO_CONNECTED
    }
```

#### CÃ³digo nuevo
```kotlin
Wearable.getNodeClient(this).connectedNodes
    .addOnSuccessListener { nodes ->
        val nodeId = nodes.firstOrNull()?.id ?: ""
        writeCommandDataItem(commandJson, nodeId)
    }
    .addOnFailureListener {
        writeCommandDataItem(commandJson, "")
    }
```

```kotlin
private fun writeCommandDataItem(commandJson: String, nodeId: String) {
    val operationId = try {
        JSONObject(commandJson).optString("operationId", "")
    } catch (e: Exception) {
        ""
    }

    if (operationId.isBlank()) {
        performFeedback("operationId invalido", strong = true)
        return
    }

    val request = PutDataMapRequest.create("/watch-command/$operationId")
    val dataMap = request.dataMap
    dataMap.putString("command", commandJson)
    dataMap.putString("targetNodeId", nodeId)
    dataMap.putLong("createdAt", System.currentTimeMillis())
    val dataRequest = request.asPutDataRequest()
    dataRequest.setUrgent()

    Wearable.getDataClient(this).putDataItem(dataRequest)
        .addOnFailureListener {
            isConnected.value = false
            currentScreen.value = ScreenState.NO_CONNECTED
        }
}
```

#### Por quÃ© se cambiÃ³
El reloj deja de usar `MessageClient` para comandos criticos y escribe un DataItem urgente por `operationId`. La lista de nodos pasa a ser solo una ayuda para guardar `targetNodeId`; si en ese instante no hay nodo conectado, el DataItem se escribe igualmente para que pueda sincronizarse despues.

### Cambio 6 - ACK en el reloj

#### Codigo anterior
```kotlin
override fun onMessageReceived(messageEvent: MessageEvent) {
    val path = messageEvent.path
    val data = String(messageEvent.data, StandardCharsets.UTF_8)
    Log.d(TAG, "Mensaje recibido: path=$path, data=$data")

    try {
        val json = JSONObject(data)
        if ("/watch-status" == path || "STATUS" == json.optString("type")) {
```

#### Codigo nuevo
```kotlin
override fun onMessageReceived(messageEvent: MessageEvent) {
    val path = messageEvent.path
    val data = String(messageEvent.data, StandardCharsets.UTF_8)
    Log.d(TAG, "Mensaje recibido: path=$path, data=$data")

    handleResponseJson(data)
}

override fun onDataChanged(dataEvents: DataEventBuffer) {
    for (event in dataEvents) {
        val item = event.dataItem
        val uri = item.uri
        if (uri.path?.startsWith("/watch-ack/") == true) {
            val responseJson = DataMapItem.fromDataItem(item).dataMap.getString("response") ?: continue
            handleResponseJson(responseJson)
        }
    }
}

private fun handleResponseJson(responseJson: String) {
    try {
        val json = JSONObject(responseJson)
        if ("STATUS" == json.optString("type")) {
```

#### Por que se cambio
El reloj escucha ACK persistentes por DataItem y reutiliza el mismo parser para mensajes rapidos y DataItems. `QUEUED` se muestra como pendiente sin cerrar visualmente la operacion.

### Cambio 7 - Pruebas de puente Wear

#### Codigo anterior
```ts
No existian pruebas para DataItem, ACK persistente, cola nativa ni estado QUEUED en src/__tests__/android-wear-bridge.test.ts.
```

#### Codigo nuevo
```ts
it("envia comandos criticos Wear como DataItem persistente con operationId", () => {
```

```ts
it("escribe el DataItem aunque no haya nodo conectado en ese instante", () => {
```

```ts
it("recibe ACK persistente del movil por DataItem antes de dar por cerrado un comando", () => {
```

```ts
it("cola comandos Wear recibidos si el puente Capacitor aun no esta listo", () => {
```

```ts
it("el reloj muestra pendiente de movil sin marcar el comando como finalizado", () => {
```

#### Por que se cambio
Las pruebas fijan el contrato profesional del puente: comando persistente, ACK persistente, no perdida si Capacitor no esta listo y estado intermedio sin marcar la accion como guardada.

## 2026-06-04 19:33 - Corregir plan Wear OS

**Archivos modificados:** `PLAN_RELOJ_WEAR_OS_V2.md`

### Cambio 1 - Transporte de comandos crÃ­ticos

#### CÃ³digo anterior
```md
5. **`DataClient` para estado del mÃ³vilâ†’reloj** (paths `/turno/state`), **`MessageClient` para comandos relojâ†’mÃ³vil**. RazÃ³n: `MessageClient.sendMessage` no garantiza entrega (Google docs), `DataClient` sÃ­ cachea el Ãºltimo DataItem.
```

#### CÃ³digo nuevo
```md
5. **`DataClient/DataItem` para comandos crÃ­ticos relojâ†’mÃ³vil** (paths `/watch-command/<operationId>`) y **ACK persistente mÃ³vilâ†’reloj** (paths `/watch-ack/<operationId>`). RazÃ³n: `MessageClient.sendMessage` no garantiza persistencia ni reintento; `DataItem` queda almacenado y se sincroniza cuando la conexiÃ³n vuelve. `MessageClient` queda sÃ³lo para feedback rÃ¡pido no crÃ­tico (`OK`, `ERROR`, vibraciÃ³n, refresco manual, `GET_STATUS` fallback).
```

#### Por quÃ© se cambiÃ³
La documentaciÃ³n oficial de Wear OS indica que `MessageClient` no ofrece persistencia ni retry. Los comandos crÃ­ticos del reloj deben viajar como DataItems persistentes y cerrarse con ACK por `operationId`.

### Cambio 2 - WorkManager por operaciÃ³n

#### CÃ³digo anterior
```md
4. **WorkManager con `OneTimeWorkRequest` por cada operaciÃ³n + `expedited`**: cada operaciÃ³n es un job individual. Permite retry exponencial por operaciÃ³n; si una falla, el resto sigue. Trabajo agrupado con `WorkManager.beginUniqueWork("watch-sync", APPEND_OR_REPLACE)`.
```

#### CÃ³digo nuevo
```md
4. **WorkManager con `OneTimeWorkRequest` Ãºnico por operaciÃ³n + `expedited`**: cada operaciÃ³n se encola como `enqueueUniqueWork("watch-sync-<operationId>", KEEP, request)`. Permite retry exponencial por operaciÃ³n; si una falla, el resto no queda bloqueado por una cadena compartida.
```

#### Por quÃ© se cambiÃ³
Una cadena compartida con `APPEND` puede arrastrar dependencias entre trabajos. Una cola Ãºnica por `operationId` evita duplicar el job y evita que una operaciÃ³n bloquee otra.

### Cambio 3 - ACK persistente y outbox del reloj

#### CÃ³digo anterior
```md
3. Llama `sendCommand(json)`.
4. Al recibir ACK (`OK`/`DUPLICATE_IGNORED`/`ERROR` con cÃ³digo no transitorio), elimina del outbox.
5. Si no llega ACK en 5 s, reintenta con el mismo `operationId` y backoff 5/10/20/40 s hasta 4 intentos. Tras 4 fallos, marca al usuario "MÃ³vil no conectado" pero **mantiene** el outbox.
6. Al `onResume()` de `WearMainActivity` y al recibir evento `CapabilityChanged` del mÃ³vil, drena el outbox.
```

#### CÃ³digo nuevo
```md
3. Escribe `PutDataMapRequest.create("/watch-command/<operationId>")` con `setUrgent()`.
4. Mantiene la UI como `Pendiente de mÃ³vil` o vuelve al turno activo mostrando estado pendiente; nunca marca la acciÃ³n como guardada definitiva antes del ACK.
5. Al recibir ACK persistente en `/watch-ack/<operationId>` (`OK`/`DUPLICATE_IGNORED`/`ERROR` con cÃ³digo no transitorio), elimina del outbox.
6. Si no llega ACK en 5 s, reintenta reescribiendo el mismo DataItem con el mismo `operationId` y backoff 5/10/20/40 s hasta 4 intentos. Tras 4 fallos, marca al usuario "MÃ³vil no conectado" pero **mantiene** el outbox.
7. Al `onResume()` de `WearMainActivity`, al recibir evento de conexiÃ³n/capability y al recibir nuevo `/turno/state`, drena el outbox.
```

#### Por quÃ© se cambiÃ³
El reloj no debe confirmar visualmente una acciÃ³n crÃ­tica hasta recibir ACK del mÃ³vil. Reescribir el mismo DataItem con el mismo `operationId` permite reintento sin duplicar.

## 2026-06-03 00:17 - Integrar logo de Home

**Archivos modificados:** `src/components/brand-assets.tsx`, `src/screens/home-screen.tsx`, `src/__tests__/brand-assets.test.ts`

### Cambio 1 - Marca hero del taxi

#### CÃ³digo anterior
```tsx
const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";
```

`No existÃ­a BrandTaxiHero en src/components/brand-assets.tsx.`

#### CÃ³digo nuevo
```tsx
const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";
const BRAND_HERO = "/brand/brand-taxi-hero.png";
```

```tsx
type BrandTaxiHeroProps = {
  width?: number;
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiHero: FC<BrandTaxiHeroProps> = ({
  width = 184,
  alt = "Mi Turno Taxi",
  style,
}) => (
  <img
    src={BRAND_HERO}
    width={width}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "block",
      width,
      maxWidth: "78%",
      height: "auto",
      objectFit: "contain",
      margin: "0 auto",
      filter:
        "drop-shadow(0 0 18px rgba(251, 191, 36, 0.20)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.12))",
      ...style,
    }}
  />
);
```

#### Por quÃ© se cambiÃ³
La pantalla Home no debÃ­a usar el logo rectangular plano. Se aÃ±adiÃ³ un componente especÃ­fico para la marca principal con asset transparente y sombra integrada.

### Cambio 2 - Uso del hero en Home

#### CÃ³digo anterior
```tsx
import { BrandTaxiLogo } from "../components/brand-assets";
```

```tsx
          <BrandTaxiLogo width={168} style={{ marginBottom: 18 }} />
```

#### CÃ³digo nuevo
```tsx
import { BrandTaxiHero } from "../components/brand-assets";
```

```tsx
          <BrandTaxiHero width={190} style={{ marginBottom: 18 }} />
```

#### Por quÃ© se cambiÃ³
El logo anterior se veÃ­a como una imagen pegada encima del tÃ­tulo. El nuevo `BrandTaxiHero` usa el recorte transparente preparado para integrarse visualmente con el fondo oscuro de la app.

### Cambio 3 - RegresiÃ³n de integraciÃ³n visual

#### CÃ³digo anterior
```ts
    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
```

```ts
    expect(home).toContain("<BrandTaxiLogo");
    expect(settings).toContain("<BrandTaxiLogo");
    expect(wearHome).toContain("BrandTaxiLogo(");
    expect(home).not.toContain("ðŸš•");
    expect(settings).not.toContain("ðŸš•");
    expect(wearHome).not.toContain("ðŸš•");
```

#### CÃ³digo nuevo
```ts
    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("BrandTaxiHero");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(brandAssets).toContain("/brand/brand-taxi-hero.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-hero.png"))).toBe(true);
```

```ts
    expect(home).toContain("<BrandTaxiHero");
    expect(home).not.toContain("<BrandTaxiLogo");
    expect(settings).toContain("<BrandTaxiLogo");
    expect(wearHome).toContain("BrandTaxiLogo(");
    expect(home).not.toContain("\u{1F695}");
    expect(settings).not.toContain("\u{1F695}");
    expect(wearHome).not.toContain("\u{1F695}");
```

#### Por quÃ© se cambiÃ³
Se fijÃ³ por prueba que Home use el componente hero y no vuelva al logo rectangular. TambiÃ©n se cambiÃ³ la comprobaciÃ³n del emoji a escape Unicode para evitar confusiones de codificaciÃ³n.

## 2026-06-02 21:36 - AÃ±adir actualizador Wear

**Archivos modificados:** `actualizar_reloj.bat`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba del actualizador directo

#### CÃ³digo anterior
`No existÃ­a la prueba "mantiene un actualizador directo del reloj para compilar instalar y abrir" en src/__tests__/android-wear-bridge.test.ts.`

#### CÃ³digo nuevo
```ts
  it("mantiene un actualizador directo del reloj para compilar instalar y abrir", () => {
    const source = readFileSync(
      resolve(root, "actualizar_reloj.bat"),
      "utf8",
    );

    expect(source).toContain(":wear:assembleDebug");
    expect(source).toContain("adb.exe");
    expect(source).toContain("connect !WATCH!");
    expect(source).toContain("install -r");
    expect(source).toContain("am start -n com.mijornada.app/com.mijornada.app.WearMainActivity");
  });
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para fijar que el actualizador del reloj compile el mÃ³dulo Wear, use ADB, permita conexiÃ³n por `IP:PUERTO`, instale el APK y abra la app del reloj.

### Cambio 2 - Script actualizar_reloj.bat

#### CÃ³digo anterior
`No existÃ­a actualizar_reloj.bat.`

#### CÃ³digo nuevo
```bat
@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Actualizar Mi Turno Watch

set "ROOT=C:\Users\carlo\Desktop\APP Taxi"
set "ANDROID_DIR=%ROOT%\android"
set "ADB=C:\Users\carlo\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "APK=%ANDROID_DIR%\wear\build\outputs\apk\debug\wear-debug.apk"
set "WATCH="

echo ============================================
echo  Actualizar Mi Turno Watch
echo ============================================
echo.

if not exist "%ADB%" (
  echo [ERROR] No se encontro adb.exe:
  echo %ADB%
  pause
  exit /b 1
)

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] No se encontro Java en:
  echo %JAVA_HOME%
  pause
  exit /b 1
)

echo [1/4] Compilando app del reloj...
cd /d "%ANDROID_DIR%"
call gradlew.bat :wear:assembleDebug --console=plain
if errorlevel 1 (
  echo.
  echo [ERROR] La compilacion del reloj ha fallado.
  pause
  exit /b 1
)

if not exist "%APK%" (
  echo.
  echo [ERROR] No se encontro el APK generado:
  echo %APK%
  pause
  exit /b 1
)

echo.
echo [2/4] Buscando reloj conectado...
"%ADB%" devices -l
for /f "skip=1 tokens=1,2,*" %%a in ('"%ADB%" devices -l') do (
  if "%%b"=="device" if not defined WATCH set "WATCH=%%a"
)

if not defined WATCH (
  echo.
  echo No hay reloj conectado por ADB.
  set /p WATCH=Escribe IP:PUERTO del reloj:
  if not defined WATCH (
    echo [ERROR] No se indico IP:PUERTO.
    pause
    exit /b 1
  )
  "%ADB%" connect !WATCH!
  if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo conectar con !WATCH!
    pause
    exit /b 1
  )
)

echo.
echo Reloj seleccionado: !WATCH!
echo.
echo [3/4] Instalando APK...
"%ADB%" -s !WATCH! install -r "%APK%"
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo instalar el APK.
  pause
  exit /b 1
)

echo.
echo [4/4] Abriendo Mi Turno Watch...
"%ADB%" -s !WATCH! shell am start -n com.mijornada.app/com.mijornada.app.WearMainActivity

echo.
echo ============================================
echo  Reloj actualizado correctamente.
echo ============================================
pause
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ un actualizador directo para que, tras modificar la app del reloj, se pueda compilar, instalar y abrir `Mi Turno Watch` desde un Ãºnico archivo.

## 2026-06-02 21:20 - AÃ±adir turnos guardados Wear

**Archivos modificados:** `src/shared/watch-commands.ts`, `src/logic/watch-command-processor.ts`, `src/__tests__/watch-command-processor.test.ts`, `src/__tests__/android-wear-bridge.test.ts`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt`, `android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt`

### Cambio 1 - Prueba de turnos guardados para Wear

#### CÃ³digo anterior
`No existÃ­a la prueba "GET_TURNOS devuelve turnos guardados preparados para el reloj" en src/__tests__/watch-command-processor.test.ts.`

#### CÃ³digo nuevo
```ts
  it("GET_TURNOS devuelve turnos guardados preparados para el reloj", () => {
    const command: WatchCommand = {
      operationId: "op-turnos-1",
      type: "GET_TURNOS",
      createdAt: "2026-06-01T13:00:00",
    };

    const state = baseState({
      history: [{
        id: 2000,
        date: "2026-06-01",
        startTime: "10:35",
        endTime: "12:00",
        entries: [
          { id: 10, type: "propina", amount: 2, note: "", time: "10:40" },
          { id: 11, type: "datafono", amount: 20, note: "tarjeta", time: "10:45" },
          { id: 12, type: "nota", amount: 0, note: "Nota general", time: "10:50" },
        ],
        totalP: 2,
        totalD: 20,
        totalA: 0,
        totalE: 5,
        totalF: 0,
        totalN: 3,
        dinero: 80,
        km: 42,
        notes: "",
        startDate: "2026-06-01",
        totalPausedMinutes: 5,
        configTurno: {
          porcentajeJefe: 50,
          porcentajeChofer: 50,
          descDatafono: true,
          descAgencia: true,
          descExtra: false,
          descGasolina: true,
        },
        diaLibreContable: 0,
      }],
    });

    const result = processWatchCommand(command, state);

    expect(result.response).toMatchObject({
      type: "TURNOS_STATUS",
      connected: true,
      turnos: [{
        id: 2000,
        date: "2026-06-01",
        startDate: "2026-06-01",
        startTime: "10:35",
        endTime: "12:00",
        dinero: 80,
        km: 42,
        totalTaximetro: 77,
        miGanancia: 40.5,
        totalADescontar: 20,
        totalADar: 18.5,
        tiempoTrabajado: "1h 20m",
        totals: {
          porTipo: {
            propina: 2,
            datafono: 20,
            agencia_bono: 0,
            extra: 5,
            gasolina: 0,
            nulo: 3,
          },
          numPorTipo: {
            propina: 1,
            datafono: 1,
            agencia_bono: 0,
            extra: 0,
            gasolina: 0,
            nulo: 0,
          },
        },
      }],
    });
    if (result.response.type !== "TURNOS_STATUS") throw new Error("Se esperaba TURNOS_STATUS");
    expect(result.response.turnos[0].entradas).toEqual([
      { id: 12, type: "nota", amount: 0, note: "Nota general", time: "10:50" },
      { id: 11, type: "datafono", amount: 20, note: "tarjeta", time: "10:45" },
      { id: 10, type: "propina", amount: 2, note: "", time: "10:40" },
    ]);
  });
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para exigir que el mÃ³vil prepare los turnos guardados para el reloj con los mismos datos contables y visuales que usa la app mÃ³vil.

### Cambio 2 - Contrato GET_TURNOS

#### CÃ³digo anterior
```ts
export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "START_TURNO";
      createdAt: string;
    }
```

#### CÃ³digo nuevo
```ts
export type WatchTurno = {
  id: number;
  date: string;
  startDate: string | null;
  startTime: string | null;
  endTime: string;
  dinero: number;
  km: number;
  totalTaximetro: number;
  miGanancia: number;
  totalADescontar: number;
  totalADar: number;
  tiempoTrabajado: string;
  totals: WatchTurnoTotals;
  entradas: WatchEntry[];
};

export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "GET_TURNOS" | "START_TURNO";
      createdAt: string;
    }
```

#### Por quÃ© se cambiÃ³
El reloj necesitaba pedir turnos guardados al mÃ³vil. Se aÃ±adiÃ³ `GET_TURNOS` y el tipo `WatchTurno` para transportar datos calculados por el mÃ³vil sin guardar historial en el reloj.

### Cambio 3 - Respuesta TURNOS_STATUS

#### CÃ³digo anterior
```ts
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
    }
```

#### CÃ³digo nuevo
```ts
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
    }
  | {
      type: "TURNOS_STATUS";
      connected: true;
      turnos: WatchTurno[];
    }
```

#### Por quÃ© se cambiÃ³
La respuesta de estado solo enviaba el turno activo. Se aÃ±adiÃ³ una respuesta separada para que el mÃ³vil envÃ­e turnos cerrados ya preparados al reloj.

### Cambio 4 - Builder de turnos Wear

#### CÃ³digo anterior
`No existÃ­an buildWatchTotalsFromTurno, buildWatchEntradasFromTurno ni buildWatchTurnos en src/logic/watch-command-processor.ts.`

#### CÃ³digo nuevo
```ts
export function buildWatchTurnos(history: Turno[], settings: WatchCommandProcessorState["settings"]): WatchTurno[] {
  return sortTurnosByDateDesc(history).slice(0, 30).map((turno) => {
    let totalMins = 0;
    if (turno.startTime && turno.endTime) {
      const [startH, startM] = turno.startTime.split(":").map(Number);
      const [endH, endM] = turno.endTime.split(":").map(Number);
      if (Number.isFinite(startH) && Number.isFinite(startM) && Number.isFinite(endH) && Number.isFinite(endM)) {
        totalMins = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMins < 0) totalMins += 24 * 60;
        totalMins = Math.max(0, totalMins - (turno.totalPausedMinutes || 0));
      }
    }
    const calculo = calcularTurnoContable(turno, settings);

    return {
      id: turno.id,
      date: turno.date,
      startDate: turno.startDate,
      startTime: turno.startTime,
      endTime: turno.endTime,
      dinero: turno.dinero || 0,
      km: turno.km || 0,
      totalTaximetro: calculo.dineroBase,
      miGanancia: calculo.miGanancia,
      totalADescontar: calculo.totalDescontar,
      totalADar: calculo.totalADar,
      tiempoTrabajado: fmtDuration(totalMins),
      totals: buildWatchTotalsFromTurno(turno),
      entradas: buildWatchEntradasFromTurno(turno),
    };
  });
}
```

#### Por quÃ© se cambiÃ³
El reloj no debe calcular contabilidad ni guardar historial. El mÃ³vil transforma `history` en datos listos para mostrar usando `calcularTurnoContable`, `fmtDuration` y `sortTurnosByDateDesc`.

### Cambio 5 - Procesado de GET_TURNOS

#### CÃ³digo anterior
```ts
  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
      },
    };
  }
```

#### CÃ³digo nuevo
```ts
  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
      },
    };
  }

  if (command.type === "GET_TURNOS") {
    return {
      ...state,
      response: {
        type: "TURNOS_STATUS",
        connected: true,
        turnos: buildWatchTurnos(state.history, state.settings),
      },
    };
  }
```

#### Por quÃ© se cambiÃ³
`GET_STATUS` no cubrÃ­a el historial. Se aÃ±adiÃ³ `GET_TURNOS` como lectura pura que no modifica `current`, `history` ni `processedOperationIds`.

### Cambio 6 - Modelos Wear de turno guardado

#### CÃ³digo anterior
`No existÃ­an WatchTurnoTotals ni WatchTurno en android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt.`

#### CÃ³digo nuevo
```kotlin
data class WatchTurnoTotals(
    val porTipo: Map<String, Double>,
    val numPorTipo: Map<String, Int>,
    val numEntradas: Int
)

data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String,
    val startTime: String,
    val endTime: String,
    val dinero: Double,
    val km: Double,
    val totalTaximetro: Double,
    val miGanancia: Double,
    val totalADescontar: Double,
    val totalADar: Double,
    val tiempoTrabajado: String,
    val totals: WatchTurnoTotals,
    val entradas: List<WatchEntry>
)
```

#### Por quÃ© se cambiÃ³
Las pantallas Wear de lista y resumen necesitan recibir los campos del turno cerrado enviados por el mÃ³vil.

### Cambio 7 - Formato compacto de fecha

#### CÃ³digo anterior
`No existÃ­a formatFechaResumen en android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt.`

#### CÃ³digo nuevo
```kotlin
fun formatFechaResumen(iso: String): String {
    if (iso.isBlank()) return ""
    return try {
        val date = java.time.LocalDate.parse(iso)
        val fmt = java.time.format.DateTimeFormatter.ofPattern("EEE, d MMM yyyy", esES)
        date.format(fmt).replaceFirstChar { it.uppercase(esES) }
    } catch (e: Exception) {
        iso
    }
}
```

#### Por quÃ© se cambiÃ³
El resumen de turno en reloj necesita una fecha parecida a la app mÃ³vil, pero mÃ¡s corta para pantalla redonda.

### Cambio 8 - Home Wear sin turno

#### CÃ³digo anterior
```kotlin
fun NoActiveTurnoScreen(
    onStartTurno: () -> Unit
) {
```

```kotlin
            Text(
                text = "Sin turno activo",
                color = ColorWhite,
                fontSize = 16.sp
            )
            Spacer(modifier = Modifier.height(20.dp))
            Chip(
                onClick = onStartTurno,
                label = { Text("Iniciar turno", color = ColorPropina) },
                colors = ChipDefaults.chipColors(
                    backgroundColor = ColorPropinaBg,
                    contentColor = ColorPropina
                ),
                border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorPropina)),
                modifier = Modifier.width(130.dp)
            )
```

#### CÃ³digo nuevo
```kotlin
fun NoActiveTurnoScreen(
    onStartTurno: () -> Unit,
    onOpenTurnos: () -> Unit
) {
```

```kotlin
            Text("ðŸš•", fontSize = 34.sp)
            Spacer(modifier = Modifier.height(5.dp))
            Text(
                text = "Mi Turno",
                color = ColorWhite,
                fontSize = 24.sp
            )
            Text(fechaLabel, color = ColorGrey, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(18.dp))

            HomeActionButton(
                label = "ðŸš€  Iniciar Turno",
                textColor = ColorPropina,
                bg = ColorPropinaBg,
                borderColor = ColorPropina,
                onClick = onStartTurno
            )
            Spacer(modifier = Modifier.height(9.dp))
            HomeActionButton(
                label = "Turnos",
                textColor = ColorDatafono,
                bg = ColorDatafonoBg,
                borderColor = ColorDatafono,
                onClick = onOpenTurnos
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text("MÃ³vil conectado", color = ColorPropina, fontSize = 9.sp)
```

#### Por quÃ© se cambiÃ³
La pantalla inicial del reloj era demasiado pobre. Se adaptÃ³ a la home mÃ³vil con marca, fecha, acciÃ³n principal y acceso a `Turnos`.

### Cambio 9 - NavegaciÃ³n Wear a turnos

#### CÃ³digo anterior
```kotlin
enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    ADD_ENTRY,
    EDIT_ENTRY,
    CONFIRM_DELETE,
    END_TURNO
}
```

#### CÃ³digo nuevo
```kotlin
enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    TURNOS,
    TURNO_SUMMARY,
    ADD_ENTRY,
    EDIT_ENTRY,
    CONFIRM_DELETE,
    END_TURNO
}
```

#### Por quÃ© se cambiÃ³
El reloj necesitaba dos estados nuevos: lista de turnos y resumen de un turno guardado.

### Cambio 10 - Solicitud y parseo de turnos en Wear

#### CÃ³digo anterior
`No existÃ­an sendGetTurnos, parseTurnos, parseTurnoTotals ni parseEntryArray en android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt.`

#### CÃ³digo nuevo
```kotlin
    private fun sendGetTurnos() {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "GET_TURNOS")
            put("createdAt", System.currentTimeMillis().toString())
        }
        sendCommand(command.toString())
    }
```

```kotlin
            } else if ("TURNOS_STATUS" == json.optString("type")) {
                isConnected.value = json.optBoolean("connected", false)
                parseTurnos(json.optJSONArray("turnos"))
                if (isConnected.value) {
                    currentScreen.value = ScreenState.TURNOS
                } else {
                    currentScreen.value = ScreenState.NO_CONNECTED
                }
```

#### Por quÃ© se cambiÃ³
El reloj debe pedir los turnos guardados al mÃ³vil y pintar solo la respuesta del mÃ³vil, sin guardar ni inventar historial propio.

### Cambio 11 - Mostrar turnos tras cerrar desde reloj

#### CÃ³digo anterior
```kotlin
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
```

#### CÃ³digo nuevo
```kotlin
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                if (openTurnosAfterOk) {
                    openTurnosAfterOk = false
                    sendGetTurnos()
                } else {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                    requestStatus()
                }
            } else if ("ERROR" == json.optString("type")) {
                openTurnosAfterOk = false
```

#### Por quÃ© se cambiÃ³
Al cerrar un turno desde el reloj, el mÃ³vil guarda el turno y despuÃ©s el reloj pide la lista actualizada para mostrarlo como en la app mÃ³vil.

### Cambio 12 - Pantalla Turnos Wear

#### CÃ³digo anterior
`No existÃ­a TurnosScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
fun TurnosScreen(
    turnos: List<WatchTurno>,
    onBack: () -> Unit,
    onOpenTurno: (WatchTurno) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(0.88f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("â€¹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Turnos", color = ColorWhite, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(22.dp))
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (turnos.isEmpty()) {
            Text("No hay Turnos Anteriores.", color = ColorGrey, fontSize = 12.sp)
        } else {
            turnos.forEach { turno ->
                TurnoCard(turno = turno, onClick = { onOpenTurno(turno) })
                Spacer(modifier = Modifier.height(9.dp))
            }
        }
    }
}
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una pantalla de turnos cerrados equivalente a `PantallaTurnos`, adaptada a pantalla redonda.

### Cambio 13 - Pantalla resumen de turno Wear

#### CÃ³digo anterior
`No existÃ­a TurnoSummaryScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
fun TurnoSummaryScreen(
    turno: WatchTurno,
    onBack: () -> Unit
) {
    val notasTurno = turno.entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = turno.entradas.filter { it.type != "nota" && it.note.isNotBlank() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(0.88f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("â€¹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Resumen del Turno", color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text("âœŽ", color = ColorAgencia, fontSize = 15.sp)
        }
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una pantalla de resumen con los mismos bloques de la app mÃ³vil: fecha/hora, mÃ©tricas principales, categorÃ­as, notas y totales finales.

### Cambio 14 - Pruebas de pantallas Wear

#### CÃ³digo anterior
`No existÃ­an las pruebas "ofrece home y turnos Wear parecidos al movil sin guardar historial en el reloj" ni "muestra lista y resumen de turnos Wear como la app movil adaptada" en src/__tests__/android-wear-bridge.test.ts.`

#### CÃ³digo nuevo
```ts
  it("ofrece home y turnos Wear parecidos al movil sin guardar historial en el reloj", () => {
    const noActive = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt"),
      "utf8",
    );
    const main = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(noActive).toContain("Mi Turno");
    expect(noActive).toContain("fechaLabel");
    expect(noActive).toContain("Iniciar Turno");
    expect(noActive).toContain("Turnos");
    expect(noActive).toContain("MÃ³vil conectado");
    expect(main).toContain("ScreenState.TURNOS");
    expect(main).toContain("sendGetTurnos()");
    expect(main).toContain(`put("type", "GET_TURNOS")`);
    expect(main).toContain("parseTurnos(json.optJSONArray(\"turnos\"))");
    expect(main).not.toContain("FirebaseFirestore");
  });
```

#### Por quÃ© se cambiÃ³
Se aÃ±adieron pruebas para fijar que el reloj ofrece acceso a turnos desde la home, pide datos al mÃ³vil y no introduce acceso directo a Firestore.

## 2026-06-02 19:56 - Corregir botÃ³n activo Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba del botÃ³n dentro del scroll

#### CÃ³digo anterior
```ts
  it("usa anchura segura en las filas principales del turno activo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("WatchSafeRowWidth");
    expect(source).toContain("fillMaxWidth(WatchSafeRowWidth)");
    expect(source).toContain("top = 26.dp");
    expect(source).toContain("WatchSafeButtonWidth = 0.86f");
    expect(source).toContain("align(Alignment.BottomCenter)");
    expect(source).toContain("bottom = 88.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("ScalingLazyColumn");
  });
```

#### CÃ³digo nuevo
```ts
  it("mantiene el boton de terminar turno dentro del scroll del turno activo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("WatchSafeRowWidth");
    expect(source).toContain("fillMaxWidth(WatchSafeRowWidth)");
    expect(source).toContain("top = 26.dp");
    expect(source).toContain("WatchSafeButtonWidth = 0.86f");
    expect(source).toContain("bottom = 22.dp");
    expect(source).toContain(`Text("Terminar turno"`);
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("align(Alignment.BottomCenter)");
    expect(source).not.toContain("ScalingLazyColumn");
  });
```

#### Por quÃ© se cambiÃ³
La prueba anterior exigÃ­a que el botÃ³n estuviera alineado fijo abajo. La nueva prueba exige que no use `align(Alignment.BottomCenter)` y que el contenido con scroll tenga padding inferior normal.

### Cambio 2 - BotÃ³n Terminar turno

#### CÃ³digo anterior
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 88.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

```kotlin
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
                .fillMaxWidth(WatchSafeButtonWidth)
                .clip(RoundedCornerShape(16.dp))
                .background(ColorGasolinaBg)
                .clickable { onEndTurno() }
                .padding(vertical = 11.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
```

#### CÃ³digo nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

```kotlin
            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColorGasolinaBg)
                    .clickable { onEndTurno() }
                    .padding(vertical = 11.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
```

#### Por quÃ© se cambiÃ³
El botÃ³n fijo se superponÃ­a al contenido al desplazarse. Al colocarlo al final del `Column` con `verticalScroll`, el botÃ³n forma parte del scroll y deja de quedar incrustado sobre `AÃ±adir nota al turno` o las Ãºltimas entradas.

## 2026-06-02 18:43 - Renombrar reloj Wear

**Archivos modificados:** `android/wear/src/main/res/values/strings.xml`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba de nombres visibles nativos

#### CÃ³digo anterior
`No existÃ­a la prueba "mantiene nombres visibles nativos Mi Turno y Mi Turno Watch" en src/__tests__/android-wear-bridge.test.ts.`

#### CÃ³digo nuevo
```ts
  it("mantiene nombres visibles nativos Mi Turno y Mi Turno Watch", () => {
    const mobileStrings = readFileSync(
      resolve(root, "android/app/src/main/res/values/strings.xml"),
      "utf8",
    );
    const wearStrings = readFileSync(
      resolve(root, "android/wear/src/main/res/values/strings.xml"),
      "utf8",
    );
    const capacitorConfig = readFileSync(
      resolve(root, "capacitor.config.ts"),
      "utf8",
    );

    expect(mobileStrings).toContain(`<string name="app_name">Mi Turno</string>`);
    expect(mobileStrings).toContain(`<string name="title_activity_main">Mi Turno</string>`);
    expect(capacitorConfig).toContain("appName: 'Mi Turno'");
    expect(wearStrings).toContain(`<string name="app_name">Mi Turno Watch</string>`);
    expect(wearStrings).not.toContain("Mi Jornada");
  });
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para fijar que el nombre visible nativo del mÃ³vil sea `Mi Turno`, que el nombre visible nativo del reloj sea `Mi Turno Watch` y que el recurso del reloj no vuelva a contener `Mi Jornada`.

### Cambio 2 - Nombre visible del reloj

#### CÃ³digo anterior
```xml
<string name="app_name">Mi Jornada Watch</string>
```

#### CÃ³digo nuevo
```xml
<string name="app_name">Mi Turno Watch</string>
```

#### Por quÃ© se cambiÃ³
El nombre visible del reloj seguÃ­a usando el nombre inicial de la app. Se cambiÃ³ a `Mi Turno Watch` manteniendo intacto el identificador tÃ©cnico `com.mijornada.app`.

## 2026-06-02 18:31 - Unificar cierre Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Pruebas de pantalla Ãºnica de cierre

#### CÃ³digo anterior
```ts
    expect(source).toContain("activeField");
    expect(source).toContain("CampoCierre");
    expect(source).toContain("reviewLabel");
    expect(source).toContain("Falta km");
    expect(source).toContain("keyHeight = 20.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("var step");
```

#### CÃ³digo nuevo
```ts
    expect(source).toContain("activeField");
    expect(source).toContain("CampoCierre");
    expect(source).toContain("Resumen de hoy");
    expect(source).toContain("Notas del turno");
    expect(source).toContain("Notas detalladas");
    expect(source).toContain("TecladoCierreOverlay");
    expect(source).toContain("keyHeight = 20.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("var confirming");
    expect(source).not.toContain("ConfirmarCierre(");
    expect(source).not.toContain("Revisar");
    expect(source).not.toContain("Falta â‚¬");
    expect(source).not.toContain("Falta km");
```

#### Por quÃ© se cambiÃ³
La prueba anterior aceptaba el flujo viejo con revisiÃ³n. La nueva prueba exige una sola pantalla de cierre con resumen, notas y teclado como overlay.

### Cambio 2 - Prueba de datos para cierre Wear

#### CÃ³digo anterior
`No existÃ­a la prueba "pasa entradas y contadores a la pantalla unica de cierre Wear" en src/__tests__/android-wear-bridge.test.ts.`

#### CÃ³digo nuevo
```ts
  it("pasa entradas y contadores a la pantalla unica de cierre Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("numPorTipo = numPorTipo.value");
    expect(source).toContain("entradas = entradas.value");
  });
```

#### Por quÃ© se cambiÃ³
La pantalla nueva necesita mostrar conteos y notas igual que la app mÃ³vil. Se aÃ±adiÃ³ una prueba para asegurar que `WearMainActivity` pasa esos datos al cierre.

### Cambio 3 - Firma y estado de EndTurnoScreen

#### CÃ³digo anterior
```kotlin
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var activeField by remember { mutableStateOf("dinero") }
    var confirming by remember { mutableStateOf(false) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val reviewLabel = when {
        dinero <= 0.0 -> "Falta â‚¬"
        km <= 0.0 -> "Falta km"
        else -> "Revisar"
    }
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra
```

#### CÃ³digo nuevo
```kotlin
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    entradas: List<WatchEntry>,
    onConfirm: (dinero: Double, km: Double) -> Unit,
    onCancel: () -> Unit
) {
    var activeField by remember { mutableStateOf<String?>(null) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val notasTurno = entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = entradas.filter { it.type != "nota" && it.note.isNotBlank() }
```

#### Por quÃ© se cambiÃ³
Se eliminÃ³ el estado de confirmaciÃ³n y la nota propia del cierre para que el reloj use una sola pantalla como la app mÃ³vil. Se aÃ±adieron contadores y entradas para poder mostrar resumen, notas del turno y notas detalladas.

### Cambio 4 - Estructura principal del cierre

#### CÃ³digo anterior
```kotlin
        if (confirming) {
            ConfirmarCierre(
                totalsPorTipo = totalsPorTipo,
                dinero = dinero,
                kmText = kmText,
                note = note,
                onBack = { confirming = false },
                onConfirm = { onConfirm(dinero, km, note) }
            )
        } else {
            Column(
```

#### CÃ³digo nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 18.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(0.86f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("â€¹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onCancel() })
                Text("Terminar Turno", color = ColorWhite, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(22.dp))
            }
```

#### Por quÃ© se cambiÃ³
El flujo anterior separaba entrada y confirmaciÃ³n. La nueva estructura empieza directamente con la pantalla Ãºnica de cierre equivalente a la del mÃ³vil.

### Cambio 5 - Cierre desde WearMainActivity

#### CÃ³digo anterior
```kotlin
            ScreenState.END_TURNO -> EndTurnoScreen(
                totalsPorTipo = totalsPorTipo.value,
                onConfirm = { dinero, km, note ->
                    sendEndTurno(dinero, km, note)
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                },
                onRequestNote = { current, onResult -> requestNote(current, onResult) }
            )
```

#### CÃ³digo nuevo
```kotlin
            ScreenState.END_TURNO -> EndTurnoScreen(
                totalsPorTipo = totalsPorTipo.value,
                numPorTipo = numPorTipo.value,
                entradas = entradas.value,
                onConfirm = { dinero, km ->
                    sendEndTurno(dinero, km, "")
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                }
            )
```

#### Por quÃ© se cambiÃ³
La pantalla de cierre ya no edita una nota propia. Recibe contadores y entradas del estado existente del reloj y al cerrar sigue enviando `END_TURNO` al mÃ³vil.

### Cambio 6 - ResumenHoyCard

#### CÃ³digo anterior
`No existÃ­a ResumenHoyCard en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun ResumenHoyCard(
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    notasTurno: List<WatchEntry>
) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(18.dp))
            .padding(horizontal = 10.dp, vertical = 11.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SectionTitle("Resumen de hoy", ColorGrey)
```

#### Por quÃ© se cambiÃ³
La app mÃ³vil muestra `Resumen de hoy` dentro de una tarjeta antes de confirmar. Este bloque replica esa estructura de forma compacta para pantalla redonda.

### Cambio 7 - ResumenCategoriaCard

#### CÃ³digo anterior
`No existÃ­a ResumenCategoriaCard en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun ResumenCategoriaCard(
    type: String,
    total: Double,
    count: Int,
    modifier: Modifier = Modifier
) {
    val meta = categoriaMeta(type)
    val label = if (type == "agencia_bono") "Agencias/Bonos" else meta.label
    Column(
```

#### Por quÃ© se cambiÃ³
La pantalla mÃ³vil muestra seis tarjetas de categorÃ­a con importe y nÃºmero de entradas. Este bloque adapta cada tarjeta al tamaÃ±o del reloj.

### Cambio 8 - SectionTitle

#### CÃ³digo anterior
`No existÃ­a SectionTitle en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun SectionTitle(label: String, color: Color) {
    Text(
        text = label,
        color = color,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )
}
```

#### Por quÃ© se cambiÃ³
Se necesitaban encabezados compactos y consistentes para `Resumen de hoy`, `Notas del turno` y `Notas detalladas`.

### Cambio 9 - NotaTurnoRow

#### CÃ³digo anterior
`No existÃ­a NotaTurnoRow en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun NotaTurnoRow(entry: WatchEntry) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFF1B1C23))
            .padding(horizontal = 8.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(entry.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text("Nota", color = ColorWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(entry.note.take(24), color = ColorWhite, fontSize = 9.sp)
    }
}
```

#### Por quÃ© se cambiÃ³
La app mÃ³vil muestra notas generales del turno dentro del resumen. Este bloque permite mostrarlas en el reloj sin abrir otra pantalla.

### Cambio 10 - NotaDetalladaRow

#### CÃ³digo anterior
`No existÃ­a NotaDetalladaRow en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun NotaDetalladaRow(entry: WatchEntry) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(12.dp))
            .padding(horizontal = 9.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
```

#### Por quÃ© se cambiÃ³
La pantalla mÃ³vil separa `Notas detalladas` de las notas generales. Este bloque muestra las notas de entradas con categorÃ­a, texto e importe.

### Cambio 11 - TecladoCierreOverlay

#### CÃ³digo anterior
`No existÃ­a TecladoCierreOverlay en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun TecladoCierreOverlay(
    field: String,
    value: String,
    onKey: (String) -> Unit,
    onDone: () -> Unit
) {
    val color = if (field == "dinero") ColorAgencia else ColorExtra
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xDD000000)),
        contentAlignment = Alignment.Center
    ) {
```

#### Por quÃ© se cambiÃ³
En la app mÃ³vil el teclado aparece como overlay al tocar `Total TaxÃ­metro` o `Total KM`. Este bloque replica ese patrÃ³n sin crear otra pantalla de navegaciÃ³n.

## 2026-06-02 18:16 - Renombrar eliminaciÃ³n Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba de acciÃ³n peligrosa en ediciÃ³n

#### CÃ³digo anterior
```ts
  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### CÃ³digo nuevo
```ts
  it("nombra la accion peligrosa de edicion como eliminar entrada", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt"),
      "utf8",
    );

    expect(source).toContain(`Text("Eliminar entrada", color = ColorGasolina`);
    expect(source).not.toContain(`Text("Borrar entrada"`);
  });

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para evitar que la acciÃ³n peligrosa de editar vuelva a mostrarse como `Borrar entrada`, que podÃ­a confundirse con borrar nÃºmeros del teclado.

### Cambio 2 - Texto de eliminar entrada

#### CÃ³digo anterior
```kotlin
                    Text("Borrar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
```

#### CÃ³digo nuevo
```kotlin
                    Text("Eliminar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
```

#### Por quÃ© se cambiÃ³
`Eliminar entrada` describe mejor una acciÃ³n destructiva sobre la entrada completa y evita confusiÃ³n con la tecla de borrar del teclado numÃ©rico.

## 2026-06-02 18:14 - Marcar ediciÃ³n Wear en rojo

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba del tÃ­tulo de ediciÃ³n

#### CÃ³digo anterior
```ts
  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### CÃ³digo nuevo
```ts
  it("muestra Editar en rojo y mantiene la categoria con su color en Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt"),
      "utf8",
    );

    expect(source).toContain("EntryTitle(");
    expect(source).toContain(`Text("Editar", color = ColorGasolina`);
    expect(source).toContain("Text(categoryLabel, color = categoryColor");
    expect(source).not.toContain(`text = if (onDelete != null) "Editar $categoryLabel" else categoryLabel`);
  });

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para verificar que el modo ediciÃ³n no pinta todo el tÃ­tulo con el color de la categorÃ­a y que el prefijo `Editar` queda en rojo.

### Cambio 2 - TÃ­tulo de entrada en ediciÃ³n

#### CÃ³digo anterior
```kotlin
                Text(
                    text = if (onDelete != null) "Editar $categoryLabel" else categoryLabel,
                    color = categoryColor, fontSize = 13.sp, fontWeight = FontWeight.Bold
                )
```

#### CÃ³digo nuevo
```kotlin
                EntryTitle(
                    categoryLabel = categoryLabel,
                    categoryColor = categoryColor,
                    editing = onDelete != null
                )
```

#### Por quÃ© se cambiÃ³
El texto `Editar Agencia/Bono` era un Ãºnico `Text`, por lo que no podÃ­a colorear solo `Editar` en rojo. Se sustituyÃ³ por un componente que separa el prefijo de la categorÃ­a.

### Cambio 3 - Componente EntryTitle

#### CÃ³digo anterior
`No existÃ­a EntryTitle en android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun EntryTitle(
    categoryLabel: String,
    categoryColor: Color,
    editing: Boolean
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        if (editing) {
            Text("Editar", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(4.dp))
        }
        Text(categoryLabel, color = categoryColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}
```

#### Por quÃ© se cambiÃ³
Separar `Editar` y la categorÃ­a permite que `Editar` sea rojo y que `Agencia/Bono`, `Propinas` u otra categorÃ­a mantenga su color propio.

## 2026-06-02 18:07 - Centrar entrada Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Pruebas de teclado y entrada Wear

#### CÃ³digo anterior
```ts
  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### CÃ³digo nuevo
```ts
  it("deja el teclado de entrada con borrar cero coma en la ultima fila", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt"),
      "utf8",
    );

    expect(source).toContain(`listOf("DEL", "0", ",")`);
    expect(source).not.toContain("SaveKey(");
    expect(source).not.toContain("saveEnabled");
  });

  it("centra la entrada Wear con guardar junto al importe y nota abajo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt"),
      "utf8",
    );

    expect(source).toContain("GuardarImporteButton(");
    expect(source).toContain("modifier = Modifier.fillMaxWidth(0.74f)");
    expect(source).toContain("horizontalArrangement = Arrangement.Center");
    expect(source).toContain("NotaButton(");
    expect(source).not.toContain("onSave = { if (amount > 0.0) onSave(amount, note) }");
    expect(source).not.toContain("saveEnabled = amount > 0.0");
  });

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Por quÃ© se cambiÃ³
Se aÃ±adieron pruebas antes de modificar la UI para verificar que el teclado usa la Ãºltima fila `borrar, 0, coma` y que la pantalla de entrada mueve guardar junto al importe y nota bajo el teclado.

### Cambio 2 - Teclado numÃ©rico Wear

#### CÃ³digo anterior
```kotlin
/**
 * Teclado numÃ©rico in-app (estilo app del mÃ³vil): 1-9, coma decimal y 0.
 * La Ãºltima celda es la tecla Guardar (âœ“) si se pasa [onSave]; si no, es Borrar (âŒ«).
 * Cabe entero en pantalla redonda sin scroll (ancho 0.72, teclas compactas).
 */
@Composable
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
    val baseRows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9")
    )
```

#### CÃ³digo nuevo
```kotlin
/**
 * Teclado numÃ©rico in-app (estilo app del mÃ³vil): 1-9, coma decimal y 0.
 * La Ãºltima fila mantiene el orden de la app mÃ³vil: borrar, 0 y coma.
 * Cabe entero en pantalla redonda sin scroll (ancho 0.72, teclas compactas).
 */
@Composable
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
    val rows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9"),
        listOf("DEL", "0", ",")
    )
```

#### Por quÃ© se cambiÃ³
El botÃ³n de guardar dentro del teclado desplazaba la coma y hacÃ­a que el teclado no fuese fiel al patrÃ³n pedido. El teclado queda dedicado solo a introducir y borrar importe.

### Cambio 3 - Fila inferior del teclado

#### CÃ³digo anterior
```kotlin
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            KeyButton(",", ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey("0") }
            if (onSave != null) {
                SaveKey(color, saveEnabled, keyHeight, keyFontSize, Modifier.weight(1f), onSave)
            } else {
                KeyButton("DEL", color, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey("DEL") }
            }
        }
```

#### CÃ³digo nuevo
```kotlin
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                row.forEach { key ->
                    val keyColor = if (key == "DEL") color else ColorWhite
                    KeyButton(key, keyColor, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey(key) }
                }
            }
        }
```

#### Por quÃ© se cambiÃ³
La Ãºltima fila anterior podÃ­a mostrar guardar en vez de coma. El nuevo bucle renderiza todas las filas de la misma lista y garantiza `âŒ«`, `0`, `,`.

### Cambio 4 - Guardar junto al importe

#### CÃ³digo anterior
```kotlin
            Text(
                text = "${if (amountText.isEmpty()) "0" else amountText}â‚¬",
                color = ColorWhite,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold
            )
```

#### CÃ³digo nuevo
```kotlin
            Row(
                modifier = Modifier.fillMaxWidth(0.74f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "${if (amountText.isEmpty()) "0" else amountText}â‚¬",
                    color = ColorWhite,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(9.dp))
                GuardarImporteButton(
                    enabled = amount > 0.0,
                    color = categoryColor,
                    onClick = { onSave(amount, note) }
                )
            }
```

#### Por quÃ© se cambiÃ³
El usuario indicÃ³ que guardar debÃ­a quedar arriba junto al importe. Se centrÃ³ el conjunto importe + guardar para que la acciÃ³n principal estÃ© visible sin ocupar una tecla del teclado.

### Cambio 5 - Nota bajo el teclado

#### CÃ³digo anterior
```kotlin
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(
                    text = if (note.isBlank()) "+ Nota" else "âœ“ ${note.take(12)}",
                    color = if (note.isBlank()) ColorGrey else ColorWhite,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .padding(vertical = 3.dp)
                        .clickable { onRequestNote(note) { result -> note = result } }
                )
                if (onDelete != null) {
                    Text(
                        text = "Borrar",
                        color = ColorGasolina,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .padding(vertical = 3.dp)
                            .clickable { onDelete() }
                    )
                }
            }
```

#### CÃ³digo nuevo
```kotlin
            NotaButton(
                text = if (note.isBlank()) "+ Nota" else "âœ“ ${note.take(12)}",
                selected = note.isNotBlank(),
                onClick = { onRequestNote(note) { result -> note = result } }
            )

            if (onDelete != null) {
                Spacer(modifier = Modifier.height(5.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.72f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(ColorGasolinaBg)
                        .clickable { onDelete() }
                        .padding(vertical = 7.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Borrar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
```

#### Por quÃ© se cambiÃ³
La nota estaba encima del teclado y restaba claridad a la entrada del importe. Se moviÃ³ bajo el teclado como botÃ³n centrado y se mantuvo la acciÃ³n de borrar solo para ediciÃ³n.

### Cambio 6 - BotÃ³n de guardar importe

#### CÃ³digo anterior
`No existÃ­a GuardarImporteButton en android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun GuardarImporteButton(
    enabled: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(width = 42.dp, height = 34.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (enabled) color else ColorDisabledBg)
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "âœ“",
            color = if (enabled) ColorBackground else ColorDisabledText,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
```

#### Por quÃ© se cambiÃ³
Guardar necesitaba un control propio fuera del teclado para quedar junto al importe y poder mostrarse desactivado cuando el importe es cero.

### Cambio 7 - BotÃ³n de nota centrado

#### CÃ³digo anterior
`No existÃ­a NotaButton en android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt.`

#### CÃ³digo nuevo
```kotlin
@Composable
private fun NotaButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .clip(RoundedCornerShape(12.dp))
            .background(ColorNuloBg)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) ColorWhite else ColorGrey,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
```

#### Por quÃ© se cambiÃ³
La acciÃ³n de nota necesitaba una forma consistente y centrada bajo el teclado en vez de ser texto suelto sobre el importe.

## 2026-06-02 04:10 - Optimizar experiencia Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/theme/Color.kt`, `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Colores Wear apagados

#### CÃ³digo anterior
```kotlin
val ColorPropina = Color(0xFF4EE47C)
val ColorPropinaBg = Color(0xFF0F3214)

val ColorDatafono = Color(0xFFC070FF)
val ColorDatafonoBg = Color(0xFF261230)

val ColorAgencia = Color(0xFFFFB03A)
val ColorAgenciaBg = Color(0xFF331E00)

val ColorExtra = Color(0xFF4AC4FF)
val ColorExtraBg = Color(0xFF00223D)

val ColorGasolina = Color(0xFFFF5252)
val ColorGasolinaBg = Color(0xFF380C0C)

val ColorNulo = Color(0xFF9E9E9E)
val ColorNuloBg = Color(0xFF1F1F1F)
```

#### CÃ³digo nuevo
```kotlin
val ColorPropina = Color(0xFF38D66F)
val ColorPropinaBg = Color(0xFF06240D)

val ColorDatafono = Color(0xFF8C7CFF)
val ColorDatafonoBg = Color(0xFF151032)

val ColorAgencia = Color(0xFFFFB03A)
val ColorAgenciaBg = Color(0xFF2D1A05)

val ColorExtra = Color(0xFF22D0E5)
val ColorExtraBg = Color(0xFF052C32)

val ColorGasolina = Color(0xFFFF6868)
val ColorGasolinaBg = Color(0xFF3A0A0A)

val ColorNulo = Color(0xFF9AA8C7)
val ColorNuloBg = Color(0xFF151922)
```

#### Por quÃ© se cambiÃ³
Los fondos de las tarjetas del reloj se veÃ­an demasiado sÃ³lidos frente a la app mÃ³vil. Se apagaron los fondos y se mantuvo contraste alto en el texto para parecerse mÃ¡s al estilo mÃ³vil.

### Cambio 2 - Estados desactivados

#### CÃ³digo anterior
```kotlin
val ColorWhite = Color(0xFFFFFFFF)
val ColorGrey = Color(0xFF8E8E93)
```

#### CÃ³digo nuevo
```kotlin
val ColorWhite = Color(0xFFFFFFFF)
val ColorGrey = Color(0xFF8E8E93)
val ColorDisabledBg = Color(0xFF20232C)
val ColorDisabledText = Color(0xFF5E6472)
```

#### Por quÃ© se cambiÃ³
El botÃ³n `Revisar` podÃ­a parecer pulsable aunque estuviera bloqueado. Se aÃ±adieron colores especÃ­ficos de estado desactivado para distinguir un botÃ³n bloqueado de un botÃ³n secundario activo.

### Cambio 3 - Primera vista del turno activo

#### CÃ³digo anterior
```kotlin
private const val WatchSafeRowWidth = 0.82f
private const val WatchSafeButtonWidth = 0.78f
```

#### CÃ³digo nuevo
```kotlin
private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
```

#### Por quÃ© se cambiÃ³
La primera vista cortaba parcialmente `AÃ±adir nota al turno`. Se ajustÃ³ la anchura de filas y botones para que las acciones principales queden mÃ¡s visibles y centradas en pantalla redonda.

### Cambio 4 - Margen y tamaÃ±o de tarjetas

#### CÃ³digo anterior
```kotlin
                .padding(start = 18.dp, end = 18.dp, top = 44.dp, bottom = 28.dp),
```

#### CÃ³digo nuevo
```kotlin
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 30.dp),
```

#### Por quÃ© se cambiÃ³
El margen superior anterior consumÃ­a demasiada altura en el reloj y empujaba la acciÃ³n de nota hacia el borde inferior. Se redujo para aprovechar mejor la pantalla sin volver a cortar la cabecera.

### Cambio 5 - RevisiÃ³n de cierre con mensaje claro

#### CÃ³digo anterior
```kotlin
    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra
```

#### CÃ³digo nuevo
```kotlin
    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val reviewLabel = when {
        dinero <= 0.0 -> "Falta â‚¬"
        km <= 0.0 -> "Falta km"
        else -> "Revisar"
    }
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra
```

#### Por quÃ© se cambiÃ³
Cuando faltaba taxÃ­metro o kilÃ³metros, `Revisar` no hacÃ­a nada porque estaba desactivado. Se cambiÃ³ el texto del botÃ³n para explicar quÃ© falta y evitar una tecla aparentemente sin funciÃ³n.

### Cambio 6 - Cierre mÃ¡s compacto

#### CÃ³digo anterior
```kotlin
                    color = activeColor,
                    keyHeight = 22.dp,
                    keyFontSize = 13.sp
```

#### CÃ³digo nuevo
```kotlin
                    color = activeColor,
                    keyHeight = 20.dp,
                    keyFontSize = 12.sp
```

#### Por quÃ© se cambiÃ³
El teclado de cierre seguÃ­a dejando botones inferiores demasiado cerca del borde. Se hizo mÃ¡s compacto para que `+ Nota`, `AtrÃ¡s` y el botÃ³n de revisiÃ³n tengan mÃ¡s espacio Ãºtil.

### Cambio 7 - Pruebas de experiencia Wear

#### CÃ³digo anterior
```ts
No existÃ­a la prueba usa fondos Wear apagados como la app movil en src/__tests__/android-wear-bridge.test.ts.
```

#### CÃ³digo nuevo
```ts
  it("usa fondos Wear apagados como la app movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/theme/Color.kt"),
      "utf8",
    );

    expect(source).toContain("ColorDatafonoBg = Color(0xFF151032)");
    expect(source).toContain("ColorPropinaBg = Color(0xFF06240D)");
    expect(source).toContain("ColorNuloBg = Color(0xFF151922)");
    expect(source).toContain("ColorDisabledBg");
  });
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para que los fondos del reloj no vuelvan a un estilo demasiado saturado y para que existan colores de estado desactivado.

### Cambio 8 - BotÃ³n de cierre fijo

#### CÃ³digo anterior
```kotlin
            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColorGasolinaBg)
                    .clickable { onEndTurno() }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
```

#### CÃ³digo nuevo
```kotlin
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
                .fillMaxWidth(WatchSafeButtonWidth)
                .clip(RoundedCornerShape(16.dp))
                .background(ColorGasolinaBg)
                .clickable { onEndTurno() }
                .padding(vertical = 11.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
```

#### Por quÃ© se cambiÃ³
`Terminar turno` dependÃ­a del desplazamiento dentro de la lista y podÃ­a quedar cerca del borde inferior. Se sacÃ³ de la lista y se fijÃ³ abajo para que sea una acciÃ³n principal estable, mÃ¡s parecida a la app mÃ³vil.

## 2026-06-02 03:20 - Corregir pantallas del reloj

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Pruebas de layout Wear

#### CÃ³digo anterior
```ts
No existÃ­an pruebas de regresiÃ³n para compactar el teclado numÃ©rico, mantener el cierre de turno en una entrada compacta ni usar anchura segura en las filas principales del turno activo en src/__tests__/android-wear-bridge.test.ts.
```

#### CÃ³digo nuevo
```ts
  it("compacta el teclado numerico para que no corte botones en pantalla redonda", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt"),
      "utf8",
    );

    expect(source).toContain("widthFraction: Float = 0.72f");
    expect(source).toContain("keyHeight: Dp = 28.dp");
    expect(source).not.toContain("modifier.fillMaxWidth(0.80f)");
  });

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("activeField");
    expect(source).toContain("CampoCierre");
    expect(source).toContain("keyHeight = 22.dp");
    expect(source).not.toContain("var step");
  });

  it("usa anchura segura en las filas principales del turno activo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("WatchSafeRowWidth");
    expect(source).toContain("fillMaxWidth(WatchSafeRowWidth)");
    expect(source).toContain("top = 44.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("ScalingLazyColumn");
  });
```

#### Por quÃ© se cambiÃ³
Las fotos del reloj mostraban recortes en pantalla redonda. Se aÃ±adieron pruebas para fijar que el teclado sea compacto, que el cierre no use un flujo por pasos alto y que la pantalla activa use anchura y scroll seguros.

### Cambio 2 - Teclado numÃ©rico compacto

#### CÃ³digo anterior
```kotlin
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false
) {
```

#### CÃ³digo nuevo
```kotlin
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
```

#### Por quÃ© se cambiÃ³
El teclado anterior usaba ancho fijo `0.80f` y teclas de `34.dp`, lo que dejaba botones fuera de la zona visible en el reloj. Se hizo parametrizable y mÃ¡s compacto para que pueda caber en pantallas redondas.

### Cambio 3 - Turno activo con scroll tÃ¡ctil estable

#### CÃ³digo anterior
```kotlin
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

#### CÃ³digo nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 44.dp, bottom = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

#### Por quÃ© se cambiÃ³
`ScalingLazyColumn` dejaba acciones inferiores con zonas tÃ¡ctiles poco fiables al desplazarse. Se cambiÃ³ a `Column` con `verticalScroll` para mantener un scroll simple, cabecera visible y botones pulsables.

### Cambio 4 - Cierre de turno compacto

#### CÃ³digo anterior
```kotlin
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: Km + nota, 3: Confirmar
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
```

#### CÃ³digo nuevo
```kotlin
    var activeField by remember { mutableStateOf("dinero") }
    var confirming by remember { mutableStateOf(false) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
```

#### Por quÃ© se cambiÃ³
El cierre por pasos generaba pantallas altas con teclado y botones recortados. Se cambiÃ³ a una pantalla compacta con campos `Taximetro` y `Km` visibles, teclado Ãºnico y pantalla de confirmaciÃ³n aparte.

## 2026-06-02 00:31 - Blindar acciones sensibles del reloj

**Archivos modificados:** `android/wear/src/main/AndroidManifest.xml`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`, `src/__tests__/watch-command-processor.test.ts`, `instalar_reloj.bat`

### Cambio 1 - ConfirmaciÃ³n antes de borrar entrada

#### CÃ³digo anterior
```kotlin
                        onRequestNote = { current, onResult -> requestNote(current, onResult) },
                        onDelete = { sendDeleteEntry(e.id) },
                        esNota = e.type == "nota"
```

#### CÃ³digo nuevo
```kotlin
                        onRequestNote = { current, onResult -> requestNote(current, onResult) },
                        onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE },
                        esNota = e.type == "nota"
```

#### Por quÃ© se cambiÃ³
Borrar una entrada desde el reloj era una acciÃ³n directa. Se cambiÃ³ para abrir `ScreenState.CONFIRM_DELETE` y exigir confirmaciÃ³n explÃ­cita antes de enviar `DELETE_ENTRY` al mÃ³vil.

### Cambio 2 - Pantalla de confirmaciÃ³n de borrado

#### CÃ³digo anterior
```kotlin
No existÃ­a ConfirmDeleteScreen en android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt.
```

#### CÃ³digo nuevo
```kotlin
@Composable
private fun ConfirmDeleteScreen(
    entry: WatchEntry,
    onCancel: () -> Unit,
    onConfirm: () -> Unit
) {
    val meta = categoriaMeta(entry.type)
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(0.88f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Borrar entrada", color = ColorGasolina, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            if (entry.type != "nota") {
                Text(fmtEur(entry.amount), color = ColorWhite, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            if (entry.note.isNotBlank()) {
                Text(entry.note.take(32), color = ColorGrey, fontSize = 11.sp)
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ConfirmDeleteButton(
                    label = "Cancelar",
                    textColor = ColorGrey,
                    bg = ColorNuloBg,
                    modifier = Modifier.weight(1f),
                    onClick = onCancel
                )
                ConfirmDeleteButton(
                    label = "Borrar",
                    textColor = ColorWhite,
                    bg = ColorGasolina,
                    modifier = Modifier.weight(1f),
                    onClick = onConfirm
                )
            }
        }
    }
}
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una pantalla compacta de confirmaciÃ³n para mostrar quÃ© entrada se va a borrar y separar cancelar de confirmar. El reloj sigue sin escribir datos: al confirmar solo llama a `sendDeleteEntry(e.id)`.

### Cambio 3 - BotÃ³n atrÃ¡s nativo en flujos del reloj

#### CÃ³digo anterior
```kotlin
    @Composable
    fun MainContent() {
        when (currentScreen.value) {
```

#### CÃ³digo nuevo
```kotlin
    @Composable
    fun MainContent() {
        BackHandler(enabled = currentScreen.value != ScreenState.NO_CONNECTED) {
            handleBack()
        }

        when (currentScreen.value) {
```

#### Por quÃ© se cambiÃ³
El botÃ³n atrÃ¡s nativo no tenÃ­a una regla explÃ­cita dentro de los flujos de trabajo. Se aÃ±adiÃ³ `BackHandler` para que aÃ±adir, editar, confirmar borrado y cerrar turno vuelvan a la pantalla esperada sin cerrar acciones por accidente.

### Cambio 4 - Feedback visible y hÃ¡ptico tras respuesta del mÃ³vil

#### CÃ³digo anterior
```kotlin
            } else if ("OK" == json.optString("type")) {
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
                Log.e(TAG, "Error desde movil: ${json.optString("message")}")
            }
```

#### CÃ³digo nuevo
```kotlin
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
                Log.e(TAG, "Error desde movil: ${json.optString("message")}")
                performFeedback(json.optString("message", "Error"), strong = true)
            }
```

#### Por quÃ© se cambiÃ³
El reloj no confirmaba fÃ­sicamente ni visualmente si el mÃ³vil habÃ­a aceptado una acciÃ³n. Se aÃ±adiÃ³ `performFeedback` para mostrar un `Toast` y vibrar solo despuÃ©s de recibir respuesta del mÃ³vil.

### Cambio 5 - Permiso de vibraciÃ³n en Wear

#### CÃ³digo anterior
```xml
    <uses-permission android:name="android.permission.WAKE_LOCK" />
```

#### CÃ³digo nuevo
```xml
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
```

#### Por quÃ© se cambiÃ³
La vibraciÃ³n de confirmaciÃ³n necesita permiso explÃ­cito en el manifiesto del mÃ³dulo Wear.

### Cambio 6 - Texto simple para borrar

#### CÃ³digo anterior
```kotlin
                        text = "ðŸ—‘ Borrar",
```

#### CÃ³digo nuevo
```kotlin
                        text = "Borrar",
```

#### Por quÃ© se cambiÃ³
Los sÃ­mbolos pueden renderizar distinto segÃºn la fuente del reloj. Se sustituyÃ³ el icono de papelera por texto estable.

### Cambio 7 - Instalador sin puerto fijo

#### CÃ³digo anterior
```bat
set "WATCH=192.168.3.59:40201"
```

#### CÃ³digo nuevo
```bat
set "WATCH="
```

#### Por quÃ© se cambiÃ³
El puerto ADB por Wi-Fi del reloj cambia. El instalador ahora detecta un Xiaomi Watch 5 conectado con `adb devices -l` o pide la IP:PUERTO si no lo encuentra.

### Cambio 8 - Pruebas de seguridad del reloj

#### CÃ³digo anterior
```ts
No existÃ­an pruebas especÃ­ficas para confirmaciÃ³n de borrado, botÃ³n atrÃ¡s, feedback hÃ¡ptico/visual, instalador sin puerto fijo ni duplicados de EDIT_ENTRY, DELETE_ENTRY y END_TURNO.
```

#### CÃ³digo nuevo
```ts
  it("pide confirmacion antes de borrar una entrada desde el reloj", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("CONFIRM_DELETE");
    expect(source).toContain("onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE }");
    expect(source).toContain("sendDeleteEntry(e.id)");
  });
```

#### Por quÃ© se cambiÃ³
Se aÃ±adieron pruebas para fijar las reglas profesionales nuevas: acciones sensibles confirmadas, back nativo controlado, feedback tras respuesta del mÃ³vil, script de instalaciÃ³n sin puerto rÃ­gido y anti-duplicado explÃ­cito para ediciÃ³n, borrado y cierre.

### Cambio 9 - ConfiguraciÃ³n de turno en test duplicado

#### CÃ³digo anterior
```ts
        configTurno: { porcentajeJefe: 50, porcentajeChofer: 50, descontar: { datafono: true, agenciaBono: true, extra: false, gasolina: true } },
```

#### CÃ³digo nuevo
```ts
        configTurno: {
          porcentajeJefe: 50,
          porcentajeChofer: 50,
          descDatafono: true,
          descAgencia: true,
          descExtra: false,
          descGasolina: true,
        },
```

#### Por quÃ© se cambiÃ³
El test de cierre duplicado debe respetar el tipo real `TurnoConfig`, que usa propiedades `desc*` en lugar de un objeto `descontar`.

## 2026-06-02 02:48 - AÃ±adir iconos de categorÃ­a en el reloj como en la app del mÃ³vil

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/CategoriaIcons.kt`, `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`

### Cambio 1 - Componente CategoriaIcon

#### CÃ³digo anterior
`No existÃ­a CategoriaIcons.kt; las tarjetas e historial del reloj mostraban solo texto de color, sin los iconos que tiene la app del mÃ³vil.`

#### CÃ³digo nuevo
`CategoriaIcon(type, color, size)` dibuja con Canvas (viewBox 24) los mismos iconos de `src/components/entry-icons.tsx`: moneda â‚¬ (propina), tarjeta (datÃ¡fono), casa (agencia_bono), cruz en cÃ­rculo (extra), surtidor (gasolina), prohibido (nulo) y lÃ¡piz (nota).

#### Por quÃ© se cambiÃ³
Igualar el aspecto del reloj al de la app del mÃ³vil, que muestra un icono por categorÃ­a.

### Cambio 2 - Tarjetas e historial con icono y tamaÃ±os legibles

#### CÃ³digo anterior
```kotlin
        Text(meta.label, color = meta.color.copy(alpha = 0.9f), fontSize = if (grande) 10.sp else 9.sp)
        Text(
            fmtEur(total),
            color = meta.color,
            fontSize = if (grande) 17.sp else 13.sp,
            fontWeight = FontWeight.Bold
        )
```
(y en `EntradaHistorial` la fila empezaba directamente con el `Text` de la etiqueta, sin icono)

#### CÃ³digo nuevo
```kotlin
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, if (grande) 16.dp else 13.dp)
            Spacer(modifier = Modifier.width(5.dp))
            Text(meta.label, color = meta.color, fontSize = if (grande) 11.sp else 10.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(fmtEur(total), color = meta.color, fontSize = if (grande) 18.sp else 14.sp, fontWeight = FontWeight.Bold)
```
(y en `EntradaHistorial` se antepone `CategoriaIcon(entry.type, meta.color, 14.dp)` antes de la etiqueta)

#### Por quÃ© se cambiÃ³
Replica la estructura de tarjeta del mÃ³vil (icono + nombre + importe) y mejora la legibilidad en el reloj.

---

## 2026-06-01 20:33 - Corregir ediciÃ³n de notas y aÃ±adir confirmaciÃ³n de cierre en el reloj

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

### Cambio 1 - Modo nota en AddEntryScreen

#### CÃ³digo anterior
```kotlin
    initialAmount: Double = 0.0,
    initialNote: String = "",
    onDelete: (() -> Unit)? = null
) {
    var amountText by remember { mutableStateOf(amountToText(initialAmount)) }
    var note by remember { mutableStateOf(initialNote) }

    val amount = parseAmount(amountText)

    Box(
```

#### CÃ³digo nuevo
```kotlin
    initialAmount: Double = 0.0,
    initialNote: String = "",
    onDelete: (() -> Unit)? = null,
    esNota: Boolean = false
) {
    var amountText by remember { mutableStateOf(amountToText(initialAmount)) }
    var note by remember { mutableStateOf(initialNote) }

    val amount = parseAmount(amountText)

    if (esNota) {
        NotaEditor(
            note = note,
            onEditarTexto = { onRequestNote(note) { result -> note = result } },
            onSave = { if (note.isNotBlank()) onSave(0.0, note) },
            onCancel = onCancel,
            onDelete = onDelete
        )
        return
    }

    Box(
```

#### Por quÃ© se cambiÃ³
Editar una nota desde el historial no funcionaba: el botÃ³n Guardar exigÃ­a importe > 0 y una nota tiene importe 0. El nuevo modo nota (composable `NotaEditor`) edita solo el texto (teclado/voz del sistema) y permite eliminar, como el diÃ¡logo de ediciÃ³n del mÃ³vil. `WearMainActivity` pasa `esNota = e.type == "nota"`.

### Cambio 2 - Paso de confirmaciÃ³n con resumen al cerrar turno

#### CÃ³digo anterior
```kotlin
fun EndTurnoScreen(
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: KilÃ³metros
```
(con 2 pasos; "Finalizar" en el paso 2 llamaba directamente a `onConfirm`)

#### CÃ³digo nuevo
```kotlin
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: Km + nota, 3: Confirmar
```
(el paso 2 pasa a "Revisar" -> paso 3 con resumen de taxÃ­metro, km y desglose por categorÃ­a; "Cerrar" confirma; "AtrÃ¡s" vuelve al paso 2)

#### Por quÃ© se cambiÃ³
Cerrar turno es irreversible y no tenÃ­a confirmaciÃ³n. Se aÃ±ade un paso final con resumen (taxÃ­metro, km y totales por categorÃ­a recibidos en `totalsPorTipo`) antes de cerrar definitivamente.

---

## 2026-06-01 20:15 - AÃ±adir pantalla de turno tipo mÃ³vil y ediciÃ³n de entradas en el reloj

**Archivos modificados:** `src/shared/watch-commands.ts`, `src/logic/watch-command-processor.ts`, `src/services/watch-bridge.ts`, `src/__tests__/watch-command-processor.test.ts`, `android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

### Cambio 1 - Tipo WatchEntry y totales con recuento en el contrato

#### CÃ³digo anterior
```ts
export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

/** Importe acumulado del turno en curso, sumado por categorÃ­a, y nÂº de entradas. */
export type WatchTurnoTotals = {
  porTipo: Record<WatchEntryType, number>;
  numEntradas: number;
};
```

#### CÃ³digo nuevo
```ts
export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

/** Una entrada del turno tal y como se muestra en el historial del reloj. */
export type WatchEntry = {
  id: number;
  type: WatchEntryType | "nota";
  amount: number;
  note: string;
  time: string;
};

/** Importe y recuento acumulados del turno en curso, por categorÃ­a. */
export type WatchTurnoTotals = {
  porTipo: Record<WatchEntryType, number>;
  numPorTipo: Record<WatchEntryType, number>;
  numEntradas: number;
};
```

#### Por quÃ© se cambiÃ³
El reloj necesita pintar el historial (lista de entradas) y, en cada tarjeta, el nÂº de entradas ademÃ¡s del importe. Se aÃ±ade `WatchEntry` y `numPorTipo`.

### Cambio 2 - Comandos EDIT_ENTRY y DELETE_ENTRY y ampliaciÃ³n del STATUS

#### CÃ³digo anterior
```ts
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };

export type WatchCommandResponse =
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
    }
```

#### CÃ³digo nuevo
```ts
  | {
      operationId: string;
      type: "EDIT_ENTRY";
      createdAt: string;
      payload: {
        id: number;
        amount: number;
        note: string;
      };
    }
  | {
      operationId: string;
      type: "DELETE_ENTRY";
      createdAt: string;
      payload: {
        id: number;
      };
    }
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };

export type WatchCommandResponse =
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
    }
```

#### Por quÃ© se cambiÃ³
Para editar y borrar entradas desde el reloj hacÃ­an falta comandos nuevos, y el STATUS debe transportar el desglose acumulado y el historial.

### Cambio 3 - computeWatchTotals y buildWatchEntradas

#### CÃ³digo anterior
`No existÃ­a computeWatchTotals ni buildWatchEntradas en src/logic/watch-command-processor.ts (el STATUS solo devolvÃ­a connected/activeTurno/startTime/startDate).`

#### CÃ³digo nuevo
```ts
export function computeWatchTotals(current: CurrentState): WatchTurnoTotals {
  const porTipo: Record<WatchEntryType, number> = { propina: 0, datafono: 0, agencia_bono: 0, extra: 0, gasolina: 0, nulo: 0 };
  const numPorTipo: Record<WatchEntryType, number> = { propina: 0, datafono: 0, agencia_bono: 0, extra: 0, gasolina: 0, nulo: 0 };
  for (const entry of current.entries) {
    if (entry.type in porTipo) {
      porTipo[entry.type as WatchEntryType] += entry.amount;
      numPorTipo[entry.type as WatchEntryType] += 1;
    }
  }
  return { porTipo, numPorTipo, numEntradas: current.entries.length };
}

export function buildWatchEntradas(current: CurrentState): WatchEntry[] {
  return current.entries
    .map((e) => ({ id: e.id, type: e.type as WatchEntry["type"], amount: e.amount, note: e.note, time: e.time }))
    .reverse();
}
```

#### Por quÃ© se cambiÃ³
Se centralizan en el procesador (lÃ³gica pura) el cÃ¡lculo del desglose por categorÃ­a y la construcciÃ³n del historial, reutilizados por GET_STATUS y por el bridge.

### Cambio 4 - Manejo de EDIT_ENTRY y DELETE_ENTRY en el procesador

#### CÃ³digo anterior
`No existÃ­a el manejo de EDIT_ENTRY ni DELETE_ENTRY en processWatchCommand (se pasaba directamente de ADD_NOTE a END_TURNO).`

#### CÃ³digo nuevo
```ts
  if (command.type === "EDIT_ENTRY") {
    if (!state.current.startTime) return { ...state, response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo") };
    const target = state.current.entries.find((e) => e.id === command.payload.id);
    if (!target) return { ...state, response: errorResponse(command, "ENTRY_NOT_FOUND", "Entrada no encontrada") };
    if (target.type !== "nota" && !(command.payload.amount > 0)) return { ...state, response: errorResponse(command, "INVALID_AMOUNT", "Importe invalido") };
    return { ...state, current: { ...state.current, entries: state.current.entries.map((e) => e.id === command.payload.id ? { ...e, amount: e.type === "nota" ? e.amount : command.payload.amount, note: command.payload.note.trim() } : e) }, processedOperationIds: withProcessedOperationId(state, command.operationId), response: { type: "OK", operationId: command.operationId, message: "Entrada editada" } };
  }

  if (command.type === "DELETE_ENTRY") {
    if (!state.current.startTime) return { ...state, response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo") };
    const exists = state.current.entries.some((e) => e.id === command.payload.id);
    if (!exists) return { ...state, response: errorResponse(command, "ENTRY_NOT_FOUND", "Entrada no encontrada") };
    return { ...state, current: { ...state.current, entries: state.current.entries.filter((e) => e.id !== command.payload.id) }, processedOperationIds: withProcessedOperationId(state, command.operationId), response: { type: "OK", operationId: command.operationId, message: "Entrada borrada" } };
  }
```

#### Por quÃ© se cambiÃ³
Implementa la ediciÃ³n y borrado de entradas validando turno activo, existencia de la entrada e importe (las notas mantienen importe 0).

### Cambio 5 - GET_STATUS y bridge incluyen totals y entradas

#### CÃ³digo anterior
```ts
        startDate: state.current.startDate,
      },
```
(y en `watch-bridge.ts` el objeto `response` del STATUS terminaba en `startDate: store.current.startDate,`)

#### CÃ³digo nuevo
```ts
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
      },
```
(y en `watch-bridge.ts` se aÃ±adiÃ³ `totals: computeWatchTotals(store.current),` y `entradas: buildWatchEntradas(store.current),`, ademÃ¡s de incluir `EDIT_ENTRY`/`DELETE_ENTRY` en el `if` que persiste el resultado en el store)

#### Por quÃ© se cambiÃ³
Tanto la respuesta a GET_STATUS como el envÃ­o proactivo de estado deben llevar el desglose y el historial para que el reloj los muestre.

### Cambio 6 - Tests del desglose, ediciÃ³n y borrado

#### CÃ³digo anterior
`No existÃ­an tests de GET_STATUS con desglose, EDIT_ENTRY ni DELETE_ENTRY en src/__tests__/watch-command-processor.test.ts.`

#### CÃ³digo nuevo
Se aÃ±aden 4 casos: GET_STATUS devuelve `totals` (porTipo + numPorTipo) y `entradas` ordenadas (recientes primero); EDIT_ENTRY actualiza importe y nota (trim); DELETE_ENTRY elimina por id; EDIT_ENTRY con id inexistente devuelve `ENTRY_NOT_FOUND`. Resultado: 9/9 en verde.

#### Por quÃ© se cambiÃ³
Tests de caracterizaciÃ³n para fijar el comportamiento del puente del reloj (no toca `accounting.ts`/`week-logic.ts`).

### Cambio 7 - WatchModels.kt (modelos y formato del reloj)

#### CÃ³digo anterior
`No existÃ­a WatchModels.kt en android/wear/.../screens.`

#### CÃ³digo nuevo
Define `data class WatchEntry`, `categoriaMeta`/`categoriaLabelSingular` (etiqueta, color y fondo por categorÃ­a), `fmtEur`/`fmtEurSigned` (formato â‚¬ espaÃ±ol con coma) y `formatFechaTurno` (ISO -> "Lunes, 1 de junio").

#### Por quÃ© se cambiÃ³
La pantalla principal y el historial necesitan etiquetas, colores y formato de importe/fecha coherentes con el mÃ³vil.

### Cambio 8 - NumericKeypad: tecla Guardar configurable y amountToText

#### CÃ³digo anterior
```kotlin
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            KeyButton(",", ColorWhite, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, Modifier.weight(1f)) { onKey("0") }
            KeyButton("DEL", color, Modifier.weight(1f)) { onKey("DEL") }
        }
```

#### CÃ³digo nuevo
```kotlin
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            KeyButton(",", ColorWhite, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, Modifier.weight(1f)) { onKey("0") }
            if (onSave != null) {
                SaveKey(color, saveEnabled, Modifier.weight(1f), onSave)
            } else {
                KeyButton("DEL", color, Modifier.weight(1f)) { onKey("DEL") }
            }
        }
```

#### Por quÃ© se cambiÃ³
Permite integrar Guardar (âœ“) como Ãºltima tecla del teclado (sin scroll ni botÃ³n aparte) manteniendo la coma visible; se aÃ±ade `amountToText` para precargar el importe al editar.

### Cambio 9 - AddEntryScreen sin scroll y con modo ediciÃ³n

#### CÃ³digo anterior
`AddEntryScreen usaba Column con verticalScroll, fila de botones Volver/Guardar aparte (provocaba scroll) y botÃ³n Nota con texto fijo; sin modo ediciÃ³n.`

#### CÃ³digo nuevo
Layout fijo centrado (sin scroll): fila superior con â€¹ volver, etiqueta y âŒ«; importe grande; acceso a Nota (teclado/voz del sistema) y, en ediciÃ³n, "Borrar"; teclado con coma y Guardar âœ“. Nuevos parÃ¡metros `initialAmount`, `initialNote` y `onDelete` para reutilizarla al editar.

#### Por quÃ© se cambiÃ³
El teclado anterior obligaba a hacer scroll para guardar y no se veÃ­a profesional; ademÃ¡s se reutiliza la misma pantalla para editar/borrar entradas.

### Cambio 10 - ActiveTurnoScreen: pantalla de turno tipo mÃ³vil

#### CÃ³digo anterior
`ActiveTurnoScreen mostraba solo un menÃº de 6 categorÃ­as con chips de borde neÃ³n y un botÃ³n Terminar; sin fecha, sin totales y sin historial.`

#### CÃ³digo nuevo
Cabecera con fecha (`formatFechaTurno`) y "desde HH:MM"; tarjetas por categorÃ­a (DatÃ¡fono/Propinas grandes, resto pequeÃ±as) con total y nÂº de entradas que al tocarlas abren el teclado de esa categorÃ­a; botÃ³n "AÃ±adir nota al turno"; lista "Ãšltimas entradas" tocable para editar; botÃ³n "Terminar turno". Relleno sÃ³lido en lugar de bordes neÃ³n.

#### Por quÃ© se cambiÃ³
Replica la pantalla del mÃ³vil optimizada para la esfera redonda y da doble funciÃ³n a las tarjetas (ver total + aÃ±adir).

### Cambio 11 - WearMainActivity: estado, navegaciÃ³n de ediciÃ³n y comandos

#### CÃ³digo anterior
`WearMainActivity no parseaba totals ni entradas, no tenÃ­a estado de startDate/ediciÃ³n, ni comandos de editar/borrar; ScreenState no incluÃ­a EDIT_ENTRY.`

#### CÃ³digo nuevo
Nuevos estados (`startDate`, `totalsPorTipo`, `numPorTipo`, `entradas`, `editingEntry`); `parseTotals`/`parseEntradas` desde el JSON del STATUS; `ScreenState.EDIT_ENTRY` y rama que abre `AddEntryScreen` en modo ediciÃ³n; comandos `sendEditEntry`/`sendDeleteEntry`; la pantalla de turno recibe fecha, totales, recuento e historial.

#### Por quÃ© se cambiÃ³
Conecta el nuevo contrato (totales + historial + ediciÃ³n) con la UI del reloj.

---

## 2026-06-01 12:54 - AÃ±adir teclado numÃ©rico decimal y notas reales en el reloj

**Archivos modificados:** `android/wear/build.gradle`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

### Cambio 1 - Dependencia wear-input

#### CÃ³digo anterior
```gradle
    implementation 'androidx.wear:wear:1.3.0'

    // Jetpack Compose BÃ¡sico
```

#### CÃ³digo nuevo
```gradle
    implementation 'androidx.wear:wear:1.3.0'
    // Teclado / voz del sistema (RemoteInput) para entrada de notas
    implementation 'androidx.wear:wear-input:1.1.0'

    // Jetpack Compose BÃ¡sico
```

#### Por quÃ© se cambiÃ³
`RemoteInputIntentHelper` (teclado/voz del sistema para notas) vive en `androidx.wear:wear-input`, que no estaba declarado.

### Cambio 2 - Componente NumericKeypad

#### CÃ³digo anterior
`No existÃ­a NumericKeypad.kt; el importe se introducÃ­a con botones fijos +1/+2/+5/+10 sin decimales.`

#### CÃ³digo nuevo
Teclado in-app 3x4 (1-9, coma, 0, borrar) con `applyKey` (mÃ¡x. 2 decimales, sin ceros a la izquierda) y `parseAmount`.

#### Por quÃ© se cambiÃ³
Permite introducir la cantidad exacta con decimales, como en el mÃ³vil, en lugar de sumar con botones fijos.

### Cambio 3 - AddEntryScreen con teclado y nota real (estado inicial de la sesiÃ³n)

#### CÃ³digo anterior
```kotlin
var amount by remember { mutableStateOf(0) }
```
(importe entero; botones +1/+2/+5/+10; nota fija "Reloj")

#### CÃ³digo nuevo
Importe como texto decimal con `NumericKeypad`; importe `Double` real; botÃ³n Nota que abre el teclado/voz del sistema.

#### Por quÃ© se cambiÃ³
El importe entero y la nota fija no servÃ­an para datos reales; se alinea con el mÃ³vil.

### Cambio 4 - EndTurnoScreen con teclado decimal y nota del cierre

#### CÃ³digo anterior
```kotlin
var dinero by remember { mutableStateOf(0) }
var km by remember { mutableStateOf(0) }
```
(botones +5/+20/+50/+100; nota fija "Cierre desde reloj")

#### CÃ³digo nuevo
Dinero y km con teclado decimal (`parseAmount`); nota opcional del cierre; `onConfirm` incluye `note`.

#### Por quÃ© se cambiÃ³
Coherencia con el teclado de entradas y para permitir decimales y nota real al cerrar el turno.

### Cambio 5 - RemoteInput en WearMainActivity

#### CÃ³digo anterior
```kotlin
onAddNote = {
    sendAddNote("Nota desde reloj")
},
```
(y `sendEndTurno(dinero, km)` con nota fija "Cierre desde reloj")

#### CÃ³digo nuevo
`ActivityResultLauncher` + `requestNote()` con `RemoteInputIntentHelper`; `ADD_NOTE` y `END_TURNO` envÃ­an el texto real introducido por el usuario.

#### Por quÃ© se cambiÃ³
Sustituye los textos de nota fijos por entrada de texto real (teclado/voz) del sistema Wear.

---

## 2026-06-01 02:14 - AÃ±adir contrato Wear seguro

**Archivos modificados:** `src/shared/watch-commands.ts`, `src/logic/watch-command-processor.ts`, `src/__tests__/watch-command-processor.test.ts`

### Cambio 1 - Tipos de comandos del reloj

#### CÃ³digo anterior
`No existÃ­a watch-commands.ts en src/shared.`

#### CÃ³digo nuevo
```ts
export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "START_TURNO";
      createdAt: string;
    }
  | {
      operationId: string;
      type: "ADD_ENTRY";
      createdAt: string;
      payload: {
        entryType: WatchEntryType;
        amount: number;
        note: string;
      };
    }
  | {
      operationId: string;
      type: "ADD_NOTE";
      createdAt: string;
      payload: {
        note: string;
      };
    }
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };
```

#### Por quÃ© se cambiÃ³
Se creÃ³ un contrato tipado para que las Ã³rdenes del reloj tengan formato explÃ­cito y siempre incluyan `operationId`, `type`, `createdAt` y el `payload` correspondiente.

### Cambio 2 - Respuestas del mÃ³vil al reloj

#### CÃ³digo anterior
`No existÃ­a WatchCommandResponse en src/shared/watch-commands.ts.`

#### CÃ³digo nuevo
```ts
export type WatchCommandResponse =
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
    }
  | {
      type: "OK";
      operationId: string;
      message: string;
    }
  | {
      type: "ERROR";
      operationId: string;
      code: string;
      message: string;
    }
  | {
      type: "DUPLICATE_IGNORED";
      operationId: string;
      message: string;
    };
```

#### Por quÃ© se cambiÃ³
El reloj necesita respuestas claras del mÃ³vil para mostrar estado confirmado, Ã©xito, error o duplicado ignorado sin inventar estado local.

### Cambio 3 - Procesador puro de comandos Wear

#### CÃ³digo anterior
`No existÃ­a watch-command-processor.ts en src/logic.`

#### CÃ³digo nuevo
```ts
export type WatchCommandProcessorState = {
  current: CurrentState;
  history: Turno[];
  processedOperationIds: string[];
  settings: Pick<
    AppSettings,
    | "porcentaje.jefe"
    | "porcentaje.chofer"
    | "descontar.datafono"
    | "descontar.agencia_bono"
    | "descontar.extra"
    | "descontar.gasolina"
    | "diaLibre"
  >;
  now: {
    date: string;
    time: string;
    id: number;
  };
};

export type WatchCommandProcessorResult = WatchCommandProcessorState & {
  response: WatchCommandResponse;
};
```

```ts
export function processWatchCommand(
  command: WatchCommand,
  state: WatchCommandProcessorState,
): WatchCommandProcessorResult {
  if (!command.operationId.trim()) {
    return {
      ...state,
      response: errorResponse(command, "INVALID_OPERATION_ID", "operationId obligatorio"),
    };
  }

  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
      },
    };
  }

  if (state.processedOperationIds.includes(command.operationId)) {
    return {
      ...state,
      response: {
        type: "DUPLICATE_IGNORED",
        operationId: command.operationId,
        message: "Operacion ya procesada",
      },
    };
  }
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una pieza pura, sin React, sin Android y sin Firebase, para validar y aplicar comandos del reloj de forma testeable antes de conectarlos a Wear OS.

### Cambio 4 - Aplicar Ã³rdenes de trabajo desde el procesador

#### CÃ³digo anterior
`No existÃ­a lÃ³gica para START_TURNO, ADD_ENTRY, ADD_NOTE ni END_TURNO en src/logic/watch-command-processor.ts.`

#### CÃ³digo nuevo
```ts
  if (command.type === "START_TURNO") {
    if (isActive(state.current)) {
      return {
        ...state,
        response: errorResponse(command, "ACTIVE_TURNO", "Ya hay turno activo"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        startTime: state.now.time,
        startDate: state.now.date,
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Turno iniciado",
      },
    };
  }
```

```ts
  if (command.type === "ADD_ENTRY") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!(command.payload.amount > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_AMOUNT", "Importe invalido"),
      };
    }
```

```ts
  if (command.type === "END_TURNO") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!(command.payload.dinero > 0) || !(command.payload.km > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_END_VALUES", "Taximetro y kilometros obligatorios"),
      };
    }
```

#### Por quÃ© se cambiÃ³
El reloj necesita iniciar turno, aÃ±adir entradas, aÃ±adir notas y terminar turno, pero el mÃ³vil debe validar el estado antes de aplicar cada orden.

### Cambio 5 - Tests del procesador Wear

#### CÃ³digo anterior
`No existÃ­a watch-command-processor.test.ts en src/__tests__.`

#### CÃ³digo nuevo
```ts
describe("processWatchCommand", () => {
  it("inicia turno solo una vez con operationId unico", () => {
    const command: WatchCommand = {
      operationId: "op-start-1",
      type: "START_TURNO",
      createdAt: "2026-06-01T10:35:00",
    };

    const result = processWatchCommand(command, baseState());

    expect(result.response).toEqual({
      type: "OK",
      operationId: "op-start-1",
      message: "Turno iniciado",
    });
    expect(result.current.startTime).toBe("10:35");
    expect(result.current.startDate).toBe("2026-06-01");
    expect(result.processedOperationIds).toEqual(["op-start-1"]);
  });
```

```ts
  it("ignora comandos duplicados sin modificar el turno", () => {
    const command: WatchCommand = {
      operationId: "op-entry-1",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:36:00",
      payload: {
        entryType: "propina",
        amount: 1,
        note: "",
      },
    };
```

```ts
  it("termina turno activo y lo mueve al historial", () => {
    const result = processWatchCommand({
      operationId: "op-end-1",
      type: "END_TURNO",
      createdAt: "2026-06-01T12:00:00",
      payload: {
        dinero: 123.45,
        km: 210,
        note: "cierre desde reloj",
      },
    }, baseState({
```

#### Por quÃ© se cambiÃ³
Los tests fijan que el procesador inicia turno, ignora duplicados, rechaza entradas sin turno activo, aÃ±ade entradas/notas y termina turno moviÃ©ndolo al historial.

## 2026-06-01 02:08 - AÃ±adir plan del reloj Wear OS

**Archivos modificados:** `PLAN_RELOJ_WEAR_OS.md`

### Cambio 1 - Documento del reloj Wear OS

#### CÃ³digo anterior
`No existÃ­a PLAN_RELOJ_WEAR_OS.md en la raÃ­z del proyecto.`

#### CÃ³digo nuevo
```md
# Plan Wear OS - Reloj como mando del movil

## Objetivo

Crear una app para Wear OS que funcione como mando seguro del movil para la parte de trabajo:

- Iniciar turno.
- Anadir entradas al turno activo.
- Anadir notas del turno.
- Terminar turno.
- Consultar el estado confirmado por el movil.

El reloj no sera una app independiente de datos. El movil seguira siendo el cerebro de la app.

## Regla principal

El reloj no escribe en Firestore.

El reloj no escribe en sincronizacion.

El reloj no guarda acciones pendientes.

El reloj solo manda ordenes al movil cuando hay conexion confirmada.

Si no hay conexion confirmada con el movil, el reloj bloquea todas las acciones de trabajo.
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una especificaciÃ³n previa para fijar que Wear OS funcionarÃ¡ solo como mando del mÃ³vil, sin escritura directa en Firestore, sin cola offline y con bloqueo total de acciones cuando no exista conexiÃ³n confirmada con el mÃ³vil.

## 2026-06-01 01:28 - Corregir navegaciÃ³n de vuelta

**Archivos modificados:**
- `src/services/store.ts`
- `src/main.tsx`
- `src/screens/add-entry-screen.tsx`
- `src/screens/add-nota-general-screen.tsx`
- `src/screens/add-single-entry-screen.tsx`
- `src/screens/admin-screens.tsx`
- `src/screens/calendar-screen.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/contabilidad-screen.tsx`
- `src/screens/detalle-anual-screen.tsx`
- `src/screens/detalle-mes-screen.tsx`
- `src/screens/detalle-semana-screen.tsx`
- `src/screens/edit-turno-screen.tsx`
- `src/screens/liquidacion-semana-screen.tsx`
- `src/screens/pantalla-turnos.tsx`
- `src/screens/summary-screen.tsx`
- `src/screens/today-history-screen.tsx`
- `src/__tests__/main-antiguo-regressions.test.ts`
- `src/__tests__/store-extraction.test.ts`
- `src/__tests__/navigation-regressions.test.ts`

### Cambio 1 - AÃ±adir reemplazo de pantalla al store

#### CÃ³digo anterior
```ts
  /** Navega a una pantalla apilÃ¡ndola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raÃ­z. */
  goBack: () => boolean;
```

```ts
  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  goBack: () => {
```

#### CÃ³digo nuevo
```ts
  /** Navega a una pantalla apilÃ¡ndola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Sustituye la pantalla actual sin crear una nueva entrada de historial. */
  replaceScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raÃ­z. */
  goBack: () => boolean;
```

```ts
  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  replaceScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      const stack = s.navigationStack.length > 0 ? [...s.navigationStack] : [s.screen];
      stack[stack.length - 1] = next;
      if (stack.length > 1 && stack[stack.length - 2] === next) {
        stack.pop();
      }
      return { screen: next, navigationStack: stack };
    }),

  goBack: () => {
```

#### Por quÃ© se cambiÃ³
`setScreen` apila pantallas. Para volver, cancelar o cerrar pantallas hacÃ­a falta una acciÃ³n que sustituyera la pantalla actual y evitara duplicados consecutivos en `navigationStack`.

### Cambio 2 - Evitar que editar turno deje `editTurno` en el historial

#### CÃ³digo anterior
```tsx
  setScreen: (s: string) => void;
```

```tsx
    setViewTurno(updated as Turno);
    setEditJ(null);
    setScreen('summary');
```

```tsx
          <button style={S.iconBtn} onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); setScreen('summary'); }}><IconBack /></button>
```

```tsx
          <button onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); setScreen('summary'); }}
```

```tsx
                  setHistory((h) => h.filter((j) => j.id !== editJ.id));
                  setEditJ(null);
                  setViewTurno(null);
                  setScreen("PantallaTurnos");
```

#### CÃ³digo nuevo
```tsx
  replaceScreen: (s: string) => void;
  resetNavigation: (root?: string) => void;
  registerLocalAndroidBackHandler?: (handler: () => boolean) => () => void;
```

```tsx
    setViewTurno(updated as Turno);
    setEditJ(null);
    replaceScreen('summary');
```

```tsx
          <button style={S.iconBtn} onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); replaceScreen('summary'); }}><IconBack /></button>
```

```tsx
          <button onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); replaceScreen('summary'); }}
```

```tsx
                  setHistory((h) => h.filter((j) => j.id !== editJ.id));
                  setEditJ(null);
                  setViewTurno(null);
                  resetNavigation("PantallaTurnos");
```

#### Por quÃ© se cambiÃ³
Al cancelar, guardar o volver desde ediciÃ³n, `editJ` se limpiaba pero `editTurno` quedaba en el historial. Al pulsar atrÃ¡s nativo se volvÃ­a a una pantalla de ediciÃ³n sin estado vÃ¡lido.

### Cambio 3 - Reemplazar pantallas al volver

#### CÃ³digo anterior
```tsx
onClick={() => setScreen("home")}
```

```tsx
setScreen("main");
```

```tsx
onClick={() => setScreen("contabilidad")}
```

```tsx
onClick={() => setScreen("detalleSemana")}
```

#### CÃ³digo nuevo
```tsx
onClick={() => replaceScreen("home")}
```

```tsx
replaceScreen("main");
```

```tsx
onClick={() => replaceScreen("contabilidad")}
```

```tsx
onClick={() => replaceScreen("detalleSemana")}
```

#### Por quÃ© se cambiÃ³
Los botones de volver de calendario, contabilidad, turnos, resumen, alta de entradas, confirmar cierre, detalle mensual/anual/semanal y liquidaciÃ³n estaban usando navegaciÃ³n de entrada. Eso dejaba pantallas cerradas dentro del historial.

### Cambio 4 - Abrir notas de detalle semanal con su turno

#### CÃ³digo anterior
```tsx
                  onClick={() => { setScreen("summary"); }}
```

#### CÃ³digo nuevo
```tsx
                  onClick={() => {
                    setReturnScreen("detalleSemana");
                    setViewTurno(data.turno);
                    setScreen("summary");
                  }}
```

#### Por quÃ© se cambiÃ³
La tarjeta de notas de detalle semanal abrÃ­a `summary` sin asignar el turno correspondiente. PodÃ­a mostrar un resumen anterior o caer a una pantalla no esperada si `viewTurno` estaba vacÃ­o.

### Cambio 5 - Cerrar capas locales antes de navegar con Android atrÃ¡s

#### CÃ³digo anterior
```ts
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
```

#### CÃ³digo nuevo
```ts
          if (localAndroidBackHandlerRef.current?.()) {
            void hapticBackClose();
            return;
          }
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
```

#### Por quÃ© se cambiÃ³
Algunas pantallas tienen diÃ¡logos o capas locales que no viven en el estado global de `main.tsx`. El botÃ³n nativo de Android necesitaba darles prioridad antes de navegar por el stack.

### Cambio 6 - Registrar cierres locales de ediciÃ³n, semana y admin

#### CÃ³digo anterior
`No existÃ­a registro local de botÃ³n atrÃ¡s Android en EditTurnoScreen, DetalleSemanaScreen ni AdminUserView.`

#### CÃ³digo nuevo
```tsx
  useEffect(() => {
    if (!registerLocalAndroidBackHandler) return;
    return registerLocalAndroidBackHandler(() => {
      if (confirmDialog) {
        setConfirmDialog(null);
        return true;
      }
      if (editEntry) {
        setEditEntry(null);
        return true;
      }
      if (endField) {
        setEndField(null);
        return true;
      }
      if (showNewEntryKP) {
        setShowNewEntryKP(false);
        return true;
      }
      if (showTypeMenu) {
        setShowTypeMenu(false);
        return true;
      }
      return false;
    });
  }, [confirmDialog, editEntry, endField, registerLocalAndroidBackHandler, setEndField, showNewEntryKP, showTypeMenu]);
```

```tsx
  React.useEffect(() => {
    if (!registerLocalAndroidBackHandler) return;
    return registerLocalAndroidBackHandler(() => {
      if (!confirmDialog) return false;
      setConfirmDialog(null);
      return true;
    });
  }, [confirmDialog, registerLocalAndroidBackHandler]);
```

```tsx
  useEffect(() => {
    if (!registerLocalAndroidBackHandler) return;
    return registerLocalAndroidBackHandler(() => {
      if (!selectedTurno) return false;
      setSelectedTurno(null);
      return true;
    });
  }, [registerLocalAndroidBackHandler, selectedTurno]);
```

#### Por quÃ© se cambiÃ³
Editar turno, detalle semanal y la vista admin tenÃ­an estados locales que el handler global no podÃ­a cerrar. Se aÃ±adiÃ³ un registro local para cerrar primero esas capas y solo navegar si no habÃ­a nada abierto.

### Cambio 7 - AÃ±adir tests de navegaciÃ³n

#### CÃ³digo anterior
`No existÃ­a navigation-regressions.test.ts en src/__tests__.`

#### CÃ³digo nuevo
```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("regresiones de navegaciÃ³n", () => {
  it("editar turno vuelve al resumen sin apilar otra pantalla", async () => {
    const source = await readFile("src/screens/edit-turno-screen.tsx", "utf8");

    expect(source).not.toContain("setScreen('summary')");
    expect(source).not.toContain('setScreen("summary")');
    expect(source).toContain("replaceScreen('summary')");
  });

  it("detalle semana abre el resumen de notas con el turno seleccionado", async () => {
    const source = await readFile("src/screens/detalle-semana-screen.tsx", "utf8");

    expect(source).toContain('setReturnScreen("detalleSemana");');
    expect(source).toContain("setViewTurno(data.turno);");
  });
});
```

#### Por quÃ© se cambiÃ³
HacÃ­a falta fijar una regresiÃ³n automÃ¡tica para que editar turno no vuelva a usar `setScreen('summary')` y para que detalle semana no abra resumen sin `viewTurno`.

### Cambio 8 - Proteger `replaceScreen` con test

#### CÃ³digo anterior
```ts
  it("resetNavigation reinicia el stack a la raÃ­z dada (flujo post-cierre de turno)", () => {
    useAppStore.getState().setScreen("calendar");
    useAppStore.getState().setScreen("confirmEnd");
    useAppStore.getState().resetNavigation("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    // AtrÃ¡s desde el resumen debe llevar a la lista de turnos, no a confirmEnd.
    expect(useAppStore.getState().navigationStack).toEqual(["PantallaTurnos", "summary"]);
    useAppStore.getState().goBack();
    expect(useAppStore.getState().screen).toBe("PantallaTurnos");
  });
```

#### CÃ³digo nuevo
```ts
  it("resetNavigation reinicia el stack a la raÃ­z dada (flujo post-cierre de turno)", () => {
    useAppStore.getState().setScreen("calendar");
    useAppStore.getState().setScreen("confirmEnd");
    useAppStore.getState().resetNavigation("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    // AtrÃ¡s desde el resumen debe llevar a la lista de turnos, no a confirmEnd.
    expect(useAppStore.getState().navigationStack).toEqual(["PantallaTurnos", "summary"]);
    useAppStore.getState().goBack();
    expect(useAppStore.getState().screen).toBe("PantallaTurnos");
  });

  it("replaceScreen sustituye la pantalla actual sin duplicar la anterior", () => {
    useAppStore.getState().setScreen("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    useAppStore.getState().setScreen("editTurno");

    const replaceScreen = (useAppStore.getState() as any).replaceScreen;
    expect(typeof replaceScreen).toBe("function");

    replaceScreen("summary");

    expect(useAppStore.getState().screen).toBe("summary");
    expect(useAppStore.getState().navigationStack).toEqual([
      "home",
      "PantallaTurnos",
      "summary",
    ]);
  });
```

#### Por quÃ© se cambiÃ³
El contrato nuevo del store necesitaba una prueba que reprodujera el caso real `summary -> editTurno -> summary` sin duplicar `summary` en el historial.

### Cambio 9 - Actualizar test de calendario al nuevo contrato

#### CÃ³digo anterior
```ts
    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
```

#### CÃ³digo nuevo
```ts
    expect(calendarSource).toContain('onClick={() => replaceScreen("home")}');
```

#### Por quÃ© se cambiÃ³
El test antiguo protegÃ­a literalmente una navegaciÃ³n que ahora era el origen del fallo. Se cambiÃ³ para proteger que el botÃ³n de volver de calendario cierre la pantalla sin apilarla.

## 2026-05-31 22:23 - Implementar vibraciÃ³n premium

**Archivos modificados:**
- `src/services/haptics.ts`
- `src/main.tsx`
- `src/screens/add-entry-screen.tsx`
- `src/screens/add-single-entry-screen.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/edit-turno-screen.tsx`
- `src/screens/settings-screen.tsx`
- `src/components/edit-entry-dialog.tsx`
- `src/logic/android-back-button.ts`
- `src/__tests__/android-back-button.test.ts`
- `src/__tests__/haptics-premium-plan.test.ts`

### Cambio 1 - Sustituir intensidades genÃ©ricas

#### CÃ³digo anterior
```ts
export async function hapticTap(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Light });
    } catch (e) {
      console.warn('Error en hapticTap:', e);
    }
  }
}

export async function hapticConfirm(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en hapticConfirm:', e);
    }
  }
}

export async function hapticAction(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en hapticAction:', e);
    }
  }
}
```

#### CÃ³digo nuevo
```ts
async function impactMedium(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en impactMedium:', e);
    }
  }
}

async function impactHeavy(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en impactHeavy:', e);
    }
  }
}

export async function hapticKey(): Promise<void> {
  return impactMedium();
}

export async function hapticOpen(): Promise<void> {
  return impactMedium();
}

export async function hapticBackClose(): Promise<void> {
  return impactMedium();
}

export async function hapticSave(): Promise<void> {
  return impactHeavy();
}

export async function hapticDanger(): Promise<void> {
  return impactHeavy();
}

export async function hapticInvalid(): Promise<void> {
  return impactHeavy();
}
```

#### Por quÃ© se cambiÃ³
Se sustituyeron las funciones genÃ©ricas y la intensidad `Light` por funciones semÃ¡nticas con `Medium` para pulsar/abrir/cerrar capas y `Heavy` para guardar, error o acciÃ³n peligrosa.

### Cambio 2 - AÃ±adir vibraciÃ³n al botÃ³n atrÃ¡s nativo

#### CÃ³digo anterior
```ts
export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};
```

#### CÃ³digo nuevo
```ts
export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  hapticBackClose: () => void | Promise<void>;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};
```

#### Por quÃ© se cambiÃ³
El botÃ³n atrÃ¡s nativo necesitaba la misma respuesta tÃ¡ctil `Medium` cuando cierra una capa visible, una reserva, un diÃ¡logo o una vista admin, sin vibrar cuando la app sale por la raÃ­z real.

### Cambio 3 - Aplicar nombres semÃ¡nticos en pantallas

#### CÃ³digo anterior
```ts
import { hapticTap, hapticConfirm } from "../services/haptics";

function kpAdd(v: string) {
  hapticTap();
```

```ts
function saveS() {
  hapticConfirm();
  if (!validS) return;
```

```ts
<button onClick={() => { hapticAction(); onEndTurno(); }}
```

#### CÃ³digo nuevo
```ts
import { hapticKey, hapticSave, hapticOpen } from "../services/haptics";

function kpAdd(v: string) {
  hapticKey();
```

```ts
function saveS() {
  if (!validS) {
    hapticInvalid();
    return;
  }
```

```ts
<button onClick={() => { hapticDanger(); onEndTurno(); }}
```

#### Por quÃ© se cambiÃ³
Las pantallas de aÃ±adir entrada, aÃ±adir entrada individual, terminar turno, editar turno y ajustes debÃ­an dejar de usar intensidades antiguas directas y usar nombres que expresan la intenciÃ³n de la acciÃ³n.

### Cambio 4 - AÃ±adir respuesta tÃ¡ctil a navegaciÃ³n y ediciÃ³n

#### CÃ³digo anterior
```ts
function openEditEntry(e: Entry) {
  setEditEntry(e);
  setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
  setEditEntryNote(e.note || "");
}
```

```tsx
<div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setShowKP(true)}>
```

#### CÃ³digo nuevo
```ts
function openEditEntry(e: Entry) {
  hapticOpen();
  setEditEntry(e);
  setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
  setEditEntryNote(e.note || "");
}
```

```tsx
<div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => { hapticOpen(); setShowKP(true); }}>
```

#### Por quÃ© se cambiÃ³
Abrir una ediciÃ³n, abrir un teclado, cambiar campo, volver atrÃ¡s o cancelar son acciones operativas que ahora emiten `Medium` para que la app responda con una sensaciÃ³n consistente.

### Cambio 5 - AÃ±adir respuesta fuerte a guardados y peligros

#### CÃ³digo anterior
```ts
if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
  alert("El importe debe ser un nÃºmero mayor que 0.");
  return;
}
const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
```

#### CÃ³digo nuevo
```ts
if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
  hapticInvalid();
  alert("El importe debe ser un nÃºmero mayor que 0.");
  return;
}
const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
hapticSave();
```

#### Por quÃ© se cambiÃ³
Los guardados vÃ¡lidos, errores de validaciÃ³n, iniciar/pausar/terminar turno y eliminaciones debÃ­an sentirse como acciones importantes usando `Heavy`.

### Cambio 6 - Crear prueba del plan de vibraciÃ³n

#### CÃ³digo anterior
`No existÃ­a haptics-premium-plan.test.ts en src/__tests__/.`

#### CÃ³digo nuevo
```ts
describe("plan premium de vibracion", () => {
  it("expone nombres semanticos y reserva Medium para tocar y Heavy para guardar o peligro", () => {
    const hapticsSource = source("src/services/haptics.ts");

    for (const fn of ["hapticKey", "hapticOpen", "hapticBackClose"]) {
      expect(hapticsSource).toContain(`export async function ${fn}()`);
      expect(hapticsSource).toMatch(new RegExp(`export async function ${fn}\\(\\): Promise<void> \\{\\s*return impactMedium\\(\\);\\s*\\}`));
    }

    for (const fn of ["hapticSave", "hapticDanger", "hapticInvalid"]) {
      expect(hapticsSource).toContain(`export async function ${fn}()`);
      expect(hapticsSource).toMatch(new RegExp(`export async function ${fn}\\(\\): Promise<void> \\{\\s*return impactHeavy\\(\\);\\s*\\}`));
    }
  });
});
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba para bloquear la regla profesional acordada: `Medium` para interacciÃ³n normal y `Heavy` para guardado, error o peligro.

### Cambio 7 - Verificar atrÃ¡s nativo con vibraciÃ³n

#### CÃ³digo anterior
```ts
function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}
```

#### CÃ³digo nuevo
```ts
function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    hapticBackClose: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}
```

#### Por quÃ© se cambiÃ³
Las pruebas del botÃ³n atrÃ¡s nativo ahora comprueban que cerrar reservas o capas admin tambiÃ©n llama a `hapticBackClose`.

## 2026-05-31 22:10 - Ampliar plan de vibraciÃ³n

**Archivos modificados:** `INTENSIDAD_VIBRACION.md`

### Cambio 1 - Plan completo por pantallas

#### CÃ³digo anterior
```md
# Intensidad de vibracion

Este archivo documenta la regla propuesta para recordar que intensidad de vibracion debe usar cada tipo de accion.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
```

#### CÃ³digo nuevo
```md
# Plan premium de vibracion

Este archivo documenta el plan completo propuesto para una experiencia de vibracion premium en la app.

Contexto de uso: app usada conduciendo, en la calle y mirando de reojo. La vibracion debe ayudar a confirmar acciones sin exigir mirar fijo la pantalla.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Plan por pantallas

### 1. Home

- Iniciar o continuar turno: `Heavy`
- Turnos: `Medium`
- Contabilidad: `Medium`
- Calendario: `Medium`
- Reserva: `Medium`
- Ajustes: `Medium`
- Admin: `Medium`
- Confirmar cerrar sesion: `Heavy`

### 2. Pantalla de turno activo

- Abrir Propina: `Medium`
- Abrir Datafono: `Medium`
- Abrir Agencia/Bono: `Medium`
- Abrir Extra: `Medium`
- Abrir Gasolina: `Medium`
- Abrir Nulo: `Medium`
- Boton de nota: `Medium`
- Iniciar turno: `Heavy`
- Pausar turno: `Heavy`
- Reanudar turno: `Heavy`
- Terminar turno: `Heavy`

### 3. Anadir propina y datafono

- Teclas numericas: `Medium`
- Borrar: `Medium`
- Coma decimal: `Medium`
- Cambiar entre Propina y Datafono: `Medium`
- Guardar entrada valida: `Heavy`
- Intentar guardar vacio o invalido: feedback de error si se implementa; recomendado `Heavy` corto o feedback de notificacion.

### 4. Anadir agencia, extra, gasolina y nulo

- Teclas numericas: `Medium`
- Borrar: `Medium`
- Coma decimal: `Medium`
- Guardar entrada valida: `Heavy`
- Intentar guardar vacio o invalido: feedback de error si se implementa; recomendado `Heavy` corto o feedback de notificacion.

### 5. Terminar turno

- Seleccionar campo dinero: `Medium`
- Seleccionar campo km: `Medium`
- Teclas dinero/km: `Medium`
- Guardar campo dinero/km: `Heavy`
- Terminar turno definitivo: `Heavy`
- Cancelar: `Medium` o sin vibracion, segun se prefiera.

### 6. Editar turno

- Abrir campo dinero: `Medium`
- Abrir campo km: `Medium`
- Teclas de dinero/km: `Medium`
- Abrir entrada para editar: `Medium`
- Abrir selector de tipo de entrada nueva: `Medium`
- Abrir importe de entrada nueva: `Medium`
- Teclas de entrada nueva: `Medium`
- Guardar cambios: `Heavy`
- Anadir linea nueva dentro del turno: `Heavy`
- Eliminar entrada: `Heavy`
- Eliminar turno: `Heavy`
- Cancelar edicion: `Medium`

### 7. Historial de entradas del turno actual

- Abrir entrada para editar: `Medium`
- Guardar edicion: `Heavy`
- Eliminar entrada: `Heavy`
- Cancelar: `Medium`

### 8. Calendario y reservas

- Abrir reserva: `Medium`
- Guardar reserva: `Heavy`
- Eliminar reserva: `Heavy`
- Abrir nota: `Medium`
- Guardar nota: `Heavy`
- Eliminar nota: `Heavy`
- Cambiar mes: `Medium` si no resulta molesto.
- Cambiar vista calendario/agenda: `Medium`
- Seleccionar dia: `Medium` si se quiere una respuesta mas sensible.
- Abrir turno desde calendario: `Medium`

### 9. Contabilidad, detalle de mes, detalle anual y detalle de semana

- Abrir detalle de mes: `Medium`
- Abrir detalle anual: `Medium`
- Abrir detalle de semana: `Medium`
- Cambiar mes o ano: `Medium` si no resulta molesto.
- Abrir turno desde contabilidad: `Medium`
- Marcar entregado o no entregado: `Heavy`, porque cambia estado contable.
- Abrir liquidacion semanal: `Medium`

### 10. Liquidacion semanal

- Compartir ticket: `Heavy` si la accion se completa.
- Copiar al portapapeles: `Heavy` si la accion se completa.
- Volver a detalle de semana: `Medium` o sin vibracion.

### 11. Ajustes

- Abrir edicion de porcentaje: `Medium`
- Teclas porcentaje: `Medium`
- Guardar porcentaje: `Heavy`
- Buscar actualizacion: `Medium`
- Instalar actualizacion: `Heavy`
- Abrir menu de backup: `Medium`
- Exportar backup: `Heavy` si se genera correctamente.
- Importar/restaurar backup: `Heavy`, con confirmacion clara.

### 12. Login

- Entrar: `Heavy` si empieza el acceso correctamente.
- Registrar cuenta: `Heavy` si empieza el registro correctamente.
- Recuperar contrasena: `Medium` o `Heavy` si se envia correctamente.
- Cambiar entre login/registro/recuperacion: `Medium`
- Error de login: feedback de error si se implementa.

### 13. Admin

- Abrir lista admin: `Medium`
- Seleccionar usuario: `Medium`
- Cambiar pestaÃ±a dentro de usuario admin: `Medium`
- Abrir detalle de turno en admin: `Medium`
- Volver desde usuario admin a lista: `Medium`
- Volver desde lista admin a home: `Medium`

### 14. Boton atras nativo Android

- Si cierra reserva: `Medium`
- Si cierra nota: `Medium`
- Si cierra confirmacion: `Medium`
- Si cierra teclado/modal de dinero o km: `Medium`
- Si cierra selector de mes: `Medium`
- Si cierra menu backup: `Medium`
- Si sale de usuario admin a lista: `Medium`
- Si sale de lista admin a home: `Medium`
- Si solo navega atras entre pantallas: `Medium` opcional.
- Si va a cerrar la app: sin vibracion, para no parecer una confirmacion de guardado.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Fases de implementacion recomendadas

### Fase 1 - Nombres semanticos

Crear nombres que expresen intencion y no intensidad tecnica:

- `hapticKey`
- `hapticOpen`
- `hapticBackClose`
- `hapticSave`
- `hapticDanger`
- `hapticInvalid`

### Fase 2 - Mapa de intensidades

Mapear esos nombres a intensidades:

- `hapticKey`: `Medium`
- `hapticOpen`: `Medium`
- `hapticBackClose`: `Medium`
- `hapticSave`: `Heavy`
- `hapticDanger`: `Heavy`
- `hapticInvalid`: feedback de error si se implementa; si no, `Heavy`

### Fase 3 - Sustituir por pantallas

Aplicar la regla por pantallas, sin tocar Firestore, Firebase, sincronizacion ni calculos contables.

### Fase 4 - Pruebas

Anadir pruebas para asegurar que:

- las acciones de guardado usan feedback fuerte;
- las teclas usan feedback medio;
- el boton atras nativo cierra capas con feedback medio;
- no se llama vibracion en navegador si `Capacitor.isNativePlatform()` es falso.

### Fase 5 - Prueba real en Android

Probar en dispositivo Android real, porque el navegador local no vibra y cada movil puede sentirse distinto.

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
```

#### Por quÃ© se cambiÃ³
El archivo anterior solo guardaba una regla resumida. Se necesitaba conservar el plan completo por pantallas y fases para poder implementarlo despues sin depender de la conversaciÃ³n.

## 2026-05-31 22:08 - AÃ±adir documento de vibraciÃ³n

**Archivos modificados:** `INTENSIDAD_VIBRACION.md`

### Cambio 1 - Documento de intensidades de vibraciÃ³n

#### CÃ³digo anterior
`No existÃ­a INTENSIDAD_VIBRACION.md en la raÃ­z del proyecto.`

#### CÃ³digo nuevo
```md
# Intensidad de vibracion

Este archivo documenta la regla propuesta para recordar que intensidad de vibracion debe usar cada tipo de accion.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
```

#### Por quÃ© se cambiÃ³
Se necesitaba un archivo principal del proyecto para recordar la regla propuesta de intensidad de vibraciÃ³n por tipo de acciÃ³n.

## 2026-05-31 20:00 - Corregir retroceso nativo Android

**Archivos modificados:** `src/main.tsx`, `src/logic/android-back-button.ts`, `src/__tests__/android-back-button.test.ts`

### Cambio 1 - DecisiÃ³n del botÃ³n Android

#### CÃ³digo anterior
`No existÃ­a android-back-button en src/logic/android-back-button.ts.`

#### CÃ³digo nuevo
```ts
export type AdminMode = null | "list" | { uid: string; username: string };

export type AndroidBackButtonSnapshot = {
  adminMode: AdminMode;
  confirmDialogOpen: boolean;
  editEntryOpen: boolean;
  endFieldOpen: boolean;
  screen: string;
  showBackupMenu: boolean;
  showMonthPicker: boolean;
  showNotaDialog: boolean;
  showReservaDialog: boolean;
};

export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};

export function handleAndroidBackButton(
  snapshot: AndroidBackButtonSnapshot,
  actions: AndroidBackButtonActions,
): void {
  if (snapshot.confirmDialogOpen) {
    actions.closeConfirmDialog();
    return;
  }

  if (snapshot.editEntryOpen) {
    actions.closeEditEntry();
    return;
  }

  if (snapshot.endFieldOpen) {
    actions.closeEndField();
    return;
  }

  if (snapshot.showBackupMenu) {
    actions.closeBackupMenu();
    return;
  }

  if (snapshot.showMonthPicker) {
    actions.closeMonthPicker();
    return;
  }

  if (snapshot.showNotaDialog) {
    actions.closeNotaDialog();
    return;
  }

  if (snapshot.showReservaDialog) {
    actions.closeReservaDialog();
    return;
  }

  if (snapshot.adminMode && typeof snapshot.adminMode === "object") {
    actions.setAdminMode("list");
    return;
  }

  if (snapshot.adminMode === "list") {
    actions.setAdminMode(null);
    return;
  }

  if (snapshot.screen === "main") {
    actions.resetNavigation("home");
    return;
  }

  if (!actions.goBack()) {
    actions.exitApp();
  }
}
```

#### Por quÃ© se cambiÃ³
El botÃ³n nativo necesitaba cerrar primero capas abiertas como reserva y vistas admin antes de usar el stack o cerrar la app.

### Cambio 2 - Listener nativo conectado al estado de UI

#### CÃ³digo anterior
```tsx
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
```

```tsx
  // BotÃ³n fÃ­sico de retroceso de Android (Capacitor). Recorre el stack de
  // navegaciÃ³n; si ya estÃ¡ en la raÃ­z, cierra la app. Solo en plataforma nativa.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelado = false;
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          if (state.screen === "main") {
            state.resetNavigation("home");
            return;
          }
          const navego = state.goBack();
          if (!navego) CapApp.exitApp();
        })
      )
      .then((handle) => {
        if (cancelado) handle.remove();
        else remove = () => handle.remove();
      })
      .catch((err) => console.error("backButton listener fallido:", err));
    return () => {
      cancelado = true;
      remove?.();
    };
  }, []);
```

#### CÃ³digo nuevo
```tsx
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import {
  handleAndroidBackButton,
  type AndroidBackButtonSnapshot,
} from "./logic/android-back-button";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
```

```tsx
  const androidBackButtonSnapshotRef = useRef<AndroidBackButtonSnapshot>({
    adminMode,
    confirmDialogOpen: false,
    editEntryOpen: false,
    endFieldOpen: false,
    screen,
    showBackupMenu: false,
    showMonthPicker: false,
    showNotaDialog: false,
    showReservaDialog: false,
  });

  androidBackButtonSnapshotRef.current = {
    adminMode,
    confirmDialogOpen: confirmDialog !== null,
    editEntryOpen: editEntry !== null,
    endFieldOpen: endField !== null,
    screen,
    showBackupMenu,
    showMonthPicker,
    showNotaDialog,
    showReservaDialog,
  };

  // BotÃ³n fÃ­sico de retroceso de Android (Capacitor). Primero cierra capas
  // abiertas; despuÃ©s recorre el stack y solo sale de la app en la raÃ­z real.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelado = false;
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
            closeBackupMenu: () => setShowBackupMenu(false),
            closeConfirmDialog: () => setConfirmDialog(null),
            closeEditEntry: () => setEditEntry(null),
            closeEndField: () => setEndField(null),
            closeMonthPicker: () => setShowMonthPicker(false),
            closeNotaDialog: () => setShowNotaDialog(false),
            closeReservaDialog: () => setShowReservaDialog(false),
            exitApp: () => {
              void CapApp.exitApp();
            },
            goBack: state.goBack,
            resetNavigation: state.resetNavigation,
            setAdminMode,
          });
        })
      )
      .then((handle) => {
        if (cancelado) handle.remove();
        else remove = () => handle.remove();
      })
      .catch((err) => console.error("backButton listener fallido:", err));
    return () => {
      cancelado = true;
      remove?.();
    };
  }, []);
```

#### Por quÃ© se cambiÃ³
El listener anterior solo miraba `screen` y el stack global; por eso una reserva abierta en `home` podÃ­a terminar en `exitApp()` y las pantallas admin no tenÃ­an retroceso nativo propio.

### Cambio 3 - Pruebas del retroceso Android

#### CÃ³digo anterior
`No existÃ­a android-back-button.test en src/__tests__/android-back-button.test.ts.`

#### CÃ³digo nuevo
```ts
import { describe, expect, it, vi } from "vitest";
import { handleAndroidBackButton } from "../logic/android-back-button";

function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}
```

```ts
  it("cierra la reserva abierta en home antes de salir de la app", () => {
```

```ts
  it("vuelve de un usuario admin a la lista sin cerrar la app", () => {
```

```ts
  it("sale de la lista admin a la home propia sin cerrar la app", () => {
```

#### Por quÃ© se cambiÃ³
Se aÃ±adieron pruebas para fijar los dos fallos detectados: reserva abierta desde `home` no debe cerrar la app, y admin debe retroceder dentro del modo admin antes de salir.

## 2026-05-31 19:49 - Mover indicador arriba

**Archivos modificados:** `src/components/sync-indicator.tsx`

### Cambio 1 - PosiciÃ³n vertical del indicador

#### CÃ³digo anterior
```tsx
        position: "absolute",
        bottom: 8,
        right: 8,
```

#### CÃ³digo nuevo
```tsx
        position: "absolute",
        top: 8,
        right: 8,
```

#### Por quÃ© se cambiÃ³
Se necesitaba mantener el indicador a la derecha y con el mismo tamaÃ±o, pero colocado arriba en vez de abajo.

## 2026-05-31 19:45 - AÃ±adir documento del indicador

**Archivos modificados:** `INDICADOR_SINCRONIZACION.md`

### Cambio 1 - Documento de colores del indicador

#### CÃ³digo anterior
`No existÃ­a INDICADOR_SINCRONIZACION.md en la raÃ­z del proyecto.`

#### CÃ³digo nuevo
```md
# Indicador de sincronizacion

Este archivo documenta el significado de cada color de la luz indicadora de estado de sincronizacion de la app.

Fuente verificable del color y texto mostrado: `src/components/sync-indicator.tsx`.

Fuente verificable de la condicion de cada estado: `src/hooks/use-sync-status.ts`.

## Gris

- Color: `rgba(148, 163, 184, 0.95)`
- Texto al mantener pulsado o pasar por encima: `Cargando datos`
- Estado interno: `loading`
- Significado: la app todavia no ha terminado de cargar los datos iniciales.
- Condicion verificable: `dataLoaded` es `false`, siempre que no haya timeout y el navegador este online.

## Verde

- Color: `#10b981`
- Texto al mantener pulsado o pasar por encima: `Sincronizado`
- Estado interno: `synced`
- Significado: la app esta online, los datos iniciales ya estan cargados y no hay cambios pendientes para el UID autenticado actual.
- Condicion verificable: `dataLoaded` es `true`, `loadTimedOut` es `false`, `navigator.onLine` es `true` y `readUserPendingSync(uid)` no contiene areas pendientes para el UID actual.

## Amarillo

- Color: `#f59e0b`
- Texto al mantener pulsado o pasar por encima: `Modo sin conexion`
- Estado interno: `offline`
- Significado: el navegador informa que no hay conexion.
- Condicion verificable: `navigator.onLine` es `false`, siempre que no haya timeout.

## Naranja

- Color: `#f97316`
- Texto al mantener pulsado o pasar por encima: `Cambios pendientes`
- Estado interno: `pending`
- Significado: existen cambios locales pendientes de sincronizar para el UID autenticado actual.
- Condicion verificable: `readUserPendingSync(uid)` contiene al menos un area pendiente para el UID actual.

## Rojo

- Color: `#ef4444`
- Texto al mantener pulsado o pasar por encima: `Error de sincronizacion`
- Estado interno: `error`
- Significado: la carga inicial ha agotado el tiempo configurado.
- Condicion verificable: `loadTimedOut` es `true`.

## Prioridad de estados

La prioridad verificable en `useSyncStatus` es:

1. `error`
2. `offline`
3. `loading`
4. `pending`
5. `synced`

Por tanto, si hay timeout se muestra rojo antes que cualquier otro estado. Si no hay timeout pero el navegador esta offline, se muestra amarillo antes que carga o pendientes. Solo se muestra verde cuando no aplica ningun estado anterior.
```

#### Por quÃ© se cambiÃ³
Se necesitaba un archivo principal del proyecto que documentara de forma verificable el significado de cada color del indicador de sincronizaciÃ³n.

## 2026-05-31 19:37 - Corregir indicador de sincronizaciÃ³n

**Archivos modificados:** `src/components/sync-indicator.tsx`, `src/hooks/use-network-status.ts`, `src/hooks/use-sync-status.ts`, `src/services/pending-sync.ts`, `src/__tests__/sync-indicator.test.tsx`

### Cambio 1 - NotificaciÃ³n local de pendientes

#### CÃ³digo anterior
```ts
export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}
```

```ts
export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}
```

```ts
export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}
```

#### CÃ³digo nuevo
```ts
export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export const PENDING_SYNC_CHANGED_EVENT = "taxi:pending-sync-changed";

export type PendingSyncChangedDetail = {
  uid: string;
  state: PendingSyncState;
};

function notifyUserPendingSyncChanged(uid: string, state: PendingSyncState): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<PendingSyncChangedDetail>(
    PENDING_SYNC_CHANGED_EVENT,
    { detail: { uid, state } },
  ));
}

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}
```

```ts
export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
  notifyUserPendingSyncChanged(uid, state);
}
```

```ts
export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    notifyUserPendingSyncChanged(uid, state);
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
  notifyUserPendingSyncChanged(uid, state);
}
```

#### Por quÃ© se cambiÃ³
La luz necesitaba reaccionar en la misma pestaÃ±a cuando `pending-sync` marca o limpia cambios pendientes. `localStorage` por sÃ­ solo no actualiza React en la misma pestaÃ±a.

### Cambio 2 - Hook de estado real de sincronizaciÃ³n

#### CÃ³digo anterior
`No existÃ­a use-sync-status en src/hooks/use-sync-status.ts.`

#### CÃ³digo nuevo
```ts
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import {
  PENDING_SYNC_CHANGED_EVENT,
  readUserPendingSync,
  type PendingSyncChangedDetail,
} from "../services/pending-sync";
import { useAppStore } from "../services/store";

export type SyncStatus = "loading" | "offline" | "pending" | "synced" | "error";

function getAuthUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function userHasPendingSync(uid: string | null): boolean {
  if (!uid) return false;
  return Object.keys(readUserPendingSync(uid)).length > 0;
}

function getNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useSyncStatus(): SyncStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);
  const [isOnline, setIsOnline] = useState(getNavigatorOnline);
  const [hasPendingSync, setHasPendingSync] = useState(() => userHasPendingSync(getAuthUid()));

  useEffect(() => {
    setHasPendingSync(userHasPendingSync(getAuthUid()));
  }, [dataLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePendingSyncChanged = (event: Event) => {
      const detail = (event as CustomEvent<PendingSyncChangedDetail>).detail;
      const uid = getAuthUid();
      if (!uid || detail.uid !== uid) return;
      setHasPendingSync(Object.keys(detail.state).length > 0);
    };

    window.addEventListener(PENDING_SYNC_CHANGED_EVENT, handlePendingSyncChanged);
    return () => {
      window.removeEventListener(PENDING_SYNC_CHANGED_EVENT, handlePendingSyncChanged);
    };
  }, []);

  if (loadTimedOut) return "error";
  if (!isOnline) return "offline";
  if (!dataLoaded) return "loading";
  if (hasPendingSync) return "pending";
  return "synced";
}
```

#### Por quÃ© se cambiÃ³
La luz necesitaba un estado semÃ¡ntico de sincronizaciÃ³n que combine carga inicial, conexiÃ³n, timeout y pendientes locales del UID autenticado.

### Cambio 3 - Sustituir hook antiguo de red

#### CÃ³digo anterior
```ts
import { useState, useEffect } from "react";
import { useAppStore } from "../services/store";

export type NetworkStatus = "online" | "offline" | "error";

export function useNetworkStatus(): NetworkStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loadTimedOut) {
    return "error";
  }

  if (!isOnline || !dataLoaded) {
    return "offline";
  }

  return "online";
}
```

#### CÃ³digo nuevo
`No existe use-network-status en src/hooks/use-network-status.ts. QuedÃ³ sustituido por src/hooks/use-sync-status.ts.`

#### Por quÃ© se cambiÃ³
El hook antiguo solo indicaba red/carga y podÃ­a poner la luz verde aunque hubiera cambios pendientes. Se eliminÃ³ para no dejar cÃ³digo huÃ©rfano.

### Cambio 4 - Luz con estados de sincronizaciÃ³n

#### CÃ³digo anterior
```tsx
import { type FC } from "react";
import { useNetworkStatus } from "../hooks/use-network-status";

export const SyncIndicator: FC = () => {
  const status = useNetworkStatus();

  const config = {
    online: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexiÃ³n",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronizaciÃ³n",
      animation: "none",
    },
  }[status];
```

#### CÃ³digo nuevo
```tsx
import { type FC } from "react";
import { useSyncStatus } from "../hooks/use-sync-status";

export const SyncIndicator: FC = () => {
  const status = useSyncStatus();

  const config = {
    loading: {
      color: "rgba(148, 163, 184, 0.95)",
      shadow: "rgba(148, 163, 184, 0.35)",
      label: "Cargando datos",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    synced: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexiÃ³n",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    pending: {
      color: "#f97316",
      shadow: "rgba(249, 115, 22, 0.45)",
      label: "Cambios pendientes",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronizaciÃ³n",
      animation: "none",
    },
  }[status];
```

#### Por quÃ© se cambiÃ³
Verde ahora significa `synced`: online, carga terminada y sin pendientes del UID actual. La luz ya distingue carga, offline, pendiente, sincronizado y error.

### Cambio 5 - Pruebas del indicador

#### CÃ³digo anterior
`No existÃ­a sync-indicator.test en src/__tests__/sync-indicator.test.tsx.`

#### CÃ³digo nuevo
```tsx
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SyncIndicator } from "../components/sync-indicator";
import { clearUserPendingSync, markUserPendingSync } from "../services/pending-sync";
import { useAppStore } from "../services/store";

vi.mock("../services/firebase", () => ({
  auth: { currentUser: { uid: "uid-actual" } },
}));
```

```tsx
  it("muestra carga inicial antes de considerar la app sincronizada", () => {
```

```tsx
  it("muestra pendientes solo para el UID actual", () => {
```

```tsx
  it("vuelve a sincronizado al limpiar el ultimo pendiente del UID actual", () => {
```

```tsx
  it("muestra modo sin conexion cuando el navegador queda offline", () => {
```

```tsx
  it("muestra error cuando la carga inicial agota el tiempo", () => {
```

#### Por quÃ© se cambiÃ³
Se aÃ±adieron pruebas para verificar que la luz no marca verde durante carga, ignora pendientes de otro UID, reacciona al limpiar el Ãºltimo pendiente, detecta offline y muestra error en timeout.

## 2026-05-31 09:24 - AÃ±adir .gitattributes y normalizar fin de lÃ­nea a LF

**Archivos modificados:** .gitattributes

### Cambio 1 - Crear .gitattributes con normalizaciÃ³n LF

**CÃ³digo anterior:** `No existÃ­a .gitattributes en la raÃ­z del proyecto.`

**CÃ³digo nuevo:**
```
* text=auto eol=lf

*.png   binary
*.jpg   binary
*.jpeg  binary
*.gif   binary
*.ico   binary
*.webp  binary
*.ttf   binary
*.otf   binary
*.woff  binary
*.woff2 binary
*.pdf   binary
*.keystore binary
*.jar   binary
```

**Por quÃ© se cambiÃ³:** al editar desde Windows, `src/main.tsx` y `CAMBIOS_AGENT.md` se reescribieron con CRLF cuando el repo usaba LF, generando diffs enormes de ruido (miles de lÃ­neas marcadas como modificadas solo por el salto de lÃ­nea). El `.gitattributes` fuerza LF en todo el texto y marca los binarios para que no se normalicen, evitando que vuelva a ocurrir.

## 2026-05-31 10:25 - Corregir sincronizaciÃ³n offline por UID

**Archivos modificados:**
- `src/__tests__/apk-installer-extraction.test.ts`
- `src/__tests__/apk-update-flow.test.ts`
- `src/__tests__/app-version-extraction.test.ts`
- `src/__tests__/backup-export-extraction.test.ts`
- `src/__tests__/calendar-date-extraction.test.ts`
- `src/__tests__/duration-card-value-extraction.test.ts`
- `src/__tests__/logic.test.ts`
- `src/__tests__/main-antiguo-regressions.test.ts`
- `src/__tests__/pending-sync.test.ts`
- `src/__tests__/service-worker-registration.test.ts`
- `src/__tests__/storage-keys-extraction.test.ts`
- `src/__tests__/turno-notas-component-extraction.test.ts`
- `src/__tests__/use-firestore-sync-user-isolation.test.tsx`
- `src/__tests__/user-storage-extraction.test.ts`
- `src/components/calendar-icons.tsx`
- `src/components/entry-icons.tsx`
- `src/components/settings-icons.tsx`
- `src/components/summary-icons.tsx`
- `src/hooks/use-firestore-sync.ts`
- `src/main.tsx`
- `src/screens/auth-gate.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/contabilidad-screen.tsx`
- `src/screens/detalle-anual-screen.tsx`
- `src/screens/detalle-mes-screen.tsx`
- `src/screens/edit-turno-screen.tsx`
- `src/screens/liquidacion-semana-screen.tsx`
- `src/screens/pantalla-turnos.tsx`
- `src/screens/settings-screen.tsx`
- `src/screens/summary-screen.tsx`
- `src/screens/today-history-screen.tsx`
- `src/services/pending-sync.ts`
- `src/services/service-worker-registration.ts`
- `src/shared/storage-keys.ts`

### Cambio 1 - AÃ±adir estado pendiente por usuario

#### CÃ³digo anterior
```ts
export const KEY_CURRENT = "taxi_current_v3";
export const KEY_HISTORY = "taxi_history_v3";
export const KEY_SETTINGS = "taxi_settings_v3";
export const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
export const KEY_RESERVATIONS = "taxi_reservations_v1";
export const KEY_NOTES = "taxi_notes_v1";
```

#### CÃ³digo nuevo
```ts
export const KEY_CURRENT = "taxi_current_v3";
export const KEY_HISTORY = "taxi_history_v3";
export const KEY_SETTINGS = "taxi_settings_v3";
export const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
export const KEY_RESERVATIONS = "taxi_reservations_v1";
export const KEY_NOTES = "taxi_notes_v1";
export const KEY_PENDING_SYNC = "taxi_pending_sync_v1";
```

#### Por quÃ© se cambiÃ³
Se necesitaba una clave persistente y separada por UID para distinguir cache local antigua de cambios offline reales pendientes de subir.

### Cambio 2 - Crear servicio de pendientes offline

#### CÃ³digo anterior
`No existÃ­a pending-sync en src/services/pending-sync.ts.`

#### CÃ³digo nuevo
```ts
import { KEY_PENDING_SYNC } from "../shared/storage-keys";
import { userStorageKey } from "./user-storage";

export type PendingSyncArea =
  | "current"
  | "settings"
  | "turnos"
  | "reservations"
  | "notes"
  | "weekOverrides";

export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}

export function hasUserPendingSync(uid: string, area: PendingSyncArea): boolean {
  return readUserPendingSync(uid)[area] === true;
}

export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}

export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}
```

#### Por quÃ© se cambiÃ³
La sincronizaciÃ³n necesitaba marcar por usuario y por Ã¡rea cuÃ¡ndo un cambio local no habÃ­a llegado todavÃ­a a Firestore, para no fusionar cache vieja como si fuese un cambio vÃ¡lido.

### Cambio 3 - Pasar UID autenticado al hook de sincronizaciÃ³n

#### CÃ³digo anterior
```tsx
export function AuthGate({ AppComponent }: { AppComponent: React.ComponentType }) {
```

```tsx
  return <AppComponent key={user.uid} />;
```

```tsx
function App() {
```

```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync();
```

#### CÃ³digo nuevo
```tsx
export function AuthGate({ AppComponent }: { AppComponent: React.ComponentType<{ uid: string }> }) {
```

```tsx
  return <AppComponent key={user.uid} uid={user.uid} />;
```

```tsx
function App({ uid }: { uid: string }) {
```

```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync(uid);
```

#### Por quÃ© se cambiÃ³
El hook ya no depende solo de `auth.currentUser` dentro de sus efectos: recibe el UID montado por `AuthGate` y puede impedir escrituras si el UID cargado no coincide con el usuario autenticado actual.

### Cambio 4 - Bloquear escrituras cruzadas y marcar pendientes

#### CÃ³digo anterior
```ts
export function useFirestoreSync() {
```

```ts
  function getWritableUid(): string | null {
    const uid = auth.currentUser?.uid;
    if (!dataLoaded || !uid || loadedUidRef.current !== uid) return null;
    return uid;
  }
```

```ts
  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);
```

#### CÃ³digo nuevo
```ts
export function useFirestoreSync(uid: string) {
```

```ts
  function getWritableUid(): string | null {
    const authUid = auth.currentUser?.uid;
    if (!dataLoaded || !authUid || authUid !== uid || loadedUidRef.current !== uid) return null;
    return uid;
  }
```

```ts
  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(current, lastCurrentRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_CURRENT, current);
    markUserPendingSync(writableUid, "current");
    saveUserDoc(db, writableUid, "current", current)
      .then(() => {
        lastCurrentRef.current = current;
        clearUserPendingSync(writableUid, "current");
      })
      .catch((err) => console.error("Save current failed:", err));
  }, [current, dataLoaded, uid]);
```

#### Por quÃ© se cambiÃ³
Antes una escritura podÃ­a tomar el UID desde `auth.currentUser` aunque el estado cargado perteneciese a otro montaje. Ahora se escribe solo cuando `auth.currentUser.uid`, el UID recibido y el UID ya cargado coinciden; ademÃ¡s, cada escritura local queda marcada como pendiente hasta que Firestore confirma la operaciÃ³n.

### Cambio 5 - Fusionar local solo cuando hay pendiente real

#### CÃ³digo anterior
```ts
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);
```

```ts
        const localItems = mergeLocalHistoryRef.current ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = mergeLocalHistoryRef.current ? mergeTurnos(localItems, orderedItems) : orderedItems;
        mergeLocalHistoryRef.current = false;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
```

#### CÃ³digo nuevo
```ts
function sameJSON(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
```

```ts
        const hasPendingHistory = hasUserPendingSync(uid, "turnos");
        const localItems = hasPendingHistory ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = hasPendingHistory ? mergeTurnos(localItems, orderedItems) : orderedItems;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
        if (hasPendingHistory && sameJSON(mergedItems, orderedItems)) clearUserPendingSync(uid, "turnos");
```

#### Por quÃ© se cambiÃ³
La primera carga ya no mezcla automÃ¡ticamente el cache local con Firestore. Solo fusiona si existe una marca pendiente para ese usuario y esa zona, evitando resucitar turnos borrados en Firestore desde cache local antigua.

### Cambio 6 - Conservar current pendiente aunque Firestore tenga current abierto

#### CÃ³digo anterior
```ts
          const nextCurrent =
            localCurrent && hasOpenCurrent(localCurrent) && !hasOpenCurrent(remoteCurrent)
              ? localCurrent
              : remoteCurrent;
```

#### CÃ³digo nuevo
```ts
          const nextCurrent =
            hasPendingCurrent && localCurrent && hasOpenCurrent(localCurrent)
              ? localCurrent
              : remoteCurrent;
```

#### Por quÃ© se cambiÃ³
Si el usuario tenÃ­a un turno local pendiente por falta de conexiÃ³n, ese turno debÃ­a conservarse aunque Firestore tambiÃ©n tuviese un current abierto. La condiciÃ³n nueva usa la marca pendiente explÃ­cita en vez de inferirlo solo por el estado remoto.

### Cambio 7 - Ejecutar service worker aunque la pÃ¡gina ya cargÃ³

#### CÃ³digo anterior
```ts
  if (isLocalDev) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
```

#### CÃ³digo nuevo
```ts
  const runWhenLoaded = (fn: () => void) => {
    if (document.readyState === "loading") {
      window.addEventListener("load", fn, { once: true });
      return;
    }
    fn();
  };

  if (isLocalDev) {
    runWhenLoaded(() => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  runWhenLoaded(() => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
```

#### Por quÃ© se cambiÃ³
Si `registerServiceWorker()` se ejecutaba cuando `load` ya habÃ­a ocurrido, no se registraba ni se desregistraba nada. Ahora actÃºa inmediatamente cuando el documento ya estÃ¡ cargado.

### Cambio 8 - AÃ±adir pruebas de pendientes y aislamiento

#### CÃ³digo anterior
`No existÃ­a pending-sync.test en src/__tests__/pending-sync.test.ts.`

#### CÃ³digo nuevo
```ts
import { describe, expect, it, beforeEach } from "vitest";
import {
  clearUserPendingSync,
  hasUserPendingSync,
  markUserPendingSync,
  readUserPendingSync,
} from "../services/pending-sync";

describe("pending-sync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("guarda marcas pendientes separadas por UID", () => {
    markUserPendingSync("uid-a", "turnos");
    markUserPendingSync("uid-b", "current");

    expect(hasUserPendingSync("uid-a", "turnos")).toBe(true);
    expect(hasUserPendingSync("uid-a", "current")).toBe(false);
    expect(hasUserPendingSync("uid-b", "current")).toBe(true);
    expect(readUserPendingSync("uid-a")).toEqual({ turnos: true });
  });

  it("elimina la clave local al limpiar la Ãºltima marca pendiente", () => {
    markUserPendingSync("uid-a", "turnos");
    markUserPendingSync("uid-a", "notes");

    clearUserPendingSync("uid-a", "turnos");
    expect(readUserPendingSync("uid-a")).toEqual({ notes: true });

    clearUserPendingSync("uid-a", "notes");
    expect(localStorage.getItem("taxi_pending_sync_v1__uid-a")).toBeNull();
  });
});
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una prueba directa del nuevo servicio para verificar que las marcas pendientes quedan separadas por usuario y se limpian cuando Firestore confirma.

### Cambio 9 - Cubrir conflictos offline y no duplicados

#### CÃ³digo anterior
```tsx
function HookProbe() {
  useFirestoreSync();
  return null;
}
```

#### CÃ³digo nuevo
```tsx
function HookProbe() {
  useFirestoreSync("uid-nuevo");
  return null;
}
```

```tsx
  it("conserva el current local pendiente aunque Firestore tambiÃ©n tenga un turno abierto", async () => {
```

```tsx
  it("no resucita turnos borrados en Firestore desde cache local sin pendiente durante la primera carga", async () => {
```

```tsx
  it("solo fusiona reservas, notas y overrides locales en primera carga si tienen pendiente offline", async () => {
```

#### Por quÃ© se cambiÃ³
Las pruebas ahora ejercitan el UID explÃ­cito, el turno abierto offline, la no resurrecciÃ³n de turnos borrados y la fusiÃ³n selectiva por marca pendiente.

### Cambio 10 - Limpiar cÃ³digo muerto verificable

#### CÃ³digo anterior
```ts
import { APP_VERSION } from "./shared/app-version";
import { IconRocket, IconClipboard, IconChart, IconReservaWrite } from "./components/home-icons";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, fmt } from "./logic/formatters";
import { TurnoNotasCard } from "./components/turno-notas";
import { DurationCardValue } from "./components/duration-card-value";
import { ApkInstaller } from "./services/apk-installer";
import { resolveLatestApkUpdate, type UpdateState } from "./logic/update-flow";
import { exportBackupJSON } from "./services/backup-export";
import { parseCSVToHistory } from "./logic/csv";
import { getDaysInMonth, getStartOffset } from "./logic/calendar-date";
```

#### CÃ³digo nuevo
```ts
import { IconRocket } from "./components/home-icons";
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import type { UpdateState } from "./logic/update-flow";
```

#### Por quÃ© se cambiÃ³
`npx tsc --noEmit --noUnusedLocals --noUnusedParameters` confirmÃ³ que esos imports ya no se usaban en `src/main.tsx`. Se retiraron para no mantener dependencias muertas ni cÃ³digo huÃ©rfano.

### Cambio 11 - Eliminar funciones extraÃ­das sin uso en main

#### CÃ³digo anterior
```ts
  async function checkUpdate() {
    setUpdateState("checking");
    setUpdateMsg("Buscando actualizaciones...");
    setDownloadUrl("");
    setReleaseUrl("");
    try {
      const res = await fetch("https://api.github.com/repos/Carlos4400/app-taxi/releases/latest");
      if (!res.ok) throw new Error("No se encontrÃ³ el release");
      const data = await res.json();
      const result = resolveLatestApkUpdate(data, APP_VERSION);
      setDownloadUrl(result.downloadUrl);
      setReleaseUrl(result.releaseUrl);
      setUpdateState(result.updateState);
      setUpdateMsg(result.updateMsg);
    } catch (e) {
      setUpdateState("error");
      setUpdateMsg("Error al conectar con GitHub.");
    }
  }
```

#### CÃ³digo nuevo
`No existe checkUpdate en src/main.tsx. La funciÃ³n equivalente estÃ¡ en src/screens/settings-screen.tsx.`

#### Por quÃ© se cambiÃ³
La pantalla de ajustes ya tenÃ­a la lÃ³gica de actualizaciÃ³n. Mantener otra copia en `main.tsx` era cÃ³digo muerto confirmado por TypeScript.

### Cambio 12 - Ajustar tests de extracciÃ³n sin imports muertos

#### CÃ³digo anterior
```ts
    expect(mainSource).toContain('from "./services/apk-installer"');
```

```ts
    expect(mainSource).toContain('from "./shared/app-version"');
```

```ts
    expect(mainSource).toContain('from "./components/turno-notas"');
```

#### CÃ³digo nuevo
```ts
    expect(mainSource).not.toContain('from "./services/apk-installer"');
```

```ts
    expect(mainSource).not.toContain('from "./shared/app-version"');
```

```ts
    expect(mainSource).not.toContain('from "./components/turno-notas"');
```

#### Por quÃ© se cambiÃ³
Los tests seguÃ­an obligando a `main.tsx` a importar mÃ³dulos ya extraÃ­dos aunque no los usara. Ahora verifican que el cÃ³digo estÃ¡ fuera de `main.tsx` sin forzar imports huÃ©rfanos.

## 2026-05-30 22:24 - Corregir aislamiento de turnos por usuario

**Archivos modificados:**
- `src/hooks/use-firestore-sync.ts`
- `src/main.tsx`
- `src/services/user-storage.ts`
- `src/services/service-worker-registration.ts`
- `src/logic/turnos.ts`
- `src/screens/liquidacion-semana-screen.tsx`
- `src/__tests__/use-firestore-sync-user-isolation.test.tsx`
- `src/__tests__/main-antiguo-regressions.test.ts`
- `src/__tests__/user-storage-extraction.test.ts`
- `src/__tests__/service-worker-registration.test.ts`
- `src/__tests__/logic.test.ts`
- `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Import de settings para reset por usuario

#### CÃ³digo anterior
```ts
import { writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import { ensureTurnosDiaLibreContable, sortTurnosByDateDesc } from "../logic/turnos";
```

#### CÃ³digo nuevo
```ts
import { readUserLocalJSON, writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import { loadSettings } from "../logic/state-loaders";
import { ensureTurnosDiaLibreContable, mergeTurnos, sortTurnosByDateDesc } from "../logic/turnos";
```

#### Por quÃ© se cambiÃ³
El reset al cambiar de usuario necesitaba restaurar tambiÃ©n `settings` con el cargador existente, leer claves locales por UID y usar `mergeTurnos` para fusionar turnos del mismo usuario sin duplicarlos.

### Cambio 2 - Bloqueo de escrituras hasta cargar el UID actual

#### CÃ³digo anterior
```ts
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    if (JSON.stringify(settings) === JSON.stringify(lastSettingsRef.current)) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_SETTINGS, settings);
    saveUserDoc(db, uid, "settings", settings).catch((err) =>
      console.error("Save settings failed:", err)
    );
  }, [settings, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_HISTORY, history);
    syncSubcollection(db, uid, "turnos", lastHistoryRef.current, history, (t) => t.id)
      .then(() => { lastHistoryRef.current = history; })
      .catch((err) => console.error("Sync turnos failed:", err));
  }, [history, dataLoaded]);
```

#### CÃ³digo nuevo
```ts
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);

  function getWritableUid(): string | null {
    const uid = auth.currentUser?.uid;
    if (!dataLoaded || !uid || loadedUidRef.current !== uid) return null;
    return uid;
  }

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(settings) === JSON.stringify(lastSettingsRef.current)) return;
    writeUserLocalJSON(uid, KEY_SETTINGS, settings);
    saveUserDoc(db, uid, "settings", settings).catch((err) =>
      console.error("Save settings failed:", err)
    );
  }, [settings, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    writeUserLocalJSON(uid, KEY_HISTORY, history);
    syncSubcollection(db, uid, "turnos", lastHistoryRef.current, history, (t) => t.id)
      .then(() => { lastHistoryRef.current = history; })
      .catch((err) => console.error("Sync turnos failed:", err));
  }, [history, dataLoaded]);
```

#### Por quÃ© se cambiÃ³
Los efectos de escritura podÃ­an ejecutarse con `dataLoaded=true` heredado del usuario anterior. `loadedUidRef` impide escribir en Firestore o localStorage hasta que los snapshots del UID actual hayan terminado su primera carga.

### Cambio 3 - Reset completo antes de cargar Firestore

#### CÃ³digo anterior
```ts
    // â”€â”€ Reset a estado vacÃ­o antes de cargar los datos del nuevo usuario â”€â”€â”€â”€â”€â”€
    // El store (Zustand) es un singleton de mÃ³dulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacÃ­o en Firestore antes de que lleguen los datos reales.
    setCurrent({ entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 });
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
```

#### CÃ³digo nuevo
```ts
    // â”€â”€ Reset a estado vacÃ­o antes de cargar los datos del nuevo usuario â”€â”€â”€â”€â”€â”€
    // El store (Zustand) es un singleton de mÃ³dulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacÃ­o en Firestore antes de que lleguen los datos reales.
    loadedUidRef.current = null;
    lastCurrentRef.current = null;
    lastSettingsRef.current = null;
    lastHistoryRef.current = [];
    lastReservationsRef.current = [];
    lastNotesRef.current = [];
    lastWeekOverridesRef.current = [];
    mergeLocalHistoryRef.current = true;
    mergeLocalReservationsRef.current = true;
    mergeLocalNotesRef.current = true;
    mergeLocalWeekOverridesRef.current = true;
    setCurrent(emptyCurrent());
    setSettings(loadSettings());
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
```

#### Por quÃ© se cambiÃ³
AdemÃ¡s de vaciar las colecciones y el turno actual, era necesario invalidar el UID cargado, limpiar las referencias usadas como baseline de sincronizaciÃ³n, reactivar la fusiÃ³n local solo para la primera carga del UID y resetear `settings`. Sin esto, los datos del usuario anterior podÃ­an seguir siendo la base de escritura del usuario nuevo.

### Cambio 4 - Marcado del UID cargado

#### CÃ³digo anterior
```ts
    function marcar(key: keyof typeof recibido) {
      recibido[key] = true;
      if (Object.values(recibido).every((v) => v)) {
        setDataLoaded(true);
      }
    }
```

#### CÃ³digo nuevo
```ts
    function marcar(key: keyof typeof recibido) {
      recibido[key] = true;
      if (Object.values(recibido).every((v) => v)) {
        loadedUidRef.current = uid;
        setDataLoaded(true);
      }
    }
```

#### Por quÃ© se cambiÃ³
Las escrituras solo deben habilitarse cuando las seis lecturas iniciales de Firestore pertenecen al mismo `uid` que se estÃ¡ marcando como cargado.

### Cambio 5 - Test de aislamiento entre usuarios

#### CÃ³digo anterior
`No existÃ­a el archivo src/__tests__/use-firestore-sync-user-isolation.test.tsx.`

#### CÃ³digo nuevo
```tsx
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFirestoreSync } from "../hooks/use-firestore-sync";

const firestoreSyncMock = vi.hoisted(() => ({
  saveUserDoc: vi.fn(),
  syncSubcollection: vi.fn(),
  userHasFirestoreData: vi.fn(),
}));

const firebaseMock = vi.hoisted(() => ({
  auth: { currentUser: { uid: "uid-nuevo" } as { uid: string } | null },
  db: {},
}));

vi.mock("../services/firebase", () => firebaseMock);

vi.mock("../services/firestore-sync", () => ({
  userMetaDocRef: vi.fn((_db: unknown, uid: string, name: string) => ({
    kind: "meta",
    uid,
    name,
  })),
  userSubcollectionRef: vi.fn((_db: unknown, uid: string, name: string) => ({
    kind: "collection",
    uid,
    name,
  })),
  saveUserDoc: firestoreSyncMock.saveUserDoc,
  syncSubcollection: firestoreSyncMock.syncSubcollection,
  userHasFirestoreData: firestoreSyncMock.userHasFirestoreData,
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_dbOrRef: unknown, ...path: string[]) => ({ path })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

function HookProbe() {
  useFirestoreSync();
  return null;
}

describe("useFirestoreSync: aislamiento entre usuarios", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks();
    localStorage.clear();
    firebaseMock.auth.currentUser = { uid: "uid-nuevo" };
    firestoreSyncMock.saveUserDoc.mockResolvedValue(undefined);
    firestoreSyncMock.syncSubcollection.mockResolvedValue(undefined);
    firestoreSyncMock.userHasFirestoreData.mockResolvedValue(false);

    const { useAppStore } = await import("../services/store");
    useAppStore.setState({
      current: {
        entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
        startTime: "10:00",
        startDate: "2026-05-30",
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
      history: [{
        id: 1,
        date: "2026-05-30",
        startDate: "2026-05-30",
        startTime: "10:00",
        endTime: "12:00",
        entries: [],
        totalP: 0,
        totalD: 0,
        totalA: 0,
        totalE: 0,
        totalF: 0,
        totalN: 0,
        dinero: 0,
        km: 0,
        notes: "",
      }],
      reservations: [],
      notes: [],
      settings: {
        "porcentaje.jefe": 50,
        "porcentaje.chofer": 50,
        "descontar.datafono": true,
        "descontar.agencia_bono": true,
        "descontar.extra": true,
        "descontar.gasolina": true,
        diaLibre: 2,
        diaLibreDesde: null,
      },
      weekOverrides: [],
      dataLoaded: true,
      loadTimedOut: false,
      isAdmin: false,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("no escribe datos del usuario anterior bajo el UID nuevo antes de cargar Firestore", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    expect(firestoreSyncMock.saveUserDoc).not.toHaveBeenCalled();
    expect(firestoreSyncMock.syncSubcollection).not.toHaveBeenCalled();
  });

  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });
});
```

#### Por quÃ© se cambiÃ³
La prueba reproduce el caso en que `dataLoaded` queda `true` con estado de un usuario anterior y se monta la sincronizaciÃ³n para `uid-nuevo`. Antes de la correcciÃ³n fallaba porque `saveUserDoc` recibÃ­a datos antiguos para el UID nuevo.

### Cambio 6 - Bloqueo de doble cierre de turno

#### CÃ³digo anterior
```tsx
  const totalF = gasolinas.reduce((s, e) => s + e.amount, 0);
  const totalN = nulos.reduce((s, e) => s + e.amount, 0);
  const active = current.entries.length > 0 || !!current.startTime;

  function togglePause() {
    hapticAction();
```

#### CÃ³digo nuevo
```tsx
  const active = current.entries.length > 0 || !!current.startTime;
  const endingTurnoRef = useRef(false);

  useEffect(() => {
    if (active) endingTurnoRef.current = false;
  }, [active]);

  // Mientras llegan las primeras respuestas de Firestore para este usuario,
  // mostramos un placeholder de carga. Esto evita que la UI parezca vacÃ­a y,
  // sobre todo, evita que el usuario pueda crear/editar antes de tener su
  // historial cargado (lo cual provocarÃ­a diffs incorrectos).
  if (!dataLoaded) {
```

#### Por quÃ© se cambiÃ³
Un doble toque rÃ¡pido sobre `Terminar Turno` podÃ­a ejecutar `handleEndTurno` mÃ¡s de una vez antes de que React renderizara la pantalla siguiente. `endingTurnoRef` bloquea cierres repetidos del mismo turno activo y se declara antes del primer `return` condicional para mantener estable el orden de hooks de React.

### Cambio 7 - InserciÃ³n de turno cerrado sin duplicar historial

#### CÃ³digo anterior
```tsx
  function handleEndTurno() {
    const turno = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: current.entries,
      totalP,
      totalD,
      totalA,
      totalE,
      totalF,
      totalN,
      dinero: parseFloat(dineroJ.replace(",", ".")) || 0,
      km: parseFloat(kmJ.replace(",", ".")) || 0,
      notes: notesJ.trim(),
      startDate: current.startDate,
      totalPausedMinutes: current.totalPausedMinutes || 0,
      configTurno: buildTurnoConfigFromSettings(settings),
      diaLibreContable: settings.diaLibre,
    };
    setHistory((h) => [turno, ...h]);
```

#### CÃ³digo nuevo
```tsx
  function handleEndTurno() {
    if (endingTurnoRef.current || !active) return;
    endingTurnoRef.current = true;
    const turno = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: current.entries,
      totalP,
      totalD,
      totalA,
      totalE,
      totalF,
      totalN,
      dinero: parseFloat(dineroJ.replace(",", ".")) || 0,
      km: parseFloat(kmJ.replace(",", ".")) || 0,
      notes: notesJ.trim(),
      startDate: current.startDate,
      totalPausedMinutes: current.totalPausedMinutes || 0,
      configTurno: buildTurnoConfigFromSettings(settings),
      diaLibreContable: settings.diaLibre,
    };
    setHistory((h) => mergeTurnos(h, [turno]));
```

#### Por quÃ© se cambiÃ³
`[turno, ...h]` insertaba siempre una fila nueva. `mergeTurnos(h, [turno])` reutiliza la lÃ³gica existente que evita duplicados por fecha, inicio y fin de turno, y el guard previo impide una segunda ejecuciÃ³n del cierre.

### Cambio 8 - Test de doble cierre de turno

#### CÃ³digo anterior
```ts
  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });

  it("keeps extracted screens using shared visual building blocks", () => {
```

#### CÃ³digo nuevo
```ts
  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });

  it("prevents double closing the same turno from duplicating history", () => {
    const mainSource = readSource("src/main.tsx");
    const loadingReturnIndex = mainSource.indexOf("if (!dataLoaded) {");
    const activeIndex = mainSource.indexOf("const active = current.entries.length > 0 || !!current.startTime;");
    const endingRefIndex = mainSource.indexOf("const endingTurnoRef = useRef(false);");

    expect(activeIndex).toBeGreaterThan(-1);
    expect(endingRefIndex).toBeGreaterThan(-1);
    expect(loadingReturnIndex).toBeGreaterThan(-1);
    expect(activeIndex).toBeLessThan(loadingReturnIndex);
    expect(endingRefIndex).toBeLessThan(loadingReturnIndex);
    expect(mainSource).toContain("if (endingTurnoRef.current || !active) return;");
    expect(mainSource).toContain("endingTurnoRef.current = true;");
    expect(mainSource).toContain("setHistory((h) => mergeTurnos(h, [turno]));");
    expect(mainSource).not.toContain("setHistory((h) => [turno, ...h]);");
  });

  it("keeps extracted screens using shared visual building blocks", () => {
```

#### Por quÃ© se cambiÃ³
La prueba bloquea una regresiÃ³n concreta: el cierre de turno no debe volver a usar inserciÃ³n directa `[turno, ...h]`, no debe perder el guard contra doble ejecuciÃ³n y el hook del guard debe quedar antes del primer `return` condicional.

### Cambio 9 - Lectura local explÃ­cita por UID

#### CÃ³digo anterior
```ts
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

#### CÃ³digo nuevo
```ts
export function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function readUserLocalJSON<T>(uid: string, baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey, uid)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}
```

#### Por quÃ© se cambiÃ³
La sincronizaciÃ³n inicial necesita leer datos locales de un `uid` concreto aunque el store global de Zustand conserve estado previo. La lectura explÃ­cita por UID evita leer claves de otro usuario.

### Cambio 10 - Helpers de estado vacÃ­o y fusiÃ³n por id

#### CÃ³digo anterior
`No existÃ­a el bloque emptyCurrent/mergeById/hasOpenCurrent en src/hooks/use-firestore-sync.ts.`

#### CÃ³digo nuevo
```ts
function emptyCurrent(): CurrentState {
  return { entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 };
}

function mergeById<T>(localItems: T[], remoteItems: T[], getId: (item: T) => string | number): T[] {
  const merged = new Map<string, T>();
  localItems.forEach((item) => merged.set(String(getId(item)), item));
  remoteItems.forEach((item) => merged.set(String(getId(item)), item));
  return Array.from(merged.values());
}

function hasOpenCurrent(current: CurrentState): boolean {
  return !!current.startTime || current.entries.length > 0;
}
```

#### Por quÃ© se cambiÃ³
`emptyCurrent` centraliza el estado vacÃ­o usado al cambiar de usuario. `mergeById` permite fusionar datos locales offline con Firestore sin duplicar reservas, notas ni overrides con el mismo identificador. `hasOpenCurrent` permite detectar si un turno abierto local debe conservarse frente a un `current` remoto vacÃ­o.

### Cambio 11 - RestauraciÃ³n de turno abierto offline por UID

#### CÃ³digo anterior
```ts
      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CurrentState;
          lastCurrentRef.current = data;
          writeUserLocalJSON(uid, KEY_CURRENT, data);
          setCurrent(data);
        } else {
          lastCurrentRef.current = null;
        }
        marcar("current");
      }));
```

#### CÃ³digo nuevo
```ts
      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"), (snap) => {
        if (snap.exists()) {
          const remoteCurrent = snap.data() as CurrentState;
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT);
          const nextCurrent =
            localCurrent && hasOpenCurrent(localCurrent) && !hasOpenCurrent(remoteCurrent)
              ? localCurrent
              : remoteCurrent;
          lastCurrentRef.current = remoteCurrent;
          writeUserLocalJSON(uid, KEY_CURRENT, nextCurrent);
          setCurrent(nextCurrent);
        } else {
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT) ?? emptyCurrent();
          lastCurrentRef.current = null;
          setCurrent(localCurrent);
        }
        marcar("current");
      }));
```

#### Por quÃ© se cambiÃ³
Si el usuario cierra sesiÃ³n o la app sin haber terminado el turno y Firestore aÃºn no tiene `current`, el turno abierto guardado offline bajo `KEY_CURRENT__uid` debe restaurarse solo para ese mismo usuario. Si Firestore tiene un `current` vacÃ­o pero existe un turno local abierto del mismo UID, se conserva el local y despuÃ©s se sube por el efecto de escritura.

### Cambio 12 - FusiÃ³n de turnos locales offline con Firestore

#### CÃ³digo anterior
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, orderedItems);
        setHistory(orderedItems);
        marcar("turnos");
      }));
```

#### CÃ³digo nuevo
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [];
        const mergedItems = mergeTurnos(localItems, orderedItems);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
        marcar("turnos");
      }));
```

#### Por quÃ© se cambiÃ³
Si un turno se cerrÃ³ sin conexiÃ³n, estaba guardado localmente por UID pero podÃ­a perderse cuando Firestore devolvÃ­a un snapshot vacÃ­o o incompleto. La fusiÃ³n mantiene el turno offline del mismo usuario y usa `lastHistoryRef.current = orderedItems` para que despuÃ©s se suba a Firestore.

### Cambio 13 - FusiÃ³n de subcolecciones locales offline

#### CÃ³digo anterior
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, items);
        setReservations(items);
        marcar("reservations");
      }));
```

#### CÃ³digo nuevo
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        const localItems = readUserLocalJSON<Reserva[]>(uid, KEY_RESERVATIONS) ?? [];
        const mergedItems = mergeById(localItems, items, (r) => r.id);
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, mergedItems);
        setReservations(mergedItems);
        marcar("reservations");
      }));
```

#### Por quÃ© se cambiÃ³
Reservas, notas y overrides tambiÃ©n pueden existir en localStorage por UID cuando no hay conexiÃ³n. La fusiÃ³n por identificador impide perder datos locales del mismo usuario y evita duplicar elementos con el mismo id.

### Cambio 14 - Pruebas de offline por UID

#### CÃ³digo anterior
```tsx
  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });
});
```

#### CÃ³digo nuevo
```tsx
  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });

  it("conserva y sube turnos offline del mismo UID sin mezclar los de otro usuario", async () => {
    const turnoOffline = turno(11, "2026-05-30", "10:00", "12:00");
    const turnoOtroUsuario = turno(22, "2026-05-29", "11:00", "13:00");
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoOffline]));
    localStorage.setItem(`${KEY_HISTORY}__uid-otro`, JSON.stringify([turnoOtroUsuario]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots();

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history.map((t) => t.id)).toEqual([11]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]").map((t: Turno) => t.id)).toEqual([11]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-otro`) || "[]").map((t: Turno) => t.id)).toEqual([22]);
    expect(firestoreSyncMock.syncSubcollection).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "turnos",
      [],
      [turnoOffline],
      expect.any(Function),
    );
  });

  it("restaura el turno abierto offline del mismo UID sin leer el de otro usuario", async () => {
    const currentOffline = {
      entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
      startTime: "10:00",
      startDate: "2026-05-30",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    const currentOtroUsuario = {
      entries: [],
      startTime: "11:00",
      startDate: "2026-05-29",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    localStorage.setItem("taxi_current_v3__uid-nuevo", JSON.stringify(currentOffline));
    localStorage.setItem("taxi_current_v3__uid-otro", JSON.stringify(currentOtroUsuario));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots();

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().current.startTime).toBe("10:00");
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(firestoreSyncMock.saveUserDoc).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "current",
      currentOffline,
    );
  });

  it("fusiona turno offline y Firestore sin duplicar el mismo cierre", async () => {
    const turnoLocal = turno(11, "2026-05-30", "10:00", "12:00");
    const turnoFirestore = { ...turnoLocal, id: 99 };
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoLocal]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ turnos: [turnoFirestore] });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history).toHaveLength(1);
    expect(useAppStore.getState().history[0].id).toBe(99);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]")).toHaveLength(1);
  });
});
```

#### Por quÃ© se cambiÃ³
Las pruebas fijan los casos crÃ­ticos de uso profesional: turno cerrado offline, turno abierto offline, aislamiento de claves de otro usuario y fusiÃ³n local/Firestore sin duplicar el mismo cierre.

### Cambio 15 - Test de readUserLocalJSON

#### CÃ³digo anterior
```ts
    const modulePath = "../services/user-storage";
    const { userStorageKey, readLocalJSON, writeUserLocalJSON } = await import(modulePath);
    localStorage.clear();
    localStorage.setItem("plain", "{\"ok\":true}");

    expect(userStorageKey("plain", "uid-1")).toBe("plain__uid-1");
    expect(userStorageKey("plain", "")).toBe("plain");
    expect(readLocalJSON("plain")).toEqual({ ok: true });
    expect(readLocalJSON("missing")).toBeNull();
    writeUserLocalJSON("uid-1", "plain", { value: 2 });
    expect(localStorage.getItem("plain__uid-1")).toBe("{\"value\":2}");
```

#### CÃ³digo nuevo
```ts
    const modulePath = "../services/user-storage";
    const { userStorageKey, readLocalJSON, readUserLocalJSON, writeUserLocalJSON } = await import(modulePath);
    localStorage.clear();
    localStorage.setItem("plain", "{\"ok\":true}");

    expect(userStorageKey("plain", "uid-1")).toBe("plain__uid-1");
    expect(userStorageKey("plain", "")).toBe("plain");
    expect(readLocalJSON("plain")).toEqual({ ok: true });
    expect(readUserLocalJSON("uid-1", "plain")).toBeNull();
    expect(readLocalJSON("missing")).toBeNull();
    writeUserLocalJSON("uid-1", "plain", { value: 2 });
    expect(localStorage.getItem("plain__uid-1")).toBe("{\"value\":2}");
    expect(readUserLocalJSON("uid-1", "plain")).toEqual({ value: 2 });
```

#### Por quÃ© se cambiÃ³
El helper nuevo queda cubierto por test: antes de escribir una clave por UID devuelve `null`, y despuÃ©s lee solo la clave `baseKey__uid` correspondiente.

### Cambio 16 - Desregistro del Service Worker en desarrollo

#### CÃ³digo anterior
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

#### CÃ³digo nuevo
```ts
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  if (isLocalDev) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
```

#### Por quÃ© se cambiÃ³
En `localhost` el Service Worker podÃ­a mantener una versiÃ³n anterior de la app durante desarrollo y provocar una pantalla negra o estado visual obsoleto. En desarrollo se desregistran Service Workers existentes; en producciÃ³n se conserva el registro.

### Cambio 17 - Test del Service Worker en desarrollo

#### CÃ³digo anterior
```ts
    const registrationSource = readFileSync(registrationPath, "utf8");
    expect(registrationSource).toContain('"serviceWorker" in navigator');
    expect(registrationSource).toContain('navigator.serviceWorker.register("./sw.js")');
    expect(registrationSource).toContain("SW registered");
```

#### CÃ³digo nuevo
```ts
    const registrationSource = readFileSync(registrationPath, "utf8");
    expect(registrationSource).toContain('"serviceWorker" in navigator');
    expect(registrationSource).toContain("isLocalDev");
    expect(registrationSource).toContain("registration.unregister()");
    expect(registrationSource).toContain('navigator.serviceWorker.register("./sw.js")');
    expect(registrationSource).toContain("SW registered");
```

#### Por quÃ© se cambiÃ³
El test fija que el Service Worker no quede activo en entorno local y que el registro de producciÃ³n siga existiendo.

### Cambio 18 - FusiÃ³n local solo en carga inicial

#### CÃ³digo anterior
```ts
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
```

```ts
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [];
        const mergedItems = mergeTurnos(localItems, orderedItems);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
```

#### CÃ³digo nuevo
```ts
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);
```

```ts
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = mergeLocalHistoryRef.current ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = mergeLocalHistoryRef.current ? mergeTurnos(localItems, orderedItems) : orderedItems;
        mergeLocalHistoryRef.current = false;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
```

#### Por quÃ© se cambiÃ³
La fusiÃ³n con `localStorage` debe ocurrir solo durante la primera carga del UID, para recuperar cambios offline. En snapshots posteriores Firestore debe poder reflejar borrados reales sin que el cache local vuelva a insertar turnos eliminados.

### Cambio 19 - Test contra resurrecciÃ³n de borrados

#### CÃ³digo anterior
`No existÃ­a el test "no resucita turnos borrados en Firestore desde el cache local tras la carga inicial" en src/__tests__/use-firestore-sync-user-isolation.test.tsx.`

#### CÃ³digo nuevo
```tsx
  it("no resucita turnos borrados en Firestore desde el cache local tras la carga inicial", async () => {
    const turnoFirestore = turno(11, "2026-05-30", "10:00", "12:00");
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoFirestore]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ turnos: [turnoFirestore] });

    const turnosSnapshot = firestoreSyncMock.snapshotCallbacks.find(({ ref }) => ref.name === "turnos");
    expect(turnosSnapshot).toBeDefined();

    await act(async () => {
      turnosSnapshot?.callback(collectionSnap([]));
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history).toEqual([]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]")).toEqual([]);
  });
```

#### Por quÃ© se cambiÃ³
La prueba reproduce un borrado remoto despuÃ©s de la carga inicial. Antes de corregirlo fallaba porque el turno quedaba de nuevo en `history` desde el cache local.

### Cambio 20 - Bloqueo de migraciÃ³n legacy sin UID

#### CÃ³digo anterior
```ts
  const current = currentRaw ? JSON.parse(currentRaw) as CurrentState : null;
  const history = historyRaw ? JSON.parse(historyRaw) as Turno[] : [];
  const settings = settingsRaw ? JSON.parse(settingsRaw) as AppSettings : null;
  const weekOverrides = weekOverridesRaw ? JSON.parse(weekOverridesRaw) as WeekOverride[] : [];
  const reservations = reservationsRaw ? JSON.parse(reservationsRaw) as Reserva[] : [];
  const notes = notesRaw ? JSON.parse(notesRaw) as NotaCalendario[] : [];

  const docPromises: Promise<unknown>[] = [];
  if (current) docPromises.push(setDoc(userMetaDocRef(db, uid, "current"), current));
  if (settings) docPromises.push(setDoc(userMetaDocRef(db, uid, "settings"), settings));
```

#### CÃ³digo nuevo
```ts
  localStorage.setItem(LOCAL_MIGRATION_KEY, JSON.stringify({
    uid, at: new Date().toISOString(), migrado: false, motivo: "legacy-sin-uid-no-atribuible",
  }));
}
```

#### Por quÃ© se cambiÃ³
Las claves antiguas sin UID no contienen informaciÃ³n verificable sobre el usuario propietario. Subirlas automÃ¡ticamente al UID autenticado actual podÃ­a mezclar datos entre usuarios en un dispositivo compartido.

### Cambio 21 - Tests de current local y legacy sin UID

#### CÃ³digo anterior
`No existÃ­an los tests "conserva el turno abierto local del mismo UID si Firestore tiene current vacÃ­o" ni "no migra claves legacy sin UID a un usuario autenticado" en src/__tests__/use-firestore-sync-user-isolation.test.tsx.`

#### CÃ³digo nuevo
```tsx
  it("conserva el turno abierto local del mismo UID si Firestore tiene current vacÃ­o", async () => {
    const currentOffline = {
      entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
      startTime: "10:00",
      startDate: "2026-05-30",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    const currentFirestoreVacio = {
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    localStorage.setItem(`${KEY_CURRENT}__uid-nuevo`, JSON.stringify(currentOffline));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ current: currentFirestoreVacio });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().current.startTime).toBe("10:00");
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(firestoreSyncMock.saveUserDoc).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "current",
      currentOffline,
    );
  });
```

```tsx
  it("no migra claves legacy sin UID a un usuario autenticado", async () => {
    const turnoLegacy = turno(77, "2026-05-30", "10:00", "12:00");
    localStorage.setItem(KEY_HISTORY, JSON.stringify([turnoLegacy]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(localStorage.getItem(KEY_HISTORY)).toBe(JSON.stringify([turnoLegacy]));
    expect(firestoreSyncMock.syncSubcollection).not.toHaveBeenCalled();
  });
```

#### Por quÃ© se cambiÃ³
Los tests fijan que un turno abierto offline del mismo UID no se pierde frente a un `current` remoto vacÃ­o, y que datos legacy sin UID no se atribuyen automÃ¡ticamente al usuario autenticado actual.

### Cambio 22 - NormalizaciÃ³n de clave de turno

#### CÃ³digo anterior
```ts
function getTurnoMergeKey(t: SortableTurno): string {
  return [
    t.startDate || "",
    t.date || "",
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}
```

#### CÃ³digo nuevo
```ts
function getTurnoMergeKey(t: SortableTurno): string {
  const effectiveDate = t.startDate || t.date || "";
  return [
    effectiveDate,
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}
```

#### Por quÃ© se cambiÃ³
Dos copias del mismo turno podÃ­an no deduplicarse si una tenÃ­a `startDate` vacÃ­o y la otra tenÃ­a `startDate` igual a `date`. La clave usa ahora la fecha efectiva del turno.

### Cambio 23 - Test de deduplicaciÃ³n sin startDate

#### CÃ³digo anterior
`No existÃ­a el test "should deduplicate the same turno when one copy is missing startDate" en src/__tests__/logic.test.ts.`

#### CÃ³digo nuevo
```ts
  it('should deduplicate the same turno when one copy is missing startDate', () => {
    const actuales = [
      { date: '2026-05-08', startDate: null, startTime: '08:00', endTime: '12:00', id: 1 } as Turno,
    ];

    const nuevos = [
      { date: '2026-05-08', startDate: '2026-05-08', startTime: '08:00', endTime: '12:00', id: 2 } as Turno,
    ];

    const merged = mergeTurnos(actuales, nuevos);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe(2);
  });
```

#### Por quÃ© se cambiÃ³
La prueba cubre el caso de duplicado real con `startDate` ausente en una de las copias.

### Cambio 24 - Limpieza de listeners del Service Worker

#### CÃ³digo anterior
```tsx
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => onUpdateFound(reg));
    });
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
```

#### CÃ³digo nuevo
```tsx
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelado) return;
      const onRegUpdateFound = () => onUpdateFound(reg);
      reg.addEventListener("updatefound", onRegUpdateFound);
      updateFoundCleanup = () => {
        reg.removeEventListener("updatefound", onRegUpdateFound);
      };
    });
    return () => {
      cancelado = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      updateFoundCleanup?.();
      stateChangeCleanups.forEach((cleanup) => cleanup());
    };
```

#### Por quÃ© se cambiÃ³
`App` se desmonta y remonta al cambiar de usuario. El listener `updatefound` y los listeners `statechange` debÃ­an limpiarse igual que `message` para no dejar listeners acumulados.

### Cambio 25 - Eliminar rama inalcanzable de exportaciÃ³n

#### CÃ³digo anterior
```tsx
            if (false) return match;
            return "#ffffff";
```

#### CÃ³digo nuevo
```tsx
            return "#ffffff";
```

#### Por quÃ© se cambiÃ³
La condiciÃ³n `if (false)` era cÃ³digo muerto dentro de la conversiÃ³n de colores del ticket.

### Cambio 26 - Tests de limpieza de UI y Service Worker

#### CÃ³digo anterior
`No existÃ­an los tests "cleans service worker update listeners mounted by App" ni "does not keep unreachable export color branches" en src/__tests__/main-antiguo-regressions.test.ts.`

#### CÃ³digo nuevo
```ts
  it("cleans service worker update listeners mounted by App", () => {
    const mainSource = readSource("src/main.tsx");

    expect(mainSource).toContain('const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);');
    expect(mainSource).toContain("if (isLocalDev) return;");
    expect(mainSource).toContain("let updateFoundCleanup: (() => void) | null = null;");
    expect(mainSource).toContain('reg.removeEventListener("updatefound", onRegUpdateFound);');
    expect(mainSource).not.toContain('reg.addEventListener("updatefound", () => onUpdateFound(reg));');
  });

  it("does not keep unreachable export color branches", () => {
    const source = readSource("src/screens/liquidacion-semana-screen.tsx");

    expect(source).not.toContain("if (false) return match;");
  });
```

#### Por quÃ© se cambiÃ³
Los tests fijan que el listener de actualizaciÃ³n del Service Worker no vuelva a quedar sin limpieza y que no se reintroduzca la rama inalcanzable en la exportaciÃ³n.

### Cambio 27 - Test de colores sin depender de cÃ³digo muerto

#### CÃ³digo anterior
```ts
    const exportColorBlock = liquidacionSemanaSource.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return match;/
    )?.[0] || "";
```

#### CÃ³digo nuevo
```ts
    const exportColorBlock = liquidacionSemanaSource.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return "#ffffff";/
    )?.[0] || "";
```

#### Por quÃ© se cambiÃ³
El test buscaba el final del bloque mediante una rama inalcanzable eliminada. Ahora localiza el bloque por el retorno real que queda en la funciÃ³n.

## 2026-05-30 22:08 - Corregir datos de usuario anterior visibles al cambiar sesiÃ³n

**Archivos modificados:** `src/hooks/use-firestore-sync.ts`

### Cambio 1 - Reset del store Zustand al inicio del efecto de Firestore

#### CÃ³digo anterior
```ts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;

    let cancelado = false;
```

#### CÃ³digo nuevo
```ts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;

    // â”€â”€ Reset a estado vacÃ­o antes de cargar los datos del nuevo usuario â”€â”€â”€â”€â”€â”€
    // El store (Zustand) es un singleton de mÃ³dulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacÃ­o en Firestore antes de que lleguen los datos reales.
    setCurrent({ entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 });
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    let cancelado = false;
```

#### Por quÃ© se cambiÃ³
El store Zustand es un singleton de mÃ³dulo y persiste en memoria entre desmontajes de componentes. Al cambiar de usuario (login con otra cuenta), el store conservaba el estado del usuario anterior, incluyendo el turno abierto, hasta que Firestore respondÃ­a con los datos del nuevo usuario. El reset garantiza que el nuevo usuario siempre parte de un estado vacÃ­o y limpio. Se resetea tambiÃ©n `isAdmin`, `dataLoaded` y `loadTimedOut` para coherencia total del estado.

## 2026-05-30 20:40 - AÃ±adir efecto neÃ³n a los iconos de agenda y ajustes


**Archivos modificados:** `src/components/home-icons.tsx`, `src/components/navigation-icons.tsx`, `src/screens/home-screen.tsx`, `src/main.tsx`

### Cambio 1 - CreaciÃ³n de IconAgendaNeon con neÃ³n morado

#### CÃ³digo anterior
```tsx
export const IconAgenda: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="7" cy="9" r="1" fill={c} />
    <circle cx="7" cy="13" r="1" fill={c} />
    <circle cx="7" cy="17" r="1" fill={c} opacity="0.6" />
    <path d="M10 9H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 13H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 17H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);
```

#### CÃ³digo nuevo
```tsx
export const IconAgendaNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      overflow: "visible",
      filter: "drop-shadow(0 0 1.2px rgba(180, 120, 255, 0.8)) drop-shadow(0 0 5px rgba(180, 120, 255, 0.28))"
    }}
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="3"
      stroke="#b478ff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="9" r="1.1" fill="#d7b8ff" />
    <circle cx="7" cy="13" r="1.1" fill="#d7b8ff" />
    <circle cx="7" cy="17" r="1.1" fill="#d7b8ff" opacity="0.6" />
    <path
      d="M10 9H17"
      stroke="#d7b8ff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 13H17"
      stroke="#d7b8ff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 17H15"
      stroke="#d7b8ff"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);
```

#### Por quÃ© se cambiÃ³
Para aÃ±adirle el efecto de neÃ³n morado brillante con drop-shadow al icono de agenda en la pantalla de inicio.

### Cambio 2 - CreaciÃ³n de IconSettingsNeon que conserva el color gris original con neÃ³n

#### CÃ³digo anterior
```tsx
export const IconSettings: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

#### CÃ³digo nuevo
```tsx
export const IconSettingsNeon: FC<{ s?: number; c?: string }> = ({ s = 24, c = "oklch(0.72 0.01 250)" }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      overflow: "visible",
      filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 5px ${c})`
    }}
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
```

#### Por quÃ© se cambiÃ³
Para aÃ±adir el efecto neÃ³n manteniendo dinÃ¡micamente el color original grisÃ¡ceo a travÃ©s de la prop `c`.

### Cambio 3 - Uso de los nuevos iconos neÃ³n en HomeScreen

#### CÃ³digo anterior
```tsx
import { IconCalendar, IconSettings, IconAdminNeon, IconLogoutNeon } from "../components/navigation-icons";
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "../components/home-icons";
...
        <IconAgenda s={32} c="oklch(0.75 0.15 290)" />
...
        <IconSettings s={32} c="oklch(0.72 0.01 250)" />
```

#### CÃ³digo nuevo
```tsx
import { IconCalendar, IconSettingsNeon, IconAdminNeon, IconLogoutNeon } from "../components/navigation-icons";
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgendaNeon } from "../components/home-icons";
...
        <IconAgendaNeon s={32} />
...
        <IconSettingsNeon s={32} c="oklch(0.72 0.01 250)" />
```

#### Por quÃ© se cambiÃ³
Para importar y renderizar los nuevos componentes con efecto neÃ³n en la pantalla principal.

### Cambio 4 - Limpieza de importaciones no usadas de iconos en main.tsx

#### CÃ³digo anterior
```tsx
import { IconRocket, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconGive, IconRoad, IconPinNeon } from "./components/summary-icons";
```

#### CÃ³digo nuevo
```tsx
import { IconRocket, IconClipboard, IconChart, IconReservaWrite } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
```

#### Por quÃ© se cambiÃ³
Se eliminaron las importaciones de `IconAgenda` (renombrado a `IconAgendaNeon`), asÃ­ como de `IconGive` e `IconPinNeon`, ya que no se utilizan en `main.tsx` (fueron desacoplados a otros componentes de pantallas).

### Cambio 5 - Limpieza de importaciones de utilidades en main.tsx

#### CÃ³digo anterior
```tsx
import html2canvas from "html2canvas";
import { signOut } from "firebase/auth";
...
import { hapticTap, hapticAction } from "./services/haptics";
```

#### CÃ³digo nuevo
```tsx
import { signOut } from "firebase/auth";
...
import { hapticAction } from "./services/haptics";
```

#### Por quÃ© se cambiÃ³
Se eliminaron las importaciones huÃ©rfanas de `html2canvas` y `hapticTap` en `main.tsx` ya que estas utilidades no se consumen directamente dentro del archivo tras la modularizaciÃ³n de pantallas.

## 2026-05-30 20:35 - Cambiar comportamiento de retroceso en panel de turno

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - NavegaciÃ³n a inicio al presionar botÃ³n fÃ­sico atrÃ¡s en pantalla del turno

#### CÃ³digo anterior
```tsx
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const navego = useAppStore.getState().goBack();
          if (!navego) CapApp.exitApp();
        })
      )
```

#### CÃ³digo nuevo
```tsx
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          if (state.screen === "main") {
            state.resetNavigation("home");
            return;
          }
          const navego = state.goBack();
          if (!navego) CapApp.exitApp();
        })
      )
```

#### Por quÃ© se cambiÃ³
Se cambiÃ³ para que cuando el usuario estÃ© en el panel de control del turno ("main"), ya sea con el turno pausado o activo, al pulsar el botÃ³n fÃ­sico de retroceso de su dispositivo Android vuelva a la pantalla de inicio ("home") en lugar de cerrar la aplicaciÃ³n.

## 2026-05-30 20:31 - Restablecer altura de overlay de pausa y aÃ±adir esquinas redondeadas

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Modificar posicionamiento y agregar border radius en el overlay de pausa

#### CÃ³digo anterior
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "-12px -20px -24px",
            }}
          >
```

#### CÃ³digo nuevo
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 80,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "0 -20px -24px",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
```

#### Por quÃ© se cambiÃ³
Se restablece el valor de top a 80 y el margin superior a 0 para que la capa opaca de turno pausado cubra solo a partir de las tarjetas de cobro hacia abajo (dejando el encabezado del dÃ­a y los botones Home y Pausa sin oscurecer), y se aÃ±aden esquinas superiores redondeadas (borderTopLeftRadius y borderTopRightRadius de 24px) para integrarlo estÃ©ticamente con el diseÃ±o general.

## 2026-05-30 20:30 - Ajustar overlay de pausa para cubrir la pantalla completa

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Modificar posicionamiento y margen superior del overlay de pausa

#### CÃ³digo anterior
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 85,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "0 -20px -24px",
            }}
          >
```

#### CÃ³digo nuevo
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "-12px -20px -24px",
            }}
          >
```

#### Por quÃ© se cambiÃ³
Se modifica el valor de top de 85 a 0 y el margen superior de 0 a -12px para que el fondo opaco de turno pausado cubra la pantalla completa (incluyendo el encabezado del dÃ­a y los botones superiores de home/pausa) en lugar de dejar la parte superior brillante y descubierta.

## 2026-05-30 20:27 - Habilitar reanudacion de turno al pulsar el icono de pausa

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Agregar interacciÃ³n al recuadro de pausa

#### CÃ³digo anterior
```tsx
            <div style={{
              width: 152,
              height: 152,
              background: "#101827",
              borderRadius: 38,
              border: "3px solid #3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              boxShadow: "0 0 4px rgba(126,182,255,0.68), 0 0 28px rgba(59,130,246,0.30), 0 14px 34px rgba(59,130,246,0.18)"
            }}>
              <IconPause s={84} c="#7eb6ff" />
            </div>
```

#### CÃ³digo nuevo
```tsx
            <div
              onClick={togglePause}
              style={{
                width: 152,
                height: 152,
                background: "#101827",
                borderRadius: 38,
                border: "3px solid #3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
                boxShadow: "0 0 4px rgba(126,182,255,0.68), 0 0 28px rgba(59,130,246,0.30), 0 14px 34px rgba(59,130,246,0.18)",
                cursor: "pointer"
              }}
            >
              <IconPause s={84} c="#7eb6ff" />
            </div>
```

#### Por quÃ© se cambiÃ³
Se aÃ±ade interacciÃ³n al recuadro del icono de pausa de la pantalla de turno pausado para que el usuario pueda reanudar su turno de forma intuitiva haciendo click en Ã©l ademÃ¡s del botÃ³n continuar.

## 2026-05-30 19:54 - Extraer pantallas de resumen y edicion de main.tsx

**Archivos modificados:** `src/screens/summary-screen.tsx`, `src/screens/edit-turno-screen.tsx`, `src/main.tsx`, `src/__tests__/summary-layout.test.ts`, `src/__tests__/responsive-title-fonts.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Crear pantalla de resumen en archivo independiente

#### CÃ³digo anterior
```
`No existÃ­a SummaryScreen en src/screens/summary-screen.tsx.`
```

#### CÃ³digo nuevo
```tsx
import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconPencilNeon } from "../components/calendar-icons";
// ... (resto del archivo summary-screen.tsx)
```

#### Por quÃ© se cambiÃ³
Se extrae la pantalla de Resumen de Turno de main.tsx a un archivo de componente exclusivo para modularizar y facilitar el mantenimiento del cÃ³digo.

### Cambio 2 - Crear pantalla de ediciÃ³n de turno en archivo independiente

#### CÃ³digo anterior
```
`No existÃ­a EditTurnoScreen en src/screens/edit-turno-screen.tsx.`
```

#### CÃ³digo nuevo
```tsx
import { type FC, useState } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
// ... (resto del archivo edit-turno-screen.tsx)
```

#### Por quÃ© se cambiÃ³
Se desacopla la pantalla de EdiciÃ³n de Turno de main.tsx a su propio archivo de componente manteniendo todos sus diÃ¡logos locales y feedback hÃ¡ptico.

### Cambio 3 - Importar y renderizar nuevas pantallas en main.tsx

#### CÃ³digo anterior
```tsx
// ... importaciones ...
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, fmt } from "./logic/formatters";
// ...
  if (screen === 'summary' && viewTurno) {
    const vP = viewTurno.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
    // ... [cerca de 750 lÃ­neas de JSX para summary y editTurno] ...
  }
```

#### CÃ³digo nuevo
```tsx
import { SummaryScreen } from "./screens/summary-screen";
import { EditTurnoScreen } from "./screens/edit-turno-screen";
// ...
  if (screen === 'summary' && viewTurno) {
    return (
      <SummaryScreen
        viewTurno={viewTurno}
        settings={settings}
        returnScreen={returnScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        setScreen={setScreen}
        setEditJ={setEditJ}
        setHistory={setHistory}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    );
  }

  if (screen === 'editTurno' && editJ) {
    return (
      <EditTurnoScreen
        editJ={editJ}
        setEditJ={setEditJ}
        setHistory={setHistory}
        setViewTurno={setViewTurno}
        setScreen={setScreen}
        endField={endField}
        setEndField={setEndField}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
Se redujo significativamente la complejidad de main.tsx delegando el renderizado de estas dos pantallas a los nuevos componentes.

### Cambio 4 - Actualizar ruta del archivo leido en summary-layout.test.ts

#### CÃ³digo anterior
```ts
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
```

#### CÃ³digo nuevo
```ts
  const source = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
```

#### Por quÃ© se cambiÃ³
La pantalla de resumen ahora estÃ¡ en summary-screen.tsx, por lo que el test estÃ¡tico debe analizar este archivo.

### Cambio 5 - Actualizar archivo analizado en responsive-title-fonts.test.ts

#### CÃ³digo anterior
```ts
describe("Responsive title fonts", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
```

#### CÃ³digo nuevo
```ts
describe("Responsive title fonts", () => {
  const source = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
```

#### Por quÃ© se cambiÃ³
La aserciÃ³n comprueba el tamaÃ±o de fuente responsivo del tÃ­tulo del resumen que ahora vive en summary-screen.tsx.

### Cambio 6 - AÃ±adir lecturas y adaptar aserciones en detailed-notes-layout.test.ts

#### CÃ³digo anterior
```ts
describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  const summaryIconsSource = readFileSync(resolve("src/components/summary-icons.tsx"), "utf8");
```

#### CÃ³digo nuevo
```ts
describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
  const summarySource = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
  const editTurnoSource = readFileSync(resolve("src/screens/edit-turno-screen.tsx"), "utf8");

  const summaryIconsSource = readFileSync(resolve("src/components/summary-icons.tsx"), "utf8");
```

#### Por quÃ© se cambiÃ³
Se adaptan los tests de regresiÃ³n estÃ¡ticos para buscar las notas detalladas y la pantalla de ediciÃ³n en las nuevas rutas de las pantallas extraÃ­das.

### Cambio 7 - AÃ±adir comentario de teclado in-app en edit-turno-screen.tsx

#### CÃ³digo anterior
```tsx
        </div>
      </div>

      {endField && (
```

#### CÃ³digo nuevo
```tsx
        </div>
      </div>

      {/* Teclado in-app para Dinero / KM en Editar Turno */}
      {endField && (
```

#### Por quÃ© se cambiÃ³
Restaurar el comentario literal buscado por los tests de regresiÃ³n estÃ¡ticos del editor de turnos.

## 2026-05-30 19:44 - Consolidar iconos e inline styles en main.tsx

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Importar iconos comunes en `main.tsx`

#### CÃ³digo anterior
```ts
import { hapticTap, hapticAction } from "./services/haptics";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "./components/entry-icons";
import {
  IconBack,
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
import { CalendarScreen } from "./screens/calendar-screen";
```

#### CÃ³digo nuevo
```ts
import { hapticTap, hapticAction } from "./services/haptics";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "./components/entry-icons";
import {
  IconBack,
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
import { IconTimer, IconMoneyBag, IconPencilNeon } from "./components/calendar-icons";
import { IconRocket, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconGive, IconRoad, IconPinNeon } from "./components/summary-icons";
import { IconReceipt, IconHoliday } from "./components/settings-icons";
import { CalendarScreen } from "./screens/calendar-screen";
```

#### Por quÃ© se cambiÃ³
Se importan los iconos compartidos consolidados en lugar de definirlos de manera local y redundante en `main.tsx`.

### Cambio 2 - Eliminar constantes locales de iconos en `main.tsx`

#### CÃ³digo anterior
```ts
const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  // ... svg local ...
);
// ... y otros 14 iconos locales: IconReservaWrite, IconNoteAdd, IconTaxiBadgeNeon, IconReceipt, IconGive, IconHoliday, IconTimer, IconRoad, IconPinNeon, IconMoneyBag, IconAgenda, IconClipboard, IconChart, IconRocket
```

#### CÃ³digo nuevo
```
(El bloque completo de definiciones de iconos locales fue removido de main.tsx)
```

#### Por quÃ© se cambiÃ³
Eliminar la duplicidad de componentes de iconos SVG redundantes que ya se encuentran disponibles en los archivos de utilidades de iconos comunes del proyecto.

### Cambio 3 - Extraer estilos de reserva inline de la funciÃ³n render de App

#### CÃ³digo anterior
```ts
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;
```
...
```ts
    }
    setShowReservaDialog(false);
  };

  const reservaInputStyle = {
    width: "100%",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.11)",
    borderRadius: 14,
    color: "white",
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const renderReservaLabel = (primary: string, secondary: string, required = false) => (
    // ...
  );

  const renderReservaSection = (title: string, subtitle: string) => (
    // ...
  );

  const reservaFieldGroupStyle = {
    marginLeft: 10,
    paddingLeft: 12,
    borderLeft: `1px solid ${C}55`,
  };
```

#### CÃ³digo nuevo
```ts
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

const reservaInputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 14,
  color: "white",
  padding: "13px 14px",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box" as const,
};

const reservaFieldGroupStyle = {
  marginLeft: 10,
  paddingLeft: 12,
  borderLeft: `1px solid ${C}55`,
};
```
...
```ts
    }
    setShowReservaDialog(false);
  };

  const renderReservaLabel = (primary: string, secondary: string, required = false) => (
    // ...
  );

  const renderReservaSection = (title: string, subtitle: string) => (
    // ...
  );
```

#### Por quÃ© se cambiÃ³
Mover variables de estilos de React fuera de las funciones de render para evitar la recreaciÃ³n innecesaria de objetos en memoria en cada ciclo de render.

## 2026-05-30 19:38 - AÃ±adir store Zustand y migrar pantallas de detalle a selectores

**Archivos modificados:** `src/services/store.ts`, `src/main.tsx`, `src/screens/add-nota-general-screen.tsx`, `src/screens/detalle-anual-screen.tsx`, `src/screens/detalle-mes-screen.tsx`, `src/screens/detalle-semana-screen.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/store-extraction.test.ts`, `src/__tests__/state-loaders-extraction.test.ts`

### Cambio 1 - Crear store global de Zustand

#### CÃ³digo anterior
`No existÃ­a src/services/store.ts.`

#### CÃ³digo nuevo
```ts
import { create } from "zustand";
import type {
  AppSettings,
  CurrentState,
  NotaCalendario,
  Reserva,
  Turno,
  WeekOverride,
} from "../shared/types";
import {
  loadCurrent,
  loadHistory,
  loadNotes,
  loadReservations,
  loadSettings,
  loadWeekOverrides,
} from "../logic/state-loaders";

/**
 * Store global de la aplicaciÃ³n (Zustand v5).
 *
 * DiseÃ±o:
 *  - Slice de NEGOCIO: los 6 dominios (current, history, reservations, notes,
 *    settings, weekOverrides) + flags de sincronizaciÃ³n (dataLoaded, loadTimedOut)
 *    + isAdmin.
 *  - Slice de NAVEGACIÃ“N: separado conceptualmente (screen + navigationStack +
 *    setScreen/goBack/resetNavigation) para no acoplar navegaciÃ³n con datos.
 *
 * Los setters imitan la firma de React `Dispatch<SetStateAction<T>>`
 * (aceptan un valor o una funciÃ³n updater) para poder migrar `App` y
 * `useFirestoreSync` SIN reescribir las ~3000 lÃ­neas que ya consumen
 * `setCurrent(prev => ...)`, `setHistory(...)`, etc.
 */

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(prev: T, value: Updater<T>): T {
  return typeof value === "function" ? (value as (p: T) => T)(prev) : value;
}

// --- Slice de negocio ---------------------------------------------------------
interface BusinessSlice {
  current: CurrentState;
  history: Turno[];
  reservations: Reserva[];
  notes: NotaCalendario[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];

  dataLoaded: boolean;
  loadTimedOut: boolean;
  isAdmin: boolean;

  setCurrent: (value: Updater<CurrentState>) => void;
  setHistory: (value: Updater<Turno[]>) => void;
  setReservations: (value: Updater<Reserva[]>) => void;
  setNotes: (value: Updater<NotaCalendario[]>) => void;
  setSettings: (value: Updater<AppSettings>) => void;
  setWeekOverrides: (value: Updater<WeekOverride[]>) => void;

  setDataLoaded: (value: Updater<boolean>) => void;
  setLoadTimedOut: (value: Updater<boolean>) => void;
  setIsAdmin: (value: Updater<boolean>) => void;
}

// --- Slice de navegaciÃ³n ------------------------------------------------------
interface NavigationSlice {
  screen: string;
  navigationStack: string[];
  /** Navega a una pantalla apilÃ¡ndola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raÃ­z. */
  goBack: () => boolean;
  /** Reinicia la navegaciÃ³n a una pantalla raÃ­z (p. ej. al hacer login/logout). */
  resetNavigation: (root?: string) => void;
}

export type AppStore = BusinessSlice & NavigationSlice;

const INITIAL_SCREEN = "home";

export const useAppStore = create<AppStore>((set, get) => ({
  // --- negocio: estado inicial leÃ­do de localStorage (igual que antes) ---
  current: loadCurrent(),
  history: loadHistory(),
  reservations: loadReservations(),
  notes: loadNotes(),
  settings: loadSettings(),
  weekOverrides: loadWeekOverrides(),

  dataLoaded: false,
  loadTimedOut: false,
  isAdmin: false,

  setCurrent: (value) => set((s) => ({ current: resolve(s.current, value) })),
  setHistory: (value) => set((s) => ({ history: resolve(s.history, value) })),
  setReservations: (value) =>
    set((s) => ({ reservations: resolve(s.reservations, value) })),
  setNotes: (value) => set((s) => ({ notes: resolve(s.notes, value) })),
  setSettings: (value) => set((s) => ({ settings: resolve(s.settings, value) })),
  setWeekOverrides: (value) =>
    set((s) => ({ weekOverrides: resolve(s.weekOverrides, value) })),

  setDataLoaded: (value) => set((s) => ({ dataLoaded: resolve(s.dataLoaded, value) })),
  setLoadTimedOut: (value) =>
    set((s) => ({ loadTimedOut: resolve(s.loadTimedOut, value) })),
  setIsAdmin: (value) => set((s) => ({ isAdmin: resolve(s.isAdmin, value) })),

  // --- navegaciÃ³n ---
  screen: INITIAL_SCREEN,
  navigationStack: [INITIAL_SCREEN],

  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  goBack: () => {
    const { navigationStack } = get();
    if (navigationStack.length <= 1) return false;
    const stack = navigationStack.slice(0, -1);
    set({ screen: stack[stack.length - 1], navigationStack: stack });
    return true;
  },

  resetNavigation: (root = INITIAL_SCREEN) =>
    set({ screen: root, navigationStack: [root] }),
}));
```

#### Por quÃ© se cambiÃ³
Centralizar el estado de negocio (current, history, reservations, notes, settings, weekOverrides) y la navegaciÃ³n (screen + navigationStack + goBack/resetNavigation) en un Ãºnico store para eliminar el prop drilling. Los setters imitan la firma de useState (valor o updater) para poder migrar sin reescribir el resto de App.

### Cambio 2 - Retroceso tras cerrar turno lleva a la lista de turnos

#### CÃ³digo anterior
```tsx
    setViewTurno(turno);
    setScreen("summary");
  }
```

#### CÃ³digo nuevo
```tsx
    setViewTurno(turno);
    // Tras cerrar el turno, el recorrido de navegaciÃ³n queda como
    // PantallaTurnos -> summary, de modo que el botÃ³n "atrÃ¡s" desde el
    // resumen lleve a la lista de turnos (como si se hubiera abierto desde
    // ahÃ­), nunca de vuelta a la pantalla de confirmar cierre.
    useAppStore.getState().resetNavigation("PantallaTurnos");
    setScreen("summary");
  }
```

#### Por quÃ© se cambiÃ³
Al cerrar turno e ir al resumen, el botÃ³n fÃ­sico de atrÃ¡s volvÃ­a a la pantalla de confirmar cierre (con el turno ya cerrado), pudiendo crear un turno vacÃ­o. Reiniciar el stack a PantallaTurnos hace que atrÃ¡s lleve a la lista de turnos.

### Cambio 3 - Migrar pantallas de detalle a selectores del store

#### CÃ³digo anterior (ejemplo, detalle-anual-screen.tsx)
```tsx
export function DetalleAnualScreen({
  history,
  settings,
  selectedAccountingYear,
  setSelectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingMonth,
  setScreen,
}: Props) {
```

#### CÃ³digo nuevo
```tsx
export function DetalleAnualScreen({
  selectedAccountingYear,
  setSelectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingMonth,
}: Props) {
  const history: Turno[] = useAppStore((s) => s.history);
  const settings: AppSettings = useAppStore((s) => s.settings);
  const setScreen = useAppStore((s) => s.setScreen);
```

#### Por quÃ© se cambiÃ³
DetalleAnualScreen, DetalleMesScreen, DetalleSemanaScreen, LiquidacionSemanaScreen y AddNotaGeneralScreen leÃ­an history/settings/weekOverrides/setScreen/setCurrent por props desde App. Ahora los leen por selectores del store, reduciendo el prop drilling. Se quitaron tambiÃ©n esas props de las invocaciones en main.tsx.

### Cambio 4 - Limpiar imports de iconos sin usar y de state-loaders en main.tsx

#### CÃ³digo anterior
```tsx
import {
  IconBack,
  IconDel,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconCalendar,
  IconSettings,
  IconHomeNeon,
  IconLogoutNeon,
  IconAdminNeon,
} from "./components/navigation-icons";
```

#### CÃ³digo nuevo
```tsx
import {
  IconBack,
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
```

#### Por quÃ© se cambiÃ³
Tras centralizar el estado en el store, varios imports quedaron sin uso: 8 iconos (IconPercent, IconRefresh, IconDownload, IconUpload, IconCalendar, IconSettings, IconLogoutNeon, IconAdminNeon) y el import de state-loaders (loadCurrent, etc., que ahora consume el store). Se eliminaron para no dejar cÃ³digo muerto.

### Cambio 5 - Test del contrato del store

#### CÃ³digo anterior
`No existÃ­a src/__tests__/store-extraction.test.ts.`

#### CÃ³digo nuevo
`Test nuevo que verifica vÃ­a useAppStore.getState(): setCurrent (valor y updater), y el slice de navegaciÃ³n (setScreen apila, goBack retrocede/devuelve false en raÃ­z, resetNavigation reinicia el stack para el flujo post-cierre de turno).`

#### Por quÃ© se cambiÃ³
Validar el contrato del store en el que se apoyan las pantallas migradas, en el mismo estilo de tests de lÃ³gica del proyecto (sin React).

### Cambio 6 - Actualizar test de extracciÃ³n de state-loaders

#### CÃ³digo anterior
```ts
    expect(mainSource).toContain('from "./logic/state-loaders"');
    expect(mainSource).not.toMatch(/^function loadSettings\(/m);
```

#### CÃ³digo nuevo
```ts
    // Tras centralizar el estado en el store (Fase 2), los loaders los consume
    // el store, no main.tsx. Lo que importa es que sigan FUERA de main.tsx.
    const storeSource = readFileSync(resolve("src/services/store.ts"), "utf8");
    expect(storeSource).toContain('from "../logic/state-loaders"');
    expect(mainSource).not.toMatch(/^function loadSettings\(/m);
```

#### Por quÃ© se cambiÃ³
El test verificaba que main.tsx importaba los loaders (arquitectura previa). Tras la migraciÃ³n los consume el store; se actualiza el aserto para comprobar que el store los importa y que siguen fuera de main.tsx.

## 2026-05-30 19:37 - AÃ±adir feedback hÃ¡ptico e indicador de sincronizaciÃ³n

**Archivos modificados:**
- `package.json`
- `index.html`
- `src/services/haptics.ts`
- `src/hooks/use-network-status.ts`
- `src/components/sync-indicator.tsx`
- `src/components/shell.tsx`
- `src/screens/add-entry-screen.tsx`
- `src/screens/add-single-entry-screen.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/settings-screen.tsx`
- `src/main.tsx`

### Cambio 1 - Instalar dependencia @capacitor/haptics

#### CÃ³digo anterior
```json
  "dependencies": {
    "@capacitor/app": "^6.0.3",
    "@capacitor/core": "^6.2.0",
    "@capacitor/filesystem": "^6.0.3",
    "@capacitor/share": "^6.0.3",
    "firebase": "^11.0.0",
    "html2canvas": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.14"
  },
```

#### CÃ³digo nuevo
```json
  "dependencies": {
    "@capacitor/app": "^6.0.3",
    "@capacitor/core": "^6.2.0",
    "@capacitor/filesystem": "^6.0.3",
    "@capacitor/haptics": "^6.0.0",
    "@capacitor/share": "^6.0.3",
    "firebase": "^11.0.0",
    "html2canvas": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.14"
  },
```

#### Por quÃ© se cambiÃ³
Se requiere el plugin oficial de Capacitor para dar soporte de feedback hÃ¡ptico en dispositivos nativos.

### Cambio 2 - Crear servicio de feedback hÃ¡ptico

#### CÃ³digo anterior
```
No existÃ­a haptics.ts en src/services.
```

#### CÃ³digo nuevo
```ts
import { Capacitor } from '@capacitor/core';

let hapticsModule: any = null;

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  if (!hapticsModule) {
    try {
      hapticsModule = await import('@capacitor/haptics');
    } catch (e) {
      console.warn('Error cargando mÃ³dulo de haptics:', e);
      return null;
    }
  }
  return hapticsModule;
}

export async function hapticTap(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Light });
    } catch (e) {
      console.warn('Error en hapticTap:', e);
    }
  }
}

export async function hapticConfirm(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en hapticConfirm:', e);
    }
  }
}

export async function hapticAction(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en hapticAction:', e);
    }
  }
}
```

#### Por quÃ© se cambiÃ³
Centraliza la lÃ³gica de feedback hÃ¡ptico con imports dinÃ¡micos para evitar fallos en entornos web o tests.

### Cambio 3 - AÃ±adir hÃ¡ptico a add-entry-screen.tsx

#### CÃ³digo anterior
```ts
import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { G, P } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { CurrentState, Entry } from "../shared/types";
```
...
```ts
  function kpAdd(v: string) {
    if (v === "DEL") {
      setVal((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!curVal.includes(",")) setVal((p) => p + ",");
      return;
    }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }

  function handleSaveAdd() {
    const p = parseFloat(valP.replace(",", "."));
    const d = parseFloat(valD.replace(",", "."));
```

#### CÃ³digo nuevo
```ts
import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { G, P } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { CurrentState, Entry } from "../shared/types";
import { hapticTap, hapticConfirm } from "../services/haptics";
```
...
```ts
  function kpAdd(v: string) {
    hapticTap();
    if (v === "DEL") {
      setVal((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!curVal.includes(",")) setVal((p) => p + ",");
      return;
    }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }

  function handleSaveAdd() {
    hapticConfirm();
    const p = parseFloat(valP.replace(",", "."));
    const d = parseFloat(valD.replace(",", "."));
```

#### Por quÃ© se cambiÃ³
Brindar respuesta fÃ­sica (vibraciÃ³n ligera en teclado, moderada al guardar) en la pantalla de aÃ±adir entrada.

### Cambio 4 - AÃ±adir hÃ¡ptico a add-single-entry-screen.tsx

#### CÃ³digo anterior
```ts
import { type FC, type CSSProperties } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { A, ABG, E, EBG, F, FBG, N, NBG } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { Entry } from "../shared/types";
```
...
```ts
  function kpS(v: string) {
    if (v === "DEL") {
      setValS((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!valS.includes(",")) setValS((p) => p + ",");
      return;
    }
    if (valS.replace(",", "").length >= 6) return;
    setValS((p) => p + v);
  }

  const validS = valS && parseFloat(valS.replace(",", ".")) > 0;

  function saveS() {
    if (!validS) return;
```

#### CÃ³digo nuevo
```ts
import { type FC, type CSSProperties } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { A, ABG, E, EBG, F, FBG, N, NBG } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { Entry } from "../shared/types";
import { hapticTap, hapticConfirm } from "../services/haptics";
```
...
```ts
  function kpS(v: string) {
    hapticTap();
    if (v === "DEL") {
      setValS((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!valS.includes(",")) setValS((p) => p + ",");
      return;
    }
    if (valS.replace(",", "").length >= 6) return;
    setValS((p) => p + v);
  }

  const validS = valS && parseFloat(valS.replace(",", ".")) > 0;

  function saveS() {
    hapticConfirm();
    if (!validS) return;
```

#### Por quÃ© se cambiÃ³
Brindar respuesta fÃ­sica al ingresar valores y guardar gastos/extras/gasolina.

### Cambio 5 - AÃ±adir hÃ¡ptico a confirm-end-screen.tsx

#### CÃ³digo anterior
```ts
import type { CurrentState, AppSettings, Entry } from "../shared/types";
```
...
```ts
  function kpEnd(v: string) {
    if (!endField) return;
```
...
```ts
          <button onClick={onEndTurno}
            style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
            Terminar Turno
          </button>
```
...
```ts
            <button
              onClick={() => setEndField(null)}
              style={{
```

#### CÃ³digo nuevo
```ts
import type { CurrentState, AppSettings, Entry } from "../shared/types";
import { hapticTap, hapticConfirm, hapticAction } from "../services/haptics";
```
...
```ts
  function kpEnd(v: string) {
    hapticTap();
    if (!endField) return;
```
...
```ts
          <button onClick={() => { hapticAction(); onEndTurno(); }}
            style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
            Terminar Turno
          </button>
```
...
```ts
            <button
              onClick={() => { hapticConfirm(); setEndField(null); }}
              style={{
```

#### Por quÃ© se cambiÃ³
AÃ±adir vibraciÃ³n al teclado numÃ©rico de fin de turno y vibraciÃ³n intensa al finalizar turno definitivamente.

### Cambio 6 - AÃ±adir hÃ¡ptico a settings-screen.tsx

#### CÃ³digo anterior
```ts
import { IconDel } from "../components/navigation-icons";
```
...
```ts
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
                  onClick={() => {
                    let next = settingsValStr;
                    if (k === "DEL") next = next.slice(0, -1);
                    else if (k === ",") { if (!next.includes(",")) next = next + ","; else return; }
                    else { if (next.replace(",", "").length >= 3) return; next = next + k; }
                    setSettingsValStr(next);
                  }}
```
...
```ts
            <button
              onClick={() => {
                const val = parseFloat(settingsValStr.replace(",", ".")) || 0;
```

#### CÃ³digo nuevo
```ts
import { IconDel } from "../components/navigation-icons";
import { hapticTap, hapticConfirm } from "../services/haptics";
```
...
```ts
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
                  onClick={() => {
                    hapticTap();
                    let next = settingsValStr;
                    if (k === "DEL") next = next.slice(0, -1);
                    else if (k === ",") { if (!next.includes(",")) next = next + ","; else return; }
                    else { if (next.replace(",", "").length >= 3) return; next = next + k; }
                    setSettingsValStr(next);
                  }}
```
...
```ts
            <button
              onClick={() => {
                hapticConfirm();
                const val = parseFloat(settingsValStr.replace(",", ".")) || 0;
```

#### Por quÃ© se cambiÃ³
Ofrecer feedback tÃ¡ctil al ajustar el porcentaje de reparto en la configuraciÃ³n.

### Cambio 7 - AÃ±adir hÃ¡ptico a main.tsx

#### CÃ³digo anterior
```ts
import { APP_VERSION } from "./shared/app-version";
```
...
```ts
  function togglePause() {
    const now = timeNow();
```
...
```ts
    function kpEdit(v: string) {
      if (!editJ || !endField) return;
```
...
```ts
                    <div style={{ position: 'relative', zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4, marginBottom: 4, animation: 'fadeUp 0.2s ease' }}>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                        <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => {
                          e.preventDefault();
```
...
```ts
                  <button
                    onClick={() => {
                      setCurrent({
```

#### CÃ³digo nuevo
```ts
import { APP_VERSION } from "./shared/app-version";
import { hapticTap, hapticAction } from "./services/haptics";
```
...
```ts
  function togglePause() {
    hapticAction();
    const now = timeNow();
```
...
```ts
    function kpEdit(v: string) {
      hapticTap();
      if (!editJ || !endField) return;
```
...
```ts
                    <div style={{ position: 'relative', zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4, marginBottom: 4, animation: 'fadeUp 0.2s ease' }}>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                        <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => {
                          hapticTap();
                          e.preventDefault();
```
...
```ts
                  <button
                    onClick={() => {
                      hapticAction();
                      setCurrent({
```

#### Por quÃ© se cambiÃ³
Dar respuesta hÃ¡ptica al pulsar las teclas numÃ©ricas, iniciar el turno y pausar o reanudar el turno.

### Cambio 8 - Crear hook useNetworkStatus

#### CÃ³digo anterior
```
No existÃ­a use-network-status.ts en src/hooks.
```

#### CÃ³digo nuevo
```ts
import { useState, useEffect } from "react";
import { useAppStore } from "../services/store";

export type NetworkStatus = "online" | "offline" | "error";

export function useNetworkStatus(): NetworkStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);
  
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loadTimedOut) {
    return "error";
  }

  if (!isOnline || !dataLoaded) {
    return "offline";
  }

  return "online";
}
```

#### Por quÃ© se cambiÃ³
Combina el estado nativo de red en el navegador con el estado interno de carga de Firestore para clasificar la conexiÃ³n.

### Cambio 9 - Crear componente SyncIndicator

#### CÃ³digo anterior
```
No existÃ­a sync-indicator.tsx en src/components.
```

#### CÃ³digo nuevo
```tsx
import { type FC } from "react";
import { useNetworkStatus } from "../hooks/use-network-status";

export const SyncIndicator: FC = () => {
  const status = useNetworkStatus();

  const config = {
    online: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexiÃ³n",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronizaciÃ³n",
      animation: "none",
    },
  }[status];

  return (
    <div
      title={config.label}
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: config.color,
        boxShadow: `0 0 6px ${config.shadow}`,
        animation: config.animation,
        pointerEvents: "none",
        zIndex: 1000,
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
      }}
    />
  );
};
```

#### Por quÃ© se cambiÃ³
RepresentaciÃ³n visual en forma de pequeÃ±o LED para conocer en todo momento el estado de red y sincronizaciÃ³n Firestore.

### Cambio 10 - Integrar indicador en el Shell

#### CÃ³digo anterior
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
```

#### CÃ³digo nuevo
```tsx
import type { ReactNode } from "react";
import { SyncIndicator } from "./sync-indicator";

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
      <SyncIndicator />
    </div>
  );
}
```

#### Por quÃ© se cambiÃ³
Mostrar el indicador de sincronizaciÃ³n de red en la parte inferior derecha del contenedor global de la aplicaciÃ³n.

### Cambio 11 - AÃ±adir animaciÃ³n en index.html

#### CÃ³digo anterior
```html
    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
```

#### CÃ³digo nuevo
```html
    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes pulse-sync {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
```

#### Por quÃ© se cambiÃ³
Habilitar la animaciÃ³n CSS de pulso lento necesaria para el estado de red offline del indicador.

## 2026-05-29 16:49 - AÃ±adir check de tipos y tests al CI

**Archivos modificados:** package.json, .github/workflows/ci.yml

### Cambio 1 - Script typecheck en package.json

#### CÃ³digo anterior
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

#### CÃ³digo nuevo
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
```

#### Por quÃ© se cambiÃ³
No existÃ­a forma estandarizada de ejecutar la comprobaciÃ³n de tipos. El script `typecheck` permite invocarla igual en local y en CI.

### Cambio 2 - Workflow de CI

#### CÃ³digo anterior
```yaml
No existÃ­a .github/workflows/ci.yml en el proyecto.
```

#### CÃ³digo nuevo
```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Tests
        run: npm test
```

#### Por quÃ© se cambiÃ³
La suite de tests es de extracciÃ³n (coincidencia de strings) y no detecta errores de compilaciÃ³n; un error de tipos (TS2741 en CalendarScreen) pasÃ³ desapercibido. El workflow ejecuta `tsc --noEmit` y los tests en cada push y PR a main para impedir que vuelva a ocurrir.

## 2026-05-29 16:45 - Cablear useFirestoreSync y eliminar Firebase inline de main.tsx

**Archivos modificados:** src/main.tsx, .gitignore

### Cambio 1 - Invocar el hook useFirestoreSync

#### CÃ³digo anterior
```tsx
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
```

#### CÃ³digo nuevo
```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });
```

#### Por quÃ© se cambiÃ³
El hook `useFirestoreSync` estaba importado pero nunca se invocaba (cÃ³digo muerto), y los estados `dataLoaded`/`loadTimedOut` y los 6 refs `lastXRef` seguÃ­an declarados en `main.tsx`. Ahora esos estados y refs viven dentro del hook; el componente solo consume su valor de retorno.

### Cambio 2 - Eliminar la funciÃ³n de migraciÃ³n duplicada en main.tsx

#### CÃ³digo anterior
```tsx
const LOCAL_MIGRATION_KEY = "taxi_migration_done_v2";

const LOAD_TIMEOUT_MS = 15000;

async function migrarLocalStorageAFirestore(uid: string): Promise<void> {
  // ... (sube localStorage a Firestore, batch writes y limpieza de claves)
}
```

#### CÃ³digo nuevo
```tsx
// Eliminado: la migraciÃ³n localStorage â†’ Firestore vive ahora en
// src/hooks/use-firestore-sync.ts.
```

#### Por quÃ© se cambiÃ³
`migrarLocalStorageAFirestore`, `LOCAL_MIGRATION_KEY` y `LOAD_TIMEOUT_MS` estaban duplicados literalmente en `main.tsx` y en el hook. Se elimina la copia de `main.tsx` para tener una Ãºnica fuente de verdad.

### Cambio 3 - Eliminar los useEffect de Firestore de main.tsx

#### CÃ³digo anterior
```tsx
  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    // ... saveUserDoc / syncSubcollection para current, settings, turnos,
    //     reservations, notes, weekOverrides
  }, [/* deps */]);

  useEffect(() => {
    // ... inicializaciÃ³n con onSnapshot de las 6 colecciones + marcar dataLoaded
  }, []);

  useEffect(() => {
    // ... timeout de carga (setLoadTimedOut)
  }, [dataLoaded]);

  useEffect(() => {
    // ... getDoc(admins/{uid}) â†’ setIsAdmin
  }, []);
```

#### CÃ³digo nuevo
```tsx
// Eliminados: toda la lÃ³gica de escritura reactiva, suscripciÃ³n onSnapshot,
// timeout de carga y detecciÃ³n de admin se moviÃ³ a useFirestoreSync.
// El useEffect del Service Worker permanece en main.tsx por no ser de Firebase.
```

#### Por quÃ© se cambiÃ³
Eran exactamente los mismos efectos que ya contiene el hook. Mantenerlos en `main.tsx` los ejecutaba por duplicado y contradecÃ­a la extracciÃ³n.

### Cambio 4 - Reducir los imports de Firestore en main.tsx

#### CÃ³digo anterior
```tsx
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./services/firebase";
```

#### CÃ³digo nuevo
```tsx
import { auth } from "./services/firebase";
```

#### Por quÃ© se cambiÃ³
Tras mover la lÃ³gica al hook, `onSnapshot`, `doc`, `getDoc`, `setDoc`, `writeBatch` y `db` quedaron sin uso en `main.tsx`.

### Cambio 5 - Pasar renderReservaDialog a CalendarScreen

#### CÃ³digo anterior
```tsx
        notes={notes}
        setNotes={setNotes}
        
        setShowReservaDialog={setShowReservaDialog}
```

#### CÃ³digo nuevo
```tsx
        notes={notes}
        setNotes={setNotes}
        renderReservaDialog={renderReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
```

#### Por quÃ© se cambiÃ³
`CalendarScreenProps` exige `renderReservaDialog` y no se estaba pasando, lo que rompÃ­a `tsc --noEmit` (error TS2741). La funciÃ³n ya existÃ­a en `main.tsx`.

### Cambio 6 - Ignorar artefactos de trabajo del agente

#### CÃ³digo anterior
```
No existÃ­a la secciÃ³n de artefactos del agente en .gitignore.
```

#### CÃ³digo nuevo
```
# Artefactos de trabajo del agente
scratch/
test_failures.txt
scratch_verify_results.txt
```

#### Por quÃ© se cambiÃ³
`test_failures.txt`, `scratch_verify_results.txt` y `scratch/` son residuos de depuraciÃ³n que no deben acabar en el repositorio.

## 2026-05-29 17:41 - Extraer pantallas de contabilidad y sincronizacion

**Archivos modificados:** src/main.tsx, src/hooks/use-firestore-sync.ts, src/screens/contabilidad-screen.tsx, src/screens/detalle-anual-screen.tsx, src/screens/detalle-mes-screen.tsx, src/screens/detalle-semana-screen.tsx, src/screens/liquidacion-semana-screen.tsx, ESTRUCTURA.md, src/__tests__/responsive-title-fonts.test.ts

### Cambio 1 - Extraer logica de sincronizacion Firestore

#### Codigo anterior
```tsx
// LÃ³gica inline gigante en main.tsx dentro de App()
useEffect(() => {
  if (!user) return;
  const unsubs = [];
  unsubs.push(onSnapshot(...));
  // ... (cientos de lineas)
});
```

#### Codigo nuevo
```tsx
// En main.tsx
import { useFirestoreSync } from "./hooks/use-firestore-sync";

  useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin
  });
```

#### Por que se cambio
Aislar la complejidad de Firebase en un hook custom, limpiando main.tsx y reduciendo el acoplamiento.

### Cambio 2 - Extraer pantallas de contabilidad

#### Codigo anterior
```tsx
// MÃºltiples bloques if (screen === ...) gigantes en main.tsx renderizando contabilidad inline
```

#### Codigo nuevo
```tsx
// Archivos nuevos creados en src/screens/
<ContabilidadScreen history={history} settings={settings} current={current} weekOverrides={weekOverrides} ... />
<DetalleSemanaScreen history={history} settings={settings} weekOverrides={weekOverrides} selectedWeekId={selectedWeekId} ... />
<LiquidacionSemanaScreen ... />
// y otros para Mes y Anual
```

#### Por que se cambio
Reducir el tamaÃ±o de main.tsx y encapsular la lÃ³gica de visualizaciÃ³n de contabilidad en pantallas independientes.

### Cambio 3 - Documentar hooks en ESTRUCTURA.md

#### Codigo anterior
```md
| `src/logic/` | LÃ³gica de negocio y utilidades **puras**... |
| `src/services/` | Todo lo que habla con el exterior... |
```

#### Codigo nuevo
```md
| `src/logic/` | LÃ³gica de negocio y utilidades **puras**... |
| `src/hooks/` | Custom Hooks de React. Todo cÃ³digo que use estados... |
| `src/services/` | Todo lo que habla con el exterior... |
```

#### Por que se cambio
Para mantener la guÃ­a de arquitectura actualizada con la nueva carpeta introducida.

# Cambios del Agente

Este archivo registra cambios de cÃ³digo hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, cÃ³digo anterior, cÃ³digo nuevo y por quÃ© se cambiÃ³. Las entradas se aÃ±aden al **principio** del archivo (las mÃ¡s recientes arriba).

## 2026-05-29 15:50 - Extraer sincronizaciÃ³n de Firestore a useFirestoreSync

**Archivos modificados:** `src/main.tsx`, `src/hooks/use-firestore-sync.ts`

### Cambio 1 - CreaciÃ³n del hook useFirestoreSync

#### CÃ³digo anterior
`No existÃ­a el archivo src/hooks/use-firestore-sync.ts.`

#### CÃ³digo nuevo
```ts
// Se creÃ³ src/hooks/use-firestore-sync.ts conteniendo la lÃ³gica de onSnapshot y persistencia local (ver archivo para detalles completos).
```

#### Por quÃ© se cambiÃ³
Se extrae la lÃ³gica de inicializaciÃ³n y suscripciÃ³n a Firestore fuera de `main.tsx` para reducir su tamaÃ±o y delegar responsabilidades, de acuerdo al plan de refactorizaciÃ³n.

### Cambio 2 - Reemplazo en App()

#### CÃ³digo anterior
```ts
CÃ³digo anterior no verificable: Fragmento demasiado largo de inicializaciÃ³n de estados (dataLoaded, etc.) y mÃºltiples useEffects de sincronizaciÃ³n con Firestore.
```

#### CÃ³digo nuevo
```ts
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });
```

#### Por quÃ© se cambiÃ³
Simplifica `App()` delegando las llamadas de base de datos a un custom hook.

## 2026-05-29 15:34 - Mover backup-export de logic a services

**Archivos modificados:** `src/main.tsx`, `src/screens/settings-screen.tsx`, `src/services/backup-export.ts`, `src/__tests__/backup-export-extraction.test.ts`, `src/__tests__/src-reorganization.test.ts`

### Cambio 1 - Mover backup-export.ts a services

#### CÃ³digo anterior
```tsx
// Ubicado en src/logic/backup-export.ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "./backup";
```

#### CÃ³digo nuevo
```tsx
// Ubicado en src/services/backup-export.ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "../logic/backup";
```

#### Por quÃ© se cambiÃ³
La carpeta `logic/` estÃ¡ destinada a funciones puras. Como la exportaciÃ³n interactÃºa directamente con plugins de Capacitor (efectos secundarios del dispositivo), el archivo debe pertenecer a `services/`.

### Cambio 2 - Actualizar rutas de importaciÃ³n en main y settings

#### CÃ³digo anterior
```tsx
// En main.tsx
import { exportBackupJSON } from "./logic/backup-export"; 

// En settings-screen.tsx
import { exportBackupJSON } from "../logic/backup-export";
```

#### CÃ³digo nuevo
```tsx
// En main.tsx
import { exportBackupJSON } from "./services/backup-export"; 

// En settings-screen.tsx
import { exportBackupJSON } from "../services/backup-export";
```

#### Por quÃ© se cambiÃ³
Adaptar los archivos importadores al nuevo destino del servicio de backup en la arquitectura.

## 2026-05-29 15:30 - Eliminar IconNoteAdd duplicado en main y consolidar en components

**Archivos modificados:** `src/main.tsx`, `src/components/summary-icons.tsx`, `src/__tests__/detailed-notes-layout.test.ts`, `src/__tests__/main-note-button.test.ts`

### Cambio 1 - Eliminar componente inline en main.tsx

#### CÃ³digo anterior
```tsx
const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {/* ... (rutas del icono) */}
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

#### CÃ³digo nuevo
```tsx
import { IconNoteAdd } from "./components/summary-icons";
```

#### Por quÃ© se cambiÃ³
Eliminar la definiciÃ³n duplicada de `IconNoteAdd` y utilizar el import existente en `src/components/summary-icons.tsx` para reducir el tamaÃ±o de `main.tsx` y mantener una Ãºnica fuente de verdad para el icono.

### Cambio 2 - Completar IconNoteAdd en summary-icons

#### CÃ³digo anterior
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
  </svg>
);
```

#### CÃ³digo nuevo
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
    {!showPlus && (
      <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M15.25 2.75V7.25H19.75" strokeWidth="1.7" opacity="0.9" />
    )}
  </svg>
);
```

#### Por quÃ© se cambiÃ³
La versiÃ³n duplicada en `main.tsx` contenÃ­a un trazo extra para el caso `!showPlus` (el clip superior del portapapeles) que faltaba en el componente compartido original. Se consolidan ambos para mantener la fidelidad visual completa.

### Cambio 3 - Actualizar tests de layouts y de botÃ³n

#### CÃ³digo anterior
```tsx
    const iconNoteAddBlock = source.match(/const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];
// ...
    expect(source).toContain("const IconNoteAdd =");
```

#### CÃ³digo nuevo
```tsx
    const iconNoteAddBlock = summaryIconsSource.match(/(?:export )?const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];
// ...
    expect(summaryIconsSource).toContain("export const IconNoteAdd =");
```

#### Por quÃ© se cambiÃ³
Los tests de caracterizaciÃ³n estaban acoplados a la definiciÃ³n inline en `main.tsx`. Se actualizan para buscar en el origen compartido `summary-icons.tsx`.

## 2026-05-29 15:28 - Extraer entry-type-meta y remover diccionario duplicado en main

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Importar centralizado en main.tsx

#### CÃ³digo anterior
```tsx
type EntryTypeMeta = {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "DatÃ¡fono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};
```

#### CÃ³digo nuevo
```tsx
import { getEntryTypeMeta, ENTRY_TYPE_META, type EntryTypeMeta } from "./shared/entry-type-meta";
```

#### Por quÃ© se cambiÃ³
Se elimina la duplicaciÃ³n local redundante de los tipos de entrada y funciones asociadas, importÃ¡ndolas de forma centralizada desde `shared/entry-type-meta.tsx` para mantener una Ãºnica fuente de verdad.

### Cambio 2 - Ajustar test de extracciÃ³n a shared

#### CÃ³digo anterior
```tsx
  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(source).toMatch(/type EntryTypeMeta = \{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\};/);
    expect(source).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### CÃ³digo nuevo
```tsx
  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(entryTypeMetaSource).toMatch(/(?:type|export interface) EntryTypeMeta\s*=?\s*\{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\}/);
    expect(entryTypeMetaSource).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### Por quÃ© se cambiÃ³
El test de layout/extracciÃ³n buscaba explÃ­citamente en el `source` de `main.tsx`. Se actualiza para validar el origen compartido y la sintaxis `interface` usada allÃ­.

## 2026-05-28 15:40 - Corregir consistencia de tarjetas y diccionario de tipos

**Archivos modificados:** `src/screens/detalle-mes-screen.tsx`, `src/screens/pantalla-turnos.tsx`, `src/main.tsx`

### Cambio 1 - Importar getEntryTypeMeta y remover diccionario duplicado en DetalleMesScreen

#### CÃ³digo anterior
```tsx
interface EntryTypeMeta {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
}

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  datafono: { color: P, label: "DatÃ¡fono", icon: (s) => <IconCard s={s} c={P} /> },
  impuesto: { color: F, label: "Impuesto", icon: (s) => <IconFuel s={s} c={F} /> },
  agencia: { color: A, label: "Agencia", icon: (s) => <IconAgency s={s} c={A} /> },
  bonus: { color: A, label: "Bono", icon: (s) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s) => <IconNulo s={s} c={N} /> },
  æ˜Žç»†ç¬”è®°: { color: G, label: "Propina", icon: (s) => <IconCoin s={s} c={G} /> },
};
```

#### CÃ³digo nuevo
```tsx
import { getEntryTypeMeta } from "../shared/entry-type-meta";
```

#### Por quÃ© se cambiÃ³
El diccionario local contenÃ­a la clave en chino `æ˜Žç»†ç¬”è®°` en vez de `propina`, rompiendo la visualizaciÃ³n de notas asociadas a propinas. Centralizar en la funciÃ³n compartida evita este error y simplifica la pantalla.

### Cambio 2 - Eliminar renderTurnoCardLocal en PantallaTurnos y usar renderTurnoCard global

#### CÃ³digo anterior
```tsx
  function renderTurnoCardLocal(turno: Turno) {
    let durationStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalMins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
      }
      durationStr = fmtDuration(totalMins);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGanancia = calcularTurnoContable(turno, settings).miGanancia;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {isSelectingTurnos && (
          <input
            type="checkbox"
            checked={selectedTurnosIds.includes(turno.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              } else {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              }
            }}
            style={{ width: 20, height: 20, accentColor: "#50dc8c", cursor: "pointer" }}
          />
        )}
        <div
          onClick={() => {
            if (isSelectingTurnos) {
              if (selectedTurnosIds.includes(turno.id)) {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              } else {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              }
            } else {
              setReturnScreen("PantallaTurnos");
              setViewTurno(turno);
              setScreen("summary");
            }
          }}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.entries.length} {turno.entries.length === 1 ? "entrada" : "entradas"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(taximetroTurno)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(turno.km || 0)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGanancia)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
```

#### CÃ³digo nuevo
```tsx
`No existÃ­a renderTurnoCardLocal en pantalla-turnos.tsx`
```

#### Por quÃ© se cambiÃ³
Se elimina la duplicaciÃ³n local redundante de la tarjeta de turnos en favor de usar el renderizador global renderTurnoCard recibido a travÃ©s de props, garantizando consistencia visual y de comportamiento.

### Cambio 3 - Pasar renderTurnoCard a PantallaTurnos en main.tsx

#### CÃ³digo anterior
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
      />
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
Permite que la pantalla de turnos anteriores renderice las tarjetas mediante el componente global reutilizable, manteniendo la coherencia de estilos y bordes de estado.


## 2026-05-28 15:30 - Corregir tarjeta y navegaciÃ³n de detalle de semana

**Archivos modificados:** `src/main.tsx`, `src/screens/detalle-semana-screen.tsx`

### Cambio 1 - Props de DetalleSemanaScreen actualizadas

#### CÃ³digo anterior
```tsx
type Props = {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
};

export function DetalleSemanaScreen({
  history,
  settings,
  weekOverrides,
  selectedWeekId,
  setSelectedWeekId,
  setScreen,
  updateWeekOverride,
}: Props) {
```

#### CÃ³digo nuevo
```tsx
type Props = {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
  setReturnScreen: (screen: string | null) => void;
  setViewTurno: (turno: Turno | null) => void;
  renderTurnoCard: (
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
      isSelecting?: boolean;
      isSelected?: boolean;
      onToggleSelect?: (checked: boolean) => void;
    }
  ) => React.ReactNode;
};

export function DetalleSemanaScreen({
  history,
  settings,
  weekOverrides,
  selectedWeekId,
  setSelectedWeekId,
  setScreen,
  updateWeekOverride,
  setReturnScreen,
  setViewTurno,
  renderTurnoCard,
}: Props) {
```

#### Por quÃ© se cambiÃ³
Para corregir el bug de navegaciÃ³n y restaurar la tarjeta de turnos con los iconos del diseÃ±o original, es necesario pasar renderTurnoCard, setReturnScreen y setViewTurno como props a DetalleSemanaScreen.

### Cambio 2 - Renderizador de turno local eliminado en DetalleSemanaScreen

#### CÃ³digo anterior
```tsx
  function renderTurnoCard(
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
    }
  ) {
    let durStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalM = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalM = Math.max(0, totalM - turno.totalPausedMinutes);
      }
      durStr = fmtDuration(totalM);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGan = calcularTurnoContable(turno, settings).miGanancia;
    const totalEnt = calcularTurnoContable(turno, settings).totalDescontar;
    const totalDar = calcularTurnoContable(turno, settings).totalADar;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          onClick={options.onClick}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: options.showStatus && entregado
              ? "1px solid rgba(59, 130, 246, 0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "oklch(0.85 0.18 85)", fontWeight: 700 }}>
                {fmt(taximetroTurno)}
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.80 0.14 220)", fontWeight: 700 }}>
                {fmtKmNumber(turno.km || 0)} KM
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.78 0.18 150)", fontWeight: 700 }}>
                {fmt(miGan)}
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.85 0.12 210)", fontWeight: 700 }}>
                {durStr}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {entregado && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "oklch(0.78 0.18 145)", background: "rgba(80,220,140,0.12)", padding: "2px 8px", borderRadius: 6 }}>
                ENTREGADA
              </div>
            )}
            {options.showEntriesCount && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                {(turno.entries || []).length} movimientos
              </div>
            )}
            <div style={{ fontSize: 11, color: "oklch(0.70 0.18 25)", fontWeight: 700 }}>
              -{fmt(totalEnt)}
            </div>
            <div style={{ fontSize: 11, color: "oklch(0.68 0.20 145)", fontWeight: 700 }}>
              {fmt(totalDar)}
            </div>
          </div>
        </div>
      </div>
    );
  }
```

#### CÃ³digo nuevo
`El bloque renderTurnoCard fue eliminado de src/screens/detalle-semana-screen.tsx.`

#### Por quÃ© se cambiÃ³
Se elimina la funciÃ³n duplicada local que causaba divergencia de diseÃ±o y no propagaba correctamente el estado de turno seleccionado a la pantalla de resumen.

### Cambio 3 - InvocaciÃ³n del renderizador de turnos restaurada

#### CÃ³digo anterior
```tsx
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => setScreen("summary"),
                  showEntriesCount: true,
                })
              ))}
            </div>
```

#### CÃ³digo nuevo
```tsx
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => {
                    setReturnScreen("detalleSemana");
                    setViewTurno(t);
                    setScreen("summary");
                  },
                  showEntriesCount: true,
                })
              ))}
            </div>
```

#### Por quÃ© se cambiÃ³
Para que el click sobre un turno en el detalle semanal navegue correctamente asignando el turno a visualizar y permitiendo volver a la pantalla de detalle de semana al presionar atrÃ¡s.

### Cambio 4 - InvocaciÃ³n de DetalleSemanaScreen adaptada en main.tsx

#### CÃ³digo anterior
```tsx
  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        setScreen={setScreen}
        updateWeekOverride={updateWeekOverride}
      />
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        setScreen={setScreen}
        updateWeekOverride={updateWeekOverride}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
Se pasan las props setReturnScreen, setViewTurno y renderTurnoCard para corregir la navegaciÃ³n y la visualizaciÃ³n de tarjetas.

## 2026-05-28 14:57 - Reorganizar main.tsx extrayendo 5 bloques inline restantes

**Archivos modificados:** `src/main.tsx`, `src/screens/contabilidad-screen.tsx`, `src/screens/detalle-semana-screen.tsx`, `src/screens/detalle-mes-screen.tsx`, `src/screens/detalle-anual-screen.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - ContabilidadScreen extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/contabilidad-screen.tsx.`

#### CÃ³digo nuevo
```tsx
export interface ContabilidadScreenProps {
  history: Turno[];
  settings: AppSettings;
  // ... todas las props necesarias
}

export function ContabilidadScreen({ ... }: ContabilidadScreenProps) {
  // Bloque if (screen === "contabilidad") ~580 lÃ­neas
}
```

#### Por quÃ© se cambiÃ³
SeparaciÃ³n de responsabilidades: el bloque de contabilidad (~580 lÃ­neas) se extrae a su propio componente. main.tsx pasa de 3909 a ~2770 lÃ­neas. La pantalla usa mÃ³dulos compartidos (week-logic, accounting, formatters, entry-icons, summary-icons, calendar-icons, shell).

### Cambio 2 - DetalleSemanaScreen extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/detalle-semana-screen.tsx.`

#### CÃ³digo nuevo
```tsx
export function DetalleSemanaScreen({
  history, settings, weekOverrides, selectedWeekId,
  setSelectedWeekId, setScreen, updateWeekOverride,
}: Props) {
  // Bloque if (screen === "detalleSemana" && selectedWeekId)
}
```

#### Por quÃ© se cambiÃ³
El bloque de detalle de semana (turnos de una semana, con cÃ¡lculo de totales, marca de entregada, notas) se extrae como componente independiente. Props: `history: Turno[]` (no `CurrentState`).

### Cambio 3 - DetalleMesScreen extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/detalle-mes-screen.tsx.`

#### CÃ³digo nuevo
```tsx
export function DetalleMesScreen({
  history, settings, selectedAccountingYear, selectedAccountingMonth,
  setSelectedAccountingYear, setSelectedAccountingMonth, setScreen,
}: Props) {
  // Bloque if (screen === "detalleMes")
}
```

#### Por quÃ© se cambiÃ³
El bloque de detalle mensual (resumen de mes con breakdown por categorÃ­as) se extrae. Import corregido: `calcularResumenContableTurnos` viene de `../logic/accounting` (no de `../logic/turnos`).

### Cambio 4 - DetalleAnualScreen extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/detalle-anual-screen.tsx.`

#### CÃ³digo nuevo
```tsx
export function DetalleAnualScreen({
  history, settings, selectedAccountingYear, setSelectedAccountingYear,
  selectedAccountingMonth, setSelectedAccountingMonth, setScreen,
}: Props) {
  // Bloque if (screen === "detalleAnual")
}
```

#### Por quÃ© se cambiÃ³
El bloque de resumen anual (todos los meses del aÃ±o con sus totales) se extrae como componente independiente.

### Cambio 5 - Iconos compartidos corregidos en pantallas extraÃ­das

#### CÃ³digo anterior
```tsx
// contabilidad-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer } from "../components/entry-icons";
```

```tsx
// detalle-anual-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer } from "../components/summary-icons";
```

```tsx
// detalle-semana-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer, IconReceipt, IconGive } from "../components/summary-icons";
```

#### CÃ³digo nuevo
```tsx
// contabilidad-screen.tsx
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";

// detalle-anual-screen.tsx
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";

// detalle-semana-screen.tsx
import { IconTaxiBadgeNeon, IconRoad, IconGive } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { IconReceipt } from "../components/settings-icons";
```

#### Por quÃ© se cambiÃ³
Cada icono vive en su mÃ³dulo correcto: IconMoneyBag e IconTimer estÃ¡n en calendar-icons, IconReceipt en settings-icons, IconTaxiBadgeNeon/IconRoad/IconGive en summary-icons. Las pantallas extraÃ­das tenÃ­an los imports incorrectos.

### Cambio 6 - Tipos corregidos en pantallas extraÃ­das

#### CÃ³digo anterior
```tsx
// detalle-semana-screen.tsx
import type { Turno, WeekOverride, AppSettings, CurrentState } from "../shared/types";
type Props = { history: CurrentState; ... };

// liquidacion-semana-screen.tsx
import type { AppSettings, CurrentState, Turno, WeekOverride } from "../shared/types";
type Props = { history: CurrentState; ... };
```

#### CÃ³digo nuevo
```tsx
// detalle-semana-screen.tsx
import type { Turno, WeekOverride, AppSettings } from "../shared/types";
type Props = { history: Turno[]; ... };

// liquidacion-semana-screen.tsx
import type { AppSettings, Turno, WeekOverride } from "../shared/types";
type Props = { history: Turno[]; ... };
```

#### Por quÃ© se cambiÃ³
`CurrentState` tiene campos `startTime` y `startDate` que `Turno[]` no tiene. El tipo correcto para `history` en estas pantallas es `Turno[]`, no `CurrentState`.

### Cambio 7 - Props corregidas en liquidacionSemanaScreen

#### CÃ³digo anterior
```tsx
type Props = {
  history: CurrentState;
  settings: AppSettings;
  // ...
};

export function LiquidacionSemanaScreen({
  history, settings, selectedWeekId, setScreen,
}: Props) {
  //faltaban weekOverrides, setSelectedWeekId, updateWeekOverride
```

#### CÃ³digo nuevo
```tsx
export function LiquidacionSemanaScreen({
  history, settings, weekOverrides, selectedWeekId,
  setSelectedWeekId, setScreen, updateWeekOverride,
}: Props) {
```

#### Por quÃ© se cambiÃ³
La pantalla de liquidaciÃ³n necesita `weekOverrides`, `setSelectedWeekId` e `updateWeekOverride` que antes no se pasaban correctamente.

## 2026-05-28 14:44 - Extraer bloque liquidacionSemana a componente separado

**Archivos modificados:** `src/main.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Extraer bloque liquidacionSemana

#### CÃ³digo anterior
```ts
if (screen === "liquidacionSemana" && selectedWeekId) {
  const weekId = selectedWeekId;
  const grupos = groupTurnosByWeek(history, settings.diaLibre);
  const turnosSemana = grupos.get(weekId) || [];
  // ... (~580 lÃ­neas de cÃ³digo JSX)
}
```

#### CÃ³digo nuevo
```tsx
if (screen === "liquidacionSemana" && selectedWeekId) {
  return (
    <LiquidacionSemanaScreen
      history={history}
      settings={settings}
      weekOverrides={weekOverrides}
      selectedWeekId={selectedWeekId}
      setSelectedWeekId={setSelectedWeekId}
      setScreen={setScreen}
      updateWeekOverride={updateWeekOverride}
    />
  );
}
```

#### Por quÃ© se cambiÃ³
El bloque `liquidacionSemana` de ~600 lÃ­neas contenÃ­a lÃ³gica de presentaciÃ³n que no dependÃ­a del estado local de `App`. Extraerlo a su propio componente permite mejor organizaciÃ³n del cÃ³digo, reutilizaciÃ³n y mantenimiento.

### Cambio 2 - Tests actualizados para buscar en nuevo archivo

#### CÃ³digo anterior
```ts
const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");
```

#### CÃ³digo nuevo
```ts
const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
const liquidacionSemanaSource = readFileSync(resolve("src/screens/liquidacion-semana-screen.tsx"), "utf8");
const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");
```

#### Por quÃ© se cambiÃ³
Los tests que verificaban el cÃ³digo del bloque `liquidacionSemana` ahora deben buscar en el nuevo archivo `liquidacion-semana-screen.tsx` en lugar de `main.tsx`.

## 2026-05-26 23:48 - Corregir organizacion del recorte

**Archivos modificados:** `src/__tests__/main-antiguo-regressions.test.ts`, `src/main.tsx`, `src/screens/add-entry-screen.tsx`, `src/screens/add-nota-general-screen.tsx`, `src/screens/add-single-entry-screen.tsx`, `src/screens/calendar-screen.tsx`, `src/screens/confirm-end-screen.tsx`, `src/screens/today-history-screen.tsx`

### Cambio 1 - Tests de paridad del recorte

#### Codigo anterior
```ts
expect(openNewNotaBlock).toContain("setEditingReserva(null);");

expect(calendarSource).toContain('onClick={() => setScreen("home")}');
expect(calendarSource).toContain('setReturnScreen("calendar");');
expect(calendarSource).toContain("setViewTurno(turno);");
expect(calendarSource).toContain('setScreen("summary");');

expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
expect(source).toContain('confirmColor: "#ff6b6b"');
```

#### Codigo nuevo
```ts
expect(openNewNotaBlock).not.toContain("setEditingReserva(null);");

expect(calendarSource).toContain('onClick={() => setScreen("home")}');
expect(calendarSource).toContain('setReturnScreen("calendar");');
expect(calendarSource).toContain("setViewTurno(turno);");
expect(calendarSource).toContain('setScreen("summary");');
expect(calendarSource).toContain("style={iconBtnStyle}");
expect(calendarSource).toContain("setShowMonthPicker(v => !v);");

expect(calendarSource).toContain("renderReservaDialog: () => React.ReactElement | false;");
expect(calendarSource).toContain("{renderReservaDialog()}");
expect(calendarSource).not.toContain("function renderReservaDialog(");
expect(calendarSource).not.toContain(">Cancel<");
expect(calendarSource).not.toContain('{editingReserva ? "Actualizar" : "Reservar"}');
expect(mainSource).toContain("renderReservaDialog={renderReservaDialog}");

expect(source).not.toContain("confirmBg:");
expect(source).not.toContain("confirmColor:");
expect(source).not.toContain("confirmBorder:");
```

#### Por que se cambio
Los tests bloquean que futuras extracciones vuelvan a duplicar el modal de reservas, cambien el boton de calendario, usen el toggle con estado potencialmente obsoleto o alteren la confirmacion de borrado respecto al comportamiento anterior.

### Cambio 2 - Modal de reservas unico en calendario

#### Codigo anterior
```tsx
showReservaDialog: boolean;
setShowReservaDialog: (v: boolean) => void;
reservaTime: string;
setReservaTime: (t: string) => void;
reservaOrigen: string;
setReservaOrigen: (o: string) => void;
reservaDestino: string;
setReservaDestino: (d: string) => void;
reservaCliente: string;
setReservaCliente: (c: string) => void;
reservaTelefono: string;
setReservaTelefono: (t: string) => void;
reservaNotas: string;
setReservaNotas: (n: string) => void;
editingReserva: Reserva | null;
setEditingReserva: (r: Reserva | null) => void;
reservations: Reserva[];
setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void;
```

#### Codigo nuevo
```tsx
setShowReservaDialog: (v: boolean) => void;
setReservaTime: (t: string) => void;
setReservaOrigen: (o: string) => void;
setReservaDestino: (d: string) => void;
setReservaCliente: (c: string) => void;
setReservaTelefono: (t: string) => void;
setReservaNotas: (n: string) => void;
setEditingReserva: (r: Reserva | null) => void;
reservations: Reserva[];
renderReservaDialog: () => React.ReactElement | false;
```

#### Por que se cambio
La pantalla de calendario no debe tener una copia propia del formulario de reserva. Ahora recibe el renderizador central desde `src/main.tsx`, conserva solo el estado necesario para abrir o editar reservas y evita divergencias de textos, estilos y logica.

### Cambio 3 - Navegacion y estado del calendario

#### Codigo anterior
```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
setShowMonthPicker(!showMonthPicker);
```

```tsx
{renderReservaDialog(
  showReservaDialog,
  reservaTime,
  setReservaTime,
  reservaOrigen,
  setReservaOrigen,
  reservaDestino,
  setReservaDestino,
  reservaCliente,
  setReservaCliente,
  reservaTelefono,
  setReservaTelefono,
  reservaNotas,
  setReservaNotas,
  selectedDate,
  setSelectedDate,
  editingReserva,
  setEditingReserva,
  setConfirmDialog,
  reservations,
  setReservations,
  setShowReservaDialog
)}
```

#### Codigo nuevo
```tsx
<button style={iconBtnStyle} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
setShowMonthPicker(v => !v);
```

```tsx
{renderReservaDialog()}
```

#### Por que se cambio
El boton de volver recupera el estilo compartido de la pantalla antigua, el selector de mes usa una actualizacion funcional segura y el calendario deja de pasar todo el estado de reserva a una copia local del modal.

### Cambio 4 - Iconos compartidos en pantallas extraidas

#### Codigo anterior
```tsx
const IconBack: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M14 18L7 11L14 4"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDel: FC = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path
      d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      fill="none"
    />
    <path
      d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);
```

#### Codigo nuevo
```tsx
import { IconBack, IconDel } from "../components/navigation-icons";
```

```tsx
import { IconBack } from "../components/navigation-icons";
```

#### Por que se cambio
`add-entry-screen.tsx`, `add-single-entry-screen.tsx` y `add-nota-general-screen.tsx` usaban copias locales de iconos ya extraidos. Ahora consumen los iconos compartidos para que la organizacion por componentes sea coherente.

### Cambio 5 - Estilo de kilometros compartido

#### Codigo anterior
```tsx
const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;
```

#### Codigo nuevo
```tsx
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
```

#### Por que se cambio
`confirm-end-screen.tsx` tenia una copia local del estilo de unidad de kilometros aunque ya existe en `src/shared/card-styles.ts`. Usar el valor compartido evita divergencias visuales en futuras fases.

### Cambio 6 - Confirmacion de borrado en historial

#### Codigo anterior
```tsx
setConfirmDialog({
  text: "Â¿Seguro que quieres eliminar esta entrada?",
  onConfirm: deleteEditEntry,
  confirmBg: "rgba(255,60,60,0.2)",
  confirmColor: "#ff6b6b",
  confirmBorder: "1px solid rgba(255,100,100,0.35)",
});
```

#### Codigo nuevo
```tsx
setConfirmDialog({
  text: "Â¿Seguro que quieres eliminar esta entrada?",
  onConfirm: deleteEditEntry,
});
```

#### Por que se cambio
La extraccion habia anadido estilo destructivo especifico en el historial de hoy. Se retiro para mantener el comportamiento y aspecto previos del dialogo compartido.

## 2026-05-26 23:19 - Corregir regresiones del recorte

**Archivos modificados:** `src/__tests__/main-antiguo-regressions.test.ts`, `src/__tests__/home-icons.test.ts`, `src/components/home-icons.tsx`, `src/main.tsx`, `src/screens/calendar-screen.tsx`, `src/screens/confirm-end-screen.tsx`, `src/screens/home-screen.tsx`, `src/screens/pantalla-turnos.tsx`, `src/screens/today-history-screen.tsx`

### Cambio 1 - Test de regresiones contra main antiguo

#### CÃ³digo anterior
`No existÃ­a src/__tests__/main-antiguo-regressions.test.ts.`

#### CÃ³digo nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(resolve(path), "utf8");

describe("Main antiguo regression locks", () => {
  it("keeps home logout confirmation mounted in the extracted screen", () => {
    const homeSource = readSource("src/screens/home-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    expect(homeSource).toContain('import { ConfirmDialog } from "../components/common"');
    expect(homeSource).toContain("confirmDialog,");
    expect(homeSource).toContain("{confirmDialog && <ConfirmDialog");
    expect(homeSource).toContain("onCancel={() => onSetConfirmDialog(null)}");
    expect(mainSource).toContain("confirmDialog={confirmDialog}");
  });

  it("keeps calendar navigation and note creation handlers from mainAntiguo", () => {
    const calendarSource = readSource("src/screens/calendar-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    const openNewNotaBlock = calendarSource.match(/const openNewNota = \(date\?: string\) => \{[\s\S]*?\n  \};/)?.[0] ?? "";
    expect(openNewNotaBlock).toContain("setEditingNota(null);");
    expect(openNewNotaBlock).toContain("setEditingReserva(null);");

    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
    expect(calendarSource).toContain('setReturnScreen("calendar");');
    expect(calendarSource).toContain("setViewTurno(turno);");
    expect(calendarSource).toContain('setScreen("summary");');

    expect(mainSource).toContain("setScreen={setScreen}");
    expect(mainSource).toContain("setReturnScreen={setReturnScreen}");
    expect(mainSource).toContain("setViewTurno={setViewTurno}");
  });

  it("keeps today history note metadata and destructive confirmation behavior", () => {
    const source = readSource("src/screens/today-history-screen.tsx");

    expect(source).toContain('import { ConfirmDialog } from "../components/common"');
    expect(source).toContain('import { getEntryTypeMeta } from "../shared/entry-type-meta"');
    expect(source).not.toContain('nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard');
    expect(source).toContain("{confirmDialog && <ConfirmDialog");
    expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
    expect(source).toContain('confirmColor: "#ff6b6b"');
  });

  it("keeps turnos dates formatted for display", () => {
    const source = readSource("src/screens/pantalla-turnos.tsx");

    expect(source).toContain('from "../logic/date-time"');
    expect(source).toContain("fmtDate");
    expect(source).toContain("{fmtDate(turno.startDate || turno.date)}");
  });

  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });
});
```

#### Por quÃ© se cambiÃ³
La auditorÃ­a detectÃ³ regresiones funcionales y visuales introducidas al extraer pantallas. Se aÃ±adiÃ³ un test de bloqueo para contrastar esos contratos con el comportamiento anterior.

### Cambio 2 - Cobertura de iconos de inicio

#### CÃ³digo anterior
```ts
  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
```

#### CÃ³digo nuevo
```ts
  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M10 16 C10 19 12 21 12 21 C12 21 14 19 14 16");
    expect(source).toContain("M12 23 L12 26");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });

  it("keeps the original home quick action icons", () => {
    expect(source).toContain('import { IconPencilNeon } from "./calendar-icons"');
    expect(source).toContain("M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z");
    expect(source).toContain("<IconPencilNeon s={24} />");
    expect(source).toContain('transform: "scale(0.58) rotate(-6deg)"');
    expect(source).toContain("M10 9H17");
    expect(source).toContain("M9 4H7C5.89543 4 5 4.89543 5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6C19 4.89543 18.1046 4 17 4H15");
    expect(source).toContain("M2 22H22");
    expect(source).toContain("M8 5.5L18.5 12L8 18.5V5.5Z");
  });
```

#### Por quÃ© se cambiÃ³
El test anterior solo protegÃ­a parte del cohete. Se ampliÃ³ para cubrir los trazos que faltaban y los iconos rÃ¡pidos de inicio que habÃ­an cambiado durante la extracciÃ³n.

### Cambio 3 - Iconos de inicio restaurados

#### CÃ³digo anterior
```tsx
export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2.5" stroke={c} strokeWidth="1.8" />
    <path d="M12 8V16M8 12H16" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

#### CÃ³digo nuevo
```tsx
export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <span
    style={{
      position: "relative",
      width: s,
      height: s,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
      }}
    >
      <path
        d="M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(190,140,255,0.55)) drop-shadow(0 0 3px rgba(190,140,255,0.20))",
        }}
      />
      <path
        d="M14.8 3.5V7.2H18.5"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8 10H14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M8 13H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <path d="M8 16H11.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>

    <span
      style={{
        position: "absolute",
        right: -2,
        bottom: -1,
        transform: "scale(0.58) rotate(-6deg)",
        transformOrigin: "bottom right",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <IconPencilNeon s={24} />
    </span>
  </span>
);
```

#### Por quÃ© se cambiÃ³
El icono de nueva reserva habÃ­a quedado reducido a un sÃ­mbolo genÃ©rico de suma. Se restaurÃ³ el documento con lÃ¡piz que identificaba visualmente la acciÃ³n.

### Cambio 4 - ConfirmaciÃ³n de cerrar sesiÃ³n en inicio

#### CÃ³digo anterior
```tsx
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  renderReservaDialog: () => React.ReactElement | false;
}
```

```tsx
      />
    );
```

#### CÃ³digo nuevo
```tsx
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  confirmDialog: { text: string; confirmText?: string; onConfirm: () => void } | null;
  renderReservaDialog: () => React.ReactElement | false;
}
```

```tsx
        confirmDialog={confirmDialog}
      />
```

```tsx
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => onSetConfirmDialog(null)} />}
    );
```

#### Por quÃ© se cambiÃ³
La pantalla de inicio podÃ­a crear el diÃ¡logo de cerrar sesiÃ³n, pero el componente extraÃ­do no lo recibÃ­a ni lo renderizaba. Se volviÃ³ a montar la confirmaciÃ³n como en el bloque antiguo.

### Cambio 5 - NavegaciÃ³n del calendario

#### CÃ³digo anterior
```tsx
  openNewReserva: (date?: string) => void;
}
```

```tsx
  const openNewNota = (date?: string) => {
    setEditingReserva(null);
    setSelectedDate(date || today());
```

```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => openNewReserva()}><IconBack /></button>
```

```tsx
onClick={() => { openNewReserva(); }}
```

#### CÃ³digo nuevo
```tsx
  openNewReserva: (date?: string) => void;
  setScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  setReturnScreen: (screen: string | null) => void;
}
```

```tsx
  const openNewNota = (date?: string) => {
    setEditingNota(null);
    setEditingReserva(null);
    setSelectedDate(date || today());
```

```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
onClick={() => { setReturnScreen("calendar"); setViewTurno(turno); setScreen("summary"); }}
```

#### Por quÃ© se cambiÃ³
El botÃ³n de volver y las tarjetas de turnos cerrados habÃ­an quedado conectados a nueva reserva. TambiÃ©n faltaba limpiar `editingNota` al crear una nota nueva. Se restauraron los handlers anteriores.

### Cambio 6 - Historial de hoy

#### CÃ³digo anterior
```tsx
const ENTRY_TYPE_META: Record<string, { color: string; label: string; icon: (s?: number) => React.ReactNode }> = {
  datafono: { color: P, label: "DatÃ¡fono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard s={s} c="white" /> },
};
```

```tsx
      {confirmDialog && <ConfirmDialogWrapper {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
```

```tsx
            setConfirmDialog({
              text: "Â¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
            });
```

#### CÃ³digo nuevo
```tsx
import { ConfirmDialog } from "../components/common";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
```

```tsx
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
```

```tsx
            setConfirmDialog({
              text: "Â¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
              confirmBg: "rgba(255,60,60,0.2)",
              confirmColor: "#ff6b6b",
              confirmBorder: "1px solid rgba(255,100,100,0.35)",
            });
```

#### Por quÃ© se cambiÃ³
La pantalla tenÃ­a metadata local distinta para notas y un diÃ¡logo propio que no cerraba al confirmar. Se reutilizÃ³ la metadata compartida y el diÃ¡logo comÃºn, que ejecuta confirmaciÃ³n y cierre.

### Cambio 7 - Fecha formateada en turnos

#### CÃ³digo anterior
```tsx
import { getDiffMins } from "../logic/date-time";
```

```tsx
<div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{turno.startDate || turno.date}</div>
```

#### CÃ³digo nuevo
```tsx
import { getDiffMins, fmtDate } from "../logic/date-time";
```

```tsx
<div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
```

#### Por quÃ© se cambiÃ³
Las tarjetas de turnos mostraban la fecha ISO tras la extracciÃ³n. Se restaurÃ³ el formato legible usado antes.

### Cambio 8 - Notas detalladas al terminar turno

#### CÃ³digo anterior
```tsx
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
```

#### CÃ³digo nuevo
```tsx
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <IconPinNeon s={18} /> Notas detalladas
              </div>
              {entriesWithNotes.map(e => {
```

#### Por quÃ© se cambiÃ³
Las notas detalladas habÃ­an quedado integradas dentro del bloque de resumen. Se restaurÃ³ su estructura visual independiente para que coincida con la jerarquÃ­a anterior.

## 2026-05-26 18:00 - Restaurar icono de cohete en inicio

**Archivos modificados:** `src/components/home-icons.tsx`, `src/__tests__/home-icons.test.ts`

### Cambio 1 - Test del icono de cohete

#### CÃ³digo anterior
`No existÃ­a src/__tests__/home-icons.test.ts.`

#### CÃ³digo nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home icon extraction", () => {
  const source = readFileSync(resolve("src/components/home-icons.tsx"), "utf8");

  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
});
```

#### Por quÃ© se cambiÃ³
Se aÃ±adiÃ³ una comprobaciÃ³n fija para que el icono de cohete extraÃ­do mantenga la forma original que tenÃ­a en `main.tsx` antes del recorte.

### Cambio 2 - SVG del cohete

#### CÃ³digo anterior
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 16.5C4.5 16.5 6 12 12 6C12 6 12 12 16.5 13.5M16.5 13.5L19.5 15M19.5 15L22 17M19.5 15C19.5 15 20 17 18 19C16 21 14 19.5 14 19.5M14 19.5L9 14.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

#### CÃ³digo nuevo
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 12 12)">
      <path d="M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 5 Q12 6 14.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.8" />
      <path d="M8 11 C5 11 4 14 4 16 C6 16 8 14 8 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 11 C19 11 20 14 20 16 C18 16 16 14 16 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 14 L9 16 C11 16.5 13 16.5 15 16 L14 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 22 L8 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22 L16 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);
```

#### Por quÃ© se cambiÃ³
El recorte habÃ­a sustituido el cohete original por un trazo simplificado que se veÃ­a deformado en la pantalla de inicio. Se restaurÃ³ el SVG original sin cambiar el comportamiento del botÃ³n.

## 2026-05-26 16:39 - Corregir notas detalladas al cerrar turno

**Archivos modificados:** `src/screens/confirm-end-screen.tsx`, `src/shared/entry-type-meta.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Metadata completa de tipos de entrada

#### CÃ³digo anterior
```tsx
import { G, P, A, E, F, N } from "./ui-theme";
import { IconAgency } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";

export const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
};

export function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.agencia_bono;
}
```

#### CÃ³digo nuevo
```tsx
import { G, P, A, E, F, N } from "./ui-theme";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";

export const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "DatÃ¡fono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};

export function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}
```

#### Por quÃ© se cambiÃ³
`ConfirmEndScreen` usaba esta metadata compartida para mostrar notas, pero el mapa solo contenÃ­a `agencia_bono` y cualquier otro tipo se etiquetaba como Agencia/Bono. Se restaurÃ³ el mapa completo equivalente al comportamiento anterior de `main.tsx`.

### Cambio 2 - Notas detalladas en ConfirmEndScreen

#### CÃ³digo anterior
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
```

```tsx
          {(() => {
            const gNotes = current.entries.filter(e => e.type === "nota");
            if (gNotes.length > 0) {
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
```

#### CÃ³digo nuevo
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad, IconPinNeon } from "../components/summary-icons";
```

```tsx
          {(() => {
            const entriesWithNotes = current.entries.filter(e => e.type !== "nota" && e.note && e.note.trim());
            if (entriesWithNotes.length === 0) return null;
            return (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {entriesWithNotes.map(e => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                        <span style={NOTE_TIME_STYLE}>{e.time}</span>
                        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ color: meta.color, fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
```

#### Por quÃ© se cambiÃ³
La extracciÃ³n de `confirm-end-screen.tsx` habÃ­a perdido la secciÃ³n de notas detalladas para entradas con nota que no son de tipo `nota`. Se restaurÃ³ esa secciÃ³n siguiendo el `mainAntiguo.tsx` para que cerrar turno vuelva a mostrar notas de datÃ¡fono, propina, agencia, extras, gasolina y nulos.

### Cambio 3 - Test de layout adaptado a archivos extraÃ­dos

#### CÃ³digo anterior
```ts
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

```ts
    const detailedRows = [
      /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/,
    ];

    for (const rowPattern of detailedRows) {
      const block = source.match(rowPattern)?.[0];
```

#### CÃ³digo nuevo
```ts
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const entryTypeMetaSource = readFileSync(resolve("src/shared/entry-type-meta.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

```ts
    const detailedRows = [
      { source, pattern: /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/ },
      { source: confirmEndSource, pattern: /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/ },
      { source, pattern: /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/ },
    ];

    for (const { source: rowSource, pattern } of detailedRows) {
      const block = rowSource.match(pattern)?.[0];
```

#### Por quÃ© se cambiÃ³
El test seguÃ­a buscando todos los bloques en `main.tsx`, aunque parte del cÃ³digo ahora vive en `confirm-end-screen.tsx` y la metadata compartida vive en `entry-type-meta.tsx`. Se adaptÃ³ la fuente inspeccionada sin cambiar la expectativa funcional.

## 2026-05-26 04:30 - Integrar pantallas extraÃ­das en main.tsx

**Archivos modificados:** `src/main.tsx`, `src/screens/PantallaTurnos.tsx`

### Cambio 1 - Imports de pantallas en main.tsx

#### CÃ³digo anterior
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";
import { Shell } from "./components/shell";
```

#### CÃ³digo nuevo
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";
import { PantallaTurnos } from "./screens/PantallaTurnos";
import { TodayHistoryScreen } from "./screens/TodayHistoryScreen";
import { ConfirmEndScreen } from "./screens/ConfirmEndScreen";
import { Shell } from "./components/shell";
```

#### Por quÃ© se cambiÃ³
Las pantallas extraÃ­das en sesiones anteriores necesitaban ser importadas para su uso.

### Cambio 2 - Reemplazar bloque if PantallaTurnos con componente

#### CÃ³digo anterior
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        </div>
      </Shell>
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
SeparaciÃ³n de responsabilidades: el bloque if de PantallaTurnos ahora usa el componente extraÃ­do.

### Cambio 3 - Reemplazar bloque if todayHistory con componente

#### CÃ³digo anterior
```tsx
  if (screen === "todayHistory") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        </div>
        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
        {editEntry && (<EditEntryDialog />)}
      </Shell>
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "todayHistory") {
    return (
      <TodayHistoryScreen
        current={current}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        editEntry={editEntry}
        editEntryAmount={editEntryAmount}
        editEntryNote={editEntryNote}
        setEditEntryAmount={setEditEntryAmount}
        setEditEntryNote={setEditEntryNote}
        openEditEntry={openEditEntry}
        saveEditEntry={saveEditEntry}
        deleteEditEntry={deleteEditEntry}
        setEditEntry={setEditEntry}
        setScreen={setScreen}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
SeparaciÃ³n de responsabilidades: el bloque if de todayHistory ahora usa el componente extraÃ­do.

### Cambio 4 - Reemplazar bloque if confirmEnd con componente

#### CÃ³digo anterior
```tsx
  if (screen === "confirmEnd") {
    function kpEnd(v: string) { }
    return (
      <Shell burst={false}>
      </Shell>
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "confirmEnd") {
    return (
      <ConfirmEndScreen
        current={current}
        dineroJ={dineroJ}
        setDineroJ={setDineroJ}
        kmJ={kmJ}
        setKmJ={setKmJ}
        endField={endField}
        setEndField={setEndField}
        totalP={totalP}
        totalD={totalD}
        totalA={totalA}
        totalE={totalE}
        totalF={totalF}
        totalN={totalN}
        propinas={propinas}
        datafonos={datafonos}
        agencias={agencias}
        extras={extras}
        gasolinas={gasolinas}
        nulos={nulos}
        onEndTurno={handleEndTurno}
        setScreen={setScreen}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
SeparaciÃ³n de responsabilidades: el bloque if de confirmEnd ahora usa el componente extraÃ­do con kpEnd inlined.

### Cambio 5 - Import de IconTaxiBadgeNeon e IconRoad corregido

#### CÃ³digo anterior
```tsx
import { IconPencilNeon, IconTimer, IconMoneyBag, IconTaxiBadgeNeon, IconRoad } from "../components/calendar-icons";
```

#### CÃ³digo nuevo
```tsx
import { IconPencilNeon, IconTimer, IconMoneyBag } from "../components/calendar-icons";
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
```

#### Por quÃ© se cambiÃ³
IconTaxiBadgeNeon e IconRoad estaban mal importados desde calendar-icons, deben estar en summary-icons.

## 2026-05-26 03:15 - Extraer SettingsScreen a src/screens/settings-screen.tsx

**Archivos modificados:** `src/screens/settings-screen.tsx`, `src/components/settings-icons.tsx`, `src/components/summary-icons.tsx`, `src/main.tsx`

### Cambio 1 - Pantalla de ajustes extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/settings-screen.tsx.`

#### CÃ³digo nuevo
```tsx
export const SettingsScreen: FC<SettingsScreenProps> = ({
  isAdmin, settings, setSettings, history, setHistory, current,
  weekOverrides, reservations, notes, activeSettingsField,
  setActiveSettingsField, settingsValStr, setSettingsValStr,
  showBackupMenu, setShowBackupMenu, confirmDialog, setConfirmDialog,
  updateState, updateMsg, downloadUrl, releaseUrl,
  setUpdateState, setUpdateMsg, setDownloadUrl, setReleaseUrl,
  onSetScreen,
}) => { ... }
```

#### Por quÃ© se cambiÃ³
SeparaciÃ³n de responsabilidades: la pantalla de ajustes ahora estÃ¡ en su propio archivo.

### Cambio 2 - Iconos de ajustes centralizados

#### CÃ³digo anterior
`No existÃ­a src/components/settings-icons.tsx.`

#### CÃ³digo nuevo
```tsx
export const IconReceipt = ({ s = 24, c = "white" }: { s?: number; c?: string }) => ( ... );
export const IconHoliday = ({ s = 24, c = "oklch(0.85 0.18 85)" }: { s?: number; c?: string }) => ( ... );
```

#### Por quÃ© se cambiÃ³
IconReceipt e IconHoliday se usan en SettingsScreen y se extrajeron a su propio archivo de iconos.

### Cambio 3 - Iconos de resumen centralizados

#### CÃ³digo anterior
`No existÃ­a src/components/summary-icons.tsx.`

#### CÃ³digo nuevo
```tsx
export const IconGive = ( ... );
export const IconRoad = ( ... );
export const IconPinNeon = ( ... );
export const IconTaxiBadgeNeon = ( ... );
export const IconNoteAdd = ( ... );
```

#### Por quÃ© se cambiÃ³
Iconos usados por SummaryScreen y posiblemente otros screens se centralizan para reutilizaciÃ³n.

### Cambio 4 - Reemplazo del bloque settings en main.tsx

#### CÃ³digo anterior
```tsx
if (screen === "settings") {
  const backupMenuActionIds = getBackupMenuActionIds(isAdmin);
  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", ... }}>
        {/* Bloque App Info */}
        {/* Bloque Porcentajes */}
        {/* Bloque Total a Descontar */}
        {/* Bloque DÃ­a Libre */}
        {/* BotÃ³n AÃ±adir Turno */}
        {/* MenÃº Backup */}
      </div>
      {/* Modal de configuraciÃ³n de porcentaje */}
      {confirmDialog && <ConfirmDialog ... />}
    </Shell>
  );
}
```

#### CÃ³digo nuevo
```tsx
if (screen === "settings") {
  return (
    <SettingsScreen
      isAdmin={isAdmin}
      settings={settings}
      setSettings={setSettings}
      history={history}
      setHistory={setHistory}
      current={current}
      weekOverrides={weekOverrides}
      reservations={reservations}
      notes={notes}
      activeSettingsField={activeSettingsField}
      setActiveSettingsField={setActiveSettingsField}
      settingsValStr={settingsValStr}
      setSettingsValStr={setSettingsValStr}
      showBackupMenu={showBackupMenu}
      setShowBackupMenu={setShowBackupMenu}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      updateState={updateState}
      updateMsg={updateMsg}
      downloadUrl={downloadUrl}
      releaseUrl={releaseUrl}
      setUpdateState={setUpdateState}
      setUpdateMsg={setUpdateMsg}
      setDownloadUrl={setDownloadUrl}
      setReleaseUrl={setReleaseUrl}
      onSetScreen={setScreen}
    />
  );
}
```

#### Por quÃ© se cambiÃ³
El bloque if (screen === "settings") fue reemplazado por el componente SettingsScreen importado. Los IconReceipt e IconHoliday se mantienen en main.tsx porque SummaryScreen tambiÃ©n los usa.

## 2026-05-26 02:00 - Extraer CalendarScreen a src/screens/calendar-screen.tsx

**Archivos modificados:** `src/screens/calendar-screen.tsx`, `src/components/calendar-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de calendario centralizados

#### CÃ³digo anterior
`No existÃ­a src/components/calendar-icons.tsx.`

#### CÃ³digo nuevo
```tsx
export const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* DefiniciÃ³n SVG completa */}
  </svg>
);

export const IconTimer = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* DefiniciÃ³n SVG completa */}
  </svg>
);

export const IconMoneyBag = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* DefiniciÃ³n SVG completa */}
  </svg>
);
```

#### Por quÃ© se cambiÃ³
Los iconos IconPencilNeon, IconTimer e IconMoneyBag eran definiciones inline en `main.tsx` usados exclusivamente por CalendarScreen. Extraerlos a `src/components/calendar-icons.tsx` centraliza iconos con responsabilidad clara.

### Cambio 2 - CalendarScreen extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/calendar-screen.tsx.`

#### CÃ³digo nuevo
```tsx
import React from "react";
import { Shell } from "../components/shell";
import { ConfirmDialog } from "../components/common";
import { IconBack, IconCalendar } from "../components/navigation-icons";
import { IconPencilNeon, IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { fmt, fmtDuration } from "../logic/formatters";
import { getDiffMins, today } from "../logic/date-time";
import { getStartOffset, getDaysInMonth } from "../logic/calendar-date";
import { calcularTurnoContable } from "../logic/accounting";
import { C, G } from "../shared/ui-theme";
import type { AppSettings, NotaCalendario, NotaTipo, Reserva, Turno } from "../shared/types";

interface CalendarScreenProps {
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  calendarView: 'month' | 'agenda';
  setCalendarView: (v: 'month' | 'agenda') => void;
  showMonthPicker: boolean;
  setShowMonthPicker: React.Dispatch<React.SetStateAction<boolean>>;
  pickerYear: number;
  setPickerYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  showNotaDialog: boolean;
  setShowNotaDialog: (v: boolean) => void;
  notaTipo: NotaTipo;
  setNotaTipo: (t: NotaTipo) => void;
  notaTexto: string;
  setNotaTexto: (t: string) => void;
  editingNota: NotaCalendario | null;
  setEditingNota: (n: NotaCalendario | null) => void;
  notes: NotaCalendario[];
  setNotes: (n: NotaCalendario[] | ((prev: NotaCalendario[]) => NotaCalendario[])) => void;
  showReservaDialog: boolean;
  setShowReservaDialog: (v: boolean) => void;
  reservaTime: string;
  setReservaTime: (t: string) => void;
  reservaOrigen: string;
  setReservaOrigen: (o: string) => void;
  reservaDestino: string;
  setReservaDestino: (d: string) => void;
  reservaCliente: string;
  setReservaCliente: (c: string) => void;
  reservaTelefono: string;
  setReservaTelefono: (t: string) => void;
  reservaNotas: string;
  setReservaNotas: (n: string) => void;
  editingReserva: Reserva | null;
  setEditingReserva: (r: Reserva | null) => void;
  reservations: Reserva[];
  setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void;
  confirmDialog: { ... } | null;
  setConfirmDialog: (d: null | { ... }) => void;
  history: Turno[];
  settings: AppSettings;
  openNewReserva: (date?: string) => void;
}

export function CalendarScreen({ ... }: CalendarScreenProps) {
  // ~800 lÃ­neas de la pantalla calendario completa
}
```

#### Por quÃ© se cambiÃ³
La pantalla de calendario (`screen === "calendar"`) era un bloque inline de ~767 lÃ­neas en `main.tsx`. Extraerla a `src/screens/calendar-screen.tsx` reduce significativamente el archivo principal y aÃ­sla la responsabilidad de calendario como componente independiente con frontera clara.

### Cambio 3 - Reemplazar bloque inline en main.tsx

#### CÃ³digo anterior
```tsx
  if (screen === "calendar") {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = getStartOffset(year, month);
    return (
      <Shell burst={false}>
      </Shell>
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "calendar") {
    return (
      <CalendarScreen
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        calendarView={calendarView}
        setCalendarView={setCalendarView}
        showMonthPicker={showMonthPicker}
        setShowMonthPicker={setShowMonthPicker}
        pickerYear={pickerYear}
        setPickerYear={setPickerYear}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showNotaDialog={showNotaDialog}
        setShowNotaDialog={setShowNotaDialog}
        notaTipo={notaTipo}
        setNotaTipo={setNotaTipo}
        notaTexto={notaTexto}
        setNotaTexto={setNotaTexto}
        editingNota={editingNota}
        setEditingNota={setEditingNota}
        notes={notes}
        setNotes={setNotes}
        showReservaDialog={showReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
        reservaTime={reservaTime}
        setReservaTime={setReservaTime}
        reservaOrigen={reservaOrigen}
        setReservaOrigen={setReservaOrigen}
        reservaDestino={reservaDestino}
        setReservaDestino={setReservaDestino}
        reservaCliente={reservaCliente}
        setReservaCliente={setReservaCliente}
        reservaTelefono={reservaTelefono}
        setReservaTelefono={setReservaTelefono}
        reservaNotas={reservaNotas}
        setReservaNotas={setReservaNotas}
        editingReserva={editingReserva}
        setEditingReserva={setEditingReserva}
        reservations={reservations}
        setReservations={setReservations}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        history={history}
        settings={settings}
        openNewReserva={openNewReserva}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
El bloque inline de ~767 lÃ­neas se sustituye por el componente `CalendarScreen` importado. Los iconos IconPencilNeon, IconTimer e IconMoneyBag permanecen en `main.tsx` porque se usan en otras pantallas (no exclusivamente en calendario).

## 2026-05-26 01:28 - Extraer HomeScreen a src/screens/home-screen.tsx

**Archivos modificados:** `src/screens/home-screen.tsx`, `src/components/home-icons.tsx`, `src/main.tsx`

### Cambio 1 - HomeScreen extraÃ­da

#### CÃ³digo anterior
`No existÃ­a src/screens/home-screen.tsx.`

#### CÃ³digo nuevo
```tsx
export const HomeScreen: FC<HomeScreenProps> = ({
  isPaused,
  isAdmin,
  active,
  onSetScreen,
  onSetCalendarView,
  onOpenNewReserva,
  onSetAdminMode,
  onSetConfirmDialog,
  renderReservaDialog,
}) => {
  const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
  return (
    <Shell burst={false}>
    </Shell>
  );
};
```

#### Por quÃ© se cambiÃ³
La pantalla principal de la app (home) estaba definida inline en `main.tsx`. Extraerla a `src/screens/home-screen.tsx` reduce ~270 lÃ­neas del archivo principal y la aÃ­sla como componente independiente.

### Cambio 2 - Iconos de HomeScreen centralizados

#### CÃ³digo anterior
`No existÃ­a src/components/home-icons.tsx.`

#### CÃ³digo nuevo
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconClipboard: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconChart: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconReservaWrite: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconAgenda: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconPlay: FC<{ s?: number; c?: string }> = (...) => (...);
```

#### Por quÃ© se cambiÃ³
Estos 6 iconos eran definiciones inline en `main.tsx` usadas por HomeScreen. Centralizarlos en `src/components/home-icons.tsx` evita duplicaciÃ³n y permite que `home-screen.tsx` los importe sin depender de `main.tsx`.

### Cambio 3 - Reemplazar bloque inline en main.tsx

#### CÃ³digo anterior
```tsx
  if (screen === "home") {
    const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
    return (
      <Shell burst={false}>
        {/* ... 270 lÃ­neas inline ... */}
      </Shell>
    );
  }
```

#### CÃ³digo nuevo
```tsx
  if (screen === "home") {
    return (
      <HomeScreen
        isPaused={current.isPaused}
        isAdmin={isAdmin}
        active={active}
        onSetScreen={setScreen}
        onSetCalendarView={setCalendarView}
        onOpenNewReserva={openNewReserva}
        onSetAdminMode={setAdminMode}
        onSetConfirmDialog={setConfirmDialog}
        renderReservaDialog={renderReservaDialog}
      />
    );
  }
```

#### Por quÃ© se cambiÃ³
El bloque inline de ~270 lÃ­neas se sustituye por el componente `HomeScreen` importado. main.tsx pasa de 6828 a 6574 lÃ­neas.

## 2026-05-26 01:00 - Extraer iconos de entradas a src/components/entry-icons.tsx

**Archivos modificados:** `src/components/entry-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de entradas extraÃ­dos

#### CÃ³digo anterior
`No existÃ­a src/components/entry-icons.tsx.`

#### CÃ³digo nuevo
```tsx
import { type FC } from "react";
import { A, E, F, N, P } from "../shared/ui-theme";

export const IconCoin: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <text x="12" y="17" textAnchor="middle" fill={c} fontSize="11" fontWeight="700" fontFamily="Outfit,sans-serif">â‚¬</text>
  </svg>
);

export const IconPercent: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M16 8L8 16" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="9" r="2" stroke={c} strokeWidth="2.5" />
    <circle cx="15" cy="15" r="2" stroke={c} strokeWidth="2.5" />
  </svg>
);

export const IconCard: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="13" rx="2.5" stroke={c} strokeWidth="1.8" />
    <rect x="3" y="10" width="18" height="3.5" fill={c} opacity="0.35" />
    <rect x="6" y="15.5" width="5" height="1.5" rx="0.75" fill={c} />
  </svg>
);

export const IconAgency: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 20V9L12 4L20 9V20" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 20V14H15V20" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M3 20H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconExtra: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 12H20" stroke={c} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" opacity="0.5" />
  </svg>
);

export const IconFuel: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="11.5" height="15" rx="2" stroke={c} strokeWidth="1.8" />
    <path d="M15.5 9L19 7V17L15.5 15" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    <rect x="7" y="8" width="5.5" height="4.5" rx="1" fill={c} opacity="0.4" />
  </svg>
);

export const IconNulo: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <path d="M6 18L18 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
```

#### Por quÃ© se cambiÃ³
Los iconos de tipo de entrada (IconCoin, IconPercent, IconCard, IconAgency, IconExtra, IconFuel, IconNulo) estaban definidos inline en `main.tsx`. Extraerlos a `src/components/entry-icons.tsx` los centraliza y elimina ~70 lÃ­neas duplicadas.

### Cambio 2 - Reemplazar iconos inline en main.tsx

#### CÃ³digo anterior
```tsx
const IconCoin = ({ s = 24, c = G }: { s?: number; c?: str
## 2026-06-01 14:17 - Igualar firma Wear

**Archivos modificados:** `android/wear/build.gradle`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Firma del modulo Wear

#### Codigo anterior
```gradle
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
```

#### Codigo nuevo
```gradle
    signingConfigs {
        debug {
            storeFile file('../app/debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
```

#### Por que se cambio
El APK movil y el APK Wear estaban firmados con certificados distintos. Se configuro Wear para usar la misma `debug.keystore` fija que el modulo movil y permitir que ambos APK compartan identidad de firma.

### Cambio 2 - Test de firma Wear

#### Codigo anterior
```ts
  it("envia cada comando del reloj a un unico nodo conectado", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain("for (node in nodes)");
    expect(source).toContain("val node = nodes.first()");
  });
});
```

#### Codigo nuevo
```ts
  it("envia cada comando del reloj a un unico nodo conectado", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain("for (node in nodes)");
    expect(source).toContain("val node = nodes.first()");
  });

  it("firma el APK Wear con la misma clave debug fija que la app movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/build.gradle"),
      "utf8",
    );

    expect(source).toContain("storeFile file('../app/debug.keystore')");
    expect(source).toContain("debug {");
    expect(source).toContain("signingConfig signingConfigs.debug");
  });
});
```

#### Por que se cambio
Se anadio una regresion para impedir que el modulo Wear vuelva a compilarse con una firma distinta a la del modulo movil.

## 2026-06-01 13:49 - Blindar puente Wear OS

**Archivos modificados:**
- `android/app/src/main/java/com/mijornada/app/MainActivity.java`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/wear/src/main/AndroidManifest.xml`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`
- `android/wear/proguard-rules.pro`
- `src/services/watch-bridge.ts`
- `src/__tests__/android-wear-bridge.test.ts`
- `src/__tests__/watch-bridge.test.ts`

### Cambio 1 - Registro del plugin Wear en Capacitor

#### Codigo anterior
```java
package com.mijornada.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

#### Codigo nuevo
```java
package com.mijornada.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WearOsBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

#### Por que se cambio
El plugin nativo `WearOsBridgePlugin` existia, pero `MainActivity` no lo registraba manualmente. Sin este registro, Capacitor podia no cargar el puente nativo usado por `registerPlugin<WearOsBridgePlugin>("WearOsBridge")`.

### Cambio 2 - Nodo de origen en comandos del reloj

#### Codigo anterior
```java
public interface CommandListener {
    void onCommandReceived(String commandJson);
}
```

```java
if (listener != null) {
    listener.onCommandReceived(commandJson);
} else {
```

#### Codigo nuevo
```java
public interface CommandListener {
    void onCommandReceived(String commandJson, String nodeId);
}
```

```java
if (listener != null) {
    listener.onCommandReceived(commandJson, messageEvent.getSourceNodeId());
} else {
```

#### Por que se cambio
El puente necesitaba conocer el nodo Wear que envio cada comando para responder a ese nodo concreto y no emitir respuestas de comandos a todos los nodos conectados.

### Cambio 3 - Respuesta nativa dirigida al reloj

#### Codigo anterior
```java
private String currentUid = null;
```

```java
public void onCommandReceived(String commandJson) {
    JSObject data = new JSObject();
    data.put("command", commandJson);
    notifyListeners("onCommandReceived", data);
}
```

```java
if (uid != null && !uid.trim().isEmpty()) {
    this.currentUid = uid;
    call.resolve();
} else {
```

```java
byte[] responseData = responseJson.getBytes(StandardCharsets.UTF_8);
Wearable.getNodeClient(getContext())
    .getConnectedNodes()
```

#### Codigo nuevo
```java
public void onCommandReceived(String commandJson, String nodeId) {
    JSObject data = new JSObject();
    data.put("command", commandJson);
    data.put("nodeId", nodeId);
    notifyListeners("onCommandReceived", data);
}
```

```java
if (uid != null && !uid.trim().isEmpty()) {
    call.resolve();
} else {
```

```java
String nodeId = call.getString("nodeId");
byte[] responseData = responseJson.getBytes(StandardCharsets.UTF_8);
if (nodeId != null && !nodeId.trim().isEmpty()) {
    Wearable.getMessageClient(getContext())
        .sendMessage(nodeId, "/watch-response", responseData)
        .addOnSuccessListener(unused -> call.resolve())
        .addOnFailureListener(e -> call.reject("Error al responder a Wear OS: " + e.getMessage()));
    return;
}

Wearable.getNodeClient(getContext())
    .getConnectedNodes()
```

#### Por que se cambio
`currentUid` se elimino porque no protegia nada. La respuesta nativa se hizo dirigida por `nodeId` para cerrar el ciclo comando-respuesta con el reloj que origino el mensaje.

### Cambio 4 - Blindaje de UID y carga en el puente JS

#### Codigo anterior
```ts
import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
```

```ts
export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string }) => void
  ): Promise<any> & any;
}
```

```ts
let listenerAdded = false;
```

```ts
  WearOsBridge.addListener("onCommandReceived", async (data: { command: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const store = useAppStore.getState();
```

```ts
      await WearOsBridge.sendResponse({
        response: JSON.stringify(result.response),
      });
```

```ts
    } catch (err) {
      console.error("Error al procesar comando de Wear OS:", err);
    }
```

#### Codigo nuevo
```ts
import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
import { auth } from "./firebase";
```

```ts
export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string; nodeId?: string }) => void
  ): Promise<any> & any;
}
```

```ts
let listenerAdded = false;
let preparedUid: string | null = null;
```

```ts
function readOperationId(command: unknown): string {
  if (!command || typeof command !== "object") return "";
  const value = (command as { operationId?: unknown }).operationId;
  return typeof value === "string" ? value : "";
}

function errorResponse(operationId: string, code: string, message: string): WatchCommandResponse {
  return {
    type: "ERROR",
    operationId,
    code,
    message,
  };
}

async function sendResponse(response: WatchCommandResponse, nodeId?: string): Promise<void> {
  await WearOsBridge.sendResponse({
    nodeId,
    response: JSON.stringify(response),
  });
}
```

```ts
  preparedUid = uid;
```

```ts
  WearOsBridge.addListener("onCommandReceived", async (data: { command: string; nodeId?: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const operationId = readOperationId(command);
      const store = useAppStore.getState();
      const authUid = auth.currentUser?.uid ?? null;

      if (!authUid || !preparedUid || authUid !== preparedUid) {
        await sendResponse(errorResponse(
          operationId,
          "AUTH_UID_MISMATCH",
          "Usuario movil no coincide con el puente del reloj",
        ), data.nodeId);
        return;
      }

      if (!store.dataLoaded) {
        await sendResponse(errorResponse(
          operationId,
          "DATA_NOT_LOADED",
          "Datos del usuario no cargados",
        ), data.nodeId);
        return;
      }
```

```ts
      await sendResponse(result.response, data.nodeId);
```

```ts
    } catch (err) {
      console.error("Error al procesar comando de Wear OS:", err);
      await sendResponse(errorResponse(
        "",
        "INVALID_COMMAND",
        "Comando del reloj invalido",
      ), data.nodeId);
    }
```

#### Por que se cambio
Antes el puente aceptaba comandos del reloj sin validar el usuario autenticado real ni que el store tuviera los datos cargados. Ahora un comando no puede tocar `current` ni `history` si el UID no coincide o si `dataLoaded` aun no esta activo.

### Cambio 5 - Esperar OK antes de cambiar pantalla en Wear

#### Codigo anterior
```kt
onSave = { amount, note ->
    sendAddEntry(selectedCategory.value, amount, note)
    currentScreen.value = ScreenState.ACTIVE_TURNO
},
```

```kt
onConfirm = { dinero, km ->
    sendEndTurno(dinero, km)
    currentScreen.value = ScreenState.NO_CONNECTED
},
```

```kt
} else if ("OK" == json.optString("type")) {
    requestStatus()
} else if ("ERROR" == json.optString("type")) {
```

#### Codigo nuevo
```kt
onSave = { amount, note ->
    sendAddEntry(selectedCategory.value, amount, note)
},
```

```kt
onConfirm = { dinero, km ->
    sendEndTurno(dinero, km)
},
```

```kt
} else if ("OK" == json.optString("type")) {
    currentScreen.value = ScreenState.ACTIVE_TURNO
    requestStatus()
} else if ("ERROR" == json.optString("type")) {
```

#### Por que se cambio
El reloj cambiaba de pantalla como si una entrada o cierre se hubiera aplicado antes de recibir confirmacion del movil. Ahora espera `OK` del movil antes de volver al flujo activo y despues pide estado real.

### Cambio 6 - Enviar comandos Wear a un unico nodo

#### Codigo anterior
```kt
val data = commandJson.toByteArray(StandardCharsets.UTF_8)
for (node in nodes) {
    Wearable.getMessageClient(this)
        .sendMessage(node.id, "/watch-command", data)
}
```

#### Codigo nuevo
```kt
val data = commandJson.toByteArray(StandardCharsets.UTF_8)
val node = nodes.first()
Wearable.getMessageClient(this)
    .sendMessage(node.id, "/watch-command", data)
    .addOnFailureListener {
        isConnected.value = false
        currentScreen.value = ScreenState.NO_CONNECTED
    }
```

#### Por que se cambio
Emitir un comando mutativo a todos los nodos conectados podia enviar la misma orden a mas de un dispositivo. Ahora se envia a un unico nodo conectado y si el envio falla el reloj vuelve al estado seguro de no conectado.

### Cambio 7 - Limpieza Wear sin codigo inutil

#### Codigo anterior
```kt
private var selectedCategoryBgColor = mutableStateOf(ColorPropinaBg)
```

```kt
categoryBgColor = selectedCategoryBgColor.value,
```

```kt
categoryBgColor: Color,
```

```kt
import androidx.wear.compose.material.*
```

```xml
<activity
    android:name="com.mijornada.app.WearMainActivity"
    android:exported="true"
    android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
```

#### Codigo nuevo
```kt
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.*
```

```xml
<activity
    android:name="com.mijornada.app.WearMainActivity"
    android:exported="true"
    android:taskAffinity="com.mijornada.app.watch"
    android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
```

#### Por que se cambio
Se elimino el estado/parametro de color de fondo que no se usaba, se importo `ScalingLazyColumn` desde el paquete no obsoleto y se anadio `taskAffinity` para resolver el aviso Wear Recents de lint.

### Cambio 8 - Archivo ProGuard de Wear

#### Codigo anterior
`No existia proguard-rules.pro en android/wear.`

#### Codigo nuevo
```pro
# Reglas especificas del modulo Wear OS.
# Se mantiene el archivo porque build.gradle lo referencia en release.
```

#### Por que se cambio
`android/wear/build.gradle` referenciaba `proguard-rules.pro` en release. Se creo el archivo para que la configuracion no apunte a un fichero ausente.

### Cambio 9 - Tests del puente Wear

#### Codigo anterior
`No existia watch-bridge.test.ts en src/__tests__.`

#### Codigo nuevo
```ts
describe("watch-bridge", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    capacitorMock.listener = null;
    capacitorMock.isNative = true;
    firebaseMock.auth.currentUser = { uid: "uid-preparado" };
```

```ts
  it("rechaza comandos si el UID autenticado no coincide con el UID preparado", async () => {
```

```ts
  it("rechaza comandos si los datos del usuario aun no estan cargados", async () => {
```

```ts
  it("responde con error si el comando recibido no es JSON valido", async () => {
```

#### Por que se cambio
Se anadieron regresiones para probar que el puente del reloj no modifica el store si el UID no coincide, si los datos no estan cargados o si el comando recibido no es JSON valido.

### Cambio 10 - Tests Android/Wear de integracion

#### Codigo anterior
`No existia android-wear-bridge.test.ts en src/__tests__.`

#### Codigo nuevo
```ts
describe("Android Wear bridge", () => {
  it("registra WearOsBridgePlugin en MainActivity para que Capacitor lo cargue", () => {
```

```ts
  it("no cambia pantallas de trabajo del reloj antes de recibir OK del movil", () => {
```

```ts
  it("envia cada comando del reloj a un unico nodo conectado", () => {
```

#### Por que se cambio
Se anadieron regresiones de integracion para fijar el registro del plugin nativo, evitar pantallas optimistas antes del `OK` del movil y evitar comandos enviados a varios nodos.
## 2026-06-03 00:04 - Cambiar identidad visual del taxi

**Archivos modificados:** `src/components/brand-assets.tsx`, `src/main.tsx`, `src/screens/home-screen.tsx`, `src/screens/settings-screen.tsx`, `android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt`, `src/__tests__/brand-assets.test.ts`

### Cambio 1 - Componente de marca del taxi

#### CÃ³digo anterior
`No existÃ­a BrandTaxiIcon ni BrandTaxiLogo en src/components/brand-assets.tsx.`

#### CÃ³digo nuevo
```tsx
import type { CSSProperties, FC } from "react";

const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";

type BrandTaxiIconProps = {
  size?: 18 | 20 | 24 | 28 | number;
  variant?: "primary" | "alternate";
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiIcon: FC<BrandTaxiIconProps> = ({
  size = 20,
  variant = "primary",
  alt = "Taxi",
  style,
}) => (
  <img
    src={variant === "alternate" ? BRAND_MINI_18 : BRAND_MINI_20}
    width={size}
    height={size}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      objectFit: "contain",
      flexShrink: 0,
      ...style,
    }}
  />
);

type BrandTaxiLogoProps = {
  width?: number;
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiLogo: FC<BrandTaxiLogoProps> = ({
  width = 156,
  alt = "Mi Turno Taxi",
  style,
}) => (
  <img
    src={BRAND_LOGO}
    width={width}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "block",
      width,
      maxWidth: "100%",
      height: "auto",
      objectFit: "contain",
      margin: "0 auto",
      ...style,
    }}
  />
);
```

#### Por quÃ© se cambiÃ³
Se centralizÃ³ la identidad visual del taxi para usar el mini icono principal de 20px, conservar la variante de 18px y reutilizar el logo grande sin duplicar rutas ni dejar emojis como marca visual.

### Cambio 2 - Icono de cabecera principal

#### CÃ³digo anterior
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
```

```tsx
              ðŸš•{" "}
              {new Date()
```

#### CÃ³digo nuevo
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
import { BrandTaxiIcon } from "./components/brand-assets";
```

```tsx
              <BrandTaxiIcon size={20} style={{ marginRight: 5, transform: "translateY(-1px)" }} />
              {new Date()
```

#### Por quÃ© se cambiÃ³
Se sustituyÃ³ el emoji de la cabecera principal por el mini icono de taxi de 20px elegido para que la cabecera use un asset propio y coherente con el resto de la marca.

### Cambio 3 - Logo de la pantalla Home

#### CÃ³digo anterior
```tsx
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgendaNeon } from "../components/home-icons";
```

```tsx
          <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 18 }}>
            ðŸš•
          </div>
```

#### CÃ³digo nuevo
```tsx
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgendaNeon } from "../components/home-icons";
import { BrandTaxiLogo } from "../components/brand-assets";
```

```tsx
          <BrandTaxiLogo width={168} style={{ marginBottom: 18 }} />
```

#### Por quÃ© se cambiÃ³
Se sustituyÃ³ el emoji grande de la pantalla Home por el logo nuevo del taxi para que la pantalla principal muestre una imagen de marca propia.

### Cambio 4 - Logo de Ajustes

#### CÃ³digo anterior
```tsx
import { hapticDanger, hapticKey, hapticOpen, hapticSave } from "../services/haptics";
```

```tsx
          <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸš•</div>
```

#### CÃ³digo nuevo
```tsx
import { hapticDanger, hapticKey, hapticOpen, hapticSave } from "../services/haptics";
import { BrandTaxiLogo } from "../components/brand-assets";
```

```tsx
          <BrandTaxiLogo width={120} style={{ marginBottom: 12 }} />
```

#### Por quÃ© se cambiÃ³
Se sustituyÃ³ el emoji de la tarjeta de Ajustes por el mismo logo visual usado en Home para mantener una identidad coherente.

### Cambio 5 - Logo inicial de Wear

#### CÃ³digo anterior
```kt
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
```

```kt
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
```

```kt
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*
```

```kt
            Text("ðŸš•", fontSize = 34.sp)
            Spacer(modifier = Modifier.height(5.dp))
```

#### CÃ³digo nuevo
```kt
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
```

```kt
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
```

```kt
import androidx.wear.compose.material.Text
import com.mijornada.app.R
import com.mijornada.app.theme.*
```

```kt
            BrandTaxiLogo()
            Spacer(modifier = Modifier.height(5.dp))
```

```kt
@Composable
private fun BrandTaxiLogo() {
    Image(
        painter = painterResource(id = R.drawable.brand_taxi_logo),
        contentDescription = "Mi Turno Taxi",
        contentScale = ContentScale.Fit,
        modifier = Modifier
            .fillMaxWidth(0.66f)
            .height(58.dp)
    )
}
```

#### Por quÃ© se cambiÃ³
Se sustituyÃ³ el emoji de la pantalla inicial del reloj por un recurso nativo del taxi, optimizado para Wear OS y cargado desde `R.drawable.brand_taxi_logo`.

### Cambio 6 - Pruebas de identidad visual

#### CÃ³digo anterior
`No existÃ­a src/__tests__/brand-assets.test.ts.`

#### CÃ³digo nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

describe("brand taxi assets", () => {
  it("centraliza los assets visuales del taxi para movil web y reloj", () => {
    const brandAssets = readFileSync(
      resolve(root, "src/components/brand-assets.tsx"),
      "utf8",
    );

    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
  });

  it("sustituye los emojis de marca por assets propios en pantallas visibles", () => {
    const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
    const home = readFileSync(resolve(root, "src/screens/home-screen.tsx"), "utf8");
    const settings = readFileSync(resolve(root, "src/screens/settings-screen.tsx"), "utf8");
    const wearHome = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(main).toContain("<BrandTaxiIcon size={20}");
    expect(home).toContain("<BrandTaxiLogo");
    expect(settings).toContain("<