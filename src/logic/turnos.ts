export type SortableTurno = {
  date: string;
  startDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

export function sortTurnosByDateDesc<T extends SortableTurno>(turnos: T[]): T[] {
  return [...turnos].sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const byDate = dateB.localeCompare(dateA);
    if (byDate !== 0) return byDate;
    return (b.startTime || "").localeCompare(a.startTime || "");
  });
}

export function getTurnosByCalendarMonth<T extends SortableTurno>(turnos: T[], year: number, month: number): T[] {
  const monthId = `${year}-${String(month).padStart(2, "0")}`;
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 7) === monthId)
  );
}

export function getTurnosByCalendarYear<T extends SortableTurno>(turnos: T[], year: number): T[] {
  const yearId = String(year);
  return sortTurnosByDateDesc(
    turnos.filter((turno) => (turno.startDate || turno.date).slice(0, 4) === yearId)
  );
}

export function ensureTurnosDiaLibreContable<T extends { diaLibreContable?: number }>(turnos: T[], diaLibre: number): T[] {
  return turnos.map((turno) =>
    typeof turno.diaLibreContable === "number"
      ? turno
      : { ...turno, diaLibreContable: diaLibre }
  );
}

function getTurnoMergeKey(t: SortableTurno): string {
  const effectiveDate = t.startDate || t.date || "";
  return [
    effectiveDate,
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}

export function mergeTurnos<T extends SortableTurno>(actuales: T[], nuevos: T[]): T[] {
  const map = new Map<string, T>();
  // Primero metemos los que ya tienes
  actuales.forEach((t) => map.set(getTurnoMergeKey(t), t));
  // Luego añadimos los nuevos (si coinciden fecha e inicio, el map no se duplica)
  nuevos.forEach((t) => map.set(getTurnoMergeKey(t), t));

  return sortTurnosByDateDesc(Array.from(map.values()));
}
