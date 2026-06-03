import { beforeEach, describe, expect, it, vi } from "vitest";

const capacitorMock = vi.hoisted(() => ({
  isNative: true,
  setPrepared: vi.fn(() => Promise.resolve()),
  clearPrepared: vi.fn(() => Promise.resolve()),
  sendResponse: vi.fn(() => Promise.resolve()),
  getNativeState: vi.fn(() => Promise.resolve({ state: "" })),
  syncState: vi.fn(() => Promise.resolve()),
  addListener: vi.fn((eventName: string, listener: () => void) => {
    capacitorMock.listeners[eventName] = listener;
    return Promise.resolve({ remove: vi.fn() });
  }),
  listeners: {} as Record<string, () => void>,
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
    clearPrepared: capacitorMock.clearPrepared,
    sendResponse: capacitorMock.sendResponse,
    getNativeState: capacitorMock.getNativeState,
    syncState: capacitorMock.syncState,
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

async function emitNativeStateChanged() {
  capacitorMock.listeners.onNativeStateChanged?.();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("watch-bridge", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    capacitorMock.listeners = {};
    capacitorMock.isNative = true;
    capacitorMock.getNativeState.mockResolvedValue({ state: "" });
    capacitorMock.syncState.mockResolvedValue();

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

  it("prepara el puente nativo sin registrar procesador JS de comandos", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");

    setupWatchBridge("uid-preparado");

    expect(capacitorMock.setPrepared).toHaveBeenCalledWith({ uid: "uid-preparado" });
    expect(capacitorMock.addListener).toHaveBeenCalledWith("onNativeStateChanged", expect.any(Function));
    expect(capacitorMock.addListener).not.toHaveBeenCalledWith("onCommandReceived", expect.any(Function));
  });

  it("hidrata el store con el estado nativo aplicado mientras el WebView no estaba vivo", async () => {
    capacitorMock.getNativeState.mockResolvedValue({
      state: JSON.stringify({
        current: {
          startTime: "11:00",
          startDate: "2026-06-01",
          entries: [
            { id: 10, type: "propina", amount: 3, note: "desde reloj", time: "11:05" },
          ],
        },
        history: [],
        processedOperationIds: ["op-native-entry"],
      }),
    });

    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    setupWatchBridge("uid-preparado");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(capacitorMock.getNativeState).toHaveBeenCalled();
    expect(useAppStore.getState().current.startTime).toBe("11:00");
    expect(useAppStore.getState().current.entries).toEqual([
      { id: 10, type: "propina", amount: 3, note: "desde reloj", time: "11:05" },
    ]);
    expect(useAppStore.getState().processedOperationIds).toEqual(["op-native-entry"]);
  });

  it("rehidrata el store cuando Android avisa que Room cambio", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    setupWatchBridge("uid-preparado");
    await Promise.resolve();
    await Promise.resolve();

    capacitorMock.getNativeState.mockResolvedValue({
      state: JSON.stringify({
        current: {
          startTime: "12:00",
          startDate: "2026-06-01",
          entries: [
            { id: 20, type: "datafono", amount: 5, note: "actualizado", time: "12:05" },
          ],
        },
        history: [],
        processedOperationIds: ["op-room-change"],
      }),
    });

    await emitNativeStateChanged();

    expect(useAppStore.getState().current.startTime).toBe("12:00");
    expect(useAppStore.getState().current.entries).toEqual([
      { id: 20, type: "datafono", amount: 5, note: "actualizado", time: "12:05" },
    ]);
    expect(useAppStore.getState().processedOperationIds).toEqual(["op-room-change"]);
  });

  it("rehidrata cuando cambia un valor anidado aunque la estructura sea igual", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    useAppStore.setState({
      current: {
        ...activeCurrent(),
        entries: [{ id: 30, type: "propina", amount: 1, note: "", time: "12:05" }],
      },
    });
    capacitorMock.getNativeState.mockResolvedValue({
      state: JSON.stringify({
        current: {
          ...activeCurrent(),
          entries: [{ id: 30, type: "propina", amount: 2, note: "", time: "12:05" }],
        },
        history: [],
        processedOperationIds: [],
      }),
    });

    setupWatchBridge("uid-preparado");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(useAppStore.getState().current.entries[0].amount).toBe(2);
  });

  it("sincroniza en Room el estado del movil y tambien las ediciones sin cambiar longitud", async () => {
    const { setupWatchBridge } = await import("../services/watch-bridge");
    const { useAppStore } = await import("../services/store");

    setupWatchBridge("uid-preparado");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    useAppStore.getState().setCurrent({
      ...activeCurrent(),
      entries: [{ id: 50, type: "propina", amount: 1, note: "", time: "10:05" }],
    });
    await Promise.resolve();
    await Promise.resolve();

    useAppStore.getState().setCurrent((current) => ({
      ...current,
      entries: current.entries.map((entry) => ({ ...entry, amount: 2 })),
    }));
    await Promise.resolve();
    await Promise.resolve();

    await vi.waitFor(() => {
      const syncCalls = capacitorMock.syncState.mock.calls as unknown as Array<[{ state: string }]>;
      const snapshots = syncCalls.map(([call]) => JSON.parse(call.state));
      expect(snapshots.length).toBeGreaterThanOrEqual(2);
      const lastSnapshot = snapshots[snapshots.length - 1];
      expect(lastSnapshot.current.entries[0].amount).toBe(2);
    });
  });
});
