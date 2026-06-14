package com.mijornada.app.watch;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.content.Context;

import androidx.room.Room;
import androidx.test.core.app.ApplicationProvider;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.json.JSONObject;

@RunWith(RobolectricTestRunner.class)
public class WatchRoomPersistenceTest {
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
    public void applyCommandPersisteTurnoEntradaYEvitaDuplicados() {
        WatchCommand start = new WatchCommand.StartTurno(
            "op-start-room",
            "2026-06-01T10:00:00"
        );

        WatchProcessorResult startResult = repository.applyCommand(
            start,
            "{\"operationId\":\"op-start-room\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1000L
        );

        assertTrue(startResult.getResponse() instanceof WatchResponse.Ok);
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
        assertEquals(1, database.operationDao().getAppliedOperationIds().size());

        WatchProcessorResult duplicateStart = repository.applyCommand(
            start,
            "{\"operationId\":\"op-start-room\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:01",
            1001L
        );

        assertEquals(startResult.getResponse(), duplicateStart.getResponse());
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
        assertEquals(1, database.operationDao().getAppliedOperationIds().size());

        WatchCommand entry = new WatchCommand.AddEntry(
            "op-entry-room",
            "2026-06-01T10:02:00",
            "propina",
            2.5,
            "  cliente  "
        );

        WatchProcessorResult entryResult = repository.applyCommand(
            entry,
            "{\"operationId\":\"op-entry-room\",\"type\":\"ADD_ENTRY\"}",
            "2026-06-01",
            "10:02",
            1002L
        );

        assertTrue(entryResult.getResponse() instanceof WatchResponse.Ok);
        WatchProcessorState stateAfterEntry = repository.readState("2026-06-01", "10:03", 1003L);
        assertEquals(1, stateAfterEntry.getCurrent().getEntries().size());
        assertEquals("propina", stateAfterEntry.getCurrent().getEntries().get(0).getType());
        assertEquals(2.5, stateAfterEntry.getCurrent().getEntries().get(0).getAmount(), 0.001);
        assertEquals("cliente", stateAfterEntry.getCurrent().getEntries().get(0).getNote());

        WatchCommand end = new WatchCommand.EndTurno(
            "op-end-room",
            "2026-06-01T12:00:00",
            55.0,
            80.0,
            " cierre "
        );

        WatchProcessorResult endResult = repository.applyCommand(
            end,
            "{\"operationId\":\"op-end-room\",\"type\":\"END_TURNO\"}",
            "2026-06-01",
            "12:00",
            2000L
        );

        assertTrue(endResult.getResponse() instanceof WatchResponse.Ok);
        assertEquals(0, repository.readState("2026-06-01", "12:01", 2001L).getCurrent().getEntries().size());
        assertEquals(1, database.turnoDao().getAll().size());
        assertEquals(3, database.operationDao().getAppliedOperationIds().size());
    }

    @Test
    public void stateToJsonExponeEstadoParaCapacitor() throws Exception {
        repository.applyCommand(
            new WatchCommand.StartTurno("op-json-start", "2026-06-01T10:00:00"),
            "{\"operationId\":\"op-json-start\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1000L
        );
        repository.applyCommand(
            new WatchCommand.AddEntry("op-json-entry", "2026-06-01T10:05:00", "propina", 4.0, " nota "),
            "{\"operationId\":\"op-json-entry\",\"type\":\"ADD_ENTRY\"}",
            "2026-06-01",
            "10:05",
            1001L
        );

        String stateJson = WatchStateJson.stateToJson(repository.readState("2026-06-01", "10:06", 1002L));

        JSONObject state = new JSONObject(stateJson);
        assertEquals("10:00", state.getJSONObject("current").getString("startTime"));
        assertEquals(1, state.getJSONObject("current").getJSONArray("entries").length());
        assertEquals("op-json-start", state.getJSONArray("processedOperationIds").getString(0));
        assertEquals("op-json-entry", state.getJSONArray("processedOperationIds").getString(1));
    }

    @Test
    public void replaceAppStateRechazaSnapshotAnteriorAOperacionesAplicadas() {
        repository.applyCommand(
            new WatchCommand.StartTurno("op-watch-nueva", "2026-06-01T10:00:00"),
            "{\"operationId\":\"op-watch-nueva\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1000L
        );

        boolean rejected = false;
        try {
            repository.replaceAppState(new WatchAppSnapshot(
                WatchCurrentState.empty(),
                java.util.Collections.emptyList(),
                java.util.Collections.emptyList()
            ));
        } catch (StaleWatchSnapshotException expected) {
            rejected = true;
        }

        assertTrue(rejected);
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
    }

