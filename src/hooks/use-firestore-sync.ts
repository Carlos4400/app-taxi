import { useEffect, useRef } from "react";
import { onSnapshot, doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { useAppStore } from "../services/store";
import { auth, db } from "../services/firebase";
import {
  userMetaDocRef,
  userSubcollectionRef,
  saveUserDoc,
  syncSubcollection,
  userHasFirestoreData,
} from "../services/firestore-sync";
import { writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import { ensureTurnosDiaLibreContable, sortTurnosByDateDesc } from "../logic/turnos";
import type { CurrentState, AppSettings, Turno, Reserva, NotaCalendario, WeekOverride } from "../shared/types";

const LOCAL_MIGRATION_KEY = "taxi_migration_done_v2";
const LOAD_TIMEOUT_MS = 15000;

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

  const current = currentRaw ? JSON.parse(currentRaw) as CurrentState : null;
  const history = historyRaw ? JSON.parse(historyRaw) as Turno[] : [];
  const settings = settingsRaw ? JSON.parse(settingsRaw) as AppSettings : null;
  const weekOverrides = weekOverridesRaw ? JSON.parse(weekOverridesRaw) as WeekOverride[] : [];
  const reservations = reservationsRaw ? JSON.parse(reservationsRaw) as Reserva[] : [];
  const notes = notesRaw ? JSON.parse(notesRaw) as NotaCalendario[] : [];

  const docPromises: Promise<unknown>[] = [];
  if (current) docPromises.push(setDoc(userMetaDocRef(db, uid, "current"), current));
  if (settings) docPromises.push(setDoc(userMetaDocRef(db, uid, "settings"), settings));

  function subirSubcoleccion<T>(coll: string, items: T[], getId: (it: T) => string | number) {
    for (let i = 0; i < items.length; i += 400) {
      const slice = items.slice(i, i + 400);
      const batch = writeBatch(db);
      for (const item of slice) {
        batch.set(doc(db, "users", uid, coll, String(getId(item))), item as any);
      }
      docPromises.push(batch.commit());
    }
  }

  subirSubcoleccion("turnos", history, (t) => t.id);
  subirSubcoleccion("reservations", reservations, (r) => r.id);
  subirSubcoleccion("notes", notes, (n) => n.id);
  subirSubcoleccion("weekOverrides", weekOverrides, (w) => w.weekId);

  await Promise.all(docPromises);

  localStorage.removeItem(KEY_CURRENT);
  localStorage.removeItem(KEY_HISTORY);
  localStorage.removeItem(KEY_SETTINGS);
  localStorage.removeItem(KEY_WEEK_OVERRIDES);
  localStorage.removeItem(KEY_RESERVATIONS);
  localStorage.removeItem(KEY_NOTES);

  localStorage.setItem(LOCAL_MIGRATION_KEY, JSON.stringify({
    uid, at: new Date().toISOString(), migrado: true,
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

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    if (JSON.stringify(settings) === JSON.stringify(lastSettingsRef.current)) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_SETTINGS, settings);
    saveUserDoc(db, uid, "settings", settings).catch((err) =>
      console.error("Save settings failed:", err)
    );
  }, [settings, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
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
    if (!dataLoaded || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_RESERVATIONS, reservations);
    syncSubcollection(db, uid, "reservations", lastReservationsRef.current, reservations, (r) => r.id)
      .then(() => { lastReservationsRef.current = reservations; })
      .catch((err) => console.error("Sync reservations failed:", err));
  }, [reservations, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_NOTES, notes);
    syncSubcollection(db, uid, "notes", lastNotesRef.current, notes, (n) => n.id)
      .then(() => { lastNotesRef.current = notes; })
      .catch((err) => console.error("Sync notes failed:", err));
  }, [notes, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_WEEK_OVERRIDES, weekOverrides);
    syncSubcollection(db, uid, "weekOverrides", lastWeekOverridesRef.current, weekOverrides, (w) => w.weekId)
      .then(() => { lastWeekOverridesRef.current = weekOverrides; })
      .catch((err) => console.error("Sync weekOverrides failed:", err));
  }, [weekOverrides, dataLoaded]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;

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
          const data = snap.data() as CurrentState;
          lastCurrentRef.current = data;
          writeUserLocalJSON(uid, KEY_CURRENT, data);
          setCurrent(data);
        } else {
          lastCurrentRef.current = null;
        }
        marcar("current");
      }));

      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "settings"), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          lastSettingsRef.current = data;
          writeUserLocalJSON(uid, KEY_SETTINGS, data);
          setSettings(data);
        }
        marcar("settings");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, orderedItems);
        setHistory(orderedItems);
        marcar("turnos");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, items);
        setReservations(items);
        marcar("reservations");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "notes"), (snap) => {
        const items: NotaCalendario[] = [];
        snap.forEach((d) => items.push(d.data() as NotaCalendario));
        lastNotesRef.current = items;
        writeUserLocalJSON(uid, KEY_NOTES, items);
        setNotes(items);
        marcar("notes");
      }));

      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "weekOverrides"), (snap) => {
        const items: WeekOverride[] = [];
        snap.forEach((d) => items.push(d.data() as WeekOverride));
        lastWeekOverridesRef.current = items;
        writeUserLocalJSON(uid, KEY_WEEK_OVERRIDES, items);
        setWeekOverrides(items);
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
