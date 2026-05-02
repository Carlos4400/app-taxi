import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

const { useState, useEffect } = React;

interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

interface Jornada {
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
}

interface CurrentState {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
}

const G = "oklch(0.68 0.20 145)";
const GBG = "oklch(0.18 0.07 145)";
const P = "oklch(0.65 0.20 280)";
const PBG = "oklch(0.17 0.07 280)";
const A = "oklch(0.75 0.16 70)";
const ABG = "oklch(0.20 0.06 70)";
const E = "oklch(0.72 0.14 200)";
const EBG = "oklch(0.19 0.05 200)";
const F = "oklch(0.70 0.18 25)";
const FBG = "oklch(0.19 0.06 25)";
const N = "oklch(0.62 0.06 260)";
const NBG = "oklch(0.18 0.03 260)";

const KEY_CURRENT = "taxi_current_v3";
const KEY_HISTORY = "taxi_history_v3";
const APP_VERSION = "1.0.1";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function timeNow(): string {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmt(n: number): string {
  return n.toFixed(2).replace(".", ",") + " €";
}
function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (/[";\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildHistoryCSV(jornadas: Jornada[]): string {
  const header = [
    "fecha",
    "inicio",
    "fin",
    "tipo",
    "importe",
    "nota",
    "hora_entrada",
    "dinero_total_jornada",
    "km_jornada",
    "notas_jornada",
  ];
  const rows: string[] = [header.join(";")];

  for (const j of jornadas) {
    if (j.entries.length === 0) {
      rows.push(
        [
          j.date,
          j.startTime ?? "",
          j.endTime ?? "",
          "",
          "",
          "",
          "",
          (j.dinero ?? 0).toFixed(2).replace(".", ","),
          (j.km ?? 0).toString().replace(".", ","),
          j.notes ?? "",
        ].map(csvEscape).join(";")
      );
      continue;
    }
    for (const e of j.entries) {
      rows.push(
        [
          j.date,
          j.startTime ?? "",
          j.endTime ?? "",
          e.type,
          e.amount.toFixed(2).replace(".", ","),
          e.note ?? "",
          e.time ?? "",
          (j.dinero ?? 0).toFixed(2).replace(".", ","),
          (j.km ?? 0).toString().replace(".", ","),
          j.notes ?? "",
        ].map(csvEscape).join(";")
      );
    }
  }
  // BOM UTF-8 para que Excel reconozca los acentos.
  return "﻿" + rows.join("\r\n");
}

async function exportHistoryCSV(jornadas: Jornada[]): Promise<void> {
  const csv = buildHistoryCSV(jornadas);
  const filename = `mi-turno-${today()}.csv`;

  // En Capacitor (APK Android) usamos Filesystem + Share porque
  // el truco <a download> no funciona dentro del WebView nativo.
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data: csv,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
      try {
        await Share.share({
          title: "Historial Mi Turno",
          text: "Exportación CSV de jornadas",
          url: result.uri,
          dialogTitle: "Compartir CSV",
        });
      } catch (shareErr) {
        // Si el usuario cancela o no hay app de compartir, al menos el
        // archivo ya está guardado en Documents.
        alert("CSV guardado en Documentos del dispositivo:\n" + filename);
      }
    } catch (e) {
      alert("No se pudo exportar el CSV: " + (e as Error).message);
    }
    return;
  }

  // Navegador (PWA): descarga clásica con <a download>.
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function loadCurrent(): CurrentState {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_CURRENT)!);
    if (d) return d;
  } catch (e) { }
  return { entries: [], startTime: null, startDate: null };
}
function loadHistory(): Jornada[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY_HISTORY)!);
    if (Array.isArray(d)) return d;
  } catch (e) { }
  return [];
}

const IconCoin = ({ s = 24, c = G }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fill={c}
      fontSize="11"
      fontWeight="700"
      fontFamily="Outfit,sans-serif"
    >
      €
    </text>
  </svg>
);

