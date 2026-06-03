import type { AppSettings, CurrentState, Turno } from "../shared/types";
import type { WatchCommand, WatchCommandResponse, WatchEntry, WatchEntryType, WatchTurno, WatchTurnoTotals } from "../shared/watch-commands";
import { buildTurnoConfigFromSettings, calcularTurnoContable } from "./accounting";
import { fmtDuration } from "./formatters";
import { mergeTurnos, sortTurnosByDateDesc } from "./turnos";

export type WatchCommandProcessorState = {
  current: CurrentState;
  history: Turno[];
  processedOperationIds: string[];
  settings: Pick<
    AppSettings,
    | "porcentaje.jefe"
    | "porcentaje.chofer"
    | "descontar.datafono"
    | "descontar.agencia_bono"
    | "descontar.extra"
    | "descontar.gasolina"
    | "diaLibre"
  >;
  now: {
    date: string;
    time: string;
    id: number;
  };
};

export type WatchCommandProcessorResult = WatchCommandProcessorState & {
  response: WatchCommandResponse;
};

function isActive(current: CurrentState): boolean {
  return current.entries.length > 0 || !!current.startTime;
}

/** Suma importes y recuenta entradas del turno en curso, por categoría. */
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

/** Historial del turno para el reloj: más recientes primero. */
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

function buildWatchTotalsFromTurno(turno: Turno): WatchTurnoTotals {
  const porTipo: Record<WatchEntryType, number> = {
    propina: turno.totalP || 0,
    datafono: turno.totalD || 0,
    agencia_bono: turno.totalA || 0,
    extra: turno.totalE || 0,
    gasolina: turno.totalF || 0,
    nulo: turno.totalN || 0,
  };
  const numPorTipo: Record<WatchEntryType, number> = {
    propina: 0,
    datafono: 0,
    agencia_bono: 0,
    extra: 0,
    gasolina: 0,
    nulo: 0,
  };

  for (const entry of turno.entries) {
    if (entry.type in numPorTipo) {
      numPorTipo[entry.type as WatchEntryType] += 1;
    }
  }

  return { porTipo, numPorTipo, numEntradas: turno.entries.length };
}

function buildWatchEntradasFromTurno(turno: Turno): WatchEntry[] {
  return turno.entries
    .map((e) => ({
      id: e.id,
      type: e.type as WatchEntry["type"],
      amount: e.amount,
      note: e.note,
      time: e.time,
    }))
    .reverse();
}

export function buildWatchTurnos(history: Turno[], settings: WatchCommandProcessorState["settings"]): WatchTurno[] {
  return sortTurnosByDateDesc(history).slice(0, 30).map((turno) => {
    let totalMins = 0;
    if (turno.startTime && turno.endTime) {
      const [startH, startM] = turno.startTime.split(":").map(Number);
      const [endH, endM] = turno.endTime.split(":").map(Number);
      if (Number.isFinite(startH) && Number.isFinite(startM) && Number.isFinite(endH) && Number.isFinite(endM)) {
        totalMins = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMins < 0) totalMins += 24 * 60;
        totalMins = Math.max(0, totalMins - (turno.totalPausedMinutes || 0));
      }
    }
    const calculo = calcularTurnoContable(turno, settings);

    return {
      id: turno.id,
      date: turno.date,
      startDate: turno.startDate,
      startTime: turno.startTime,
      endTime: turno.endTime,
      dinero: turno.dinero || 0,
      km: turno.km || 0,
      totalTaximetro: calculo.dineroBase,
      miGanancia: calculo.miGanancia,
      totalADescontar: calculo.totalDescontar,
      totalADar: calculo.totalADar,
      tiempoTrabajado: fmtDuration(totalMins),
      totalPausedMinutes: turno.totalPausedMinutes || 0,
      totals: buildWatchTotalsFromTurno(turno),
      entradas: buildWatchEntradasFromTurno(turno),
    };
  });
}

function emptyCurrent(): CurrentState {
  return {
    entries: [],
    startTime: null,
    startDate: null,
    isPaused: false,
    pauseStartTime: null,
    totalPausedMinutes: 0,
  };
}

function withProcessedOperationId(
  state: WatchCommandProcessorState,
  operationId: string,
): string[] {
  return state.processedOperationIds.includes(operationId)
    ? state.processedOperationIds
    : [...state.processedOperationIds, operationId];
}

function errorResponse(command: WatchCommand, code: string, message: string): WatchCommandResponse {
  return {
    type: "ERROR",
    operationId: command.operationId,
    code,
    message,
  };
}

function elapsedMinutes(startTime: string | null | undefined, endTime: string): number {
  if (!startTime) return 0;
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return 0;
  let elapsed = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  if (elapsed < 0) elapsed += 24 * 60;
  return elapsed;
}

