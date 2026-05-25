import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Backup export extraction", () => {
  const backupExportPath = resolve("src/backup-export.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Capacitor backup export outside main.tsx", () => {
    expect(existsSync(backupExportPath)).toBe(true);

    const backupExportSource = readFileSync(backupExportPath, "utf8");
    expect(backupExportSource).toContain("export async function exportBackupJSON");
    expect(backupExportSource).toContain("@capacitor/filesystem");
    expect(backupExportSource).toContain("@capacitor/share");
    expect(mainSource).toContain('from "./backup-export"');
    expect(mainSource).not.toMatch(/^async function exportBackupJSON\(/m);
  });
});
