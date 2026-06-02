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

  it("mantiene nombres visibles nativos Mi Turno y Mi Turno Watch", () => {
    const mobileStrings = readFileSync(
      resolve(root, "android/app/src/main/res/values/strings.xml"),
      "utf8",
    );
    const wearStrings = readFileSync(
      resolve(root, "android/wear/src/main/res/values/strings.xml"),
      "utf8",
    );
    const capacitorConfig = readFileSync(
      resolve(root, "capacitor.config.ts"),
      "utf8",
    );

    expect(mobileStrings).toContain(`<string name="app_name">Mi Turno</string>`);
    expect(mobileStrings).toContain(`<string name="title_activity_main">Mi Turno</string>`);
    expect(capacitorConfig).toContain("appName: 'Mi Turno'");
    expect(wearStrings).toContain(`<string name="app_name">Mi Turno Watch</string>`);
    expect(wearStrings).not.toContain("Mi Jornada");
  });

  it("ofrece home y turnos Wear parecidos al movil sin guardar historial en el reloj", () => {
    const noActive = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt"),
      "utf8",
    );
    const main = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(noActive).toContain("Mi Turno");
    expect(noActive).toContain("fechaLabel");
    expect(noActive).toContain("Iniciar Turno");
    expect(noActive).toContain("Turnos");
    expect(noActive).toContain("Móvil conectado");
    expect(main).toContain("ScreenState.TURNOS");
    expect(main).toContain("sendGetTurnos()");
    expect(main).toContain(`put("type", "GET_TURNOS")`);
    expect(main).toContain("parseTurnos(json.optJSONArray(\"turnos\"))");
    expect(main).not.toContain("FirebaseFirestore");
  });

  it("muestra lista y resumen de turnos Wear como la app movil adaptada", () => {
    const turnos = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt"),
      "utf8",
    );
    const resumen = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt"),
      "utf8",
    );

    expect(turnos).toContain("fun TurnosScreen(");
    expect(turnos).toContain("TurnoCard");
    expect(turnos).toContain("Total Taxímetro");
    expect(turnos).toContain("Mi Ganancia");
    expect(turnos).toContain("Tiempo");
    expect(resumen).toContain("Resumen del Turno");
    expect(resumen).toContain("Total Taxímetro");
    expect(resumen).toContain("Mi Ganancia");
    expect(resumen).toContain("Total KM");
    expect(resumen).toContain("Tiempo trabajado");
    expect(resumen).toContain("Notas del turno");
    expect(resumen).toContain("Notas detalladas");
    expect(resumen).toContain("Total a descontar");
    expect(resumen).toContain("Total a dar");
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
      resolve(root, "Actualizaciones/actualizar_reloj.bat"),
      "utf8",
    );

    expect(source).not.toContain('set "WATCH=192.168.3.59:40201"');
    expect(source).toContain("if not defined WATCH");
    expect(source).toContain("devices -l");
  });

  it("mantiene un actualizador directo del reloj para compilar instalar y abrir", () => {
    const source = readFileSync(
      resolve(root, "Actualizaciones/actualizar_reloj.bat"),
      "utf8",
    );

    expect(source).toContain(":wear:assembleDebug");
    expect(source).toContain("adb.exe");
    expect(source).toContain("connect !WATCH!");
    expect(source).toContain("install -r");
    expect(source).toContain("am start -n com.mijornada.app/com.mijornada.app.WearMainActivity");
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

  it("deja el teclado de entrada con borrar cero coma en la ultima fila", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt"),
      "utf8",
    );

    expect(source).toContain(`listOf("DEL", "0", ",")`);
    expect(source).not.toContain("SaveKey(");
    expect(source).not.toContain("saveEnabled");
  });

  it("centra la entrada Wear con guardar junto al importe y nota abajo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt"),
      "utf8",
    );

    expect(source).toContain("GuardarImporteButton(");
    expect(source).toContain("modifier = Modifier.fillMaxWidth(0.74f)");
    expect(source).toContain("horizontalArrangement = Arrangement.Center");
    expect(source).toContain("NotaButton(");
    expect(source).not.toContain("onSave = { if (amount > 0.0) onSave(amount, note) }");
    expect(source).not.toContain("saveEnabled = amount > 0.0");
  });

  it("muestra Editar en rojo y mantiene la categoria con su color en Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt"),
      "utf8",
    );

    expect(source).toContain("EntryTitle(");
    expect(source).toContain(`Text("Editar", color = ColorGasolina`);
    expect(source).toContain("Text(categoryLabel, color = categoryColor");
    expect(source).not.toContain(`text = if (onDelete != null) "Editar $categoryLabel" else categoryLabel`);
  });

  it("nombra la accion peligrosa de edicion como eliminar entrada", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt"),
      "utf8",
    );

    expect(source).toContain(`Text("Eliminar entrada", color = ColorGasolina`);
    expect(source).not.toContain(`Text("Borrar entrada"`);
  });

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("activeField");
    expect(source).toContain("CampoCierre");
    expect(source).toContain("Resumen de hoy");
    expect(source).toContain("Notas del turno");
    expect(source).toContain("Notas detalladas");
    expect(source).toContain("TecladoCierreOverlay");
    expect(source).toContain("keyHeight = 20.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("var confirming");
    expect(source).not.toContain("ConfirmarCierre(");
    expect(source).not.toContain("Revisar");
    expect(source).not.toContain("Falta €");
    expect(source).not.toContain("Falta km");
  });

  it("pasa entradas y contadores a la pantalla unica de cierre Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("numPorTipo = numPorTipo.value");
    expect(source).toContain("entradas = entradas.value");
  });

  it("mantiene el boton de terminar turno dentro del scroll del turno activo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("WatchSafeRowWidth");
    expect(source).toContain("fillMaxWidth(WatchSafeRowWidth)");
    expect(source).toContain("top = 26.dp");
    expect(source).toContain("WatchSafeButtonWidth = 0.86f");
    expect(source).toContain("bottom = 22.dp");
    expect(source).toContain(`Text("Terminar turno"`);
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("align(Alignment.BottomCenter)");
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
