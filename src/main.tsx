import React from "react";
import ReactDOM from "react-dom/client";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { LoginScreen } from "./login-screen";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";
import {
  userMetaDocRef,
  userSubcollectionRef,
  saveUserDoc,
  syncSubcollection,
  userHasFirestoreData,
} from "./firestore-sync";
import { AdminListScreen, AdminUserView } from "./admin-screens";

export { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "./formatters";

const { useState, useEffect, useRef } = React;

export interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

export interface TurnoConfig {
  porcentajeJefe: number;
  porcentajeChofer: number;
  descDatafono: boolean;
  descAgencia: boolean;
  descExtra: boolean;
  descGasolina: boolean;
}

export interface Turno {
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
  entregada?: boolean;
  fechaEntrega?: string | null;
  configTurno?: TurnoConfig;
  diaLibreContable?: number;
}

export interface TurnoNotasSemana {
  turno: Turno;
  notasGenerales: Entry[];
  notasDetalladas: Entry[];
}

interface EditTurnoState extends Turno {
  dineroStr?: string;
  kmStr?: string;
  newType?: string | null;
  newAmount?: string;
  newNote?: string;
  isAddingNote?: boolean;
  tempNote?: string;
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
const C = "oklch(0.75 0.15 290)";
const CBG = "oklch(0.18 0.05 290 / 0.12)";

const MESES_COMPLETOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_ABREVIADOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const WEEK_LIST_CARD_TEXT_SIZES = {
  range: "clamp(13px, 4.2cqw, 16px)",
  meta: "clamp(11px, 3.4cqw, 13px)",
  metric: "clamp(14px, 4.5cqw, 17px)",
} as const;

export const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;

export const TIME_CARD_UNIT_STYLE = {
  fontSize: "1em",
  fontWeight: KM_CARD_UNIT_STYLE.fontWeight,
  marginLeft: 2,
  letterSpacing: KM_CARD_UNIT_STYLE.letterSpacing,
} as const;

export const TIME_CARD_HOUR_UNIT_STYLE = {
  ...TIME_CARD_UNIT_STYLE,
  marginRight: 6,
} as const;

const KEY_CURRENT = "taxi_current_v3";
const KEY_HISTORY = "taxi_history_v3";
const KEY_SETTINGS = "taxi_settings_v3";
const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
const KEY_RESERVATIONS = "taxi_reservations_v1";
const KEY_NOTES = "taxi_notes_v1";

function userStorageKey(baseKey: string, uid = auth.currentUser?.uid || ""): string {
  return uid ? `${baseKey}__${uid}` : baseKey;
}

function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}

export interface Reserva {
  id: string;
  date: string;        // "YYYY-MM-DD"
  time: string;        // "HH:mm"
  origen: string;
  destino: string;
  cliente: string;
  telefono: string;    // permite llamada directa
  notas: string;
}

export type NotaTipo = 'ITV' | 'Seguro' | 'Normal' | 'Día libre';

export interface NotaCalendario {
  id: string;
  date: string;        // "YYYY-MM-DD"
  tipo: NotaTipo;
  texto: string;
}

interface WeekOverride {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

export interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
  diaLibre: number;              // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  diaLibreDesde: string | null;  // Fecha ISO desde la que aplica este día libre (null si nunca se ha cambiado)
}
// Inyectado por Vite en build a partir de process.env.APP_VERSION o package.json.
declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  return fmtMoney(n);
}

function DurationCardValue({ value }: { value: string }) {
  const parts = splitDurationLabel(value);
  return (
    <>
      {parts.hours}<span style={TIME_CARD_HOUR_UNIT_STYLE}>h</span>
      {parts.minutes}<span style={TIME_CARD_UNIT_STYLE}>m</span>
    </>
  );
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
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,           // Martes por defecto (tu día libre actual)
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

export function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function sortTurnosByDateDesc(turnos: Turno[]): Turno[] {
  return [...turnos].sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const byDate = dateB.localeCompare(dateA);
    if (byDate !== 0) return byDate;
    return (b.startTime || "").localeCompare(a.startTime || "");
  });
}

export function getTurnosByCalendarMonth(turnos: Turno[], year: number, month: number): Turno[] {
  const monthId = `${year}-${String(month).padStart(2, "0")}`;
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 7) === monthId)
  );
}

export function getTurnosByCalendarYear(turnos: Turno[], year: number): Turno[] {
  const yearId = String(year);
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 4) === yearId)
  );
}

export function ensureTurnosDiaLibreContable(turnos: Turno[], diaLibre: number): Turno[] {
  return turnos.map((turno) =>
    typeof turno.diaLibreContable === "number"
      ? turno
      : { ...turno, diaLibreContable: diaLibre }
  );
}

export function parseCSVToHistory(csvText: string): Turno[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
  if (lines.length < 2) return [];

  const newTurnosMap = new Map<string, Turno>();
  let timeBase = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const [date, startTime, endTime, type, amountStr, note, time, dineroStr, kmStr] = cols;

    const key = `${date}|${startTime}|${endTime}`;
    if (!newTurnosMap.has(key)) {
      newTurnosMap.set(key, {
        id: timeBase++,
        date,
        startTime: startTime || null,
        endTime,
        entries: [],
        totalP: 0, totalD: 0, totalA: 0, totalE: 0, totalF: 0, totalN: 0,
        dinero: parseFloat(dineroStr.replace(",", ".")) || 0,
        km: parseFloat(kmStr.replace(",", ".")) || 0,
        notes: "",
        startDate: date,
        totalPausedMinutes: 0
      });
    }

    const turno = newTurnosMap.get(key)!;

    if (type) {
      const amount = parseFloat(amountStr.replace(",", ".")) || 0;
      turno.entries.push({
        id: timeBase++,
        type,
        amount,
        note: note || "",
        time
      });

      if (type === 'propina') turno.totalP += amount;
      if (type === 'datafono') turno.totalD += amount;
      if (type === 'agencia_bono') turno.totalA += amount;
      if (type === 'extra') turno.totalE += amount;
      if (type === 'gasolina') turno.totalF += amount;
      if (type === 'nulo') turno.totalN += amount;
    }
  }

  return sortTurnosByDateDesc(Array.from(newTurnosMap.values()));
}

export function buildBackupPayload(values: {
  history: string | null;
  settings: string | null;
  current: string | null;
  weekOverrides: string | null;
  reservations: string | null;
  notes: string | null;
}) {
  return {
    history: values.history,
    settings: values.settings,
    current: values.current,
    weekOverrides: values.weekOverrides,
    reservations: values.reservations,
    notes: values.notes,
  };
}

export function buildBackupPayloadFromState(values: {
  history: Turno[];
  settings: AppSettings;
  current: CurrentState;
  weekOverrides: WeekOverride[];
  reservations: Reserva[];
  notes: NotaCalendario[];
}) {
  return buildBackupPayload({
    history: JSON.stringify(values.history),
    settings: JSON.stringify(values.settings),
    current: JSON.stringify(values.current),
    weekOverrides: JSON.stringify(values.weekOverrides),
    reservations: JSON.stringify(values.reservations),
    notes: JSON.stringify(values.notes),
  });
}

export type HomeQuickActionId = "new-reservation" | "agenda" | "admin-users" | "logout" | "settings";
export type BackupMenuActionId = "export-json" | "restore-json";

export function getHomeQuickActionIds(isAdmin: boolean): HomeQuickActionId[] {
  const actions: HomeQuickActionId[] = ["new-reservation", "agenda"];
  if (isAdmin) actions.push("admin-users");
  actions.push("logout", "settings");
  return actions;
}

export function getBackupMenuActionIds(_isAdmin: boolean): BackupMenuActionId[] {
  return ["export-json", "restore-json"];
}

// El payload se construye en el call site con buildBackupPayloadFromState
// pasando los estados React vivos (espejo de Firestore en memoria).
// Antes había un default que leía de localStorage; eliminado para evitar
// exportar datos obsoletos: localStorage va un tick por detrás del estado.
async function exportBackupJSON(backup: ReturnType<typeof buildBackupPayload>) {
  const json = JSON.stringify(backup, null, 2);
  const fileName = `taxi_backup_${new Date().toISOString().split("T")[0]}.json`;

  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    await Share.share({
      title: "Copia de seguridad",
      text: "Copia de seguridad de Mi Turno",
      url: result.uri,
      dialogTitle: "Compartir / Guardar copia de seguridad",
    });
  } catch (e) {
    console.error("exportBackupJSON error:", e);
    alert("No se pudo exportar la copia de seguridad.");
  }
}

