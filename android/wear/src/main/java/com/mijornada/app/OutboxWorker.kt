package com.mijornada.app

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

class OutboxWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val TAG = "OutboxWorker"

    override suspend fun doWork(): Result {
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

        return if (WatchOutbox.hasPendingCommands(applicationContext)) {
            Result.retry()
        } else {
            Result.success()
        }
    }

    companion object {
        const val WORK_NAME = "outbox-retry-unique"
    }
}
