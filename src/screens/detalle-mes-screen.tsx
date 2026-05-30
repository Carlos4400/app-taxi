import type { CSSProperties } from "react";
import type { AppSettings, Turno, TurnoNotasSemana } from "../shared/types";
import { useAppStore } from "../services/store";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "../components/entry-icons";
import {
  IconTaxiBadgeNeon,
  IconRoad,
} from "../components/summary-icons";
import {
  IconMoneyBag,
  IconTimer,
} from "../components/calendar-icons";
import { DurationCardValue } from "../components/duration-card-value";
import { TurnoNotasCard } from "../components/turno-notas";
import { getTurnosByCalendarMonth } from "../logic/turnos";
import { calcularResumenContableTurnos } from "../logic/accounting";
import { getTurnosNotasSemana } from "../logic/turno-notas-logic";
import { getMesLabel } from "../logic/date-labels";
import { fmtDate, getDiffMins } from "../logic/date-time";
import { fmtDuration, fmtKmNumber, fmt } from "../logic/formatters";
import { A, ABG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "../shared/ui-theme";
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
import { getEntryTypeMeta } from "../shared/entry-type-meta";

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

interface DetalleMesScreenProps {
  selectedAccountingYear: number;
  selectedAccountingMonth: number;
  setSelectedAccountingYear: (year: number | ((prev: number) => number)) => void;
  setSelectedAccountingMonth: (month: number | ((prev: number) => number)) => void;
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

export function DetalleMesScreen({
  selectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingYear,
  setSelectedAccountingMonth,
  setReturnScreen,
  setViewTurno,
  renderTurnoCard,
}: DetalleMesScreenProps) {
  const history: Turno[] = useAppStore((s) => s.history);
  const settings: AppSettings = useAppStore((s) => s.settings);
  const setScreen = useAppStore((s) => s.setScreen);
  const monthId = `${selectedAccountingYear}-${String(selectedAccountingMonth).padStart(2, "0")}`;
  const turnosMes = getTurnosByCalendarMonth(history, selectedAccountingYear, selectedAccountingMonth);
  const resumenMes = calcularResumenContableTurnos(turnosMes, settings);
  const mesLabel = getMesLabel(monthId);
  const turnosConNotas = getTurnosNotasSemana(turnosMes);
  const cats = [
    { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: resumenMes.totalD },
    { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: resumenMes.totalP },
    { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: resumenMes.totalA },
    { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: resumenMes.totalE },
    { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: resumenMes.totalF },
    { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: resumenMes.totalN },
  ];

  let totalMins = 0;
  for (const turno of turnosMes) {
    if (turno.startTime && turno.endTime) {
      let mins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) mins = Math.max(0, mins - turno.totalPausedMinutes);
      totalMins += mins;
    }
  }
  const durationStr = fmtDuration(totalMins);

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={S.iconBtn} onClick={() => setScreen("contabilidad")}>
            <IconBack />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
              Detalle de Mes
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              {mesLabel}
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.035)", borderRadius: 22, padding: 10, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 40px", alignItems: "center", gap: 8 }}>
            <button
              aria-label="Mes anterior"
              onClick={() => setSelectedAccountingMonth((month) => Math.max(1, month - 1))}
              style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: selectedAccountingMonth === 1 ? "rgba(255,255,255,0.22)" : "white", fontSize: 17, fontWeight: 900, cursor: selectedAccountingMonth === 1 ? "default" : "pointer" }}
            >
              {"<"}
            </button>
            <div style={{ minHeight: 52, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.46)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.8px" }}>Mes</div>
              <div style={{ fontSize: 22, color: "white", fontWeight: 950, lineHeight: 1.1 }}>{mesLabel.split(" ")[0]}</div>
            </div>
            <button
              aria-label="Mes siguiente"
              onClick={() => setSelectedAccountingMonth((month) => Math.min(12, month + 1))}
              style={{ height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.26)", color: selectedAccountingMonth === 12 ? "rgba(255,255,255,0.22)" : "white", fontSize: 17, fontWeight: 900, cursor: selectedAccountingMonth === 12 ? "default" : "pointer" }}
            >
              {">"}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taximetro
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)', letterSpacing: '-0.5px' }}>{fmt(resumenMes.dineroBase)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(0, 210, 255, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{fmtKmNumber(resumenMes.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span></div>
            </div>
          </div>

          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(80, 220, 140, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(80, 220, 140, 0.22)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconMoneyBag s={26} c="oklch(0.78 0.18 150)" /> Mi Ganancia
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(resumenMes.miGanancia)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(120, 200, 255, 0.08)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(120, 200, 255, 0.22)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconTimer s={26} c="oklch(0.85 0.12 210)" /> Tiempo Trabajado
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}><DurationCardValue value={durationStr} /></div>
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
            <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)' }}>{fmt(resumenMes.totalDescontar)}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(80,220,140,0.08)', borderRadius: 14, padding: '14px 12px', border: '1px solid rgba(80,220,140,0.22)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>Total a dar</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: G }}>{fmt(resumenMes.totalADar)}</div>
          </div>
        </div>

        {turnosConNotas.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
              Notas de turnos
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {turnosConNotas.map((data) => (
                <TurnoNotasCard
                  key={`notas-${data.turno.id}`}
                  data={data}
                  formatDate={fmtDate}
                  formatMoney={fmt}
                  getEntryTypeMeta={getEntryTypeMeta}
                  noteTimeStyle={NOTE_TIME_STYLE}
                  onClick={() => { setReturnScreen("detalleMes"); setViewTurno(data.turno); setScreen("summary"); }}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 18, padding: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
            Turnos del mes ({turnosMes.length})
          </div>
          {turnosMes.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, fontStyle: "italic" }}>
              Sin turnos en este mes
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {turnosMes.map((turno) => (
                renderTurnoCard(turno, {
                  onClick: () => { setReturnScreen("detalleMes"); setViewTurno(turno); setScreen("summary"); },
                  showEntriesCount: false,
                })
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

const S = {
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.26)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
} as const;
