import { useEffect, useRef } from "react";
import { onSnapshot, doc, getDoc } from "firebase/firestore";
import { useAppStore } from "../services/store";
import { auth, db } from "../services/firebase";
import {
  userMetaDocRef,
  userSubcollectionRef,
  saveUserDoc,
  syncSubcollection,
  userHasFirestoreData,
} from "../services/firestore-sync";
import { readUserLocalJSON, writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import { loadSettings } from "../logic/state-loaders";
import { ensureTurnosDiaLibreContable, mergeTurnos, sortTurnosByDateDesc } from "../logic/turnos";
import type { CurrentState, AppSettings, Turno, Reserva, NotaCalendario, WeekOverride } from "../shared/types";

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
export function useFirestoreSync() {
  // Estado de negocio (reactivo) leído del store.
  const current = useAppStore((s) => s.current);
  const settings = useAppStore((s) => s.settings);
  const history = useAppStore((s) => s.history);
  const reservations = useAppStore((s) => s.reservations);
  const notes = useAppStore((s) => s.notes);
  const weekOverrides = useAppStore((s) => s.weekOverrides);
  const dataLoaded = useAppStore((s) => s.dataLoaded);
  const loadTimedOut = useAppStore((s) => s.loadTimedOut);

  // Setters del store (referencias estables).
  const setCurrent = useAppStore((s) => s.setCurrent);
  const setSettings = useAppStore((s) => s.setSettings);
  const setHistory = useAppStore((s) => s.setHistory);
  const setReservations = useAppStore((s) => s.setReservations);
  const setNotes = useAppStore((s) => s.setNotes);
  const setWeekOverrides = useAppStore((s) => s.setWeekOverrides);
  const setDataLoaded = useAppStore((s) => s.setDataLoaded);
  const setLoadTimedOut = useAppStore((s) => s.setLoadTimedOut);
  const setIsAdmin = useAppStore((s) => s.setIsAdmin);

  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);

  function getWritableUid(): string | null {
    const uid = auth.currentUser?.uid;
    if (!dataLoaded || !uid || loadedUidRef.current !== uid) return null;
    return uid;
  }

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(settings) === JSON.stringify(lastSettingsRef.current)) return;
    writeUserLocalJSON(uid, KEY_SETTINGS, settings);
    saveUserDoc(db, uid, "settings", settings).catch((err) =>
      console.error("Save settings failed:", err)
    );
  }, [settings, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    writeUserLocalJSON(uid, KEY_HISTORY, history);
    syncSubcollection(db, uid, "turnos", lastHistoryRef.current, history, (t) => t.id)
      .then(() => { lastHistoryRef.current = history; })
      .catch((err) => console.error("Sync turnos failed:", err));
  }, [history, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (!history.some((turno) => typeof turno.diaLibreContable !== "number")) return;
    setHistory((prev) => ensureTurnosDiaLibreContable(prev, settings.diaLibre));
  }, [history, settings.diaLibre, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    writeUserLocalJSON(uid, KEY_RESERVATIONS, reservations);
    syncSubcollection(db, uid, "reservations", lastReservationsRef.current, reservations, (r) => r.id)
      .then(() => { lastReservationsRef.current = reservations; })
      .catch((err) => console.error("Sync reservations failed:", err));
  }, [reservations, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    writeUserLocalJSON(uid, KEY_NOTES, notes);
    syncSubcollection(db, uid, "notes", lastNotesRef.current, notes, (n) => n.id)
      .then(() => { lastNotesRef.current = notes; })
      .catch((err) => console.error("Sync notes failed:", err));
  }, [notes, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    writeUserLocalJSON(uid, KEY_WEEK_OVERRIDES, weekOverrides);
    syncSubcollection(db, uid, "weekOverrides", lastWeekOverridesRef.current, weekOverrides, (w) => w.weekId)
      .then(() => { lastWeekOverridesRef.current = weekOverrides; })
      .catch((err) => console.error("Sync weekOverrides failed:", err));
  }, [weekOverrides, dataLoaded]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;

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
    mergeLocalHistoryRef.current = true;
    mergeLocalReservationsRef.current = true;
    mergeLocalNotesRef.current = true;
    mergeLocalWeekOverridesRef.current = true;
    setCurrent(emptyCurrent());
    setSettings(loadSettings());
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
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
      try {
        await migrarLocalStorageAFirestore(uid);
      } catch (err) {
        console.error("Migración localStorage → Firestore fallida:", err);
      }
      if (cancelado) return;

      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"), (snap) => {
        if (snap.exists()) {
          const remoteCurrent = snap.data() as CurrentState;
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT);
          const nextCurrent =
            localCurrent && hasOpenCurrent(localCurrent) && !hasOpenCurrent(remoteCurrent)
              ? localCurrent
              : remoteCurrent;
          lastCurrentRef.current = remoteCurrent;
          writeUserLocalJSON(uid, KEY_CURRENT, nextCurrent);
          setCurrent(nextCurrent);
        } else {
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT) ?? emptyCurrent();
          lastCurrentRef.current = null;
          setCurrent(localCurrent);
        }
        marcar("current");
      }));

      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "settings"), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          lastSettingsRef.current = data;
          writeUserLocalJSON(uid, KEY_SETTINGS, data);
          setSettings(data);
        } else {
          const localSettings = readUserLocalJSON<Partial<AppSettings>>(uid, KEY_SETTINGS);
          const nextSettings = localSettings ? { ...loadSettings(), ...localSettings } : loadSettings();
          lastSettingsRef.current = null;
          setSettings(nextSettings);
        }
        marcar("settings");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = mergeLocalHistoryRef.current ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = mergeLocalHistoryRef.current ? mergeTurnos(localItems, orderedItems) : orderedItems;
        mergeLocalHistoryRef.current = false;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
        marcar("turnos");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        const localItems = mergeLocalReservationsRef.current ? readUserLocalJSON<Reserva[]>(uid, KEY_RESERVATIONS) ?? [] : [];
        const mergedItems = mergeLocalReservationsRef.current ? mergeById(localItems, items, (r) => r.id) : items;
        mergeLocalReservationsRef.current = false;
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, mergedItems);
        setReservations(mergedItems);
        marcar("reservations");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "notes"), (snap) => {
        const items: NotaCalendario[] = [];
        snap.forEach((d) => items.push(d.data() as NotaCalendario));
        const localItems = mergeLocalNotesRef.current ? readUserLocalJSON<NotaCalendario[]>(uid, KEY_NOTES) ?? [] : [];
        const mergedItems = mergeLocalNotesRef.current ? mergeById(localItems, items, (n) => n.id) : items;
        mergeLocalNotesRef.current = false;
        lastNotesRef.current = items;
        writeUserLocalJSON(uid, KEY_NOTES, mergedItems);
        setNotes(mergedItems);
        marcar("notes");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "weekOverrides"), (snap) => {
        const items: WeekOverride[] = [];
        snap.forEach((d) => items.push(d.data() as WeekOverride));
        const localItems = mergeLocalWeekOverridesRef.current ? readUserLocalJSON<WeekOverride[]>(uid, KEY_WEEK_OVERRIDES) ?? [] : [];
        const mergedItems = mergeLocalWeekOverridesRef.current ? mergeById(localItems, items, (w) => w.weekId) : items;
        mergeLocalWeekOverridesRef.current = false;
        lastWeekOverridesRef.current = items;
        writeUserLocalJSON(uid, KEY_WEEK_OVERRIDES, mergedItems);
        setWeekOverrides(mergedItems);
        marcar("weekOverrides");
      }));
    })();

    return () => {
      cancelado = true;
      unsubs.forEach((u) => u());
    };
  }, []);

  useEffect(() => {
    if (dataLoaded) return;
    const t = setTimeout(() => setLoadTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [dataLoaded]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    let cancelado = false;
    getDoc(doc(db, "admins", user.uid))
      .then((snap) => {
        if (!cancelado) setIsAdmin(snap.exists());
      })
      .catch((err) => {
        console.error("Comprobación admin fallida:", err);
      });
    return () => { cancelado = true; };
  }, []);

  return { dataLoaded, loadTimedOut };
}
