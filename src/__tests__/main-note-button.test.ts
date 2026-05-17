import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Main note button", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("uses the neon note add icon while preserving the add note flow", () => {
    expect(source).toContain("const IconNoteAdd =");
    expect(source).toMatch(/<IconNoteAdd s=\{26\} \/>\s*Añadir Nota al Turno/);
    expect(source).toMatch(/setNoteS\(""\);\s*setScreen\("addNotaGeneral"\);/);
    expect(source).not.toMatch(/<span style=\{\{ fontSize: 18 \}\}>📝<\/span>\s*Añadir Nota al Turno/);
  });
});
