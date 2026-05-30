import { type FC } from "react";
import { useNetworkStatus } from "../hooks/use-network-status";

export const SyncIndicator: FC = () => {
  const status = useNetworkStatus();

  const config = {
    online: {
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
        bottom: 8,
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
