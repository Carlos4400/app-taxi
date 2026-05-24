import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Date label extraction", () => {
  const dateLabelsPath = resolve("src/date-labels.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps month labels and accounting period labels outside main.tsx", async () => {
    expect(existsSync(dateLabelsPath)).toBe(true);

    const modulePath = "../date-labels";
    const { MESES_COMPLETOS, MESES_ABREVIADOS, getAccountingPeriodLabel, getMesLabel } = await import(modulePath);
    expect(MESES_COMPLETOS[4]).toBe("Mayo");
    expect(MESES_ABREVIADOS[4]).toBe("May");
    expect(getMesLabel("2026-05")).toBe("Mayo 2026");
    expect(getAccountingPeriodLabel(2026, 5)).toBe("Mayo 2026");

    expect(mainSource).toContain('from "./date-labels"');
    expect(mainSource).not.toMatch(/^const MESES_COMPLETOS/m);
    expect(mainSource).not.toMatch(/^function getMesLabel\(/m);
    expect(mainSource).not.toMatch(/^export function getAccountingPeriodLabel\(/m);
  });
});
