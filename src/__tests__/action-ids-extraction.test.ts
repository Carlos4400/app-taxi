import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Action id extraction", () => {
  const actionIdsPath = resolve("src/shared/action-ids.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps home and backup action ids outside main.tsx", () => {
    expect(existsSync(actionIdsPath)).toBe(true);

    const actionIdsSource = readFileSync(actionIdsPath, "utf8");
    expect(actionIdsSource).toContain("export function getHomeQuickActionIds");
    expect(actionIdsSource).toContain("export function getBackupMenuActionIds");
    expect(mainSource).toContain('from "./shared/action-ids"');
    expect(mainSource).not.toMatch(/^export type HomeQuickActionId/m);
    expect(mainSource).not.toMatch(/^export function getHomeQuickActionIds\(/m);
  });
});
