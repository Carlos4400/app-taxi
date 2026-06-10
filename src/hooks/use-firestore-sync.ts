import { useEffect, useRef } from "react";
import { onSnapshot, doc, getDoc, waitForPendingWrites } from "firebase/firestore";
import { useAppStore } from "../services/store";
import { auth, db } from "../services/firebase";
import {
  userMetaDocRef,
  userSubcollectionRef,
  saveUserDoc,
  syncSubcollection,
  userHasFirestoreData,
} from "../services/firestore-sync";
import {
  clearUserPendingSync,
  hasUserPendingSync,
  markUserPendingSync,
  readUserPendingSync,
  type PendingSyncArea,
} from "../services/pending-sync";
import { readUserLocalJSON, writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES, KEY_PROCESSED_OPERATIONS } from "../shared/storage-keys";
import { loadSettings, loadProcessedOperationIds } from "../logic/state-loaders";
import { ensureTurnosDiaLibreContable, mergeTurnos, sortTurnosByDateDesc } from "../logic/turnos";
import type { CurrentState, AppSettings, Turno, Reserva, NotaCalendario, WeekOverride } from "../shared/types";
import { setupWatchBridge, teardownWatchBridge } from "../services/watch-bridge";

const LOCAL_MIGRATION_KEY = "taxi_migration_done_v2";
const LOAD_TIMEOUT_MS = 15000;

function emptyCurrent(): CurrentState {
  return { entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 };
}

function mergeById<T>(localItems: T[], remoteItems: T[], getId: (item: T) => string | number): T[] {
  const merged = new Map<string, T>();
  localItems.forEach((item) => merged.set(String(getId(item)), item));
  remoteItems.forEach((item) => merged.set(String(getId(item)), item));
  return Array.from(merged.values());
}

function hasOpenCurrent(current: CurrentState): boolean {
  return !!current.startTime || current.entries.length > 0;
}

