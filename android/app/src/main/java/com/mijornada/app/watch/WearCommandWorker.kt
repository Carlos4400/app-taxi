package com.mijornada.app.watch

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.BackoffPolicy
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.WorkRequest
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.google.android.gms.wearable.Wearable
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

class WearCommandWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val commandJson = inputData.getString(KEY_COMMAND_JSON) ?: return Result.failure()
        val nodeId = inputData.getString(KEY_NODE_ID) ?: ""
        val operationId = inputData.getString(KEY_OPERATION_ID) ?: ""

        return try {
            val isWrite = isWriteCommand(commandJson)
            val responseJson = if (isWrite) {
                WatchNativeCommandHandler.handleCommand(applicationContext, commandJson, operationId)
            } else {
                WatchNativeCommandHandler.handleReadCommand(applicationContext, commandJson, operationId)
            }

            com.mijornada.app.WearOsBridgePlugin.publishAckDataItem(applicationContext, operationId, responseJson)
            sendFastResponse(nodeId, responseJson)

            if (isWrite && isSuccessfulWriteResponse(responseJson)) {
                val commandType = readCommandType(commandJson)
                if ("START_TURNO" == commandType) {
                    com.mijornada.app.TurnoForegroundService.start(applicationContext)
                } else if ("END_TURNO" == commandType) {
                    com.mijornada.app.TurnoForegroundService.stop(applicationContext)
                }
                WatchStateDataPublisher.publish(applicationContext)
            }
            WatchStateChangeNotifier.notify(applicationContext)
            Result.success()
        } catch (e: Exception) {
            android.util.Log.e("WearCommandWorker", "doWork failed", e)
            Result.retry()
        }
    }

    private fun isWriteCommand(commandJson: String): Boolean {
        return try {
            val json = org.json.JSONObject(commandJson)
            val type = json.optString("type", "")
            "START_TURNO" == type
                || "PAUSE_TURNO" == type
                || "RESUME_TURNO" == type
                || "ADD_ENTRY" == type
                || "ADD_NOTE" == type
                || "EDIT_ENTRY" == type
                || "EDIT_TURNO" == type
                || "DELETE_ENTRY" == type
                || "END_TURNO" == type
        } catch (e: Exception) {
            true
        }
    }

    private fun readCommandType(commandJson: String): String {
        return try {
            org.json.JSONObject(commandJson).optString("type", "")
        } catch (e: Exception) {
            ""
        }
    }

    private fun isSuccessfulWriteResponse(responseJson: String): Boolean {
        return try {
            val json = org.json.JSONObject(responseJson)
            val type = json.optString("type", "")
            "OK" == type || "DUPLICATE_IGNORED" == type
        } catch (e: Exception) {
            false
        }
    }

    private fun sendFastResponse(nodeId: String, responseJson: String) {
        if (!nodeId.isNullOrBlank()) {
            val responseData = responseJson.toByteArray(StandardCharsets.UTF_8)
            Wearable.getMessageClient(applicationContext)
                .sendMessage(nodeId, "/watch-response", responseData)
                .addOnFailureListener { e ->
                    android.util.Log.w("WearCommandWorker", "sendMessage failed: ${e.message}")
                }
        }
    }

    companion object {
        const val KEY_COMMAND_JSON = "command_json"
        const val KEY_NODE_ID = "node_id"
        const val KEY_OPERATION_ID = "operation_id"

        @JvmStatic
        fun enqueue(context: Context, commandJson: String, nodeId: String, operationId: String) {
            val data = Data.Builder()
                .putString(KEY_COMMAND_JSON, commandJson)
                .putString(KEY_NODE_ID, nodeId)
                .putString(KEY_OPERATION_ID, operationId)
                .build()

            val request = OneTimeWorkRequestBuilder<WearCommandWorker>()
                .setInputData(data)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS,
                )
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .addTag("wear-command")
                .build()

            WorkManager.getInstance(context)
                .enqueueUniqueWork(
                    "wear-command-$operationId",
                    androidx.work.ExistingWorkPolicy.KEEP,
                    request,
                )
        }
    }
}
