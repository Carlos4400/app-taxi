package com.mijornada.app.watch

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface OperationDao {
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    fun insert(operation: OperationEntity): Long

    @Query("UPDATE watch_operations SET applied = 1 WHERE operationId = :operationId")
    fun markApplied(operationId: String)

    @Query("SELECT operationId FROM watch_operations WHERE applied = 1 ORDER BY createdAtPhone ASC")
    fun getAppliedOperationIds(): List<String>

    @Query("SELECT operationId FROM watch_operations WHERE applied = 1 ORDER BY rowid DESC LIMIT :limit")
    fun getRecentAppliedOperationIds(limit: Int): List<String>

    @Query(
        "DELETE FROM watch_operations WHERE applied = 1 AND rowid NOT IN " +
            "(SELECT rowid FROM watch_operations WHERE applied = 1 ORDER BY rowid DESC LIMIT :limit)",
    )
    fun pruneAppliedOperations(limit: Int)

    @Query("SELECT EXISTS(SELECT 1 FROM watch_operations WHERE operationId = :id AND applied = 1)")
    fun exists(id: String): Boolean
}

@Dao
interface CurrentTurnoDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun replace(currentTurno: CurrentTurnoEntity)

    @Query("SELECT * FROM watch_current_turno WHERE id = 0 LIMIT 1")
    fun getCurrent(): CurrentTurnoEntity?

    @Query("DELETE FROM watch_current_turno")
    fun clear()
}

@Dao
interface TurnoDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertAll(turnos: List<TurnoEntity>)

    @Query("SELECT * FROM watch_turnos ORDER BY id ASC")
    fun getAll(): List<TurnoEntity>

    @Query("DELETE FROM watch_turnos")
    fun clear()
}
