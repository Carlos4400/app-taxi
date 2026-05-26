import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home icon extraction", () => {
  const source = readFileSync(resolve("src/components/home-icons.tsx"), "utf8");

  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
});
