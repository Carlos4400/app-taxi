package com.mijornada.app.watch

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [
        OperationEntity::class,
        CurrentTurnoEntity::class,
        TurnoEntity::class,
    ],
    version = 4,
    exportSchema = false,
)
abstract class WatchDatabase : RoomDatabase() {
    abstract fun operationDao(): OperationDao
    abstract fun currentTurnoDao(): CurrentTurnoDao
    abstract fun turnoDao(): TurnoDao

    companion object {
        @JvmField
        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `watch_operations_new` (
                        `operationId` TEXT NOT NULL,
                        `type` TEXT NOT NULL,
                        `payloadJson` TEXT NOT NULL,
                        `createdAtClient` TEXT NOT NULL,
                        `createdAtPhone` TEXT NOT NULL,
                        `applied` INTEGER NOT NULL,
                        PRIMARY KEY(`operationId`)
                    )
                    """.trimIndent(),
                )
                db.execSQL(
                    """
                    INSERT INTO `watch_operations_new`
                        (`operationId`, `type`, `payloadJson`, `createdAtClient`, `createdAtPhone`, `applied`)
                    SELECT `operationId`, `type`, `payloadJson`, `createdAtClient`, `createdAtPhone`, `applied`
                    FROM `watch_operations`
                    """.trimIndent(),
                )
                db.execSQL("DROP TABLE `watch_operations`")
                db.execSQL("ALTER TABLE `watch_operations_new` RENAME TO `watch_operations`")
            }
        }

        @JvmField
        val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    ALTER TABLE `watch_current_turno`
                    ADD COLUMN `isPaused` INTEGER NOT NULL DEFAULT 0
                    """.trimIndent(),
                )
                db.execSQL(
                    """
                    ALTER TABLE `watch_current_turno`
                    ADD COLUMN `pauseStartTime` TEXT DEFAULT NULL
                    """.trimIndent(),
                )
                db.execSQL(
                    """
                    ALTER TABLE `watch_current_turno`
                    ADD COLUMN `totalPausedMinutes` INTEGER NOT NULL DEFAULT 0
                    """.trimIndent(),
                )
            }
        }

        @JvmField
        val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL(
                    """
                    ALTER TABLE `watch_turnos`
                    ADD COLUMN `totalPausedMinutes` INTEGER NOT NULL DEFAULT 0
                    """.trimIndent(),
                )
            }
        }
    }
}
