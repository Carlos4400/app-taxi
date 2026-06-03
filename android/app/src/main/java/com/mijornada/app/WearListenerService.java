package com.mijornada.app;

import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataMapItem;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class WearListenerService extends WearableListenerService {

    public interface CommandListener {
        void onCommandReceived(String commandJson, String nodeId);
    }

    private static CommandListener listener;

    public static void setCommandListener(CommandListener commandListener) {
        listener = commandListener;
    }

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if ("/watch-command".equals(messageEvent.getPath())) {
            String commandJson = new String(messageEvent.getData(), StandardCharsets.UTF_8);
            if (listener != null) {
                listener.onCommandReceived(commandJson, messageEvent.getSourceNodeId());
            } else {
                // Responder directamente si el puente no está preparado.
                String nodeId = messageEvent.getSourceNodeId();
                String errorResponseJson = "{\"type\":\"ERROR\",\"operationId\":\"\",\"code\":\"APP_NOT_READY\",\"message\":\"App movil no preparada\"}";
                byte[] responseData = errorResponseJson.getBytes(StandardCharsets.UTF_8);
                Wearable.getMessageClient(this).sendMessage(nodeId, "/watch-response", responseData);
            }
        }
    }

    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        for (DataEvent event : dataEvents) {
            if (event.getType() != DataEvent.TYPE_CHANGED) continue;
            String path = event.getDataItem().getUri().getPath();
            if (path == null || !path.startsWith("/watch-cmd/")) continue;

            String nodeId = event.getDataItem().getUri().getHost();
            String commandJson = DataMapItem.fromDataItem(event.getDataItem())
                .getDataMap()
                .getString("command", "");
            WatchCommandQueue.EnqueueResult result = WatchCommandQueue.enqueue(this, commandJson, nodeId);
            sendQueueResult(nodeId, result);
            if ("QUEUED".equals(result.status) && listener != null) {
                listener.onCommandReceived(commandJson, nodeId);
            }
        }
    }

    private void sendQueueResult(String nodeId, WatchCommandQueue.EnqueueResult result) {
        if (nodeId == null || nodeId.trim().isEmpty()) return;
        JSONObject json = new JSONObject();
        try {
            json.put("type", result.status);
            json.put("operationId", result.operationId);
            json.put("message", result.message);
            if (!result.code.isEmpty()) {
                json.put("code", result.code);
            }
        } catch (Exception ignored) {}
        byte[] responseData = json.toString().getBytes(StandardCharsets.UTF_8);
        Wearable.getMessageClient(this).sendMessage(nodeId, "/watch-response", responseData);
    }
}
