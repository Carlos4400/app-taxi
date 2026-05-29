import React from "react";
import ReactDOM from "react-dom/client";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

import { Capacitor } from "@capacitor/core";

import html2canvas from "html2canvas";
import { signOut } from "firebase/auth";
import { auth } from "./services/firebase";
import { AuthGate } from "./screens/auth-gate";
import { useFirestoreSync } from "./hooks/use-firestore-sync";
import { registerServiceWorker } from "./services/service-worker-registration";
import { APP_VERSION } from "./shared/app-version";
import {
  IconCoin,
  IconPercent,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "./components/entry-icons";
import {
  IconBack,
  IconDel,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconCalendar,
  IconSettings,
  IconHomeNeon,
  IconLogoutNeon,
  IconAdminNeon,
} from "./components/navigation-icons";
import { CalendarScreen } from "./screens/calendar-screen";
import { HomeScreen } from "./screens/home-screen";
import { SettingsScreen } from "./screens/settings-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, fmt } from "./logic/formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
import { TurnoNotasCard } from "./components/turno-notas";
import { EditEntryDialog } from "./components/edit-entry-dialog";
import { DurationCardValue } from "./components/duration-card-value";
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
import { ApkInstaller } from "./services/apk-installer";
import { resolveLatestApkUpdate, type UpdateState } from "./logic/update-flow";
import { buildBackupPayload, buildBackupPayloadFromState } from "./logic/backup";
import { exportBackupJSON } from "./services/backup-export";
import {
  ensureTurnosDiaLibreContable,
  getTurnosByCalendarMonth,
  getTurnosByCalendarYear,
  mergeTurnos,
  sortTurnosByDateDesc,
} from "./logic/turnos";
import { parseCSVToHistory } from "./logic/csv";
import { getBackupMenuActionIds, getHomeQuickActionIds } from "./shared/action-ids";
import { getTurnosNotasSemana } from "./logic/turno-notas-logic";
import { updateTurnoEntrega } from "./logic/turno-entrega";
import { getDaysInMonth, getStartOffset } from "./logic/calendar-date";
import { MESES_COMPLETOS, getAccountingPeriodLabel, getMesLabel } from "./logic/date-labels";
import { KM_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE, WEEK_LIST_CARD_TEXT_SIZES } from "./shared/card-styles";
import { fmtDate, getDiffMins, timeNow, today } from "./logic/date-time";
import { userStorageKey, writeUserLocalJSON } from "./services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_NOTES, KEY_RESERVATIONS, KEY_SETTINGS, KEY_WEEK_OVERRIDES } from "./shared/storage-keys";
import { loadCurrent, loadHistory, loadNotes, loadReservations, loadSettings, loadWeekOverrides } from "./logic/state-loaders";
import { A, ABG, C, CBG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "./shared/ui-theme";
import type {
  AppSettings,
  CurrentState,
  EditTurnoState,
  Entry,
  NotaCalendario,
  NotaTipo,
  Reserva,
  Turno,
  TurnoNotasSemana,
  WeekOverride,
} from "./shared/types";
import {
  formatWeekRange,
  formatWeekRangeFull,
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getTurnoFechaEfectiva,
  getWeekId,
  getWeekMonth,
  getWeekOverride,
  getWeekRange,
  getWeekStartDate,
  groupTurnosByWeek,
  isWeekClosed,
  selectAccountingHeroWeek,
} from "./logic/week-logic";
import {
  buildTurnoConfigFromSettings,
  calcularResumenContableTurnos,
  calcularTotalesTurnos,
  calcularTurnoContable,
  getTurnoConfig,
  roundMoney,
} from "./logic/accounting";
import {
  userMetaDocRef,
  userSubcollectionRef,
  saveUserDoc,
  syncSubcollection,
  userHasFirestoreData,
} from "./services/firestore-sync";
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

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================

const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <g>
      <path
        d="M4.1 19.9L6.15 14.85L9.15 17.85L4.1 19.9Z"
        fill="#c7cede"
        stroke="#e0e5f2"
        strokeWidth="0.75"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(199,206,222,0.55)) drop-shadow(0 0 2px rgba(127,137,166,0.22))",
        }}
      />
      <path
        d="M4.1 19.9L4.85 18.05L5.95 19.15L4.1 19.9Z"
        fill="#6f778d"
      />
      <path
        d="M6.15 14.85L15.45 5.55L18.45 8.55L9.15 17.85L6.15 14.85Z"
        fill="#ffd84d"
        stroke="#ffe45c"
        strokeWidth="0.85"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1.15px rgba(255,228,92,0.72)) drop-shadow(0 0 2.6px rgba(255,189,46,0.28))",
        }}
      />
      <path
        d="M15.45 5.55L16.95 4.05L19.95 7.05L18.45 8.55L15.45 5.55Z"
        fill="#ff9cda"
        stroke="#ffc1e9"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity="0.78"
        style={{
          filter:
            "drop-shadow(0 0 0.8px rgba(255,120,207,0.42)) drop-shadow(0 0 1.8px rgba(255,120,207,0.14))",
        }}
      />
      <path
        d="M8.1 14.35L15.7 6.75"
        stroke="#fff3a6"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M9.25 15.55L16.85 7.95"
        stroke="#ffba2e"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.65"
      />
    </g>
  </svg>
);

