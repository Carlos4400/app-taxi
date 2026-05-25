export const WEEK_LIST_CARD_TEXT_SIZES = {
  range: "clamp(13px, 4.2cqw, 16px)",
  meta: "clamp(11px, 3.4cqw, 13px)",
  metric: "clamp(14px, 4.5cqw, 17px)",
} as const;

export const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;

export const TIME_CARD_UNIT_STYLE = {
  fontSize: "1em",
  fontWeight: KM_CARD_UNIT_STYLE.fontWeight,
  marginLeft: 2,
  letterSpacing: KM_CARD_UNIT_STYLE.letterSpacing,
} as const;

export const TIME_CARD_HOUR_UNIT_STYLE = {
  ...TIME_CARD_UNIT_STYLE,
  marginRight: 6,
} as const;
