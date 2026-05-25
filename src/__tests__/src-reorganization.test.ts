import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("src folder reorganization", () => {
  it("keeps source modules grouped by role", () => {
    const rootFiles = readdirSync(resolve("src"), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();

    expect(rootFiles).toEqual(["main.tsx"]);

    for (const file of [
      "types.ts",
      "action-ids.ts",
      "storage-keys.ts",
      "card-styles.ts",
      "ui-theme.ts",
      "app-version.ts",
    ]) {
      expect(existsSync(resolve("src/shared", file))).toBe(true);
    }

    for (const file of [
      "firebase.ts",
      "firestore-sync.ts",
      "user-storage.ts",
      "apk-installer.ts",
      "service-worker-registration.ts",
    ]) {
      expect(existsSync(resolve("src/services", file))).toBe(true);
    }

    for (const file of ["login-screen.tsx", "admin-screens.tsx", "auth-gate.tsx"]) {
      expect(existsSync(resolve("src/screens", file))).toBe(true);
    }

    for (const file of [
      "accounting.ts",
      "week-logic.ts",
      "turnos.ts",
      "turno-entrega.ts",
      "turno-notas-logic.ts",
      "csv.ts",
      "backup.ts",
      "backup-export.ts",
      "update-flow.ts",
      "date-time.ts",
      "calendar-date.ts",
      "date-labels.ts",
      "formatters.ts",
      "state-loaders.ts",
    ]) {
      expect(existsSync(resolve("src/logic", file))).toBe(true);
    }
  });
});
