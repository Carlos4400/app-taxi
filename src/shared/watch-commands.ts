export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

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
