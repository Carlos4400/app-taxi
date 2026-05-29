import React from "react";
import type { Turno, WeekOverride, AppSettings } from "../shared/types";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import {
  IconTaxiBadgeNeon,
  IconRoad,
} from "../components/summary-icons";
import {
  IconMoneyBag,
  IconTimer,
} from "../components/calendar-icons";
import { A, ABG, C, E, G } from "../shared/ui-theme";
import { fmtDuration, fmtKmNumber, fmtMoneyNumber, fmt, fmtKm } from "../logic/formatters";
import { fmtDate, getDiffMins, today } from "../logic/date-time";
import { getMesLabel } from "../logic/date-labels";
import { getAccountingPeriodLabel } from "../logic/date-labels";
import {
  formatWeekRange,
  getCurrentOpenWeekId,
  getTurnoAccountingWeekId,
  getWeekMonth,
  getWeekOverride,
  getWeekRange,
  groupTurnosByWeek,
  isWeekClosed,
  selectAccountingHeroWeek,
} from "../logic/week-logic";
import { calcularResumenContableTurnos, type AccountingSettings } from "../logic/accounting";
import { WEEK_LIST_CARD_TEXT_SIZES } from "../shared/card-styles";

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

export interface ContabilidadScreenProps {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedAccountingYear: number;
  selectedAccountingMonth: number;
  setSelectedAccountingYear: (year: number) => void;
  setSelectedAccountingMonth: (month: number) => void;
  tieResolutions: Map<string, string>;
  setTieResolutions: (map: Map<string, string>) => void;
  pendingTie: { weekId: string; candidates: { mesId: string; mesLabel: string }[] } | null;
  setPendingTie: (tie: { weekId: string; candidates: { mesId: string; mesLabel: string }[] } | null) => void;
  setScreen: (screen: string) => void;
  setSelectedWeekId: (weekId: string) => void;
  setReturnScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  renderTurnoCard: (
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
      isSelecting?: boolean;
      isSelected?: boolean;
      onToggleSelect?: (checked: boolean) => void;
    }
  ) => React.ReactNode;
}

type ElemSemana = {
  kind: "semana";
  weekId: string;
  fechaOrden: string;
  isEnCurso: boolean;
  diaLibreUsado: number;
  turnos: Turno[];
  override: WeekOverride | null;
};

type ElemTurnoSuelto = {
  kind: "turno";
  turno: Turno;
  fechaOrden: string;
};

type Elem = ElemSemana | ElemTurnoSuelto;

type ElemConMes = { elem: Elem; mesId: string | null };

type GrupoMes = { mesId: string; mesLabel: string; items: ElemConMes[] };

