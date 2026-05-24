import { TIME_CARD_HOUR_UNIT_STYLE, TIME_CARD_UNIT_STYLE } from "../card-styles";
import { splitDurationLabel } from "../formatters";

export function DurationCardValue({ value }: { value: string }) {
  const parts = splitDurationLabel(value);
  return (
    <>
      {parts.hours}<span style={TIME_CARD_HOUR_UNIT_STYLE}>h</span>
      {parts.minutes}<span style={TIME_CARD_UNIT_STYLE}>m</span>
    </>
  );
}