const IconReservaWrite = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <span
    style={{
      position: "relative",
      width: s,
      height: s,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
      }}
    >
      <path
        d="M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(190,140,255,0.55)) drop-shadow(0 0 3px rgba(190,140,255,0.20))",
        }}
      />
      <path
        d="M14.8 3.5V7.2H18.5"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8 10H14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M8 13H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <path d="M8 16H11.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>

    <span
      style={{
        position: "absolute",
        right: -2,
        bottom: -1,
        transform: "scale(0.58) rotate(-6deg)",
        transformOrigin: "bottom right",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <IconPencilNeon s={24} />
    </span>
  </span>
);

const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {showPlus && (
      <>
        <path
          stroke={c}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z"
          strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }}
        />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
      </>
    )}
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 6.75h10.5" : "M7.5 10h8.25"} strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 11.25h6" : "M7.5 13.75h6.5"} strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 15.75H7.5" : "M7.5 17.5H12"} strokeWidth="1.5" opacity="0.4" />
    <path
      stroke={c}
      strokeLinecap="round"
      strokeLinejoin="round"
      d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"}
      strokeWidth="1.7"
      style={{ filter: `drop-shadow(0 0 1px ${c})` }}
    />
    {!showPlus && (
      <path
        stroke={c}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.25 2.75V7.25H19.75"
        strokeWidth="1.7"
        opacity="0.9"
      />
    )}
  </svg>
);

const IconTaxiBadgeNeon = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <g
      style={{
        transform: "scale(1.4)",
        transformOrigin: "center",
      }}
    >
      {/* Asa superior */}
      <path
        d="M9.4 9.05V8.2C9.4 7.51 9.96 6.95 10.65 6.95H13.35C14.04 6.95 14.6 7.51 14.6 8.2V9.05"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cuerpo del cartel */}
      <path
        d="M6.75 9.05H17.25C17.84 9.05 18.34 9.47 18.45 10.04L19.18 13.96C19.36 14.92 18.62 15.8 17.64 15.8H6.36C5.38 15.8 4.64 14.92 4.82 13.96L5.55 10.04C5.66 9.47 6.16 9.05 6.75 9.05Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      {/* Texto */}
      <text
        x="12"
        y="13.9"
        textAnchor="middle"
        fill={c}
        fontSize="4.7"
        fontWeight="800"
        fontFamily="Outfit, sans-serif"
        letterSpacing="0.5"
      >
        TAXI
      </text>
    </g>
  </svg>
);

const IconReceipt = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 21V3C4.5 2.44772 4.94772 2 5.5 2H18.5C19.0523 2 19.5 2.44772 19.5 3V21L15.75 19.5L12 21L8.25 19.5L4.5 21Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7H16M8 11H16M8 15H13" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconGive = ({ s = 26, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    {/* Asa del maletín (subida de y=6 a y=4 para ganar altura) */}
    <path d="M8 8V5.5C8 4.67 8.67 4 9.5 4H14.5C15.33 4 16 4.67 16 5.5V8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    {/* Cuerpo del maletín (ampliado 2px más ancho y alto, empezando en y=8 en lugar de 10) */}
    <path d="M4.5 8H19.5C20.6 8 21.5 8.9 21.5 10V18.5C21.5 19.9 20.4 21 19 21H5C3.6 21 2.5 19.9 2.5 18.5V10C2.5 8.9 3.4 8 4.5 8Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    {/* Símbolo del euro con Outfit font, de tamaño 11, perfectamente centrado */}
    <text
      x="12"
      y="18.2"
      textAnchor="middle"
      fill={c}
      fontSize="11"
      fontWeight="700"
      fontFamily="Outfit, sans-serif"
    >
      €
    </text>
  </svg>
);

// Icono para Día Libre / Vacaciones (Sombrilla de playa)
const IconHoliday = ({ s = 24, c = "oklch(0.85 0.18 85)" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    {/* Sombrilla */}
    <path d="M12 4V16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 4C14 4 18.5 5.5 19 9.5C19.5 13.5 16 16 12 16C8 16 4.5 13.5 5 9.5C5.5 5.5 10 4 12 4Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 4C11.5 6 10.5 7.5 8 9M12 4C12.5 6 13.5 7.5 16 9" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    {/* Base/Arena */}
    <path d="M8 20C10.5 18.5 13.5 18.5 16 20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconTimer = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path
      d="M12 5C16.4183 5 20 8.58172 20 13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13C4 9.61051 6.10892 6.71424 9.06 5.5"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M12 2V5M10 2H14" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M12 13L15.5 8.5"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="13" r="1.2" fill={c} />
    <circle cx="17.5" cy="8.5" r="1" fill={c} opacity="0.6" />
  </svg>
);

const IconRoad = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M3 22L9 2M21 22L15 2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 22V18M12 14V10M12 6V2" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const IconPinNeon = ({ s = 24, c = "oklch(0.72 0.14 28)" }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}
  >
    <g transform="rotate(32 12 12)">
      <path
        d="M8.2 4.8h7.6c0.7 0 1.2 0.5 1.2 1.2v1.1c0 0.5-0.3 0.9-0.7 1.1l-1.8 1.1v3.1l2.7 2.7v1.2H6.8v-1.2l2.7-2.7V9.3L7.7 8.2C7.3 8 7 7.6 7 7.1V6c0-0.7 0.5-1.2 1.2-1.2Z"
        fill={c}
        fillOpacity="0.16"
        stroke={c}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 1px ${c})` }}
      />
      <path
        d="M12 16.3V21"
        stroke={c}
        strokeWidth="1.75"
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 1px ${c})` }}
      />
    </g>
  </svg>
);

