export const MESES_COMPLETOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const MESES_ABREVIADOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function getMesLabel(mesId: string): string {
  const [y, m] = mesId.split("-").map(Number);
  return `${MESES_COMPLETOS[m - 1]} ${y}`;
}

export function getAccountingPeriodLabel(year: number, month: number): string {
  return getMesLabel(`${year}-${String(month).padStart(2, "0")}`);
}
