package com.mijornada.app.watch;

import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.database.Cursor;
import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class WatchDatabaseProviderTest {
    @Test
    public void usuariosDistintosRecibenBasesRoomDistintas() {
        Context context = ApplicationProvider.getApplicationContext();

        WatchDatabase userA = WatchDatabaseProvider.getForUid(context, "uid-a");
        WatchDatabase userB = WatchDatabaseProvider.getForUid(context, "uid-b");

        assertNotSame(userA, userB);
    }

    @Test
    public void sesionNativaSeConservaPorUidYSeInvalidaAlCambiarUsuario() {
        Context context = ApplicationProvider.getApplicationContext();
        WatchUserSession.clear(context);

        String firstSession = WatchUserSession.prepare(context, "uid-a");
        assertEquals(firstSession, WatchUserSession.prepare(context, "uid-a"));

        String secondSession = WatchUserSession.prepare(context, "uid-b");
        assertNotEquals(firstSession, secondSession);
        assertFalse(WatchUserSession.clearIfMatches(context, "uid-a"));
        assertEquals("uid-b", WatchUserSession.getUid(context));
        assertTrue(WatchUserSession.clearIfMatches(context, "uid-b"));
        assertEquals("", WatchUserSession.getUid(context));
        assertEquals("", WatchUserSession.getSessionId(context));
    }

    @Test
    public void migraBaseLegacySinBorrarlaNiPerderTurnoActual() {
        Context context = ApplicationProvider.getApplicationContext();
        WatchDatabaseProvider.clear();
        context.deleteDatabase("mi-turno-watch.db");
        WatchDatabase legacy = Room.databaseBuilder(context, WatchDatabase.class, "mi-turno-watch.db")
            .allowMainThreadQueries()
            .build();
        legacy.currentTurnoDao().replace(new CurrentTurnoEntity(
            0,
            "10:00",
            "2026-06-14",
            "[]",
            false,
            null,
            0
        ));
        legacy.close();

        WatchDatabase migrated = WatchDatabaseProvider.getForUid(
            context,
            "legacy-test-" + java.util.UUID.randomUUID()
        );

        assertTrue(context.getDatabasePath("mi-turno-watch.db").exists());
        try (Cursor turno = migrated.getOpenHelper().getReadableDatabase()
            .query("SELECT startTime FROM watch_current_turno WHERE id = 0")) {
            turno.moveToFirst();
            assertEquals("10:00", turno.getString(0));
        }
    }
}
