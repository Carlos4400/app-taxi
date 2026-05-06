import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const { useState, useEffect } = React;

interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

interface Turno {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: Entry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string | null;
  totalPausedMinutes?: number;
}

interface CurrentState {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
}

const G = "oklch(0.68 0.20 145)";
const GBG = "oklch(0.18 0.07 145)";
const P = "oklch(0.65 0.20 280)";
const PBG = "oklch(0.17 0.07 280)";
const A = "oklch(0.75 0.16 70)";
const ABG = "oklch(0.20 0.06 70)";
const E = "oklch(0.72 0.14 200)";
const EBG = "oklch(0.19 0.05 200)";
const F = "oklch(0.70 0.18 25)";
const FBG = "oklch(0.19 0.06 25)";
const N = "oklch(0.62 0.06 260)";
const NBG = "oklch(0.18 0.03 260)";

const KEY_CURRENT = "taxi_current_v3";
const KEY_HISTORY = "taxi_history_v3";
const KEY_SETTINGS = "taxi_settings_v3";
const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
const KEY_WEEKS_FROZEN = "taxi_weeks_frozen_v1";

interface WeekOverride {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

interface FrozenWeek {
  weekId: string;
  fechaInicio: string;
  fechaFin: string;
  diaLibreUsado: number;
  totales: {
    totalP: number;
    totalD: number;
    totalA: number;
    totalE: number;
    totalF: number;
    totalN: number;
    dinero: number;
    km: number;
  };
  turnoIds: number[];
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
  numTurnos: number;
}

interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.propina": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
  "descontar.nulo": boolean;
  diaLibre: number;              // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  diaLibreDesde: string | null;  // Fecha ISO desde la que aplica este día libre (null si nunca se ha cambiado)
}
// Inyectado por Vite en build a partir de process.env.APP_VERSION o package.json.
declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function timeNow(): string {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDiffMins(t1: string, t2: string): number {
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}
function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00")
    .toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase());
}

function loadSettings(): AppSettings {
  const defaults: AppSettings = {
    "porcentaje.jefe": 0,
    "porcentaje.chofer": 0,
    "descontar.datafono": true,
    "descontar.propina": false,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    "descontar.nulo": true,
    diaLibre: 2,           // Martes por defecto (tu día libre actual)
    diaLibreDesde: null,
  };
  try {
    const d = JSON.parse(localStorage.getItem(KEY_SETTINGS)!);
    if (d) {
      if (d["descontar.agencia"] !== undefined && d["descontar.agencia_bono"] === undefined) {
        d["descontar.agencia_bono"] = d["descontar.agencia"];
      }
      return { ...defaults, ...d };
    }
  } catch (e) { }
  return defaults;
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (/[";\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildHistoryCSV(turnos: Turno[]): string {
  const header = [
    "fecha",
    "inicio",
    "fin",
    "tipo",
    "importe",
    "nota",
    "hora_entrada",
    "dinero_total_turno",
    "km_turno",
    "notas_turno",
  ];
  const rows: string[] = [header.join(";")];

  for (const j of turnos) {
    if (j.entries.length === 0) {
      rows.push(
        [
          j.date,
          j.startTime ?? "",
          j.endTime ?? "",
          "",
          "",
          "",
          "",
          (j.dinero ?? 0).toFixed(2).replace(".", ","),
          (j.km ?? 0).toString().replace(".", ","),
          j.notes ?? "",
        ].map(csvEscape).join(";")
      );
      continue;
    }
    for (const e of j.entries) {
      rows.push(
        [
          j.date,
          j.startTime ?? "",
          j.endTime ?? "",
          e.type,
          e.amount.toFixed(2).replace(".", ","),
          e.note ?? "",
          e.time ?? "",
          (j.dinero ?? 0).toFixed(2).replace(".", ","),
          (j.km ?? 0).toString().replace(".", ","),
          j.notes ?? "",
        ].map(csvEscape).join(";")
      );
    }
  }
  // BOM UTF-8 para que Excel reconozca los acentos.
  return "﻿" + rows.join("\r\n");
}

async function exportHistoryCSV(turnos: Turno[]): Promise<void> {
  const csv = buildHistoryCSV(turnos);
  const filename = `mi-turno-${today()}.csv`;

  // En Capacitor (APK Android) usamos Filesystem + Share porque
  // el truco <a download> no funciona dentro del WebView nativo.
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: csv,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      try {
        await Share.share({
          title: "Historial Mi Turno",
          text: "Exportación CSV de Turnos",
          url: result.uri,
          dialogTitle: "Compartir CSV",
        });
      } catch (shareErr) {
        // Si el usuario cancela o no hay app de compartir, al menos el
        // archivo ya está guardado en Documents.
        alert("CSV guardado en Documentos del dispositivo:\n" + filename);
      }
    } catch (e) {
      alert("No se pudo exportar el CSV: " + (e as Error).message);
    }
    return;
  }

  // Navegador (PWA): descarga clásica con <a download>.
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadCurrent(): CurrentState {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_CURRENT)!);
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
function loadHistory(): Turno[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_HISTORY)!);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================

function getWeekStartDate(dateStr: string, diaLibre: number): string {
  const d = new Date(dateStr + "T12:00:00");
  const currentDayOfWeek = d.getDay();
  const startDayOfWeek = (diaLibre + 1) % 7;
  let diff = currentDayOfWeek - startDayOfWeek;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function getWeekId(dateStr: string, diaLibre: number): string {
  return getWeekStartDate(dateStr, diaLibre);
}

function getWeekRange(weekId: string): { inicio: string; fin: string } {
  const d = new Date(weekId + "T12:00:00");
  const inicio = weekId;
  d.setDate(d.getDate() + 5);
  const fin = d.toISOString().slice(0, 10);
  return { inicio, fin };
}

/**
 * Devuelve la fecha "efectiva" de un turno para asignarlo a una semana.
 *
 * Regla:
 *   - Si startDate cae en día laboral → usar startDate
 *   - Si startDate cae en el día libre Y date (fin) cae en un día laboral
 *     distinto → usar date (el turno cuenta para la semana del día de fin)
 *   - En cualquier otro caso → startDate || date
 */
function getTurnoFechaEfectiva(turno: Turno, diaLibre: number): string {
  const fechaInicio = turno.startDate || turno.date;
  if (!fechaInicio) return turno.date;

  const diaInicio = new Date(fechaInicio + "T12:00:00").getDay();

  // Si empezó en día libre y terminó en otro día (laboral) → usar fecha de fin
  if (diaInicio === diaLibre && turno.date && turno.date !== fechaInicio) {
    const diaFin = new Date(turno.date + "T12:00:00").getDay();
    if (diaFin !== diaLibre) {
      return turno.date;
    }
  }

  return fechaInicio;
}

function groupTurnosByWeek(turnos: Turno[], diaLibre: number): Map<string, Turno[]> {
  const map = new Map<string, Turno[]>();
  const sorted = [...turnos].sort((a, b) => {
    const dateA = getTurnoFechaEfectiva(a, diaLibre);
    const dateB = getTurnoFechaEfectiva(b, diaLibre);
    return dateA.localeCompare(dateB);
  });
  for (const t of sorted) {
    const f = getTurnoFechaEfectiva(t, diaLibre);
    const weekId = getWeekId(f, diaLibre);
    if (!map.has(weekId)) {
      map.set(weekId, []);
    }
    map.get(weekId)!.push(t);
  }
  return map;
}

function isWeekClosed(weekId: string, hoyISO: string): boolean {
  const { fin } = getWeekRange(weekId);
  return hoyISO > fin;
}

function calcularTotalesTurnos(turnos: Turno[]) {
  let totalP = 0;
  let totalD = 0;
  let totalA = 0;
  let totalE = 0;
  let totalF = 0;
  let totalN = 0;
  let dinero = 0;
  let km = 0;
  for (const t of turnos) {
    totalP += t.totalP || 0;
    totalD += t.totalD || 0;
    totalA += t.totalA || 0;
    totalE += t.totalE || 0;
    totalF += t.totalF || 0;
    totalN += t.totalN || 0;
    dinero += t.dinero || 0;
    km += t.km || 0;
  }
  return { totalP, totalD, totalA, totalE, totalF, totalN, dinero, km };
}

/**
 * Genera snapshots (FrozenWeek) de todas las semanas YA CERRADAS según el día
 * libre anterior, en el momento en que el usuario va a cambiar de día libre.
 *
 * Las semanas que se congelan son aquellas que terminaron antes de "fechaCambio".
 * La semana en curso (si la hay) NO se congela: pasará a recalcularse con el
 * nuevo día libre a partir de fechaCambio.
 *
 * Si ya existían frozen weeks previas (de un cambio anterior), se preservan
 * íntegras y sólo se añaden las nuevas que no estuvieran ya congeladas.
 */
function freezeOldWeeks(
  turnos: Turno[],
  diaLibreAnterior: number,
  fechaCambio: string,
  frozenExistentes: FrozenWeek[],
  overrides: WeekOverride[]
): FrozenWeek[] {
  const yaCongeladas = new Set(frozenExistentes.map((w) => w.weekId));
  const nuevas: FrozenWeek[] = [];

  // Agrupar turnos según el día libre ANTERIOR
  const grupos = groupTurnosByWeek(turnos, diaLibreAnterior);

  for (const [key, turnosSemana] of grupos.entries()) {
    const weekId = key;

    // Si la semana ya estaba congelada de antes, no la tocamos
    if (yaCongeladas.has(weekId)) continue;

    const range = getWeekRange(weekId);

    // Sólo congelamos semanas que ya hayan terminado antes de fechaCambio
    if (range.fin >= fechaCambio) continue;

    const totales = calcularTotalesTurnos(turnosSemana);
    const override = getWeekOverride(overrides, weekId);

    nuevas.push({
      weekId,
      fechaInicio: range.inicio,
      fechaFin: range.fin,
      diaLibreUsado: diaLibreAnterior,
      totales: {
        totalP: totales.totalP,
        totalD: totales.totalD,
        totalA: totales.totalA,
        totalE: totales.totalE,
        totalF: totales.totalF,
        totalN: totales.totalN,
        dinero: totales.dinero,
        km: totales.km,
      },
      turnoIds: turnosSemana.map((t) => t.id),
      notes: override?.notes || "",
      entregada: override?.entregada || false,
      fechaEntrega: override?.fechaEntrega || null,
      numTurnos: turnosSemana.length,
    });
  }

  return [...frozenExistentes, ...nuevas];
}

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================

function loadWeekOverrides(): WeekOverride[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_WEEK_OVERRIDES)!);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

