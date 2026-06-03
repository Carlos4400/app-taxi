package com.mijornada.app.watch;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class WatchMultiUserTest {
    private Context context;
    private WatchDatabase database;
    private WatchRepository repository;

    @Before
    public void setUp() {
        context = ApplicationProvider.getApplicationContext();
        database = Room.inMemoryDatabaseBuilder(context, WatchDatabase.class)
            .allowMainThreadQueries()
            .build();
        repository = new WatchRepository(database);
    }

    @After
    public void tearDown() {
        database.close();
    }

    @Test
    public void prepareUidGeneraSessionIdNuevoSiUidCambia() {
        String session1 = WatchUserSession.prepare(context, "user-a");
        String session2 = WatchUserSession.prepare(context, "user-b");

        assertNotEquals(session1, session2);
        assertEquals("user-b", WatchUserSession.getUid(context));
    }

    @Test
    public void prepareUidReusaSessionIdSiMismoUid() {
        String session1 = WatchUserSession.prepare(context, "user-a");
        String session2 = WatchUserSession.prepare(context, "user-a");

        assertEquals(session1, session2);
    }

    @Test
    public void clearIfMatchesSoloLimpiaSiUidCoincide() {
        WatchUserSession.prepare(context, "user-a");
        boolean cleared = WatchUserSession.clearIfMatches(context, "user-b");

        assertFalse(cleared);
        assertEquals("user-a", WatchUserSession.getUid(context));
    }

    @Test
    public void clearIfMatchesLimpiaSiUidCoincide() {
        WatchUserSession.prepare(context, "user-a");
        boolean cleared = WatchUserSession.clearIfMatches(context, "user-a");

        assertTrue(cleared);
        assertEquals("", WatchUserSession.getUid(context));
    }

    @Test
    public void operationExistsDevuelveTrueParaOperacionAplicada() {
        String responseJson = WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-exists-test\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-exists-test",
            "2026-06-01",
            "10:00",
            1000L
        );

        assertTrue(database.operationDao().exists("op-exists-test"));
    }

    @Test
    public void operationExistsDevuelveFalseParaOperacionNoAplicada() {
        assertFalse(database.operationDao().exists("op-nonexistent"));
    }

    @Test
    public void duplicateOperationIdEsRechazadoPorBaseDeDatos() throws Exception {
        String commandJson = "{\"operationId\":\"op-dup-db\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}";

        String response1 = WatchNativeCommandHandler.handleCommand(
            repository,
            commandJson,
            "op-dup-db",
            "2026-06-01",
            "10:00",
            1000L
        );

        String response2 = WatchNativeCommandHandler.handleCommand(
            repository,
            commandJson,
            "op-dup-db",
            "2026-06-01",
            "10:01",
            1001L
        );

        org.json.JSONObject json1 = new org.json.JSONObject(response1);
        org.json.JSONObject json2 = new org.json.JSONObject(response2);

        assertEquals("OK", json1.getString("type"));
        assertEquals("DUPLICATE_IGNORED", json2.getString("type"));
    }

    @Test
    public void staleSnapshotExceptionEsLanzadaCuandoMobileEstaDesactualizado() {
        WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-snapshot-start\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-snapshot-start",
            "2026-06-01",
            "10:00",
            1000L
        );

        WatchAppSnapshot snapshot = new WatchAppSnapshot(
            com.mijornada.app.watch.WatchCurrentState.empty(),
            java.util.Collections.emptyList(),
            java.util.Collections.emptyList()
        );

        try {
            repository.replaceAppState(snapshot);
        } catch (StaleWatchSnapshotException e) {
            assertTrue(true);
            return;
        }
        org.junit.Assert.fail("Expected StaleWatchSnapshotException");
    }
}