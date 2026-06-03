package com.mijornada.app.watch;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class WatchCommandProcessorTest {

    private static final kotlin.jvm.functions.Function1<String, Boolean> ALWAYS_FALSE_EXISTS = id -> false;

    private WatchProcessorState baseState() {
        return WatchProcessorState.empty("2026-06-01", "10:35", 1000L);
    }

    @Test
    public void startTurnoGuardaHoraYOperationId() throws Exception {
        WatchCommand command = new WatchCommand.StartTurno(
            "op-start-1",
            "2026-06-01T10:35:00"
        );

        WatchProcessorResult result = WatchCommandProcessor.process(command, baseState(), ALWAYS_FALSE_EXISTS);

        assertTrue(result.getResponse() instanceof WatchResponse.Ok);
        assertEquals("Turno iniciado", ((WatchResponse.Ok) result.getResponse()).getMessage());
        assertEquals("10:35", result.getState().getCurrent().getStartTime());
        assertEquals("2026-06-01", result.getState().getCurrent().getStartDate());
        assertEquals(1, result.getState().getProcessedOperationIds().size());
        assertEquals("op-start-1", result.getState().getProcessedOperationIds().get(0));
    }

    @Test
    public void entradasSinHoraInicioNoRepresentanUnTurnoActivo() {
        WatchCurrentState malformed = new WatchCurrentState(
            null,
            null,
            java.util.Collections.singletonList(new WatchEntry(1L, "propina", 1.0, "", "10:35")),
            false,
            null,
            0
        );

        assertTrue(!malformed.isActive());
    }

    @Test
    public void addEntryEnTurnoActivoGuardaImporteNotaYOperationId() throws Exception {
        WatchProcessorState started = baseState().withCurrent(
            new WatchCurrentState("10:35", "2026-06-01", java.util.Collections.emptyList(), false, null, 0)
        );
        WatchCommand command = new WatchCommand.AddEntry(
            "op-entry-1",
            "2026-06-01T10:36:00",
            "propina",
            1.5,
            "  gracias  "
        );

        WatchProcessorResult result = WatchCommandProcessor.process(command, started, ALWAYS_FALSE_EXISTS);

        assertTrue(result.getResponse() instanceof WatchResponse.Ok);
        assertEquals("Entrada anadida", ((WatchResponse.Ok) result.getResponse()).getMessage());
        assertEquals(1, result.getState().getCurrent().getEntries().size());
        WatchEntry entry = result.getState().getCurrent().getEntries().get(0);
        assertEquals(1000L, entry.getId());
        assertEquals("propina", entry.getType());
        assertEquals(1.5, entry.getAmount(), 0.001);
        assertEquals("gracias", entry.getNote());
        assertEquals("10:35", entry.getTime());
        assertEquals("op-entry-1", result.getState().getProcessedOperationIds().get(0));
    }

    @Test
    public void operationIdDuplicadoNoModificaEstado() throws Exception {
        final String duplicateId = "op-entry-1";
        WatchProcessorState state = baseState().withProcessedOperationIds(java.util.Arrays.asList(duplicateId));
        WatchCommand command = new WatchCommand.AddEntry(
            duplicateId,
            "2026-06-01T10:36:00",
            "propina",
            1.0,
            ""
        );

        WatchProcessorResult result = WatchCommandProcessor.process(
            command,
            state,
            id -> id.equals(duplicateId)
        );

        assertTrue(result.getResponse() instanceof WatchResponse.DuplicateIgnored);
        assertEquals(0, result.getState().getCurrent().getEntries().size());
        assertEquals(1, result.getState().getProcessedOperationIds().size());
    }

    @Test
    public void pauseYResumeTurnoPersistenLaPausaAcumulada() throws Exception {
        WatchProcessorState started = baseState().withCurrent(
            new WatchCurrentState("10:00", "2026-06-01", java.util.Collections.emptyList(), false, null, 0)
        );

        WatchProcessorResult paused = WatchCommandProcessor.process(
            new WatchCommand.PauseTurno("op-pause", "2026-06-01T10:35:00"),
            started,
            ALWAYS_FALSE_EXISTS
        );
        WatchProcessorState pausedAtTenThirtyFive = new WatchProcessorState(
            paused.getState().getCurrent(),
            paused.getState().getHistory(),
            paused.getState().getProcessedOperationIds(),
            "2026-06-01",
            "10:50",
            1001L
        );
        WatchProcessorResult resumed = WatchCommandProcessor.process(
            new WatchCommand.ResumeTurno("op-resume", "2026-06-01T10:50:00"),
            pausedAtTenThirtyFive,
            ALWAYS_FALSE_EXISTS
        );

        assertTrue(paused.getState().getCurrent().isPaused());
        assertEquals("10:35", paused.getState().getCurrent().getPauseStartTime());
        assertTrue(!resumed.getState().getCurrent().isPaused());
        assertEquals(null, resumed.getState().getCurrent().getPauseStartTime());
        assertEquals(15, resumed.getState().getCurrent().getTotalPausedMinutes());
    }

    @Test
    public void endTurnoMientrasEstaPausadoConservaTodaLaPausa() throws Exception {
        WatchProcessorState paused = new WatchProcessorState(
            new WatchCurrentState("10:00", "2026-06-01", java.util.Collections.emptyList(), true, "10:35", 10),
            java.util.Collections.emptyList(),
            java.util.Collections.emptyList(),
            "2026-06-01",
            "10:50",
            1000L
        );
        WatchProcessorResult ended = WatchCommandProcessor.process(
            new WatchCommand.EndTurno("op-end-paused", "2026-06-01T10:50:00", 20.0, 10.0, ""),
            paused,
            ALWAYS_FALSE_EXISTS
        );

        assertEquals(25, ended.getState().getHistory().get(0).getTotalPausedMinutes());
    }

    @Test
    public void endTurnoMueveTurnoAlHistorialSinCalcularContabilidad() throws Exception {
        java.util.List<WatchEntry> entries = java.util.Arrays.asList(
            new WatchEntry(10L, "propina", 2.0, "", "10:40"),
            new WatchEntry(11L, "datafono", 20.0, "tarjeta", "10:45")
        );
        WatchProcessorState state = baseState().withCurrent(
            new WatchCurrentState("10:35", "2026-06-01", entries, false, null, 0)
        );
        WatchCommand command = new WatchCommand.EndTurno(
            "op-end-1",
            "2026-06-01T12:00:00",
            123.45,
            210.0,
            " cierre "
        );

        WatchProcessorResult result = WatchCommandProcessor.process(command, state, ALWAYS_FALSE_EXISTS);

        assertTrue(result.getResponse() instanceof WatchResponse.Ok);
        assertEquals(0, result.getState().getCurrent().getEntries().size());
        assertEquals(1, result.getState().getHistory().size());
        WatchTurno turno = result.getState().getHistory().get(0);
        assertEquals(1000L, turno.getId());
        assertEquals("2026-06-01", turno.getDate());
        assertEquals("10:35", turno.getStartTime());
        assertEquals("10:35", turno.getEndTime());
        assertEquals(123.45, turno.getDinero(), 0.001);
        assertEquals(210.0, turno.getKm(), 0.001);
        assertEquals("cierre", turno.getNotes());
        assertEquals(2, turno.getEntries().size());
        assertEquals("op-end-1", result.getState().getProcessedOperationIds().get(0));
    }
}
