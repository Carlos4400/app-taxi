import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("APK installer extraction", () => {
  const installerPath = resolve("src/services/apk-installer.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps native APK installer registration outside main.tsx", () => {
    expect(existsSync(installerPath)).toBe(true);

    const installerSource = readFileSync(installerPath, "utf8");
    expect(installerSource).toContain('registerPlugin<ApkInstallerPluginType>("ApkInstaller")');
    expect(installerSource).toContain("downloadAndInstall");
    expect(mainSource).not.toContain('from "./services/apk-installer"');
    expect(mainSource).not.toContain('registerPlugin<ApkInstallerPluginType>("ApkInstaller")');
    expect(mainSource).not.toMatch(/^export interface ApkInstallerPluginType/m);
  });
});
