export const IconReceipt = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 21V3C4.5 2.44772 4.94772 2 5.5 2H18.5C19.0523 2 19.5 2.44772 19.5 3V21L15.75 19.5L12 21L8.25 19.5L4.5 21Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7H16M8 11H16M8 15H13" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconHoliday = ({ s = 24, c = "oklch(0.85 0.18 85)" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V16" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 4C14 4 18.5 5.5 19 9.5C19.5 13.5 16 16 12 16C8 16 4.5 13.5 5 9.5C5.5 5.5 10 4 12 4Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 4C11.5 6 10.5 7.5 8 9M12 4C12.5 6 13.5 7.5 16 9" stroke={c} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
    <path d="M8 20C10.5 18.5 13.5 18.5 16 20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
