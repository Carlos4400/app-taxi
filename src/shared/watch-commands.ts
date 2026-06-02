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

export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "START_TURNO";
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
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
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
