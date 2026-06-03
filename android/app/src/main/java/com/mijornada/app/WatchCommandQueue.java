package com.mijornada.app;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashSet;
import java.util.Set;

public final class WatchCommandQueue {
    private static final String PREFS = "mi_turno_watch_queue";
    private static final String KEY_PREPARED_UID = "prepared_uid";
    private static final String KEY_PROCESSED_IDS = "processed_operation_ids";
    private static final String KEY_QUEUE = "pending_commands";
    private static final int MAX_PROCESSED_IDS = 500;

    private WatchCommandQueue() {}

    public static void setPrepared(Context context, String uid, JSONArray processedOperationIds) {
        SharedPreferences prefs = prefs(context);
        prefs.edit()
            .putString(KEY_PREPARED_UID, uid)
            .putString(KEY_PROCESSED_IDS, processedOperationIds == null ? "[]" : processedOperationIds.toString())
            .apply();
    }

    public static String getPreparedUid(Context context) {
        return prefs(context).getString(KEY_PREPARED_UID, "");
    }

    public static EnqueueResult enqueue(Context context, String commandJson, String nodeId) {
        String preparedUid = getPreparedUid(context);
        if (preparedUid == null || preparedUid.trim().isEmpty()) {
            return EnqueueResult.error("", "APP_NOT_READY", "App movil no preparada");
        }

        JSONObject command;
        String operationId;
        try {
            command = new JSONObject(commandJson);
            operationId = command.optString("operationId", "").trim();
        } catch (Exception e) {
            return EnqueueResult.error("", "INVALID_COMMAND", "Comando del reloj invalido");
        }

        if (operationId.isEmpty()) {
            return EnqueueResult.error("", "INVALID_OPERATION_ID", "operationId obligatorio");
        }

        SharedPreferences prefs = prefs(context);
        Set<String> processedIds = readStringSet(prefs.getString(KEY_PROCESSED_IDS, "[]"));
        if (processedIds.contains(operationId)) {
            return EnqueueResult.duplicate(operationId);
        }

        JSONArray queue = readArray(prefs.getString(KEY_QUEUE, "[]"));
        for (int i = 0; i < queue.length(); i++) {
            JSONObject item = queue.optJSONObject(i);
            if (item != null && operationId.equals(item.optString("operationId"))) {
                return EnqueueResult.queued(operationId);
            }
        }

        JSONObject item = new JSONObject();
        try {
            item.put("operationId", operationId);
            item.put("command", command.toString());
            item.put("nodeId", nodeId == null ? "" : nodeId);
            item.put("receivedAt", System.currentTimeMillis());
            queue.put(item);
            prefs.edit().putString(KEY_QUEUE, queue.toString()).apply();
            return EnqueueResult.queued(operationId);
        } catch (Exception e) {
            return EnqueueResult.error(operationId, "QUEUE_WRITE_ERROR", "No se pudo encolar el comando");
        }
    }

    public static JSONArray drainQueue(Context context) {
        return readArray(prefs(context).getString(KEY_QUEUE, "[]"));
    }

    public static void confirmProcessed(Context context, JSONArray operationIds) {
        if (operationIds == null || operationIds.length() == 0) return;

        SharedPreferences prefs = prefs(context);
        Set<String> confirmed = new HashSet<>();
        for (int i = 0; i < operationIds.length(); i++) {
            String id = operationIds.optString(i, "").trim();
            if (!id.isEmpty()) confirmed.add(id);
        }
        if (confirmed.isEmpty()) return;

        JSONArray queue = readArray(prefs.getString(KEY_QUEUE, "[]"));
        JSONArray nextQueue = new JSONArray();
        for (int i = 0; i < queue.length(); i++) {
            JSONObject item = queue.optJSONObject(i);
            if (item == null) continue;
            if (!confirmed.contains(item.optString("operationId"))) {
                nextQueue.put(item);
            }
        }

        JSONArray processed = readArray(prefs.getString(KEY_PROCESSED_IDS, "[]"));
        for (String id : confirmed) processed.put(id);
        JSONArray cappedProcessed = capArray(processed, MAX_PROCESSED_IDS);

        prefs.edit()
            .putString(KEY_QUEUE, nextQueue.toString())
            .putString(KEY_PROCESSED_IDS, cappedProcessed.toString())
            .apply();
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONArray readArray(String raw) {
        try {
            return new JSONArray(raw == null ? "[]" : raw);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    private static Set<String> readStringSet(String raw) {
        JSONArray arr = readArray(raw);
        Set<String> values = new HashSet<>();
        for (int i = 0; i < arr.length(); i++) {
            String id = arr.optString(i, "").trim();
            if (!id.isEmpty()) values.add(id);
        }
        return values;
    }

    private static JSONArray capArray(JSONArray source, int maxItems) {
        JSONArray capped = new JSONArray();
        int start = Math.max(0, source.length() - maxItems);
        for (int i = start; i < source.length(); i++) {
            String id = source.optString(i, "").trim();
            if (!id.isEmpty()) capped.put(id);
        }
        return capped;
    }

    public static final class EnqueueResult {
        public final String status;
        public final String operationId;
        public final String code;
        public final String message;

        private EnqueueResult(String status, String operationId, String code, String message) {
            this.status = status;
            this.operationId = operationId;
            this.code = code;
            this.message = message;
        }

        public static EnqueueResult queued(String operationId) {
            return new EnqueueResult("QUEUED", operationId, "", "Pendiente en movil");
        }

        public static EnqueueResult duplicate(String operationId) {
            return new EnqueueResult("DUPLICATE_IGNORED", operationId, "", "Operacion ya procesada");
        }

        public static EnqueueResult error(String operationId, String code, String message) {
            return new EnqueueResult("ERROR", operationId, code, message);
        }
    }
}
