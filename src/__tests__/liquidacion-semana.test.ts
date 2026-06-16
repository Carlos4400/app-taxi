import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Liquidación Semanal screen and typography", () => {
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
  const summarySource = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
  const contabilidadSource = readFileSync(resolve("src/screens/contabilidad-screen.tsx"), "utf8");
  const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
  const liquidacionSemanaSource = readFileSync(resolve("src/screens/liquidacion-semana-screen.tsx"), "utf8");
  const liquidacionTurnoPath = resolve("src/screens/liquidacion-turno-screen.tsx");
  const liquidacionTurnoSource = existsSync(liquidacionTurnoPath)
    ? readFileSync(liquidacionTurnoPath, "utf8")
    : "";
  const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");

  it("applies fluid typography to the week detail title", () => {
    expect(detalleSemanaSource).toMatch(
      /fontSize:\s*"clamp\(16px,\s*4\.5vw,\s*20px\)"/
    );
    expect(detalleSemanaSource).toContain('Detalle de Semana');
  });

  it("defines the navigation state liquidacionSemana", () => {
    expect(mainSource).toContain('screen === "liquidacionSemana"');
  });

  it("defines a dedicated navigation state for loose-turn liquidation", () => {
    expect(mainSource).toContain('screen === "liquidacionTurno" && viewTurno');
    expect(mainSource).toContain('from "./screens/liquidacion-turno-screen"');
  });

  it("contains the Liquidación button that triggers navigation", () => {
    const combined = mainSource + detalleSemanaSource;
    expect(combined).toMatch(/onClick=\{\(\)\s*=>\s*setScreen\("liquidacionSemana"\)\}/);
  });

  it("shows the Liquidación button for accounting turnos outside a week", () => {
    expect(summarySource).toContain("isLooseAccountingTurno &&");
    expect(summarySource).toMatch(/onClick=\{\(\)\s*=>\s*setScreen\("liquidacionTurno"\)\}/);
    expect(summarySource).toContain("Liquidación");
  });

  it("builds a single-turn liquidation from viewTurno without selectedWeekId", () => {
    expect(liquidacionTurnoSource).toContain("export function LiquidacionTurnoScreen");
    expect(liquidacionTurnoSource).toContain("viewTurno: Turno;");
    expect(liquidacionTurnoSource).toContain("const calculo = calcularTurnoContable(viewTurno, settings);");
    expect(liquidacionTurnoSource).toContain("LIQUIDACIÓN DE TURNO");
    expect(liquidacionTurnoSource).toContain('replaceScreen("summary")');
    expect(liquidacionTurnoSource).not.toContain("selectedWeekId");
    expect(liquidacionTurnoSource).not.toContain("groupTurnosByWeek");
  });

  it("allows a loose turno newer than the latest closed week to become the accounting hero", () => {
    expect(contabilidadSource).toContain("const heroElem = enCurso || otros[0];");
    expect(contabilidadSource).toContain('const heroTurno = heroElem?.kind === "turno" ? heroElem.turno : undefined;');
    expect(contabilidadSource).toContain("heroTurno && (() =>");
    expect(contabilidadSource).toContain("ÚLTIMO TURNO");
    expect(contabilidadSource).toContain("FUERA DE SEMANA");
    expect(contabilidadSource).toContain('setReturnScreen("contabilidad");');
    expect(contabilidadSource).toContain('setScreen("summary");');
  });

  it("shows weekly delivery status as a badge instead of inline text", () => {
    expect(contabilidadSource).toContain("const weeklyStatusBadgeStyle = (entregada: boolean)");
    expect(contabilidadSource).toContain("<span style={weeklyStatusBadgeStyle(entregada)}>");
    expect(contabilidadSource).toContain('{entregada ? "ENTREGADA" : "PENDIENTE"}');
    expect(contabilidadSource).not.toContain('{entregada ? "Entregada" : "Pendiente"}');
  });

  it("builds the ticket layout structure with dashed borders and monospace font for numbers", () => {
    expect(liquidacionSemanaSource).not.toContain('Recibo Digital');
    expect(liquidacionSemanaSource).toContain('Comisión Bruta Jefe');
    expect(liquidacionSemanaSource).toContain('Total Descuentos');
    expect(liquidacionSemanaSource).toContain('Neto a Entregar');
    expect(liquidacionSemanaSource).toContain('fontFamily: "monospace"');
    expect(liquidacionSemanaSource).toContain('borderBottom: "1px dashed');
  });

  it("applies default names and neon colors in swapped order", () => {
    expect(liquidacionSemanaSource).toContain('Total Taxímetro');
    expect(liquidacionSemanaSource).toContain('Total KM');
    expect(liquidacionSemanaSource).toContain('oklch(0.85 0.18 85)'); // Yellow/orange neon for Taxímetro
    expect(liquidacionSemanaSource).toContain('oklch(0.80 0.14 220)'); // Cyan/blue neon for KM
  });

  it("uses faithful sRGB colors only for the copied liquidation image", () => {
    expect(themeSource).toContain('export const G = "oklch(0.68 0.20 145)"');
    expect(themeSource).toContain('oklch(0.70 0.18 25)');
    expect(themeSource).toContain('oklch(0.72 0.14 200)');

    const exportColorBlock = liquidacionSemanaSource.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return "#ffffff";/
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
    const copyBlock = liquidacionSemanaSource.match(
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

    expect(liquidacionSemanaSource).toContain('background: "rgba(255, 255, 255, 0.015)"');
    expect(liquidacionSemanaSource).toContain('textShadow: "0 0 12px rgba(80, 220, 140, 0.25)"');
  });

  it("implements the WhatsApp markdown template for copy to clipboard", () => {
    expect(liquidacionSemanaSource).toContain("LIQUIDACIÓN SEMANAL");
    expect(liquidacionSemanaSource).toContain("Total KM:");
    expect(liquidacionSemanaSource).toContain("Total Taxímetro:");
    expect(liquidacionSemanaSource).toContain("Comisión Bruta Jefe:");
    expect(liquidacionSemanaSource).toContain("DESCONTAR:");
    expect(liquidacionSemanaSource).toContain("NETO A ENTREGAR:");
    expect(liquidacionSemanaSource).not.toContain("Nulos acumulados:");
    expect(liquidacionSemanaSource).not.toContain("Total Nulos acumulados:");
    expect(liquidacionSemanaSource).not.toContain("totalNulosAcumulado");
  });
  it("adds weekly notes to the liquidation ticket and text fallback", () => {
    const liquidacionBlock = liquidacionSemanaSource;

    expect(liquidacionBlock).toContain("const turnosConNotas = getTurnosNotasSemana(turnosSemana);");
    expect(liquidacionBlock).toContain("*NOTAS DE LA SEMANA:*");
    expect(liquidacionBlock).toContain("turnosConNotas.length > 0 &&");
    expect(liquidacionBlock).toContain("Notas de la semana");
    expect(liquidacionBlock).toContain("notasGenerales.map");
    expect(liquidacionBlock).toContain("notasDetalladas.map");
    expect(liquidacionBlock).toContain("getEntryTypeMeta(entry.type)");
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline"');
    expect(liquidacionBlock).toContain('{meta.label}</span>');
    expect(liquidacionSemanaSource).toMatch(/const NOTE_TIME_STYLE = \{[\s\S]*?fontSize: 12,[\s\S]*?color: "rgba\(255,255,255,0\.45\)",[\s\S]*?fontWeight: 700,[\s\S]*?whiteSpace: "nowrap",[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: "baseline",[\s\S]*?\} as const;/);
    expect(liquidacionBlock).toMatch(/notasGenerales\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
    expect(liquidacionBlock).toMatch(/notasDetalladas\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{entry\.time\}<\/span>/);
    expect(liquidacionBlock).not.toMatch(/ticket-nota-general[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
    expect(liquidacionBlock).toContain('paddingTop: 14, display: "flex", flexDirection: "column", gap: 18');
    expect(liquidacionBlock).toContain('fontSize: 20, fontWeight: 800, color: "white", textAlign: "center"');
    expect(liquidacionBlock).toContain('textShadow: "0 0 10px rgba(255,255,255,0.18)"');
    expect(liquidacionBlock).toContain('fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.72)"');
    expect(liquidacionBlock).toContain("turnosConNotas.map(({ turno, notasGenerales, notasDetalladas }, index)");
    expect(liquidacionBlock).toContain('paddingTop: index === 0 ? 2 : 12');
    expect(liquidacionBlock).toContain('borderTop: index === 0 ? "none" : "1px dashed rgba(255,255,255,0.10)"');
    expect(liquidacionBlock).toContain('width: 12, height: 1, background: "rgba(255,255,255,0.24)"');
    expect(liquidacionBlock).toContain("marginLeft: 14");
    expect(liquidacionBlock).toContain('gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
    expect(liquidacionBlock).not.toContain('background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9');
    expect(liquidacionBlock).not.toContain('background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12');
  });

  it("keeps the liquidation ticket and actions scrollable on short desktop viewports", () => {
    const liquidacionBlock = liquidacionSemanaSource;

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
    const liquidacionBlock = liquidacionSemanaSource;

    expect(liquidacionBlock).toContain('id="ticket-impresora"');
    expect(liquidacionBlock).toContain("fontSize: 16");
    expect(liquidacionBlock).toContain("fontWeight: 700");
    expect(liquidacionBlock).toContain('padding: "24px 20px"');
    expect(liquidacionBlock).toContain('WebkitTextStroke: "0.2px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 16, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.4px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000"');
    expect(liquidacionBlock).toContain('fontWeight: 900, color: "#000000", fontSize: 16, WebkitTextStroke: "0.5px #000000"');
    expect(liquidacionBlock).toContain('gridTemplateColumns: "46px auto minmax(0, 1fr)"');
    expect(liquidacionBlock).toContain('overflowWrap: "anywhere"');
    expect(liquidacionBlock).toContain('wordBreak: "break-word"');
    expect(liquidacionBlock).toContain('whiteSpace: "normal"');
    expect(liquidacionBlock).toContain('<span>Nota:</span>');
    expect(liquidacionBlock).toContain('<span>{meta.label}:</span>');
    expect(liquidacionBlock).not.toContain('display: "flex", gap: 4, alignItems: "baseline"');
    expect(liquidacionBlock).not.toContain('<span>({fmt(entry.amount)})</span>');
    expect(liquidacionBlock).toContain('wordBreak: "break-all"');
    expect(liquidacionBlock).toContain('{`(${fmt(entry.amount)})${entry.note.trim() ? ` ${entry.note.trim()}` : ""}`}');
  });
});
