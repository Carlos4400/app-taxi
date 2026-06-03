import type { CurrentState } from "../shared/types";
import type { WatchEntry, WatchEntryType, WatchTurnoTotals } from "../shared/watch-commands";

export function computeWatchTotals(current: CurrentState): WatchTurnoTotals {
  const porTipo: Record<WatchEntryType, number> = {
    propina: 0,
    datafono: 0,
    agencia_bono: 0,
    extra: 0,
    gasolina: 0,
    nulo: 0,
  };
  const numPorTipo: Record<WatchEntryType, number> = {
    propina: 0,
    datafono: 0,
    agencia_bono: 0,
    extra: 0,
    gasolina: 0,
    nulo: 0,
  };
  for (const entry of current.entries) {
    if (entry.type in porTipo) {
      porTipo[entry.type as WatchEntryType] += entry.amount;
      numPorTipo[entry.type as WatchEntryType] += 1;
    }
  }
  return { porTipo, numPorTipo, numEntradas: current.entries.length };
}

export function buildWatchEntradas(current: CurrentState): WatchEntry[] {
  return current.entries
    .map((e) => ({
      id: e.id,
      type: e.type as WatchEntry["type"],
      amount: e.amount,
      note: e.note,
      time: e.time,
    }))
    .reverse();
}