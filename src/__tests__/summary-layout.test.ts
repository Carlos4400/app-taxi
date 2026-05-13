import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Summary screen layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps the turno date outside the summary header as its own screen title", () => {
    expect(source).toContain('aria-label="Fecha del turno"');
    expect(source).toMatch(/aria-label="Fecha del turno"[\s\S]*?textAlign: "center"[\s\S]*?>\s*\{turnoSummaryDateTitle\}/);
    expect(source).not.toMatch(/Resumen del Turno<\/div>\s*<div[^>]+>\s*\{viewTurno\.startDate/);
  });
});
