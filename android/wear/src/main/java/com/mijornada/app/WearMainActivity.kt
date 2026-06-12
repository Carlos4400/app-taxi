package com.mijornada.app

import android.app.RemoteInput
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import androidx.wear.input.RemoteInputIntentHelper
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.mijornada.app.screens.*
import com.mijornada.app.theme.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import java.util.concurrent.atomic.AtomicReference

/** Extra con la acción solicitada desde la tile ("iniciar_turno", "continuar", "turnos", "abrir"). */
const val EXTRA_ACCION_TILE = "com.mijornada.app.ACCION_TILE"

enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    TURNOS,
    TURNO_SUMMARY,
    EDIT_TURNO_DATOS,
    ADD_ENTRY,
    EDIT_ENTRY,
    CONFIRM_START_TURNO,
    CONFIRM_PAUSE_TURNO,
    CONFIRM_DELETE,
    END_TURNO
}

class WearMainActivity : ComponentActivity() {

    private val TAG = "WearMainActivity"

    private var isConnected = mutableStateOf(false)
    private var activeTurno = mutableStateOf(false)
    private var startTime = mutableStateOf("")
    private var currentScreen = mutableStateOf(ScreenState.NO_CONNECTED)

    private var selectedCategory = mutableStateOf("")
    private var selectedCategoryLabel = mutableStateOf("")
    private var selectedCategoryColor = mutableStateOf(ColorPropina)

    private var startDate = mutableStateOf("")
    private var userSessionId = mutableStateOf("")
    private var isPaused = mutableStateOf(false)
    private var pauseStartTime = mutableStateOf("")
    private var totalPausedMinutes = mutableStateOf(0)
    private var totalsPorTipo = mutableStateOf<Map<String, Double>>(emptyMap())
    private var numPorTipo = mutableStateOf<Map<String, Int>>(emptyMap())
    private var entradas = mutableStateOf<List<WatchEntry>>(emptyList())
    private var turnos = mutableStateOf<List<WatchTurno>>(emptyList())
    private var selectedTurno = mutableStateOf<WatchTurno?>(null)
    private var editingEntry = mutableStateOf<WatchEntry?>(null)
    private var openTurnosAfterOk = false
    private var turnosLoading = mutableStateOf(false)
    private var pendingTileAction: String? = null
    private var pendingOpsCount = mutableStateOf(0)
    private var requestingNote = mutableStateOf(false)
    private val mainHandler = Handler(Looper.getMainLooper())
    private val resyncRunnable = Runnable { requestStatus() }
    private fun scheduleResync(delayMs: Long) {
        mainHandler.removeCallbacks(resyncRunnable)
        mainHandler.postDelayed(resyncRunnable, delayMs)
    }

    /** WakeLock parcial breve para que el OutboxWorker pueda completar sus reenvios
     *  antes de que el reloj entre en Doze al cerrarse la pantalla del usuario. */
    private var operationWakeLock: PowerManager.WakeLock? = null
    private fun acquireOperationWakeLock() {
        if (operationWakeLock?.isHeld == true) return
        val pm = getSystemService(PowerManager::class.java) ?: return
        val wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MiTurno:operation-pending")
        try {
            wl.setReferenceCounted(false)
            wl.acquire(15_000L) // 15s maximo
            operationWakeLock = wl
        } catch (_: Exception) {
            // si el sistema rechaza el wakelock, ignorar; el WorkManager seguira igualmente
        }
    }
    private fun releaseOperationWakeLockIfIdle() {
        if (WatchOutbox.hasPendingCommands(this).not()) {
            try { operationWakeLock?.takeIf { it.isHeld }?.release() } catch (_: Exception) {}
            operationWakeLock = null
        }
    }

    private fun refreshPendingOpsCount() {
        pendingOpsCount.value = WatchOutbox.pendingCommands(this).size
    }

    /** Invariante de navegacion: una sincronizacion de fondo (STATUS) solo puede
     *  redirigir entre estas pantallas de reposo. Cualquier otra pantalla
     *  (consultas, formularios, edicion) pertenece a una accion del usuario y
     *  solo se abandona por decision suya o por la respuesta de su comando. */
    private val pantallasDeReposo = setOf(
        ScreenState.NO_CONNECTED,
        ScreenState.NO_ACTIVE_TURNO,
        ScreenState.ACTIVE_TURNO,
    )

    /** Flujo de consulta/edicion de turnos cerrados: un TURNOS_STATUS de fondo
     *  actualiza sus datos pero nunca les roba la pantalla. */
    private val pantallasFlujoTurnos = setOf(
        ScreenState.TURNOS,
        ScreenState.TURNO_SUMMARY,
        ScreenState.EDIT_TURNO_DATOS,
    )

    /** Pantallas tipo formulario donde un OK/DUPLICATE_IGNORED de un comando debe cerrar el form. */
    private val formScreens = setOf(
        ScreenState.ADD_ENTRY,
        ScreenState.EDIT_ENTRY,
        ScreenState.CONFIRM_DELETE,
        ScreenState.END_TURNO,
    )
    private var isUiActive = false

    private val prefs by lazy { getSharedPreferences(WearConstants.Response.PREFS, MODE_PRIVATE) }

