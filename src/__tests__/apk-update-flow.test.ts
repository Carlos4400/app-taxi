import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("APK update flow hardening", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const settingsScreenSource = readFileSync(resolve("src/screens/settings-screen.tsx"), "utf8");
  const updateFlowSource = readFileSync(resolve("src/logic/update-flow.ts"), "utf8");
  const gradleSource = readFileSync(resolve("android/app/build.gradle"), "utf8");

  it("does not expose an installable Android URL when the latest release has no APK asset", () => {
    expect(updateFlowSource).toContain('asset.name.endsWith(".apk")');
    expect(updateFlowSource).toContain('updateMsg: "No se encontró APK en el último release."');
    expect(updateFlowSource).not.toContain("Sin APK directo");
    expect(updateFlowSource).not.toContain("const fallbackUrl = data.assets?.[0]?.browser_download_url || data.html_url");
  });

  it("only shows the native install button for APK URLs", () => {
    expect(settingsScreenSource).toContain("const hasApkDownload = downloadUrl.endsWith(\".apk\")");
    expect(settingsScreenSource).toMatch(/hasApkDownload && updateState !== "downloading" && updateState !== "checking"/);
  });

  it("derives local Android version values from package.json when CI variables are absent", () => {
    expect(gradleSource).toContain("def packageJson = new groovy.json.JsonSlurper().parse(file('../../package.json'))");
    expect(gradleSource).toContain('def packageVersionName = packageJson.version ?: "1.0.0"');
    expect(gradleSource).toContain("def packageVersionCode = packageVersionName.tokenize('.').last().isInteger()");
    expect(gradleSource).not.toContain('?: "1.0.19"');
    expect(gradleSource).not.toContain(": 20");
  });
});
