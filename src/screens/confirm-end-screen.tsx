import React from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad, IconPinNeon } from "../components/summary-icons";
import { fmt } from "../logic/formatters";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
import { A, ABG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "../shared/ui-theme";
import type { CurrentState, AppSettings, Entry } from "../shared/types";

const C = "white";
const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

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

type Props = {
  current: CurrentState;
  dineroJ: string;
  setDineroJ: (v: string) => void;
  kmJ: string;
  setKmJ: (v: string) => void;
  endField: "dinero" | "km" | null;
  setEndField: (v: "dinero" | "km" | null) => void;
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  propinas: Entry[];
  datafonos: Entry[];
  agencias: Entry[];
  extras: Entry[];
  gasolinas: Entry[];
  nulos: Entry[];
  onEndTurno: () => void;
  setScreen: (screen: string) => void;
};

export function ConfirmEndScreen({
  current,
  dineroJ,
  setDineroJ,
  kmJ,
  setKmJ,
  endField,
  setEndField,
  totalP,
  totalD,
  totalA,
  totalE,
  totalF,
  totalN,
  propinas,
  datafonos,
  agencias,
  extras,
  gasolinas,
  nulos,
  onEndTurno,
  setScreen,
}: Props) {
  function kpEnd(v: string) {
    if (!endField) return;
    const cur = endField === "dinero" ? dineroJ : kmJ;
    const setVal = endField === "dinero" ? setDineroJ : setKmJ;
    if (v === "DEL") { setVal(cur.slice(0, -1)); return; }
    if (v === ",") { if (!cur.includes(",")) setVal(cur + ","); return; }
    if (cur.replace(",", "").length >= 7) return;
    setVal(cur + v);
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 20px 16px", overflowY: "auto", animation: "slideIn 0.25s ease", WebkitOverflowScrolling: "touch" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
          <button style={S.iconBtn} onClick={() => { setScreen("main"); setEndField(null); }}><IconBack /></button>
          <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Terminar Turno</span>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexShrink: 0 }}>
          <div onClick={() => setEndField("dinero")}
            style={{
              flex: 1,
              background: "rgba(255, 180, 0, 0.06)",
              borderRadius: 16,
              padding: "14px",
              border: "1.5px solid " + (endField === "dinero" ? "oklch(0.85 0.18 85)" : "rgba(255, 180, 0, 0.2)"),
              cursor: "pointer",
              transition: "border 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
            </div>
            <div style={{ color: "oklch(0.85 0.18 85)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>
              {dineroJ ? dineroJ + " €" : "€"}
            </div>
          </div>
          <div onClick={() => setEndField("km")}
            style={{
              flex: 1,
              background: "oklch(0.19 0.05 220)",
              borderRadius: 16,
              padding: "14px",
              border: "1.5px solid " + (endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"),
              cursor: "pointer",
              transition: "border 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
            </div>
            <div style={{ color: "oklch(0.80 0.14 220)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>
              {kmJ ? kmJ + " " : ""}<span style={KM_CARD_UNIT_STYLE}>KM</span>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
            Resumen de hoy
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: PBG, borderRadius: 14, padding: "12px", border: "1px solid " + P + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <IconCard s={15} c={P} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Datáfono</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: P, letterSpacing: "-0.5px" }}>{fmt(totalD)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{datafonos.length} entrada{datafonos.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ background: GBG, borderRadius: 14, padding: "12px", border: "1px solid " + G + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <IconCoin s={15} c={G} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Propinas</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: G, letterSpacing: "-0.5px" }}>{fmt(totalP)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{propinas.length} entrada{propinas.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ background: ABG, borderRadius: 14, padding: "12px", border: "1px solid " + A + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <IconAgency s={15} c={A} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias/Bonos</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: A, letterSpacing: "-0.5px" }}>{fmt(totalA)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{agencias.length} entrada{agencias.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ background: EBG, borderRadius: 14, padding: "12px", border: "1px solid " + E + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <IconExtra s={15} c={E} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Extras</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: E, letterSpacing: "-0.5px" }}>{fmt(totalE)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{extras.length} entrada{extras.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ background: FBG, borderRadius: 14, padding: "12px", border: "1px solid " + F + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <IconFuel s={15} c={F} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Gasolina</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: F, letterSpacing: "-0.5px" }}>{fmt(totalF)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{gasolinas.length} entrada{gasolinas.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ background: NBG, borderRadius: 14, padding: "12px", border: "1px solid " + N + "33" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <IconNulo s={15} c={N} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Nulos</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: N, letterSpacing: "-0.5px" }}>{fmt(totalN)}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{nulos.length} entrada{nulos.length !== 1 ? "s" : ""}</div>
            </div>
          </div>

          {(() => {
            const gNotes = current.entries.filter(e => e.type === "nota");
            if (gNotes.length > 0) {
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {gNotes.map(e => {
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
            }
            return (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>Sin notas del turno</div>
              </div>
            );
          })()}

        </div>

        {(() => {
          const entriesWithNotes = current.entries.filter(e => e.type !== "nota" && e.note && e.note.trim());
          if (entriesWithNotes.length === 0) return null;
          return (
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <IconPinNeon s={18} /> Notas detalladas
              </div>
              {entriesWithNotes.map(e => {
                const meta = getEntryTypeMeta(e.type);
                return (
                  <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                    <span style={NOTE_TIME_STYLE}>{e.time}</span>
                    <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0, alignSelf: "baseline" }}>{fmt(e.amount)}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, marginTop: "auto" }}>
          <button onClick={onEndTurno}
            style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
            Terminar Turno
          </button>
          <button onClick={() => setScreen("main")}
            style={{ padding: "13px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </div>

      {endField && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Teclado numérico"
          onClick={() => setEndField(null)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#0d0d14",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: "16px 16px 20px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              animation: "slideUp 0.25s ease",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                {endField === "dinero" ? "Total Taxímetro" : "Total KM"}
              </span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)", marginBottom: 14, textAlign: "center", letterSpacing: "-0.5px" }}>
              {(endField === "dinero" ? dineroJ : kmJ) || "0"} {endField === "dinero" ? "€" : "KM"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={() => kpEnd(k)}
                  style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                  {k === "DEL" ? <IconDel /> : k}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEndField(null)}
              style={{
                width: "100%",
                padding: "16px 0",
                marginTop: 12,
                borderRadius: 14,
                border: "none",
                background: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)",
                color: "black",
                fontSize: 17,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
