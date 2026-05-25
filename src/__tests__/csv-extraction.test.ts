import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CSV parsing extraction", () => {
  const csvPath = resolve("src/logic/csv.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps CSV parsing helpers outside main.tsx", () => {
    expect(existsSync(csvPath)).toBe(true);

    const csvSource = readFileSync(csvPath, "utf8");
    expect(csvSource).toContain("export function parseCSVLine");
    expect(csvSource).toContain("export function parseCSVToHistory");
    expect(csvSource).toContain('from "./turnos"');
    expect(mainSource).toContain('from "./logic/csv"');
    expect(mainSource).not.toMatch(/^export function parseCSVLine\(/m);
    expect(mainSource).not.toMatch(/^export function parseCSVToHistory\(/m);
  });
});
