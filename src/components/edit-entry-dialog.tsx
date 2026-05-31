import { useState, type ReactNode } from "react";
import type { Entry } from "../shared/types";
import { hapticDanger, hapticKey, hapticOpen } from "../services/haptics";

type EntryTypeMetaForDialog = {
  color: string;
  label: string;
};

export function EditEntryDialog({
  entry,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onSave,
  onDelete,
  onCancel,
  getEntryTypeMeta,
  deleteIcon,
}: {
  entry: Entry;
  amount: string;
  note: string;
  onAmountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  getEntryTypeMeta: (type: string) => EntryTypeMetaForDialog;
  deleteIcon: ReactNode;
}) {
  const [showKP, setShowKP] = useState(false);
  const meta = getEntryTypeMeta(entry.type);

  function kpAmount(k: string) {
    hapticKey();
    if (k === "DEL") { onAmountChange(amount.slice(0, -1)); return; }
    if (k === ",") { if (!amount.includes(",")) onAmountChange(amount + ","); return; }
    if (amount.replace(",", "").length >= 7) return;
    onAmountChange(amount + k);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar entrada"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 20,
          padding: 20,
          width: "92%",
          maxWidth: 380,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Editar {meta.label}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>{entry.time}</span>
        </div>

        {entry.type !== "nota" && (
          <div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => { hapticOpen(); setShowKP(true); }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", justifyContent: "space-between" }}>
              <span>Importe (€)</span>
              {!showKP && <span style={{ color: meta.color, fontSize: 10 }}>Toca para editar</span>}
            </div>
            <div style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${showKP ? meta.color : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12,
              color: showKP ? meta.color : "white",
              padding: "12px 14px",
              fontSize: 26,
              fontWeight: 900,
              textAlign: "center",
              minHeight: 32,
              letterSpacing: "-0.5px",
              transition: "all 0.2s"
            }}>
              {amount || "0"}
            </div>
          </div>
        )}

        {showKP && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14, animation: "fadeUp 0.2s ease" }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
              <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => { e.stopPropagation(); kpAmount(k); }}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 0",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                {k === "DEL" ? deleteIcon : k}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>Nota</div>
          <input
            value={note}
            onChange={(ev) => onNoteChange(ev.target.value)}
            placeholder="Nota opcional"
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "white",
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              hapticOpen();
              onCancel();
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.7)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              hapticDanger();
              onDelete();
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,60,60,0.15)",
              color: "#ff7b7b",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Eliminar
          </button>
          <button
            onClick={onSave}
            style={{
              flex: 1.2,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: meta.color,
              color: "black",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
