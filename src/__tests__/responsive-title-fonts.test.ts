import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Responsive title fonts", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("uses the same responsive font size for summary and week range titles", () => {
    expect(source).toMatch(
      /aria-label="Fecha del turno"[\s\S]*?fontSize: "clamp\(15px, 4\.2vw, 20px\)"/
    );
    expect(source).toMatch(
      /aria-label="Rango de fechas de la semana"[\s\S]*?fontSize: "clamp\(15px, 4\.2vw, 20px\)"/
    );
  });
});
