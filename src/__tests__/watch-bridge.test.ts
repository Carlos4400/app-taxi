import { beforeEach, describe, expect, it, vi } from "vitest";

const capacitorMock = vi.hoisted(() => ({
  isNative: true,
  setPrepared: vi.fn(() => Promise.resolve()),
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
  await Promise.resolve();
  await Promise.resolve();
}

describe("watch-bridge", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    capacitorMock.listener = null;
    capacitorMock.isNative = true;
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
    await Promise.resolve();
    await Promise.resolve();

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
});
