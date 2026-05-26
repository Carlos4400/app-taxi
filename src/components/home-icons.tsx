import { type FC } from "react";
import { IconPencilNeon } from "./calendar-icons";
import { C } from "../shared/ui-theme";

export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 12 12)">
      <path d="M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 5 Q12 6 14.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.8" />
      <path d="M8 11 C5 11 4 14 4 16 C6 16 8 14 8 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 11 C19 11 20 14 20 16 C18 16 16 14 16 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 14 L9 16 C11 16.5 13 16.5 15 16 L14 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 16 C10 19 12 21 12 21 C12 21 14 19 14 16" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 23 L12 26" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 22 L8 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22 L16 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);

export const IconClipboard: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M9 4H7C5.89543 4 5 4.89543 5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6C19 4.89543 18.1046 4 17 4H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 2C9.44772 2 9 2.44772 9 3V5C9 5.55228 9.44772 6 10 6H14C14.5523 6 15 5.55228 15 5V3C15 2.44772 14.5523 2 14 2H10Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12H15M9 16H13" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const IconChart: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="4" y="14" width="4" height="6" rx="1" stroke={c} strokeWidth="1.8" strokeLinejoin="round" opacity="0.7" />
    <rect x="10" y="8" width="4" height="12" rx="1" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="16" y="4" width="4" height="16" rx="1" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M2 22H22" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <span
    style={{
      position: "relative",
      width: s,
      height: s,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
      }}
    >
      <path
        d="M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(190,140,255,0.55)) drop-shadow(0 0 3px rgba(190,140,255,0.20))",
        }}
      />
      <path
        d="M14.8 3.5V7.2H18.5"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8 10H14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M8 13H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <path d="M8 16H11.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>

    <span
      style={{
        position: "absolute",
        right: -2,
        bottom: -1,
        transform: "scale(0.58) rotate(-6deg)",
        transformOrigin: "bottom right",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <IconPencilNeon s={24} />
    </span>
  </span>
);

export const IconAgenda: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="7" cy="9" r="1" fill={c} />
    <circle cx="7" cy="13" r="1" fill={c} />
    <circle cx="7" cy="17" r="1" fill={c} opacity="0.6" />
    <path d="M10 9H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 13H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 17H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const IconPlay: FC<{ s?: number; c?: string }> = ({ s = 24, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path
      d="M8 5.5L18.5 12L8 18.5V5.5Z"
      fill={c}
    />
  </svg>
);
