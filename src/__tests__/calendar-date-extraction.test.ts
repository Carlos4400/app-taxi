import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Calendar date extraction", () => {
  const calendarDatePath = resolve("src/calendar-date.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps month grid date helpers outside main.tsx", async () => {
    expect(existsSync(calendarDatePath)).toBe(true);

    const modulePath = "../calendar-date";
    const { getDaysInMonth, getStartOffset } = await import(modulePath);
    expect(getDaysInMonth(2026, 1)).toBe(28);
    expect(getDaysInMonth(2024, 1)).toBe(29);
    expect(getStartOffset(2026, 4)).toBe(4);

    expect(mainSource).toContain('from "./calendar-date"');
    expect(mainSource).not.toMatch(/^function getDaysInMonth\(/m);
    expect(mainSource).not.toMatch(/^function getStartOffset\(/m);
  });
});
