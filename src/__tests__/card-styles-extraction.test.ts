import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Card styles extraction", () => {
  const cardStylesPath = resolve("src/shared/card-styles.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps reusable card typography constants outside main.tsx", async () => {
    expect(existsSync(cardStylesPath)).toBe(true);

    const modulePath = "../shared/card-styles";
    const { WEEK_LIST_CARD_TEXT_SIZES, KM_CARD_UNIT_STYLE, TIME_CARD_UNIT_STYLE, TIME_CARD_HOUR_UNIT_STYLE } = await import(modulePath);
    expect(WEEK_LIST_CARD_TEXT_SIZES.range).toContain("cqw");
    expect(KM_CARD_UNIT_STYLE.fontSize).toBe("0.72em");
    expect(TIME_CARD_UNIT_STYLE.fontWeight).toBe(KM_CARD_UNIT_STYLE.fontWeight);
    expect(TIME_CARD_HOUR_UNIT_STYLE.marginRight).toBe(6);

    expect(mainSource).toContain('from "./shared/card-styles"');
    expect(mainSource).not.toMatch(/^export const WEEK_LIST_CARD_TEXT_SIZES/m);
    expect(mainSource).not.toMatch(/^export const KM_CARD_UNIT_STYLE/m);
  });
});
