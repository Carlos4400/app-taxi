import { describe, it, expect } from 'vitest';
import {
  parseCSVLine,
  parseCSVToHistory,
  getWeekStartDate,
  getWeekId,
  getWeekRange,
  getTurnoFechaEfectiva,
  groupTurnosByWeek,
  calcularTotalesTurnos,
  mergeTurnos,
  buildBackupPayload,
  Turno
} from '../main';

describe('CSV Parsing Logic', () => {
  it('should parse a simple CSV line correctly', () => {
    const line = '2026-05-08;08:00;16:00;propina;10,50;Buen viaje;12:00;150,00;120;Sin notas';
    const result = parseCSVLine(line);
    expect(result).toHaveLength(10);
    expect(result[0]).toBe('2026-05-08');
    expect(result[3]).toBe('propina');
    expect(result[4]).toBe('10,50');
  });

  it('should parse CSV lines with quotes correctly', () => {
    const line = '2026-05-08;08:00;16:00;propina;10,50;"Nota con ; punto y coma";12:00;150,00;120;"Notas del turno"';
    const result = parseCSVLine(line);
    expect(result[5]).toBe('Nota con ; punto y coma');
    expect(result[9]).toBe('Notas del turno');
  });

  it('should generate Turno array from CSV text', () => {
    const csv = `Fecha;Inicio;Fin;Tipo;Cantidad;Nota Entrada;Hora Entrada;Total Facturado;Kilómetros;Notas Turno
2026-05-08;08:00;16:00;propina;10,50;Buen viaje;12:00;150,00;120;Sin notas
2026-05-08;08:00;16:00;datafono;20,00;Cobro tarjeta;13:00;150,00;120;Sin notas
2026-05-09;09:00;18:00;;;;;200,50;150;Turno sin entradas especiales`;

    const turnos = parseCSVToHistory(csv);
    
    // We expect 2 turnos because rows with same Date|Inicio|Fin are grouped together
    expect(turnos).toHaveLength(2);

    const turno1 = turnos.find(t => t.date === '2026-05-08');
    expect(turno1).toBeDefined();
    expect(turno1?.dinero).toBe(150);
    expect(turno1?.km).toBe(120);
    expect(turno1?.entries).toHaveLength(2);
    expect(turno1?.totalP).toBe(10.5);
    expect(turno1?.totalD).toBe(20);

    const turno2 = turnos.find(t => t.date === '2026-05-09');
    expect(turno2).toBeDefined();
    expect(turno2?.entries).toHaveLength(0); // No special entries
    expect(turno2?.dinero).toBe(200.5);
  });
});

describe('Date and Week Logic', () => {
  it('should calculate the correct week start date based on diaLibre', () => {
    // 2026-05-08 is a Friday
    // If diaLibre is 2 (Tuesday), the week should start on Wednesday (3)
    // 2026-05-06 is Wednesday
    const start = getWeekStartDate('2026-05-08', 2);
    expect(start).toBe('2026-05-06');

    // If diaLibre is 5 (Friday), the week should start on Saturday (6)
    // 2026-05-02 is Saturday
    const start2 = getWeekStartDate('2026-05-08', 5);
    expect(start2).toBe('2026-05-02');
  });

  it('should correctly determine getWeekRange (5 days after start)', () => {
    const range = getWeekRange('2026-05-06');
    expect(range.inicio).toBe('2026-05-06');
    expect(range.fin).toBe('2026-05-11');
  });
});

describe('Turno Totals Logic', () => {
  it('should correctly calculate the totals for an array of turnos', () => {
    const turnos: Partial<Turno>[] = [
      { totalP: 10, totalD: 20, totalA: 5, dinero: 100, km: 50 },
      { totalP: 5, totalF: 15, dinero: 150, km: 80 }
    ];

    const totals = calcularTotalesTurnos(turnos as Turno[]);
    expect(totals.totalP).toBe(15);
    expect(totals.totalD).toBe(20);
    expect(totals.totalA).toBe(5);
    expect(totals.totalF).toBe(15);
    expect(totals.totalE).toBe(0);
    expect(totals.dinero).toBe(250);
    expect(totals.km).toBe(130);
  });
});

describe('Merge Turnos Logic', () => {
  it('should merge turnos without duplicating them based on date and startTime', () => {
    const actuales = [
      { date: '2026-05-08', startTime: '08:00', id: 1, startDate: '2026-05-08' } as Turno,
      { date: '2026-05-09', startTime: '09:00', id: 2, startDate: '2026-05-09' } as Turno,
    ];

    const nuevos = [
      { date: '2026-05-08', startTime: '08:00', id: 3, startDate: '2026-05-08' } as Turno, // Duplicate key
      { date: '2026-05-10', startTime: '10:00', id: 4, startDate: '2026-05-10' } as Turno, // New
    ];

    const merged = mergeTurnos(actuales, nuevos);
    
    // Expect 3 turnos (the duplicate should be overwritten by the new one)
    expect(merged).toHaveLength(3);
    expect(merged.find(t => t.date === '2026-05-08')?.id).toBe(3); // Expecting the overwritten id
    expect(merged.find(t => t.date === '2026-05-10')).toBeDefined();
  });
});

describe('Backup Logic', () => {
  it('should include reservations and calendar notes in the full backup payload', () => {
    const backup = buildBackupPayload({
      history: '[]',
      settings: '{"diaLibre":2}',
      current: '{"entries":[]}',
      weekOverrides: '[]',
      weeksFrozen: '[]',
      reservations: '[{"id":"r1"}]',
      notes: '[{"id":"n1"}]'
    });

    expect(backup.reservations).toBe('[{"id":"r1"}]');
    expect(backup.notes).toBe('[{"id":"n1"}]');
  });
});
