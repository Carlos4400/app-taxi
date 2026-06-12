package com.mijornada.app

import android.content.ComponentName
import android.content.Context
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import org.json.JSONObject

/**
 * Último STATUS confirmado por el móvil, persistido para que la Tile
 * (cuadrícula) y la complicación de esfera muestren el estado del turno sin
 * depender de que la Activity esté viva. Solo lectura de estado confirmado:
 * estas superficies nunca inventan ni modifican datos de negocio.
 */
object TurnoStatusStore {
    private const val PREFS = "turno_status_store"
    private const val KEY_STATUS = "last_status_json"

    data class Status(
        val conocido: Boolean,
        val activo: Boolean,
        val pausado: Boolean,
        val startTime: String,
        val numEntradas: Int,
    )

    @JvmStatic
    fun save(context: Context, statusJson: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().putString(KEY_STATUS, statusJson).apply()
        notifySurfaces(context)
    }

    @JvmStatic
    fun read(context: Context): Status {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_STATUS, null)
            ?: return Status(conocido = false, activo = false, pausado = false, startTime = "", numEntradas = 0)
        return try {
            val json = JSONObject(raw)
            Status(
                conocido = true,
                activo = json.optBoolean("activeTurno", false),
                pausado = json.optBoolean("isPaused", false),
                startTime = json.optString("startTime", ""),
                numEntradas = json.optJSONArray("entradas")?.length() ?: 0,
            )
        } catch (e: Exception) {
            Status(conocido = false, activo = false, pausado = false, startTime = "", numEntradas = 0)
        }
    }

    private const val KEY_LAST_COMPLICATION_UPDATE = "last_complication_update_ms"

    /** Minimo entre peticiones de refresco de la complicación. La documentación
     *  oficial advierte: "don't call requestUpdate() more often than every
     *  5 minutes on average"; con este suelo, el uso real (acciones espaciadas
     *  en un turno) mantiene la media muy por encima de 5 minutos. */
    private const val MIN_COMPLICATION_UPDATE_MS = 60_000L

    /** Pide refresco de Tile y complicación tras cada STATUS nuevo (patrón push oficial). */
    private fun notifySurfaces(context: Context) {
        try {
            TileService.getUpdater(context).requestUpdate(TurnoTileService::class.java)
        } catch (_: Exception) {
            // Sin tile añadida todavía: ignorar.
        }
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val ahora = System.currentTimeMillis()
            if (ahora - prefs.getLong(KEY_LAST_COMPLICATION_UPDATE, 0L) >= MIN_COMPLICATION_UPDATE_MS) {
                prefs.edit().putLong(KEY_LAST_COMPLICATION_UPDATE, ahora).apply()
                ComplicationDataSourceUpdateRequester
                    .create(context, ComponentName(context, TurnoComplicationService::class.java))
                    .requestUpdateAll()
            }
        } catch (_: Exception) {
            // Sin complicación colocada todavía: ignorar.
        }
    }
}
