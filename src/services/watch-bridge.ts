import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand, computeWatchTotals, buildWatchEntradas } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
import { auth } from "./firebase";

export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string; processedOperationIds: string[] }): Promise<void>;
  drainQueue(): Promise<{ commands?: PendingWatchCommand[] }>;
  confirmProcessed(options: { operationIds: string[] }): Promise<void>;
  startTurnoForegroundService(): Promise<void>;
  stopTurnoForegroundService(): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string; nodeId?: string }) => void
  ): Promise<any> & any;
}

const WearOsBridge = registerPlugin<WearOsBridgePlugin>("WearOsBridge");

let listenerAdded = false;
let preparedUid: string | null = null;
let drainingQueue = false;

type PendingWatchCommand = {
  operationId?: string;
  command?: string;
  nodeId?: string;
};

type HandleWatchCommandOptions = {
  confirmNative?: boolean;
};

function readOperationId(command: unknown): string {
  if (!command || typeof command !== "object") return "";
  const value = (command as { operationId?: unknown }).operationId;
  return typeof value === "string" ? value : "";
}

function shouldConfirmNativeCommand(command: WatchCommand): boolean {
  return command.type === "START_TURNO"
    || command.type === "ADD_ENTRY"
    || command.type === "ADD_NOTE"
    || command.type === "EDIT_ENTRY"
    || command.type === "DELETE_ENTRY"
    || command.type === "END_TURNO";
}

function errorResponse(operationId: string, code: string, message: string): WatchCommandResponse {
  return {
    type: "ERROR",
    operationId,
    code,
    message,
  };
}

async function sendResponse(response: WatchCommandResponse, nodeId?: string): Promise<void> {
  await WearOsBridge.sendResponse({
    nodeId,
    response: JSON.stringify(response),
  });
}

async function updateForegroundServiceForCommand(command: WatchCommand, response: WatchCommandResponse): Promise<void> {
  if (response.type !== "OK") return;
  if (command.type === "START_TURNO") {
    await WearOsBridge.startTurnoForegroundService().catch((err) => {
      console.error("Error al iniciar servicio foreground del reloj:", err);
    });
  }
  if (command.type === "END_TURNO") {
    await WearOsBridge.stopTurnoForegroundService().catch((err) => {
      console.error("Error al parar servicio foreground del reloj:", err);
    });
  }
}

async function handleWatchCommand(
  commandJson: string,
  nodeId?: string,
  options: HandleWatchCommandOptions = {},
): Promise<WatchCommandResponse> {
  const command = JSON.parse(commandJson) as WatchCommand;
  const operationId = readOperationId(command);
  const store = useAppStore.getState();
  const authUid = auth.currentUser?.uid ?? null;

  if (!authUid || !preparedUid || authUid !== preparedUid) {
    const response = errorResponse(
      operationId,
      "AUTH_UID_MISMATCH",
      "Usuario movil no coincide con el puente del reloj",
    );
    await sendResponse(response, nodeId);
    return response;
  }

  if (!store.dataLoaded) {
    const response = errorResponse(
      operationId,
      "DATA_NOT_LOADED",
      "Datos del usuario no cargados",
    );
    await sendResponse(response, nodeId);
    return response;
  }

  const processorState = {
    current: store.current,
    history: store.history,
    processedOperationIds: store.processedOperationIds,
    settings: {
      "porcentaje.jefe": store.settings["porcentaje.jefe"],
      "porcentaje.chofer": store.settings["porcentaje.chofer"],
      "descontar.datafono": store.settings["descontar.datafono"],
      "descontar.agencia_bono": store.settings["descontar.agencia_bono"],
      "descontar.extra": store.settings["descontar.extra"],
      "descontar.gasolina": store.settings["descontar.gasolina"],
      diaLibre: store.settings.diaLibre,
    },
    now: {
      date: new Date().toLocaleDateString("en-CA"),
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      id: Date.now(),
    },
  };

  const result = processWatchCommand(command, processorState);

  if (result.response.type === "OK") {
    if (command.type === "START_TURNO" || command.type === "ADD_ENTRY" || command.type === "ADD_NOTE" || command.type === "EDIT_ENTRY" || command.type === "DELETE_ENTRY" || command.type === "END_TURNO") {
      store.setCurrent(result.current);
      store.setHistory(result.history);
    }
    store.setProcessedOperationIds(result.processedOperationIds);
  }

  await updateForegroundServiceForCommand(command, result.response);
  await sendResponse(result.response, nodeId);

  if (result.response.type === "OK") {
    await sendWatchStatus();
  }

  if (options.confirmNative && result.response.type !== "ERROR" && operationId && shouldConfirmNativeCommand(command)) {
    await WearOsBridge.confirmProcessed({ operationIds: [operationId] }).catch((err) => {
      console.error("Error al confirmar comando Wear OS:", err);
    });
  }

  return result.response;
}

