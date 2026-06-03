package com.mijornada.app.watch

import android.content.Context
import androidx.room.Room
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

object WatchDatabaseProvider {
    private const val LEGACY_DATABASE_NAME = "mi-turno-watch.db"
    private val instances = ConcurrentHashMap<String, WatchDatabase>()

    @JvmStatic
    fun get(context: Context): WatchDatabase {
        val uid = WatchUserSession.getUid(context)
        require(uid.isNotBlank()) { "No hay usuario preparado para Wear OS" }
        return getForUid(context, uid)
    }

    @JvmStatic
    fun getForUid(context: Context, uid: String): WatchDatabase {
        val normalizedUid = uid.trim()
        require(normalizedUid.isNotBlank()) { "uid es obligatorio" }
        val databaseName = "mi-turno-watch-${databaseKey(normalizedUid)}.db"
        migrateLegacyDatabaseIfNeeded(context.applicationContext, databaseName)
        return instances[databaseName] ?: synchronized(instances) {
            instances[databaseName] ?: Room.databaseBuilder(
                    context.applicationContext,
                    WatchDatabase::class.java,
                    databaseName,
                )
                .addMigrations(
                    WatchDatabase.MIGRATION_1_2,
                    WatchDatabase.MIGRATION_2_3,
                    WatchDatabase.MIGRATION_3_4,
                )
                .build()
                .also { database -> instances[databaseName] = database }
        }
    }

    private fun databaseKey(uid: String): String {
        return MessageDigest.getInstance("SHA-256")
            .digest(uid.toByteArray(Charsets.UTF_8))
            .joinToString("") { byte -> "%02x".format(byte) }
            .take(32)
    }

    private fun migrateLegacyDatabaseIfNeeded(context: Context, databaseName: String) {
        val target = context.getDatabasePath(databaseName)
        val legacy = context.getDatabasePath(LEGACY_DATABASE_NAME)
        if (target.exists() || !legacy.exists()) return

        legacy.delete()
        listOf("-wal", "-shm").forEach { suffix ->
            val legacySidecar = context.getDatabasePath(LEGACY_DATABASE_NAME + suffix)
            if (legacySidecar.exists()) {
                legacySidecar.delete()
            }
        }
    }

    @JvmStatic
    fun clear() {
        instances.values.forEach { database ->
            database.close()
        }
        instances.clear()
    }
}
