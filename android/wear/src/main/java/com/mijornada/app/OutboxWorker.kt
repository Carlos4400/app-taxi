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
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        WatchOutbox.unpublishedCommands(applicationContext).values.forEach { command ->
            try {
                val request = PutDataMapRequest.create("/watch-command/${command.operationId}")
                request.dataMap.putString("command", command.commandJson)
                request.dataMap.putLong("createdAt", System.currentTimeMillis())
                val dataRequest = request.asPutDataRequest().setUrgent()
                Tasks.await(Wearable.getDataClient(applicationContext).putDataItem(dataRequest))
                if (!WatchOutbox.markPublished(applicationContext, command.operationId, System.currentTimeMillis())) {
                    Log.w(TAG, "No se pudo persistir publishedAt para operationId=${command.operationId}")
                    return Result.retry()
                }
            } catch (e: Exception) {
                Log.w(TAG, "No se pudo publicar operationId=${command.operationId}: ${e.message}")
                return Result.retry()
            }
        }

        return if (WatchOutbox.unpublishedCommands(applicationContext).isEmpty()) {
            Result.success()
        } else {
            Result.retry()
        }
    }

    companion object {
        const val WORK_NAME = "outbox-retry-unique"
        private const val TAG = "OutboxWorker"
    }
}
