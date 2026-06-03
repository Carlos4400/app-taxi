import { beforeEach, describe, expect, it, vi } from "vitest";

type MockPendingWatchCommand = {
  operationId?: string;
  nodeId?: string;
  command?: string;
};

const capacitorMock = vi.hoisted(() => ({
  isNative: true,
  setPrepared: vi.fn(() => Promise.resolve()),
  drainQueue: vi.fn((): Promise<{ commands: MockPendingWatchCommand[] }> => Promise.resolve({ commands: [] })),
  confirmProcessed: vi.fn(() => Promise.resolve()),
  startTurnoForegroundService: vi.fn(() => Promise.resolve()),
  stopTurnoForegroundService: vi.fn(() => Promise.resolve()),
  sendResponse: vi.fn(() => Promise.resolve()),
  addListener: vi.fn((_eventName: string, listener: (data: { command: string; nodeId: string }) => void) => {
    capacitorMock.listener = listener;
    return Promise.resolve({ remove: vi.fn() });
  }),
  listener: null as null | ((data: { command: string; nodeId: string }) => void),
}));

const firebaseMock = vi.hoisted(() => ({
  auth: { currentUser: { uid: "uid-preparado" } as { uid: string } | null },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => capacitorMock.isNative,
  },
  registerPlugin: vi.fn(() => ({
    setPrepared: capacitorMock.setPrepared,
    drainQueue: capacitorMock.drainQueue,
    confirmProcessed: capacitorMock.confirmProcessed,
    startTurnoForegroundService: capacitorMock.startTurnoForegroundService,
    stopTurnoForegroundService: capacitorMock.stopTurnoForegroundService,
    sendResponse: capacitorMock.sendResponse,
    addListener: capacitorMock.addListener,
  })),
}));

vi.mock("../services/firebase", () => firebaseMock);

function activeCurrent() {
  return {
    entries: [],
    startTime: "10:00",
    startDate: "2026-06-01",
    isPaused: false,
    pauseStartTime: null,
    totalPausedMinutes: 0,
  };
}

async function emitWatchCommand(command: unknown) {
  capacitorMock.listener?.({ command: JSON.stringify(command), nodeId: "watch-node-1" });
  await flushWatchBridge();
}

async function flushWatchBridge() {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve();
  }
}

describe("watch-bridge", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    capacitorMock.listener = null;
    capacitorMock.isNative = true;
    capacitorMock.drainQueue.mockResolvedValue({ commands: [] });
    firebaseMock.auth.currentUser = { uid: "uid-preparado" };

    const { useAppStore } = await import("../services/store");
    useAppStore.setState({
      current: activeCurrent(),
      history: [],
      processedOperationIds: [],
      settings: {
        "porcentaje.jefe": 50,
        "porcentaje.chofer": 50,
        "descontar.datafono": true,
        "descontar.agencia_bono": true,
        "descontar.extra": true,
        "descontar.gasolina": true,
        diaLibre: 2,
        diaLibreDesde: null,
      },
      dataLoaded: true,
      loadTimedOut: false,
      isAdmin: false,
    });
  });

  it("rechaza comandos si el UID autenticado no coincide con el UID preparado", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    setupWatchBridge("uid-preparado");
    firebaseMock.auth.currentUser = { uid: "uid-otro" };

    await emitWatchCommand({
      operationId: "op-uid-mismatch",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:01:00",
      payload: {
        entryType: "propina",
        amount: 7,
        note: "no debe entrar",
      },
    });

    expect(useAppStore.getState().current.entries).toEqual([]);
    expect(capacitorMock.sendResponse).toHaveBeenCalledWith({
      nodeId: "watch-node-1",
      response: JSON.stringify({
        type: "ERROR",
        operationId: "op-uid-mismatch",
        code: "AUTH_UID_MISMATCH",
        message: "Usuario movil no coincide con el puente del reloj",
      }),
    });
  });

  it("rechaza comandos si los datos del usuario aun no estan cargados", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    useAppStore.setState({ dataLoaded: false });
    setupWatchBridge("uid-preparado");

    await emitWatchCommand({
      operationId: "op-not-loaded",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:02:00",
      payload: {
        entryType: "propina",
        amount: 9,
        note: "no debe entrar",
      },
    });

    expect(useAppStore.getState().current.entries).toEqual([]);
    expect(capacitorMock.sendResponse).toHaveBeenCalledWith({
      nodeId: "watch-node-1",
      response: JSON.stringify({
        type: "ERROR",
        operationId: "op-not-loaded",
        code: "DATA_NOT_LOADED",
        message: "Datos del usuario no cargados",
      }),
    });
  });

  it("responde con error si el comando recibido no es JSON valido", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    setupWatchBridge("uid-preparado");

    capacitorMock.listener?.({ command: "{", nodeId: "watch-node-1" });
    await flushWatchBridge();

    expect(useAppStore.getState().current.entries).toEqual([]);
    expect(capacitorMock.sendResponse).toHaveBeenCalledWith({
      nodeId: "watch-node-1",
      response: JSON.stringify({
        type: "ERROR",
        operationId: "",
        code: "INVALID_COMMAND",
        message: "Comando del reloj invalido",
      }),
    });
  });

  it("drena la cola nativa del reloj y confirma operaciones procesadas", async () => {
    capacitorMock.drainQueue.mockResolvedValue({
      commands: [{
        operationId: "op-queued-1",
        nodeId: "watch-node-1",
        command: JSON.stringify({
          operationId: "op-queued-1",
          type: "ADD_ENTRY",
          createdAt: "2026-06-01T10:03:00",
          payload: {
            entryType: "propina",
            amount: 6,
            note: "desde cola",
          },
        }),
      }],
    });

    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    setupWatchBridge("uid-preparado");
    await flushWatchBridge();

    expect(useAppStore.getState().current.entries).toEqual([{
      id: expect.any(Number),
      type: "propina",
      amount: 6,
      note: "desde cola",
      time: expect.any(String),
    }]);
    expect(capacitorMock.confirmProcessed).toHaveBeenCalledWith({
      operationIds: ["op-queued-1"],
    });
    expect(capacitorMock.sendResponse).toHaveBeenCalledWith({
      nodeId: "watch-node-1",
      response: JSON.stringify({
        type: "OK",
        operationId: "op-queued-1",
        message: "Entrada anadida",
      }),
    });
  });

  it("arranca y para el servicio foreground cuando el reloj inicia y termina turno", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    useAppStore.setState({
      current: {
        entries: [],
        startTime: null,
        startDate: null,
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
      history: [],
    });
    setupWatchBridge("uid-preparado");

    await emitWatchCommand({
      operationId: "op-start-service",
      type: "START_TURNO",
      createdAt: "2026-06-01T10:00:00",
    });

    expect(capacitorMock.startTurnoForegroundService).toHaveBeenCalledTimes(1);
    expect(capacitorMock.confirmProcessed).toHaveBeenCalledWith({
      operationIds: ["op-start-service"],
    });

    await emitWatchCommand({
      operationId: "op-end-service",
      type: "END_TURNO",
      createdAt: "2026-06-01T11:00:00",
      payload: {
        dinero: 20,
        km: 10,
        note: "cierre",
      },
    });

    expect(capacitorMock.stopTurnoForegroundService).toHaveBeenCalledTimes(1);
  });
});
