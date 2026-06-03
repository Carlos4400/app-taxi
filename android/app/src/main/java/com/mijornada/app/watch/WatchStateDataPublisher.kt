package com.mijornada.app.watch

import android.content.Context
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object WatchStateDataPublisher {
    @JvmStatic
    fun publish(context: Context) {
        val uid = WatchUserSession.getUid(context)
        if (uid.isBlank()) return
        val now = Date()
        val nowDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now)
        val nowTime = SimpleDateFormat("HH:mm", Locale.US).format(now)
        val repository = WatchRepository(WatchDatabaseProvider.getForUid(context, uid))
        val state = repository.readState(nowDate, nowTime, now.time)
        val stateJson = WatchResponseJson.statusToJson(
            "turno-state",
            state,
            WatchUserSession.getSessionId(context),
        )

        val request = PutDataMapRequest.create("/turno/state")
        val dataMap = request.dataMap
        dataMap.putString("state", stateJson)
        dataMap.putLong("updatedAt", System.currentTimeMillis())
        val dataRequest = request.asPutDataRequest()
        dataRequest.setUrgent()
        Wearable.getDataClient(context).putDataItem(dataRequest)
            .addOnFailureListener { e -> android.util.Log.w("WatchStateDataPublisher", "publish failed: " + e.message) }
    }
}