export function processWatchCommand(
  command: WatchCommand,
  state: WatchCommandProcessorState,
): WatchCommandProcessorResult {
  if (!command.operationId.trim()) {
    return {
      ...state,
      response: errorResponse(command, "INVALID_OPERATION_ID", "operationId obligatorio"),
    };
  }

  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
        isPaused: state.current.isPaused ?? false,
        pauseStartTime: state.current.pauseStartTime ?? null,
        totalPausedMinutes: state.current.totalPausedMinutes ?? 0,
      },
    };
  }

  if (command.type === "GET_TURNOS") {
    return {
      ...state,
      response: {
        type: "TURNOS_STATUS",
        connected: true,
        turnos: buildWatchTurnos(state.history, state.settings),
      },
    };
  }

  if (state.processedOperationIds.includes(command.operationId)) {
    return {
      ...state,
      response: {
        type: "DUPLICATE_IGNORED",
        operationId: command.operationId,
        message: "Operacion ya procesada",
      },
    };
  }

  if (command.type === "START_TURNO") {
    if (isActive(state.current)) {
      return {
        ...state,
        response: errorResponse(command, "ACTIVE_TURNO", "Ya hay turno activo"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        startTime: state.now.time,
        startDate: state.now.date,
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Turno iniciado",
      },
    };
  }

  if (command.type === "PAUSE_TURNO") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (state.current.isPaused) {
      return {
        ...state,
        response: errorResponse(command, "ALREADY_PAUSED", "El turno ya esta pausado"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        isPaused: true,
        pauseStartTime: state.now.time,
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Turno pausado",
      },
    };
  }

  if (command.type === "RESUME_TURNO") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!state.current.isPaused || !state.current.pauseStartTime) {
      return {
        ...state,
        response: errorResponse(command, "NOT_PAUSED", "El turno no esta pausado"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes:
          (state.current.totalPausedMinutes || 0) +
          elapsedMinutes(state.current.pauseStartTime, state.now.time),
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Turno reanudado",
      },
    };
  }

  if (command.type === "ADD_ENTRY") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!(command.payload.amount > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_AMOUNT", "Importe invalido"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        entries: [
          ...state.current.entries,
          {
            id: state.now.id,
            type: command.payload.entryType,
            amount: command.payload.amount,
            note: command.payload.note.trim(),
            time: state.now.time,
          },
        ],
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Entrada anadida",
      },
    };
  }

  if (command.type === "ADD_NOTE") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    const note = command.payload.note.trim();
    if (!note) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_NOTE", "Nota obligatoria"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        entries: [
          ...state.current.entries,
          {
            id: state.now.id,
            type: "nota",
            amount: 0,
            note,
            time: state.now.time,
          },
        ],
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Nota anadida",
      },
    };
  }

  if (command.type === "EDIT_ENTRY") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    const target = state.current.entries.find((e) => e.id === command.payload.id);
    if (!target) {
      return {
        ...state,
        response: errorResponse(command, "ENTRY_NOT_FOUND", "Entrada no encontrada"),
      };
    }
    if (target.type !== "nota" && !(command.payload.amount > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_AMOUNT", "Importe invalido"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        entries: state.current.entries.map((e) =>
          e.id === command.payload.id
            ? { ...e, amount: e.type === "nota" ? e.amount : command.payload.amount, note: command.payload.note.trim() }
            : e,
        ),
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Entrada editada",
      },
    };
  }

  if (command.type === "DELETE_ENTRY") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    const exists = state.current.entries.some((e) => e.id === command.payload.id);
    if (!exists) {
      return {
        ...state,
        response: errorResponse(command, "ENTRY_NOT_FOUND", "Entrada no encontrada"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        entries: state.current.entries.filter((e) => e.id !== command.payload.id),
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Entrada borrada",
      },
    };
  }

  if (command.type === "END_TURNO") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!(command.payload.dinero > 0) || !(command.payload.km > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_END_VALUES", "Taximetro y kilometros obligatorios"),
      };
    }

    const entries = state.current.entries;
    const turno: Turno = {
      id: state.now.id,
      date: state.now.date,
      startTime: state.current.startTime,
      endTime: state.now.time,
      entries,
      totalP: entries.filter((e) => e.type === "propina").reduce((s, e) => s + e.amount, 0),
      totalD: entries.filter((e) => e.type === "datafono").reduce((s, e) => s + e.amount, 0),
      totalA: entries.filter((e) => e.type === "agencia_bono").reduce((s, e) => s + e.amount, 0),
      totalE: entries.filter((e) => e.type === "extra").reduce((s, e) => s + e.amount, 0),
      totalF: entries.filter((e) => e.type === "gasolina").reduce((s, e) => s + e.amount, 0),
      totalN: entries.filter((e) => e.type === "nulo").reduce((s, e) => s + e.amount, 0),
      dinero: command.payload.dinero,
      km: command.payload.km,
      notes: command.payload.note.trim(),
      startDate: state.current.startDate,
      totalPausedMinutes:
        (state.current.totalPausedMinutes || 0) +
        (state.current.isPaused ? elapsedMinutes(state.current.pauseStartTime, state.now.time) : 0),
      configTurno: buildTurnoConfigFromSettings(state.settings),
      diaLibreContable: state.settings.diaLibre,
    };

    return {
      ...state,
      current: emptyCurrent(),
      history: mergeTurnos(state.history, [turno]),
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Turno terminado",
      },
    };
  }

  return {
    ...state,
    response: errorResponse(command, "UNKNOWN_COMMAND", "Comando no reconocido"),
  };
}
