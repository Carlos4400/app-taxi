import { type FC } from "react";

export const IconBack: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M14 18L7 11L14 4" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconDel: FC = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z" stroke="rgba(255,255,255,0.45)" strokeWidth="1.7" fill="none" />
    <path d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const IconRefresh: FC<{ s?: number; c?: string }> = ({ s = 20, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 4V9H9" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20V15H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 9C18.8289 5.50429 15.6836 3 12 3C7.02944 3 3 7.02944 3 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15C5.17112 18.4957 8.31641 21 12 21C16.9706 21 21 16.9706 21 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconDownload: FC<{ s?: number; c?: string }> = ({ s = 20, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V16" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 11L12 16L17 11" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20H4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconUpload: FC<{ s?: number; c?: string }> = ({ s = 20, c = "currentColor" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 20V8" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 13L12 8L17 13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 4H4" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCalendar: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="16" rx="3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 2V6M8 2V6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 9H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="7.5" cy="13.5" r="1" fill={c} />
    <circle cx="12" cy="13.5" r="1" fill={c} />
    <circle cx="16.5" cy="13.5" r="1" fill={c} />
    <circle cx="7.5" cy="17.5" r="1" fill={c} opacity="0.6" />
    <circle cx="12" cy="17.5" r="1" fill={c} opacity="0.6" />
    <circle cx="16.5" cy="17.5" r="1" fill={c} opacity="0.6" />
  </svg>
);

export const IconSettingsNeon: FC<{ s?: number; c?: string }> = ({ s = 24, c = "oklch(0.72 0.01 250)" }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      overflow: "visible",
      filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 5px ${c})`
    }}
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconHomeNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M4.2 11.2L12 5.2L19.8 11.2" stroke="#ffb347" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,190,77,0.75)) drop-shadow(0 0 4px rgba(255,139,61,0.28))" }} />
    <path d="M6.7 10.3V19H17.3V10.3" stroke="#ffb347" strokeWidth="2" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,190,77,0.75)) drop-shadow(0 0 4px rgba(255,139,61,0.28))" }} />
    <path d="M10 19V14.2H14V19" stroke="#ffe071" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 11.7H15" stroke="#ffd56a" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </svg>
);

export const IconLogoutNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(180 12 12)">
      <path d="M10.5 5.2H5.8C4.8 5.2 4 6 4 7V17C4 18 4.8 18.8 5.8 18.8H10.5" stroke="#ff7a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,122,138,0.8)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }} />
      <path d="M11 12H19" stroke="#ffb1bc" strokeWidth="2.2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,177,188,0.75)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }} />
      <path d="M16 8.5L19.5 12L16 15.5" stroke="#ffb1bc" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(255,177,188,0.75)) drop-shadow(0 0 5px rgba(255,70,105,0.28))" }} />
    </g>
  </svg>
);

export const IconAdminNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 3.4L19 6.1V11.4C19 15.8 16.2 19.4 12 20.8C7.8 19.4 5 15.8 5 11.4V6.1L12 3.4Z" stroke="#7dd3ff" strokeWidth="2" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(125,211,255,0.8)) drop-shadow(0 0 5px rgba(66,165,245,0.32))" }} />
    <path d="M9 12.2L11 14.2L15.4 9.8" stroke="#b9f6ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.2px rgba(185,246,255,0.78)) drop-shadow(0 0 5px rgba(66,165,245,0.28))" }} />
  </svg>
);