function loadFrozenWeeks(): FrozenWeek[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_WEEKS_FROZEN)!);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

/**
 * Crea un override por defecto (vacío) para un weekId dado.
 */
function emptyOverride(weekId: string): WeekOverride {
  return {
    weekId,
    notes: "",
    entregada: false,
    fechaEntrega: null,
  };
}

/**
 * Devuelve el override de una semana, o null si no existe.
 */
function getWeekOverride(overrides: WeekOverride[], weekId: string): WeekOverride | null {
  return overrides.find((o) => o.weekId === weekId) || null;
}

/**
 * Decide a qué mes pertenece una semana laboral.
 *
 * Regla:
 *   - Cuenta los días LABORALES del calendario que caen en cada mes.
 *   - El mes con más días gana.
 *   - Si hay empate (3-3), devuelve "empate" con los dos meses candidatos
 *     para que la UI pida al usuario que elija.
 *
 * Devuelve:
 *   { type: "single", mesId: "2026-05" }                              // sin empate
 *   { type: "tie", candidates: [{mesId, mesLabel}, {mesId, mesLabel}] } // empate
 */
function getWeekMonth(weekId: string, diaLibre: number): {
  type: "single";
  mesId: string;
} | {
  type: "tie";
  candidates: { mesId: string; mesLabel: string }[];
} {
  const range = getWeekRange(weekId);
  const start = new Date(range.inicio + "T12:00:00");

  // Contar 6 días laborales (la semana completa, todos los días son laborales por construcción)
  const conteo = new Map<string, number>(); // "YYYY-MM" → nº días
  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const mesId = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    conteo.set(mesId, (conteo.get(mesId) || 0) + 1);
  }

  const entradas = Array.from(conteo.entries());

  // Una sola entrada → toda la semana en un mes
  if (entradas.length === 1) {
    return { type: "single", mesId: entradas[0][0] };
  }

  // Dos entradas → comparar
  entradas.sort((a, b) => b[1] - a[1]); // ordena por más días desc
  const [primera, segunda] = entradas;

  if (primera[1] !== segunda[1]) {
    return { type: "single", mesId: primera[0] };
  }

  // Empate
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const labelOf = (mesId: string) => {
    const [y, m] = mesId.split("-").map(Number);
    return `${meses[m - 1]} ${y}`;
  };

  // Ordenar candidatos cronológicamente (mes anterior primero)
  const candidates = [primera[0], segunda[0]].sort();
  return {
    type: "tie",
    candidates: candidates.map((mesId) => ({ mesId, mesLabel: labelOf(mesId) })),
  };
}

/**
 * Devuelve el label legible de un mesId "YYYY-MM" → "Mayo 2026"
 */
function getMesLabel(mesId: string): string {
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const [y, m] = mesId.split("-").map(Number);
  return `${meses[m - 1]} ${y}`;
}

/**
 * Devuelve el rango formateado para mostrar en la tarjeta de semana.
 * Ej: "6 - 11 May" o "29 Abr - 4 May"
 */
function formatWeekRange(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (dInicio.getMonth() === dFin.getMonth() && dInicio.getFullYear() === dFin.getFullYear()) {
    return `${dInicio.getDate()} - ${dFin.getDate()} ${meses[dFin.getMonth()]}`;
  }
  return `${dInicio.getDate()} ${meses[dInicio.getMonth()]} - ${dFin.getDate()} ${meses[dFin.getMonth()]}`;
}

/**
 * Devuelve el rango con fecha completa para cabecera de detalle.
 * Ej: "Mié 6 May - Lun 11 May 2026"
 */
