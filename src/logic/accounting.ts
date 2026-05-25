export type AccountingSettings = {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
};

export type AccountingTurnoConfig = {
  porcentajeJefe: number;
  porcentajeChofer: number;
  descDatafono: boolean;
  descAgencia: boolean;
  descExtra: boolean;
  descGasolina: boolean;
};

export type AccountingTurno = {
  totalP?: number;
  totalD?: number;
  totalA?: number;
  totalE?: number;
  totalF?: number;
  totalN?: number;
  dinero?: number;
  km?: number;
  configTurno?: AccountingTurnoConfig;
};

export function calcularTotalesTurnos<T extends AccountingTurno>(turnos: T[]) {
  let totalP = 0;
  let totalD = 0;
  let totalA = 0;
  let totalE = 0;
  let totalF = 0;
  let totalN = 0;
  let dinero = 0;
  let km = 0;
  for (const t of turnos) {
    totalP += t.totalP || 0;
    totalD += t.totalD || 0;
    totalA += t.totalA || 0;
    totalE += t.totalE || 0;
    totalF += t.totalF || 0;
    totalN += t.totalN || 0;
    dinero += t.dinero || 0;
    km += t.km || 0;
  }
  return { totalP, totalD, totalA, totalE, totalF, totalN, dinero, km };
}

export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildTurnoConfigFromSettings(settings: AccountingSettings): AccountingTurnoConfig {
  return {
    porcentajeJefe: settings["porcentaje.jefe"],
    porcentajeChofer: settings["porcentaje.chofer"],
    descDatafono: settings["descontar.datafono"],
    descAgencia: settings["descontar.agencia_bono"],
    descExtra: settings["descontar.extra"],
    descGasolina: settings["descontar.gasolina"],
  };
}

export function getTurnoConfig(turno: AccountingTurno, settings: AccountingSettings): AccountingTurnoConfig {
  return turno.configTurno || buildTurnoConfigFromSettings(settings);
}

export function calcularTurnoContable(turno: AccountingTurno, settings: AccountingSettings) {
  const config = getTurnoConfig(turno, settings);
  const dineroBase = (turno.dinero || 0) - (turno.totalN || 0);
  const descD = config.descDatafono ? (turno.totalD || 0) : 0;
  const descA = config.descAgencia ? (turno.totalA || 0) : 0;
  const descE = config.descExtra ? (turno.totalE || 0) : 0;
  const descF = config.descGasolina ? (turno.totalF || 0) : 0;
  const totalDescontar = descD + descA + descE + descF;

  return {
    dineroBase: roundMoney(dineroBase),
    miGanancia: roundMoney((dineroBase * (config.porcentajeChofer / 100)) + (turno.totalP || 0)),
    descD,
    descA,
    descE,
    descF,
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney((dineroBase * (config.porcentajeJefe / 100)) - totalDescontar),
    config,
  };
}

export function calcularResumenContableTurnos<T extends AccountingTurno>(turnos: T[], settings: AccountingSettings) {
  const totales = calcularTotalesTurnos(turnos);
  let miGanancia = 0;
  let totalDescontar = 0;
  let totalADar = 0;

  for (const turno of turnos) {
    const calculo = calcularTurnoContable(turno, settings);
    miGanancia += calculo.miGanancia;
    totalDescontar += calculo.totalDescontar;
    totalADar += calculo.totalADar;
  }

  return {
    ...totales,
    dineroBase: roundMoney((totales.dinero || 0) - (totales.totalN || 0)),
    miGanancia: roundMoney(miGanancia),
    totalDescontar: roundMoney(totalDescontar),
    totalADar: roundMoney(totalADar),
  };
}
