import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Turno entrega extraction", () => {
  const entregaPath = resolve("src/turno-entrega.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps delivery status updates outside main.tsx", () => {
    expect(existsSync(entregaPath)).toBe(true);

    const entregaSource = readFileSync(entregaPath, "utf8");
    expect(entregaSource).toContain("export function updateTurnoEntrega");
    expect(entregaSource).toContain("fechaEntrega: entregada ? fechaEntrega : null");
    expect(mainSource).toContain('from "./turno-entrega"');
    expect(mainSource).not.toMatch(/^export function updateTurnoEntrega\(/m);
  });
});