const IconMoneyBag = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="3.5" cy="10.5" r="1" fill={c} />
    <circle cx="2" cy="13.5" r="0.8" fill={c} />
    <circle cx="20.5" cy="10.5" r="1" fill={c} />
    <circle cx="22" cy="13.5" r="0.8" fill={c} />
    <path d="M8 8 L6.5 4 Q9 6 12 3 Q15 6 17.5 4 L16 8" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="8" y="8" width="8" height="2.5" rx="1" stroke={c} strokeWidth="1.8" />
    <path d="M8.5 10.5C4 12 2.5 17.5 6 20.5C8 22.5 16 22.5 18 20.5C21.5 17.5 20 12 15.5 10.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 12V20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 13.5C14 12 10 12 10 14C10 16 14 16 14 18C14 20 10 20 10 18.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconAgenda = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="7" cy="9" r="1" fill={c} />
    <circle cx="7" cy="13" r="1" fill={c} />
    <circle cx="7" cy="17" r="1" fill={c} opacity="0.6" />
    <path d="M10 9H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 13H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 17H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const IconClipboard = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M9 4H7C5.89543 4 5 4.89543 5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6C19 4.89543 18.1046 4 17 4H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 2C9.44772 2 9 2.44772 9 3V5C9 5.55228 9.44772 6 10 6H14C14.5523 6 15 5.55228 15 5V3C15 2.44772 14.5523 2 14 2H10Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12H15M9 16H13" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const IconChart = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="4" y="14" width="4" height="6" rx="1" stroke={c} strokeWidth="1.8" strokeLinejoin="round" opacity="0.7" />
    <rect x="10" y="8" width="4" height="12" rx="1" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="16" y="4" width="4" height="16" rx="1" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 22H22" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);


const IconRocket = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 12 12)">
      <path d="M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 5 Q12 6 14.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.8" />
      <path d="M8 11 C5 11 4 14 4 16 C6 16 8 14 8 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 11 C19 11 20 14 20 16 C18 16 16 14 16 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 14 L9 16 C11 16.5 13 16.5 15 16 L14 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 16 C10 19 12 21 12 21 C12 21 14 19 14 16" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 23 L12 26" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 22 L8 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22 L16 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);


const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};