// Esta función mezcla los turnos seleccionados con los actuales sin duplicar
function getTurnoMergeKey(t: Turno): string {
  return [
    t.startDate || "",
    t.date || "",
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}

export function mergeTurnos(actuales: Turno[], nuevos: Turno[]) {
  const map = new Map();
  // Primero metemos los que ya tienes
  actuales.forEach(t => map.set(getTurnoMergeKey(t), t));
  // Luego añadimos los nuevos (si coinciden fecha e inicio, el map no se duplica)
  nuevos.forEach(t => map.set(getTurnoMergeKey(t), t));

  return sortTurnosByDateDesc(Array.from(map.values()));
}

function loadCurrent(): CurrentState {
  try {
    const d = readLocalJSON<CurrentState>(KEY_CURRENT);
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
    const d = readLocalJSON<Turno[]>(KEY_HISTORY);
    if (Array.isArray(d)) return sortTurnosByDateDesc(d);
  } catch (e) { }
  return [];
}
function loadReservations(): Reserva[] {
  try {
    const d = readLocalJSON<Reserva[]>(KEY_RESERVATIONS);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}
function loadNotes(): NotaCalendario[] {
  try {
    const d = readLocalJSON<NotaCalendario[]>(KEY_NOTES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function getStartOffset(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  return offset;
}

// ============================================================================
// SEMANAS — Funciones lógicas (Fase 2)
// ============================================================================

export function getWeekStartDate(dateStr: string, diaLibre: number): string {
  const d = new Date(dateStr + "T12:00:00");
  const currentDayOfWeek = d.getDay();
  const startDayOfWeek = (diaLibre + 1) % 7;
  let diff = currentDayOfWeek - startDayOfWeek;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekId(dateStr: string, diaLibre: number): string {
  return getWeekStartDate(dateStr, diaLibre);
}

export function getWeekRange(weekId: string): { inicio: string; fin: string } {
  const d = new Date(weekId + "T12:00:00");
  const inicio = weekId;
  d.setDate(d.getDate() + 5);
  const fin = d.toISOString().slice(0, 10);
  return { inicio, fin };
}

export function getCurrentOpenWeekId(hoyISO: string, diaLibre: number): string | null {
  const hoy = new Date(hoyISO + "T12:00:00");
  if (hoy.getDay() === diaLibre) return null;

  const weekId = getWeekId(hoyISO, diaLibre);
  return isWeekClosed(weekId, hoyISO) ? null : weekId;
}

export function selectAccountingHeroWeek(
  currentOpenWeekId: string | null,
  recentWeekIds: string[]
): { weekId: string; kind: "current" | "latest" } | null {
  if (currentOpenWeekId) return { weekId: currentOpenWeekId, kind: "current" };
  const latestWeekId = recentWeekIds[0];
  return latestWeekId ? { weekId: latestWeekId, kind: "latest" } : null;
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
export function getTurnoFechaEfectiva(turno: Turno, diaLibre: number): string {
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

export function getTurnoAccountingWeekId(turno: Turno, diaLibre: number): string | null {
  const diaLibreTurno = turno.diaLibreContable ?? diaLibre;
  const fechaInicio = turno.startDate || turno.date;
  if (!fechaInicio) return getWeekId(turno.date, diaLibreTurno);

  const diaInicio = new Date(fechaInicio + "T12:00:00").getDay();
  const diaFin = new Date(turno.date + "T12:00:00").getDay();

  if (diaInicio === diaLibreTurno && turno.date === fechaInicio) {
    return null;
  }

  if (diaInicio === diaLibreTurno && turno.date && turno.date !== fechaInicio && diaFin !== diaLibreTurno) {
    return getWeekId(turno.date, diaLibreTurno);
  }

  return getWeekId(fechaInicio, diaLibreTurno);
}

export function groupTurnosByWeek(turnos: Turno[], diaLibre: number): Map<string, Turno[]> {
  const map = new Map<string, Turno[]>();
  const sorted = [...turnos].sort((a, b) => {
    const dateA = getTurnoFechaEfectiva(a, diaLibre);
    const dateB = getTurnoFechaEfectiva(b, diaLibre);
    return dateA.localeCompare(dateB);
  });
  for (const t of sorted) {
    const weekId = getTurnoAccountingWeekId(t, diaLibre);
    if (!weekId) continue;
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

export function calcularTotalesTurnos(turnos: Turno[]) {
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

function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildTurnoConfigFromSettings(settings: AppSettings): TurnoConfig {
  return {
    porcentajeJefe: settings["porcentaje.jefe"],
    porcentajeChofer: settings["porcentaje.chofer"],
    descDatafono: settings["descontar.datafono"],
    descAgencia: settings["descontar.agencia_bono"],
    descExtra: settings["descontar.extra"],
    descGasolina: settings["descontar.gasolina"],
  };
}

export function getTurnoConfig(turno: Turno, settings: AppSettings): TurnoConfig {
  return turno.configTurno || buildTurnoConfigFromSettings(settings);
}

export function calcularTurnoContable(turno: Turno, settings: AppSettings) {
  const config = getTurnoConfig(turno, settings);
  const dineroBase = (turno.dinero || 0) - (turno.totalN || 0);
  const descD = config.descDatafono ? (turno.totalD || 0) : 0;
  const descA = config.descAgencia ? (turno.totalA || 0) : 0;
  const descE = config.descExtra ? (turno.totalE || 0) : 0;
  const descF = config.descGasolina ? (turno.totalF || 0) : 0;
  const totalDescontar = descD + descA + descE + descF;

  return {
    dineroBase: roundMoney(dineroBase),
    miGanancia: roundMoney((dineroBase * (config.porcentajeChofer / 100)) + (turno.totalP || 0)),
    descD,
    descA,
    descE,
    descF,
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney((dineroBase * (config.porcentajeJefe / 100)) - totalDescontar),
    config,
  };
}

export function calcularResumenContableTurnos(turnos: Turno[], settings: AppSettings) {
  const totales = calcularTotalesTurnos(turnos);
  let miGanancia = 0;
  let totalDescontar = 0;
  let totalADar = 0;

  for (const turno of turnos) {
    const calculo = calcularTurnoContable(turno, settings);
    miGanancia += calculo.miGanancia;
    totalDescontar += calculo.totalDescontar;
    totalADar += calculo.totalADar;
  }

  return {
    ...totales,
    dineroBase: roundMoney((totales.dinero || 0) - (totales.totalN || 0)),
    miGanancia: roundMoney(miGanancia),
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney(totalADar),
  };
}

export function updateTurnoEntrega(
  turnos: Turno[],
  turnoId: number,
  entregada: boolean,
  fechaEntrega: string | null
): Turno[] {
  return turnos.map((t) =>
    t.id === turnoId
      ? { ...t, entregada, fechaEntrega: entregada ? fechaEntrega : null }
      : t
  );
}

export function getTurnosNotasSemana(turnos: Turno[]): TurnoNotasSemana[] {
  return turnos
    .map((turno) => {
      const notasGenerales = turno.entries.filter((entry) => entry.type === "nota" && !!entry.note?.trim());
      const notasDetalladas = turno.entries.filter((entry) => entry.type !== "nota" && !!entry.note?.trim());
      return { turno, notasGenerales, notasDetalladas };
    })
    .filter((item) => item.notasGenerales.length > 0 || item.notasDetalladas.length > 0);
}

// ============================================================================
// SEMANAS — Carga y guardado en localStorage (Fase 3)
// ============================================================================

function loadWeekOverrides(): WeekOverride[] {
  try {
    const d = readLocalJSON<WeekOverride[]>(KEY_WEEK_OVERRIDES);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

/**
 * Crea un override por defecto (vacío) para un weekId dado.
 */
/**
 * Devuelve el override de una semana, o null si no existe.
 */
function getWeekOverride(overrides: WeekOverride[], weekId: string): WeekOverride | null {
  return overrides.find((o) => o.weekId === weekId) || null;
}

const DIAS_LABORABLES_SEMANA = 6;
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
function getWeekMonth(weekId: string): {
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
  for (let i = 0; i < DIAS_LABORABLES_SEMANA; i++) {
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
  const labelOf = (mesId: string) => {
    const [y, m] = mesId.split("-").map(Number);
    return `${MESES_COMPLETOS[m - 1]} ${y}`;
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
  const [y, m] = mesId.split("-").map(Number);
  return `${MESES_COMPLETOS[m - 1]} ${y}`;
}

export function getAccountingPeriodLabel(year: number, month: number): string {
  return getMesLabel(`${year}-${String(month).padStart(2, "0")}`);
}

/**
 * Devuelve el rango formateado para mostrar en la tarjeta de semana.
 * Ej: "6 - 11 May" o "29 Abr - 4 May"
 */
function formatWeekRange(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  if (dInicio.getMonth() === dFin.getMonth() && dInicio.getFullYear() === dFin.getFullYear()) {
    return `${dInicio.getDate()} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
  }
  return `${dInicio.getDate()} ${MESES_COMPLETOS[dInicio.getMonth()]} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
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
  return `${dias[dInicio.getDay()]} ${dInicio.getDate()} ${MESES_ABREVIADOS[dInicio.getMonth()]} - ${dias[dFin.getDay()]} ${dFin.getDate()} ${MESES_ABREVIADOS[dFin.getMonth()]} ${dFin.getFullYear()}`;
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

const IconRefresh = ({ s = 20, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 4V9H9" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20V15H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 9C18.8289 5.50429 15.6836 3 12 3C7.02944 3 3 7.02944 3 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15C5.17112 18.4957 8.31641 21 12 21C16.9706 21 21 16.9706 21 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconDownload = ({ s = 20, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V16" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11L12 16L17 11" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20H4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconUpload = ({ s = 20, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 20V8" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 13L12 8L17 13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4H4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);




// Icono para Total Descontar (Ticket/Factura)
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

const IconPlay = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path
      d="M8 5.5L18.5 12L8 18.5V5.5Z"
      fill={c}
    />
  </svg>
);

const IconPause = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="6.5" y="5" width="4.2" height="14" rx="1.7" fill={c} />
    <rect x="13.3" y="5" width="4.2" height="14" rx="1.7" fill={c} />
  </svg>
);

const IconLogoutNeon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(180 12 12)">
      <path
        d="M10.5 5.2H5.8C4.8 5.2 4 6 4 7V17C4 18 4.8 18.8 5.8 18.8H10.5"
        stroke="#ff7a8a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 1.2px rgba(255,122,138,0.8)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }}
      />
      <path
        d="M11 12H19"
        stroke="#ffb1bc"
        strokeWidth="2.2"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 1.2px rgba(255,177,188,0.75)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }}
      />
      <path
        d="M16 8.5L19.5 12L16 15.5"
        stroke="#ffb1bc"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 1.2px rgba(255,177,188,0.75)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }}
      />
    </g>
  </svg>
);

const IconAdminNeon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path
      d="M12 3.4L19 6.1V11.4C19 15.8 16.2 19.4 12 20.8C7.8 19.4 5 15.8 5 11.4V6.1L12 3.4Z"
      stroke="#7dd3ff"
      strokeWidth="2"
      strokeLinejoin="round"
      style={{ filter: "drop-shadow(0 0 1.2px rgba(125,211,255,0.8)) drop-shadow(0 0 5px rgba(66,165,245,0.32))" }}
    />
    <path
      d="M9 12.2L11 14.2L15.4 9.8"
      stroke="#b9f6ff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: "drop-shadow(0 0 1.2px rgba(185,246,255,0.78)) drop-shadow(0 0 5px rgba(66,165,245,0.28))" }}
    />
  </svg>
);

const IconHomeNeon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path
      d="M4.2 11.2L12 5.2L19.8 11.2"
      stroke="#ffb347"
      strokeWidth="2.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        filter:
          "drop-shadow(0 0 1.2px rgba(255,190,77,0.75)) drop-shadow(0 0 4px rgba(255,139,61,0.28))",
      }}
    />
    <path
      d="M6.7 10.3V19H17.3V10.3"
      stroke="#ffb347"
      strokeWidth="2"
      strokeLinejoin="round"
      style={{
        filter:
          "drop-shadow(0 0 1.2px rgba(255,190,77,0.75)) drop-shadow(0 0 4px rgba(255,139,61,0.28))",
      }}
    />
    <path d="M10 19V14.2H14V19" stroke="#ffe071" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 11.7H15" stroke="#ffd56a" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </svg>
);

const IconCalendar = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="16" rx="3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2V6M8 2V6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 9H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="7.5" cy="13.5" r="1" fill={c} />
    <circle cx="12" cy="13.5" r="1" fill={c} />
    <circle cx="16.5" cy="13.5" r="1" fill={c} />
    <circle cx="7.5" cy="17.5" r="1" fill={c} opacity="0.6" />
    <circle cx="12" cy="17.5" r="1" fill={c} opacity="0.6" />
    <circle cx="16.5" cy="17.5" r="1" fill={c} opacity="0.6" />
  </svg>
);

const IconSettings = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
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

// ============================================================================
// MIGRACIÓN DE LOCALSTORAGE A FIRESTORE
// ============================================================================
// Esta función se ejecuta UNA SOLA VEZ por dispositivo, la primera vez que un
// usuario inicia sesión tras la introducción de Firebase. Sube todo lo que haya
// en localStorage a la cuenta del usuario logueado y deja un flag para que
// futuras sesiones (de cualquier usuario en el mismo móvil) NO repitan la
// subida — esto impide que los datos del usuario A se acaben en la cuenta de B
// si comparten teléfono.
const LOCAL_MIGRATION_KEY = "taxi_migration_done_v1";

// Tiempo máximo (ms) que esperamos a que lleguen los snapshots iniciales de
// Firestore antes de mostrar al usuario los botones Reintentar / Cerrar sesión.
const LOAD_TIMEOUT_MS = 15000;

async function migrarLocalStorageAFirestore(uid: string): Promise<void> {
  if (localStorage.getItem(LOCAL_MIGRATION_KEY)) return;

  // Guarda extra: si el usuario ya tiene datos en Firestore (p.ej. porque
  // instaló la app antes en otro dispositivo y migró allí), NO subimos lo que
  // haya en localStorage para evitar contaminar su cuenta con datos de otro
  // usuario que pudiera haber usado este mismo móvil antes.
  // Marcamos como migrado=false con un motivo trazable y salimos.
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

  // Tras subir TODO a Firestore, eliminamos las claves globales antiguas del
  // localStorage. A partir de este momento, los datos del usuario activo
  // viven en claves sufijadas por uid (writeUserLocalJSON) y en Firestore.
  // Esto evita que, si otro usuario inicia sesión en este móvil más tarde,
  // estas claves globales puedan ser leídas o migradas a su cuenta.
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
  const [downloadUrl, setDownloadUrl] = useState("");
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editEntryAmount, setEditEntryAmount] = useState("");
  const [editEntryNote, setEditEntryNote] = useState("");
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [weekOverrides, setWeekOverrides] = useState<WeekOverride[]>(loadWeekOverrides);

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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);

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

  // -------------------------------------------------------------------------
  // GUARDADO EN FIRESTORE
  // -------------------------------------------------------------------------
  // Cada useEffect observa una pieza del estado y la sube a Firestore cuando
  // cambia. Reglas comunes:
  //   - Si dataLoaded es false, NO escribimos: aún estamos en carga inicial.
  //   - Si no hay usuario autenticado, no escribimos.
  //   - Para subcolecciones (turnos, reservas, notas, weekOverrides)
  //     usamos syncSubcollection, que hace diff y sólo escribe lo que cambió.
  //   - lastXRef se actualiza después de escribir para que el siguiente diff
  //     se compute contra lo último que hemos subido nosotros mismos.

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    // Si el estado coincide con lo último que recibimos del servidor, no
    // tiene sentido reescribir (evita bucle snapshot → setCurrent → save → snapshot).
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

  // -------------------------------------------------------------------------
  // INICIALIZACIÓN DE FIRESTORE
  // -------------------------------------------------------------------------
  // Al montar el componente con un usuario autenticado:
  //   1. Si el dispositivo nunca ha migrado, sube los datos de localStorage
  //      al usuario actual.
  //   2. Se suscribe a las 6 piezas de datos del usuario (current, settings,
  //      turnos, reservas, notes, weekOverrides) con onSnapshot.
  //   3. Cuando han llegado las 6 primeras respuestas, marca dataLoaded=true
  //      y la app habilita la escritura.
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

      // current (single doc)
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

      // settings (single doc)
      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "settings"), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          lastSettingsRef.current = data;
          writeUserLocalJSON(uid, KEY_SETTINGS, data);
          setSettings(data);
        }
        marcar("settings");
      }));

      // turnos (subcollection)
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, orderedItems);
        setHistory(orderedItems);
        marcar("turnos");
      }));

      // reservations (subcollection)
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, items);
        setReservations(items);
        marcar("reservations");
      }));

      // notes (subcollection)
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "notes"), (snap) => {
        const items: NotaCalendario[] = [];
        snap.forEach((d) => items.push(d.data() as NotaCalendario));
        lastNotesRef.current = items;
        writeUserLocalJSON(uid, KEY_NOTES, items);
        setNotes(items);
        marcar("notes");
      }));

      // weekOverrides (subcollection)
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

  // Timeout de la carga inicial. Si en LOAD_TIMEOUT_MS no han llegado las 6
  // colecciones (Firestore caído, red sin conexión, certificado bloqueado…),
  // activamos loadTimedOut para que el usuario pueda Reintentar (recargar la
  // página) o Cerrar sesión, en lugar de quedarse mirando "Cargando tus datos…".
  useEffect(() => {
    if (dataLoaded) return;
    const t = setTimeout(() => setLoadTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [dataLoaded]);

  // Detección del rol de administrador.
  // Lee UNA vez admins/{uid_actual}. Si existe, isAdmin = true y la app
  // mostrará el botón "Ver datos de otro usuario" en la pantalla home.
  // La existencia o no de este documento sólo se gestiona desde
  // Firebase Console (las reglas bloquean cualquier escritura desde la app).
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
    const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
    return (
      <Shell burst={false}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "32px 28px 110px",
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
                color: "rgba(255,255,255,0.5)",
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
                height: 68,
                padding: 0,
                whiteSpace: "nowrap",
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
              {active ? (
                <>
                  <IconRocket s={30} c={G} />
                  <IconPlay s={40} c="#3b82f6" />
                </>
              ) : (
                <IconRocket s={30} c={G} />
              )}
              {active ? "Continuar Turno" : "Iniciar Turno"}
            </button>
            <button
              onClick={() => setScreen("PantallaTurnos")}
              style={{
                height: 68,
                padding: 0,
                whiteSpace: "nowrap",
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
              <IconClipboard s={30} c={P} />
              Turnos
            </button>
            <button
              onClick={() => setScreen("contabilidad")}
              style={{
                height: 68,
                padding: 0,
                whiteSpace: "nowrap",
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
              <IconChart s={30} c={A} />
              Contabilidad
            </button>
            <button
              onClick={() => setScreen("calendar")}
              style={{
                height: 68,
                padding: 0,
                whiteSpace: "nowrap",
                borderRadius: 20,
                border: `2px solid ${C}`,
                background: CBG,
                color: C,
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <IconCalendar s={30} c={C} />
              Calendario
            </button>
          </div>
        </div>
        <button
          onClick={() => openNewReserva()}
          aria-label="Nueva reserva"
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            width: 54,        // <-- Ancho fijo igual al tamaño original
            height: 54,       // <-- Alto fijo igual al tamaño original
            background: "rgba(0, 200, 220, 0.08)",
            border: "1px solid rgba(0, 200, 220, 0.28)",
            borderRadius: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            padding: 0        // <-- Quitamos el padding para que no empuje
          }}
        >
          <IconReservaWrite s={32} />
        </button>
        <button
          onClick={() => { setCalendarView('agenda'); setScreen("calendar"); }}
          style={{
            position: "absolute",
            top: 24,
            right: 28,
            width: 54,        // <-- Ancho fijo igual al tamaño original
            height: 54,       // <-- Alto fijo igual al tamaño original
            background: "rgba(180, 120, 255, 0.08)",
            border: "1px solid rgba(180, 120, 255, 0.28)",
            borderRadius: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            padding: 0        // <-- Quitamos el padding para que no empuje
          }}
        >
          <IconAgenda s={32} c="oklch(0.75 0.15 290)" />
        </button>
        {renderReservaDialog()}
        {homeQuickActionIds.includes("admin-users") && (
          <button
            onClick={() => setAdminMode("list")}
            aria-label="Ver datos de otro usuario"
            title="Ver datos de otro usuario"
            style={{
              position: "absolute",
              bottom: 32,
              left: 28,
              width: 54,
              height: 54,
              background: "rgba(75, 190, 255, 0.08)",
              border: "1px solid rgba(75, 190, 255, 0.28)",
              borderRadius: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              padding: 0
            }}
          >
            <IconAdminNeon s={32} />
          </button>
        )}
        <button
          onClick={() => {
            setConfirmDialog({
              text: "\u00bfCerrar sesi\u00f3n? Tus datos seguir\u00e1n guardados y podr\u00e1s volver a entrar m\u00e1s tarde.",
              confirmText: "Cerrar sesi\u00f3n",
              onConfirm: () => {
                signOut(auth).catch((err) => {
                  console.error("signOut error:", err);
                });
              },
            });
          }}
          aria-label="Cerrar sesi\u00f3n"
          title="Cerrar sesi\u00f3n"
          style={{
            position: "absolute",
            bottom: 32,
            right: 94,
            width: 54,
            height: 54,
            background: "rgba(255, 95, 95, 0.08)",
            border: "1px solid rgba(255, 95, 95, 0.28)",
            borderRadius: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            padding: 0
          }}
        >
          <IconLogoutNeon s={32} />
        </button>
        <button
          onClick={() => { setConfirmDialog(null); setScreen("settings"); }}
          style={{
            position: "absolute",
            bottom: 32,
            right: 28,
            width: 54,
            height: 54,
            background: "rgba(0, 220, 180, 0.08)",
            border: "1px solid rgba(0, 220, 180, 0.28)",
            borderRadius: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            padding: 0
          }}
        >
          <IconSettings s={32} c="oklch(0.72 0.01 250)" />
        </button>
        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      </Shell>
    );
  }

  if (screen === "calendar") {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = getStartOffset(year, month);
    const daysInMonth = getDaysInMonth(year, month);

    const prevMonth = () => {
      setCalendarMonth(new Date(year, month - 1, 1));
    };
    const nextMonth = () => {
      setCalendarMonth(new Date(year, month + 1, 1));
    };

    const openNewNota = (date?: string) => {
      setEditingNota(null);
      setSelectedDate(date || today());
      setNotaTipo("Normal");
      setNotaTexto("");
      setShowNotaDialog(true);
    };

    const openEditReserva = (r: Reserva) => {
      setEditingReserva(r);
      setSelectedDate(r.date);
      setReservaTime(r.time);
      setReservaOrigen(r.origen);
      setReservaDestino(r.destino);
      setReservaCliente(r.cliente);
      setReservaTelefono(r.telefono);
      setReservaNotas(r.notas);
      setShowReservaDialog(true);
    };

    const openEditNota = (n: NotaCalendario) => {
      setEditingNota(n);
      setSelectedDate(n.date);
      setNotaTipo(n.tipo);
      setNotaTexto(n.texto);
      setShowNotaDialog(true);
    };

    const saveNota = () => {
      if (!notaTexto.trim()) {
        alert("Por favor escribe el texto de la nota.");
        return;
      }
      if (editingNota) {
        setNotes(prev => prev.map(n => n.id === editingNota.id ? {
          ...n,
          date: selectedDate,
          tipo: notaTipo,
          texto: notaTexto
        } : n));
      } else {
        const newNote: NotaCalendario = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          date: selectedDate,
          tipo: notaTipo,
          texto: notaTexto
        };
        setNotes(prev => [...prev, newNote]);
      }
      setShowNotaDialog(false);
    };

    // Eventos del día seleccionado
    const dayReservations = reservations.filter(r => r.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
    const dayNotes = notes.filter(n => n.date === selectedDate);
    const dayTurnos = history.filter(t => (t.startDate || t.date) === selectedDate);

    // Agenda 14 días
    const agendaDays = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const daysWithEvents = agendaDays.filter(dayStr => {
      const dayRes = reservations.some(r => r.date === dayStr);
      const dayN = notes.some(n => n.date === dayStr);
      const dayT = history.some(t => (t.startDate || t.date) === dayStr);
      return dayRes || dayN || dayT;
    });

    const MONTHS_ES = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const getNotaTipoColor = (t: NotaTipo) => {
      switch (t) {
        case 'ITV': return 'oklch(0.70 0.18 25)';
        case 'Seguro': return 'oklch(0.75 0.16 70)';
        case 'Normal': return 'oklch(0.65 0.20 280)';
        case 'Día libre': return 'oklch(0.68 0.20 145)';
        default: return 'white';
      }
    };

    const formatAgendaDate = (dStr: string) => {
      if (dStr === today()) return "Hoy";
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (dStr === tomorrow.toISOString().slice(0, 10)) return "Mañana";
      const d = new Date(dStr + "T12:00:00");
      return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" }).replace(/^\w/, c => c.toUpperCase());
    };

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", position: "relative" }}>

          {/* Cabecera superior: volver + título + toggle Mes/Agenda */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexShrink: 0, gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button style={S.iconBtn} onClick={() => setScreen("home")}><IconBack /></button>
              <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Calendario</div>
            </div>

            {/* Botón intercambio de vista (Mes <-> Agenda) */}
            <button
              onClick={() => setCalendarView(calendarView === 'month' ? 'agenda' : 'month')}
              style={{
                height: 44,
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 12,
                padding: "0 22px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "white",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.15s"
              }}
            >
              <span style={{ fontSize: 18 }}>⇄</span>
              <span>{calendarView === 'month' ? 'Agenda' : 'Calendario'}</span>
            </button>
          </div>

          {/* Fila inferior: + Reserva | + Nota */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => openNewReserva()}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "2px solid rgba(255,255,255,0.16)",
                background: C,
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>+ 📅</span>
              <span>Reserva</span>
            </button>
            <button
              onClick={() => openNewNota()}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 12,
                border: "2px solid rgba(255,255,255,0.16)",
                background: C,
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              <span>+ 📝</span>
              <span>Nota</span>
            </button>
          </div>

          {/* Vistas condicionales */}
          {calendarView === 'month' ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Selector de Mes */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "8px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={prevMonth} style={{ background: "none", border: "none", color: C, fontSize: 18, cursor: "pointer", padding: "8px 12px" }}>◀</button>
                <button
                  onClick={() => {
                    setPickerYear(year);
                    setShowMonthPicker(v => !v);
                  }}
                  style={{ background: "none", border: "none", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer", padding: "4px 8px", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {MONTHS_ES[month]} {year}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{showMonthPicker ? "▲" : "▼"}</span>
                </button>
                <button onClick={nextMonth} style={{ background: "none", border: "none", color: C, fontSize: 18, cursor: "pointer", padding: "8px 12px" }}>▶</button>
              </div>

              {/* Picker de mes/año */}
              {showMonthPicker && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Selector de año */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setPickerYear(y => y - 1)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "none", color: C, fontSize: 16, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}
                    >◀</button>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{pickerYear}</div>
                    <button
                      onClick={() => setPickerYear(y => y + 1)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "none", color: C, fontSize: 16, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}
                    >▶</button>
                  </div>

                  {/* Rejilla 12 meses (4 cols x 3 filas) */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                    {MONTHS_ES.map((mLabel, mIdx) => {
                      const isCurrent = mIdx === month && pickerYear === year;
                      const isToday = mIdx === new Date().getMonth() && pickerYear === new Date().getFullYear();
                      return (
                        <button
                          key={mIdx}
                          onClick={() => {
                            setCalendarMonth(new Date(pickerYear, mIdx, 1));
                            setShowMonthPicker(false);
                          }}
                          style={{
                            padding: "10px 0",
                            borderRadius: 10,
                            border: isToday ? `1px solid ${C}` : "1px solid rgba(255,255,255,0.06)",
                            background: isCurrent ? C : "rgba(255,255,255,0.04)",
                            color: isCurrent ? "black" : "rgba(255,255,255,0.85)",
                            fontSize: 13,
                            fontWeight: isCurrent ? 800 : 700,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          {mLabel.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Botón Hoy */}
                  <button
                    onClick={() => {
                      const now = new Date();
                      setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                      setSelectedDate(today());
                      setShowMonthPicker(false);
                    }}
                    style={{
                      padding: "10px 0",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Ir a Hoy
                  </button>
                </div>
              )}

              {/* Cabecera L-M-X-J-V-S-D */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
                {["L", "M", "X", "J", "V", "S", "D"].map((day, idx) => (
                  <div key={idx} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Cuadrícula de días */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
                {Array.from({ length: startOffset }).map((_, idx) => (
                  <div key={`offset-${idx}`} style={{ aspectRatio: "1" }} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const isSelected = selectedDate === dayStr;
                  const isToday = dayStr === today();

                  const hasTurno = history.some(t => (t.startDate || t.date) === dayStr);
                  const dayResList = reservations.filter(r => r.date === dayStr);
                  const dayNoteList = notes.filter(n => n.date === dayStr);

                  return (
                    <div
                      key={dayNum}
                      onClick={() => {
                        const clickedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                        setSelectedDate(clickedDate);
                      }}
                      style={{
                        aspectRatio: "1",
                        background: isSelected ? "rgba(180, 120, 255, 0.12)" : isToday ? "rgba(0, 220, 180, 0.08)" : "rgba(255,255,255,0.02)",
                        border: isSelected
                          ? `1.5px solid ${C}`
                          : isToday
                            ? `1.5px solid ${G}`
                            : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 12,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 2px",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.15s"
                      }}
                    >
                      <span style={{
                        fontSize: 14,
                        fontWeight: isSelected || isToday ? 800 : 500,
                        color: isSelected ? C : isToday ? G : "white"
                      }}>
                        {dayNum}
                      </span>

                      <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
                        {hasTurno && <span style={{ fontSize: 8 }}>🚖</span>}
                        {dayResList.length > 0 && (
                          <span style={{ fontSize: 8, background: C, color: "black", borderRadius: 4, padding: "0 2px", fontWeight: "bold" }}>
                            {dayResList.length}
                          </span>
                        )}
                        {dayNoteList.length > 0 && <span style={{ fontSize: 8 }}>📝</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detalle del Día Seleccionado (Panel inferior con fadeUp) */}
              <div
                key={selectedDate}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 20,
                  padding: 16,
                  border: "1px solid rgba(255,255,255,0.07)",
                  animation: "fadeUp 0.25s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, c => c.toUpperCase())}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openNewReserva(selectedDate)} style={{ border: "none", background: "rgba(180, 120, 255, 0.1)", color: C, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Reserva</button>
                    <button onClick={() => openNewNota(selectedDate)} style={{ border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Nota</button>
                  </div>
                </div>

                {/* Lista de Eventos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dayTurnos.length === 0 && dayReservations.length === 0 && dayNotes.length === 0 && (
                    <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "16px 0", fontSize: 13, fontStyle: "italic" }}>
                      Sin eventos para este día
                    </div>
                  )}

                  {/* Turno Cerrado */}
                  {dayTurnos.map(turno => {
                    const gananciaTurno = calcularTurnoContable(turno, settings).miGanancia;

                    let tiempoTurno = fmtDuration(0);
                    if (turno.startTime && turno.endTime) {
                      let totalMins = getDiffMins(turno.startTime, turno.endTime);
                      if (turno.totalPausedMinutes) totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
                      tiempoTurno = fmtDuration(totalMins);
                    }

                    return (
                      <div
                        key={turno.id}
                        onClick={() => { setReturnScreen("calendar"); setViewTurno(turno); setScreen("summary"); }}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 14,
                          padding: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.72)", flexWrap: "wrap" }}>
                          <span style={{ fontSize: 16 }}>🚖</span>
                          <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>Turno cerrado</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.78 0.18 150)" }}>
                            <IconMoneyBag s={16} c="oklch(0.78 0.18 150)" />
                            {fmt(gananciaTurno)}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.85 0.12 210)" }}>
                            <IconTimer s={16} c="oklch(0.85 0.12 210)" />
                            {tiempoTurno}
                          </span>
                        </div>
                        <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}>➔</span>
                      </div>
                    );
                  })}

                  {/* Reservas */}
                  {dayReservations.map(res => (
                    <div key={res.id} style={{ background: "rgba(180, 120, 255, 0.07)", border: "1px solid rgba(180, 120, 255, 0.26)", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                          Reserva
                        </div>
                        <button
                          onClick={() => openEditReserva(res)}
                          style={{
                            width: 34,
                            height: 34,
                            flex: "0 0 34px",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0
                          }}
                          title="Editar reserva"
                          aria-label="Editar reserva"
                        >
                          <IconPencilNeon s={24} />
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                        {renderReservaCardField("Time", res.time, { full: true, center: true })}
                        {renderReservaCardField("Client", res.cliente)}
                        {renderReservaCardField("Phone", res.telefono, { href: `tel:${res.telefono}` })}
                        {renderReservaCardField("Pickup", res.origen, { full: true })}
                        {renderReservaCardField("Destination", res.destino, { full: true })}
                        {res.notas && renderReservaCardField("Notes", res.notas, { full: true, muted: true })}
                      </div>
                    </div>
                  ))}

                  {/* Notas */}
                  {dayNotes.map(note => {
                    const col = getNotaTipoColor(note.tipo);
                    return (
                      <div key={note.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `4px solid ${col}`, borderRadius: 12, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: "uppercase", marginBottom: 3 }}>{note.tipo}</div>
                          <div style={{ fontSize: 14, color: "white", lineHeight: 1.3 }}>{note.texto}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEditNota(note)}
                            style={{
                              width: 34,
                              height: 34,
                              flex: "0 0 34px",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0
                            }}
                            title="Editar nota"
                            aria-label="Editar nota"
                          >
                            <IconPencilNeon s={22} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Vista Agenda (Próximos 14 días con eventos) */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {daysWithEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 4 }}>Sin eventos próximos</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>No hay reservas ni notas planificadas para los próximos 14 días.</div>
                </div>
              ) : (
                daysWithEvents.map(dayStr => {
                  const dayRes = reservations.filter(r => r.date === dayStr).sort((a, b) => a.time.localeCompare(b.time));
                  const dayN = notes.filter(n => n.date === dayStr);
                  const dayT = history.filter(t => (t.startDate || t.date) === dayStr);

                  return (
                    <div key={dayStr} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6, marginBottom: 10 }}>
                        {formatAgendaDate(dayStr)}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Turno */}
                        {dayT.map(t => {
                          const gananciaTurno = calcularTurnoContable(t, settings).miGanancia;

                          let tiempoTurno = fmtDuration(0);
                          if (t.startTime && t.endTime) {
                            let totalMins = getDiffMins(t.startTime, t.endTime);
                            if (t.totalPausedMinutes) totalMins = Math.max(0, totalMins - t.totalPausedMinutes);
                            tiempoTurno = fmtDuration(totalMins);
                          }

                          return (
                            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.72)", flexWrap: "wrap" }}>
                              <span>🚖</span>
                              <span style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>Turno cerrado</span>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.78 0.18 150)" }}>
                                <IconMoneyBag s={16} c="oklch(0.78 0.18 150)" />
                                {fmt(gananciaTurno)}
                              </span>
                              <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 900, color: "oklch(0.85 0.12 210)" }}>
                                <IconTimer s={16} c="oklch(0.85 0.12 210)" />
                                {tiempoTurno}
                              </span>
                            </div>
                          );
                        })}

                        {/* Reservas */}
                        {dayRes.map(res => (
                          <div key={res.id} style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(180, 120, 255, 0.07)", border: "1px solid rgba(180, 120, 255, 0.22)", padding: 10, borderRadius: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 900, color: C, textTransform: "uppercase", letterSpacing: "0.35px" }}>
                                Reserva
                              </div>
                              <button
                                onClick={() => openEditReserva(res)}
                                style={{
                                  width: 32,
                                  height: 32,
                                  flex: "0 0 32px",
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  borderRadius: 9,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0
                                }}
                                title="Editar reserva"
                                aria-label="Editar reserva"
                              >
                                <IconPencilNeon s={22} />
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                              {renderReservaCardField("Time", res.time, { full: true, center: true, compact: true })}
                              {renderReservaCardField("Client", res.cliente, { compact: true })}
                              {renderReservaCardField("Phone", res.telefono, { href: `tel:${res.telefono}`, compact: true })}
                              {renderReservaCardField("Pickup", res.origen, { full: true, compact: true })}
                              {renderReservaCardField("Destination", res.destino, { full: true, compact: true })}
                              {res.notas && renderReservaCardField("Notes", res.notas, { full: true, muted: true, compact: true })}
                            </div>
                          </div>
                        ))}

                        {/* Notas */}
                        {dayN.map(n => {
                          const col = getNotaTipoColor(n.tipo);
                          return (
                            <div key={n.id} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 13 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: col, textTransform: "uppercase" }}>[{n.tipo}]</span>
                              <span style={{ color: "white" }}>{n.texto}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Dialogo Añadir/Editar Reserva (renderizado a nivel de App) */}
          {renderReservaDialog()}

          {/* Dialogo Añadir/Editar Nota */}
          {showNotaDialog && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Formulario Nota"
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
                  borderRadius: 20,
                  padding: 24,
                  width: "90%",
                  maxWidth: 340,
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: "white", textTransform: "uppercase", marginBottom: 4 }}>
                  {editingNota ? "Editar Nota" : "Nueva Nota"}
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 6 }}>Categoría</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(['ITV', 'Seguro', 'Normal', 'Día libre'] as const).map(t => {
                      const isSelected = notaTipo === t;
                      const col = getNotaTipoColor(t);
                      return (
                        <button
                          key={t}
                          onClick={() => setNotaTipo(t)}
                          style={{
                            border: isSelected ? `2.5px solid ${col}` : "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                            padding: "6px 10px",
                            background: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                            color: isSelected ? col : "rgba(255,255,255,0.6)",
                            fontSize: 12,
                            fontWeight: isSelected ? 800 : 600,
                            cursor: "pointer",
                            transition: "all 0.1s"
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Descripción</div>
                  <input
                    type="text"
                    placeholder="Escribe el detalle aquí..."
                    value={notaTexto}
                    onChange={e => setNotaTexto(e.target.value)}
                    style={{
                      width: "100%",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "white",
                      padding: "10px 14px",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  {editingNota && (
                    <button
                      onClick={() => {
                        const id = editingNota.id;
                        setConfirmDialog({
                          text: "¿Seguro que quieres eliminar esta nota?",
                          onConfirm: () => {
                            setNotes(prev => prev.filter(n => n.id !== id));
                            setShowNotaDialog(false);
                          }
                        });
                      }}
                      aria-label="Eliminar nota"
                      style={{
                        width: 48,
                        padding: "12px 0",
                        borderRadius: 12,
                        border: "1px solid rgba(255, 100, 100, 0.3)",
                        background: "rgba(255, 80, 80, 0.12)",
                        color: "#ff6b6b",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      🗑️
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotaDialog(false)}
                    style={{
                      flex: 1,
                      padding: "12px 0",
                      borderRadius: 12,
                      border: "none",
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveNota}
                    style={{
                      flex: 1.2,
                      padding: "12px 0",
                      borderRadius: 12,
                      border: "none",
                      background: C,
                      color: "black",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}

        </div>
      </Shell>
    );
  }

  if (screen === "settings") {
    const backupMenuActionIds = getBackupMenuActionIds(isAdmin);
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("home"); setUpdateMsg(""); setDownloadUrl(""); }}><IconBack /></button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Ajustes de Usuario</div>
          </div>

          {/* Bloque App Info */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚕</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Mi Turno</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Versión {APP_VERSION}</div>
            <button onClick={checkUpdate} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <IconRefresh s={20} c={G} /> Buscar actualizaciones
            </button>

            {updateMsg && !downloadUrl && (
              <div style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 12 }}>
                {updateMsg}
              </div>
            )}

            {updateMsg && downloadUrl && (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  marginTop: 16,
                  padding: "14px",
                  borderRadius: 14,
                  background: G,
                  color: "black",
                  fontSize: 15,
                  fontWeight: 800,
                  textDecoration: "none",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <IconDownload s={20} c="#3b82f6" /> {updateMsg}
              </a>
            )}
          </div>

          {/* Bloque Porcentajes */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
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
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#ff6b6b', textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
              <IconReceipt s={22} c="#ff6b6b" /> Total a Descontar
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.4 }}>
              Selecciona qué categorías se restan del Total a Dar al jefe.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {([
                { key: "descontar.datafono", label: "Datáfono", color: P, bg: PBG },
                { key: "descontar.agencia_bono", label: "Agencias/Bonos", color: A, bg: ABG },
                { key: "descontar.extra", label: "Extras", color: E, bg: EBG },
                { key: "descontar.gasolina", label: "Gasolina", color: F, bg: FBG },
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
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'oklch(0.85 0.18 85)', textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
              <IconHoliday s={22} c="oklch(0.85 0.18 85)" /> Día libre semanal
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
                        text: `¿Cambiar tu día libre a ${nombres[d.idx]}?`,
                        onConfirm: () => {
                          setSettings({
                            ...settings,
                            diaLibre: d.idx,
                            diaLibreDesde: today(),
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

            <div style={{ textAlign: 'center', fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              {(() => {
                const nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                const diaLibreTxt = nombres[settings.diaLibre];
                const inicioSemana = nombres[(settings.diaLibre + 1) % 7];
                const finSemana = nombres[(settings.diaLibre + 6) % 7];
                return `Día libre: ${diaLibreTxt} · Semana laboral: ${inicioSemana} → ${finSemana}`;
              })()}
            </div>
          </div>

          {/* Botón Independiente: Añadir Turno (Importar) */}
          <button
            id="btn_import_turno_fusion"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json, .csv';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                  let nuevosTurnos: Turno[] = [];
                  const text = evt.target?.result as string;
                  try {
                    if (file.name.endsWith('.json')) {
                      const backup = JSON.parse(text);
                      nuevosTurnos = JSON.parse(backup.history || "[]");
                    } else {
                      nuevosTurnos = parseCSVToHistory(text);
                    }
                    if (nuevosTurnos.length > 0) {
                      setConfirmDialog({
                        text: `Se han detectado ${nuevosTurnos.length} turnos en el archivo. ¿Quieres añadirlos a tu historial actual?`,
                        onConfirm: () => {
                          const merged = mergeTurnos(history, nuevosTurnos);
                          setHistory(merged);
                          alert("Turnos añadidos correctamente");
                        },
                        confirmText: "Añadir todos",
                        confirmBg: "rgba(80,220,140,0.15)",
                        confirmColor: "#50dc8c",
                        confirmBorder: "1px solid rgba(80,220,140,0.3)"
                      });
                    }
                  } catch (e) {
                    alert("Error al procesar el archivo.");
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 22,
              padding: "16px 20px",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              color: "white",
              textAlign: "left",
              outline: "none"
            }}
          >
            <IconUpload s={22} c="#50dc8c" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Añadir Turno</span>
          </button>

          {/* Menú Desplegable: Gestión de Backup */}
          <div>
            <div
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 22,
                padding: "16px 20px",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IconDownload s={22} c="oklch(0.75 0.16 70)" />
                <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Copia de Seguridad</span>
              </div>
              <span style={{
                color: "rgba(255,255,255,0.5)",
                transform: showBackupMenu ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s"
              }}>▼</span>
            </div>

            {showBackupMenu && (
              <div style={{
                marginTop: 8,
                padding: "0 4px",
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}>
                {backupMenuActionIds.includes("export-json") && (
                  <button
                    onClick={() => exportBackupJSON(buildBackupPayloadFromState({
                      history,
                      settings,
                      current,
                      weekOverrides,
                      reservations,
                      notes,
                    }))}
                    style={S.backupSubBtn}
                  >
                    <IconDownload s={18} c="white" /> Exportar todo a JSON
                  </button>
                )}

                {backupMenuActionIds.includes("restore-json") && (
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const backup = JSON.parse(evt.target?.result as string);
                          setConfirmDialog({
                            text: "RESTAURAR TOTAL: Esto borrará tus datos actuales y pondrá los del archivo. ¿Continuar?",
                            onConfirm: () => {
                              const uid = auth.currentUser?.uid || "";
                              if (backup.history) localStorage.setItem(userStorageKey(KEY_HISTORY, uid), backup.history);
                              if (backup.settings) localStorage.setItem(userStorageKey(KEY_SETTINGS, uid), backup.settings);
                              if (backup.current) localStorage.setItem(userStorageKey(KEY_CURRENT, uid), backup.current);
                              if (backup.weekOverrides) localStorage.setItem(userStorageKey(KEY_WEEK_OVERRIDES, uid), backup.weekOverrides);
                              if (backup.reservations) localStorage.setItem(userStorageKey(KEY_RESERVATIONS, uid), backup.reservations);
                              if (backup.notes) localStorage.setItem(userStorageKey(KEY_NOTES, uid), backup.notes);
                              window.location.reload();
                            }
                          });
                        };
                        reader.readAsText(file);
                      };
                      input.click();
                    }}
                    style={S.backupSubBtn}
                  >
                    <span style={{ fontSize: 16 }}>⚠️</span> Restaurar copia completa
                  </button>
                )}

              </div>
            )}
          </div>
        </div>

        {activeSettingsField && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Configuración"
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
                  <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
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
                fontSize: 20,
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
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
                    const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : e.type === 'agencia_bono' ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{e.time}</span>
                        <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: 'uppercase', minWidth: 60 }}>{e.type}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{e.note}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmt(e.amount)}</span>
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
                const meta = e.type === 'propina' ? { col: G, lbl: 'Propina' }
                  : e.type === 'datafono' ? { col: P, lbl: 'Datáfono' }
                    : (e.type === 'agencia_bono') ? { col: A, lbl: 'Agencia/Bono' }
                      : e.type === 'extra' ? { col: E, lbl: 'Extra' }
                        : e.type === 'gasolina' ? { col: F, lbl: 'Gasolina' }
                          : { col: N, lbl: 'Nulo' };
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.col, minWidth: 60 }}>{meta.lbl}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{fmt(e.amount)}</span>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {e.note}
                    </div>
                    <button onClick={() => openEditEntry(e)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconPencilNeon />
                    </button>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>📝 Notas del Turno</div>

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
    const cfg = {
      agencia_bono: { accent: A, bg: ABG, label: "Agencia/Bono", Icon: IconAgency },
      extra: { accent: E, bg: EBG, label: "Extra", Icon: IconExtra },
      gasolina: { accent: F, bg: FBG, label: "Gasolina", Icon: IconFuel },
      nulo: { accent: N, bg: NBG, label: "Nulo", Icon: IconNulo },
    }[singleMode] || { accent: E, bg: EBG, label: "Extra", Icon: IconExtra };
    const { accent } = cfg;
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
              <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={() => kpS(k)} style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
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
              <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={() => kpAdd(k)} style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", fontSize: 22, fontWeight: 700, color: "white" }}>
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
    // - Cada semana (en curso o calculada al vuelo)
    // - Cada turno suelto
    //
    // Cada elemento tiene una "fecha de orden" (la del último día laboral de la
    // semana, o la fecha del turno suelto) para poder ordenarlos cronológicamente.

    type ElemSemana = {
      kind: "semana";
      weekId: string;
      fechaOrden: string;
      isEnCurso: boolean;
      diaLibreUsado: number;
      turnos: Turno[];
      override: WeekOverride | null;
    };
    type ElemTurnoSuelto = {
      kind: "turno";
      turno: Turno;
      fechaOrden: string;
    };
    type Elem = ElemSemana | ElemTurnoSuelto;

    const elementos: Elem[] = [];

    // 1. Agrupar historial por semana. Cada turno usa su diaLibreContable si existe.
    const grupos = groupTurnosByWeek(history, diaLibre);
    for (const [key, turnosSemana] of grupos.entries()) {
      const weekId = key;
      const range = getWeekRange(weekId);
      const isEnCurso = !isWeekClosed(weekId, hoyISO);
      elementos.push({
        kind: "semana",
        weekId,
        fechaOrden: range.fin,
        isEnCurso,
        diaLibreUsado: turnosSemana[0]?.diaLibreContable ?? diaLibre,
        turnos: turnosSemana,
        override: getWeekOverride(weekOverrides, weekId),
      });
    }

    // 2. Añadir turnos sueltos de dia libre.
    for (const turno of history) {
      if (getTurnoAccountingWeekId(turno, diaLibre) !== null) continue;
      elementos.push({
        kind: "turno",
        turno,
        fechaOrden: turno.startDate || turno.date,
      });
    }

    // 3. Detectar si la semana en curso ya existe; si no, crear una vacia.
    const weekIdHoy = getCurrentOpenWeekId(hoyISO, diaLibre);
    const tieneEnCurso = elementos.some(
      (e) => e.kind === "semana" && e.isEnCurso
    );
    if (weekIdHoy && !tieneEnCurso) {
      const range = getWeekRange(weekIdHoy);
      elementos.push({
        kind: "semana",
        weekId: weekIdHoy,
        fechaOrden: range.fin,
        isEnCurso: true,
        diaLibreUsado: diaLibre,
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

    const heroSelection = selectAccountingHeroWeek(
      enCurso?.weekId || null,
      otros.filter((e): e is ElemSemana => e.kind === "semana").map((e) => e.weekId)
    );
    const heroWeek = heroSelection
      ? elementos.find((e): e is ElemSemana => e.kind === "semana" && e.weekId === heroSelection.weekId)
      : undefined;
    const otrosSinHero = heroSelection?.kind === "latest"
      ? otros.filter((e) => e.kind !== "semana" || e.weekId !== heroSelection.weekId)
      : otros;

    // 6. Asignar mes a cada elemento (resolviendo empates)
    type ElemConMes = { elem: Elem; mesId: string | null /* null = empate sin resolver */ };
    const otrosConMes: ElemConMes[] = [];
    let primerEmpate: { weekId: string; candidates: { mesId: string; mesLabel: string }[] } | null = null;

    for (const elem of otrosSinHero) {
      if (elem.kind === "turno") {
        const fechaMes = elem.turno.startDate || elem.turno.date;
        otrosConMes.push({ elem, mesId: fechaMes.slice(0, 7) });
        continue;
      }
      const r = getWeekMonth(elem.weekId);
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

    const weeklyPeriodLabel = getAccountingPeriodLabel(selectedAccountingYear, selectedAccountingMonth);

    // Render
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <button style={S.iconBtn} onClick={() => setScreen("home")}>
                <IconBack />
              </button>
              <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Contabilidad</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => setScreen("detalleMes")}
                style={{
                  border: `1px solid ${E}`,
                  background: "rgba(0, 210, 255, 0.12)",
                  color: E,
                  borderRadius: 12,
                  padding: "9px 11px",
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: `0 0 12px ${E}33`
                }}
              >
                Mensual
              </button>
              <button
                onClick={() => setScreen("detalleAnual")}
                style={{
                  border: `1px solid ${C}`,
                  background: "rgba(180, 120, 255, 0.12)",
                  color: C,
                  borderRadius: 12,
                  padding: "9px 11px",
                  fontSize: 11,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: `0 0 12px ${C}33`
                }}
              >
                Anual
              </button>
            </div>
          </div>


          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 6,
            marginTop: 12,
            marginBottom: 8,
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: 22,
            padding: "24px 16px",
            border: "2px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 255, 255, 0.05)",
            boxSizing: "border-box",
          }}>
            <div style={{
              fontSize: 50,
              fontWeight: 950,
              color: "white",
              letterSpacing: "-0.5px",
              lineHeight: 1,
              textShadow: "0 0 16px rgba(255,255,255,0.25)"
            }}>
              Semanal
            </div>
            <div style={{
              fontSize: 26,
              fontWeight: 900,
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "1.2px"
            }}>
              {weeklyPeriodLabel}
            </div>
          </div>

          {/* === SEMANA DESTACADA === */}
          {heroWeek && heroSelection && (() => {
            const totales = calcularResumenContableTurnos(heroWeek.turnos, settings);
            const totalTaximetroHero = (totales.dinero || 0) - (totales.totalN || 0);
            const range = getWeekRange(heroWeek.weekId);
            const isCurrentHero = heroSelection.kind === "current";
            const dHoy = new Date(hoyISO + "T12:00:00");
            const dInicio = new Date(range.inicio + "T12:00:00");
            const diasTranscurridos = Math.min(
              6,
              Math.max(0, Math.floor((dHoy.getTime() - dInicio.getTime()) / 86400000) + 1)
            );
            const entregadaHero = heroWeek.override?.entregada || false;

            let totalMinsHero = 0;
            for (const turno of heroWeek.turnos) {
              if (turno.startTime && turno.endTime) {
                let mins = getDiffMins(turno.startTime, turno.endTime);
                if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
                totalMinsHero += mins;
              }
            }
            const durationStrHero = fmtDuration(totalMinsHero);

            return (
              <div
                onClick={() => {
                  setSelectedWeekId(heroWeek.weekId);
                  setScreen("detalleSemana");
                }}
                style={{
                  background: "linear-gradient(135deg, rgba(180, 120, 255, 0.15) 0%, rgba(0, 210, 255, 0.15) 100%)",
                  borderRadius: 22,
                  padding: 20,
                  border: `2px solid ${entregadaHero ? G : E}`,
                  cursor: "pointer",
                  boxShadow: `0 8px 24px rgba(0,0,0,0.3), inset 0 0 20px ${entregadaHero ? G : E}11`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  {/* Columna Izquierda: Info de la semana */}
                  <div style={{ flex: 1, minWidth: 0 }}>
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
                        {isCurrentHero ? "EN CURSO" : "ÚLTIMA SEMANA"}
                      </span>
                      {isCurrentHero && (
                        <span style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          fontWeight: 600,
                        }}>
                          Día {diasTranscurridos} de 6
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontSize: 22,
                      fontWeight: 900,
                      color: "white",
                      marginBottom: 4,
                      letterSpacing: "-0.5px",
                    }}>
                      {formatWeekRange(heroWeek.weekId)}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.4)",
                    }}>
                      {heroWeek.turnos.length} {heroWeek.turnos.length === 1 ? "turno registrado" : "turnos registrados"}
                    </div>
                  </div>

                  {/* Columna Derecha: Mi Ganancia y Tiempo Trabajado */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0, textAlign: "right" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                        <IconMoneyBag s={24} c="oklch(0.78 0.18 150)" /> Mi Ganancia
                      </div>
                      <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.78 0.18 150)", letterSpacing: "-1px", lineHeight: 1 }}>
                        {fmtMoneyNumber(totales.miGanancia)} <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6 }}>€</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, marginTop: 4, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                        <IconTimer s={24} c="oklch(0.85 0.12 210)" /> Tiempo Trab.
                      </div>
                      <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.85 0.12 210)", letterSpacing: "-1px", lineHeight: 1 }}>
                        {(() => { const [hPart, mPart] = durationStrHero.split(" "); const hNum = hPart.replace("h", ""); const mNum = mPart?.replace("m", "") ?? "0"; return <>{hNum}<span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6, marginLeft: 2, marginRight: 6, letterSpacing: "normal" }}>h</span> {mNum}<span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6, marginLeft: 2, letterSpacing: "normal" }}>m</span></>; })()}
                      </div>
                    </div>
                  </div>
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
                    ACUMULADO TOTAL
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                  <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.85 0.18 85)", letterSpacing: "-1px" }}>
                    {fmtMoneyNumber(totalTaximetroHero)} <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6 }}>€</span>
                  </div>
                  <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.80 0.14 220)", letterSpacing: "-1px" }}>
                    {fmtKmNumber(totales.km || 0)} <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6 }}>KM</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* === SEMANAS ANTERIORES (agrupadas por mes) === */}
          {grupos2.length === 0 && !heroWeek && (
            <div style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.5)",
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
                if (item.elem.kind === "turno") {
                  const turno = item.elem.turno;
                  const entregado = turno.entregada || false;
                  return (
                    <div
                      key={`turno-${turno.id}`}
                      onClick={() => {
                        setReturnScreen("contabilidad");
                        setViewTurno(turno);
                        setScreen("summary");
                      }}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 16,
                        padding: 16,
                        cursor: "pointer",
                        border: entregado
                          ? "1px solid rgba(59, 130, 246, 0.5)"
                          : "1px solid rgba(255,255,255,0.08)",
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
                          {fmtDate(turno.startDate || turno.date)}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.4)",
                        }}>
                          Turno suelto
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
                          {fmt(turno.dinero || 0)}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                          <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: entregado ? G : "oklch(0.75 0.16 70)",
                            background: entregado ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
                            padding: "3px 8px",
                            borderRadius: 6,
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                          }}>
                            {entregado ? "✓ Entregado" : "Pendiente"}
                          </div>
                          <div style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: E,
                            background: EBG,
                            padding: "3px 8px",
                            borderRadius: 6,
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                          }}>
                            Fuera de semana
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Tarjeta de semana
                const sem = item.elem;
                const resumenSemana = calcularResumenContableTurnos(sem.turnos, settings);
                const totalTaximetroSemana = resumenSemana.dineroBase;
                const miGananciaSemana = resumenSemana.miGanancia;
                const kmSemana = resumenSemana.km;
                const numTurnos = sem.turnos.length;
                const entregada = sem.override?.entregada || false;

                let totalMinsSem = 0;
                for (const turno of sem.turnos) {
                  if (turno.startTime && turno.endTime) {
                    let mins = getDiffMins(turno.startTime, turno.endTime);
                    if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
                    totalMinsSem += mins;
                  }
                }
                const durationStrSem = fmtDuration(totalMinsSem);

                return (
                  <div
                    key={`sem-${sem.weekId}`}
                    onClick={() => {
                      setSelectedWeekId(sem.weekId);
                      setScreen("detalleSemana");
                    }}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 16,
                      padding: 16,
                      cursor: "pointer",
                      border: entregada
                        ? `1.5px solid ${G}88`
                        : "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      containerType: "inline-size",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: WEEK_LIST_CARD_TEXT_SIZES.range,
                        fontWeight: 800,
                        color: "white",
                      }}>
                        {formatWeekRange(sem.weekId)}
                      </div>
                      <div style={{
                        fontSize: WEEK_LIST_CARD_TEXT_SIZES.meta,
                        color: "rgba(255,255,255,0.4)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}>
                        <span>{numTurnos} {numTurnos === 1 ? "turno" : "turnos"}</span>
                        <span style={{ opacity: 0.5 }}>•</span>
                        <span style={{ color: entregada ? G : "oklch(0.75 0.16 70)", fontWeight: 800 }}>
                          {entregada ? "Entregada" : "Pendiente"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                        <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                          <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(totalTaximetroSemana)}
                        </div>
                        <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                          <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(kmSemana || 0)}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
                        <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                          <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGananciaSemana)}
                        </div>
                        <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                          <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStrSem}
                        </div>
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
            role="dialog"
            aria-modal="true"
            aria-label="Confirmación de empate 3-3"
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

  if (screen === "detalleAnual") {
    const turnosAnual = getTurnosByCalendarYear(history, selectedAccountingYear);
    const resumenAnual = calcularResumenContableTurnos(turnosAnual, settings);
    const monthLabels = MESES_COMPLETOS;
    const cats = [
      { key: 'datafono', label: 'Datafono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenAnual.totalD },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: resumenAnual.totalP },
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: resumenAnual.totalA },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: resumenAnual.totalE },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: resumenAnual.totalF },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: resumenAnual.totalN },
    ];

    let totalMins = 0;
    for (const turno of turnosAnual) {
      if (turno.startTime && turno.endTime) {
        let mins = getDiffMins(turno.startTime, turno.endTime);
        if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
        totalMins += mins;
      }
    }
    const durationStr = fmtDuration(totalMins);

    const mesesAnio = monthLabels.map((label, index) => {
      const month = index + 1;
      const turnosMes = getTurnosByCalendarMonth(history, selectedAccountingYear, month);
      const resumenMes = calcularResumenContableTurnos(turnosMes, settings);
      return { month, label, turnosMes, resumenMes };
    });

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => setScreen("contabilidad")}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>Resumen Anual</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{selectedAccountingYear}</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.035)", borderRadius: 22, padding: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: 8 }}>
              <button
                aria-label="Año anterior"
                onClick={() => setSelectedAccountingYear((year) => year - 1)}
                style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: "white", fontSize: 17, fontWeight: 900, cursor: "pointer" }}
              >
                {"<"}
              </button>
              <div style={{ minHeight: 52, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.46)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.8px" }}>Año</div>
                <div style={{ fontSize: 22, color: "white", fontWeight: 950, lineHeight: 1.1 }}>{selectedAccountingYear}</div>
              </div>
              <button
                aria-label="Año siguiente"
                onClick={() => setSelectedAccountingYear((year) => year + 1)}
                style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: "white", fontSize: 17, fontWeight: 900, cursor: "pointer" }}
              >
                {">"}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Total Taximetro</div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)' }}>{fmt(resumenAnual.dineroBase)}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0, 210, 255, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Total KM</div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)' }}>{fmtKmNumber(resumenAnual.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span></div>
              </div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(80, 220, 140, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(80, 220, 140, 0.22)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Mi Ganancia</div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.78 0.18 150)' }}>{fmt(resumenAnual.miGanancia)}</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(120, 200, 255, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(120, 200, 255, 0.22)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Tiempo Trabajado</div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)' }}><DurationCardValue value={durationStr} /></div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cats.map(cat => (
              <div key={cat.key} style={{ background: cat.bg, borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                  {cat.icon} {cat.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: cat.color }}>{fmt(cat.total || 0)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ flex: 1, background: 'rgba(255,80,80,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(255,80,80,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a descontar</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)' }}>{fmt(resumenAnual.totalDescontar)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(80,220,140,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(80,220,140,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a dar</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: G }}>{fmt(resumenAnual.totalADar)}</div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Meses del año ({turnosAnual.length} turnos)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mesesAnio.map(({ month, label, turnosMes, resumenMes }) => (
                <div
                  key={label}
                  onClick={() => { setSelectedAccountingMonth(month); setScreen("detalleMes"); }}
                  style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", border: month === selectedAccountingMonth ? `1px solid ${G}88` : "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                >
                  <div>
                    <div style={{ fontWeight: 850, color: "white", fontSize: 15 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{turnosMes.length} {turnosMes.length === 1 ? "turno" : "turnos"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "oklch(0.85 0.18 85)" }}>{fmt(resumenMes.dineroBase)}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "oklch(0.78 0.18 150)", marginTop: 3 }}>{fmt(resumenMes.miGanancia)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "detalleMes") {
    const monthId = `${selectedAccountingYear}-${String(selectedAccountingMonth).padStart(2, "0")}`;
    const turnosMes = getTurnosByCalendarMonth(history, selectedAccountingYear, selectedAccountingMonth);
    const resumenMes = calcularResumenContableTurnos(turnosMes, settings);
    const mesLabel = getMesLabel(monthId);
    const turnosConNotas = getTurnosNotasSemana(turnosMes);
    const cats = [
      { key: 'datafono', label: 'Datafono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenMes.totalD },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: resumenMes.totalP },
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: resumenMes.totalA },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: resumenMes.totalE },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: resumenMes.totalF },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: resumenMes.totalN },
    ];

    let totalMins = 0;
    for (const turno of turnosMes) {
      if (turno.startTime && turno.endTime) {
        let mins = getDiffMins(turno.startTime, turno.endTime);
        if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
        totalMins += mins;
      }
    }
    const durationStr = fmtDuration(totalMins);

    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={S.iconBtn} onClick={() => setScreen("contabilidad")}>
              <IconBack />
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
                Detalle de Mes
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                {mesLabel}
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.035)", borderRadius: 22, padding: 10, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: 8 }}>
              <button
                aria-label="Año anterior"
                onClick={() => setSelectedAccountingYear((year) => year - 1)}
                style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: "white", fontSize: 17, fontWeight: 900, cursor: "pointer" }}
              >
                {"<"}
              </button>
              <div style={{ minHeight: 52, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.46)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.8px" }}>Año</div>
                <div style={{ fontSize: 22, color: "white", fontWeight: 950, lineHeight: 1.1 }}>{selectedAccountingYear}</div>
              </div>
              <button
                aria-label="Año siguiente"
                onClick={() => setSelectedAccountingYear((year) => year + 1)}
                style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: "white", fontSize: 17, fontWeight: 900, cursor: "pointer" }}
              >
                {">"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: 8 }}>
              <button
                aria-label="Mes anterior"
                onClick={() => setSelectedAccountingMonth((month) => Math.max(1, month - 1))}
                style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: selectedAccountingMonth === 1 ? "rgba(255,255,255,0.22)" : "white", fontSize: 17, fontWeight: 900, cursor: selectedAccountingMonth === 1 ? "default" : "pointer" }}
              >
                {"<"}
              </button>
              <div style={{ minHeight: 52, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.46)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.8px" }}>Mes</div>
                <div style={{ fontSize: 22, color: "white", fontWeight: 950, lineHeight: 1.1 }}>{mesLabel.split(" ")[0]}</div>
              </div>
              <button
                aria-label="Mes siguiente"
                onClick={() => setSelectedAccountingMonth((month) => Math.min(12, month + 1))}
                style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: selectedAccountingMonth === 12 ? "rgba(255,255,255,0.22)" : "white", fontSize: 17, fontWeight: 900, cursor: selectedAccountingMonth === 12 ? "default" : "pointer" }}
              >
                {">"}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taximetro
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)', letterSpacing: '-0.5px' }}>{fmt(resumenMes.dineroBase)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(0, 210, 255, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{fmtKmNumber(resumenMes.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span></div>
              </div>
            </div>

            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(80, 220, 140, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(80, 220, 140, 0.22)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconMoneyBag s={26} c="oklch(0.78 0.18 150)" /> Mi Ganancia
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(resumenMes.miGanancia)}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(120, 200, 255, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(120, 200, 255, 0.22)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconTimer s={26} c="oklch(0.85 0.12 210)" /> Tiempo Trabajado
                </div>
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}><DurationCardValue value={durationStr} /></div>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cats.map(cat => (
              <div key={cat.key} style={{ background: cat.bg, borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                  {cat.icon} {cat.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: cat.color }}>{fmt(cat.total || 0)}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ flex: 1, background: 'rgba(255,80,80,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(255,80,80,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a descontar</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)' }}>{fmt(resumenMes.totalDescontar)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(80,220,140,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(80,220,140,0.22)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a dar</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: G }}>{fmt(resumenMes.totalADar)}</div>
            </div>
          </div>

          {turnosConNotas.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
                Notas de turnos
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {turnosConNotas.map((data) => (
                  <TurnoNotasCard
                    key={`notas-${data.turno.id}`}
                    data={data}
                    onClick={() => { setReturnScreen("detalleMes"); setViewTurno(data.turno); setScreen("summary"); }}
                  />
                ))}
              </div>
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Turnos del mes ({turnosMes.length})
            </div>
            {turnosMes.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontStyle: "italic" }}>
                Sin turnos en este mes
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {turnosMes.map((turno) => {
                  const calculo = calcularTurnoContable(turno, settings);
                  let turnoDuration = fmtDuration(0);
                  if (turno.startTime && turno.endTime) {
                    let mins = getDiffMins(turno.startTime, turno.endTime);
                    if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
                    turnoDuration = fmtDuration(mins);
                  }

                  return (
                    <div
                      key={turno.id}
                      onClick={() => { setReturnScreen("detalleMes"); setViewTurno(turno); setScreen("summary"); }}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 12,
                        padding: "12px 14px",
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 800, color: "white", fontSize: 15 }}>{fmtDate(turno.startDate || turno.date)}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                          {turno.startTime} - {turno.endTime}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: "oklch(0.78 0.18 150)", whiteSpace: "nowrap" }}>{fmt(calculo.miGanancia)}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "oklch(0.85 0.12 210)", whiteSpace: "nowrap" }}>{turnoDuration}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "detalleSemana" && selectedWeekId) {
    const weekId = selectedWeekId;
    const grupos = groupTurnosByWeek(history, settings.diaLibre);
    const turnosSemana = grupos.get(weekId) || [];
    const totales = calcularTotalesTurnos(turnosSemana);

    const override = getWeekOverride(weekOverrides, weekId);
    const entregada = override?.entregada || false;
    const fechaEntrega = override?.fechaEntrega || null;

    function applyChange(partial: Partial<Omit<WeekOverride, "weekId">>) {
      updateWeekOverride(weekId, partial);
    }

    const cats = [
      { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: totales.totalD },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: totales.totalP },
      { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: totales.totalA },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: totales.totalE },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: totales.totalF },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: totales.totalN },
    ];

    let totalMins = 0;
    for (const t of turnosSemana) {
      if (t.startTime && t.endTime) {
        let mins = getDiffMins(t.startTime, t.endTime);
        if (t.totalPausedMinutes) mins = Math.max(0, mins - t.totalPausedMinutes);
        totalMins += mins;
      }
    }
    const durationStr = fmtDuration(totalMins);

    const dineroV = (totales.dinero || 0) - (totales.totalN || 0);
    const resumenContableSemana = calcularResumenContableTurnos(turnosSemana, settings);
    const miGanancia = resumenContableSemana.miGanancia;
    const totalDescontar = resumenContableSemana.totalDescontar;
    const totalADar = resumenContableSemana.totalADar;
    const turnosConNotas = getTurnosNotasSemana(turnosSemana);
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
                Detalle de Semana
              </div>
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 22,
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <h1
              aria-label="Rango de fechas de la semana"
              style={{
                margin: "0",
                color: "white",
                fontSize: 20,
                lineHeight: 1.15,
                fontWeight: 900,
                letterSpacing: 0,
                textAlign: "center",
                overflowWrap: "anywhere",
              }}
            >
              {formatWeekRangeFull(weekId)}
            </h1>
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
              {entregada ? `✓ Entregada${fechaEntrega ? " · " + new Date(fechaEntrega + "T12:00:00").toLocaleDateString("es-ES") : ""}` : "Pendiente"}
            </div>
          </div>

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
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>
                  {fmtKmNumber(totales.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span>
                </div>
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
                <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}><DurationCardValue value={durationStr} /></div>
              </div>
            </div>
          </div>

          {/* Categorías */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {cats.map(c => (
                <div key={c.key} style={{ background: c.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {c.icon}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contenedor Inferior Agrupado: Descontar y Dar */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Tarjeta: Total a Descontar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.06 25)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.70 0.18 25 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <IconReceipt s={24} c="oklch(0.70 0.18 25)" />
                  Total a Descontar
                </div>
                <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: 'oklch(0.70 0.18 25)', letterSpacing: '-0.5px' }}>
                  {fmt(totalDescontar)}
                </div>
              </div>

              {/* Tarjeta: Total a Dar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.18 0.07 145)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.68 0.20 145 / 0.35)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <IconGive s={26} c="oklch(0.68 0.20 145)" />
                  Total a Dar
                </div>
                <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: 'oklch(0.68 0.20 145)', letterSpacing: '-0.5px' }}>
                  {fmt(totalADar)}
                </div>
              </div>
            </div>
          </div>



          {turnosConNotas.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
                Notas de turnos
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {turnosConNotas.map((data) => (
                  <TurnoNotasCard
                    key={`notas-${data.turno.id}`}
                    data={data}
                    onClick={() => { setReturnScreen("detalleSemana"); setViewTurno(data.turno); setScreen("summary"); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lista de turnos */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Turnos de la semana ({turnosSemana.length})
            </div>
            {turnosSemana.length === 0 ? (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic", padding: "20px 0" }}>
                Sin turnos en esta semana todavía
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => {
                  let durationStr = fmtDuration(0);
                  if (t.startTime && t.endTime) {
                    let totalMins = getDiffMins(t.startTime, t.endTime);
                    if (t.totalPausedMinutes) {
                      totalMins = Math.max(0, totalMins - t.totalPausedMinutes);
                    }
                    durationStr = fmtDuration(totalMins);
                  }
                  const taximetroTurno = (t.dinero || 0) - (t.totalN || 0);
                  const miGanancia = calcularTurnoContable(t, settings).miGanancia;

                  return (
                    <div
                      key={t.id}
                      onClick={() => { setReturnScreen("detalleSemana"); setViewTurno(t); setScreen("summary"); }}
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(t.date)}</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                          {t.startDate && t.startDate !== t.date
                            ? (() => {
                              const startStr = new Date(t.startDate + "T12:00:00").toLocaleDateString("es-ES");
                              const endStr = new Date(t.date + "T12:00:00").toLocaleDateString("es-ES");
                              return `${startStr} ${t.startTime} - ${endStr} ${t.endTime}`;
                            })()
                            : `${t.startTime} - ${t.endTime}`}
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                          {t.entries.length} {t.entries.length === 1 ? "entrada" : "entradas"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                            <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(taximetroTurno)}
                          </div>
                          <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                            <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(t.km || 0)}
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
                  );
                })}
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button style={S.iconBtn} onClick={() => {
              setIsSelectingTurnos(false);
              setSelectedTurnosIds([]);
              setScreen("home");
            }}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white", textAlign: "center" }}>
              Turnos
            </div>

            {/* Controles de Selección */}
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (isSelectingTurnos) {
                    exportSelectedTurnosJSON();
                  } else {
                    setIsSelectingTurnos(true);
                  }
                }}
                style={{
                  background: isSelectingTurnos ? "rgba(80,220,140,0.15)" : "rgba(255,255,255,0.07)",
                  border: isSelectingTurnos ? "1px solid rgba(80,220,140,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: isSelectingTurnos ? "#50dc8c" : "rgba(255,255,255,0.75)",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isSelectingTurnos ? `Exportar (${selectedTurnosIds.length})` : "Seleccionar"}
              </button>
            )}
          </div>

          {/* Botón cancelar si estamos en modo selección */}
          {isSelectingTurnos && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <button
                onClick={() => {
                  setIsSelectingTurnos(false);
                  setSelectedTurnosIds([]);
                }}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}
              >
                Cancelar selección
              </button>
            </div>
          )}
          {history.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: 40, fontSize: 15 }}>
              No hay Turnos Anteriores.
            </div>
          ) : (
            history.map((j) => {
              let durationStr = fmtDuration(0);
              if (j.startTime && j.endTime) {
                let totalMins = getDiffMins(j.startTime, j.endTime);
                if (j.totalPausedMinutes) {
                  totalMins = Math.max(0, totalMins - j.totalPausedMinutes);
                }
                durationStr = fmtDuration(totalMins);
              }
              const miGanancia = calcularTurnoContable(j, settings).miGanancia;

              return (
                <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>

                  {/* Checkbox condicional */}
                  {isSelectingTurnos && (
                    <input
                      type="checkbox"
                      checked={selectedTurnosIds.includes(j.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTurnosIds([...selectedTurnosIds, j.id]);
                        } else {
                          setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== j.id));
                        }
                      }}
                      style={{ width: 20, height: 20, accentColor: "#50dc8c", cursor: "pointer" }}
                    />
                  )}

                  <div
                    onClick={() => {
                      if (isSelectingTurnos) {
                        if (selectedTurnosIds.includes(j.id)) {
                          setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== j.id));
                        } else {
                          setSelectedTurnosIds([...selectedTurnosIds, j.id]);
                        }
                      } else {
                        setReturnScreen("PantallaTurnos");
                        setViewTurno(j);
                        setScreen("summary");
                      }
                    }}
                    style={{
                      flex: 1,
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
                            const startStr = new Date(j.startDate + "T12:00:00").toLocaleDateString("es-ES");
                            const endStr = new Date(j.date + "T12:00:00").toLocaleDateString("es-ES");
                            return `${startStr} ${j.startTime} - ${endStr} ${j.endTime}`;
                          })()
                          : `${j.startTime} - ${j.endTime}`}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                        {j.entries.length} entradas
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                          <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(j.dinero || 0)}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                          <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(j.km || 0)}
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
                    : (e.type === "agencia_bono")
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
                    {e.note && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}> · {e.note}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginRight: 8 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.col }}>+{fmt(e.amount)}</span>
                  <button
                    onClick={() => openEditEntry(e)}
                    title="Editar entrada"
                    aria-label="Editar entrada"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      borderRadius: 7,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      cursor: "pointer",
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                    }}
                  >
                    <IconPencilNeon />
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
              style={{
                flex: 1,
                background: 'rgba(255, 180, 0, 0.06)', // Fondo Oro suave
                borderRadius: 16,
                padding: "14px",
                border: `1.5px solid ${endField === "dinero" ? "oklch(0.85 0.18 85)" : "rgba(255, 180, 0, 0.2)"}`,
                cursor: "pointer",
                transition: "border 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
              </div>
              <div style={{ color: "oklch(0.85 0.18 85)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>
                {dineroJ ? `${dineroJ} €` : "€"}
              </div>
            </div>
            <div onClick={() => setEndField("km")}
              style={{
                flex: 1,
                background: "oklch(0.19 0.05 220)",
                borderRadius: 16,
                padding: "14px",
                border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`,
                cursor: "pointer",
                transition: "border 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
              </div>
              <div style={{ color: "oklch(0.80 0.14 220)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>
                {kmJ ? <>{kmJ} <span style={KM_CARD_UNIT_STYLE}>KM</span></> : <span style={KM_CARD_UNIT_STYLE}>KM</span>}
              </div>
            </div>
          </div>

          {/* Resumen previo */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
              Resumen de hoy
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: PBG, borderRadius: 14, padding: "12px", border: `1px solid ${P}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconCard s={15} c={P} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Datáfono</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: P, letterSpacing: "-0.5px" }}>{fmt(totalD)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{datafonos.length} entrada{datafonos.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: GBG, borderRadius: 14, padding: "12px", border: `1px solid ${G}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconCoin s={15} c={G} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Propinas</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: G, letterSpacing: "-0.5px" }}>{fmt(totalP)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{propinas.length} entrada{propinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: ABG, borderRadius: 14, padding: "12px", border: `1px solid ${A}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconAgency s={15} c={A} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: A, letterSpacing: "-0.5px" }}>{fmt(totalA)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{agencias.length} entrada{agencias.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: EBG, borderRadius: 14, padding: "12px", border: `1px solid ${E}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconExtra s={15} c={E} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Extras</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: E, letterSpacing: "-0.5px" }}>{fmt(totalE)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{extras.length} entrada{extras.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: FBG, borderRadius: 14, padding: "12px", border: `1px solid ${F}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconFuel s={15} c={F} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Gasolina</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: F, letterSpacing: "-0.5px" }}>{fmt(totalF)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{gasolinas.length} entrada{gasolinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: NBG, borderRadius: 14, padding: "12px", border: `1px solid ${N}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconNulo s={15} c={N} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Nulos</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: N, letterSpacing: "-0.5px" }}>{fmt(totalN)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{nulos.length} entrada{nulos.length !== 1 ? "s" : ""}</div>
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
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                          {e.note}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: 'italic' }}>Sin notas del turno</div>
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
                  const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : (e.type === 'agencia_bono') ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{e.time}</span>
                      <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: "uppercase", minWidth: 60 }}>{e.type === 'agencia_bono' ? 'agencia/bono' : e.type}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{e.note}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{fmt(e.amount)}</span>
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
                {(endField === "dinero" ? dineroJ : kmJ) || "0"} {endField === "dinero" ? "€" : "KM"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                  <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={() => kpEnd(k)}
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
              color: "rgba(255,255,255,0.5)",
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
                  const meta =
                    e.type === "propina"
                      ? { col: G, ic: <IconCoin s={17} c={G} />, lbl: "Propina" }
                      : e.type === "datafono"
                        ? {
                          col: P,
                          ic: <IconCard s={17} c={P} />,
                          lbl: "Datáfono",
                        }
                        : (e.type === "agencia_bono")
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
                              color: "rgba(255,255,255,0.5)",
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
                          color: "rgba(255,255,255,0.5)",
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
                        aria-label="Editar entrada"
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
                          marginLeft: 6,
                        }}
                      >
                        <IconPencilNeon />
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
                    color: "rgba(255,255,255,0.5)",
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
  ariaLabel,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      {...(onClick && !disabled ? { role: "button", tabIndex: 0 } : {})}
      aria-label={ariaLabel || label}
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
  ariaLabel,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  count: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      {...(onClick && !disabled ? { role: "button", tabIndex: 0 } : {})}
      aria-label={ariaLabel || label}
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
          fontSize: "clamp(24px, 7vw, 34px)",
          fontWeight: 900,
          color,
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {fmt(total)}
      </div>
      <div
        style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}
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
        : (entry.type === "agencia_bono") ? { col: A, lbl: "Agencia/Bono" }
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
      role="dialog"
      aria-modal="true"
      aria-label="Editar entrada"
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
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>{entry.time}</span>
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
              <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => { e.stopPropagation(); kpAmount(k); }}
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

interface ConfirmDialogProps {
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmBg?: string;
  confirmColor?: string;
  confirmBorder?: string;
}

function ConfirmDialog({ text, onConfirm, onCancel, confirmText, confirmBg, confirmColor, confirmBorder }: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={text}
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

function TurnoNotasCard({
  data,
  onClick
}: {
  data: TurnoNotasSemana;
  onClick: () => void;
}) {
  const { turno, notasGenerales, notasDetalladas } = data;
  return (
    <div
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.035)", borderRadius: 14, padding: "12px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{fmtDate(turno.date)}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>
          {turno.startTime} - {turno.endTime}
        </div>
      </div>

      {notasGenerales.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: notasDetalladas.length ? 10 : 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Notas del turno
          </div>
          {notasGenerales.map((entry) => (
            <div key={entry.id} style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "8px 10px", lineHeight: 1.35, overflowWrap: "anywhere" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginRight: 6 }}>{entry.time}</span>
              {entry.note}
            </div>
          ))}
        </div>
      )}

      {notasDetalladas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Notas detalladas
          </div>
          {notasDetalladas.map((entry) => {
            const meta = entry.type === "propina" ? { color: G, label: "Propina" }
              : entry.type === "datafono" ? { color: P, label: "Datafono" }
                : entry.type === "agencia_bono" ? { color: A, label: "Agencia/Bono" }
                  : entry.type === "extra" ? { color: E, label: "Extra" }
                    : entry.type === "gasolina" ? { color: F, label: "Gasolina" }
                      : { color: N, label: "Nulo" };
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>{entry.time}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: meta.color, textTransform: "uppercase", minWidth: 58 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.35, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(entry.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// AuthGate: decide qué pintar en función del estado de autenticación.
//   - Mientras Firebase comprueba si hay sesión guardada → "Cargando…".
//   - Sin usuario          → LoginScreen.
//   - Con usuario          → App. Se usa key={user.uid} para forzar un remount
//                             completo si cambia el usuario, asegurando que el
//                             estado interno de App se reinicia entre usuarios.
function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "oklch(0.14 0.02 260)",
          color: "oklch(0.92 0.02 260)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        Cargando…
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <App key={user.uid} />;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AuthGate />);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
