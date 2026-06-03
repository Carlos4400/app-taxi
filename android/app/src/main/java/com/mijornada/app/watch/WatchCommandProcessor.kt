package com.mijornada.app.watch

object WatchCommandProcessor {
    @JvmStatic
    fun process(command: WatchCommand, state: WatchProcessorState, operationExists: (String) -> Boolean): WatchProcessorResult {
        if (command.operationId.isBlank()) {
            return state.error(command.operationId, "INVALID_OPERATION_ID", "operationId obligatorio")
        }

        if (operationExists(command.operationId)) {
            return WatchProcessorResult(
                state = state,
                response = WatchResponse.DuplicateIgnored(command.operationId, "Operacion ya procesada"),
            )
        }

        return when (command) {
            is WatchCommand.StartTurno -> processStartTurno(command, state)
            is WatchCommand.PauseTurno -> processPauseTurno(command, state)
            is WatchCommand.ResumeTurno -> processResumeTurno(command, state)
            is WatchCommand.AddEntry -> processAddEntry(command, state)
            is WatchCommand.AddNote -> processAddNote(command, state)
            is WatchCommand.EditEntry -> processEditEntry(command, state)
            is WatchCommand.DeleteEntry -> processDeleteEntry(command, state)
            is WatchCommand.EndTurno -> processEndTurno(command, state)
        }
    }

    private fun processPauseTurno(command: WatchCommand.PauseTurno, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }
        if (state.current.isPaused) {
            return state.error(command.operationId, "ALREADY_PAUSED", "El turno ya esta pausado")
        }
        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(isPaused = true, pauseStartTime = state.nowTime),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Turno pausado"),
        )
    }

    private fun processResumeTurno(command: WatchCommand.ResumeTurno, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }
        if (!state.current.isPaused || state.current.pauseStartTime == null) {
            return state.error(command.operationId, "NOT_PAUSED", "El turno no esta pausado")
        }
        val pausedMinutes = elapsedMinutes(state.current.pauseStartTime, state.nowTime)
        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(
                    isPaused = false,
                    pauseStartTime = null,
                    totalPausedMinutes = state.current.totalPausedMinutes + pausedMinutes,
                ),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Turno reanudado"),
        )
    }

    private fun processStartTurno(command: WatchCommand.StartTurno, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.isActive()) {
            return state.error(command.operationId, "ACTIVE_TURNO", "Ya hay turno activo")
        }

        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(startTime = state.nowTime, startDate = state.nowDate),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Turno iniciado"),
        )
    }

    private fun processAddEntry(command: WatchCommand.AddEntry, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }
        if (command.amount <= 0.0) {
            return state.error(command.operationId, "INVALID_AMOUNT", "Importe invalido")
        }

        val entry = WatchEntry(
            id = state.nowId,
            type = command.entryType,
            amount = command.amount,
            note = command.note.trim(),
            time = state.nowTime,
        )

        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(entries = state.current.entries + entry),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Entrada anadida"),
        )
    }

    private fun processAddNote(command: WatchCommand.AddNote, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }
        val note = command.note.trim()
        if (note.isBlank()) {
            return state.error(command.operationId, "INVALID_NOTE", "Nota obligatoria")
        }

        val entry = WatchEntry(
            id = state.nowId,
            type = "nota",
            amount = 0.0,
            note = note,
            time = state.nowTime,
        )

        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(entries = state.current.entries + entry),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Nota anadida"),
        )
    }

    private fun processEditEntry(command: WatchCommand.EditEntry, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }

        val target = state.current.entries.find { it.id == command.id }
            ?: return state.error(command.operationId, "ENTRY_NOT_FOUND", "Entrada no encontrada")

        if (target.type != "nota" && command.amount <= 0.0) {
            return state.error(command.operationId, "INVALID_AMOUNT", "Importe invalido")
        }

        val nextEntries = state.current.entries.map { entry ->
            if (entry.id == command.id) {
                entry.copy(
                    amount = if (entry.type == "nota") entry.amount else command.amount,
                    note = command.note.trim(),
                )
            } else {
                entry
            }
        }

        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(entries = nextEntries),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Entrada editada"),
        )
    }

    private fun processDeleteEntry(command: WatchCommand.DeleteEntry, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }
        if (state.current.entries.none { it.id == command.id }) {
            return state.error(command.operationId, "ENTRY_NOT_FOUND", "Entrada no encontrada")
        }

        return WatchProcessorResult(
            state = state.copy(
                current = state.current.copy(entries = state.current.entries.filter { it.id != command.id }),
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Entrada borrada"),
        )
    }

    private fun processEndTurno(command: WatchCommand.EndTurno, state: WatchProcessorState): WatchProcessorResult {
        if (state.current.startTime == null) {
            return state.error(command.operationId, "NO_ACTIVE_TURNO", "No hay turno activo")
        }
        if (command.dinero <= 0.0 || command.km <= 0.0) {
            return state.error(command.operationId, "INVALID_END_VALUES", "Taximetro y kilometros obligatorios")
        }

        val pendingPausedMinutes = if (state.current.isPaused && state.current.pauseStartTime != null) {
            elapsedMinutes(state.current.pauseStartTime, state.nowTime)
        } else {
            0
        }
        val turno = WatchTurno(
            id = state.nowId,
            date = state.nowDate,
            startDate = state.current.startDate,
            startTime = state.current.startTime,
            endTime = state.nowTime,
            entries = state.current.entries,
            dinero = command.dinero,
            km = command.km,
            notes = command.note.trim(),
            totalPausedMinutes = state.current.totalPausedMinutes + pendingPausedMinutes,
        )

        return WatchProcessorResult(
            state = state.copy(
                current = WatchCurrentState.empty(),
                history = state.history + turno,
                processedOperationIds = state.withOperationId(command.operationId),
            ),
            response = WatchResponse.Ok(command.operationId, "Turno terminado"),
        )
    }

    private fun WatchProcessorState.withOperationId(operationId: String): List<String> =
        if (processedOperationIds.contains(operationId)) processedOperationIds else processedOperationIds + operationId

    private fun elapsedMinutes(startTime: String, endTime: String): Int {
        fun toMinutes(value: String): Int? {
            val parts = value.split(":")
            if (parts.size < 2) return null
            val hours = parts[0].toIntOrNull() ?: return null
            val minutes = parts[1].toIntOrNull() ?: return null
            return hours * 60 + minutes
        }
        val start = toMinutes(startTime) ?: return 0
        val end = toMinutes(endTime) ?: return 0
        val difference = end - start
        return if (difference >= 0) difference else difference + 24 * 60
    }

    private fun WatchProcessorState.error(operationId: String, code: String, message: String): WatchProcessorResult =
        WatchProcessorResult(
            state = this,
            response = WatchResponse.Error(operationId, code, message),
        )
}
