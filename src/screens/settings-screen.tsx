import React, { type FC } from "react";
import { Capacitor } from "@capacitor/core";
import { auth } from "../services/firebase";
import { Shell } from "../components/shell";
import { ConfirmDialog } from "../components/common";
import { IconBack, IconRefresh, IconDownload, IconUpload } from "../components/navigation-icons";
import { IconPercent } from "../components/entry-icons";
import { IconReceipt, IconHoliday } from "../components/settings-icons";
import { getBackupMenuActionIds, type BackupMenuActionId } from "../shared/action-ids";
import { buildBackupPayloadFromState } from "../logic/backup";
import { exportBackupJSON } from "../services/backup-export";
import { mergeTurnos } from "../logic/turnos";
import { parseCSVToHistory } from "../logic/csv";
import { today } from "../logic/date-time";
import { userStorageKey } from "../services/user-storage";
import { KEY_HISTORY, KEY_SETTINGS, KEY_CURRENT, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import type { AppSettings, Turno, CurrentState, WeekOverride, Reserva, NotaCalendario } from "../shared/types";
import { A, ABG, E, EBG, F, FBG, G, P, PBG } from "../shared/ui-theme";
import { APP_VERSION } from "../shared/app-version";
import { ApkInstaller } from "../services/apk-installer";
import { resolveLatestApkUpdate, type UpdateState } from "../logic/update-flow";
import { IconDel } from "../components/navigation-icons";
import { hapticTap, hapticConfirm } from "../services/haptics";

interface SettingsScreenProps {
  isAdmin: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  history: Turno[];
  setHistory: React.Dispatch<React.SetStateAction<Turno[]>>;
  current: CurrentState;
  weekOverrides: WeekOverride[];
  reservations: Reserva[];
  notes: NotaCalendario[];
  activeSettingsField: "porcentaje.jefe" | "porcentaje.chofer" | null;
  setActiveSettingsField: React.Dispatch<React.SetStateAction<"porcentaje.jefe" | "porcentaje.chofer" | null>>;
  settingsValStr: string;
  setSettingsValStr: (val: string) => void;
  showBackupMenu: boolean;
  setShowBackupMenu: (show: boolean) => void;
  confirmDialog: {
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  } | null;
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    text: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmBg?: string;
    confirmColor?: string;
    confirmBorder?: string;
  } | null>>;
  updateState: UpdateState;
  updateMsg: string;
  downloadUrl: string;
  releaseUrl: string;
  setUpdateState: React.Dispatch<React.SetStateAction<UpdateState>>;
  setUpdateMsg: React.Dispatch<React.SetStateAction<string>>;
  setDownloadUrl: React.Dispatch<React.SetStateAction<string>>;
  setReleaseUrl: React.Dispatch<React.SetStateAction<string>>;
  onSetScreen: (screen: string) => void;
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
  backupSubBtn: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left" as const,
  },
};

async function checkUpdate(
  setUpdateState: React.Dispatch<React.SetStateAction<UpdateState>>,
  setUpdateMsg: React.Dispatch<React.SetStateAction<string>>,
  setDownloadUrl: React.Dispatch<React.SetStateAction<string>>,
  setReleaseUrl: React.Dispatch<React.SetStateAction<string>>
) {
  setUpdateState("checking");
  setUpdateMsg("Buscando actualizaciones...");
  setDownloadUrl("");
  setReleaseUrl("");
  try {
    const res = await fetch("https://api.github.com/repos/Carlos4400/app-taxi/releases/latest");
    if (!res.ok) throw new Error("No se encontró el release");
    const data = await res.json();
    const result = resolveLatestApkUpdate(data, APP_VERSION);
    setDownloadUrl(result.downloadUrl);
    setReleaseUrl(result.releaseUrl);
    setUpdateState(result.updateState);
    setUpdateMsg(result.updateMsg);
  } catch {
    setUpdateState("error");
    setUpdateMsg("Error al conectar con GitHub.");
  }
}

