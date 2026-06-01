import { describe, expect, it } from "vitest";
import { processWatchCommand } from "../logic/watch-command-processor";
import type { WatchCommandProcessorState } from "../logic/watch-command-processor";
import type { WatchCommand } from "../shared/watch-commands";

function baseState(overrides: Partial<WatchCommandProcessorState> = {}): WatchCommandProcessorState {
  return {
    current: {
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    },
    history: [],
    processedOperationIds: [],
    settings: {
      "porcentaje.jefe": 50,
      "porcentaje.chofer": 50,
      "descontar.datafono": true,
      "descontar.agencia_bono": true,
      "descontar.extra": false,
      "descontar.gasolina": true,
      diaLibre: 0,
    },
    now: {
      date: "2026-06-01",
      time: "10:35",
      id: 1000,
    },
    ...overrides,
  };
}

describe("processWatchCommand", () => {
  it("inicia turno solo una vez con operationId unico", () => {
    const command: WatchCommand = {
      operationId: "op-start-1",
      type: "START_TURNO",
      createdAt: "2026-06-01T10:35:00",
    };

    const result = processWatchCommand(command, baseState());

    expect(result.response).toEqual({
      type: "OK",
      operationId: "op-start-1",
      message: "Turno iniciado",
    });
    expect(result.current.startTime).toBe("10:35");
    expect(result.current.startDate).toBe("2026-06-01");
    expect(result.processedOperationIds).toEqual(["op-start-1"]);
  });

  it("ignora comandos duplicados sin modificar el turno", () => {
    const command: WatchCommand = {
      operationId: "op-entry-1",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:36:00",
      payload: {
        entryType: "propina",
        amount: 1,
        note: "",
      },
    };

    const result = processWatchCommand(command, baseState({
      current: {
        entries: [],
        startTime: "10:35",
        startDate: "2026-06-01",
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
      processedOperationIds: ["op-entry-1"],
    }));

    expect(result.response).toEqual({
      type: "DUPLICATE_IGNORED",
      operationId: "op-entry-1",
      message: "Operacion ya procesada",
    });
    expect(result.current.entries).toEqual([]);
    expect(result.processedOperationIds).toEqual(["op-entry-1"]);
  });

  it("rechaza anadir entrada si no hay turno activo", () => {
    const result = processWatchCommand({
      operationId: "op-entry-2",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:36:00",
      payload: {
        entryType: "datafono",
        amount: 12.5,
        note: "tarjeta",
      },
    }, baseState());

    expect(result.response.type).toBe("ERROR");
    if (result.response.type !== "ERROR") throw new Error("Se esperaba ERROR");
    expect(result.response.operationId).toBe("op-entry-2");
    expect(result.response.code).toBe("NO_ACTIVE_TURNO");
    expect(result.current.entries).toEqual([]);
    expect(result.processedOperationIds).toEqual([]);
  });

  it("anade entrada y nota general al turno activo", () => {
    const started = baseState({
      current: {
        entries: [],
        startTime: "10:35",
        startDate: "2026-06-01",
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
    });

    const withEntry = processWatchCommand({
      operationId: "op-entry-3",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:37:00",
      payload: {
        entryType: "extra",
        amount: 5,
        note: "maleta",
      },
    }, started);

    const withNote = processWatchCommand({
      operationId: "op-note-1",
      type: "ADD_NOTE",
      createdAt: "2026-06-01T10:38:00",
      payload: {
        note: "Esperar en puerta",
      },
    }, {
      ...started,
      current: withEntry.current,
      processedOperationIds: withEntry.processedOperationIds,
      now: { date: "2026-06-01", time: "10:38", id: 1001 },
    });

    expect(withNote.current.entries).toEqual([
      { id: 1000, type: "extra", amount: 5, note: "maleta", time: "10:35" },
      { id: 1001, type: "nota", amount: 0, note: "Esperar en puerta", time: "10:38" },
    ]);
    expect(withNote.processedOperationIds).toEqual(["op-entry-3", "op-note-1"]);
  });

  it("termina turno activo y lo mueve al historial", () => {
    const result = processWatchCommand({
      operationId: "op-end-1",
      type: "END_TURNO",
      createdAt: "2026-06-01T12:00:00",
      payload: {
        dinero: 123.45,
        km: 210,
        note: "cierre desde reloj",
      },
    }, baseState({
      current: {
        entries: [
          { id: 10, type: "propina", amount: 2, note: "", time: "10:40" },
          { id: 11, type: "datafono", amount: 20, note: "", time: "10:45" },
        ],
        startTime: "10:35",
        startDate: "2026-06-01",
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
      now: { date: "2026-06-01", time: "12:00", id: 2000 },
    }));

    expect(result.response).toEqual({
      type: "OK",
      operationId: "op-end-1",
      message: "Turno terminado",
    });
    expect(result.history).toHaveLength(1);
    expect(result.history[0]).toMatchObject({
      id: 2000,
      startTime: "10:35",
      endTime: "12:00",
      totalP: 2,
      totalD: 20,
      dinero: 123.45,
      km: 210,
      notes: "cierre desde reloj",
    });
    expect(result.current).toEqual({
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    });
  });
});
