import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("app version extraction", () => {
  const appVersionPath = resolve("src/app-version.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps Vite injected app version outside main.tsx", () => {
    expect(existsSync(appVersionPath)).toBe(true);

    const appVersionSource = readFileSync(appVersionPath, "utf8");
    expect(appVersionSource).toContain("declare const __APP_VERSION__: string");
    expect(appVersionSource).toContain("export const APP_VERSION = __APP_VERSION__");
    expect(mainSource).toContain('from "./app-version"');
    expect(mainSource).not.toContain("declare const __APP_VERSION__: string");
    expect(mainSource).not.toContain("const APP_VERSION = __APP_VERSION__");
  });
});
