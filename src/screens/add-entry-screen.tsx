import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { G, P } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { CurrentState, Entry } from "../shared/types";
import { hapticKey, hapticSave, hapticOpen } from "../services/haptics";

const iconBtnStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  borderRadius: 12,
  padding: 10,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
} as const;

const keyBtnStyle = {
  border: "none",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
} as const;

interface AddEntryScreenProps {
  activeField: string;
  setActiveField: React.Dispatch<React.SetStateAction<string>>;
  valP: string;
  setValP: React.Dispatch<React.SetStateAction<string>>;
  valD: string;
  setValD: React.Dispatch<React.SetStateAction<string>>;
  noteP: string;
  setNoteP: React.Dispatch<React.SetStateAction<string>>;
  noteD: string;
  setNoteD: React.Dispatch<React.SetStateAction<string>>;
  setCurrent: React.Dispatch<React.SetStateAction<CurrentState>>;
  setScreen: React.Dispatch<React.SetStateAction<string>>;
}

export const AddEntryScreen: FC<AddEntryScreenProps> = ({
  activeField,
  setActiveField,
  valP,
  setValP,
  valD,
  setValD,
  noteP,
  setNoteP,
  noteD,
  setNoteD,
  setCurrent,
  setScreen,
}) => {
  const setVal = activeField === "propina" ? setValP : setValD;
  const curVal = activeField === "propina" ? valP : valD;

  function kpAdd(v: string) {
    hapticKey();
    if (v === "DEL") {
      setVal((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!curVal.includes(",")) setVal((p) => p + ",");
      return;
    }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }

  function handleSaveAdd() {
    const p = parseFloat(valP.replace(",", "."));
    const d = parseFloat(valD.replace(",", "."));
    if (isNaN(p) && isNaN(d)) return;
    const now = timeNow();
    const newEntries: Entry[] = [];
    if (!isNaN(p) && p > 0)
      newEntries.push({ id: Date.now(), type: "propina", amount: p, note: noteP.trim(), time: now });
    if (!isNaN(d) && d > 0)
      newEntries.push({ id: Date.now() + 1, type: "datafono", amount: d, note: noteD.trim(), time: now });
    if (newEntries.length === 0) return;
    hapticSave();
    setCurrent((prev) => ({
      ...prev,
      startTime: prev.startTime || now,
      startDate: prev.startDate || today(),
      entries: [...prev.entries, ...newEntries],
    }));
    setValP(""); setValD(""); setNoteP(""); setNoteD("");
    setScreen("main");
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button style={iconBtnStyle} onClick={() => { hapticOpen(); setScreen("main"); }}>
            <IconBack />
          </button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
            Añadir {activeField === "propina" ? "Propina" : "Datáfono"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div
            onClick={() => { hapticOpen(); setActiveField("datafono"); }}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: 16,
              background: activeField === "datafono" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeField === "datafono" ? P : "transparent"}`,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>DATÁFONO</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "datafono" ? P : "white" }}>{valD || "0"} €</div>
          </div>
          <div
            onClick={() => { hapticOpen(); setActiveField("propina"); }}
            style={{
              flex: 1,
              padding: "16px",
              borderRadius: 16,
              background: activeField === "propina" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeField === "propina" ? G : "transparent"}`,
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>PROPINA</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "propina" ? G : "white" }}>{valP || "0"} €</div>
          </div>
        </div>

        <input
          placeholder={`Nota para ${activeField} (opcional)`}
          value={activeField === "propina" ? noteP : noteD}
          onChange={(e) => activeField === "propina" ? setNoteP(e.target.value) : setNoteD(e.target.value)}
          style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "none", color: "white", marginBottom: 12, outline: "none", flexShrink: 0 }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, flexShrink: 0 }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
            <button
              key={k}
              aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
              onClick={() => kpAdd(k)}
              style={{ ...keyBtnStyle, padding: "20px 0", background: "rgba(255,255,255,0.05)", fontSize: 22, fontWeight: 700, color: "white" }}
            >
              {k === "DEL" ? <IconDel /> : k}
            </button>
          ))}
        </div>

        <button
          onClick={handleSaveAdd}
          style={{ width: "100%", padding: 18, marginTop: 12, borderRadius: 16, border: "none", background: activeField === "propina" ? G : P, color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}
        >
          Guardar
        </button>
      </div>
    </Shell>
  );
};
