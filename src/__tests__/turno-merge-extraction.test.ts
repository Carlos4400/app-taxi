import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno merge extraction", () => {
  const turnosPath = resolve("src/logic/turnos.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps turno sorting and merge helpers outside main.tsx", () => {
    expect(existsSync(turnosPath)).toBe(true);

    const turnosSource = readFileSync(turnosPath, "utf8");
    expect(turnosSource).toContain("export function sortTurnosByDateDesc");
    expect(turnosSource).toContain("export function mergeTurnos");
    expect(turnosSource).toContain("function getTurnoMergeKey");
    expect(mainSource).toContain('from "./logic/turnos"');
    expect(mainSource).not.toMatch(/^export function sortTurnosByDateDesc\(/m);
    expect(mainSource).not.toMatch(/^export function mergeTurnos\(/m);
  });
});
