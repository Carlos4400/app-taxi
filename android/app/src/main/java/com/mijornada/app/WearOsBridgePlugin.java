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

    private String currentUid = null;

    @Override
    public void load() {
        super.load();
        WearListenerService.setCommandListener(new WearListenerService.CommandListener() {
            @Override
            public void onCommandReceived(String commandJson) {
                JSObject data = new JSObject();
                data.put("command", commandJson);
                notifyListeners("onCommandReceived", data);
            }
        });
    }

    @PluginMethod
    public void setPrepared(PluginCall call) {
        String uid = call.getString("uid");
        if (uid != null && !uid.trim().isEmpty()) {
            this.currentUid = uid;
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

        byte[] responseData = responseJson.getBytes(StandardCharsets.UTF_8);
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