const IconCard = ({ s = 24, c = P }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect
      x="3"
      y="6"
      width="18"
      height="13"
      rx="2.5"
      stroke={c}
      strokeWidth="1.8"
    />
    <rect x="3" y="10" width="18" height="3.5" fill={c} opacity="0.35" />
    <rect x="6" y="15.5" width="5" height="1.5" rx="0.75" fill={c} />
  </svg>
);
const IconBack = () => (
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
const IconHistory = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect
      x="3"
      y="4"
      width="16"
      height="14"
      rx="3"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.7"
    />
    <line
      x1="7"
      y1="9"
      x2="15"
      y2="9"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="7"
      y1="13"
      x2="12"
      y2="13"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
const IconDel = () => (
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
const IconAgency = ({ s = 24, c = A }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path
      d="M4 20V9L12 4L20 9V20"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M9 20V14H15V20"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M3 20H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const IconExtra = ({ s = 24, c = E }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 4V20M4 12H20"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" opacity="0.5" />
  </svg>
);
const IconFuel = ({ s = 24, c = F }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect
      x="4"
      y="6"
      width="11"
      height="14"
      rx="2"
      stroke={c}
      strokeWidth="1.8"
    />
    <path
      d="M15 10L18 8V16L15 14"
      stroke={c}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <rect x="7" y="9" width="5" height="4" rx="1" fill={c} opacity="0.4" />
  </svg>
);
const IconNulo = ({ s = 24, c = N }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <path d="M6 18L18 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

function Shell({
  children,
  burst,
}: {
  children: React.ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {burst && <Burst />}
      {children}
    </div>
  );
}

function Burst() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 22 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "-8px",
            left: `${5 + Math.random() * 90}%`,
            width: 7,
            height: 7,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: [G, P, "white", "oklch(0.85 0.18 80)"][i % 4],
            animation: `fall ${0.55 + Math.random() * 0.45}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const [current, setCurrent] = useState<CurrentState>(loadCurrent);
  const [history, setHistory] = useState<Jornada[]>(loadHistory);
  const [screen, setScreen] = useState("home");
  const [burst, setBurst] = useState(false);
  const [viewJornada, setViewJornada] = useState<Jornada | null>(null);
  const [activeField, setActiveField] = useState("propina");
  const [valP, setValP] = useState("");
  const [valD, setValD] = useState("");
  const [noteP, setNoteP] = useState("");
  const [noteD, setNoteD] = useState("");
  const [singleMode, setSingleMode] = useState<string | null>(null);
  const [valS, setValS] = useState("");
  const [noteS, setNoteS] = useState("");
  const [dineroJ, setDineroJ] = useState("");
  const [kmJ, setKmJ] = useState("");
  const [endField, setEndField] = useState<"dinero" | "km">("dinero");
  const [notesJ, setNotesJ] = useState("");
  const [editJ, setEditJ] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ text: string; onConfirm: () => void } | null>(null);
  const [updateMsg, setUpdateMsg] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [editEntryAmount, setEditEntryAmount] = useState("");
  const [editEntryNote, setEditEntryNote] = useState("");

  function openEditEntry(e: Entry) {
    setEditEntry(e);
    setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
    setEditEntryNote(e.note || "");
  }

  function saveEditEntry() {
    if (!editEntry) return;
    const amt = parseFloat(editEntryAmount.replace(",", "."));
    if (isNaN(amt) || amt <= 0) {
      alert("El importe debe ser un número mayor que 0.");
      return;
    }
    setCurrent((prev) => ({
      ...prev,
      entries: prev.entries.map((x) =>
        x.id === editEntry.id
          ? { ...x, amount: amt, note: editEntryNote.trim() }
          : x
      ),
    }));
    setEditEntry(null);
  }

  function deleteEditEntry() {
    if (!editEntry) return;
    setCurrent((prev) => ({
      ...prev,
      entries: prev.entries.filter((x) => x.id !== editEntry.id),
    }));
    setEditEntry(null);
  }

  useEffect(() => {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(current));
  }, [current]);
  useEffect(() => {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  const propinas = current.entries.filter((e) => e.type === "propina");
  const datafonos = current.entries.filter((e) => e.type === "datafono");
  const agencias = current.entries.filter((e) => e.type === "agencia");
  const extras = current.entries.filter((e) => e.type === "extra");
  const gasolinas = current.entries.filter((e) => e.type === "gasolina");
  const nulos = current.entries.filter((e) => e.type === "nulo");
  const totalP = propinas.reduce((s, e) => s + e.amount, 0);
  const totalD = datafonos.reduce((s, e) => s + e.amount, 0);
  const totalA = agencias.reduce((s, e) => s + e.amount, 0);
  const totalE = extras.reduce((s, e) => s + e.amount, 0);
  const totalF = gasolinas.reduce((s, e) => s + e.amount, 0);
  const totalN = nulos.reduce((s, e) => s + e.amount, 0);
  const active = current.entries.length > 0 || !!current.startTime;

  function handleDelete(id: number) {
    setCurrent((d) => ({
      ...d,
      entries: d.entries.filter((e) => e.id !== id),
    }));
  }

  function handleEndJornada() {
    const jornada = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: current.entries,
      totalP,
      totalD,
      totalA,
      totalE,
      totalF,
      totalN,
      dinero: parseFloat(dineroJ.replace(",", ".")) || 0,
      km: parseFloat(kmJ.replace(",", ".")) || 0,
      notes: notesJ.trim(),
      startDate: current.startDate,
    };
    setHistory((h) => [jornada, ...h]);
    setCurrent({ entries: [], startTime: null, startDate: null });
    setDineroJ("");
    setKmJ("");
    setNotesJ("");
    setViewJornada(jornada);
    setScreen("summary");
  }

  async function checkUpdate() {
    setUpdateMsg("Buscando actualizaciones...");
    setDownloadUrl("");
    try {
      const res = await fetch("https://api.github.com/repos/Carlos4400/app-taxi/releases/latest");
      if (!res.ok) throw new Error("No se encontró el release");
      const data = await res.json();
      const latestVersion = data.tag_name ? data.tag_name.replace(/[^0-9.]/g, '') : null;

      if (latestVersion && latestVersion !== APP_VERSION) {
        setUpdateMsg(`¡Nueva versión ${latestVersion} disponible!`);
        if (data.assets && data.assets.length > 0) {
          setDownloadUrl(data.assets[0].browser_download_url);
        } else {
          setDownloadUrl(data.html_url);
        }
      } else {
        setUpdateMsg("Tienes la última versión instalada.");
      }
    } catch (e) {
      setUpdateMsg("Error al conectar con GitHub.");
    }
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
    keyBtn: {
      border: "none",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    dangerBtn: {
      padding: "16px 0",
      borderRadius: 18,
      border: "none",
      background: "rgba(255,60,60,0.1)",
      color: "rgba(255,80,80,0.7)",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer",
      marginTop: 10,
    },
  };

  if (screen === "home") {
    const hasActive = current.entries.length > 0 || !!current.startTime;
    const totalHoy = totalP + totalD + totalA + totalE;
    return (
      <Shell burst={false}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "32px 28px 48px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 18 }}>
              🚕
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-1.5px",
              }}
            >
              Mi Turno
            </div>
            <div
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.35)",
                marginTop: 10,
                textTransform: "capitalize",
              }}
            >
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => setScreen("main")}
              style={{
                padding: "20px 0",
                borderRadius: 20,
                border: "none",
                background: GBG,
                color: G,
                outline: `1.5px solid ${G}55`,
                fontSize: 18,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>{hasActive ? "▶" : "🚀"}</span>
              {hasActive ? "Continuar jornada" : "Iniciar jornada"}
            </button>
            <button
              onClick={() => setScreen("pastHistory")}
              style={{
                padding: "18px 0",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>📋</span>
              Jornadas anteriores
            </button>
          </div>
        </div>
        <button
          onClick={() => setScreen("settings")}
          style={{
            position: "absolute",
            bottom: 32,
            right: 28,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22
          }}
        >
          ⚙️
        </button>
      </Shell>
    );
  }

  if (screen === "settings") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("home"); setUpdateMsg(""); setDownloadUrl(""); }}><IconBack /></button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Ajustes</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚕</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Mi Turno</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Versión {APP_VERSION}</div>

            <button
              onClick={checkUpdate}
              style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            >
              🔄 Buscar actualizaciones
            </button>

            {updateMsg && (
              <div style={{ marginTop: 16, fontSize: 14, color: updateMsg.includes("Nueva") ? "oklch(0.68 0.20 145)" : "rgba(255,255,255,0.6)", fontWeight: updateMsg.includes("Nueva") ? 700 : 400, background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 12 }}>
                {updateMsg}
              </div>
            )}

            {downloadUrl && (
              <button
                onClick={() => window.open(downloadUrl, "_blank")}
                style={{ width: "100%", padding: "14px 0", marginTop: 12, borderRadius: 16, border: "none", background: "oklch(0.68 0.20 145)", color: "black", fontSize: 16, fontWeight: 800, cursor: "pointer" }}
              >
                ⬇️ Descargar nueva versión
              </button>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === 'summary' && viewJornada) {
    const vP = viewJornada.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
    const vD = viewJornada.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0);
    const isToday = viewJornada.date === today();
    const vA = viewJornada.entries.filter((e: any) => e.type === 'agencia').reduce((s: number, e: any) => s + e.amount, 0);
    const vE = viewJornada.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0);
    const vF = viewJornada.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0);
    const vN = viewJornada.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0);
    const dineroV = viewJornada.dinero || 0;
    const kmV = viewJornada.km || 0;
    const totalGeneral = vP + vD + vA + vE + dineroV;
    const eurKm = kmV > 0 ? totalGeneral / kmV : 0;
    const cats = [
      { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: vD, count: viewJornada.entries.filter((e: any) => e.type === 'datafono').length },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: vP, count: viewJornada.entries.filter((e: any) => e.type === 'propina').length },
      { key: 'agencia', label: 'Agencias', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: vA, count: viewJornada.entries.filter((e: any) => e.type === 'agencia').length },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: vE, count: viewJornada.entries.filter((e: any) => e.type === 'extra').length },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={18} c={F} />, total: vF, count: viewJornada.entries.filter((e: any) => e.type === 'gasolina').length },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: vN, count: viewJornada.entries.filter((e: any) => e.type === 'nulo').length },
    ];
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={S.iconBtn} onClick={() => { setScreen(isToday ? 'home' : 'pastHistory'); setViewJornada(null); }}><IconBack /></button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Resumen de jornada</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize', marginTop: 1 }}>
                {viewJornada.startDate && viewJornada.startDate !== viewJornada.date
                     ? <>{fmtDate(viewJornada.startDate)} {viewJornada.startTime} – {fmtDate(viewJornada.date)} {viewJornada.endTime}</>
                     : <>{fmtDate(viewJornada.date)} · {viewJornada.startTime} – {viewJornada.endTime}</>}
              </div>
            </div>
            <button style={{ ...S.iconBtn, background: 'rgba(255,255,255,0.09)' }} onClick={() => {
              setEditJ({ ...viewJornada, entries: [...viewJornada.entries] });
              setScreen('editJornada');
            }}>
              <span style={{ fontSize: 16 }}>✏️</span>
            </button>
          </div>

          {/* Dinero / KM */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.60 0.16 150 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>€ Dinero</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'oklch(0.78 0.18 150)', letterSpacing: '-0.5px' }}>{fmt(dineroV)}</div>
            </div>
            <div style={{ flex: 1, background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px 16px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>→ KM</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'oklch(0.80 0.14 220)', letterSpacing: '-0.5px' }}>{kmV.toString().replace('.', ',')} <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6 }}>km</span></div>
            </div>
          </div>

          {/* Categorías + Notas */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {cats.map(c => (
                <div key={c.key} style={{ background: c.bg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${c.color}33` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    {c.icon}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{c.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c.color, letterSpacing: '-0.5px' }}>{fmt(c.total)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{c.count} {c.count === 1 ? 'entrada' : 'entradas'}</div>
                </div>
              ))}
            </div>

            {viewJornada.notes && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Notas</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{viewJornada.notes}</div>
              </div>
            )}
            {!viewJornada.notes && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Notas</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Sin notas</div>
              </div>
            )}
          </div>

          {isToday && (
            <button onClick={() => setScreen('home')}
              style={{ marginTop: 4, padding: '17px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Volver al inicio
            </button>
          )}
        </div>
      </Shell>
    );
  }

  // ── EDIT JORNADA SCREEN ───────────────────────────────────────
  if (screen === 'editJornada' && editJ) {
    function saveEdit() {
      const finalDinero = editJ.dineroStr !== undefined
        ? parseFloat(editJ.dineroStr.replace(',', '.')) || 0
        : (editJ.dinero || 0);
      const finalKm = editJ.kmStr !== undefined
        ? parseFloat(editJ.kmStr.replace(',', '.')) || 0
        : (editJ.km || 0);
      const updated = {
        ...editJ,
        dinero: finalDinero,
        km: finalKm,
        dineroStr: undefined,
        kmStr: undefined,
        totalP: editJ.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0),
        totalD: editJ.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0),
        totalA: editJ.entries.filter((e: any) => e.type === 'agencia').reduce((s: number, e: any) => s + e.amount, 0),
        totalE: editJ.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0),
        totalF: editJ.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0),
        totalN: editJ.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0),
      };
      setHistory((h: any[]) => h.map((j: any) => j.id === updated.id ? updated : j));
      setViewJornada(updated);
      setEditJ(null);
      setScreen('summary');
    }
    const eDinero = editJ.dineroStr !== undefined ? editJ.dineroStr : (editJ.dinero || 0).toString().replace('.', ',');
    const eKm = editJ.kmStr !== undefined ? editJ.kmStr : (editJ.km || 0).toString().replace('.', ',');
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px 32px', overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button style={S.iconBtn} onClick={() => { setEditJ(null); setScreen('summary'); }}><IconBack /></button>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Editar jornada</span>
          </div>

          {/* Dinero / KM */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px', border: '1px solid oklch(0.60 0.16 150 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>€ Dinero</div>
              <input inputMode="decimal" value={eDinero} onChange={e => setEditJ({ ...editJ, dineroStr: e.target.value.replace(/[^0-9,\.]/g, '') })}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'oklch(0.78 0.18 150)', fontSize: 22, fontWeight: 900, width: '100%' }} />
            </div>
            <div style={{ flex: 1, background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px', border: '1px solid oklch(0.65 0.14 220 / 0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>→ KM</div>
              <input inputMode="decimal" value={eKm} onChange={e => setEditJ({ ...editJ, kmStr: e.target.value.replace(/[^0-9,\.]/g, '') })}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'oklch(0.80 0.14 220)', fontSize: 22, fontWeight: 900, width: '100%' }} />
            </div>
          </div>

          {/* Entradas editables */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: '14px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Entradas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {editJ.entries.map((e: any) => {
                const meta = e.type === 'propina' ? { col: G, lbl: 'Propina' }
                  : e.type === 'datafono' ? { col: P, lbl: 'Datáfono' }
                    : e.type === 'agencia' ? { col: A, lbl: 'Agencia' }
                      : e.type === 'extra' ? { col: E, lbl: 'Extra' }
                        : e.type === 'gasolina' ? { col: F, lbl: 'Gasolina' }
                          : { col: N, lbl: 'Nulo' };
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.col, minWidth: 60 }}>{meta.lbl}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{fmt(e.amount)}</span>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {e.note}
                    </div>
                    <button onClick={() => setEditJ({ ...editJ, entries: editJ.entries.filter((x: any) => x.id !== e.id) })}
                      style={{ background: 'rgba(255,60,60,0.12)', border: 'none', borderRadius: 7, color: 'rgba(255,80,80,0.7)', fontSize: 11, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                );
              })}
              {editJ.entries.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13, padding: '10px 0' }}>Sin entradas</div>}
            </div>

            {/* Formulario para añadir nueva entrada */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>+ Añadir entrada olvidada</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    value={editJ.newType || 'datafono'}
                    onChange={e => setEditJ({ ...editJ, newType: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '8px', fontSize: 13, outline: 'none' }}>
                    <option value="datafono">Datáfono</option>
                    <option value="propina">Propina</option>
                    <option value="agencia">Agencias</option>
                    <option value="extra">Extras</option>
                    <option value="gasolina">Gasolina</option>
                    <option value="nulo">Nulos</option>
                  </select>
                  <input
                    placeholder="0,00"
                    inputMode="decimal"
                    value={editJ.newAmount || ''}
                    onChange={e => setEditJ({ ...editJ, newAmount: e.target.value.replace(/[^0-9,\.]/g, '') })}
                    style={{ flex: 1, minWidth: 60, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '8px 10px', fontSize: 14, outline: 'none' }}
                  />
                  <button
                    onClick={() => {
                      const amt = parseFloat((editJ.newAmount || '').replace(',', '.'));
                      if (amt > 0) {
                        const noteText = editJ.newNote ? editJ.newNote.trim() : '';
                        const newEntry = {
                          id: Date.now(),
                          type: editJ.newType || 'datafono',
                          amount: amt,
                          note: noteText,
                          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        };

                        let updatedNotes = editJ.notes || '';
                        if (noteText) {
                          updatedNotes = updatedNotes ? updatedNotes + '\n' + noteText : noteText;
                        }

                        setEditJ({
                          ...editJ,
                          entries: [newEntry, ...editJ.entries],
                          notes: updatedNotes,
                          newAmount: '',
                          newNote: ''
                        });
                      }
                    }}
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 8, padding: '0 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Añadir
                  </button>
                </div>
                <input
                  placeholder="Nota opcional..."
                  value={editJ.newNote || ''}
                  onChange={e => setEditJ({ ...editJ, newNote: e.target.value })}
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '8px 10px', fontSize: 13, outline: 'none', width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Notas</div>
            <textarea value={editJ.notes} onChange={e => setEditJ({ ...editJ, notes: e.target.value })} placeholder="Notas..." rows={3}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 15, width: '100%', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={saveEdit}
              style={{ padding: '18px 0', borderRadius: 18, border: 'none', background: GBG, color: G, outline: `1.5px solid ${G}55`, fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>
              Guardar cambios
            </button>
            <button onClick={() => { setEditJ(null); setScreen('summary'); }}
              style={{ padding: '16px 0', borderRadius: 18, border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={() => {
                setConfirmDialog({
                  text: "¿Seguro que quieres eliminar esta jornada completa? Esta acción no se puede deshacer.",
                  onConfirm: () => {
                    setHistory((h) => h.filter((j) => j.id !== editJ.id));
                    setEditJ(null);
                    setViewJornada(null);
                    setScreen("pastHistory");
                  }
                });
              }}
              style={S.dangerBtn}
            >
              Borrar jornada
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "addSingle" && singleMode) {
    const cfg = {
      agencia: { accent: A, bg: ABG, label: "Agencia", Icon: IconAgency },
      extra: { accent: E, bg: EBG, label: "Extra", Icon: IconExtra },
      gasolina: { accent: F, bg: FBG, label: "Gasolina", Icon: IconFuel },
      nulo: { accent: N, bg: NBG, label: "Nulo", Icon: IconNulo },
    }[singleMode] || { accent: E, bg: EBG, label: "Extra", Icon: IconExtra };
    const { accent, Icon } = cfg;
    const accentBg = cfg.bg;
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
        type: singleMode!,
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
        <div style={{ flex: 1, padding: "12px 20px" }}>
          <button style={S.iconBtn} onClick={() => { setScreen("main"); setSingleMode(null); setValS(""); setNoteS(""); }}>
            <IconBack />
          </button>
          <div style={{ fontSize: 40, fontWeight: 900, color: accent, margin: "20px 0" }}>
            {valS || "0"}€
          </div>
          <input
            placeholder="Nota (opcional)"
            value={noteS}
            onChange={(e) => setNoteS(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "none", color: "white", outline: "none" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 20 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
              <button key={k} onClick={() => kpS(k)} style={{ ...S.keyBtn, padding: 15, background: "rgba(255,255,255,0.05)", color: "white", fontSize: 20, fontWeight: 700 }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>
          <button onClick={saveS} style={{ width: "100%", padding: 15, marginTop: 20, borderRadius: 12, border: "none", background: accent, color: "black", fontWeight: 700 }}>
            Guardar
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "add") {
    const setVal = activeField === "propina" ? setValP : setValD;
    const curVal = activeField === "propina" ? valP : valD;

    function kpAdd(v: string) {
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
        <div style={{ flex: 1, padding: "16px 20px 40vh", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button style={S.iconBtn} onClick={() => setScreen("main")}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
              Añadir entrada
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div
              onClick={() => setActiveField("propina")}
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
              <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "propina" ? G : "white" }}>{valP || "0"}€</div>
            </div>
            <div
              onClick={() => setActiveField("datafono")}
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
              <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "datafono" ? P : "white" }}>{valD || "0"}€</div>
            </div>
          </div>

          <input
            placeholder={`Nota para ${activeField} (opcional)`}
            value={activeField === "propina" ? noteP : noteD}
            onChange={(e) => activeField === "propina" ? setNoteP(e.target.value) : setNoteD(e.target.value)}
            style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "none", color: "white", marginBottom: 20, outline: "none" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 20 }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
              <button key={k} onClick={() => kpAdd(k)} style={{ ...S.keyBtn, padding: 16, background: "rgba(255,255,255,0.05)", fontSize: 20, fontWeight: 700, color: "white" }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>

          <button onClick={handleSaveAdd} style={{ width: "100%", padding: 18, marginTop: 20, borderRadius: 16, border: "none", background: activeField === "propina" ? G : P, color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer" }}>
            Guardar
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "pastHistory") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <button style={S.iconBtn} onClick={() => setScreen("home")}>
              <IconBack />
            </button>
            <div style={{ flex: 1, fontSize: 24, fontWeight: 800, color: "white" }}>
              Jornadas anteriores
            </div>
            {history.length > 0 && (
              <button
                onClick={() => exportHistoryCSV(history)}
                title="Exportar historial a CSV"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "rgba(255,255,255,0.75)",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>⬇</span>
                CSV
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40, fontSize: 15 }}>
              No hay jornadas anteriores.
            </div>
          ) : (
            history.map((j) => (
              <div
                key={j.id}
                onClick={() => {
                  setViewJornada(j);
                  setScreen("summary");
                }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 16,
                  padding: 16,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(j.date)}</div>
                  <div style={{ fontWeight: 900, color: G, fontSize: 18 }}>{fmt(j.dinero || (j.totalP + j.totalD + j.totalA + j.totalE))}</div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {j.startTime} - {j.endTime} · {j.entries.length} entradas
                </div>
              </div>
            ))
          )}
        </div>
      </Shell>
    );
  }

  if (screen === "todayHistory") {
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...current.entries].reverse().map((e) => {
              const meta =
                e.type === "propina"
                  ? { col: G, ic: <IconCoin s={17} c={G} />, lbl: "Propina" }
                  : e.type === "datafono"
                    ? { col: P, ic: <IconCard s={17} c={P} />, lbl: "Datáfono" }
                    : e.type === "agencia"
                      ? { col: A, ic: <IconAgency s={17} c={A} />, lbl: "Agencia" }
                      : e.type === "extra"
                        ? { col: E, ic: <IconExtra s={17} c={E} />, lbl: "Extra" }
                        : e.type === "nulo"
                          ? { col: N, ic: <IconNulo s={17} c={N} />, lbl: "Nulo" }
                          : { col: F, ic: <IconFuel s={17} c={F} />, lbl: "Gasolina" };
              return (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 13,
                    padding: "10px 14px",
                  }}
                >
                  {meta.ic}
                  <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                    {meta.lbl}
                    {e.note && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}> · {e.note}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginRight: 8 }}>{e.time}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: meta.col }}>+{fmt(e.amount)}</span>
                  <button
                    onClick={() => { setScreen("main"); setTimeout(() => openEditEntry(e), 50); }}
                    title="Editar entrada"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "none",
                      borderRadius: 7,
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      cursor: "pointer",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 8,
                    }}
                  >
                    ✏️
                  </button>
                </div>
              );
            })}
          </div>
          {current.entries.length > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  text: "¿Seguro que quieres borrar TODAS las entradas de hoy?",
                  onConfirm: () => {
                    setCurrent({ entries: [], startTime: current.startTime, startDate: current.startDate });
                    setScreen("main");
                  }
                });
              }}
              style={S.dangerBtn}
            >
              Borrar todas las entradas
            </button>
          )}
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

  if (screen === "confirmEnd") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 20px 32px", overflowY: "auto", animation: "slideIn 0.25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <button style={S.iconBtn} onClick={() => setScreen("main")}><IconBack /></button>
            <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Terminar jornada</span>
          </div>

          {/* Dinero / KM inputs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: "oklch(0.20 0.06 150)", borderRadius: 16, padding: "14px", border: "1px solid oklch(0.60 0.16 150 / 0.35)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>€ Dinero</div>
              <input inputMode="decimal" value={dineroJ} onChange={e => setDineroJ(e.target.value.replace(/[^0-9,\.]/g, ""))} placeholder="0"
                style={{ background: "transparent", border: "none", outline: "none", color: "oklch(0.78 0.18 150)", fontSize: 22, fontWeight: 900, width: "100%", letterSpacing: "-0.5px" }} />
            </div>
            <div style={{ flex: 1, background: "oklch(0.19 0.05 220)", borderRadius: 16, padding: "14px", border: "1px solid oklch(0.65 0.14 220 / 0.35)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>→ KM</div>
              <input inputMode="decimal" value={kmJ} onChange={e => setKmJ(e.target.value.replace(/[^0-9,\.]/g, ""))} placeholder="0"
                style={{ background: "transparent", border: "none", outline: "none", color: "oklch(0.80 0.14 220)", fontSize: 22, fontWeight: 900, width: "100%", letterSpacing: "-0.5px" }} />
            </div>
          </div>

          {/* Resumen previo */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>
              Resumen de hoy
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: PBG, borderRadius: 16, padding: "14px", border: `1px solid ${P}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconCard s={16} c={P} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Datáfono</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: P, letterSpacing: "-0.5px" }}>{fmt(totalD)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{datafonos.length} entrada{datafonos.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: GBG, borderRadius: 16, padding: "14px", border: `1px solid ${G}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconCoin s={16} c={G} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Propinas</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: G, letterSpacing: "-0.5px" }}>{fmt(totalP)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{propinas.length} entrada{propinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: ABG, borderRadius: 16, padding: "14px", border: `1px solid ${A}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconAgency s={16} c={A} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: A, letterSpacing: "-0.5px" }}>{fmt(totalA)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{agencias.length} entrada{agencias.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: EBG, borderRadius: 16, padding: "14px", border: `1px solid ${E}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconExtra s={16} c={E} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Extras</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: E, letterSpacing: "-0.5px" }}>{fmt(totalE)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{extras.length} entrada{extras.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: FBG, borderRadius: 16, padding: "14px", border: `1px solid ${F}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconFuel s={16} c={F} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Gasolina</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: F, letterSpacing: "-0.5px" }}>{fmt(totalF)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{gasolinas.length} entrada{gasolinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: NBG, borderRadius: 16, padding: "14px", border: `1px solid ${N}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <IconNulo s={16} c={N} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Nulos</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: N, letterSpacing: "-0.5px" }}>{fmt(totalN)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{nulos.length} entrada{nulos.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            {current.startTime && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 14, textAlign: "center" }}>
                Jornada iniciada a las {current.startTime}
              </div>
            )}
          </div>

          {/* Notas */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>📝 Notas</div>
            <textarea value={notesJ} onChange={e => setNotesJ(e.target.value)} placeholder="Añade notas de la jornada..." rows={3}
              style={{ background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.9)", fontSize: 15, width: "100%", resize: "none", fontFamily: "inherit", lineHeight: 1.4 }} />
          </div>

          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 16, lineHeight: 1.6 }}>
            ¿Seguro que quieres cerrar la jornada?<br />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.22)" }}>Se guardará en el historial.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleEndJornada}
              style={{ padding: "18px 0", borderRadius: 18, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 17, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
              Sí, terminar jornada
            </button>
            <button onClick={() => setScreen("main")}
              style={{ padding: "16px 0", borderRadius: 18, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell burst={burst}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 20px 24px",
          overflowY: "hidden",
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.3px",
                lineHeight: 1.1,
              }}
            >
              🚕{" "}
              {new Date()
                .toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
                .replace(/(^\w|\s\w)/g, (c) => c.toUpperCase())}
            </div>
            {active && current.startTime && (
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 4,
                }}
              >
{(() => {
                       const dateToUse = current.startDate || today();
                       const [d, m, y] = dateToUse.split("-").reverse();
                       return `${d}/${m}/${y} desde ${current.startTime}`;
                     })()}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={S.iconBtn}
              onClick={() => setScreen("home")}
              title="Inicio"
            >
              <span style={{ fontSize: 18 }}>🏠</span>
            </button>
            {history.length > 0 && (
              <button
                style={S.iconBtn}
                onClick={() => setScreen("pastHistory")}
                title="Jornadas anteriores"
              >
                <IconHistory />
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
          <MainCard
            label="Datáfono"
            color={P}
            bg={PBG}
            total={totalD}
            count={datafonos.length}
            icon={<IconCard s={26} c={P} />}
            disabled={!current.startTime}
            onClick={() => {
              setActiveField("datafono");
              setScreen("add");
            }}
          />
          <MainCard
            label="Propinas"
            color={G}
            bg={GBG}
            total={totalP}
            count={propinas.length}
            icon={<IconCoin s={26} c={G} />}
            disabled={!current.startTime}
            onClick={() => {
              setActiveField("propina");
              setScreen("add");
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
          <SmallCard
            label="Agencias"
            color={A}
            bg={ABG}
            total={totalA}
            icon={<IconAgency s={18} c={A} />}
            disabled={!current.startTime}
            onClick={() => {
              setSingleMode("agencia");
              setScreen("addSingle");
            }}
          />
          <SmallCard
            label="Extras"
            color={E}
            bg={EBG}
            total={totalE}
            icon={<IconExtra s={18} c={E} />}
            disabled={!current.startTime}
            onClick={() => {
              setScreen("addSingle");
              setSingleMode("extra");
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <SmallCard
            label="Gasolina"
            color={F}
            bg={FBG}
            total={totalF}
            icon={<IconFuel s={18} c={F} />}
            disabled={!current.startTime}
            onClick={() => {
              setSingleMode("gasolina");
              setScreen("addSingle");
            }}
          />
          <SmallCard
            label="Nulos"
            color={N}
            bg={NBG}
            total={totalN}
            icon={<IconNulo s={18} c={N} />}
            disabled={!current.startTime}
            onClick={() => {
              setSingleMode("nulo");
              setScreen("addSingle");
            }}
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
            }}
          >
            Últimas entradas
          </div>
          {current.entries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "24px 0",
                color: "rgba(255,255,255,0.18)",
                fontSize: 14,
                lineHeight: 1.7,
              }}
            >
              {current.startTime ? (
                <div>
                  Jornada iniciada a las {current.startTime}.<br />
                  Pulsa un botón para añadir tu primera entrada.
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => {
                      setCurrent({
                        ...current,
                        startTime: new Date().toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                        startDate: today(),
                      });
                      setBurst(true);
                      setTimeout(() => setBurst(false), 800);
                    }}
                    style={{
                      padding: "14px 24px",
                      borderRadius: 16,
                      background: "rgba(60,255,100,0.1)",
                      color: "rgba(60,255,100,0.9)",
                      border: "1px solid rgba(60,255,100,0.2)",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🚀 Iniciar jornada
                  </button>
                  <div style={{ marginTop: 14, fontSize: 13 }}>
                    Pulsa para comenzar tu jornada.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, overflowY: "auto", paddingRight: 4 }}>
              {[...current.entries]
                .reverse()
                .map((e) => {
                  const meta =
                    e.type === "propina"
                      ? { col: G, ic: <IconCoin s={17} c={G} />, lbl: "Propina" }
                      : e.type === "datafono"
                        ? {
                          col: P,
                          ic: <IconCard s={17} c={P} />,
                          lbl: "Datáfono",
                        }
                        : e.type === "agencia"
                          ? {
                            col: A,
                            ic: <IconAgency s={17} c={A} />,
                            lbl: "Agencia",
                          }
                          : e.type === "extra"
                            ? {
                              col: E,
                              ic: <IconExtra s={17} c={E} />,
                              lbl: "Extra",
                            }
                            : e.type === "nulo"
                              ? {
                                col: N,
                                ic: <IconNulo s={17} c={N} />,
                                lbl: "Nulo",
                              }
                              : {
                                col: F,
                                ic: <IconFuel s={17} c={F} />,
                                lbl: "Gasolina",
                              };
                  return (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 13,
                        padding: "9px 13px",
                        animation: "fadeUp 0.2s ease",
                      }}
                    >
                      {meta.ic}
                      <div
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        {meta.lbl}
                        {e.note && (
                          <span
                            style={{
                              color: "rgba(255,255,255,0.28)",
                              fontSize: 12,
                            }}
                          >
                            {" "}
                            · {e.note}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.22)",
                          marginRight: 6,
                        }}
                      >
                        {e.time}
                      </span>
                      <span
                        style={{ fontSize: 15, fontWeight: 700, color: meta.col }}
                      >
                        +{fmt(e.amount)}
                      </span>
                      <button
                        onClick={() => openEditEntry(e)}
                        title="Editar entrada"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "none",
                          borderRadius: 7,
                          color: "rgba(255,255,255,0.7)",
                          fontSize: 12,
                          cursor: "pointer",
                          width: 24,
                          height: 24,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 6,
                        }}
                      >
                        ✏️
                      </button>
                    </div>
                  );
                })}
              {current.entries.length > 4 && (
                <button
                  onClick={() => setScreen("todayHistory")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.22)",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "4px 0",
                    textAlign: "left",
                  }}
                >
                  Ver todas ({current.entries.length}) →
                </button>
              )}
            </div>
          )}
        </div>

        {active && (
          <button
            onClick={() => {
              const autoNotes = current.entries
                .filter((e) => e.note)
                .map((e) => e.note)
                .join("\n");
              setNotesJ(autoNotes);
              setScreen("confirmEnd");
            }}
            style={{
              marginTop: 10,
              padding: "15px 0",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Terminar jornada
          </button>
        )}
      </div>
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
    </Shell>
  );
}

