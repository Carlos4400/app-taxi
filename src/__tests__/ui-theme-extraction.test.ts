import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("UI theme extraction", () => {
  const themePath = resolve("src/shared/ui-theme.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps visual color constants outside main.tsx", async () => {
    expect(existsSync(themePath)).toBe(true);

    const modulePath = "../shared/ui-theme";
    const theme = await import(modulePath);
    expect(theme).toMatchObject({
      G: "oklch(0.68 0.20 145)",
      GBG: "oklch(0.18 0.07 145)",
      P: "oklch(0.65 0.20 280)",
      PBG: "oklch(0.17 0.07 280)",
      A: "oklch(0.75 0.16 70)",
      ABG: "oklch(0.20 0.06 70)",
      E: "oklch(0.72 0.14 200)",
      EBG: "oklch(0.19 0.05 200)",
      F: "oklch(0.70 0.18 25)",
      FBG: "oklch(0.19 0.06 25)",
      N: "oklch(0.62 0.06 260)",
      NBG: "oklch(0.18 0.03 260)",
      C: "oklch(0.75 0.15 290)",
      CBG: "oklch(0.18 0.05 290 / 0.12)",
    });

    expect(mainSource).toContain('from "./shared/ui-theme"');
    expect(mainSource).not.toMatch(/^const G = /m);
    expect(mainSource).not.toMatch(/^const CBG = /m);
  });
});
