package com.mijornada.app

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable

class OutboxWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    private val TAG = "OutboxWorker"

    override suspend fun doWork(): Result {
        if (runAttemptCount >= MAX_RUN_ATTEMPTS) {
            Log.w(TAG, "OutboxWorker excedió MAX_RUN_ATTEMPTS=$MAX_RUN_ATTEMPTS, abandonando ($runAttemptCount intentos)")
            return Result.failure()
        }

        val targetNodeId = try {
            Tasks.await(Wearable.getNodeClient(applicationContext).connectedNodes)
                .firstOrNull { it.isNearby }?.id
                ?: Tasks.await(Wearable.getNodeClient(applicationContext).connectedNodes)
                    .firstOrNull()?.id
                ?: ""
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo resolver nodo conectado: ${e.message}")
            ""
        }

        val pending = WatchOutbox.pendingCommands(applicationContext).values
        var hardFailure = false

        pending.forEach { command ->
            try {
                val request = PutDataMapRequest.create("/watch-command/${command.operationId}")
                request.dataMap.putString("command", command.commandJson)
                request.dataMap.putString("targetNodeId", targetNodeId)
                request.dataMap.putLong("createdAt", System.currentTimeMillis())
                val dataRequest = request.asPutDataRequest().setUrgent()
                Tasks.await(Wearable.getDataClient(applicationContext).putDataItem(dataRequest))
            } catch (e: ApiException) {
                // Google Play Services no disponible o sin Wearable API → no se puede recuperar reintentando.
                Log.w(TAG, "ApiException irrecuperable en operationId=${command.operationId}: ${e.message}")
                hardFailure = true
            } catch (e: SecurityException) {
                // Permiso revocado → no se puede recuperar.
                Log.w(TAG, "SecurityException irrecuperable en operationId=${command.operationId}: ${e.message}")
                hardFailure = true
            } catch (e: Exception) {
                // Errores transitorios (red, Wearable temporalmente fuera) → reintentar.
                Log.w(TAG, "Reintento blando para operationId=${command.operationId}: ${e.message}")
            }
        }

        if (hardFailure) return Result.failure()
        return if (WatchOutbox.hasPendingCommands(applicationContext)) Result.retry() else Result.success()
    }

    companion object {
        const val WORK_NAME = "outbox-retry-unique"
        /**
         * Tope duro de reintentos del worker. Con backoff exponencial por defecto de WorkManager
         * (10s, 20s, 40s, 80s, 2m40, 5m20, 10m40, 21m20) sobre 8 intentos se alcanzan ~40 min
         * de reintentos antes de abandonar. Evita drenar bateria si Play Services nunca vuelve.
         */
        const val MAX_RUN_ATTEMPTS = 8
    }
}