    /** Procesa en vivo las respuestas que MobileResponseService guarda en prefs.
     *  Sin este listener la Activity solo leia respuestas en onResume, por lo que
     *  la pantalla no avanzaba hasta bloquear/desbloquear el reloj. Valido porque
     *  servicio y Activity comparten proceso. */
    private val responsePrefsListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key == WearConstants.Response.RESPONSE_TIMESTAMP) {
            pollResponseState()
        }
    }
    private val timestampPrefs by lazy { getSharedPreferences("wear_main_activity_state", MODE_PRIVATE) }
    private var lastKnownResponseTimestamp: Long
        get() = timestampPrefs.getLong("last_known_response_ts", 0L)
        set(value) { timestampPrefs.edit().putLong("last_known_response_ts", value).apply() }

    // Entrada de texto (nota) vía teclado / voz del sistema (RemoteInput)
    private val NOTE_KEY = "wear_note"
    private val pendingNoteCallback = AtomicReference<((String) -> Unit)?>(null)
    private lateinit var noteLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        refreshPendingOpsCount()
        pendingTileAction = intent?.getStringExtra(EXTRA_ACCION_TILE)

        noteLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val data: Intent? = result.data
            if (data != null) {
                val results = RemoteInput.getResultsFromIntent(data)
                val text = results?.getCharSequence(NOTE_KEY)?.toString() ?: ""
                pendingNoteCallback.getAndSet(null)?.invoke(text)
            } else {
                pendingNoteCallback.set(null)
            }
            requestingNote.value = false
        }

        setContent {
            WearAppTheme {
                MainContent()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        pendingTileAction = intent.getStringExtra(EXTRA_ACCION_TILE)
        consumeTileAction()
    }

    /** Ejecuta la acción pedida desde la tile por el circuito normal de la app.
     *  Si aún no hay sesión confirmada, se reintenta al procesar el STATUS. */
    private fun consumeTileAction() {
        val accion = pendingTileAction ?: return
        when (accion) {
            "iniciar_turno" -> {
                if (activeTurno.value) {
                    pendingTileAction = null
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                } else if (userSessionId.value.isNotBlank()) {
                    pendingTileAction = null
                    currentScreen.value = ScreenState.CONFIRM_START_TURNO
                }
                // Sin sesión todavía: conservar la acción y esperar al STATUS.
            }
            "continuar" -> {
                pendingTileAction = null
                if (activeTurno.value) currentScreen.value = ScreenState.ACTIVE_TURNO
            }
            "turnos" -> {
                pendingTileAction = null
                if (sendGetTurnos()) {
                    turnosLoading.value = true
                    currentScreen.value = ScreenState.TURNOS
                }
            }
            else -> pendingTileAction = null
        }
    }

    override fun onResume() {
        super.onResume()
        isUiActive = true
        refreshPendingOpsCount()
        prefs.registerOnSharedPreferenceChangeListener(responsePrefsListener)
        pollResponseState()
        consumeTileAction()
        // Si quedo una carga de turnos pendiente (respuesta perdida o sobrescrita
        // mientras la Activity estaba pausada), reintentar la peticion.
        if (currentScreen.value == ScreenState.TURNOS && turnosLoading.value) {
            sendGetTurnos()
        }
        requestStatus()
    }

    override fun onPause() {
        isUiActive = false
        prefs.unregisterOnSharedPreferenceChangeListener(responsePrefsListener)
        super.onPause()
    }

    private fun pollResponseState() {
        val ts = prefs.getLong(WearConstants.Response.RESPONSE_TIMESTAMP, 0L)
        if (ts != lastKnownResponseTimestamp) {
            lastKnownResponseTimestamp = ts
            val responseJson = prefs.getString(WearConstants.Response.LAST_RESPONSE, null) ?: return
            processResponseFromPrefs(responseJson)
        }
    }

    private fun processResponseFromPrefs(responseJson: String) {
        try {
            val json = JSONObject(responseJson)
            val responseType = json.optString("type")
            val operationId = json.optString("operationId", "")
            val isTerminal = WearConstants.isTerminalResponse(responseType, json.optString("code", ""))
            if (operationId.isNotBlank() && isTerminal) {
                WatchOutbox.remove(this, operationId)
            }
            if (responseType == "STATUS") {
                refreshPendingOpsCount()
                val nextUserSessionId = json.optString("userSessionId", "")
                if (nextUserSessionId.isNotBlank()) {
                    WatchOutbox.removeCommandsFromOtherSessions(this, nextUserSessionId)
                }
                userSessionId.value = nextUserSessionId
                isConnected.value = json.optBoolean("connected", false)
                activeTurno.value = json.optBoolean("activeTurno", false)
                startTime.value = json.optString("startTime", "")
                startDate.value = json.optString("startDate", "")
                isPaused.value = json.optBoolean("isPaused", false)
                pauseStartTime.value = json.optString("pauseStartTime", "")
                totalPausedMinutes.value = json.optInt("totalPausedMinutes", 0)
                parseTotals(json.optJSONObject("totals"))
                parseEntradas(json.optJSONArray("entradas"))
                MobileResponseService.enqueueOutboxRetry(this)

                // Invariante: un STATUS de fondo solo navega entre pantallas de
                // reposo. Nunca expulsa de consultas, formularios o ediciones.
                if (currentScreen.value in pantallasDeReposo) {
                    currentScreen.value = when {
                        !isConnected.value -> ScreenState.NO_CONNECTED
                        activeTurno.value -> ScreenState.ACTIVE_TURNO
                        else -> ScreenState.NO_ACTIVE_TURNO
                    }
                }

                // El movil publica /turno/state tras sincronizar Room (incluida la
                // contabilidad precalculada). Si el usuario esta mirando la lista o
                // un resumen, re-pedir los turnos para que "Pendiente" se sustituya
                // por los numeros reales sin tener que cerrar y reabrir la app.
                // Sin riesgo de bucle: GET_TURNOS es de solo lectura y el movil no
                // publica /turno/state al responderlo.
                if (currentScreen.value == ScreenState.TURNOS || currentScreen.value == ScreenState.TURNO_SUMMARY) {
                    sendGetTurnos()
                }

                // Acción pendiente de la tile que esperaba sesión/estado confirmado.
                consumeTileAction()
            } else if ("TURNOS_STATUS" == json.optString("type")) {
                turnosLoading.value = false
                isConnected.value = json.optBoolean("connected", false)
                parseTurnos(json.optJSONArray("turnos"))
                if (isConnected.value) {
                    // Navegar a la lista solo si el usuario no esta ya dentro del
                    // flujo de turnos: los refrescos de fondo actualizan datos
                    // sin robar la pantalla.
                    if (currentScreen.value !in pantallasFlujoTurnos) {
                        currentScreen.value = ScreenState.TURNOS
                    }
                } else if (currentScreen.value in pantallasDeReposo) {
                    currentScreen.value = ScreenState.NO_CONNECTED
                }
            } else if ("OK" == json.optString("type")) {
                refreshPendingOpsCount()
                releaseOperationWakeLockIfIdle()
                performFeedback(json.optString("message", "Hecho"), strong = false)
                if (openTurnosAfterOk) {
                    openTurnosAfterOk = false
                    sendGetTurnos()
                } else {
                    // Solo navegar a ACTIVE_TURNO si el usuario sigue en un formulario.
                    // En TURNOS, TURNO_SUMMARY, NO_CONNECTED: respetar pantalla actual.
                    if (currentScreen.value == ScreenState.EDIT_TURNO_DATOS) {
                        // Edicion de turno cerrado confirmada: volver al resumen
                        // y re-pedir la lista para mostrar los datos del movil.
                        currentScreen.value = ScreenState.TURNO_SUMMARY
                        sendGetTurnos()
                    } else if (currentScreen.value in formScreens) {
                        currentScreen.value = ScreenState.ACTIVE_TURNO
                    }
                    requestStatus()
                }
            } else if ("DUPLICATE_IGNORED" == json.optString("type")) {
                refreshPendingOpsCount()
                releaseOperationWakeLockIfIdle()
                performFeedback(json.optString("message", "Ya aplicado"), strong = false)
                if (currentScreen.value == ScreenState.EDIT_TURNO_DATOS) {
                    currentScreen.value = ScreenState.TURNO_SUMMARY
                    sendGetTurnos()
                } else if (currentScreen.value in formScreens) {
                    currentScreen.value = if (activeTurno.value) ScreenState.ACTIVE_TURNO else ScreenState.NO_ACTIVE_TURNO
                }
                requestStatus()
                MobileResponseService.enqueueOutboxRetry(this)
            } else if ("ERROR" == json.optString("type")) {
                openTurnosAfterOk = false
                refreshPendingOpsCount()
                releaseOperationWakeLockIfIdle()
                performFeedback(json.optString("message", "Error"), strong = true)
                // Optimismo: si aplicamos un cambio local y el movil rechazo, resync
                // con el estado real para evitar inconsistencias visuales.
                requestStatus()
            }
        } catch (e: Exception) {
            performFeedback("Error al leer respuesta", strong = true)
        }
    }

    @Composable
    fun MainContent() {
        BackHandler(enabled = currentScreen.value != ScreenState.NO_CONNECTED) {
            handleBack()
        }

        Crossfade(
            targetState = currentScreen.value,
            animationSpec = tween(durationMillis = 220),
            label = "screen-crossfade"
        ) { screen ->
        when (screen) {
            ScreenState.NO_CONNECTED -> NoConnectedScreen(onRetry = { requestStatus() })
            ScreenState.NO_ACTIVE_TURNO -> NoActiveTurnoScreen(
                pendingOpsCount = pendingOpsCount.value,
                onStartTurno = { currentScreen.value = ScreenState.CONFIRM_START_TURNO },
                onOpenTurnos = {
                    // Navegacion inmediata con estado de carga; la lista llega
                    // despues con TURNOS_STATUS.
                    if (sendGetTurnos()) {
                        turnosLoading.value = true
                        currentScreen.value = ScreenState.TURNOS
                    }
                }
            )
            ScreenState.CONFIRM_START_TURNO -> ConfirmStartTurnoScreen(
                onCancel = { currentScreen.value = ScreenState.NO_ACTIVE_TURNO },
                onConfirm = {
                    val sent = sendStartTurno()
                    if (sent) {
                        currentScreen.value = ScreenState.NO_ACTIVE_TURNO
                    }
                    sent
                }
            )
            ScreenState.ACTIVE_TURNO -> ActiveTurnoScreen(
                pendingOpsCount = pendingOpsCount.value,
                fechaTurno = formatFechaTurno(startDate.value),
                startTime = startTime.value,
                isPaused = isPaused.value,
                pauseStartTime = pauseStartTime.value,
                totalPausedMinutes = totalPausedMinutes.value,
                totalsPorTipo = totalsPorTipo.value,
                numPorTipo = numPorTipo.value,
                entradas = entradas.value,
                onTogglePause = {
                    if (isPaused.value) {
                        sendResumeTurno()
                    } else {
                        currentScreen.value = ScreenState.CONFIRM_PAUSE_TURNO
                        true
                    }
                },
                onSelectCategory = { category ->
                    selectedCategory.value = category
                    setupCategoryMeta(category)
                    currentScreen.value = ScreenState.ADD_ENTRY
                },
                onAddNote = {
                    if (requestNote("") { text ->
                        if (text.isNotBlank()) sendAddNote(text)
                    }) {
                        requestingNote.value = true
                        true
                    } else {
                        false
                    }
                },
                requestingNote = requestingNote.value,
                onEditEntry = { entry ->
                    editingEntry.value = entry
                    currentScreen.value = ScreenState.EDIT_ENTRY
                },
                onEndTurno = {
                    currentScreen.value = ScreenState.END_TURNO
                }
            )
            ScreenState.CONFIRM_PAUSE_TURNO -> ConfirmPauseTurnoScreen(
                onCancel = { currentScreen.value = ScreenState.ACTIVE_TURNO },
                onConfirm = {
                    val sent = sendPauseTurno()
                    if (sent) {
                        currentScreen.value = ScreenState.ACTIVE_TURNO
                    }
                    sent
                }
            )
            ScreenState.ADD_ENTRY -> AddEntryScreen(
                categoryLabel = selectedCategoryLabel.value,
                categoryColor = selectedCategoryColor.value,
                onSave = { amount, note ->
                    if (sendAddEntry(selectedCategory.value, amount, note)) {
                        currentScreen.value = ScreenState.ACTIVE_TURNO
                    }
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                },
                onRequestNote = { current, onResult -> requestNote(current, onResult) }
            )
            ScreenState.EDIT_ENTRY -> {
                val e = editingEntry.value
                if (e == null) {
                    LaunchedEffect(Unit) { currentScreen.value = ScreenState.ACTIVE_TURNO }
                } else {
                    val meta = categoriaMeta(e.type)
                    AddEntryScreen(
                        categoryLabel = categoriaLabelSingular(e.type),
                        categoryColor = meta.color,
                        initialAmount = e.amount,
                        initialNote = e.note,
                        onSave = { amount, note ->
                            if (sendEditEntry(e.id, amount, note)) {
                                currentScreen.value = ScreenState.ACTIVE_TURNO
                            }
                        },
                        onCancel = { currentScreen.value = ScreenState.ACTIVE_TURNO },
                        onRequestNote = { current, onResult -> requestNote(current, onResult) },
                        onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE },
                        esNota = e.type == "nota"
                    )
                }
            }
            ScreenState.CONFIRM_DELETE -> {
                val e = editingEntry.value
                if (e == null) {
                    LaunchedEffect(Unit) { currentScreen.value = ScreenState.ACTIVE_TURNO }
                } else {
                    ConfirmDeleteScreen(
                        entry = e,
                        onCancel = { currentScreen.value = ScreenState.EDIT_ENTRY },
                        onConfirm = {
                            if (sendDeleteEntry(e.id)) {
                                currentScreen.value = ScreenState.ACTIVE_TURNO
                            }
                        }
                    )
                }
            }
            ScreenState.END_TURNO -> EndTurnoScreen(
                totalsPorTipo = totalsPorTipo.value,
                numPorTipo = numPorTipo.value,
                entradas = entradas.value,
                onConfirm = { dinero, km ->
                    if (sendEndTurno(dinero, km)) {
                        currentScreen.value = ScreenState.NO_ACTIVE_TURNO
                    }
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                }
            )
            ScreenState.TURNOS -> TurnosScreen(
                turnos = turnos.value,
                isLoading = turnosLoading.value,
                onBack = {
                    turnosLoading.value = false
                    currentScreen.value = if (activeTurno.value) ScreenState.ACTIVE_TURNO else ScreenState.NO_ACTIVE_TURNO
                },
                onOpenTurno = { turno ->
                    selectedTurno.value = turno
                    currentScreen.value = ScreenState.TURNO_SUMMARY
                }
            )
            ScreenState.TURNO_SUMMARY -> {
                val turno = selectedTurno.value
                if (turno == null) {
                    LaunchedEffect(Unit) { currentScreen.value = ScreenState.TURNOS }
                } else {
                    TurnoSummaryScreen(
                        turno = turno,
                        onBack = { currentScreen.value = ScreenState.TURNOS },
                        onHome = { currentScreen.value = if (activeTurno.value) ScreenState.ACTIVE_TURNO else ScreenState.NO_ACTIVE_TURNO },
                        onEdit = { currentScreen.value = ScreenState.EDIT_TURNO_DATOS }
                    )
                }
            }
            ScreenState.EDIT_TURNO_DATOS -> {
                val turno = selectedTurno.value
                if (turno == null) {
                    LaunchedEffect(Unit) { currentScreen.value = ScreenState.TURNOS }
                } else {
                    EditTurnoDatosScreen(
                        turno = turno,
                        onRequestNote = { current, onResult -> requestNote(current, onResult) },
                        onConfirm = { dinero, km, entradas ->
                            if (!sendEditTurno(turno.id, dinero, km, entradas)) {
                                currentScreen.value = ScreenState.TURNO_SUMMARY
                            }
                        },
                        onCancel = { currentScreen.value = ScreenState.TURNO_SUMMARY }
                    )
                }
            }
        }
        }
    }

    private fun handleBack() {
        when (currentScreen.value) {
            ScreenState.ADD_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.EDIT_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.CONFIRM_START_TURNO -> currentScreen.value = ScreenState.NO_ACTIVE_TURNO
            ScreenState.CONFIRM_PAUSE_TURNO -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.CONFIRM_DELETE -> currentScreen.value = ScreenState.EDIT_ENTRY
            ScreenState.END_TURNO -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.TURNOS -> {
                turnosLoading.value = false
                currentScreen.value = if (activeTurno.value) ScreenState.ACTIVE_TURNO else ScreenState.NO_ACTIVE_TURNO
            }
            ScreenState.TURNO_SUMMARY -> currentScreen.value = ScreenState.TURNOS
            ScreenState.EDIT_TURNO_DATOS -> currentScreen.value = ScreenState.TURNO_SUMMARY
            ScreenState.NO_ACTIVE_TURNO -> Unit
            ScreenState.ACTIVE_TURNO -> Unit
            ScreenState.NO_CONNECTED -> Unit
        }
    }

    private fun setupCategoryMeta(category: String) {
        when (category) {
            "propina" -> {
                selectedCategoryLabel.value = "Propina"
                selectedCategoryColor.value = ColorPropina
            }
            "datafono" -> {
                selectedCategoryLabel.value = "Datáfono"
                selectedCategoryColor.value = ColorDatafono
            }
            "agencia_bono" -> {
                selectedCategoryLabel.value = "Agencia/Bono"
                selectedCategoryColor.value = ColorAgencia
            }
            "extra" -> {
                selectedCategoryLabel.value = "Extra"
                selectedCategoryColor.value = ColorExtra
            }
            "gasolina" -> {
                selectedCategoryLabel.value = "Gasolina"
                selectedCategoryColor.value = ColorGasolina
            }
            "nulo" -> {
                selectedCategoryLabel.value = "Nulo"
                selectedCategoryColor.value = ColorNulo
            }
        }
    }

    private fun requestStatus() {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "GET_STATUS")
            put("createdAt", System.currentTimeMillis().toString())
        }
        sendCommand(command.toString())
    }

    private fun sendStartTurno(): Boolean = sendTurnoStateCommand("START_TURNO")

    private fun sendPauseTurno(): Boolean = sendTurnoStateCommand("PAUSE_TURNO")

    private fun sendResumeTurno(): Boolean = sendTurnoStateCommand("RESUME_TURNO")

    private fun sendTurnoStateCommand(type: String): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", type)
            put("createdAt", System.currentTimeMillis().toString())
        }
        val sent = sendCommand(command.toString())
        if (sent) {
            when (type) {
                "PAUSE_TURNO" -> {
                    isPaused.value = true
                    pauseStartTime.value = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
                }
                "RESUME_TURNO" -> {
                    isPaused.value = false
                }
                "START_TURNO" -> {
                    activeTurno.value = true
                    startTime.value = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
                    startDate.value = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
                    isPaused.value = false
                    pauseStartTime.value = ""
                    totalPausedMinutes.value = 0
                    totalsPorTipo.value = emptyMap()
                    numPorTipo.value = emptyMap()
                    entradas.value = emptyList()
                    // Navegacion optimista: antes la pantalla no cambiaba hasta
                    // procesar el STATUS del movil. El STATUS posterior corrige
                    // el estado si el movil rechaza el comando (ERROR -> resync).
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                }
            }
        }
        return sent
    }

    private fun sendGetTurnos(): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "GET_TURNOS")
            put("createdAt", System.currentTimeMillis().toString())
        }
        return sendCommand(command.toString())
    }

    /** Aplica un cambio inmediato y local de entradas/totales (optimistic UI).
     *  Si el movil confirma con OK, el STATUS posterior solo refrescara los mismos datos.
     *  Si responde ERROR, requestStatus() forzara el resync correcto. */
    private fun applyOptimisticAddEntry(entryType: String, amount: Double, note: String) {
        if (entryType.isBlank()) return
        val newEntry = WatchEntry(
            id = -System.currentTimeMillis(),
            type = entryType,
            amount = amount,
            note = note,
            time = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
        )
        entradas.value = entradas.value + newEntry
        if (entryType != "nota") {
            val nuevosTot = totalsPorTipo.value.toMutableMap()
            nuevosTot[entryType] = (nuevosTot[entryType] ?: 0.0) + amount
            totalsPorTipo.value = nuevosTot
            val nuevosNum = numPorTipo.value.toMutableMap()
            nuevosNum[entryType] = (nuevosNum[entryType] ?: 0) + 1
            numPorTipo.value = nuevosNum
        }
    }

    private fun applyOptimisticEditEntry(id: Long, amount: Double, note: String) {
        val before = entradas.value.firstOrNull { it.id == id } ?: return
        val updated = before.copy(amount = amount, note = note)
        entradas.value = entradas.value.map { if (it.id == id) updated else it }
        if (before.type != "nota") {
            val diff = amount - before.amount
            val nuevosTot = totalsPorTipo.value.toMutableMap()
            nuevosTot[before.type] = (nuevosTot[before.type] ?: 0.0) + diff
            totalsPorTipo.value = nuevosTot
        }
    }

    private fun applyOptimisticDeleteEntry(id: Long) {
        val target = entradas.value.firstOrNull { it.id == id } ?: return
        entradas.value = entradas.value.filterNot { it.id == id }
        if (target.type != "nota") {
            val nuevosTot = totalsPorTipo.value.toMutableMap()
            nuevosTot[target.type] = ((nuevosTot[target.type] ?: 0.0) - target.amount).coerceAtLeast(0.0)
            totalsPorTipo.value = nuevosTot
            val nuevosNum = numPorTipo.value.toMutableMap()
            nuevosNum[target.type] = ((nuevosNum[target.type] ?: 0) - 1).coerceAtLeast(0)
            numPorTipo.value = nuevosNum
        }
    }

    private fun sendAddEntry(entryType: String, amount: Double, note: String): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "ADD_ENTRY")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("entryType", entryType)
                put("amount", amount)
                put("note", note)
            })
        }
        val sent = sendCommand(command.toString())
        if (sent) applyOptimisticAddEntry(entryType, amount, note)
        return sent
    }

    private fun parseTotals(totals: JSONObject?) {
        if (totals == null) {
            totalsPorTipo.value = emptyMap()
            numPorTipo.value = emptyMap()
            return
        }
        val tipos = listOf("propina", "datafono", "agencia_bono", "extra", "gasolina", "nulo")
        val porTipo = totals.optJSONObject("porTipo")
        val numTipo = totals.optJSONObject("numPorTipo")
        totalsPorTipo.value = tipos.associateWith { porTipo?.optDouble(it, 0.0) ?: 0.0 }
        numPorTipo.value = tipos.associateWith { numTipo?.optInt(it, 0) ?: 0 }
    }

    private fun parseEntradas(arr: JSONArray?) {
        if (arr == null) {
            entradas.value = emptyList()
            return
        }
        val list = mutableListOf<WatchEntry>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            list.add(
                WatchEntry(
                    id = o.optLong("id", 0L),
                    type = o.optString("type", ""),
                    amount = o.optDouble("amount", 0.0),
                    note = o.optString("note", ""),
                    time = o.optString("time", "")
                )
            )
        }
        entradas.value = list
    }

    private fun parseTurnos(arr: JSONArray?) {
        if (arr == null) {
            turnos.value = emptyList()
            return
        }
        val list = mutableListOf<WatchTurno>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            val totals = o.optJSONObject("totals")
            list.add(
                WatchTurno(
                    id = o.optLong("id", 0L),
                    date = o.optString("date", ""),
                    startDate = o.optString("startDate", ""),
                    startTime = o.optString("startTime", ""),
                    endTime = o.optString("endTime", ""),
                    dinero = o.optDouble("dinero", 0.0),
                    km = o.optDouble("km", 0.0),
                    totalTaximetro = o.optDouble("totalTaximetro", 0.0),
                    miGanancia = o.optDouble("miGanancia", 0.0),
                    totalADescontar = o.optDouble("totalADescontar", 0.0),
                    totalADar = o.optDouble("totalADar", 0.0),
                    contablePendiente = o.optBoolean("contablePendiente", false),
                    tiempoTrabajado = o.optString("tiempoTrabajado", ""),
                    totals = parseTurnoTotals(totals),
                    entradas = parseEntryArray(o.optJSONArray("entradas"))
                )
            )
        }
        turnos.value = list
        // Refrescar el turno abierto en el resumen con los datos recien llegados
        // (p. ej. contabilidad ya calculada por la app). Si ya no existe en la
        // lista, conservar el que se estaba mostrando.
        val abierto = selectedTurno.value
        if (abierto != null) {
            selectedTurno.value = list.firstOrNull { it.id == abierto.id } ?: abierto
        }
    }

    private fun parseTurnoTotals(totals: JSONObject?): WatchTurnoTotals {
        val tipos = listOf("propina", "datafono", "agencia_bono", "extra", "gasolina", "nulo")
        val porTipo = totals?.optJSONObject("porTipo")
        val numTipo = totals?.optJSONObject("numPorTipo")
        return WatchTurnoTotals(
            porTipo = tipos.associateWith { porTipo?.optDouble(it, 0.0) ?: 0.0 },
            numPorTipo = tipos.associateWith { numTipo?.optInt(it, 0) ?: 0 },
            numEntradas = totals?.optInt("numEntradas", 0) ?: 0
        )
    }

    private fun parseEntryArray(arr: JSONArray?): List<WatchEntry> {
        if (arr == null) return emptyList()
        val list = mutableListOf<WatchEntry>()
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            list.add(
                WatchEntry(
                    id = o.optLong("id", 0L),
                    type = o.optString("type", ""),
                    amount = o.optDouble("amount", 0.0),
                    note = o.optString("note", ""),
                    time = o.optString("time", "")
                )
            )
        }
        return list
    }

    private fun sendEditEntry(id: Long, amount: Double, note: String): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "EDIT_ENTRY")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("id", id)
                put("amount", amount)
                put("note", note)
            })
        }
        val sent = sendCommand(command.toString())
        if (sent) applyOptimisticEditEntry(id, amount, note)
        return sent
    }

    private fun sendDeleteEntry(id: Long): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "DELETE_ENTRY")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("id", id)
            })
        }
        val sent = sendCommand(command.toString())
        if (sent) applyOptimisticDeleteEntry(id)
        return sent
    }

    private fun sendAddNote(noteText: String): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "ADD_NOTE")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("note", noteText)
            })
        }
        return sendCommand(command.toString())
    }

    private fun sendEndTurno(dinero: Double, km: Double): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "END_TURNO")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("dinero", dinero)
                put("km", km)
                put("note", "Cierre desde reloj")
            })
        }
        openTurnosAfterOk = sendCommand(command.toString())
        return openTurnosAfterOk
    }

    private fun sendEditTurno(id: Long, dinero: Double, km: Double, entradas: List<WatchEntry>): Boolean {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "EDIT_TURNO")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("id", id)
                put("dinero", dinero)
                put("km", km)
                put("entradas", JSONArray().also { array ->
                    entradas.forEach { entry ->
                        array.put(JSONObject().apply {
                            put("id", entry.id)
                            put("type", entry.type)
                            put("amount", entry.amount)
                            put("note", entry.note)
                            put("time", entry.time)
                        })
                    }
                })
            })
        }
        val sent = sendCommand(command.toString())
        if (sent) applyOptimisticEditTurno(id, dinero, km, entradas)
        return sent
    }

    /** Optimista: el turno editado muestra los datos nuevos al instante y su
     *  contabilidad pasa a Pendiente hasta que la app la recalcule (regla de
     *  oro: nunca mostrar numeros contables no confirmados). dineroBase no
     *  depende de ajustes, por eso si puede actualizarse en local. */
    private fun applyOptimisticEditTurno(id: Long, dinero: Double, km: Double, entradas: List<WatchEntry>) {
        val tipos = listOf("propina", "datafono", "agencia_bono", "extra", "gasolina", "nulo")
        val porTipo = tipos.associateWith { tipo -> entradas.filter { it.type == tipo }.sumOf { it.amount } }
        val numPorTipo = tipos.associateWith { tipo -> entradas.count { it.type == tipo } }
        turnos.value = turnos.value.map { turno ->
            if (turno.id == id) {
                val nulos = porTipo["nulo"] ?: 0.0
                turno.copy(
                    dinero = dinero,
                    km = km,
                    entradas = entradas,
                    totals = WatchTurnoTotals(porTipo, numPorTipo, entradas.size),
                    totalTaximetro = dinero - nulos,
                    miGanancia = 0.0,
                    totalADescontar = 0.0,
                    totalADar = 0.0,
                    contablePendiente = true,
                )
            } else {
                turno
            }
        }
        val abierto = selectedTurno.value
        if (abierto != null && abierto.id == id) {
            selectedTurno.value = turnos.value.firstOrNull { it.id == id } ?: abierto
        }
    }

    /** Lanza el teclado / voz del sistema para introducir una nota de texto libre. */
    private fun requestNote(current: String, onResult: (String) -> Unit): Boolean {
        if (!pendingNoteCallback.compareAndSet(null, onResult)) {
            // Ya hay una nota pendiente esperando; no reabrir el RemoteInput.
            performFeedback("Nota pendiente", strong = false)
            return false
        }
        val remoteInputs = listOf(
            RemoteInput.Builder(NOTE_KEY)
                .setLabel(if (current.isBlank()) "Nota" else current.take(24))
                .build()
        )
        val intent: Intent = RemoteInputIntentHelper.createActionRemoteInputIntent()
        RemoteInputIntentHelper.putRemoteInputsExtra(intent, remoteInputs)
        noteLauncher.launch(intent)
        return true
    }

    private fun performFeedback(message: String, strong: Boolean) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        val vibrator = getSystemService(Vibrator::class.java) ?: return
        val durationMs = if (strong) 120L else 65L
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(durationMs)
        }
    }

    private fun sendCommand(rawCommandJson: String, isRetry: Boolean = false): Boolean {
        if (!isRetry && shouldPersistOutbox(rawCommandJson) && hasPendingCriticalOperation()) {
            performFeedback("Operacion pendiente", strong = true)
            return false
        }
        if (shouldPersistOutbox(rawCommandJson) && userSessionId.value.isBlank()) {
            if (!isRetry) {
                performFeedback("Esperando movil...", strong = false)
                requestStatus()
            }
            return false
        }
        val commandJson = attachUserSession(rawCommandJson) ?: return false
        if (isRetry && !matchesCurrentSession(commandJson)) {
            return false
        }
        refreshPendingOpsCount()
        scheduleResync(2500L)
        if (pendingOpsCount.value > 0) acquireOperationWakeLock()
        if (!isRetry && shouldPersistOutbox(commandJson)) {
            val operationId = JSONObject(commandJson).optString("operationId", "")
            WatchOutbox.save(this, operationId, commandJson)
            MobileResponseService.enqueueOutboxRetry(this)
        }
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                val nodeId = nodes.firstOrNull()?.id ?: ""
                writeCommandDataItem(commandJson, nodeId)
            }
            .addOnFailureListener {
                writeCommandDataItem(commandJson, "")
            }
        return true
    }

    /**
     * Anade [userSessionId] al comando si todavia no lo tiene. Se asume que
     * `userSessionId.value` no esta en blanco: [sendCommand] bloquea los comandos
     * persistentes hasta recibir una sesion valida del movil.
     */
    private fun attachUserSession(commandJson: String): String? {
        if (!shouldPersistOutbox(commandJson)) return commandJson
        return try {
            val command = JSONObject(commandJson)
            val existingSessionId = command.optString("userSessionId", "")
            when {
                existingSessionId.isNotBlank() -> command.toString()
                userSessionId.value.isBlank() -> null
                else -> command.put("userSessionId", userSessionId.value).toString()
            }
        } catch (e: Exception) {
            performFeedback("Comando invalido", strong = true)
            null
        }
    }

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
                showDisconnectedIfUiActive()
            }
    }

    private fun showDisconnectedIfUiActive() {
        if (!isUiActive) return
        isConnected.value = false
        currentScreen.value = ScreenState.NO_CONNECTED
    }

    private fun hasPendingCriticalOperation(): Boolean {
        return WatchOutbox.pendingCommands(this).isNotEmpty()
    }

    private fun matchesCurrentSession(commandJson: String): Boolean {
        if (!shouldPersistOutbox(commandJson) || userSessionId.value.isBlank()) {
            return !shouldPersistOutbox(commandJson)
        }
        return try {
            JSONObject(commandJson).optString("userSessionId", "") == userSessionId.value
        } catch (e: Exception) {
            false
        }
    }

    private fun shouldPersistOutbox(commandJson: String): Boolean {
        return try {
            val type = JSONObject(commandJson).optString("type", "")
            type == "START_TURNO"
                || type == "PAUSE_TURNO"
                || type == "RESUME_TURNO"
                || type == "ADD_ENTRY"
                || type == "ADD_NOTE"
                || type == "EDIT_ENTRY"
                || type == "EDIT_TURNO"
                || type == "DELETE_ENTRY"
                || type == "END_TURNO"
        } catch (e: Exception) {
            false
        }
    }
}

