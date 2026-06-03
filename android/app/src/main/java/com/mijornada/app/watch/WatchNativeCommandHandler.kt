package com.mijornada.app.watch

import android.content.Context
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object WatchNativeCommandHandler {
    @JvmStatic
    fun handleCommand(
        context: Context,
        commandJson: String,
        pathOperationId: String,
    ): String {
        val uid = WatchUserSession.getUid(context)
        val sessionId = WatchUserSession.getSessionId(context)
        if (uid.isBlank()) {
            return userNotPrepared(pathOperationId)
        }
        val now = Date()
        val nowDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now)
        val nowTime = SimpleDateFormat("HH:mm", Locale.US).format(now)
        val repository = WatchRepository(WatchDatabaseProvider.getForUid(context, uid))
        return handleCommand(repository, commandJson, pathOperationId, sessionId, nowDate, nowTime, now.time)
    }

    @JvmStatic
    fun handleReadCommand(
        context: Context,
        commandJson: String,
        pathOperationId: String,
    ): String {
        val uid = WatchUserSession.getUid(context)
        if (uid.isBlank()) {
            return userNotPrepared(pathOperationId)
        }
        val now = Date()
        val nowDate = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now)
        val nowTime = SimpleDateFormat("HH:mm", Locale.US).format(now)
        val repository = WatchRepository(WatchDatabaseProvider.getForUid(context, uid))
        return handleReadCommand(
            repository,
            commandJson,
            pathOperationId,
            WatchUserSession.getSessionId(context),
            nowDate,
            nowTime,
            now.time,
        )
    }

    @JvmStatic
    fun handleReadCommand(
        repository: WatchRepository,
        commandJson: String,
        pathOperationId: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): String {
        return handleReadCommand(repository, commandJson, pathOperationId, "", nowDate, nowTime, nowId)
    }

    @JvmStatic
    fun handleReadCommand(
        repository: WatchRepository,
        commandJson: String,
        pathOperationId: String,
        userSessionId: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): String {
        val json = try {
            JSONObject(commandJson)
        } catch (e: Exception) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "INVALID_COMMAND", "Comando Wear invalido"),
            )
        }

        val operationId = json.optString("operationId", pathOperationId)
        return when (json.optString("type", "")) {
            "GET_STATUS" -> WatchResponseJson.statusToJson(
                operationId,
                repository.readState(nowDate, nowTime, nowId),
                userSessionId,
            )
            "GET_TURNOS" -> WatchResponseJson.turnosStatusToJson(
                operationId,
                repository.readState(nowDate, nowTime, nowId),
                userSessionId,
            )
            else -> WatchResponseJson.toJson(
                WatchResponse.Error(operationId, "UNKNOWN_COMMAND", "Comando no reconocido"),
            )
        }
    }

    @JvmStatic
    fun handleCommand(
        repository: WatchRepository,
        commandJson: String,
        pathOperationId: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): String {
        return handleCommand(repository, commandJson, pathOperationId, "", nowDate, nowTime, nowId)
    }

    @JvmStatic
    fun handleCommand(
        repository: WatchRepository,
        commandJson: String,
        pathOperationId: String,
        expectedUserSessionId: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): String {
        if (expectedUserSessionId.isNotBlank()) {
            val commandSessionId = try {
                JSONObject(commandJson).optString("userSessionId", "")
            } catch (e: Exception) {
                ""
            }
            if (commandSessionId != expectedUserSessionId) {
                return WatchResponseJson.toJson(
                    WatchResponse.Error(pathOperationId, "USER_SESSION_MISMATCH", "Sesion de usuario no valida"),
                )
            }
        }
        val command = try {
            WatchCommandJson.parse(commandJson)
        } catch (e: MalformedJsonException) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "MALFORMED_JSON", e.message ?: "JSON no valido"),
            )
        } catch (e: InvalidPayloadException) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "INVALID_PAYLOAD", e.message ?: "Payload invalido"),
            )
        } catch (e: InvalidCommandException) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "INVALID_COMMAND", e.message ?: "Comando Wear invalido"),
            )
        } catch (e: Exception) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(pathOperationId, "INVALID_COMMAND", "Comando Wear invalido"),
            )
        }

        if (pathOperationId.isNotBlank() && command.operationId != pathOperationId) {
            return WatchResponseJson.toJson(
                WatchResponse.Error(command.operationId, "OPERATION_ID_MISMATCH", "operationId no coincide"),
            )
        }

        return WatchResponseJson.toJson(
            repository.applyCommand(
                command = command,
                rawCommandJson = commandJson,
                nowDate = nowDate,
                nowTime = nowTime,
                nowId = nowId,
            ).response,
        )
    }

    private fun userNotPrepared(operationId: String): String {
        return WatchResponseJson.toJson(
            WatchResponse.Error(operationId, "USER_NOT_PREPARED", "Abre Mi Turno en el movil"),
        )
    }
}
