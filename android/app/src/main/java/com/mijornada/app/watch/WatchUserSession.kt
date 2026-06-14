package com.mijornada.app.watch

import android.content.Context
import java.util.UUID

object WatchUserSession {
    private const val PREFS = "watch_user_session"
    private const val KEY_UID = "uid"
    private const val KEY_SESSION_ID = "sessionId"

    @JvmStatic
    fun prepare(context: Context, uid: String): String {
        val normalizedUid = uid.trim()
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val currentUid = prefs.getString(KEY_UID, "") ?: ""
        val currentSessionId = prefs.getString(KEY_SESSION_ID, "") ?: ""
        val sessionId = if (currentUid == normalizedUid && currentSessionId.isNotBlank()) {
            currentSessionId
        } else {
            UUID.randomUUID().toString()
        }
        check(
            prefs
            .edit()
            .putString(KEY_UID, normalizedUid)
            .putString(KEY_SESSION_ID, sessionId)
            .commit(),
        ) { "No se pudo persistir la sesion Wear" }
        return sessionId
    }

    @JvmStatic
    fun getUid(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_UID, "")
            ?: ""
    }

    @JvmStatic
    fun getSessionId(context: Context): String {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_SESSION_ID, "")
            ?: ""
    }

    @JvmStatic
    fun clearIfMatches(context: Context, uid: String): Boolean {
        if (getUid(context) != uid.trim()) return false
        clear(context)
        return true
    }

    @JvmStatic
    fun clear(context: Context) {
        check(
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_UID)
            .remove(KEY_SESSION_ID)
            .commit(),
        ) { "No se pudo limpiar la sesion Wear" }
    }
}
