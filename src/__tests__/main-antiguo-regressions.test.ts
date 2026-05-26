import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(resolve(path), "utf8");

describe("Main antiguo regression locks", () => {
  it("keeps home logout confirmation mounted in the extracted screen", () => {
    const homeSource = readSource("src/screens/home-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    expect(homeSource).toContain('import { ConfirmDialog } from "../components/common"');
    expect(homeSource).toContain("confirmDialog,");
    expect(homeSource).toContain("{confirmDialog && <ConfirmDialog");
    expect(homeSource).toContain("onCancel={() => onSetConfirmDialog(null)}");
    expect(mainSource).toContain("confirmDialog={confirmDialog}");
  });

  it("keeps calendar navigation and note creation handlers from mainAntiguo", () => {
    const calendarSource = readSource("src/screens/calendar-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    const openNewNotaBlock = calendarSource.match(/const openNewNota = \(date\?: string\) => \{[\s\S]*?\n  \};/)?.[0] ?? "";
    expect(openNewNotaBlock).toContain("setEditingNota(null);");
    expect(openNewNotaBlock).toContain("setEditingReserva(null);");

    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
    expect(calendarSource).toContain('setReturnScreen("calendar");');
    expect(calendarSource).toContain("setViewTurno(turno);");
    expect(calendarSource).toContain('setScreen("summary");');

    expect(mainSource).toContain("setScreen={setScreen}");
    expect(mainSource).toContain("setReturnScreen={setReturnScreen}");
    expect(mainSource).toContain("setViewTurno={setViewTurno}");
  });

  it("keeps today history note metadata and destructive confirmation behavior", () => {
    const source = readSource("src/screens/today-history-screen.tsx");

    expect(source).toContain('import { ConfirmDialog } from "../components/common"');
    expect(source).toContain('import { getEntryTypeMeta } from "../shared/entry-type-meta"');
    expect(source).not.toContain('nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard');
    expect(source).toContain("{confirmDialog && <ConfirmDialog");
    expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
    expect(source).toContain('confirmColor: "#ff6b6b"');
  });

  it("keeps turnos dates formatted for display", () => {
    const source = readSource("src/screens/pantalla-turnos.tsx");

    expect(source).toContain('from "../logic/date-time"');
    expect(source).toContain("fmtDate");
    expect(source).toContain("{fmtDate(turno.startDate || turno.date)}");
  });

  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });
});
