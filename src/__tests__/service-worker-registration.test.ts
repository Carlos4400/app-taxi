import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "../services/service-worker-registration";

describe("service worker registration extraction", () => {
  const registrationPath = resolve("src/services/service-worker-registration.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const originalServiceWorker = navigator.serviceWorker;
  const originalReadyState = Object.getOwnPropertyDescriptor(Document.prototype, "readyState");

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: originalServiceWorker,
    });
    if (originalReadyState) {
      Object.defineProperty(Document.prototype, "readyState", originalReadyState);
    }
  });

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

  it("unregisters service workers immediately in local dev when the page is already loaded", async () => {
    Object.defineProperty(Document.prototype, "readyState", {
      configurable: true,
      get: () => "complete",
    });
    const unregister = vi.fn(() => Promise.resolve(true));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistrations: vi.fn(() => Promise.resolve([{ unregister }])),
        register: vi.fn(() => Promise.resolve({})),
      },
    });

    registerServiceWorker();
    await Promise.resolve();
    await Promise.resolve();

    expect(navigator.serviceWorker.getRegistrations).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
  });
});
