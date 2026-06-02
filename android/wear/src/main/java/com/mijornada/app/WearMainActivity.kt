package com.mijornada.app

import android.app.RemoteInput
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import com.mijornada.app.screens.*
import com.mijornada.app.theme.*
import org.json.JSONArray
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.util.UUID

enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    ADD_ENTRY,
    EDIT_ENTRY,
    CONFIRM_DELETE,
    END_TURNO
}

class WearMainActivity : ComponentActivity(), MessageClient.OnMessageReceivedListener {

    private val TAG = "WearMainActivity"

    private var isConnected = mutableStateOf(false)
    private var activeTurno = mutableStateOf(false)
    private var startTime = mutableStateOf("")
    private var currentScreen = mutableStateOf(ScreenState.NO_CONNECTED)

    private var selectedCategory = mutableStateOf("")
    private var selectedCategoryLabel = mutableStateOf("")
    private var selectedCategoryColor = mutableStateOf(ColorPropina)

    private var startDate = mutableStateOf("")
    private var totalsPorTipo = mutableStateOf<Map<String, Double>>(emptyMap())
    private var numPorTipo = mutableStateOf<Map<String, Int>>(emptyMap())
    private var entradas = mutableStateOf<List<WatchEntry>>(emptyList())
    private var editingEntry = mutableStateOf<WatchEntry?>(null)