    @Test
    public void replaceAppStateAceptaSnapshotQueConoceOperacionesAplicadas() {
        repository.applyCommand(
            new WatchCommand.StartTurno("op-watch-conocida", "2026-06-01T10:00:00"),
            "{\"operationId\":\"op-watch-conocida\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1000L
        );

        repository.replaceAppState(new WatchAppSnapshot(
            WatchCurrentState.empty(),
            java.util.Collections.emptyList(),
            java.util.Collections.singletonList("op-watch-conocida")
        ));

        assertTrue(repository.readState("2026-06-01", "10:01", 1001L).getCurrent().getStartTime() == null);
    }

    @Test
    public void replaceAppStateRechazaEntradasSinHoraInicioSinSobrescribirRoom() {
        repository.replaceAppState(new WatchAppSnapshot(
            new WatchCurrentState("10:00", "2026-06-01", java.util.Collections.emptyList(), false, null, 0),
            java.util.Collections.emptyList(),
            java.util.Collections.emptyList()
        ));

        boolean rejected = false;
        try {
            repository.replaceAppState(new WatchAppSnapshot(
                new WatchCurrentState(
                    null,
                    null,
                    java.util.Collections.singletonList(new WatchEntry(1L, "propina", 1.0, "", "10:05")),
                    false,
                    null,
                    0
                ),
                java.util.Collections.emptyList(),
                java.util.Collections.emptyList()
            ));
        } catch (InvalidWatchSnapshotException expected) {
            rejected = true;
        }

        assertTrue(rejected);
        assertEquals("10:00", database.currentTurnoDao().getCurrent().getStartTime());
    }

    @Test
    public void limitaOperacionesAplicadasSinBloquearSnapshotsRecientes() {
        repository.applyCommand(
            new WatchCommand.StartTurno("op-limit-start", "2026-06-01T10:00:00"),
            "{\"operationId\":\"op-limit-start\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1999L
        );
        for (int index = 0; index < 519; index++) {
            String operationId = "op-limit-" + index;
            repository.applyCommand(
                new WatchCommand.AddNote(operationId, "2026-06-01T10:00:00", "nota"),
                "{\"operationId\":\"" + operationId + "\",\"type\":\"ADD_NOTE\"}",
                "2026-06-01",
                "10:00",
                2000L + index
            );
        }

        WatchProcessorState state = repository.readState("2026-06-01", "10:01", 3000L);

        assertEquals(512, state.getProcessedOperationIds().size());
        assertEquals(520, database.operationDao().getAppliedOperationIds().size());
        repository.replaceAppState(new WatchAppSnapshot(
            WatchCurrentState.empty(),
            java.util.Collections.emptyList(),
            state.getProcessedOperationIds()
        ));
    }

    @Test
    public void rechazoSeConservaYDuplicadoDevuelveElMismoErrorSinModificarEstado() {
        WatchCommand command = new WatchCommand.AddEntry(
            "op-rechazada",
            "2026-06-01T10:02:00",
            "propina",
            2.5,
            "cliente"
        );

        WatchProcessorResult first = repository.applyCommand(
            command,
            "{\"operationId\":\"op-rechazada\",\"type\":\"ADD_ENTRY\"}",
            "2026-06-01",
            "10:02",
            1002L
        );
        WatchProcessorResult duplicate = repository.applyCommand(
            command,
            "{\"operationId\":\"op-rechazada\",\"type\":\"ADD_ENTRY\"}",
            "2026-06-01",
            "10:03",
            1003L
        );

        assertTrue(first.getResponse() instanceof WatchResponse.Error);
        assertEquals(first.getResponse(), duplicate.getResponse());
        assertFalse(database.operationDao().exists("op-rechazada"));
        assertEquals("REJECTED", database.operationDao().getById("op-rechazada").getResultType());
        assertTrue(repository.readState("2026-06-01", "10:04", 1004L).getCurrent().getEntries().isEmpty());
    }

    @Test
    public void podaSoloResultadosFinalizadosAnterioresAlPeriodoDeRetencion() {
        repository.applyCommand(
            new WatchCommand.StartTurno("op-antigua", "2026-06-01T10:00:00"),
            "{\"operationId\":\"op-antigua\",\"type\":\"START_TURNO\"}",
            "2026-06-01",
            "10:00",
            1000L
        );
        repository.applyCommand(
            new WatchCommand.AddNote("op-reciente", "2026-06-01T10:01:00", "nota"),
            "{\"operationId\":\"op-reciente\",\"type\":\"ADD_NOTE\"}",
            "2026-06-01",
            "10:01",
            2000L
        );

        database.operationDao().pruneFinalizedBefore(1500L);

        assertTrue(database.operationDao().getById("op-antigua") == null);
        assertTrue(database.operationDao().getById("op-reciente") != null);
    }
}
