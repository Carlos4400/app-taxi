import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

describe("Android Wear bridge", () => {
  it("registra WearOsBridgePlugin en MainActivity para que Capacitor lo cargue", () => {
    const source = readFileSync(
      resolve(root, "android/app/src/main/java/com/mijornada/app/MainActivity.java"),
      "utf8",
    );

    expect(source).toContain("registerPlugin(WearOsBridgePlugin.class)");
  });

  it("no cambia pantallas de trabajo del reloj antes de recibir OK del movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain(`sendAddEntry(selectedCategory.value, amount, note)
                    currentScreen.value = ScreenState.ACTIVE_TURNO`);
    expect(source).not.toContain(`sendEndTurno(dinero, km)
                    currentScreen.value = ScreenState.NO_CONNECTED`);
    expect(source).toContain(`} else if ("OK" == json.optString("type")) {
                currentScreen.value = ScreenState.ACTIVE_TURNO`);
  });

  it("envia cada comando del reloj a un unico nodo conectado", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain("for (node in nodes)");
    expect(source).toContain("val node = nodes.first()");
  });
});
