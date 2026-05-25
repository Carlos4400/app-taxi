import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Accounting extraction", () => {
  const accountingPath = resolve("src/logic/accounting.ts");
  const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");

  it("keeps pure accounting formulas outside main.tsx", async () => {
    expect(existsSync(accountingPath)).toBe(true);

    const modulePath = "../logic/accounting";
    const {
      calcularTotalesTurnos,
      calcularTurnoContable,
      calcularResumenContableTurnos,
      roundMoney,
    } = await import(modulePath);

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
    const turno = {
      dinero: 245.8,
      totalN: 15,
      totalP: 12.5,
      totalD: 35,
      totalA: 18,
      totalE: 7.5,
      totalF: 22,
      km: 120,
    };

    expect(calcularTotalesTurnos([turno])).toMatchObject({ dinero: 245.8, totalN: 15, km: 120 });
    expect(calcularTurnoContable(turno, settings)).toMatchObject({
      dineroBase: 230.8,
      miGanancia: 116.36,
      totalDescontar: 82.5,
      totalADar: 44.44,
    });
    expect(calcularResumenContableTurnos([turno], settings)).toMatchObject({
      dineroBase: 230.8,
      miGanancia: 116.36,
      totalDescontar: 82.5,
      totalADar: 44.44,
    });
    expect(roundMoney(1.005)).toBe(1.01);

    expect(mainSource).toContain('from "./logic/accounting"');
    expect(mainSource).not.toMatch(/^export function calcularTurnoContable\(/m);
    expect(mainSource).not.toMatch(/^export function calcularResumenContableTurnos\(/m);
    expect(mainSource).not.toMatch(/^function roundMoney\(/m);
  });
});
