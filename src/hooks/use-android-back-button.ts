import { useCallback, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { useAppStore } from "../services/store";
import { hapticBackClose } from "../services/haptics";
import {
  handleAndroidBackButton,
  type AdminMode,
  type AndroidBackButtonSnapshot,
} from "../logic/android-back-button";

/**
 * Parámetros del hook `useAndroidBackButton`.
 *
 * El hook recibe los estados de los diálogos y vistas temporales que `App`
 * mantiene como `useState`, más los setters para poder cerrarlos desde el
 * listener físico de Android. Los datos que ya viven en el store global
 * (`screen`, `goBack`, `resetNavigation`) se leen directamente desde Zustand
 * dentro del callback, para no reintroducirlos como dependencias del
 * `useEffect` y forzar re-registros del listener.
 */
export interface UseAndroidBackButtonParams {
  adminMode: AdminMode;
  setAdminMode: (mode: AdminMode) => void;
  confirmDialogOpen: boolean;
  // Estos tres diálogos solo se cierran desde el botón Atrás (se ponen a
  // `null`); el hook nunca necesita su valor concreto, así que se tipan como
  // "setter de cierre" en vez de exponer su tipo de dominio.
  setConfirmDialog: (value: null) => void;
  editEntryOpen: boolean;
  setEditEntry: (value: null) => void;
  endFieldOpen: boolean;
  setEndField: (value: null) => void;
  showBackupMenu: boolean;
  setShowBackupMenu: (val: boolean) => void;
  showMonthPicker: boolean;
  setShowMonthPicker: (val: boolean) => void;
  showNotaDialog: boolean;
  setShowNotaDialog: (val: boolean) => void;
  showReservaDialog: boolean;
  setShowReservaDialog: (val: boolean) => void;
}

/**
 * Registra el listener del botón físico "Atrás" de Android (vía plugin
 * `@capacitor/app`) y mantiene un snapshot del estado de la app para que
 * `handleAndroidBackButton` pueda decidir qué cerrar.
 *
 * Devuelve `registerLocalAndroidBackHandler`, una función que las pantallas
 * concretas pueden usar para instalar un handler local que se evalúa
 * **antes** que la lógica global (p. ej. cerrar un modal específico).
 *
 * El hook es no-op en plataformas no nativas.
 */
export function useAndroidBackButton({
  adminMode,
  setAdminMode,
  confirmDialogOpen,
  setConfirmDialog,
  editEntryOpen,
  setEditEntry,
  endFieldOpen,
  setEndField,
  showBackupMenu,
  setShowBackupMenu,
  showMonthPicker,
  setShowMonthPicker,
  showNotaDialog,
  setShowNotaDialog,
  showReservaDialog,
  setShowReservaDialog,
}: UseAndroidBackButtonParams) {
  const screen = useAppStore((s) => s.screen);

  // El snapshot se inicializa una vez y se reasigna directamente en cada
  // render. Mantenerlo fuera de un `useEffect` con dependencias garantiza
  // que el listener —registrado una sola vez— siempre vea el estado actual.
  const androidBackButtonSnapshotRef = useRef<AndroidBackButtonSnapshot>({
    adminMode,
    confirmDialogOpen,
    editEntryOpen,
    endFieldOpen,
    screen,
    showBackupMenu,
    showMonthPicker,
    showNotaDialog,
    showReservaDialog,
  });

  const localAndroidBackHandlerRef = useRef<(() => boolean) | null>(null);

  const registerLocalAndroidBackHandler = useCallback(
    (handler: () => boolean) => {
      localAndroidBackHandlerRef.current = handler;
      return () => {
        if (localAndroidBackHandlerRef.current === handler) {
          localAndroidBackHandlerRef.current = null;
        }
      };
    },
    [],
  );

  // Reasignación en cada render: el listener se mantiene vivo, pero el
  // snapshot refleja siempre el último estado.
  androidBackButtonSnapshotRef.current = {
    adminMode,
    confirmDialogOpen,
    editEntryOpen,
    endFieldOpen,
    screen,
    showBackupMenu,
    showMonthPicker,
    showNotaDialog,
    showReservaDialog,
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    let cancelado = false;

    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          // 1) Handler local (si la pantalla actual ha instalado uno).
          if (localAndroidBackHandlerRef.current?.()) {
            void hapticBackClose();
            return;
          }
          // 2) Lógica global pura, con lectura fresca del store.
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
            closeBackupMenu: () => setShowBackupMenu(false),
            closeConfirmDialog: () => setConfirmDialog(null),
            closeEditEntry: () => setEditEntry(null),
            closeEndField: () => setEndField(null),
            closeMonthPicker: () => setShowMonthPicker(false),
            closeNotaDialog: () => setShowNotaDialog(false),
            closeReservaDialog: () => setShowReservaDialog(false),
            exitApp: () => {
              void CapApp.exitApp();
            },
            goBack: state.goBack,
            hapticBackClose,
            resetNavigation: state.resetNavigation,
            setAdminMode,
          });
        }),
      )
      .then((handle) => {
        if (cancelado) handle.remove();
        else remove = () => handle.remove();
      })
      .catch((err) => console.error("backButton listener fallido:", err));

    return () => {
      cancelado = true;
      remove?.();
    };
    // Las dependencias son solo setters: sus referencias son estables mientras
    // el componente que las creó no se re-renderice con setters nuevos. La
    // lectura del store vía `getState()` evita acoplar el listener al estado
    // cambiante de la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setAdminMode,
    setConfirmDialog,
    setEditEntry,
    setEndField,
    setShowBackupMenu,
    setShowMonthPicker,
    setShowNotaDialog,
    setShowReservaDialog,
  ]);

  return { registerLocalAndroidBackHandler };
}
