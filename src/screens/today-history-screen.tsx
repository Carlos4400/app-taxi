import { Shell } from "../components/shell";
import { ConfirmDialog } from "../components/common";
import { IconBack, IconDel } from "../components/navigation-icons";
import { EditEntryDialog } from "../components/edit-entry-dialog";
import { fmt } from "../logic/formatters";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
import type { Entry, CurrentState } from "../shared/types";

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
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
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
