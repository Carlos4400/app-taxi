// Tests de contrato sobre los fuentes nativos Android/Wear (leen los .kt/.java como texto).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

describe("Android Wear bridge", () => {
  it("registra WearOsBridgePlugin en MainActivity para que Capacitor lo cargue", () => {
    const source = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/MainActivity.java"),
      "utf8",
    );

    expect(source).toContain("registerPlugin(WearOsBridgePlugin.class)");
  });

  it("no cambia pantallas de trabajo del reloj antes de recibir OK del movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain(`sendAddEntry(selectedCategory.value, amount, note)
                    currentScreen.value = ScreenState.ACTIVE_TURNO`);
    expect(source).not.toContain(`sendEndTurno(dinero, km)
                    currentScreen.value = ScreenState.NO_CONNECTED`);
    expect(source).toContain(`} else if ("OK" == json.optString("type")) {`);
    expect(source).toContain("currentScreen.value = ScreenState.ACTIVE_TURNO");
  });

  it("no duplica comandos del reloj por cada nodo conectado", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain("for (node in nodes)");
    expect(source).toContain("val nodeId = nodes.firstOrNull()?.id ?: \"\"");
  });

  it("escribe el DataItem aunque no haya nodo conectado en ese instante", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain(`if (nodes.isEmpty()) {
                    isConnected.value = false`);
    expect(source).toContain("Wearable.getDataClient(this).putDataItem(dataRequest)");
  });

  it("envia comandos criticos Wear como DataItem persistente con operationId", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("PutDataMapRequest.create(\"/watch-command/\$operationId\")");
    expect(source).toContain("dataMap.putString(\"command\", commandJson)");
    expect(source).toContain("dataRequest.setUrgent()");
    expect(source).toContain("Wearable.getDataClient(this).putDataItem");
    expect(source).not.toContain("sendMessage(node.id, \"/watch-command\"");
  });

  it("recibe ACK persistente del movil por DataItem antes de dar por cerrado un comando", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(source).toContain("override fun onDataChanged");
    expect(source).toContain("if (uri.path?.startsWith(\"/watch-ack/\") == true)");
    expect(source).toContain("handleResponseJson(responseJson)");
    expect(source).toContain("DataMapItem.fromDataItem(item).dataMap.getString(\"response\")");
  });

  it("recibe estado persistente del movil por DataItem turno state", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(source).toContain('uri.path == "/turno/state"');
    expect(source).toContain('DataMapItem.fromDataItem(item).dataMap.getString("state")');
    expect(source).toContain("handleResponseJson(stateJson)");
  });

  it("el movil escucha comandos Wear por DATA_CHANGED y publica ACK persistente", () => {
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearListenerService.java"),
      "utf8",
    );
    const plugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java"),
      "utf8",
    );
    const manifest = readFileSync(
      resolve(root, "android/app/src/main/AndroidManifest.xml"),
      "utf8",
    );

    expect(manifest).toContain("com.google.android.gms.wearable.DATA_CHANGED");
    expect(manifest).toContain('android:pathPrefix="/watch-command/"');
    expect(service).toContain("@Override");
    expect(service).toContain("public void onDataChanged");
    expect(service).toContain("DataMapItem.fromDataItem");
    expect(service).toContain("path.startsWith(\"/watch-command/\")");
    expect(plugin).toContain("PutDataMapRequest.create(\"/watch-ack/\" + resolvedOperationId)");
    expect(plugin).toContain("dataMap.putString(\"response\", responseJson)");
    expect(plugin).toContain("Wearable.getDataClient(context).putDataItem");
  });

  it("el movil publica el estado nativo actualizado como DataItem persistente", () => {
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearListenerService.java"),
      "utf8",
    );
    const worker = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt"),
      "utf8",
    );
    const publisher = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchStateDataPublisher.kt"),
      "utf8",
    );

    expect(service).toContain("WearCommandWorker.enqueue");
    expect(worker).toContain("WatchStateDataPublisher.publish(applicationContext)");
    expect(publisher).toContain('PutDataMapRequest.create("/turno/state")');
    expect(publisher).toContain('dataMap.putString("state"');
    expect(publisher).toContain("dataRequest.setUrgent()");
  });

  it("persiste uid nativo sin programar una subida Firestore paralela", () => {
    const plugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java"),
      "utf8",
    );
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearListenerService.java"),
      "utf8",
    );
    const session = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchUserSession.kt"),
      "utf8",
    );

    expect(plugin).toContain("WatchUserSession.prepare(getContext(), uid)");
    expect(plugin).toContain("WatchUserSession.clearIfMatches(getContext(), uid)");
    expect(session).toContain("fun getUid(context: Context): String");
    expect(session).toContain("fun getSessionId(context: Context): String");
    expect(service).not.toContain("WatchSyncScheduler");
  });

  it("separa la base Room nativa por uid para no mezclar usuarios", () => {
    const provider = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt"),
      "utf8",
    );
    const handler = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchNativeCommandHandler.kt"),
      "utf8",
    );

    expect(provider).toContain("fun getForUid(context: Context, uid: String)");
    expect(provider).toContain("mi-turno-watch-");
    expect(provider).toContain("MessageDigest.getInstance(\"SHA-256\")");
    expect(handler).toContain("WatchDatabaseProvider.getForUid(context, uid)");
  });

  it("mantiene outbox persistente en el reloj hasta recibir ACK", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );
    const outbox = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt"),
      "utf8",
    );
    const worker = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/OutboxWorker.kt"),
      "utf8",
    );

    expect(source).toContain("WatchOutbox.save(this, operationId, commandJson)");
    expect(source).toContain("WatchOutbox.remove(this, operationId)");
    expect(outbox).toContain("getSharedPreferences");
    expect(outbox).toContain("pendingCommands");
    expect(worker).toContain("WatchOutbox.pendingCommands");
    expect(worker).toContain("WatchOutbox.hasPendingCommands");
  });

  it("reintenta el outbox con el mismo operationId usando solo el backoff de WorkManager", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );
    const outbox = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WatchOutbox.kt"),
      "utf8",
    );
    const worker = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/OutboxWorker.kt"),
      "utf8",
    );
    const responseService = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(source).not.toContain("WatchOutbox.markAttempt");
    expect(outbox).not.toContain("val attempts: Int");
    expect(outbox).not.toContain("val nextRetryAt: Long");
    expect(outbox).not.toContain("markAttempt");
    expect(outbox).not.toContain("dueCommands");
    expect(outbox).not.toContain("BACKOFF_MS");
    expect(outbox).toContain("fun hasPendingCommands");
    expect(worker).toContain("Wearable.getDataClient(applicationContext).putDataItem");
    expect(worker).toContain("Result.retry()");
    expect(worker).not.toContain("WatchOutbox.markAttempt");
    expect(responseService).toContain("BackoffPolicy.EXPONENTIAL");
    expect(responseService).toContain("ExistingWorkPolicy.KEEP");
    expect(outbox).not.toContain("pruneStaleCommands");
  });

  it("comprueba cada permiso desde la version Android que lo introdujo", () => {
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt"),
      "utf8",
    );

    expect(service).toContain("Build.VERSION.SDK_INT >= Build.VERSION_CODES.S");
    expect(service).toContain("Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU");
    // Orden vigente desde el commit "restore permission checks order
    // (TIRAMISU first, then S)": POST_NOTIFICATIONS antes que BLUETOOTH_CONNECT.
    expect(service.indexOf("Manifest.permission.POST_NOTIFICATIONS"))
      .toBeLessThan(service.indexOf("Manifest.permission.BLUETOOTH_CONNECT"));
  });

  it("centraliza las claves de respuesta compartidas entre servicio y actividad Wear", () => {
    const constants = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearConstants.kt"),
      "utf8",
    );
    const activity = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );
    const responseService = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(constants).toContain('const val PREFS = "mobile_response_prefs"');
    expect(constants).toContain('const val LAST_RESPONSE = "last_response"');
    expect(constants).toContain('const val RESPONSE_TIMESTAMP = "response_timestamp"');
    expect(activity).toContain("WearConstants.Response.PREFS");
    expect(activity).toContain("WearConstants.Response.LAST_RESPONSE");
    expect(activity).toContain("WearConstants.Response.RESPONSE_TIMESTAMP");
    expect(responseService).toContain("WearConstants.Response.PREFS");
    expect(responseService).toContain("WearConstants.Response.LAST_RESPONSE");
    expect(responseService).toContain("WearConstants.Response.RESPONSE_TIMESTAMP");
  });

  it("mantiene el contrato Wear alineado con la retencion y el backoff implementados", () => {
    const contract = readFileSync(
      resolve(root, "ARQUITECTURA_RELOJ_WEAR_OS.md"),
      "utf8",
    );

    expect(contract).toContain("limite de 512 elementos");
    expect(contract).toContain("WorkManager es el unico responsable del backoff");
    expect(contract).not.toContain("limite de 50 elementos");
  });

  it("elimina DataItems de comando y ACK tras una respuesta terminal", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(source).toContain("cleanupTerminalDataItems(operationId)");
    expect(source).toContain('getDataItemUri("/watch-command/$operationId")');
    expect(source).toContain('getDataItemUri("/watch-ack/$operationId")');
    expect(source).toContain("deleteDataItems");
    expect(source).toContain("isTerminalResponse(responseType, json.optString(\"code\", \"\"))");
    expect(source).toContain('"USER_NOT_PREPARED"');
  });

  it("usa un unico flujo Room hacia la sincronizacion habitual de la app", () => {
    const appGradle = readFileSync(resolve(root, "android/app/build.gradle"), "utf8");
    const entities = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchEntities.kt"),
      "utf8",
    );
    const daos = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchDaos.kt"),
      "utf8",
    );
    const repository = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt"),
      "utf8",
    );
    const database = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchDatabase.kt"),
      "utf8",
    );
    const provider = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchDatabaseProvider.kt"),
      "utf8",
    );

    expect(existsSync(resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchSyncScheduler.kt"))).toBe(false);
    expect(existsSync(resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchSyncWorker.kt"))).toBe(false);
    expect(appGradle).toContain("androidx.work:work-runtime");
    expect(appGradle).not.toContain("com.google.firebase:firebase-firestore");
    expect(entities).not.toContain("val synced:");
    expect(daos).not.toContain("markSynced");
    expect(daos).not.toContain("getPendingSyncOperations");
    expect(repository).not.toContain("synced = false");
    expect(database).toContain("version = 5");
    expect(database).toContain("MIGRATION_1_2");
    expect(database).toContain("MIGRATION_2_3");
    expect(database).toContain("MIGRATION_3_4");
    expect(database).toContain("MIGRATION_4_5");
    expect(provider).toContain("WatchDatabase.MIGRATION_1_2");
    expect(provider).toContain("WatchDatabase.MIGRATION_2_3");
    expect(provider).toContain("WatchDatabase.MIGRATION_3_4");
    expect(provider).toContain("WatchDatabase.MIGRATION_4_5");
  });

  it("declara CDM y foreground service de turno activo", () => {
    const manifest = readFileSync(
      resolve(root, "android/app/src/main/AndroidManifest.xml"),
      "utf8",
    );
    const mainActivity = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/MainActivity.java"),
      "utf8",
    );
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/TurnoForegroundService.kt"),
      "utf8",
    );
    const cdmPlugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/CdmPairPlugin.java"),
      "utf8",
    );

    expect(manifest).toContain("android.software.companion_device_setup");
    expect(manifest).toContain("android.permission.REQUEST_COMPANION_RUN_IN_BACKGROUND");
    expect(manifest).toContain("android.permission.REQUEST_COMPANION_USE_DATA_IN_BACKGROUND");
    expect(manifest).toContain("android.permission.REQUEST_COMPANION_START_FOREGROUND_SERVICES_FROM_BACKGROUND");
    expect(manifest).toContain("android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE");
    expect(manifest).toContain('android:foregroundServiceType="connectedDevice"');
    expect(mainActivity).toContain("registerPlugin(CdmPairPlugin.class)");
    expect(cdmPlugin).toContain("CompanionDeviceManager");
    expect(cdmPlugin).toContain("Build.VERSION.SDK_INT < Build.VERSION_CODES.O");
    expect(cdmPlugin).toContain("@RequiresApi(Build.VERSION_CODES.O)");
    expect(cdmPlugin).toContain("Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU");
    expect(service).toContain("startForeground");
    expect(service).toContain("turno_activo");
  });

  it("arranca y detiene el foreground service solo al iniciar o terminar turno", () => {
    const listener = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearListenerService.java"),
      "utf8",
    );

    expect(listener).toContain("WearCommandWorker.enqueue");
    expect(listener).toContain("dataEvents.close()");
  });

  it("procesa comandos Wear en nativo si el puente Capacitor aun no esta listo", () => {
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearListenerService.java"),
      "utf8",
    );

    expect(service).toContain("WearCommandWorker.enqueue(this, commandJson, nodeId, operationId)");
    expect(service).not.toContain("readOperationId(commandJson)");
    expect(service).not.toContain("WearPendingCommandStore.enqueue(this, commandJson, nodeId)");
  });

  it("procesa comandos persistentes solo por DataItem sin una ruta MessageClient antigua", () => {
    const service = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearListenerService.java"),
      "utf8",
    );
    const plugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java"),
      "utf8",
    );

    expect(service).toContain("WearCommandWorker.enqueue");
    expect(service).not.toContain("onMessageReceived");
    expect(service).not.toContain("MessageEvent");
    expect(service).not.toContain("StandardCharsets");
    expect(service).not.toContain("CommandListener");
    expect(service).not.toContain("setCommandListener");
  });

  it("expone pausa y reanudacion del turno desde la pantalla activa Wear", () => {
    const activity = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );
    const screen = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(activity).toContain("private fun sendPauseTurno()");
    expect(activity).toContain("private fun sendResumeTurno()");
    expect(activity).toContain('sendTurnoStateCommand("PAUSE_TURNO")');
    expect(activity).toContain('sendTurnoStateCommand("RESUME_TURNO")');
    expect(activity).toContain("onTogglePause = {");
    expect(screen).toContain("onTogglePause: () -> Unit");
    expect(screen).toContain('isPaused -> "Reanudar turno"');
    expect(screen).toContain('else -> "Pausar turno"');
  });

  it("guarda respuesta y timestamp juntos y protege el historial terminal", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(source).toContain("putString(WearConstants.Response.LAST_RESPONSE, responseJson)");
    expect(source).toContain("putLong(WearConstants.Response.RESPONSE_TIMESTAMP, System.currentTimeMillis())");
    expect(source).toContain("private fun rememberTerminalOperation(operationId: String): Boolean");
    expect(source).toContain("synchronized(handledTerminalOperationIds)");
    expect(source).not.toContain("val editor = prefs.edit()");
  });

  it("reintenta fallos transitorios del worker movil con backoff exponencial", () => {
    const source = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt"),
      "utf8",
    );

    expect(source).toContain("Result.retry()");
    expect(source).toContain("setBackoffCriteria(");
    expect(source).toContain("BackoffPolicy.EXPONENTIAL");
    expect(source).toContain("WorkRequest.MIN_BACKOFF_MILLIS");
  });

  it("mantiene limpia y estable la integracion JS con Room", () => {
    const hook = readFileSync(
      resolve(root, "src/hooks/use-firestore-sync.ts"),
      "utf8",
    );
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );

    expect(hook).not.toContain("sendWatchStatus");
    expect(hook).not.toContain("No sendWatchStatus aqui");
    expect(bridge).toContain("return stableHash({");
    expect(bridge).toContain('console.error("Error al retirar listener nativo Wear OS:", err)');
  });

  it("serializa hidrataciones nativas y retira todas las suscripciones del store", () => {
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );

    expect(bridge).toContain("let nativeHydrationQueue: Promise<void> | null = null");
    expect(bridge).toContain("function queueNativeHydration()");
    expect(bridge).toContain("storeUnsubscribes.forEach((unsubscribe) => unsubscribe())");
    expect(bridge).not.toContain("let storeUnsubscribe:");
  });

  it("tipa el listener nativo y registra fallos previos de hidratacion", () => {
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );

    expect(bridge).toContain('import { registerPlugin, Capacitor, type PluginListenerHandle } from "@capacitor/core"');
    expect(bridge).toContain("Promise<PluginListenerHandle>");
    expect(bridge).not.toContain("Promise<any> & any");
    expect(bridge).toContain('console.error("Error previo en cola de hidratacion Wear OS:", error)');
  });

  it("retiene una ventana amplia y acotada de operaciones procesadas", () => {
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );
    const repository = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt"),
      "utf8",
    );
    const wearConstants = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearConstants.kt"),
      "utf8",
    );

    expect(bridge).toContain("const MAX_PROCESSED_OPERATION_IDS = 512");
    expect(repository).toContain("private val processedOperationLimit = 512");
    expect(wearConstants).not.toContain("MAX_PROCESSED_OPERATION_IDS");
  });

  it("evita rehidratar Room tras una sincronizacion iniciada por la WebView", () => {
    const plugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java"),
      "utf8",
    );
    const worker = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt"),
      "utf8",
    );
    const syncStateBlock = plugin.slice(
      plugin.indexOf("public void syncState(PluginCall call)"),
      plugin.indexOf("public static void publishAckDataItem"),
    );

    expect(syncStateBlock).not.toContain("WatchStateChangeNotifier.notify(getContext())");
    expect(worker).toContain("WatchStateChangeNotifier.notify(applicationContext)");
  });

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

  it("nombra el snapshot segun su funcion canonica", () => {
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );

    expect(bridge).toContain("function nativeSnapshotCanonical(): string");
    expect(bridge).not.toContain("nativeSnapshotJson");
  });

  it("borra DataItems terminales para cualquier nodo Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    expect(source).toContain('Uri.Builder().scheme("wear").authority("*").path(path).build()');
  });

  it("no conserva residuos temporales en las carpetas fuente", () => {
    const sourceRoots = [
      resolve(root, "src"),
      resolve(root, "android/app/src"),
      resolve(root, "android/wear/src"),
    ];
    const residueNames = sourceRoots.flatMap((sourceRoot) =>
      readdirSync(sourceRoot, { recursive: true })
        .map(String)
        .filter((name) => name.includes(".fuse_hidden") || name.endsWith(".bak")),
    );
    const gitignore = readFileSync(resolve(root, ".gitignore"), "utf8");

    expect(residueNames).toEqual([]);
    expect(gitignore).toContain(".fuse_hidden*");
    expect(gitignore).toContain("*.bak");
  });

  it("expone emparejamiento CDM en Ajustes mediante un servicio Capacitor", () => {
    const service = readFileSync(
      resolve(root, "src/services/companion-device.ts"),
      "utf8",
    );
    const settings = readFileSync(
      resolve(root, "src/screens/settings-screen.tsx"),
      "utf8",
    );

    expect(service).toContain('registerPlugin<CdmPairPlugin>("CdmPair")');
    expect(service).toContain("getCompanionWatchStatus");
    expect(service).toContain("pairCompanionWatch");
    expect(settings).toContain("Reloj Wear OS");
    expect(settings).toContain("pairCompanionWatch");
    expect(settings).toContain("getCompanionWatchStatus");
  });

  it("expone el estado nativo persistido para hidratar Capacitor al abrir la app", () => {
    const plugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java"),
      "utf8",
    );

    expect(plugin).toContain("public void getNativeState(PluginCall call)");
    expect(plugin).toContain("new WatchRepository(WatchDatabaseProvider.getForUid(getContext(), uid))");
    expect(plugin).toContain("WatchStateJson.stateToJson(repository.readState");
    expect(plugin).toContain("result.put(\"state\"");
    expect(plugin).toContain("call.resolve(result)");
  });

  it("persiste en Room el estado actualizado desde la app movil", () => {
    const plugin = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java"),
      "utf8",
    );
    const repository = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchRepository.kt"),
      "utf8",
    );
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );

    expect(plugin).toContain("public void syncState(PluginCall call)");
    expect(plugin).toContain("WatchStateJson.snapshotFromJson");
    expect(plugin).toContain("nativeStateExecutor.execute");
    expect(plugin).toContain("snapshot.getCurrent().isActive()");
    expect(plugin).toContain("TurnoForegroundService.start(getContext())");
    expect(plugin).toContain("TurnoForegroundService.stop(getContext())");
    expect(repository).toContain("fun replaceAppState(");
    expect(bridge).toContain("WearOsBridge.syncState");
    expect(bridge).toContain("useAppStore.subscribe");
    expect(bridge).toContain("nativeSyncQueue");
  });

  it("el reloj ya no depende de QUEUED para cerrar comandos criticos", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain(`"QUEUED" == json.optString("type")`);
    expect(source).not.toContain("Pendiente del movil");
    expect(source).toContain(`} else if ("OK" == json.optString("type")) {`);
    expect(source).toContain(`} else if ("ERROR" == json.optString("type")) {`);
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
    expect(noActive).toContain("Móvil conectado");
    expect(main).toContain("ScreenState.TURNOS");
    expect(main).toContain("sendGetTurnos()");
    expect(main).toContain(`put("type", "GET_TURNOS")`);
    expect(main).toContain("parseTurnos(json.optJSONArray(\"turnos\"))");
    expect(main).not.toContain("FirebaseFirestore");
  });

  it("muestra lista y resumen de turnos Wear como la app movil adaptada", () => {
    const turnos = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt"),
      "utf8",
    );
    const resumen = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt"),
      "utf8",
    );

    expect(turnos).toContain("fun TurnosScreen(");
    expect(turnos).toContain("TurnoCard");
    expect(turnos).toContain("Total Taxímetro");
    expect(turnos).toContain("Mi Ganancia");
    expect(turnos).toContain("Tiempo");
    expect(resumen).toContain("Resumen"); // titulo corto: cabecera estrecha para la curva
    expect(resumen).toContain("Total Taxímetro");
    expect(resumen).toContain("Mi Ganancia");
    expect(resumen).toContain("Total KM");
    expect(resumen).toContain("Tiempo trabajado");
    expect(resumen).toContain("Notas del turno");
    expect(resumen).toContain("Notas detalladas");
    expect(resumen).toContain("Total a descontar");
    expect(resumen).toContain("Total a dar");
  });

  it("pide confirmacion antes de borrar una entrada desde el reloj", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("CONFIRM_DELETE");
    expect(source).toContain("onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE }");
    expect(source).toContain("sendDeleteEntry(e.id)");
  });

  it("gestiona el boton atras nativo sin cerrar la app durante flujos de trabajo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("BackHandler");
    expect(source).toContain("handleBack()");
    expect(source).toContain("ScreenState.ADD_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO");
    expect(source).toContain("ScreenState.EDIT_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO");
    expect(source).toContain("ScreenState.END_TURNO -> currentScreen.value = ScreenState.ACTIVE_TURNO");
  });

  it("muestra feedback visible y haptico despues de respuestas del movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("Toast.makeText");
    expect(source).toContain("VibrationEffect");
    expect(source).toContain("performFeedback(");
  });

  it("el instalador del reloj no fija un puerto adb concreto", () => {
    const source = readFileSync(
      resolve(root, "Actualizaciones/actualizar_reloj.bat"),
      "utf8",
    );

    expect(source).not.toContain('set "WATCH=192.168.3.59:40201"');
    expect(source).toContain("if not defined WATCH");
    expect(source).toContain("devices -l");
  });

  it("mantiene un actualizador directo del reloj para compilar instalar y abrir", () => {
    const source = readFileSync(
      resolve(root, "Actualizaciones/actualizar_reloj.bat"),
      "utf8",
    );

    expect(source).toContain(":wear:assembleDebug");
    expect(source).toContain("adb.exe");
    expect(source).toContain("connect !WATCH!");
    expect(source).toContain("install -r");
    expect(source).toContain("am start -n com.mijornada.app/com.mijornada.app.WearMainActivity");
  });

  it("compacta el teclado numerico para que no corte botones en pantalla redonda", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt"),
      "utf8",
    );

    expect(source).toContain("widthFraction: Float = 0.72f");
    expect(source).toContain("keyHeight: Dp = 28.dp");
    expect(source).not.toContain("modifier.fillMaxWidth(0.80f)");
  });

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
    expect(source).not.toContain("Falta €");
    expect(source).not.toContain("Falta km");
  });

  it("pasa entradas y contadores a la pantalla unica de cierre Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("numPorTipo = numPorTipo.value");
    expect(source).toContain("entradas = entradas.value");
  });

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

  it("espeja la contabilidad de la app en el reloj sin recalcularla en nativo", () => {
    const bridge = readFileSync(
      resolve(root, "src/services/watch-bridge.ts"),
      "utf8",
    );
    const stateJson = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchStateJson.kt"),
      "utf8",
    );
    const responseJson = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchResponseJson.kt"),
      "utf8",
    );
    const summary = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt"),
      "utf8",
    );

    // La app precalcula con la regla de oro y lo envia a Room.
    expect(bridge).toContain("calcularTurnoContable");
    expect(bridge).toContain("function turnoContableSnapshot");
    expect(stateJson).toContain('optJSONObject("contable")');
    // El nativo no inventa contabilidad: marca pendiente si falta.
    expect(responseJson).toContain("contablePendiente");
    expect(responseJson).not.toContain("val miGanancia = turno.dinero - totalDescontar");
    // El reloj indica pendiente en lugar de mostrar numeros incorrectos.
    expect(summary).toContain("contablePendiente");
  });

  it("limpia marcas pendientes huerfanas y refresca turnos del reloj al sincronizar", () => {
    const hook = readFileSync(
      resolve(root, "src/hooks/use-firestore-sync.ts"),
      "utf8",
    );
    const activity = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    // Marcas pendientes huerfanas: la verdad la da el SDK (waitForPendingWrites),
    // no la contabilidad manual de promesas por sesion.
    expect(hook).toContain("waitForPendingWrites(db)");
    expect(hook).toContain("readUserPendingSync(uid)");
    // El reloj re-pide turnos al recibir STATUS estando en la lista o el resumen
    // y actualiza el turno abierto con los datos recien llegados.
    expect(activity).toContain("if (currentScreen.value == ScreenState.TURNOS || currentScreen.value == ScreenState.TURNO_SUMMARY) {");
    expect(activity).toContain("selectedTurno.value = list.firstOrNull { it.id == abierto.id } ?: abierto");
  });

  it("muestra las notas completas en el reloj sin truncarlas", () => {
    const active = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );
    const resumen = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt"),
      "utf8",
    );
    const cierre = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );

    // La nota de cada entrada es visible en ULTIMAS ENTRADAS, como en la app movil.
    expect(active).toContain("TextOverflow.Ellipsis");
    expect(active).toContain("if (entry.note.isNotBlank()) {");
    // Ninguna pantalla trunca notas a N caracteres.
    expect(active).not.toContain("entry.note.take(");
    expect(resumen).not.toContain("entry.note.take(");
    expect(cierre).not.toContain("entry.note.take(");
  });

  it("anade iconos de metrica y notas vacias estilo movil en el reloj", () => {
    const iconos = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/CategoriaIcons.kt"),
      "utf8",
    );
    const resumen = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt"),
      "utf8",
    );
    const turnos = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt"),
      "utf8",
    );
    const cierre = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );

    // Iconos de metricas como en la app movil (summary-icons.tsx).
    expect(iconos).toContain("fun MetricIcon(");
    expect(resumen).toContain('SummaryMetric("taximetro"');
    expect(resumen).toContain('"descontar"');
    expect(resumen).toContain('"dar"');
    expect(turnos).toContain('MiniMetric("taximetro"');
    // Sin notas: una sola linea en cursiva, sin bloque con cabecera.
    expect(resumen).toContain("notasTurno.isEmpty() && notasDetalladas.isEmpty()");
    expect(resumen).toContain("FontStyle.Italic");
    expect(cierre).toContain("FontStyle.Italic");
  });

  it("expone tile y complicacion de esfera con el estado del turno", () => {
    const manifest = readFileSync(
      resolve(root, "android/wear/src/main/AndroidManifest.xml"),
      "utf8",
    );
    const gradle = readFileSync(
      resolve(root, "android/wear/build.gradle"),
      "utf8",
    );
    const tile = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/TurnoTileService.kt"),
      "utf8",
    );
    const complicacion = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/TurnoComplicationService.kt"),
      "utf8",
    );
    const store = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/TurnoStatusStore.kt"),
      "utf8",
    );
    const responseService = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/MobileResponseService.kt"),
      "utf8",
    );

    // Servicios registrados con los permisos oficiales de Wear OS.
    expect(manifest).toContain("com.google.android.wearable.permission.BIND_TILE_PROVIDER");
    expect(manifest).toContain("com.google.android.wearable.permission.BIND_COMPLICATION_PROVIDER");
    expect(manifest).toContain("androidx.wear.tiles.PREVIEW");
    expect(gradle).toContain("androidx.wear.tiles:tiles");
    expect(gradle).toContain("watchface-complications-data-source-ktx");
    // Implementaciones y refresco push al llegar STATUS del movil.
    expect(tile).toContain("class TurnoTileService : TileService()");
    expect(complicacion).toContain("SuspendingComplicationDataSourceService");
    expect(store).toContain("requestUpdate(TurnoTileService::class.java)");
    expect(store).toContain("requestUpdateAll()");
    expect(responseService).toContain("TurnoStatusStore.save(this, responseJson)");
    // Botones de la tile: abren la app con la acción por el circuito seguro.
    expect(tile).toContain("addKeyToExtraMapping(EXTRA_ACCION_TILE");
    const activityWear = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );
    expect(activityWear).toContain("EXTRA_ACCION_TILE");
    expect(activityWear).toContain("private fun consumeTileAction()");
    // Solo lectura de estado confirmado: sin escrituras de negocio.
    expect(tile).not.toContain("Firestore");
    expect(complicacion).not.toContain("Firestore");
  });

  it("permite editar dinero y km de un turno cerrado desde el reloj (EDIT_TURNO)", () => {
    const contratoTs = readFileSync(
      resolve(root, "src/shared/watch-commands.ts"),
      "utf8",
    );
    const procesadorTs = readFileSync(
      resolve(root, "src/logic/watch-command-processor.ts"),
      "utf8",
    );
    const procesadorKt = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchCommandProcessor.kt"),
      "utf8",
    );
    const parserKt = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WatchCommandJson.kt"),
      "utf8",
    );
    const worker = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/watch/WearCommandWorker.kt"),
      "utf8",
    );
    const activity = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );
    const pantalla = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EditTurnoDatosScreen.kt"),
      "utf8",
    );
    const resumen = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt"),
      "utf8",
    );
    const arquitectura = readFileSync(
      resolve(root, "ARQUITECTURA_RELOJ_WEAR_OS.md"),
      "utf8",
    );

    // Contrato en paridad TS/Kotlin, con edicion completa (entradas incluidas).
    expect(contratoTs).toContain('type: "EDIT_TURNO"');
    expect(contratoTs).toContain("entradas: WatchEntry[]");
    expect(procesadorTs).toContain("command.payload.entradas");
    expect(procesadorKt).toContain("entries = command.entradas");
    expect(parserKt).toContain("entradas = parseEntradas(payload)");
    expect(pantalla).toContain("onConfirm: (Double, Double, List<WatchEntry>) -> Unit");
    expect(pantalla).toContain("AddEntryScreen(");
    expect(procesadorTs).toContain('command.type === "EDIT_TURNO"');
    expect(parserKt).toContain('"EDIT_TURNO" -> WatchCommand.EditTurno(');
    expect(procesadorKt).toContain("processEditTurno");
    // Regla de oro: editar anula la contabilidad guardada (Pendiente).
    expect(procesadorKt).toContain("totalTaximetro = null");
    expect(procesadorKt).toContain("miGanancia = null");
    // Es comando critico (outbox + worker de escritura).
    expect(worker).toContain('"EDIT_TURNO" == type');
    expect(activity).toContain('type == "EDIT_TURNO"');
    expect(activity).toContain("private fun sendEditTurno(");
    // Lapiz funcional y pantalla de edicion.
    expect(resumen).toContain("onEdit: () -> Unit");
    expect(pantalla).toContain("fun EditTurnoDatosScreen(");
    // Documentado en el contrato de arquitectura.
    expect(arquitectura).toContain("EDIT_TURNO");
  });

  it("usa fondos Wear apagados como la app movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/theme/Color.kt"),
      "utf8",
    );

    expect(source).toContain("ColorDatafonoBg = Color(0xFF151032)");
    expect(source).toContain("Color(");
  });
});