async function drainNativeQueue(): Promise<void> {
  if (drainingQueue) return;
  drainingQueue = true;
  try {
    const result = await WearOsBridge.drainQueue();
    const commands = Array.isArray(result.commands) ? result.commands : [];
    const confirmedOperationIds: string[] = [];

    for (const item of commands) {
      if (!item.command) continue;
      try {
        const response = await handleWatchCommand(item.command, item.nodeId);
        const operationId = response.type === "STATUS" || response.type === "TURNOS_STATUS"
          ? item.operationId
          : response.operationId || item.operationId;
        if (operationId && response.type !== "ERROR") {
          confirmedOperationIds.push(operationId);
        }
      } catch (err) {
        console.error("Error al drenar comando Wear OS:", err);
      }
    }

    if (confirmedOperationIds.length > 0) {
      await WearOsBridge.confirmProcessed({
        operationIds: confirmedOperationIds,
      });
    }
  } catch (err) {
    console.error("Error al drenar cola nativa de Wear OS:", err);
  } finally {
    drainingQueue = false;
  }
}

/**
 * Inicializa la escucha de comandos desde el reloj.
 * Debe llamarse cuando el UID del usuario está disponible y los datos se han cargado.
 */
export function setupWatchBridge(uid: string) {
  if (!uid) return;
  if (!Capacitor.isNativePlatform()) return;

  preparedUid = uid;

  WearOsBridge.setPrepared({
    uid,
    processedOperationIds: useAppStore.getState().processedOperationIds,
  })
    .then(() => {
      console.log("WearOsBridge preparado para el usuario:", uid);
      drainNativeQueue().catch((err) => console.error("Error al drenar cola Wear OS:", err));
    })
    .catch((err) => {
      console.error("Error al preparar WearOsBridge:", err);
    });

  if (listenerAdded) return;
  listenerAdded = true;

  WearOsBridge.addListener("onCommandReceived", async (data: { command: string; nodeId?: string }) => {
    try {
      await handleWatchCommand(data.command, data.nodeId, { confirmNative: true });

    } catch (err) {
      console.error("Error al procesar comando de Wear OS:", err);
      await sendResponse(errorResponse(
        "",
        "INVALID_COMMAND",
        "Comando del reloj invalido",
      ), data.nodeId);
    }
  });
}

/**
 * Envía el estado actual del turno al reloj.
 */
export async function sendWatchStatus() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const store = useAppStore.getState();
    const isActive = store.current.entries.length > 0 || !!store.current.startTime;

    const response: WatchCommandResponse = {
      type: "STATUS",
      connected: true,
      activeTurno: isActive,
      startTime: store.current.startTime,
      startDate: store.current.startDate,
      totals: computeWatchTotals(store.current),
      entradas: buildWatchEntradas(store.current),
    };

    await WearOsBridge.sendResponse({
      response: JSON.stringify(response),
    });
  } catch (err) {
    console.error("Error al enviar status al reloj:", err);
  }
}
