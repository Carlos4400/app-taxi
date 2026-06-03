import { registerPlugin, Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { useAppStore } from "./store";
import { buildTurnoConfigFromSettings } from "../logic/accounting";
import { mergeTurnos } from "../logic/turnos";
import type { CurrentState, Entry, Turno } from "../shared/types";

export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  clearPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  getNativeState(): Promise<{ state?: string }>;
  syncState(options: { state: string }): Promise<void>;
  addListener(
    eventName: "onNativeStateChanged",
    listenerFunc: (data: { updatedAt?: number }) => void
  ): Promise<PluginListenerHandle>;
}

const WearOsBridge = registerPlugin<WearOsBridgePlugin>("WearOsBridge");

let listenerAdded = false;
let nativeStateListener: Promise<PluginListenerHandle> | null = null;
let storeUnsubscribes: Array<() => void> = [];
let preparedUid = "";
let lastSyncedSnapshot = "";
let nativeSyncQueue: Promise<void> = Promise.resolve();
let nativeHydrationQueue: Promise<void> | null = null;

type NativeWatchState = {
  current?: {
    startTime?: string | null;
    startDate?: string | null;
    entries?: Entry[];
    isPaused?: boolean;
    pauseStartTime?: string | null;
    totalPausedMinutes?: number;
  };
  history?: Array<{
    id: number;
    date: string;
    startDate?: string | null;
    startTime?: string | null;
    endTime: string;
    entries?: Entry[];
    dinero?: number;
    km?: number;
    notes?: string;
    totalPausedMinutes?: number;
  }>;
  processedOperationIds?: string[];
};

function emptyCurrent(): CurrentState {
  return {
    entries: [],
    startTime: null,
    startDate: null,
    isPaused: false,
    pauseStartTime: null,
    totalPausedMinutes: 0,
  };
}

function sumEntries(entries: Entry[], type: string): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + entry.amount, 0);
}

function nativeTurnoToTurno(
  turno: NonNullable<NativeWatchState["history"]>[number],
  existing: Turno | undefined,
  settings: ReturnType<typeof useAppStore.getState>["settings"]
): Turno {
  const entries = Array.isArray(turno.entries) ? turno.entries : [];
  return {
    id: turno.id,
    date: turno.date,
    startDate: turno.startDate ?? null,
    startTime: turno.startTime ?? null,
    endTime: turno.endTime,
    entries,
    totalP: sumEntries(entries, "propina"),
    totalD: sumEntries(entries, "datafono"),
    totalA: sumEntries(entries, "agencia_bono"),
    totalE: sumEntries(entries, "extra"),
    totalF: sumEntries(entries, "gasolina"),
    totalN: sumEntries(entries, "nulo"),
    dinero: turno.dinero ?? 0,
    km: turno.km ?? 0,
    notes: turno.notes ?? "",
    totalPausedMinutes: turno.totalPausedMinutes ?? existing?.totalPausedMinutes ?? 0,
    entregada: existing?.entregada ?? false,
    fechaEntrega: existing?.fechaEntrega ?? null,
    configTurno: existing?.configTurno ?? buildTurnoConfigFromSettings(settings),
    diaLibreContable: existing?.diaLibreContable ?? settings.diaLibre,
  };
}

function stableHash(value: unknown): string {
  const canonicalize = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) {
      return candidate.map(canonicalize);
    }
    if (candidate && typeof candidate === "object") {
      return Object.keys(candidate)
        .sort()
        .reduce<Record<string, unknown>>((result, key) => {
          result[key] = canonicalize((candidate as Record<string, unknown>)[key]);
          return result;
        }, {});
    }
    return candidate;
  };
  return JSON.stringify(canonicalize(value));
}

async function hydrateNativeWatchState(): Promise<void> {
  const nativeState = await WearOsBridge.getNativeState();
  if (!nativeState.state) return;

  const parsed = JSON.parse(nativeState.state) as NativeWatchState;
  const store = useAppStore.getState();
  const currentEntries = Array.isArray(parsed.current?.entries) ? parsed.current.entries : [];
  const hasNativeCurrent = !!parsed.current?.startTime || currentEntries.length > 0;
  const nativeHistory = Array.isArray(parsed.history) ? parsed.history : [];
  const nativeOperationIds = Array.isArray(parsed.processedOperationIds) ? parsed.processedOperationIds : [];

  const nativeSnapshotHash = stableHash({
    current: parsed.current,
    history: nativeHistory,
    processedOperationIds: nativeOperationIds,
  });
  const storeSnapshotHash = stableHash({
    current: store.current,
    history: store.history,
    processedOperationIds: store.processedOperationIds,
  });

  if (nativeSnapshotHash === storeSnapshotHash) return;

  const nextCurrent = hasNativeCurrent
    ? {
        ...emptyCurrent(),
        startTime: parsed.current?.startTime ?? null,
        startDate: parsed.current?.startDate ?? null,
        entries: currentEntries,
        isPaused: parsed.current?.isPaused ?? store.current.isPaused ?? false,
        pauseStartTime: parsed.current?.pauseStartTime ?? store.current.pauseStartTime ?? null,
        totalPausedMinutes: parsed.current?.totalPausedMinutes ?? store.current.totalPausedMinutes ?? 0,
      }
    : emptyCurrent();

  const turnos = nativeHistory.map((turno) => {
    const existing = store.history.find((candidate) =>
      candidate.id === turno.id ||
      (
        candidate.startDate === (turno.startDate ?? null) &&
        candidate.startTime === (turno.startTime ?? null) &&
        candidate.endTime === turno.endTime
      )
    );
    return nativeTurnoToTurno(turno, existing, store.settings);
  });

  useAppStore.setState({
    current: nextCurrent,
    history: mergeTurnos(store.history, turnos),
    processedOperationIds: pruneProcessedOperationIds(
      Array.from(new Set([...store.processedOperationIds, ...nativeOperationIds])),
    ),
  });
}

