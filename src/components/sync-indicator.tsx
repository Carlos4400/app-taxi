import { type FC } from "react";
import { useSyncStatus } from "../hooks/use-sync-status";

export const SyncIndicator: FC = () => {
  const status = useSyncStatus();

  const config = {
    loading: {
      color: "rgba(148, 163, 184, 0.95)",
      shadow: "rgba(148, 163, 184, 0.35)",
      label: "Cargando datos",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    synced: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexión",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    pending: {
      color: "#f97316",
      shadow: "rgba(249, 115, 22, 0.45)",
      label: "Cambios pendientes",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronización",
      animation: "none",
    },
  }[status];

  return (
    <div
      title={config.label}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: config.color,
        boxShadow: `0 0 6px ${config.shadow}`,
        animation: config.animation,
        pointerEvents: "none",
        zIndex: 1000,
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
      }}
    />
  );
};
