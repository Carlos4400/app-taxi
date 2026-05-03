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
// Inyectado por Vite en build a partir de process.env.APP_VERSION o package.json.
declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

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

function buildHistoryCSV(turnos: Turno[]): string {
  const header = [
    "fecha",
    "inicio",
    "fin",
    "tipo",
    "importe",
    "nota",
    "hora_entrada",
    "dinero_total_turno",
    "km_turno",
    "notas_turno",
  ];
  const rows: string[] = [header.join(";")];

  for (const j of turnos) {
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

async function exportHistoryCSV(turnos: Turno[]): Promise<void> {
  const csv = buildHistoryCSV(turnos);
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
          text: "Exportación CSV de Turnos",
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
function loadHistory(): Turno[] {
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
  const [history, setHistory] = useState<Turno[]>(loadHistory);
  const [screen, setScreen] = useState("home");
  const [burst, setBurst] = useState(false);
  const [viewTurno, setViewTurno] = useState<Turno | null>(null);
  const [activeField, setActiveField] = useState("datafono");
  const [valP, setValP] = useState("");
  const [valD, setValD] = useState("");
  const [noteP, setNoteP] = useState("");
  const [noteD, setNoteD] = useState("");
  const [singleMode, setSingleMode] = useState<string | null>(null);
  const [valS, setValS] = useState("");
  const [noteS, setNoteS] = useState("");
  const [dineroJ, setDineroJ] = useState("");
  const [kmJ, setKmJ] = useState("");
  const [endField, setEndField] = useState<"dinero" | "km" | null>(null);
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
    if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
      alert("El importe debe ser un número mayor que 0.");
      return;
    }
    const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
    if (screen === 'editTurno' && editJ) {
      setEditJ({
        ...editJ,
        entries: editJ.entries.map((x: any) => x.id === updated.id ? updated : x)
      });
    } else {
      setCurrent((prev) => ({
        ...prev,
        entries: prev.entries.map((x) =>
          x.id === editEntry.id ? updated : x
        ),
      }));
    }
    setEditEntry(null);
  }

  function deleteEditEntry() {
    if (!editEntry) return;
    if (screen === 'editTurno' && editJ) {
      setEditJ({
        ...editJ,
        entries: editJ.entries.filter((x: any) => x.id !== editEntry.id)
      });
    } else {
      setCurrent((prev) => ({
        ...prev,
        entries: prev.entries.filter((x) => x.id !== editEntry.id),
      }));
    }
    setEditEntry(null);
  }

  useEffect(() => {
    localStorage.setItem(KEY_CURRENT, JSON.stringify(current));
  }, [current]);
  useEffect(() => {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  // Detección automática de nuevas versiones vía Service Worker.
  // El SW comprueba el manifest periódicamente y nos manda un postMessage
  // cuando la versión cambia; aquí lo recibimos y mostramos el aviso.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "NEW_VERSION") {
        setUpdateMsg(`¡Nueva versión ${e.data.version} disponible! Recarga para actualizar.`);
      }
    };
    const onUpdateFound = (reg: ServiceWorkerRegistration) => {
      const newSW = reg.installing;
      if (!newSW) return;
      newSW.addEventListener("statechange", () => {
        if (newSW.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateMsg("Nueva versión disponible. Recarga para actualizar.");
        }
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => onUpdateFound(reg));
    });
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

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

  function handleEndTurno() {
    // Las entradas tipo "nota" ya se han consolidado en `notesJ` al pulsar
    // "Terminar Turno" en la pantalla anterior, por lo que las quitamos
    // aquí para que no aparezcan duplicadas en el histórico.
    const cleanEntries = current.entries.filter((e) => e.type !== "nota");
    const turno = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: cleanEntries,
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
    setHistory((h) => [turno, ...h]);
    setCurrent({ entries: [], startTime: null, startDate: null });
    setDineroJ("");
    setKmJ("");
    setNotesJ("");
    setViewTurno(turno);
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
              {hasActive ? "Continuar Turno" : "Iniciar Turno"}
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
              Turnos Anteriores
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
                {updateMsg.includes("Nueva") && (
                  <button
                    onClick={() => window.location.reload()}
                    style={{ display: "block", width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 10, border: "none", background: "oklch(0.68 0.20 145)", color: "black", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                  >
                    🔄 Recargar
                  </button>
                )}
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

  if (screen === 'summary' && viewTurno) {
    const vP = viewTurno.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
    const vD = viewTurno.entries.filter((e: any) => e.type === 'datafono').reduce((s: number, e: any) => s + e.amount, 0);
    const isToday = viewTurno.date === today();
    const vA = viewTurno.entries.filter((e: any) => e.type === 'agencia').reduce((s: number, e: any) => s + e.amount, 0);
    const vE = viewTurno.entries.filter((e: any) => e.type === 'extra').reduce((s: number, e: any) => s + e.amount, 0);
    const vF = viewTurno.entries.filter((e: any) => e.type === 'gasolina').reduce((s: number, e: any) => s + e.amount, 0);
    const vN = viewTurno.entries.filter((e: any) => e.type === 'nulo').reduce((s: number, e: any) => s + e.amount, 0);
    const dineroV = viewTurno.dinero || 0;
    const kmV = viewTurno.km || 0;
    const totalGeneral = vP + vD + vA + vE + dineroV;
    const eurKm = kmV > 0 ? totalGeneral / kmV : 0;
    const cats = [
      { key: 'datafono', label: 'Datáfono', color: P, bg: PBG, icon: <IconCard s={18} c={P} />, total: vD, count: viewTurno.entries.filter((e: any) => e.type === 'datafono').length },
      { key: 'propina', label: 'Propinas', color: G, bg: GBG, icon: <IconCoin s={18} c={G} />, total: vP, count: viewTurno.entries.filter((e: any) => e.type === 'propina').length },
      { key: 'agencia', label: 'Agencias', color: A, bg: ABG, icon: <IconAgency s={18} c={A} />, total: vA, count: viewTurno.entries.filter((e: any) => e.type === 'agencia').length },
      { key: 'extra', label: 'Extras', color: E, bg: EBG, icon: <IconExtra s={18} c={E} />, total: vE, count: viewTurno.entries.filter((e: any) => e.type === 'extra').length },
      { key: 'gasolina', label: 'Gasolina', color: F, bg: FBG, icon: <IconFuel s={18} c={F} />, total: vF, count: viewTurno.entries.filter((e: any) => e.type === 'gasolina').length },
      { key: 'nulo', label: 'Nulos', color: N, bg: NBG, icon: <IconNulo s={18} c={N} />, total: vN, count: viewTurno.entries.filter((e: any) => e.type === 'nulo').length },
    ];
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button style={S.iconBtn} onClick={() => { setScreen(isToday ? 'home' : 'pastHistory'); setViewTurno(null); }}><IconBack /></button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Resumen del Turno</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize', marginTop: 1 }}>
                {viewTurno.startDate && viewTurno.startDate !== viewTurno.date
                  ? <>{fmtDate(viewTurno.startDate)} {viewTurno.startTime} – {fmtDate(viewTurno.date)} {viewTurno.endTime}</>
                  : <>{fmtDate(viewTurno.date)} · {viewTurno.startTime} – {viewTurno.endTime}</>}
              </div>
            </div>
            <button style={{ ...S.iconBtn, background: 'rgba(255,255,255,0.09)' }} onClick={() => {
              setEditJ({ ...viewTurno, entries: [...viewTurno.entries] });
              setScreen('editTurno');
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

            {(() => {
              const entriesWithNotes = viewTurno.entries.filter((e: any) => e.type !== 'nota' && e.note && e.note.trim());
              if (entriesWithNotes.length === 0) return null;
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>📌 Notas detalladas</div>
                  {entriesWithNotes.map((e: any) => {
                    const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : e.type === 'agencia' ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{e.time}</span>
                        <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: 'uppercase', minWidth: 60 }}>{e.type}</span>
                        <span style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{e.note}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {(() => {
              const generalNotes = viewTurno.entries.filter((e: any) => e.type === 'nota');
              if (generalNotes.length === 0 && !viewTurno.notes) {
                return (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Sin nota general</div>
                  </div>
                );
              }
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {generalNotes.map((e: any) => (
                      <div key={e.id} style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                        {e.note}
                      </div>
                    ))}
                    {viewTurno.notes && (
                      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginTop: generalNotes.length > 0 ? 4 : 0 }}>{viewTurno.notes}</div>
                    )}
                  </div>
                </div>
              );
            })()}
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

  // ── EDIT TURNO SCREEN ───────────────────────────────────────
  if (screen === 'editTurno' && editJ) {
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
      setViewTurno(updated);
      setEditJ(null);
      setScreen('summary');
    }
    const eDinero = editJ.dineroStr !== undefined ? editJ.dineroStr : (editJ.dinero || 0).toString().replace('.', ',');
    const eKm = editJ.kmStr !== undefined ? editJ.kmStr : (editJ.km || 0).toString().replace('.', ',');
    function kpEdit(v: string) {
      if (!endField) return;
      const cur = endField === "dinero" ? eDinero : eKm;
      const key = endField === "dinero" ? "dineroStr" : "kmStr";
      let next = cur;
      if (v === "DEL") next = cur.slice(0, -1);
      else if (v === ",") { if (!cur.includes(",")) next = cur + ","; else return; }
      else { if (cur.replace(",", "").length >= 7) return; next = cur + v; }
      setEditJ({ ...editJ, [key]: next });
    }
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px 32px', overflowY: 'auto', animation: 'slideIn 0.25s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button style={S.iconBtn} onClick={() => { setEditJ(null); setEndField(null); setScreen('summary'); }}><IconBack /></button>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Editar Turno</span>
          </div>

          {/* Dinero / KM (clickables) */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div onClick={() => setEndField("dinero")}
              style={{ flex: 1, background: 'oklch(0.20 0.06 150)', borderRadius: 16, padding: '14px', border: `1.5px solid ${endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.60 0.16 150 / 0.35)"}`, cursor: "pointer" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>€ Dinero</div>
              <div style={{ color: 'oklch(0.78 0.18 150)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>{eDinero || "0"}</div>
            </div>
            <div onClick={() => setEndField("km")}
              style={{ flex: 1, background: 'oklch(0.19 0.05 220)', borderRadius: 16, padding: '14px', border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`, cursor: "pointer" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>→ KM</div>
              <div style={{ color: 'oklch(0.80 0.14 220)', fontSize: 22, fontWeight: 900, minHeight: 28 }}>{eKm || "0"}</div>
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
                          : e.type === 'nota' ? { col: 'white', lbl: 'Nota' }
                            : { col: N, lbl: 'Nulo' };
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '8px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: meta.col, minWidth: 60 }}>{meta.lbl}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{e.type === 'nota' ? '' : fmt(e.amount)}</span>
                    <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 8 }}>
                      {e.note}
                    </div>
                    <button onClick={() => openEditEntry(e)}
                      style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ✏️
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
                    <option value="nota">Nota</option>
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
                      if (amt > 0 || editJ.newType === 'nota') {
                        const noteText = editJ.newNote ? editJ.newNote.trim() : '';
                        const newEntry = {
                          id: Date.now(),
                          type: editJ.newType || 'datafono',
                          amount: amt,
                          note: noteText,
                          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        };

                        setEditJ({
                          ...editJ,
                          entries: [newEntry, ...editJ.entries],
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
          {(() => {
            const generalNotes = editJ.entries.filter((e: any) => e.type === 'nota');
            return (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>📝 Nota del Turno</div>

                {generalNotes.map((e: any) => (
                  <div key={e.id} style={{ marginBottom: 8, color: "rgba(255,255,255,0.9)", fontSize: 13, lineHeight: 1.4, background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: 8, overflowWrap: "anywhere" }}>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginRight: 6, fontWeight: 600 }}>{e.time}</span>
                    {e.note}
                  </div>
                ))}

                <textarea value={editJ.notes} onChange={e => setEditJ({ ...editJ, notes: e.target.value })} placeholder="Añade una nota final..." rows={3}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.9)', fontSize: 15, width: '100%', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, marginTop: generalNotes.length > 0 ? 8 : 0 }} />
              </div>
            );
          })()}

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
                  text: "¿Seguro que quieres eliminar este Turno completo? Esta acción no se puede deshacer.",
                  onConfirm: () => {
                    setHistory((h) => h.filter((j) => j.id !== editJ.id));
                    setEditJ(null);
                    setViewTurno(null);
                    setScreen("pastHistory");
                  }
                });
              }}
              style={{ padding: '16px 0', borderRadius: 18, border: '1px solid rgba(255,60,60,0.3)', background: 'rgba(255,60,60,0.08)', color: 'rgba(255,90,90,0.85)', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
            >
              🗑️ Eliminar Turno
            </button>
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
            onDelete={() => {
              setConfirmDialog({
                text: "¿Seguro que quieres eliminar esta entrada?",
                onConfirm: deleteEditEntry,
              });
            }}
            onCancel={() => setEditEntry(null)}
          />
        )}

        {/* Teclado in-app para Dinero / KM en Editar Turno */}
        {endField && (
          <div
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
                  {endField === "dinero" ? "€ Dinero" : "→ KM"}
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)", marginBottom: 14, textAlign: "center", letterSpacing: "-0.5px" }}>
                {(endField === "dinero" ? eDinero : eKm) || "0"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
                  <button key={k} onClick={() => kpEdit(k)}
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
        <div style={{ flex: 1, padding: "12px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("main"); setSingleMode(null); setValS(""); setNoteS(""); }}>
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
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
              <button key={k} onClick={() => kpS(k)} style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>
          <button onClick={saveS} style={{ width: "100%", padding: 15, marginTop: 12, borderRadius: 12, border: "none", background: accent, color: "black", fontWeight: 700, flexShrink: 0 }}>
            Guardar
          </button>
        </div>
      </Shell>
    );
  }

  if (screen === "addNotaGeneral") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "12px 20px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", animation: "slideIn 0.25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => { setScreen("main"); setNoteS(""); }}>
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
                  type: "nota",
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
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexShrink: 0 }}>
            <button style={S.iconBtn} onClick={() => setScreen("main")}>
              <IconBack />
            </button>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>
              Añadir {activeField === "propina" ? "Propina" : "Datáfono"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
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
              <div style={{ fontSize: 24, fontWeight: 900, color: activeField === "datafono" ? P : "white" }}>{valD || "0"} €</div>
            </div>
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
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
              <button key={k} onClick={() => kpAdd(k)} style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", fontSize: 22, fontWeight: 700, color: "white" }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>

          <button onClick={handleSaveAdd} style={{ width: "100%", padding: 18, marginTop: 12, borderRadius: 16, border: "none", background: activeField === "propina" ? G : P, color: "black", fontWeight: 800, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>
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
              Turnos Anteriores
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
              No hay Turnos Anteriores.
            </div>
          ) : (
            history.map((j) => (
              <div
                key={j.id}
                onClick={() => {
                  setViewTurno(j);
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
                    onClick={() => openEditEntry(e)}
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

          {/* Dinero / KM cards (clickables — abren el teclado in-app) */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexShrink: 0 }}>
            <div onClick={() => setEndField("dinero")}
              style={{ flex: 1, background: "oklch(0.20 0.06 150)", borderRadius: 16, padding: "14px", border: `1.5px solid ${endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.60 0.16 150 / 0.35)"}`, cursor: "pointer", transition: "border 0.15s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>€ Dinero</div>
              <div style={{ color: "oklch(0.78 0.18 150)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>{dineroJ || "0"}</div>
            </div>
            <div onClick={() => setEndField("km")}
              style={{ flex: 1, background: "oklch(0.19 0.05 220)", borderRadius: 16, padding: "14px", border: `1.5px solid ${endField === "km" ? "oklch(0.80 0.14 220)" : "oklch(0.65 0.14 220 / 0.35)"}`, cursor: "pointer", transition: "border 0.15s" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>→ KM</div>
              <div style={{ color: "oklch(0.80 0.14 220)", fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", minHeight: 28 }}>{kmJ || "0"}</div>
            </div>
          </div>

          {/* Resumen previo */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 22, padding: "16px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
              Resumen de hoy
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: PBG, borderRadius: 14, padding: "12px", border: `1px solid ${P}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconCard s={15} c={P} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Datáfono</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: P, letterSpacing: "-0.5px" }}>{fmt(totalD)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{datafonos.length} entrada{datafonos.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: GBG, borderRadius: 14, padding: "12px", border: `1px solid ${G}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconCoin s={15} c={G} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Propinas</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: G, letterSpacing: "-0.5px" }}>{fmt(totalP)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{propinas.length} entrada{propinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: ABG, borderRadius: 14, padding: "12px", border: `1px solid ${A}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconAgency s={15} c={A} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Agencias</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: A, letterSpacing: "-0.5px" }}>{fmt(totalA)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{agencias.length} entrada{agencias.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: EBG, borderRadius: 14, padding: "12px", border: `1px solid ${E}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconExtra s={15} c={E} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Extras</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: E, letterSpacing: "-0.5px" }}>{fmt(totalE)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{extras.length} entrada{extras.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: FBG, borderRadius: 14, padding: "12px", border: `1px solid ${F}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconFuel s={15} c={F} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Gasolina</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: F, letterSpacing: "-0.5px" }}>{fmt(totalF)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{gasolinas.length} entrada{gasolinas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ background: NBG, borderRadius: 14, padding: "12px", border: `1px solid ${N}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <IconNulo s={15} c={N} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Nulos</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: N, letterSpacing: "-0.5px" }}>{fmt(totalN)}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>{nulos.length} entrada{nulos.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            {current.startTime && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 10, textAlign: "center" }}>
                Iniciada a las {current.startTime}
              </div>
            )}
          </div>

          {(() => {
            const entriesWithNotes = current.entries.filter(e => e.type !== 'nota' && e.note && e.note.trim());
            if (entriesWithNotes.length === 0) return null;
            return (
              <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2 }}>📌 Notas detalladas</div>
                {entriesWithNotes.map(e => {
                  const col = e.type === 'propina' ? G : e.type === 'datafono' ? P : e.type === 'agencia' ? A : e.type === 'extra' ? E : e.type === 'gasolina' ? F : N;
                  return (
                    <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.03)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{e.time}</span>
                      <span style={{ fontWeight: 900, color: col, fontSize: 10, textTransform: "uppercase", minWidth: 60 }}>{e.type}</span>
                      <span style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{e.note}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>{fmt(e.amount)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Nota del Turno — único textarea, ya pre-rellenado al venir de "Terminar Turno" */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>📝 Nota del Turno</div>
            <textarea
              value={notesJ}
              onChange={e => setNotesJ(e.target.value)}
              placeholder="Añade una nota general del Turno..."
              rows={4}
              style={{ background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.9)", fontSize: 14, width: "100%", resize: "none", fontFamily: "inherit", lineHeight: 1.45 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, marginTop: "auto" }}>
            <button onClick={handleEndTurno}
              style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
              Sí, terminar Turno
            </button>
            <button onClick={() => setScreen("main")}
              style={{ padding: "13px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>

        {/* Teclado in-app para Dinero / KM */}
        {endField && (
          <div
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
                  {endField === "dinero" ? "€ Dinero" : "→ KM"}
                </span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: endField === "dinero" ? "oklch(0.78 0.18 150)" : "oklch(0.80 0.14 220)", marginBottom: 14, textAlign: "center", letterSpacing: "-0.5px" }}>
                {(endField === "dinero" ? dineroJ : kmJ) || "0"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
                  <button key={k} onClick={() => kpEnd(k)}
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
                title="Turnos Anteriores"
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

        {active && current.startTime && (
          <div style={{ marginBottom: 18 }}>
            <button
              onClick={() => {
                setNoteS("");
                setScreen("addNotaGeneral");
              }}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: 18 }}>📝</span> Añadir Nota al Turno
            </button>
          </div>
        )}

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
                  Turno iniciado a las {current.startTime}.<br />
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
                    🚀 Iniciar Turno
                  </button>
                  <div style={{ marginTop: 14, fontSize: 13 }}>
                    Pulsa para comenzar tu Turno.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, overflowY: "auto", paddingRight: 4, minHeight: 0, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
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
                              ? { col: N, ic: <IconNulo s={17} c={N} />, lbl: "Nulo" }
                              : e.type === "nota"
                                ? { col: "white", ic: <span style={{ fontSize: 16 }}>📝</span>, lbl: "Nota" }
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
                        {e.type !== "nota" && `+${fmt(e.amount)}`}
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
              // Pre-rellenar la nota de turno con todas las notas standalone
              // (entradas tipo "nota") añadidas durante el Turno.
              const notas = current.entries.filter(e => e.type === "nota");
              if (notas.length > 0) {
                const combined = notas
                  .map(n => `[${n.time}] ${n.note}`)
                  .join("\n");
                // Si el usuario ya tenía algo escrito, lo respeta; si no, pre-rellena.
                setNotesJ(prev => prev.trim() ? prev : combined);
              }
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
            Terminar Turno
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
          {fmt(total)}
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
        {fmt(total)}
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
  const [showKP, setShowKP] = React.useState(false);
  const meta: { col: string; lbl: string } =
    entry.type === "propina" ? { col: G, lbl: "Propina" }
      : entry.type === "datafono" ? { col: P, lbl: "Datáfono" }
        : entry.type === "agencia" ? { col: A, lbl: "Agencia" }
          : entry.type === "extra" ? { col: E, lbl: "Extra" }
            : entry.type === "gasolina" ? { col: F, lbl: "Gasolina" }
              : { col: N, lbl: "Nulo" };

  function kpAmount(k: string) {
    if (k === "DEL") { onAmountChange(amount.slice(0, -1)); return; }
    if (k === ",") { if (!amount.includes(",")) onAmountChange(amount + ","); return; }
    if (amount.replace(",", "").length >= 7) return;
    onAmountChange(amount + k);
  }

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
          padding: 20,
          width: "92%",
          maxWidth: 380,
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: meta.col, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Editar {meta.lbl}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{entry.time}</span>
        </div>

        {/* Importe (display + teclado in-app) */}
        <div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setShowKP(true)}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.6px", display: "flex", justifyContent: "space-between" }}>
            <span>Importe (€)</span>
            {!showKP && <span style={{ color: meta.col, fontSize: 10 }}>Toca para editar</span>}
          </div>
          <div style={{
            width: "100%",
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${showKP ? meta.col : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            color: showKP ? meta.col : "white",
            padding: "12px 14px",
            fontSize: 26,
            fontWeight: 900,
            textAlign: "center",
            minHeight: 32,
            letterSpacing: "-0.5px",
            transition: "all 0.2s"
          }}>
            {amount || "0"}
          </div>
        </div>

        {/* Teclado in-app */}
        {showKP && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 14, animation: "fadeUp 0.2s ease" }}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "DEL"].map((k) => (
              <button key={k} onClick={(e) => { e.stopPropagation(); kpAmount(k); }}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 0",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: 20,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                {k === "DEL" ? <IconDel /> : k}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
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
        zIndex: 10000,
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
