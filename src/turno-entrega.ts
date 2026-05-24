export type EntregaTurno = {
  id: number;
  entregada?: boolean;
  fechaEntrega?: string | null;
};

export function updateTurnoEntrega<T extends EntregaTurno>(
  turnos: T[],
  turnoId: number,
  entregada: boolean,
  fechaEntrega: string | null
): T[] {
  return turnos.map((t) =>
    t.id === turnoId
      ? { ...t, entregada, fechaEntrega: entregada ? fechaEntrega : null }
      : t
  );
}
