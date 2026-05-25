import type { CSSProperties } from "react";
import type { TurnoNotasSemana } from "../shared/types";

type EntryTypeMetaForNotes = {
  color: string;
  label: string;
};

export function TurnoNotasCard({
  data,
  onClick,
  formatDate,
  formatMoney,
  getEntryTypeMeta,
  noteTimeStyle,
}: {
  data: TurnoNotasSemana;
  onClick: () => void;
  formatDate: (iso: string) => string;
  formatMoney: (amount: number) => string;
  getEntryTypeMeta: (type: string) => EntryTypeMetaForNotes;
  noteTimeStyle: CSSProperties;
}) {
  const { turno, notasGenerales, notasDetalladas } = data;
  return (
    <div
      onClick={onClick}
      style={{ background: "rgba(255,255,255,0.035)", borderRadius: 14, padding: "12px", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{formatDate(turno.date)}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.42)", whiteSpace: "nowrap" }}>
          {turno.startTime} - {turno.endTime}
        </div>
      </div>

      {notasGenerales.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: notasDetalladas.length ? 10 : 0 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Notas del turno
          </div>
          {notasGenerales.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: "8px 10px", lineHeight: 1.35, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                <span style={noteTimeStyle}>{entry.time}</span>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
              </div>
            );
          })}
        </div>
      )}

      {notasDetalladas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Notas detalladas
          </div>
          {notasDetalladas.map((entry) => {
            const meta = getEntryTypeMeta(entry.type);
            return (
              <div key={entry.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 10, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 7, minWidth: 0 }}>
                <span style={noteTimeStyle}>{entry.time}</span>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.35, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0, alignSelf: "baseline" }}>{formatMoney(entry.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
