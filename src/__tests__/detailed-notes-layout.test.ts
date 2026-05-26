import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
  const summaryIconsSource = readFileSync(resolve("src/components/summary-icons.tsx"), "utf8");
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");

  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(source).toMatch(/type EntryTypeMeta = \{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\};/);
    expect(source).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
    expect(source).toMatch(/agencia_bono:\s*\{ color: A,\s*label: "Agencia\/Bono",\s*icon: \(s = 17\) => <IconAgency s=\{s\} c=\{A\} \/> \}/);
    expect(source).toMatch(/nota:\s*\{ color: "white", label: "Nota",\s*icon: \(s = 17\) => <IconNoteAdd s=\{s\} showPlus=\{false\} \/> \}/);
    expect(source).toMatch(/function getEntryTypeMeta\(type: string\): EntryTypeMeta \{/);
    expect(source).not.toMatch(/meta\.ic\b/);
    expect(source).not.toMatch(/meta\.col\b/);
    expect(source).not.toMatch(/meta\.lbl\b/);
  });

  it("uses the completed note icon without the add badge for saved notes", () => {
    const iconNoteAddBlock = source.match(/const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];

    expect(iconNoteAddBlock).toBeDefined();
    expect(iconNoteAddBlock).toMatch(/showPlus = true/);
    expect(iconNoteAddBlock).toMatch(/\{showPlus && \(/);
    expect(iconNoteAddBlock).toMatch(/d=\{showPlus \? "M3\.75 6\.75h10\.5" : "M7\.5 10h8\.25"\}/);
    expect(iconNoteAddBlock).toMatch(/d=\{showPlus \? "M7\.5 20\.25H2\.25[\s\S]*?" : "M5 21\.25H19/);
    expect(iconNoteAddBlock).toMatch(/!showPlus && \(/);
    expect(source).toMatch(/<IconNoteAdd s=\{26\} \/> A(?:ñ|Ã±)adir Nota al Turno/);
  });

  it("uses a restrained faithful pin icon for detailed notes", () => {
    const iconPinBlock = summaryIconsSource.match(/const IconPinNeon = \([\s\S]*?\n\);/)?.[0];

    expect(iconPinBlock).toBeDefined();
    expect(iconPinBlock).toMatch(/c = "oklch\(0\.72 0\.14 28\)"/);
    expect(iconPinBlock).toMatch(/drop-shadow\(0 0 1px \$\{c\}\)/);
    expect(iconPinBlock).toMatch(/<g transform="rotate\(32 12 12\)">/);
    expect(iconPinBlock).toMatch(/d="M8\.2 4\.8h7\.6c0\.7 0 1\.2 0\.5 1\.2 1\.2v1\.1c0 0\.5-0\.3 0\.9-0\.7 1\.1l-1\.8 1\.1v3\.1l2\.7 2\.7v1\.2H6\.8v-1\.2l2\.7-2\.7V9\.3L7\.7 8\.2C7\.3 8 7 7\.6 7 7\.1V6c0-0\.7 0\.5-1\.2 1\.2-1\.2Z"/);
    expect(iconPinBlock).toMatch(/d="M12 16\.3V21"/);
    expect(iconPinBlock).toMatch(/fill=\{c\}/);
    expect(iconPinBlock).not.toMatch(/d="M9\.3 5\.1l6\.9 1\.9/);
    expect(iconPinBlock).not.toContain("rotate(45 12 12)");
    expect(iconPinBlock).not.toContain("drop-shadow(0 0 4px");
    expect(source).toMatch(/<IconPinNeon s=\{18\} \/> Notas detalladas/);
    expect(source).not.toContain("<IconPinNeon s={18} c={F} /> Notas detalladas");
  });

  it("keeps detailed note rows on display labels and constrained grids", () => {
    expect(source).not.toContain("{e.type}</span>");
    expect(source).not.toContain("{e.type === 'agencia_bono' ? 'agencia/bono' : e.type}</span>");

    const detailedRows = [
      /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/,
    ];

    for (const rowPattern of detailedRows) {
      const block = source.match(rowPattern)?.[0];
      expect(block).toBeDefined();
      expect(block).toMatch(/const meta = getEntryTypeMeta\(/);
      expect(block).toMatch(/display: ['"]grid['"]/);
      expect(block).toMatch(/gridTemplateColumns: ['"]auto auto minmax\(0, 1fr\) auto['"]/);
      expect(block).toMatch(/minWidth: 0/);
      expect(block).toMatch(/overflowWrap: "anywhere"/);
      expect(block).toMatch(/fontSize: 14/);
      expect(block).toMatch(/fontSize: 15/);
      expect(block).toMatch(/fontWeight: 700/);
      expect(block).not.toMatch(/minWidth: 76/);
    }
  });

  it("keeps turn summary and end-turn note sections visually consistent", () => {
    const summaryBlockMatch = source.match(
      /if \(screen === 'summary' && viewTurno\) \{[\s\S]*?\/\* Contenedor Inferior Agrupado: Descontar y Dar \*\//
    );
    const summaryBlock = summaryBlockMatch ? summaryBlockMatch[0] : undefined;
    const confirmEndMatch = confirmEndSource.match(/gNotes\.map\([\s\S]*?<\/div>\s*\);\s*\}\)/);
    const confirmEndBlock = confirmEndMatch ? confirmEndMatch[0] : undefined;

    expect(summaryBlock).toBeDefined();
    expect(confirmEndBlock).toBeDefined();
    expect(summaryBlock).toContain("label: 'Agencias/Bonos'");
    expect(confirmEndBlock).toContain(">Agencias/Bonos</span>");
    expect(summaryBlock).toMatch(/<IconNoteAdd s=\{17\} showPlus=\{false\} \/> Notas del Turno/);
    expect(confirmEndBlock).toMatch(/<IconNoteAdd s=\{17\} showPlus=\{false\} \/> Notas del Turno/);
    expect(summaryBlock).toMatch(/generalNotes\.map\(\(e: any\) => \{[\s\S]*?const meta = getEntryTypeMeta\(e\.type\)/);
    expect(confirmEndBlock).toMatch(/gNotes\.map\(e => \{[\s\S]*?const meta = getEntryTypeMeta\(e\.type\)/);
    expect(summaryBlock).toMatch(/generalNotes\.map[\s\S]*?gridTemplateColumns: "auto auto minmax\(0, 1fr\)", alignItems: "baseline"[\s\S]*?\{meta\.label\}[\s\S]*?overflowWrap: "anywhere"/);
    expect(confirmEndBlock).toMatch(/gNotes\.map[\s\S]*?gridTemplateColumns: "auto auto minmax\(0, 1fr\)", alignItems: "baseline"[\s\S]*?\{meta\.label\}[\s\S]*?overflowWrap: "anywhere"/);
    expect(summaryBlock).toMatch(/entriesWithNotes\.map[\s\S]*?gridTemplateColumns: 'auto auto minmax\(0, 1fr\) auto', alignItems: 'baseline'/);
    expect(confirmEndBlock).toMatch(/entriesWithNotes\.map[\s\S]*?gridTemplateColumns: "auto auto minmax\(0, 1fr\) auto", alignItems: "baseline"/);
    expect(source).toMatch(/const NOTE_TIME_STYLE = \{[\s\S]*?fontSize: 12,[\s\S]*?color: "rgba\(255,255,255,0\.45\)",[\s\S]*?fontWeight: 700,[\s\S]*?whiteSpace: "nowrap",[\s\S]*?flexShrink: 0,[\s\S]*?alignSelf: "baseline",[\s\S]*?\} as const;/);
    expect(summaryBlock).toMatch(/generalNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
    expect(summaryBlock).toMatch(/entriesWithNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
    expect(confirmEndBlock).toMatch(/gNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
    expect(confirmEndBlock).toMatch(/entriesWithNotes\.map[\s\S]*?<span style=\{NOTE_TIME_STYLE\}>\{e\.time\}<\/span>/);
    expect(summaryBlock).not.toMatch(/generalNotes\.map[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
    expect(confirmEndBlock).not.toMatch(/gNotes\.map[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
  });

  it("shows the Nota label on turn-note cards", () => {
    const turnoNotasCardBlock = turnoNotasSource;

    expect(turnoNotasCardBlock).toBeDefined();
    expect(turnoNotasCardBlock).toMatch(/notasGenerales\.map\(\(entry\) => \{[\s\S]*?const meta = getEntryTypeMeta\(entry\.type\)/);
    expect(turnoNotasCardBlock).toMatch(/notasGenerales\.map[\s\S]*?gridTemplateColumns: "auto auto minmax\(0, 1fr\)", alignItems: "baseline"[\s\S]*?\{meta\.label\}[\s\S]*?\{entry\.note\}/);
    expect(turnoNotasCardBlock).toMatch(/notasDetalladas\.map[\s\S]*?gridTemplateColumns: "auto auto minmax\(0, 1fr\) auto", alignItems: "baseline"[\s\S]*?\{meta\.label\}[\s\S]*?\{entry\.note\}/);
    expect(turnoNotasCardBlock).toMatch(/notasGenerales\.map[\s\S]*?<span style=\{noteTimeStyle\}>\{entry\.time\}<\/span>/);
    expect(turnoNotasCardBlock).toMatch(/notasDetalladas\.map[\s\S]*?<span style=\{noteTimeStyle\}>\{entry\.time\}<\/span>/);
    expect(turnoNotasCardBlock).not.toMatch(/notasGenerales\.map[\s\S]*?background: "rgba\(150,130,255,0\.10\)"/);
  });

  it("keeps edit turn entries aligned with editable entries layout", () => {
    const editTurnoBlock = source.match(
      /if \(screen === 'editTurno' && editJ\) \{[\s\S]*?\/\* Teclado in-app para Dinero \/ KM en Editar Turno \*\//
    )?.[0];

    const editableEntriesBlock = editTurnoBlock?.match(
      /\/\* Entradas editables \*\/[\s\S]*?<div style=\{\{ marginTop: 14, paddingTop: 14/
    )?.[0];

    const editNotesBlock = editTurnoBlock?.match(
      /\/\* Notas \*\/[\s\S]*?<button onClick=\{saveEdit\}/
    )?.[0];

    expect(editTurnoBlock).toBeDefined();
    expect(editableEntriesBlock).toBeDefined();
    expect(editableEntriesBlock).toMatch(/editJ\.entries\.filter\(\(e: Entry\) => e\.type !== 'nota'\)\.map/);
    expect(editableEntriesBlock).toMatch(/const meta = getEntryTypeMeta\(e\.type\)/);
    expect(editableEntriesBlock).toMatch(/onClick=\{\(\) => openEditEntry\(e\)\}/);
    expect(editableEntriesBlock).toMatch(/role="button"/);
    expect(editableEntriesBlock).toMatch(/tabIndex=\{0\}/);
    expect(editableEntriesBlock).toMatch(/display: "grid"/);
    expect(editableEntriesBlock).toMatch(/gridTemplateColumns: "auto minmax\(0, 1fr\) auto auto"/);
    expect(editableEntriesBlock).toMatch(/\{meta\.icon\(17\)\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 14, fontWeight: 700 \}\}>\{meta\.label\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 12[\s\S]*?overflowWrap: "anywhere"[\s\S]*?\{e\.note\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.time\}/);
    expect(editableEntriesBlock).toMatch(/fontSize: 14, fontWeight: 700, color: meta\.color/);
    expect(editableEntriesBlock).not.toContain("<IconPencilNeon />");

    expect(editNotesBlock).toBeDefined();
    expect(editNotesBlock).toMatch(/<IconNoteAdd s=\{17\} showPlus=\{false\} \/> Notas del Turno/);
    expect(editNotesBlock).toMatch(/<IconNoteAdd s=\{18\} \/> A(?:ñ|Ã±)adir Nueva Nota/);
  });
});
