import { create } from "zustand";
import type {
  AppSettings,
  CurrentState,
  NotaCalendario,
  Reserva,
  Turno,
  WeekOverride,
} from "../shared/types";
import {
  loadCurrent,
  loadHistory,
  loadNotes,
  loadReservations,
  loadSettings,
  loadWeekOverrides,
} from "../logic/state-loaders";

/**
 * Store global de la aplicación (Zustand v5).
 *
 * Diseño:
 *  - Slice de NEGOCIO: los 6 dominios (current, history, reservations, notes,
 *    settings, weekOverrides) + flags de sincronización (dataLoaded, loadTimedOut)
 *    + isAdmin.
 *  - Slice de NAVEGACIÓN: separado conceptualmente (screen + navigationStack +
 *    setScreen/goBack/resetNavigation) para no acoplar navegación con datos.
 *
 * Los setters imitan la firma de React `Dispatch<SetStateAction<T>>`
 * (aceptan un valor o una función updater) para poder migrar `App` y
 * `useFirestoreSync` SIN reescribir las ~3000 líneas que ya consumen
 * `setCurrent(prev => ...)`, `setHistory(...)`, etc.
 */

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(prev: T, value: Updater<T>): T {
  return typeof value === "function" ? (value as (p: T) => T)(prev) : value;
}

// --- Slice de negocio ---------------------------------------------------------
interface BusinessSlice {
  current: CurrentState;
  history: Turno[];
  reservations: Reserva[];
  notes: NotaCalendario[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];

  dataLoaded: boolean;
  loadTimedOut: boolean;
  isAdmin: boolean;

  setCurrent: (value: Updater<CurrentState>) => void;
  setHistory: (value: Updater<Turno[]>) => void;
  setReservations: (value: Updater<Reserva[]>) => void;
  setNotes: (value: Updater<NotaCalendario[]>) => void;
  setSettings: (value: Updater<AppSettings>) => void;
  setWeekOverrides: (value: Updater<WeekOverride[]>) => void;

  setDataLoaded: (value: Updater<boolean>) => void;
  setLoadTimedOut: (value: Updater<boolean>) => void;
  setIsAdmin: (value: Updater<boolean>) => void;
}

// --- Slice de navegación ------------------------------------------------------
interface NavigationSlice {
  screen: string;
  navigationStack: string[];
  /** Navega a una pantalla apilándola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Sustituye la pantalla actual sin crear una nueva entrada de historial. */
  replaceScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raíz. */
  goBack: () => boolean;
  /** Reinicia la navegación a una pantalla raíz (p. ej. al hacer login/logout). */
  resetNavigation: (root?: string) => void;
}

export type AppStore = BusinessSlice & NavigationSlice;

const INITIAL_SCREEN = "home";

export const useAppStore = create<AppStore>((set, get) => ({
  // --- negocio: estado inicial leído de localStorage (igual que antes) ---
  current: loadCurrent(),
  history: loadHistory(),
  reservations: loadReservations(),
  notes: loadNotes(),
  settings: loadSettings(),
  weekOverrides: loadWeekOverrides(),

  dataLoaded: false,
  loadTimedOut: false,
  isAdmin: false,

  setCurrent: (value) => set((s) => ({ current: resolve(s.current, value) })),
  setHistory: (value) => set((s) => ({ history: resolve(s.history, value) })),
  setReservations: (value) =>
    set((s) => ({ reservations: resolve(s.reservations, value) })),
  setNotes: (value) => set((s) => ({ notes: resolve(s.notes, value) })),
  setSettings: (value) => set((s) => ({ settings: resolve(s.settings, value) })),
  setWeekOverrides: (value) =>
    set((s) => ({ weekOverrides: resolve(s.weekOverrides, value) })),

  setDataLoaded: (value) => set((s) => ({ dataLoaded: resolve(s.dataLoaded, value) })),
  setLoadTimedOut: (value) =>
    set((s) => ({ loadTimedOut: resolve(s.loadTimedOut, value) })),
  setIsAdmin: (value) => set((s) => ({ isAdmin: resolve(s.isAdmin, value) })),

  // --- navegación ---
  screen: INITIAL_SCREEN,
  navigationStack: [INITIAL_SCREEN],

  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  replaceScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      const stack = s.navigationStack.length > 0 ? [...s.navigationStack] : [s.screen];
      stack[stack.length - 1] = next;
      if (stack.length > 1 && stack[stack.length - 2] === next) {
        stack.pop();
      }
      return { screen: next, navigationStack: stack };
    }),

  goBack: () => {
    const { navigationStack } = get();
    if (navigationStack.length <= 1) return false;
    const stack = navigationStack.slice(0, -1);
    set({ screen: stack[stack.length - 1], navigationStack: stack });
    return true;
  },

  resetNavigation: (root = INITIAL_SCREEN) =>
    set({ screen: root, navigationStack: [root] }),
}));
