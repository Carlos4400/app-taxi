import { type FC } from "react";
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
      <path d="M8 22 L8 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22 L16 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);

export const IconClipboard: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M9 3H15V5H9V3Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="4" y="5" width="16" height="16" rx="2.5" stroke={c} strokeWidth="1.8" />
    <path d="M8 9H16M8 13H12" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconChart: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="12" width="4" height="9" rx="1" stroke={c} strokeWidth="1.8" />
    <rect x="10" y="8" width="4" height="13" rx="1" stroke={c} strokeWidth="1.8" />
    <rect x="17" y="3" width="4" height="18" rx="1" stroke={c} strokeWidth="1.8" />
  </svg>
);

export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2.5" stroke={c} strokeWidth="1.8" />
    <path d="M12 8V16M8 12H16" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconAgenda: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M16 2V6M8 2V6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 9H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 3L10 1M14 3L12 1" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    <rect x="7" y="12" width="2" height="2" rx="0.5" fill={c} />
    <rect x="11" y="12" width="2" height="2" rx="0.5" fill={c} />
    <rect x="15" y="12" width="2" height="2" rx="0.5" fill={c} />
  </svg>
);

export const IconPlay: FC<{ s?: number; c?: string }> = ({ s = 24, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <polygon points="6,4 20,12 6,20" fill={c} />
  </svg>
);
