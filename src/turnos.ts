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

function getTurnoMergeKey(t: SortableTurno): string {
  return [
    t.startDate || "",
    t.date || "",
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
