export interface Entry {
  id: number;
  type: string;
  amount: number;
  note: string;
  time: string;
}

export interface TurnoConfig {
  porcentajeJefe: number;
  porcentajeChofer: number;
  descDatafono: boolean;
  descAgencia: boolean;
  descExtra: boolean;
  descGasolina: boolean;
}

export interface Turno {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string;
  entries: Entry[];
  totalP: number;
  totalD: number;
  totalA: number;
  totalE: number;
  totalF: number;
  totalN: number;
  dinero: number;
  km: number;
  notes: string;
  startDate: string | null;
  totalPausedMinutes?: number;
  entregada?: boolean;
  fechaEntrega?: string | null;
  configTurno?: TurnoConfig;
  diaLibreContable?: number;
}

export interface TurnoNotasSemana {
  turno: Turno;
  notasGenerales: Entry[];
  notasDetalladas: Entry[];
}

export interface EditTurnoState extends Turno {
  dineroStr?: string;
  kmStr?: string;
  newType?: string | null;
  newAmount?: string;
  newNote?: string;
  isAddingNote?: boolean;
  tempNote?: string;
}

export interface CurrentState {
  entries: Entry[];
  startTime: string | null;
  startDate: string | null;
  isPaused?: boolean;
  pauseStartTime?: string | null;
  totalPausedMinutes?: number;
}

export interface Reserva {
  id: string;
  date: string;        // "YYYY-MM-DD"
  time: string;        // "HH:mm"
  origen: string;
  destino: string;
  cliente: string;
  telefono: string;    // permite llamada directa
  notas: string;
}

export type NotaTipo = "ITV" | "Seguro" | "Normal" | "Día libre";

export interface NotaCalendario {
  id: string;
  date: string;        // "YYYY-MM-DD"
  tipo: NotaTipo;
  texto: string;
}

export interface WeekOverride {
  weekId: string;
  notes: string;
  entregada: boolean;
  fechaEntrega: string | null;
}

export interface AppSettings {
  "porcentaje.jefe": number;
  "porcentaje.chofer": number;
  "descontar.datafono": boolean;
  "descontar.agencia_bono": boolean;
  "descontar.extra": boolean;
  "descontar.gasolina": boolean;
  diaLibre: number;              // 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
  diaLibreDesde: string | null;  // Fecha ISO desde la que aplica este día libre (null si nunca se ha cambiado)
}
