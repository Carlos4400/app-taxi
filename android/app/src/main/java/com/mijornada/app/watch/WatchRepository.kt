package com.mijornada.app.watch

class WatchRepository(private val database: WatchDatabase) {
    private val processedOperationLimit = 512

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
                ),
            )

            if (inserted == -1L) {
                return@runInTransaction WatchProcessorResult(
                    state = stateBeforeCommand,
                    response = WatchResponse.DuplicateIgnored(command.operationId, "Operacion ya procesada"),
                )
            }

            val result = WatchCommandProcessor.process(
                command,
                stateBeforeCommand,
                operationExists = { id -> database.operationDao().exists(id) },
            )
            persistState(result.state)
            database.operationDao().markApplied(command.operationId)
            database.operationDao().pruneAppliedOperations(processedOperationLimit)
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
        }
}