function queueNativeHydration(): Promise<void> {
  nativeHydrationQueue = nativeHydrationQueue
    ? nativeHydrationQueue.catch((error) => {
        console.error("Error previo en cola de hidratacion Wear OS:", error);
      }).then(() => hydrateNativeWatchState())
    : hydrateNativeWatchState();
  return nativeHydrationQueue;
}

const MAX_PROCESSED_OPERATION_IDS = 512;

function pruneProcessedOperationIds(ids: string[]): string[] {
  if (ids.length <= MAX_PROCESSED_OPERATION_IDS) return ids;
  return ids.slice(ids.length - MAX_PROCESSED_OPERATION_IDS);
}

function nativeSnapshotCanonical(): string {
  const store = useAppStore.getState();
  return stableHash({
    current: store.current,
    history: store.history,
    processedOperationIds: pruneProcessedOperationIds(store.processedOperationIds),
  });
}

async function syncNativeWatchState(): Promise<void> {
  const snapshot = nativeSnapshotCanonical();
  if (snapshot === lastSyncedSnapshot) return nativeSyncQueue;
  lastSyncedSnapshot = snapshot;
  nativeSyncQueue = nativeSyncQueue
    .catch(() => undefined)
    .then(() => WearOsBridge.syncState({ state: snapshot }))
    .catch((error) => {
      if (lastSyncedSnapshot === snapshot) lastSyncedSnapshot = "";
      throw error;
    });
  return nativeSyncQueue;
}

function startNativeStateSync() {
  if (storeUnsubscribes.length === 0) {
    storeUnsubscribes.push(useAppStore.subscribe(
      (state) => state.current,
      () => {
        syncNativeWatchState().catch((err) => {
          console.error("Error al sincronizar estado movil con Room:", err);
        });
      },
    ));
    storeUnsubscribes.push(useAppStore.subscribe(
      (state) => state.history,
      () => {
        syncNativeWatchState().catch((err) => {
          console.error("Error al sincronizar estado movil con Room:", err);
        });
      },
    ));
    storeUnsubscribes.push(useAppStore.subscribe(
      (state) => state.processedOperationIds,
      () => {
        syncNativeWatchState().catch((err) => {
          console.error("Error al sincronizar estado movil con Room:", err);
        });
      },
    ));
  }
  return syncNativeWatchState();
}

export function setupWatchBridge(uid: string) {
  if (!uid) return;
  if (!Capacitor.isNativePlatform()) return;
  if (preparedUid !== uid) {
    storeUnsubscribes.forEach((unsubscribe) => unsubscribe());
    storeUnsubscribes = [];
    nativeStateListener?.then((listener) => listener.remove()).catch((err) => {
      console.error("Error al retirar listener nativo Wear OS:", err);
    });
    nativeStateListener = null;
    listenerAdded = false;
    preparedUid = uid;
    lastSyncedSnapshot = "";
    nativeHydrationQueue = null;
  }

  WearOsBridge.setPrepared({ uid })
    .then(async () => {
      console.log("WearOsBridge preparado para el usuario:", uid);
      await queueNativeHydration();
      await startNativeStateSync();
    })
    .catch((err) => {
      console.error("Error al preparar WearOsBridge:", err);
    });

  if (listenerAdded) return;
  listenerAdded = true;

  nativeStateListener = WearOsBridge.addListener("onNativeStateChanged", async () => {
    try {
      await queueNativeHydration();
    } catch (err) {
      console.error("Error al hidratar estado Wear OS:", err);
    }
  });
}

export async function teardownWatchBridge(uid: string): Promise<void> {
  if (!uid || preparedUid !== uid) return;
  storeUnsubscribes.forEach((unsubscribe) => unsubscribe());
  storeUnsubscribes = [];
  nativeStateListener?.then((listener) => listener.remove()).catch((err) => {
    console.error("Error al retirar listener nativo Wear OS:", err);
  });
  nativeStateListener = null;
  listenerAdded = false;
  preparedUid = "";
  lastSyncedSnapshot = "";
  nativeSyncQueue = Promise.resolve();
  nativeHydrationQueue = null;
  await WearOsBridge.clearPrepared({ uid });
}
