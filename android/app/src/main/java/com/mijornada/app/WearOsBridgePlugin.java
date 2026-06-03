package com.mijornada.app;

import android.content.Context;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.mijornada.app.watch.WatchDatabaseProvider;
import com.mijornada.app.watch.WatchAppSnapshot;
import com.mijornada.app.watch.WatchRepository;
import com.mijornada.app.watch.WatchStateJson;
import com.mijornada.app.watch.WatchStateChangeNotifier;
import com.mijornada.app.watch.WatchStateDataPublisher;
import com.mijornada.app.watch.WatchUserSession;
import com.mijornada.app.watch.StaleWatchSnapshotException;
import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.PutDataMapRequest;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "WearOsBridge")
public class WearOsBridgePlugin extends Plugin {
    private final ExecutorService nativeStateExecutor = Executors.newSingleThreadExecutor();
    private final BroadcastReceiver stateChangedReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            notifyNativeStateChanged();
        }
    };

    @Override
    public void load() {
        super.load();
        ContextCompat.registerReceiver(
            getContext(),
            stateChangedReceiver,
            new IntentFilter(WatchStateChangeNotifier.ACTION_STATE_CHANGED),
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    @PluginMethod
    public void setPrepared(PluginCall call) {
        String uid = call.getString("uid");
        if (uid != null && !uid.trim().isEmpty()) {
            WatchUserSession.prepare(getContext(), uid);
            WatchStateDataPublisher.publish(getContext());
            call.resolve();
        } else {
            call.reject("uid es obligatorio");
        }
    }

    @PluginMethod
    public void clearPrepared(PluginCall call) {
        String uid = call.getString("uid");
        if (uid == null || uid.trim().isEmpty()) {
            call.reject("uid es obligatorio");
            return;
        }
        if (WatchUserSession.clearIfMatches(getContext(), uid)) {
            TurnoForegroundService.stop(getContext());
            deleteWatchState();
        }
        call.resolve();
    }

    private void deleteWatchState() {
        try {
            android.net.Uri stateUri = android.net.Uri.parse("wear://*/turno/state");
            Wearable.getDataClient(getContext()).deleteDataItems(stateUri);
        } catch (Exception ignored) {
        }
    }

    @PluginMethod
    public void sendResponse(PluginCall call) {
        String responseJson = call.getString("response");
        if (responseJson == null) {
            call.reject("response es obligatorio");
            return;
        }

        String operationId = readOperationId(responseJson);
        publishAckDataItem(getContext(), operationId, responseJson);

        String nodeId = call.getString("nodeId");
        byte[] responseData = responseJson.getBytes(StandardCharsets.UTF_8);
        if (nodeId != null && !nodeId.trim().isEmpty()) {
            Wearable.getMessageClient(getContext())
                .sendMessage(nodeId, "/watch-response", responseData)
                .addOnSuccessListener(unused -> call.resolve())
                .addOnFailureListener(e -> call.reject("Error al responder a Wear OS: " + e.getMessage()));
            return;
        }

        Wearable.getNodeClient(getContext())
            .getConnectedNodes()
            .addOnSuccessListener(nodes -> {
                for (Node node : nodes) {
                    Wearable.getMessageClient(getContext())
                        .sendMessage(node.getId(), "/watch-response", responseData);
                }
                call.resolve();
            })
            .addOnFailureListener(e -> call.reject("Error al obtener nodos de Wear OS: " + e.getMessage()));
    }

    @PluginMethod
    public void getNativeState(PluginCall call) {
        nativeStateExecutor.execute(() -> {
            try {
                Date now = new Date();
                String nowDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now);
                String nowTime = new SimpleDateFormat("HH:mm", Locale.US).format(now);
                String uid = WatchUserSession.getUid(getContext());
                if (uid.trim().isEmpty()) {
                    call.reject("No hay usuario preparado para Wear OS");
                    return;
                }
                WatchRepository repository = new WatchRepository(WatchDatabaseProvider.getForUid(getContext(), uid));
                JSObject result = new JSObject();
                result.put("state", WatchStateJson.stateToJson(repository.readState(nowDate, nowTime, now.getTime())));
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Error al leer estado nativo Wear: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void syncState(PluginCall call) {
        String stateJson = call.getString("state");
        String uid = WatchUserSession.getUid(getContext());
        if (uid.trim().isEmpty()) {
            call.reject("No hay usuario preparado para Wear OS");
            return;
        }
        if (stateJson == null || stateJson.trim().isEmpty()) {
            call.reject("state es obligatorio");
            return;
        }
        nativeStateExecutor.execute(() -> {
            try {
                WatchRepository repository = new WatchRepository(WatchDatabaseProvider.getForUid(getContext(), uid));
                WatchAppSnapshot snapshot = WatchStateJson.snapshotFromJson(stateJson);
                repository.replaceAppState(snapshot);
                if (snapshot.getCurrent().isActive()) {
                    TurnoForegroundService.start(getContext());
                } else {
                    TurnoForegroundService.stop(getContext());
                }
                WatchStateDataPublisher.publish(getContext());
                JSObject result = new JSObject();
                result.put("stale", false);
                call.resolve(result);
            } catch (StaleWatchSnapshotException stale) {
                JSObject result = new JSObject();
                result.put("stale", true);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Error al sincronizar estado nativo Wear: " + e.getMessage());
            }
        });
    }

    public static void publishAckDataItem(Context context, String operationId, String responseJson) {
        if (context == null) {
            return;
        }

        final String resolvedOperationId;
        if (operationId == null || operationId.trim().isEmpty()) {
            resolvedOperationId = readOperationIdFromJson(responseJson);
        } else {
            resolvedOperationId = operationId;
        }
        if (resolvedOperationId == null || resolvedOperationId.trim().isEmpty()) {
            return;
        }

        PutDataMapRequest request = PutDataMapRequest.create("/watch-ack/" + resolvedOperationId);
        DataMap dataMap = request.getDataMap();
        dataMap.putString("response", responseJson);
        dataMap.putLong("updatedAt", System.currentTimeMillis());
        com.google.android.gms.wearable.PutDataRequest dataRequest = request.asPutDataRequest();
        dataRequest.setUrgent();
        Wearable.getDataClient(context).putDataItem(dataRequest)
            .addOnFailureListener(e -> android.util.Log.w("WearOsBridge", "ACK putDataItem failed for " + resolvedOperationId + ": " + e.getMessage()));
    }

    private String readOperationId(String responseJson) {
        try {
            JSONObject json = new JSONObject(responseJson);
            return json.optString("operationId", "");
        } catch (Exception e) {
            return "";
        }
    }

    private static String readOperationIdFromJson(String responseJson) {
        try {
            JSONObject json = new JSONObject(responseJson);
            return json.optString("operationId", "");
        } catch (Exception e) {
            return "";
        }
    }

    private void notifyNativeStateChanged() {
        JSObject data = new JSObject();
        data.put("updatedAt", System.currentTimeMillis());
        notifyListeners("onNativeStateChanged", data);
    }

    @Override
    protected void handleOnDestroy() {
        nativeStateExecutor.shutdown();
        try {
            if (!nativeStateExecutor.awaitTermination(2, java.util.concurrent.TimeUnit.SECONDS)) {
                nativeStateExecutor.shutdownNow();
            }
        } catch (InterruptedException ignored) {
            nativeStateExecutor.shutdownNow();
        }
        try {
            getContext().unregisterReceiver(stateChangedReceiver);
        } catch (IllegalArgumentException ignored) {
        }
        super.handleOnDestroy();
    }
}
