package com.mijornada.app

import android.net.Uri
import android.util.Log
import androidx.work.ExistingWorkPolicy
import androidx.work.BackoffPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkRequest
import androidx.work.WorkManager
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

class MobileResponseService : WearableListenerService() {

    private val TAG = "MobileResponseService"

    companion object {
        const val WORK_TAG_OUTBOX = "outbox-retry"
        const val EXTRA_OPERATION_ID = "operationId"

        fun cancelOutboxRetry(context: android.content.Context) {
            WorkManager.getInstance(context).cancelAllWorkByTag(WORK_TAG_OUTBOX)
        }

        fun enqueueOutboxRetry(context: android.content.Context) {
            val workRequest = OneTimeWorkRequestBuilder<OutboxWorker>()
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS,
                )
                .addTag(WORK_TAG_OUTBOX)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                OutboxWorker.WORK_NAME,
                ExistingWorkPolicy.KEEP,
                workRequest
            )
        }
    }

    override fun onMessageReceived(messageEvent: MessageEvent) {
        val path = messageEvent.path
        val data = String(messageEvent.data, StandardCharsets.UTF_8)
        Log.d(TAG, "Mensaje recibido: path=$path, data.length=${data.length}")
        handleResponseJson(data)
    }

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val item = event.dataItem
            val uri = item.uri
            if (uri.path?.startsWith("/watch-ack/") == true) {
                val responseJson = DataMapItem.fromDataItem(item).dataMap.getString("response") ?: continue
                handleResponseJson(responseJson)
            } else if (uri.path == "/turno/state") {
                val stateJson = DataMapItem.fromDataItem(item).dataMap.getString("state") ?: continue
                handleResponseJson(stateJson)
            }
        }
    }

    private fun handleResponseJson(responseJson: String) {
        val prefs = getSharedPreferences(WearConstants.Response.PREFS, MODE_PRIVATE)
        prefs.edit()
            .putString(WearConstants.Response.LAST_RESPONSE, responseJson)
            .putLong(WearConstants.Response.RESPONSE_TIMESTAMP, System.currentTimeMillis())
            .apply()

        try {
            val json = org.json.JSONObject(responseJson)
            val responseType = json.optString("type")
            val operationId = json.optString("operationId", "")
            val isTerminal = isTerminalResponse(responseType, json.optString("code", ""))

            if (operationId.isNotBlank() && isTerminal) {
                if (!rememberTerminalOperation(operationId)) return
                WatchOutbox.remove(this, operationId)
                cleanupTerminalDataItems(operationId)
                if (WatchOutbox.hasPendingCommands(this)) {
                    enqueueOutboxRetry(this)
                } else {
                    cancelOutboxRetry(this)
                }
            } else if (
                operationId.isNotBlank()
                && (responseType == "STATUS" || responseType == "TURNOS_STATUS")
            ) {
                cleanupTerminalDataItems(operationId)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error al procesar mensaje", e)
        }
    }

    private fun isTerminalResponse(responseType: String, code: String): Boolean {
        if (responseType == "OK" || responseType == "DUPLICATE_IGNORED") return true
        return responseType == "ERROR" && code != "USER_NOT_PREPARED" && code != "APP_NOT_READY"
    }

    private fun rememberTerminalOperation(operationId: String): Boolean {
        synchronized(handledTerminalOperationIds) {
            if (!handledTerminalOperationIds.add(operationId)) return false
            while (handledTerminalOperationIds.size > WearConstants.HANDLED_OPERATION_LIMIT) {
                handledTerminalOperationIds.remove(handledTerminalOperationIds.first())
            }
            return true
        }
    }

    private fun cleanupTerminalDataItems(operationId: String) {
        val dataClient = Wearable.getDataClient(this)
        dataClient.deleteDataItems(getDataItemUri("/watch-command/$operationId"))
        dataClient.deleteDataItems(getDataItemUri("/watch-ack/$operationId"))
    }

    private fun getDataItemUri(path: String): Uri {
        return Uri.Builder().scheme("wear").authority("*").path(path).build()
    }

    private val handledTerminalOperationIds = java.util.Collections.synchronizedSet(java.util.LinkedHashSet<String>())
}
