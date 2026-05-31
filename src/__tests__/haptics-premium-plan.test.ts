import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(path), "utf8");
}

describe("plan premium de vibracion", () => {
  it("expone nombres semanticos y reserva Medium para tocar y Heavy para guardar o peligro", () => {
    const hapticsSource = source("src/services/haptics.ts");

    for (const fn of ["hapticKey", "hapticOpen", "hapticBackClose"]) {
      expect(hapticsSource).toContain(`export async function ${fn}()`);
      expect(hapticsSource).toMatch(new RegExp(`export async function ${fn}\\(\\): Promise<void> \\{\\s*return impactMedium\\(\\);\\s*\\}`));
    }

    for (const fn of ["hapticSave", "hapticDanger", "hapticInvalid"]) {
      expect(hapticsSource).toContain(`export async function ${fn}()`);
      expect(hapticsSource).toMatch(new RegExp(`export async function ${fn}\\(\\): Promise<void> \\{\\s*return impactHeavy\\(\\);\\s*\\}`));
    }
  });

  it("las pantallas usan nombres semanticos en lugar de intensidades antiguas directas", () => {
    const checkedFiles = [
      "src/main.tsx",
      "src/screens/add-entry-screen.tsx",
      "src/screens/add-single-entry-screen.tsx",
      "src/screens/confirm-end-screen.tsx",
      "src/screens/edit-turno-screen.tsx",
      "src/screens/settings-screen.tsx",
    ];

    for (const file of checkedFiles) {
      const text = source(file);
      expect(text, file).not.toMatch(/\bhapticTap\(/);
      expect(text, file).not.toMatch(/\bhapticConfirm\(/);
      expect(text, file).not.toMatch(/\bhapticAction\(/);
    }
  });

  it("anadir propina y datafono usa Medium para teclas y Heavy para guardar", () => {
    const addEntrySource = source("src/screens/add-entry-screen.tsx");

    expect(addEntrySource).toContain('import { hapticKey, hapticSave, hapticOpen } from "../services/haptics"');
    expect(addEntrySource).toContain("hapticKey();");
    expect(addEntrySource).toContain("hapticSave();");
    expect(addEntrySource).toContain("hapticOpen();");
  });
});
