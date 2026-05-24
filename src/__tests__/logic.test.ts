import { describe, it, expect } from 'vitest';
import {
  parseCSVLine,
  parseCSVToHistory,
  getWeekStartDate,
  getWeekId,
  getWeekRange,
  getTurnoFechaEfectiva,
  getTurnoAccountingWeekId,
  getCurrentOpenWeekId,
  selectAccountingHeroWeek,
  getTurnosByCalendarMonth,
  getTurnosByCalendarYear,
  getAccountingPeriodLabel,
  groupTurnosByWeek,
  calcularTotalesTurnos,
  calcularTurnoContable,
  calcularResumenContableTurnos,
  fmtMoneyNumber,
  fmtMoney,
  fmtKmNumber,
  ensureTurnosDiaLibreContable,
  mergeTurnos,
  sortTurnosByDateDesc,
  buildBackupPayload,
  buildBackupPayloadFromState,
  getHomeQuickActionIds,
  getBackupMenuActionIds,
  updateTurnoEntrega,
  getTurnosNotasSemana,
  KM_CARD_UNIT_STYLE,
  TIME_CARD_UNIT_STYLE,
  TIME_CARD_HOUR_UNIT_STYLE,
  WEEK_LIST_CARD_TEXT_SIZES,
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

  it('should not treat the previous work week as open on the free day', () => {
    expect(getCurrentOpenWeekId('2026-05-12', 2)).toBeNull();
    expect(getCurrentOpenWeekId('2026-05-13', 2)).toBe('2026-05-13');
  });

  it('should feature the latest week when there is no open week', () => {
    expect(selectAccountingHeroWeek(null, ['2026-05-06', '2026-04-29'])).toEqual({
      weekId: '2026-05-06',
      kind: 'latest',
    });
  });

  it('should feature the open week before previous weeks', () => {
    expect(selectAccountingHeroWeek('2026-05-13', ['2026-05-06'])).toEqual({
      weekId: '2026-05-13',
      kind: 'current',
    });
  });

  it('should keep same-day free-day work out of weekly accounting', () => {
    const turnoLibre = {
      date: '2026-05-12',
      startDate: '2026-05-12',
      startTime: '10:00',
      endTime: '18:00',
    } as Turno;

    expect(getTurnoAccountingWeekId(turnoLibre, 2)).toBeNull();
    expect(groupTurnosByWeek([turnoLibre], 2).size).toBe(0);
  });

  it('should assign free-day overnight work to the new week when it ends on the first work day', () => {
    const turnoNocturno = {
      date: '2026-05-13',
      startDate: '2026-05-12',
      startTime: '22:00',
      endTime: '06:00',
    } as Turno;

    expect(getTurnoAccountingWeekId(turnoNocturno, 2)).toBe('2026-05-13');
  });

  it('should use the turno saved free day instead of the current free day', () => {
    const turno = {
      date: '2026-05-12',
      startDate: '2026-05-12',
      startTime: '10:00',
      endTime: '18:00',
      diaLibreContable: 1,
    } as Turno;

    expect(getTurnoAccountingWeekId(turno, 2)).toBe('2026-05-12');
    expect(Array.from(groupTurnosByWeek([turno], 2).keys())).toEqual(['2026-05-12']);
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

describe('Money Formatting Logic', () => {
  it('should format euros with Spanish thousands and decimal separators', () => {
    expect(fmtMoneyNumber(1102.9)).toBe('1.102,90');
    expect(fmtMoney(1102.9)).toBe('1.102,90 €');
  });
  it('should format kilometers with Spanish thousands separators', () => {
    expect(fmtKmNumber(1029)).toBe('1.029');
    expect(fmtKmNumber(12345.6)).toBe('12.345,6');
  });
});

describe('Turno Accounting Config Logic', () => {
  const settingsActuales = {
    "porcentaje.jefe": 55,
    "porcentaje.chofer": 45,
    "descontar.datafono": true,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,
    diaLibreDesde: null,
  };

  it('should calculate a turno with its saved percentages instead of current settings', () => {
    const turno = {
      dinero: 100,
      totalN: 10,
      totalP: 5,
      totalD: 7,
      totalA: 3,
      totalE: 2,
      totalF: 1,
      configTurno: {
        porcentajeChofer: 43,
        porcentajeJefe: 57,
        descDatafono: false,
        descAgencia: true,
        descExtra: false,
        descGasolina: true,
      },
    } as Turno;

    const calculo = calcularTurnoContable(turno, settingsActuales);

    expect(calculo.dineroBase).toBe(90);
    expect(calculo.miGanancia).toBe(43.7);
    expect(calculo.totalDescontar).toBe(4);
    expect(calculo.totalADar).toBe(47.3);
  });

  it('should use current settings as fallback for old turnos without saved percentages', () => {
    const turno = {
      dinero: 100,
      totalN: 10,
      totalP: 5,
      totalD: 7,
      totalA: 3,
      totalE: 2,
      totalF: 1,
    } as Turno;

    const calculo = calcularTurnoContable(turno, settingsActuales);

    expect(calculo.miGanancia).toBe(45.5);
    expect(calculo.totalDescontar).toBe(13);
    expect(calculo.totalADar).toBe(36.5);
  });

  it('should aggregate accounting totals turno by turno with mixed saved percentages', () => {
    const turnos = [
      {
        dinero: 100,
        totalN: 0,
        totalP: 0,
        configTurno: {
          porcentajeChofer: 40,
          porcentajeJefe: 60,
          descDatafono: false,
          descAgencia: false,
          descExtra: false,
          descGasolina: false,
        },
      },
      {
        dinero: 200,
        totalN: 0,
        totalP: 10,
        configTurno: {
          porcentajeChofer: 50,
          porcentajeJefe: 50,
          descDatafono: false,
          descAgencia: false,
          descExtra: false,
          descGasolina: false,
        },
      },
    ] as Turno[];

    const resumen = calcularResumenContableTurnos(turnos, settingsActuales);

    expect(resumen.dineroBase).toBe(300);
    expect(resumen.miGanancia).toBe(150);
    expect(resumen.totalADar).toBe(160);
  });

  it('should subtract nulos from aggregated taximeter total', () => {
    const turnos = [
      { dinero: 100, totalN: 10 },
      { dinero: 200, totalN: 5 },
    ] as Turno[];

    const resumen = calcularResumenContableTurnos(turnos, settingsActuales);

    expect(resumen.dinero).toBe(300);
    expect(resumen.totalN).toBe(15);
    expect(resumen.dineroBase).toBe(285);
  });
});

describe('Monthly Turno Selection Logic', () => {
  it('should select turnos by calendar month using startDate when available', () => {
    const turnos = [
      { id: 1, date: '2026-05-01', startDate: '2026-04-30', startTime: '23:00' },
      { id: 2, date: '2026-05-15', startDate: '2026-05-15', startTime: '08:00' },
      { id: 3, date: '2026-06-01', startDate: null, startTime: '09:00' },
    ] as Turno[];

    expect(getTurnosByCalendarMonth(turnos, 2026, 5).map((t) => t.id)).toEqual([2]);
  });
});

describe('Accounting Period Label Logic', () => {
  it('should format the selected accounting month and year', () => {
    expect(getAccountingPeriodLabel(2026, 5)).toBe('Mayo 2026');
  });
});

describe('Weekly Accounting Card Text Sizing', () => {
  it('should use container-based dynamic font sizes for compact mobile cards', () => {
    expect(WEEK_LIST_CARD_TEXT_SIZES.range).toContain('clamp(');
    expect(WEEK_LIST_CARD_TEXT_SIZES.range).toContain('cqw');
    expect(WEEK_LIST_CARD_TEXT_SIZES.meta).toContain('clamp(');
    expect(WEEK_LIST_CARD_TEXT_SIZES.metric).toContain('clamp(');
  });
});

describe('KM Card Unit Style', () => {
  it('should keep KM visually aligned with the other compact units', () => {
    expect(KM_CARD_UNIT_STYLE.fontSize).toBe('0.72em');
    expect(KM_CARD_UNIT_STYLE.fontWeight).toBe(900);
    expect(KM_CARD_UNIT_STYLE.letterSpacing).toBe('normal');
  });
});

describe('Time Card Unit Style', () => {
  it('should separate h and m manually from their numbers', () => {
    expect(TIME_CARD_UNIT_STYLE.marginLeft).toBe(2);
    expect(TIME_CARD_UNIT_STYLE.letterSpacing).toBe('normal');
    expect(TIME_CARD_HOUR_UNIT_STYLE.marginRight).toBe(6);
  });

  it('should match the visual weight of the KM unit', () => {
    expect(TIME_CARD_UNIT_STYLE.fontSize).toBe('1em');
    expect(TIME_CARD_UNIT_STYLE.fontWeight).toBe(KM_CARD_UNIT_STYLE.fontWeight);
  });
});

describe('Annual Turno Selection Logic', () => {
  it('should select turnos by calendar year using startDate when available', () => {
    const turnos = [
      { id: 1, date: '2026-01-01', startDate: '2025-12-31', startTime: '23:00' },
      { id: 2, date: '2026-05-15', startDate: '2026-05-15', startTime: '08:00' },
      { id: 3, date: '2027-01-01', startDate: null, startTime: '09:00' },
    ] as Turno[];

    expect(getTurnosByCalendarYear(turnos, 2026).map((t) => t.id)).toEqual([2]);
  });
});

describe('Turno Dia Libre Migration Logic', () => {
  it('should fill missing diaLibreContable without changing existing values', () => {
    const turnos = [
      { id: 1, date: '2026-05-12', startDate: '2026-05-12' },
      { id: 2, date: '2026-05-13', startDate: '2026-05-13', diaLibreContable: 1 },
    ] as Turno[];

    const migrated = ensureTurnosDiaLibreContable(turnos, 2);

    expect(migrated[0].diaLibreContable).toBe(2);
    expect(migrated[1].diaLibreContable).toBe(1);
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

  it('should keep turnos with same date and start time when end time is different', () => {
    const actuales = [
      { date: '2026-05-08', startDate: '2026-05-08', startTime: '08:00', endTime: '12:00', id: 1 } as Turno,
    ];

    const nuevos = [
      { date: '2026-05-08', startDate: '2026-05-08', startTime: '08:00', endTime: '18:00', id: 2 } as Turno,
    ];

    const merged = mergeTurnos(actuales, nuevos);

    expect(merged).toHaveLength(2);
    expect(merged.map((t) => t.id).sort()).toEqual([1, 2]);
  });
});

describe('Turno Sorting Logic', () => {
  it('should order imported and synced turnos by date descending', () => {
    const turnos = [
      { date: '2026-05-07', startTime: '07:53', id: 1, startDate: '2026-05-07' },
      { date: '2026-05-06', startTime: '12:39', id: 2, startDate: '2026-05-06' },
      { date: '2026-05-04', startTime: '17:36', id: 3, startDate: '2026-05-04' },
      { date: '2026-05-08', startTime: '08:16', id: 4, startDate: '2026-05-08' },
      { date: '2026-05-09', startTime: '08:04', id: 5, startDate: '2026-05-09' },
      { date: '2026-05-10', startTime: '07:48', id: 6, startDate: '2026-05-10' },
      { date: '2026-05-11', startTime: '07:56', id: 7, startDate: '2026-05-11' },
    ] as Turno[];

    expect(sortTurnosByDateDesc(turnos).map((t) => t.date)).toEqual([
      '2026-05-11',
      '2026-05-10',
      '2026-05-09',
      '2026-05-08',
      '2026-05-07',
      '2026-05-06',
      '2026-05-04',
    ]);
  });
});

describe('Backup Logic', () => {
  it('should include reservations and calendar notes in the full backup payload', () => {
    const backup = buildBackupPayload({
      history: '[]',
      settings: '{"diaLibre":2}',
      current: '{"entries":[]}',
      weekOverrides: '[]',
      reservations: '[{"id":"r1"}]',
      notes: '[{"id":"n1"}]'
    });

    expect(backup.reservations).toBe('[{"id":"r1"}]');
    expect(backup.notes).toBe('[{"id":"n1"}]');
  });

  it('should build a full backup from current in-memory state', () => {
    const backup = buildBackupPayloadFromState({
      history: [{ id: 1, date: '2026-05-12', startDate: '2026-05-12' } as Turno],
      settings: {
        "porcentaje.jefe": 55,
        "porcentaje.chofer": 45,
        "descontar.datafono": true,
        "descontar.agencia_bono": true,
        "descontar.extra": true,
        "descontar.gasolina": true,
        diaLibre: 2,
        diaLibreDesde: null,
      },
      current: { entries: [], startTime: null, startDate: null },
      weekOverrides: [{ weekId: '2026-05-06', notes: '', entregada: true, fechaEntrega: '2026-05-12' }],
      reservations: [{ id: 'r1', date: '2026-05-12', time: '10:00', origen: 'A', destino: 'B', cliente: 'C', telefono: '1', notas: '' }],
      notes: [{ id: 'n1', date: '2026-05-12', tipo: 'Normal', texto: 'Nota' }],
    });

    expect(JSON.parse(backup.history || '[]')).toHaveLength(1);
    expect(JSON.parse(backup.weekOverrides || '[]')[0].entregada).toBe(true);
    expect(JSON.parse(backup.reservations || '[]')[0].id).toBe('r1');
  });
});

describe('Home and Backup Actions', () => {
  it('should expose admin access from home only for admins', () => {
    expect(getHomeQuickActionIds(false)).not.toContain('admin-users');
    expect(getHomeQuickActionIds(true)).toContain('admin-users');
  });

  it('should keep logout out of the backup menu', () => {
    expect(getBackupMenuActionIds(false)).not.toContain('logout');
    expect(getBackupMenuActionIds(true)).not.toContain('logout');
    expect(getBackupMenuActionIds(true)).not.toContain('admin-users');
  });
});

describe('Loose Turno Delivery Logic', () => {
  it('should mark a loose turno as delivered without changing other turnos', () => {
    const turnos = [
      { id: 1, date: '2026-05-12', startDate: '2026-05-12', startTime: '10:00' },
      { id: 2, date: '2026-05-13', startDate: '2026-05-13', startTime: '10:00' },
    ] as Turno[];

    const updated = updateTurnoEntrega(turnos, 1, true, '2026-05-14');

    expect(updated.find(t => t.id === 1)?.entregada).toBe(true);
    expect(updated.find(t => t.id === 1)?.fechaEntrega).toBe('2026-05-14');
    expect(updated.find(t => t.id === 2)?.entregada).toBeUndefined();
  });
});

describe('Weekly Turno Notes Logic', () => {
  it('should return only turnos with entry notes', () => {
    const turnos = [
      {
        id: 1,
        date: '2026-05-11',
        notes: 'Nota interna del turno',
        entries: [],
      },
      {
        id: 2,
        date: '2026-05-12',
        notes: '',
        entries: [
          { id: 21, type: 'extra', amount: 9, note: 'Compra', time: '17:47' },
          { id: 22, type: 'propina', amount: 3, note: '', time: '18:00' },
        ],
      },
      {
        id: 3,
        date: '2026-05-13',
        notes: '',
        entries: [{ id: 31, type: 'nota', amount: 0, note: 'Aviso general', time: '12:00' }],
      },
      {
        id: 4,
        date: '2026-05-14',
        notes: '',
        entries: [{ id: 41, type: 'extra', amount: 1, note: '', time: '12:00' }],
      },
    ] as Turno[];

    const result = getTurnosNotasSemana(turnos);

    expect(result.map((item) => item.turno.id)).toEqual([2, 3]);
    expect(result[0].notasDetalladas.map((entry) => entry.id)).toEqual([21]);
    expect(result[1].notasGenerales.map((entry) => entry.id)).toEqual([31]);
  });
});

// ============================================================================
// 🔒 CANDADO DE SEGURIDAD — FÓRMULAS DE CONTABILIDAD
// ============================================================================
// Estos tests blindan las fórmulas documentadas en "parte contabilidad/".
// Si alguna modificación (accidental o intencionada) cambia la lógica de
// cálculo de las tarjetas, estos tests fallarán inmediatamente.
// NO MODIFICAR ESTOS TESTS salvo que el usuario lo solicite expresamente.
// ============================================================================

describe('🔒 Accounting Card Safety Lock — calcularTurnoContable', () => {
  const settings = {
    "porcentaje.jefe": 55,
    "porcentaje.chofer": 45,
    "descontar.datafono": true,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,
    diaLibreDesde: null,
  };

  // Turno realista con todos los campos
  const turnoCompleto = {
    id: 999,
    date: '2026-05-10',
    startDate: '2026-05-10',
    startTime: '08:00',
    endTime: '16:30',
    dinero: 245.80,
    km: 187,
    totalP: 12.50,
    totalD: 35.00,
    totalA: 18.00,
    totalE: 7.50,
    totalF: 22.00,
    totalN: 15.00,
    entries: [],
    notes: "",
  } as Turno;

  it('🔒 dineroBase = dinero - nulos (245.80 - 15.00 = 230.80)', () => {
    const c = calcularTurnoContable(turnoCompleto, settings);
    expect(c.dineroBase).toBe(230.80);
  });

  it('🔒 miGanancia = (dineroBase * %chofer) + propinas ((230.80 * 0.45) + 12.50 = 116.36)', () => {
    const c = calcularTurnoContable(turnoCompleto, settings);
    expect(c.miGanancia).toBe(116.36);
  });

  it('🔒 totalDescontar = descD + descA + descE + descF (35 + 18 + 7.50 + 22 = 82.50)', () => {
    const c = calcularTurnoContable(turnoCompleto, settings);
    expect(c.totalDescontar).toBe(82.50);
  });

  it('🔒 totalADar = (dineroBase * %jefe) - totalDescontar ((230.80 * 0.55) - 82.50 = 44.44)', () => {
    const c = calcularTurnoContable(turnoCompleto, settings);
    expect(c.totalADar).toBe(44.44);
  });

  it('🔒 descuentos desactivados deben valer 0', () => {
    const settingsNada = {
      ...settings,
      "descontar.datafono": false as const,
      "descontar.agencia_bono": false as const,
      "descontar.extra": false as const,
      "descontar.gasolina": false as const,
    };
    const c = calcularTurnoContable(turnoCompleto, settingsNada);
    expect(c.descD).toBe(0);
    expect(c.descA).toBe(0);
    expect(c.descE).toBe(0);
    expect(c.descF).toBe(0);
    expect(c.totalDescontar).toBe(0);
  });

  it('🔒 nulos siempre se restan del taxímetro antes de cualquier cálculo', () => {
    const turnoConNulos = { ...turnoCompleto, dinero: 100, totalN: 30 } as Turno;
    const c = calcularTurnoContable(turnoConNulos, settings);
    expect(c.dineroBase).toBe(70); // 100 - 30
  });

  it('🔒 configTurno guardada tiene prioridad sobre settings actuales', () => {
    const turnoConConfig = {
      ...turnoCompleto,
      configTurno: {
        porcentajeChofer: 50,
        porcentajeJefe: 50,
        descDatafono: false,
        descAgencia: false,
        descExtra: false,
        descGasolina: false,
      },
    } as Turno;
    const c = calcularTurnoContable(turnoConConfig, settings);
    // dineroBase = 230.80, miGanancia = (230.80 * 0.50) + 12.50 = 127.90
    expect(c.miGanancia).toBe(127.9);
    expect(c.totalDescontar).toBe(0); // Todos desactivados en configTurno
    // totalADar = (230.80 * 0.50) - 0 = 115.40
    expect(c.totalADar).toBe(115.4);
  });
});

describe('🔒 Accounting Card Safety Lock — calcularResumenContableTurnos (Semana/Mes)', () => {
  const settings = {
    "porcentaje.jefe": 55,
    "porcentaje.chofer": 45,
    "descontar.datafono": true,
    "descontar.agencia_bono": true,
    "descontar.extra": true,
    "descontar.gasolina": true,
    diaLibre: 2,
    diaLibreDesde: null,
  };

  const turno1 = {
    id: 1, date: '2026-05-06', startDate: '2026-05-06',
    startTime: '08:00', endTime: '16:00', notes: '',
    dinero: 200, km: 120, totalP: 10, totalD: 20, totalA: 5,
    totalE: 3, totalF: 8, totalN: 10, entries: [],
  } as Turno;

  const turno2 = {
    id: 2, date: '2026-05-07', startDate: '2026-05-07',
    startTime: '08:00', endTime: '16:00', notes: '',
    dinero: 300, km: 180, totalP: 15, totalD: 30, totalA: 10,
    totalE: 5, totalF: 12, totalN: 20, entries: [],
  } as Turno;

  const turnosSemana = [turno1, turno2];

  it('🔒 dineroBase semanal = suma(dinero) - suma(nulos) ((200+300) - (10+20) = 470)', () => {
    const r = calcularResumenContableTurnos(turnosSemana, settings);
    expect(r.dineroBase).toBe(470);
  });

  it('🔒 km semanal = suma de km de todos los turnos (120 + 180 = 300)', () => {
    const r = calcularResumenContableTurnos(turnosSemana, settings);
    expect(r.km).toBe(300);
  });

  it('🔒 miGanancia semanal = suma de miGanancia turno por turno', () => {
    // turno1: (190 * 0.45) + 10 = 95.50
    // turno2: (280 * 0.45) + 15 = 141.00
    // total: 236.50
    const r = calcularResumenContableTurnos(turnosSemana, settings);
    expect(r.miGanancia).toBe(236.5);
  });

  it('🔒 totalDescontar semanal = suma de totalDescontar turno por turno', () => {
    // turno1: 20 + 5 + 3 + 8 = 36
    // turno2: 30 + 10 + 5 + 12 = 57
    // total: 93
    const r = calcularResumenContableTurnos(turnosSemana, settings);
    expect(r.totalDescontar).toBe(93);
  });

  it('🔒 totalADar semanal = suma de totalADar turno por turno', () => {
    // turno1: (190 * 0.55) - 36 = 104.50 - 36 = 68.50
    // turno2: (280 * 0.55) - 57 = 154.00 - 57 = 97.00
    // total: 165.50
    const r = calcularResumenContableTurnos(turnosSemana, settings);
    expect(r.totalADar).toBe(165.5);
  });

  it('🔒 categorías sueltas se suman directamente (totalD, totalP, totalA, totalE, totalF, totalN)', () => {
    const r = calcularResumenContableTurnos(turnosSemana, settings);
    expect(r.totalD).toBe(50);  // 20 + 30
    expect(r.totalP).toBe(25);  // 10 + 15
    expect(r.totalA).toBe(15);  // 5 + 10
    expect(r.totalE).toBe(8);   // 3 + 5
    expect(r.totalF).toBe(20);  // 8 + 12
    expect(r.totalN).toBe(30);  // 10 + 20
  });

  it('🔒 redondeo roundMoney aplicado a todos los resultados monetarios', () => {
    // Turno con decimales que podrían causar errores de punto flotante
    const turnoDecimal = {
      id: 3, date: '2026-05-08', startDate: '2026-05-08',
      startTime: '08:00', endTime: '16:00', notes: '',
      dinero: 133.33, km: 95, totalP: 7.77, totalD: 11.11,
      totalA: 0, totalE: 0, totalF: 0, totalN: 3.33, entries: [],
    } as Turno;
    const c = calcularTurnoContable(turnoDecimal, settings);
    // dineroBase = 133.33 - 3.33 = 130.00
    expect(c.dineroBase).toBe(130);
    // miGanancia = (130 * 0.45) + 7.77 = 58.50 + 7.77 = 66.27
    expect(c.miGanancia).toBe(66.27);
    // totalDescontar = 11.11
    expect(c.totalDescontar).toBe(11.11);
    // totalADar = (130 * 0.55) - 11.11 = 71.50 - 11.11 = 60.39
    expect(c.totalADar).toBe(60.39);
  });
});
