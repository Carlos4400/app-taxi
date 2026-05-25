import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Date time extraction", () => {
  const dateTimePath = resolve("src/logic/date-time.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps date and time helpers outside main.tsx", async () => {
    expect(existsSync(dateTimePath)).toBe(true);

    const modulePath = "../logic/date-time";
    const { today, timeNow, getDiffMins, fmtDate } = await import(modulePath);
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(timeNow()).toMatch(/^\d{2}:\d{2}$/);
    expect(getDiffMins("22:30", "01:15")).toBe(165);
    expect(fmtDate("2026-05-08")).toMatch(/8.*2026/);

    expect(mainSource).toContain('from "./logic/date-time"');
    expect(mainSource).not.toMatch(/^function today\(/m);
    expect(mainSource).not.toMatch(/^function getDiffMins\(/m);
    expect(mainSource).not.toMatch(/^function fmtDate\(/m);
  });
});