function formatWeekRangeFull(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dias[dInicio.getDay()]} ${dInicio.getDate()} ${meses[dInicio.getMonth()]} - ${dias[dFin.getDay()]} ${dFin.getDate()} ${meses[dFin.getMonth()]} ${dFin.getFullYear()}`;
}

const IconCoin = ({ s = 24, c = G }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill={c}
      fontSize="11"
      fontWeight="700"
      fontFamily="Outfit,sans-serif"
    >
      €
    </text>
  </svg>
);

const IconPercent = ({ s = 24, c = G }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M16 8L8 16" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="9" r="2" stroke={c} strokeWidth="2.5" />
    <circle cx="15" cy="15" r="2" stroke={c} strokeWidth="2.5" />
  </svg>
);

const IconCard = ({ s = 24, c = P }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="6"
      width="18"
      height="13"
      rx="2.5"
      stroke={c}
      strokeWidth="1.8"
    />
    <rect x="3" y="10" width="18" height="3.5" fill={c} opacity="0.35" />
    <rect x="6" y="15.5" width="5" height="1.5" rx="0.75" fill={c} />
  </svg>
);
const IconBack = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M14 18L7 11L14 4"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDel = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path
      d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      fill="none"
    />
    <path
      d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);
const IconAgency = ({ s = 24, c = A }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 20V9L12 4L20 9V20"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 20V14H15V20"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M3 20H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconExtra = ({ s = 24, c = E }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4V20M4 12H20"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" opacity="0.5" />
  </svg>
);
const IconFuel = ({ s = 24, c = F }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="6"
      width="11"
      height="14"
      rx="2"
      stroke={c}
      strokeWidth="1.8"
    />
    <path
      d="M15 10L18 8V16L15 14"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <rect x="7" y="9" width="5" height="4" rx="1" fill={c} opacity="0.4" />
  </svg>
);
const IconNulo = ({ s = 24, c = N }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <path d="M6 18L18 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Icono para Total Descontar (Ticket/Factura)
const IconReceipt = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M7 21V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V21L14.5 19.5L12 21L9.5 19.5L7 21Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 7H14M10 11H14M10 15H12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconGive = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M8 10V8C8 6.89543 8.89543 6 10 6H14C15.1046 6 16 6.89543 16 8V10" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M5 10H19C20.1046 10 21 10.8954 21 12V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V12C3 10.8954 3.89543 10 5 10Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="15.5" r="2" stroke={c} strokeWidth="1.8" />
  </svg>
);

// Icono para Total a Dar (Mano con moneda)
const IconHandGive = ({ s = 24, c = "oklch(0.68 0.20 145)" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    {/* Moneda */}
    <circle
      cx="12"
      cy="6"
      r="3"
      stroke={c}
      strokeWidth="1.8"
    />
    <circle
      cx="12"
      cy="6"
      r="1.5"
      stroke={c}
      strokeWidth="1"
      opacity="0.5"
    />
    {/* Mano abierta */}
    <path
      d="M6 11C6 9.5 7 8.5 8.5 8.5H9.5C10.5 8.5 11 9 11 10V13"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11C9 9 10.5 8 12 8C13.5 8 14.5 9 14.5 10.5V13.5"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 11.5C12 10 13 9 14.5 9C16 9 17 10 17 11.5V15"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 12.5C15 11 16 10 17.5 10C19 10 20 11 20 12.5V14C20 16.5 18 18.5 15.5 18.5H11C8 18.5 5.5 16.5 5 13.5"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

function Shell({
  children,
  burst,
}: {
  children: React.ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {burst && <Burst />}
      {children}
    </div>
  );
}

function Burst() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-8px",
            left: `${5 + Math.random() * 90}%`,
            width: 7,
            height: 7,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: [G, P, "white", "oklch(0.85 0.18 80)"][i % 4],
            animation: `fall ${0.55 + Math.random() * 0.45}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [current, setCurrent] = useState<CurrentState>(loadCurrent);
  const [history, setHistory] = useState<Turno[]>(loadHistory);
  const [screen, setScreen] = useState("home");
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


  const [editJ, setEditJ] = useState<any>(null);
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
  const [downloadUrl, setDownloadUrl] = useState("");
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editEntryAmount, setEditEntryAmount] = useState("");
  const [editEntryNote, setEditEntryNote] = useState("");
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [weekOverrides, setWeekOverrides] = useState<WeekOverride[]>(loadWeekOverrides);
  const [frozenWeeks, setFrozenWeeks] = useState<FrozenWeek[]>(loadFrozenWeeks);

  // Estados Contabilidad (Fase 5)
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [tieResolutions, setTieResolutions] = useState<Map<string, string>>(new Map());
  const [pendingTie, setPendingTie] = useState<{
    weekId: string;
    candidates: { mesId: string; mesLabel: string }[];
  } | null>(null);

  // Estados Detalle de Semana (Fase 6)
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

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

  // Helper: actualiza una FrozenWeek (cuando la semana ya está congelada)
  function updateFrozenWeek(weekId: string, partial: Partial<Omit<FrozenWeek, "weekId" | "fechaInicio" | "fechaFin" | "diaLibreUsado" | "totales" | "turnoIds" | "numTurnos">>) {
    setFrozenWeeks((prev) =>
      prev.map((w) =>
        w.weekId === weekId
          ? { ...w, ...partial }
          : w
      )
    );
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

  useEffect(() => {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(current));
  }, [current]);
  useEffect(() => {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(KEY_WEEK_OVERRIDES, JSON.stringify(weekOverrides));
  }, [weekOverrides]);
  useEffect(() => {
    localStorage.setItem(KEY_WEEKS_FROZEN, JSON.stringify(frozenWeeks));
  }, [frozenWeeks]);

  // [DEBUG FASE 2-3] Exponer funciones y estado de semanas en window para inspección.
  useEffect(() => {
    (window as any).__taxiDebug = {
      getWeekStartDate,
      getWeekId,
      getWeekRange,
      getTurnoFechaEfectiva,
      groupTurnosByWeek,
      isWeekClosed,
      calcularTotalesTurnos,
      history,
      settings,
      weekOverrides,
      frozenWeeks,
    };
  }, [history, settings, weekOverrides, frozenWeeks]);

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

  const propinas = current.entries.filter((e) => e.type === "propina");
  const datafonos = current.entries.filter((e) => e.type === "datafono");
  const agencias = current.entries.filter((e) => e.type === "agencia" || e.type === "agencia_bono");
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

  function handleDelete(id: number) {
    setCurrent((d) => ({
      ...d,
      entries: d.entries.filter((e) => e.id !== id),
    }));
  }

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
    setUpdateMsg("Buscando actualizaciones...");
    setDownloadUrl("");
    try {
      const res = await fetch("https://api.github.com/repos/Carlos4400/app-taxi/releases/latest");
      if (!res.ok) throw new Error("No se encontró el release");
      const data = await res.json();
      const latestVersion = data.tag_name ? data.tag_name.replace(/[^0-9.]/g, '') : null;

      if (latestVersion && latestVersion !== APP_VERSION) {
        setUpdateMsg(`¡Nueva versión ${latestVersion} disponible!`);
        if (data.assets && data.assets.length > 0) {
          setDownloadUrl(data.assets[0].browser_download_url);
        } else {
          setDownloadUrl(data.html_url);
        }
      } else {
        setUpdateMsg("Tienes la última versión instalada.");
      }
    } catch (e) {
      setUpdateMsg("Error al conectar con GitHub.");
    }
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
  };

  if (screen === "home") {
    const hasActive = current.entries.length > 0 || !!current.startTime;
    const totalHoy = totalP + totalD + totalA + totalE;
    return (
      <Shell burst={false}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "32px 28px 48px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 18 }}>
              🚕
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-1.5px",
              }}
            >
              Mi Turno
            </div>
            <div
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.35)",
                marginTop: 10,
                textTransform: "none",
              }}
            >
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).replace(/^\w/, (c) => c.toUpperCase())}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => {
                setScreen("main");
              }}
              style={{
                padding: "20px 0",
                borderRadius: 20,
                border: current.isPaused ? "2px solid #3b82f6" : `2px solid ${G}`,
                background: current.isPaused ? "rgba(59, 130, 246, 0.08)" : GBG,
                color: current.isPaused ? "#3b82f6" : G,
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22, color: current.isPaused ? "#3b82f6" : undefined }}>{hasActive ? "▶" : "🚀"}</span>
              {hasActive ? "Continuar Turno" : "Iniciar Turno"}
            </button>
            <button
              onClick={() => setScreen("PantallaTurnos")}
              style={{
                padding: "20px 0",
                borderRadius: 20,
                border: `2px solid ${P}`,
                background: PBG,
                color: P,
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>📋</span>
              Turnos
            </button>
            <button
              onClick={() => setScreen("contabilidad")}
              style={{
                padding: "20px 0",
                borderRadius: 20,
                border: `2px solid ${A}`,
                background: ABG,
                color: A,
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>📊</span>
              Contabilidad
            </button>
          </div>
        </div>
        <button
          onClick={() => setScreen("settings")}
          style={{
            position: "absolute",
            bottom: 32,
            right: 28,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22
          }}
        >
          ⚙️
        </button>
      </Shell>
    );
  }

  if (screen === "settings") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("home"); setUpdateMsg(""); setDownloadUrl(""); }}><IconBack /></button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Ajustes de Usuario</div>
          </div>

          {/* Bloque App Info */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚕</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Mi Turno</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Versión {APP_VERSION}</div>
            <button onClick={checkUpdate} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>🔄 Buscar actualizaciones</button>
            {updateMsg && <div style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 12 }}>{updateMsg}</div>}
          </div>

          {/* Bloque Porcentajes */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: G, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <IconPercent s={22} c={G} /> Reparto de Porcentajes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div onClick={() => { setActiveSettingsField("porcentaje.jefe"); setSettingsValStr(settings["porcentaje.jefe"].toString().replace(".", ",")); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                <span style={{ color: "white", fontWeight: 600 }}>Jefe</span>
                <span style={{ color: A, fontSize: 20, fontWeight: 800 }}>{settings["porcentaje.jefe"]} %</span>
              </div>
              <div onClick={() => { setActiveSettingsField("porcentaje.chofer"); setSettingsValStr(settings["porcentaje.chofer"].toString().replace(".", ",")); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
                <span style={{ color: "white", fontWeight: 600 }}>Chofer</span>
                <span style={{ color: G, fontSize: 20, fontWeight: 800 }}>{settings["porcentaje.chofer"]} %</span>
              </div>
            </div>
          </div>

          {/* Bloque Total a Descontar (Seguridad + Neón Rojo) */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)", marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ff6b6b', textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
              <IconReceipt s={18} c="#ff6b6b" /> Total a Descontar
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.4 }}>
              Selecciona qué categorías se restan del Total a Dar al jefe.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {([
                { key: "descontar.datafono", label: "Datáfono", color: P, bg: PBG },
                { key: "descontar.propina", label: "Propinas", color: G, bg: GBG },
                { key: "descontar.agencia_bono", label: "Agencias/Bonos", color: A, bg: ABG },
                { key: "descontar.extra", label: "Extras", color: E, bg: EBG },
                { key: "descontar.gasolina", label: "Gasolina", color: F, bg: FBG },
                { key: "descontar.nulo", label: "Nulos", color: N, bg: NBG },
              ] as const).map((item) => {
                const isActive = settings[item.key as keyof AppSettings] as boolean;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setConfirmDialog({
                        text: `¿Seguro que quieres ${isActive ? "dejar de descontar" : "empezar a descontar"} la categoría ${item.label}?`,
                        onConfirm: () => {
                          setSettings({ ...settings, [item.key]: !isActive });
                        }
                      });
                    }}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 20,
                      border: isActive ? `1.5px solid ${item.color}` : `1.5px solid rgba(255,255,255,0.1)`,
                      background: isActive ? item.bg : 'transparent',
                      color: isActive ? item.color : 'rgba(255,255,255,0.4)',
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bloque Día Libre (Cuadrícula Original + Neón Oro) */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)", marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'oklch(0.85 0.18 85)', textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
              <IconHoliday s={18} c="oklch(0.85 0.18 85)" /> Día libre semanal
            </div>

            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.4 }}>
              Selecciona tu día libre. La semana laboral termina el día anterior y se reinicia al día siguiente.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 16 }}>
              {[
                { idx: 1, lbl: "L" },
                { idx: 2, lbl: "M" },
                { idx: 3, lbl: "X" },
                { idx: 4, lbl: "J" },
                { idx: 5, lbl: "V" },
                { idx: 6, lbl: "S" },
                { idx: 0, lbl: "D" },
              ].map((d) => {
                const selected = settings.diaLibre === d.idx;
                return (
                  <button
                    key={d.idx}
                    onClick={() => {
                      if (selected) return;
                      const nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                      setConfirmDialog({
                        text: `¿Cambiar tu día libre a ${nombres[d.idx]}? Las semanas anteriores quedarán congeladas tal y como están.`,
                        onConfirm: () => {
                          const fechaCambio = today();
                          const nuevosFrozen = freezeOldWeeks(
                            history,
                            settings.diaLibre,
                            fechaCambio,
                            frozenWeeks,
                            weekOverrides
                          );
                          setFrozenWeeks(nuevosFrozen);
                          setSettings({
                            ...settings,
                            diaLibre: d.idx,
                            diaLibreDesde: fechaCambio,
                          });
                          setConfirmDialog(null);
                        },
                      });
                    }}
                    style={{
                      padding: "16px 0",
                      borderRadius: 14,
                      border: selected ? `2px solid ${A}` : "1px solid rgba(255,255,255,0.08)",
                      background: selected ? ABG : "rgba(0,0,0,0.2)",
                      color: selected ? A : "rgba(255,255,255,0.7)",
                      fontSize: 16,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {d.lbl}
                  </button>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {(() => {
                const nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                const diaLibreTxt = nombres[settings.diaLibre];
                const inicioSemana = nombres[(settings.diaLibre + 1) % 7];
                const finSemana = nombres[(settings.diaLibre + 6) % 7];
                return `Día libre: ${diaLibreTxt} · Semana laboral: ${inicioSemana} → ${finSemana}`;
              })()}
            </div>
          </div>
        </div>

        {activeSettingsField && (
          <div
            onClick={() => setActiveSettingsField(null)}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 20px",
              zIndex: 9999,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 400,
                background: "#0d0d14",
                borderRadius: 28,
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                animation: "fadeUp 0.3s ease",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: activeSettingsField === "porcentaje.jefe" ? A : G, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                  Porcentaje {activeSettingsField === "porcentaje.jefe" ? "Jefe" : "Chofer"}
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: activeSettingsField === "porcentaje.jefe" ? A : G, marginBottom: 14, textAlign: "center", letterSpacing: "-0.5px" }}>
                {settingsValStr || "0"} %
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                  <button key={k}
                    onClick={() => {
                      let next = settingsValStr;
                      if (k === "DEL") next = next.slice(0, -1);
                      else if (k === ",") { if (!next.includes(",")) next = next + ","; else return; }
                      else { if (next.replace(",", "").length >= 3) return; next = next + k; }
                      setSettingsValStr(next);
                    }}
                    style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                    {k === "DEL" ? <IconDel /> : k}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  const val = parseFloat(settingsValStr.replace(",", ".")) || 0;
                  setConfirmDialog({
                    text: `¿Seguro que quieres cambiar el porcentaje de ${activeSettingsField === "porcentaje.jefe" ? "Jefe" : "Chofer"} a ${val}%?`,
                    onConfirm: () => {
                      setSettings({ ...settings, [activeSettingsField!]: val });
                      setActiveSettingsField(null);
                      setConfirmDialog(null);
                    }
                  });
                }}
                style={{
                  width: "100%",
                  padding: "16px 0",
                  marginTop: 12,
                  borderRadius: 14,
                  border: "none",
                  background: activeSettingsField === "porcentaje.jefe" ? A : G,
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
        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      </Shell>
    );
  }

  if (screen === 'summary' && viewTurno) {
    const vP = viewTurno.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
    const vD = viewTurno.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0);
    const isToday = viewTurno.date === today();
    const vA = viewTurno.entries.filter((e: any) => e.type === 'agencia' || e.type === 'agencia_bono').reduce((s: number, e: any) => s + e.amount, 0);
    const vE = viewTurno.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0);
    const vF = viewTurno.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0);
    const vN = viewTurno.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0);
    const dineroV = viewTurno.dinero || 0;
    const kmV = viewTurno.km || 0;
    const cats = [
      { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={20} c={P} />, total: vD, count: viewTurno.entries.filter((e: any) => e.type === 'datafono').length },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={20} c={G} />, total: vP, count: viewTurno.entries.filter((e: any) => e.type === 'propina').length },
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia' || e.type === 'agencia_bono').length },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={20} c={E} />, total: vE, count: viewTurno.entries.filter((e: any) => e.type === 'extra').length },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={20} c={F} />, total: vF, count: viewTurno.entries.filter((e: any) => e.type === 'gasolina').length },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={20} c={N} />, total: vN, count: viewTurno.entries.filter((e: any) => e.type === 'nulo').length },
    ];

    // Cálculo de duración
    let durationStr = "0h 0m";
    if (viewTurno.startTime && viewTurno.endTime) {
      let totalMins = getDiffMins(viewTurno.startTime, viewTurno.endTime);
      if (viewTurno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - viewTurno.totalPausedMinutes);
      }
      const hh = Math.floor(totalMins / 60);
      const mm = totalMins % 60;
      durationStr = `${hh}h ${mm}m`;
    }

    const miGanancia = (dineroV * (settings["porcentaje.chofer"] / 100)) + vP;

    // Cálculos dinámicos según ajustes
    const descD = settings["descontar.datafono"] ? vD : 0;
    const descP = settings["descontar.propina"] ? vP : 0;
    const descA = settings["descontar.agencia_bono"] ? vA : 0;
    const descE = settings["descontar.extra"] ? vE : 0;
    const descF = settings["descontar.gasolina"] ? vF : 0;
    const descN = settings["descontar.nulo"] ? vN : 0;

    const totalDescontar = descD + descP + descA + descE + descF + descN;
    const totalADar = (dineroV * (settings["porcentaje.jefe"] / 100)) - totalDescontar;

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={S.iconBtn} onClick={() => { setScreen(isToday ? 'home' : 'PantallaTurnos'); setViewTurno(null); }}><IconBack /></button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Resumen del Turno</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textTransform: 'none', marginTop: 1 }}>
                {viewTurno.startDate && viewTurno.startDate !== viewTurno.date
                  ? <>{fmtDate(viewTurno.startDate)} {viewTurno.startTime} – {fmtDate(viewTurno.date)} {viewTurno.endTime}</>
                  : <>{fmtDate(viewTurno.date)} · {viewTurno.startTime} – {viewTurno.endTime}</>}
              </div>
            </div>
            <button style={{ ...S.iconBtn, background: 'rgba(255,255,255,0.09)' }} onClick={() => {
              setEditJ({ ...viewTurno, entries: [...viewTurno.entries] });
              setScreen('editTurno');
            }}>
              <span style={{ fontSize: 16 }}>✏️</span>
            </button>
          </div>

          {/* Contenedor Superior Agrupado (Dos columnas) */}
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Columna Izquierda: Taxímetro y KM */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.60 0.16 150 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Total Taxímetro</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(dineroV)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Total KM</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{kmV.toString().replace('.', ',')} <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>KM</span></div>
              </div>
            </div>

            {/* Columna Derecha: Ganancia y Tiempo */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>💰</span> Mi Ganancia
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.85 0.18 85)', letterSpacing: '-0.5px' }}>{fmt(miGanancia)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(0, 180, 255, 0.05)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(0, 180, 255, 0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 20 }}>⏱️</span> Tiempo Trabajado
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}>{durationStr}</div>
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
                  <div style={{ fontSize: 20, fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{c.count} {c.count === 1 ? 'entrada' : 'entradas'}</div>
                </div>
              ))}
            </div>

            {(() => {
              const generalNotes = viewTurno.entries.filter((e: any) => e.type === 'nota');
              if (generalNotes.length === 0 && !viewTurno.notes) {
                return (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Sin notas del turno</div>
                  </div>
                );
              }
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                        {e.note}
                      </div>
                    ))}
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
                  <span>📌</span> Notas detalladas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entriesWithNotes.map((e: any) => {
                    const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : e.type === 'agencia' ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{e.time}</span>
                        <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: 'uppercase', minWidth: 60 }}>{e.type}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{e.note}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{fmt(e.amount)}</span>
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
                  <IconReceipt s={20} c="oklch(0.70 0.18 25)" />
                  Total a Descontar
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)', letterSpacing: '-0.5px' }}>
                  {fmt(totalDescontar)}
                </div>
              </div>

              {/* Tarjeta: Total a Dar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.18 0.07 145)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.68 0.20 145 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <IconGive s={20} c="oklch(0.68 0.20 145)" />
                  Total a Dar
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.68 0.20 145)', letterSpacing: '-0.5px' }}>
                  {fmt(totalADar)}
                </div>
              </div>

            </div>
          </div>

          {isToday && (
            <button onClick={() => setScreen('home')}
              style={{ marginTop: 4, padding: '17px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Volver al inicio
            </button>
          )}
        </div>
      </Shell>
    );
  }

  // ── EDIT TURNO SCREEN ───────────────────────────────────────
  if (screen === 'editTurno' && editJ) {
    function saveEdit() {
      const finalDinero = editJ.dineroStr !== undefined
        ? parseFloat(editJ.dineroStr.replace(',', '.')) || 0
        : (editJ.dinero || 0);
      const finalKm = editJ.kmStr !== undefined
        ? parseFloat(editJ.kmStr.replace(',', '.')) || 0
        : (editJ.km || 0);
      const updated = {
        ...editJ,
        dinero: finalDinero,
        km: finalKm,
        dineroStr: undefined,
        kmStr: undefined,
        totalP: editJ.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0),
        totalD: editJ.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0),
        totalA: editJ.entries.filter((e: any) => e.type === 'agencia' || e.type === 'agencia_bono').reduce((s: number, e: any) => s + e.amount, 0),
        totalE: editJ.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0),
        totalF: editJ.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0),
        totalN: editJ.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0),
      };
      setHistory((h: any[]) => h.map((j: any) => j.id === updated.id ? updated : j));
      setViewTurno(updated);
      setEditJ(null);
      setScreen('summary');
    }
    const eDinero = editJ.dineroStr !== undefined ? editJ.dineroStr : (editJ.dinero || 0).toString().replace('.', ',');
    const eKm = editJ.kmStr !== undefined ? editJ.kmStr : (editJ.km || 0).toString().replace('.', ',');
    function kpEdit(v: string) {
      if (!endField) return;
      const cur = endField === "dinero" ? eDinero : eKm;
      const key = endField === "dinero" ? "dineroStr" : "kmStr";
      let next = cur;
      if (v === "DEL") next = cur.slice(0, -1);
      else if (v === ",") { if (!cur.includes(",")) next = cur + ","; else return; }
      else { if (cur.replace(",", "").length >= 7) return; next = cur + v; }
      setEditJ({ ...editJ, [key]: next });
    }
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px 32px', overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button style={S.iconBtn} onClick={() => { setEditJ(null); setEndField(null); setScreen('summary'); }}><IconBack /></button>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Editar Turno</span>
          </div>

          {/* Dinero / KM (clickables) */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div onClick={() => setEndField("dinero")}
              style={{ flex: 1, background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px', border: `1.5px solid ${endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.60 0.16 150 / 0.35)"}`, cursor: "pointer" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Total Taxímetro</div>
              <div style={{ color: 'oklch(0.78 0.18 150)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>{eDinero || "0"} €</div>
            </div>
            <div onClick={() => setEndField("km")}
              style={{ flex: 1, background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px', border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`, cursor: "pointer" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Total KM</div>
              <div style={{ color: 'oklch(0.80 0.14 220)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>{eKm || "0"} KM</div>
            </div>
          </div>

          {/* Entradas editables */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: '14px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Entradas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editJ.entries.map((e: any) => {
                const meta = e.type === 'propina' ? { col: G, lbl: 'Propina' }
                  : e.type === 'datafono' ? { col: P, lbl: 'Datáfono' }
                    : (e.type === 'agencia' || e.type === 'agencia_bono') ? { col: A, lbl: 'Agencia/Bono' }
                      : e.type === 'extra' ? { col: E, lbl: 'Extra' }
                        : e.type === 'gasolina' ? { col: F, lbl: 'Gasolina' }
                          : e.type === 'nota' ? { col: 'white', lbl: 'Nota' }
                            : { col: N, lbl: 'Nulo' };
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.col, minWidth: 60 }}>{meta.lbl}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{e.type === 'nota' ? '' : fmt(e.amount)}</span>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {e.note}
                    </div>
                    <button onClick={() => openEditEntry(e)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ✏️
                    </button>
                  </div>
                );
              })}
              {editJ.entries.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: '10px 0' }}>Sin entradas</div>}
            </div>

            {/* Formulario para añadir nueva entrada */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>+ Añadir entrada olvidada</div>
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
                    {editJ.newAmount ? <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{editJ.newAmount}</span> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>0,00</span>}
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
                        <button key={k} onClick={(e) => {
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
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>📝 Notas del Turno</div>

            {editJ.entries.filter((e: any) => e.type === 'nota').length === 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 12 }}>Sin notas del turno</div>
            )}

            {editJ.entries.filter((e: any) => e.type === 'nota').map((e: any) => (
              <div key={e.id} style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', top: 10, left: 10, color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600 }}>{e.time}</span>
                <button
                  onClick={() => {
                    const newEntries = editJ.entries.filter((ent: any) => ent.id !== e.id);
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
                    const newEntries = editJ.entries.map((ent: any) =>
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
                <span style={{ fontSize: 16 }}>📝</span> Añadir Nueva Nota
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
                  <button key={k} onClick={() => kpEdit(k)}
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
    const cfg = {
      agencia_bono: { accent: A, bg: ABG, label: "Agencia/Bono", Icon: IconAgency },
      extra: { accent: E, bg: EBG, label: "Extra", Icon: IconExtra },
      gasolina: { accent: F, bg: FBG, label: "Gasolina", Icon: IconFuel },
      nulo: { accent: N, bg: NBG, label: "Nulo", Icon: IconNulo },
    }[singleMode] || { accent: E, bg: EBG, label: "Extra", Icon: IconExtra };
    const { accent, Icon } = cfg;
    const accentBg = cfg.bg;
    const label = cfg.label;

    function kpS(v: string) {
      if (v === "DEL") {
        setValS((p) => p.slice(0, -1));
        return;
      }
      if (v === ",") {
        if (!valS.includes(",")) setValS((p) => p + ",");
        return;
      }
      if (valS.replace(",", "").length >= 6) return;
      setValS((p) => p + v);
    }
    const validS = valS && parseFloat(valS.replace(",", ".")) > 0;
    function saveS() {
      if (!validS) return;
      const now = timeNow();
      const entry: Entry = {
        id: Date.now(),
        type: singleMode!,
        amount: parseFloat(valS.replace(",", ".")),
        note: noteS.trim(),
        time: now,
      };
      setCurrent((prev) => ({
        ...prev,
        startTime: prev.startTime || now,
        startDate: prev.startDate || today(),
        entries: [...prev.entries, entry],
      }));
      setValS("");
      setNoteS("");
      setSingleMode(null);
      setScreen("main");
    }

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("main"); setSingleMode(null); setValS(""); setNoteS(""); }}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
              Añadir {label}
            </div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: accent, marginBottom: 16, flexShrink: 0 }}>
            {valS || "0"} €
          </div>
          <input
            placeholder="Nota (opcional)"
            value={noteS}
            onChange={(e) => setNoteS(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "white", outline: "none", flexShrink: 0, marginBottom: 12 }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flexShrink: 0 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
              <button key={k} onClick={() => kpS(k)} style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>
          <button onClick={saveS} style={{ width: "100%", padding: 15, marginTop: 12, borderRadius: 12, border: "none", background: accent, color: "black", fontWeight: 700, flexShrink: 0 }}>
            Guardar
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "addNotaGeneral") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "12px 20px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", animation: "slideIn 0.25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("main"); setNoteS(""); }}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
              Añadir Nota
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <textarea
              placeholder="Escribe algo sobre el Turno..."
              value={noteS}
              onChange={(e) => setNoteS(e.target.value)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: 16,
                padding: 16,
                color: "white",
                fontSize: 16,
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.5
              }}
            />
          </div>

          <button
            onClick={() => {
              if (noteS.trim()) {
                const newEntry = {
                  id: Date.now(),
                  type: "nota",
                  amount: 0,
                  note: noteS.trim(),
                  time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                };
                setCurrent(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
              }
              setNoteS("");
              setScreen("main");
            }}
            style={{ width: "100%", padding: 18, marginTop: 16, borderRadius: 16, border: "none", background: "white", color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}
          >
            Añadir al Turno
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "add") {
    const setVal = activeField === "propina" ? setValP : setValD;
    const curVal = activeField === "propina" ? valP : valD;

    function kpAdd(v: string) {
      if (v === "DEL") {
        setVal((p) => p.slice(0, -1));
        return;
      }
      if (v === ",") {
        if (!curVal.includes(",")) setVal((p) => p + ",");
        return;
      }
      if (curVal.replace(",", "").length >= 6) return;
      setVal((p) => p + v);
    }

    function handleSaveAdd() {
      const p = parseFloat(valP.replace(",", "."));
      const d = parseFloat(valD.replace(",", "."));
      if (isNaN(p) && isNaN(d)) return;
      const now = timeNow();
      const newEntries: Entry[] = [];
      if (!isNaN(p) && p > 0)
        newEntries.push({ id: Date.now(), type: "propina", amount: p, note: noteP.trim(), time: now });
      if (!isNaN(d) && d > 0)
        newEntries.push({ id: Date.now() + 1, type: "datafono", amount: d, note: noteD.trim(), time: now });
      if (newEntries.length === 0) return;
      setCurrent((prev) => ({
        ...prev,
        startTime: prev.startTime || now,
        startDate: prev.startDate || today(),
        entries: [...prev.entries, ...newEntries],
      }));
      setValP(""); setValD(""); setNoteP(""); setNoteD("");
      setScreen("main");
    }

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => setScreen("main")}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
              Añadir {activeField === "propina" ? "Propina" : "Datáfono"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div
              onClick={() => setActiveField("datafono")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 16,
                background: activeField === "datafono" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeField === "datafono" ? P : "transparent"}`,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>DATÁFONO</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "datafono" ? P : "white" }}>{valD || "0"} €</div>
            </div>
            <div
              onClick={() => setActiveField("propina")}
              style={{
                flex: 1,
                padding: "16px",
                borderRadius: 16,
                background: activeField === "propina" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${activeField === "propina" ? G : "transparent"}`,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>PROPINA</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "propina" ? G : "white" }}>{valP || "0"} €</div>
            </div>
          </div>

          <input
            placeholder={`Nota para ${activeField} (opcional)`}
            value={activeField === "propina" ? noteP : noteD}
            onChange={(e) => activeField === "propina" ? setNoteP(e.target.value) : setNoteD(e.target.value)}
            style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "none", color: "white", marginBottom: 12, outline: "none", flexShrink: 0 }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flexShrink: 0 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
              <button key={k} onClick={() => kpAdd(k)} style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", fontSize: 22, fontWeight: 700, color: "white" }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>

          <button onClick={handleSaveAdd} style={{ width: "100%", padding: 18, marginTop: 12, borderRadius: 16, border: "none", background: activeField === "propina" ? G : P, color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>
            Guardar
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "contabilidad") {
    const hoyISO = today();
    const diaLibre = settings.diaLibre;

    // Construir lista de "elementos" a mostrar:
    // - Cada semana (en curso, calculada al vuelo, o congelada)
    // - Cada turno suelto
    //
    // Cada elemento tiene una "fecha de orden" (la del último día laboral de la
    // semana, o la fecha del turno suelto) para poder ordenarlos cronológicamente.

    type ElemSemana = {
      kind: "semana";
      weekId: string;
      fechaOrden: string;
      isFrozen: boolean;
      isEnCurso: boolean;
      frozen?: FrozenWeek;
      turnos: Turno[];
      override: WeekOverride | null;
    };
    type Elem = ElemSemana;

    const elementos: Elem[] = [];

    // 1. Procesar frozen weeks (no se recalculan)
    const frozenIds = new Set<string>();
    for (const fw of frozenWeeks) {
      frozenIds.add(fw.weekId);
      const turnosFw = history.filter((t) => fw.turnoIds.includes(t.id));
      elementos.push({
        kind: "semana",
        weekId: fw.weekId,
        fechaOrden: fw.fechaFin,
        isFrozen: true,
        isEnCurso: false,
        frozen: fw,
        turnos: turnosFw,
        override: getWeekOverride(weekOverrides, fw.weekId),
      });
    }

    // 2. Agrupar resto del historial por semana con día libre actual
    const grupos = groupTurnosByWeek(history, diaLibre);
    for (const [key, turnosSemana] of grupos.entries()) {
      // Semana
      const weekId = key;
      if (frozenIds.has(weekId)) continue; // ya añadida desde frozen
      const range = getWeekRange(weekId);
      const isEnCurso = !isWeekClosed(weekId, hoyISO);
      elementos.push({
        kind: "semana",
        weekId,
        fechaOrden: range.fin,
        isFrozen: false,
        isEnCurso,
        turnos: turnosSemana,
        override: getWeekOverride(weekOverrides, weekId),
      });
    }

    // 3. Detectar si la semana en curso ya existe; si no, crear una "vacía"
    //    para mostrarla siempre arriba aunque aún no haya turnos.
    const weekIdHoy = getWeekId(hoyISO, diaLibre);
    const tieneEnCurso = elementos.some(
      (e) => e.kind === "semana" && e.isEnCurso
    );
    if (weekIdHoy && !tieneEnCurso) {
      const range = getWeekRange(weekIdHoy);
      elementos.push({
        kind: "semana",
        weekId: weekIdHoy,
        fechaOrden: range.fin,
        isFrozen: false,
        isEnCurso: true,
        turnos: [],
        override: getWeekOverride(weekOverrides, weekIdHoy),
      });
    }

    // 4. Separar la semana en curso del resto
    const enCurso = elementos.find(
      (e) => e.kind === "semana" && e.isEnCurso
    ) as ElemSemana | undefined;
    const otros = elementos.filter((e) => e !== enCurso);

    // 5. Ordenar el resto por fechaOrden DESCENDENTE (más reciente primero)
    otros.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));

    // 6. Asignar mes a cada elemento (resolviendo empates)
    type ElemConMes = { elem: Elem; mesId: string | null /* null = empate sin resolver */ };
    const otrosConMes: ElemConMes[] = [];
    let primerEmpate: { weekId: string; candidates: { mesId: string; mesLabel: string }[] } | null = null;

    for (const elem of otros) {
      const r = getWeekMonth(elem.weekId, elem.isFrozen ? elem.frozen!.diaLibreUsado : diaLibre);
      if (r.type === "single") {
        otrosConMes.push({ elem, mesId: r.mesId });
      } else {
        // Empate: ¿hay resolución guardada en estado?
        const resolved = tieResolutions.get(elem.weekId);
        if (resolved) {
          otrosConMes.push({ elem, mesId: resolved });
        } else {
          otrosConMes.push({ elem, mesId: null });
          if (!primerEmpate) {
            primerEmpate = { weekId: elem.weekId, candidates: r.candidates };
          }
        }
      }
    }

    // 7. Si hay empate sin resolver y aún no se ha mostrado el diálogo, mostrarlo
    if (primerEmpate && !pendingTie) {
      // Disparamos el diálogo en el siguiente render
      setTimeout(() => setPendingTie(primerEmpate!), 0);
    }

    // 8. Agrupar otros por mes (preservando el orden ya descendente)
    type GrupoMes = { mesId: string; mesLabel: string; items: ElemConMes[] };
    const grupos2: GrupoMes[] = [];
    for (const item of otrosConMes) {
      if (item.mesId === null) continue; // empate no resuelto: se omite hasta que se resuelva
      const ultimo = grupos2[grupos2.length - 1];
      if (ultimo && ultimo.mesId === item.mesId) {
        ultimo.items.push(item);
      } else {
        grupos2.push({
          mesId: item.mesId,
          mesLabel: getMesLabel(item.mesId),
          items: [item],
        });
      }
    }

    // Render
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => setScreen("home")}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Contabilidad</div>
          </div>

          {/* === SEMANA EN CURSO === */}
          {enCurso && (() => {
            const totales = calcularTotalesTurnos(enCurso.turnos);
            const range = getWeekRange(enCurso.weekId);
            const dHoy = new Date(hoyISO + "T12:00:00");
            const dInicio = new Date(range.inicio + "T12:00:00");
            const diasTranscurridos = Math.min(
              6,
              Math.max(0, Math.floor((dHoy.getTime() - dInicio.getTime()) / 86400000) + 1)
            );

            return (
              <div
                onClick={() => {
                  setSelectedWeekId(enCurso.weekId);
                  setScreen("detalleSemana");
                }}
                style={{
                  background: `linear-gradient(135deg, ${ABG} 0%, oklch(0.20 0.05 200) 100%)`,
                  borderRadius: 22,
                  padding: 20,
                  border: `2px solid ${A}`,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: A,
                    background: "rgba(0,0,0,0.3)",
                    padding: "4px 10px",
                    borderRadius: 8,
                    letterSpacing: "0.8px",
                  }}>
                    EN CURSO
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                  }}>
                    Día {diasTranscurridos} de 6
                  </span>
                </div>

                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "white",
                  marginBottom: 4,
                  letterSpacing: "-0.5px",
                }}>
                  {formatWeekRange(enCurso.weekId)}
                </div>
                <div style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: 16,
                }}>
                  {enCurso.turnos.length} {enCurso.turnos.length === 1 ? "turno registrado" : "turnos registrados"}
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}>
                  <span style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    fontWeight: 700,
                  }}>
                    Acumulado parcial
                  </span>
                </div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: A,
                  letterSpacing: "-1px",
                  marginTop: 4,
                }}>
                  {fmt(totales.dinero)}
                </div>
              </div>
            );
          })()}

          {/* === SEMANAS ANTERIORES (agrupadas por mes) === */}
          {grupos2.length === 0 && !enCurso && (
            <div style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              marginTop: 40,
              fontSize: 15,
            }}>
              No hay semanas registradas todavía.
            </div>
          )}

          {grupos2.map((grupo) => (
            <div key={grupo.mesId} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                marginTop: 8,
                marginBottom: 2,
              }}>
                {grupo.mesLabel}
              </div>

              {grupo.items.map((item) => {
                // Tarjeta de semana
                const sem = item.elem;
                const totales = sem.isFrozen
                  ? sem.frozen!.totales
                  : calcularTotalesTurnos(sem.turnos);
                const numTurnos = sem.isFrozen
                  ? sem.frozen!.numTurnos
                  : sem.turnos.length;
                const entregada = sem.override?.entregada || sem.frozen?.entregada || false;

                return (
                  <div
                    key={`sem-${sem.weekId}`}
                    onClick={() => {
                      setSelectedWeekId(sem.weekId);
                      setScreen("detalleSemana");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 16,
                      padding: 16,
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "white",
                        marginBottom: 4,
                      }}>
                        {formatWeekRange(sem.weekId)}
                        {sem.isFrozen && (
                          <span style={{
                            fontSize: 11,
                            marginLeft: 8,
                            color: "rgba(180,220,255,0.7)",
                            fontWeight: 600,
                          }}>
                            ❄️
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                      }}>
                        {numTurnos} {numTurnos === 1 ? "turno" : "turnos"}
                      </div>
                    </div>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                    }}>
                      <div style={{
                        fontSize: 17,
                        fontWeight: 900,
                        color: "oklch(0.78 0.18 150)",
                      }}>
                        {fmt(totales.dinero)}
                      </div>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: entregada ? G : "oklch(0.75 0.16 70)",
                        background: entregada ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}>
                        {entregada ? "✓ Entregada" : "Pendiente"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Diálogo de empate 3-3 */}
        {pendingTie && (
          <div
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 20px",
              zIndex: 9999,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 380,
                background: "oklch(0.18 0.03 260)",
                borderRadius: 22,
                padding: 24,
                border: "1px solid rgba(255,255,255,0.1)",
                animation: "fadeUp 0.3s ease",
              }}
            >
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: "white",
                marginBottom: 8,
              }}>
                Semana entre dos meses
              </div>
              <div style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 20,
                lineHeight: 1.4,
              }}>
                La semana del {formatWeekRange(pendingTie.weekId)} tiene 3 días en cada mes. ¿Dónde la quieres?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendingTie.candidates.map((c) => (
                  <button
                    key={c.mesId}
                    onClick={() => {
                      const newMap = new Map(tieResolutions);
                      newMap.set(pendingTie.weekId, c.mesId);
                      setTieResolutions(newMap);
                      setPendingTie(null);
                    }}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 14,
                      border: `1px solid ${A}`,
                      background: ABG,
                      color: A,
                      fontSize: 16,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {c.mesLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Shell>
    );
  }

  if (screen === "detalleSemana" && selectedWeekId) {
    const weekId = selectedWeekId;
    const frozen = frozenWeeks.find((w) => w.weekId === weekId);
    const isFrozen = !!frozen;

    // Obtener turnos de la semana
    let turnosSemana: Turno[] = [];
    if (isFrozen) {
      turnosSemana = history.filter((t) => frozen!.turnoIds.includes(t.id));
    } else {
      const grupos = groupTurnosByWeek(history, settings.diaLibre);
      turnosSemana = grupos.get(weekId) || [];
    }

    // Totales (los del frozen si lo está, calculados al vuelo si no)
    const totales = isFrozen ? frozen!.totales : calcularTotalesTurnos(turnosSemana);

    // Estado actual de notas/entrega: viene del frozen o del override
    const override = getWeekOverride(weekOverrides, weekId);
    const notes = isFrozen
      ? (frozen!.notes || "")
      : (override?.notes || "");
    const entregada = isFrozen
      ? frozen!.entregada
      : (override?.entregada || false);
    const fechaEntrega = isFrozen
      ? frozen!.fechaEntrega
      : (override?.fechaEntrega || null);

    // Helper: aplicar cambio (a frozen o a override según corresponda)
    function applyChange(partial: Partial<Omit<WeekOverride, "weekId">>) {
      if (isFrozen) {
        updateFrozenWeek(weekId, partial);
      } else {
        updateWeekOverride(weekId, partial);
      }
    }

    function saveNotes() {
      applyChange({ notes: notesDraft.trim() });
      setEditingNotes(false);
    }

    // Categorías (para el grid de resumen, igual que en summary del turno)
    const cats = [
      { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: totales.totalD },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: totales.totalP },
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: totales.totalA },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: totales.totalE },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={18} c={F} />, total: totales.totalF },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: totales.totalN },
    ];

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          {/* Cabecera */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("contabilidad"); setSelectedWeekId(null); }}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
                Detalle de Semana {isFrozen && <span style={{ fontSize: 14, marginLeft: 6 }}>❄️</span>}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {formatWeekRangeFull(weekId)}
              </div>
            </div>
          </div>

          {/* Badge de estado */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: entregada ? G : "oklch(0.75 0.16 70)",
              background: entregada ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
              padding: "5px 10px", borderRadius: 8,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>
              {entregada ? `✓ Entregada${fechaEntrega ? " · " + fechaEntrega.split("-").reverse().join("/") : ""}` : "Pendiente"}
            </div>
            {isFrozen && (
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: "rgba(180,220,255,0.85)",
                background: "rgba(120,180,255,0.10)",
                padding: "5px 10px", borderRadius: 8,
                letterSpacing: "0.5px", textTransform: "uppercase",
              }}>
                ❄️ Congelada
              </div>
            )}
          </div>

          {/* Resumen totales */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Resumen de la semana
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.60 0.16 150 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Total Taxímetro</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(totales.dinero)}</div>
              </div>
              <div style={{ background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Total KM</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{(totales.km || 0).toString().replace('.', ',')} <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>KM</span></div>
              </div>
              {cats.map(c => (
                <div key={c.key} style={{ background: c.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {c.icon}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas de la semana */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Notas de la semana
              </div>
              {!editingNotes && (
                <button
                  onClick={() => { setNotesDraft(notes); setEditingNotes(true); }}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700, padding: "6px 12px", cursor: "pointer" }}
                >
                  {notes ? "Editar" : "Añadir"}
                </button>
              )}
            </div>
            {editingNotes ? (
              <div>
                <textarea
                  value={notesDraft}
                  onChange={(ev) => setNotesDraft(ev.target.value)}
                  placeholder="Escribe tus notas..."
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "white",
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => setEditingNotes(false)}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveNotes}
                    style={{ flex: 1.2, padding: "10px", borderRadius: 10, border: "none", background: G, color: "black", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: notes ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)", fontStyle: notes ? "normal" : "italic", lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
                {notes || "Sin notas"}
              </div>
            )}
          </div>

          {/* Lista de turnos */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Turnos de la semana ({turnosSemana.length})
            </div>
            {turnosSemana.length === 0 ? (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13, fontStyle: "italic", padding: "20px 0" }}>
                Sin turnos en esta semana todavía
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => { setViewTurno(t); setScreen("summary"); }}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{fmtDate(t.date)}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        {t.startTime} - {t.endTime} · {t.entries.length} {t.entries.length === 1 ? "entrada" : "entradas"}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "oklch(0.78 0.18 150)" }}>
                      {fmt(t.dinero || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón Marcar como entregada */}
          <button
            onClick={() => {
              if (entregada) {
                setConfirmDialog({
                  text: "¿Marcar esta semana como NO entregada?",
                  onConfirm: () => {
                    applyChange({ entregada: false, fechaEntrega: null });
                    setConfirmDialog(null);
                  },
                });
              } else {
                applyChange({ entregada: true, fechaEntrega: today() });
              }
            }}
            style={{
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: entregada ? "rgba(255,255,255,0.08)" : G,
              color: entregada ? "rgba(255,255,255,0.7)" : "black",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            {entregada ? "Desmarcar entregada" : "✓ Marcar como entregada"}
          </button>
        </div>

        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      </Shell>
    );
  }

  if (screen === "PantallaTurnos") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <button style={S.iconBtn} onClick={() => setScreen("home")}>
              <IconBack />
            </button>
            <div style={{ flex: 1, fontSize: 24, fontWeight: 800, color: "white", textAlign: "center" }}>
              Turnos
            </div>
            {history.length > 0 && (
              <button
                onClick={() => exportHistoryCSV(history)}
                title="Exportar historial a CSV"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "rgba(255,255,255,0.75)",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>⬇</span>
                CSV
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40, fontSize: 15 }}>
              No hay Turnos Anteriores.
            </div>
          ) : (
            history.map((j) => {
              let durationStr = "0h 0m";
              if (j.startTime && j.endTime) {
                let totalMins = getDiffMins(j.startTime, j.endTime);
                if (j.totalPausedMinutes) {
                  totalMins = Math.max(0, totalMins - j.totalPausedMinutes);
                }
                const hh = Math.floor(totalMins / 60);
                const mm = totalMins % 60;
                durationStr = `${hh}h ${mm}m`;
              }
              const choferPercent = settings["porcentaje.chofer"] || 0;
              const miGanancia = ((j.dinero || 0) * (choferPercent / 100)) + (j.totalP || 0);

              return (
                <div
                  key={j.id}
                  onClick={() => {
                    setViewTurno(j);
                    setScreen("summary");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    padding: 16,
                    cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(j.date)}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                      {j.startDate && j.startDate !== j.date
                        ? (() => {
                          const startStr = j.startDate.split('-').map(Number).reverse().join('/');
                          const endStr = j.date.split('-').map(Number).reverse().join('/');
                          return `${startStr} ${j.startTime} - ${endStr} ${j.endTime}`;
                        })()
                        : `${j.startTime} - ${j.endTime}`}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                      {j.entries.length} entradas
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)" }}>
                        {fmt(j.dinero || 0)}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)" }}>
                        {j.km || 0} KM
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.18 85)" }}>
                        💰 {fmt(miGanancia)}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)" }}>
                        ⏱️ {durationStr}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "todayHistory") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <button style={S.iconBtn} onClick={() => setScreen("main")}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
              Entradas de hoy
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...current.entries].reverse().map((e) => {
              const meta =
                e.type === "propina"
                  ? { col: G, ic: <IconCoin s={17} c={G} />, lbl: "Propina" }
                  : e.type === "datafono"
                    ? { col: P, ic: <IconCard s={17} c={P} />, lbl: "Datáfono" }
                    : (e.type === "agencia" || e.type === "agencia_bono")
                      ? { col: A, ic: <IconAgency s={17} c={A} />, lbl: "Agencia/Bono" }
                      : e.type === "extra"
                        ? { col: E, ic: <IconExtra s={17} c={E} />, lbl: "Extra" }
                        : e.type === "nulo"
                          ? { col: N, ic: <IconNulo s={17} c={N} />, lbl: "Nulo" }
                          : { col: F, ic: <IconFuel s={17} c={F} />, lbl: "Gasolina" };
              return (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 13,
                    padding: "10px 14px",
                  }}
                >
                  {meta.ic}
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                    {meta.lbl}
                    {e.note && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}> · {e.note}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginRight: 8 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.col }}>+{fmt(e.amount)}</span>
                  <button
                    onClick={() => openEditEntry(e)}
                    title="Editar entrada"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      borderRadius: 7,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      cursor: "pointer",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                    }}
                  >
                    ✏️
                  </button>
                </div>
              );
            })}
          </div>
          {current.entries.length > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  text: "¿Seguro que quieres borrar TODAS las entradas de hoy?",
                  onConfirm: () => {
                    setCurrent({ entries: [], startTime: current.startTime, startDate: current.startDate });
                    setScreen("main");
                  }
                });
              }}
              style={S.dangerBtn}
            >
              Borrar todas las entradas
            </button>
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

  if (screen === "confirmEnd") {
    function kpEnd(v: string) {
      if (!endField) return;
      const cur = endField === "dinero" ? dineroJ : kmJ;
      const setVal = endField === "dinero" ? setDineroJ : setKmJ;
      if (v === "DEL") { setVal(cur.slice(0, -1)); return; }
      if (v === ",") { if (!cur.includes(",")) setVal(cur + ","); return; }
      if (cur.replace(",", "").length >= 7) return;
      setVal(cur + v);
    }
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 20px 16px", overflowY: "auto", animation: "slideIn 0.25s ease", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("main"); setEndField(null); }}><IconBack /></button>
            <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Terminar Turno</span>
          </div>

          {/* Dinero / KM cards (clickables — abren el teclado in-app) */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexShrink: 0 }}>
            <div onClick={() => setEndField("dinero")}
              style={{ flex: 1, background: "oklch(0.20 0.06 150)", borderRadius: 16, padding: "14px", border: `1.5px solid ${endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.60 0.16 150 / 0.35)"}`, cursor: "pointer", transition: "border 0.15s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Total Taxímetro</div>
              <div style={{ color: "oklch(0.78 0.18 150)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>{dineroJ || "0"} €</div>
            </div>
            <div onClick={() => setEndField("km")}
              style={{ flex: 1, background: "oklch(0.19 0.05 220)", borderRadius: 16, padding: "14px", border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`, cursor: "pointer", transition: "border 0.15s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Total KM</div>
              <div style={{ color: "oklch(0.80 0.14 220)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>{kmJ || "0"} KM</div>
            </div>
          </div>

          {/* Resumen previo */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
              Resumen de hoy
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: PBG, borderRadius: 14, padding: "12px", border: `1px solid ${P}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconCard s={15} c={P} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Datáfono</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: P, letterSpacing: "-0.5px" }}>{fmt(totalD)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{datafonos.length} entrada{datafonos.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: GBG, borderRadius: 14, padding: "12px", border: `1px solid ${G}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconCoin s={15} c={G} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Propinas</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: G, letterSpacing: "-0.5px" }}>{fmt(totalP)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{propinas.length} entrada{propinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: ABG, borderRadius: 14, padding: "12px", border: `1px solid ${A}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconAgency s={15} c={A} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: A, letterSpacing: "-0.5px" }}>{fmt(totalA)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{agencias.length} entrada{agencias.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: EBG, borderRadius: 14, padding: "12px", border: `1px solid ${E}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconExtra s={15} c={E} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Extras</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: E, letterSpacing: "-0.5px" }}>{fmt(totalE)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{extras.length} entrada{extras.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: FBG, borderRadius: 14, padding: "12px", border: `1px solid ${F}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconFuel s={15} c={F} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Gasolina</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: F, letterSpacing: "-0.5px" }}>{fmt(totalF)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{gasolinas.length} entrada{gasolinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: NBG, borderRadius: 14, padding: "12px", border: `1px solid ${N}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconNulo s={15} c={N} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Nulos</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: N, letterSpacing: "-0.5px" }}>{fmt(totalN)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{nulos.length} entrada{nulos.length !== 1 ? "s" : ""}</div>
              </div>
            </div>

            {/* Notas añadidas durante el turno */}
            {(() => {
              const gNotes = current.entries.filter(e => e.type === 'nota');
              if (gNotes.length > 0) {
                return (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>📝 Notas del Turno</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {gNotes.map(e => (
                        <div key={e.id} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8 }}>
                          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                          {e.note}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: 'italic' }}>Sin notas del turno</div>
                </div>
              );
            })()}

          </div>

          {(() => {
            const entriesWithNotes = current.entries.filter(e => e.type !== 'nota' && e.note && e.note.trim());
            if (entriesWithNotes.length === 0) return null;
            return (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2 }}>📌 Notas detalladas</div>
                {entriesWithNotes.map(e => {
                  const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : (e.type === 'agencia' || e.type === 'agencia_bono') ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{e.time}</span>
                      <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: "uppercase", minWidth: 60 }}>{e.type === 'agencia_bono' ? 'agencia/bono' : e.type}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{e.note}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>{fmt(e.amount)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}


          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, marginTop: "auto" }}>
            <button onClick={handleEndTurno}
              style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
              Terminar Turno
            </button>
            <button onClick={() => setScreen("main")}
              style={{ padding: "13px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>

        {/* Teclado in-app para Dinero / KM */}
        {endField && (
          <div
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
                {(endField === "dinero" ? dineroJ : kmJ) || "0"} {endField === "dinero" ? "€" : "KM"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                  <button key={k} onClick={() => kpEnd(k)}
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
                  color: "rgba(255,255,255,0.35)",
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
              style={S.iconBtn}
              onClick={() => setScreen("home")}
              title="Inicio"
            >
              <span style={{ fontSize: 18 }}>🏠</span>
            </button>
            {active && current.startTime && (
              <button
                style={{ ...S.iconBtn, background: current.isPaused ? "rgba(255,180,0,0.15)" : S.iconBtn.background }}
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
              >
                <span style={{ fontSize: 18 }}>{current.isPaused ? "▶️" : "⏸️"}</span>
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
            icon={<IconFuel s={18} c={F} />}
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
                padding: "14px 16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: 18 }}>📝</span> Añadir Nota al Turno
            </button>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
            }}
          >
            Últimas entradas
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
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🚀 Iniciar Turno
                  </button>
                  <div style={{ marginTop: 14, fontSize: 13 }}>
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
                  const meta =
                    e.type === "propina"
                      ? { col: G, ic: <IconCoin s={17} c={G} />, lbl: "Propina" }
                      : e.type === "datafono"
                        ? {
                          col: P,
                          ic: <IconCard s={17} c={P} />,
                          lbl: "Datáfono",
                        }
                        : (e.type === "agencia" || e.type === "agencia_bono")
                          ? {
                            col: A,
                            ic: <IconAgency s={17} c={A} />,
                            lbl: "Agencia/Bono",
                          }
                          : e.type === "extra"
                            ? {
                              col: E,
                              ic: <IconExtra s={17} c={E} />,
                              lbl: "Extra",
                            }
                            : e.type === "nulo"
                              ? { col: N, ic: <IconNulo s={17} c={N} />, lbl: "Nulo" }
                              : e.type === "nota"
                                ? { col: "white", ic: <span style={{ fontSize: 16 }}>📝</span>, lbl: "Nota" }
                                : { col: F, ic: <IconFuel s={17} c={F} />, lbl: "Gasolina" };
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
                      {meta.ic}
                      <div
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        {meta.lbl}
                        {e.note && (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.28)",
                              fontSize: 12,
                            }}
                          >
                            {" "}
                            · {e.note}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.22)",
                          marginRight: 6,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col }}
                      >
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
                      </span>
                      <button
                        onClick={() => openEditEntry(e)}
                        title="Editar entrada"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "none",
                          borderRadius: 7,
                          color: "rgba(255,255,255,0.7)",
                          fontSize: 12,
                          cursor: "pointer",
                          width: 24,
                          height: 24,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 6,
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  );
                })}
              {current.entries.length > 4 && (
                <button
                  onClick={() => setScreen("todayHistory")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.22)",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "4px 0",
                    textAlign: "left",
                  }}
                >
                  Ver todas ({current.entries.length}) →
                </button>
              )}
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
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #7eb6ff, #3b82f6)",
              borderRadius: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
              boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25)"
            }}>
              <div style={{ width: 10, height: 32, background: "white", borderRadius: 4 }}></div>
              <div style={{ width: 10, height: 32, background: "white", borderRadius: 4 }}></div>
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

function SmallCard({
  label,
  color,
  bg,
  total,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        flex: 1,
        background: bg,
        borderRadius: 16,
        padding: "12px 14px",
        border: `1px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        transition: "all 0.15s",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
      }}
    >
      {icon}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color,
            letterSpacing: "-0.3px",
            marginTop: 2,
          }}
        >
          {fmt(total)}
        </div>
      </div>
    </div>
  );
}

