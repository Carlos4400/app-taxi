package com.mijornada.app;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.Node;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;

@CapacitorPlugin(name = "WearOsBridge")
public class WearOsBridgePlugin extends Plugin {

    @Override
    public void load() {
        super.load();
        WearListenerService.setCommandListener(new WearListenerService.CommandListener() {
            @Override
            public void onCommandReceived(String commandJson, String nodeId) {
                JSObject data = new JSObject();
                data.put("command", commandJson);
                data.put("nodeId", nodeId);
                notifyListeners("onCommandReceived", data);
            }
        });
    }

    @PluginMethod
    public void setPrepared(PluginCall call) {
        String uid = call.getString("uid");
        if (uid != null && !uid.trim().isEmpty()) {
            JSONArray processedOperationIds = new JSONArray();
            try {
                JSArray processed = call.getArray("processedOperationIds");
                processedOperationIds = processed == null ? new JSONArray() : new JSONArray(processed.toString());
            } catch (Exception ignored) {}
            WatchCommandQueue.setPrepared(getContext(), uid, processedOperationIds);
            call.resolve();
        } else {
            call.reject("uid es obligatorio");
        }
    }

    @PluginMethod
    public void drainQueue(PluginCall call) {
        JSObject result = new JSObject();
        result.put("commands", WatchCommandQueue.drainQueue(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void confirmProcessed(PluginCall call) {
        try {
            JSArray ids = call.getArray("operationIds");
            JSONArray operationIds = ids == null ? new JSONArray() : new JSONArray(ids.toString());
            WatchCommandQueue.confirmProcessed(getContext(), operationIds);
            call.resolve();
        } catch (Exception e) {
            call.reject("operationIds invalido");
        }
    }

    @PluginMethod
    public void startTurnoForegroundService(PluginCall call) {
        Intent intent = new Intent(getContext(), WatchForegroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopTurnoForegroundService(PluginCall call) {
        Intent intent = new Intent(getContext(), WatchForegroundService.class);
        getContext().stopService(intent);
        call.resolve();
    }

    @PluginMethod
    public void sendResponse(PluginCall call) {
        String responseJson = call.getString("response");
        if (responseJson == null) {
            call.reject("response es obligatorio");
            return;
        }

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

    @Override
    protected void handleOnDestroy() {
        WearListenerService.setCommandListener(null);
        super.handleOnDestroy();
    }
}
