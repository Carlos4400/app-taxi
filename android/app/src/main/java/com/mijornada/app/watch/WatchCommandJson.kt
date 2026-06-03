package com.mijornada.app.watch

import org.json.JSONObject

object WatchCommandJson {
    @JvmStatic
    fun parse(commandJson: String): WatchCommand {
        val json = try {
            JSONObject(commandJson)
        } catch (e: Exception) {
            throw MalformedJsonException("JSON no valido: ${e.message}")
        }

        val errors = mutableListOf<String>()

        val type = json.optString("type", "")
        if (type.isBlank()) {
            errors.add("type")
        }

        val operationId = json.optString("operationId", "")
        if (operationId.isBlank()) {
            errors.add("operationId")
        }

        val createdAt = json.optString("createdAt", "")
        if (createdAt.isBlank()) {
            errors.add("createdAt")
        }

        if (errors.isNotEmpty()) {
            throw InvalidPayloadException("Campos requeridos faltantes: ${errors.joinToString(", ")}")
        }

        val payload = json.optJSONObject("payload") ?: JSONObject()

        return when (type) {
            "START_TURNO" -> WatchCommand.StartTurno(operationId, createdAt)
            "PAUSE_TURNO" -> WatchCommand.PauseTurno(operationId, createdAt)
            "RESUME_TURNO" -> WatchCommand.ResumeTurno(operationId, createdAt)
            "ADD_ENTRY" -> WatchCommand.AddEntry(
                operationId = operationId,
                createdAt = createdAt,
                entryType = payload.optString("entryType", ""),
                amount = payload.optDouble("amount", 0.0),
                note = payload.optString("note", ""),
            )
            "ADD_NOTE" -> WatchCommand.AddNote(
                operationId = operationId,
                createdAt = createdAt,
                note = payload.optString("note", ""),
            )
            "EDIT_ENTRY" -> WatchCommand.EditEntry(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
                amount = payload.optDouble("amount", 0.0),
                note = payload.optString("note", ""),
            )
            "DELETE_ENTRY" -> WatchCommand.DeleteEntry(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
            )
            "END_TURNO" -> WatchCommand.EndTurno(
                operationId = operationId,
                createdAt = createdAt,
                dinero = payload.optDouble("dinero", 0.0),
                km = payload.optDouble("km", 0.0),
                note = payload.optString("note", ""),
            )
            else -> throw InvalidCommandException("Comando Wear no reconocido: $type")
        }
    }
}

class MalformedJsonException(message: String) : Exception(message)
class InvalidPayloadException(message: String) : Exception(message)
class InvalidCommandException(message: String) : Exception(message)
