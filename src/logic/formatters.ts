export function fmtMoneyNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const [integerPart, decimalPart] = Math.abs(n).toFixed(2).split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${groupedInteger},${decimalPart}`;
}

export function fmtMoney(n: number): string {
  return `${fmtMoneyNumber(n)} €`;
}

export function fmt(n: number): string {
  return fmtMoney(n);
}

export function fmtKmNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const [integerPart, decimalPart] = Math.abs(n).toString().split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimalPart ? `${sign}${groupedInteger},${decimalPart}` : `${sign}${groupedInteger}`;
}

export function fmtKm(n: number): string {
  return `${fmtKmNumber(n)} KM`;
}

export function fmtDuration(totalMins: number): string {
  const mins = Math.max(0, totalMins);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${hh}h ${mm}m`;
}

export function splitDurationLabel(duration: string): { hours: string; minutes: string } {
  const [hoursPart, minutesPart] = duration.split(" ");
  return {
    hours: (hoursPart || "0h").replace("h", "") || "0",
    minutes: (minutesPart || "0m").replace("m", "") || "0",
  };
}
