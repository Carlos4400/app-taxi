import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconCard, IconCoin, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { fmt, fmtKmNumber, fmtDuration } from "../logic/formatters";
import { getTurnosByCalendarMonth, getTurnosByCalendarYear } from "../logic/turnos";
import { calcularResumenContableTurnos } from "../logic/accounting";
import { getDiffMins } from "../logic/date-time";
import { MESES_COMPLETOS } from "../logic/date-labels";
import { DurationCardValue } from "../components/duration-card-value";
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
import { A, ABG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "../shared/ui-theme";
import type { AppSettings, Turno } from "../shared/types";
import { useAppStore } from "../services/store";

type Props = {
  selectedAccountingYear: number;
  setSelectedAccountingYear: (year: number | ((prev: number) => number)) => void;
  selectedAccountingMonth: number;
  setSelectedAccountingMonth: (month: number) => void;
};

export function DetalleAnualScreen({
  selectedAccountingYear,
  setSelectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingMonth,
}: Props) {
  // Estado del store (antes props desde App).
  const history: Turno[] = useAppStore((s) => s.history);
  const settings: AppSettings = useAppStore((s) => s.settings);
  const setScreen = useAppStore((s) => s.setScreen);
  const turnosAnual = getTurnosByCalendarYear(history, selectedAccountingYear);
  const resumenAnual = calcularResumenContableTurnos(turnosAnual, settings);
  const monthLabels = MESES_COMPLETOS;
  const cats = [
    { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenAnual.totalD },
    { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: resumenAnual.totalP },
    { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: resumenAnual.totalA },
    { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: resumenAnual.totalE },
    { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: resumenAnual.totalF },
    { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: resumenAnual.totalN },
  ];

  let totalMins = 0;
  for (const turno of turnosAnual) {
    if (turno.startTime && turno.endTime) {
      let mins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
      totalMins += mins;
    }
  }
  const durationStr = fmtDuration(totalMins);

  const mesesAnio = monthLabels.map((label, index) => {
    const month = index + 1;
    const turnosMes = getTurnosByCalendarMonth(history, selectedAccountingYear, month);
    const resumenMes = calcularResumenContableTurnos(turnosMes, settings);
    let totalMins = 0;
    for (const turno of turnosMes) {
      if (turno.startTime && turno.endTime) {
        let mins = getDiffMins(turno.startTime, turno.endTime);
        if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
        totalMins += mins;
      }
    }
    return { month, label, turnosMes, resumenMes, totalMins };
  });

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 12, padding: 10, display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => setScreen("contabilidad")}>
            <IconBack />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>Resumen Anual</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{selectedAccountingYear}</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.035)", borderRadius: 22, padding: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: 8 }}>
            <button
              aria-label="Año anterior"
              onClick={() => setSelectedAccountingYear((year) => year - 1)}
              style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: "white", fontSize: 17, fontWeight: 900, cursor: "pointer" }}
            >
              {"<"}
            </button>
            <div style={{ minHeight: 52, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.46)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.8px" }}>Año</div>
              <div style={{ fontSize: 22, color: "white", fontWeight: 950, lineHeight: 1.1 }}>{selectedAccountingYear}</div>
            </div>
            <button
              aria-label="Año siguiente"
              onClick={() => setSelectedAccountingYear((year) => year + 1)}
              style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: "white", fontSize: 17, fontWeight: 900, cursor: "pointer" }}
            >
              {">"}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Total Taximetro</div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)' }}>{fmt(resumenAnual.dineroBase)}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(0, 210, 255, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Total KM</div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)' }}>{fmtKmNumber(resumenAnual.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span></div>
            </div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(80, 220, 140, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(80, 220, 140, 0.22)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Mi Ganancia</div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.78 0.18 150)' }}>{fmt(resumenAnual.miGanancia)}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(120, 200, 255, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(120, 200, 255, 0.22)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Tiempo Trabajado</div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)' }}><DurationCardValue value={durationStr} /></div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {cats.map(cat => (
            <div key={cat.key} style={{ background: cat.bg, borderRadius: 14, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
                {cat.icon} {cat.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: cat.color }}>{fmt(cat.total || 0)}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ flex: 1, background: 'rgba(255,80,80,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(255,80,80,0.22)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a descontar</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)' }}>{fmt(resumenAnual.totalDescontar)}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(80,220,140,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(80,220,140,0.22)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a dar</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: G }}>{fmt(resumenAnual.totalADar)}</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
            Meses del año ({turnosAnual.length} turnos)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mesesAnio.map(({ month, label, turnosMes, resumenMes, totalMins }) => {
              const durationStr = fmtDuration(totalMins);
              return (
                <div
                  key={label}
                  onClick={() => { setSelectedAccountingMonth(month); setScreen("detalleMes"); }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    border: month === selectedAccountingMonth ? `1px solid ${G}88` : "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontWeight: 850, color: "white", fontSize: 16 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                      {turnosMes.length} {turnosMes.length === 1 ? "turno" : "turnos"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(resumenMes.dineroBase)}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKmNumber(resumenMes.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(resumenMes.miGanancia)}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                        <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStr}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Shell>
  );
}
