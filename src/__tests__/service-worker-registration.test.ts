import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("service worker registration extraction", () => {
  const registrationPath = resolve("src/services/service-worker-registration.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps service worker registration outside main.tsx", () => {
    expect(existsSync(registrationPath)).toBe(true);

    const registrationSource = readFileSync(registrationPath, "utf8");
    expect(registrationSource).toContain('"serviceWorker" in navigator');
    expect(registrationSource).toContain("isLocalDev");
    expect(registrationSource).toContain("registration.unregister()");
    expect(registrationSource).toContain('navigator.serviceWorker.register("./sw.js")');
    expect(registrationSource).toContain("SW registered");
    expect(mainSource).toContain('from "./services/service-worker-registration"');
    expect(mainSource).toContain("registerServiceWorker();");
    expect(mainSource).not.toContain('navigator.serviceWorker.register("./sw.js")');
  });
});
