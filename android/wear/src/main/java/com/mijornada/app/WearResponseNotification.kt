package com.mijornada.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

object WearUiVisibility {
    @Volatile
    var isVisible: Boolean = false
}

object WearResponseNotification {
    private const val CHANNEL_ID = "watch_responses"

    fun showIfBackground(context: Context, responseJson: String) {
        if (WearUiVisibility.isVisible) return
        val response = try {
            JSONObject(responseJson)
        } catch (_: Exception) {
            return
        }
        val operationId = response.optString("operationId", "")
        if (operationId.isBlank()) return
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        val manager = context.getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Confirmaciones del movil",
                    NotificationManager.IMPORTANCE_HIGH,
                ).apply {
                    enableVibration(true)
                },
            )
        }
        val openApp = PendingIntent.getActivity(
            context,
            0,
            Intent(context, WearMainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val isError = response.optString("type", "") == "ERROR"
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(com.mijornada.app.R.mipmap.ic_launcher)
            .setContentTitle(if (isError) "No se pudo guardar" else "Guardado en el movil")
            .setContentText(response.optString("message", if (isError) "Error" else "Hecho"))
            .setContentIntent(openApp)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        manager.notify(operationId.hashCode(), notification)
    }
}
