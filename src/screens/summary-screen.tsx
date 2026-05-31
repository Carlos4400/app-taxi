import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconPencilNeon } from "../components/calendar-icons";
import {
  IconNoteAdd,
  IconTaxiBadgeNeon,
  IconRoad,
  IconPinNeon,
  IconGive
} from "../components/summary-icons";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo
} from "../components/entry-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { IconReceipt } from "../components/settings-icons";
import { DurationCardValue } from "../components/duration-card-value";
import { ConfirmDialog } from "../components/common";
import { today, fmtDate, getDiffMins } from "../logic/date-time";
import { fmtDuration, fmtKmNumber, fmt } from "../logic/formatters";
import { calcularTurnoContable } from "../logic/accounting";
import { getTurnoAccountingWeekId } from "../logic/week-logic";
import { updateTurnoEntrega } from "../logic/turno-entrega";
import { A, ABG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "../shared/ui-theme";
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
import type { Turno, AppSettings } from "../shared/types";

const iconBtnStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  borderRadius: 12,
  padding: 10,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
} as const;

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

interface SummaryScreenProps {
  viewTurno: Turno;
  settings: AppSettings;
  returnScreen: string | null;
  setViewTurno: (t: Turno | null) => void;
  setReturnScreen: (s: string | null) => void;
  setScreen: (s: string) => void;
  setEditJ: (s: any) => void;
  setHistory: React.Dispatch<React.SetStateAction<Turno[]>>;
  confirmDialog: any;
  setConfirmDialog: (d: any) => void;
}

