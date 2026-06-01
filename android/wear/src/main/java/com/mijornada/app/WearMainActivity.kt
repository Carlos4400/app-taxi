package com.mijornada.app

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import com.mijornada.app.screens.*
import com.mijornada.app.theme.*
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.util.UUID

enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    ADD_ENTRY,
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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

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
        when (currentScreen.value) {
            ScreenState.NO_CONNECTED -> NoConnectedScreen(onRetry = { requestStatus() })
            ScreenState.NO_ACTIVE_TURNO -> NoActiveTurnoScreen(onStartTurno = { sendStartTurno() })
            ScreenState.ACTIVE_TURNO -> ActiveTurnoScreen(
                startTime = startTime.value,
                onSelectCategory = { category ->
                    selectedCategory.value = category
                    setupCategoryMeta(category)
                    currentScreen.value = ScreenState.ADD_ENTRY
                },
                onAddNote = {
                    sendAddNote("Nota desde reloj")
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
                }
            )
            ScreenState.END_TURNO -> EndTurnoScreen(
                onConfirm = { dinero, km ->
                    sendEndTurno(dinero, km)
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                }
            )
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
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
                Log.e(TAG, "Error desde movil: ${json.optString("message")}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al procesar mensaje", e)
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

    private fun sendEndTurno(dinero: Double, km: Double) {
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
        sendCommand(command.toString())
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
