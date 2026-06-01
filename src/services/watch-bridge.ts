import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";

export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string }) => void
  ): Promise<any> & any;
}

const WearOsBridge = registerPlugin<WearOsBridgePlugin>("WearOsBridge");

let listenerAdded = false;

/**
 * Inicializa la escucha de comandos desde el reloj.
 * Debe llamarse cuando el UID del usuario está disponible y los datos se han cargado.
 */
export function setupWatchBridge(uid: string) {
  if (!uid) return;
  if (!Capacitor.isNativePlatform()) return;

  WearOsBridge.setPrepared({ uid })
    .then(() => {
      console.log("WearOsBridge preparado para el usuario:", uid);
    })
    .catch((err) => {
      console.error("Error al preparar WearOsBridge:", err);
    });

  if (listenerAdded) return;
  listenerAdded = true;

  WearOsBridge.addListener("onCommandReceived", async (data: { command: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const store = useAppStore.getState();

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
        if (command.type === "START_TURNO" || command.type === "ADD_ENTRY" || command.type === "ADD_NOTE" || command.type === "END_TURNO") {
          store.setCurrent(result.current);
          store.setHistory(result.history);
        }
        store.setProcessedOperationIds(result.processedOperationIds);
      }

      await WearOsBridge.sendResponse({
        response: JSON.stringify(result.response),
      });

      if (result.response.type === "OK") {
        await sendWatchStatus();
      }

    } catch (err) {
      console.error("Error al procesar comando de Wear OS:", err);
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
    };

    await WearOsBridge.sendResponse({
      response: JSON.stringify(response),
    });
  } catch (err) {
    console.error("Error al enviar status al reloj:", err);
  }
}
