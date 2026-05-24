import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Backup builder extraction", () => {
  const backupPath = resolve("src/backup.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps backup payload builders outside main.tsx", () => {
    expect(existsSync(backupPath)).toBe(true);

    const backupSource = readFileSync(backupPath, "utf8");
    expect(backupSource).toContain("export function buildBackupPayload");
    expect(backupSource).toContain("export function buildBackupPayloadFromState");
    expect(mainSource).toContain('from "./backup"');
    expect(mainSource).not.toMatch(/^export function buildBackupPayload\(/m);
  });
});
