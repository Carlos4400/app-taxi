import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import {
  PENDING_SYNC_CHANGED_EVENT,
  readUserPendingSync,
  type PendingSyncChangedDetail,
} from "../services/pending-sync";
import { useAppStore } from "../services/store";

export type SyncStatus = "loading" | "offline" | "pending" | "synced" | "error";

function getAuthUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function userHasPendingSync(uid: string | null): boolean {
  if (!uid) return false;
  return Object.keys(readUserPendingSync(uid)).length > 0;
}

function getNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useSyncStatus(): SyncStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);
  const [isOnline, setIsOnline] = useState(getNavigatorOnline);
  const [hasPendingSync, setHasPendingSync] = useState(() => userHasPendingSync(getAuthUid()));

  useEffect(() => {
    setHasPendingSync(userHasPendingSync(getAuthUid()));
  }, [dataLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePendingSyncChanged = (event: Event) => {
      const detail = (event as CustomEvent<PendingSyncChangedDetail>).detail;
      const uid = getAuthUid();
      if (!uid || detail.uid !== uid) return;
      setHasPendingSync(Object.keys(detail.state).length > 0);
    };

    window.addEventListener(PENDING_SYNC_CHANGED_EVENT, handlePendingSyncChanged);
    return () => {
      window.removeEventListener(PENDING_SYNC_CHANGED_EVENT, handlePendingSyncChanged);
    };
  }, []);

  if (loadTimedOut) return "error";
  if (!isOnline) return "offline";
  if (!dataLoaded) return "loading";
  if (hasPendingSync) return "pending";
  return "synced";
}