function App() {
  const [current, setCurrent] = useState<CurrentState>(loadCurrent);
  const [history, setHistory] = useState<Turno[]>(loadHistory);
  const [reservations, setReservations] = useState<Reserva[]>(loadReservations);
  const [notes, setNotes] = useState<NotaCalendario[]>(loadNotes);
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
  const [screen, setScreen] = useState("home");
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
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showNewEntryKP, setShowNewEntryKP] = useState(false);
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
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [weekOverrides, setWeekOverrides] = useState<WeekOverride[]>(loadWeekOverrides);

  // Estados Contabilidad (Fase 5)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [selectedAccountingYear, setSelectedAccountingYear] = useState<number>(() => new Date().getFullYear());
  const [selectedAccountingMonth, setSelectedAccountingMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [copiado, setCopiado] = useState(false);
  const [procesandoTicket, setProcesandoTicket] = useState(false);
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState<null | "list" | { uid: string; username: string }>(null);

  // Sincronización con Firestore (carga inicial, escritura reactiva, migración
  // de localStorage y detección de rol admin), encapsulada en src/hooks/use-firestore-sync.ts.
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });

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
    if (screen === 'editTurno' && editJ) {
      setEditJ({
        ...editJ,
        entries: editJ.entries.map((x: any) => x.id === updated.id ? updated : x)
      });
    } else {
      setCurrent((prev) => ({
        ...prev,
        entries: prev.entries.map((x) =>
          x.id === editEntry.id ? updated : x
        ),
      }));
    }
    setEditEntry(null);
  }

  function deleteEditEntry() {
    if (!editEntry) return;
    if (screen === 'editTurno' && editJ) {
      setEditJ({
        ...editJ,
        entries: editJ.entries.filter((x: any) => x.id !== editEntry.id)
      });
    } else {
      setCurrent((prev) => ({
        ...prev,
        entries: prev.entries.filter((x) => x.id !== editEntry.id),
      }));
    }
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
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "NEW_VERSION") {
        setUpdateMsg(`¡Nueva versión ${e.data.version} disponible! Recarga para actualizar.`);
      }
    };
    const onUpdateFound = (reg: ServiceWorkerRegistration) => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener("statechange", () => {
        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateMsg("Nueva versión disponible. Recarga para actualizar.");
        }
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => onUpdateFound(reg));
    });
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

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
  const active = current.entries.length > 0 || !!current.startTime;

  function togglePause() {
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
    setHistory((h) => [turno, ...h]);
    setCurrent({ entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 });
    setDineroJ("");
    setKmJ("");
    setNotesJ("");
    setViewTurno(turno);
    setScreen("summary");
  }

  async function checkUpdate() {
    setUpdateState("checking");
    setUpdateMsg("Buscando actualizaciones...");
    setDownloadUrl("");
    setReleaseUrl("");
    try {
      const res = await fetch("https://api.github.com/repos/Carlos4400/app-taxi/releases/latest");
      if (!res.ok) throw new Error("No se encontró el release");
      const data = await res.json();
      const result = resolveLatestApkUpdate(data, APP_VERSION);
      setDownloadUrl(result.downloadUrl);
      setReleaseUrl(result.releaseUrl);
      setUpdateState(result.updateState);
      setUpdateMsg(result.updateMsg);
    } catch (e) {
      setUpdateState("error");
      setUpdateMsg("Error al conectar con GitHub.");
    }
  }

  const handleInstallUpdate = async () => {
    if (!downloadUrl.endsWith(".apk")) {
      setUpdateState("error");
      setUpdateMsg("No se encontró APK en el último release.");
      return;
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        setUpdateState("checking");
        const { value: hasPermission } = await ApkInstaller.canInstallPackages();
        if (!hasPermission) {
          setUpdateState("permission_required");
          setUpdateMsg("Se requieren permisos para instalar aplicaciones desconocidas.");
          await ApkInstaller.openInstallPermissionSettings();
          return;
        }

        setUpdateState("downloading");
        setUpdateMsg("Descargando actualización...");
        const fileName = `app-update-${Date.now()}.apk`;
        await ApkInstaller.downloadAndInstall({ url: downloadUrl, fileName });
        setUpdateState("installed");
        setUpdateMsg("Instalación iniciada.");
      } catch (err: any) {
        console.error("Error al descargar/instalar APK:", err);
        setUpdateState("error");
        setUpdateMsg("Error al instalar el APK. Inténtalo de nuevo.");
      }
    } else {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenRelease = () => {
    if (releaseUrl) {
      window.open(releaseUrl, "_blank", "noopener,noreferrer");
    }
  };

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

  const reservaFieldGroupStyle = {
    marginLeft: 10,
    paddingLeft: 12,
    borderLeft: `1px solid ${C}55`,
  };

  const renderReservaCardField = (
    label: string,
    value: React.ReactNode,
    options: { href?: string; full?: boolean; muted?: boolean; compact?: boolean; center?: boolean } = {}
  ) => {
    const valueStyle = {
      color: options.muted ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.86)",
      fontSize: options.center ? (options.compact ? 17 : 18) : (options.compact ? 14 : 15),
      fontWeight: options.muted ? 600 : 750,
      lineHeight: 1.28,
      wordBreak: "break-word" as const,
      textDecoration: "none",
      textAlign: options.center ? "center" as const : "left" as const,
    };

    return (
      <div
        style={{
          gridColumn: options.full ? "1 / -1" : undefined,
          background: "rgba(0,0,0,0.22)",
          border: "1px solid rgba(255,255,255,0.075)",
          borderRadius: 11,
          padding: options.compact ? "7px 9px" : "8px 10px",
          minWidth: 0,
          textAlign: options.center ? "center" as const : "left" as const,
        }}
      >
        <div style={{ fontSize: options.compact ? 11 : 12, fontWeight: 900, color: options.muted ? "rgba(255,255,255,0.42)" : C, textTransform: "uppercase", marginBottom: 4, textAlign: options.center ? "center" : "left" }}>
          {label}
        </div>
        {options.href ? (
          <a href={options.href} style={valueStyle}>
            {value}
          </a>
        ) : (
          <div style={valueStyle}>{value}</div>
        )}
      </div>
    );
  };

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
    const vP = viewTurno.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
    const vD = viewTurno.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0);
    const isToday = viewTurno.date === today();
    const vA = viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').reduce((s: number, e: any) => s + e.amount, 0);
    const vE = viewTurno.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0);
    const vF = viewTurno.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0);
    const vN = viewTurno.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0);

    // El taxímetro efectivo ya no incluye los Nulos
    const dineroV = (viewTurno.dinero || 0) - vN;

    const kmV = viewTurno.km || 0;
    const cats = [
      { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={20} c={P} />, total: vD, count: viewTurno.entries.filter((e: any) => e.type === 'datafono').length },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={20} c={G} />, total: vP, count: viewTurno.entries.filter((e: any) => e.type === 'propina').length },
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').length },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={20} c={E} />, total: vE, count: viewTurno.entries.filter((e: any) => e.type === 'extra').length },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: vF, count: viewTurno.entries.filter((e: any) => e.type === 'gasolina').length },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={20} c={N} />, total: vN, count: viewTurno.entries.filter((e: any) => e.type === 'nulo').length },
    ];

    // Cálculo de duración
    let durationStr = fmtDuration(0);
    if (viewTurno.startTime && viewTurno.endTime) {
      let totalMins = getDiffMins(viewTurno.startTime, viewTurno.endTime);
      if (viewTurno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - viewTurno.totalPausedMinutes);
      }
      durationStr = fmtDuration(totalMins);
    }
    const calculoTurno = calcularTurnoContable(viewTurno, settings);
    const miGanancia = calculoTurno.miGanancia;

    // Calculos con la configuracion guardada del turno.
    const totalDescontar = calculoTurno.totalDescontar;
    const totalADar = calculoTurno.totalADar;
    const isLooseAccountingTurno = returnScreen === "contabilidad" && getTurnoAccountingWeekId(viewTurno, settings.diaLibre) === null;
    const turnoEntregado = viewTurno.entregada || false;
    const turnoFechaEntrega = viewTurno.fechaEntrega || null;
    const turnoSummaryDateTitle =
      viewTurno.startDate && viewTurno.startDate !== viewTurno.date
        ? `${fmtDate(viewTurno.startDate)} ${viewTurno.startTime} - ${fmtDate(viewTurno.date)} ${viewTurno.endTime}`
        : `${fmtDate(viewTurno.date)} \u00B7 ${viewTurno.startTime} - ${viewTurno.endTime}`;

    function applyTurnoEntrega(entregada: boolean) {
      if (!viewTurno) return;
      const fechaEntrega = entregada ? today() : null;
      setHistory((h) => updateTurnoEntrega(h, viewTurno.id, entregada, fechaEntrega));
      setViewTurno({ ...viewTurno, entregada, fechaEntrega });
    }

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={S.iconBtn} onClick={() => {
              setScreen(returnScreen || (isToday ? 'home' : 'PantallaTurnos'));
              setViewTurno(null);
              setReturnScreen(null);
            }}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Resumen del Turno</div>
            </div>
            <button style={{ ...S.iconBtn, background: 'rgba(255,255,255,0.09)' }} onClick={() => {
              setEditJ({ ...viewTurno, entries: [...viewTurno.entries] });
              setScreen('editTurno');
            }}>
              <IconPencilNeon />
            </button>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 22,
            padding: '16px',
            border: '1px solid rgba(255,255,255,0.07)'
          }}>
            <h1
              aria-label="Fecha del turno"
              style={{
                margin: "0",
                color: "white",
                fontSize: "clamp(17px, 4.6vw, 22px)",
                lineHeight: 1.15,
                fontWeight: 900,
                letterSpacing: 0,
                textAlign: "center",
                overflowWrap: "anywhere",
              }}
            >
              {turnoSummaryDateTitle}
            </h1>
          </div>

          {isLooseAccountingTurno && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: turnoEntregado ? G : "oklch(0.75 0.16 70)",
                background: turnoEntregado ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
                padding: "5px 10px",
                borderRadius: 8,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}>
                {turnoEntregado ? `✓ Entregado${turnoFechaEntrega ? " · " + new Date(turnoFechaEntrega + "T12:00:00").toLocaleDateString("es-ES") : ""}` : "Pendiente"}
              </div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: E,
                background: EBG,
                padding: "5px 10px",
                borderRadius: 8,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}>
                Fuera de semana
              </div>
            </div>
          )}

          {/* Contenedor Superior Agrupado (Dos columnas) */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Columna Izquierda: Taxímetro y KM */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)', letterSpacing: '-0.5px' }}>{fmt(dineroV)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px 8px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{fmtKmNumber(kmV)} <span style={KM_CARD_UNIT_STYLE}>KM</span></div>
              </div>
            </div>

            {/* Columna Derecha: Ganancia y Tiempo */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px 8px', border: '1px solid oklch(0.60 0.16 150 / 0.35)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <IconMoneyBag s={26} c="oklch(0.78 0.18 150)" /> Mi Ganancia
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(miGanancia)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(0, 180, 255, 0.05)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(0, 180, 255, 0.15)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                  <IconTimer s={26} c="oklch(0.85 0.12 210)" /> Tiempo Trabajado
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}>
                  <DurationCardValue value={durationStr} />
                </div>
              </div>
            </div>
          </div>

          {/* Categorías + Notas */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {cats.map(c => (
                <div key={c.key} style={{ background: c.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {c.icon}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{c.count} {c.count === 1 ? 'entrada' : 'entradas'}</div>
                </div>
              ))}
            </div>

            {(() => {
              const generalNotes = viewTurno.entries.filter((e: any) => e.type === 'nota');
              if (generalNotes.length === 0) {
                return (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: 'italic' }}>Sin notas del turno</div>
                  </div>
                );
              }
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => {
                      const meta = getEntryTypeMeta(e.type);
                      return (
                        <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                          <span style={NOTE_TIME_STYLE}>{e.time}</span>
                          <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                          <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Notas Detalladas (Fuera del recuadro principal) */}
          {(() => {
            const entriesWithNotes = viewTurno.entries.filter((e: any) => e.type !== 'nota' && e.note && e.note.trim());
            if (entriesWithNotes.length === 0) return null;
            return (
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entriesWithNotes.map((e: any) => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                        <span style={NOTE_TIME_STYLE}>{e.time}</span>
                        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: "baseline" }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Contenedor Inferior Agrupado: Descontar y Dar */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>

              {/* Tarjeta: Total a Descontar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.06 25)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.70 0.18 25 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <IconReceipt s={24} c="oklch(0.70 0.18 25)" />
                  Total a Descontar
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)', letterSpacing: '-0.5px' }}>
                  {fmt(totalDescontar)}
                </div>
              </div>

              {/* Tarjeta: Total a Dar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.18 0.07 145)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.68 0.20 145 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <IconGive s={26} c="oklch(0.68 0.20 145)" />
                  Total a Dar
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.68 0.20 145)', letterSpacing: '-0.5px' }}>
                  {fmt(totalADar)}
                </div>
              </div>

            </div>
          </div>

          {isLooseAccountingTurno && (
            <button
              onClick={() => {
                if (turnoEntregado) {
                  setConfirmDialog({
                    text: "¿Marcar este turno como NO entregado?",
                    onConfirm: () => {
                      applyTurnoEntrega(false);
                      setConfirmDialog(null);
                    },
                  });
                } else {
                  applyTurnoEntrega(true);
                }
              }}
              style={{
                padding: "16px 0",
                borderRadius: 16,
                border: "none",
                background: turnoEntregado ? "rgba(255,255,255,0.08)" : G,
                color: turnoEntregado ? "rgba(255,255,255,0.7)" : "black",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              {turnoEntregado ? "Desmarcar entregado" : "✓ Marcar turno como entregado"}
            </button>
          )}

          {isToday && (
            <button onClick={() => setScreen('home')}
              style={{ marginTop: 4, padding: '17px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Volver al inicio
            </button>
          )}
        </div>
        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      </Shell>
    );
  }

  // ── EDIT TURNO SCREEN ───────────────────────────────────────
  if (screen === 'editTurno' && editJ) {
    function saveEdit() {
      if (!editJ) return;
      const finalDinero = editJ.dineroStr !== undefined
        ? parseFloat(editJ.dineroStr.replace(',', '.')) || 0
        : (editJ.dinero || 0);
      const finalKm = editJ.kmStr !== undefined
        ? parseFloat(editJ.kmStr.replace(',', '.')) || 0
        : (editJ.km || 0);
      const {
        dineroStr: _dineroStr,
        kmStr: _kmStr,
        newType: _newType,
        newAmount: _newAmount,
        newNote: _newNote,
        isAddingNote: _isAddingNote,
        tempNote: _tempNote,
        ...turnoBase
      } = editJ;
      const updated: Turno = {
        ...turnoBase,
        dinero: finalDinero,
        km: finalKm,
        totalP: editJ.entries.filter((e: Entry) => e.type === 'propina').reduce((s: number, e: Entry) => s + e.amount, 0),
        totalD: editJ.entries.filter((e: Entry) => e.type === 'datafono').reduce((s: number, e: Entry) => s + e.amount, 0),
        totalA: editJ.entries.filter((e: Entry) => e.type === 'agencia_bono').reduce((s: number, e: Entry) => s + e.amount, 0),
        totalE: editJ.entries.filter((e: Entry) => e.type === 'extra').reduce((s: number, e: Entry) => s + e.amount, 0),
        totalF: editJ.entries.filter((e: Entry) => e.type === 'gasolina').reduce((s: number, e: Entry) => s + e.amount, 0),
        totalN: editJ.entries.filter((e: Entry) => e.type === 'nulo').reduce((s: number, e: Entry) => s + e.amount, 0),
      };
      setHistory((h: Turno[]) => h.map((j: Turno) => j.id === updated.id ? (updated as Turno) : j));
      setViewTurno(updated as Turno);
      setEditJ(null);
      setScreen('summary');
    }
    const eDinero = editJ.dineroStr !== undefined ? editJ.dineroStr : (editJ.dinero ? editJ.dinero.toString().replace('.', ',') : "");
    const eKm = editJ.kmStr !== undefined ? editJ.kmStr : (editJ.km ? editJ.km.toString().replace('.', ',') : "");
    function kpEdit(v: string) {
      if (!editJ || !endField) return;
      const cur = endField === "dinero" ? eDinero : eKm;
      const key = endField === "dinero" ? "dineroStr" : "kmStr";
      let next = cur;
      if (v === "DEL") {
        next = cur.slice(0, -1);
      } else if (v === ",") {
        if (!cur.includes(",")) next = cur + ","; else return;
      } else {
        if (cur.replace(",", "").length >= 7) return;
        next = cur + v;
      }
      setEditJ({ ...editJ, [key]: next } as EditTurnoState);
    }
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px 32px', overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button style={S.iconBtn} onClick={() => { setEditJ(null); setEndField(null); setScreen('summary'); }}><IconBack /></button>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Editar Turno</span>
          </div>

          {/* Dinero / KM (clickables - centrados y sin ceros) */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div onClick={() => setEndField("dinero")}
              style={{
                flex: 1,
                background: 'rgba(255, 180, 0, 0.06)', // Fondo Oro suave
                borderRadius: 16,
                padding: "14px",
                border: `1.5px solid ${endField === "dinero" ? "oklch(0.85 0.18 85)" : "rgba(255, 180, 0, 0.2)"}`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
              </div>
              <div style={{ color: 'oklch(0.85 0.18 85)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>
                {eDinero ? `${eDinero} €` : "€"}
              </div>
            </div>
            <div onClick={() => setEndField("km")}
              style={{
                flex: 1,
                background: 'oklch(0.19 0.05 220)',
                borderRadius: 16,
                padding: "14px",
                border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
              </div>
              <div style={{ color: 'oklch(0.80 0.14 220)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>
                {eKm ? <>{eKm} <span style={KM_CARD_UNIT_STYLE}>KM</span></> : <span style={KM_CARD_UNIT_STYLE}>KM</span>}
              </div>
            </div>
          </div>

          {/* Entradas editables */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: '14px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Entradas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editJ.entries.filter((e: Entry) => e.type !== 'nota').map((e: Entry) => {
                const meta = getEntryTypeMeta(e.type);
                return (
                  <div
                    key={e.id}
                    onClick={() => openEditEntry(e)}
                    role="button"
                    tabIndex={0}
                    title="Editar entrada"
                    aria-label="Editar entrada"
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        openEditEntry(e);
                      }
                    }}
                    style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto auto", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {meta.icon(17)}
                      <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                  </div>
                );
              })}
              {editJ.entries.filter((e: Entry) => e.type !== 'nota').length === 0 && <div style={{ textAlign: 'center', color: "rgba(255,255,255,0.5)", fontSize: 13, padding: '10px 0' }}>Sin entradas</div>}
            </div>

            {/* Formulario para añadir nueva entrada */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>+ Añadir entrada olvidada</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>

                  {/* Desplegable personalizado visualmente integrado */}
                  <div style={{ position: 'relative', width: '120px', flexShrink: 0 }}>
                    <button
                      onClick={() => { setShowTypeMenu(!showTypeMenu); setShowNewEntryKP(false); }}
                      style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <span style={{ color: editJ.newType ? ({ datafono: P, propina: G, agencia_bono: A, extra: E, gasolina: F, nota: 'white', nulo: N } as any)[editJ.newType] : 'white', fontWeight: editJ.newType ? 800 : 600, textTransform: editJ.newType === 'agencia_bono' ? 'none' : (editJ.newType ? 'capitalize' : 'none'), fontSize: 13 }}>
                        {editJ.newType === 'agencia_bono' ? 'Agencia/Bono' : (editJ.newType || 'Selecciona')}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>▼</span>
                    </button>
                    {showTypeMenu && (
                      <>
                        <div onClick={() => setShowTypeMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, zIndex: 100, width: '100%', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                          {['datafono', 'propina', 'agencia_bono', 'extra', 'gasolina', 'nulo'].map(type => {
                            const tColor = ({ datafono: P, propina: G, agencia_bono: A, extra: E, gasolina: F, nulo: N } as any)[type];
                            return (
                              <div
                                key={type}
                                onClick={() => { setEditJ({ ...editJ, newType: type }); setShowTypeMenu(false); }}
                                style={{ padding: '12px', fontSize: 13, color: tColor, borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', textTransform: type === 'agencia_bono' ? 'none' : 'capitalize', fontWeight: 700, background: editJ.newType === type ? 'rgba(255,255,255,0.06)' : 'transparent' }}
                              >
                                {type === 'agencia_bono' ? 'Agencia/Bono' : type}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Falso input que abre el teclado numérico */}
                  <div
                    onClick={() => { setShowNewEntryKP(!showNewEntryKP); setShowTypeMenu(false); }}
                    style={{ flex: 1, minWidth: 60, background: 'rgba(0,0,0,0.3)', border: `1px solid ${showNewEntryKP ? (editJ.newType ? ({ datafono: P, propina: G, agencia_bono: A, extra: E, gasolina: F, nulo: N } as any)[editJ.newType] : 'white') : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative', zIndex: showNewEntryKP ? 100 : 'auto' }}
                  >
                    {editJ.newAmount ? <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{editJ.newAmount}</span> : <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>0,00</span>}
                  </div>

                  <button
                    onClick={() => {
                      if (!editJ.newType) {
                        alert("Por favor, selecciona un tipo de entrada primero.");
                        return;
                      }
                      const amt = parseFloat((editJ.newAmount || '').replace(',', '.'));
                      if (amt > 0) {
                        const noteText = editJ.newNote ? editJ.newNote.trim() : '';
                        const newEntry = {
                          id: Date.now(),
                          type: editJ.newType,
                          amount: amt,
                          note: noteText,
                          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        };
                        setEditJ({ ...editJ, entries: [newEntry, ...editJ.entries], newAmount: '', newNote: '', newType: null });
                        setShowNewEntryKP(false);
                      }
                    }}
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', position: 'relative', zIndex: showNewEntryKP ? 100 : 'auto' }}>
                    Añadir
                  </button>
                </div>

                {/* Teclado numérico in-app integrado */}
                {showNewEntryKP && (
                  <>
                    <div onClick={() => setShowNewEntryKP(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }} />
                    <div style={{ position: 'relative', zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4, marginBottom: 4, animation: 'fadeUp 0.2s ease' }}>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                        <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => {
                          e.preventDefault();
                          let cur = editJ.newAmount || '';
                          if (k === "DEL") { setEditJ({ ...editJ, newAmount: cur.slice(0, -1) }); return; }
                          if (k === ",") { if (!cur.includes(",")) setEditJ({ ...editJ, newAmount: cur + "," }); return; }
                          if (cur.replace(",", "").length >= 6) return;
                          setEditJ({ ...editJ, newAmount: cur + k });
                        }} style={{ border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '12px 0', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 18, fontWeight: 700 }}>
                          {k === "DEL" ? <IconDel /> : k}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <input
                  placeholder="Nota opcional..."
                  value={editJ.newNote || ''}
                  onChange={e => setEditJ({ ...editJ, newNote: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '8px 10px', fontSize: 13, outline: 'none', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
            </div>

            {editJ.entries.filter((e: Entry) => e.type === 'nota').length === 0 && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontStyle: 'italic', marginBottom: 12 }}>Sin notas del turno</div>
            )}

            {editJ.entries.filter((e: Entry) => e.type === 'nota').map((e: Entry) => (
              <div key={e.id} style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', top: 10, left: 10, color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }}>{e.time}</span>
                <button
                  onClick={() => {
                    const newEntries = editJ.entries.filter((ent: Entry) => ent.id !== e.id);
                    setEditJ({ ...editJ, entries: newEntries });
                  }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,60,60,0.15)', color: '#ff7b7b', border: 'none', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                >
                  ✕
                </button>
                <textarea
                  rows={1}
                  value={e.note}
                  onChange={(ev) => {
                    const newEntries = editJ.entries.map((ent: Entry) =>
                      ent.id === e.id ? { ...ent, note: ev.target.value } : ent
                    );
                    setEditJ({ ...editJ, entries: newEntries });
                  }}
                  placeholder="Escribe aquí la nota..."
                  style={{
                    width: "100%",
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 13,
                    lineHeight: 1.4,
                    background: "rgba(255,255,255,0.02)",
                    padding: "26px 36px 10px 10px",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.05)",
                    outline: "none",
                    resize: "none",
                    minHeight: "54px",
                    fontFamily: "inherit",
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            {editJ.isAddingNote ? (
              <div style={{ marginTop: 8, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease' }}>
                <textarea
                  autoFocus
                  value={editJ.tempNote || ''}
                  onChange={(e) => setEditJ({ ...editJ, tempNote: e.target.value })}
                  placeholder="Escribe la nueva nota aquí..."
                  style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 13, outline: 'none', resize: 'none', minHeight: '60px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => setEditJ({ ...editJ, isAddingNote: false, tempNote: '' })} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => {
                    if (editJ.tempNote && editJ.tempNote.trim() !== '') {
                      const newEntry = { id: Date.now(), type: 'nota', amount: 0, note: editJ.tempNote.trim(), time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) };
                      setEditJ({ ...editJ, entries: [...editJ.entries, newEntry], isAddingNote: false, tempNote: '' });
                    }
                  }} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'white', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Añadir</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditJ({ ...editJ, isAddingNote: true })}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px dashed rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginTop: 4
                }}
              >
                <IconNoteAdd s={18} /> Añadir Nueva Nota
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={saveEdit}
              style={{ padding: '18px 0', borderRadius: 18, border: 'none', background: GBG, color: G, outline: `1.5px solid ${G}55`, fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>
              Guardar cambios
            </button>
            <button onClick={() => { setEditJ(null); setScreen('summary'); }}
              style={{ padding: '16px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={() => {
                setConfirmDialog({
                  text: "¿Seguro que quieres eliminar este Turno completo? Esta acción no se puede deshacer.",
                  onConfirm: () => {
                    setHistory((h) => h.filter((j) => j.id !== editJ.id));
                    setEditJ(null);
                    setViewTurno(null);
                    setScreen("PantallaTurnos");
                  }
                });
              }}
              style={{ padding: '16px 0', borderRadius: 18, border: '1px solid rgba(255,60,60,0.3)', background: 'rgba(255,60,60,0.08)', color: 'rgba(255,90,90,0.85)', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
            >
              🗑️ Eliminar Turno
            </button>
          </div>
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

        {/* Teclado in-app para Dinero / KM en Editar Turno */}
        {endField && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Teclado numérico"
            onClick={() => setEndField(null)}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              zIndex: 9999,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 460,
                background: "#0d0d14",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: "16px 16px 20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                animation: "slideUp 0.25s ease",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  {endField === "dinero" ? "Total Taxímetro" : "Total KM"}
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)", marginBottom: 14, textAlign: "center", letterSpacing: "-0.5px" }}>
                {(endField === "dinero" ? eDinero : eKm) || "0"} {endField === "dinero" ? "€" : "KM"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                  <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={() => kpEdit(k)}
                    style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                    {k === "DEL" ? <IconDel /> : k}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEndField(null)}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  marginTop: 12,
                  borderRadius: 14,
                  border: "none",
                  background: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)",
                  color: "black",
                  fontSize: 17,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </Shell>
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
        setCurrent={setCurrent}
        setScreen={setScreen}
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
        history={history}
        settings={settings}
        selectedAccountingYear={selectedAccountingYear}
        setSelectedAccountingYear={setSelectedAccountingYear}
        selectedAccountingMonth={selectedAccountingMonth}
        setSelectedAccountingMonth={setSelectedAccountingMonth}
        setScreen={setScreen}
      />
    );
  }


  if (screen === "detalleMes") {
    return (
      <DetalleMesScreen
        history={history}
        settings={settings}
        selectedAccountingYear={selectedAccountingYear}
        selectedAccountingMonth={selectedAccountingMonth}
        setSelectedAccountingYear={setSelectedAccountingYear}
        setSelectedAccountingMonth={setSelectedAccountingMonth}
        setScreen={setScreen}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }


  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        updateWeekOverride={updateWeekOverride}
        setScreen={setScreen}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }


  if (screen === "liquidacionSemana" && selectedWeekId) {
    return (
      <LiquidacionSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        updateWeekOverride={updateWeekOverride}
        setScreen={setScreen}
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
              top: 85,
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
            }}
          >
            <div style={{
              width: 152,
              height: 152,
              background: "#101827",
              borderRadius: 38,
              border: "3px solid #3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              boxShadow: "0 0 4px rgba(126,182,255,0.68), 0 0 28px rgba(59,130,246,0.30), 0 14px 34px rgba(59,130,246,0.18)"
            }}>
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