function sameJSON(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function migrarLocalStorageAFirestore(uid: string): Promise<void> {
  if (localStorage.getItem(LOCAL_MIGRATION_KEY)) return;

  if (await userHasFirestoreData(db, uid)) {
    localStorage.setItem(LOCAL_MIGRATION_KEY, JSON.stringify({
      uid, at: new Date().toISOString(), migrado: false, motivo: "ya-tenia-datos-en-firestore",
    }));
    return;
  }

  const currentRaw = localStorage.getItem(KEY_CURRENT);
  const historyRaw = localStorage.getItem(KEY_HISTORY);
  const settingsRaw = localStorage.getItem(KEY_SETTINGS);
  const weekOverridesRaw = localStorage.getItem(KEY_WEEK_OVERRIDES);
  const reservationsRaw = localStorage.getItem(KEY_RESERVATIONS);
  const notesRaw = localStorage.getItem(KEY_NOTES);

  const todoVacio =
    !currentRaw && !historyRaw && !settingsRaw &&
    !weekOverridesRaw &&
    !reservationsRaw && !notesRaw;

  if (todoVacio) {
    localStorage.setItem(LOCAL_MIGRATION_KEY, JSON.stringify({
      uid, at: new Date().toISOString(), migrado: false,
    }));
    return;
  }

  localStorage.setItem(LOCAL_MIGRATION_KEY, JSON.stringify({
    uid, at: new Date().toISOString(), migrado: false, motivo: "legacy-sin-uid-no-atribuible",
  }));
}

/**
 * Sincronización Firestore ↔ store ↔ localStorage.
 *
 * Antes recibía 6 pares estado/setter por props desde `App`. Ahora lee y
 * escribe directamente del store global de Zustand, eliminando el prop drilling.
 * Sigue devolviendo { dataLoaded, loadTimedOut } por compatibilidad con `App`.
 */
export function useFirestoreSync(uid: string) {
  // Estado de negocio (reactivo) leído del store.
  const current = useAppStore((s) => s.current);
  const settings = useAppStore((s) => s.settings);
  const history = useAppStore((s) => s.history);
  const reservations = useAppStore((s) => s.reservations);
  const notes = useAppStore((s) => s.notes);
  const weekOverrides = useAppStore((s) => s.weekOverrides);
  const processedOperationIds = useAppStore((s) => s.processedOperationIds);
  const dataLoaded = useAppStore((s) => s.dataLoaded);
  const loadTimedOut = useAppStore((s) => s.loadTimedOut);

  // Setters del store (referencias estables).
  const setCurrent = useAppStore((s) => s.setCurrent);
  const setSettings = useAppStore((s) => s.setSettings);
  const setHistory = useAppStore((s) => s.setHistory);
  const setReservations = useAppStore((s) => s.setReservations);
  const setNotes = useAppStore((s) => s.setNotes);
  const setWeekOverrides = useAppStore((s) => s.setWeekOverrides);
  const setProcessedOperationIds = useAppStore((s) => s.setProcessedOperationIds);
  const setDataLoaded = useAppStore((s) => s.setDataLoaded);
  const setLoadTimedOut = useAppStore((s) => s.setLoadTimedOut);
  const setIsAdmin = useAppStore((s) => s.setIsAdmin);

  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const lastProcessedOperationIdsRef = useRef<string[]>([]);
  const loadedUidRef = useRef<string | null>(null);

  function getWritableUid(): string | null {
    const authUid = auth.currentUser?.uid;
    if (!dataLoaded || !authUid || authUid !== uid || loadedUidRef.current !== uid) return null;
    return uid;
  }

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(current, lastCurrentRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_CURRENT, current);
    markUserPendingSync(writableUid, "current");
    saveUserDoc(db, writableUid, "current", current)
      .then(() => {
        lastCurrentRef.current = current;
        clearUserPendingSync(writableUid, "current");
      })
      .catch((err) => console.error("Save current failed:", err));
  }, [current, dataLoaded, uid]);

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(settings, lastSettingsRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_SETTINGS, settings);
    markUserPendingSync(writableUid, "settings");
    saveUserDoc(db, writableUid, "settings", settings)
      .then(() => {
        lastSettingsRef.current = settings;
        clearUserPendingSync(writableUid, "settings");
      })
      .catch((err) => console.error("Save settings failed:", err));
  }, [settings, dataLoaded, uid]);

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(history, lastHistoryRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_HISTORY, history);
    markUserPendingSync(writableUid, "turnos");
    syncSubcollection(db, writableUid, "turnos", lastHistoryRef.current, history, (t) => t.id)
      .then(() => {
        lastHistoryRef.current = history;
        clearUserPendingSync(writableUid, "turnos");
      })
      .catch((err) => console.error("Sync turnos failed:", err));
  }, [history, dataLoaded, uid]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (!history.some((turno) => typeof turno.diaLibreContable !== "number")) return;
    setHistory((prev) => ensureTurnosDiaLibreContable(prev, settings.diaLibre));
  }, [history, settings.diaLibre, dataLoaded]);

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(reservations, lastReservationsRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_RESERVATIONS, reservations);
    markUserPendingSync(writableUid, "reservations");
    syncSubcollection(db, writableUid, "reservations", lastReservationsRef.current, reservations, (r) => r.id)
      .then(() => {
        lastReservationsRef.current = reservations;
        clearUserPendingSync(writableUid, "reservations");
      })
      .catch((err) => console.error("Sync reservations failed:", err));
  }, [reservations, dataLoaded, uid]);

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(notes, lastNotesRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_NOTES, notes);
    markUserPendingSync(writableUid, "notes");
    syncSubcollection(db, writableUid, "notes", lastNotesRef.current, notes, (n) => n.id)
      .then(() => {
        lastNotesRef.current = notes;
        clearUserPendingSync(writableUid, "notes");
      })
      .catch((err) => console.error("Sync notes failed:", err));
  }, [notes, dataLoaded, uid]);

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(weekOverrides, lastWeekOverridesRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_WEEK_OVERRIDES, weekOverrides);
    markUserPendingSync(writableUid, "weekOverrides");
    syncSubcollection(db, writableUid, "weekOverrides", lastWeekOverridesRef.current, weekOverrides, (w) => w.weekId)
      .then(() => {
        lastWeekOverridesRef.current = weekOverrides;
        clearUserPendingSync(writableUid, "weekOverrides");
      })
      .catch((err) => console.error("Sync weekOverrides failed:", err));
  }, [weekOverrides, dataLoaded, uid]);

  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(processedOperationIds, lastProcessedOperationIdsRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_PROCESSED_OPERATIONS, processedOperationIds);
    markUserPendingSync(writableUid, "processedOperationIds");
    saveUserDoc(db, writableUid, "processedOperationIds", processedOperationIds)
      .then(() => {
        lastProcessedOperationIdsRef.current = processedOperationIds;
        clearUserPendingSync(writableUid, "processedOperationIds");
      })
      .catch((err) => console.error("Save processedOperationIds failed:", err));
  }, [processedOperationIds, dataLoaded, uid]);

  useEffect(() => {
    // ── Reset a estado vacío antes de cargar los datos del nuevo usuario ──────
    // El store (Zustand) es un singleton de módulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacío en Firestore antes de que lleguen los datos reales.
    loadedUidRef.current = null;
    lastCurrentRef.current = null;
    lastSettingsRef.current = null;
    lastHistoryRef.current = [];
    lastReservationsRef.current = [];
    lastNotesRef.current = [];
    lastWeekOverridesRef.current = [];
    lastProcessedOperationIdsRef.current = [];
    setCurrent(emptyCurrent());
    setSettings(loadSettings());
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setProcessedOperationIds([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // ─────────────────────────────────────────────────────────────────────────

    let cancelado = false;
    const unsubs: Array<() => void> = [];

    const recibido = {
      current: false, settings: false, turnos: false,
      reservations: false, notes: false,
      weekOverrides: false,
    };
    function marcar(key: keyof typeof recibido) {
      recibido[key] = true;
      if (Object.values(recibido).every((v) => v)) {
        loadedUidRef.current = uid;
        setDataLoaded(true);
      }
    }

    (async () => {
      const localProcessed = readUserLocalJSON<string[]>(uid, KEY_PROCESSED_OPERATIONS) || [];
      lastProcessedOperationIdsRef.current = localProcessed;
      setProcessedOperationIds(localProcessed);

      try {
        await migrarLocalStorageAFirestore(uid);
      } catch (err) {
        console.error("Migración localStorage → Firestore fallida:", err);
      }
      if (cancelado) return;

      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"), (snap) => {
        const hasPendingCurrent = hasUserPendingSync(uid, "current");
        if (snap.exists()) {
          const remoteCurrent = snap.data() as CurrentState;
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT);
          const nextCurrent =
            hasPendingCurrent && localCurrent && hasOpenCurrent(localCurrent)
              ? localCurrent
              : remoteCurrent;
          lastCurrentRef.current = remoteCurrent;
          writeUserLocalJSON(uid, KEY_CURRENT, nextCurrent);
          setCurrent(nextCurrent);
          if (hasPendingCurrent && sameJSON(nextCurrent, remoteCurrent)) clearUserPendingSync(uid, "current");
        } else {
          const localCurrent = hasPendingCurrent ? readUserLocalJSON<CurrentState>(uid, KEY_CURRENT) : null;
          const nextCurrent = localCurrent ?? emptyCurrent();
          lastCurrentRef.current = null;
          writeUserLocalJSON(uid, KEY_CURRENT, nextCurrent);
          setCurrent(nextCurrent);
          if (hasPendingCurrent && sameJSON(nextCurrent, emptyCurrent())) clearUserPendingSync(uid, "current");
        }
        marcar("current");
      }));

      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "settings"), (snap) => {
        const hasPendingSettings = hasUserPendingSync(uid, "settings");
        const localSettings = hasPendingSettings ? readUserLocalJSON<Partial<AppSettings>>(uid, KEY_SETTINGS) : null;
        if (snap.exists()) {
          const remoteSettings = snap.data() as AppSettings;
          const nextSettings = localSettings ? { ...loadSettings(), ...remoteSettings, ...localSettings } : remoteSettings;
          lastSettingsRef.current = remoteSettings;
          writeUserLocalJSON(uid, KEY_SETTINGS, nextSettings);
          setSettings(nextSettings);
          if (hasPendingSettings && sameJSON(nextSettings, remoteSettings)) clearUserPendingSync(uid, "settings");
        } else {
          const nextSettings = localSettings ? { ...loadSettings(), ...localSettings } : loadSettings();
          lastSettingsRef.current = null;
          writeUserLocalJSON(uid, KEY_SETTINGS, nextSettings);
          setSettings(nextSettings);
          if (hasPendingSettings && sameJSON(nextSettings, loadSettings())) clearUserPendingSync(uid, "settings");
        }
        marcar("settings");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const hasPendingHistory = hasUserPendingSync(uid, "turnos");
        const localItems = hasPendingHistory ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = hasPendingHistory ? mergeTurnos(localItems, orderedItems) : orderedItems;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
        if (hasPendingHistory && sameJSON(mergedItems, orderedItems)) clearUserPendingSync(uid, "turnos");
        marcar("turnos");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        const hasPendingReservations = hasUserPendingSync(uid, "reservations");
        const localItems = hasPendingReservations ? readUserLocalJSON<Reserva[]>(uid, KEY_RESERVATIONS) ?? [] : [];
        const mergedItems = hasPendingReservations ? mergeById(localItems, items, (r) => r.id) : items;
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, mergedItems);
        setReservations(mergedItems);
        if (hasPendingReservations && sameJSON(mergedItems, items)) clearUserPendingSync(uid, "reservations");
        marcar("reservations");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "notes"), (snap) => {
        const items: NotaCalendario[] = [];
        snap.forEach((d) => items.push(d.data() as NotaCalendario));
        const hasPendingNotes = hasUserPendingSync(uid, "notes");
        const localItems = hasPendingNotes ? readUserLocalJSON<NotaCalendario[]>(uid, KEY_NOTES) ?? [] : [];
        const mergedItems = hasPendingNotes ? mergeById(localItems, items, (n) => n.id) : items;
        lastNotesRef.current = items;
        writeUserLocalJSON(uid, KEY_NOTES, mergedItems);
        setNotes(mergedItems);
        if (hasPendingNotes && sameJSON(mergedItems, items)) clearUserPendingSync(uid, "notes");
        marcar("notes");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "weekOverrides"), (snap) => {
        const items: WeekOverride[] = [];
        snap.forEach((d) => items.push(d.data() as WeekOverride));
        const hasPendingWeekOverrides = hasUserPendingSync(uid, "weekOverrides");
        const localItems = hasPendingWeekOverrides ? readUserLocalJSON<WeekOverride[]>(uid, KEY_WEEK_OVERRIDES) ?? [] : [];
        const mergedItems = hasPendingWeekOverrides ? mergeById(localItems, items, (w) => w.weekId) : items;
        lastWeekOverridesRef.current = items;
        writeUserLocalJSON(uid, KEY_WEEK_OVERRIDES, mergedItems);
        setWeekOverrides(mergedItems);
        if (hasPendingWeekOverrides && sameJSON(mergedItems, items)) clearUserPendingSync(uid, "weekOverrides");
        marcar("weekOverrides");
      }));
    })();

    return () => {
      cancelado = true;
      unsubs.forEach((u) => u());
    };
  }, [uid]);

  useEffect(() => {
    if (dataLoaded) return;
    const t = setTimeout(() => setLoadTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [dataLoaded]);

  // ── Limpieza de marcas "pendiente" huérfanas ──────────────────────────────
  // Firestore tiene persistencia local activada (persistentLocalCache en
  // firebase.ts): las escrituras encoladas sobreviven a reinicios y el SDK las
  // entrega solo al recuperar conexión. Pero las marcas caseras de pending-sync
  // solo se limpiaban si la promesa de SU escritura resolvía en ESA sesión: si
  // la app se cerraba antes de la confirmación, el dato llegaba igualmente al
  // servidor y la marca quedaba huérfana para siempre (punto naranja perpetuo).
  // waitForPendingWrites (API oficial) resuelve cuando el backend ha confirmado
  // TODAS las escrituras encoladas: en ese momento, las marcas capturadas al
  // inicio son huérfanas con certeza y se limpian. Solo se limpian las áreas
  // capturadas antes de esperar, para no pisar marcas de escrituras nuevas.
  useEffect(() => {
    if (!dataLoaded || !uid) return;
    const areasMarcadas = Object.keys(readUserPendingSync(uid)) as PendingSyncArea[];
    if (areasMarcadas.length === 0) return;
    let cancelado = false;
    waitForPendingWrites(db)
      .then(() => {
        if (cancelado) return;
        areasMarcadas.forEach((area) => clearUserPendingSync(uid, area));
      })
      .catch((err) => {
        console.error("waitForPendingWrites fallido:", err);
      });
    return () => { cancelado = true; };
  }, [dataLoaded, uid]);

  useEffect(() => {
    let cancelado = false;
    getDoc(doc(db, "admins", uid))
      .then((snap) => {
        if (!cancelado) setIsAdmin(snap.exists());
      })
      .catch((err) => {
        console.error("Comprobación admin fallida:", err);
      });
    return () => { cancelado = true; };
  }, [uid]);

  useEffect(() => {
    if (dataLoaded && uid) {
      setupWatchBridge(uid);
      return () => {
        teardownWatchBridge(uid).catch((err) => console.error("Error al cerrar sesion Wear OS:", err));
      };
    }
  }, [dataLoaded, uid]);

  return { dataLoaded, loadTimedOut };
}
