import { describe, expect, it } from "vitest";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, splitDurationLabel } from "../formatters";

describe("Shared formatting helpers", () => {
  it("formats kilometers from the shared formatter", () => {
    expect(fmtKmNumber(1029)).toBe("1.029");
    expect(fmtKmNumber(12345.6)).toBe("12.345,6");
    expect(fmtKm(1029)).toBe("1.029 KM");
  });

  it("formats euros from the shared formatter", () => {
    expect(fmtMoneyNumber(1102.9)).toBe("1.102,90");
    expect(fmtMoney(1102.9)).toBe("1.102,90 €");
  });
  it("formats worked time as accumulated hours and minutes", () => {
    expect(fmtDuration(0)).toBe("0h 0m");
    expect(fmtDuration(2942)).toBe("49h 2m");
    expect(fmtDuration(-5)).toBe("0h 0m");
  });

  it("splits duration labels into numbers for custom unit spacing", () => {
    expect(splitDurationLabel("6h 46m")).toEqual({ hours: "6", minutes: "46" });
    expect(splitDurationLabel("0h")).toEqual({ hours: "0", minutes: "0" });
  });
});
