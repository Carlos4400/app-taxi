import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Storage key extraction", () => {
  const storageKeysPath = resolve("src/shared/storage-keys.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps localStorage key constants outside main.tsx", async () => {
    expect(existsSync(storageKeysPath)).toBe(true);

    const modulePath = "../shared/storage-keys";
    const { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } = await import(modulePath);
    expect(KEY_CURRENT).toBe("taxi_current_v3");
    expect(KEY_HISTORY).toBe("taxi_history_v3");
    expect(KEY_SETTINGS).toBe("taxi_settings_v3");
    expect(KEY_WEEK_OVERRIDES).toBe("taxi_week_overrides_v1");
    expect(KEY_RESERVATIONS).toBe("taxi_reservations_v1");
    expect(KEY_NOTES).toBe("taxi_notes_v1");

    expect(mainSource).toContain('from "./shared/storage-keys"');
    expect(mainSource).not.toMatch(/^const KEY_CURRENT/m);
    expect(mainSource).not.toMatch(/^const KEY_NOTES/m);
  });
});
