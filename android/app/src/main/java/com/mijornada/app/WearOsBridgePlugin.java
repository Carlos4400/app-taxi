package com.mijornada.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.Node;
import java.nio.charset.StandardCharsets;

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
            call.resolve();
        } else {
            call.reject("uid es obligatorio");
        }
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
