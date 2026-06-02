import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand, computeWatchTotals, buildWatchEntradas } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
import { auth } from "./firebase";

export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string; nodeId?: string }) => void
  ): Promise<any> & any;
}

const WearOsBridge = registerPlugin<WearOsBridgePlugin>("WearOsBridge");

let listenerAdded = false;
let preparedUid: string | null = null;

function readOperationId(command: unknown): string {
  if (!command || typeof command !== "object") return "";
  const value = (command as { operationId?: unknown }).operationId;
  return typeof value === "string" ? value : "";
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

/**
 * Inicializa la escucha de comandos desde el reloj.
 * Debe llamarse cuando el UID del usuario está disponible y los datos se han cargado.
 */
export function setupWatchBridge(uid: string) {
  if (!uid) return;
  if (!Capacitor.isNativePlatform()) return;

  preparedUid = uid;

  WearOsBridge.setPrepared({ uid })
    .then(() => {
      console.log("WearOsBridge preparado para el usuario:", uid);
    })
    .catch((err) => {
      console.error("Error al preparar WearOsBridge:", err);
    });

  if (listenerAdded) return;
  listenerAdded = true;

  WearOsBridge.addListener("onCommandReceived", async (data: { command: string; nodeId?: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const operationId = readOperationId(command);
      const store = useAppStore.getState();
      const authUid = auth.currentUser?.uid ?? null;

      if (!authUid || !preparedUid || authUid !== preparedUid) {
        await sendResponse(errorResponse(
          operationId,
          "AUTH_UID_MISMATCH",
          "Usuario movil no coincide con el puente del reloj",
        ), data.nodeId);
        return;
      }

      if (!store.dataLoaded) {
        await sendResponse(errorResponse(
          operationId,
          "DATA_NOT_LOADED",
          "Datos del usuario no cargados",
        ), data.nodeId);
        return;
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

      await sendResponse(result.response, data.nodeId);

      if (result.response.type === "OK") {
        await sendWatchStatus();
      }

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
