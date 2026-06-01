package com.mijornada.app;

import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;
import com.google.android.gms.wearable.Wearable;
import java.nio.charset.StandardCharsets;

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
}
