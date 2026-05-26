import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home icon extraction", () => {
  const source = readFileSync(resolve("src/components/home-icons.tsx"), "utf8");

  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M10 16 C10 19 12 21 12 21 C12 21 14 19 14 16");
    expect(source).toContain("M12 23 L12 26");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });

  it("keeps the original home quick action icons", () => {
    expect(source).toContain('import { IconPencilNeon } from "./calendar-icons"');
    expect(source).toContain("M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z");
    expect(source).toContain("<IconPencilNeon s={24} />");
    expect(source).toContain('transform: "scale(0.58) rotate(-6deg)"');
    expect(source).toContain("M10 9H17");
    expect(source).toContain("M9 4H7C5.89543 4 5 4.89543 5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6C19 4.89543 18.1046 4 17 4H15");
    expect(source).toContain("M2 22H22");
    expect(source).toContain("M8 5.5L18.5 12L8 18.5V5.5Z");
  });
});
