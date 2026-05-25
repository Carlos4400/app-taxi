import { MESES_ABREVIADOS, MESES_COMPLETOS, getMesLabel } from "./date-labels";

export type WeekTurno = {
  date: string;
  startDate?: string | null;
  diaLibreContable?: number;
};

export type WeekOverrideLike = {
  weekId: string;
};

export const DIAS_LABORABLES_SEMANA = 6;

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

export function isWeekClosed(weekId: string, hoyISO: string): boolean {
  const { fin } = getWeekRange(weekId);
  return hoyISO > fin;
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

export function getTurnoFechaEfectiva(turno: WeekTurno, diaLibre: number): string {
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

export function getTurnoAccountingWeekId(turno: WeekTurno, diaLibre: number): string | null {
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

export function groupTurnosByWeek<T extends WeekTurno>(turnos: T[], diaLibre: number): Map<string, T[]> {
  const map = new Map<string, T[]>();
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

export function getWeekOverride<T extends WeekOverrideLike>(overrides: T[], weekId: string): T | null {
  return overrides.find((o) => o.weekId === weekId) || null;
}

export function getWeekMonth(weekId: string): {
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
  // Ordenar candidatos cronológicamente (mes anterior primero)
  const candidates = [primera[0], segunda[0]].sort();
  return {
    type: "tie",
    candidates: candidates.map((mesId) => ({ mesId, mesLabel: getMesLabel(mesId) })),
  };
}

export function formatWeekRange(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  if (dInicio.getMonth() === dFin.getMonth() && dInicio.getFullYear() === dFin.getFullYear()) {
    return `${dInicio.getDate()} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
  }
  return `${dInicio.getDate()} ${MESES_COMPLETOS[dInicio.getMonth()]} - ${dFin.getDate()} ${MESES_COMPLETOS[dFin.getMonth()]}`;
}

export function formatWeekRangeFull(weekId: string): string {
  const { inicio, fin } = getWeekRange(weekId);
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${dias[dInicio.getDay()]} ${dInicio.getDate()} ${MESES_ABREVIADOS[dInicio.getMonth()]} - ${dias[dFin.getDay()]} ${dFin.getDate()} ${MESES_ABREVIADOS[dFin.getMonth()]} ${dFin.getFullYear()}`;
}
