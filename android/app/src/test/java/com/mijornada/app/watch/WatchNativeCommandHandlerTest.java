package com.mijornada.app.watch;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;

import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class WatchNativeCommandHandlerTest {
    private WatchDatabase database;
    private WatchRepository repository;

    @Before
    public void setUp() {
        Context context = ApplicationProvider.getApplicationContext();
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
    public void handleCommandAplicaComandoYDevuelveAckOk() throws Exception {
        String responseJson = WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-native-start\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-native-start",
            "2026-06-01",
            "10:00",
            1000L
        );

        JSONObject response = new JSONObject(responseJson);
        assertEquals("OK", response.getString("type"));
        assertEquals("op-native-start", response.getString("operationId"));
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
    }

    @Test
    public void handleCommandNoDuplicaOperationIdYaAplicado() throws Exception {
        String commandJson = "{\"operationId\":\"op-native-duplicate\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}";

        WatchNativeCommandHandler.handleCommand(
            repository,
            commandJson,
            "op-native-duplicate",
            "2026-06-01",
            "10:00",
            1000L
        );
        String duplicateJson = WatchNativeCommandHandler.handleCommand(
            repository,
            commandJson,
            "op-native-duplicate",
            "2026-06-01",
            "10:01",
            1001L
        );

        JSONObject duplicate = new JSONObject(duplicateJson);
        assertEquals("DUPLICATE_IGNORED", duplicate.getString("type"));
        assertEquals(1, database.operationDao().getAppliedOperationIds().size());
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
    }

    @Test
    public void handleCommandRechazaOperationIdDistintoAlPath() throws Exception {
        String responseJson = WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-payload\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-path",
            "2026-06-01",
            "10:00",
            1000L
        );

        JSONObject response = new JSONObject(responseJson);
        assertEquals("ERROR", response.getString("type"));
        assertEquals("OPERATION_ID_MISMATCH", response.getString("code"));
        assertTrue(database.operationDao().getAppliedOperationIds().isEmpty());
    }

    @Test
    public void handleReadCommandDevuelveStatusDesdeRoom() throws Exception {
        WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-status-start\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-status-start",
            "2026-06-01",
            "10:00",
            1000L
        );
        WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-status-entry\",\"type\":\"ADD_ENTRY\",\"createdAt\":\"2026-06-01T10:05:00\",\"payload\":{\"entryType\":\"propina\",\"amount\":3.0,\"note\":\"ok\"}}",
            "op-status-entry",
            "2026-06-01",
            "10:05",
            1001L
        );

        String responseJson = WatchNativeCommandHandler.handleReadCommand(
            repository,
            "{\"operationId\":\"op-status-read\",\"type\":\"GET_STATUS\",\"createdAt\":\"2026-06-01T10:06:00\"}",
            "op-status-read",
            "2026-06-01",
            "10:06",
            1002L
        );

        JSONObject response = new JSONObject(responseJson);
        assertEquals("STATUS", response.getString("type"));
        assertTrue(response.getBoolean("activeTurno"));
        assertEquals("10:00", response.getString("startTime"));
        assertEquals(3.0, response.getJSONObject("totals").getJSONObject("porTipo").getDouble("propina"), 0.001);
        assertEquals(1, response.getJSONArray("entradas").length());
    }

    @Test
    public void handleReadCommandDevuelveTurnosDesdeRoom() throws Exception {
        WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-turnos-start\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-turnos-start",
            "2026-06-01",
            "10:00",
            1000L
        );
        WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-turnos-entry\",\"type\":\"ADD_ENTRY\",\"createdAt\":\"2026-06-01T10:05:00\",\"payload\":{\"entryType\":\"propina\",\"amount\":3.0,\"note\":\"ok\"}}",
            "op-turnos-entry",
            "2026-06-01",
            "10:05",
            1001L
        );
        WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-turnos-end\",\"type\":\"END_TURNO\",\"createdAt\":\"2026-06-01T12:00:00\",\"payload\":{\"dinero\":40.0,\"km\":30.0,\"note\":\"fin\"}}",
            "op-turnos-end",
            "2026-06-01",
            "12:00",
            1002L
        );

        String responseJson = WatchNativeCommandHandler.handleReadCommand(
            repository,
            "{\"operationId\":\"op-turnos-read\",\"type\":\"GET_TURNOS\",\"createdAt\":\"2026-06-01T12:01:00\"}",
            "op-turnos-read",
            "2026-06-01",
            "12:01",
            1003L
        );

        JSONObject response = new JSONObject(responseJson);
        assertEquals("TURNOS_STATUS", response.getString("type"));
        assertTrue(response.getBoolean("connected"));
        assertEquals(1, response.getJSONArray("turnos").length());
        JSONObject turno = response.getJSONArray("turnos").getJSONObject(0);
        assertEquals(40.0, turno.getDouble("dinero"), 0.001);
        assertEquals(30.0, turno.getDouble("km"), 0.001);
        assertEquals(3.0, turno.getJSONObject("totals").getJSONObject("porTipo").getDouble("propina"), 0.001);
        assertEquals(1, turno.getJSONArray("entradas").length());
    }

    @Test
    public void handleCommandRechazaSesionDeUsuarioDistinta() throws Exception {
        String responseJson = WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-session\",\"userSessionId\":\"session-antigua\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-session",
            "session-actual",
            "2026-06-01",
            "10:00",
            1000L
        );

        JSONObject response = new JSONObject(responseJson);
        assertEquals("ERROR", response.getString("type"));
        assertEquals("USER_SESSION_MISMATCH", response.getString("code"));
        assertTrue(database.operationDao().getAppliedOperationIds().isEmpty());
    }

    @Test
    public void handleCommandAceptaSesionDeUsuarioActual() throws Exception {
        String responseJson = WatchNativeCommandHandler.handleCommand(
            repository,
            "{\"operationId\":\"op-session-ok\",\"userSessionId\":\"session-actual\",\"type\":\"START_TURNO\",\"createdAt\":\"2026-06-01T10:00:00\"}",
            "op-session-ok",
            "session-actual",
            "2026-06-01",
            "10:00",
            1000L
        );

        JSONObject response = new JSONObject(responseJson);
        assertEquals("OK", response.getString("type"));
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
    }
}
