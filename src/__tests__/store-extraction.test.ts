import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../services/store";

/**
 * Contrato del store global (Zustand) en el que se apoyan las pantallas
 * migradas en la Fase 2. No requiere React: se ejercita vía getState().
 */
describe("store: slice de negocio", () => {
  beforeEach(() => {
    useAppStore.getState().setCurrent({
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    });
  });

  it("setCurrent acepta un valor directo", () => {
    useAppStore.getState().setCurrent((prev) => ({ ...prev, startTime: "08:00" }));
    expect(useAppStore.getState().current.startTime).toBe("08:00");
  });

  it("setCurrent con updater añade una entrada (flujo de AddNotaGeneralScreen)", () => {
    const entry = { id: 1, type: "nota" as const, amount: 0, note: "hola", time: "08:00" };
    useAppStore.getState().setCurrent((prev) => ({ ...prev, entries: [...prev.entries, entry] }));
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(useAppStore.getState().current.entries[0].note).toBe("hola");
  });
});

describe("store: slice de navegación", () => {
  beforeEach(() => {
    useAppStore.getState().resetNavigation("home");
  });

  it("setScreen apila en el stack", () => {
    useAppStore.getState().setScreen("calendar");
    useAppStore.getState().setScreen("addNotaGeneral");
    expect(useAppStore.getState().screen).toBe("addNotaGeneral");
    expect(useAppStore.getState().navigationStack).toEqual([
      "home",
      "calendar",
      "addNotaGeneral",
    ]);
  });

  it("setScreen no apila si es la misma pantalla", () => {
    useAppStore.getState().setScreen("home");
    expect(useAppStore.getState().navigationStack).toEqual(["home"]);
  });

  it("goBack retrocede una pantalla y devuelve true", () => {
    useAppStore.getState().setScreen("calendar");
    const ok = useAppStore.getState().goBack();
    expect(ok).toBe(true);
    expect(useAppStore.getState().screen).toBe("home");
    expect(useAppStore.getState().navigationStack).toEqual(["home"]);
  });

  it("goBack en la raíz devuelve false y no cambia la pantalla", () => {
    const ok = useAppStore.getState().goBack();
    expect(ok).toBe(false);
    expect(useAppStore.getState().screen).toBe("home");
  });

  it("resetNavigation reinicia el stack a la raíz dada (flujo post-cierre de turno)", () => {
    useAppStore.getState().setScreen("calendar");
    useAppStore.getState().setScreen("confirmEnd");
    useAppStore.getState().resetNavigation("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    // Atrás desde el resumen debe llevar a la lista de turnos, no a confirmEnd.
    expect(useAppStore.getState().navigationStack).toEqual(["PantallaTurnos", "summary"]);
    useAppStore.getState().goBack();
    expect(useAppStore.getState().screen).toBe("PantallaTurnos");
  });

  it("replaceScreen sustituye la pantalla actual sin duplicar la anterior", () => {
    useAppStore.getState().setScreen("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    useAppStore.getState().setScreen("editTurno");

    const replaceScreen = (useAppStore.getState() as any).replaceScreen;
    expect(typeof replaceScreen).toBe("function");

    replaceScreen("summary");

    expect(useAppStore.getState().screen).toBe("summary");
    expect(useAppStore.getState().navigationStack).toEqual([
      "home",
      "PantallaTurnos",
      "summary",
    ]);
  });
});