export const SummaryScreen: FC<SummaryScreenProps> = ({
  viewTurno,
  settings,
  returnScreen,
  setViewTurno,
  setReturnScreen,
  setScreen,
  setEditJ,
  setHistory,
  confirmDialog,
  setConfirmDialog,
}) => {
  const vP = viewTurno.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
  const vD = viewTurno.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0);
  const isToday = viewTurno.date === today();
  const vA = viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').reduce((s: number, e: any) => s + e.amount, 0);
  const vE = viewTurno.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0);
  const vF = viewTurno.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0);
  const vN = viewTurno.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0);

  // El taxímetro efectivo ya no incluye los Nulos
  const dineroV = (viewTurno.dinero || 0) - vN;

  const kmV = viewTurno.km || 0;
  const cats = [
    { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={20} c={P} />, total: vD, count: viewTurno.entries.filter((e: any) => e.type === 'datafono').length },
    { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={20} c={G} />, total: vP, count: viewTurno.entries.filter((e: any) => e.type === 'propina').length },
    { key: 'agencia_bono', label: 'Agencias/Bonos', color: A, bg: ABG, icon: <IconAgency s={20} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia_bono').length },
    { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={20} c={E} />, total: vE, count: viewTurno.entries.filter((e: any) => e.type === 'extra').length },
    { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={22} c={F} />, total: vF, count: viewTurno.entries.filter((e: any) => e.type === 'gasolina').length },
    { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={20} c={N} />, total: vN, count: viewTurno.entries.filter((e: any) => e.type === 'nulo').length },
  ];

  // Cálculo de duración
  let durationStr = fmtDuration(0);
  if (viewTurno.startTime && viewTurno.endTime) {
    let totalMins = getDiffMins(viewTurno.startTime, viewTurno.endTime);
    if (viewTurno.totalPausedMinutes) {
      totalMins = Math.max(0, totalMins - viewTurno.totalPausedMinutes);
    }
    durationStr = fmtDuration(totalMins);
  }
  const calculoTurno = calcularTurnoContable(viewTurno, settings);
  const miGanancia = calculoTurno.miGanancia;

  // Calculos con la configuracion guardada del turno.
  const totalDescontar = calculoTurno.totalDescontar;
  const totalADar = calculoTurno.totalADar;
  const isLooseAccountingTurno = returnScreen === "contabilidad" && getTurnoAccountingWeekId(viewTurno, settings.diaLibre) === null;
  const turnoEntregado = viewTurno.entregada || false;
  const turnoFechaEntrega = viewTurno.fechaEntrega || null;
  const turnoSummaryDateTitle =
    viewTurno.startDate && viewTurno.startDate !== viewTurno.date
      ? `${fmtDate(viewTurno.startDate)} ${viewTurno.startTime} - ${fmtDate(viewTurno.date)} ${viewTurno.endTime}`
      : `${fmtDate(viewTurno.date)} \u00B7 ${viewTurno.startTime} - ${viewTurno.endTime}`;

  function applyTurnoEntrega(entregada: boolean) {
    const fechaEntrega = entregada ? today() : null;
    setHistory((h) => updateTurnoEntrega(h, viewTurno.id, entregada, fechaEntrega));
    setViewTurno({ ...viewTurno, entregada, fechaEntrega });
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideIn 0.3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={iconBtnStyle} onClick={() => {
            setScreen(returnScreen || (isToday ? 'home' : 'PantallaTurnos'));
            setViewTurno(null);
            setReturnScreen(null);
          }}>
            <IconBack />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Resumen del Turno</div>
          </div>
          <button style={{ ...iconBtnStyle, background: 'rgba(255,255,255,0.09)' }} onClick={() => {
            setEditJ({ ...viewTurno, entries: [...viewTurno.entries] });
            setScreen('editTurno');
          }}>
            <IconPencilNeon />
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 22,
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          <h1
            aria-label="Fecha del turno"
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
            {turnoSummaryDateTitle}
          </h1>
        </div>

        {isLooseAccountingTurno && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: turnoEntregado ? G : "oklch(0.75 0.16 70)",
              background: turnoEntregado ? "rgba(80,220,140,0.12)" : "rgba(255,200,80,0.10)",
              padding: "5px 10px",
              borderRadius: 8,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
              {turnoEntregado ? `✓ Entregado${turnoFechaEntrega ? " · " + new Date(turnoFechaEntrega + "T12:00:00").toLocaleDateString("es-ES") : ""}` : "Pendiente"}
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: E,
              background: EBG,
              padding: "5px 10px",
              borderRadius: 8,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
              Fuera de semana
            </div>
          </div>
        )}

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
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{fmtKmNumber(kmV)} <span style={KM_CARD_UNIT_STYLE}>KM</span></div>
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
              <div style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 900, color: 'oklch(0.85 0.12 210)', letterSpacing: '-0.5px' }}>
                <DurationCardValue value={durationStr} />
              </div>
            </div>
          </div>
        </div>

        {/* Categorías + Notas */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cats.map(c => (
              <div key={c.key} style={{ background: c.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.color}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {c.icon}
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                </div>
                <div style={{ fontSize: "clamp(15px, 4.5vw, 20px)", fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{c.count} {c.count === 1 ? 'entrada' : 'entradas'}</div>
              </div>
            ))}
          </div>

          {(() => {
            const generalNotes = viewTurno.entries.filter((e: any) => e.type === 'nota');
            if (generalNotes.length === 0) {
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: 'italic' }}>Sin notas del turno</div>
                </div>
              );
            }
            return (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {generalNotes.map((e: any) => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 9, minWidth: 0 }}>
                        <span style={NOTE_TIME_STYLE}>{e.time}</span>
                        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Notas Detalladas (Fuera del recuadro principal) */}
        {(() => {
          const entriesWithNotes = viewTurno.entries.filter((e: any) => e.type !== 'nota' && e.note && e.note.trim());
          if (entriesWithNotes.length === 0) return null;
          return (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconPinNeon s={18} /> Notas detalladas
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entriesWithNotes.map((e: any) => {
                  const meta = getEntryTypeMeta(e.type);
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'auto auto minmax(0, 1fr) auto', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                      <span style={NOTE_TIME_STYLE}>{e.time}</span>
                      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: 'nowrap', flexShrink: 0 }}>{meta.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: "baseline" }}>{fmt(e.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Contenedor Inferior Agrupado: Descontar y Dar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)', marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {/* Tarjeta: Total a Descontar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.19 0.06 25)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.70 0.18 25 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <IconReceipt s={24} c="oklch(0.70 0.18 25)" />
                Total a Descontar
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.70 0.18 25)', letterSpacing: '-0.5px' }}>
                {fmt(totalDescontar)}
              </div>
            </div>

            {/* Tarjeta: Total a Dar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'oklch(0.18 0.07 145)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.68 0.20 145 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <IconGive s={26} c="oklch(0.68 0.20 145)" />
                Total a Dar
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'oklch(0.68 0.20 145)', letterSpacing: '-0.5px' }}>
                {fmt(totalADar)}
              </div>
            </div>
          </div>
        </div>

        {isLooseAccountingTurno && (
          <button
            onClick={() => {
              if (turnoEntregado) {
                setConfirmDialog({
                  text: "¿Marcar este turno como NO entregado?",
                  onConfirm: () => {
                    applyTurnoEntrega(false);
                    setConfirmDialog(null);
                  },
                });
              } else {
                applyTurnoEntrega(true);
              }
            }}
            style={{
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: turnoEntregado ? "rgba(255,255,255,0.08)" : G,
              color: turnoEntregado ? "rgba(255,255,255,0.7)" : "black",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            {turnoEntregado ? "Desmarcar entregado" : "✓ Marcar turno como entregado"}
          </button>
        )}

        {isToday && (
          <button onClick={() => setScreen('home')}
            style={{ marginTop: 4, padding: '17px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Volver al inicio
          </button>
        )}
      </div>
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
    </Shell>
  );
};
