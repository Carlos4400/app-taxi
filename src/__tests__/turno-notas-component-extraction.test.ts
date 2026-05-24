import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("TurnoNotasCard extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const componentPath = resolve("src/components/turno-notas.tsx");

  it("keeps TurnoNotasCard outside main.tsx", () => {
    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");
    expect(componentSource).toContain("export function TurnoNotasCard");
    expect(mainSource).toContain('from "./components/turno-notas"');
    expect(mainSource).not.toMatch(/^function TurnoNotasCard/m);
  });
});