export function ContabilidadScreen({
  history,
  settings,
  weekOverrides,
  selectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingYear,
  setSelectedAccountingMonth,
  tieResolutions,
  setTieResolutions,
  pendingTie,
  setPendingTie,
  setScreen,
  setSelectedWeekId,
  setReturnScreen,
  setViewTurno,
  renderTurnoCard,
}: ContabilidadScreenProps) {
  const hoyISO = today();
  const diaLibre = settings.diaLibre;

  const elementos: Elem[] = [];

  const grupos = groupTurnosByWeek(history, diaLibre);
  for (const [key, turnosSemana] of grupos.entries()) {
    const weekId = key;
    const range = getWeekRange(weekId);
    const isEnCurso = !isWeekClosed(weekId, hoyISO);
    elementos.push({
      kind: "semana",
      weekId,
      fechaOrden: range.fin,
      isEnCurso,
      diaLibreUsado: turnosSemana[0]?.diaLibreContable ?? diaLibre,
      turnos: turnosSemana,
      override: getWeekOverride(weekOverrides, weekId),
    });
  }

  for (const turno of history) {
    if (getTurnoAccountingWeekId(turno, diaLibre) !== null) continue;
    elementos.push({
      kind: "turno",
      turno,
      fechaOrden: turno.startDate || turno.date,
    });
  }

  const weekIdHoy = getCurrentOpenWeekId(hoyISO, diaLibre);
  const tieneEnCurso = elementos.some(
    (e) => e.kind === "semana" && e.isEnCurso
  );
  if (weekIdHoy && !tieneEnCurso) {
    const range = getWeekRange(weekIdHoy);
    elementos.push({
      kind: "semana",
      weekId: weekIdHoy,
      fechaOrden: range.fin,
      isEnCurso: true,
      diaLibreUsado: diaLibre,
      turnos: [],
      override: getWeekOverride(weekOverrides, weekIdHoy),
    });
  }

  const enCurso = elementos.find(
    (e) => e.kind === "semana" && e.isEnCurso
  ) as ElemSemana | undefined;
  const otros = elementos.filter((e) => e !== enCurso);

  otros.sort((a, b) => (a.fechaOrden < b.fechaOrden ? 1 : -1));

  const heroSelection = selectAccountingHeroWeek(
    enCurso?.weekId || null,
    otros.filter((e): e is ElemSemana => e.kind === "semana").map((e) => e.weekId)
  );
  const heroWeek = heroSelection
    ? elementos.find((e): e is ElemSemana => e.kind === "semana" && e.weekId === heroSelection.weekId)
    : undefined;
  const otrosSinHero = heroSelection?.kind === "latest"
    ? otros.filter((e) => e.kind !== "semana" || e.weekId !== heroSelection.weekId)
    : otros;

  const otrosConMes: ElemConMes[] = [];
  let primerEmpate: { weekId: string; candidates: { mesId: string; mesLabel: string }[] } | null = null;

  for (const elem of otrosSinHero) {
    if (elem.kind === "turno") {
      const fechaMes = elem.turno.startDate || elem.turno.date;
      otrosConMes.push({ elem, mesId: fechaMes.slice(0, 7) });
      continue;
    }
    const r = getWeekMonth(elem.weekId);
    if (r.type === "single") {
      otrosConMes.push({ elem, mesId: r.mesId });
    } else {
      const resolved = tieResolutions.get(elem.weekId);
      if (resolved) {
        otrosConMes.push({ elem, mesId: resolved });
      } else {
        otrosConMes.push({ elem, mesId: null });
        if (!primerEmpate) {
          primerEmpate = { weekId: elem.weekId, candidates: r.candidates };
        }
      }
    }
  }

  if (primerEmpate && !pendingTie) {
    setTimeout(() => setPendingTie(primerEmpate!), 0);
  }

  const grupos2: GrupoMes[] = [];
  for (const item of otrosConMes) {
    if (item.mesId === null) continue;
    const ultimo = grupos2[grupos2.length - 1];
    if (ultimo && ultimo.mesId === item.mesId) {
      ultimo.items.push(item);
    } else {
      grupos2.push({
        mesId: item.mesId,
        mesLabel: getMesLabel(item.mesId),
        items: [item],
      });
    }
  }

  const weeklyPeriodLabel = getAccountingPeriodLabel(selectedAccountingYear, selectedAccountingMonth);

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button style={S.iconBtn} onClick={() => setScreen("home")}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Contabilidad</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => setScreen("detalleMes")}
              style={{
                border: `1px solid ${E}`,
                background: "rgba(0, 210, 255, 0.12)",
                color: E,
                borderRadius: 12,
                padding: "9px 11px",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: `0 0 12px ${E}33`
              }}
            >
              Mensual
            </button>
            <button
              onClick={() => setScreen("detalleAnual")}
              style={{
                border: `1px solid ${C}`,
                background: "rgba(180, 120, 255, 0.12)",
                color: C,
                borderRadius: 12,
                padding: "9px 11px",
                fontSize: 11,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: `0 0 12px ${C}33`
              }}
            >
              Anual
            </button>
          </div>
        </div>


        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 6,
          marginTop: 12,
          marginBottom: 8,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 22,
          padding: "24px 16px",
          border: "2px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(255, 255, 255, 0.05)",
          boxSizing: "border-box",
        }}>
          <div style={{
            fontSize: 50,
            fontWeight: 950,
            color: "white",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            textShadow: "0 0 16px rgba(255,255,255,0.25)"
          }}>
            Semanal
          </div>
          <div style={{
            fontSize: 26,
            fontWeight: 900,
            color: "rgba(255,255,255,0.6)",
            textTransform: "uppercase",
            letterSpacing: "1.2px"
          }}>
            {weeklyPeriodLabel}
          </div>
        </div>

        {/* === SEMANA DESTACADA === */}
        {heroWeek && heroSelection && (() => {
          const totales = calcularResumenContableTurnos(heroWeek.turnos, settings);
          const totalTaximetroHero = (totales.dinero || 0) - (totales.totalN || 0);
          const range = getWeekRange(heroWeek.weekId);
          const isCurrentHero = heroSelection.kind === "current";
          const dHoy = new Date(hoyISO + "T12:00:00");
          const dInicio = new Date(range.inicio + "T12:00:00");
          const diasTranscurridos = Math.min(
            6,
            Math.max(0, Math.floor((dHoy.getTime() - dInicio.getTime()) / 86400000) + 1)
          );
          const entregadaHero = heroWeek.override?.entregada || false;

          let totalMinsHero = 0;
          for (const turno of heroWeek.turnos) {
            if (turno.startTime && turno.endTime) {
              let mins = getDiffMins(turno.startTime, turno.endTime);
              if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
              totalMinsHero += mins;
            }
          }
          const durationStrHero = fmtDuration(totalMinsHero);

          return (
            <div
              onClick={() => {
                setSelectedWeekId(heroWeek.weekId);
                setScreen("detalleSemana");
              }}
              style={{
                background: "linear-gradient(135deg, rgba(180, 120, 255, 0.15) 0%, rgba(0, 210, 255, 0.15) 100%)",
                borderRadius: 22,
                padding: 20,
                border: `2px solid ${entregadaHero ? G : E}`,
                cursor: "pointer",
                boxShadow: `0 8px 24px rgba(0,0,0,0.3), inset 0 0 20px ${entregadaHero ? G : E}11`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                {/* Columna Izquierda: Info de la semana */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: A,
                      background: "rgba(0,0,0,0.3)",
                      padding: "4px 10px",
                      borderRadius: 8,
                      letterSpacing: "0.8px",
                    }}>
                      {isCurrentHero ? "EN CURSO" : "ÚLTIMA SEMANA"}
                    </span>
                    {isCurrentHero && (
                      <span style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.4)",
                        fontWeight: 600,
                      }}>
                        Día {diasTranscurridos} de 6
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "white",
                    marginBottom: 4,
                    letterSpacing: "-0.5px",
                  }}>
                    {formatWeekRange(heroWeek.weekId)}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                  }}>
                    {heroWeek.turnos.length} {heroWeek.turnos.length === 1 ? "turno registrado" : "turnos registrados"}
                  </div>
                </div>

                {/* Columna Derecha: Mi Ganancia y Tiempo Trabajado */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0, textAlign: "right" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                      <IconMoneyBag s={24} c="oklch(0.78 0.18 150)" /> Mi Ganancia
                    </div>
                    <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.78 0.18 150)", letterSpacing: "-1px", lineHeight: 1 }}>
                      {fmtMoneyNumber(totales.miGanancia)} <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6 }}>€</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, marginTop: 4, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                      <IconTimer s={24} c="oklch(0.85 0.12 210)" /> Tiempo Trab.
                    </div>
                    <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.85 0.12 210)", letterSpacing: "-1px", lineHeight: 1 }}>
                      {(() => { const [hPart, mPart] = durationStrHero.split(" "); const hNum = hPart.replace("h", ""); const mNum = mPart?.replace("m", "") ?? "0"; return <>{hNum}<span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6, marginLeft: 2, marginRight: 6, letterSpacing: "normal" }}>h</span> {mNum}<span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6, marginLeft: 2, letterSpacing: "normal" }}>m</span></>; })()}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
              }}>
                <span style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  fontWeight: 700,
                }}>
                  ACUMULADO TOTAL
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.85 0.18 85)", letterSpacing: "-1px" }}>
                  {fmtMoneyNumber(totalTaximetroHero)} <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6 }}>€</span>
                </div>
                <div style={{ fontSize: "clamp(22px, 6vw, 32px)", fontWeight: 900, color: "oklch(0.80 0.14 220)", letterSpacing: "-1px" }}>
                  {fmtKmNumber(totales.km || 0)} <span style={{ fontSize: 20, fontWeight: 700, opacity: 0.6 }}>KM</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* === SEMANAS ANTERIORES (agrupadas por mes) === */}
        {grupos2.length === 0 && !heroWeek && (
          <div style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            marginTop: 40,
            fontSize: 15,
          }}>
            No hay semanas registradas todavía.
          </div>
        )}

        {grupos2.map((grupo) => (
          <div key={grupo.mesId} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 800,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              marginTop: 8,
              marginBottom: 2,
            }}>
              {grupo.mesLabel}
            </div>

            {grupo.items.map((item) => {
              if (item.elem.kind === "turno") {
                const turno = item.elem.turno;
                const entregado = turno.entregada || false;
                return renderTurnoCard(turno, {
                  onClick: () => {
                    setReturnScreen("contabilidad");
                    setViewTurno(turno);
                    setScreen("summary");
                  },
                  showStatus: true,
                  showEntriesCount: false,
                });
              }

              const sem = item.elem;
              const resumenSemana = calcularResumenContableTurnos(sem.turnos, settings);
              const totalTaximetroSemana = resumenSemana.dineroBase;
              const miGananciaSemana = resumenSemana.miGanancia;
              const kmSemana = resumenSemana.km;
              const numTurnos = sem.turnos.length;
              const entregada = sem.override?.entregada || false;

              let totalMinsSem = 0;
              for (const turno of sem.turnos) {
                if (turno.startTime && turno.endTime) {
                  let mins = getDiffMins(turno.startTime, turno.endTime);
                  if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
                  totalMinsSem += mins;
                }
              }
              const durationStrSem = fmtDuration(totalMinsSem);

              return (
                <div
                  key={`sem-${sem.weekId}`}
                  onClick={() => {
                    setSelectedWeekId(sem.weekId);
                    setScreen("detalleSemana");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 16,
                    padding: 16,
                    cursor: "pointer",
                    border: entregada
                      ? `1.5px solid ${G}88`
                      : "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    containerType: "inline-size",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: WEEK_LIST_CARD_TEXT_SIZES.range,
                      fontWeight: 800,
                      color: "white",
                    }}>
                      {formatWeekRange(sem.weekId)}
                    </div>
                    <div style={{
                      fontSize: WEEK_LIST_CARD_TEXT_SIZES.meta,
                      color: "rgba(255,255,255,0.4)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}>
                      <span>{numTurnos} {numTurnos === 1 ? "turno" : "turnos"}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ color: entregada ? G : "oklch(0.75 0.16 70)", fontWeight: 800 }}>
                        {entregada ? "Entregada" : "Pendiente"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                      <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(totalTaximetroSemana)}
                      </div>
                      <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(kmSemana || 0)}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
                      <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGananciaSemana)}
                      </div>
                      <div style={{ fontSize: WEEK_LIST_CARD_TEXT_SIZES.metric, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStrSem}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Diálogo de empate 3-3 */}
      {pendingTie && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmación de empate 3-3"
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              background: "oklch(0.18 0.03 260)",
              borderRadius: 22,
              padding: 24,
              border: "1px solid rgba(255,255,255,0.1)",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div style={{
              fontSize: 18,
              fontWeight: 800,
              color: "white",
              marginBottom: 8,
            }}>
              Semana entre dos meses
            </div>
            <div style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 20,
              lineHeight: 1.4,
            }}>
              La semana del {formatWeekRange(pendingTie.weekId)} tiene 3 días en cada mes. ¿Dónde la quieres?
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pendingTie.candidates.map((c) => (
                <button
                  key={c.mesId}
                  onClick={() => {
                    const newMap = new Map(tieResolutions);
                    newMap.set(pendingTie.weekId, c.mesId);
                    setTieResolutions(newMap);
                    setPendingTie(null);
                  }}
                  style={{
                    padding: "16px 20px",
                    borderRadius: 14,
                    border: `1px solid ${A}`,
                    background: ABG,
                    color: A,
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {c.mesLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

const S = {
  iconBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: 12,
    padding: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
};