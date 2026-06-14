package com.mijornada.app.watch

import org.json.JSONObject

/**
 * Tipos de entrada admitidos. Lista cerrada, espejo de WatchEntryType en
 * src/shared/watch-commands.ts: un tipo desconocido no caería en ningún cubo
 * contable y descuadraría las cuentas en silencio, así que se rechaza aquí,
 * en la frontera, con error visible para el reloj (INVALID_PAYLOAD).
 */
private val TIPOS_ENTRADA = setOf("propina", "datafono", "agencia_bono", "extra", "gasolina", "nulo")

/** En las entradas de un turno (EDIT_TURNO) también viajan las notas. */
private val TIPOS_ENTRADA_TURNO = TIPOS_ENTRADA + "nota"

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
            "ADD_ENTRY" -> {
                requireFields(payload, "entryType", "amount")
                WatchCommand.AddEntry(
                operationId = operationId,
                createdAt = createdAt,
                entryType = payload.optString("entryType", "").also {
                    if (it !in TIPOS_ENTRADA) {
                        throw InvalidPayloadException("entryType desconocido: \"$it\"")
                    }
                },
                amount = payload.optDouble("amount", 0.0),
                note = payload.optString("note", ""),
                )
            }
            "ADD_NOTE" -> {
                requireFields(payload, "note")
                WatchCommand.AddNote(
                operationId = operationId,
                createdAt = createdAt,
                note = payload.optString("note", ""),
                )
            }
            "EDIT_ENTRY" -> {
                requireFields(payload, "id", "amount")
                WatchCommand.EditEntry(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
                amount = payload.optDouble("amount", 0.0),
                note = payload.optString("note", ""),
                )
            }
            "DELETE_ENTRY" -> {
                requireFields(payload, "id")
                WatchCommand.DeleteEntry(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
                )
            }
            "EDIT_TURNO" -> {
                requireFields(payload, "id", "dinero", "km", "entradas")
                WatchCommand.EditTurno(
                operationId = operationId,
                createdAt = createdAt,
                id = payload.optLong("id", 0L),
                dinero = payload.optDouble("dinero", 0.0),
                km = payload.optDouble("km", 0.0),
                entradas = parseEntradas(payload),
                )
            }
            "END_TURNO" -> {
                requireFields(payload, "dinero", "km")
                WatchCommand.EndTurno(
                operationId = operationId,
                createdAt = createdAt,
                dinero = payload.optDouble("dinero", 0.0),
                km = payload.optDouble("km", 0.0),
                note = payload.optString("note", ""),
                )
            }
            else -> throw InvalidCommandException("Comando Wear no reconocido: $type")
        }
    }
}

private fun requireFields(payload: JSONObject, vararg fields: String) {
    val missing = fields.filterNot(payload::has)
    if (missing.isNotEmpty()) {
        throw InvalidPayloadException("Campos requeridos faltantes en payload: ${missing.joinToString(", ")}")
    }
}

private fun parseEntradas(payload: JSONObject): List<WatchEntry> {
    val array = payload.optJSONArray("entradas")
        ?: throw InvalidPayloadException("entradas debe ser una lista")
    val entradas = mutableListOf<WatchEntry>()
    for (i in 0 until array.length()) {
        val item = array.optJSONObject(i)
            ?: throw InvalidPayloadException("entradas[$i] debe ser un objeto")
        requireFields(item, "id", "type", "amount", "note", "time")
        val tipo = item.optString("type", "")
        if (tipo !in TIPOS_ENTRADA_TURNO) {
            throw InvalidPayloadException("Tipo de entrada desconocido en entradas[$i]: \"$tipo\"")
        }
        entradas.add(
            WatchEntry(
                id = item.optLong("id", 0L),
                type = tipo,
                amount = item.optDouble("amount", 0.0),
                note = item.optString("note", ""),
                time = item.optString("time", ""),
            )
        )
    }
    return entradas
}

class MalformedJsonException(message: String) : Exception(message)
class InvalidPayloadException(message: String) : Exception(message)
class InvalidCommandException(message: String) : Exception(message)
