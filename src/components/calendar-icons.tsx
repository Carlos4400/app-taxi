import React from "react";

export const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <g>
      <path
        d="M4.1 19.9L6.15 14.85L9.15 17.85L4.1 19.9Z"
        fill="#c7cede"
        stroke="#e0e5f2"
        strokeWidth="0.75"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(199,206,222,0.55)) drop-shadow(0 0 2px rgba(127,137,166,0.22))",
        }}
      />
      <path
        d="M4.1 19.9L4.85 18.05L5.95 19.15L4.1 19.9Z"
        fill="#6f778d"
      />
      <path
        d="M6.15 14.85L15.45 5.55L18.45 8.55L9.15 17.85L6.15 14.85Z"
        fill="#ffd84d"
        stroke="#ffe45c"
        strokeWidth="0.85"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1.15px rgba(255,228,92,0.72)) drop-shadow(0 0 2.6px rgba(255,189,46,0.28))",
        }}
      />
      <path
        d="M15.45 5.55L16.95 4.05L19.95 7.05L18.45 8.55L15.45 5.55Z"
        fill="#ff9cda"
        stroke="#ffc1e9"
        strokeWidth="0.75"
        strokeLinejoin="round"
        opacity="0.78"
        style={{
          filter:
            "drop-shadow(0 0 0.8px rgba(255,120,207,0.42)) drop-shadow(0 0 1.8px rgba(255,120,207,0.14))",
        }}
      />
      <path
        d="M8.1 14.35L15.7 6.75"
        stroke="#fff3a6"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M9.25 15.55L16.85 7.95"
        stroke="#ffba2e"
        strokeWidth="0.75"
        strokeLinecap="round"
        opacity="0.65"
      />
    </g>
  </svg>
);

export const IconTimer = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path
      d="M12 5C16.4183 5 20 8.58172 20 13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13C4 9.61051 6.10892 6.71424 9.06 5.5"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path d="M12 2V5M10 2H14" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M12 13L15.5 8.5"
      stroke={c}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="13" r="1.2" fill={c} />
    <circle cx="17.5" cy="8.5" r="1" fill={c} opacity="0.6" />
  </svg>
);

export const IconMoneyBag = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="3.5" cy="10.5" r="1" fill={c} />
    <circle cx="2" cy="13.5" r="0.8" fill={c} />
    <circle cx="20.5" cy="10.5" r="1" fill={c} />
    <circle cx="22" cy="13.5" r="0.8" fill={c} />
    <path d="M8 8 L6.5 4 Q9 6 12 3 Q15 6 17.5 4 L16 8" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="8" y="8" width="8" height="2.5" rx="1" stroke={c} strokeWidth="1.8" />
    <path d="M8.5 10.5C4 12 2.5 17.5 6 20.5C8 22.5 16 22.5 18 20.5C21.5 17.5 20 12 15.5 10.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 12V20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 13.5C14 12 10 12 10 14C10 16 14 16 14 18C14 20 10 20 10 18.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);