import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Week logic extraction", () => {
  const weekLogicPath = resolve("src/logic/week-logic.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps week assignment and labels outside main.tsx", async () => {
    expect(existsSync(weekLogicPath)).toBe(true);

    const modulePath = "../logic/week-logic";
    const {
      getWeekStartDate,
      getWeekRange,
      getCurrentOpenWeekId,
      getTurnoAccountingWeekId,
      groupTurnosByWeek,
      getWeekMonth,
      formatWeekRange,
      formatWeekRangeFull,
    } = await import(modulePath);

    expect(getWeekStartDate("2026-05-08", 2)).toBe("2026-05-06");
    expect(getWeekRange("2026-05-06")).toEqual({ inicio: "2026-05-06", fin: "2026-05-11" });
    expect(getCurrentOpenWeekId("2026-05-12", 2)).toBeNull();
    expect(getTurnoAccountingWeekId({ date: "2026-05-13", startDate: "2026-05-12" }, 2)).toBe("2026-05-13");
    expect(Array.from(groupTurnosByWeek([{ date: "2026-05-13", startDate: "2026-05-13" }], 2).keys())).toEqual(["2026-05-13"]);
    expect(getWeekMonth("2026-05-29").type).toBe("tie");
    expect(formatWeekRange("2026-05-06")).toContain("Mayo");
    expect(formatWeekRangeFull("2026-05-06")).toContain("2026");

    expect(mainSource).toContain('from "./logic/week-logic"');
    expect(mainSource).not.toMatch(/^export function getWeekStartDate\(/m);
    expect(mainSource).not.toMatch(/^export function groupTurnosByWeek\(/m);
    expect(mainSource).not.toMatch(/^function formatWeekRange\(/m);
  });
});
