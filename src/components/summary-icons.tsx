import React from "react";
import { C } from "../shared/ui-theme";

export const IconGive = ({ s = 26, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M8 8V5.5C8 4.67 8.67 4 9.5 4H14.5C15.33 4 16 4.67 16 5.5V8" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4.5 8H19.5C20.6 8 21.5 8.9 21.5 10V18.5C21.5 19.9 20.4 21 19 21H5C3.6 21 2.5 19.9 2.5 18.5V10C2.5 8.9 3.4 8 4.5 8Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <text x="12" y="18.2" textAnchor="middle" fill={c} fontSize="11" fontWeight="700" fontFamily="Outfit, sans-serif">€</text>
  </svg>
);

export const IconRoad = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M3 22L9 2M21 22L15 2" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 22V18M12 14V10M12 6V2" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const IconPinNeon = ({ s = 24, c = "oklch(0.72 0.14 28)" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle", overflow: "visible" }}>
    <g transform="rotate(32 12 12)">
      <path d="M8.2 4.8h7.6c0.7 0 1.2 0.5 1.2 1.2v1.1c0 0.5-0.3 0.9-0.7 1.1l-1.8 1.1v3.1l2.7 2.7v1.2H6.8v-1.2l2.7-2.7V9.3L7.7 8.2C7.3 8 7 7.6 7 7.1V6c0-0.7 0.5-1.2 1.2-1.2Z" fill={c} fillOpacity="0.16" stroke={c} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
      <path d="M12 16.3V21" stroke={c} strokeWidth="1.75" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
    </g>
  </svg>
);

export const IconTaxiBadgeNeon = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g style={{ transform: "scale(1.4)", transformOrigin: "center" }}>
      <path d="M9.4 9.05V8.2C9.4 7.51 9.96 6.95 10.65 6.95H13.35C14.04 6.95 14.6 7.51 14.6 8.2V9.05" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.65 9.05L9.5 6.2C9.35 5.6 9.8 5 10.4 5H13.6C14.2 5 14.65 5.6 14.5 6.2L13.35 9.05" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.75 9.05H17.25C17.84 9.05 18.34 9.47 18.45 10.04L19.18 13.96C19.36 14.92 18.62 15.8 17.64 15.8H6.36C5.38 15.8 4.64 14.92 4.82 13.96L5.55 10.04C5.66 9.47 6.16 9.05 6.75 9.05Z" stroke={c} strokeWidth="1.7" strokeLinejoin="round" />
      <text x="12" y="13.9" textAnchor="middle" fill={c} fontSize="4.7" fontWeight="800" fontFamily="Outfit, sans-serif" letterSpacing="0.5">TAXI</text>
    </g>
  </svg>
);

export const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {showPlus && (
      <>
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M11.25 17.25c0 1.5913 0.6321 3.1174 1.7574 4.2426 1.1252 1.1253 2.6513 1.7574 4.2426 1.7574 1.5913 0 3.1174 -0.6321 4.2426 -1.7574 1.1253 -1.1252 1.7574 -2.6513 1.7574 -4.2426 0 -1.5913 -0.6321 -3.1174 -1.7574 -4.2426 -1.1252 -1.1253 -2.6513 -1.7574 -4.2426 -1.7574 -1.5913 0 -3.1174 0.6321 -4.2426 1.7574 -1.1253 1.1252 -1.7574 2.6513 -1.7574 4.2426Z" strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 1px ${c}) drop-shadow(0 0 2px ${c})` }} />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M17.25 14.25v6" strokeWidth="1.8" />
        <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M14.25 17.25h6" strokeWidth="1.8" />
      </>
    )}
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 6.75h10.5" : "M7.5 10h8.25"} strokeWidth="1.5" opacity="0.8" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 11.25h6" : "M7.5 13.75h6.5"} strokeWidth="1.5" opacity="0.6" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M3.75 15.75H7.5" : "M7.5 17.5H12"} strokeWidth="1.5" opacity="0.4" />
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
  </svg>
);
