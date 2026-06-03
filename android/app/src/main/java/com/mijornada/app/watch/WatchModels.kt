package com.mijornada.app.watch

data class WatchEntry(
    val id: Long,
    val type: String,
    val amount: Double,
    val note: String,
    val time: String,
)

data class WatchCurrentState(
    val startTime: String?,
    val startDate: String?,
    val entries: List<WatchEntry>,
    val isPaused: Boolean = false,
    val pauseStartTime: String? = null,
    val totalPausedMinutes: Int = 0,
) {
    fun isActive(): Boolean = startTime != null

    companion object {
        @JvmStatic
        fun empty(): WatchCurrentState = WatchCurrentState(null, null, emptyList())
    }
}

data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String?,
    val startTime: String?,
    val endTime: String,
    val entries: List<WatchEntry>,
    val dinero: Double,
    val km: Double,
    val notes: String,
    val totalPausedMinutes: Int = 0,
)

data class WatchProcessorState(
    val current: WatchCurrentState,
    val history: List<WatchTurno>,
    val processedOperationIds: List<String>,
    val nowDate: String,
    val nowTime: String,
    val nowId: Long,
) {
    fun withCurrent(nextCurrent: WatchCurrentState): WatchProcessorState = copy(current = nextCurrent)

    fun withProcessedOperationIds(nextProcessedOperationIds: List<String>): WatchProcessorState =
        copy(processedOperationIds = nextProcessedOperationIds)

    companion object {
        @JvmStatic
        fun empty(nowDate: String, nowTime: String, nowId: Long): WatchProcessorState =
            WatchProcessorState(
                current = WatchCurrentState.empty(),
                history = emptyList(),
                processedOperationIds = emptyList(),
                nowDate = nowDate,
                nowTime = nowTime,
                nowId = nowId,
            )
    }
}

data class WatchProcessorResult(
    val state: WatchProcessorState,
    val response: WatchResponse,
)

data class WatchAppSnapshot(
    val current: WatchCurrentState,
    val history: List<WatchTurno>,
    val processedOperationIds: List<String>,
)

class StaleWatchSnapshotException : IllegalStateException("Snapshot movil anterior al estado nativo")
class InvalidWatchSnapshotException : IllegalStateException("Snapshot movil con entradas sin hora de inicio")

sealed class WatchResponse {
    data class Ok(val operationId: String, val message: String) : WatchResponse()
    data class Error(val operationId: String, val code: String, val message: String) : WatchResponse()
    data class DuplicateIgnored(val operationId: String, val message: String) : WatchResponse()
}

sealed class WatchCommand {
    abstract val operationId: String
    abstract val createdAt: String

    data class StartTurno(
        override val operationId: String,
        override val createdAt: String,
    ) : WatchCommand()

    data class PauseTurno(
        override val operationId: String,
        override val createdAt: String,
    ) : WatchCommand()

    data class ResumeTurno(
        override val operationId: String,
        override val createdAt: String,
    ) : WatchCommand()

    data class AddEntry(
        override val operationId: String,
        override val createdAt: String,
        val entryType: String,
        val amount: Double,
        val note: String,
    ) : WatchCommand()

    data class AddNote(
        override val operationId: String,
        override val createdAt: String,
        val note: String,
    ) : WatchCommand()

    data class EditEntry(
        override val operationId: String,
        override val createdAt: String,
        val id: Long,
        val amount: Double,
        val note: String,
    ) : WatchCommand()

    data class DeleteEntry(
        override val operationId: String,
        override val createdAt: String,
        val id: Long,
    ) : WatchCommand()

    data class EndTurno(
        override val operationId: String,
        override val createdAt: String,
        val dinero: Double,
        val km: Double,
        val note: String,
    ) : WatchCommand()
}