function SmallCard({
  label,
  color,
  bg,
  total,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        flex: 1,
        background: bg,
        borderRadius: 16,
        padding: "12px 14px",
        border: `1px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        transition: "all 0.15s",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
      }}
    >
      {icon}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color,
            letterSpacing: "-0.3px",
            marginTop: 2,
          }}
        >
          {total.toFixed(2).replace(".", ",")}€
        </div>
      </div>
    </div>
  );
}

function MainCard({
  label,
  color,
  bg,
  total,
  count,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  bg: string;
  total: number;
  count: number;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        flex: 1,
        background: bg,
        borderRadius: 22,
        padding: "20px 18px",
        border: `1px solid ${color}33`,
        cursor: disabled ? "default" : onClick ? "pointer" : "default",
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
        filter: disabled ? "grayscale(0.4)" : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {icon}
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "rgba(255,255,255,0.50)",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 900,
          color,
          letterSpacing: "-1px",
          lineHeight: 1,
        }}
      >
        {total.toFixed(2).replace(".", ",")}€
      </div>
      <div
        style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 8 }}
      >
        {count} entrada{count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function EditEntryDialog({
  entry,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  onSave,
  onDelete,
  onCancel,
}: {
  entry: Entry;
  amount: string;
  note: string;
  onAmountChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const meta: { col: string; lbl: string } =
    entry.type === "propina" ? { col: G, lbl: "Propina" }
    : entry.type === "datafono" ? { col: P, lbl: "Datáfono" }
    : entry.type === "agencia" ? { col: A, lbl: "Agencia" }
    : entry.type === "extra" ? { col: E, lbl: "Extra" }
    : entry.type === "gasolina" ? { col: F, lbl: "Gasolina" }
    : { col: N, lbl: "Nulo" };
  return (
    <div
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
          padding: 24,
          width: "90%",
          maxWidth: 360,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: meta.col, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Editar {meta.lbl}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{entry.time}</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px" }}>Importe (€)</div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(ev) => onAmountChange(ev.target.value.replace(/[^0-9,\.]/g, ""))}
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.3)",
              border: `1px solid ${meta.col}55`,
              borderRadius: 12,
              color: meta.col,
              padding: "12px 14px",
              fontSize: 22,
              fontWeight: 900,
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
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
            onClick={onCancel}
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
            onClick={onDelete}
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
              background: meta.col,
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

function ConfirmDialog({ text, onConfirm, onCancel }: any) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "oklch(0.18 0.03 260)",
          borderRadius: 20,
          padding: 24,
          width: "85%",
          maxWidth: 320,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.3s ease",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 12 }}>
          Confirmar acción
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 24, lineHeight: 1.4 }}>
          {text}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "rgba(255,60,60,0.2)",
              color: "#ff6b6b",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