function MainCard({
  label,
  color,
  bg,
  total,
  count,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  count: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        flex: 1,
        background: bg,
        borderRadius: 22,
        padding: "20px 18px",
        border: `1px solid ${color}33`,
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color,
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {fmt(total)}
      </div>
      <div
        style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 8 }}
      >
        {count} entrada{count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function EditEntryDialog({
  entry,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onSave,
  onDelete,
  onCancel,
}: {
  entry: Entry;
  amount: string;
  note: string;
  onAmountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [showKP, setShowKP] = React.useState(false);
  const meta: { col: string; lbl: string } =
    entry.type === "propina" ? { col: G, lbl: "Propina" }
      : entry.type === "datafono" ? { col: P, lbl: "Datáfono" }
        : (entry.type === "agencia" || entry.type === "agencia_bono") ? { col: A, lbl: "Agencia/Bono" }
          : entry.type === "extra" ? { col: E, lbl: "Extra" }
            : entry.type === "gasolina" ? { col: F, lbl: "Gasolina" }
              : entry.type === "nota" ? { col: "white", lbl: "Nota" }
                : { col: N, lbl: "Nulo" };

  function kpAmount(k: string) {
    if (k === "DEL") { onAmountChange(amount.slice(0, -1)); return; }
    if (k === ",") { if (!amount.includes(",")) onAmountChange(amount + ","); return; }
    if (amount.replace(",", "").length >= 7) return;
    onAmountChange(amount + k);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 20,
          padding: 20,
          width: "92%",
          maxWidth: 380,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: meta.col, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Editar {meta.lbl}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{entry.time}</span>
        </div>

        {/* Importe (display + teclado in-app) - Oculto para Notas */}
        {entry.type !== "nota" && (
          <div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setShowKP(true)}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", justifyContent: "space-between" }}>
              <span>Importe (€)</span>
              {!showKP && <span style={{ color: meta.col, fontSize: 10 }}>Toca para editar</span>}
            </div>
            <div style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${showKP ? meta.col : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12,
              color: showKP ? meta.col : "white",
              padding: "12px 14px",
              fontSize: 26,
              fontWeight: 900,
              textAlign: "center",
              minHeight: 32,
              letterSpacing: "-0.5px",
              transition: "all 0.2s"
            }}>
              {amount || "0"}
            </div>
          </div>
        )}

        {/* Teclado in-app */}
        {showKP && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14, animation: "fadeUp 0.2s ease" }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
              <button key={k} onClick={(e) => { e.stopPropagation(); kpAmount(k); }}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 0",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>Nota</div>
          <input
            value={note}
            onChange={(ev) => onNoteChange(ev.target.value)}
            placeholder="Nota opcional"
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "white",
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onDelete}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,60,60,0.15)",
              color: "#ff7b7b",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Eliminar
          </button>
          <button
            onClick={onSave}
            style={{
              flex: 1.2,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: meta.col,
              color: "black",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ text, onConfirm, onCancel, confirmText, confirmBg, confirmColor, confirmBorder }: any) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 20,
          padding: 24,
          width: "85%",
          maxWidth: 320,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.3s ease",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 12 }}>
          Confirmar acción
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.4 }}>
          {text}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: confirmBorder || "none",
              background: confirmBg || "rgba(255,60,60,0.2)",
              color: confirmColor || "#ff6b6b",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {confirmText || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
