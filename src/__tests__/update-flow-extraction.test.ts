import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Update flow extraction", () => {
  const helperPath = resolve("src/logic/update-flow.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps GitHub release parsing outside main.tsx", () => {
    expect(existsSync(helperPath)).toBe(true);

    const helperSource = readFileSync(helperPath, "utf8");
    expect(helperSource).toContain("export function resolveLatestApkUpdate");
    expect(helperSource).toContain('asset.name.endsWith(".apk")');
    expect(mainSource).toContain('from "./logic/update-flow"');
    expect(mainSource).not.toContain('data.assets?.find((asset: any) => asset.name && asset.name.endsWith(".apk"))');
  });
});
