package com.mijornada.app.watch

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "watch_operations")
data class OperationEntity(
    @PrimaryKey val operationId: String,
    val type: String,
    val payloadJson: String,
    val createdAtClient: String,
    val createdAtPhone: String,
    val applied: Boolean,
)

@Entity(tableName = "watch_current_turno")
data class CurrentTurnoEntity(
    @PrimaryKey val id: Int,
    val startTime: String?,
    val startDate: String?,
    val entriesJson: String,
    val isPaused: Boolean = false,
    val pauseStartTime: String? = null,
    val totalPausedMinutes: Int = 0,
)

@Entity(tableName = "watch_turnos")
data class TurnoEntity(
    @PrimaryKey val id: Long,
    val date: String,
    val startDate: String?,
    val startTime: String?,
    val endTime: String,
    val entriesJson: String,
    val dinero: Double,
    val km: Double,
    val notes: String,
    val totalPausedMinutes: Int = 0,
)
