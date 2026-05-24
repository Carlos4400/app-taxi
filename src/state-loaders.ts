import type { AppSettings, Entry, NotaCalendario, Reserva, Turno } from "./main";
import { readLocalJSON } from "./user-storage";
import {
  KEY_CURRENT,
  KEY_HISTORY,
  KEY_NOTES,
  KEY_RESERVATIONS,
  KEY_SETTINGS,
  KEY_WEEK_OVERRIDES,
} from "./storage-keys";
import { sortTurnosByDateDesc } from "./turnos";

type LoadedCurrentState = {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
};

type LoadedWeekOverride = {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
};

export function loadSettings(): AppSettings {
  const defaults: AppSettings = {
    "porcentaje.jefe": 0,
    "porcentaje.chofer": 0,
    "descontar.datafono": true,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,
    diaLibreDesde: null,
  };
  try {
    const d = readLocalJSON<Partial<AppSettings>>(KEY_SETTINGS);
    if (d) {
      return { ...defaults, ...d };
    }
  } catch (e) { }
  return defaults;
}

export function loadCurrent(): LoadedCurrentState {
  try {
    const d = readLocalJSON<LoadedCurrentState>(KEY_CURRENT);
    if (d) {
      return {
        ...d,
        isPaused: d.isPaused || false,
        pauseStartTime: d.pauseStartTime || null,
        totalPausedMinutes: d.totalPausedMinutes || 0,
      };
    }
  } catch (e) { }
  return { entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 };
}

export function loadHistory(): Turno[] {
  try {
    const d = readLocalJSON<Turno[]>(KEY_HISTORY);
    if (Array.isArray(d)) return sortTurnosByDateDesc(d);
  } catch (e) { }
  return [];
}

export function loadReservations(): Reserva[] {
  try {
    const d = readLocalJSON<Reserva[]>(KEY_RESERVATIONS);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

export function loadNotes(): NotaCalendario[] {
  try {
    const d = readLocalJSON<NotaCalendario[]>(KEY_NOTES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

export function loadWeekOverrides(): LoadedWeekOverride[] {
  try {
    const d = readLocalJSON<LoadedWeekOverride[]>(KEY_WEEK_OVERRIDES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}
