package com.mijornada.app

import android.content.Context
import org.json.JSONObject

object WatchOutbox {
    private const val PREFS = "watch_outbox"
    private const val KEY_PENDING_COMMANDS = "pendingCommands"
    private val lock = Any()

    data class PendingCommand(
        val operationId: String,
        val commandJson: String,
    )

    fun save(context: Context, operationId: String, commandJson: String) {
        if (operationId.isBlank() || commandJson.isBlank()) {
            return
        }
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            if (pending.has(operationId)) {
                return
            }
            pending.put(
                operationId,
                JSONObject()
                    .put("commandJson", commandJson),
            )
            writePending(context, pending)
        }
    }

    fun hasPendingCommands(context: Context): Boolean {
        synchronized(lock) {
            return pendingCommands(context).isNotEmpty()
        }
    }

    fun pendingCommands(context: Context): Map<String, PendingCommand> {
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            return pending.keys().asSequence().mapNotNull { operationId ->
                val item = pending.optJSONObject(operationId) ?: return@mapNotNull null
                val commandJson = item.optString("commandJson", "")
                if (commandJson.isBlank()) return@mapNotNull null
                operationId to PendingCommand(
                    operationId = operationId,
                    commandJson = commandJson,
                )
            }.toMap()
        }
    }

    fun removeCommandsFromOtherSessions(context: Context, userSessionId: String): List<String> {
        if (userSessionId.isBlank()) {
            return emptyList()
        }
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            val operationIdsToRemove = pendingCommands(context).values.mapNotNull { command ->
                val commandSessionId = try {
                    JSONObject(command.commandJson).optString("userSessionId", "")
                } catch (e: Exception) {
                    ""
                }
                command.operationId.takeIf { commandSessionId != userSessionId }
            }
            operationIdsToRemove.forEach(pending::remove)
            if (operationIdsToRemove.isNotEmpty()) {
                writePending(context, pending)
            }
            return operationIdsToRemove
        }
    }

    private fun writePending(context: Context, pending: JSONObject) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_COMMANDS, pending.toString())
            .apply()
    }

    fun remove(context: Context, operationId: String) {
        if (operationId.isBlank()) {
            return
        }
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            pending.remove(operationId)
            writePending(context, pending)
        }
    }

    private fun rawPending(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_PENDING_COMMANDS, "{}")
            ?: "{}"
    }

}
