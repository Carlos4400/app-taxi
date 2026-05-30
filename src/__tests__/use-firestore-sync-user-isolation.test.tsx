import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFirestoreSync } from "../hooks/use-firestore-sync";
import { KEY_CURRENT, KEY_HISTORY } from "../shared/storage-keys";
import type { Turno } from "../shared/types";

const firestoreSyncMock = vi.hoisted(() => ({
  saveUserDoc: vi.fn(),
  syncSubcollection: vi.fn(),
  userHasFirestoreData: vi.fn(),
  snapshotCallbacks: [] as Array<{ ref: { kind: string; name: string; uid: string }; callback: (snap: unknown) => void }>,
}));

const firebaseMock = vi.hoisted(() => ({
  auth: { currentUser: { uid: "uid-nuevo" } as { uid: string } | null },
  db: {},
}));

vi.mock("../services/firebase", () => firebaseMock);

vi.mock("../services/firestore-sync", () => ({
  userMetaDocRef: vi.fn((_db: unknown, uid: string, name: string) => ({
    kind: "meta",
    uid,
    name,
  })),
  userSubcollectionRef: vi.fn((_db: unknown, uid: string, name: string) => ({
    kind: "collection",
    uid,
    name,
  })),
  saveUserDoc: firestoreSyncMock.saveUserDoc,
  syncSubcollection: firestoreSyncMock.syncSubcollection,
  userHasFirestoreData: firestoreSyncMock.userHasFirestoreData,
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_dbOrRef: unknown, ...path: string[]) => ({ path })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  onSnapshot: vi.fn((ref: { kind: string; name: string; uid: string }, callback: (snap: unknown) => void) => {
    firestoreSyncMock.snapshotCallbacks.push({ ref, callback });
    return vi.fn();
  }),
  setDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

function turno(id: number, date: string, startTime: string, endTime: string): Turno {
  return {
    id,
    date,
    startDate: date,
    startTime,
    endTime,
    entries: [],
    totalP: 0,
    totalD: 0,
    totalA: 0,
    totalE: 0,
    totalF: 0,
    totalN: 0,
    dinero: 0,
    km: 0,
    notes: "",
  };
}

function emptyDocSnap() {
  return { exists: () => false };
}

function docSnap<T>(data: T) {
  return { exists: () => true, data: () => data };
}

function collectionSnap<T>(items: T[]) {
  return {
    forEach: (visitor: (doc: { data: () => T }) => void) => {
      items.forEach((item) => visitor({ data: () => item }));
    },
  };
}

async function emitInitialSnapshots(overrides: {
  current?: unknown;
  turnos?: Turno[];
} = {}) {
  await act(async () => {
    for (const { ref, callback } of firestoreSyncMock.snapshotCallbacks) {
      if (ref.kind === "meta" && ref.name === "current" && overrides.current) callback(docSnap(overrides.current));
      else if (ref.kind === "meta") callback(emptyDocSnap());
      else if (ref.name === "turnos") callback(collectionSnap(overrides.turnos ?? []));
      else callback(collectionSnap([]));
    }
    await Promise.resolve();
  });
}

function HookProbe() {
  useFirestoreSync();
  return null;
}

describe("useFirestoreSync: aislamiento entre usuarios", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks();
    firestoreSyncMock.snapshotCallbacks = [];
    localStorage.clear();
    firebaseMock.auth.currentUser = { uid: "uid-nuevo" };
    firestoreSyncMock.saveUserDoc.mockResolvedValue(undefined);
    firestoreSyncMock.syncSubcollection.mockResolvedValue(undefined);
    firestoreSyncMock.userHasFirestoreData.mockResolvedValue(false);

    const { useAppStore } = await import("../services/store");
    useAppStore.setState({
      current: {
        entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
        startTime: "10:00",
        startDate: "2026-05-30",
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
      history: [{
        id: 1,
        date: "2026-05-30",
        startDate: "2026-05-30",
        startTime: "10:00",
        endTime: "12:00",
        entries: [],
        totalP: 0,
        totalD: 0,
        totalA: 0,
        totalE: 0,
        totalF: 0,
        totalN: 0,
        dinero: 0,
        km: 0,
        notes: "",
      }],
      reservations: [],
      notes: [],
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
      weekOverrides: [],
      dataLoaded: true,
      loadTimedOut: false,
      isAdmin: false,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("no escribe datos del usuario anterior bajo el UID nuevo antes de cargar Firestore", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    expect(firestoreSyncMock.saveUserDoc).not.toHaveBeenCalled();
    expect(firestoreSyncMock.syncSubcollection).not.toHaveBeenCalled();
  });

  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });

  it("conserva y sube turnos offline del mismo UID sin mezclar los de otro usuario", async () => {
    const turnoOffline = turno(11, "2026-05-30", "10:00", "12:00");
    const turnoOtroUsuario = turno(22, "2026-05-29", "11:00", "13:00");
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoOffline]));
    localStorage.setItem(`${KEY_HISTORY}__uid-otro`, JSON.stringify([turnoOtroUsuario]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots();

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history.map((t) => t.id)).toEqual([11]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]").map((t: Turno) => t.id)).toEqual([11]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-otro`) || "[]").map((t: Turno) => t.id)).toEqual([22]);
    expect(firestoreSyncMock.syncSubcollection).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "turnos",
      [],
      [turnoOffline],
      expect.any(Function),
    );
  });

  it("restaura el turno abierto offline del mismo UID sin leer el de otro usuario", async () => {
    const currentOffline = {
      entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
      startTime: "10:00",
      startDate: "2026-05-30",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    const currentOtroUsuario = {
      entries: [],
      startTime: "11:00",
      startDate: "2026-05-29",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    localStorage.setItem("taxi_current_v3__uid-nuevo", JSON.stringify(currentOffline));
    localStorage.setItem("taxi_current_v3__uid-otro", JSON.stringify(currentOtroUsuario));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots();

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().current.startTime).toBe("10:00");
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(firestoreSyncMock.saveUserDoc).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "current",
      currentOffline,
    );
  });

  it("conserva el turno abierto local del mismo UID si Firestore tiene current vacío", async () => {
    const currentOffline = {
      entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
      startTime: "10:00",
      startDate: "2026-05-30",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    const currentFirestoreVacio = {
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    localStorage.setItem(`${KEY_CURRENT}__uid-nuevo`, JSON.stringify(currentOffline));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ current: currentFirestoreVacio });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().current.startTime).toBe("10:00");
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(firestoreSyncMock.saveUserDoc).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "current",
      currentOffline,
    );
  });

  it("fusiona turno offline y Firestore sin duplicar el mismo cierre", async () => {
    const turnoLocal = turno(11, "2026-05-30", "10:00", "12:00");
    const turnoFirestore = { ...turnoLocal, id: 99 };
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoLocal]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ turnos: [turnoFirestore] });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history).toHaveLength(1);
    expect(useAppStore.getState().history[0].id).toBe(99);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]")).toHaveLength(1);
  });

  it("no resucita turnos borrados en Firestore desde el cache local tras la carga inicial", async () => {
    const turnoFirestore = turno(11, "2026-05-30", "10:00", "12:00");
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoFirestore]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ turnos: [turnoFirestore] });

    const turnosSnapshot = firestoreSyncMock.snapshotCallbacks.find(({ ref }) => ref.name === "turnos");
    expect(turnosSnapshot).toBeDefined();

    await act(async () => {
      turnosSnapshot?.callback(collectionSnap([]));
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history).toEqual([]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]")).toEqual([]);
  });

  it("no migra claves legacy sin UID a un usuario autenticado", async () => {
    const turnoLegacy = turno(77, "2026-05-30", "10:00", "12:00");
    localStorage.setItem(KEY_HISTORY, JSON.stringify([turnoLegacy]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(localStorage.getItem(KEY_HISTORY)).toBe(JSON.stringify([turnoLegacy]));
    expect(firestoreSyncMock.syncSubcollection).not.toHaveBeenCalled();
  });
});
