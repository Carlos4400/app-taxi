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
    expect(source).toContain(`} else if ("OK" == json.optString("type")) {`);
    expect(source).toContain("currentScreen.value = ScreenState.ACTIVE_TURNO");
  });

  it("envia cada comando del reloj a un unico nodo conectado", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain("for (node in nodes)");
    expect(source).toContain("val node = nodes.first()");
  });

  it("firma el APK Wear con la misma clave debug fija que la app movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/build.gradle"),
      "utf8",
    );

    expect(source).toContain("storeFile file('../app/debug.keystore')");
    expect(source).toContain("debug {");
    expect(source).toContain("signingConfig signingConfigs.debug");
  });

  it("pide confirmacion antes de borrar una entrada desde el reloj", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("CONFIRM_DELETE");
    expect(source).toContain("onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE }");
    expect(source).toContain("sendDeleteEntry(e.id)");
  });

  it("gestiona el boton atras nativo sin cerrar la app durante flujos de trabajo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("BackHandler");
    expect(source).toContain("handleBack()");
    expect(source).toContain("ScreenState.ADD_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO");
    expect(source).toContain("ScreenState.EDIT_ENTRY -> currentScreen.value = ScreenState.ACTIVE_TURNO");
    expect(source).toContain("ScreenState.END_TURNO -> currentScreen.value = ScreenState.ACTIVE_TURNO");
  });

  it("muestra feedback visible y haptico despues de respuestas del movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("Toast.makeText");
    expect(source).toContain("VibrationEffect");
    expect(source).toContain("performFeedback(");
  });

  it("el instalador del reloj no fija un puerto adb concreto", () => {
    const source = readFileSync(
      resolve(root, "instalar_reloj.bat"),
      "utf8",
    );

    expect(source).not.toContain('set "WATCH=192.168.3.59:40201"');
    expect(source).toContain("if not defined WATCH");
    expect(source).toContain("devices -l");
  });

  it("compacta el teclado numerico para que no corte botones en pantalla redonda", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt"),
      "utf8",
    );

    expect(source).toContain("widthFraction: Float = 0.72f");
    expect(source).toContain("keyHeight: Dp = 28.dp");
    expect(source).not.toContain("modifier.fillMaxWidth(0.80f)");
  });

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("activeField");
    expect(source).toContain("CampoCierre");
    expect(source).toContain("reviewLabel");
    expect(source).toContain("Falta km");
    expect(source).toContain("keyHeight = 20.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("var step");
  });

  it("usa anchura segura en las filas principales del turno activo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("WatchSafeRowWidth");
    expect(source).toContain("fillMaxWidth(WatchSafeRowWidth)");
    expect(source).toContain("top = 26.dp");
    expect(source).toContain("WatchSafeButtonWidth = 0.86f");
    expect(source).toContain("align(Alignment.BottomCenter)");
    expect(source).toContain("bottom = 88.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("ScalingLazyColumn");
  });

  it("usa fondos Wear apagados como la app movil", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/theme/Color.kt"),
      "utf8",
    );

    expect(source).toContain("ColorDatafonoBg = Color(0xFF151032)");
    expect(source).toContain("ColorPropinaBg = Color(0xFF06240D)");
    expect(source).toContain("ColorNuloBg = Color(0xFF151922)");
    expect(source).toContain("ColorDisabledBg");
  });
});
