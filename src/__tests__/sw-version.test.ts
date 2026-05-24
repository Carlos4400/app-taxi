import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Service Worker version handling", () => {
  const swSource = readFileSync(resolve("public/sw.js"), "utf8");

  it("declara la constante VERSION para que checkVersion no lance ReferenceError", () => {
    expect(swSource).toMatch(/const VERSION\s*=/);
  });

  it("usa el marcador __BUILD_VERSION__ que el build sustituye por la version real", () => {
    expect(swSource).toContain("__BUILD_VERSION__");
  });

  it("compara manifest.version contra la constante VERSION ya definida", () => {
    expect(swSource).toContain("manifest.version !== VERSION");
  });

  it("omite la comparacion mientras VERSION conserve el marcador (modo dev)", () => {
    expect(swSource).toContain("VERSION.indexOf('__') === -1");
  });
});
