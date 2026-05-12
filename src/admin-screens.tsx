// src/admin-screens.tsx
//
// Componentes para la vista de administrador.
//   - AdminListScreen: lista de todos los usuarios registrados.
//   - AdminUserView:   vista de SOLO LECTURA de los datos de un usuario.
//
// Estos componentes NO escriben en Firestore ni en localStorage.
// Las reglas publicadas en firestore.rules permiten al admin leer
// users/{otroUid}/** pero NUNCA escribir; aquí cumplimos la otra mitad
// del trato: nunca hacemos setDoc, addDoc, updateDoc o deleteDoc.

import React from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { userMetaDocRef, userSubcollectionRef } from "./firestore-sync";

const { useState, useEffect, useMemo } = React;

// ============================================================================
// TIPOS LOCALES (duplicados de main.tsx para no introducir un import cruzado)
// ============================================================================

interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

interface Turno {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: Entry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string | null;
  totalPausedMinutes?: number;
}

interface CurrentState {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
}

interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
  diaLibre: number;
  diaLibreDesde: string | null;
}

interface WeekOverride {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

interface FrozenWeek {
  weekId: string;
  fechaInicio: string;
  fechaFin: string;
  diaLibreUsado: number;
  totales: {
    totalP: number;
    totalD: number;
    totalA: number;
    totalE: number;
    totalF: number;
    totalN: number;
    dinero: number;
    km: number;
  };
  turnoIds: number[];
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
  numTurnos: number;
}

interface Reserva {
  id: string;
  date: string;
  time: string;
  origen: string;
  destino: string;
  cliente: string;
  telefono: string;
  notas: string;
}

type NotaTipo = "ITV" | "Seguro" | "Normal" | "Día libre";

interface NotaCalendario {
  id: string;
  date: string;
  tipo: NotaTipo;
  texto: string;
}

interface UserListItem {
  username: string;
  email: string;
  uid: string;
}

// ============================================================================
// PALETA (idéntica a main.tsx y login-screen.tsx)
// ============================================================================

const G = "oklch(0.68 0.20 145)";
const GBG = "oklch(0.18 0.07 145)";
const A = "oklch(0.75 0.16 70)";
const ABG = "oklch(0.20 0.06 70)";
const F = "oklch(0.70 0.18 25)";
const FBG = "oklch(0.19 0.06 25)";
const N = "oklch(0.62 0.06 260)";
const NBG = "oklch(0.18 0.03 260)";
const BG_APP = "oklch(0.14 0.02 260)";
const TEXT = "oklch(0.92 0.02 260)";
const MUTED = "oklch(0.60 0.04 260)";

// ============================================================================
// HELPERS DE FORMATO
// ============================================================================

function fmtEuro(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}

function fmtFecha(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// weekId estilo "2026-W19" (semanas ISO, lunes como primer día).
function getWeekId(dateIso: string): string {
  const d = new Date(dateIso + "T12:00:00");
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.getTime() - firstThursday.getTime();
  const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ============================================================================
// AdminListScreen — lista de usuarios registrados
// ============================================================================

export function AdminListScreen({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (uid: string, username: string) => void;
}) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "usernames"));
        if (cancelado) return;
        const list: UserListItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as { email: string; uid: string };
          if (data.uid && data.email) {
            list.push({ username: d.id, email: data.email, uid: data.uid });
          }
        });
        list.sort((a, b) => a.username.localeCompare(b.username, "es"));
        setUsers(list);
      } catch (err: any) {
        if (cancelado) return;
        setError(err?.message || "Error al cargar la lista de usuarios.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: BG_APP, color: TEXT, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: `1px solid ${N}`,
            color: TEXT,
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Volver
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Modo administrador</h1>
      </div>
      <p style={{ color: MUTED, fontSize: 14, marginTop: 0, marginBottom: 16 }}>
        Selecciona un usuario para ver sus datos en modo solo lectura.
      </p>

      {loading && <div style={{ color: MUTED }}>Cargando lista de usuarios…</div>}

      {error && (
        <div
          style={{
            background: FBG,
            border: `1px solid ${F}`,
            color: F,
            padding: 12,
            borderRadius: 10,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div style={{ color: MUTED, fontSize: 14 }}>
          No hay usuarios registrados todavía.
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u) => (
            <button
              key={u.uid}
              onClick={() => onSelect(u.uid, u.username)}
              style={{
                background: NBG,
                border: `1px solid ${N}`,
                borderRadius: 12,
                padding: 14,
                textAlign: "left",
                color: TEXT,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{u.username}</div>
                <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{u.email}</div>
              </div>
              <span style={{ color: MUTED, fontSize: 20 }}>›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AdminUserView — vista de SOLO LECTURA de los datos de un usuario
// ============================================================================

type Tab = "turnos" | "contabilidad" | "calendario" | "config";

export function AdminUserView({
  uid,
  username,
  onBack,
}: {
  uid: string;
  username: string;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState<CurrentState | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [history, setHistory] = useState<Turno[]>([]);
  const [reservations, setReservations] = useState<Reserva[]>([]);
  const [notes, setNotes] = useState<NotaCalendario[]>([]);
  const [weekOverrides, setWeekOverrides] = useState<WeekOverride[]>([]);
  const [frozenWeeks, setFrozenWeeks] = useState<FrozenWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("turnos");
  const [selectedTurno, setSelectedTurno] = useState<Turno | null>(null);

  useEffect(() => {
    let cancelado = false;
    const unsubs: Array<() => void> = [];
    const recibido = {
      current: false, settings: false, turnos: false,
      reservations: false, notes: false,
      weekOverrides: false, frozenWeeks: false,
    };
    function marcar(key: keyof typeof recibido) {
      recibido[key] = true;
      if (Object.values(recibido).every((v) => v) && !cancelado) {
        setLoading(false);
      }
    }
    function manejarError(err: any) {
      if (cancelado) return;
      setError(err?.message || "Error leyendo los datos del usuario.");
      setLoading(false);
    }

    unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"),
      (snap) => { setCurrent(snap.exists() ? (snap.data() as CurrentState) : null); marcar("current"); },
      manejarError));
    unsubs.push(onSnapshot(userMetaDocRef(db, uid, "settings"),
      (snap) => { setSettings(snap.exists() ? (snap.data() as AppSettings) : null); marcar("settings"); },
      manejarError));
    unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"),
      (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        setHistory(items);
        marcar("turnos");
      },
      manejarError));
    unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"),
      (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        setReservations(items);
        marcar("reservations");
      },
      manejarError));
    unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "notes"),
      (snap) => {
        const items: NotaCalendario[] = [];
        snap.forEach((d) => items.push(d.data() as NotaCalendario));
        setNotes(items);
        marcar("notes");
      },
      manejarError));
    unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "weekOverrides"),
      (snap) => {
        const items: WeekOverride[] = [];
        snap.forEach((d) => items.push(d.data() as WeekOverride));
        setWeekOverrides(items);
        marcar("weekOverrides");
      },
      manejarError));
    unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "frozenWeeks"),
      (snap) => {
        const items: FrozenWeek[] = [];
        snap.forEach((d) => items.push(d.data() as FrozenWeek));
        setFrozenWeeks(items);
        marcar("frozenWeeks");
      },
      manejarError));

    return () => {
      cancelado = true;
      unsubs.forEach((u) => u());
    };
  }, [uid]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: BG_APP, color: TEXT,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>
        Cargando datos de {username}…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: BG_APP, color: TEXT, padding: 20 }}>
        <button onClick={onBack} style={{
          background: "transparent", border: `1px solid ${N}`, color: TEXT,
          borderRadius: 10, padding: "8px 14px", cursor: "pointer", marginBottom: 16,
        }}>← Volver</button>
        <div style={{
          background: FBG, border: `1px solid ${F}`, color: F,
          padding: 14, borderRadius: 10, fontSize: 14,
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (selectedTurno) {
    return <TurnoDetail turno={selectedTurno} onBack={() => setSelectedTurno(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: BG_APP, color: TEXT }}>
      {/* Banner */}
      <div style={{
        background: ABG, borderBottom: `1px solid ${A}`,
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div>
          <div style={{
            fontSize: 11, color: A, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: 0.5,
          }}>Modo administrador · solo lectura</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
            Viendo datos de {username}
          </div>
        </div>
        <button onClick={onBack} style={{
          background: "transparent", border: `1px solid ${A}`, color: A,
          padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 14,
          flexShrink: 0,
        }}>Volver</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 6, padding: "12px 16px",
        overflowX: "auto", borderBottom: `1px solid ${NBG}`,
      }}>
        {(["turnos", "contabilidad", "calendario", "config"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? GBG : "transparent",
              border: `1px solid ${tab === t ? G : N}`,
              color: tab === t ? G : MUTED,
              padding: "8px 14px", borderRadius: 10,
              fontSize: 14, cursor: "pointer",
              fontWeight: tab === t ? 600 : 400,
              textTransform: "capitalize", whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === "turnos" && (
          <TurnosTab
            history={history}
            current={current}
            onSelectTurno={setSelectedTurno}
          />
        )}
        {tab === "contabilidad" && (
          <ContabilidadTab
            history={history}
            weekOverrides={weekOverrides}
            frozenWeeks={frozenWeeks}
          />
        )}
        {tab === "calendario" && (
          <CalendarioTab reservations={reservations} notes={notes} />
        )}
        {tab === "config" && <ConfigTab settings={settings} />}
      </div>
    </div>
  );
}

// ============================================================================
// Pestaña: Turnos
// ============================================================================

function TurnosTab({
  history,
  current,
  onSelectTurno,
}: {
  history: Turno[];
  current: CurrentState | null;
  onSelectTurno: (t: Turno) => void;
}) {
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.id - a.id),
    [history]
  );
  const turnoEnCurso = current && current.entries && current.entries.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {turnoEnCurso && (
        <div style={{
          background: GBG, border: `1px solid ${G}`, borderRadius: 12, padding: 14,
        }}>
          <div style={{ fontSize: 12, color: G, fontWeight: 700, marginBottom: 4 }}>
            TURNO EN CURSO
          </div>
          <div style={{ fontSize: 14, color: TEXT }}>
            Inicio: {current!.startDate ? fmtFecha(current!.startDate) : "?"} a las {current!.startTime || "?"} · {current!.entries.length} entradas
          </div>
        </div>
      )}

      {sortedHistory.length === 0 && !turnoEnCurso && (
        <div style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: 32 }}>
          Este usuario no tiene turnos guardados.
        </div>
      )}

      {sortedHistory.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelectTurno(t)}
          style={{
            background: NBG, border: `1px solid ${N}`, borderRadius: 12,
            padding: 14, textAlign: "left", color: TEXT, cursor: "pointer",
            display: "flex", flexDirection: "column", gap: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{fmtFecha(t.date)}</div>
            <div style={{ fontSize: 13, color: MUTED }}>
              {t.startTime || "?"} → {t.endTime || "?"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
            <span style={{ color: G }}>{fmtEuro(t.dinero)}</span>
            <span style={{ color: MUTED }}>{t.km} km</span>
            {t.totalP > 0 && <span style={{ color: A }}>P: {fmtEuro(t.totalP)}</span>}
            {t.totalD > 0 && <span style={{ color: MUTED }}>D: {fmtEuro(t.totalD)}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Detalle de un turno (solo lectura)
// ============================================================================

function TurnoDetail({ turno, onBack }: { turno: Turno; onBack: () => void }) {
  const filas: Array<[string, number, string]> = [
    ["Propinas", turno.totalP, A],
    ["Datáfono", turno.totalD, MUTED],
    ["Agencia / Bono", turno.totalA, MUTED],
    ["Extra", turno.totalE, MUTED],
    ["Gasolina", turno.totalF, F],
    ["Nulos", turno.totalN, MUTED],
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG_APP, color: TEXT, padding: 16 }}>
      <button onClick={onBack} style={{
        background: "transparent", border: `1px solid ${N}`, color: TEXT,
        borderRadius: 10, padding: "8px 14px", cursor: "pointer", marginBottom: 16,
      }}>← Volver al listado</button>

      <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>{fmtFecha(turno.date)}</h2>
      <div style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>
        Inicio {turno.startTime || "—"} · Fin {turno.endTime || "—"}
        {turno.totalPausedMinutes ? ` · Pausa: ${turno.totalPausedMinutes} min` : ""}
      </div>

      <div style={{
        background: NBG, border: `1px solid ${N}`, borderRadius: 12, padding: 14, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: MUTED }}>Total bruto</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: G }}>{fmtEuro(turno.dinero)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: MUTED }}>Kilómetros</span>
          <span style={{ fontSize: 16, color: TEXT }}>{turno.km} km</span>
        </div>
      </div>

      <h3 style={{ margin: "16px 0 8px", fontSize: 16, color: MUTED }}>Subtotales</h3>
      <div style={{
        background: NBG, border: `1px solid ${N}`, borderRadius: 12, padding: 14,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {filas.map(([label, val, color]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: MUTED }}>{label}</span>
            <span style={{ color }}>{fmtEuro(val)}</span>
          </div>
        ))}
      </div>

      {turno.entries && turno.entries.length > 0 && (
        <>
          <h3 style={{ margin: "20px 0 8px", fontSize: 16, color: MUTED }}>
            Entradas individuales ({turno.entries.length})
          </h3>
          <div style={{
            background: NBG, border: `1px solid ${N}`, borderRadius: 12, padding: 14,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {turno.entries.map((e) => (
              <div key={e.id} style={{
                display: "flex", justifyContent: "space-between", fontSize: 13, gap: 10,
                padding: "4px 0", borderBottom: `1px solid ${BG_APP}`,
              }}>
                <span style={{ color: MUTED, minWidth: 56 }}>{e.time}</span>
                <span style={{ flex: 1, color: TEXT }}>{e.type}{e.note ? ` — ${e.note}` : ""}</span>
                <span style={{ color: TEXT }}>{fmtEuro(e.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {turno.notes && turno.notes.trim() && (
        <>
          <h3 style={{ margin: "20px 0 8px", fontSize: 16, color: MUTED }}>Notas</h3>
          <div style={{
            background: NBG, border: `1px solid ${N}`, borderRadius: 12,
            padding: 14, fontSize: 14, whiteSpace: "pre-wrap",
          }}>
            {turno.notes}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Pestaña: Contabilidad
// ============================================================================

function ContabilidadTab({
  history,
  weekOverrides,
  frozenWeeks,
}: {
  history: Turno[];
  weekOverrides: WeekOverride[];
  frozenWeeks: FrozenWeek[];
}) {
  type Row = {
    weekId: string;
    isFrozen: boolean;
    numTurnos: number;
    dinero: number;
    totalP: number;
    totalD: number;
    totalA: number;
    totalE: number;
    totalF: number;
    notes: string;
    entregada: boolean;
  };

  const rows = useMemo(() => {
    const map = new Map<string, Row>();

    // Semanas congeladas: copiamos tal cual.
    for (const fw of frozenWeeks) {
      map.set(fw.weekId, {
        weekId: fw.weekId,
        isFrozen: true,
        numTurnos: fw.numTurnos,
        dinero: fw.totales.dinero,
        totalP: fw.totales.totalP,
        totalD: fw.totales.totalD,
        totalA: fw.totales.totalA,
        totalE: fw.totales.totalE,
        totalF: fw.totales.totalF,
        notes: fw.notes,
        entregada: fw.entregada,
      });
    }

    // Turnos activos no congelados: agregamos por semana.
    const frozenIds = new Set(frozenWeeks.flatMap((f) => f.turnoIds));
    for (const t of history) {
      if (frozenIds.has(t.id)) continue;
      const wid = getWeekId(t.date);
      const existing = map.get(wid);
      if (existing && existing.isFrozen) continue;
      if (existing) {
        existing.numTurnos += 1;
        existing.dinero += t.dinero;
        existing.totalP += t.totalP;
        existing.totalD += t.totalD;
        existing.totalA += t.totalA;
        existing.totalE += t.totalE;
        existing.totalF += t.totalF;
      } else {
        const ov = weekOverrides.find((o) => o.weekId === wid);
        map.set(wid, {
          weekId: wid,
          isFrozen: false,
          numTurnos: 1,
          dinero: t.dinero,
          totalP: t.totalP,
          totalD: t.totalD,
          totalA: t.totalA,
          totalE: t.totalE,
          totalF: t.totalF,
          notes: ov?.notes || "",
          entregada: ov?.entregada || false,
        });
      }
    }

    return [...map.values()].sort((a, b) => b.weekId.localeCompare(a.weekId));
  }, [history, weekOverrides, frozenWeeks]);

  if (rows.length === 0) {
    return (
      <div style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: 32 }}>
        Sin actividad para mostrar.
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: NBG, border: `1px solid ${N}`, borderRadius: 12,
        padding: 10, marginBottom: 12, fontSize: 12, color: MUTED,
      }}>
        Los importes son **brutos** (antes de aplicar porcentajes y descuentos). Las semanas marcadas en naranja están congeladas.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.weekId} style={{
            background: r.isFrozen ? ABG : NBG,
            border: `1px solid ${r.isFrozen ? A : N}`,
            borderRadius: 12, padding: 14,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: r.isFrozen ? A : TEXT }}>
                Semana {r.weekId}
                {r.isFrozen && " · congelada"}
                {r.entregada && " · entregada"}
              </div>
              <div style={{ fontSize: 14, color: MUTED }}>{r.numTurnos} turnos</div>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
              <span style={{ color: G, fontWeight: 600 }}>{fmtEuro(r.dinero)}</span>
              <span style={{ color: A }}>P: {fmtEuro(r.totalP)}</span>
              <span style={{ color: MUTED }}>D: {fmtEuro(r.totalD)}</span>
              {r.totalA > 0 && <span style={{ color: MUTED }}>A: {fmtEuro(r.totalA)}</span>}
              {r.totalE > 0 && <span style={{ color: MUTED }}>E: {fmtEuro(r.totalE)}</span>}
              {r.totalF > 0 && <span style={{ color: F }}>F: {fmtEuro(r.totalF)}</span>}
            </div>
            {r.notes && (
              <div style={{
                marginTop: 8, fontSize: 12, color: MUTED, whiteSpace: "pre-wrap",
                paddingTop: 8, borderTop: `1px solid ${BG_APP}`,
              }}>
                {r.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================================
// Pestaña: Calendario (reservas + notas)
// ============================================================================

function CalendarioTab({
  reservations,
  notes,
}: {
  reservations: Reserva[];
  notes: NotaCalendario[];
}) {
  const sortedReservas = useMemo(
    () => [...reservations].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
    }),
    [reservations]
  );
  const sortedNotas = useMemo(
    () => [...notes].sort((a, b) => a.date.localeCompare(b.date)),
    [notes]
  );

  return (
    <>
      <h3 style={{ margin: "0 0 10px", fontSize: 15, color: MUTED }}>
        Reservas ({sortedReservas.length})
      </h3>
      {sortedReservas.length === 0 && (
        <div style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>Sin reservas.</div>
      )}
      {sortedReservas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {sortedReservas.map((r) => (
            <div key={r.id} style={{
              background: NBG, border: `1px solid ${N}`, borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {fmtFecha(r.date)} · {r.time}
              </div>
              <div style={{ fontSize: 13, color: TEXT, marginTop: 4 }}>
                {r.origen || "?"} → {r.destino || "?"}
              </div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                {r.cliente}{r.telefono ? ` · ${r.telefono}` : ""}
              </div>
              {r.notas && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4, fontStyle: "italic" }}>
                  {r.notas}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h3 style={{ margin: "0 0 10px", fontSize: 15, color: MUTED }}>
        Notas ({sortedNotas.length})
      </h3>
      {sortedNotas.length === 0 && (
        <div style={{ color: MUTED, fontSize: 13 }}>Sin notas.</div>
      )}
      {sortedNotas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sortedNotas.map((n) => (
            <div key={n.id} style={{
              background: NBG, border: `1px solid ${N}`, borderRadius: 10, padding: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{fmtFecha(n.date)}</span>
                <span style={{ fontSize: 11, color: A, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {n.tipo}
                </span>
              </div>
              {n.texto && (
                <div style={{ fontSize: 13, color: MUTED, marginTop: 4, whiteSpace: "pre-wrap" }}>
                  {n.texto}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================================================
// Pestaña: Configuración
// ============================================================================

function ConfigTab({ settings }: { settings: AppSettings | null }) {
  if (!settings) {
    return (
      <div style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: 32 }}>
        Este usuario no tiene configuración guardada (usa los valores por defecto).
      </div>
    );
  }
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const filas: Array<[string, string]> = [
    ["Porcentaje jefe", `${settings["porcentaje.jefe"]} %`],
    ["Porcentaje chofer", `${settings["porcentaje.chofer"]} %`],
    ["Descontar datáfono", settings["descontar.datafono"] ? "Sí" : "No"],
    ["Descontar agencia/bono", settings["descontar.agencia_bono"] ? "Sí" : "No"],
    ["Descontar extra", settings["descontar.extra"] ? "Sí" : "No"],
    ["Descontar gasolina", settings["descontar.gasolina"] ? "Sí" : "No"],
    ["Día libre", diasSemana[settings.diaLibre] ?? "—"],
    ["Día libre desde", settings.diaLibreDesde ? fmtFecha(settings.diaLibreDesde) : "—"],
  ];

  return (
    <div style={{
      background: NBG, border: `1px solid ${N}`, borderRadius: 12, padding: 14,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {filas.map(([k, v]) => (
        <div key={k} style={{
          display: "flex", justifyContent: "space-between", fontSize: 14,
          paddingBottom: 6, borderBottom: `1px solid ${BG_APP}`,
        }}>
          <span style={{ color: MUTED }}>{k}</span>
          <span style={{ color: TEXT, fontWeight: 500 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
