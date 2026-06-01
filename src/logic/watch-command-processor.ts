import type { AppSettings, CurrentState, Turno } from "../shared/types";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
import { buildTurnoConfigFromSettings } from "./accounting";
import { mergeTurnos } from "./turnos";

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
      totalPausedMinutes: state.current.totalPausedMinutes || 0,
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
