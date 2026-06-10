package com.mijornada.app.watch

import org.json.JSONArray
import org.json.JSONObject

object WatchStateJson {
    @JvmStatic
    fun stateToJson(state: WatchProcessorState): String {
        val json = JSONObject()
        json.put(
            "current",
            JSONObject()
                .put("startTime", state.current.startTime)
                .put("startDate", state.current.startDate)
                .put("entries", entriesArray(state.current.entries))
                .put("isPaused", state.current.isPaused)
                .put("pauseStartTime", state.current.pauseStartTime)
                .put("totalPausedMinutes", state.current.totalPausedMinutes),
        )
        json.put(
            "history",
            JSONArray().also { array ->
                state.history.forEach { turno ->
                    array.put(
                        JSONObject()
                            .put("id", turno.id)
                            .put("date", turno.date)
                            .put("startDate", turno.startDate)
                            .put("startTime", turno.startTime)
                            .put("endTime", turno.endTime)
                            .put("entries", entriesArray(turno.entries))
                            .put("dinero", turno.dinero)
                            .put("km", turno.km)
                            .put("notes", turno.notes)
                            .put("totalPausedMinutes", turno.totalPausedMinutes),
                    )
                }
            },
        )
        json.put("processedOperationIds", JSONArray(state.processedOperationIds))
        return json.toString()
    }

    fun entriesToJson(entries: List<WatchEntry>): String {
        return entriesArray(entries).toString()
    }

    private fun entriesArray(entries: List<WatchEntry>): JSONArray {
        val array = JSONArray()
        entries.forEach { entry ->
            array.put(
                JSONObject()
                    .put("id", entry.id)
                    .put("type", entry.type)
                    .put("amount", entry.amount)
                    .put("note", entry.note)
                    .put("time", entry.time),
            )
        }
        return array
    }

    fun entriesFromJson(entriesJson: String): List<WatchEntry> {
        if (entriesJson.isBlank()) {
            return emptyList()
        }

        val array = JSONArray(entriesJson)
        return (0 until array.length()).map { index ->
            val item = array.getJSONObject(index)
            WatchEntry(
                id = item.optLong("id", 0L),
                type = item.optString("type", ""),
                amount = item.optDouble("amount", 0.0),
                note = item.optString("note", ""),
                time = item.optString("time", ""),
            )
        }
    }

    @JvmStatic
    fun snapshotFromJson(stateJson: String): WatchAppSnapshot {
        val root = JSONObject(stateJson)
        val currentJson = root.optJSONObject("current") ?: JSONObject()
        val current = WatchCurrentState(
            startTime = nullableString(currentJson, "startTime"),
            startDate = nullableString(currentJson, "startDate"),
            entries = entriesFromJson(currentJson.optJSONArray("entries")?.toString() ?: "[]"),
            isPaused = currentJson.optBoolean("isPaused", false),
            pauseStartTime = nullableString(currentJson, "pauseStartTime"),
            totalPausedMinutes = currentJson.optInt("totalPausedMinutes", 0),
        )

        val historyJson = root.optJSONArray("history") ?: JSONArray()
        val history = (0 until historyJson.length()).mapNotNull { index ->
            val turno = historyJson.optJSONObject(index) ?: return@mapNotNull null
            // Contabilidad precalculada por la app (regla de oro TypeScript).
            val contable = turno.optJSONObject("contable")
            WatchTurno(
                id = turno.optLong("id", 0L),
                date = turno.optString("date", ""),
                startDate = nullableString(turno, "startDate"),
                startTime = nullableString(turno, "startTime"),
                endTime = turno.optString("endTime", ""),
                entries = entriesFromJson(turno.optJSONArray("entries")?.toString() ?: "[]"),
                dinero = turno.optDouble("dinero", 0.0),
                km = turno.optDouble("km", 0.0),
                notes = turno.optString("notes", ""),
                totalPausedMinutes = turno.optInt("totalPausedMinutes", 0),
                totalTaximetro = nullableDouble(contable, "totalTaximetro"),
                miGanancia = nullableDouble(contable, "miGanancia"),
                totalADescontar = nullableDouble(contable, "totalADescontar"),
                totalADar = nullableDouble(contable, "totalADar"),
            )
        }
        val processedOperationIdsJson = root.optJSONArray("processedOperationIds") ?: JSONArray()
        val processedOperationIds = (0 until processedOperationIdsJson.length()).mapNotNull { index ->
            processedOperationIdsJson.optString(index, "").ifBlank { null }
        }
        return WatchAppSnapshot(
            current = current,
            history = history,
            processedOperationIds = processedOperationIds,
        )
    }

    private fun nullableString(json: JSONObject, key: String): String? {
        if (!json.has(key) || json.isNull(key)) return null
        return json.optString(key, "").ifBlank { null }
    }

    private fun nullableDouble(json: JSONObject?, key: String): Double? {
        if (json == null || !json.has(key) || json.isNull(key)) return null
        val value = json.optDouble(key, Double.NaN)
        return if (value.isNaN()) null else value
    }
}
