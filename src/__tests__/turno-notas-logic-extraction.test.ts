import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno notes logic extraction", () => {
  const notesLogicPath = resolve("src/turno-notas-logic.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps weekly turn note filtering outside main.tsx", () => {
    expect(existsSync(notesLogicPath)).toBe(true);

    const notesLogicSource = readFileSync(notesLogicPath, "utf8");
    expect(notesLogicSource).toContain("export function getTurnosNotasSemana");
    expect(notesLogicSource).toContain('entry.type === "nota"');
    expect(mainSource).toContain('from "./turno-notas-logic"');
    expect(mainSource).not.toMatch(/^export function getTurnosNotasSemana\(/m);
  });
});
