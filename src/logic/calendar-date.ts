export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getStartOffset(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  return offset;
}
