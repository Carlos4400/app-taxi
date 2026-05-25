import type { Turno, TurnoNotasSemana } from "../shared/types";

export function getTurnosNotasSemana(turnos: Turno[]): TurnoNotasSemana[] {
  return turnos
    .map((turno) => {
      const notasGenerales = turno.entries.filter((entry) => entry.type === "nota" && !!entry.note?.trim());
      const notasDetalladas = turno.entries.filter((entry) => entry.type !== "nota" && !!entry.note?.trim());
      return { turno, notasGenerales, notasDetalladas };
    })
    .filter((item) => item.notasGenerales.length > 0 || item.notasDetalladas.length > 0);
}
