import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Common component extraction", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const commonPath = resolve("src/components/common.tsx");

  it("keeps low-risk common components outside main.tsx", () => {
    expect(existsSync(commonPath)).toBe(true);

    const commonSource = readFileSync(commonPath, "utf8");
    expect(commonSource).toContain("export function SmallCard");
    expect(commonSource).toContain("export function MainCard");
    expect(commonSource).toContain("export function ConfirmDialog");

    expect(mainSource).toContain('from "./components/common"');
    expect(mainSource).not.toMatch(/^function SmallCard/m);
    expect(mainSource).not.toMatch(/^function MainCard/m);
    expect(mainSource).not.toMatch(/^function ConfirmDialog/m);
  });
});
