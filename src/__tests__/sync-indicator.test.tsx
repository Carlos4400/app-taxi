import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SyncIndicator } from "../components/sync-indicator";
import { clearUserPendingSync, markUserPendingSync } from "../services/pending-sync";
import { useAppStore } from "../services/store";

vi.mock("../services/firebase", () => ({
  auth: { currentUser: { uid: "uid-actual" } },
}));

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

function indicatorTitle() {
  return document.querySelector("div[title]")?.getAttribute("title");
}

describe("SyncIndicator", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    setNavigatorOnline(true);
    useAppStore.getState().setDataLoaded(true);
    useAppStore.getState().setLoadTimedOut(false);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("muestra carga inicial antes de considerar la app sincronizada", () => {
    useAppStore.getState().setDataLoaded(false);

    act(() => {
      root.render(<SyncIndicator />);
    });

    expect(indicatorTitle()).toBe("Cargando datos");
  });

  it("muestra pendientes solo para el UID actual", () => {
    markUserPendingSync("uid-otro", "turnos");

    act(() => {
      root.render(<SyncIndicator />);
    });

    expect(indicatorTitle()).toBe("Sincronizado");

    act(() => {
      markUserPendingSync("uid-actual", "turnos");
    });

    expect(indicatorTitle()).toBe("Cambios pendientes");
  });

  it("vuelve a sincronizado al limpiar el ultimo pendiente del UID actual", () => {
    act(() => {
      root.render(<SyncIndicator />);
    });

    expect(indicatorTitle()).toBe("Sincronizado");

    act(() => {
      markUserPendingSync("uid-actual", "notes");
    });
    expect(indicatorTitle()).toBe("Cambios pendientes");

    act(() => {
      clearUserPendingSync("uid-actual", "notes");
    });
    expect(indicatorTitle()).toBe("Sincronizado");
  });

  it("muestra modo sin conexion cuando el navegador queda offline", () => {
    act(() => {
      root.render(<SyncIndicator />);
    });

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(indicatorTitle()).toBe("Modo sin conexión");
  });

  it("muestra error cuando la carga inicial agota el tiempo", () => {
    useAppStore.getState().setLoadTimedOut(true);

    act(() => {
      root.render(<SyncIndicator />);
    });

    expect(indicatorTitle()).toBe("Error de sincronización");
  });
});
