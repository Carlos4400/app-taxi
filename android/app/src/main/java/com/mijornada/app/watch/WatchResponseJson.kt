package com.mijornada.app.watch

import org.json.JSONObject

object WatchResponseJson {
    fun toJson(response: WatchResponse): String {
        val json = JSONObject()
        when (response) {
            is WatchResponse.Ok -> {
                json.put("type", "OK")
                json.put("operationId", response.operationId)
                json.put("message", response.message)
            }
            is WatchResponse.DuplicateIgnored -> {
                json.put("type", "DUPLICATE_IGNORED")
                json.put("operationId", response.operationId)
                json.put("message", response.message)
            }
            is WatchResponse.Error -> {
                json.put("type", "ERROR")
                json.put("operationId", response.operationId)
                json.put("code", response.code)
                json.put("message", response.message)
            }
        }
        return json.toString()
    }

    @JvmStatic
    fun statusToJson(operationId: String, state: WatchProcessorState, userSessionId: String = ""): String {
        return JSONObject()
            .put("type", "STATUS")
            .put("operationId", operationId)
            .put("connected", true)
            .put("activeTurno", state.current.isActive())
            .put("startTime", state.current.startTime)
            .put("startDate", state.current.startDate)
            .put("totals", totalsJson(state.current.entries))
            .put("entradas", entriesJson(state.current.entries.asReversed()))
            .put("userSessionId", userSessionId)
            .put("isPaused", state.current.isPaused)
            .put("pauseStartTime", state.current.pauseStartTime)
            .put("totalPausedMinutes", state.current.totalPausedMinutes)
            .toString()
    }

    @JvmStatic
    fun turnosStatusToJson(operationId: String, state: WatchProcessorState, userSessionId: String = ""): String {
        val turnos = org.json.JSONArray()
        state.history.asReversed().take(30).forEach { turno ->
            val totalGasolina = turno.entries.filter { it.type == "gasolina" }.sumOf { it.amount }
            val totalNulo = turno.entries.filter { it.type == "nulo" }.sumOf { it.amount }
            val totalDescontar = totalGasolina + totalNulo
            val miGanancia = turno.dinero - totalDescontar
            turnos.put(
                JSONObject()
                    .put("id", turno.id)
                    .put("date", turno.date)
                    .put("startDate", turno.startDate)
                    .put("startTime", turno.startTime)
                    .put("endTime", turno.endTime)
                    .put("dinero", turno.dinero)
                    .put("km", turno.km)
                    .put("totalTaximetro", turno.dinero)
                    .put("miGanancia", miGanancia)
                    .put("totalADescontar", totalDescontar)
                    .put("totalADar", miGanancia)
                    .put("tiempoTrabajado", workedTime(turno.startTime, turno.endTime, turno.totalPausedMinutes))
                    .put("totalPausedMinutes", turno.totalPausedMinutes)
                    .put("totals", totalsJson(turno.entries))
                    .put("entradas", entriesJson(turno.entries.asReversed())),
            )
        }

        return JSONObject()
            .put("type", "TURNOS_STATUS")
            .put("operationId", operationId)
            .put("connected", true)
            .put("userSessionId", userSessionId)
            .put("turnos", turnos)
            .toString()
    }

    private fun totalsJson(entries: List<WatchEntry>): JSONObject {
        val totals = JSONObject()
        val porTipo = JSONObject()
        val numPorTipo = JSONObject()
        val types = listOf("propina", "datafono", "agencia_bono", "extra", "gasolina", "nulo")
        types.forEach { type ->
            val typedEntries = entries.filter { entry -> entry.type == type }
            porTipo.put(type, typedEntries.sumOf { entry -> entry.amount })
            numPorTipo.put(type, typedEntries.size)
        }
        totals.put("porTipo", porTipo)
        totals.put("numPorTipo", numPorTipo)
        totals.put("numEntradas", entries.size)
        return totals
    }

    private fun entriesJson(entries: List<WatchEntry>): org.json.JSONArray {
        val json = org.json.JSONArray()
        entries.forEach { entry ->
            json.put(
                JSONObject()
                    .put("id", entry.id)
                    .put("type", entry.type)
                    .put("amount", entry.amount)
                    .put("note", entry.note)
                    .put("time", entry.time),
            )
        }
        return json
    }

    private fun workedTime(startTime: String?, endTime: String, totalPausedMinutes: Int): String {
        val startParts = startTime?.split(":") ?: return ""
        val endParts = endTime.split(":")
        if (startParts.size < 2 || endParts.size < 2) return ""
        val startHour = startParts[0].toIntOrNull() ?: return ""
        val startMinute = startParts[1].toIntOrNull() ?: return ""
        val endHour = endParts[0].toIntOrNull() ?: return ""
        val endMinute = endParts[1].toIntOrNull() ?: return ""
        var minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
        if (minutes < 0) minutes += 24 * 60
        minutes = (minutes - totalPausedMinutes).coerceAtLeast(0)
        return "${minutes / 60}h ${minutes % 60}m"
    }
}
