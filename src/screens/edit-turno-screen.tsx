import { type FC, useState } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import {
  IconTaxiBadgeNeon,
  IconRoad,
  IconNoteAdd
} from "../components/summary-icons";
import { EditEntryDialog } from "../components/edit-entry-dialog";
import { ConfirmDialog } from "../components/common";
import { hapticBackClose, hapticDanger, hapticInvalid, hapticKey, hapticOpen, hapticSave } from "../services/haptics";
import { fmt } from "../logic/formatters";
import { A, E, F, G, GBG, N, P } from "../shared/ui-theme";
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
import type { Turno, Entry, EditTurnoState } from "../shared/types";

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

interface EditTurnoScreenProps {
  editJ: EditTurnoState;
  setEditJ: (s: EditTurnoState | null) => void;
  setHistory: React.Dispatch<React.SetStateAction<Turno[]>>;
  setViewTurno: (t: Turno | null) => void;
  setScreen: (s: string) => void;
  endField: "dinero" | "km" | null;
  setEndField: (f: "dinero" | "km" | null) => void;
}

export const EditTurnoScreen: FC<EditTurnoScreenProps> = ({
  editJ,
  setEditJ,
  setHistory,
  setViewTurno,
  setScreen,
  endField,
  setEndField,
}) => {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showNewEntryKP, setShowNewEntryKP] = useState(false);

  // Estados del diálogo de edición de entrada olvidada
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editEntryAmount, setEditEntryAmount] = useState("");
  const [editEntryNote, setEditEntryNote] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    text: string;
    onConfirm: () => void;
  } | null>(null);

  function saveEdit() {
    if (!editJ) return;
    const finalDinero = editJ.dineroStr !== undefined
      ? parseFloat(editJ.dineroStr.replace(',', '.')) || 0
      : (editJ.dinero || 0);
    const finalKm = editJ.kmStr !== undefined
      ? parseFloat(editJ.kmStr.replace(',', '.')) || 0
      : (editJ.km || 0);
    const {
      dineroStr: _dineroStr,
      kmStr: _kmStr,
      newType: _newType,
      newAmount: _newAmount,
      newNote: _newNote,
      isAddingNote: _isAddingNote,
      tempNote: _tempNote,
      ...turnoBase
    } = editJ;
    const updated: Turno = {
      ...turnoBase,
      dinero: finalDinero,
      km: finalKm,
      totalP: editJ.entries.filter((e: Entry) => e.type === 'propina').reduce((s: number, e: Entry) => s + e.amount, 0),
      totalD: editJ.entries.filter((e: Entry) => e.type === 'datafono').reduce((s: number, e: Entry) => s + e.amount, 0),
      totalA: editJ.entries.filter((e: Entry) => e.type === 'agencia_bono').reduce((s: number, e: Entry) => s + e.amount, 0),
      totalE: editJ.entries.filter((e: Entry) => e.type === 'extra').reduce((s: number, e: Entry) => s + e.amount, 0),
      totalF: editJ.entries.filter((e: Entry) => e.type === 'gasolina').reduce((s: number, e: Entry) => s + e.amount, 0),
      totalN: editJ.entries.filter((e: Entry) => e.type === 'nulo').reduce((s: number, e: Entry) => s + e.amount, 0),
    };
    hapticSave();
    setHistory((h: Turno[]) => h.map((j: Turno) => j.id === updated.id ? (updated as Turno) : j));
    setViewTurno(updated as Turno);
    setEditJ(null);
    setScreen('summary');
  }

  const eDinero = editJ.dineroStr !== undefined ? editJ.dineroStr : (editJ.dinero ? editJ.dinero.toString().replace('.', ',') : "");
  const eKm = editJ.kmStr !== undefined ? editJ.kmStr : (editJ.km ? editJ.km.toString().replace('.', ',') : "");

  function kpEdit(v: string) {
    hapticKey();
    if (!editJ || !endField) return;
    const cur = endField === "dinero" ? eDinero : eKm;
    const key = endField === "dinero" ? "dineroStr" : "kmStr";
    let next = cur;
    if (v === "DEL") {
      next = cur.slice(0, -1);
    } else if (v === ",") {
      if (!cur.includes(",")) next = cur + ","; else return;
    } else {
      if (cur.replace(",", "").length >= 7) return;
      next = cur + v;
    }
    setEditJ({ ...editJ, [key]: next } as EditTurnoState);
  }

  function openEditEntry(e: Entry) {
    hapticOpen();
    setEditEntry(e);
    setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
    setEditEntryNote(e.note || "");
  }

  function saveEditEntry() {
    if (!editEntry) return;
    const amt = parseFloat(editEntryAmount.replace(",", "."));
    if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
      hapticInvalid();
      alert("El importe debe ser un número mayor que 0.");
      return;
    }
    const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
    hapticSave();
    setEditJ({
      ...editJ,
      entries: editJ.entries.map((x: any) => x.id === updated.id ? updated : x)
    });
    setEditEntry(null);
  }

  function deleteEditEntry() {
    if (!editEntry) return;
    hapticDanger();
    setEditJ({
      ...editJ,
      entries: editJ.entries.filter((x: any) => x.id !== editEntry.id)
    });
    setEditEntry(null);
  }

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px 32px', overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button style={S.iconBtn} onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); setScreen('summary'); }}><IconBack /></button>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Editar Turno</span>
        </div>

        {/* Dinero / KM (clickables - centrados y sin ceros) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div onClick={() => { hapticOpen(); setEndField("dinero"); }}
            style={{
              flex: 1,
              background: 'rgba(255, 180, 0, 0.06)',
              borderRadius: 16,
              padding: "14px",
              border: `1.5px solid ${endField === "dinero" ? "oklch(0.85 0.18 85)" : "rgba(255, 180, 0, 0.2)"}`,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <IconTaxiBadgeNeon s={28} c="oklch(0.85 0.18 85)" /> Total Taxímetro
            </div>
            <div style={{ color: 'oklch(0.85 0.18 85)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>
              {eDinero ? `${eDinero} €` : "€"}
            </div>
          </div>
          <div onClick={() => { hapticOpen(); setEndField("km"); }}
            style={{
              flex: 1,
              background: 'oklch(0.19 0.05 220)',
              borderRadius: 16,
              padding: "14px",
              border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center"
            }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              <IconRoad s={24} c="oklch(0.80 0.14 220)" /> Total KM
            </div>
            <div style={{ color: 'oklch(0.80 0.14 220)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>
              {eKm ? <>{eKm} <span style={KM_CARD_UNIT_STYLE}>KM</span></> : <span style={KM_CARD_UNIT_STYLE}>KM</span>}
            </div>
          </div>
        </div>

        {/* Entradas editables */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: '14px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Entradas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {editJ.entries.filter((e: Entry) => e.type !== 'nota').map((e: Entry) => {
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
                  style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto auto", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0 }}>
                    {meta.icon(17)}
                    <span style={{ color: meta.color, fontSize: 14, fontWeight: 700 }}>{meta.label}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{e.time}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                </div>
              );
            })}
            {editJ.entries.filter((e: Entry) => e.type !== 'nota').length === 0 && <div style={{ textAlign: 'center', color: "rgba(255,255,255,0.5)", fontSize: 13, padding: '10px 0' }}>Sin entradas</div>}
          </div>

          {/* Formulario para añadir nueva entrada */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>+ Añadir entrada olvidada</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>

                {/* Desplegable personalizado visualmente integrado */}
                <div style={{ position: 'relative', width: '120px', flexShrink: 0 }}>
                  <button
                    onClick={() => { hapticOpen(); setShowTypeMenu(!showTypeMenu); setShowNewEntryKP(false); }}
                    style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <span style={{ color: editJ.newType ? ({ datafono: P, propina: G, agencia_bono: A, extra: E, gasolina: F, nota: 'white', nulo: N } as any)[editJ.newType] : 'white', fontWeight: editJ.newType ? 800 : 600, textTransform: editJ.newType === 'agencia_bono' ? 'none' : (editJ.newType ? 'capitalize' : 'none'), fontSize: 13 }}>
                      {editJ.newType === 'agencia_bono' ? 'Agencia/Bono' : (editJ.newType || 'Selecciona')}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>▼</span>
                  </button>
                  {showTypeMenu && (
                    <>
                      <div onClick={() => setShowTypeMenu(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, zIndex: 100, width: '100%', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.8)' }}>
                        {['datafono', 'propina', 'agencia_bono', 'extra', 'gasolina', 'nulo'].map(type => {
                          const tColor = ({ datafono: P, propina: G, agencia_bono: A, extra: E, gasolina: F, nulo: N } as any)[type];
                          return (
                            <div
                              key={type}
                              onClick={() => {
                                hapticOpen();
                                setEditJ({ ...editJ, newType: type as any });
                                setShowTypeMenu(false);
                                setShowNewEntryKP(true);
                              }}
                              style={{ padding: '12px 14px', color: tColor, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'transparent', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              {type === 'agencia_bono' ? 'Agencia/Bono' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div
                  onClick={() => { hapticOpen(); setShowNewEntryKP(!showNewEntryKP); setShowTypeMenu(false); }}
                  style={{ flex: 1, minWidth: 60, background: 'rgba(0,0,0,0.3)', border: `1px solid ${showNewEntryKP ? (editJ.newType ? ({ datafono: P, propina: G, agencia_bono: A, extra: E, gasolina: F, nulo: N } as any)[editJ.newType] : 'white') : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative', zIndex: showNewEntryKP ? 100 : 'auto' }}
                >
                  <span style={{ fontSize: 13, color: editJ.newAmount ? 'white' : 'rgba(255,255,255,0.4)', fontWeight: editJ.newAmount ? 800 : 500 }}>
                    {editJ.newAmount ? `${editJ.newAmount} €` : 'Importe...'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (!editJ.newType || !editJ.newAmount) {
                      hapticInvalid();
                      alert('Selecciona categoría e introduce un importe.');
                      return;
                    }
                    const amt = parseFloat(editJ.newAmount.replace(',', '.'));
                    if (isNaN(amt) || amt <= 0) {
                      hapticInvalid();
                      alert('Importe inválido.');
                      return;
                    }
                    const noteText = (editJ.newNote || '').trim();
                    const newEntry: Entry = {
                      id: Date.now(),
                      type: editJ.newType,
                      amount: amt,
                      note: noteText,
                      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    };
                    hapticSave();
                    setEditJ({ ...editJ, entries: [newEntry, ...editJ.entries], newAmount: '', newNote: '', newType: null });
                    setShowNewEntryKP(false);
                  }}
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', position: 'relative', zIndex: showNewEntryKP ? 100 : 'auto' }}
                >
                  Añadir
                </button>
              </div>

              {/* Teclado numérico in-app integrado */}
              {showNewEntryKP && (
                <>
                  <div onClick={() => setShowNewEntryKP(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 98 }} />
                  <div style={{ position: 'relative', zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4, marginBottom: 4, animation: 'fadeUp 0.2s ease' }}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                      <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => {
                        hapticKey();
                        e.preventDefault();
                        let cur = editJ.newAmount || '';
                        if (k === "DEL") { setEditJ({ ...editJ, newAmount: cur.slice(0, -1) }); return; }
                        if (k === ",") { if (!cur.includes(",")) { setEditJ({ ...editJ, newAmount: cur + "," }); } return; }
                        if (cur.replace(",", "").length >= 6) return;
                        setEditJ({ ...editJ, newAmount: cur + k });
                      }} style={{ border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '12px 0', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 18, fontWeight: 700 }}>
                        {k === "DEL" ? <IconDel /> : k}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <input
                placeholder="Nota opcional..."
                value={editJ.newNote || ''}
                onChange={(e) => setEditJ({ ...editJ, newNote: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
          </div>

          {editJ.entries.filter((e: Entry) => e.type === 'nota').length === 0 && (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontStyle: 'italic', marginBottom: 12 }}>Sin notas del turno</div>
          )}

          {editJ.entries.filter((e: Entry) => e.type === 'nota').map((e: Entry) => (
            <div key={e.id} style={{ position: 'relative', marginBottom: 12 }}>
              <span style={{ position: 'absolute', top: 10, left: 10, color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }}>{e.time}</span>
              <button
                onClick={() => {
                  hapticDanger();
                  const newEntries = editJ.entries.filter((ent: Entry) => ent.id !== e.id);
                  setEditJ({ ...editJ, entries: newEntries });
                }}
                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,60,60,0.15)', color: '#ff7b7b', border: 'none', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                ✕
              </button>
              <textarea
                rows={1}
                value={e.note}
                onChange={(ev) => {
                  const newEntries = editJ.entries.map((ent: Entry) =>
                    ent.id === e.id ? { ...ent, note: ev.target.value } : ent
                  );
                  setEditJ({ ...editJ, entries: newEntries });
                }}
                placeholder="Escribe aquí la nota..."
                style={{
                  width: "100%",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 13,
                  lineHeight: 1.4,
                  background: "rgba(255,255,255,0.02)",
                  padding: "26px 36px 10px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.05)",
                  outline: "none",
                  resize: "none",
                  minHeight: "54px",
                  fontFamily: "inherit",
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}

          {editJ.isAddingNote ? (
            <div style={{ marginTop: 8, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease' }}>
              <textarea
                autoFocus
                value={editJ.tempNote || ''}
                onChange={(e) => setEditJ({ ...editJ, tempNote: e.target.value })}
                placeholder="Escribe la nueva nota aquí..."
                style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 13, outline: 'none', resize: 'none', minHeight: '60px', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => { hapticOpen(); setEditJ({ ...editJ, isAddingNote: false, tempNote: '' }); }} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => {
                  if (editJ.tempNote && editJ.tempNote.trim() !== '') {
                    const newEntry = { id: Date.now(), type: 'nota', amount: 0, note: editJ.tempNote.trim(), time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) };
                    hapticSave();
                    setEditJ({ ...editJ, entries: [...editJ.entries, newEntry], isAddingNote: false, tempNote: '' });
                  }
                }} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'white', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Añadir</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { hapticOpen(); setEditJ({ ...editJ, isAddingNote: true }); }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px dashed rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all 0.2s",
                marginTop: 4
              }}
            >
              <IconNoteAdd s={18} /> Añadir Nueva Nota
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={saveEdit}
            style={{ padding: '18px 0', borderRadius: 18, border: 'none', background: GBG, color: G, outline: `1.5px solid ${G}55`, fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>
            Guardar cambios
          </button>
          <button onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); setScreen('summary'); }}
            style={{ padding: '16px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={() => {
              hapticOpen();
              setConfirmDialog({
                text: "¿Seguro que quieres eliminar este Turno completo? Esta acción no se puede deshacer.",
                onConfirm: () => {
                  hapticDanger();
                  setHistory((h) => h.filter((j) => j.id !== editJ.id));
                  setEditJ(null);
                  setViewTurno(null);
                  setScreen("PantallaTurnos");
                }
              });
            }}
            style={{ padding: '16px 0', borderRadius: 18, border: '1px solid rgba(255,60,60,0.3)', background: 'rgba(255,60,60,0.08)', color: 'rgba(255,90,90,0.85)', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
          >
            🗑️ Eliminar Turno
          </button>
        </div>
      </div>

      {/* Teclado in-app para Dinero / KM en Editar Turno */}
      {endField && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Teclado numérico"
          onClick={() => { hapticBackClose(); setEndField(null); }}
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
              {((endField === "dinero" ? eDinero : eKm) || "0")} {endField === "dinero" ? "€" : "KM"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={() => kpEdit(k)}
                  style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                  {k === "DEL" ? <IconDel /> : k}
                </button>
              ))}
            </div>
            <button
              onClick={() => { hapticSave(); setEndField(null); }}
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
            hapticOpen();
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: () => {
                deleteEditEntry();
                setConfirmDialog(null);
              },
            });
          }}
          onCancel={() => { hapticOpen(); setEditEntry(null); }}
        />
      )}
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
    </Shell>
  );
};
