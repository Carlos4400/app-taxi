import { type FC } from "react";
import { C } from "../shared/ui-theme";

export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 16.5C4.5 16.5 6 12 12 6C12 6 12 12 16.5 13.5M16.5 13.5L19.5 15M19.5 15L22 17M19.5 15C19.5 15 20 17 18 19C16 21 14 19.5 14 19.5M14 19.5L9 14.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
