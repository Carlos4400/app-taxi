import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS } from "../storage-keys";

describe("State loader extraction", () => {
  const stateLoadersPath = resolve("src/state-loaders.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps localStorage state loaders outside main.tsx", async () => {
    expect(existsSync(stateLoadersPath)).toBe(true);

    const modulePath = "../state-loaders";
    const { loadSettings, loadCurrent, loadHistory } = await import(modulePath);
    localStorage.clear();

    expect(loadSettings()).toMatchObject({
      "porcentaje.jefe": 0,
      "porcentaje.chofer": 0,
      "descontar.datafono": true,
      diaLibre: 2,
      diaLibreDesde: null,
    });
    localStorage.setItem(KEY_SETTINGS, JSON.stringify({ "porcentaje.jefe": 55, diaLibre: 1 }));
    expect(loadSettings()).toMatchObject({
      "porcentaje.jefe": 55,
      "descontar.datafono": true,
      diaLibre: 1,
    });

    expect(loadCurrent()).toEqual({
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    });
    localStorage.setItem(KEY_CURRENT, JSON.stringify({ entries: [], startTime: "10:00", startDate: "2026-05-01" }));
    expect(loadCurrent()).toMatchObject({ startTime: "10:00", isPaused: false, totalPausedMinutes: 0 });

    localStorage.setItem(KEY_HISTORY, JSON.stringify([
      { date: "2026-05-01", startDate: "2026-05-01", startTime: "08:00" },
      { date: "2026-05-02", startDate: "2026-05-02", startTime: "08:00" },
    ]));
    expect(loadHistory().map((turno: { date: string }) => turno.date)).toEqual(["2026-05-02", "2026-05-01"]);

    expect(mainSource).toContain('from "./state-loaders"');
    expect(mainSource).not.toMatch(/^function loadSettings\(/m);
    expect(mainSource).not.toMatch(/^function loadCurrent\(/m);
    expect(mainSource).not.toMatch(/^function loadWeekOverrides\(/m);
  });
});
