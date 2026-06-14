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
        val publishedAt: Long,
    )

    fun save(context: Context, operationId: String, commandJson: String): Boolean {
        if (operationId.isBlank() || commandJson.isBlank()) {
            return false
        }
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            if (pending.has(operationId)) {
                return true
            }
            pending.put(
                operationId,
                JSONObject()
                    .put("commandJson", commandJson)
                    .put("publishedAt", 0L),
            )
            return writePending(context, pending)
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
                    publishedAt = item.optLong("publishedAt", 0L),
                )
            }.toMap()
        }
    }

    fun unpublishedCommands(context: Context): Map<String, PendingCommand> =
        pendingCommands(context).filterValues { it.publishedAt <= 0L }

    fun commandsFromOtherSessions(context: Context, userSessionId: String): List<String> {
        if (userSessionId.isBlank()) {
            return emptyList()
        }
        synchronized(lock) {
            return pendingCommands(context).values.mapNotNull { command ->
                val commandSessionId = try {
                    JSONObject(command.commandJson).optString("userSessionId", "")
                } catch (e: Exception) {
                    ""
                }
                command.operationId.takeIf { commandSessionId != userSessionId }
            }
        }
    }

    fun markPublished(context: Context, operationId: String, publishedAt: Long): Boolean {
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            val item = pending.optJSONObject(operationId) ?: return false
            item.put("publishedAt", publishedAt)
            return writePending(context, pending)
        }
    }

    private fun writePending(context: Context, pending: JSONObject): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_COMMANDS, pending.toString())
            .commit()

    fun remove(context: Context, operationId: String): Boolean {
        if (operationId.isBlank()) {
            return false
        }
        synchronized(lock) {
            val pending = JSONObject(rawPending(context))
            if (!pending.has(operationId)) return true
            pending.remove(operationId)
            return writePending(context, pending)
        }
    }

    private fun rawPending(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_PENDING_COMMANDS, "{}")
            ?: "{}"
    }

}
