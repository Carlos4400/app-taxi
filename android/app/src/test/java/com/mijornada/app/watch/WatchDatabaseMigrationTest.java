package com.mijornada.app.watch;

import static org.junit.Assert.assertEquals;

import android.content.Context;
import android.database.Cursor;

import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory;
import androidx.test.core.app.ApplicationProvider;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class WatchDatabaseMigrationTest {
    private static final String DATABASE_NAME = "watch-migration-test.db";
    private Context context;
    private SupportSQLiteOpenHelper helper;

    @Before
    public void setUp() {
        context = ApplicationProvider.getApplicationContext();
        context.deleteDatabase(DATABASE_NAME);
        SupportSQLiteOpenHelper.Configuration configuration = SupportSQLiteOpenHelper.Configuration.builder(context)
            .name(DATABASE_NAME)
            .callback(new SupportSQLiteOpenHelper.Callback(1) {
                @Override
                public void onCreate(SupportSQLiteDatabase db) {
                    db.execSQL(
                        "CREATE TABLE watch_operations (" +
                            "operationId TEXT NOT NULL PRIMARY KEY, " +
                            "type TEXT NOT NULL, " +
                            "payloadJson TEXT NOT NULL, " +
                            "createdAtClient TEXT NOT NULL, " +
                            "createdAtPhone TEXT NOT NULL, " +
                            "applied INTEGER NOT NULL, " +
                            "synced INTEGER NOT NULL)"
                    );
                    db.execSQL(
                        "INSERT INTO watch_operations VALUES " +
                            "('op-existente', 'START_TURNO', '{}', 'cliente', 'movil', 1, 0)"
                    );
                }

                @Override
                public void onUpgrade(SupportSQLiteDatabase db, int oldVersion, int newVersion) {
                }
            })
            .build();
        helper = new FrameworkSQLiteOpenHelperFactory().create(configuration);
    }

    @After
    public void tearDown() {
        helper.close();
        context.deleteDatabase(DATABASE_NAME);
    }

    @Test
    public void migracionEliminaSyncedYConservaOperationId() {
        SupportSQLiteDatabase database = helper.getWritableDatabase();

        WatchDatabase.MIGRATION_1_2.migrate(database);

        try (Cursor operation = database.query("SELECT operationId, applied FROM watch_operations")) {
            operation.moveToFirst();
            assertEquals("op-existente", operation.getString(0));
            assertEquals(1, operation.getInt(1));
        }
        try (Cursor columns = database.query("PRAGMA table_info(watch_operations)")) {
            int nameIndex = columns.getColumnIndexOrThrow("name");
            int syncedColumns = 0;
            while (columns.moveToNext()) {
                if ("synced".equals(columns.getString(nameIndex))) syncedColumns++;
            }
            assertEquals(0, syncedColumns);
        }
    }

    @Test
    public void migracionTresACuatroConservaTurnosYAñadePausa() {
        SupportSQLiteDatabase database = helper.getWritableDatabase();
        database.execSQL(
            "CREATE TABLE watch_turnos (" +
                "id INTEGER NOT NULL PRIMARY KEY, date TEXT NOT NULL, startDate TEXT, startTime TEXT, " +
                "endTime TEXT NOT NULL, entriesJson TEXT NOT NULL, dinero REAL NOT NULL, km REAL NOT NULL, notes TEXT NOT NULL)"
        );
        database.execSQL(
            "INSERT INTO watch_turnos VALUES (1, '2026-06-01', '2026-06-01', '10:00', '12:00', '[]', 20.0, 10.0, '')"
        );

        WatchDatabase.MIGRATION_3_4.migrate(database);

        try (Cursor turno = database.query("SELECT id, totalPausedMinutes FROM watch_turnos")) {
            turno.moveToFirst();
            assertEquals(1L, turno.getLong(0));
            assertEquals(0, turno.getInt(1));
        }
    }
    @Test
    public void migracionCincoASeisConservaOperacionYAñadeResultadoPersistente() {
        SupportSQLiteDatabase database = helper.getWritableDatabase();
        database.execSQL(
            "CREATE TABLE watch_operations_v5 (" +
                "operationId TEXT NOT NULL PRIMARY KEY, type TEXT NOT NULL, payloadJson TEXT NOT NULL, " +
                "createdAtClient TEXT NOT NULL, createdAtPhone TEXT NOT NULL, applied INTEGER NOT NULL)"
        );
        database.execSQL(
            "INSERT INTO watch_operations_v5 VALUES " +
                "('op-v5', 'START_TURNO', '{}', 'cliente', 'movil', 1)"
        );
        database.execSQL("DROP TABLE watch_operations");
        database.execSQL("ALTER TABLE watch_operations_v5 RENAME TO watch_operations");

        WatchDatabase.MIGRATION_5_6.migrate(database);

        try (Cursor operation = database.query(
            "SELECT operationId, resultType, responseJson, processedAtEpochMs FROM watch_operations"
        )) {
            operation.moveToFirst();
            assertEquals("op-v5", operation.getString(0));
            assertEquals("APPLIED", operation.getString(1));
            assertEquals("", operation.getString(2));
            org.junit.Assert.assertTrue(operation.getLong(3) > 0L);
        }
    }
}
