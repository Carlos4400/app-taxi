import React from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconTaxiBadgeNeon, IconRoad, IconGive } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { IconReceipt } from "../components/settings-icons";
import { fmt, fmtDuration, fmtKmNumber } from "../logic/formatters";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
import { A, ABG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "../shared/ui-theme";
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
import { TurnoNotasCard } from "../components/turno-notas";
import { ConfirmDialog } from "../components/common";
import { DurationCardValue } from "../components/duration-card-value";
import type { Turno, WeekOverride, AppSettings } from "../shared/types";
import { useAppStore } from "../services/store";
import {
  groupTurnosByWeek,
  getWeekOverride,
  formatWeekRangeFull,
  getTurnoFechaEfectiva,
} from "../logic/week-logic";
import { calcularTotalesTurnos, calcularResumenContableTurnos } from "../logic/accounting";
import { getTurnosNotasSemana } from "../logic/turno-notas-logic";
import { fmtDate, getDiffMins, today } from "../logic/date-time";

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

type Props = {
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
  setReturnScreen: (screen: string | null) => void;
  setViewTurno: (turno: Turno | null) => void;
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
};

export function DetalleSemanaScreen({
  selectedWeekId,
  setSelectedWeekId,
  updateWeekOverride,
  setReturnScreen,
  setViewTurno,
  renderTurnoCard,
}: Props) {
  const history: Turno[] = useAppStore((s) => s.history);
  const settings: AppSettings = useAppStore((s) => s.settings);
  const weekOverrides: WeekOverride[] = useAppStore((s) => s.weekOverrides);
  const setScreen = useAppStore((s) => s.setScreen);
  const weekId = selectedWeekId;
  const grupos = groupTurnosByWeek(history, settings.diaLibre);
  const turnosSemana = grupos.get(weekId) || [];
  const totales = calcularTotalesTurnos(turnosSemana);

  const override = getWeekOverride(weekOverrides, weekId);
  const entregada = override?.entregada || false;
  const fechaEntrega = override?.fechaEntrega || null;

  function applyChange(partial: Partial<Omit<WeekOverride, "weekId">>) {
    updateWeekOverride(weekId, partial);
  }

  const cats = [
    { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: totales.totalD },
    { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: totales.totalP },
    { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: totales.totalA },
    { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: totales.totalE },
    { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: totales.totalF },
    { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: totales.totalN },
  ];

  let totalMins = 0;
  for (const t of turnosSemana) {
    if (t.startTime && t.endTime) {
      let mins = getDiffMins(t.startTime, t.endTime);
      if (t.totalPausedMinutes) mins = Math.max(0, mins - t.totalPausedMinutes);
      totalMins += mins;
    }
  }
  const durationStr = fmtDuration(totalMins);

  const dineroV = (totales.dinero || 0) - (totales.totalN || 0);
  const resumenContableSemana = calcularResumenContableTurnos(turnosSemana, settings);
  const miGanancia = resumenContableSemana.miGanancia;
  const totalDescontar = resumenContableSemana.totalDescontar;
  const totalADar = resumenContableSemana.totalADar;
  const turnosConNotas = getTurnosNotasSemana(turnosSemana);



  const [confirmDialog, setConfirmDialog] = React.useState<{
    text: string;
    onConfirm: () => void;
  } | null>(null);

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px 32px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 12, padding: 10, display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => { setScreen("contabilidad"); setSelectedWeekId(null); }}>
            <IconBack />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "clamp(16px, 4.5vw, 20px)", fontWeight: 800, color: "white" }}>
              Detalle de Semana
            </div>
          </div>
          <button
            onClick={() => setScreen("liquidacionSemana")}
            style={{
              background: "rgba(80, 220, 140, 0.08)",
              border: `1px solid ${G}`,
              borderRadius: 12,
              color: G,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Liquidación
          </button>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 22,
          padding: "16px",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <h1
            aria-label="Rango de fechas de la semana"
            style={{
              margin: "0",
              color: "white",
              fontSize: "clamp(17px, 4.6vw, 22px)",
              lineHeight: 1.15,
              fontWeight: 900,
              letterSpacing: 0,
              textAlign: "center",
              overflowWrap: "anywhere",
            }}
          >
            {formatWeekRangeFull(weekId)}
          </h1>
        </div>

        {/* Badge de estado */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: entregada ? G : "oklch(0.75 0.16 70)",
            background: entregada ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
            padding: "5px 10px", borderRadius: 8,
            letterSpacing: "0.5px", textTransform: "uppercase",
          }}>
            {entregada ? `✓ Entregada${fechaEntrega ? " · " + new Date(fechaEntrega + "T12:00:00").toLocaleDateString("es-ES") : ""}` : "Pendiente"}
          </div>
        </div>

        {/* Contenedor Superior Agrupado (Dos columnas) */}
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Columna Izquierda: Taxímetro y KM */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(255, 180, 0, 0.06)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(255, 180, 0, 0.2)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.18 85)', letterSpacing: '-0.5px' }}>{fmt(dineroV)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px 8px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>
                {fmtKmNumber(totales.km || 0)} <span style={KM_CARD_UNIT_STYLE}>KM</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Ganancia y Tiempo */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px 8px', border: '1px solid oklch(0.60 0.16 150 / 0.35)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <IconMoneyBag s={26} c="oklch(0.78 0.18 150)" /> Mi Ganancia
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(miGanancia)}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'rgba(0, 180, 255, 0.05)', borderRadius: 16, padding: '14px 8px', border: '1px solid rgba(0, 180, 255, 0.15)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <IconTimer s={26} c="oklch(0.85 0.12 210)" /> Tiempo Trabajado
              </div>
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}><DurationCardValue value={durationStr} /></div>
            </div>
          </div>
        </div>

        {/* Categorías */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cats.map(c => (
              <div key={c.key} style={{ background: c.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.color}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {c.icon}
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                </div>
                <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenedor Inferior Agrupado: Descontar y Dar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Tarjeta: Total a Descontar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.06 25)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.70 0.18 25 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <IconReceipt s={24} c="oklch(0.70 0.18 25)" />
                Total a Descontar
              </div>
              <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: 'oklch(0.70 0.18 25)', letterSpacing: '-0.5px' }}>
                {fmt(totalDescontar)}
              </div>
            </div>

            {/* Tarjeta: Total a Dar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.18 0.07 145)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.68 0.20 145 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <IconGive s={26} c="oklch(0.68 0.20 145)" />
                Total a Dar
              </div>
              <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: 'oklch(0.68 0.20 145)', letterSpacing: '-0.5px' }}>
                {fmt(totalADar)}
              </div>
            </div>
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
                  onClick={() => { setScreen("summary"); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lista de turnos */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>
            Turnos de la semana ({turnosSemana.length})
          </div>
          {turnosSemana.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, fontStyle: "italic", padding: "20px 0" }}>
              Sin turnos en esta semana todavía
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => {
                    setReturnScreen("detalleSemana");
                    setViewTurno(t);
                    setScreen("summary");
                  },
                  showEntriesCount: true,
                })
              ))}
            </div>
          )}
        </div>

        {/* Botón Marcar como entregada */}
        <button
          onClick={() => {
            if (entregada) {
              setConfirmDialog({
                text: "¿Marcar esta semana como NO entregada?",
                onConfirm: () => {
                  applyChange({ entregada: false, fechaEntrega: null });
                  setConfirmDialog(null);
                },
              });
            } else {
              applyChange({ entregada: true, fechaEntrega: today() });
            }
          }}
          style={{
            padding: "16px 0",
            borderRadius: 16,
            border: "none",
            background: entregada ? "rgba(255,255,255,0.08)" : G,
            color: entregada ? "rgba(255,255,255,0.7)" : "black",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          {entregada ? "Desmarcar entregada" : "✓ Marcar como entregada"}
        </button>
      </div>

      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
    </Shell>
  );
}
