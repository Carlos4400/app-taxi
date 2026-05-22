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
    expect(source).toContain('oklch(0.85 0.18 85)'); // Yellow/orange neon for Taxímetro
    expect(source).toContain('oklch(0.80 0.14 220)'); // Cyan/blue neon for KM
  });

  it("uses faithful sRGB colors only for the copied liquidation image", () => {
    expect(source).toContain('const G = "oklch(0.68 0.20 145)"');
    expect(source).toContain('oklch(0.70 0.18 25)');
    expect(source).toContain('oklch(0.72 0.14 200)');

    const exportColorBlock = source.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return match;/
    )?.[0] || "";

    expect(exportColorBlock).toContain('return "#ffc200"');
    expect(exportColorBlock).toContain('return "#25d2fc"');
    expect(exportColorBlock).toContain('return "#fa6863"');
    expect(exportColorBlock).toContain('return "#26b63d"');
    expect(exportColorBlock).toContain('return "#7c79ff"');
    expect(exportColorBlock).toContain('return "#ed990e"');
    expect(exportColorBlock).toContain('return "#00bec7"');

    expect(exportColorBlock).not.toContain('return "#f8c654"');
    expect(exportColorBlock).not.toContain('return "#7e9ff9"');
    expect(exportColorBlock).not.toContain('return "#c95a43"');
    expect(exportColorBlock).not.toContain('return "#00b178"');
    expect(exportColorBlock).not.toContain('return "#8d63f9"');
    expect(exportColorBlock).not.toContain('return "#d69c2d"');
    expect(exportColorBlock).not.toContain('return "#79a9c4"');
  });

  it("sharpens copied liquidation image without changing the visible UI styles", () => {
    const copyBlock = source.match(
      /const copyToClipboard = async \(\) => \{[\s\S]*?html2canvas\(element, \{[\s\S]*?\}\)\.then/
    )?.[0] || "";

    expect(copyBlock).toContain("await document.fonts?.ready");
    expect(copyBlock).toContain('backgroundColor: "#0d0d14"');
    expect(copyBlock).toContain("scale: 3");
    expect(copyBlock).toContain("const normalizeExportColors = (str: string)");
    expect(copyBlock).toContain("replaceExportNeutrals");
    expect(copyBlock).toContain('"#111116"');
    expect(copyBlock).toContain('"#17171c"');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.18)');
    expect(copyBlock).toContain('rgba(255, 255, 255, 0.50)');
    expect(copyBlock).toContain('rgba(38, 182, 61, 0.28)');

    expect(source).toContain('background: "rgba(255, 255, 255, 0.015)"');
    expect(source).toContain('textShadow: "0 0 12px rgba(80, 220, 140, 0.25)"');
  });

  it("implements the WhatsApp markdown template for copy to clipboard", () => {
    expect(source).toContain("LIQUIDACIÓN SEMANAL");
    expect(source).toContain("Total KM:");
    expect(source).toContain("Total Taxímetro:");
    expect(source).toContain("Comisión Bruta Jefe:");
    expect(source).toContain("DESCONTAR:");
    expect(source).toContain("NETO A ENTREGAR:");
    expect(source).not.toContain("Nulos acumulados:");
    expect(source).not.toContain("Total Nulos acumulados:");
    expect(source).not.toContain("totalNulosAcumulado");
  });
  it("adds weekly notes to the liquidation ticket and text fallback", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain("const turnosConNotas = getTurnosNotasSemana(turnosSemana);");
    expect(liquidacionBlock).toContain("*NOTAS DE LA SEMANA:*");
    expect(liquidacionBlock).toContain("turnosConNotas.length > 0 &&");
    expect(liquidacionBlock).toContain("Notas de la semana");
    expect(liquidacionBlock).toContain("notasGenerales.map");
    expect(liquidacionBlock).toContain("notasDetalladas.map");
    expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
    expect(liquidacionBlock).toContain('paddingTop: 14, display: "flex", flexDirection: "column", gap: 18');
    expect(liquidacionBlock).toContain('fontSize: 20, fontWeight: 800, color: "white", textAlign: "center"');
    expect(liquidacionBlock).toContain('textShadow: "0 0 10px rgba(255,255,255,0.18)"');
    expect(liquidacionBlock).toContain('fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)"');
    expect(liquidacionBlock).toContain("turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }, index)");
    expect(liquidacionBlock).toContain('paddingTop: index === 0 ? 2 : 12');
    expect(liquidacionBlock).toContain('borderTop: index === 0 ? "none" : "1px dashed rgba(255,255,255,0.10)"');
    expect(liquidacionBlock).toContain('width: 12, height: 1, background: "rgba(255,255,255,0.24)"');
    expect(liquidacionBlock).toContain("marginLeft: 14");
    expect(liquidacionBlock).toContain('fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
    expect(liquidacionBlock).not.toContain('background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9');
    expect(liquidacionBlock).not.toContain('background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12');
  });

  it("keeps the liquidation ticket and actions scrollable on short desktop viewports", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toMatch(
      /padding: "16px 20px 32px"[\s\S]*?minHeight: 0[\s\S]*?overflowY: "auto"/
    );
    expect(liquidacionBlock).toMatch(
      /id="ticket-digital"[\s\S]*?flexShrink: 0[\s\S]*?overflow: "hidden"/
    );
    expect(liquidacionBlock).toMatch(
      /<div style=\{\{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 \}\}>/
    );
  });

  it("valida los tamaños, grosores y envoltura de notas del ticket de impresora térmica", () => {
    const liquidacionBlock = source.match(
      /if \(screen === "liquidacionSemana" && selectedWeekId\) \{[\s\S]*?if \(screen === "PantallaTurnos"\)/
    )?.[0] || "";

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 18, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", fontSize: 16, WebkitTextStroke: "0.5px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr) auto"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
    expect(liquidacionBlock).toContain('wordBreak: "break-word"');
    expect(liquidacionBlock).toContain('whiteSpace: "normal"');
    expect(liquidacionBlock).toContain('<span>Nota:</span>');
    expect(liquidacionBlock).toContain('<span>{meta.label}:</span>');
    expect(liquidacionBlock).toContain('<span style={{ whiteSpace: "nowrap" }}>({fmt(entry.amount)})</span>');
    expect(liquidacionBlock).toContain('{entry.note.trim()}</span>');
  });
});
