import React from "react";
import ReactDOM from "react-dom/client";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

import { Capacitor } from "@capacitor/core";

import { signOut } from "firebase/auth";
import { auth } from "./services/firebase";
import { AuthGate } from "./screens/auth-gate";
import { useFirestoreSync } from "./hooks/use-firestore-sync";
import { useAppStore } from "./services/store";
import { registerServiceWorker } from "./services/service-worker-registration";
import { hapticAction } from "./services/haptics";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "./components/entry-icons";
import {
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
import { IconTimer, IconMoneyBag, IconPencilNeon } from "./components/calendar-icons";
import { IconRocket } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
import { CalendarScreen } from "./screens/calendar-screen";
import { HomeScreen } from "./screens/home-screen";
import { SummaryScreen } from "./screens/summary-screen";
import { EditTurnoScreen } from "./screens/edit-turno-screen";
import { SettingsScreen } from "./screens/settings-screen";
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { IconPlay, IconPause } from "./components/turno-control-icons";
import { AddSingleEntryScreen } from "./screens/add-single-entry-screen";
import { AddNotaGeneralScreen } from "./screens/add-nota-general-screen";
import { AddEntryScreen } from "./screens/add-entry-screen";
import { PantallaTurnos } from "./screens/pantalla-turnos";
import { TodayHistoryScreen } from "./screens/today-history-screen";
import { ConfirmEndScreen } from "./screens/confirm-end-screen";
import { ContabilidadScreen } from "./screens/contabilidad-screen";
import { DetalleAnualScreen } from "./screens/detalle-anual-screen";
import { DetalleMesScreen } from "./screens/detalle-mes-screen";
import { DetalleSemanaScreen } from "./screens/detalle-semana-screen";
import { LiquidacionSemanaScreen } from "./screens/liquidacion-semana-screen";

import { Shell } from "./components/shell";
import type { UpdateState } from "./logic/update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./logic/backup";
import {
  ensureTurnosDiaLibreContable,
  getTurnosByCalendarMonth,
  getTurnosByCalendarYear,
  mergeTurnos,
  sortTurnosByDateDesc,
} from "./logic/turnos";
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./shared/action-ids";
import { getTurnosNotasSemana } from "./logic/turno-notas-logic";
import { updateTurnoEntrega } from "./logic/turno-entrega";
import { getAccountingPeriodLabel } from "./logic/date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./shared/card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./logic/date-time";
import { A, ABG, C, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "./shared/ui-theme";
import type {
  EditTurnoState,
  Entry,
  NotaCalendario,
  NotaTipo,
  Reserva,
  Turno,
  WeekOverride,
} from "./shared/types";
import {
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  selectAccountingHeroWeek,
} from "./logic/week-logic";
import {
  buildTurnoConfigFromSettings,
  calcularResumenContableTurnos,
  calcularTotalesTurnos,
  calcularTurnoContable,
  getTurnoConfig,
} from "./logic/accounting";
import { AdminListScreen, AdminUserView } from "./screens/admin-screens";

export { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./logic/formatters";
export { buildBackupPayload, buildBackupPayloadFromState };
export {
  ensureTurnosDiaLibreContable,
  getTurnosByCalendarMonth,
  getTurnosByCalendarYear,
  mergeTurnos,
  sortTurnosByDateDesc,
};
export { parseCSVLine, parseCSVToHistory } from "./logic/csv";
export { getBackupMenuActionIds, getHomeQuickActionIds };
export type { BackupMenuActionId, HomeQuickActionId } from "./shared/action-ids";
export { getTurnosNotasSemana };
export { updateTurnoEntrega };
export { getAccountingPeriodLabel };
export { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES };
export type {
  AppSettings,
  CurrentState,
  EditTurnoState,
  Entry,
  NotaCalendario,
  NotaTipo,
  Reserva,
  Turno,
  TurnoConfig,
  TurnoNotasSemana,
  WeekOverride,
} from "./shared/types";
export {
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  selectAccountingHeroWeek,
};
export {
  buildTurnoConfigFromSettings,
  calcularResumenContableTurnos,
  calcularTotalesTurnos,
  calcularTurnoContable,
  getTurnoConfig,
};

const { useState, useEffect, useRef } = React;

type EntryTypeMeta = {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const reservaInputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 14,
  color: "white",
  padding: "13px 14px",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box" as const,
};

const reservaFieldGroupStyle = {
  marginLeft: 10,
  paddingLeft: 12,
  borderLeft: `1px solid ${C}55`,
};

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};

function App({ uid }: { uid: string }) {
  // Estado de negocio centralizado en el store global (Zustand). Se mantienen
  // los mismos nombres de variables/setters que cuando eran useState locales
  // para no alterar el resto del componente.
  const current = useAppStore((s) => s.current);
  const setCurrent = useAppStore((s) => s.setCurrent);
  const history = useAppStore((s) => s.history);
  const setHistory = useAppStore((s) => s.setHistory);
  const reservations = useAppStore((s) => s.reservations);
  const setReservations = useAppStore((s) => s.setReservations);
  const notes = useAppStore((s) => s.notes);
  const setNotes = useAppStore((s) => s.setNotes);
  const [calendarView, setCalendarView] = useState<'month' | 'agenda'>('month');
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const [showReservaDialog, setShowReservaDialog] = useState(false);
  const [showNotaDialog, setShowNotaDialog] = useState(false);
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null);
  const [editingNota, setEditingNota] = useState<NotaCalendario | null>(null);

  // Campos formulario Reserva
  const [reservaTime, setReservaTime] = useState("");
  const [reservaOrigen, setReservaOrigen] = useState("");
  const [reservaDestino, setReservaDestino] = useState("");
  const [reservaCliente, setReservaCliente] = useState("");
  const [reservaTelefono, setReservaTelefono] = useState("");
  const [reservaNotas, setReservaNotas] = useState("");

  // Campos formulario Nota
  const [notaTipo, setNotaTipo] = useState<NotaTipo>('Normal');
  const [notaTexto, setNotaTexto] = useState("");

  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [isSelectingTurnos, setIsSelectingTurnos] = useState(false);
  const [selectedTurnosIds, setSelectedTurnosIds] = useState<number[]>([]);
  // Navegación gestionada por el slice de navegación del store (stack + back).
  const screen = useAppStore((s) => s.screen);
  const setScreen = useAppStore((s) => s.setScreen);
  const [returnScreen, setReturnScreen] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const [viewTurno, setViewTurno] = useState<Turno | null>(null);
  const [activeField, setActiveField] = useState("datafono");
  const [valP, setValP] = useState("");
  const [valD, setValD] = useState("");
  const [noteP, setNoteP] = useState("");
  const [noteD, setNoteD] = useState("");
  const [singleMode, setSingleMode] = useState<string | null>(null);
  const [valS, setValS] = useState("");
  const [noteS, setNoteS] = useState("");
  const [dineroJ, setDineroJ] = useState("");
  const [kmJ, setKmJ] = useState("");
  const [endField, setEndField] = useState<"dinero" | "km" | null>(null);
  const [notesJ, setNotesJ] = useState("");
  const [activeSettingsField, setActiveSettingsField] = useState<"porcentaje.jefe" | "porcentaje.chofer" | null>(null);
  const [settingsValStr, setSettingsValStr] = useState("");


  const [editJ, setEditJ] = useState<EditTurnoState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  } | null>(null);
  const [updateMsg, setUpdateMsg] = useState("");
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [releaseUrl, setReleaseUrl] = useState("");
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editEntryAmount, setEditEntryAmount] = useState("");
  const [editEntryNote, setEditEntryNote] = useState("");
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const weekOverrides = useAppStore((s) => s.weekOverrides);
  const setWeekOverrides = useAppStore((s) => s.setWeekOverrides);

  // Estados Contabilidad (Fase 5)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedAccountingYear, setSelectedAccountingYear] = useState<number>(() => new Date().getFullYear());
  const [selectedAccountingMonth, setSelectedAccountingMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [tieResolutions, setTieResolutions] = useState<Map<string, string>>(new Map());
  const [pendingTie, setPendingTie] = useState<{
    weekId: string;
    candidates: { mesId: string; mesLabel: string }[];
  } | null>(null);

  // Estados Detalle de Semana (Fase 6)

  // Sincronización con Firestore.
  //   - dataLoaded: cuando vale true, la app ya ha recibido el primer snapshot
  //     de las 6 colecciones del usuario actual. Hasta entonces NO escribimos
  //     (evitamos pisar Firestore con estado inicial vacío en un dispositivo nuevo).
  //   - loadTimedOut: si la carga inicial tarda más de LOAD_TIMEOUT_MS, lo
  //     ponemos a true para mostrar al usuario botones de Reintentar / Cerrar
  //     sesión y que no quede atrapado en "Cargando tus datos…".
  //   - last*Ref: copia de lo último que recibimos de Firestore. La usamos como
  //     baseline para hacer diffs y mandar solo lo que cambió.

  // Vista de administrador.
  //   - isAdmin: true si existe el documento admins/{uid_actual} en Firestore.
  //     Se lee UNA VEZ al montar la app. El admin se concede manualmente
  //     desde Firebase Console (ver firestore.rules: la colección admins/ es
  //     de escritura denegada, solo se gestiona desde la consola).
  //   - adminMode: null → vista normal del propio usuario.
  //                "list" → pantalla con la lista de usuarios.
  //                { uid, username } → pantalla de SOLO LECTURA de ese usuario.
  const isAdmin = useAppStore((s) => s.isAdmin);
  const [adminMode, setAdminMode] = useState<null | "list" | { uid: string; username: string }>(null);

  // Sincronización con Firestore (carga inicial, escritura reactiva, migración
  // de localStorage y detección de rol admin), encapsulada en src/hooks/use-firestore-sync.ts.
  const { dataLoaded, loadTimedOut } = useFirestoreSync(uid);

  // Botón físico de retroceso de Android (Capacitor). Recorre el stack de
  // navegación; si ya está en la raíz, cierra la app. Solo en plataforma nativa.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelado = false;
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          if (state.screen === "main") {
            state.resetNavigation("home");
            return;
          }
          const navego = state.goBack();
          if (!navego) CapApp.exitApp();
        })
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
  }, []);

  // Helper: actualiza o crea un override para una semana
  function updateWeekOverride(weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) {
    setWeekOverrides((prev) => {
      const existing = prev.find((o) => o.weekId === weekId);
      if (existing) {
        return prev.map((o) =>
          o.weekId === weekId
            ? { ...o, ...partial }
            : o
        );
      } else {
        return [
          ...prev,
          {
            weekId,
            notes: partial.notes ?? "",
            entregada: partial.entregada ?? false,
            fechaEntrega: partial.fechaEntrega ?? null,
          },
        ];
      }
    });
  }

  function openEditEntry(e: Entry) {
    setEditEntry(e);
    setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
    setEditEntryNote(e.note || "");
  }

  function saveEditEntry() {
    if (!editEntry) return;
    const amt = parseFloat(editEntryAmount.replace(",", "."));
    if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
      alert("El importe debe ser un número mayor que 0.");
      return;
    }
    const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
    setCurrent((prev) => ({
      ...prev,
      entries: prev.entries.map((x) =>
        x.id === editEntry.id ? updated : x
      ),
    }));
    setEditEntry(null);
  }

  function deleteEditEntry() {
    if (!editEntry) return;
    setCurrent((prev) => ({
      ...prev,
      entries: prev.entries.filter((x) => x.id !== editEntry.id),
    }));
    setEditEntry(null);
  }

  async function exportSelectedTurnosJSON() {
    if (selectedTurnosIds.length === 0) {
      alert("No has seleccionado ningún turno.");
      return;
    }

    // Filtramos el historial para quedarnos solo con los seleccionados
    const turnosAExportar = history.filter(t => selectedTurnosIds.includes(t.id));

    // Creamos un paquete JSON solo con esos turnos (sin ajustes, para no sobreescribir configuraciones en otro móvil)
    const backup = {
      history: JSON.stringify(turnosAExportar)
    };

    const json = JSON.stringify(backup, null, 2);
    const fileName = `taxi_turnos_seleccionados_${new Date().toISOString().split("T")[0]}.json`;

    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: "Exportar turnos",
        text: "Turnos seleccionados",
        url: result.uri,
        dialogTitle: "Compartir / Guardar JSON",
      });

      // Salimos del modo selección tras exportar
      setIsSelectingTurnos(false);
      setSelectedTurnosIds([]);
    } catch (e) {
      console.error("exportSelectedTurnosJSON error:", e);
      alert("No se pudo exportar el archivo.");
    }
  }

  // Detección automática de nuevas versiones vía Service Worker.
  // El SW comprueba el manifest periódicamente y nos manda un postMessage
  // cuando la versión cambia; aquí lo recibimos y mostramos el aviso.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (isLocalDev) return;

    let cancelado = false;
    let updateFoundCleanup: (() => void) | null = null;
    const stateChangeCleanups: Array<() => void> = [];

    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "NEW_VERSION") {
        setUpdateMsg(`¡Nueva versión ${e.data.version} disponible! Recarga para actualizar.`);
      }
    };
    const onUpdateFound = (reg: ServiceWorkerRegistration) => {
      const newSW = reg.installing;
      if (!newSW) return;
      const onStateChange = () => {
        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateMsg("Nueva versión disponible. Recarga para actualizar.");
        }
      };
      newSW.addEventListener("statechange", onStateChange);
      stateChangeCleanups.push(() => newSW.removeEventListener("statechange", onStateChange));
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelado) return;
      const onRegUpdateFound = () => onUpdateFound(reg);
      reg.addEventListener("updatefound", onRegUpdateFound);
      updateFoundCleanup = () => {
        reg.removeEventListener("updatefound", onRegUpdateFound);
      };
    });
    return () => {
      cancelado = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      updateFoundCleanup?.();
      stateChangeCleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  const active = current.entries.length > 0 || !!current.startTime;
  const endingTurnoRef = useRef(false);

  useEffect(() => {
    if (active) endingTurnoRef.current = false;
  }, [active]);

  // Mientras llegan las primeras respuestas de Firestore para este usuario,
  // mostramos un placeholder de carga. Esto evita que la UI parezca vacía y,
  // sobre todo, evita que el usuario pueda crear/editar antes de tener su
  // historial cargado (lo cual provocaría diffs incorrectos).
  if (!dataLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "oklch(0.14 0.02 260)",
          color: "oklch(0.92 0.02 260)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 16 }}>
          {loadTimedOut ? "Esto está tardando más de lo normal." : "Cargando tus datos…"}
        </div>
        {loadTimedOut && (
          <>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.45, maxWidth: 320 }}>
              No hemos podido contactar con el servidor. Comprueba tu conexión a internet y vuelve a intentarlo.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "14px 0",
                  borderRadius: 14,
                  border: `2px solid ${G}`,
                  background: GBG,
                  color: G,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
              <button
                onClick={() => {
                  signOut(auth).catch((err) => {
                    console.error("signOut error:", err);
                  });
                }}
                style={{
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 95, 95, 0.28)",
                  background: "rgba(255, 95, 95, 0.08)",
                  color: "rgba(255, 130, 130, 0.9)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Pantallas exclusivas del administrador. Se renderizan INSTEAD OF la app
  // normal, no encima. Al pulsar "Volver" se restaura adminMode = null y
  // vuelve a aparecer la home del propio admin.
  if (adminMode === "list") {
    return (
      <AdminListScreen
        onBack={() => setAdminMode(null)}
        onSelect={(uid, username) => setAdminMode({ uid, username })}
      />
    );
  }
  if (adminMode && typeof adminMode === "object") {
    return (
      <AdminUserView
        uid={adminMode.uid}
        username={adminMode.username}
        onBack={() => setAdminMode("list")}
      />
    );
  }

  const propinas = current.entries.filter((e) => e.type === "propina");
  const datafonos = current.entries.filter((e) => e.type === "datafono");
  const agencias = current.entries.filter((e) => e.type === "agencia_bono");
  const extras = current.entries.filter((e) => e.type === "extra");
  const gasolinas = current.entries.filter((e) => e.type === "gasolina");
  const nulos = current.entries.filter((e) => e.type === "nulo");
  const totalP = propinas.reduce((s, e) => s + e.amount, 0);
  const totalD = datafonos.reduce((s, e) => s + e.amount, 0);
  const totalA = agencias.reduce((s, e) => s + e.amount, 0);
  const totalE = extras.reduce((s, e) => s + e.amount, 0);
  const totalF = gasolinas.reduce((s, e) => s + e.amount, 0);
  const totalN = nulos.reduce((s, e) => s + e.amount, 0);

  function togglePause() {
    hapticAction();
    const now = timeNow();
    setCurrent((prev) => {
      if (prev.isPaused) {
        // Reanudar turno: calcular minutos pausados y sumarlos
        const pauseMins = prev.pauseStartTime ? getDiffMins(prev.pauseStartTime, now) : 0;
        return {
          ...prev,
          isPaused: false,
          pauseStartTime: null,
          totalPausedMinutes: (prev.totalPausedMinutes || 0) + pauseMins,
        };
      } else {
        // Pausar turno
        return {
          ...prev,
          isPaused: true,
          pauseStartTime: now,
        };
      }
    });
  }

  function handleEndTurno() {
    if (endingTurnoRef.current || !active) return;
    endingTurnoRef.current = true;
    const turno = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: current.entries,
      totalP,
      totalD,
      totalA,
      totalE,
      totalF,
      totalN,
      dinero: parseFloat(dineroJ.replace(",", ".")) || 0,
      km: parseFloat(kmJ.replace(",", ".")) || 0,
      notes: notesJ.trim(),
      startDate: current.startDate,
      totalPausedMinutes: current.totalPausedMinutes || 0,
      configTurno: buildTurnoConfigFromSettings(settings),
      diaLibreContable: settings.diaLibre,
    };
    setHistory((h) => mergeTurnos(h, [turno]));
    setCurrent({ entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 });
    setDineroJ("");
    setKmJ("");
    setNotesJ("");
    setViewTurno(turno);
    // Tras cerrar el turno, el recorrido de navegación queda como
    // PantallaTurnos -> summary, de modo que el botón "atrás" desde el
    // resumen lleve a la lista de turnos (como si se hubiera abierto desde
    // ahí), nunca de vuelta a la pantalla de confirmar cierre.
    useAppStore.getState().resetNavigation("PantallaTurnos");
    setScreen("summary");
  }

  const S = {
    iconBtn: {
      background: "rgba(255,255,255,0.06)",
      border: "none",
      borderRadius: 12,
      padding: 10,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
    },
    keyBtn: {
      border: "none",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    dangerBtn: {
      padding: "16px 0",
      borderRadius: 18,
      border: "none",
      background: "rgba(255,60,60,0.1)",
      color: "rgba(255,80,80,0.7)",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      marginTop: 10,
    },
    backupSubBtn: {
      width: "100%",
      padding: "14px 18px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.8)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 12,
      textAlign: "left" as const
    },
  };

  // --- Handlers globales del modal de Reserva (accesibles desde cualquier pantalla) ---
  const openNewReserva = (date?: string) => {
    setEditingReserva(null);
    setSelectedDate(date || "");
    setReservaTime("");
    setReservaOrigen("");
    setReservaDestino("");
    setReservaCliente("");
    setReservaTelefono("");
    setReservaNotas("");
    setShowReservaDialog(true);
  };

  const saveReserva = () => {
    if (!selectedDate || !reservaTime || !reservaOrigen || !reservaDestino || !reservaCliente || !reservaTelefono) {
      alert("Por favor rellena todos los campos obligatorios.");
      return;
    }
    if (editingReserva) {
      setReservations(prev => prev.map(r => r.id === editingReserva.id ? {
        ...r,
        date: selectedDate,
        time: reservaTime,
        origen: reservaOrigen,
        destino: reservaDestino,
        cliente: reservaCliente,
        telefono: reservaTelefono,
        notas: reservaNotas
      } : r));
    } else {
      const newRes: Reserva = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        date: selectedDate,
        time: reservaTime,
        origen: reservaOrigen,
        destino: reservaDestino,
        cliente: reservaCliente,
        telefono: reservaTelefono,
        notas: reservaNotas
      };
      setReservations(prev => [...prev, newRes]);
    }
    setShowReservaDialog(false);
  };

  const renderReservaLabel = (primary: string, secondary: string, required = false) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
        {primary}{required ? " *" : ""}
      </div>
      {secondary && (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.36)", marginTop: 1 }}>
          {secondary}
        </div>
      )}
    </div>
  );

  const renderReservaSection = (title: string, subtitle: string) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4, marginBottom: 2 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.34)", fontWeight: 700 }}>
        {subtitle}
      </div>
    </div>
  );

  // Renderiza el modal de Nueva/Editar Reserva. Se invoca desde cada pantalla que lo necesita.
  const renderReservaDialog = () => showReservaDialog && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Formulario Reserva"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        animation: "fadeUp 0.2s ease"
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 22,
          padding: 22,
          width: "92%",
          maxWidth: 420,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 13
        }}
      >
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C, letterSpacing: "-0.3px", textAlign: "center", textTransform: "uppercase" }}>
            {editingReserva ? "Edit booking" : "Taxi booking"}
          </div>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 4, lineHeight: 1.35, textAlign: "center" }}>
            Please fill in your booking details.
          </div>
        </div>

        {renderReservaSection("When", "")}
        <div style={{ ...reservaFieldGroupStyle, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            {renderReservaLabel("Date", "", true)}
            <input
              type="date"
              value={selectedDate}
              onClick={e => e.currentTarget.showPicker?.()}
              onChange={e => setSelectedDate(e.target.value)}
              style={reservaInputStyle}
            />
          </div>

          <div>
            {renderReservaLabel("Time", "", true)}
            <input
              type="time"
              value={reservaTime}
              onClick={e => e.currentTarget.showPicker?.()}
              onChange={e => setReservaTime(e.target.value)}
              style={reservaInputStyle}
            />
          </div>
        </div>

        {renderReservaSection("Client", "")}
        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Your name", "", true)}
          <input
            type="text"
            placeholder=""
            value={reservaCliente}
            onChange={e => setReservaCliente(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Phone number", "", true)}
          <input
            type="tel"
            placeholder=""
            value={reservaTelefono}
            onChange={e => setReservaTelefono(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        {renderReservaSection("Pickup", "")}
        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Pickup location", "Hotel, Apartments, Address or Meeting point", true)}
          <input
            type="text"
            placeholder=""
            value={reservaOrigen}
            onChange={e => setReservaOrigen(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        <div style={reservaFieldGroupStyle}>
          {renderReservaLabel("Destination", "", true)}
          <input
            type="text"
            placeholder=""
            value={reservaDestino}
            onChange={e => setReservaDestino(e.target.value)}
            style={reservaInputStyle}
          />
        </div>

        <div style={{ marginTop: 4 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Optional notes
            </div>
          </div>
          <div style={reservaFieldGroupStyle}>
            <input
              type="text"
              placeholder=""
              value={reservaNotas}
              onChange={e => setReservaNotas(e.target.value)}
              style={reservaInputStyle}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {editingReserva && (
            <button
              onClick={() => {
                const id = editingReserva.id;
                setConfirmDialog({
                  text: "¿Seguro que quieres eliminar esta reserva?",
                  onConfirm: () => {
                    setReservations(prev => prev.filter(r => r.id !== id));
                    setShowReservaDialog(false);
                  }
                });
              }}
              aria-label="Eliminar reserva"
              style={{ width: 48, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255, 100, 100, 0.3)", background: "rgba(255, 80, 80, 0.12)", color: "#ff6b6b", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
            >
              🗑️
            </button>
          )}
          <button
            onClick={() => setShowReservaDialog(false)}
            style={{ flex: 1, padding: "14px 0", borderRadius: 14, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 16, fontWeight: 800, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={saveReserva}
            style={{ flex: 1.45, padding: "12px 0", borderRadius: 14, border: "none", background: C, color: "black", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}
          >
            <span>Confirm Booking</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (screen === "home") {
    return (
      <HomeScreen
        isPaused={current.isPaused}
        isAdmin={isAdmin}
        active={active}
        onSetScreen={setScreen}
        onSetCalendarView={setCalendarView}
        onOpenNewReserva={openNewReserva}
        onSetAdminMode={setAdminMode}
        onSetConfirmDialog={setConfirmDialog}
        confirmDialog={confirmDialog}
        renderReservaDialog={renderReservaDialog}
      />
    );
  }

  if (screen === "calendar") {
    return (
      <CalendarScreen
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        calendarView={calendarView}
        setCalendarView={setCalendarView}
        showMonthPicker={showMonthPicker}
        setShowMonthPicker={setShowMonthPicker}
        pickerYear={pickerYear}
        setPickerYear={setPickerYear}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showNotaDialog={showNotaDialog}
        setShowNotaDialog={setShowNotaDialog}
        notaTipo={notaTipo}
        setNotaTipo={setNotaTipo}
        notaTexto={notaTexto}
        setNotaTexto={setNotaTexto}
        editingNota={editingNota}
        setEditingNota={setEditingNota}
        notes={notes}
        setNotes={setNotes}
        renderReservaDialog={renderReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
        setReservaTime={setReservaTime}
        setReservaOrigen={setReservaOrigen}
        setReservaDestino={setReservaDestino}
        setReservaCliente={setReservaCliente}
        setReservaTelefono={setReservaTelefono}
        setReservaNotas={setReservaNotas}
        setEditingReserva={setEditingReserva}
        reservations={reservations}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        history={history}
        settings={settings}
        openNewReserva={openNewReserva}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        isAdmin={isAdmin}
        settings={settings}
        setSettings={setSettings}
        history={history}
        setHistory={setHistory}
        current={current}
        weekOverrides={weekOverrides}
        reservations={reservations}
        notes={notes}
        activeSettingsField={activeSettingsField}
        setActiveSettingsField={setActiveSettingsField}
        settingsValStr={settingsValStr}
        setSettingsValStr={setSettingsValStr}
        showBackupMenu={showBackupMenu}
        setShowBackupMenu={setShowBackupMenu}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        updateState={updateState}
        updateMsg={updateMsg}
        downloadUrl={downloadUrl}
        releaseUrl={releaseUrl}
        setUpdateState={setUpdateState}
        setUpdateMsg={setUpdateMsg}
        setDownloadUrl={setDownloadUrl}
        setReleaseUrl={setReleaseUrl}
        onSetScreen={setScreen}
      />
    );
  }

  if (screen === 'summary' && viewTurno) {
    return (
      <SummaryScreen
        viewTurno={viewTurno}
        settings={settings}
        returnScreen={returnScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        setScreen={setScreen}
        setEditJ={setEditJ}
        setHistory={setHistory}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    );
  }
  // ── EDIT TURNO SCREEN ───────────────────────────────────────
  if (screen === 'editTurno' && editJ) {
    return (
      <EditTurnoScreen
        editJ={editJ}
        setEditJ={setEditJ}
        setHistory={setHistory}
        setViewTurno={setViewTurno}
        setScreen={setScreen}
        endField={endField}
        setEndField={setEndField}
      />
    );
  }
  if (screen === "addSingle" && singleMode) {
    return (
      <AddSingleEntryScreen
        singleMode={singleMode as "agencia_bono" | "extra" | "gasolina" | "nulo"}
        valS={valS}
        setValS={setValS}
        noteS={noteS}
        setNoteS={setNoteS}
        setCurrent={setCurrent}
        setSingleMode={setSingleMode}
        setScreen={setScreen}
      />
    );
  }

  if (screen === "addNotaGeneral") {
    return (
      <AddNotaGeneralScreen
        noteS={noteS}
        setNoteS={setNoteS}
      />
    );
  }

  if (screen === "add") {
    return (
      <AddEntryScreen
        activeField={activeField}
        setActiveField={setActiveField}
        valP={valP}
        setValP={setValP}
        valD={valD}
        setValD={setValD}
        noteP={noteP}
        setNoteP={setNoteP}
        noteD={noteD}
        setNoteD={setNoteD}
        setCurrent={setCurrent}
        setScreen={setScreen}
      />
    );
  }

  function renderTurnoCard(
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean; // For "Turnos sueltos"
      isSelecting?: boolean;
      isSelected?: boolean;
      onToggleSelect?: (checked: boolean) => void;
    }
  ) {
    let durationStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalMins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
      }
      durationStr = fmtDuration(totalMins);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGanancia = calcularTurnoContable(turno, settings).miGanancia;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {options.isSelecting && options.onToggleSelect && (
          <input
            type="checkbox"
            checked={options.isSelected}
            onChange={(e) => options.onToggleSelect!(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: "#50dc8c", cursor: "pointer" }}
          />
        )}
        <div
          onClick={options.onClick}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: options.showStatus && entregado
              ? "1px solid rgba(59, 130, 246, 0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            {options.showEntriesCount && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                {turno.entries.length} {turno.entries.length === 1 ? "entrada" : "entradas"}
              </div>
            )}
            {options.showStatus && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5, marginTop: 4 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: entregado ? G : "oklch(0.75 0.16 70)",
                  background: entregado ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
                  padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px", textTransform: "uppercase",
                }}>
                  {entregado ? "✓ Entregado" : "Pendiente"}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: E, background: EBG,
                  padding: "3px 8px", borderRadius: 6, letterSpacing: "0.5px", textTransform: "uppercase",
                }}>
                  Fuera de semana
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(taximetroTurno)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(turno.km || 0)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGanancia)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "contabilidad") {
    return (
      <ContabilidadScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedAccountingYear={selectedAccountingYear}
        selectedAccountingMonth={selectedAccountingMonth}
        setSelectedAccountingYear={setSelectedAccountingYear}
        setSelectedAccountingMonth={setSelectedAccountingMonth}
        tieResolutions={tieResolutions}
        setTieResolutions={setTieResolutions}
        pendingTie={pendingTie}
        setPendingTie={setPendingTie}
        setScreen={setScreen}
        setSelectedWeekId={setSelectedWeekId}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }


  if (screen === "detalleAnual") {
    return (
      <DetalleAnualScreen
        selectedAccountingYear={selectedAccountingYear}
        setSelectedAccountingYear={setSelectedAccountingYear}
        selectedAccountingMonth={selectedAccountingMonth}
        setSelectedAccountingMonth={setSelectedAccountingMonth}
      />
    );
  }


  if (screen === "detalleMes") {
    return (
      <DetalleMesScreen
        selectedAccountingYear={selectedAccountingYear}
        selectedAccountingMonth={selectedAccountingMonth}
        setSelectedAccountingYear={setSelectedAccountingYear}
        setSelectedAccountingMonth={setSelectedAccountingMonth}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }


  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        updateWeekOverride={updateWeekOverride}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }


  if (screen === "liquidacionSemana" && selectedWeekId) {
    return (
      <LiquidacionSemanaScreen
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        updateWeekOverride={updateWeekOverride}
      />
    );
  }


  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }

  if (screen === "todayHistory") {
    return (
      <TodayHistoryScreen
        current={current}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        editEntry={editEntry}
        editEntryAmount={editEntryAmount}
        editEntryNote={editEntryNote}
        setEditEntryAmount={setEditEntryAmount}
        setEditEntryNote={setEditEntryNote}
        openEditEntry={openEditEntry}
        saveEditEntry={saveEditEntry}
        deleteEditEntry={deleteEditEntry}
        setEditEntry={setEditEntry}
        setScreen={setScreen}
      />
    );
  }

  if (screen === "confirmEnd") {
    return (
      <ConfirmEndScreen
        current={current}
        dineroJ={dineroJ}
        setDineroJ={setDineroJ}
        kmJ={kmJ}
        setKmJ={setKmJ}
        endField={endField}
        setEndField={setEndField}
        totalP={totalP}
        totalD={totalD}
        totalA={totalA}
        totalE={totalE}
        totalF={totalF}
        totalN={totalN}
        propinas={propinas}
        datafonos={datafonos}
        agencias={agencias}
        extras={extras}
        gasolinas={gasolinas}
        nulos={nulos}
        onEndTurno={handleEndTurno}
        setScreen={setScreen}
      />
    );
  }



  return (
    <Shell burst={burst}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 20px 24px",
          overflowY: "hidden",
          minHeight: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.3px",
                lineHeight: 1.1,
              }}
            >
              🚕{" "}
              {new Date()
                .toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
                .replace(/^\w/, (c) => c.toUpperCase())}
            </div>
            {active && current.startTime && (
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 4,
                }}
              >
                {(() => {
                  const dateToUse = current.startDate || today();
                  const [d, m, y] = dateToUse.split("-").reverse();
                  return `${d}/${m}/${y} desde ${current.startTime}`;
                })()}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{
                ...S.iconBtn,
                width: 48,
                height: 48,
                padding: 0,
                justifyContent: "center",
                border: "2px solid rgba(255, 180, 0, 0.24)",
                boxShadow: "0 8px 22px rgba(255, 180, 0, 0.10)",
              }}
              onClick={() => setScreen("home")}
              title="Inicio"
              aria-label="Volver al inicio"
            >
              <IconHomeNeon s={32} />
            </button>
            {active && current.startTime && (
              <button
                style={{
                  ...S.iconBtn,
                  width: 48,
                  height: 48,
                  padding: 0,
                  justifyContent: "center",
                  background: "rgba(59, 130, 246, 0.16)",
                  border: "2px solid rgba(59, 130, 246, 0.22)",
                  boxShadow: "0 8px 22px rgba(59, 130, 246, 0.12)",
                }}
                onClick={() => {
                  if (!current.isPaused) {
                    setConfirmDialog({
                      text: "¿Seguro que quieres pausar el Turno actual?",
                      onConfirm: togglePause,
                      confirmText: "Pausar",
                      confirmBg: "rgba(0, 180, 255, 0.12)",
                      confirmColor: "rgba(0, 180, 255, 0.9)",
                      confirmBorder: "1.5px solid rgba(0, 180, 255, 0.25)"
                    });
                  } else {
                    togglePause();
                  }
                }}
                title={current.isPaused ? "Reanudar Turno" : "Pausar Turno"}
                aria-label={current.isPaused ? "Reanudar turno" : "Pausar turno"}
              >
                {current.isPaused ? <IconPlay s={38} c="#7eb6ff" /> : <IconPause s={38} c="#7eb6ff" />}
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <MainCard
            label="Datáfono"
            color={P}
            bg={PBG}
            total={totalD}
            count={datafonos.length}
            icon={<IconCard s={26} c={P} />}
            disabled={!current.startTime}
            onClick={() => {
              setActiveField("datafono");
              setScreen("add");
            }}
          />
          <MainCard
            label="Propinas"
            color={G}
            bg={GBG}
            total={totalP}
            count={propinas.length}
            icon={<IconCoin s={26} c={G} />}
            disabled={!current.startTime}
            onClick={() => {
              setActiveField("propina");
              setScreen("add");
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
          <SmallCard
            label="Agencias/Bonos"
            color={A}
            bg={ABG}
            total={totalA}
            icon={<IconAgency s={18} c={A} />}
            disabled={!current.startTime}
            onClick={() => {
              setSingleMode("agencia_bono");
              setScreen("addSingle");
            }}
          />
          <SmallCard
            label="Extras"
            color={E}
            bg={EBG}
            total={totalE}
            icon={<IconExtra s={18} c={E} />}
            disabled={!current.startTime}
            onClick={() => {
              setScreen("addSingle");
              setSingleMode("extra");
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <SmallCard
            label="Gasolina"
            color={F}
            bg={FBG}
            total={totalF}
            icon={<IconFuel s={22} c={F} />}
            disabled={!current.startTime}
            onClick={() => {
              setSingleMode("gasolina");
              setScreen("addSingle");
            }}
          />
          <SmallCard
            label="Nulos"
            color={N}
            bg={NBG}
            total={totalN}
            icon={<IconNulo s={18} c={N} />}
            disabled={!current.startTime}
            onClick={() => {
              setSingleMode("nulo");
              setScreen("addSingle");
            }}
          />
        </div>

        {active && current.startTime && (
          <div style={{ marginBottom: 18 }}>
            <button
              onClick={() => {
                setNoteS("");
                setScreen("addNotaGeneral");
              }}
              style={{
                width: "100%",
                height: 48,
                padding: "0 16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <IconNoteAdd s={26} /> Añadir Nota al Turno
            </button>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Últimas entradas</span>
            {current.entries.length > 0 && (
              <button
                onClick={() => setScreen("todayHistory")}
                title="Editar entradas"
                aria-label="Editar entradas"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: 7,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconPencilNeon />
              </button>
            )}
          </div>
          {current.entries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "rgba(255,255,255,0.18)",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {current.startTime ? (
                <div>
                  Turno iniciado a las {current.startTime}.<br />
                  Pulsa un botón para añadir tu primera entrada.
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      hapticAction();
                      setCurrent({
                        ...current,
                        startTime: new Date().toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        startDate: today(),
                      });
                      setBurst(true);
                      setTimeout(() => setBurst(false), 800);
                    }}
                    style={{
                      padding: "14px 24px",
                      borderRadius: 16,
                      background: "rgba(60,255,100,0.1)",
                      color: "rgba(60,255,100,0.9)",
                      border: "1px solid rgba(60,255,100,0.2)",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12
                    }}
                  >
                    <IconRocket s={32} c="rgba(60,255,100,0.9)" /> Iniciar Turno
                  </button>
                  <div style={{
                    marginTop: 14,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: 500
                  }}>
                    Pulsa para comenzar tu Turno.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 0, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
              {[...current.entries]
                .reverse()
                .map((e) => {
                  const meta = getEntryTypeMeta(e.type);
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                        alignItems: "start",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {meta.icon(17)}
                        <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.5)",
                          flexShrink: 0,
                          alignSelf: "start",
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 14, fontWeight: 700, color: meta.color, flexShrink: 0, alignSelf: "start" }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {active && (
          <button
            onClick={() => setScreen("confirmEnd")}
            style={{
              marginTop: 10,
              padding: "15px 0",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Terminar Turno
          </button>
        )}

        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 80,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "0 -20px -24px",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <div
              onClick={togglePause}
              style={{
                width: 152,
                height: 152,
                background: "#101827",
                borderRadius: 38,
                border: "3px solid #3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
                boxShadow: "0 0 4px rgba(126,182,255,0.68), 0 0 28px rgba(59,130,246,0.30), 0 14px 34px rgba(59,130,246,0.18)",
                cursor: "pointer"
              }}
            >
              <IconPause s={84} c="#7eb6ff" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 40, letterSpacing: "-0.5px" }}>
              Turno Pausado
            </div>
            <button
              onClick={togglePause}
              style={{
                width: "100%",
                padding: "20px 0",
                borderRadius: 20,
                border: "2px solid #3b82f6",
                background: "rgba(59, 130, 246, 0.08)",
                color: "#3b82f6",
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>▶</span>
              Continuar Turno
            </button>
          </div>
        )}
      </div>
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      {editEntry && (
        <EditEntryDialog
          entry={editEntry}
          amount={editEntryAmount}
          note={editEntryNote}
          onAmountChange={setEditEntryAmount}
          onNoteChange={setEditEntryNote}
          onSave={saveEditEntry}
          getEntryTypeMeta={getEntryTypeMeta}
          deleteIcon={<IconDel />}
          onDelete={() => {
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
            });
          }}
          onCancel={() => setEditEntry(null)}
        />
      )}
    </Shell>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AuthGate AppComponent={App} />);
}

registerServiceWorker();
