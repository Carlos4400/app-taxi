export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

/** Una entrada del turno tal y como se muestra en el historial del reloj. */
export type WatchEntry = {
  id: number;
  type: WatchEntryType | "nota";
  amount: number;
  note: string;
  time: string;
};

/** Importe y recuento acumulados del turno en curso, por categoría. */
export type WatchTurnoTotals = {
  porTipo: Record<WatchEntryType, number>;
  numPorTipo: Record<WatchEntryType, number>;
  numEntradas: number;
};

export type WatchTurno = {
  id: number;
  date: string;
  startDate: string | null;
  startTime: string | null;
  endTime: string;
  dinero: number;
  km: number;
  totalTaximetro: number;
  miGanancia: number;
  totalADescontar: number;
  totalADar: number;
  tiempoTrabajado: string;
  totalPausedMinutes: number;
  totals: WatchTurnoTotals;
  entradas: WatchEntry[];
};

export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "GET_TURNOS" | "START_TURNO" | "PAUSE_TURNO" | "RESUME_TURNO";
      createdAt: string;
    }
  | {
      operationId: string;
      type: "ADD_ENTRY";
      createdAt: string;
      payload: {
        entryType: WatchEntryType;
        amount: number;
        note: string;
      };
    }
  | {
      operationId: string;
      type: "ADD_NOTE";
      createdAt: string;
      payload: {
        note: string;
      };
    }
  | {
      operationId: string;
      type: "EDIT_ENTRY";
      createdAt: string;
      payload: {
        id: number;
        amount: number;
        note: string;
      };
    }
  | {
      operationId: string;
      type: "DELETE_ENTRY";
      createdAt: string;
      payload: {
        id: number;
      };
    }
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };

export type WatchCommandResponse =
  | ({
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
      isPaused: boolean;
      pauseStartTime: string | null;
      totalPausedMinutes: number;
    } & { userSessionId?: string })
  | {
      type: "TURNOS_STATUS";
      connected: true;
      turnos: WatchTurno[];
    }
  | {
      type: "OK";
      operationId: string;
      message: string;
    }
  | {
      type: "ERROR";
      operationId: string;
      code: string;
      message: string;
    }
  | {
      type: "DUPLICATE_IGNORED";
      operationId: string;
      message: string;
    };
