import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Liquidación Semanal screen and typography", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("applies fluid typography to the week detail title", () => {
    expect(source).toMatch(
      /fontSize:\s*"clamp\(16px,\s*4\.5vw,\s*20px\)"/
    );
    expect(source).toContain('Detalle de Semana');
  });

  it("defines the navigation state liquidacionSemana", () => {
    expect(source).toContain('screen === "liquidacionSemana"');
  });

  it("contains the Liquidación button that triggers navigation", () => {
    expect(source).toMatch(
      /onClick=\{\(\)\s*=>\s*setScreen\("liquidacionSemana"\)\}/
    );
  });

  it("builds the ticket layout structure with dashed borders and monospace font for numbers", () => {
    expect(source).not.toContain('Recibo Digital');
    expect(source).toContain('Comisión Bruta Jefe');
    expect(source).toContain('Total Descuentos');
    expect(source).toContain('Neto a Entregar');
    expect(source).toContain('fontFamily: "monospace"');
    expect(source).toContain('borderBottom: "1px dashed');
  });

  it("applies default names and neon colors in swapped order", () => {
    expect(source).toContain('Total Taxímetro');
    expect(source).toContain('Total KM');
    expect(source).toContain('#f8c654'); // Yellow/orange neon fallback for Taxímetro
    expect(source).toContain('#7e9ff9'); // Cyan/blue neon fallback for KM
  });

  it("implements the WhatsApp markdown template for copy to clipboard", () => {
    expect(source).toContain("LIQUIDACIÓN SEMANAL");
    expect(source).toContain("Total KM:");
    expect(source).toContain("Total Taxímetro:");
    expect(source).toContain("Comisión Bruta Jefe:");
    expect(source).toContain("DESCONTAR:");
    expect(source).toContain("NETO A ENTREGAR:");
    expect(source).toContain("Nulos acumulados:");
  });
});
