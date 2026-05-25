import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("domain types extraction", () => {
  const typesPath = resolve("src/types.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps shared domain types outside main.tsx", () => {
    expect(existsSync(typesPath)).toBe(true);

    const typesSource = readFileSync(typesPath, "utf8");
    const stateLoadersSource = readFileSync(resolve("src/state-loaders.ts"), "utf8");
    const turnoNotasSource = readFileSync(resolve("src/turno-notas-logic.ts"), "utf8");
    const turnoNotasCardSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
    const editEntryDialogSource = readFileSync(resolve("src/components/edit-entry-dialog.tsx"), "utf8");

    expect(typesSource).toContain("export interface Turno");
    expect(typesSource).toContain("export interface AppSettings");
    expect(typesSource).toContain("export interface Reserva");
    expect(mainSource).toContain('from "./types"');
    expect(mainSource).not.toMatch(/^export interface Turno /m);
    expect(mainSource).not.toMatch(/^export interface AppSettings /m);
    expect(stateLoadersSource).toContain('from "./types"');
    expect(turnoNotasSource).toContain('from "./types"');
    expect(turnoNotasCardSource).toContain('from "../types"');
    expect(editEntryDialogSource).toContain('from "../types"');
  });
});