    // Entrada de texto (nota) vía teclado / voz del sistema (RemoteInput)
    private val NOTE_KEY = "wear_note"
    private var pendingNoteCallback: ((String) -> Unit)? = null
    private lateinit var noteLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        noteLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            val data: Intent? = result.data
            if (data != null) {
                val results = RemoteInput.getResultsFromIntent(data)
                val text = results?.getCharSequence(NOTE_KEY)?.toString() ?: ""
                pendingNoteCallback?.invoke(text)
            }
            pendingNoteCallback = null
        }

        setContent {
            WearAppTheme {
                MainContent()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        Wearable.getMessageClient(this).addListener(this)
        requestStatus()
    }

    override fun onPause() {
        Wearable.getMessageClient(this).removeListener(this)
        super.onPause()
    }

    @Composable
    fun MainContent() {
        BackHandler(enabled = currentScreen.value != ScreenState.NO_CONNECTED) {
            handleBack()
        }

        when (currentScreen.value) {
            ScreenState.NO_CONNECTED -> NoConnectedScreen(onRetry = { requestStatus() })
            ScreenState.NO_ACTIVE_TURNO -> NoActiveTurnoScreen(onStartTurno = { sendStartTurno() })
            ScreenState.ACTIVE_TURNO -> ActiveTurnoScreen(
                fechaTurno = formatFechaTurno(startDate.value),
                startTime = startTime.value,
                totalsPorTipo = totalsPorTipo.value,
                numPorTipo = numPorTipo.value,
                entradas = entradas.value,
                onSelectCategory = { category ->
                    selectedCategory.value = category
                    setupCategoryMeta(category)
                    currentScreen.value = ScreenState.ADD_ENTRY
                },
                onAddNote = {
                    requestNote("") { text ->
                        if (text.isNotBlank()) sendAddNote(text)
                    }
                },
                onEditEntry = { entry ->
                    editingEntry.value = entry
                    currentScreen.value = ScreenState.EDIT_ENTRY
                },
                onEndTurno = {
                    currentScreen.value = ScreenState.END_TURNO
                }
            )
            ScreenState.ADD_ENTRY -> AddEntryScreen(
                categoryLabel = selectedCategoryLabel.value,
                categoryColor = selectedCategoryColor.value,
                onSave = { amount, note ->
                    sendAddEntry(selectedCategory.value, amount, note)
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
                        onSave = { amount, note -> sendEditEntry(e.id, amount, note) },
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
                        onConfirm = { sendDeleteEntry(e.id) }
                    )
                }
            }
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
        }
    }

    private fun handleBack() {
        when (currentScreen.value) {
            ScreenState.ADD_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.EDIT_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.CONFIRM_DELETE -> currentScreen.value = ScreenState.EDIT_ENTRY
            ScreenState.END_TURNO -> currentScreen.value = ScreenState.ACTIVE_TURNO
            ScreenState.NO_ACTIVE_TURNO -> currentScreen.value = ScreenState.NO_CONNECTED
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

    override fun onMessageReceived(messageEvent: MessageEvent) {
        val path = messageEvent.path
        val data = String(messageEvent.data, StandardCharsets.UTF_8)
        Log.d(TAG, "Mensaje recibido: path=$path, data=$data")

        try {
            val json = JSONObject(data)
            if ("/watch-status" == path || "STATUS" == json.optString("type")) {
                isConnected.value = json.optBoolean("connected", false)
                activeTurno.value = json.optBoolean("activeTurno", false)
                startTime.value = json.optString("startTime", "")
                startDate.value = json.optString("startDate", "")
                parseTotals(json.optJSONObject("totals"))
                parseEntradas(json.optJSONArray("entradas"))

                if (!isConnected.value) {
                    currentScreen.value = ScreenState.NO_CONNECTED
                } else if (activeTurno.value) {
                    if (currentScreen.value == ScreenState.NO_CONNECTED || currentScreen.value == ScreenState.NO_ACTIVE_TURNO) {
                        currentScreen.value = ScreenState.ACTIVE_TURNO
                    }
                } else {
                    currentScreen.value = ScreenState.NO_ACTIVE_TURNO
                }
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
                Log.e(TAG, "Error desde movil: ${json.optString("message")}")
                performFeedback(json.optString("message", "Error"), strong = true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al procesar mensaje", e)
            performFeedback("Error al leer respuesta", strong = true)
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

    private fun sendStartTurno() {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "START_TURNO")
            put("createdAt", System.currentTimeMillis().toString())
        }
        sendCommand(command.toString())
    }

    private fun sendAddEntry(entryType: String, amount: Double, note: String) {
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
        sendCommand(command.toString())
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

    private fun sendEditEntry(id: Long, amount: Double, note: String) {
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
        sendCommand(command.toString())
    }

    private fun sendDeleteEntry(id: Long) {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "DELETE_ENTRY")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("id", id)
            })
        }
        sendCommand(command.toString())
    }

    private fun sendAddNote(noteText: String) {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "ADD_NOTE")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("note", noteText)
            })
        }
        sendCommand(command.toString())
    }

    private fun sendEndTurno(dinero: Double, km: Double, note: String) {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "END_TURNO")
            put("createdAt", System.currentTimeMillis().toString())
            put("payload", JSONObject().apply {
                put("dinero", dinero)
                put("km", km)
                put("note", if (note.isBlank()) "Cierre desde reloj" else note)
            })
        }
        sendCommand(command.toString())
    }

    /** Lanza el teclado / voz del sistema para introducir una nota de texto libre. */
    private fun requestNote(current: String, onResult: (String) -> Unit) {
        pendingNoteCallback = onResult
        val remoteInputs = listOf(
            RemoteInput.Builder(NOTE_KEY)
                .setLabel(if (current.isBlank()) "Nota" else current.take(24))
                .build()
        )
        val intent: Intent = RemoteInputIntentHelper.createActionRemoteInputIntent()
        RemoteInputIntentHelper.putRemoteInputsExtra(intent, remoteInputs)
        noteLauncher.launch(intent)
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

    private fun sendCommand(commandJson: String) {
        Wearable.getNodeClient(this).connectedNodes
            .addOnSuccessListener { nodes ->
                if (nodes.isEmpty()) {
                    isConnected.value = false
                    currentScreen.value = ScreenState.NO_CONNECTED
                } else {
                    val data = commandJson.toByteArray(StandardCharsets.UTF_8)
                    val node = nodes.first()
                    Wearable.getMessageClient(this)
                        .sendMessage(node.id, "/watch-command", data)
                        .addOnFailureListener {
                            isConnected.value = false
                            currentScreen.value = ScreenState.NO_CONNECTED
                        }
                }
            }
            .addOnFailureListener {
                isConnected.value = false
                currentScreen.value = ScreenState.NO_CONNECTED
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

@Composable
private fun ConfirmDeleteButton(
    label: String,
    textColor: Color,
    bg: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .clickable { onClick() }
            .padding(vertical = 11.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(label, color = textColor, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}
