import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("regresiones de navegación", () => {
  it("editar turno vuelve al resumen sin apilar otra pantalla", async () => {
    const source = await readFile("src/screens/edit-turno-screen.tsx", "utf8");

    expect(source).not.toContain("setScreen('summary')");
    expect(source).not.toContain('setScreen("summary")');
    expect(source).toContain("replaceScreen('summary')");
  });

  it("detalle semana abre el resumen de notas con el turno seleccionado", async () => {
    const source = await readFile("src/screens/detalle-semana-screen.tsx", "utf8");

    expect(source).toContain('setReturnScreen("detalleSemana");');
    expect(source).toContain("setViewTurno(data.turno);");
  });
});
