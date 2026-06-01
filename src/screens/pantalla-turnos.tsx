import React from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
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
  isSelectingTurnos,
  setIsSelectingTurnos,
  selectedTurnosIds,
  setSelectedTurnosIds,
  setScreen,
  replaceScreen,
  setViewTurno,
  setReturnScreen,
  onExportSelectedTurnosJSON,
  renderTurnoCard,
}: {
  history: Turno[];
  settings: AppSettings;
  isSelectingTurnos: boolean;
  setIsSelectingTurnos: (v: boolean) => void;
  selectedTurnosIds: number[];
  setSelectedTurnosIds: (ids: number[]) => void;
  setScreen: (screen: string) => void;
  replaceScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  setReturnScreen: (screen: string | null) => void;
  onExportSelectedTurnosJSON: () => void;
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
}) {
  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button style={S.iconBtn} onClick={() => {
            setIsSelectingTurnos(false);
            setSelectedTurnosIds([]);
            replaceScreen("home");
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
          history.map((j) => renderTurnoCard(j, {
            onClick: () => {
              if (isSelectingTurnos) {
                if (selectedTurnosIds.includes(j.id)) {
                  setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== j.id));
                } else {
                  setSelectedTurnosIds([...selectedTurnosIds, j.id]);
                }
              } else {
                setReturnScreen("PantallaTurnos");
                setViewTurno(j);
                setScreen("summary");
              }
            },
            isSelecting: isSelectingTurnos,
            isSelected: selectedTurnosIds.includes(j.id),
            onToggleSelect: (checked) => {
              if (checked) {
                setSelectedTurnosIds([...selectedTurnosIds, j.id]);
              } else {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== j.id));
              }
            }
          }))
        )}
      </div>
    </Shell>
  );
}
