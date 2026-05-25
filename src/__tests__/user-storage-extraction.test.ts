import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("User storage extraction", () => {
  const userStoragePath = resolve("src/services/user-storage.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps user-scoped localStorage helpers outside main.tsx", async () => {
    expect(existsSync(userStoragePath)).toBe(true);

    const modulePath = "../services/user-storage";
    const { userStorageKey, readLocalJSON, writeUserLocalJSON } = await import(modulePath);
    localStorage.clear();
    localStorage.setItem("plain", "{\"ok\":true}");

    expect(userStorageKey("plain", "uid-1")).toBe("plain__uid-1");
    expect(userStorageKey("plain", "")).toBe("plain");
    expect(readLocalJSON("plain")).toEqual({ ok: true });
    expect(readLocalJSON("missing")).toBeNull();
    writeUserLocalJSON("uid-1", "plain", { value: 2 });
    expect(localStorage.getItem("plain__uid-1")).toBe("{\"value\":2}");

    expect(mainSource).toContain('from "./services/user-storage"');
    expect(mainSource).not.toMatch(/^function userStorageKey\(/m);
    expect(mainSource).not.toMatch(/^function readLocalJSON/m);
    expect(mainSource).not.toMatch(/^function writeUserLocalJSON/m);
  });
});
