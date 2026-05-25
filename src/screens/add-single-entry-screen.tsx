import { type FC, type CSSProperties } from "react";
import { Shell } from "../components/shell";
import { A, ABG, E, EBG, F, FBG, N, NBG } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { Entry } from "../shared/types";

const iconBtnStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  borderRadius: 12,
  padding: 10,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
};

const keyBtnStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const IconBack: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M14 18L7 11L14 4"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDel: FC = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path
      d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      fill="none"
    />
    <path
      d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

type SingleMode = "agencia_bono" | "extra" | "gasolina" | "nulo";

interface AddSingleEntryScreenProps {
  singleMode: SingleMode;
  valS: string;
  setValS: React.Dispatch<React.SetStateAction<string>>;
  noteS: string;
  setNoteS: React.Dispatch<React.SetStateAction<string>>;
  setCurrent: React.Dispatch<React.SetStateAction<import("../shared/types").CurrentState>>;
  setSingleMode: React.Dispatch<React.SetStateAction<string | null>>;
  setScreen: React.Dispatch<React.SetStateAction<string>>;
}

export const AddSingleEntryScreen: FC<AddSingleEntryScreenProps> = ({
  singleMode,
  valS,
  setValS,
  noteS,
  setNoteS,
  setCurrent,
  setSingleMode,
  setScreen,
}: AddSingleEntryScreenProps) => {
  const cfg = {
    agencia_bono: { accent: A, bg: ABG, label: "Agencia/Bono" },
    extra: { accent: E, bg: EBG, label: "Extra" },
    gasolina: { accent: F, bg: FBG, label: "Gasolina" },
    nulo: { accent: N, bg: NBG, label: "Nulo" },
  }[singleMode] || { accent: E, bg: EBG, label: "Extra" };

  const { accent } = cfg;
  const label = cfg.label;

  function kpS(v: string) {
    if (v === "DEL") {
      setValS((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!valS.includes(",")) setValS((p) => p + ",");
      return;
    }
    if (valS.replace(",", "").length >= 6) return;
    setValS((p) => p + v);
  }

  const validS = valS && parseFloat(valS.replace(",", ".")) > 0;

  function saveS() {
    if (!validS) return;
    const now = timeNow();
    const entry: Entry = {
      id: Date.now(),
      type: singleMode,
      amount: parseFloat(valS.replace(",", ".")),
      note: noteS.trim(),
      time: now,
    };
    setCurrent((prev) => ({
      ...prev,
      startTime: prev.startTime || now,
      startDate: prev.startDate || today(),
      entries: [...prev.entries, entry],
    }));
    setValS("");
    setNoteS("");
    setSingleMode(null);
    setScreen("main");
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button style={iconBtnStyle} onClick={() => { setScreen("main"); setSingleMode(null); setValS(""); setNoteS(""); }}>
            <IconBack />
          </button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
            Añadir {label}
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, color: accent, marginBottom: 16, flexShrink: 0 }}>
          {valS || "0"} €
        </div>
        <input
          placeholder="Nota (opcional)"
          value={noteS}
          onChange={(e) => setNoteS(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "white", outline: "none", flexShrink: 0, marginBottom: 12 }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flexShrink: 0 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
            <button
              key={k}
              aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
              onClick={() => kpS(k)}
              style={{ ...keyBtnStyle, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}
            >
              {k === "DEL" ? <IconDel /> : k}
            </button>
          ))}
        </div>
        <button
          onClick={saveS}
          style={{ width: "100%", padding: 15, marginTop: 12, borderRadius: 12, border: "none", background: accent, color: "black", fontWeight: 700, flexShrink: 0 }}
        >
          Guardar
        </button>
      </div>
    </Shell>
  );
};
