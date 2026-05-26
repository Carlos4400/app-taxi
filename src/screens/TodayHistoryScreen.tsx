import React from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";
import { EditEntryDialog } from "../components/edit-entry-dialog";
import { fmt } from "../logic/formatters";
import type { Entry, CurrentState } from "../shared/types";
import { A, ABG, E, EBG, F, FBG, G, GBG, N, NBG, P, PBG } from "../shared/ui-theme";

const ENTRY_TYPE_META: Record<string, { color: string; label: string; icon: (s?: number) => React.ReactNode }> = {
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard s={s} c="white" /> },
};

function getEntryTypeMeta(type: string) {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

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
};

type Props = {
  current: CurrentState;
  confirmDialog: {
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  } | null;
  setConfirmDialog: (dialog: any) => void;
  editEntry: Entry | null;
  editEntryAmount: string;
  editEntryNote: string;
  setEditEntryAmount: (v: string) => void;
  setEditEntryNote: (v: string) => void;
  openEditEntry: (e: Entry) => void;
  saveEditEntry: () => void;
  deleteEditEntry: () => void;
  setEditEntry: (e: Entry | null) => void;
  setScreen: (screen: string) => void;
};

export function TodayHistoryScreen({
  current,
  confirmDialog,
  setConfirmDialog,
  editEntry,
  editEntryAmount,
  editEntryNote,
  setEditEntryAmount,
  setEditEntryNote,
  openEditEntry,
  saveEditEntry,
  deleteEditEntry,
  setEditEntry,
  setScreen,
}: Props) {
  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <button style={S.iconBtn} onClick={() => setScreen("main")}>
            <IconBack />
          </button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
            Entradas de hoy
          </div>
        </div>
        {current.entries.length > 0 && (
          <div style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            marginTop: -8,
            marginBottom: 2,
            fontStyle: "italic",
          }}>
            Toca una entrada para editar
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...current.entries].reverse().map((e) => {
            const meta = getEntryTypeMeta(e.type);
            return (
              <div
                key={e.id}
                onClick={() => openEditEntry(e)}
                role="button"
                tabIndex={0}
                title="Editar entrada"
                aria-label="Editar entrada"
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    openEditEntry(e);
                  }
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 13,
                  padding: "10px 14px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(ev) => {
                  (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(ev) => {
                  (ev.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {meta.icon(17)}
                  <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{e.type !== "nota" && "+" + fmt(e.amount)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {confirmDialog && <ConfirmDialogWrapper {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
      {editEntry && (
        <EditEntryDialog
          entry={editEntry}
          amount={editEntryAmount}
          note={editEntryNote}
          onAmountChange={setEditEntryAmount}
          onNoteChange={setEditEntryNote}
          onSave={saveEditEntry}
          getEntryTypeMeta={getEntryTypeMeta}
          deleteIcon={<IconDel />}
          onDelete={() => {
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
            });
          }}
          onCancel={() => setEditEntry(null)}
        />
      )}
    </Shell>
  );
}

function ConfirmDialogWrapper({
  text,
  onConfirm,
  confirmText,
  confirmBg,
  confirmColor,
  confirmBorder,
  onCancel,
}: {
  text: string;
  onConfirm: () => void;
  confirmText?: string;
  confirmBg?: string;
  confirmColor?: string;
  confirmBorder?: string;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmación"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div style={{
        background: "oklch(0.18 0.03 260)",
        borderRadius: 22,
        padding: 24,
        width: "92%",
        maxWidth: 360,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "white", lineHeight: 1.4 }}>{text}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: confirmBorder || "none", background: confirmBg || G, color: confirmColor || "black", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>{confirmText || "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}
