package com.mijornada.app.watch

class WatchRepository(private val database: WatchDatabase) {
    private val processedOperationLimit = 512
    private val operationRetentionMs = 90L * 24L * 60L * 60L * 1000L

    fun replaceAppState(snapshot: WatchAppSnapshot) {
        if (snapshot.current.startTime == null && snapshot.current.entries.isNotEmpty()) {
            throw InvalidWatchSnapshotException()
        }
        database.runInTransaction {
            val appliedOperationIds = database.operationDao()
                .getRecentAppliedOperationIds(processedOperationLimit)
                .toSet()
            val watchIds = snapshot.processedOperationIds.toSet()

            val mobileOnlyIds = appliedOperationIds - watchIds
            if (mobileOnlyIds.isNotEmpty()) {
                throw StaleWatchSnapshotException()
            }

            persistCurrentAndHistory(snapshot.current, snapshot.history)
        }
    }

    fun applyCommand(
        command: WatchCommand,
        rawCommandJson: String,
        nowDate: String,
        nowTime: String,
        nowId: Long,
    ): WatchProcessorResult {
        if (command.operationId.isBlank()) {
            return WatchProcessorResult(
                state = readState(nowDate, nowTime, nowId),
                response = WatchResponse.Error("", "INVALID_OPERATION_ID", "operationId es obligatorio"),
            )
        }
        return database.runInTransaction<WatchProcessorResult> {
            val stateBeforeCommand = readState(nowDate, nowTime, nowId)

            val inserted = database.operationDao().insert(
                OperationEntity(
                    operationId = command.operationId,
                    type = command.typeName(),
                    payloadJson = rawCommandJson,
                    createdAtClient = command.createdAt,
                    createdAtPhone = "$nowDate $nowTime",
                    applied = false,
                    resultType = "PENDING",
                    resultCode = null,
                    resultMessage = null,
                    responseJson = "",
                    processedAtEpochMs = 0L,
                ),
            )

            if (inserted == -1L) {
                val storedResponse = database.operationDao().getById(command.operationId)
                    ?.responseJson
                    ?.let(WatchResponseJson::fromJson)
                return@runInTransaction WatchProcessorResult(
                    state = stateBeforeCommand,
                    response = storedResponse
                        ?: WatchResponse.DuplicateIgnored(command.operationId, "Operacion ya procesada"),
                )
            }

            val result = WatchCommandProcessor.process(
                command,
                stateBeforeCommand,
                operationExists = { id -> database.operationDao().exists(id) },
            )
            val applied = result.response !is WatchResponse.Error
            if (applied) {
                persistState(result.state)
            }
            val responseJson = WatchResponseJson.toJson(result.response)
            val error = result.response as? WatchResponse.Error
            database.operationDao().finalize(
                operationId = command.operationId,
                applied = applied,
                resultType = if (applied) "APPLIED" else "REJECTED",
                resultCode = error?.code,
                resultMessage = when (val response = result.response) {
                    is WatchResponse.Ok -> response.message
                    is WatchResponse.DuplicateIgnored -> response.message
                    is WatchResponse.Error -> response.message
                },
                responseJson = responseJson,
                processedAtEpochMs = nowId,
            )
            database.operationDao().pruneFinalizedBefore(nowId - operationRetentionMs)
            result
        }
    }

    fun readState(nowDate: String, nowTime: String, nowId: Long): WatchProcessorState {
        val currentEntity = database.currentTurnoDao().getCurrent()
        val current = if (currentEntity == null) {
            WatchCurrentState.empty()
        } else {
            WatchCurrentState(
                startTime = currentEntity.startTime,
                startDate = currentEntity.startDate,
                entries = WatchStateJson.entriesFromJson(currentEntity.entriesJson),
                isPaused = currentEntity.isPaused,
                pauseStartTime = currentEntity.pauseStartTime,
                totalPausedMinutes = currentEntity.totalPausedMinutes,
            )
        }

        val history = database.turnoDao().getAll().map { turno ->
            WatchTurno(
                id = turno.id,
                date = turno.date,
                startDate = turno.startDate,
                startTime = turno.startTime,
                endTime = turno.endTime,
                entries = WatchStateJson.entriesFromJson(turno.entriesJson),
                dinero = turno.dinero,
                km = turno.km,
                notes = turno.notes,
                totalPausedMinutes = turno.totalPausedMinutes,
                totalTaximetro = turno.totalTaximetro,
                miGanancia = turno.miGanancia,
                totalADescontar = turno.totalADescontar,
                totalADar = turno.totalADar,
            )
        }

        return WatchProcessorState(
            current = current,
            history = history,
            processedOperationIds = database.operationDao()
                .getRecentAppliedOperationIds(processedOperationLimit)
                .asReversed(),
            nowDate = nowDate,
            nowTime = nowTime,
            nowId = nowId,
        )
    }

    private fun persistState(state: WatchProcessorState) {
        persistCurrentAndHistory(state.current, state.history)
    }

    private fun persistCurrentAndHistory(current: WatchCurrentState, history: List<WatchTurno>) {
        database.runInTransaction {
            if (current.isActive()) {
                database.currentTurnoDao().replace(
                    CurrentTurnoEntity(
                        id = 0,
                        startTime = current.startTime,
                        startDate = current.startDate,
                        entriesJson = WatchStateJson.entriesToJson(current.entries),
                        isPaused = current.isPaused,
                        pauseStartTime = current.pauseStartTime,
                        totalPausedMinutes = current.totalPausedMinutes,
                    ),
                )
            } else {
                database.currentTurnoDao().clear()
            }

            database.turnoDao().clear()
            database.turnoDao().insertAll(
                history.map { turno ->
                    TurnoEntity(
                        id = turno.id,
                        date = turno.date,
                        startDate = turno.startDate,
                        startTime = turno.startTime,
                        endTime = turno.endTime,
                        entriesJson = WatchStateJson.entriesToJson(turno.entries),
                        dinero = turno.dinero,
                        km = turno.km,
                        notes = turno.notes,
                        totalPausedMinutes = turno.totalPausedMinutes,
                        totalTaximetro = turno.totalTaximetro,
                        miGanancia = turno.miGanancia,
                        totalADescontar = turno.totalADescontar,
                        totalADar = turno.totalADar,
                    )
                },
            )
        }
    }

    private fun WatchCommand.typeName(): String =
        when (this) {
            is WatchCommand.StartTurno -> "START_TURNO"
            is WatchCommand.PauseTurno -> "PAUSE_TURNO"
            is WatchCommand.ResumeTurno -> "RESUME_TURNO"
            is WatchCommand.AddEntry -> "ADD_ENTRY"
            is WatchCommand.AddNote -> "ADD_NOTE"
            is WatchCommand.EditEntry -> "EDIT_ENTRY"
            is WatchCommand.DeleteEntry -> "DELETE_ENTRY"
            is WatchCommand.EndTurno -> "END_TURNO"
            is WatchCommand.EditTurno -> "EDIT_TURNO"
        }
}