@Composable
private fun ConfirmPauseTurnoScreen(
    onCancel: () -> Unit,
    onConfirm: () -> Boolean
) {
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
            Text("Pausar Turno", color = ColorPause, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "¿Seguro que quieres pausar el Turno actual?",
                color = ColorGrey,
                fontSize = 12.sp
            )
            Spacer(modifier = Modifier.height(16.dp))
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
                var pausing by remember { mutableStateOf(false) }
                ConfirmDeleteButton(
                    label = "Pausar",
                    textColor = ColorPause,
                    bg = ColorPauseBg,
                    borderColor = ColorPauseBorder,
                    enabled = !pausing,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        if (!pausing) {
                            pausing = onConfirm()
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun ConfirmStartTurnoScreen(
    onCancel: () -> Unit,
    onConfirm: () -> Boolean
) {
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
            Text("Iniciar Turno", color = ColorPropina, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text("Pulsa para comenzar tu Turno.", color = ColorGrey, fontSize = 12.sp)
            Spacer(modifier = Modifier.height(16.dp))
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
                var starting by remember { mutableStateOf(false) }
                ConfirmDeleteButton(
                    label = if (starting) "Iniciando..." else "Iniciar",
                    textColor = ColorPropina,
                    bg = ColorPropinaBg,
                    enabled = !starting,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        if (!starting) {
                            starting = onConfirm()
                        }
                    }
                )
            }
        }
    }
}

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
                var deleting by remember { mutableStateOf(false) }
                ConfirmDeleteButton(
                    label = if (deleting) "Borrando..." else "Borrar",
                    textColor = ColorWhite,
                    bg = ColorGasolina,
                    enabled = !deleting,
                    modifier = Modifier.weight(1f),
                    onClick = {
                        if (!deleting) {
                            deleting = true
                            onConfirm()
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun ConfirmDeleteButton(
    label: String,
    textColor: Color,
    bg: Color,
    borderColor: Color? = null,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .then(
                if (borderColor != null) Modifier.border(1.5.dp, borderColor, RoundedCornerShape(14.dp))
                else Modifier
            )
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 11.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = textColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
