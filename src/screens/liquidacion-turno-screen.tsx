import React from "react";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import html2canvas from "html2canvas";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconCard, IconAgency, IconExtra, IconFuel } from "../components/entry-icons";
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { fmt, fmtKmNumber } from "../logic/formatters";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
import { A, E, F, G, P } from "../shared/ui-theme";
import { calcularTurnoContable, roundMoney } from "../logic/accounting";
import { fmtDate } from "../logic/date-time";
import type { AppSettings, Entry, Turno } from "../shared/types";
import { useAppStore } from "../services/store";

const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

type Props = {
  viewTurno: Turno;
  settings: AppSettings;
};

export function LiquidacionTurnoScreen({
  viewTurno,
  settings,
}: Props) {
  const replaceScreen = useAppStore((s) => s.replaceScreen);
  const calculo = calcularTurnoContable(viewTurno, settings);
  const brutoJefe = roundMoney(calculo.dineroBase * (calculo.config.porcentajeJefe / 100));
  const descD = roundMoney(calculo.descD);
  const descG = roundMoney(calculo.descF);
  const descA = roundMoney(calculo.descA);
  const descE = roundMoney(calculo.descE);
  const totalDescontar = roundMoney(calculo.totalDescontar);
  const totalNeto = roundMoney(calculo.totalADar);
  const taximetroLimpio = roundMoney(calculo.dineroBase);
  const totalKM = viewTurno.km || 0;
  const turnoTitle =
    viewTurno.startDate && viewTurno.startDate !== viewTurno.date
      ? `${fmtDate(viewTurno.startDate)} ${viewTurno.startTime} - ${fmtDate(viewTurno.date)} ${viewTurno.endTime}`
      : `${fmtDate(viewTurno.date)} · ${viewTurno.startTime} - ${viewTurno.endTime}`;
  const notasGenerales = viewTurno.entries.filter((entry) => entry.type === "nota");
  const notasDetalladas = viewTurno.entries.filter(
    (entry) => entry.type !== "nota" && entry.note && entry.note.trim()
  );
  const tieneNotas = notasGenerales.length > 0 || notasDetalladas.length > 0;
  const [copiado, setCopiado] = React.useState(false);
  const [procesandoTicket, setProcesandoTicket] = React.useState(false);

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

  const formatLiquidacionNotasText = () => {
    if (!tieneNotas) return "";

    const lineasGenerales = notasGenerales.map((entry) => `  ${entry.time} Nota: ${entry.note.trim()}`);
    const lineasDetalladas = notasDetalladas.map((entry) => {
      const meta = getEntryTypeMeta(entry.type);
      return `  ${entry.time} ${meta.label}: ${entry.note.trim()} (${fmt(entry.amount)})`;
    });
    return `\n\n📝 *NOTAS DEL TURNO:*\n${[...lineasGenerales, ...lineasDetalladas].join("\n")}`;
  };

  const copyTextFallback = () => {
    const text = `📋 *LIQUIDACIÓN DE TURNO*\n📅 *Turno:* ${turnoTitle}\n\n🚕 *Total Taxímetro:* ${fmt(taximetroLimpio)}\n🚗 *Total KM:* ${fmtKmNumber(totalKM)} KM\n👤 *Comisión Bruta Jefe:* ${fmt(brutoJefe)}\n\n⛔ *DESCONTAR:*\n  💳 Datáfonos: -${fmt(descD)}\n  ⛽ Gasolina: -${fmt(descG)}\n  🎟️ Agencias/Bonos: -${fmt(descA)}\n  ➕ Extras: -${fmt(descE)}\n💰 *Total Descuentos:* -${fmt(totalDescontar)}\n\n💵 *NETO A ENTREGAR:*\n👉 *${fmt(totalNeto)}* 👈${formatLiquidacionNotasText()}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }).catch((e) => {
      console.error("Text copy failed: ", e);
      alert("No se pudo copiar la liquidación. Inténtalo de nuevo.");
    });
  };

  const copyToClipboard = async () => {
    const element = document.getElementById("ticket-digital-turno");
    if (!element) {
      console.error("No se encontró el elemento ticket-digital-turno; se copia como texto.");
      copyTextFallback();
      return;
    }

    try {
      await document.fonts?.ready;
    } catch {
    }

    html2canvas(element, {
      backgroundColor: "#0d0d14",
      scale: 3,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc) => {
        const ticket = clonedDoc.getElementById("ticket-digital-turno");
        if (!ticket) return;

        const elements = [ticket, ...Array.from(ticket.getElementsByTagName("*"))] as HTMLElement[];
        const replaceOklch = (str: string) => {
          return str.replace(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\s*\)/gi, (_match, l, c, h) => {
            const lightness = parseFloat(l);
            const chroma = parseFloat(c);
            const hue = parseFloat(h);
            if (Math.abs(lightness - 0.85) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 85) < 5) return "#ffc200";
            if (Math.abs(lightness - 0.80) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 220) < 5) return "#25d2fc";
            if (Math.abs(lightness - 0.70) < 0.05 && Math.abs(chroma - 0.18) < 0.05 && Math.abs(hue - 25) < 5) return "#fa6863";
            if (Math.abs(lightness - 0.68) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 145) < 5) return "#26b63d";
            if (Math.abs(lightness - 0.65) < 0.05 && Math.abs(chroma - 0.20) < 0.05 && Math.abs(hue - 280) < 5) return "#7c79ff";
            if (Math.abs(lightness - 0.75) < 0.05 && Math.abs(chroma - 0.16) < 0.05 && Math.abs(hue - 70) < 5) return "#ed990e";
            if (Math.abs(lightness - 0.72) < 0.05 && Math.abs(chroma - 0.14) < 0.05 && Math.abs(hue - 200) < 5) return "#00bec7";
            if (Math.abs(lightness - 0.62) < 0.05 && Math.abs(chroma - 0.06) < 0.05 && Math.abs(hue - 260) < 5) return "#888899";
            return "#ffffff";
          });
        };
        const replaceExportNeutrals = (str: string) => {
          return str
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.015\s*\)/gi, "#111116")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.025\s*\)/gi, "#17171c")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)/gi, "rgba(255, 255, 255, 0.07)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)/gi, "rgba(255, 255, 255, 0.10)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)/gi, "rgba(255, 255, 255, 0.18)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.35\s*\)/gi, "rgba(255, 255, 255, 0.42)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.45\s*\)/gi, "rgba(255, 255, 255, 0.50)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.5\s*\)/gi, "rgba(255, 255, 255, 0.54)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.6\s*\)/gi, "rgba(255, 255, 255, 0.66)")
            .replace(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.7\s*\)/gi, "rgba(255, 255, 255, 0.74)")
            .replace(/rgba\(\s*80\s*,\s*220\s*,\s*140\s*,\s*0\.25\s*\)/gi, "rgba(38, 182, 61, 0.28)");
        };
        const normalizeExportColors = (str: string) => replaceExportNeutrals(replaceOklch(str));

        for (const el of elements) {
          const styleAttr = el.getAttribute("style");
          if (styleAttr) {
            el.setAttribute("style", normalizeExportColors(styleAttr));
          }

          const stroke = el.getAttribute("stroke");
          if (stroke) {
            el.setAttribute("stroke", normalizeExportColors(stroke));
          }

          const fill = el.getAttribute("fill");
          if (fill) {
            el.setAttribute("fill", normalizeExportColors(fill));
          }
        }
      }
    }).then((canvas) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Falló la creación de la imagen; se copia como texto.");
          copyTextFallback();
          return;
        }

        if (Capacitor.isNativePlatform()) {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(",")[1];
            try {
              const fileName = `liquidacion_turno_${viewTurno.id}.png`;
              const result = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Cache,
              });
              await Share.share({
                title: "Liquidación de Turno",
                text: `Liquidación del turno ${turnoTitle}`,
                url: result.uri,
                dialogTitle: "Compartir Liquidación",
              });
            } catch (e: any) {
              console.error("Error sharing image, fallback to text:", e);
              copyTextFallback();
            }
          };
        } else {
          if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => {
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }).catch((err: any) => {
              console.error("ClipboardItem write failed, fallback to text:", err);
              copyTextFallback();
            });
          } else {
            console.error("navigator.clipboard / ClipboardItem no disponibles; se copia como texto.");
            copyTextFallback();
          }
        }
      }, "image/png");
    }).catch((err) => {
      console.error("html2canvas failed, fallback to text:", err);
      copyTextFallback();
    });
  };

  const sharePrinterTicket = async () => {
    const element = document.getElementById("ticket-impresora-turno");
    if (!element) return;
    setProcesandoTicket(true);
    try {
      await document.fonts?.ready;
    } catch { }
    html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 3,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      canvas.toBlob((blob) => {
        if (!blob) { setProcesandoTicket(false); return; }
        if (Capacitor.isNativePlatform()) {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64 = base64data.split(",")[1];
            try {
              const fileName = `ticket_impresora_turno_${viewTurno.id}.png`;
              const result = await Filesystem.writeFile({
                path: fileName,
                data: base64,
                directory: Directory.Cache,
              });
              await Share.share({
                title: "Ticket Impresora",
                text: `Liquidacion turno ${turnoTitle}`,
                url: result.uri,
                dialogTitle: "Enviar a Impresora",
              });
            } catch (e) {
              console.error("Error al compartir ticket:", e);
            } finally {
              setProcesandoTicket(false);
            }
          };
        } else {
          const link = document.createElement("a");
          link.download = `ticket_impresora_turno_${viewTurno.id}.png`;
          link.href = canvas.toDataURL("image/png");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setProcesandoTicket(false);
        }
      }, "image/png");
    }).catch((err) => {
      console.error("html2canvas ticket failed:", err);
      setProcesandoTicket(false);
    });
  };

  const renderDigitalNotes = (entry: Entry) => {
    const meta = getEntryTypeMeta(entry.type);
    return (
      <div key={`ticket-nota-detallada-${entry.id}`} style={{ fontSize: 13, display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 8, minWidth: 0, marginLeft: 14 }}>
        <span style={NOTE_TIME_STYLE}>{entry.time}</span>
        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.4, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(entry.amount)}</span>
      </div>
    );
  };

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px 32px", minHeight: 0, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={S.iconBtn} onClick={() => replaceScreen("summary")}>
            <IconBack />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "clamp(18px, 4.5vw, 22px)", fontWeight: 800, color: "white" }}>
              Liquidación
            </div>
            <div style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              Turno fuera de semana
            </div>
          </div>
        </div>

        <div id="ticket-digital-turno" style={{
          background: "rgba(255, 255, 255, 0.015)",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          position: "relative",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24)",
          flexShrink: 0,
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", position: "absolute", top: 0, left: 0, right: 0, height: 4, overflow: "hidden" }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, background: "rgba(255,255,255,0.06)", borderRadius: "50%", transform: "translateY(-50%)" }} />
            ))}
          </div>

          <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255, 255, 255, 0.15)", paddingBottom: 16, marginTop: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
              {turnoTitle}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px dashed rgba(255, 255, 255, 0.15)", paddingBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 17, color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                <IconTaxiBadgeNeon s={18} c="oklch(0.85 0.18 85)" /> Total Taxímetro
              </span>
              <span style={{ fontSize: 19, fontWeight: 700, color: "white", fontFamily: "monospace" }}>
                {fmt(taximetroLimpio)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 17, color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                <IconRoad s={16} c="oklch(0.80 0.14 220)" /> Total KM
              </span>
              <span style={{ fontSize: 19, fontWeight: 700, color: "white", fontFamily: "monospace" }}>
                {fmtKmNumber(totalKM)} KM
              </span>
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 16, padding: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Comisión Bruta Jefe
            </div>
            <div style={{ fontSize: 26, fontWeight: 950, color: "white", fontFamily: "monospace" }}>
              {fmt(brutoJefe)}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px dashed rgba(255, 255, 255, 0.15)", paddingBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "oklch(0.70 0.18 25)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Descontar
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17 }}>
                <span style={{ color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                  <IconCard s={14} c={P} /> Datáfonos
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>-{fmt(descD)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17 }}>
                <span style={{ color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                  <IconFuel s={16} c={F} /> Gasolina
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>-{fmt(descG)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17 }}>
                <span style={{ color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                  <IconAgency s={14} c={A} /> Agencias/Bonos
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>-{fmt(descA)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 17 }}>
                <span style={{ color: "rgba(255, 255, 255, 0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                  <IconExtra s={14} c={E} /> Extras
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>-{fmt(descE)}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, fontWeight: 700 }}>
              <span style={{ fontSize: 17, color: "white" }}>Total Descuentos</span>
              <span style={{ fontSize: 19, color: "oklch(0.70 0.18 25)", fontFamily: "monospace" }}>-{fmt(totalDescontar)}</span>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "rgba(255, 255, 255, 0.45)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
              Neto a Entregar
            </div>
            <div style={{ fontSize: 36, fontWeight: 950, color: G, fontFamily: "monospace", textShadow: "0 0 12px rgba(80, 220, 140, 0.25)" }}>
              {fmt(totalNeto)}
            </div>
          </div>

          {tieneNotas && (
            <div style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.15)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "white", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.6px", textShadow: "0 0 10px rgba(255,255,255,0.18)" }}>
                Notas del turno
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
                {notasGenerales.map((entry) => {
                  const meta = getEntryTypeMeta(entry.type);
                  return (
                    <div key={`ticket-nota-general-${entry.id}`} style={{ display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr)", alignItems: "baseline", gap: 9, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.4, minWidth: 0, marginLeft: 14 }}>
                      <span style={NOTE_TIME_STYLE}>{entry.time}</span>
                      <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                      <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 1.38, minWidth: 0, overflowWrap: "anywhere" }}>{entry.note}</span>
                    </div>
                  );
                })}
                {notasDetalladas.map(renderDigitalNotes)}
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-imprimir-ticket-turno"
          onClick={sharePrinterTicket}
          disabled={procesandoTicket}
          style={{
            padding: "16px 0",
            borderRadius: 16,
            background: procesandoTicket ? "rgba(255,255,255,0.04)" : "rgba(37, 210, 252, 0.1)",
            border: procesandoTicket ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(37, 210, 252, 0.3)",
            color: procesandoTicket ? "rgba(255,255,255,0.35)" : "#25d2fc",
            fontSize: 19,
            fontWeight: 700,
            cursor: procesandoTicket ? "not-allowed" : "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s"
          }}
        >
          {procesandoTicket ? "Generando ticket..." : "Imprimir Ticket"}
        </button>

        <div
          id="ticket-impresora-turno"
          style={{
            position: "absolute",
            left: "-9999px",
            top: 0,
            width: 384,
            backgroundColor: "#ffffff",
            color: "#000000",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: 16,
            fontWeight: 700,
            padding: "24px 20px",
            lineHeight: 1.4,
            WebkitTextStroke: "0.2px #000000",
          }}
        >
          <div style={{ textAlign: "center", fontSize: 16, fontWeight: 900, marginBottom: 4, color: "#000000", WebkitTextStroke: "0.4px #000000" }}>LIQUIDACION DE TURNO</div>
          <div style={{ textAlign: "center", fontSize: 19, fontWeight: 900, marginBottom: 12, color: "#000000", WebkitTextStroke: "0.6px #000000" }}>{turnoTitle}</div>
          <div style={{ borderTop: "1px dashed #000000", marginBottom: 10 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>
            <span>Total Taximetro</span><span>{fmt(taximetroLimpio)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4 }}>
            <span>Total KM</span><span>{fmtKmNumber(totalKM)} KM</span>
          </div>
          <div style={{ borderTop: "1px dashed #000000", margin: "6px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 4, fontSize: 14 }}>
            <span>Comision Bruta Jefe</span><span>{fmt(brutoJefe)}</span>
          </div>
          <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
          <div style={{ fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>Descontar:</div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
            <span>Datafonos</span><span>-{fmt(descD)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
            <span>Gasolina</span><span>-{fmt(descG)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
            <span>Agencias/Bonos</span><span>-{fmt(descA)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#000000", marginBottom: 2, paddingLeft: 8 }}>
            <span>Extras</span><span>-{fmt(descE)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#000000", marginTop: 4, WebkitTextStroke: "0.6px #000000" }}>
            <span>Total Descontar</span><span>-{fmt(totalDescontar)}</span>
          </div>
          <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
          <div style={{ textAlign: "center", fontWeight: 900, fontSize: 22, color: "#000000", margin: "8px 0", WebkitTextStroke: "0.6px #000000" }}>
            NETO A ENTREGAR: {fmt(totalNeto)}
          </div>
          {tieneNotas && (
            <>
              <div style={{ borderTop: "1px dashed #000000", margin: "8px 0" }} />
              <div style={{ fontSize: 18, fontWeight: 900, color: "#000000", marginBottom: 4, WebkitTextStroke: "0.6px #000000" }}>NOTAS DEL TURNO:</div>
              {notasGenerales.map((entry) => (
                <div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                  <span>{entry.time}</span>
                  <span>Nota:</span>
                  <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.35 }}>{entry.note.trim()}</span>
                </div>
              ))}
              {notasDetalladas.map((entry) => {
                const meta = getEntryTypeMeta(entry.type);
                return (
                  <div key={entry.id} style={{ fontSize: 14, color: "#000000", paddingLeft: 8, display: "grid", gridTemplateColumns: "46px auto minmax(0, 1fr)", gap: 4, alignItems: "start", marginBottom: 2 }}>
                    <span>{entry.time}</span>
                    <span>{meta.label}:</span>
                    <span style={{ minWidth: 0, overflowWrap: "anywhere", wordBreak: "break-all", whiteSpace: "normal", lineHeight: 1.35 }}>{`(${fmt(entry.amount)})${entry.note.trim() ? ` ${entry.note.trim()}` : ""}`}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <button
            onClick={copyToClipboard}
            style={{
              padding: "16px 0",
              borderRadius: 16,
              background: copiado ? "rgba(80, 220, 140, 0.12)" : "rgba(255, 255, 255, 0.08)",
              border: copiado ? `1px solid ${G}` : "1px solid rgba(255, 255, 255, 0.1)",
              color: copiado ? G : "white",
              fontSize: 19,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            {copiado ? "¡Copiado! ✓" : "Copiar Liquidación"}
          </button>

          <button
            onClick={() => replaceScreen("summary")}
            style={{
              padding: "16px 0",
              borderRadius: 16,
              border: "none",
              background: "rgba(255, 255, 255, 0.04)",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: 19,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            Volver
          </button>
        </div>
      </div>
    </Shell>
  );
}
