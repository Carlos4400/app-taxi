package com.mijornada.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

public class WatchForegroundService extends Service {
    private static final String CHANNEL_ID = "mi_turno_watch_service";
    private static final int NOTIFICATION_ID = 4401;

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, buildNotification());
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Mi Turno activo",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("Mantiene activo el puente con Mi Turno Watch durante el turno.");
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        return builder
            .setContentTitle("Mi Turno activo")
            .setContentText("Puente del reloj preparado durante el turno.")
            .setSmallIcon(getApplicationInfo().icon)
            .setOngoing(true)
            .build();
    }
}