async function handleInstallUpdate(
  downloadUrl: string,
  updateState: UpdateState,
  setUpdateState: React.Dispatch<React.SetStateAction<UpdateState>>,
  setUpdateMsg: React.Dispatch<React.SetStateAction<string>>
) {
  if (!downloadUrl.endsWith(".apk")) {
    setUpdateState("error");
    setUpdateMsg("No se encontró APK en el último release.");
    return;
  }

  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      setUpdateState("checking");
      const { value: hasPermission } = await ApkInstaller.canInstallPackages();
      if (!hasPermission) {
        setUpdateState("permission_required");
        setUpdateMsg("Se requieren permisos para instalar aplicaciones desconocidas.");
        await ApkInstaller.openInstallPermissionSettings();
        return;
      }

      setUpdateState("downloading");
      setUpdateMsg("Descargando actualización...");
      const fileName = `app-update-${Date.now()}.apk`;
      await ApkInstaller.downloadAndInstall({ url: downloadUrl, fileName });
      setUpdateState("installed");
      setUpdateMsg("Instalación iniciada.");
    } catch (err: unknown) {
      console.error("Error al descargar/instalar APK:", err);
      setUpdateState("error");
      setUpdateMsg("Error al instalar el APK. Inténtalo de nuevo.");
    }
  } else {
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  }
}

function handleOpenRelease(releaseUrl: string) {
  if (releaseUrl) {
    window.open(releaseUrl, "_blank", "noopener,noreferrer");
  }
}

