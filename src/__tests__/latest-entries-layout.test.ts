import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Latest entries layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps latest entries in the confirmed grid layout", () => {
    const latestEntriesBlock = source.match(
      /<span>[\s\S]{0,12}ltimas entradas<\/span>[\s\S]*?\{\[...current\.entries\][\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}[\s\S]*?<\/span>/
    )?.[0];

    expect(latestEntriesBlock).toBeDefined();
    expect(latestEntriesBlock).toMatch(/const meta = getEntryTypeMeta\(e\.type\)/);
    expect(latestEntriesBlock).toMatch(/display: "grid"[\s\S]*?gridTemplateColumns: "auto minmax\(0, 1fr\) auto auto"/);
    expect(latestEntriesBlock).toMatch(/display: "inline-flex"[\s\S]*?alignItems: "center"[\s\S]*?\{meta\.icon\(17\)\}[\s\S]*?color: meta\.color[\s\S]*?fontSize: 14[\s\S]*?fontWeight: 700[\s\S]*?\{meta\.label\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 12[\s\S]*?overflowWrap: "anywhere"[\s\S]*?\{e\.note\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.time\}/);
    expect(latestEntriesBlock).toMatch(/fontSize: 14[\s\S]*?fontWeight: 700[\s\S]*?color: meta\.color[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
    expect(latestEntriesBlock).not.toMatch(/textAlign: "right"|whiteSpace: "nowrap" \}\}/);
    expect(latestEntriesBlock).not.toMatch(/meta\.ic\b/);
    expect(latestEntriesBlock).not.toMatch(/meta\.col\b/);
    expect(latestEntriesBlock).not.toMatch(/meta\.lbl\b/);
  });

  it("keeps today's editable entries aligned and hides note amounts", () => {
    const todayHistoryBlock = source.match(
      /if \(screen === "todayHistory"\) \{[\s\S]*?\{confirmDialog &&/
    )?.[0];

    expect(todayHistoryBlock).toBeDefined();
    expect(todayHistoryBlock).toMatch(/const meta = getEntryTypeMeta\(e\.type\)/);
    expect(todayHistoryBlock).toMatch(/display: "grid"[\s\S]*?gridTemplateColumns: "auto minmax\(0, 1fr\) auto auto"/);
    expect(todayHistoryBlock).toMatch(/\{meta\.icon\(17\)\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 14[\s\S]*?fontWeight: 700[\s\S]*?\{meta\.label\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 12[\s\S]*?overflowWrap: "anywhere"[\s\S]*?\{e\.note\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 12[\s\S]*?\{e\.time\}/);
    expect(todayHistoryBlock).toMatch(/fontSize: 14[\s\S]*?fontWeight: 700[\s\S]*?color: meta\.color[\s\S]*?\{e\.type !== "nota" && `\+\$\{fmt\(e\.amount\)\}`\}/);
    expect(todayHistoryBlock).not.toContain("Borrar todas las entradas");
    expect(todayHistoryBlock).not.toMatch(/meta\.ic\b/);
    expect(todayHistoryBlock).not.toMatch(/meta\.col\b/);
    expect(todayHistoryBlock).not.toMatch(/meta\.lbl\b/);
  });
});
