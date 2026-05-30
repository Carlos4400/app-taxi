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
    expect(openNewNotaBlock).not.toContain("setEditingReserva(null);");

    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
    expect(calendarSource).toContain('setReturnScreen("calendar");');
    expect(calendarSource).toContain("setViewTurno(turno);");
    expect(calendarSource).toContain('setScreen("summary");');
    expect(calendarSource).toContain("style={iconBtnStyle}");
    expect(calendarSource).toContain("setShowMonthPicker(v => !v);");

    expect(mainSource).toContain("setScreen={setScreen}");
    expect(mainSource).toContain("setReturnScreen={setReturnScreen}");
    expect(mainSource).toContain("setViewTurno={setViewTurno}");
  });

  it("keeps the booking dialog centralized instead of duplicating it in calendar", () => {
    const calendarSource = readSource("src/screens/calendar-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    expect(calendarSource).toContain("renderReservaDialog: () => React.ReactElement | false;");
    expect(calendarSource).toContain("{renderReservaDialog()}");
    expect(calendarSource).not.toContain("function renderReservaDialog(");
    expect(calendarSource).not.toContain(">Cancel<");
    expect(calendarSource).not.toContain('{editingReserva ? "Actualizar" : "Reservar"}');
    expect(mainSource).toContain("renderReservaDialog={renderReservaDialog}");
  });

  it("keeps today history note metadata and destructive confirmation behavior", () => {
    const source = readSource("src/screens/today-history-screen.tsx");

    expect(source).toContain('import { ConfirmDialog } from "../components/common"');
    expect(source).toContain('import { getEntryTypeMeta } from "../shared/entry-type-meta"');
    expect(source).not.toContain('nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard');
    expect(source).toContain("{confirmDialog && <ConfirmDialog");
    expect(source).not.toContain("confirmBg:");
    expect(source).not.toContain("confirmColor:");
    expect(source).not.toContain("confirmBorder:");
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

  it("prevents double closing the same turno from duplicating history", () => {
    const mainSource = readSource("src/main.tsx");
    const loadingReturnIndex = mainSource.indexOf("if (!dataLoaded) {");
    const activeIndex = mainSource.indexOf("const active = current.entries.length > 0 || !!current.startTime;");
    const endingRefIndex = mainSource.indexOf("const endingTurnoRef = useRef(false);");

    expect(activeIndex).toBeGreaterThan(-1);
    expect(endingRefIndex).toBeGreaterThan(-1);
    expect(loadingReturnIndex).toBeGreaterThan(-1);
    expect(activeIndex).toBeLessThan(loadingReturnIndex);
    expect(endingRefIndex).toBeLessThan(loadingReturnIndex);
    expect(mainSource).toContain("if (endingTurnoRef.current || !active) return;");
    expect(mainSource).toContain("endingTurnoRef.current = true;");
    expect(mainSource).toContain("setHistory((h) => mergeTurnos(h, [turno]));");
    expect(mainSource).not.toContain("setHistory((h) => [turno, ...h]);");
  });

  it("cleans service worker update listeners mounted by App", () => {
    const mainSource = readSource("src/main.tsx");

    expect(mainSource).toContain('const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);');
    expect(mainSource).toContain("if (isLocalDev) return;");
    expect(mainSource).toContain("let updateFoundCleanup: (() => void) | null = null;");
    expect(mainSource).toContain('reg.removeEventListener("updatefound", onRegUpdateFound);');
    expect(mainSource).not.toContain('reg.addEventListener("updatefound", () => onUpdateFound(reg));');
  });

  it("does not keep unreachable export color branches", () => {
    const source = readSource("src/screens/liquidacion-semana-screen.tsx");

    expect(source).not.toContain("if (false) return match;");
  });

  it("keeps extracted screens using shared visual building blocks", () => {
    const addEntrySource = readSource("src/screens/add-entry-screen.tsx");
    const addSingleSource = readSource("src/screens/add-single-entry-screen.tsx");
    const addNotaSource = readSource("src/screens/add-nota-general-screen.tsx");
    const confirmEndSource = readSource("src/screens/confirm-end-screen.tsx");

    expect(addEntrySource).toContain('import { IconBack, IconDel } from "../components/navigation-icons"');
    expect(addEntrySource).not.toContain("const IconBack:");
    expect(addEntrySource).not.toContain("const IconDel:");
    expect(addSingleSource).toContain('import { IconBack, IconDel } from "../components/navigation-icons"');
    expect(addSingleSource).not.toContain("const IconBack:");
    expect(addSingleSource).not.toContain("const IconDel:");
    expect(addNotaSource).toContain('import { IconBack } from "../components/navigation-icons"');
    expect(addNotaSource).not.toContain("const IconBack:");
    expect(confirmEndSource).toContain('import { KM_CARD_UNIT_STYLE } from "../shared/card-styles"');
    expect(confirmEndSource).not.toContain("const KM_CARD_UNIT_STYLE = {");
  });
});
