import type { ReactNode } from "react";
import { SyncIndicator } from "./sync-indicator";

const BURST_GREEN = "oklch(0.68 0.20 145)";
const BURST_PURPLE = "oklch(0.65 0.20 280)";

export function Shell({
  children,
  burst,
}: {
  children: ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {burst && <Burst />}
      {children}
      <SyncIndicator />
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
            background: [BURST_GREEN, BURST_PURPLE, "white", "oklch(0.85 0.18 80)"][i % 4],
            animation: `fall ${0.55 + Math.random() * 0.45}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}
