import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno selection extraction", () => {
  const turnosSource = readFileSync(resolve("src/logic/turnos.ts"), "utf8");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps calendar selection and dia libre migration in turnos.ts", () => {
    expect(turnosSource).toContain("export function getTurnosByCalendarMonth");
    expect(turnosSource).toContain("export function getTurnosByCalendarYear");
    expect(turnosSource).toContain("export function ensureTurnosDiaLibreContable");
    expect(mainSource).toContain('from "./logic/turnos"');
    expect(mainSource).not.toMatch(/^export function getTurnosByCalendarMonth\(/m);
    expect(mainSource).not.toMatch(/^export function ensureTurnosDiaLibreContable\(/m);
  });
});
