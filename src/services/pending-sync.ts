import { KEY_PENDING_SYNC } from "../shared/storage-keys";
import { userStorageKey } from "./user-storage";

export type PendingSyncArea =
  | "current"
  | "settings"
  | "turnos"
  | "reservations"
  | "notes"
  | "weekOverrides"
  | "processedOperationIds";

export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export const PENDING_SYNC_CHANGED_EVENT = "taxi:pending-sync-changed";

export type PendingSyncChangedDetail = {
  uid: string;
  state: PendingSyncState;
};

function notifyUserPendingSyncChanged(uid: string, state: PendingSyncState): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<PendingSyncChangedDetail>(
    PENDING_SYNC_CHANGED_EVENT,
    { detail: { uid, state } },
  ));
}

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}

export function hasUserPendingSync(uid: string, area: PendingSyncArea): boolean {
  return readUserPendingSync(uid)[area] === true;
}

export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
  notifyUserPendingSyncChanged(uid, state);
}

export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    notifyUserPendingSyncChanged(uid, state);
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
  notifyUserPendingSyncChanged(uid, state);
}
