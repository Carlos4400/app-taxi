package com.mijornada.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object WearConstants {
    const val HANDLED_OPERATION_LIMIT = 128

    object Response {
        const val PREFS = "mobile_response_prefs"
        const val RESPONSE_SEQUENCE = "response_sequence"
        const val RESPONSE_QUEUE = "response_queue"
        val QUEUE_LOCK = Any()

        fun enqueue(context: Context, responseJson: String): Boolean {
            synchronized(QUEUE_LOCK) {
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val current = readQueue(prefs.getString(RESPONSE_QUEUE, "[]"))
                val incoming = parse(responseJson)
                val incomingType = incoming?.optString("type", "") ?: ""
                val incomingOperationId = incoming?.optString("operationId", "") ?: ""
                val incomingTerminal = isTerminalResponse(
                    incomingType,
                    incoming?.optString("code", "") ?: "",
                )
                val next = JSONArray()
                for (i in 0 until current.length()) {
                    val existingRaw = current.optString(i, "")
                    val existing = parse(existingRaw)
                    val sameTerminal = incomingTerminal &&
                        incomingOperationId.isNotBlank() &&
                        incomingOperationId == existing?.optString("operationId", "")
                    val supersededStatus = incomingType in setOf("STATUS", "TURNOS_STATUS") &&
                        existing?.optString("type", "") == incomingType
                    if (!sameTerminal && !supersededStatus && existingRaw.isNotBlank()) {
                        next.put(existingRaw)
                    }
                }
                next.put(responseJson)
                return prefs.edit()
                    .putString(RESPONSE_QUEUE, next.toString())
                    .putLong(RESPONSE_SEQUENCE, prefs.getLong(RESPONSE_SEQUENCE, 0L) + 1L)
                    .commit()
            }
        }

        fun pending(context: Context): List<String> {
            synchronized(QUEUE_LOCK) {
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val arr = readQueue(prefs.getString(RESPONSE_QUEUE, "[]"))
                return (0 until arr.length())
                    .mapNotNull { index -> arr.optString(index, "").takeIf(String::isNotBlank) }
            }
        }

        fun acknowledge(context: Context, responseJson: String): Boolean {
            synchronized(QUEUE_LOCK) {
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val current = readQueue(prefs.getString(RESPONSE_QUEUE, "[]"))
                val next = JSONArray()
                var removed = false
                for (i in 0 until current.length()) {
                    val item = current.optString(i, "")
                    if (!removed && item == responseJson) {
                        removed = true
                    } else if (item.isNotBlank()) {
                        next.put(item)
                    }
                }
                return !removed || prefs.edit().putString(RESPONSE_QUEUE, next.toString()).commit()
            }
        }

        private fun readQueue(raw: String?): JSONArray =
            try {
                JSONArray(raw ?: "[]")
            } catch (_: Exception) {
                JSONArray()
            }

        private fun parse(raw: String): JSONObject? =
            try {
                JSONObject(raw)
            } catch (_: Exception) {
                null
            }
    }

    fun isTerminalResponse(responseType: String, code: String): Boolean {
        if (responseType == "OK" || responseType == "DUPLICATE_IGNORED") return true
        return responseType == "ERROR" && code != "USER_NOT_PREPARED" && code != "APP_NOT_READY"
    }
}
