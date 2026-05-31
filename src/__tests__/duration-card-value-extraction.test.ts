import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("DurationCardValue extraction", () => {
  const componentPath = resolve("src/components/duration-card-value.tsx");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps duration unit rendering outside main.tsx", () => {
    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");
    expect(componentSource).toContain("export function DurationCardValue");
    expect(componentSource).toContain("splitDurationLabel(value)");
    expect(componentSource).toContain("TIME_CARD_HOUR_UNIT_STYLE");
    expect(mainSource).not.toContain('from "./components/duration-card-value"');
    expect(mainSource).not.toMatch(/^function DurationCardValue\(/m);
  });
});
