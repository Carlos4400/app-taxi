import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { useAppStore } from "../services/store";

const iconBtnStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "none",
  borderRadius: 12,
  padding: 10,
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
} as const;

interface AddNotaGeneralScreenProps {
  noteS: string;
  setNoteS: React.Dispatch<React.SetStateAction<string>>;
}

export const AddNotaGeneralScreen: FC<AddNotaGeneralScreenProps> = ({
  noteS,
  setNoteS,
}) => {
  // Estado/acciones de negocio leídos directamente del store (antes llegaban
  // como props desde App). El estado del formulario (noteS) sigue siendo local.
  const setCurrent = useAppStore((s) => s.setCurrent);
  const setScreen = useAppStore((s) => s.setScreen);

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "12px 20px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", animation: "slideIn 0.25s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexShrink: 0 }}>
          <button style={iconBtnStyle} onClick={() => { setScreen("main"); setNoteS(""); }}>
            <IconBack />
          </button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
            Añadir Nota
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <textarea
            placeholder="Escribe algo sobre el Turno..."
            value={noteS}
            onChange={(e) => setNoteS(e.target.value)}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "none",
              borderRadius: 16,
              padding: 16,
              color: "white",
              fontSize: 16,
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              lineHeight: 1.5
            }}
          />
        </div>

        <button
          onClick={() => {
            if (noteS.trim()) {
              const newEntry = {
                id: Date.now(),
                type: "nota" as const,
                amount: 0,
                note: noteS.trim(),
                time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
              };
              setCurrent(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
            }
            setNoteS("");
            setScreen("main");
          }}
          style={{ width: "100%", padding: 18, marginTop: 16, borderRadius: 16, border: "none", background: "white", color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}
        >
          Añadir al Turno
        </button>
      </div>
    </Shell>
  );
};
