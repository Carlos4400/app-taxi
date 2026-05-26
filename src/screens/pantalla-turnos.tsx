import React from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconPencilNeon, IconTimer, IconMoneyBag } from "../components/calendar-icons";
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { fmtDuration, fmtKm, fmtKmNumber, fmt } from "../logic/formatters";
import { getDiffMins, fmtDate } from "../logic/date-time";
import { calcularTurnoContable } from "../logic/accounting";
import type { Turno, AppSettings } from "../shared/types";

const S = {
  iconBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "none",
    borderRadius: 12,
    padding: 10,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  keyBtn: {
    border: "none",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};

export function PantallaTurnos({
  history,
  settings,
  isSelectingTurnos,
  setIsSelectingTurnos,
  selectedTurnosIds,
  setSelectedTurnosIds,
  setScreen,
  setViewTurno,
  setReturnScreen,
  onExportSelectedTurnosJSON,
}: {
  history: Turno[];
  settings: AppSettings;
  isSelectingTurnos: boolean;
  setIsSelectingTurnos: (v: boolean) => void;
  selectedTurnosIds: number[];
  setSelectedTurnosIds: (ids: number[]) => void;
  setScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  setReturnScreen: (screen: string | null) => void;
  onExportSelectedTurnosJSON: () => void;
}) {
  function renderTurnoCardLocal(turno: Turno) {
    let durationStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalMins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
      }
      durationStr = fmtDuration(totalMins);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGanancia = calcularTurnoContable(turno, settings).miGanancia;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {isSelectingTurnos && (
          <input
            type="checkbox"
            checked={selectedTurnosIds.includes(turno.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              } else {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              }
            }}
            style={{ width: 20, height: 20, accentColor: "#50dc8c", cursor: "pointer" }}
          />
        )}
        <div
          onClick={() => {
            if (isSelectingTurnos) {
              if (selectedTurnosIds.includes(turno.id)) {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              } else {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              }
            } else {
              setReturnScreen("PantallaTurnos");
              setViewTurno(turno);
              setScreen("summary");
            }
          }}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.entries.length} {turno.entries.length === 1 ? "entrada" : "entradas"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(taximetroTurno)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(turno.km || 0)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGanancia)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button style={S.iconBtn} onClick={() => {
            setIsSelectingTurnos(false);
            setSelectedTurnosIds([]);
            setScreen("home");
          }}>
            <IconBack />
          </button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white", textAlign: "center" }}>
            Turnos
          </div>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (isSelectingTurnos) {
                  onExportSelectedTurnosJSON();
                } else {
                  setIsSelectingTurnos(true);
                }
              }}
              style={{
                background: isSelectingTurnos ? "rgba(80,220,140,0.15)" : "rgba(255,255,255,0.07)",
                border: isSelectingTurnos ? "1px solid rgba(80,220,140,0.3)" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: isSelectingTurnos ? "#50dc8c" : "rgba(255,255,255,0.75)",
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isSelectingTurnos ? `Exportar (${selectedTurnosIds.length})` : "Seleccionar"}
            </button>
          )}
        </div>

        {isSelectingTurnos && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button
              onClick={() => {
                setIsSelectingTurnos(false);
                setSelectedTurnosIds([]);
              }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}
            >
              Cancelar selección
            </button>
          </div>
        )}
        {history.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: 40, fontSize: 15 }}>
            No hay Turnos Anteriores.
          </div>
        ) : (
          history.map((j) => renderTurnoCardLocal(j))
        )}
      </div>
    </Shell>
  );
}