export const SettingsScreen: FC<SettingsScreenProps> = ({
  isAdmin,
  settings,
  setSettings,
  history,
  setHistory,
  current,
  weekOverrides,
  reservations,
  notes,
  activeSettingsField,
  setActiveSettingsField,
  settingsValStr,
  setSettingsValStr,
  showBackupMenu,
  setShowBackupMenu,
  confirmDialog,
  setConfirmDialog,
  updateState,
  updateMsg,
  downloadUrl,
  releaseUrl,
  setUpdateState,
  setUpdateMsg,
  setDownloadUrl,
  setReleaseUrl,
  onSetScreen,
}) => {
  const backupMenuActionIds = getBackupMenuActionIds(isAdmin);

  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button style={S.iconBtn} onClick={() => { onSetScreen("home"); setUpdateMsg(""); setDownloadUrl(""); setReleaseUrl(""); }}><IconBack /></button>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>Ajustes de Usuario</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚕</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 4 }}>Mi Turno</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Versión {APP_VERSION}</div>
          <button onClick={() => checkUpdate(setUpdateState, setUpdateMsg, setDownloadUrl, setReleaseUrl)} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <IconRefresh s={20} c={G} /> Buscar actualizaciones
          </button>

          {updateMsg && (
            <div style={{ marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: 12 }}>
              {updateMsg}
            </div>
          )}

          {(() => {
            const hasApkDownload = downloadUrl.endsWith(".apk");
            return hasApkDownload && updateState !== "downloading" && updateState !== "checking" && (
            <button
              onClick={() => handleInstallUpdate(downloadUrl, updateState, setUpdateState, setUpdateMsg)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: "100%",
                marginTop: 16,
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background: updateState === "permission_required" ? "#facc15" : G,
                color: "black",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              <IconDownload s={20} c="black" />
              {Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
                ? (updateState === "permission_required" ? "Continuar instalación" : "Descargar e instalar")
                : "Descargar actualización"}
            </button>
            );
          })()}

          {!Capacitor.isNativePlatform() && releaseUrl && (
            <button
              onClick={() => handleOpenRelease(releaseUrl)}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "14px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Abrir release
            </button>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: G, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <IconPercent s={22} c={G} /> Reparto de Porcentajes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div onClick={() => { setActiveSettingsField("porcentaje.jefe"); setSettingsValStr(settings["porcentaje.jefe"].toString().replace(".", ",")); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              <span style={{ color: "white", fontWeight: 600 }}>Jefe</span>
              <span style={{ color: A, fontSize: 20, fontWeight: 800 }}>{settings["porcentaje.jefe"]} %</span>
            </div>
            <div onClick={() => { setActiveSettingsField("porcentaje.chofer"); setSettingsValStr(settings["porcentaje.chofer"].toString().replace(".", ",")); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
              <span style={{ color: "white", fontWeight: 600 }}>Chofer</span>
              <span style={{ color: G, fontSize: 20, fontWeight: 800 }}>{settings["porcentaje.chofer"]} %</span>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ff6b6b', textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <IconReceipt s={22} c="#ff6b6b" /> Total a Descontar
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.4 }}>
            Selecciona qué categorías se restan del Total a Dar al jefe.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {([
              { key: "descontar.datafono", label: "Datáfono", color: P, bg: PBG },
              { key: "descontar.agencia_bono", label: "Agencias/Bonos", color: A, bg: ABG },
              { key: "descontar.extra", label: "Extras", color: E, bg: EBG },
              { key: "descontar.gasolina", label: "Gasolina", color: F, bg: FBG },
            ] as const).map((item) => {
              const isActive = settings[item.key as keyof AppSettings] as boolean;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setConfirmDialog({
                      text: `¿Seguro que quieres ${isActive ? "dejar de descontar" : "empezar a descontar"} la categoría ${item.label}?`,
                      onConfirm: () => {
                        setSettings({ ...settings, [item.key]: !isActive });
                      }
                    });
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 20,
                    border: isActive ? `1.5px solid ${item.color}` : `1.5px solid rgba(255,255,255,0.1)`,
                    background: isActive ? item.bg : 'transparent',
                    color: isActive ? item.color : 'rgba(255,255,255,0.4)',
                    fontSize: 14,
                    fontWeight: isActive ? 800 : 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 22, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'oklch(0.85 0.18 85)', textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <IconHoliday s={22} c="oklch(0.85 0.18 85)" /> Día libre semanal
          </div>

          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, lineHeight: 1.4 }}>
            Selecciona tu día libre. La semana laboral termina el día anterior y se reinicia al día siguiente.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 16 }}>
            {[
              { idx: 1, lbl: "L" },
              { idx: 2, lbl: "M" },
              { idx: 3, lbl: "X" },
              { idx: 4, lbl: "J" },
              { idx: 5, lbl: "V" },
              { idx: 6, lbl: "S" },
              { idx: 0, lbl: "D" },
            ].map((d) => {
              const selected = settings.diaLibre === d.idx;
              return (
                <button
                  key={d.idx}
                  onClick={() => {
                    if (selected) return;
                    const nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                    setConfirmDialog({
                      text: `¿Cambiar tu día libre a ${nombres[d.idx]}?`,
                      onConfirm: () => {
                        setSettings({
                          ...settings,
                          diaLibre: d.idx,
                          diaLibreDesde: today(),
                        });
                        setConfirmDialog(null);
                      },
                    });
                  }}
                  style={{
                    padding: "16px 0",
                    borderRadius: 14,
                    border: selected ? `2px solid ${A}` : "1px solid rgba(255,255,255,0.08)",
                    background: selected ? ABG : "rgba(0,0,0,0.2)",
                    color: selected ? A : "rgba(255,255,255,0.7)",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {d.lbl}
                </button>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
            {(() => {
              const nombres = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
              const diaLibreTxt = nombres[settings.diaLibre];
              const inicioSemana = nombres[(settings.diaLibre + 1) % 7];
              const finSemana = nombres[(settings.diaLibre + 6) % 7];
              return `Día libre: ${diaLibreTxt} · Semana laboral: ${inicioSemana} → ${finSemana}`;
            })()}
          </div>
        </div>

        <button
          id="btn_import_turno_fusion"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json, .csv';
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                let nuevosTurnos: Turno[] = [];
                const text = evt.target?.result as string;
                try {
                  if (file.name.endsWith('.json')) {
                    const backup = JSON.parse(text);
                    nuevosTurnos = JSON.parse(backup.history || "[]");
                  } else {
                    nuevosTurnos = parseCSVToHistory(text);
                  }
                  if (nuevosTurnos.length > 0) {
                    setConfirmDialog({
                      text: `Se han detectado ${nuevosTurnos.length} turnos en el archivo. ¿Quieres añadirlos a tu historial actual?`,
                      onConfirm: () => {
                        const merged = mergeTurnos(history, nuevosTurnos);
                        setHistory(merged);
                        alert("Turnos añadidos correctamente");
                      },
                      confirmText: "Añadir todos",
                      confirmBg: "rgba(80,220,140,0.15)",
                      confirmColor: "#50dc8c",
                      confirmBorder: "1px solid rgba(80,220,140,0.3)"
                    });
                  }
                } catch {
                  alert("Error al procesar el archivo.");
                }
              };
              reader.readAsText(file);
            };
            input.click();
          }}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 22,
            padding: "16px 20px",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            color: "white",
            textAlign: "left",
            outline: "none"
          }}
        >
          <IconUpload s={22} c="#50dc8c" />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Añadir Turno</span>
        </button>

        <div>
          <div
            onClick={() => setShowBackupMenu(!showBackupMenu)}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 22,
              padding: "16px 20px",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconDownload s={22} c="oklch(0.75 0.16 70)" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Copia de Seguridad</span>
            </div>
            <span style={{
              color: "rgba(255,255,255,0.5)",
              transform: showBackupMenu ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s"
            }}>▼</span>
          </div>

          {showBackupMenu && (
            <div style={{
              marginTop: 8,
              padding: "0 4px",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              {backupMenuActionIds.includes("export-json") && (
                <button
                  onClick={() => exportBackupJSON(buildBackupPayloadFromState({
                    history,
                    settings,
                    current,
                    weekOverrides,
                    reservations,
                    notes,
                  }))}
                  style={S.backupSubBtn}
                >
                  <IconDownload s={18} c="white" /> Exportar todo a JSON
                </button>
              )}

              {backupMenuActionIds.includes("restore-json") && (
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e: any) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const backup = JSON.parse(evt.target?.result as string);
                        setConfirmDialog({
                          text: "RESTAURAR TOTAL: Esto borrará tus datos actuales y pondrá los del archivo. ¿Continuar?",
                          onConfirm: () => {
                            const uid = auth.currentUser?.uid || "";
                            if (backup.history) localStorage.setItem(userStorageKey(KEY_HISTORY, uid), backup.history);
                            if (backup.settings) localStorage.setItem(userStorageKey(KEY_SETTINGS, uid), backup.settings);
                            if (backup.current) localStorage.setItem(userStorageKey(KEY_CURRENT, uid), backup.current);
                            if (backup.weekOverrides) localStorage.setItem(userStorageKey(KEY_WEEK_OVERRIDES, uid), backup.weekOverrides);
                            if (backup.reservations) localStorage.setItem(userStorageKey(KEY_RESERVATIONS, uid), backup.reservations);
                            if (backup.notes) localStorage.setItem(userStorageKey(KEY_NOTES, uid), backup.notes);
                            window.location.reload();
                          }
                        });
                      };
                      reader.readAsText(file);
                    };
                    input.click();
                  }}
                  style={S.backupSubBtn}
                >
                  <span style={{ fontSize: 16 }}>⚠️</span> Restaurar copia completa
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {activeSettingsField && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Configuración"
          onClick={() => setActiveSettingsField(null)}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 400,
              background: "#0d0d14",
              borderRadius: 28,
              padding: "24px",
              border: "1px solid rgba(255,255,255,0.08)",
              animation: "fadeUp 0.3s ease",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: activeSettingsField === "porcentaje.jefe" ? A : G, textTransform: "uppercase", letterSpacing: "0.6px" }}>
                Porcentaje {activeSettingsField === "porcentaje.jefe" ? "Jefe" : "Chofer"}
              </span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: activeSettingsField === "porcentaje.jefe" ? A : G, marginBottom: 14, textAlign: "center", letterSpacing: "-0.5px" }}>
              {settingsValStr || "0"} %
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
                  onClick={() => {
                    hapticTap();
                    let next = settingsValStr;
                    if (k === "DEL") next = next.slice(0, -1);
                    else if (k === ",") { if (!next.includes(",")) next = next + ","; else return; }
                    else { if (next.replace(",", "").length >= 3) return; next = next + k; }
                    setSettingsValStr(next);
                  }}
                  style={{ ...S.keyBtn, padding: "20px 0", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 22, fontWeight: 700 }}>
                  {k === "DEL" ? <IconDel /> : k}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                hapticConfirm();
                const val = parseFloat(settingsValStr.replace(",", ".")) || 0;
                setConfirmDialog({
                  text: `¿Seguro que quieres cambiar el porcentaje de ${activeSettingsField === "porcentaje.jefe" ? "Jefe" : "Chofer"} a ${val}%?`,
                  onConfirm: () => {
                    setSettings({ ...settings, [activeSettingsField!]: val });
                    setActiveSettingsField(null);
                    setConfirmDialog(null);
                  }
                });
              }}
              style={{
                width: "100%",
                padding: "16px 0",
                marginTop: 12,
                borderRadius: 14,
                border: "none",
                background: activeSettingsField === "porcentaje.jefe" ? A : G,
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
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
    </Shell>
  );
};
