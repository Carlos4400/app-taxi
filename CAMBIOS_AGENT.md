## 2026-06-03 00:17 - Integrar logo de Home

**Archivos modificados:** `src/components/brand-assets.tsx`, `src/screens/home-screen.tsx`, `src/__tests__/brand-assets.test.ts`

### Cambio 1 - Marca hero del taxi

#### Código anterior
```tsx
const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";
```

`No existía BrandTaxiHero en src/components/brand-assets.tsx.`

#### Código nuevo
```tsx
const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";
const BRAND_HERO = "/brand/brand-taxi-hero.png";
```

```tsx
type BrandTaxiHeroProps = {
  width?: number;
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiHero: FC<BrandTaxiHeroProps> = ({
  width = 184,
  alt = "Mi Turno Taxi",
  style,
}) => (
  <img
    src={BRAND_HERO}
    width={width}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "block",
      width,
      maxWidth: "78%",
      height: "auto",
      objectFit: "contain",
      margin: "0 auto",
      filter:
        "drop-shadow(0 0 18px rgba(251, 191, 36, 0.20)) drop-shadow(0 0 16px rgba(56, 189, 248, 0.12))",
      ...style,
    }}
  />
);
```

#### Por qué se cambió
La pantalla Home no debía usar el logo rectangular plano. Se añadió un componente específico para la marca principal con asset transparente y sombra integrada.

### Cambio 2 - Uso del hero en Home

#### Código anterior
```tsx
import { BrandTaxiLogo } from "../components/brand-assets";
```

```tsx
          <BrandTaxiLogo width={168} style={{ marginBottom: 18 }} />
```

#### Código nuevo
```tsx
import { BrandTaxiHero } from "../components/brand-assets";
```

```tsx
          <BrandTaxiHero width={190} style={{ marginBottom: 18 }} />
```

#### Por qué se cambió
El logo anterior se veía como una imagen pegada encima del título. El nuevo `BrandTaxiHero` usa el recorte transparente preparado para integrarse visualmente con el fondo oscuro de la app.

### Cambio 3 - Regresión de integración visual

#### Código anterior
```ts
    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
```

```ts
    expect(home).toContain("<BrandTaxiLogo");
    expect(settings).toContain("<BrandTaxiLogo");
    expect(wearHome).toContain("BrandTaxiLogo(");
    expect(home).not.toContain("🚕");
    expect(settings).not.toContain("🚕");
    expect(wearHome).not.toContain("🚕");
```

#### Código nuevo
```ts
    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("BrandTaxiHero");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(brandAssets).toContain("/brand/brand-taxi-hero.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-hero.png"))).toBe(true);
```

```ts
    expect(home).toContain("<BrandTaxiHero");
    expect(home).not.toContain("<BrandTaxiLogo");
    expect(settings).toContain("<BrandTaxiLogo");
    expect(wearHome).toContain("BrandTaxiLogo(");
    expect(home).not.toContain("\u{1F695}");
    expect(settings).not.toContain("\u{1F695}");
    expect(wearHome).not.toContain("\u{1F695}");
```

#### Por qué se cambió
Se fijó por prueba que Home use el componente hero y no vuelva al logo rectangular. También se cambió la comprobación del emoji a escape Unicode para evitar confusiones de codificación.

## 2026-06-02 21:36 - Añadir actualizador Wear

**Archivos modificados:** `actualizar_reloj.bat`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba del actualizador directo

#### Código anterior
`No existía la prueba "mantiene un actualizador directo del reloj para compilar instalar y abrir" en src/__tests__/android-wear-bridge.test.ts.`

#### Código nuevo
```ts
  it("mantiene un actualizador directo del reloj para compilar instalar y abrir", () => {
    const source = readFileSync(
      resolve(root, "actualizar_reloj.bat"),
      "utf8",
    );

    expect(source).toContain(":wear:assembleDebug");
    expect(source).toContain("adb.exe");
    expect(source).toContain("connect !WATCH!");
    expect(source).toContain("install -r");
    expect(source).toContain("am start -n com.mijornada.app/com.mijornada.app.WearMainActivity");
  });
```

#### Por qué se cambió
Se añadió una prueba para fijar que el actualizador del reloj compile el módulo Wear, use ADB, permita conexión por `IP:PUERTO`, instale el APK y abra la app del reloj.

### Cambio 2 - Script actualizar_reloj.bat

#### Código anterior
`No existía actualizar_reloj.bat.`

#### Código nuevo
```bat
@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Actualizar Mi Turno Watch

set "ROOT=C:\Users\carlo\Desktop\APP Taxi"
set "ANDROID_DIR=%ROOT%\android"
set "ADB=C:\Users\carlo\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "APK=%ANDROID_DIR%\wear\build\outputs\apk\debug\wear-debug.apk"
set "WATCH="

echo ============================================
echo  Actualizar Mi Turno Watch
echo ============================================
echo.

if not exist "%ADB%" (
  echo [ERROR] No se encontro adb.exe:
  echo %ADB%
  pause
  exit /b 1
)

if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] No se encontro Java en:
  echo %JAVA_HOME%
  pause
  exit /b 1
)

echo [1/4] Compilando app del reloj...
cd /d "%ANDROID_DIR%"
call gradlew.bat :wear:assembleDebug --console=plain
if errorlevel 1 (
  echo.
  echo [ERROR] La compilacion del reloj ha fallado.
  pause
  exit /b 1
)

if not exist "%APK%" (
  echo.
  echo [ERROR] No se encontro el APK generado:
  echo %APK%
  pause
  exit /b 1
)

echo.
echo [2/4] Buscando reloj conectado...
"%ADB%" devices -l
for /f "skip=1 tokens=1,2,*" %%a in ('"%ADB%" devices -l') do (
  if "%%b"=="device" if not defined WATCH set "WATCH=%%a"
)

if not defined WATCH (
  echo.
  echo No hay reloj conectado por ADB.
  set /p WATCH=Escribe IP:PUERTO del reloj:
  if not defined WATCH (
    echo [ERROR] No se indico IP:PUERTO.
    pause
    exit /b 1
  )
  "%ADB%" connect !WATCH!
  if errorlevel 1 (
    echo.
    echo [ERROR] No se pudo conectar con !WATCH!
    pause
    exit /b 1
  )
)

echo.
echo Reloj seleccionado: !WATCH!
echo.
echo [3/4] Instalando APK...
"%ADB%" -s !WATCH! install -r "%APK%"
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo instalar el APK.
  pause
  exit /b 1
)

echo.
echo [4/4] Abriendo Mi Turno Watch...
"%ADB%" -s !WATCH! shell am start -n com.mijornada.app/com.mijornada.app.WearMainActivity

echo.
echo ============================================
echo  Reloj actualizado correctamente.
echo ============================================
pause
```

#### Por qué se cambió
Se añadió un actualizador directo para que, tras modificar la app del reloj, se pueda compilar, instalar y abrir `Mi Turno Watch` desde un único archivo.

## 2026-06-02 21:20 - Añadir turnos guardados Wear

**Archivos modificados:** `src/shared/watch-commands.ts`, `src/logic/watch-command-processor.ts`, `src/__tests__/watch-command-processor.test.ts`, `src/__tests__/android-wear-bridge.test.ts`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt`, `android/wear/src/main/java/com/mijornada/app/screens/TurnosScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/TurnoSummaryScreen.kt`

### Cambio 1 - Prueba de turnos guardados para Wear

#### Código anterior
`No existía la prueba "GET_TURNOS devuelve turnos guardados preparados para el reloj" en src/__tests__/watch-command-processor.test.ts.`

#### Código nuevo
```ts
  it("GET_TURNOS devuelve turnos guardados preparados para el reloj", () => {
    const command: WatchCommand = {
      operationId: "op-turnos-1",
      type: "GET_TURNOS",
      createdAt: "2026-06-01T13:00:00",
    };

    const state = baseState({
      history: [{
        id: 2000,
        date: "2026-06-01",
        startTime: "10:35",
        endTime: "12:00",
        entries: [
          { id: 10, type: "propina", amount: 2, note: "", time: "10:40" },
          { id: 11, type: "datafono", amount: 20, note: "tarjeta", time: "10:45" },
          { id: 12, type: "nota", amount: 0, note: "Nota general", time: "10:50" },
        ],
        totalP: 2,
        totalD: 20,
        totalA: 0,
        totalE: 5,
        totalF: 0,
        totalN: 3,
        dinero: 80,
        km: 42,
        notes: "",
        startDate: "2026-06-01",
        totalPausedMinutes: 5,
        configTurno: {
          porcentajeJefe: 50,
          porcentajeChofer: 50,
          descDatafono: true,
          descAgencia: true,
          descExtra: false,
          descGasolina: true,
        },
        diaLibreContable: 0,
      }],
    });

    const result = processWatchCommand(command, state);

    expect(result.response).toMatchObject({
      type: "TURNOS_STATUS",
      connected: true,
      turnos: [{
        id: 2000,
        date: "2026-06-01",
        startDate: "2026-06-01",
        startTime: "10:35",
        endTime: "12:00",
        dinero: 80,
        km: 42,
        totalTaximetro: 77,
        miGanancia: 40.5,
        totalADescontar: 20,
        totalADar: 18.5,
        tiempoTrabajado: "1h 20m",
        totals: {
          porTipo: {
            propina: 2,
            datafono: 20,
            agencia_bono: 0,
            extra: 5,
            gasolina: 0,
            nulo: 3,
          },
          numPorTipo: {
            propina: 1,
            datafono: 1,
            agencia_bono: 0,
            extra: 0,
            gasolina: 0,
            nulo: 0,
          },
        },
      }],
    });
    if (result.response.type !== "TURNOS_STATUS") throw new Error("Se esperaba TURNOS_STATUS");
    expect(result.response.turnos[0].entradas).toEqual([
      { id: 12, type: "nota", amount: 0, note: "Nota general", time: "10:50" },
      { id: 11, type: "datafono", amount: 20, note: "tarjeta", time: "10:45" },
      { id: 10, type: "propina", amount: 2, note: "", time: "10:40" },
    ]);
  });
```

#### Por qué se cambió
Se añadió una prueba para exigir que el móvil prepare los turnos guardados para el reloj con los mismos datos contables y visuales que usa la app móvil.

### Cambio 2 - Contrato GET_TURNOS

#### Código anterior
```ts
export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "START_TURNO";
      createdAt: string;
    }
```

#### Código nuevo
```ts
export type WatchTurno = {
  id: number;
  date: string;
  startDate: string | null;
  startTime: string | null;
  endTime: string;
  dinero: number;
  km: number;
  totalTaximetro: number;
  miGanancia: number;
  totalADescontar: number;
  totalADar: number;
  tiempoTrabajado: string;
  totals: WatchTurnoTotals;
  entradas: WatchEntry[];
};

export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "GET_TURNOS" | "START_TURNO";
      createdAt: string;
    }
```

#### Por qué se cambió
El reloj necesitaba pedir turnos guardados al móvil. Se añadió `GET_TURNOS` y el tipo `WatchTurno` para transportar datos calculados por el móvil sin guardar historial en el reloj.

### Cambio 3 - Respuesta TURNOS_STATUS

#### Código anterior
```ts
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
    }
```

#### Código nuevo
```ts
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
    }
  | {
      type: "TURNOS_STATUS";
      connected: true;
      turnos: WatchTurno[];
    }
```

#### Por qué se cambió
La respuesta de estado solo enviaba el turno activo. Se añadió una respuesta separada para que el móvil envíe turnos cerrados ya preparados al reloj.

### Cambio 4 - Builder de turnos Wear

#### Código anterior
`No existían buildWatchTotalsFromTurno, buildWatchEntradasFromTurno ni buildWatchTurnos en src/logic/watch-command-processor.ts.`

#### Código nuevo
```ts
export function buildWatchTurnos(history: Turno[], settings: WatchCommandProcessorState["settings"]): WatchTurno[] {
  return sortTurnosByDateDesc(history).slice(0, 30).map((turno) => {
    let totalMins = 0;
    if (turno.startTime && turno.endTime) {
      const [startH, startM] = turno.startTime.split(":").map(Number);
      const [endH, endM] = turno.endTime.split(":").map(Number);
      if (Number.isFinite(startH) && Number.isFinite(startM) && Number.isFinite(endH) && Number.isFinite(endM)) {
        totalMins = (endH * 60 + endM) - (startH * 60 + startM);
        if (totalMins < 0) totalMins += 24 * 60;
        totalMins = Math.max(0, totalMins - (turno.totalPausedMinutes || 0));
      }
    }
    const calculo = calcularTurnoContable(turno, settings);

    return {
      id: turno.id,
      date: turno.date,
      startDate: turno.startDate,
      startTime: turno.startTime,
      endTime: turno.endTime,
      dinero: turno.dinero || 0,
      km: turno.km || 0,
      totalTaximetro: calculo.dineroBase,
      miGanancia: calculo.miGanancia,
      totalADescontar: calculo.totalDescontar,
      totalADar: calculo.totalADar,
      tiempoTrabajado: fmtDuration(totalMins),
      totals: buildWatchTotalsFromTurno(turno),
      entradas: buildWatchEntradasFromTurno(turno),
    };
  });
}
```

#### Por qué se cambió
El reloj no debe calcular contabilidad ni guardar historial. El móvil transforma `history` en datos listos para mostrar usando `calcularTurnoContable`, `fmtDuration` y `sortTurnosByDateDesc`.

### Cambio 5 - Procesado de GET_TURNOS

#### Código anterior
```ts
  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
      },
    };
  }
```

#### Código nuevo
```ts
  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
      },
    };
  }

  if (command.type === "GET_TURNOS") {
    return {
      ...state,
      response: {
        type: "TURNOS_STATUS",
        connected: true,
        turnos: buildWatchTurnos(state.history, state.settings),
      },
    };
  }
```

#### Por qué se cambió
`GET_STATUS` no cubría el historial. Se añadió `GET_TURNOS` como lectura pura que no modifica `current`, `history` ni `processedOperationIds`.

### Cambio 6 - Modelos Wear de turno guardado

#### Código anterior
`No existían WatchTurnoTotals ni WatchTurno en android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt.`

#### Código nuevo
```kotlin
data class WatchTurnoTotals(
    val porTipo: Map<String, Double>,
    val numPorTipo: Map<String, Int>,
    val numEntradas: Int
)

data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String,
    val startTime: String,
    val endTime: String,
    val dinero: Double,
    val km: Double,
    val totalTaximetro: Double,
    val miGanancia: Double,
    val totalADescontar: Double,
    val totalADar: Double,
    val tiempoTrabajado: String,
    val totals: WatchTurnoTotals,
    val entradas: List<WatchEntry>
)
```

#### Por qué se cambió
Las pantallas Wear de lista y resumen necesitan recibir los campos del turno cerrado enviados por el móvil.

### Cambio 7 - Formato compacto de fecha

#### Código anterior
`No existía formatFechaResumen en android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt.`

#### Código nuevo
```kotlin
fun formatFechaResumen(iso: String): String {
    if (iso.isBlank()) return ""
    return try {
        val date = java.time.LocalDate.parse(iso)
        val fmt = java.time.format.DateTimeFormatter.ofPattern("EEE, d MMM yyyy", esES)
        date.format(fmt).replaceFirstChar { it.uppercase(esES) }
    } catch (e: Exception) {
        iso
    }
}
```

#### Por qué se cambió
El resumen de turno en reloj necesita una fecha parecida a la app móvil, pero más corta para pantalla redonda.

### Cambio 8 - Home Wear sin turno

#### Código anterior
```kotlin
fun NoActiveTurnoScreen(
    onStartTurno: () -> Unit
) {
```

```kotlin
            Text(
                text = "Sin turno activo",
                color = ColorWhite,
                fontSize = 16.sp
            )
            Spacer(modifier = Modifier.height(20.dp))
            Chip(
                onClick = onStartTurno,
                label = { Text("Iniciar turno", color = ColorPropina) },
                colors = ChipDefaults.chipColors(
                    backgroundColor = ColorPropinaBg,
                    contentColor = ColorPropina
                ),
                border = ChipDefaults.chipBorder(BorderStroke(1.5.dp, ColorPropina)),
                modifier = Modifier.width(130.dp)
            )
```

#### Código nuevo
```kotlin
fun NoActiveTurnoScreen(
    onStartTurno: () -> Unit,
    onOpenTurnos: () -> Unit
) {
```

```kotlin
            Text("🚕", fontSize = 34.sp)
            Spacer(modifier = Modifier.height(5.dp))
            Text(
                text = "Mi Turno",
                color = ColorWhite,
                fontSize = 24.sp
            )
            Text(fechaLabel, color = ColorGrey, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(18.dp))

            HomeActionButton(
                label = "🚀  Iniciar Turno",
                textColor = ColorPropina,
                bg = ColorPropinaBg,
                borderColor = ColorPropina,
                onClick = onStartTurno
            )
            Spacer(modifier = Modifier.height(9.dp))
            HomeActionButton(
                label = "Turnos",
                textColor = ColorDatafono,
                bg = ColorDatafonoBg,
                borderColor = ColorDatafono,
                onClick = onOpenTurnos
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text("Móvil conectado", color = ColorPropina, fontSize = 9.sp)
```

#### Por qué se cambió
La pantalla inicial del reloj era demasiado pobre. Se adaptó a la home móvil con marca, fecha, acción principal y acceso a `Turnos`.

### Cambio 9 - Navegación Wear a turnos

#### Código anterior
```kotlin
enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    ADD_ENTRY,
    EDIT_ENTRY,
    CONFIRM_DELETE,
    END_TURNO
}
```

#### Código nuevo
```kotlin
enum class ScreenState {
    NO_CONNECTED,
    NO_ACTIVE_TURNO,
    ACTIVE_TURNO,
    TURNOS,
    TURNO_SUMMARY,
    ADD_ENTRY,
    EDIT_ENTRY,
    CONFIRM_DELETE,
    END_TURNO
}
```

#### Por qué se cambió
El reloj necesitaba dos estados nuevos: lista de turnos y resumen de un turno guardado.

### Cambio 10 - Solicitud y parseo de turnos en Wear

#### Código anterior
`No existían sendGetTurnos, parseTurnos, parseTurnoTotals ni parseEntryArray en android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt.`

#### Código nuevo
```kotlin
    private fun sendGetTurnos() {
        val command = JSONObject().apply {
            put("operationId", UUID.randomUUID().toString())
            put("type", "GET_TURNOS")
            put("createdAt", System.currentTimeMillis().toString())
        }
        sendCommand(command.toString())
    }
```

```kotlin
            } else if ("TURNOS_STATUS" == json.optString("type")) {
                isConnected.value = json.optBoolean("connected", false)
                parseTurnos(json.optJSONArray("turnos"))
                if (isConnected.value) {
                    currentScreen.value = ScreenState.TURNOS
                } else {
                    currentScreen.value = ScreenState.NO_CONNECTED
                }
```

#### Por qué se cambió
El reloj debe pedir los turnos guardados al móvil y pintar solo la respuesta del móvil, sin guardar ni inventar historial propio.

### Cambio 11 - Mostrar turnos tras cerrar desde reloj

#### Código anterior
```kotlin
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
```

#### Código nuevo
```kotlin
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                if (openTurnosAfterOk) {
                    openTurnosAfterOk = false
                    sendGetTurnos()
                } else {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                    requestStatus()
                }
            } else if ("ERROR" == json.optString("type")) {
                openTurnosAfterOk = false
```

#### Por qué se cambió
Al cerrar un turno desde el reloj, el móvil guarda el turno y después el reloj pide la lista actualizada para mostrarlo como en la app móvil.

### Cambio 12 - Pantalla Turnos Wear

#### Código anterior
`No existía TurnosScreen.kt.`

#### Código nuevo
```kotlin
@Composable
fun TurnosScreen(
    turnos: List<WatchTurno>,
    onBack: () -> Unit,
    onOpenTurno: (WatchTurno) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(0.88f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Turnos", color = ColorWhite, fontSize = 17.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(22.dp))
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (turnos.isEmpty()) {
            Text("No hay Turnos Anteriores.", color = ColorGrey, fontSize = 12.sp)
        } else {
            turnos.forEach { turno ->
                TurnoCard(turno = turno, onClick = { onOpenTurno(turno) })
                Spacer(modifier = Modifier.height(9.dp))
            }
        }
    }
}
```

#### Por qué se cambió
Se añadió una pantalla de turnos cerrados equivalente a `PantallaTurnos`, adaptada a pantalla redonda.

### Cambio 13 - Pantalla resumen de turno Wear

#### Código anterior
`No existía TurnoSummaryScreen.kt.`

#### Código nuevo
```kotlin
@Composable
fun TurnoSummaryScreen(
    turno: WatchTurno,
    onBack: () -> Unit
) {
    val notasTurno = turno.entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = turno.entradas.filter { it.type != "nota" && it.note.isNotBlank() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground)
            .verticalScroll(rememberScrollState())
            .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 22.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(0.88f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onBack() })
            Text("Resumen del Turno", color = ColorWhite, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text("✎", color = ColorAgencia, fontSize = 15.sp)
        }
```

#### Por qué se cambió
Se añadió una pantalla de resumen con los mismos bloques de la app móvil: fecha/hora, métricas principales, categorías, notas y totales finales.

### Cambio 14 - Pruebas de pantallas Wear

#### Código anterior
`No existían las pruebas "ofrece home y turnos Wear parecidos al movil sin guardar historial en el reloj" ni "muestra lista y resumen de turnos Wear como la app movil adaptada" en src/__tests__/android-wear-bridge.test.ts.`

#### Código nuevo
```ts
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
```

#### Por qué se cambió
Se añadieron pruebas para fijar que el reloj ofrece acceso a turnos desde la home, pide datos al móvil y no introduce acceso directo a Firestore.

## 2026-06-02 19:56 - Corregir botón activo Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba del botón dentro del scroll

#### Código anterior
```ts
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
```

#### Código nuevo
```ts
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
```

#### Por qué se cambió
La prueba anterior exigía que el botón estuviera alineado fijo abajo. La nueva prueba exige que no use `align(Alignment.BottomCenter)` y que el contenido con scroll tenga padding inferior normal.

### Cambio 2 - Botón Terminar turno

#### Código anterior
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 88.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

```kotlin
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
                .fillMaxWidth(WatchSafeButtonWidth)
                .clip(RoundedCornerShape(16.dp))
                .background(ColorGasolinaBg)
                .clickable { onEndTurno() }
                .padding(vertical = 11.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
```

#### Código nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

```kotlin
            Spacer(modifier = Modifier.height(10.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColorGasolinaBg)
                    .clickable { onEndTurno() }
                    .padding(vertical = 11.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
```

#### Por qué se cambió
El botón fijo se superponía al contenido al desplazarse. Al colocarlo al final del `Column` con `verticalScroll`, el botón forma parte del scroll y deja de quedar incrustado sobre `Añadir nota al turno` o las últimas entradas.

## 2026-06-02 18:43 - Renombrar reloj Wear

**Archivos modificados:** `android/wear/src/main/res/values/strings.xml`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba de nombres visibles nativos

#### Código anterior
`No existía la prueba "mantiene nombres visibles nativos Mi Turno y Mi Turno Watch" en src/__tests__/android-wear-bridge.test.ts.`

#### Código nuevo
```ts
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
```

#### Por qué se cambió
Se añadió una prueba para fijar que el nombre visible nativo del móvil sea `Mi Turno`, que el nombre visible nativo del reloj sea `Mi Turno Watch` y que el recurso del reloj no vuelva a contener `Mi Jornada`.

### Cambio 2 - Nombre visible del reloj

#### Código anterior
```xml
<string name="app_name">Mi Jornada Watch</string>
```

#### Código nuevo
```xml
<string name="app_name">Mi Turno Watch</string>
```

#### Por qué se cambió
El nombre visible del reloj seguía usando el nombre inicial de la app. Se cambió a `Mi Turno Watch` manteniendo intacto el identificador técnico `com.mijornada.app`.

## 2026-06-02 18:31 - Unificar cierre Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Pruebas de pantalla única de cierre

#### Código anterior
```ts
    expect(source).toContain("activeField");
    expect(source).toContain("CampoCierre");
    expect(source).toContain("reviewLabel");
    expect(source).toContain("Falta km");
    expect(source).toContain("keyHeight = 20.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("var step");
```

#### Código nuevo
```ts
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
```

#### Por qué se cambió
La prueba anterior aceptaba el flujo viejo con revisión. La nueva prueba exige una sola pantalla de cierre con resumen, notas y teclado como overlay.

### Cambio 2 - Prueba de datos para cierre Wear

#### Código anterior
`No existía la prueba "pasa entradas y contadores a la pantalla unica de cierre Wear" en src/__tests__/android-wear-bridge.test.ts.`

#### Código nuevo
```ts
  it("pasa entradas y contadores a la pantalla unica de cierre Wear", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("numPorTipo = numPorTipo.value");
    expect(source).toContain("entradas = entradas.value");
  });
```

#### Por qué se cambió
La pantalla nueva necesita mostrar conteos y notas igual que la app móvil. Se añadió una prueba para asegurar que `WearMainActivity` pasa esos datos al cierre.

### Cambio 3 - Firma y estado de EndTurnoScreen

#### Código anterior
```kotlin
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var activeField by remember { mutableStateOf("dinero") }
    var confirming by remember { mutableStateOf(false) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val reviewLabel = when {
        dinero <= 0.0 -> "Falta €"
        km <= 0.0 -> "Falta km"
        else -> "Revisar"
    }
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra
```

#### Código nuevo
```kotlin
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    entradas: List<WatchEntry>,
    onConfirm: (dinero: Double, km: Double) -> Unit,
    onCancel: () -> Unit
) {
    var activeField by remember { mutableStateOf<String?>(null) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }

    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val notasTurno = entradas.filter { it.type == "nota" && it.note.isNotBlank() }
    val notasDetalladas = entradas.filter { it.type != "nota" && it.note.isNotBlank() }
```

#### Por qué se cambió
Se eliminó el estado de confirmación y la nota propia del cierre para que el reloj use una sola pantalla como la app móvil. Se añadieron contadores y entradas para poder mostrar resumen, notas del turno y notas detalladas.

### Cambio 4 - Estructura principal del cierre

#### Código anterior
```kotlin
        if (confirming) {
            ConfirmarCierre(
                totalsPorTipo = totalsPorTipo,
                dinero = dinero,
                kmText = kmText,
                note = note,
                onBack = { confirming = false },
                onConfirm = { onConfirm(dinero, km, note) }
            )
        } else {
            Column(
```

#### Código nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 20.dp, bottom = 18.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(0.86f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("‹", color = ColorGrey, fontSize = 22.sp, modifier = Modifier.clickable { onCancel() })
                Text("Terminar Turno", color = ColorWhite, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(22.dp))
            }
```

#### Por qué se cambió
El flujo anterior separaba entrada y confirmación. La nueva estructura empieza directamente con la pantalla única de cierre equivalente a la del móvil.

### Cambio 5 - Cierre desde WearMainActivity

#### Código anterior
```kotlin
            ScreenState.END_TURNO -> EndTurnoScreen(
                totalsPorTipo = totalsPorTipo.value,
                onConfirm = { dinero, km, note ->
                    sendEndTurno(dinero, km, note)
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                },
                onRequestNote = { current, onResult -> requestNote(current, onResult) }
            )
```

#### Código nuevo
```kotlin
            ScreenState.END_TURNO -> EndTurnoScreen(
                totalsPorTipo = totalsPorTipo.value,
                numPorTipo = numPorTipo.value,
                entradas = entradas.value,
                onConfirm = { dinero, km ->
                    sendEndTurno(dinero, km, "")
                },
                onCancel = {
                    currentScreen.value = ScreenState.ACTIVE_TURNO
                }
            )
```

#### Por qué se cambió
La pantalla de cierre ya no edita una nota propia. Recibe contadores y entradas del estado existente del reloj y al cerrar sigue enviando `END_TURNO` al móvil.

### Cambio 6 - ResumenHoyCard

#### Código anterior
`No existía ResumenHoyCard en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun ResumenHoyCard(
    totalsPorTipo: Map<String, Double>,
    numPorTipo: Map<String, Int>,
    notasTurno: List<WatchEntry>
) {
    Column(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(18.dp))
            .padding(horizontal = 10.dp, vertical = 11.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SectionTitle("Resumen de hoy", ColorGrey)
```

#### Por qué se cambió
La app móvil muestra `Resumen de hoy` dentro de una tarjeta antes de confirmar. Este bloque replica esa estructura de forma compacta para pantalla redonda.

### Cambio 7 - ResumenCategoriaCard

#### Código anterior
`No existía ResumenCategoriaCard en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun ResumenCategoriaCard(
    type: String,
    total: Double,
    count: Int,
    modifier: Modifier = Modifier
) {
    val meta = categoriaMeta(type)
    val label = if (type == "agencia_bono") "Agencias/Bonos" else meta.label
    Column(
```

#### Por qué se cambió
La pantalla móvil muestra seis tarjetas de categoría con importe y número de entradas. Este bloque adapta cada tarjeta al tamaño del reloj.

### Cambio 8 - SectionTitle

#### Código anterior
`No existía SectionTitle en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun SectionTitle(label: String, color: Color) {
    Text(
        text = label,
        color = color,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.fillMaxWidth()
    )
}
```

#### Por qué se cambió
Se necesitaban encabezados compactos y consistentes para `Resumen de hoy`, `Notas del turno` y `Notas detalladas`.

### Cambio 9 - NotaTurnoRow

#### Código anterior
`No existía NotaTurnoRow en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun NotaTurnoRow(entry: WatchEntry) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFF1B1C23))
            .padding(horizontal = 8.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(entry.time, color = ColorGrey, fontSize = 8.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text("Nota", color = ColorWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.width(6.dp))
        Text(entry.note.take(24), color = ColorWhite, fontSize = 9.sp)
    }
}
```

#### Por qué se cambió
La app móvil muestra notas generales del turno dentro del resumen. Este bloque permite mostrarlas en el reloj sin abrir otra pantalla.

### Cambio 10 - NotaDetalladaRow

#### Código anterior
`No existía NotaDetalladaRow en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun NotaDetalladaRow(entry: WatchEntry) {
    val meta = categoriaMeta(entry.type)
    Row(
        modifier = Modifier
            .fillMaxWidth(0.88f)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF15151C))
            .border(1.dp, Color(0xFF252631), RoundedCornerShape(12.dp))
            .padding(horizontal = 9.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
```

#### Por qué se cambió
La pantalla móvil separa `Notas detalladas` de las notas generales. Este bloque muestra las notas de entradas con categoría, texto e importe.

### Cambio 11 - TecladoCierreOverlay

#### Código anterior
`No existía TecladoCierreOverlay en android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun TecladoCierreOverlay(
    field: String,
    value: String,
    onKey: (String) -> Unit,
    onDone: () -> Unit
) {
    val color = if (field == "dinero") ColorAgencia else ColorExtra
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xDD000000)),
        contentAlignment = Alignment.Center
    ) {
```

#### Por qué se cambió
En la app móvil el teclado aparece como overlay al tocar `Total Taxímetro` o `Total KM`. Este bloque replica ese patrón sin crear otra pantalla de navegación.

## 2026-06-02 18:16 - Renombrar eliminación Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba de acción peligrosa en edición

#### Código anterior
```ts
  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Código nuevo
```ts
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
```

#### Por qué se cambió
Se añadió una prueba para evitar que la acción peligrosa de editar vuelva a mostrarse como `Borrar entrada`, que podía confundirse con borrar números del teclado.

### Cambio 2 - Texto de eliminar entrada

#### Código anterior
```kotlin
                    Text("Borrar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
```

#### Código nuevo
```kotlin
                    Text("Eliminar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
```

#### Por qué se cambió
`Eliminar entrada` describe mejor una acción destructiva sobre la entrada completa y evita confusión con la tecla de borrar del teclado numérico.

## 2026-06-02 18:14 - Marcar edición Wear en rojo

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Prueba del título de edición

#### Código anterior
```ts
  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Código nuevo
```ts
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

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Por qué se cambió
Se añadió una prueba para verificar que el modo edición no pinta todo el título con el color de la categoría y que el prefijo `Editar` queda en rojo.

### Cambio 2 - Título de entrada en edición

#### Código anterior
```kotlin
                Text(
                    text = if (onDelete != null) "Editar $categoryLabel" else categoryLabel,
                    color = categoryColor, fontSize = 13.sp, fontWeight = FontWeight.Bold
                )
```

#### Código nuevo
```kotlin
                EntryTitle(
                    categoryLabel = categoryLabel,
                    categoryColor = categoryColor,
                    editing = onDelete != null
                )
```

#### Por qué se cambió
El texto `Editar Agencia/Bono` era un único `Text`, por lo que no podía colorear solo `Editar` en rojo. Se sustituyó por un componente que separa el prefijo de la categoría.

### Cambio 3 - Componente EntryTitle

#### Código anterior
`No existía EntryTitle en android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun EntryTitle(
    categoryLabel: String,
    categoryColor: Color,
    editing: Boolean
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        if (editing) {
            Text("Editar", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(4.dp))
        }
        Text(categoryLabel, color = categoryColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}
```

#### Por qué se cambió
Separar `Editar` y la categoría permite que `Editar` sea rojo y que `Agencia/Bono`, `Propinas` u otra categoría mantenga su color propio.

## 2026-06-02 18:07 - Centrar entrada Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Pruebas de teclado y entrada Wear

#### Código anterior
```ts
  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Código nuevo
```ts
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

  it("mantiene el cierre de turno en una entrada compacta antes de confirmar", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt"),
      "utf8",
    );
```

#### Por qué se cambió
Se añadieron pruebas antes de modificar la UI para verificar que el teclado usa la última fila `borrar, 0, coma` y que la pantalla de entrada mueve guardar junto al importe y nota bajo el teclado.

### Cambio 2 - Teclado numérico Wear

#### Código anterior
```kotlin
/**
 * Teclado numérico in-app (estilo app del móvil): 1-9, coma decimal y 0.
 * La última celda es la tecla Guardar (✓) si se pasa [onSave]; si no, es Borrar (⌫).
 * Cabe entero en pantalla redonda sin scroll (ancho 0.72, teclas compactas).
 */
@Composable
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
    val baseRows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9")
    )
```

#### Código nuevo
```kotlin
/**
 * Teclado numérico in-app (estilo app del móvil): 1-9, coma decimal y 0.
 * La última fila mantiene el orden de la app móvil: borrar, 0 y coma.
 * Cabe entero en pantalla redonda sin scroll (ancho 0.72, teclas compactas).
 */
@Composable
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
    val rows = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9"),
        listOf("DEL", "0", ",")
    )
```

#### Por qué se cambió
El botón de guardar dentro del teclado desplazaba la coma y hacía que el teclado no fuese fiel al patrón pedido. El teclado queda dedicado solo a introducir y borrar importe.

### Cambio 3 - Fila inferior del teclado

#### Código anterior
```kotlin
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            KeyButton(",", ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey("0") }
            if (onSave != null) {
                SaveKey(color, saveEnabled, keyHeight, keyFontSize, Modifier.weight(1f), onSave)
            } else {
                KeyButton("DEL", color, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey("DEL") }
            }
        }
```

#### Código nuevo
```kotlin
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                row.forEach { key ->
                    val keyColor = if (key == "DEL") color else ColorWhite
                    KeyButton(key, keyColor, keyHeight, keyFontSize, Modifier.weight(1f)) { onKey(key) }
                }
            }
        }
```

#### Por qué se cambió
La última fila anterior podía mostrar guardar en vez de coma. El nuevo bucle renderiza todas las filas de la misma lista y garantiza `⌫`, `0`, `,`.

### Cambio 4 - Guardar junto al importe

#### Código anterior
```kotlin
            Text(
                text = "${if (amountText.isEmpty()) "0" else amountText}€",
                color = ColorWhite,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold
            )
```

#### Código nuevo
```kotlin
            Row(
                modifier = Modifier.fillMaxWidth(0.74f),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "${if (amountText.isEmpty()) "0" else amountText}€",
                    color = ColorWhite,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(9.dp))
                GuardarImporteButton(
                    enabled = amount > 0.0,
                    color = categoryColor,
                    onClick = { onSave(amount, note) }
                )
            }
```

#### Por qué se cambió
El usuario indicó que guardar debía quedar arriba junto al importe. Se centró el conjunto importe + guardar para que la acción principal esté visible sin ocupar una tecla del teclado.

### Cambio 5 - Nota bajo el teclado

#### Código anterior
```kotlin
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Text(
                    text = if (note.isBlank()) "+ Nota" else "✓ ${note.take(12)}",
                    color = if (note.isBlank()) ColorGrey else ColorWhite,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .padding(vertical = 3.dp)
                        .clickable { onRequestNote(note) { result -> note = result } }
                )
                if (onDelete != null) {
                    Text(
                        text = "Borrar",
                        color = ColorGasolina,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .padding(vertical = 3.dp)
                            .clickable { onDelete() }
                    )
                }
            }
```

#### Código nuevo
```kotlin
            NotaButton(
                text = if (note.isBlank()) "+ Nota" else "✓ ${note.take(12)}",
                selected = note.isNotBlank(),
                onClick = { onRequestNote(note) { result -> note = result } }
            )

            if (onDelete != null) {
                Spacer(modifier = Modifier.height(5.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.72f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(ColorGasolinaBg)
                        .clickable { onDelete() }
                        .padding(vertical = 7.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Borrar entrada", color = ColorGasolina, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
```

#### Por qué se cambió
La nota estaba encima del teclado y restaba claridad a la entrada del importe. Se movió bajo el teclado como botón centrado y se mantuvo la acción de borrar solo para edición.

### Cambio 6 - Botón de guardar importe

#### Código anterior
`No existía GuardarImporteButton en android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun GuardarImporteButton(
    enabled: Boolean,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(width = 42.dp, height = 34.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (enabled) color else ColorDisabledBg)
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "✓",
            color = if (enabled) ColorBackground else ColorDisabledText,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
```

#### Por qué se cambió
Guardar necesitaba un control propio fuera del teclado para quedar junto al importe y poder mostrarse desactivado cuando el importe es cero.

### Cambio 7 - Botón de nota centrado

#### Código anterior
`No existía NotaButton en android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt.`

#### Código nuevo
```kotlin
@Composable
private fun NotaButton(
    text: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth(0.72f)
            .clip(RoundedCornerShape(12.dp))
            .background(ColorNuloBg)
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) ColorWhite else ColorGrey,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
```

#### Por qué se cambió
La acción de nota necesitaba una forma consistente y centrada bajo el teclado en vez de ser texto suelto sobre el importe.

## 2026-06-02 04:10 - Optimizar experiencia Wear

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/theme/Color.kt`, `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Colores Wear apagados

#### Código anterior
```kotlin
val ColorPropina = Color(0xFF4EE47C)
val ColorPropinaBg = Color(0xFF0F3214)

val ColorDatafono = Color(0xFFC070FF)
val ColorDatafonoBg = Color(0xFF261230)

val ColorAgencia = Color(0xFFFFB03A)
val ColorAgenciaBg = Color(0xFF331E00)

val ColorExtra = Color(0xFF4AC4FF)
val ColorExtraBg = Color(0xFF00223D)

val ColorGasolina = Color(0xFFFF5252)
val ColorGasolinaBg = Color(0xFF380C0C)

val ColorNulo = Color(0xFF9E9E9E)
val ColorNuloBg = Color(0xFF1F1F1F)
```

#### Código nuevo
```kotlin
val ColorPropina = Color(0xFF38D66F)
val ColorPropinaBg = Color(0xFF06240D)

val ColorDatafono = Color(0xFF8C7CFF)
val ColorDatafonoBg = Color(0xFF151032)

val ColorAgencia = Color(0xFFFFB03A)
val ColorAgenciaBg = Color(0xFF2D1A05)

val ColorExtra = Color(0xFF22D0E5)
val ColorExtraBg = Color(0xFF052C32)

val ColorGasolina = Color(0xFFFF6868)
val ColorGasolinaBg = Color(0xFF3A0A0A)

val ColorNulo = Color(0xFF9AA8C7)
val ColorNuloBg = Color(0xFF151922)
```

#### Por qué se cambió
Los fondos de las tarjetas del reloj se veían demasiado sólidos frente a la app móvil. Se apagaron los fondos y se mantuvo contraste alto en el texto para parecerse más al estilo móvil.

### Cambio 2 - Estados desactivados

#### Código anterior
```kotlin
val ColorWhite = Color(0xFFFFFFFF)
val ColorGrey = Color(0xFF8E8E93)
```

#### Código nuevo
```kotlin
val ColorWhite = Color(0xFFFFFFFF)
val ColorGrey = Color(0xFF8E8E93)
val ColorDisabledBg = Color(0xFF20232C)
val ColorDisabledText = Color(0xFF5E6472)
```

#### Por qué se cambió
El botón `Revisar` podía parecer pulsable aunque estuviera bloqueado. Se añadieron colores específicos de estado desactivado para distinguir un botón bloqueado de un botón secundario activo.

### Cambio 3 - Primera vista del turno activo

#### Código anterior
```kotlin
private const val WatchSafeRowWidth = 0.82f
private const val WatchSafeButtonWidth = 0.78f
```

#### Código nuevo
```kotlin
private const val WatchSafeRowWidth = 0.84f
private const val WatchSafeButtonWidth = 0.86f
```

#### Por qué se cambió
La primera vista cortaba parcialmente `Añadir nota al turno`. Se ajustó la anchura de filas y botones para que las acciones principales queden más visibles y centradas en pantalla redonda.

### Cambio 4 - Margen y tamaño de tarjetas

#### Código anterior
```kotlin
                .padding(start = 18.dp, end = 18.dp, top = 44.dp, bottom = 28.dp),
```

#### Código nuevo
```kotlin
                .padding(start = 18.dp, end = 18.dp, top = 26.dp, bottom = 30.dp),
```

#### Por qué se cambió
El margen superior anterior consumía demasiada altura en el reloj y empujaba la acción de nota hacia el borde inferior. Se redujo para aprovechar mejor la pantalla sin volver a cortar la cabecera.

### Cambio 5 - Revisión de cierre con mensaje claro

#### Código anterior
```kotlin
    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra
```

#### Código nuevo
```kotlin
    val dinero = parseAmount(dineroText)
    val km = parseAmount(kmText)
    val canReview = dinero > 0.0 && km > 0.0
    val reviewLabel = when {
        dinero <= 0.0 -> "Falta €"
        km <= 0.0 -> "Falta km"
        else -> "Revisar"
    }
    val activeColor = if (activeField == "dinero") ColorAgencia else ColorExtra
```

#### Por qué se cambió
Cuando faltaba taxímetro o kilómetros, `Revisar` no hacía nada porque estaba desactivado. Se cambió el texto del botón para explicar qué falta y evitar una tecla aparentemente sin función.

### Cambio 6 - Cierre más compacto

#### Código anterior
```kotlin
                    color = activeColor,
                    keyHeight = 22.dp,
                    keyFontSize = 13.sp
```

#### Código nuevo
```kotlin
                    color = activeColor,
                    keyHeight = 20.dp,
                    keyFontSize = 12.sp
```

#### Por qué se cambió
El teclado de cierre seguía dejando botones inferiores demasiado cerca del borde. Se hizo más compacto para que `+ Nota`, `Atrás` y el botón de revisión tengan más espacio útil.

### Cambio 7 - Pruebas de experiencia Wear

#### Código anterior
```ts
No existía la prueba usa fondos Wear apagados como la app movil en src/__tests__/android-wear-bridge.test.ts.
```

#### Código nuevo
```ts
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
```

#### Por qué se cambió
Se añadió una prueba para que los fondos del reloj no vuelvan a un estilo demasiado saturado y para que existan colores de estado desactivado.

### Cambio 8 - Botón de cierre fijo

#### Código anterior
```kotlin
            Box(
                modifier = Modifier
                    .fillMaxWidth(WatchSafeButtonWidth)
                    .clip(RoundedCornerShape(16.dp))
                    .background(ColorGasolinaBg)
                    .clickable { onEndTurno() }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
```

#### Código nuevo
```kotlin
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp)
                .fillMaxWidth(WatchSafeButtonWidth)
                .clip(RoundedCornerShape(16.dp))
                .background(ColorGasolinaBg)
                .clickable { onEndTurno() }
                .padding(vertical = 11.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("Terminar turno", color = ColorGasolina, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
```

#### Por qué se cambió
`Terminar turno` dependía del desplazamiento dentro de la lista y podía quedar cerca del borde inferior. Se sacó de la lista y se fijó abajo para que sea una acción principal estable, más parecida a la app móvil.

## 2026-06-02 03:20 - Corregir pantallas del reloj

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Pruebas de layout Wear

#### Código anterior
```ts
No existían pruebas de regresión para compactar el teclado numérico, mantener el cierre de turno en una entrada compacta ni usar anchura segura en las filas principales del turno activo en src/__tests__/android-wear-bridge.test.ts.
```

#### Código nuevo
```ts
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
    expect(source).toContain("keyHeight = 22.dp");
    expect(source).not.toContain("var step");
  });

  it("usa anchura segura en las filas principales del turno activo", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(source).toContain("WatchSafeRowWidth");
    expect(source).toContain("fillMaxWidth(WatchSafeRowWidth)");
    expect(source).toContain("top = 44.dp");
    expect(source).toContain("verticalScroll(rememberScrollState())");
    expect(source).not.toContain("ScalingLazyColumn");
  });
```

#### Por qué se cambió
Las fotos del reloj mostraban recortes en pantalla redonda. Se añadieron pruebas para fijar que el teclado sea compacto, que el cierre no use un flujo por pasos alto y que la pantalla activa use anchura y scroll seguros.

### Cambio 2 - Teclado numérico compacto

#### Código anterior
```kotlin
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false
) {
```

#### Código nuevo
```kotlin
fun NumericKeypad(
    onKey: (String) -> Unit,
    color: Color,
    modifier: Modifier = Modifier,
    onSave: (() -> Unit)? = null,
    saveEnabled: Boolean = false,
    widthFraction: Float = 0.72f,
    keyHeight: Dp = 28.dp,
    keyFontSize: TextUnit = 15.sp
) {
```

#### Por qué se cambió
El teclado anterior usaba ancho fijo `0.80f` y teclas de `34.dp`, lo que dejaba botones fuera de la zona visible en el reloj. Se hizo parametrizable y más compacto para que pueda caber en pantallas redondas.

### Cambio 3 - Turno activo con scroll táctil estable

#### Código anterior
```kotlin
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

#### Código nuevo
```kotlin
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(start = 18.dp, end = 18.dp, top = 44.dp, bottom = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
```

#### Por qué se cambió
`ScalingLazyColumn` dejaba acciones inferiores con zonas táctiles poco fiables al desplazarse. Se cambió a `Column` con `verticalScroll` para mantener un scroll simple, cabecera visible y botones pulsables.

### Cambio 4 - Cierre de turno compacto

#### Código anterior
```kotlin
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: Km + nota, 3: Confirmar
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
```

#### Código nuevo
```kotlin
    var activeField by remember { mutableStateOf("dinero") }
    var confirming by remember { mutableStateOf(false) }
    var dineroText by remember { mutableStateOf("") }
    var kmText by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
```

#### Por qué se cambió
El cierre por pasos generaba pantallas altas con teclado y botones recortados. Se cambió a una pantalla compacta con campos `Taximetro` y `Km` visibles, teclado único y pantalla de confirmación aparte.

## 2026-06-02 00:31 - Blindar acciones sensibles del reloj

**Archivos modificados:** `android/wear/src/main/AndroidManifest.xml`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `src/__tests__/android-wear-bridge.test.ts`, `src/__tests__/watch-command-processor.test.ts`, `instalar_reloj.bat`

### Cambio 1 - Confirmación antes de borrar entrada

#### Código anterior
```kotlin
                        onRequestNote = { current, onResult -> requestNote(current, onResult) },
                        onDelete = { sendDeleteEntry(e.id) },
                        esNota = e.type == "nota"
```

#### Código nuevo
```kotlin
                        onRequestNote = { current, onResult -> requestNote(current, onResult) },
                        onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE },
                        esNota = e.type == "nota"
```

#### Por qué se cambió
Borrar una entrada desde el reloj era una acción directa. Se cambió para abrir `ScreenState.CONFIRM_DELETE` y exigir confirmación explícita antes de enviar `DELETE_ENTRY` al móvil.

### Cambio 2 - Pantalla de confirmación de borrado

#### Código anterior
```kotlin
No existía ConfirmDeleteScreen en android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt.
```

#### Código nuevo
```kotlin
@Composable
private fun ConfirmDeleteScreen(
    entry: WatchEntry,
    onCancel: () -> Unit,
    onConfirm: () -> Unit
) {
    val meta = categoriaMeta(entry.type)
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorBackground),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(0.88f),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Borrar entrada", color = ColorGasolina, fontSize = 15.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(categoriaLabelSingular(entry.type), color = meta.color, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            if (entry.type != "nota") {
                Text(fmtEur(entry.amount), color = ColorWhite, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            if (entry.note.isNotBlank()) {
                Text(entry.note.take(32), color = ColorGrey, fontSize = 11.sp)
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ConfirmDeleteButton(
                    label = "Cancelar",
                    textColor = ColorGrey,
                    bg = ColorNuloBg,
                    modifier = Modifier.weight(1f),
                    onClick = onCancel
                )
                ConfirmDeleteButton(
                    label = "Borrar",
                    textColor = ColorWhite,
                    bg = ColorGasolina,
                    modifier = Modifier.weight(1f),
                    onClick = onConfirm
                )
            }
        }
    }
}
```

#### Por qué se cambió
Se añadió una pantalla compacta de confirmación para mostrar qué entrada se va a borrar y separar cancelar de confirmar. El reloj sigue sin escribir datos: al confirmar solo llama a `sendDeleteEntry(e.id)`.

### Cambio 3 - Botón atrás nativo en flujos del reloj

#### Código anterior
```kotlin
    @Composable
    fun MainContent() {
        when (currentScreen.value) {
```

#### Código nuevo
```kotlin
    @Composable
    fun MainContent() {
        BackHandler(enabled = currentScreen.value != ScreenState.NO_CONNECTED) {
            handleBack()
        }

        when (currentScreen.value) {
```

#### Por qué se cambió
El botón atrás nativo no tenía una regla explícita dentro de los flujos de trabajo. Se añadió `BackHandler` para que añadir, editar, confirmar borrado y cerrar turno vuelvan a la pantalla esperada sin cerrar acciones por accidente.

### Cambio 4 - Feedback visible y háptico tras respuesta del móvil

#### Código anterior
```kotlin
            } else if ("OK" == json.optString("type")) {
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
                Log.e(TAG, "Error desde movil: ${json.optString("message")}")
            }
```

#### Código nuevo
```kotlin
            } else if ("OK" == json.optString("type")) {
                performFeedback(json.optString("message", "Hecho"), strong = false)
                currentScreen.value = ScreenState.ACTIVE_TURNO
                requestStatus()
            } else if ("ERROR" == json.optString("type")) {
                Log.e(TAG, "Error desde movil: ${json.optString("message")}")
                performFeedback(json.optString("message", "Error"), strong = true)
            }
```

#### Por qué se cambió
El reloj no confirmaba físicamente ni visualmente si el móvil había aceptado una acción. Se añadió `performFeedback` para mostrar un `Toast` y vibrar solo después de recibir respuesta del móvil.

### Cambio 5 - Permiso de vibración en Wear

#### Código anterior
```xml
    <uses-permission android:name="android.permission.WAKE_LOCK" />
```

#### Código nuevo
```xml
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
```

#### Por qué se cambió
La vibración de confirmación necesita permiso explícito en el manifiesto del módulo Wear.

### Cambio 6 - Texto simple para borrar

#### Código anterior
```kotlin
                        text = "🗑 Borrar",
```

#### Código nuevo
```kotlin
                        text = "Borrar",
```

#### Por qué se cambió
Los símbolos pueden renderizar distinto según la fuente del reloj. Se sustituyó el icono de papelera por texto estable.

### Cambio 7 - Instalador sin puerto fijo

#### Código anterior
```bat
set "WATCH=192.168.3.59:40201"
```

#### Código nuevo
```bat
set "WATCH="
```

#### Por qué se cambió
El puerto ADB por Wi-Fi del reloj cambia. El instalador ahora detecta un Xiaomi Watch 5 conectado con `adb devices -l` o pide la IP:PUERTO si no lo encuentra.

### Cambio 8 - Pruebas de seguridad del reloj

#### Código anterior
```ts
No existían pruebas específicas para confirmación de borrado, botón atrás, feedback háptico/visual, instalador sin puerto fijo ni duplicados de EDIT_ENTRY, DELETE_ENTRY y END_TURNO.
```

#### Código nuevo
```ts
  it("pide confirmacion antes de borrar una entrada desde el reloj", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).toContain("CONFIRM_DELETE");
    expect(source).toContain("onDelete = { currentScreen.value = ScreenState.CONFIRM_DELETE }");
    expect(source).toContain("sendDeleteEntry(e.id)");
  });
```

#### Por qué se cambió
Se añadieron pruebas para fijar las reglas profesionales nuevas: acciones sensibles confirmadas, back nativo controlado, feedback tras respuesta del móvil, script de instalación sin puerto rígido y anti-duplicado explícito para edición, borrado y cierre.

### Cambio 9 - Configuración de turno en test duplicado

#### Código anterior
```ts
        configTurno: { porcentajeJefe: 50, porcentajeChofer: 50, descontar: { datafono: true, agenciaBono: true, extra: false, gasolina: true } },
```

#### Código nuevo
```ts
        configTurno: {
          porcentajeJefe: 50,
          porcentajeChofer: 50,
          descDatafono: true,
          descAgencia: true,
          descExtra: false,
          descGasolina: true,
        },
```

#### Por qué se cambió
El test de cierre duplicado debe respetar el tipo real `TurnoConfig`, que usa propiedades `desc*` en lugar de un objeto `descontar`.

## 2026-06-02 02:48 - Añadir iconos de categoría en el reloj como en la app del móvil

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/CategoriaIcons.kt`, `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`

### Cambio 1 - Componente CategoriaIcon

#### Código anterior
`No existía CategoriaIcons.kt; las tarjetas e historial del reloj mostraban solo texto de color, sin los iconos que tiene la app del móvil.`

#### Código nuevo
`CategoriaIcon(type, color, size)` dibuja con Canvas (viewBox 24) los mismos iconos de `src/components/entry-icons.tsx`: moneda € (propina), tarjeta (datáfono), casa (agencia_bono), cruz en círculo (extra), surtidor (gasolina), prohibido (nulo) y lápiz (nota).

#### Por qué se cambió
Igualar el aspecto del reloj al de la app del móvil, que muestra un icono por categoría.

### Cambio 2 - Tarjetas e historial con icono y tamaños legibles

#### Código anterior
```kotlin
        Text(meta.label, color = meta.color.copy(alpha = 0.9f), fontSize = if (grande) 10.sp else 9.sp)
        Text(
            fmtEur(total),
            color = meta.color,
            fontSize = if (grande) 17.sp else 13.sp,
            fontWeight = FontWeight.Bold
        )
```
(y en `EntradaHistorial` la fila empezaba directamente con el `Text` de la etiqueta, sin icono)

#### Código nuevo
```kotlin
        Row(verticalAlignment = Alignment.CenterVertically) {
            CategoriaIcon(type, meta.color, if (grande) 16.dp else 13.dp)
            Spacer(modifier = Modifier.width(5.dp))
            Text(meta.label, color = meta.color, fontSize = if (grande) 11.sp else 10.sp, fontWeight = FontWeight.Medium)
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(fmtEur(total), color = meta.color, fontSize = if (grande) 18.sp else 14.sp, fontWeight = FontWeight.Bold)
```
(y en `EntradaHistorial` se antepone `CategoriaIcon(entry.type, meta.color, 14.dp)` antes de la etiqueta)

#### Por qué se cambió
Replica la estructura de tarjeta del móvil (icono + nombre + importe) y mejora la legibilidad en el reloj.

---

## 2026-06-01 20:33 - Corregir edición de notas y añadir confirmación de cierre en el reloj

**Archivos modificados:** `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

### Cambio 1 - Modo nota en AddEntryScreen

#### Código anterior
```kotlin
    initialAmount: Double = 0.0,
    initialNote: String = "",
    onDelete: (() -> Unit)? = null
) {
    var amountText by remember { mutableStateOf(amountToText(initialAmount)) }
    var note by remember { mutableStateOf(initialNote) }

    val amount = parseAmount(amountText)

    Box(
```

#### Código nuevo
```kotlin
    initialAmount: Double = 0.0,
    initialNote: String = "",
    onDelete: (() -> Unit)? = null,
    esNota: Boolean = false
) {
    var amountText by remember { mutableStateOf(amountToText(initialAmount)) }
    var note by remember { mutableStateOf(initialNote) }

    val amount = parseAmount(amountText)

    if (esNota) {
        NotaEditor(
            note = note,
            onEditarTexto = { onRequestNote(note) { result -> note = result } },
            onSave = { if (note.isNotBlank()) onSave(0.0, note) },
            onCancel = onCancel,
            onDelete = onDelete
        )
        return
    }

    Box(
```

#### Por qué se cambió
Editar una nota desde el historial no funcionaba: el botón Guardar exigía importe > 0 y una nota tiene importe 0. El nuevo modo nota (composable `NotaEditor`) edita solo el texto (teclado/voz del sistema) y permite eliminar, como el diálogo de edición del móvil. `WearMainActivity` pasa `esNota = e.type == "nota"`.

### Cambio 2 - Paso de confirmación con resumen al cerrar turno

#### Código anterior
```kotlin
fun EndTurnoScreen(
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: Kilómetros
```
(con 2 pasos; "Finalizar" en el paso 2 llamaba directamente a `onConfirm`)

#### Código nuevo
```kotlin
fun EndTurnoScreen(
    totalsPorTipo: Map<String, Double>,
    onConfirm: (dinero: Double, km: Double, note: String) -> Unit,
    onCancel: () -> Unit,
    onRequestNote: (current: String, onResult: (String) -> Unit) -> Unit
) {
    var step by remember { mutableStateOf(1) } // 1: Dinero, 2: Km + nota, 3: Confirmar
```
(el paso 2 pasa a "Revisar" -> paso 3 con resumen de taxímetro, km y desglose por categoría; "Cerrar" confirma; "Atrás" vuelve al paso 2)

#### Por qué se cambió
Cerrar turno es irreversible y no tenía confirmación. Se añade un paso final con resumen (taxímetro, km y totales por categoría recibidos en `totalsPorTipo`) antes de cerrar definitivamente.

---

## 2026-06-01 20:15 - Añadir pantalla de turno tipo móvil y edición de entradas en el reloj

**Archivos modificados:** `src/shared/watch-commands.ts`, `src/logic/watch-command-processor.ts`, `src/services/watch-bridge.ts`, `src/__tests__/watch-command-processor.test.ts`, `android/wear/src/main/java/com/mijornada/app/screens/WatchModels.kt`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

### Cambio 1 - Tipo WatchEntry y totales con recuento en el contrato

#### Código anterior
```ts
export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

/** Importe acumulado del turno en curso, sumado por categoría, y nº de entradas. */
export type WatchTurnoTotals = {
  porTipo: Record<WatchEntryType, number>;
  numEntradas: number;
};
```

#### Código nuevo
```ts
export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

/** Una entrada del turno tal y como se muestra en el historial del reloj. */
export type WatchEntry = {
  id: number;
  type: WatchEntryType | "nota";
  amount: number;
  note: string;
  time: string;
};

/** Importe y recuento acumulados del turno en curso, por categoría. */
export type WatchTurnoTotals = {
  porTipo: Record<WatchEntryType, number>;
  numPorTipo: Record<WatchEntryType, number>;
  numEntradas: number;
};
```

#### Por qué se cambió
El reloj necesita pintar el historial (lista de entradas) y, en cada tarjeta, el nº de entradas además del importe. Se añade `WatchEntry` y `numPorTipo`.

### Cambio 2 - Comandos EDIT_ENTRY y DELETE_ENTRY y ampliación del STATUS

#### Código anterior
```ts
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };

export type WatchCommandResponse =
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
    }
```

#### Código nuevo
```ts
  | {
      operationId: string;
      type: "EDIT_ENTRY";
      createdAt: string;
      payload: {
        id: number;
        amount: number;
        note: string;
      };
    }
  | {
      operationId: string;
      type: "DELETE_ENTRY";
      createdAt: string;
      payload: {
        id: number;
      };
    }
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };

export type WatchCommandResponse =
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
      totals: WatchTurnoTotals;
      entradas: WatchEntry[];
    }
```

#### Por qué se cambió
Para editar y borrar entradas desde el reloj hacían falta comandos nuevos, y el STATUS debe transportar el desglose acumulado y el historial.

### Cambio 3 - computeWatchTotals y buildWatchEntradas

#### Código anterior
`No existía computeWatchTotals ni buildWatchEntradas en src/logic/watch-command-processor.ts (el STATUS solo devolvía connected/activeTurno/startTime/startDate).`

#### Código nuevo
```ts
export function computeWatchTotals(current: CurrentState): WatchTurnoTotals {
  const porTipo: Record<WatchEntryType, number> = { propina: 0, datafono: 0, agencia_bono: 0, extra: 0, gasolina: 0, nulo: 0 };
  const numPorTipo: Record<WatchEntryType, number> = { propina: 0, datafono: 0, agencia_bono: 0, extra: 0, gasolina: 0, nulo: 0 };
  for (const entry of current.entries) {
    if (entry.type in porTipo) {
      porTipo[entry.type as WatchEntryType] += entry.amount;
      numPorTipo[entry.type as WatchEntryType] += 1;
    }
  }
  return { porTipo, numPorTipo, numEntradas: current.entries.length };
}

export function buildWatchEntradas(current: CurrentState): WatchEntry[] {
  return current.entries
    .map((e) => ({ id: e.id, type: e.type as WatchEntry["type"], amount: e.amount, note: e.note, time: e.time }))
    .reverse();
}
```

#### Por qué se cambió
Se centralizan en el procesador (lógica pura) el cálculo del desglose por categoría y la construcción del historial, reutilizados por GET_STATUS y por el bridge.

### Cambio 4 - Manejo de EDIT_ENTRY y DELETE_ENTRY en el procesador

#### Código anterior
`No existía el manejo de EDIT_ENTRY ni DELETE_ENTRY en processWatchCommand (se pasaba directamente de ADD_NOTE a END_TURNO).`

#### Código nuevo
```ts
  if (command.type === "EDIT_ENTRY") {
    if (!state.current.startTime) return { ...state, response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo") };
    const target = state.current.entries.find((e) => e.id === command.payload.id);
    if (!target) return { ...state, response: errorResponse(command, "ENTRY_NOT_FOUND", "Entrada no encontrada") };
    if (target.type !== "nota" && !(command.payload.amount > 0)) return { ...state, response: errorResponse(command, "INVALID_AMOUNT", "Importe invalido") };
    return { ...state, current: { ...state.current, entries: state.current.entries.map((e) => e.id === command.payload.id ? { ...e, amount: e.type === "nota" ? e.amount : command.payload.amount, note: command.payload.note.trim() } : e) }, processedOperationIds: withProcessedOperationId(state, command.operationId), response: { type: "OK", operationId: command.operationId, message: "Entrada editada" } };
  }

  if (command.type === "DELETE_ENTRY") {
    if (!state.current.startTime) return { ...state, response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo") };
    const exists = state.current.entries.some((e) => e.id === command.payload.id);
    if (!exists) return { ...state, response: errorResponse(command, "ENTRY_NOT_FOUND", "Entrada no encontrada") };
    return { ...state, current: { ...state.current, entries: state.current.entries.filter((e) => e.id !== command.payload.id) }, processedOperationIds: withProcessedOperationId(state, command.operationId), response: { type: "OK", operationId: command.operationId, message: "Entrada borrada" } };
  }
```

#### Por qué se cambió
Implementa la edición y borrado de entradas validando turno activo, existencia de la entrada e importe (las notas mantienen importe 0).

### Cambio 5 - GET_STATUS y bridge incluyen totals y entradas

#### Código anterior
```ts
        startDate: state.current.startDate,
      },
```
(y en `watch-bridge.ts` el objeto `response` del STATUS terminaba en `startDate: store.current.startDate,`)

#### Código nuevo
```ts
        startDate: state.current.startDate,
        totals: computeWatchTotals(state.current),
        entradas: buildWatchEntradas(state.current),
      },
```
(y en `watch-bridge.ts` se añadió `totals: computeWatchTotals(store.current),` y `entradas: buildWatchEntradas(store.current),`, además de incluir `EDIT_ENTRY`/`DELETE_ENTRY` en el `if` que persiste el resultado en el store)

#### Por qué se cambió
Tanto la respuesta a GET_STATUS como el envío proactivo de estado deben llevar el desglose y el historial para que el reloj los muestre.

### Cambio 6 - Tests del desglose, edición y borrado

#### Código anterior
`No existían tests de GET_STATUS con desglose, EDIT_ENTRY ni DELETE_ENTRY en src/__tests__/watch-command-processor.test.ts.`

#### Código nuevo
Se añaden 4 casos: GET_STATUS devuelve `totals` (porTipo + numPorTipo) y `entradas` ordenadas (recientes primero); EDIT_ENTRY actualiza importe y nota (trim); DELETE_ENTRY elimina por id; EDIT_ENTRY con id inexistente devuelve `ENTRY_NOT_FOUND`. Resultado: 9/9 en verde.

#### Por qué se cambió
Tests de caracterización para fijar el comportamiento del puente del reloj (no toca `accounting.ts`/`week-logic.ts`).

### Cambio 7 - WatchModels.kt (modelos y formato del reloj)

#### Código anterior
`No existía WatchModels.kt en android/wear/.../screens.`

#### Código nuevo
Define `data class WatchEntry`, `categoriaMeta`/`categoriaLabelSingular` (etiqueta, color y fondo por categoría), `fmtEur`/`fmtEurSigned` (formato € español con coma) y `formatFechaTurno` (ISO -> "Lunes, 1 de junio").

#### Por qué se cambió
La pantalla principal y el historial necesitan etiquetas, colores y formato de importe/fecha coherentes con el móvil.

### Cambio 8 - NumericKeypad: tecla Guardar configurable y amountToText

#### Código anterior
```kotlin
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            KeyButton(",", ColorWhite, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, Modifier.weight(1f)) { onKey("0") }
            KeyButton("DEL", color, Modifier.weight(1f)) { onKey("DEL") }
        }
```

#### Código nuevo
```kotlin
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            KeyButton(",", ColorWhite, Modifier.weight(1f)) { onKey(",") }
            KeyButton("0", ColorWhite, Modifier.weight(1f)) { onKey("0") }
            if (onSave != null) {
                SaveKey(color, saveEnabled, Modifier.weight(1f), onSave)
            } else {
                KeyButton("DEL", color, Modifier.weight(1f)) { onKey("DEL") }
            }
        }
```

#### Por qué se cambió
Permite integrar Guardar (✓) como última tecla del teclado (sin scroll ni botón aparte) manteniendo la coma visible; se añade `amountToText` para precargar el importe al editar.

### Cambio 9 - AddEntryScreen sin scroll y con modo edición

#### Código anterior
`AddEntryScreen usaba Column con verticalScroll, fila de botones Volver/Guardar aparte (provocaba scroll) y botón Nota con texto fijo; sin modo edición.`

#### Código nuevo
Layout fijo centrado (sin scroll): fila superior con ‹ volver, etiqueta y ⌫; importe grande; acceso a Nota (teclado/voz del sistema) y, en edición, "Borrar"; teclado con coma y Guardar ✓. Nuevos parámetros `initialAmount`, `initialNote` y `onDelete` para reutilizarla al editar.

#### Por qué se cambió
El teclado anterior obligaba a hacer scroll para guardar y no se veía profesional; además se reutiliza la misma pantalla para editar/borrar entradas.

### Cambio 10 - ActiveTurnoScreen: pantalla de turno tipo móvil

#### Código anterior
`ActiveTurnoScreen mostraba solo un menú de 6 categorías con chips de borde neón y un botón Terminar; sin fecha, sin totales y sin historial.`

#### Código nuevo
Cabecera con fecha (`formatFechaTurno`) y "desde HH:MM"; tarjetas por categoría (Datáfono/Propinas grandes, resto pequeñas) con total y nº de entradas que al tocarlas abren el teclado de esa categoría; botón "Añadir nota al turno"; lista "Últimas entradas" tocable para editar; botón "Terminar turno". Relleno sólido en lugar de bordes neón.

#### Por qué se cambió
Replica la pantalla del móvil optimizada para la esfera redonda y da doble función a las tarjetas (ver total + añadir).

### Cambio 11 - WearMainActivity: estado, navegación de edición y comandos

#### Código anterior
`WearMainActivity no parseaba totals ni entradas, no tenía estado de startDate/edición, ni comandos de editar/borrar; ScreenState no incluía EDIT_ENTRY.`

#### Código nuevo
Nuevos estados (`startDate`, `totalsPorTipo`, `numPorTipo`, `entradas`, `editingEntry`); `parseTotals`/`parseEntradas` desde el JSON del STATUS; `ScreenState.EDIT_ENTRY` y rama que abre `AddEntryScreen` en modo edición; comandos `sendEditEntry`/`sendDeleteEntry`; la pantalla de turno recibe fecha, totales, recuento e historial.

#### Por qué se cambió
Conecta el nuevo contrato (totales + historial + edición) con la UI del reloj.

---

## 2026-06-01 12:54 - Añadir teclado numérico decimal y notas reales en el reloj

**Archivos modificados:** `android/wear/build.gradle`, `android/wear/src/main/java/com/mijornada/app/screens/NumericKeypad.kt`, `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`, `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`, `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`

### Cambio 1 - Dependencia wear-input

#### Código anterior
```gradle
    implementation 'androidx.wear:wear:1.3.0'

    // Jetpack Compose Básico
```

#### Código nuevo
```gradle
    implementation 'androidx.wear:wear:1.3.0'
    // Teclado / voz del sistema (RemoteInput) para entrada de notas
    implementation 'androidx.wear:wear-input:1.1.0'

    // Jetpack Compose Básico
```

#### Por qué se cambió
`RemoteInputIntentHelper` (teclado/voz del sistema para notas) vive en `androidx.wear:wear-input`, que no estaba declarado.

### Cambio 2 - Componente NumericKeypad

#### Código anterior
`No existía NumericKeypad.kt; el importe se introducía con botones fijos +1/+2/+5/+10 sin decimales.`

#### Código nuevo
Teclado in-app 3x4 (1-9, coma, 0, borrar) con `applyKey` (máx. 2 decimales, sin ceros a la izquierda) y `parseAmount`.

#### Por qué se cambió
Permite introducir la cantidad exacta con decimales, como en el móvil, en lugar de sumar con botones fijos.

### Cambio 3 - AddEntryScreen con teclado y nota real (estado inicial de la sesión)

#### Código anterior
```kotlin
var amount by remember { mutableStateOf(0) }
```
(importe entero; botones +1/+2/+5/+10; nota fija "Reloj")

#### Código nuevo
Importe como texto decimal con `NumericKeypad`; importe `Double` real; botón Nota que abre el teclado/voz del sistema.

#### Por qué se cambió
El importe entero y la nota fija no servían para datos reales; se alinea con el móvil.

### Cambio 4 - EndTurnoScreen con teclado decimal y nota del cierre

#### Código anterior
```kotlin
var dinero by remember { mutableStateOf(0) }
var km by remember { mutableStateOf(0) }
```
(botones +5/+20/+50/+100; nota fija "Cierre desde reloj")

#### Código nuevo
Dinero y km con teclado decimal (`parseAmount`); nota opcional del cierre; `onConfirm` incluye `note`.

#### Por qué se cambió
Coherencia con el teclado de entradas y para permitir decimales y nota real al cerrar el turno.

### Cambio 5 - RemoteInput en WearMainActivity

#### Código anterior
```kotlin
onAddNote = {
    sendAddNote("Nota desde reloj")
},
```
(y `sendEndTurno(dinero, km)` con nota fija "Cierre desde reloj")

#### Código nuevo
`ActivityResultLauncher` + `requestNote()` con `RemoteInputIntentHelper`; `ADD_NOTE` y `END_TURNO` envían el texto real introducido por el usuario.

#### Por qué se cambió
Sustituye los textos de nota fijos por entrada de texto real (teclado/voz) del sistema Wear.

---

## 2026-06-01 02:14 - Añadir contrato Wear seguro

**Archivos modificados:** `src/shared/watch-commands.ts`, `src/logic/watch-command-processor.ts`, `src/__tests__/watch-command-processor.test.ts`

### Cambio 1 - Tipos de comandos del reloj

#### Código anterior
`No existía watch-commands.ts en src/shared.`

#### Código nuevo
```ts
export type WatchEntryType =
  | "propina"
  | "datafono"
  | "agencia_bono"
  | "extra"
  | "gasolina"
  | "nulo";

export type WatchCommand =
  | {
      operationId: string;
      type: "GET_STATUS" | "START_TURNO";
      createdAt: string;
    }
  | {
      operationId: string;
      type: "ADD_ENTRY";
      createdAt: string;
      payload: {
        entryType: WatchEntryType;
        amount: number;
        note: string;
      };
    }
  | {
      operationId: string;
      type: "ADD_NOTE";
      createdAt: string;
      payload: {
        note: string;
      };
    }
  | {
      operationId: string;
      type: "END_TURNO";
      createdAt: string;
      payload: {
        dinero: number;
        km: number;
        note: string;
      };
    };
```

#### Por qué se cambió
Se creó un contrato tipado para que las órdenes del reloj tengan formato explícito y siempre incluyan `operationId`, `type`, `createdAt` y el `payload` correspondiente.

### Cambio 2 - Respuestas del móvil al reloj

#### Código anterior
`No existía WatchCommandResponse en src/shared/watch-commands.ts.`

#### Código nuevo
```ts
export type WatchCommandResponse =
  | {
      type: "STATUS";
      connected: true;
      activeTurno: boolean;
      startTime: string | null;
      startDate: string | null;
    }
  | {
      type: "OK";
      operationId: string;
      message: string;
    }
  | {
      type: "ERROR";
      operationId: string;
      code: string;
      message: string;
    }
  | {
      type: "DUPLICATE_IGNORED";
      operationId: string;
      message: string;
    };
```

#### Por qué se cambió
El reloj necesita respuestas claras del móvil para mostrar estado confirmado, éxito, error o duplicado ignorado sin inventar estado local.

### Cambio 3 - Procesador puro de comandos Wear

#### Código anterior
`No existía watch-command-processor.ts en src/logic.`

#### Código nuevo
```ts
export type WatchCommandProcessorState = {
  current: CurrentState;
  history: Turno[];
  processedOperationIds: string[];
  settings: Pick<
    AppSettings,
    | "porcentaje.jefe"
    | "porcentaje.chofer"
    | "descontar.datafono"
    | "descontar.agencia_bono"
    | "descontar.extra"
    | "descontar.gasolina"
    | "diaLibre"
  >;
  now: {
    date: string;
    time: string;
    id: number;
  };
};

export type WatchCommandProcessorResult = WatchCommandProcessorState & {
  response: WatchCommandResponse;
};
```

```ts
export function processWatchCommand(
  command: WatchCommand,
  state: WatchCommandProcessorState,
): WatchCommandProcessorResult {
  if (!command.operationId.trim()) {
    return {
      ...state,
      response: errorResponse(command, "INVALID_OPERATION_ID", "operationId obligatorio"),
    };
  }

  if (command.type === "GET_STATUS") {
    return {
      ...state,
      response: {
        type: "STATUS",
        connected: true,
        activeTurno: isActive(state.current),
        startTime: state.current.startTime,
        startDate: state.current.startDate,
      },
    };
  }

  if (state.processedOperationIds.includes(command.operationId)) {
    return {
      ...state,
      response: {
        type: "DUPLICATE_IGNORED",
        operationId: command.operationId,
        message: "Operacion ya procesada",
      },
    };
  }
```

#### Por qué se cambió
Se añadió una pieza pura, sin React, sin Android y sin Firebase, para validar y aplicar comandos del reloj de forma testeable antes de conectarlos a Wear OS.

### Cambio 4 - Aplicar órdenes de trabajo desde el procesador

#### Código anterior
`No existía lógica para START_TURNO, ADD_ENTRY, ADD_NOTE ni END_TURNO en src/logic/watch-command-processor.ts.`

#### Código nuevo
```ts
  if (command.type === "START_TURNO") {
    if (isActive(state.current)) {
      return {
        ...state,
        response: errorResponse(command, "ACTIVE_TURNO", "Ya hay turno activo"),
      };
    }

    return {
      ...state,
      current: {
        ...state.current,
        startTime: state.now.time,
        startDate: state.now.date,
      },
      processedOperationIds: withProcessedOperationId(state, command.operationId),
      response: {
        type: "OK",
        operationId: command.operationId,
        message: "Turno iniciado",
      },
    };
  }
```

```ts
  if (command.type === "ADD_ENTRY") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!(command.payload.amount > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_AMOUNT", "Importe invalido"),
      };
    }
```

```ts
  if (command.type === "END_TURNO") {
    if (!state.current.startTime) {
      return {
        ...state,
        response: errorResponse(command, "NO_ACTIVE_TURNO", "No hay turno activo"),
      };
    }
    if (!(command.payload.dinero > 0) || !(command.payload.km > 0)) {
      return {
        ...state,
        response: errorResponse(command, "INVALID_END_VALUES", "Taximetro y kilometros obligatorios"),
      };
    }
```

#### Por qué se cambió
El reloj necesita iniciar turno, añadir entradas, añadir notas y terminar turno, pero el móvil debe validar el estado antes de aplicar cada orden.

### Cambio 5 - Tests del procesador Wear

#### Código anterior
`No existía watch-command-processor.test.ts en src/__tests__.`

#### Código nuevo
```ts
describe("processWatchCommand", () => {
  it("inicia turno solo una vez con operationId unico", () => {
    const command: WatchCommand = {
      operationId: "op-start-1",
      type: "START_TURNO",
      createdAt: "2026-06-01T10:35:00",
    };

    const result = processWatchCommand(command, baseState());

    expect(result.response).toEqual({
      type: "OK",
      operationId: "op-start-1",
      message: "Turno iniciado",
    });
    expect(result.current.startTime).toBe("10:35");
    expect(result.current.startDate).toBe("2026-06-01");
    expect(result.processedOperationIds).toEqual(["op-start-1"]);
  });
```

```ts
  it("ignora comandos duplicados sin modificar el turno", () => {
    const command: WatchCommand = {
      operationId: "op-entry-1",
      type: "ADD_ENTRY",
      createdAt: "2026-06-01T10:36:00",
      payload: {
        entryType: "propina",
        amount: 1,
        note: "",
      },
    };
```

```ts
  it("termina turno activo y lo mueve al historial", () => {
    const result = processWatchCommand({
      operationId: "op-end-1",
      type: "END_TURNO",
      createdAt: "2026-06-01T12:00:00",
      payload: {
        dinero: 123.45,
        km: 210,
        note: "cierre desde reloj",
      },
    }, baseState({
```

#### Por qué se cambió
Los tests fijan que el procesador inicia turno, ignora duplicados, rechaza entradas sin turno activo, añade entradas/notas y termina turno moviéndolo al historial.

## 2026-06-01 02:08 - Añadir plan del reloj Wear OS

**Archivos modificados:** `PLAN_RELOJ_WEAR_OS.md`

### Cambio 1 - Documento del reloj Wear OS

#### Código anterior
`No existía PLAN_RELOJ_WEAR_OS.md en la raíz del proyecto.`

#### Código nuevo
```md
# Plan Wear OS - Reloj como mando del movil

## Objetivo

Crear una app para Wear OS que funcione como mando seguro del movil para la parte de trabajo:

- Iniciar turno.
- Anadir entradas al turno activo.
- Anadir notas del turno.
- Terminar turno.
- Consultar el estado confirmado por el movil.

El reloj no sera una app independiente de datos. El movil seguira siendo el cerebro de la app.

## Regla principal

El reloj no escribe en Firestore.

El reloj no escribe en sincronizacion.

El reloj no guarda acciones pendientes.

El reloj solo manda ordenes al movil cuando hay conexion confirmada.

Si no hay conexion confirmada con el movil, el reloj bloquea todas las acciones de trabajo.
```

#### Por qué se cambió
Se añadió una especificación previa para fijar que Wear OS funcionará solo como mando del móvil, sin escritura directa en Firestore, sin cola offline y con bloqueo total de acciones cuando no exista conexión confirmada con el móvil.

## 2026-06-01 01:28 - Corregir navegación de vuelta

**Archivos modificados:**
- `src/services/store.ts`
- `src/main.tsx`
- `src/screens/add-entry-screen.tsx`
- `src/screens/add-nota-general-screen.tsx`
- `src/screens/add-single-entry-screen.tsx`
- `src/screens/admin-screens.tsx`
- `src/screens/calendar-screen.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/contabilidad-screen.tsx`
- `src/screens/detalle-anual-screen.tsx`
- `src/screens/detalle-mes-screen.tsx`
- `src/screens/detalle-semana-screen.tsx`
- `src/screens/edit-turno-screen.tsx`
- `src/screens/liquidacion-semana-screen.tsx`
- `src/screens/pantalla-turnos.tsx`
- `src/screens/summary-screen.tsx`
- `src/screens/today-history-screen.tsx`
- `src/__tests__/main-antiguo-regressions.test.ts`
- `src/__tests__/store-extraction.test.ts`
- `src/__tests__/navigation-regressions.test.ts`

### Cambio 1 - Añadir reemplazo de pantalla al store

#### Código anterior
```ts
  /** Navega a una pantalla apilándola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raíz. */
  goBack: () => boolean;
```

```ts
  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  goBack: () => {
```

#### Código nuevo
```ts
  /** Navega a una pantalla apilándola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Sustituye la pantalla actual sin crear una nueva entrada de historial. */
  replaceScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raíz. */
  goBack: () => boolean;
```

```ts
  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  replaceScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      const stack = s.navigationStack.length > 0 ? [...s.navigationStack] : [s.screen];
      stack[stack.length - 1] = next;
      if (stack.length > 1 && stack[stack.length - 2] === next) {
        stack.pop();
      }
      return { screen: next, navigationStack: stack };
    }),

  goBack: () => {
```

#### Por qué se cambió
`setScreen` apila pantallas. Para volver, cancelar o cerrar pantallas hacía falta una acción que sustituyera la pantalla actual y evitara duplicados consecutivos en `navigationStack`.

### Cambio 2 - Evitar que editar turno deje `editTurno` en el historial

#### Código anterior
```tsx
  setScreen: (s: string) => void;
```

```tsx
    setViewTurno(updated as Turno);
    setEditJ(null);
    setScreen('summary');
```

```tsx
          <button style={S.iconBtn} onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); setScreen('summary'); }}><IconBack /></button>
```

```tsx
          <button onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); setScreen('summary'); }}
```

```tsx
                  setHistory((h) => h.filter((j) => j.id !== editJ.id));
                  setEditJ(null);
                  setViewTurno(null);
                  setScreen("PantallaTurnos");
```

#### Código nuevo
```tsx
  replaceScreen: (s: string) => void;
  resetNavigation: (root?: string) => void;
  registerLocalAndroidBackHandler?: (handler: () => boolean) => () => void;
```

```tsx
    setViewTurno(updated as Turno);
    setEditJ(null);
    replaceScreen('summary');
```

```tsx
          <button style={S.iconBtn} onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); replaceScreen('summary'); }}><IconBack /></button>
```

```tsx
          <button onClick={() => { hapticOpen(); setEditJ(null); setEndField(null); replaceScreen('summary'); }}
```

```tsx
                  setHistory((h) => h.filter((j) => j.id !== editJ.id));
                  setEditJ(null);
                  setViewTurno(null);
                  resetNavigation("PantallaTurnos");
```

#### Por qué se cambió
Al cancelar, guardar o volver desde edición, `editJ` se limpiaba pero `editTurno` quedaba en el historial. Al pulsar atrás nativo se volvía a una pantalla de edición sin estado válido.

### Cambio 3 - Reemplazar pantallas al volver

#### Código anterior
```tsx
onClick={() => setScreen("home")}
```

```tsx
setScreen("main");
```

```tsx
onClick={() => setScreen("contabilidad")}
```

```tsx
onClick={() => setScreen("detalleSemana")}
```

#### Código nuevo
```tsx
onClick={() => replaceScreen("home")}
```

```tsx
replaceScreen("main");
```

```tsx
onClick={() => replaceScreen("contabilidad")}
```

```tsx
onClick={() => replaceScreen("detalleSemana")}
```

#### Por qué se cambió
Los botones de volver de calendario, contabilidad, turnos, resumen, alta de entradas, confirmar cierre, detalle mensual/anual/semanal y liquidación estaban usando navegación de entrada. Eso dejaba pantallas cerradas dentro del historial.

### Cambio 4 - Abrir notas de detalle semanal con su turno

#### Código anterior
```tsx
                  onClick={() => { setScreen("summary"); }}
```

#### Código nuevo
```tsx
                  onClick={() => {
                    setReturnScreen("detalleSemana");
                    setViewTurno(data.turno);
                    setScreen("summary");
                  }}
```

#### Por qué se cambió
La tarjeta de notas de detalle semanal abría `summary` sin asignar el turno correspondiente. Podía mostrar un resumen anterior o caer a una pantalla no esperada si `viewTurno` estaba vacío.

### Cambio 5 - Cerrar capas locales antes de navegar con Android atrás

#### Código anterior
```ts
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
```

#### Código nuevo
```ts
          if (localAndroidBackHandlerRef.current?.()) {
            void hapticBackClose();
            return;
          }
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
```

#### Por qué se cambió
Algunas pantallas tienen diálogos o capas locales que no viven en el estado global de `main.tsx`. El botón nativo de Android necesitaba darles prioridad antes de navegar por el stack.

### Cambio 6 - Registrar cierres locales de edición, semana y admin

#### Código anterior
`No existía registro local de botón atrás Android en EditTurnoScreen, DetalleSemanaScreen ni AdminUserView.`

#### Código nuevo
```tsx
  useEffect(() => {
    if (!registerLocalAndroidBackHandler) return;
    return registerLocalAndroidBackHandler(() => {
      if (confirmDialog) {
        setConfirmDialog(null);
        return true;
      }
      if (editEntry) {
        setEditEntry(null);
        return true;
      }
      if (endField) {
        setEndField(null);
        return true;
      }
      if (showNewEntryKP) {
        setShowNewEntryKP(false);
        return true;
      }
      if (showTypeMenu) {
        setShowTypeMenu(false);
        return true;
      }
      return false;
    });
  }, [confirmDialog, editEntry, endField, registerLocalAndroidBackHandler, setEndField, showNewEntryKP, showTypeMenu]);
```

```tsx
  React.useEffect(() => {
    if (!registerLocalAndroidBackHandler) return;
    return registerLocalAndroidBackHandler(() => {
      if (!confirmDialog) return false;
      setConfirmDialog(null);
      return true;
    });
  }, [confirmDialog, registerLocalAndroidBackHandler]);
```

```tsx
  useEffect(() => {
    if (!registerLocalAndroidBackHandler) return;
    return registerLocalAndroidBackHandler(() => {
      if (!selectedTurno) return false;
      setSelectedTurno(null);
      return true;
    });
  }, [registerLocalAndroidBackHandler, selectedTurno]);
```

#### Por qué se cambió
Editar turno, detalle semanal y la vista admin tenían estados locales que el handler global no podía cerrar. Se añadió un registro local para cerrar primero esas capas y solo navegar si no había nada abierto.

### Cambio 7 - Añadir tests de navegación

#### Código anterior
`No existía navigation-regressions.test.ts en src/__tests__.`

#### Código nuevo
```ts
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
```

#### Por qué se cambió
Hacía falta fijar una regresión automática para que editar turno no vuelva a usar `setScreen('summary')` y para que detalle semana no abra resumen sin `viewTurno`.

### Cambio 8 - Proteger `replaceScreen` con test

#### Código anterior
```ts
  it("resetNavigation reinicia el stack a la raíz dada (flujo post-cierre de turno)", () => {
    useAppStore.getState().setScreen("calendar");
    useAppStore.getState().setScreen("confirmEnd");
    useAppStore.getState().resetNavigation("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    // Atrás desde el resumen debe llevar a la lista de turnos, no a confirmEnd.
    expect(useAppStore.getState().navigationStack).toEqual(["PantallaTurnos", "summary"]);
    useAppStore.getState().goBack();
    expect(useAppStore.getState().screen).toBe("PantallaTurnos");
  });
```

#### Código nuevo
```ts
  it("resetNavigation reinicia el stack a la raíz dada (flujo post-cierre de turno)", () => {
    useAppStore.getState().setScreen("calendar");
    useAppStore.getState().setScreen("confirmEnd");
    useAppStore.getState().resetNavigation("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    // Atrás desde el resumen debe llevar a la lista de turnos, no a confirmEnd.
    expect(useAppStore.getState().navigationStack).toEqual(["PantallaTurnos", "summary"]);
    useAppStore.getState().goBack();
    expect(useAppStore.getState().screen).toBe("PantallaTurnos");
  });

  it("replaceScreen sustituye la pantalla actual sin duplicar la anterior", () => {
    useAppStore.getState().setScreen("PantallaTurnos");
    useAppStore.getState().setScreen("summary");
    useAppStore.getState().setScreen("editTurno");

    const replaceScreen = (useAppStore.getState() as any).replaceScreen;
    expect(typeof replaceScreen).toBe("function");

    replaceScreen("summary");

    expect(useAppStore.getState().screen).toBe("summary");
    expect(useAppStore.getState().navigationStack).toEqual([
      "home",
      "PantallaTurnos",
      "summary",
    ]);
  });
```

#### Por qué se cambió
El contrato nuevo del store necesitaba una prueba que reprodujera el caso real `summary -> editTurno -> summary` sin duplicar `summary` en el historial.

### Cambio 9 - Actualizar test de calendario al nuevo contrato

#### Código anterior
```ts
    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
```

#### Código nuevo
```ts
    expect(calendarSource).toContain('onClick={() => replaceScreen("home")}');
```

#### Por qué se cambió
El test antiguo protegía literalmente una navegación que ahora era el origen del fallo. Se cambió para proteger que el botón de volver de calendario cierre la pantalla sin apilarla.

## 2026-05-31 22:23 - Implementar vibración premium

**Archivos modificados:**
- `src/services/haptics.ts`
- `src/main.tsx`
- `src/screens/add-entry-screen.tsx`
- `src/screens/add-single-entry-screen.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/edit-turno-screen.tsx`
- `src/screens/settings-screen.tsx`
- `src/components/edit-entry-dialog.tsx`
- `src/logic/android-back-button.ts`
- `src/__tests__/android-back-button.test.ts`
- `src/__tests__/haptics-premium-plan.test.ts`

### Cambio 1 - Sustituir intensidades genéricas

#### Código anterior
```ts
export async function hapticTap(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Light });
    } catch (e) {
      console.warn('Error en hapticTap:', e);
    }
  }
}

export async function hapticConfirm(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en hapticConfirm:', e);
    }
  }
}

export async function hapticAction(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en hapticAction:', e);
    }
  }
}
```

#### Código nuevo
```ts
async function impactMedium(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en impactMedium:', e);
    }
  }
}

async function impactHeavy(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en impactHeavy:', e);
    }
  }
}

export async function hapticKey(): Promise<void> {
  return impactMedium();
}

export async function hapticOpen(): Promise<void> {
  return impactMedium();
}

export async function hapticBackClose(): Promise<void> {
  return impactMedium();
}

export async function hapticSave(): Promise<void> {
  return impactHeavy();
}

export async function hapticDanger(): Promise<void> {
  return impactHeavy();
}

export async function hapticInvalid(): Promise<void> {
  return impactHeavy();
}
```

#### Por qué se cambió
Se sustituyeron las funciones genéricas y la intensidad `Light` por funciones semánticas con `Medium` para pulsar/abrir/cerrar capas y `Heavy` para guardar, error o acción peligrosa.

### Cambio 2 - Añadir vibración al botón atrás nativo

#### Código anterior
```ts
export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};
```

#### Código nuevo
```ts
export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  hapticBackClose: () => void | Promise<void>;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};
```

#### Por qué se cambió
El botón atrás nativo necesitaba la misma respuesta táctil `Medium` cuando cierra una capa visible, una reserva, un diálogo o una vista admin, sin vibrar cuando la app sale por la raíz real.

### Cambio 3 - Aplicar nombres semánticos en pantallas

#### Código anterior
```ts
import { hapticTap, hapticConfirm } from "../services/haptics";

function kpAdd(v: string) {
  hapticTap();
```

```ts
function saveS() {
  hapticConfirm();
  if (!validS) return;
```

```ts
<button onClick={() => { hapticAction(); onEndTurno(); }}
```

#### Código nuevo
```ts
import { hapticKey, hapticSave, hapticOpen } from "../services/haptics";

function kpAdd(v: string) {
  hapticKey();
```

```ts
function saveS() {
  if (!validS) {
    hapticInvalid();
    return;
  }
```

```ts
<button onClick={() => { hapticDanger(); onEndTurno(); }}
```

#### Por qué se cambió
Las pantallas de añadir entrada, añadir entrada individual, terminar turno, editar turno y ajustes debían dejar de usar intensidades antiguas directas y usar nombres que expresan la intención de la acción.

### Cambio 4 - Añadir respuesta táctil a navegación y edición

#### Código anterior
```ts
function openEditEntry(e: Entry) {
  setEditEntry(e);
  setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
  setEditEntryNote(e.note || "");
}
```

```tsx
<div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setShowKP(true)}>
```

#### Código nuevo
```ts
function openEditEntry(e: Entry) {
  hapticOpen();
  setEditEntry(e);
  setEditEntryAmount(e.amount.toFixed(2).replace(".", ","));
  setEditEntryNote(e.note || "");
}
```

```tsx
<div style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => { hapticOpen(); setShowKP(true); }}>
```

#### Por qué se cambió
Abrir una edición, abrir un teclado, cambiar campo, volver atrás o cancelar son acciones operativas que ahora emiten `Medium` para que la app responda con una sensación consistente.

### Cambio 5 - Añadir respuesta fuerte a guardados y peligros

#### Código anterior
```ts
if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
  alert("El importe debe ser un número mayor que 0.");
  return;
}
const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
```

#### Código nuevo
```ts
if (isNaN(amt) || (amt <= 0 && editEntry.type !== 'nota')) {
  hapticInvalid();
  alert("El importe debe ser un número mayor que 0.");
  return;
}
const updated = { ...editEntry, amount: amt, note: editEntryNote.trim() };
hapticSave();
```

#### Por qué se cambió
Los guardados válidos, errores de validación, iniciar/pausar/terminar turno y eliminaciones debían sentirse como acciones importantes usando `Heavy`.

### Cambio 6 - Crear prueba del plan de vibración

#### Código anterior
`No existía haptics-premium-plan.test.ts en src/__tests__/.`

#### Código nuevo
```ts
describe("plan premium de vibracion", () => {
  it("expone nombres semanticos y reserva Medium para tocar y Heavy para guardar o peligro", () => {
    const hapticsSource = source("src/services/haptics.ts");

    for (const fn of ["hapticKey", "hapticOpen", "hapticBackClose"]) {
      expect(hapticsSource).toContain(`export async function ${fn}()`);
      expect(hapticsSource).toMatch(new RegExp(`export async function ${fn}\\(\\): Promise<void> \\{\\s*return impactMedium\\(\\);\\s*\\}`));
    }

    for (const fn of ["hapticSave", "hapticDanger", "hapticInvalid"]) {
      expect(hapticsSource).toContain(`export async function ${fn}()`);
      expect(hapticsSource).toMatch(new RegExp(`export async function ${fn}\\(\\): Promise<void> \\{\\s*return impactHeavy\\(\\);\\s*\\}`));
    }
  });
});
```

#### Por qué se cambió
Se añadió una prueba para bloquear la regla profesional acordada: `Medium` para interacción normal y `Heavy` para guardado, error o peligro.

### Cambio 7 - Verificar atrás nativo con vibración

#### Código anterior
```ts
function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}
```

#### Código nuevo
```ts
function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    hapticBackClose: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}
```

#### Por qué se cambió
Las pruebas del botón atrás nativo ahora comprueban que cerrar reservas o capas admin también llama a `hapticBackClose`.

## 2026-05-31 22:10 - Ampliar plan de vibración

**Archivos modificados:** `INTENSIDAD_VIBRACION.md`

### Cambio 1 - Plan completo por pantallas

#### Código anterior
```md
# Intensidad de vibracion

Este archivo documenta la regla propuesta para recordar que intensidad de vibracion debe usar cada tipo de accion.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
```

#### Código nuevo
```md
# Plan premium de vibracion

Este archivo documenta el plan completo propuesto para una experiencia de vibracion premium en la app.

Contexto de uso: app usada conduciendo, en la calle y mirando de reojo. La vibracion debe ayudar a confirmar acciones sin exigir mirar fijo la pantalla.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Plan por pantallas

### 1. Home

- Iniciar o continuar turno: `Heavy`
- Turnos: `Medium`
- Contabilidad: `Medium`
- Calendario: `Medium`
- Reserva: `Medium`
- Ajustes: `Medium`
- Admin: `Medium`
- Confirmar cerrar sesion: `Heavy`

### 2. Pantalla de turno activo

- Abrir Propina: `Medium`
- Abrir Datafono: `Medium`
- Abrir Agencia/Bono: `Medium`
- Abrir Extra: `Medium`
- Abrir Gasolina: `Medium`
- Abrir Nulo: `Medium`
- Boton de nota: `Medium`
- Iniciar turno: `Heavy`
- Pausar turno: `Heavy`
- Reanudar turno: `Heavy`
- Terminar turno: `Heavy`

### 3. Anadir propina y datafono

- Teclas numericas: `Medium`
- Borrar: `Medium`
- Coma decimal: `Medium`
- Cambiar entre Propina y Datafono: `Medium`
- Guardar entrada valida: `Heavy`
- Intentar guardar vacio o invalido: feedback de error si se implementa; recomendado `Heavy` corto o feedback de notificacion.

### 4. Anadir agencia, extra, gasolina y nulo

- Teclas numericas: `Medium`
- Borrar: `Medium`
- Coma decimal: `Medium`
- Guardar entrada valida: `Heavy`
- Intentar guardar vacio o invalido: feedback de error si se implementa; recomendado `Heavy` corto o feedback de notificacion.

### 5. Terminar turno

- Seleccionar campo dinero: `Medium`
- Seleccionar campo km: `Medium`
- Teclas dinero/km: `Medium`
- Guardar campo dinero/km: `Heavy`
- Terminar turno definitivo: `Heavy`
- Cancelar: `Medium` o sin vibracion, segun se prefiera.

### 6. Editar turno

- Abrir campo dinero: `Medium`
- Abrir campo km: `Medium`
- Teclas de dinero/km: `Medium`
- Abrir entrada para editar: `Medium`
- Abrir selector de tipo de entrada nueva: `Medium`
- Abrir importe de entrada nueva: `Medium`
- Teclas de entrada nueva: `Medium`
- Guardar cambios: `Heavy`
- Anadir linea nueva dentro del turno: `Heavy`
- Eliminar entrada: `Heavy`
- Eliminar turno: `Heavy`
- Cancelar edicion: `Medium`

### 7. Historial de entradas del turno actual

- Abrir entrada para editar: `Medium`
- Guardar edicion: `Heavy`
- Eliminar entrada: `Heavy`
- Cancelar: `Medium`

### 8. Calendario y reservas

- Abrir reserva: `Medium`
- Guardar reserva: `Heavy`
- Eliminar reserva: `Heavy`
- Abrir nota: `Medium`
- Guardar nota: `Heavy`
- Eliminar nota: `Heavy`
- Cambiar mes: `Medium` si no resulta molesto.
- Cambiar vista calendario/agenda: `Medium`
- Seleccionar dia: `Medium` si se quiere una respuesta mas sensible.
- Abrir turno desde calendario: `Medium`

### 9. Contabilidad, detalle de mes, detalle anual y detalle de semana

- Abrir detalle de mes: `Medium`
- Abrir detalle anual: `Medium`
- Abrir detalle de semana: `Medium`
- Cambiar mes o ano: `Medium` si no resulta molesto.
- Abrir turno desde contabilidad: `Medium`
- Marcar entregado o no entregado: `Heavy`, porque cambia estado contable.
- Abrir liquidacion semanal: `Medium`

### 10. Liquidacion semanal

- Compartir ticket: `Heavy` si la accion se completa.
- Copiar al portapapeles: `Heavy` si la accion se completa.
- Volver a detalle de semana: `Medium` o sin vibracion.

### 11. Ajustes

- Abrir edicion de porcentaje: `Medium`
- Teclas porcentaje: `Medium`
- Guardar porcentaje: `Heavy`
- Buscar actualizacion: `Medium`
- Instalar actualizacion: `Heavy`
- Abrir menu de backup: `Medium`
- Exportar backup: `Heavy` si se genera correctamente.
- Importar/restaurar backup: `Heavy`, con confirmacion clara.

### 12. Login

- Entrar: `Heavy` si empieza el acceso correctamente.
- Registrar cuenta: `Heavy` si empieza el registro correctamente.
- Recuperar contrasena: `Medium` o `Heavy` si se envia correctamente.
- Cambiar entre login/registro/recuperacion: `Medium`
- Error de login: feedback de error si se implementa.

### 13. Admin

- Abrir lista admin: `Medium`
- Seleccionar usuario: `Medium`
- Cambiar pestaña dentro de usuario admin: `Medium`
- Abrir detalle de turno en admin: `Medium`
- Volver desde usuario admin a lista: `Medium`
- Volver desde lista admin a home: `Medium`

### 14. Boton atras nativo Android

- Si cierra reserva: `Medium`
- Si cierra nota: `Medium`
- Si cierra confirmacion: `Medium`
- Si cierra teclado/modal de dinero o km: `Medium`
- Si cierra selector de mes: `Medium`
- Si cierra menu backup: `Medium`
- Si sale de usuario admin a lista: `Medium`
- Si sale de lista admin a home: `Medium`
- Si solo navega atras entre pantallas: `Medium` opcional.
- Si va a cerrar la app: sin vibracion, para no parecer una confirmacion de guardado.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Fases de implementacion recomendadas

### Fase 1 - Nombres semanticos

Crear nombres que expresen intencion y no intensidad tecnica:

- `hapticKey`
- `hapticOpen`
- `hapticBackClose`
- `hapticSave`
- `hapticDanger`
- `hapticInvalid`

### Fase 2 - Mapa de intensidades

Mapear esos nombres a intensidades:

- `hapticKey`: `Medium`
- `hapticOpen`: `Medium`
- `hapticBackClose`: `Medium`
- `hapticSave`: `Heavy`
- `hapticDanger`: `Heavy`
- `hapticInvalid`: feedback de error si se implementa; si no, `Heavy`

### Fase 3 - Sustituir por pantallas

Aplicar la regla por pantallas, sin tocar Firestore, Firebase, sincronizacion ni calculos contables.

### Fase 4 - Pruebas

Anadir pruebas para asegurar que:

- las acciones de guardado usan feedback fuerte;
- las teclas usan feedback medio;
- el boton atras nativo cierra capas con feedback medio;
- no se llama vibracion en navegador si `Capacitor.isNativePlatform()` es falso.

### Fase 5 - Prueba real en Android

Probar en dispositivo Android real, porque el navegador local no vibra y cada movil puede sentirse distinto.

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
```

#### Por qué se cambió
El archivo anterior solo guardaba una regla resumida. Se necesitaba conservar el plan completo por pantallas y fases para poder implementarlo despues sin depender de la conversación.

## 2026-05-31 22:08 - Añadir documento de vibración

**Archivos modificados:** `INTENSIDAD_VIBRACION.md`

### Cambio 1 - Documento de intensidades de vibración

#### Código anterior
`No existía INTENSIDAD_VIBRACION.md en la raíz del proyecto.`

#### Código nuevo
```md
# Intensidad de vibracion

Este archivo documenta la regla propuesta para recordar que intensidad de vibracion debe usar cada tipo de accion.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
```

#### Por qué se cambió
Se necesitaba un archivo principal del proyecto para recordar la regla propuesta de intensidad de vibración por tipo de acción.

## 2026-05-31 20:00 - Corregir retroceso nativo Android

**Archivos modificados:** `src/main.tsx`, `src/logic/android-back-button.ts`, `src/__tests__/android-back-button.test.ts`

### Cambio 1 - Decisión del botón Android

#### Código anterior
`No existía android-back-button en src/logic/android-back-button.ts.`

#### Código nuevo
```ts
export type AdminMode = null | "list" | { uid: string; username: string };

export type AndroidBackButtonSnapshot = {
  adminMode: AdminMode;
  confirmDialogOpen: boolean;
  editEntryOpen: boolean;
  endFieldOpen: boolean;
  screen: string;
  showBackupMenu: boolean;
  showMonthPicker: boolean;
  showNotaDialog: boolean;
  showReservaDialog: boolean;
};

export type AndroidBackButtonActions = {
  closeBackupMenu: () => void;
  closeConfirmDialog: () => void;
  closeEditEntry: () => void;
  closeEndField: () => void;
  closeMonthPicker: () => void;
  closeNotaDialog: () => void;
  closeReservaDialog: () => void;
  exitApp: () => void;
  goBack: () => boolean;
  resetNavigation: (root?: string) => void;
  setAdminMode: (mode: AdminMode) => void;
};

export function handleAndroidBackButton(
  snapshot: AndroidBackButtonSnapshot,
  actions: AndroidBackButtonActions,
): void {
  if (snapshot.confirmDialogOpen) {
    actions.closeConfirmDialog();
    return;
  }

  if (snapshot.editEntryOpen) {
    actions.closeEditEntry();
    return;
  }

  if (snapshot.endFieldOpen) {
    actions.closeEndField();
    return;
  }

  if (snapshot.showBackupMenu) {
    actions.closeBackupMenu();
    return;
  }

  if (snapshot.showMonthPicker) {
    actions.closeMonthPicker();
    return;
  }

  if (snapshot.showNotaDialog) {
    actions.closeNotaDialog();
    return;
  }

  if (snapshot.showReservaDialog) {
    actions.closeReservaDialog();
    return;
  }

  if (snapshot.adminMode && typeof snapshot.adminMode === "object") {
    actions.setAdminMode("list");
    return;
  }

  if (snapshot.adminMode === "list") {
    actions.setAdminMode(null);
    return;
  }

  if (snapshot.screen === "main") {
    actions.resetNavigation("home");
    return;
  }

  if (!actions.goBack()) {
    actions.exitApp();
  }
}
```

#### Por qué se cambió
El botón nativo necesitaba cerrar primero capas abiertas como reserva y vistas admin antes de usar el stack o cerrar la app.

### Cambio 2 - Listener nativo conectado al estado de UI

#### Código anterior
```tsx
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
```

```tsx
  // Botón físico de retroceso de Android (Capacitor). Recorre el stack de
  // navegación; si ya está en la raíz, cierra la app. Solo en plataforma nativa.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelado = false;
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          if (state.screen === "main") {
            state.resetNavigation("home");
            return;
          }
          const navego = state.goBack();
          if (!navego) CapApp.exitApp();
        })
      )
      .then((handle) => {
        if (cancelado) handle.remove();
        else remove = () => handle.remove();
      })
      .catch((err) => console.error("backButton listener fallido:", err));
    return () => {
      cancelado = true;
      remove?.();
    };
  }, []);
```

#### Código nuevo
```tsx
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import {
  handleAndroidBackButton,
  type AndroidBackButtonSnapshot,
} from "./logic/android-back-button";
import { ConfirmDialog, MainCard, SmallCard } from "./components/common";
```

```tsx
  const androidBackButtonSnapshotRef = useRef<AndroidBackButtonSnapshot>({
    adminMode,
    confirmDialogOpen: false,
    editEntryOpen: false,
    endFieldOpen: false,
    screen,
    showBackupMenu: false,
    showMonthPicker: false,
    showNotaDialog: false,
    showReservaDialog: false,
  });

  androidBackButtonSnapshotRef.current = {
    adminMode,
    confirmDialogOpen: confirmDialog !== null,
    editEntryOpen: editEntry !== null,
    endFieldOpen: endField !== null,
    screen,
    showBackupMenu,
    showMonthPicker,
    showNotaDialog,
    showReservaDialog,
  };

  // Botón físico de retroceso de Android (Capacitor). Primero cierra capas
  // abiertas; después recorre el stack y solo sale de la app en la raíz real.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let remove: (() => void) | undefined;
    let cancelado = false;
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          handleAndroidBackButton(androidBackButtonSnapshotRef.current, {
            closeBackupMenu: () => setShowBackupMenu(false),
            closeConfirmDialog: () => setConfirmDialog(null),
            closeEditEntry: () => setEditEntry(null),
            closeEndField: () => setEndField(null),
            closeMonthPicker: () => setShowMonthPicker(false),
            closeNotaDialog: () => setShowNotaDialog(false),
            closeReservaDialog: () => setShowReservaDialog(false),
            exitApp: () => {
              void CapApp.exitApp();
            },
            goBack: state.goBack,
            resetNavigation: state.resetNavigation,
            setAdminMode,
          });
        })
      )
      .then((handle) => {
        if (cancelado) handle.remove();
        else remove = () => handle.remove();
      })
      .catch((err) => console.error("backButton listener fallido:", err));
    return () => {
      cancelado = true;
      remove?.();
    };
  }, []);
```

#### Por qué se cambió
El listener anterior solo miraba `screen` y el stack global; por eso una reserva abierta en `home` podía terminar en `exitApp()` y las pantallas admin no tenían retroceso nativo propio.

### Cambio 3 - Pruebas del retroceso Android

#### Código anterior
`No existía android-back-button.test en src/__tests__/android-back-button.test.ts.`

#### Código nuevo
```ts
import { describe, expect, it, vi } from "vitest";
import { handleAndroidBackButton } from "../logic/android-back-button";

function createActions() {
  return {
    closeConfirmDialog: vi.fn(),
    closeEditEntry: vi.fn(),
    closeEndField: vi.fn(),
    closeMonthPicker: vi.fn(),
    closeNotaDialog: vi.fn(),
    closeReservaDialog: vi.fn(),
    closeBackupMenu: vi.fn(),
    exitApp: vi.fn(),
    goBack: vi.fn(() => false),
    resetNavigation: vi.fn(),
    setAdminMode: vi.fn(),
  };
}
```

```ts
  it("cierra la reserva abierta en home antes de salir de la app", () => {
```

```ts
  it("vuelve de un usuario admin a la lista sin cerrar la app", () => {
```

```ts
  it("sale de la lista admin a la home propia sin cerrar la app", () => {
```

#### Por qué se cambió
Se añadieron pruebas para fijar los dos fallos detectados: reserva abierta desde `home` no debe cerrar la app, y admin debe retroceder dentro del modo admin antes de salir.

## 2026-05-31 19:49 - Mover indicador arriba

**Archivos modificados:** `src/components/sync-indicator.tsx`

### Cambio 1 - Posición vertical del indicador

#### Código anterior
```tsx
        position: "absolute",
        bottom: 8,
        right: 8,
```

#### Código nuevo
```tsx
        position: "absolute",
        top: 8,
        right: 8,
```

#### Por qué se cambió
Se necesitaba mantener el indicador a la derecha y con el mismo tamaño, pero colocado arriba en vez de abajo.

## 2026-05-31 19:45 - Añadir documento del indicador

**Archivos modificados:** `INDICADOR_SINCRONIZACION.md`

### Cambio 1 - Documento de colores del indicador

#### Código anterior
`No existía INDICADOR_SINCRONIZACION.md en la raíz del proyecto.`

#### Código nuevo
```md
# Indicador de sincronizacion

Este archivo documenta el significado de cada color de la luz indicadora de estado de sincronizacion de la app.

Fuente verificable del color y texto mostrado: `src/components/sync-indicator.tsx`.

Fuente verificable de la condicion de cada estado: `src/hooks/use-sync-status.ts`.

## Gris

- Color: `rgba(148, 163, 184, 0.95)`
- Texto al mantener pulsado o pasar por encima: `Cargando datos`
- Estado interno: `loading`
- Significado: la app todavia no ha terminado de cargar los datos iniciales.
- Condicion verificable: `dataLoaded` es `false`, siempre que no haya timeout y el navegador este online.

## Verde

- Color: `#10b981`
- Texto al mantener pulsado o pasar por encima: `Sincronizado`
- Estado interno: `synced`
- Significado: la app esta online, los datos iniciales ya estan cargados y no hay cambios pendientes para el UID autenticado actual.
- Condicion verificable: `dataLoaded` es `true`, `loadTimedOut` es `false`, `navigator.onLine` es `true` y `readUserPendingSync(uid)` no contiene areas pendientes para el UID actual.

## Amarillo

- Color: `#f59e0b`
- Texto al mantener pulsado o pasar por encima: `Modo sin conexion`
- Estado interno: `offline`
- Significado: el navegador informa que no hay conexion.
- Condicion verificable: `navigator.onLine` es `false`, siempre que no haya timeout.

## Naranja

- Color: `#f97316`
- Texto al mantener pulsado o pasar por encima: `Cambios pendientes`
- Estado interno: `pending`
- Significado: existen cambios locales pendientes de sincronizar para el UID autenticado actual.
- Condicion verificable: `readUserPendingSync(uid)` contiene al menos un area pendiente para el UID actual.

## Rojo

- Color: `#ef4444`
- Texto al mantener pulsado o pasar por encima: `Error de sincronizacion`
- Estado interno: `error`
- Significado: la carga inicial ha agotado el tiempo configurado.
- Condicion verificable: `loadTimedOut` es `true`.

## Prioridad de estados

La prioridad verificable en `useSyncStatus` es:

1. `error`
2. `offline`
3. `loading`
4. `pending`
5. `synced`

Por tanto, si hay timeout se muestra rojo antes que cualquier otro estado. Si no hay timeout pero el navegador esta offline, se muestra amarillo antes que carga o pendientes. Solo se muestra verde cuando no aplica ningun estado anterior.
```

#### Por qué se cambió
Se necesitaba un archivo principal del proyecto que documentara de forma verificable el significado de cada color del indicador de sincronización.

## 2026-05-31 19:37 - Corregir indicador de sincronización

**Archivos modificados:** `src/components/sync-indicator.tsx`, `src/hooks/use-network-status.ts`, `src/hooks/use-sync-status.ts`, `src/services/pending-sync.ts`, `src/__tests__/sync-indicator.test.tsx`

### Cambio 1 - Notificación local de pendientes

#### Código anterior
```ts
export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}
```

```ts
export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}
```

```ts
export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}
```

#### Código nuevo
```ts
export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export const PENDING_SYNC_CHANGED_EVENT = "taxi:pending-sync-changed";

export type PendingSyncChangedDetail = {
  uid: string;
  state: PendingSyncState;
};

function notifyUserPendingSyncChanged(uid: string, state: PendingSyncState): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<PendingSyncChangedDetail>(
    PENDING_SYNC_CHANGED_EVENT,
    { detail: { uid, state } },
  ));
}

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}
```

```ts
export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
  notifyUserPendingSyncChanged(uid, state);
}
```

```ts
export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    notifyUserPendingSyncChanged(uid, state);
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
  notifyUserPendingSyncChanged(uid, state);
}
```

#### Por qué se cambió
La luz necesitaba reaccionar en la misma pestaña cuando `pending-sync` marca o limpia cambios pendientes. `localStorage` por sí solo no actualiza React en la misma pestaña.

### Cambio 2 - Hook de estado real de sincronización

#### Código anterior
`No existía use-sync-status en src/hooks/use-sync-status.ts.`

#### Código nuevo
```ts
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import {
  PENDING_SYNC_CHANGED_EVENT,
  readUserPendingSync,
  type PendingSyncChangedDetail,
} from "../services/pending-sync";
import { useAppStore } from "../services/store";

export type SyncStatus = "loading" | "offline" | "pending" | "synced" | "error";

function getAuthUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function userHasPendingSync(uid: string | null): boolean {
  if (!uid) return false;
  return Object.keys(readUserPendingSync(uid)).length > 0;
}

function getNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function useSyncStatus(): SyncStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);
  const [isOnline, setIsOnline] = useState(getNavigatorOnline);
  const [hasPendingSync, setHasPendingSync] = useState(() => userHasPendingSync(getAuthUid()));

  useEffect(() => {
    setHasPendingSync(userHasPendingSync(getAuthUid()));
  }, [dataLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePendingSyncChanged = (event: Event) => {
      const detail = (event as CustomEvent<PendingSyncChangedDetail>).detail;
      const uid = getAuthUid();
      if (!uid || detail.uid !== uid) return;
      setHasPendingSync(Object.keys(detail.state).length > 0);
    };

    window.addEventListener(PENDING_SYNC_CHANGED_EVENT, handlePendingSyncChanged);
    return () => {
      window.removeEventListener(PENDING_SYNC_CHANGED_EVENT, handlePendingSyncChanged);
    };
  }, []);

  if (loadTimedOut) return "error";
  if (!isOnline) return "offline";
  if (!dataLoaded) return "loading";
  if (hasPendingSync) return "pending";
  return "synced";
}
```

#### Por qué se cambió
La luz necesitaba un estado semántico de sincronización que combine carga inicial, conexión, timeout y pendientes locales del UID autenticado.

### Cambio 3 - Sustituir hook antiguo de red

#### Código anterior
```ts
import { useState, useEffect } from "react";
import { useAppStore } from "../services/store";

export type NetworkStatus = "online" | "offline" | "error";

export function useNetworkStatus(): NetworkStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loadTimedOut) {
    return "error";
  }

  if (!isOnline || !dataLoaded) {
    return "offline";
  }

  return "online";
}
```

#### Código nuevo
`No existe use-network-status en src/hooks/use-network-status.ts. Quedó sustituido por src/hooks/use-sync-status.ts.`

#### Por qué se cambió
El hook antiguo solo indicaba red/carga y podía poner la luz verde aunque hubiera cambios pendientes. Se eliminó para no dejar código huérfano.

### Cambio 4 - Luz con estados de sincronización

#### Código anterior
```tsx
import { type FC } from "react";
import { useNetworkStatus } from "../hooks/use-network-status";

export const SyncIndicator: FC = () => {
  const status = useNetworkStatus();

  const config = {
    online: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexión",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronización",
      animation: "none",
    },
  }[status];
```

#### Código nuevo
```tsx
import { type FC } from "react";
import { useSyncStatus } from "../hooks/use-sync-status";

export const SyncIndicator: FC = () => {
  const status = useSyncStatus();

  const config = {
    loading: {
      color: "rgba(148, 163, 184, 0.95)",
      shadow: "rgba(148, 163, 184, 0.35)",
      label: "Cargando datos",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    synced: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexión",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    pending: {
      color: "#f97316",
      shadow: "rgba(249, 115, 22, 0.45)",
      label: "Cambios pendientes",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronización",
      animation: "none",
    },
  }[status];
```

#### Por qué se cambió
Verde ahora significa `synced`: online, carga terminada y sin pendientes del UID actual. La luz ya distingue carga, offline, pendiente, sincronizado y error.

### Cambio 5 - Pruebas del indicador

#### Código anterior
`No existía sync-indicator.test en src/__tests__/sync-indicator.test.tsx.`

#### Código nuevo
```tsx
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SyncIndicator } from "../components/sync-indicator";
import { clearUserPendingSync, markUserPendingSync } from "../services/pending-sync";
import { useAppStore } from "../services/store";

vi.mock("../services/firebase", () => ({
  auth: { currentUser: { uid: "uid-actual" } },
}));
```

```tsx
  it("muestra carga inicial antes de considerar la app sincronizada", () => {
```

```tsx
  it("muestra pendientes solo para el UID actual", () => {
```

```tsx
  it("vuelve a sincronizado al limpiar el ultimo pendiente del UID actual", () => {
```

```tsx
  it("muestra modo sin conexion cuando el navegador queda offline", () => {
```

```tsx
  it("muestra error cuando la carga inicial agota el tiempo", () => {
```

#### Por qué se cambió
Se añadieron pruebas para verificar que la luz no marca verde durante carga, ignora pendientes de otro UID, reacciona al limpiar el último pendiente, detecta offline y muestra error en timeout.

## 2026-05-31 09:24 - Añadir .gitattributes y normalizar fin de línea a LF

**Archivos modificados:** .gitattributes

### Cambio 1 - Crear .gitattributes con normalización LF

**Código anterior:** `No existía .gitattributes en la raíz del proyecto.`

**Código nuevo:**
```
* text=auto eol=lf

*.png   binary
*.jpg   binary
*.jpeg  binary
*.gif   binary
*.ico   binary
*.webp  binary
*.ttf   binary
*.otf   binary
*.woff  binary
*.woff2 binary
*.pdf   binary
*.keystore binary
*.jar   binary
```

**Por qué se cambió:** al editar desde Windows, `src/main.tsx` y `CAMBIOS_AGENT.md` se reescribieron con CRLF cuando el repo usaba LF, generando diffs enormes de ruido (miles de líneas marcadas como modificadas solo por el salto de línea). El `.gitattributes` fuerza LF en todo el texto y marca los binarios para que no se normalicen, evitando que vuelva a ocurrir.

## 2026-05-31 10:25 - Corregir sincronización offline por UID

**Archivos modificados:**
- `src/__tests__/apk-installer-extraction.test.ts`
- `src/__tests__/apk-update-flow.test.ts`
- `src/__tests__/app-version-extraction.test.ts`
- `src/__tests__/backup-export-extraction.test.ts`
- `src/__tests__/calendar-date-extraction.test.ts`
- `src/__tests__/duration-card-value-extraction.test.ts`
- `src/__tests__/logic.test.ts`
- `src/__tests__/main-antiguo-regressions.test.ts`
- `src/__tests__/pending-sync.test.ts`
- `src/__tests__/service-worker-registration.test.ts`
- `src/__tests__/storage-keys-extraction.test.ts`
- `src/__tests__/turno-notas-component-extraction.test.ts`
- `src/__tests__/use-firestore-sync-user-isolation.test.tsx`
- `src/__tests__/user-storage-extraction.test.ts`
- `src/components/calendar-icons.tsx`
- `src/components/entry-icons.tsx`
- `src/components/settings-icons.tsx`
- `src/components/summary-icons.tsx`
- `src/hooks/use-firestore-sync.ts`
- `src/main.tsx`
- `src/screens/auth-gate.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/contabilidad-screen.tsx`
- `src/screens/detalle-anual-screen.tsx`
- `src/screens/detalle-mes-screen.tsx`
- `src/screens/edit-turno-screen.tsx`
- `src/screens/liquidacion-semana-screen.tsx`
- `src/screens/pantalla-turnos.tsx`
- `src/screens/settings-screen.tsx`
- `src/screens/summary-screen.tsx`
- `src/screens/today-history-screen.tsx`
- `src/services/pending-sync.ts`
- `src/services/service-worker-registration.ts`
- `src/shared/storage-keys.ts`

### Cambio 1 - Añadir estado pendiente por usuario

#### Código anterior
```ts
export const KEY_CURRENT = "taxi_current_v3";
export const KEY_HISTORY = "taxi_history_v3";
export const KEY_SETTINGS = "taxi_settings_v3";
export const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
export const KEY_RESERVATIONS = "taxi_reservations_v1";
export const KEY_NOTES = "taxi_notes_v1";
```

#### Código nuevo
```ts
export const KEY_CURRENT = "taxi_current_v3";
export const KEY_HISTORY = "taxi_history_v3";
export const KEY_SETTINGS = "taxi_settings_v3";
export const KEY_WEEK_OVERRIDES = "taxi_week_overrides_v1";
export const KEY_RESERVATIONS = "taxi_reservations_v1";
export const KEY_NOTES = "taxi_notes_v1";
export const KEY_PENDING_SYNC = "taxi_pending_sync_v1";
```

#### Por qué se cambió
Se necesitaba una clave persistente y separada por UID para distinguir cache local antigua de cambios offline reales pendientes de subir.

### Cambio 2 - Crear servicio de pendientes offline

#### Código anterior
`No existía pending-sync en src/services/pending-sync.ts.`

#### Código nuevo
```ts
import { KEY_PENDING_SYNC } from "../shared/storage-keys";
import { userStorageKey } from "./user-storage";

export type PendingSyncArea =
  | "current"
  | "settings"
  | "turnos"
  | "reservations"
  | "notes"
  | "weekOverrides";

export type PendingSyncState = Partial<Record<PendingSyncArea, true>>;

export function readUserPendingSync(uid: string): PendingSyncState {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(KEY_PENDING_SYNC, uid)) || "{}") as PendingSyncState;
  } catch {
    return {};
  }
}

export function hasUserPendingSync(uid: string, area: PendingSyncArea): boolean {
  return readUserPendingSync(uid)[area] === true;
}

export function markUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  state[area] = true;
  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}

export function clearUserPendingSync(uid: string, area: PendingSyncArea): void {
  const state = readUserPendingSync(uid);
  delete state[area];

  if (Object.keys(state).length === 0) {
    localStorage.removeItem(userStorageKey(KEY_PENDING_SYNC, uid));
    return;
  }

  localStorage.setItem(userStorageKey(KEY_PENDING_SYNC, uid), JSON.stringify(state));
}
```

#### Por qué se cambió
La sincronización necesitaba marcar por usuario y por área cuándo un cambio local no había llegado todavía a Firestore, para no fusionar cache vieja como si fuese un cambio válido.

### Cambio 3 - Pasar UID autenticado al hook de sincronización

#### Código anterior
```tsx
export function AuthGate({ AppComponent }: { AppComponent: React.ComponentType }) {
```

```tsx
  return <AppComponent key={user.uid} />;
```

```tsx
function App() {
```

```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync();
```

#### Código nuevo
```tsx
export function AuthGate({ AppComponent }: { AppComponent: React.ComponentType<{ uid: string }> }) {
```

```tsx
  return <AppComponent key={user.uid} uid={user.uid} />;
```

```tsx
function App({ uid }: { uid: string }) {
```

```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync(uid);
```

#### Por qué se cambió
El hook ya no depende solo de `auth.currentUser` dentro de sus efectos: recibe el UID montado por `AuthGate` y puede impedir escrituras si el UID cargado no coincide con el usuario autenticado actual.

### Cambio 4 - Bloquear escrituras cruzadas y marcar pendientes

#### Código anterior
```ts
export function useFirestoreSync() {
```

```ts
  function getWritableUid(): string | null {
    const uid = auth.currentUser?.uid;
    if (!dataLoaded || !uid || loadedUidRef.current !== uid) return null;
    return uid;
  }
```

```ts
  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);
```

#### Código nuevo
```ts
export function useFirestoreSync(uid: string) {
```

```ts
  function getWritableUid(): string | null {
    const authUid = auth.currentUser?.uid;
    if (!dataLoaded || !authUid || authUid !== uid || loadedUidRef.current !== uid) return null;
    return uid;
  }
```

```ts
  useEffect(() => {
    const writableUid = getWritableUid();
    if (!writableUid) return;
    if (sameJSON(current, lastCurrentRef.current)) return;
    writeUserLocalJSON(writableUid, KEY_CURRENT, current);
    markUserPendingSync(writableUid, "current");
    saveUserDoc(db, writableUid, "current", current)
      .then(() => {
        lastCurrentRef.current = current;
        clearUserPendingSync(writableUid, "current");
      })
      .catch((err) => console.error("Save current failed:", err));
  }, [current, dataLoaded, uid]);
```

#### Por qué se cambió
Antes una escritura podía tomar el UID desde `auth.currentUser` aunque el estado cargado perteneciese a otro montaje. Ahora se escribe solo cuando `auth.currentUser.uid`, el UID recibido y el UID ya cargado coinciden; además, cada escritura local queda marcada como pendiente hasta que Firestore confirma la operación.

### Cambio 5 - Fusionar local solo cuando hay pendiente real

#### Código anterior
```ts
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);
```

```ts
        const localItems = mergeLocalHistoryRef.current ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = mergeLocalHistoryRef.current ? mergeTurnos(localItems, orderedItems) : orderedItems;
        mergeLocalHistoryRef.current = false;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
```

#### Código nuevo
```ts
function sameJSON(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
```

```ts
        const hasPendingHistory = hasUserPendingSync(uid, "turnos");
        const localItems = hasPendingHistory ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = hasPendingHistory ? mergeTurnos(localItems, orderedItems) : orderedItems;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
        if (hasPendingHistory && sameJSON(mergedItems, orderedItems)) clearUserPendingSync(uid, "turnos");
```

#### Por qué se cambió
La primera carga ya no mezcla automáticamente el cache local con Firestore. Solo fusiona si existe una marca pendiente para ese usuario y esa zona, evitando resucitar turnos borrados en Firestore desde cache local antigua.

### Cambio 6 - Conservar current pendiente aunque Firestore tenga current abierto

#### Código anterior
```ts
          const nextCurrent =
            localCurrent && hasOpenCurrent(localCurrent) && !hasOpenCurrent(remoteCurrent)
              ? localCurrent
              : remoteCurrent;
```

#### Código nuevo
```ts
          const nextCurrent =
            hasPendingCurrent && localCurrent && hasOpenCurrent(localCurrent)
              ? localCurrent
              : remoteCurrent;
```

#### Por qué se cambió
Si el usuario tenía un turno local pendiente por falta de conexión, ese turno debía conservarse aunque Firestore también tuviese un current abierto. La condición nueva usa la marca pendiente explícita en vez de inferirlo solo por el estado remoto.

### Cambio 7 - Ejecutar service worker aunque la página ya cargó

#### Código anterior
```ts
  if (isLocalDev) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
```

#### Código nuevo
```ts
  const runWhenLoaded = (fn: () => void) => {
    if (document.readyState === "loading") {
      window.addEventListener("load", fn, { once: true });
      return;
    }
    fn();
  };

  if (isLocalDev) {
    runWhenLoaded(() => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  runWhenLoaded(() => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
```

#### Por qué se cambió
Si `registerServiceWorker()` se ejecutaba cuando `load` ya había ocurrido, no se registraba ni se desregistraba nada. Ahora actúa inmediatamente cuando el documento ya está cargado.

### Cambio 8 - Añadir pruebas de pendientes y aislamiento

#### Código anterior
`No existía pending-sync.test en src/__tests__/pending-sync.test.ts.`

#### Código nuevo
```ts
import { describe, expect, it, beforeEach } from "vitest";
import {
  clearUserPendingSync,
  hasUserPendingSync,
  markUserPendingSync,
  readUserPendingSync,
} from "../services/pending-sync";

describe("pending-sync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("guarda marcas pendientes separadas por UID", () => {
    markUserPendingSync("uid-a", "turnos");
    markUserPendingSync("uid-b", "current");

    expect(hasUserPendingSync("uid-a", "turnos")).toBe(true);
    expect(hasUserPendingSync("uid-a", "current")).toBe(false);
    expect(hasUserPendingSync("uid-b", "current")).toBe(true);
    expect(readUserPendingSync("uid-a")).toEqual({ turnos: true });
  });

  it("elimina la clave local al limpiar la última marca pendiente", () => {
    markUserPendingSync("uid-a", "turnos");
    markUserPendingSync("uid-a", "notes");

    clearUserPendingSync("uid-a", "turnos");
    expect(readUserPendingSync("uid-a")).toEqual({ notes: true });

    clearUserPendingSync("uid-a", "notes");
    expect(localStorage.getItem("taxi_pending_sync_v1__uid-a")).toBeNull();
  });
});
```

#### Por qué se cambió
Se añadió una prueba directa del nuevo servicio para verificar que las marcas pendientes quedan separadas por usuario y se limpian cuando Firestore confirma.

### Cambio 9 - Cubrir conflictos offline y no duplicados

#### Código anterior
```tsx
function HookProbe() {
  useFirestoreSync();
  return null;
}
```

#### Código nuevo
```tsx
function HookProbe() {
  useFirestoreSync("uid-nuevo");
  return null;
}
```

```tsx
  it("conserva el current local pendiente aunque Firestore también tenga un turno abierto", async () => {
```

```tsx
  it("no resucita turnos borrados en Firestore desde cache local sin pendiente durante la primera carga", async () => {
```

```tsx
  it("solo fusiona reservas, notas y overrides locales en primera carga si tienen pendiente offline", async () => {
```

#### Por qué se cambió
Las pruebas ahora ejercitan el UID explícito, el turno abierto offline, la no resurrección de turnos borrados y la fusión selectiva por marca pendiente.

### Cambio 10 - Limpiar código muerto verificable

#### Código anterior
```ts
import { APP_VERSION } from "./shared/app-version";
import { IconRocket, IconClipboard, IconChart, IconReservaWrite } from "./components/home-icons";
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, fmt } from "./logic/formatters";
import { TurnoNotasCard } from "./components/turno-notas";
import { DurationCardValue } from "./components/duration-card-value";
import { ApkInstaller } from "./services/apk-installer";
import { resolveLatestApkUpdate, type UpdateState } from "./logic/update-flow";
import { exportBackupJSON } from "./services/backup-export";
import { parseCSVToHistory } from "./logic/csv";
import { getDaysInMonth, getStartOffset } from "./logic/calendar-date";
```

#### Código nuevo
```ts
import { IconRocket } from "./components/home-icons";
import { fmtDuration, fmtKm, fmt } from "./logic/formatters";
import type { UpdateState } from "./logic/update-flow";
```

#### Por qué se cambió
`npx tsc --noEmit --noUnusedLocals --noUnusedParameters` confirmó que esos imports ya no se usaban en `src/main.tsx`. Se retiraron para no mantener dependencias muertas ni código huérfano.

### Cambio 11 - Eliminar funciones extraídas sin uso en main

#### Código anterior
```ts
  async function checkUpdate() {
    setUpdateState("checking");
    setUpdateMsg("Buscando actualizaciones...");
    setDownloadUrl("");
    setReleaseUrl("");
    try {
      const res = await fetch("https://api.github.com/repos/Carlos4400/app-taxi/releases/latest");
      if (!res.ok) throw new Error("No se encontró el release");
      const data = await res.json();
      const result = resolveLatestApkUpdate(data, APP_VERSION);
      setDownloadUrl(result.downloadUrl);
      setReleaseUrl(result.releaseUrl);
      setUpdateState(result.updateState);
      setUpdateMsg(result.updateMsg);
    } catch (e) {
      setUpdateState("error");
      setUpdateMsg("Error al conectar con GitHub.");
    }
  }
```

#### Código nuevo
`No existe checkUpdate en src/main.tsx. La función equivalente está en src/screens/settings-screen.tsx.`

#### Por qué se cambió
La pantalla de ajustes ya tenía la lógica de actualización. Mantener otra copia en `main.tsx` era código muerto confirmado por TypeScript.

### Cambio 12 - Ajustar tests de extracción sin imports muertos

#### Código anterior
```ts
    expect(mainSource).toContain('from "./services/apk-installer"');
```

```ts
    expect(mainSource).toContain('from "./shared/app-version"');
```

```ts
    expect(mainSource).toContain('from "./components/turno-notas"');
```

#### Código nuevo
```ts
    expect(mainSource).not.toContain('from "./services/apk-installer"');
```

```ts
    expect(mainSource).not.toContain('from "./shared/app-version"');
```

```ts
    expect(mainSource).not.toContain('from "./components/turno-notas"');
```

#### Por qué se cambió
Los tests seguían obligando a `main.tsx` a importar módulos ya extraídos aunque no los usara. Ahora verifican que el código está fuera de `main.tsx` sin forzar imports huérfanos.

## 2026-05-30 22:24 - Corregir aislamiento de turnos por usuario

**Archivos modificados:**
- `src/hooks/use-firestore-sync.ts`
- `src/main.tsx`
- `src/services/user-storage.ts`
- `src/services/service-worker-registration.ts`
- `src/logic/turnos.ts`
- `src/screens/liquidacion-semana-screen.tsx`
- `src/__tests__/use-firestore-sync-user-isolation.test.tsx`
- `src/__tests__/main-antiguo-regressions.test.ts`
- `src/__tests__/user-storage-extraction.test.ts`
- `src/__tests__/service-worker-registration.test.ts`
- `src/__tests__/logic.test.ts`
- `src/__tests__/liquidacion-semana.test.ts`

### Cambio 1 - Import de settings para reset por usuario

#### Código anterior
```ts
import { writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import { ensureTurnosDiaLibreContable, sortTurnosByDateDesc } from "../logic/turnos";
```

#### Código nuevo
```ts
import { readUserLocalJSON, writeUserLocalJSON } from "../services/user-storage";
import { KEY_CURRENT, KEY_HISTORY, KEY_SETTINGS, KEY_WEEK_OVERRIDES, KEY_RESERVATIONS, KEY_NOTES } from "../shared/storage-keys";
import { loadSettings } from "../logic/state-loaders";
import { ensureTurnosDiaLibreContable, mergeTurnos, sortTurnosByDateDesc } from "../logic/turnos";
```

#### Por qué se cambió
El reset al cambiar de usuario necesitaba restaurar también `settings` con el cargador existente, leer claves locales por UID y usar `mergeTurnos` para fusionar turnos del mismo usuario sin duplicarlos.

### Cambio 2 - Bloqueo de escrituras hasta cargar el UID actual

#### Código anterior
```ts
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    if (JSON.stringify(settings) === JSON.stringify(lastSettingsRef.current)) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_SETTINGS, settings);
    saveUserDoc(db, uid, "settings", settings).catch((err) =>
      console.error("Save settings failed:", err)
    );
  }, [settings, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    writeUserLocalJSON(uid, KEY_HISTORY, history);
    syncSubcollection(db, uid, "turnos", lastHistoryRef.current, history, (t) => t.id)
      .then(() => { lastHistoryRef.current = history; })
      .catch((err) => console.error("Sync turnos failed:", err));
  }, [history, dataLoaded]);
```

#### Código nuevo
```ts
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);

  function getWritableUid(): string | null {
    const uid = auth.currentUser?.uid;
    if (!dataLoaded || !uid || loadedUidRef.current !== uid) return null;
    return uid;
  }

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(current) === JSON.stringify(lastCurrentRef.current)) return;
    writeUserLocalJSON(uid, KEY_CURRENT, current);
    saveUserDoc(db, uid, "current", current).catch((err) =>
      console.error("Save current failed:", err)
    );
  }, [current, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    if (JSON.stringify(settings) === JSON.stringify(lastSettingsRef.current)) return;
    writeUserLocalJSON(uid, KEY_SETTINGS, settings);
    saveUserDoc(db, uid, "settings", settings).catch((err) =>
      console.error("Save settings failed:", err)
    );
  }, [settings, dataLoaded]);

  useEffect(() => {
    const uid = getWritableUid();
    if (!uid) return;
    writeUserLocalJSON(uid, KEY_HISTORY, history);
    syncSubcollection(db, uid, "turnos", lastHistoryRef.current, history, (t) => t.id)
      .then(() => { lastHistoryRef.current = history; })
      .catch((err) => console.error("Sync turnos failed:", err));
  }, [history, dataLoaded]);
```

#### Por qué se cambió
Los efectos de escritura podían ejecutarse con `dataLoaded=true` heredado del usuario anterior. `loadedUidRef` impide escribir en Firestore o localStorage hasta que los snapshots del UID actual hayan terminado su primera carga.

### Cambio 3 - Reset completo antes de cargar Firestore

#### Código anterior
```ts
    // ── Reset a estado vacío antes de cargar los datos del nuevo usuario ──────
    // El store (Zustand) es un singleton de módulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacío en Firestore antes de que lleguen los datos reales.
    setCurrent({ entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 });
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // ─────────────────────────────────────────────────────────────────────────
```

#### Código nuevo
```ts
    // ── Reset a estado vacío antes de cargar los datos del nuevo usuario ──────
    // El store (Zustand) es un singleton de módulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacío en Firestore antes de que lleguen los datos reales.
    loadedUidRef.current = null;
    lastCurrentRef.current = null;
    lastSettingsRef.current = null;
    lastHistoryRef.current = [];
    lastReservationsRef.current = [];
    lastNotesRef.current = [];
    lastWeekOverridesRef.current = [];
    mergeLocalHistoryRef.current = true;
    mergeLocalReservationsRef.current = true;
    mergeLocalNotesRef.current = true;
    mergeLocalWeekOverridesRef.current = true;
    setCurrent(emptyCurrent());
    setSettings(loadSettings());
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // ─────────────────────────────────────────────────────────────────────────
```

#### Por qué se cambió
Además de vaciar las colecciones y el turno actual, era necesario invalidar el UID cargado, limpiar las referencias usadas como baseline de sincronización, reactivar la fusión local solo para la primera carga del UID y resetear `settings`. Sin esto, los datos del usuario anterior podían seguir siendo la base de escritura del usuario nuevo.

### Cambio 4 - Marcado del UID cargado

#### Código anterior
```ts
    function marcar(key: keyof typeof recibido) {
      recibido[key] = true;
      if (Object.values(recibido).every((v) => v)) {
        setDataLoaded(true);
      }
    }
```

#### Código nuevo
```ts
    function marcar(key: keyof typeof recibido) {
      recibido[key] = true;
      if (Object.values(recibido).every((v) => v)) {
        loadedUidRef.current = uid;
        setDataLoaded(true);
      }
    }
```

#### Por qué se cambió
Las escrituras solo deben habilitarse cuando las seis lecturas iniciales de Firestore pertenecen al mismo `uid` que se está marcando como cargado.

### Cambio 5 - Test de aislamiento entre usuarios

#### Código anterior
`No existía el archivo src/__tests__/use-firestore-sync-user-isolation.test.tsx.`

#### Código nuevo
```tsx
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFirestoreSync } from "../hooks/use-firestore-sync";

const firestoreSyncMock = vi.hoisted(() => ({
  saveUserDoc: vi.fn(),
  syncSubcollection: vi.fn(),
  userHasFirestoreData: vi.fn(),
}));

const firebaseMock = vi.hoisted(() => ({
  auth: { currentUser: { uid: "uid-nuevo" } as { uid: string } | null },
  db: {},
}));

vi.mock("../services/firebase", () => firebaseMock);

vi.mock("../services/firestore-sync", () => ({
  userMetaDocRef: vi.fn((_db: unknown, uid: string, name: string) => ({
    kind: "meta",
    uid,
    name,
  })),
  userSubcollectionRef: vi.fn((_db: unknown, uid: string, name: string) => ({
    kind: "collection",
    uid,
    name,
  })),
  saveUserDoc: firestoreSyncMock.saveUserDoc,
  syncSubcollection: firestoreSyncMock.syncSubcollection,
  userHasFirestoreData: firestoreSyncMock.userHasFirestoreData,
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_dbOrRef: unknown, ...path: string[]) => ({ path })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  onSnapshot: vi.fn(() => vi.fn()),
  setDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
}));

function HookProbe() {
  useFirestoreSync();
  return null;
}

describe("useFirestoreSync: aislamiento entre usuarios", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.clearAllMocks();
    localStorage.clear();
    firebaseMock.auth.currentUser = { uid: "uid-nuevo" };
    firestoreSyncMock.saveUserDoc.mockResolvedValue(undefined);
    firestoreSyncMock.syncSubcollection.mockResolvedValue(undefined);
    firestoreSyncMock.userHasFirestoreData.mockResolvedValue(false);

    const { useAppStore } = await import("../services/store");
    useAppStore.setState({
      current: {
        entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
        startTime: "10:00",
        startDate: "2026-05-30",
        isPaused: false,
        pauseStartTime: null,
        totalPausedMinutes: 0,
      },
      history: [{
        id: 1,
        date: "2026-05-30",
        startDate: "2026-05-30",
        startTime: "10:00",
        endTime: "12:00",
        entries: [],
        totalP: 0,
        totalD: 0,
        totalA: 0,
        totalE: 0,
        totalF: 0,
        totalN: 0,
        dinero: 0,
        km: 0,
        notes: "",
      }],
      reservations: [],
      notes: [],
      settings: {
        "porcentaje.jefe": 50,
        "porcentaje.chofer": 50,
        "descontar.datafono": true,
        "descontar.agencia_bono": true,
        "descontar.extra": true,
        "descontar.gasolina": true,
        diaLibre: 2,
        diaLibreDesde: null,
      },
      weekOverrides: [],
      dataLoaded: true,
      loadTimedOut: false,
      isAdmin: false,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("no escribe datos del usuario anterior bajo el UID nuevo antes de cargar Firestore", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    expect(firestoreSyncMock.saveUserDoc).not.toHaveBeenCalled();
    expect(firestoreSyncMock.syncSubcollection).not.toHaveBeenCalled();
  });

  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });
});
```

#### Por qué se cambió
La prueba reproduce el caso en que `dataLoaded` queda `true` con estado de un usuario anterior y se monta la sincronización para `uid-nuevo`. Antes de la corrección fallaba porque `saveUserDoc` recibía datos antiguos para el UID nuevo.

### Cambio 6 - Bloqueo de doble cierre de turno

#### Código anterior
```tsx
  const totalF = gasolinas.reduce((s, e) => s + e.amount, 0);
  const totalN = nulos.reduce((s, e) => s + e.amount, 0);
  const active = current.entries.length > 0 || !!current.startTime;

  function togglePause() {
    hapticAction();
```

#### Código nuevo
```tsx
  const active = current.entries.length > 0 || !!current.startTime;
  const endingTurnoRef = useRef(false);

  useEffect(() => {
    if (active) endingTurnoRef.current = false;
  }, [active]);

  // Mientras llegan las primeras respuestas de Firestore para este usuario,
  // mostramos un placeholder de carga. Esto evita que la UI parezca vacía y,
  // sobre todo, evita que el usuario pueda crear/editar antes de tener su
  // historial cargado (lo cual provocaría diffs incorrectos).
  if (!dataLoaded) {
```

#### Por qué se cambió
Un doble toque rápido sobre `Terminar Turno` podía ejecutar `handleEndTurno` más de una vez antes de que React renderizara la pantalla siguiente. `endingTurnoRef` bloquea cierres repetidos del mismo turno activo y se declara antes del primer `return` condicional para mantener estable el orden de hooks de React.

### Cambio 7 - Inserción de turno cerrado sin duplicar historial

#### Código anterior
```tsx
  function handleEndTurno() {
    const turno = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: current.entries,
      totalP,
      totalD,
      totalA,
      totalE,
      totalF,
      totalN,
      dinero: parseFloat(dineroJ.replace(",", ".")) || 0,
      km: parseFloat(kmJ.replace(",", ".")) || 0,
      notes: notesJ.trim(),
      startDate: current.startDate,
      totalPausedMinutes: current.totalPausedMinutes || 0,
      configTurno: buildTurnoConfigFromSettings(settings),
      diaLibreContable: settings.diaLibre,
    };
    setHistory((h) => [turno, ...h]);
```

#### Código nuevo
```tsx
  function handleEndTurno() {
    if (endingTurnoRef.current || !active) return;
    endingTurnoRef.current = true;
    const turno = {
      id: Date.now(),
      date: today(),
      startTime: current.startTime,
      endTime: timeNow(),
      entries: current.entries,
      totalP,
      totalD,
      totalA,
      totalE,
      totalF,
      totalN,
      dinero: parseFloat(dineroJ.replace(",", ".")) || 0,
      km: parseFloat(kmJ.replace(",", ".")) || 0,
      notes: notesJ.trim(),
      startDate: current.startDate,
      totalPausedMinutes: current.totalPausedMinutes || 0,
      configTurno: buildTurnoConfigFromSettings(settings),
      diaLibreContable: settings.diaLibre,
    };
    setHistory((h) => mergeTurnos(h, [turno]));
```

#### Por qué se cambió
`[turno, ...h]` insertaba siempre una fila nueva. `mergeTurnos(h, [turno])` reutiliza la lógica existente que evita duplicados por fecha, inicio y fin de turno, y el guard previo impide una segunda ejecución del cierre.

### Cambio 8 - Test de doble cierre de turno

#### Código anterior
```ts
  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });

  it("keeps extracted screens using shared visual building blocks", () => {
```

#### Código nuevo
```ts
  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });

  it("prevents double closing the same turno from duplicating history", () => {
    const mainSource = readSource("src/main.tsx");
    const loadingReturnIndex = mainSource.indexOf("if (!dataLoaded) {");
    const activeIndex = mainSource.indexOf("const active = current.entries.length > 0 || !!current.startTime;");
    const endingRefIndex = mainSource.indexOf("const endingTurnoRef = useRef(false);");

    expect(activeIndex).toBeGreaterThan(-1);
    expect(endingRefIndex).toBeGreaterThan(-1);
    expect(loadingReturnIndex).toBeGreaterThan(-1);
    expect(activeIndex).toBeLessThan(loadingReturnIndex);
    expect(endingRefIndex).toBeLessThan(loadingReturnIndex);
    expect(mainSource).toContain("if (endingTurnoRef.current || !active) return;");
    expect(mainSource).toContain("endingTurnoRef.current = true;");
    expect(mainSource).toContain("setHistory((h) => mergeTurnos(h, [turno]));");
    expect(mainSource).not.toContain("setHistory((h) => [turno, ...h]);");
  });

  it("keeps extracted screens using shared visual building blocks", () => {
```

#### Por qué se cambió
La prueba bloquea una regresión concreta: el cierre de turno no debe volver a usar inserción directa `[turno, ...h]`, no debe perder el guard contra doble ejecución y el hook del guard debe quedar antes del primer `return` condicional.

### Cambio 9 - Lectura local explícita por UID

#### Código anterior
```ts
export function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}
```

#### Código nuevo
```ts
export function readLocalJSON<T>(baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function readUserLocalJSON<T>(uid: string, baseKey: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(userStorageKey(baseKey, uid)) || "null") as T | null;
  } catch (e) {
    return null;
  }
}

export function writeUserLocalJSON(uid: string, baseKey: string, value: unknown): void {
  localStorage.setItem(userStorageKey(baseKey, uid), JSON.stringify(value));
}
```

#### Por qué se cambió
La sincronización inicial necesita leer datos locales de un `uid` concreto aunque el store global de Zustand conserve estado previo. La lectura explícita por UID evita leer claves de otro usuario.

### Cambio 10 - Helpers de estado vacío y fusión por id

#### Código anterior
`No existía el bloque emptyCurrent/mergeById/hasOpenCurrent en src/hooks/use-firestore-sync.ts.`

#### Código nuevo
```ts
function emptyCurrent(): CurrentState {
  return { entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 };
}

function mergeById<T>(localItems: T[], remoteItems: T[], getId: (item: T) => string | number): T[] {
  const merged = new Map<string, T>();
  localItems.forEach((item) => merged.set(String(getId(item)), item));
  remoteItems.forEach((item) => merged.set(String(getId(item)), item));
  return Array.from(merged.values());
}

function hasOpenCurrent(current: CurrentState): boolean {
  return !!current.startTime || current.entries.length > 0;
}
```

#### Por qué se cambió
`emptyCurrent` centraliza el estado vacío usado al cambiar de usuario. `mergeById` permite fusionar datos locales offline con Firestore sin duplicar reservas, notas ni overrides con el mismo identificador. `hasOpenCurrent` permite detectar si un turno abierto local debe conservarse frente a un `current` remoto vacío.

### Cambio 11 - Restauración de turno abierto offline por UID

#### Código anterior
```ts
      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CurrentState;
          lastCurrentRef.current = data;
          writeUserLocalJSON(uid, KEY_CURRENT, data);
          setCurrent(data);
        } else {
          lastCurrentRef.current = null;
        }
        marcar("current");
      }));
```

#### Código nuevo
```ts
      unsubs.push(onSnapshot(userMetaDocRef(db, uid, "current"), (snap) => {
        if (snap.exists()) {
          const remoteCurrent = snap.data() as CurrentState;
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT);
          const nextCurrent =
            localCurrent && hasOpenCurrent(localCurrent) && !hasOpenCurrent(remoteCurrent)
              ? localCurrent
              : remoteCurrent;
          lastCurrentRef.current = remoteCurrent;
          writeUserLocalJSON(uid, KEY_CURRENT, nextCurrent);
          setCurrent(nextCurrent);
        } else {
          const localCurrent = readUserLocalJSON<CurrentState>(uid, KEY_CURRENT) ?? emptyCurrent();
          lastCurrentRef.current = null;
          setCurrent(localCurrent);
        }
        marcar("current");
      }));
```

#### Por qué se cambió
Si el usuario cierra sesión o la app sin haber terminado el turno y Firestore aún no tiene `current`, el turno abierto guardado offline bajo `KEY_CURRENT__uid` debe restaurarse solo para ese mismo usuario. Si Firestore tiene un `current` vacío pero existe un turno local abierto del mismo UID, se conserva el local y después se sube por el efecto de escritura.

### Cambio 12 - Fusión de turnos locales offline con Firestore

#### Código anterior
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, orderedItems);
        setHistory(orderedItems);
        marcar("turnos");
      }));
```

#### Código nuevo
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "turnos"), (snap) => {
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [];
        const mergedItems = mergeTurnos(localItems, orderedItems);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
        marcar("turnos");
      }));
```

#### Por qué se cambió
Si un turno se cerró sin conexión, estaba guardado localmente por UID pero podía perderse cuando Firestore devolvía un snapshot vacío o incompleto. La fusión mantiene el turno offline del mismo usuario y usa `lastHistoryRef.current = orderedItems` para que después se suba a Firestore.

### Cambio 13 - Fusión de subcolecciones locales offline

#### Código anterior
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, items);
        setReservations(items);
        marcar("reservations");
      }));
```

#### Código nuevo
```ts
      unsubs.push(onSnapshot(userSubcollectionRef(db, uid, "reservations"), (snap) => {
        const items: Reserva[] = [];
        snap.forEach((d) => items.push(d.data() as Reserva));
        const localItems = readUserLocalJSON<Reserva[]>(uid, KEY_RESERVATIONS) ?? [];
        const mergedItems = mergeById(localItems, items, (r) => r.id);
        lastReservationsRef.current = items;
        writeUserLocalJSON(uid, KEY_RESERVATIONS, mergedItems);
        setReservations(mergedItems);
        marcar("reservations");
      }));
```

#### Por qué se cambió
Reservas, notas y overrides también pueden existir en localStorage por UID cuando no hay conexión. La fusión por identificador impide perder datos locales del mismo usuario y evita duplicar elementos con el mismo id.

### Cambio 14 - Pruebas de offline por UID

#### Código anterior
```tsx
  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });
});
```

#### Código nuevo
```tsx
  it("resetea los ajustes del usuario anterior antes de aceptar la carga del usuario nuevo", async () => {
    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().settings["porcentaje.jefe"]).toBe(0);
    expect(useAppStore.getState().settings["porcentaje.chofer"]).toBe(0);
  });

  it("conserva y sube turnos offline del mismo UID sin mezclar los de otro usuario", async () => {
    const turnoOffline = turno(11, "2026-05-30", "10:00", "12:00");
    const turnoOtroUsuario = turno(22, "2026-05-29", "11:00", "13:00");
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoOffline]));
    localStorage.setItem(`${KEY_HISTORY}__uid-otro`, JSON.stringify([turnoOtroUsuario]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots();

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history.map((t) => t.id)).toEqual([11]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]").map((t: Turno) => t.id)).toEqual([11]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-otro`) || "[]").map((t: Turno) => t.id)).toEqual([22]);
    expect(firestoreSyncMock.syncSubcollection).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "turnos",
      [],
      [turnoOffline],
      expect.any(Function),
    );
  });

  it("restaura el turno abierto offline del mismo UID sin leer el de otro usuario", async () => {
    const currentOffline = {
      entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
      startTime: "10:00",
      startDate: "2026-05-30",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    const currentOtroUsuario = {
      entries: [],
      startTime: "11:00",
      startDate: "2026-05-29",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    localStorage.setItem("taxi_current_v3__uid-nuevo", JSON.stringify(currentOffline));
    localStorage.setItem("taxi_current_v3__uid-otro", JSON.stringify(currentOtroUsuario));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots();

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().current.startTime).toBe("10:00");
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(firestoreSyncMock.saveUserDoc).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "current",
      currentOffline,
    );
  });

  it("fusiona turno offline y Firestore sin duplicar el mismo cierre", async () => {
    const turnoLocal = turno(11, "2026-05-30", "10:00", "12:00");
    const turnoFirestore = { ...turnoLocal, id: 99 };
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoLocal]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ turnos: [turnoFirestore] });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history).toHaveLength(1);
    expect(useAppStore.getState().history[0].id).toBe(99);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]")).toHaveLength(1);
  });
});
```

#### Por qué se cambió
Las pruebas fijan los casos críticos de uso profesional: turno cerrado offline, turno abierto offline, aislamiento de claves de otro usuario y fusión local/Firestore sin duplicar el mismo cierre.

### Cambio 15 - Test de readUserLocalJSON

#### Código anterior
```ts
    const modulePath = "../services/user-storage";
    const { userStorageKey, readLocalJSON, writeUserLocalJSON } = await import(modulePath);
    localStorage.clear();
    localStorage.setItem("plain", "{\"ok\":true}");

    expect(userStorageKey("plain", "uid-1")).toBe("plain__uid-1");
    expect(userStorageKey("plain", "")).toBe("plain");
    expect(readLocalJSON("plain")).toEqual({ ok: true });
    expect(readLocalJSON("missing")).toBeNull();
    writeUserLocalJSON("uid-1", "plain", { value: 2 });
    expect(localStorage.getItem("plain__uid-1")).toBe("{\"value\":2}");
```

#### Código nuevo
```ts
    const modulePath = "../services/user-storage";
    const { userStorageKey, readLocalJSON, readUserLocalJSON, writeUserLocalJSON } = await import(modulePath);
    localStorage.clear();
    localStorage.setItem("plain", "{\"ok\":true}");

    expect(userStorageKey("plain", "uid-1")).toBe("plain__uid-1");
    expect(userStorageKey("plain", "")).toBe("plain");
    expect(readLocalJSON("plain")).toEqual({ ok: true });
    expect(readUserLocalJSON("uid-1", "plain")).toBeNull();
    expect(readLocalJSON("missing")).toBeNull();
    writeUserLocalJSON("uid-1", "plain", { value: 2 });
    expect(localStorage.getItem("plain__uid-1")).toBe("{\"value\":2}");
    expect(readUserLocalJSON("uid-1", "plain")).toEqual({ value: 2 });
```

#### Por qué se cambió
El helper nuevo queda cubierto por test: antes de escribir una clave por UID devuelve `null`, y después lee solo la clave `baseKey__uid` correspondiente.

### Cambio 16 - Desregistro del Service Worker en desarrollo

#### Código anterior
```ts
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(() => console.log("SW registered"))
        .catch((err) => console.warn("SW registration failed", err));
    });
  }
}
```

#### Código nuevo
```ts
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  if (isLocalDev) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => console.log("SW unregistered in dev"))
        .catch((err) => console.warn("SW unregister failed", err));
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.warn("SW registration failed", err));
  });
}
```

#### Por qué se cambió
En `localhost` el Service Worker podía mantener una versión anterior de la app durante desarrollo y provocar una pantalla negra o estado visual obsoleto. En desarrollo se desregistran Service Workers existentes; en producción se conserva el registro.

### Cambio 17 - Test del Service Worker en desarrollo

#### Código anterior
```ts
    const registrationSource = readFileSync(registrationPath, "utf8");
    expect(registrationSource).toContain('"serviceWorker" in navigator');
    expect(registrationSource).toContain('navigator.serviceWorker.register("./sw.js")');
    expect(registrationSource).toContain("SW registered");
```

#### Código nuevo
```ts
    const registrationSource = readFileSync(registrationPath, "utf8");
    expect(registrationSource).toContain('"serviceWorker" in navigator');
    expect(registrationSource).toContain("isLocalDev");
    expect(registrationSource).toContain("registration.unregister()");
    expect(registrationSource).toContain('navigator.serviceWorker.register("./sw.js")');
    expect(registrationSource).toContain("SW registered");
```

#### Por qué se cambió
El test fija que el Service Worker no quede activo en entorno local y que el registro de producción siga existiendo.

### Cambio 18 - Fusión local solo en carga inicial

#### Código anterior
```ts
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
```

```ts
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [];
        const mergedItems = mergeTurnos(localItems, orderedItems);
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
```

#### Código nuevo
```ts
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
  const loadedUidRef = useRef<string | null>(null);
  const mergeLocalHistoryRef = useRef(false);
  const mergeLocalReservationsRef = useRef(false);
  const mergeLocalNotesRef = useRef(false);
  const mergeLocalWeekOverridesRef = useRef(false);
```

```ts
        const items: Turno[] = [];
        snap.forEach((d) => items.push(d.data() as Turno));
        const orderedItems = sortTurnosByDateDesc(items);
        const localItems = mergeLocalHistoryRef.current ? readUserLocalJSON<Turno[]>(uid, KEY_HISTORY) ?? [] : [];
        const mergedItems = mergeLocalHistoryRef.current ? mergeTurnos(localItems, orderedItems) : orderedItems;
        mergeLocalHistoryRef.current = false;
        lastHistoryRef.current = orderedItems;
        writeUserLocalJSON(uid, KEY_HISTORY, mergedItems);
        setHistory(mergedItems);
```

#### Por qué se cambió
La fusión con `localStorage` debe ocurrir solo durante la primera carga del UID, para recuperar cambios offline. En snapshots posteriores Firestore debe poder reflejar borrados reales sin que el cache local vuelva a insertar turnos eliminados.

### Cambio 19 - Test contra resurrección de borrados

#### Código anterior
`No existía el test "no resucita turnos borrados en Firestore desde el cache local tras la carga inicial" en src/__tests__/use-firestore-sync-user-isolation.test.tsx.`

#### Código nuevo
```tsx
  it("no resucita turnos borrados en Firestore desde el cache local tras la carga inicial", async () => {
    const turnoFirestore = turno(11, "2026-05-30", "10:00", "12:00");
    localStorage.setItem(`${KEY_HISTORY}__uid-nuevo`, JSON.stringify([turnoFirestore]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ turnos: [turnoFirestore] });

    const turnosSnapshot = firestoreSyncMock.snapshotCallbacks.find(({ ref }) => ref.name === "turnos");
    expect(turnosSnapshot).toBeDefined();

    await act(async () => {
      turnosSnapshot?.callback(collectionSnap([]));
      await Promise.resolve();
    });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().history).toEqual([]);
    expect(JSON.parse(localStorage.getItem(`${KEY_HISTORY}__uid-nuevo`) || "[]")).toEqual([]);
  });
```

#### Por qué se cambió
La prueba reproduce un borrado remoto después de la carga inicial. Antes de corregirlo fallaba porque el turno quedaba de nuevo en `history` desde el cache local.

### Cambio 20 - Bloqueo de migración legacy sin UID

#### Código anterior
```ts
  const current = currentRaw ? JSON.parse(currentRaw) as CurrentState : null;
  const history = historyRaw ? JSON.parse(historyRaw) as Turno[] : [];
  const settings = settingsRaw ? JSON.parse(settingsRaw) as AppSettings : null;
  const weekOverrides = weekOverridesRaw ? JSON.parse(weekOverridesRaw) as WeekOverride[] : [];
  const reservations = reservationsRaw ? JSON.parse(reservationsRaw) as Reserva[] : [];
  const notes = notesRaw ? JSON.parse(notesRaw) as NotaCalendario[] : [];

  const docPromises: Promise<unknown>[] = [];
  if (current) docPromises.push(setDoc(userMetaDocRef(db, uid, "current"), current));
  if (settings) docPromises.push(setDoc(userMetaDocRef(db, uid, "settings"), settings));
```

#### Código nuevo
```ts
  localStorage.setItem(LOCAL_MIGRATION_KEY, JSON.stringify({
    uid, at: new Date().toISOString(), migrado: false, motivo: "legacy-sin-uid-no-atribuible",
  }));
}
```

#### Por qué se cambió
Las claves antiguas sin UID no contienen información verificable sobre el usuario propietario. Subirlas automáticamente al UID autenticado actual podía mezclar datos entre usuarios en un dispositivo compartido.

### Cambio 21 - Tests de current local y legacy sin UID

#### Código anterior
`No existían los tests "conserva el turno abierto local del mismo UID si Firestore tiene current vacío" ni "no migra claves legacy sin UID a un usuario autenticado" en src/__tests__/use-firestore-sync-user-isolation.test.tsx.`

#### Código nuevo
```tsx
  it("conserva el turno abierto local del mismo UID si Firestore tiene current vacío", async () => {
    const currentOffline = {
      entries: [{ id: 1, type: "efectivo", amount: 10, note: "", time: "10:00" }],
      startTime: "10:00",
      startDate: "2026-05-30",
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    const currentFirestoreVacio = {
      entries: [],
      startTime: null,
      startDate: null,
      isPaused: false,
      pauseStartTime: null,
      totalPausedMinutes: 0,
    };
    localStorage.setItem(`${KEY_CURRENT}__uid-nuevo`, JSON.stringify(currentOffline));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
    });
    await emitInitialSnapshots({ current: currentFirestoreVacio });

    const { useAppStore } = await import("../services/store");
    expect(useAppStore.getState().current.startTime).toBe("10:00");
    expect(useAppStore.getState().current.entries).toHaveLength(1);
    expect(firestoreSyncMock.saveUserDoc).toHaveBeenCalledWith(
      {},
      "uid-nuevo",
      "current",
      currentOffline,
    );
  });
```

```tsx
  it("no migra claves legacy sin UID a un usuario autenticado", async () => {
    const turnoLegacy = turno(77, "2026-05-30", "10:00", "12:00");
    localStorage.setItem(KEY_HISTORY, JSON.stringify([turnoLegacy]));

    await act(async () => {
      root.render(<HookProbe />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(localStorage.getItem(KEY_HISTORY)).toBe(JSON.stringify([turnoLegacy]));
    expect(firestoreSyncMock.syncSubcollection).not.toHaveBeenCalled();
  });
```

#### Por qué se cambió
Los tests fijan que un turno abierto offline del mismo UID no se pierde frente a un `current` remoto vacío, y que datos legacy sin UID no se atribuyen automáticamente al usuario autenticado actual.

### Cambio 22 - Normalización de clave de turno

#### Código anterior
```ts
function getTurnoMergeKey(t: SortableTurno): string {
  return [
    t.startDate || "",
    t.date || "",
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}
```

#### Código nuevo
```ts
function getTurnoMergeKey(t: SortableTurno): string {
  const effectiveDate = t.startDate || t.date || "";
  return [
    effectiveDate,
    t.startTime || "",
    t.endTime || "",
  ].join("|");
}
```

#### Por qué se cambió
Dos copias del mismo turno podían no deduplicarse si una tenía `startDate` vacío y la otra tenía `startDate` igual a `date`. La clave usa ahora la fecha efectiva del turno.

### Cambio 23 - Test de deduplicación sin startDate

#### Código anterior
`No existía el test "should deduplicate the same turno when one copy is missing startDate" en src/__tests__/logic.test.ts.`

#### Código nuevo
```ts
  it('should deduplicate the same turno when one copy is missing startDate', () => {
    const actuales = [
      { date: '2026-05-08', startDate: null, startTime: '08:00', endTime: '12:00', id: 1 } as Turno,
    ];

    const nuevos = [
      { date: '2026-05-08', startDate: '2026-05-08', startTime: '08:00', endTime: '12:00', id: 2 } as Turno,
    ];

    const merged = mergeTurnos(actuales, nuevos);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe(2);
  });
```

#### Por qué se cambió
La prueba cubre el caso de duplicado real con `startDate` ausente en una de las copias.

### Cambio 24 - Limpieza de listeners del Service Worker

#### Código anterior
```tsx
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => onUpdateFound(reg));
    });
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
```

#### Código nuevo
```tsx
    navigator.serviceWorker.addEventListener("message", onMessage);
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg || cancelado) return;
      const onRegUpdateFound = () => onUpdateFound(reg);
      reg.addEventListener("updatefound", onRegUpdateFound);
      updateFoundCleanup = () => {
        reg.removeEventListener("updatefound", onRegUpdateFound);
      };
    });
    return () => {
      cancelado = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
      updateFoundCleanup?.();
      stateChangeCleanups.forEach((cleanup) => cleanup());
    };
```

#### Por qué se cambió
`App` se desmonta y remonta al cambiar de usuario. El listener `updatefound` y los listeners `statechange` debían limpiarse igual que `message` para no dejar listeners acumulados.

### Cambio 25 - Eliminar rama inalcanzable de exportación

#### Código anterior
```tsx
            if (false) return match;
            return "#ffffff";
```

#### Código nuevo
```tsx
            return "#ffffff";
```

#### Por qué se cambió
La condición `if (false)` era código muerto dentro de la conversión de colores del ticket.

### Cambio 26 - Tests de limpieza de UI y Service Worker

#### Código anterior
`No existían los tests "cleans service worker update listeners mounted by App" ni "does not keep unreachable export color branches" en src/__tests__/main-antiguo-regressions.test.ts.`

#### Código nuevo
```ts
  it("cleans service worker update listeners mounted by App", () => {
    const mainSource = readSource("src/main.tsx");

    expect(mainSource).toContain('const isLocalDev = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);');
    expect(mainSource).toContain("if (isLocalDev) return;");
    expect(mainSource).toContain("let updateFoundCleanup: (() => void) | null = null;");
    expect(mainSource).toContain('reg.removeEventListener("updatefound", onRegUpdateFound);');
    expect(mainSource).not.toContain('reg.addEventListener("updatefound", () => onUpdateFound(reg));');
  });

  it("does not keep unreachable export color branches", () => {
    const source = readSource("src/screens/liquidacion-semana-screen.tsx");

    expect(source).not.toContain("if (false) return match;");
  });
```

#### Por qué se cambió
Los tests fijan que el listener de actualización del Service Worker no vuelva a quedar sin limpieza y que no se reintroduzca la rama inalcanzable en la exportación.

### Cambio 27 - Test de colores sin depender de código muerto

#### Código anterior
```ts
    const exportColorBlock = liquidacionSemanaSource.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return match;/
    )?.[0] || "";
```

#### Código nuevo
```ts
    const exportColorBlock = liquidacionSemanaSource.match(
      /const replaceOklch = \(str: string\) => \{[\s\S]*?return "#ffffff";/
    )?.[0] || "";
```

#### Por qué se cambió
El test buscaba el final del bloque mediante una rama inalcanzable eliminada. Ahora localiza el bloque por el retorno real que queda en la función.

## 2026-05-30 22:08 - Corregir datos de usuario anterior visibles al cambiar sesión

**Archivos modificados:** `src/hooks/use-firestore-sync.ts`

### Cambio 1 - Reset del store Zustand al inicio del efecto de Firestore

#### Código anterior
```ts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;

    let cancelado = false;
```

#### Código nuevo
```ts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const uid = user.uid;

    // ── Reset a estado vacío antes de cargar los datos del nuevo usuario ──────
    // El store (Zustand) es un singleton de módulo: persiste entre desmontajes.
    // Sin este reset, los datos del usuario anterior se muestran hasta que
    // Firestore responde con los del usuario nuevo (puede tardar varios segundos).
    // dataLoaded=false evita que los efectos de escritura re-persistan el estado
    // vacío en Firestore antes de que lleguen los datos reales.
    setCurrent({ entries: [], startTime: null, startDate: null, isPaused: false, pauseStartTime: null, totalPausedMinutes: 0 });
    setHistory([]);
    setReservations([]);
    setNotes([]);
    setWeekOverrides([]);
    setIsAdmin(false);
    setDataLoaded(false);
    setLoadTimedOut(false);
    // ─────────────────────────────────────────────────────────────────────────

    let cancelado = false;
```

#### Por qué se cambió
El store Zustand es un singleton de módulo y persiste en memoria entre desmontajes de componentes. Al cambiar de usuario (login con otra cuenta), el store conservaba el estado del usuario anterior, incluyendo el turno abierto, hasta que Firestore respondía con los datos del nuevo usuario. El reset garantiza que el nuevo usuario siempre parte de un estado vacío y limpio. Se resetea también `isAdmin`, `dataLoaded` y `loadTimedOut` para coherencia total del estado.

## 2026-05-30 20:40 - Añadir efecto neón a los iconos de agenda y ajustes


**Archivos modificados:** `src/components/home-icons.tsx`, `src/components/navigation-icons.tsx`, `src/screens/home-screen.tsx`, `src/main.tsx`

### Cambio 1 - Creación de IconAgendaNeon con neón morado

#### Código anterior
```tsx
export const IconAgenda: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="7" cy="9" r="1" fill={c} />
    <circle cx="7" cy="13" r="1" fill={c} />
    <circle cx="7" cy="17" r="1" fill={c} opacity="0.6" />
    <path d="M10 9H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 13H17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 17H15" stroke={c} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);
```

#### Código nuevo
```tsx
export const IconAgendaNeon: FC<{ s?: number }> = ({ s = 24 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      overflow: "visible",
      filter: "drop-shadow(0 0 1.2px rgba(180, 120, 255, 0.8)) drop-shadow(0 0 5px rgba(180, 120, 255, 0.28))"
    }}
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="17"
      rx="3"
      stroke="#b478ff"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="9" r="1.1" fill="#d7b8ff" />
    <circle cx="7" cy="13" r="1.1" fill="#d7b8ff" />
    <circle cx="7" cy="17" r="1.1" fill="#d7b8ff" opacity="0.6" />
    <path
      d="M10 9H17"
      stroke="#d7b8ff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 13H17"
      stroke="#d7b8ff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 17H15"
      stroke="#d7b8ff"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);
```

#### Por qué se cambió
Para añadirle el efecto de neón morado brillante con drop-shadow al icono de agenda en la pantalla de inicio.

### Cambio 2 - Creación de IconSettingsNeon que conserva el color gris original con neón

#### Código anterior
```tsx
export const IconSettings: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

#### Código nuevo
```tsx
export const IconSettingsNeon: FC<{ s?: number; c?: string }> = ({ s = 24, c = "oklch(0.72 0.01 250)" }: { s?: number; c?: string }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      overflow: "visible",
      filter: `drop-shadow(0 0 1.2px ${c}) drop-shadow(0 0 5px ${c})`
    }}
  >
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
      stroke={c}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
```

#### Por qué se cambió
Para añadir el efecto neón manteniendo dinámicamente el color original grisáceo a través de la prop `c`.

### Cambio 3 - Uso de los nuevos iconos neón en HomeScreen

#### Código anterior
```tsx
import { IconCalendar, IconSettings, IconAdminNeon, IconLogoutNeon } from "../components/navigation-icons";
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "../components/home-icons";
...
        <IconAgenda s={32} c="oklch(0.75 0.15 290)" />
...
        <IconSettings s={32} c="oklch(0.72 0.01 250)" />
```

#### Código nuevo
```tsx
import { IconCalendar, IconSettingsNeon, IconAdminNeon, IconLogoutNeon } from "../components/navigation-icons";
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgendaNeon } from "../components/home-icons";
...
        <IconAgendaNeon s={32} />
...
        <IconSettingsNeon s={32} c="oklch(0.72 0.01 250)" />
```

#### Por qué se cambió
Para importar y renderizar los nuevos componentes con efecto neón en la pantalla principal.

### Cambio 4 - Limpieza de importaciones no usadas de iconos en main.tsx

#### Código anterior
```tsx
import { IconRocket, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconGive, IconRoad, IconPinNeon } from "./components/summary-icons";
```

#### Código nuevo
```tsx
import { IconRocket, IconClipboard, IconChart, IconReservaWrite } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
```

#### Por qué se cambió
Se eliminaron las importaciones de `IconAgenda` (renombrado a `IconAgendaNeon`), así como de `IconGive` e `IconPinNeon`, ya que no se utilizan en `main.tsx` (fueron desacoplados a otros componentes de pantallas).

### Cambio 5 - Limpieza de importaciones de utilidades en main.tsx

#### Código anterior
```tsx
import html2canvas from "html2canvas";
import { signOut } from "firebase/auth";
...
import { hapticTap, hapticAction } from "./services/haptics";
```

#### Código nuevo
```tsx
import { signOut } from "firebase/auth";
...
import { hapticAction } from "./services/haptics";
```

#### Por qué se cambió
Se eliminaron las importaciones huérfanas de `html2canvas` y `hapticTap` en `main.tsx` ya que estas utilidades no se consumen directamente dentro del archivo tras la modularización de pantallas.

## 2026-05-30 20:35 - Cambiar comportamiento de retroceso en panel de turno

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Navegación a inicio al presionar botón físico atrás en pantalla del turno

#### Código anterior
```tsx
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const navego = useAppStore.getState().goBack();
          if (!navego) CapApp.exitApp();
        })
      )
```

#### Código nuevo
```tsx
    import("@capacitor/app")
      .then(({ App: CapApp }) =>
        CapApp.addListener("backButton", () => {
          const state = useAppStore.getState();
          if (state.screen === "main") {
            state.resetNavigation("home");
            return;
          }
          const navego = state.goBack();
          if (!navego) CapApp.exitApp();
        })
      )
```

#### Por qué se cambió
Se cambió para que cuando el usuario esté en el panel de control del turno ("main"), ya sea con el turno pausado o activo, al pulsar el botón físico de retroceso de su dispositivo Android vuelva a la pantalla de inicio ("home") en lugar de cerrar la aplicación.

## 2026-05-30 20:31 - Restablecer altura de overlay de pausa y añadir esquinas redondeadas

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Modificar posicionamiento y agregar border radius en el overlay de pausa

#### Código anterior
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "-12px -20px -24px",
            }}
          >
```

#### Código nuevo
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 80,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "0 -20px -24px",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
```

#### Por qué se cambió
Se restablece el valor de top a 80 y el margin superior a 0 para que la capa opaca de turno pausado cubra solo a partir de las tarjetas de cobro hacia abajo (dejando el encabezado del día y los botones Home y Pausa sin oscurecer), y se añaden esquinas superiores redondeadas (borderTopLeftRadius y borderTopRightRadius de 24px) para integrarlo estéticamente con el diseño general.

## 2026-05-30 20:30 - Ajustar overlay de pausa para cubrir la pantalla completa

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Modificar posicionamiento y margen superior del overlay de pausa

#### Código anterior
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 85,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "0 -20px -24px",
            }}
          >
```

#### Código nuevo
```tsx
        {current.isPaused && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Turno Pausado"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 12, 18, 0.2)",
              backdropFilter: "grayscale(0.85) brightness(0.6)",
              WebkitBackdropFilter: "grayscale(0.85) brightness(0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
              margin: "-12px -20px -24px",
            }}
          >
```

#### Por qué se cambió
Se modifica el valor de top de 85 a 0 y el margen superior de 0 a -12px para que el fondo opaco de turno pausado cubra la pantalla completa (incluyendo el encabezado del día y los botones superiores de home/pausa) en lugar de dejar la parte superior brillante y descubierta.

## 2026-05-30 20:27 - Habilitar reanudacion de turno al pulsar el icono de pausa

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Agregar interacción al recuadro de pausa

#### Código anterior
```tsx
            <div style={{
              width: 152,
              height: 152,
              background: "#101827",
              borderRadius: 38,
              border: "3px solid #3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
              boxShadow: "0 0 4px rgba(126,182,255,0.68), 0 0 28px rgba(59,130,246,0.30), 0 14px 34px rgba(59,130,246,0.18)"
            }}>
              <IconPause s={84} c="#7eb6ff" />
            </div>
```

#### Código nuevo
```tsx
            <div
              onClick={togglePause}
              style={{
                width: 152,
                height: 152,
                background: "#101827",
                borderRadius: 38,
                border: "3px solid #3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 40,
                boxShadow: "0 0 4px rgba(126,182,255,0.68), 0 0 28px rgba(59,130,246,0.30), 0 14px 34px rgba(59,130,246,0.18)",
                cursor: "pointer"
              }}
            >
              <IconPause s={84} c="#7eb6ff" />
            </div>
```

#### Por qué se cambió
Se añade interacción al recuadro del icono de pausa de la pantalla de turno pausado para que el usuario pueda reanudar su turno de forma intuitiva haciendo click en él además del botón continuar.

## 2026-05-30 19:54 - Extraer pantallas de resumen y edicion de main.tsx

**Archivos modificados:** `src/screens/summary-screen.tsx`, `src/screens/edit-turno-screen.tsx`, `src/main.tsx`, `src/__tests__/summary-layout.test.ts`, `src/__tests__/responsive-title-fonts.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Crear pantalla de resumen en archivo independiente

#### Código anterior
```
`No existía SummaryScreen en src/screens/summary-screen.tsx.`
```

#### Código nuevo
```tsx
import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack } from "../components/navigation-icons";
import { IconPencilNeon } from "../components/calendar-icons";
// ... (resto del archivo summary-screen.tsx)
```

#### Por qué se cambió
Se extrae la pantalla de Resumen de Turno de main.tsx a un archivo de componente exclusivo para modularizar y facilitar el mantenimiento del código.

### Cambio 2 - Crear pantalla de edición de turno en archivo independiente

#### Código anterior
```
`No existía EditTurnoScreen en src/screens/edit-turno-screen.tsx.`
```

#### Código nuevo
```tsx
import { type FC, useState } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
// ... (resto del archivo edit-turno-screen.tsx)
```

#### Por qué se cambió
Se desacopla la pantalla de Edición de Turno de main.tsx a su propio archivo de componente manteniendo todos sus diálogos locales y feedback háptico.

### Cambio 3 - Importar y renderizar nuevas pantallas en main.tsx

#### Código anterior
```tsx
// ... importaciones ...
import { fmtDuration, fmtKm, fmtKmNumber, fmtMoney, fmtMoneyNumber, fmt } from "./logic/formatters";
// ...
  if (screen === 'summary' && viewTurno) {
    const vP = viewTurno.entries.filter((e: any) => e.type === 'propina').reduce((s: number, e: any) => s + e.amount, 0);
    // ... [cerca de 750 líneas de JSX para summary y editTurno] ...
  }
```

#### Código nuevo
```tsx
import { SummaryScreen } from "./screens/summary-screen";
import { EditTurnoScreen } from "./screens/edit-turno-screen";
// ...
  if (screen === 'summary' && viewTurno) {
    return (
      <SummaryScreen
        viewTurno={viewTurno}
        settings={settings}
        returnScreen={returnScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        setScreen={setScreen}
        setEditJ={setEditJ}
        setHistory={setHistory}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
      />
    );
  }

  if (screen === 'editTurno' && editJ) {
    return (
      <EditTurnoScreen
        editJ={editJ}
        setEditJ={setEditJ}
        setHistory={setHistory}
        setViewTurno={setViewTurno}
        setScreen={setScreen}
        endField={endField}
        setEndField={setEndField}
      />
    );
  }
```

#### Por qué se cambió
Se redujo significativamente la complejidad de main.tsx delegando el renderizado de estas dos pantallas a los nuevos componentes.

### Cambio 4 - Actualizar ruta del archivo leido en summary-layout.test.ts

#### Código anterior
```ts
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
```

#### Código nuevo
```ts
  const source = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
```

#### Por qué se cambió
La pantalla de resumen ahora está en summary-screen.tsx, por lo que el test estático debe analizar este archivo.

### Cambio 5 - Actualizar archivo analizado en responsive-title-fonts.test.ts

#### Código anterior
```ts
describe("Responsive title fonts", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
```

#### Código nuevo
```ts
describe("Responsive title fonts", () => {
  const source = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
```

#### Por qué se cambió
La aserción comprueba el tamaño de fuente responsivo del título del resumen que ahora vive en summary-screen.tsx.

### Cambio 6 - Añadir lecturas y adaptar aserciones en detailed-notes-layout.test.ts

#### Código anterior
```ts
describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");

  const summaryIconsSource = readFileSync(resolve("src/components/summary-icons.tsx"), "utf8");
```

#### Código nuevo
```ts
describe("Detailed notes layout", () => {
  const source = readFileSync(resolve("src/main.tsx"), "utf8");
  const summarySource = readFileSync(resolve("src/screens/summary-screen.tsx"), "utf8");
  const editTurnoSource = readFileSync(resolve("src/screens/edit-turno-screen.tsx"), "utf8");

  const summaryIconsSource = readFileSync(resolve("src/components/summary-icons.tsx"), "utf8");
```

#### Por qué se cambió
Se adaptan los tests de regresión estáticos para buscar las notas detalladas y la pantalla de edición en las nuevas rutas de las pantallas extraídas.

### Cambio 7 - Añadir comentario de teclado in-app en edit-turno-screen.tsx

#### Código anterior
```tsx
        </div>
      </div>

      {endField && (
```

#### Código nuevo
```tsx
        </div>
      </div>

      {/* Teclado in-app para Dinero / KM en Editar Turno */}
      {endField && (
```

#### Por qué se cambió
Restaurar el comentario literal buscado por los tests de regresión estáticos del editor de turnos.

## 2026-05-30 19:44 - Consolidar iconos e inline styles en main.tsx

**Archivos modificados:** `src/main.tsx`

### Cambio 1 - Importar iconos comunes en `main.tsx`

#### Código anterior
```ts
import { hapticTap, hapticAction } from "./services/haptics";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "./components/entry-icons";
import {
  IconBack,
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
import { CalendarScreen } from "./screens/calendar-screen";
```

#### Código nuevo
```ts
import { hapticTap, hapticAction } from "./services/haptics";
import {
  IconCoin,
  IconCard,
  IconAgency,
  IconExtra,
  IconFuel,
  IconNulo,
} from "./components/entry-icons";
import {
  IconBack,
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
import { IconTimer, IconMoneyBag, IconPencilNeon } from "./components/calendar-icons";
import { IconRocket, IconClipboard, IconChart, IconReservaWrite, IconAgenda } from "./components/home-icons";
import { IconNoteAdd, IconTaxiBadgeNeon, IconGive, IconRoad, IconPinNeon } from "./components/summary-icons";
import { IconReceipt, IconHoliday } from "./components/settings-icons";
import { CalendarScreen } from "./screens/calendar-screen";
```

#### Por qué se cambió
Se importan los iconos compartidos consolidados en lugar de definirlos de manera local y redundante en `main.tsx`.

### Cambio 2 - Eliminar constantes locales de iconos en `main.tsx`

#### Código anterior
```ts
const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  // ... svg local ...
);
// ... y otros 14 iconos locales: IconReservaWrite, IconNoteAdd, IconTaxiBadgeNeon, IconReceipt, IconGive, IconHoliday, IconTimer, IconRoad, IconPinNeon, IconMoneyBag, IconAgenda, IconClipboard, IconChart, IconRocket
```

#### Código nuevo
```
(El bloque completo de definiciones de iconos locales fue removido de main.tsx)
```

#### Por qué se cambió
Eliminar la duplicidad de componentes de iconos SVG redundantes que ya se encuentran disponibles en los archivos de utilidades de iconos comunes del proyecto.

### Cambio 3 - Extraer estilos de reserva inline de la función render de App

#### Código anterior
```ts
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;
```
...
```ts
    }
    setShowReservaDialog(false);
  };

  const reservaInputStyle = {
    width: "100%",
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.11)",
    borderRadius: 14,
    color: "white",
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const renderReservaLabel = (primary: string, secondary: string, required = false) => (
    // ...
  );

  const renderReservaSection = (title: string, subtitle: string) => (
    // ...
  );

  const reservaFieldGroupStyle = {
    marginLeft: 10,
    paddingLeft: 12,
    borderLeft: `1px solid ${C}55`,
  };
```

#### Código nuevo
```ts
const NOTE_TIME_STYLE = {
  fontSize: 12,
  color: "rgba(255,255,255,0.45)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  flexShrink: 0,
  alignSelf: "baseline",
} as const;

const reservaInputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 14,
  color: "white",
  padding: "13px 14px",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box" as const,
};

const reservaFieldGroupStyle = {
  marginLeft: 10,
  paddingLeft: 12,
  borderLeft: `1px solid ${C}55`,
};
```
...
```ts
    }
    setShowReservaDialog(false);
  };

  const renderReservaLabel = (primary: string, secondary: string, required = false) => (
    // ...
  );

  const renderReservaSection = (title: string, subtitle: string) => (
    // ...
  );
```

#### Por qué se cambió
Mover variables de estilos de React fuera de las funciones de render para evitar la recreación innecesaria de objetos en memoria en cada ciclo de render.

## 2026-05-30 19:38 - Añadir store Zustand y migrar pantallas de detalle a selectores

**Archivos modificados:** `src/services/store.ts`, `src/main.tsx`, `src/screens/add-nota-general-screen.tsx`, `src/screens/detalle-anual-screen.tsx`, `src/screens/detalle-mes-screen.tsx`, `src/screens/detalle-semana-screen.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/store-extraction.test.ts`, `src/__tests__/state-loaders-extraction.test.ts`

### Cambio 1 - Crear store global de Zustand

#### Código anterior
`No existía src/services/store.ts.`

#### Código nuevo
```ts
import { create } from "zustand";
import type {
  AppSettings,
  CurrentState,
  NotaCalendario,
  Reserva,
  Turno,
  WeekOverride,
} from "../shared/types";
import {
  loadCurrent,
  loadHistory,
  loadNotes,
  loadReservations,
  loadSettings,
  loadWeekOverrides,
} from "../logic/state-loaders";

/**
 * Store global de la aplicación (Zustand v5).
 *
 * Diseño:
 *  - Slice de NEGOCIO: los 6 dominios (current, history, reservations, notes,
 *    settings, weekOverrides) + flags de sincronización (dataLoaded, loadTimedOut)
 *    + isAdmin.
 *  - Slice de NAVEGACIÓN: separado conceptualmente (screen + navigationStack +
 *    setScreen/goBack/resetNavigation) para no acoplar navegación con datos.
 *
 * Los setters imitan la firma de React `Dispatch<SetStateAction<T>>`
 * (aceptan un valor o una función updater) para poder migrar `App` y
 * `useFirestoreSync` SIN reescribir las ~3000 líneas que ya consumen
 * `setCurrent(prev => ...)`, `setHistory(...)`, etc.
 */

type Updater<T> = T | ((prev: T) => T);

function resolve<T>(prev: T, value: Updater<T>): T {
  return typeof value === "function" ? (value as (p: T) => T)(prev) : value;
}

// --- Slice de negocio ---------------------------------------------------------
interface BusinessSlice {
  current: CurrentState;
  history: Turno[];
  reservations: Reserva[];
  notes: NotaCalendario[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];

  dataLoaded: boolean;
  loadTimedOut: boolean;
  isAdmin: boolean;

  setCurrent: (value: Updater<CurrentState>) => void;
  setHistory: (value: Updater<Turno[]>) => void;
  setReservations: (value: Updater<Reserva[]>) => void;
  setNotes: (value: Updater<NotaCalendario[]>) => void;
  setSettings: (value: Updater<AppSettings>) => void;
  setWeekOverrides: (value: Updater<WeekOverride[]>) => void;

  setDataLoaded: (value: Updater<boolean>) => void;
  setLoadTimedOut: (value: Updater<boolean>) => void;
  setIsAdmin: (value: Updater<boolean>) => void;
}

// --- Slice de navegación ------------------------------------------------------
interface NavigationSlice {
  screen: string;
  navigationStack: string[];
  /** Navega a una pantalla apilándola en el historial. */
  setScreen: (value: Updater<string>) => void;
  /** Vuelve a la pantalla anterior del stack. Devuelve false si ya estaba en la raíz. */
  goBack: () => boolean;
  /** Reinicia la navegación a una pantalla raíz (p. ej. al hacer login/logout). */
  resetNavigation: (root?: string) => void;
}

export type AppStore = BusinessSlice & NavigationSlice;

const INITIAL_SCREEN = "home";

export const useAppStore = create<AppStore>((set, get) => ({
  // --- negocio: estado inicial leído de localStorage (igual que antes) ---
  current: loadCurrent(),
  history: loadHistory(),
  reservations: loadReservations(),
  notes: loadNotes(),
  settings: loadSettings(),
  weekOverrides: loadWeekOverrides(),

  dataLoaded: false,
  loadTimedOut: false,
  isAdmin: false,

  setCurrent: (value) => set((s) => ({ current: resolve(s.current, value) })),
  setHistory: (value) => set((s) => ({ history: resolve(s.history, value) })),
  setReservations: (value) =>
    set((s) => ({ reservations: resolve(s.reservations, value) })),
  setNotes: (value) => set((s) => ({ notes: resolve(s.notes, value) })),
  setSettings: (value) => set((s) => ({ settings: resolve(s.settings, value) })),
  setWeekOverrides: (value) =>
    set((s) => ({ weekOverrides: resolve(s.weekOverrides, value) })),

  setDataLoaded: (value) => set((s) => ({ dataLoaded: resolve(s.dataLoaded, value) })),
  setLoadTimedOut: (value) =>
    set((s) => ({ loadTimedOut: resolve(s.loadTimedOut, value) })),
  setIsAdmin: (value) => set((s) => ({ isAdmin: resolve(s.isAdmin, value) })),

  // --- navegación ---
  screen: INITIAL_SCREEN,
  navigationStack: [INITIAL_SCREEN],

  setScreen: (value) =>
    set((s) => {
      const next = resolve(s.screen, value);
      if (next === s.screen) return s;
      return { screen: next, navigationStack: [...s.navigationStack, next] };
    }),

  goBack: () => {
    const { navigationStack } = get();
    if (navigationStack.length <= 1) return false;
    const stack = navigationStack.slice(0, -1);
    set({ screen: stack[stack.length - 1], navigationStack: stack });
    return true;
  },

  resetNavigation: (root = INITIAL_SCREEN) =>
    set({ screen: root, navigationStack: [root] }),
}));
```

#### Por qué se cambió
Centralizar el estado de negocio (current, history, reservations, notes, settings, weekOverrides) y la navegación (screen + navigationStack + goBack/resetNavigation) en un único store para eliminar el prop drilling. Los setters imitan la firma de useState (valor o updater) para poder migrar sin reescribir el resto de App.

### Cambio 2 - Retroceso tras cerrar turno lleva a la lista de turnos

#### Código anterior
```tsx
    setViewTurno(turno);
    setScreen("summary");
  }
```

#### Código nuevo
```tsx
    setViewTurno(turno);
    // Tras cerrar el turno, el recorrido de navegación queda como
    // PantallaTurnos -> summary, de modo que el botón "atrás" desde el
    // resumen lleve a la lista de turnos (como si se hubiera abierto desde
    // ahí), nunca de vuelta a la pantalla de confirmar cierre.
    useAppStore.getState().resetNavigation("PantallaTurnos");
    setScreen("summary");
  }
```

#### Por qué se cambió
Al cerrar turno e ir al resumen, el botón físico de atrás volvía a la pantalla de confirmar cierre (con el turno ya cerrado), pudiendo crear un turno vacío. Reiniciar el stack a PantallaTurnos hace que atrás lleve a la lista de turnos.

### Cambio 3 - Migrar pantallas de detalle a selectores del store

#### Código anterior (ejemplo, detalle-anual-screen.tsx)
```tsx
export function DetalleAnualScreen({
  history,
  settings,
  selectedAccountingYear,
  setSelectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingMonth,
  setScreen,
}: Props) {
```

#### Código nuevo
```tsx
export function DetalleAnualScreen({
  selectedAccountingYear,
  setSelectedAccountingYear,
  selectedAccountingMonth,
  setSelectedAccountingMonth,
}: Props) {
  const history: Turno[] = useAppStore((s) => s.history);
  const settings: AppSettings = useAppStore((s) => s.settings);
  const setScreen = useAppStore((s) => s.setScreen);
```

#### Por qué se cambió
DetalleAnualScreen, DetalleMesScreen, DetalleSemanaScreen, LiquidacionSemanaScreen y AddNotaGeneralScreen leían history/settings/weekOverrides/setScreen/setCurrent por props desde App. Ahora los leen por selectores del store, reduciendo el prop drilling. Se quitaron también esas props de las invocaciones en main.tsx.

### Cambio 4 - Limpiar imports de iconos sin usar y de state-loaders en main.tsx

#### Código anterior
```tsx
import {
  IconBack,
  IconDel,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconCalendar,
  IconSettings,
  IconHomeNeon,
  IconLogoutNeon,
  IconAdminNeon,
} from "./components/navigation-icons";
```

#### Código nuevo
```tsx
import {
  IconBack,
  IconDel,
  IconHomeNeon,
} from "./components/navigation-icons";
```

#### Por qué se cambió
Tras centralizar el estado en el store, varios imports quedaron sin uso: 8 iconos (IconPercent, IconRefresh, IconDownload, IconUpload, IconCalendar, IconSettings, IconLogoutNeon, IconAdminNeon) y el import de state-loaders (loadCurrent, etc., que ahora consume el store). Se eliminaron para no dejar código muerto.

### Cambio 5 - Test del contrato del store

#### Código anterior
`No existía src/__tests__/store-extraction.test.ts.`

#### Código nuevo
`Test nuevo que verifica vía useAppStore.getState(): setCurrent (valor y updater), y el slice de navegación (setScreen apila, goBack retrocede/devuelve false en raíz, resetNavigation reinicia el stack para el flujo post-cierre de turno).`

#### Por qué se cambió
Validar el contrato del store en el que se apoyan las pantallas migradas, en el mismo estilo de tests de lógica del proyecto (sin React).

### Cambio 6 - Actualizar test de extracción de state-loaders

#### Código anterior
```ts
    expect(mainSource).toContain('from "./logic/state-loaders"');
    expect(mainSource).not.toMatch(/^function loadSettings\(/m);
```

#### Código nuevo
```ts
    // Tras centralizar el estado en el store (Fase 2), los loaders los consume
    // el store, no main.tsx. Lo que importa es que sigan FUERA de main.tsx.
    const storeSource = readFileSync(resolve("src/services/store.ts"), "utf8");
    expect(storeSource).toContain('from "../logic/state-loaders"');
    expect(mainSource).not.toMatch(/^function loadSettings\(/m);
```

#### Por qué se cambió
El test verificaba que main.tsx importaba los loaders (arquitectura previa). Tras la migración los consume el store; se actualiza el aserto para comprobar que el store los importa y que siguen fuera de main.tsx.

## 2026-05-30 19:37 - Añadir feedback háptico e indicador de sincronización

**Archivos modificados:**
- `package.json`
- `index.html`
- `src/services/haptics.ts`
- `src/hooks/use-network-status.ts`
- `src/components/sync-indicator.tsx`
- `src/components/shell.tsx`
- `src/screens/add-entry-screen.tsx`
- `src/screens/add-single-entry-screen.tsx`
- `src/screens/confirm-end-screen.tsx`
- `src/screens/settings-screen.tsx`
- `src/main.tsx`

### Cambio 1 - Instalar dependencia @capacitor/haptics

#### Código anterior
```json
  "dependencies": {
    "@capacitor/app": "^6.0.3",
    "@capacitor/core": "^6.2.0",
    "@capacitor/filesystem": "^6.0.3",
    "@capacitor/share": "^6.0.3",
    "firebase": "^11.0.0",
    "html2canvas": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.14"
  },
```

#### Código nuevo
```json
  "dependencies": {
    "@capacitor/app": "^6.0.3",
    "@capacitor/core": "^6.2.0",
    "@capacitor/filesystem": "^6.0.3",
    "@capacitor/haptics": "^6.0.0",
    "@capacitor/share": "^6.0.3",
    "firebase": "^11.0.0",
    "html2canvas": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.14"
  },
```

#### Por qué se cambió
Se requiere el plugin oficial de Capacitor para dar soporte de feedback háptico en dispositivos nativos.

### Cambio 2 - Crear servicio de feedback háptico

#### Código anterior
```
No existía haptics.ts en src/services.
```

#### Código nuevo
```ts
import { Capacitor } from '@capacitor/core';

let hapticsModule: any = null;

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  if (!hapticsModule) {
    try {
      hapticsModule = await import('@capacitor/haptics');
    } catch (e) {
      console.warn('Error cargando módulo de haptics:', e);
      return null;
    }
  }
  return hapticsModule;
}

export async function hapticTap(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Light });
    } catch (e) {
      console.warn('Error en hapticTap:', e);
    }
  }
}

export async function hapticConfirm(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Medium });
    } catch (e) {
      console.warn('Error en hapticConfirm:', e);
    }
  }
}

export async function hapticAction(): Promise<void> {
  const haptics = await getHaptics();
  if (haptics) {
    try {
      await haptics.Haptics.impact({ style: haptics.ImpactStyle.Heavy });
    } catch (e) {
      console.warn('Error en hapticAction:', e);
    }
  }
}
```

#### Por qué se cambió
Centraliza la lógica de feedback háptico con imports dinámicos para evitar fallos en entornos web o tests.

### Cambio 3 - Añadir háptico a add-entry-screen.tsx

#### Código anterior
```ts
import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { G, P } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { CurrentState, Entry } from "../shared/types";
```
...
```ts
  function kpAdd(v: string) {
    if (v === "DEL") {
      setVal((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!curVal.includes(",")) setVal((p) => p + ",");
      return;
    }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }

  function handleSaveAdd() {
    const p = parseFloat(valP.replace(",", "."));
    const d = parseFloat(valD.replace(",", "."));
```

#### Código nuevo
```ts
import { type FC } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { G, P } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { CurrentState, Entry } from "../shared/types";
import { hapticTap, hapticConfirm } from "../services/haptics";
```
...
```ts
  function kpAdd(v: string) {
    hapticTap();
    if (v === "DEL") {
      setVal((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!curVal.includes(",")) setVal((p) => p + ",");
      return;
    }
    if (curVal.replace(",", "").length >= 6) return;
    setVal((p) => p + v);
  }

  function handleSaveAdd() {
    hapticConfirm();
    const p = parseFloat(valP.replace(",", "."));
    const d = parseFloat(valD.replace(",", "."));
```

#### Por qué se cambió
Brindar respuesta física (vibración ligera en teclado, moderada al guardar) en la pantalla de añadir entrada.

### Cambio 4 - Añadir háptico a add-single-entry-screen.tsx

#### Código anterior
```ts
import { type FC, type CSSProperties } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { A, ABG, E, EBG, F, FBG, N, NBG } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { Entry } from "../shared/types";
```
...
```ts
  function kpS(v: string) {
    if (v === "DEL") {
      setValS((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!valS.includes(",")) setValS((p) => p + ",");
      return;
    }
    if (valS.replace(",", "").length >= 6) return;
    setValS((p) => p + v);
  }

  const validS = valS && parseFloat(valS.replace(",", ".")) > 0;

  function saveS() {
    if (!validS) return;
```

#### Código nuevo
```ts
import { type FC, type CSSProperties } from "react";
import { Shell } from "../components/shell";
import { IconBack, IconDel } from "../components/navigation-icons";
import { A, ABG, E, EBG, F, FBG, N, NBG } from "../shared/ui-theme";
import { timeNow, today } from "../logic/date-time";
import type { Entry } from "../shared/types";
import { hapticTap, hapticConfirm } from "../services/haptics";
```
...
```ts
  function kpS(v: string) {
    hapticTap();
    if (v === "DEL") {
      setValS((p) => p.slice(0, -1));
      return;
    }
    if (v === ",") {
      if (!valS.includes(",")) setValS((p) => p + ",");
      return;
    }
    if (valS.replace(",", "").length >= 6) return;
    setValS((p) => p + v);
  }

  const validS = valS && parseFloat(valS.replace(",", ".")) > 0;

  function saveS() {
    hapticConfirm();
    if (!validS) return;
```

#### Por qué se cambió
Brindar respuesta física al ingresar valores y guardar gastos/extras/gasolina.

### Cambio 5 - Añadir háptico a confirm-end-screen.tsx

#### Código anterior
```ts
import type { CurrentState, AppSettings, Entry } from "../shared/types";
```
...
```ts
  function kpEnd(v: string) {
    if (!endField) return;
```
...
```ts
          <button onClick={onEndTurno}
            style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
            Terminar Turno
          </button>
```
...
```ts
            <button
              onClick={() => setEndField(null)}
              style={{
```

#### Código nuevo
```ts
import type { CurrentState, AppSettings, Entry } from "../shared/types";
import { hapticTap, hapticConfirm, hapticAction } from "../services/haptics";
```
...
```ts
  function kpEnd(v: string) {
    hapticTap();
    if (!endField) return;
```
...
```ts
          <button onClick={() => { hapticAction(); onEndTurno(); }}
            style={{ padding: "15px 0", borderRadius: 16, border: "none", background: "rgba(255,60,60,0.12)", color: "rgba(255,110,110,0.9)", fontSize: 16, fontWeight: 800, cursor: "pointer", outline: "1.5px solid rgba(255,60,60,0.25)" }}>
            Terminar Turno
          </button>
```
...
```ts
            <button
              onClick={() => { hapticConfirm(); setEndField(null); }}
              style={{
```

#### Por qué se cambió
Añadir vibración al teclado numérico de fin de turno y vibración intensa al finalizar turno definitivamente.

### Cambio 6 - Añadir háptico a settings-screen.tsx

#### Código anterior
```ts
import { IconDel } from "../components/navigation-icons";
```
...
```ts
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
                  onClick={() => {
                    let next = settingsValStr;
                    if (k === "DEL") next = next.slice(0, -1);
                    else if (k === ",") { if (!next.includes(",")) next = next + ","; else return; }
                    else { if (next.replace(",", "").length >= 3) return; next = next + k; }
                    setSettingsValStr(next);
                  }}
```
...
```ts
            <button
              onClick={() => {
                const val = parseFloat(settingsValStr.replace(",", ".")) || 0;
```

#### Código nuevo
```ts
import { IconDel } from "../components/navigation-icons";
import { hapticTap, hapticConfirm } from "../services/haptics";
```
...
```ts
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k}
                  onClick={() => {
                    hapticTap();
                    let next = settingsValStr;
                    if (k === "DEL") next = next.slice(0, -1);
                    else if (k === ",") { if (!next.includes(",")) next = next + ","; else return; }
                    else { if (next.replace(",", "").length >= 3) return; next = next + k; }
                    setSettingsValStr(next);
                  }}
```
...
```ts
            <button
              onClick={() => {
                hapticConfirm();
                const val = parseFloat(settingsValStr.replace(",", ".")) || 0;
```

#### Por qué se cambió
Ofrecer feedback táctil al ajustar el porcentaje de reparto en la configuración.

### Cambio 7 - Añadir háptico a main.tsx

#### Código anterior
```ts
import { APP_VERSION } from "./shared/app-version";
```
...
```ts
  function togglePause() {
    const now = timeNow();
```
...
```ts
    function kpEdit(v: string) {
      if (!editJ || !endField) return;
```
...
```ts
                    <div style={{ position: 'relative', zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4, marginBottom: 4, animation: 'fadeUp 0.2s ease' }}>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                        <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => {
                          e.preventDefault();
```
...
```ts
                  <button
                    onClick={() => {
                      setCurrent({
```

#### Código nuevo
```ts
import { APP_VERSION } from "./shared/app-version";
import { hapticTap, hapticAction } from "./services/haptics";
```
...
```ts
  function togglePause() {
    hapticAction();
    const now = timeNow();
```
...
```ts
    function kpEdit(v: string) {
      hapticTap();
      if (!editJ || !endField) return;
```
...
```ts
                    <div style={{ position: 'relative', zIndex: 99, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4, marginBottom: 4, animation: 'fadeUp 0.2s ease' }}>
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", ","].map((k) => (
                        <button key={k} aria-label={k === "DEL" ? "Borrar" : k === "," ? "Coma decimal" : k} onClick={(e) => {
                          hapticTap();
                          e.preventDefault();
```
...
```ts
                  <button
                    onClick={() => {
                      hapticAction();
                      setCurrent({
```

#### Por qué se cambió
Dar respuesta háptica al pulsar las teclas numéricas, iniciar el turno y pausar o reanudar el turno.

### Cambio 8 - Crear hook useNetworkStatus

#### Código anterior
```
No existía use-network-status.ts en src/hooks.
```

#### Código nuevo
```ts
import { useState, useEffect } from "react";
import { useAppStore } from "../services/store";

export type NetworkStatus = "online" | "offline" | "error";

export function useNetworkStatus(): NetworkStatus {
  const dataLoaded = useAppStore((state) => state.dataLoaded);
  const loadTimedOut = useAppStore((state) => state.loadTimedOut);
  
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (loadTimedOut) {
    return "error";
  }

  if (!isOnline || !dataLoaded) {
    return "offline";
  }

  return "online";
}
```

#### Por qué se cambió
Combina el estado nativo de red en el navegador con el estado interno de carga de Firestore para clasificar la conexión.

### Cambio 9 - Crear componente SyncIndicator

#### Código anterior
```
No existía sync-indicator.tsx en src/components.
```

#### Código nuevo
```tsx
import { type FC } from "react";
import { useNetworkStatus } from "../hooks/use-network-status";

export const SyncIndicator: FC = () => {
  const status = useNetworkStatus();

  const config = {
    online: {
      color: "#10b981",
      shadow: "rgba(16, 185, 129, 0.4)",
      label: "Sincronizado",
      animation: "none",
    },
    offline: {
      color: "#f59e0b",
      shadow: "rgba(245, 158, 11, 0.4)",
      label: "Modo sin conexión",
      animation: "pulse-sync 2s infinite ease-in-out",
    },
    error: {
      color: "#ef4444",
      shadow: "rgba(239, 68, 68, 0.4)",
      label: "Error de sincronización",
      animation: "none",
    },
  }[status];

  return (
    <div
      title={config.label}
      style={{
        position: "absolute",
        bottom: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: config.color,
        boxShadow: `0 0 6px ${config.shadow}`,
        animation: config.animation,
        pointerEvents: "none",
        zIndex: 1000,
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
      }}
    />
  );
};
```

#### Por qué se cambió
Representación visual en forma de pequeño LED para conocer en todo momento el estado de red y sincronización Firestore.

### Cambio 10 - Integrar indicador en el Shell

#### Código anterior
```tsx
import type { ReactNode } from "react";

const BURST_GREEN = "oklch(0.68 0.20 145)";
const BURST_PURPLE = "oklch(0.65 0.20 280)";

export function Shell({
  children,
  burst,
}: {
  children: ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {burst && <Burst />}
      {children}
    </div>
  );
}
```

#### Código nuevo
```tsx
import type { ReactNode } from "react";
import { SyncIndicator } from "./sync-indicator";

const BURST_GREEN = "oklch(0.68 0.20 145)";
const BURST_PURPLE = "oklch(0.65 0.20 280)";

export function Shell({
  children,
  burst,
}: {
  children: ReactNode;
  burst: boolean;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 460,
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#0d0d14",
        overflow: "hidden",
        position: "relative",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {burst && <Burst />}
      {children}
      <SyncIndicator />
    </div>
  );
}
```

#### Por qué se cambió
Mostrar el indicador de sincronización de red en la parte inferior derecha del contenedor global de la aplicación.

### Cambio 11 - Añadir animación en index.html

#### Código anterior
```html
    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
```

#### Código nuevo
```html
    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    @keyframes pulse-sync {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
```

#### Por qué se cambió
Habilitar la animación CSS de pulso lento necesaria para el estado de red offline del indicador.

## 2026-05-29 16:49 - Añadir check de tipos y tests al CI

**Archivos modificados:** package.json, .github/workflows/ci.yml

### Cambio 1 - Script typecheck en package.json

#### Código anterior
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

#### Código nuevo
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
```

#### Por qué se cambió
No existía forma estandarizada de ejecutar la comprobación de tipos. El script `typecheck` permite invocarla igual en local y en CI.

### Cambio 2 - Workflow de CI

#### Código anterior
```yaml
No existía .github/workflows/ci.yml en el proyecto.
```

#### Código nuevo
```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Tests
        run: npm test
```

#### Por qué se cambió
La suite de tests es de extracción (coincidencia de strings) y no detecta errores de compilación; un error de tipos (TS2741 en CalendarScreen) pasó desapercibido. El workflow ejecuta `tsc --noEmit` y los tests en cada push y PR a main para impedir que vuelva a ocurrir.

## 2026-05-29 16:45 - Cablear useFirestoreSync y eliminar Firebase inline de main.tsx

**Archivos modificados:** src/main.tsx, .gitignore

### Cambio 1 - Invocar el hook useFirestoreSync

#### Código anterior
```tsx
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const lastCurrentRef = useRef<CurrentState | null>(null);
  const lastSettingsRef = useRef<AppSettings | null>(null);
  const lastHistoryRef = useRef<Turno[]>([]);
  const lastReservationsRef = useRef<Reserva[]>([]);
  const lastNotesRef = useRef<NotaCalendario[]>([]);
  const lastWeekOverridesRef = useRef<WeekOverride[]>([]);
```

#### Código nuevo
```tsx
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });
```

#### Por qué se cambió
El hook `useFirestoreSync` estaba importado pero nunca se invocaba (código muerto), y los estados `dataLoaded`/`loadTimedOut` y los 6 refs `lastXRef` seguían declarados en `main.tsx`. Ahora esos estados y refs viven dentro del hook; el componente solo consume su valor de retorno.

### Cambio 2 - Eliminar la función de migración duplicada en main.tsx

#### Código anterior
```tsx
const LOCAL_MIGRATION_KEY = "taxi_migration_done_v2";

const LOAD_TIMEOUT_MS = 15000;

async function migrarLocalStorageAFirestore(uid: string): Promise<void> {
  // ... (sube localStorage a Firestore, batch writes y limpieza de claves)
}
```

#### Código nuevo
```tsx
// Eliminado: la migración localStorage → Firestore vive ahora en
// src/hooks/use-firestore-sync.ts.
```

#### Por qué se cambió
`migrarLocalStorageAFirestore`, `LOCAL_MIGRATION_KEY` y `LOAD_TIMEOUT_MS` estaban duplicados literalmente en `main.tsx` y en el hook. Se elimina la copia de `main.tsx` para tener una única fuente de verdad.

### Cambio 3 - Eliminar los useEffect de Firestore de main.tsx

#### Código anterior
```tsx
  useEffect(() => {
    if (!dataLoaded || !auth.currentUser) return;
    // ... saveUserDoc / syncSubcollection para current, settings, turnos,
    //     reservations, notes, weekOverrides
  }, [/* deps */]);

  useEffect(() => {
    // ... inicialización con onSnapshot de las 6 colecciones + marcar dataLoaded
  }, []);

  useEffect(() => {
    // ... timeout de carga (setLoadTimedOut)
  }, [dataLoaded]);

  useEffect(() => {
    // ... getDoc(admins/{uid}) → setIsAdmin
  }, []);
```

#### Código nuevo
```tsx
// Eliminados: toda la lógica de escritura reactiva, suscripción onSnapshot,
// timeout de carga y detección de admin se movió a useFirestoreSync.
// El useEffect del Service Worker permanece en main.tsx por no ser de Firebase.
```

#### Por qué se cambió
Eran exactamente los mismos efectos que ya contiene el hook. Mantenerlos en `main.tsx` los ejecutaba por duplicado y contradecía la extracción.

### Cambio 4 - Reducir los imports de Firestore en main.tsx

#### Código anterior
```tsx
import {
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./services/firebase";
```

#### Código nuevo
```tsx
import { auth } from "./services/firebase";
```

#### Por qué se cambió
Tras mover la lógica al hook, `onSnapshot`, `doc`, `getDoc`, `setDoc`, `writeBatch` y `db` quedaron sin uso en `main.tsx`.

### Cambio 5 - Pasar renderReservaDialog a CalendarScreen

#### Código anterior
```tsx
        notes={notes}
        setNotes={setNotes}
        
        setShowReservaDialog={setShowReservaDialog}
```

#### Código nuevo
```tsx
        notes={notes}
        setNotes={setNotes}
        renderReservaDialog={renderReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
```

#### Por qué se cambió
`CalendarScreenProps` exige `renderReservaDialog` y no se estaba pasando, lo que rompía `tsc --noEmit` (error TS2741). La función ya existía en `main.tsx`.

### Cambio 6 - Ignorar artefactos de trabajo del agente

#### Código anterior
```
No existía la sección de artefactos del agente en .gitignore.
```

#### Código nuevo
```
# Artefactos de trabajo del agente
scratch/
test_failures.txt
scratch_verify_results.txt
```

#### Por qué se cambió
`test_failures.txt`, `scratch_verify_results.txt` y `scratch/` son residuos de depuración que no deben acabar en el repositorio.

## 2026-05-29 17:41 - Extraer pantallas de contabilidad y sincronizacion

**Archivos modificados:** src/main.tsx, src/hooks/use-firestore-sync.ts, src/screens/contabilidad-screen.tsx, src/screens/detalle-anual-screen.tsx, src/screens/detalle-mes-screen.tsx, src/screens/detalle-semana-screen.tsx, src/screens/liquidacion-semana-screen.tsx, ESTRUCTURA.md, src/__tests__/responsive-title-fonts.test.ts

### Cambio 1 - Extraer logica de sincronizacion Firestore

#### Codigo anterior
```tsx
// Lógica inline gigante en main.tsx dentro de App()
useEffect(() => {
  if (!user) return;
  const unsubs = [];
  unsubs.push(onSnapshot(...));
  // ... (cientos de lineas)
});
```

#### Codigo nuevo
```tsx
// En main.tsx
import { useFirestoreSync } from "./hooks/use-firestore-sync";

  useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin
  });
```

#### Por que se cambio
Aislar la complejidad de Firebase en un hook custom, limpiando main.tsx y reduciendo el acoplamiento.

### Cambio 2 - Extraer pantallas de contabilidad

#### Codigo anterior
```tsx
// Múltiples bloques if (screen === ...) gigantes en main.tsx renderizando contabilidad inline
```

#### Codigo nuevo
```tsx
// Archivos nuevos creados en src/screens/
<ContabilidadScreen history={history} settings={settings} current={current} weekOverrides={weekOverrides} ... />
<DetalleSemanaScreen history={history} settings={settings} weekOverrides={weekOverrides} selectedWeekId={selectedWeekId} ... />
<LiquidacionSemanaScreen ... />
// y otros para Mes y Anual
```

#### Por que se cambio
Reducir el tamaño de main.tsx y encapsular la lógica de visualización de contabilidad en pantallas independientes.

### Cambio 3 - Documentar hooks en ESTRUCTURA.md

#### Codigo anterior
```md
| `src/logic/` | Lógica de negocio y utilidades **puras**... |
| `src/services/` | Todo lo que habla con el exterior... |
```

#### Codigo nuevo
```md
| `src/logic/` | Lógica de negocio y utilidades **puras**... |
| `src/hooks/` | Custom Hooks de React. Todo código que use estados... |
| `src/services/` | Todo lo que habla con el exterior... |
```

#### Por que se cambio
Para mantener la guía de arquitectura actualizada con la nueva carpeta introducida.

# Cambios del Agente

Este archivo registra cambios de código hechos por agentes/modelos en este proyecto.

Cada entrada debe indicar archivos modificados, código anterior, código nuevo y por qué se cambió. Las entradas se añaden al **principio** del archivo (las más recientes arriba).

## 2026-05-29 15:50 - Extraer sincronización de Firestore a useFirestoreSync

**Archivos modificados:** `src/main.tsx`, `src/hooks/use-firestore-sync.ts`

### Cambio 1 - Creación del hook useFirestoreSync

#### Código anterior
`No existía el archivo src/hooks/use-firestore-sync.ts.`

#### Código nuevo
```ts
// Se creó src/hooks/use-firestore-sync.ts conteniendo la lógica de onSnapshot y persistencia local (ver archivo para detalles completos).
```

#### Por qué se cambió
Se extrae la lógica de inicialización y suscripción a Firestore fuera de `main.tsx` para reducir su tamaño y delegar responsabilidades, de acuerdo al plan de refactorización.

### Cambio 2 - Reemplazo en App()

#### Código anterior
```ts
Código anterior no verificable: Fragmento demasiado largo de inicialización de estados (dataLoaded, etc.) y múltiples useEffects de sincronización con Firestore.
```

#### Código nuevo
```ts
  const { dataLoaded, loadTimedOut } = useFirestoreSync({
    current, setCurrent,
    settings, setSettings,
    history, setHistory,
    reservations, setReservations,
    notes, setNotes,
    weekOverrides, setWeekOverrides,
    setIsAdmin,
  });
```

#### Por qué se cambió
Simplifica `App()` delegando las llamadas de base de datos a un custom hook.

## 2026-05-29 15:34 - Mover backup-export de logic a services

**Archivos modificados:** `src/main.tsx`, `src/screens/settings-screen.tsx`, `src/services/backup-export.ts`, `src/__tests__/backup-export-extraction.test.ts`, `src/__tests__/src-reorganization.test.ts`

### Cambio 1 - Mover backup-export.ts a services

#### Código anterior
```tsx
// Ubicado en src/logic/backup-export.ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "./backup";
```

#### Código nuevo
```tsx
// Ubicado en src/services/backup-export.ts
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { buildBackupPayload } from "../logic/backup";
```

#### Por qué se cambió
La carpeta `logic/` está destinada a funciones puras. Como la exportación interactúa directamente con plugins de Capacitor (efectos secundarios del dispositivo), el archivo debe pertenecer a `services/`.

### Cambio 2 - Actualizar rutas de importación en main y settings

#### Código anterior
```tsx
// En main.tsx
import { exportBackupJSON } from "./logic/backup-export"; 

// En settings-screen.tsx
import { exportBackupJSON } from "../logic/backup-export";
```

#### Código nuevo
```tsx
// En main.tsx
import { exportBackupJSON } from "./services/backup-export"; 

// En settings-screen.tsx
import { exportBackupJSON } from "../services/backup-export";
```

#### Por qué se cambió
Adaptar los archivos importadores al nuevo destino del servicio de backup en la arquitectura.

## 2026-05-29 15:30 - Eliminar IconNoteAdd duplicado en main y consolidar en components

**Archivos modificados:** `src/main.tsx`, `src/components/summary-icons.tsx`, `src/__tests__/detailed-notes-layout.test.ts`, `src/__tests__/main-note-button.test.ts`

### Cambio 1 - Eliminar componente inline en main.tsx

#### Código anterior
```tsx
const IconNoteAdd = ({ s = 20, c = C, showPlus = true }: { s?: number; c?: string; showPlus?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
    {/* ... (rutas del icono) */}
    {!showPlus && (
      <path
        stroke={c}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.25 2.75V7.25H19.75"
        strokeWidth="1.7"
        opacity="0.9"
      />
    )}
  </svg>
);
```

#### Código nuevo
```tsx
import { IconNoteAdd } from "./components/summary-icons";
```

#### Por qué se cambió
Eliminar la definición duplicada de `IconNoteAdd` y utilizar el import existente en `src/components/summary-icons.tsx` para reducir el tamaño de `main.tsx` y mantener una única fuente de verdad para el icono.

### Cambio 2 - Completar IconNoteAdd en summary-icons

#### Código anterior
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
  </svg>
);
```

#### Código nuevo
```tsx
    <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d={showPlus ? "M7.5 20.25H2.25c-0.39782 0 -0.77936 -0.158 -1.06066 -0.4393C0.908035 19.5294 0.75 19.1478 0.75 18.75V2.25c0 -0.39782 0.158035 -0.77936 0.43934 -1.06066C1.47064 0.908035 1.85218 0.75 2.25 0.75h10.629c0.3975 0.000085 0.7788 0.157982 1.06 0.439l2.872 2.872c0.281 0.2812 0.4389 0.66245 0.439 1.06V7.5" : "M5 21.25H19c0.4142 0 0.75 -0.3358 0.75 -0.75V7.25L15.25 2.75H5c-0.4142 0 -0.75 0.3358 -0.75 0.75v17c0 0.4142 0.3358 0.75 0.75 0.75Z"} strokeWidth="1.7" style={{ filter: `drop-shadow(0 0 1px ${c})` }} />
    {!showPlus && (
      <path stroke={c} strokeLinecap="round" strokeLinejoin="round" d="M15.25 2.75V7.25H19.75" strokeWidth="1.7" opacity="0.9" />
    )}
  </svg>
);
```

#### Por qué se cambió
La versión duplicada en `main.tsx` contenía un trazo extra para el caso `!showPlus` (el clip superior del portapapeles) que faltaba en el componente compartido original. Se consolidan ambos para mantener la fidelidad visual completa.

### Cambio 3 - Actualizar tests de layouts y de botón

#### Código anterior
```tsx
    const iconNoteAddBlock = source.match(/const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];
// ...
    expect(source).toContain("const IconNoteAdd =");
```

#### Código nuevo
```tsx
    const iconNoteAddBlock = summaryIconsSource.match(/(?:export )?const IconNoteAdd = \([\s\S]*?\n\);/)?.[0];
// ...
    expect(summaryIconsSource).toContain("export const IconNoteAdd =");
```

#### Por qué se cambió
Los tests de caracterización estaban acoplados a la definición inline en `main.tsx`. Se actualizan para buscar en el origen compartido `summary-icons.tsx`.

## 2026-05-29 15:28 - Extraer entry-type-meta y remover diccionario duplicado en main

**Archivos modificados:** `src/main.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Importar centralizado en main.tsx

#### Código anterior
```tsx
type EntryTypeMeta = {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
};

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};
```

#### Código nuevo
```tsx
import { getEntryTypeMeta, ENTRY_TYPE_META, type EntryTypeMeta } from "./shared/entry-type-meta";
```

#### Por qué se cambió
Se elimina la duplicación local redundante de los tipos de entrada y funciones asociadas, importándolas de forma centralizada desde `shared/entry-type-meta.tsx` para mantener una única fuente de verdad.

### Cambio 2 - Ajustar test de extracción a shared

#### Código anterior
```tsx
  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(source).toMatch(/type EntryTypeMeta = \{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\};/);
    expect(source).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### Código nuevo
```tsx
  it("centralizes entry metadata with labels, colors and icons", () => {
    expect(entryTypeMetaSource).toMatch(/(?:type|export interface) EntryTypeMeta\s*=?\s*\{[\s\S]*?color: string;[\s\S]*?label: string;[\s\S]*?icon: \(size\?: number\) => React\.ReactNode;[\s\S]*?\}/);
    expect(entryTypeMetaSource).toMatch(/const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = \{/);
```

#### Por qué se cambió
El test de layout/extracción buscaba explícitamente en el `source` de `main.tsx`. Se actualiza para validar el origen compartido y la sintaxis `interface` usada allí.

## 2026-05-28 15:40 - Corregir consistencia de tarjetas y diccionario de tipos

**Archivos modificados:** `src/screens/detalle-mes-screen.tsx`, `src/screens/pantalla-turnos.tsx`, `src/main.tsx`

### Cambio 1 - Importar getEntryTypeMeta y remover diccionario duplicado en DetalleMesScreen

#### Código anterior
```tsx
interface EntryTypeMeta {
  color: string;
  label: string;
  icon: (size?: number) => React.ReactNode;
}

function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}

const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  datafono: { color: P, label: "Datáfono", icon: (s) => <IconCard s={s} c={P} /> },
  impuesto: { color: F, label: "Impuesto", icon: (s) => <IconFuel s={s} c={F} /> },
  agencia: { color: A, label: "Agencia", icon: (s) => <IconAgency s={s} c={A} /> },
  bonus: { color: A, label: "Bono", icon: (s) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s) => <IconNulo s={s} c={N} /> },
  明细笔记: { color: G, label: "Propina", icon: (s) => <IconCoin s={s} c={G} /> },
};
```

#### Código nuevo
```tsx
import { getEntryTypeMeta } from "../shared/entry-type-meta";
```

#### Por qué se cambió
El diccionario local contenía la clave en chino `明细笔记` en vez de `propina`, rompiendo la visualización de notas asociadas a propinas. Centralizar en la función compartida evita este error y simplifica la pantalla.

### Cambio 2 - Eliminar renderTurnoCardLocal en PantallaTurnos y usar renderTurnoCard global

#### Código anterior
```tsx
  function renderTurnoCardLocal(turno: Turno) {
    let durationStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalMins = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalMins = Math.max(0, totalMins - turno.totalPausedMinutes);
      }
      durationStr = fmtDuration(totalMins);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGanancia = calcularTurnoContable(turno, settings).miGanancia;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        {isSelectingTurnos && (
          <input
            type="checkbox"
            checked={selectedTurnosIds.includes(turno.id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              } else {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              }
            }}
            style={{ width: 20, height: 20, accentColor: "#50dc8c", cursor: "pointer" }}
          />
        )}
        <div
          onClick={() => {
            if (isSelectingTurnos) {
              if (selectedTurnosIds.includes(turno.id)) {
                setSelectedTurnosIds(selectedTurnosIds.filter(id => id !== turno.id));
              } else {
                setSelectedTurnosIds([...selectedTurnosIds, turno.id]);
              }
            } else {
              setReturnScreen("PantallaTurnos");
              setViewTurno(turno);
              setScreen("summary");
            }
          }}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.entries.length} {turno.entries.length === 1 ? "entrada" : "entradas"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, textAlign: "right" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTaxiBadgeNeon s={20} c="oklch(0.85 0.18 85)" /> {fmt(taximetroTurno)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.80 0.14 220)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconRoad s={18} c="oklch(0.80 0.14 220)" /> {fmtKm(turno.km || 0)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.78 0.18 150)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconMoneyBag s={20} c="oklch(0.78 0.18 150)" /> {fmt(miGanancia)}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "oklch(0.85 0.12 210)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <IconTimer s={18} c="oklch(0.85 0.12 210)" /> {durationStr}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
```

#### Código nuevo
```tsx
`No existía renderTurnoCardLocal en pantalla-turnos.tsx`
```

#### Por qué se cambió
Se elimina la duplicación local redundante de la tarjeta de turnos en favor de usar el renderizador global renderTurnoCard recibido a través de props, garantizando consistencia visual y de comportamiento.

### Cambio 3 - Pasar renderTurnoCard a PantallaTurnos en main.tsx

#### Código anterior
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
      />
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }
```

#### Por qué se cambió
Permite que la pantalla de turnos anteriores renderice las tarjetas mediante el componente global reutilizable, manteniendo la coherencia de estilos y bordes de estado.


## 2026-05-28 15:30 - Corregir tarjeta y navegación de detalle de semana

**Archivos modificados:** `src/main.tsx`, `src/screens/detalle-semana-screen.tsx`

### Cambio 1 - Props de DetalleSemanaScreen actualizadas

#### Código anterior
```tsx
type Props = {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
};

export function DetalleSemanaScreen({
  history,
  settings,
  weekOverrides,
  selectedWeekId,
  setSelectedWeekId,
  setScreen,
  updateWeekOverride,
}: Props) {
```

#### Código nuevo
```tsx
type Props = {
  history: Turno[];
  settings: AppSettings;
  weekOverrides: WeekOverride[];
  selectedWeekId: string;
  setSelectedWeekId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  updateWeekOverride: (weekId: string, partial: Partial<Omit<WeekOverride, "weekId">>) => void;
  setReturnScreen: (screen: string | null) => void;
  setViewTurno: (turno: Turno | null) => void;
  renderTurnoCard: (
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
      isSelecting?: boolean;
      isSelected?: boolean;
      onToggleSelect?: (checked: boolean) => void;
    }
  ) => React.ReactNode;
};

export function DetalleSemanaScreen({
  history,
  settings,
  weekOverrides,
  selectedWeekId,
  setSelectedWeekId,
  setScreen,
  updateWeekOverride,
  setReturnScreen,
  setViewTurno,
  renderTurnoCard,
}: Props) {
```

#### Por qué se cambió
Para corregir el bug de navegación y restaurar la tarjeta de turnos con los iconos del diseño original, es necesario pasar renderTurnoCard, setReturnScreen y setViewTurno como props a DetalleSemanaScreen.

### Cambio 2 - Renderizador de turno local eliminado en DetalleSemanaScreen

#### Código anterior
```tsx
  function renderTurnoCard(
    turno: Turno,
    options: {
      onClick: () => void;
      showEntriesCount?: boolean;
      showStatus?: boolean;
    }
  ) {
    let durStr = fmtDuration(0);
    if (turno.startTime && turno.endTime) {
      let totalM = getDiffMins(turno.startTime, turno.endTime);
      if (turno.totalPausedMinutes) {
        totalM = Math.max(0, totalM - turno.totalPausedMinutes);
      }
      durStr = fmtDuration(totalM);
    }
    const taximetroTurno = (turno.dinero || 0) - (turno.totalN || 0);
    const miGan = calcularTurnoContable(turno, settings).miGanancia;
    const totalEnt = calcularTurnoContable(turno, settings).totalDescontar;
    const totalDar = calcularTurnoContable(turno, settings).totalADar;
    const entregado = turno.entregada || false;

    return (
      <div key={turno.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          onClick={options.onClick}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 16,
            padding: 16,
            cursor: "pointer",
            border: options.showStatus && entregado
              ? "1px solid rgba(59, 130, 246, 0.5)"
              : "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {turno.startDate && turno.startDate !== turno.date
                ? (() => {
                  const startStr = new Date(turno.startDate + "T12:00:00").toLocaleDateString("es-ES");
                  const endStr = new Date(turno.date + "T12:00:00").toLocaleDateString("es-ES");
                  return `${startStr} ${turno.startTime} - ${endStr} ${turno.endTime}`;
                })()
                : `${turno.startTime} - ${turno.endTime}`}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: "oklch(0.85 0.18 85)", fontWeight: 700 }}>
                {fmt(taximetroTurno)}
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.80 0.14 220)", fontWeight: 700 }}>
                {fmtKmNumber(turno.km || 0)} KM
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.78 0.18 150)", fontWeight: 700 }}>
                {fmt(miGan)}
              </span>
              <span style={{ fontSize: 11, color: "oklch(0.85 0.12 210)", fontWeight: 700 }}>
                {durStr}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            {entregado && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "oklch(0.78 0.18 145)", background: "rgba(80,220,140,0.12)", padding: "2px 8px", borderRadius: 6 }}>
                ENTREGADA
              </div>
            )}
            {options.showEntriesCount && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                {(turno.entries || []).length} movimientos
              </div>
            )}
            <div style={{ fontSize: 11, color: "oklch(0.70 0.18 25)", fontWeight: 700 }}>
              -{fmt(totalEnt)}
            </div>
            <div style={{ fontSize: 11, color: "oklch(0.68 0.20 145)", fontWeight: 700 }}>
              {fmt(totalDar)}
            </div>
          </div>
        </div>
      </div>
    );
  }
```

#### Código nuevo
`El bloque renderTurnoCard fue eliminado de src/screens/detalle-semana-screen.tsx.`

#### Por qué se cambió
Se elimina la función duplicada local que causaba divergencia de diseño y no propagaba correctamente el estado de turno seleccionado a la pantalla de resumen.

### Cambio 3 - Invocación del renderizador de turnos restaurada

#### Código anterior
```tsx
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => setScreen("summary"),
                  showEntriesCount: true,
                })
              ))}
            </div>
```

#### Código nuevo
```tsx
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...turnosSemana].sort((a, b) => (getTurnoFechaEfectiva(a, settings.diaLibre) < getTurnoFechaEfectiva(b, settings.diaLibre) ? 1 : -1)).map((t) => (
                renderTurnoCard(t, {
                  onClick: () => {
                    setReturnScreen("detalleSemana");
                    setViewTurno(t);
                    setScreen("summary");
                  },
                  showEntriesCount: true,
                })
              ))}
            </div>
```

#### Por qué se cambió
Para que el click sobre un turno en el detalle semanal navegue correctamente asignando el turno a visualizar y permitiendo volver a la pantalla de detalle de semana al presionar atrás.

### Cambio 4 - Invocación de DetalleSemanaScreen adaptada en main.tsx

#### Código anterior
```tsx
  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        setScreen={setScreen}
        updateWeekOverride={updateWeekOverride}
      />
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "detalleSemana" && selectedWeekId) {
    return (
      <DetalleSemanaScreen
        history={history}
        settings={settings}
        weekOverrides={weekOverrides}
        selectedWeekId={selectedWeekId}
        setSelectedWeekId={setSelectedWeekId}
        setScreen={setScreen}
        updateWeekOverride={updateWeekOverride}
        setReturnScreen={setReturnScreen}
        setViewTurno={setViewTurno}
        renderTurnoCard={renderTurnoCard}
      />
    );
  }
```

#### Por qué se cambió
Se pasan las props setReturnScreen, setViewTurno y renderTurnoCard para corregir la navegación y la visualización de tarjetas.

## 2026-05-28 14:57 - Reorganizar main.tsx extrayendo 5 bloques inline restantes

**Archivos modificados:** `src/main.tsx`, `src/screens/contabilidad-screen.tsx`, `src/screens/detalle-semana-screen.tsx`, `src/screens/detalle-mes-screen.tsx`, `src/screens/detalle-anual-screen.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - ContabilidadScreen extraída

#### Código anterior
`No existía src/screens/contabilidad-screen.tsx.`

#### Código nuevo
```tsx
export interface ContabilidadScreenProps {
  history: Turno[];
  settings: AppSettings;
  // ... todas las props necesarias
}

export function ContabilidadScreen({ ... }: ContabilidadScreenProps) {
  // Bloque if (screen === "contabilidad") ~580 líneas
}
```

#### Por qué se cambió
Separación de responsabilidades: el bloque de contabilidad (~580 líneas) se extrae a su propio componente. main.tsx pasa de 3909 a ~2770 líneas. La pantalla usa módulos compartidos (week-logic, accounting, formatters, entry-icons, summary-icons, calendar-icons, shell).

### Cambio 2 - DetalleSemanaScreen extraída

#### Código anterior
`No existía src/screens/detalle-semana-screen.tsx.`

#### Código nuevo
```tsx
export function DetalleSemanaScreen({
  history, settings, weekOverrides, selectedWeekId,
  setSelectedWeekId, setScreen, updateWeekOverride,
}: Props) {
  // Bloque if (screen === "detalleSemana" && selectedWeekId)
}
```

#### Por qué se cambió
El bloque de detalle de semana (turnos de una semana, con cálculo de totales, marca de entregada, notas) se extrae como componente independiente. Props: `history: Turno[]` (no `CurrentState`).

### Cambio 3 - DetalleMesScreen extraída

#### Código anterior
`No existía src/screens/detalle-mes-screen.tsx.`

#### Código nuevo
```tsx
export function DetalleMesScreen({
  history, settings, selectedAccountingYear, selectedAccountingMonth,
  setSelectedAccountingYear, setSelectedAccountingMonth, setScreen,
}: Props) {
  // Bloque if (screen === "detalleMes")
}
```

#### Por qué se cambió
El bloque de detalle mensual (resumen de mes con breakdown por categorías) se extrae. Import corregido: `calcularResumenContableTurnos` viene de `../logic/accounting` (no de `../logic/turnos`).

### Cambio 4 - DetalleAnualScreen extraída

#### Código anterior
`No existía src/screens/detalle-anual-screen.tsx.`

#### Código nuevo
```tsx
export function DetalleAnualScreen({
  history, settings, selectedAccountingYear, setSelectedAccountingYear,
  selectedAccountingMonth, setSelectedAccountingMonth, setScreen,
}: Props) {
  // Bloque if (screen === "detalleAnual")
}
```

#### Por qué se cambió
El bloque de resumen anual (todos los meses del año con sus totales) se extrae como componente independiente.

### Cambio 5 - Iconos compartidos corregidos en pantallas extraídas

#### Código anterior
```tsx
// contabilidad-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer } from "../components/entry-icons";
```

```tsx
// detalle-anual-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer } from "../components/summary-icons";
```

```tsx
// detalle-semana-screen.tsx (incorrecto)
import { IconTaxiBadgeNeon, IconRoad, IconMoneyBag, IconTimer, IconReceipt, IconGive } from "../components/summary-icons";
```

#### Código nuevo
```tsx
// contabilidad-screen.tsx
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";

// detalle-anual-screen.tsx
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";

// detalle-semana-screen.tsx
import { IconTaxiBadgeNeon, IconRoad, IconGive } from "../components/summary-icons";
import { IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { IconReceipt } from "../components/settings-icons";
```

#### Por qué se cambió
Cada icono vive en su módulo correcto: IconMoneyBag e IconTimer están en calendar-icons, IconReceipt en settings-icons, IconTaxiBadgeNeon/IconRoad/IconGive en summary-icons. Las pantallas extraídas tenían los imports incorrectos.

### Cambio 6 - Tipos corregidos en pantallas extraídas

#### Código anterior
```tsx
// detalle-semana-screen.tsx
import type { Turno, WeekOverride, AppSettings, CurrentState } from "../shared/types";
type Props = { history: CurrentState; ... };

// liquidacion-semana-screen.tsx
import type { AppSettings, CurrentState, Turno, WeekOverride } from "../shared/types";
type Props = { history: CurrentState; ... };
```

#### Código nuevo
```tsx
// detalle-semana-screen.tsx
import type { Turno, WeekOverride, AppSettings } from "../shared/types";
type Props = { history: Turno[]; ... };

// liquidacion-semana-screen.tsx
import type { AppSettings, Turno, WeekOverride } from "../shared/types";
type Props = { history: Turno[]; ... };
```

#### Por qué se cambió
`CurrentState` tiene campos `startTime` y `startDate` que `Turno[]` no tiene. El tipo correcto para `history` en estas pantallas es `Turno[]`, no `CurrentState`.

### Cambio 7 - Props corregidas en liquidacionSemanaScreen

#### Código anterior
```tsx
type Props = {
  history: CurrentState;
  settings: AppSettings;
  // ...
};

export function LiquidacionSemanaScreen({
  history, settings, selectedWeekId, setScreen,
}: Props) {
  //faltaban weekOverrides, setSelectedWeekId, updateWeekOverride
```

#### Código nuevo
```tsx
export function LiquidacionSemanaScreen({
  history, settings, weekOverrides, selectedWeekId,
  setSelectedWeekId, setScreen, updateWeekOverride,
}: Props) {
```

#### Por qué se cambió
La pantalla de liquidación necesita `weekOverrides`, `setSelectedWeekId` e `updateWeekOverride` que antes no se pasaban correctamente.

## 2026-05-28 14:44 - Extraer bloque liquidacionSemana a componente separado

**Archivos modificados:** `src/main.tsx`, `src/screens/liquidacion-semana-screen.tsx`, `src/__tests__/liquidacion-semana.test.ts`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Extraer bloque liquidacionSemana

#### Código anterior
```ts
if (screen === "liquidacionSemana" && selectedWeekId) {
  const weekId = selectedWeekId;
  const grupos = groupTurnosByWeek(history, settings.diaLibre);
  const turnosSemana = grupos.get(weekId) || [];
  // ... (~580 líneas de código JSX)
}
```

#### Código nuevo
```tsx
if (screen === "liquidacionSemana" && selectedWeekId) {
  return (
    <LiquidacionSemanaScreen
      history={history}
      settings={settings}
      weekOverrides={weekOverrides}
      selectedWeekId={selectedWeekId}
      setSelectedWeekId={setSelectedWeekId}
      setScreen={setScreen}
      updateWeekOverride={updateWeekOverride}
    />
  );
}
```

#### Por qué se cambió
El bloque `liquidacionSemana` de ~600 líneas contenía lógica de presentación que no dependía del estado local de `App`. Extraerlo a su propio componente permite mejor organización del código, reutilización y mantenimiento.

### Cambio 2 - Tests actualizados para buscar en nuevo archivo

#### Código anterior
```ts
const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");
```

#### Código nuevo
```ts
const mainSource = readFileSync(resolve("src/main.tsx"), "utf8");
const detalleSemanaSource = readFileSync(resolve("src/screens/detalle-semana-screen.tsx"), "utf8");
const liquidacionSemanaSource = readFileSync(resolve("src/screens/liquidacion-semana-screen.tsx"), "utf8");
const themeSource = readFileSync(resolve("src/shared/ui-theme.ts"), "utf8");
```

#### Por qué se cambió
Los tests que verificaban el código del bloque `liquidacionSemana` ahora deben buscar en el nuevo archivo `liquidacion-semana-screen.tsx` en lugar de `main.tsx`.

## 2026-05-26 23:48 - Corregir organizacion del recorte

**Archivos modificados:** `src/__tests__/main-antiguo-regressions.test.ts`, `src/main.tsx`, `src/screens/add-entry-screen.tsx`, `src/screens/add-nota-general-screen.tsx`, `src/screens/add-single-entry-screen.tsx`, `src/screens/calendar-screen.tsx`, `src/screens/confirm-end-screen.tsx`, `src/screens/today-history-screen.tsx`

### Cambio 1 - Tests de paridad del recorte

#### Codigo anterior
```ts
expect(openNewNotaBlock).toContain("setEditingReserva(null);");

expect(calendarSource).toContain('onClick={() => setScreen("home")}');
expect(calendarSource).toContain('setReturnScreen("calendar");');
expect(calendarSource).toContain("setViewTurno(turno);");
expect(calendarSource).toContain('setScreen("summary");');

expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
expect(source).toContain('confirmColor: "#ff6b6b"');
```

#### Codigo nuevo
```ts
expect(openNewNotaBlock).not.toContain("setEditingReserva(null);");

expect(calendarSource).toContain('onClick={() => setScreen("home")}');
expect(calendarSource).toContain('setReturnScreen("calendar");');
expect(calendarSource).toContain("setViewTurno(turno);");
expect(calendarSource).toContain('setScreen("summary");');
expect(calendarSource).toContain("style={iconBtnStyle}");
expect(calendarSource).toContain("setShowMonthPicker(v => !v);");

expect(calendarSource).toContain("renderReservaDialog: () => React.ReactElement | false;");
expect(calendarSource).toContain("{renderReservaDialog()}");
expect(calendarSource).not.toContain("function renderReservaDialog(");
expect(calendarSource).not.toContain(">Cancel<");
expect(calendarSource).not.toContain('{editingReserva ? "Actualizar" : "Reservar"}');
expect(mainSource).toContain("renderReservaDialog={renderReservaDialog}");

expect(source).not.toContain("confirmBg:");
expect(source).not.toContain("confirmColor:");
expect(source).not.toContain("confirmBorder:");
```

#### Por que se cambio
Los tests bloquean que futuras extracciones vuelvan a duplicar el modal de reservas, cambien el boton de calendario, usen el toggle con estado potencialmente obsoleto o alteren la confirmacion de borrado respecto al comportamiento anterior.

### Cambio 2 - Modal de reservas unico en calendario

#### Codigo anterior
```tsx
showReservaDialog: boolean;
setShowReservaDialog: (v: boolean) => void;
reservaTime: string;
setReservaTime: (t: string) => void;
reservaOrigen: string;
setReservaOrigen: (o: string) => void;
reservaDestino: string;
setReservaDestino: (d: string) => void;
reservaCliente: string;
setReservaCliente: (c: string) => void;
reservaTelefono: string;
setReservaTelefono: (t: string) => void;
reservaNotas: string;
setReservaNotas: (n: string) => void;
editingReserva: Reserva | null;
setEditingReserva: (r: Reserva | null) => void;
reservations: Reserva[];
setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void;
```

#### Codigo nuevo
```tsx
setShowReservaDialog: (v: boolean) => void;
setReservaTime: (t: string) => void;
setReservaOrigen: (o: string) => void;
setReservaDestino: (d: string) => void;
setReservaCliente: (c: string) => void;
setReservaTelefono: (t: string) => void;
setReservaNotas: (n: string) => void;
setEditingReserva: (r: Reserva | null) => void;
reservations: Reserva[];
renderReservaDialog: () => React.ReactElement | false;
```

#### Por que se cambio
La pantalla de calendario no debe tener una copia propia del formulario de reserva. Ahora recibe el renderizador central desde `src/main.tsx`, conserva solo el estado necesario para abrir o editar reservas y evita divergencias de textos, estilos y logica.

### Cambio 3 - Navegacion y estado del calendario

#### Codigo anterior
```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
setShowMonthPicker(!showMonthPicker);
```

```tsx
{renderReservaDialog(
  showReservaDialog,
  reservaTime,
  setReservaTime,
  reservaOrigen,
  setReservaOrigen,
  reservaDestino,
  setReservaDestino,
  reservaCliente,
  setReservaCliente,
  reservaTelefono,
  setReservaTelefono,
  reservaNotas,
  setReservaNotas,
  selectedDate,
  setSelectedDate,
  editingReserva,
  setEditingReserva,
  setConfirmDialog,
  reservations,
  setReservations,
  setShowReservaDialog
)}
```

#### Codigo nuevo
```tsx
<button style={iconBtnStyle} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
setShowMonthPicker(v => !v);
```

```tsx
{renderReservaDialog()}
```

#### Por que se cambio
El boton de volver recupera el estilo compartido de la pantalla antigua, el selector de mes usa una actualizacion funcional segura y el calendario deja de pasar todo el estado de reserva a una copia local del modal.

### Cambio 4 - Iconos compartidos en pantallas extraidas

#### Codigo anterior
```tsx
const IconBack: FC = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M14 18L7 11L14 4"
      stroke="rgba(255,255,255,0.65)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDel: FC = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <path
      d="M7 2H18C18.55 2 19 2.45 19 3V13C19 13.55 18.55 14 18 14H7L1 8L7 2Z"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      fill="none"
    />
    <path
      d="M9.5 5.5L14.5 10.5M14.5 5.5L9.5 10.5"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);
```

#### Codigo nuevo
```tsx
import { IconBack, IconDel } from "../components/navigation-icons";
```

```tsx
import { IconBack } from "../components/navigation-icons";
```

#### Por que se cambio
`add-entry-screen.tsx`, `add-single-entry-screen.tsx` y `add-nota-general-screen.tsx` usaban copias locales de iconos ya extraidos. Ahora consumen los iconos compartidos para que la organizacion por componentes sea coherente.

### Cambio 5 - Estilo de kilometros compartido

#### Codigo anterior
```tsx
const KM_CARD_UNIT_STYLE = {
  fontSize: "0.72em",
  fontWeight: 900,
  letterSpacing: "normal",
} as const;
```

#### Codigo nuevo
```tsx
import { KM_CARD_UNIT_STYLE } from "../shared/card-styles";
```

#### Por que se cambio
`confirm-end-screen.tsx` tenia una copia local del estilo de unidad de kilometros aunque ya existe en `src/shared/card-styles.ts`. Usar el valor compartido evita divergencias visuales en futuras fases.

### Cambio 6 - Confirmacion de borrado en historial

#### Codigo anterior
```tsx
setConfirmDialog({
  text: "¿Seguro que quieres eliminar esta entrada?",
  onConfirm: deleteEditEntry,
  confirmBg: "rgba(255,60,60,0.2)",
  confirmColor: "#ff6b6b",
  confirmBorder: "1px solid rgba(255,100,100,0.35)",
});
```

#### Codigo nuevo
```tsx
setConfirmDialog({
  text: "¿Seguro que quieres eliminar esta entrada?",
  onConfirm: deleteEditEntry,
});
```

#### Por que se cambio
La extraccion habia anadido estilo destructivo especifico en el historial de hoy. Se retiro para mantener el comportamiento y aspecto previos del dialogo compartido.

## 2026-05-26 23:19 - Corregir regresiones del recorte

**Archivos modificados:** `src/__tests__/main-antiguo-regressions.test.ts`, `src/__tests__/home-icons.test.ts`, `src/components/home-icons.tsx`, `src/main.tsx`, `src/screens/calendar-screen.tsx`, `src/screens/confirm-end-screen.tsx`, `src/screens/home-screen.tsx`, `src/screens/pantalla-turnos.tsx`, `src/screens/today-history-screen.tsx`

### Cambio 1 - Test de regresiones contra main antiguo

#### Código anterior
`No existía src/__tests__/main-antiguo-regressions.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(resolve(path), "utf8");

describe("Main antiguo regression locks", () => {
  it("keeps home logout confirmation mounted in the extracted screen", () => {
    const homeSource = readSource("src/screens/home-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    expect(homeSource).toContain('import { ConfirmDialog } from "../components/common"');
    expect(homeSource).toContain("confirmDialog,");
    expect(homeSource).toContain("{confirmDialog && <ConfirmDialog");
    expect(homeSource).toContain("onCancel={() => onSetConfirmDialog(null)}");
    expect(mainSource).toContain("confirmDialog={confirmDialog}");
  });

  it("keeps calendar navigation and note creation handlers from mainAntiguo", () => {
    const calendarSource = readSource("src/screens/calendar-screen.tsx");
    const mainSource = readSource("src/main.tsx");

    const openNewNotaBlock = calendarSource.match(/const openNewNota = \(date\?: string\) => \{[\s\S]*?\n  \};/)?.[0] ?? "";
    expect(openNewNotaBlock).toContain("setEditingNota(null);");
    expect(openNewNotaBlock).toContain("setEditingReserva(null);");

    expect(calendarSource).toContain('onClick={() => setScreen("home")}');
    expect(calendarSource).toContain('setReturnScreen("calendar");');
    expect(calendarSource).toContain("setViewTurno(turno);");
    expect(calendarSource).toContain('setScreen("summary");');

    expect(mainSource).toContain("setScreen={setScreen}");
    expect(mainSource).toContain("setReturnScreen={setReturnScreen}");
    expect(mainSource).toContain("setViewTurno={setViewTurno}");
  });

  it("keeps today history note metadata and destructive confirmation behavior", () => {
    const source = readSource("src/screens/today-history-screen.tsx");

    expect(source).toContain('import { ConfirmDialog } from "../components/common"');
    expect(source).toContain('import { getEntryTypeMeta } from "../shared/entry-type-meta"');
    expect(source).not.toContain('nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard');
    expect(source).toContain("{confirmDialog && <ConfirmDialog");
    expect(source).toContain('confirmBg: "rgba(255,60,60,0.2)"');
    expect(source).toContain('confirmColor: "#ff6b6b"');
  });

  it("keeps turnos dates formatted for display", () => {
    const source = readSource("src/screens/pantalla-turnos.tsx");

    expect(source).toContain('from "../logic/date-time"');
    expect(source).toContain("fmtDate");
    expect(source).toContain("{fmtDate(turno.startDate || turno.date)}");
  });

  it("keeps detailed notes outside the summary card on confirm end", () => {
    const source = readSource("src/screens/confirm-end-screen.tsx");

    expect(source).toContain('style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}');
    expect(source).toContain('background: "rgba(255,255,255,0.03)"');
    expect(source).toContain('color: "rgba(255,255,255,0.8)"');
  });
});
```

#### Por qué se cambió
La auditoría detectó regresiones funcionales y visuales introducidas al extraer pantallas. Se añadió un test de bloqueo para contrastar esos contratos con el comportamiento anterior.

### Cambio 2 - Cobertura de iconos de inicio

#### Código anterior
```ts
  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
```

#### Código nuevo
```ts
  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M10 16 C10 19 12 21 12 21 C12 21 14 19 14 16");
    expect(source).toContain("M12 23 L12 26");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });

  it("keeps the original home quick action icons", () => {
    expect(source).toContain('import { IconPencilNeon } from "./calendar-icons"');
    expect(source).toContain("M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z");
    expect(source).toContain("<IconPencilNeon s={24} />");
    expect(source).toContain('transform: "scale(0.58) rotate(-6deg)"');
    expect(source).toContain("M10 9H17");
    expect(source).toContain("M9 4H7C5.89543 4 5 4.89543 5 6V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V6C19 4.89543 18.1046 4 17 4H15");
    expect(source).toContain("M2 22H22");
    expect(source).toContain("M8 5.5L18.5 12L8 18.5V5.5Z");
  });
```

#### Por qué se cambió
El test anterior solo protegía parte del cohete. Se amplió para cubrir los trazos que faltaban y los iconos rápidos de inicio que habían cambiado durante la extracción.

### Cambio 3 - Iconos de inicio restaurados

#### Código anterior
```tsx
export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2.5" stroke={c} strokeWidth="1.8" />
    <path d="M12 8V16M8 12H16" stroke={c} strokeWidth="2" strokeLinecap="round" />
  </svg>
);
```

#### Código nuevo
```tsx
export const IconReservaWrite: FC<{ s?: number; c?: string }> = ({ s = 24, c = C }: { s?: number; c?: string }) => (
  <span
    style={{
      position: "relative",
      width: s,
      height: s,
      display: "inline-block",
      verticalAlign: "middle",
    }}
  >
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
      }}
    >
      <path
        d="M6.5 3.5H14.8L18.5 7.2V19.5C18.5 20.05 18.05 20.5 17.5 20.5H6.5C5.95 20.5 5.5 20.05 5.5 19.5V4.5C5.5 3.95 5.95 3.5 6.5 3.5Z"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        style={{
          filter:
            "drop-shadow(0 0 1px rgba(190,140,255,0.55)) drop-shadow(0 0 3px rgba(190,140,255,0.20))",
        }}
      />
      <path
        d="M14.8 3.5V7.2H18.5"
        stroke={c}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M8 10H14.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <path d="M8 13H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      <path d="M8 16H11.5" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>

    <span
      style={{
        position: "absolute",
        right: -2,
        bottom: -1,
        transform: "scale(0.58) rotate(-6deg)",
        transformOrigin: "bottom right",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <IconPencilNeon s={24} />
    </span>
  </span>
);
```

#### Por qué se cambió
El icono de nueva reserva había quedado reducido a un símbolo genérico de suma. Se restauró el documento con lápiz que identificaba visualmente la acción.

### Cambio 4 - Confirmación de cerrar sesión en inicio

#### Código anterior
```tsx
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  renderReservaDialog: () => React.ReactElement | false;
}
```

```tsx
      />
    );
```

#### Código nuevo
```tsx
  onSetConfirmDialog: (dialog: { text: string; confirmText?: string; onConfirm: () => void } | null) => void;
  confirmDialog: { text: string; confirmText?: string; onConfirm: () => void } | null;
  renderReservaDialog: () => React.ReactElement | false;
}
```

```tsx
        confirmDialog={confirmDialog}
      />
```

```tsx
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => onSetConfirmDialog(null)} />}
    );
```

#### Por qué se cambió
La pantalla de inicio podía crear el diálogo de cerrar sesión, pero el componente extraído no lo recibía ni lo renderizaba. Se volvió a montar la confirmación como en el bloque antiguo.

### Cambio 5 - Navegación del calendario

#### Código anterior
```tsx
  openNewReserva: (date?: string) => void;
}
```

```tsx
  const openNewNota = (date?: string) => {
    setEditingReserva(null);
    setSelectedDate(date || today());
```

```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => openNewReserva()}><IconBack /></button>
```

```tsx
onClick={() => { openNewReserva(); }}
```

#### Código nuevo
```tsx
  openNewReserva: (date?: string) => void;
  setScreen: (screen: string) => void;
  setViewTurno: (turno: Turno) => void;
  setReturnScreen: (screen: string | null) => void;
}
```

```tsx
  const openNewNota = (date?: string) => {
    setEditingNota(null);
    setEditingReserva(null);
    setSelectedDate(date || today());
```

```tsx
<button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", alignItems: "center" }} onClick={() => setScreen("home")}><IconBack /></button>
```

```tsx
onClick={() => { setReturnScreen("calendar"); setViewTurno(turno); setScreen("summary"); }}
```

#### Por qué se cambió
El botón de volver y las tarjetas de turnos cerrados habían quedado conectados a nueva reserva. También faltaba limpiar `editingNota` al crear una nota nueva. Se restauraron los handlers anteriores.

### Cambio 6 - Historial de hoy

#### Código anterior
```tsx
const ENTRY_TYPE_META: Record<string, { color: string; label: string; icon: (s?: number) => React.ReactNode }> = {
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconCard s={s} c="white" /> },
};
```

```tsx
      {confirmDialog && <ConfirmDialogWrapper {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
```

```tsx
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
            });
```

#### Código nuevo
```tsx
import { ConfirmDialog } from "../components/common";
import { getEntryTypeMeta } from "../shared/entry-type-meta";
```

```tsx
      {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
```

```tsx
            setConfirmDialog({
              text: "¿Seguro que quieres eliminar esta entrada?",
              onConfirm: deleteEditEntry,
              confirmBg: "rgba(255,60,60,0.2)",
              confirmColor: "#ff6b6b",
              confirmBorder: "1px solid rgba(255,100,100,0.35)",
            });
```

#### Por qué se cambió
La pantalla tenía metadata local distinta para notas y un diálogo propio que no cerraba al confirmar. Se reutilizó la metadata compartida y el diálogo común, que ejecuta confirmación y cierre.

### Cambio 7 - Fecha formateada en turnos

#### Código anterior
```tsx
import { getDiffMins } from "../logic/date-time";
```

```tsx
<div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{turno.startDate || turno.date}</div>
```

#### Código nuevo
```tsx
import { getDiffMins, fmtDate } from "../logic/date-time";
```

```tsx
<div style={{ fontWeight: 700, color: "white", fontSize: 16 }}>{fmtDate(turno.startDate || turno.date)}</div>
```

#### Por qué se cambió
Las tarjetas de turnos mostraban la fecha ISO tras la extracción. Se restauró el formato legible usado antes.

### Cambio 8 - Notas detalladas al terminar turno

#### Código anterior
```tsx
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
```

#### Código nuevo
```tsx
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                <IconPinNeon s={18} /> Notas detalladas
              </div>
              {entriesWithNotes.map(e => {
```

#### Por qué se cambió
Las notas detalladas habían quedado integradas dentro del bloque de resumen. Se restauró su estructura visual independiente para que coincida con la jerarquía anterior.

## 2026-05-26 18:00 - Restaurar icono de cohete en inicio

**Archivos modificados:** `src/components/home-icons.tsx`, `src/__tests__/home-icons.test.ts`

### Cambio 1 - Test del icono de cohete

#### Código anterior
`No existía src/__tests__/home-icons.test.ts.`

#### Código nuevo
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Home icon extraction", () => {
  const source = readFileSync(resolve("src/components/home-icons.tsx"), "utf8");

  it("keeps the original rocket icon shape", () => {
    expect(source).toContain('transform="rotate(45 12 12)"');
    expect(source).toContain("M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z");
    expect(source).toContain("M8 22 L8 25");
    expect(source).toContain("M16 22 L16 25");
    expect(source).toContain('verticalAlign: "middle"');
  });
});
```

#### Por qué se cambió
Se añadió una comprobación fija para que el icono de cohete extraído mantenga la forma original que tenía en `main.tsx` antes del recorte.

### Cambio 2 - SVG del cohete

#### Código anterior
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4.5 16.5C4.5 16.5 6 12 12 6C12 6 12 12 16.5 13.5M16.5 13.5L19.5 15M19.5 15L22 17M19.5 15C19.5 15 20 17 18 19C16 21 14 19.5 14 19.5M14 19.5L9 14.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
```

#### Código nuevo
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 12 12)">
      <path d="M12 2 C16 3 17 9 16 14 L8 14 C7 9 8 3 12 2 Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 5 Q12 6 14.5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" stroke={c} strokeWidth="1.8" />
      <path d="M8 11 C5 11 4 14 4 16 C6 16 8 14 8 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 11 C19 11 20 14 20 16 C18 16 16 14 16 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 14 L9 16 C11 16.5 13 16.5 15 16 L14 14" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 22 L8 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 22 L16 25" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  </svg>
);
```

#### Por qué se cambió
El recorte había sustituido el cohete original por un trazo simplificado que se veía deformado en la pantalla de inicio. Se restauró el SVG original sin cambiar el comportamiento del botón.

## 2026-05-26 16:39 - Corregir notas detalladas al cerrar turno

**Archivos modificados:** `src/screens/confirm-end-screen.tsx`, `src/shared/entry-type-meta.tsx`, `src/__tests__/detailed-notes-layout.test.ts`

### Cambio 1 - Metadata completa de tipos de entrada

#### Código anterior
```tsx
import { G, P, A, E, F, N } from "./ui-theme";
import { IconAgency } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";

export const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
};

export function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.agencia_bono;
}
```

#### Código nuevo
```tsx
import { G, P, A, E, F, N } from "./ui-theme";
import { IconCoin, IconCard, IconAgency, IconExtra, IconFuel, IconNulo } from "../components/entry-icons";
import { IconNoteAdd } from "../components/summary-icons";

export const ENTRY_TYPE_META: Record<string, EntryTypeMeta> = {
  propina: { color: G, label: "Propina", icon: (s = 17) => <IconCoin s={s} c={G} /> },
  datafono: { color: P, label: "Datáfono", icon: (s = 17) => <IconCard s={s} c={P} /> },
  agencia_bono: { color: A, label: "Agencia/Bono", icon: (s = 17) => <IconAgency s={s} c={A} /> },
  extra: { color: E, label: "Extra", icon: (s = 17) => <IconExtra s={s} c={E} /> },
  gasolina: { color: F, label: "Gasolina", icon: (s = 17) => <IconFuel s={s} c={F} /> },
  nulo: { color: N, label: "Nulo", icon: (s = 17) => <IconNulo s={s} c={N} /> },
  nota: { color: "white", label: "Nota", icon: (s = 17) => <IconNoteAdd s={s} showPlus={false} /> },
};

export function getEntryTypeMeta(type: string): EntryTypeMeta {
  return ENTRY_TYPE_META[type] || ENTRY_TYPE_META.nulo;
}
```

#### Por qué se cambió
`ConfirmEndScreen` usaba esta metadata compartida para mostrar notas, pero el mapa solo contenía `agencia_bono` y cualquier otro tipo se etiquetaba como Agencia/Bono. Se restauró el mapa completo equivalente al comportamiento anterior de `main.tsx`.

### Cambio 2 - Notas detalladas en ConfirmEndScreen

#### Código anterior
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
```

```tsx
          {(() => {
            const gNotes = current.entries.filter(e => e.type === "nota");
            if (gNotes.length > 0) {
              return (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <IconNoteAdd s={17} showPlus={false} /> Notas del Turno
                  </div>
```

#### Código nuevo
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad, IconPinNeon } from "../components/summary-icons";
```

```tsx
          {(() => {
            const entriesWithNotes = current.entries.filter(e => e.type !== "nota" && e.note && e.note.trim());
            if (entriesWithNotes.length === 0) return null;
            return (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                  <IconPinNeon s={18} /> Notas detalladas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {entriesWithNotes.map(e => {
                    const meta = getEntryTypeMeta(e.type);
                    return (
                      <div key={e.id} style={{ fontSize: 13, background: "rgba(255,255,255,0.02)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", display: "grid", gridTemplateColumns: "auto auto minmax(0, 1fr) auto", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                        <span style={NOTE_TIME_STYLE}>{e.time}</span>
                        <span style={{ fontWeight: 700, color: meta.color, fontSize: 14, whiteSpace: "nowrap", flexShrink: 0 }}>{meta.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 1.35, minWidth: 0, overflowWrap: "anywhere" }}>{e.note}</span>
                        <span style={{ color: meta.color, fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{fmt(e.amount)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
```

#### Por qué se cambió
La extracción de `confirm-end-screen.tsx` había perdido la sección de notas detalladas para entradas con nota que no son de tipo `nota`. Se restauró esa sección siguiendo el `mainAntiguo.tsx` para que cerrar turno vuelva a mostrar notas de datáfono, propina, agencia, extras, gasolina y nulos.

### Cambio 3 - Test de layout adaptado a archivos extraídos

#### Código anterior
```ts
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

```ts
    const detailedRows = [
      /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/,
      /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/,
    ];

    for (const rowPattern of detailedRows) {
      const block = source.match(rowPattern)?.[0];
```

#### Código nuevo
```ts
  const confirmEndSource = readFileSync(resolve("src/screens/confirm-end-screen.tsx"), "utf8");
  const entryTypeMetaSource = readFileSync(resolve("src/shared/entry-type-meta.tsx"), "utf8");
  const turnoNotasSource = readFileSync(resolve("src/components/turno-notas.tsx"), "utf8");
```

```ts
    const detailedRows = [
      { source, pattern: /entriesWithNotes\.map\(\(e: any\) => \{[\s\S]*?<\/div>\s*\);\s*\}\)/ },
      { source: confirmEndSource, pattern: /entriesWithNotes\.map\(e => \{[\s\S]*?<\/div>\s*\);\s*\}\)/ },
      { source, pattern: /notasDetalladas\.map\(\(entry\) => \{[\s\S]*?key=\{`ticket-nota-detallada-\$\{entry\.id\}`\}[\s\S]*?<\/div>\s*\);\s*\}\)/ },
    ];

    for (const { source: rowSource, pattern } of detailedRows) {
      const block = rowSource.match(pattern)?.[0];
```

#### Por qué se cambió
El test seguía buscando todos los bloques en `main.tsx`, aunque parte del código ahora vive en `confirm-end-screen.tsx` y la metadata compartida vive en `entry-type-meta.tsx`. Se adaptó la fuente inspeccionada sin cambiar la expectativa funcional.

## 2026-05-26 04:30 - Integrar pantallas extraídas en main.tsx

**Archivos modificados:** `src/main.tsx`, `src/screens/PantallaTurnos.tsx`

### Cambio 1 - Imports de pantallas en main.tsx

#### Código anterior
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";
import { Shell } from "./components/shell";
```

#### Código nuevo
```tsx
import { AddEntryScreen } from "./screens/add-entry-screen";
import { PantallaTurnos } from "./screens/PantallaTurnos";
import { TodayHistoryScreen } from "./screens/TodayHistoryScreen";
import { ConfirmEndScreen } from "./screens/ConfirmEndScreen";
import { Shell } from "./components/shell";
```

#### Por qué se cambió
Las pantallas extraídas en sesiones anteriores necesitaban ser importadas para su uso.

### Cambio 2 - Reemplazar bloque if PantallaTurnos con componente

#### Código anterior
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        </div>
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "PantallaTurnos") {
    return (
      <PantallaTurnos
        history={history}
        settings={settings}
        isSelectingTurnos={isSelectingTurnos}
        setIsSelectingTurnos={setIsSelectingTurnos}
        selectedTurnosIds={selectedTurnosIds}
        setSelectedTurnosIds={setSelectedTurnosIds}
        setScreen={setScreen}
        setViewTurno={setViewTurno}
        setReturnScreen={setReturnScreen}
        onExportSelectedTurnosJSON={exportSelectedTurnosJSON}
      />
    );
  }
```

#### Por qué se cambió
Separación de responsabilidades: el bloque if de PantallaTurnos ahora usa el componente extraído.

### Cambio 3 - Reemplazar bloque if todayHistory con componente

#### Código anterior
```tsx
  if (screen === "todayHistory") {
    return (
      <Shell burst={false}>
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
        </div>
        {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
        {editEntry && (<EditEntryDialog />)}
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "todayHistory") {
    return (
      <TodayHistoryScreen
        current={current}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        editEntry={editEntry}
        editEntryAmount={editEntryAmount}
        editEntryNote={editEntryNote}
        setEditEntryAmount={setEditEntryAmount}
        setEditEntryNote={setEditEntryNote}
        openEditEntry={openEditEntry}
        saveEditEntry={saveEditEntry}
        deleteEditEntry={deleteEditEntry}
        setEditEntry={setEditEntry}
        setScreen={setScreen}
      />
    );
  }
```

#### Por qué se cambió
Separación de responsabilidades: el bloque if de todayHistory ahora usa el componente extraído.

### Cambio 4 - Reemplazar bloque if confirmEnd con componente

#### Código anterior
```tsx
  if (screen === "confirmEnd") {
    function kpEnd(v: string) { }
    return (
      <Shell burst={false}>
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "confirmEnd") {
    return (
      <ConfirmEndScreen
        current={current}
        dineroJ={dineroJ}
        setDineroJ={setDineroJ}
        kmJ={kmJ}
        setKmJ={setKmJ}
        endField={endField}
        setEndField={setEndField}
        totalP={totalP}
        totalD={totalD}
        totalA={totalA}
        totalE={totalE}
        totalF={totalF}
        totalN={totalN}
        propinas={propinas}
        datafonos={datafonos}
        agencias={agencias}
        extras={extras}
        gasolinas={gasolinas}
        nulos={nulos}
        onEndTurno={handleEndTurno}
        setScreen={setScreen}
      />
    );
  }
```

#### Por qué se cambió
Separación de responsabilidades: el bloque if de confirmEnd ahora usa el componente extraído con kpEnd inlined.

### Cambio 5 - Import de IconTaxiBadgeNeon e IconRoad corregido

#### Código anterior
```tsx
import { IconPencilNeon, IconTimer, IconMoneyBag, IconTaxiBadgeNeon, IconRoad } from "../components/calendar-icons";
```

#### Código nuevo
```tsx
import { IconPencilNeon, IconTimer, IconMoneyBag } from "../components/calendar-icons";
import { IconTaxiBadgeNeon, IconRoad } from "../components/summary-icons";
```

#### Por qué se cambió
IconTaxiBadgeNeon e IconRoad estaban mal importados desde calendar-icons, deben estar en summary-icons.

## 2026-05-26 03:15 - Extraer SettingsScreen a src/screens/settings-screen.tsx

**Archivos modificados:** `src/screens/settings-screen.tsx`, `src/components/settings-icons.tsx`, `src/components/summary-icons.tsx`, `src/main.tsx`

### Cambio 1 - Pantalla de ajustes extraída

#### Código anterior
`No existía src/screens/settings-screen.tsx.`

#### Código nuevo
```tsx
export const SettingsScreen: FC<SettingsScreenProps> = ({
  isAdmin, settings, setSettings, history, setHistory, current,
  weekOverrides, reservations, notes, activeSettingsField,
  setActiveSettingsField, settingsValStr, setSettingsValStr,
  showBackupMenu, setShowBackupMenu, confirmDialog, setConfirmDialog,
  updateState, updateMsg, downloadUrl, releaseUrl,
  setUpdateState, setUpdateMsg, setDownloadUrl, setReleaseUrl,
  onSetScreen,
}) => { ... }
```

#### Por qué se cambió
Separación de responsabilidades: la pantalla de ajustes ahora está en su propio archivo.

### Cambio 2 - Iconos de ajustes centralizados

#### Código anterior
`No existía src/components/settings-icons.tsx.`

#### Código nuevo
```tsx
export const IconReceipt = ({ s = 24, c = "white" }: { s?: number; c?: string }) => ( ... );
export const IconHoliday = ({ s = 24, c = "oklch(0.85 0.18 85)" }: { s?: number; c?: string }) => ( ... );
```

#### Por qué se cambió
IconReceipt e IconHoliday se usan en SettingsScreen y se extrajeron a su propio archivo de iconos.

### Cambio 3 - Iconos de resumen centralizados

#### Código anterior
`No existía src/components/summary-icons.tsx.`

#### Código nuevo
```tsx
export const IconGive = ( ... );
export const IconRoad = ( ... );
export const IconPinNeon = ( ... );
export const IconTaxiBadgeNeon = ( ... );
export const IconNoteAdd = ( ... );
```

#### Por qué se cambió
Iconos usados por SummaryScreen y posiblemente otros screens se centralizan para reutilización.

### Cambio 4 - Reemplazo del bloque settings en main.tsx

#### Código anterior
```tsx
if (screen === "settings") {
  const backupMenuActionIds = getBackupMenuActionIds(isAdmin);
  return (
    <Shell burst={false}>
      <div style={{ flex: 1, padding: "16px 20px", ... }}>
        {/* Bloque App Info */}
        {/* Bloque Porcentajes */}
        {/* Bloque Total a Descontar */}
        {/* Bloque Día Libre */}
        {/* Botón Añadir Turno */}
        {/* Menú Backup */}
      </div>
      {/* Modal de configuración de porcentaje */}
      {confirmDialog && <ConfirmDialog ... />}
    </Shell>
  );
}
```

#### Código nuevo
```tsx
if (screen === "settings") {
  return (
    <SettingsScreen
      isAdmin={isAdmin}
      settings={settings}
      setSettings={setSettings}
      history={history}
      setHistory={setHistory}
      current={current}
      weekOverrides={weekOverrides}
      reservations={reservations}
      notes={notes}
      activeSettingsField={activeSettingsField}
      setActiveSettingsField={setActiveSettingsField}
      settingsValStr={settingsValStr}
      setSettingsValStr={setSettingsValStr}
      showBackupMenu={showBackupMenu}
      setShowBackupMenu={setShowBackupMenu}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      updateState={updateState}
      updateMsg={updateMsg}
      downloadUrl={downloadUrl}
      releaseUrl={releaseUrl}
      setUpdateState={setUpdateState}
      setUpdateMsg={setUpdateMsg}
      setDownloadUrl={setDownloadUrl}
      setReleaseUrl={setReleaseUrl}
      onSetScreen={setScreen}
    />
  );
}
```

#### Por qué se cambió
El bloque if (screen === "settings") fue reemplazado por el componente SettingsScreen importado. Los IconReceipt e IconHoliday se mantienen en main.tsx porque SummaryScreen también los usa.

## 2026-05-26 02:00 - Extraer CalendarScreen a src/screens/calendar-screen.tsx

**Archivos modificados:** `src/screens/calendar-screen.tsx`, `src/components/calendar-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de calendario centralizados

#### Código anterior
`No existía src/components/calendar-icons.tsx.`

#### Código nuevo
```tsx
export const IconPencilNeon = ({ s = 28 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* Definición SVG completa */}
  </svg>
);

export const IconTimer = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* Definición SVG completa */}
  </svg>
);

export const IconMoneyBag = ({ s = 24, c = "white" }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" ...>
    {/* Definición SVG completa */}
  </svg>
);
```

#### Por qué se cambió
Los iconos IconPencilNeon, IconTimer e IconMoneyBag eran definiciones inline en `main.tsx` usados exclusivamente por CalendarScreen. Extraerlos a `src/components/calendar-icons.tsx` centraliza iconos con responsabilidad clara.

### Cambio 2 - CalendarScreen extraída

#### Código anterior
`No existía src/screens/calendar-screen.tsx.`

#### Código nuevo
```tsx
import React from "react";
import { Shell } from "../components/shell";
import { ConfirmDialog } from "../components/common";
import { IconBack, IconCalendar } from "../components/navigation-icons";
import { IconPencilNeon, IconMoneyBag, IconTimer } from "../components/calendar-icons";
import { fmt, fmtDuration } from "../logic/formatters";
import { getDiffMins, today } from "../logic/date-time";
import { getStartOffset, getDaysInMonth } from "../logic/calendar-date";
import { calcularTurnoContable } from "../logic/accounting";
import { C, G } from "../shared/ui-theme";
import type { AppSettings, NotaCalendario, NotaTipo, Reserva, Turno } from "../shared/types";

interface CalendarScreenProps {
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
  calendarView: 'month' | 'agenda';
  setCalendarView: (v: 'month' | 'agenda') => void;
  showMonthPicker: boolean;
  setShowMonthPicker: React.Dispatch<React.SetStateAction<boolean>>;
  pickerYear: number;
  setPickerYear: React.Dispatch<React.SetStateAction<number>>;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  showNotaDialog: boolean;
  setShowNotaDialog: (v: boolean) => void;
  notaTipo: NotaTipo;
  setNotaTipo: (t: NotaTipo) => void;
  notaTexto: string;
  setNotaTexto: (t: string) => void;
  editingNota: NotaCalendario | null;
  setEditingNota: (n: NotaCalendario | null) => void;
  notes: NotaCalendario[];
  setNotes: (n: NotaCalendario[] | ((prev: NotaCalendario[]) => NotaCalendario[])) => void;
  showReservaDialog: boolean;
  setShowReservaDialog: (v: boolean) => void;
  reservaTime: string;
  setReservaTime: (t: string) => void;
  reservaOrigen: string;
  setReservaOrigen: (o: string) => void;
  reservaDestino: string;
  setReservaDestino: (d: string) => void;
  reservaCliente: string;
  setReservaCliente: (c: string) => void;
  reservaTelefono: string;
  setReservaTelefono: (t: string) => void;
  reservaNotas: string;
  setReservaNotas: (n: string) => void;
  editingReserva: Reserva | null;
  setEditingReserva: (r: Reserva | null) => void;
  reservations: Reserva[];
  setReservations: (r: Reserva[] | ((prev: Reserva[]) => Reserva[])) => void;
  confirmDialog: { ... } | null;
  setConfirmDialog: (d: null | { ... }) => void;
  history: Turno[];
  settings: AppSettings;
  openNewReserva: (date?: string) => void;
}

export function CalendarScreen({ ... }: CalendarScreenProps) {
  // ~800 líneas de la pantalla calendario completa
}
```

#### Por qué se cambió
La pantalla de calendario (`screen === "calendar"`) era un bloque inline de ~767 líneas en `main.tsx`. Extraerla a `src/screens/calendar-screen.tsx` reduce significativamente el archivo principal y aísla la responsabilidad de calendario como componente independiente con frontera clara.

### Cambio 3 - Reemplazar bloque inline en main.tsx

#### Código anterior
```tsx
  if (screen === "calendar") {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const startOffset = getStartOffset(year, month);
    return (
      <Shell burst={false}>
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "calendar") {
    return (
      <CalendarScreen
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        calendarView={calendarView}
        setCalendarView={setCalendarView}
        showMonthPicker={showMonthPicker}
        setShowMonthPicker={setShowMonthPicker}
        pickerYear={pickerYear}
        setPickerYear={setPickerYear}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showNotaDialog={showNotaDialog}
        setShowNotaDialog={setShowNotaDialog}
        notaTipo={notaTipo}
        setNotaTipo={setNotaTipo}
        notaTexto={notaTexto}
        setNotaTexto={setNotaTexto}
        editingNota={editingNota}
        setEditingNota={setEditingNota}
        notes={notes}
        setNotes={setNotes}
        showReservaDialog={showReservaDialog}
        setShowReservaDialog={setShowReservaDialog}
        reservaTime={reservaTime}
        setReservaTime={setReservaTime}
        reservaOrigen={reservaOrigen}
        setReservaOrigen={setReservaOrigen}
        reservaDestino={reservaDestino}
        setReservaDestino={setReservaDestino}
        reservaCliente={reservaCliente}
        setReservaCliente={setReservaCliente}
        reservaTelefono={reservaTelefono}
        setReservaTelefono={setReservaTelefono}
        reservaNotas={reservaNotas}
        setReservaNotas={setReservaNotas}
        editingReserva={editingReserva}
        setEditingReserva={setEditingReserva}
        reservations={reservations}
        setReservations={setReservations}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        history={history}
        settings={settings}
        openNewReserva={openNewReserva}
      />
    );
  }
```

#### Por qué se cambió
El bloque inline de ~767 líneas se sustituye por el componente `CalendarScreen` importado. Los iconos IconPencilNeon, IconTimer e IconMoneyBag permanecen en `main.tsx` porque se usan en otras pantallas (no exclusivamente en calendario).

## 2026-05-26 01:28 - Extraer HomeScreen a src/screens/home-screen.tsx

**Archivos modificados:** `src/screens/home-screen.tsx`, `src/components/home-icons.tsx`, `src/main.tsx`

### Cambio 1 - HomeScreen extraída

#### Código anterior
`No existía src/screens/home-screen.tsx.`

#### Código nuevo
```tsx
export const HomeScreen: FC<HomeScreenProps> = ({
  isPaused,
  isAdmin,
  active,
  onSetScreen,
  onSetCalendarView,
  onOpenNewReserva,
  onSetAdminMode,
  onSetConfirmDialog,
  renderReservaDialog,
}) => {
  const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
  return (
    <Shell burst={false}>
    </Shell>
  );
};
```

#### Por qué se cambió
La pantalla principal de la app (home) estaba definida inline en `main.tsx`. Extraerla a `src/screens/home-screen.tsx` reduce ~270 líneas del archivo principal y la aísla como componente independiente.

### Cambio 2 - Iconos de HomeScreen centralizados

#### Código anterior
`No existía src/components/home-icons.tsx.`

#### Código nuevo
```tsx
export const IconRocket: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconClipboard: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconChart: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconReservaWrite: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconAgenda: FC<{ s?: number; c?: string }> = (...) => (...);
export const IconPlay: FC<{ s?: number; c?: string }> = (...) => (...);
```

#### Por qué se cambió
Estos 6 iconos eran definiciones inline en `main.tsx` usadas por HomeScreen. Centralizarlos en `src/components/home-icons.tsx` evita duplicación y permite que `home-screen.tsx` los importe sin depender de `main.tsx`.

### Cambio 3 - Reemplazar bloque inline en main.tsx

#### Código anterior
```tsx
  if (screen === "home") {
    const homeQuickActionIds = getHomeQuickActionIds(isAdmin);
    return (
      <Shell burst={false}>
        {/* ... 270 líneas inline ... */}
      </Shell>
    );
  }
```

#### Código nuevo
```tsx
  if (screen === "home") {
    return (
      <HomeScreen
        isPaused={current.isPaused}
        isAdmin={isAdmin}
        active={active}
        onSetScreen={setScreen}
        onSetCalendarView={setCalendarView}
        onOpenNewReserva={openNewReserva}
        onSetAdminMode={setAdminMode}
        onSetConfirmDialog={setConfirmDialog}
        renderReservaDialog={renderReservaDialog}
      />
    );
  }
```

#### Por qué se cambió
El bloque inline de ~270 líneas se sustituye por el componente `HomeScreen` importado. main.tsx pasa de 6828 a 6574 líneas.

## 2026-05-26 01:00 - Extraer iconos de entradas a src/components/entry-icons.tsx

**Archivos modificados:** `src/components/entry-icons.tsx`, `src/main.tsx`

### Cambio 1 - Iconos de entradas extraídos

#### Código anterior
`No existía src/components/entry-icons.tsx.`

#### Código nuevo
```tsx
import { type FC } from "react";
import { A, E, F, N, P } from "../shared/ui-theme";

export const IconCoin: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <text x="12" y="17" textAnchor="middle" fill={c} fontSize="11" fontWeight="700" fontFamily="Outfit,sans-serif">€</text>
  </svg>
);

export const IconPercent: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M16 8L8 16" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="9" r="2" stroke={c} strokeWidth="2.5" />
    <circle cx="15" cy="15" r="2" stroke={c} strokeWidth="2.5" />
  </svg>
);

export const IconCard: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="13" rx="2.5" stroke={c} strokeWidth="1.8" />
    <rect x="3" y="10" width="18" height="3.5" fill={c} opacity="0.35" />
    <rect x="6" y="15.5" width="5" height="1.5" rx="0.75" fill={c} />
  </svg>
);

export const IconAgency: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M4 20V9L12 4L20 9V20" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 20V14H15V20" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M3 20H21" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconExtra: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <path d="M12 4V20M4 12H20" stroke={c} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" opacity="0.5" />
  </svg>
);

export const IconFuel: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="11.5" height="15" rx="2" stroke={c} strokeWidth="1.8" />
    <path d="M15.5 9L19 7V17L15.5 15" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    <rect x="7" y="8" width="5.5" height="4.5" rx="1" fill={c} opacity="0.4" />
  </svg>
);

export const IconNulo: FC<{ s?: number; c?: string }> = ({ s = 24, c }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
    <path d="M6 18L18 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
```

#### Por qué se cambió
Los iconos de tipo de entrada (IconCoin, IconPercent, IconCard, IconAgency, IconExtra, IconFuel, IconNulo) estaban definidos inline en `main.tsx`. Extraerlos a `src/components/entry-icons.tsx` los centraliza y elimina ~70 líneas duplicadas.

### Cambio 2 - Reemplazar iconos inline en main.tsx

#### Código anterior
```tsx
const IconCoin = ({ s = 24, c = G }: { s?: number; c?: str
## 2026-06-01 14:17 - Igualar firma Wear

**Archivos modificados:** `android/wear/build.gradle`, `src/__tests__/android-wear-bridge.test.ts`

### Cambio 1 - Firma del modulo Wear

#### Codigo anterior
```gradle
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
```

#### Codigo nuevo
```gradle
    signingConfigs {
        debug {
            storeFile file('../app/debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
```

#### Por que se cambio
El APK movil y el APK Wear estaban firmados con certificados distintos. Se configuro Wear para usar la misma `debug.keystore` fija que el modulo movil y permitir que ambos APK compartan identidad de firma.

### Cambio 2 - Test de firma Wear

#### Codigo anterior
```ts
  it("envia cada comando del reloj a un unico nodo conectado", () => {
    const source = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt"),
      "utf8",
    );

    expect(source).not.toContain("for (node in nodes)");
    expect(source).toContain("val node = nodes.first()");
  });
});
```

#### Codigo nuevo
```ts
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
});
```

#### Por que se cambio
Se anadio una regresion para impedir que el modulo Wear vuelva a compilarse con una firma distinta a la del modulo movil.

## 2026-06-01 13:49 - Blindar puente Wear OS

**Archivos modificados:**
- `android/app/src/main/java/com/mijornada/app/MainActivity.java`
- `android/app/src/main/java/com/mijornada/app/WearListenerService.java`
- `android/app/src/main/java/com/mijornada/app/WearOsBridgePlugin.java`
- `android/wear/src/main/AndroidManifest.xml`
- `android/wear/src/main/java/com/mijornada/app/WearMainActivity.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/ActiveTurnoScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/AddEntryScreen.kt`
- `android/wear/src/main/java/com/mijornada/app/screens/EndTurnoScreen.kt`
- `android/wear/proguard-rules.pro`
- `src/services/watch-bridge.ts`
- `src/__tests__/android-wear-bridge.test.ts`
- `src/__tests__/watch-bridge.test.ts`

### Cambio 1 - Registro del plugin Wear en Capacitor

#### Codigo anterior
```java
package com.mijornada.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

#### Codigo nuevo
```java
package com.mijornada.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(WearOsBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

#### Por que se cambio
El plugin nativo `WearOsBridgePlugin` existia, pero `MainActivity` no lo registraba manualmente. Sin este registro, Capacitor podia no cargar el puente nativo usado por `registerPlugin<WearOsBridgePlugin>("WearOsBridge")`.

### Cambio 2 - Nodo de origen en comandos del reloj

#### Codigo anterior
```java
public interface CommandListener {
    void onCommandReceived(String commandJson);
}
```

```java
if (listener != null) {
    listener.onCommandReceived(commandJson);
} else {
```

#### Codigo nuevo
```java
public interface CommandListener {
    void onCommandReceived(String commandJson, String nodeId);
}
```

```java
if (listener != null) {
    listener.onCommandReceived(commandJson, messageEvent.getSourceNodeId());
} else {
```

#### Por que se cambio
El puente necesitaba conocer el nodo Wear que envio cada comando para responder a ese nodo concreto y no emitir respuestas de comandos a todos los nodos conectados.

### Cambio 3 - Respuesta nativa dirigida al reloj

#### Codigo anterior
```java
private String currentUid = null;
```

```java
public void onCommandReceived(String commandJson) {
    JSObject data = new JSObject();
    data.put("command", commandJson);
    notifyListeners("onCommandReceived", data);
}
```

```java
if (uid != null && !uid.trim().isEmpty()) {
    this.currentUid = uid;
    call.resolve();
} else {
```

```java
byte[] responseData = responseJson.getBytes(StandardCharsets.UTF_8);
Wearable.getNodeClient(getContext())
    .getConnectedNodes()
```

#### Codigo nuevo
```java
public void onCommandReceived(String commandJson, String nodeId) {
    JSObject data = new JSObject();
    data.put("command", commandJson);
    data.put("nodeId", nodeId);
    notifyListeners("onCommandReceived", data);
}
```

```java
if (uid != null && !uid.trim().isEmpty()) {
    call.resolve();
} else {
```

```java
String nodeId = call.getString("nodeId");
byte[] responseData = responseJson.getBytes(StandardCharsets.UTF_8);
if (nodeId != null && !nodeId.trim().isEmpty()) {
    Wearable.getMessageClient(getContext())
        .sendMessage(nodeId, "/watch-response", responseData)
        .addOnSuccessListener(unused -> call.resolve())
        .addOnFailureListener(e -> call.reject("Error al responder a Wear OS: " + e.getMessage()));
    return;
}

Wearable.getNodeClient(getContext())
    .getConnectedNodes()
```

#### Por que se cambio
`currentUid` se elimino porque no protegia nada. La respuesta nativa se hizo dirigida por `nodeId` para cerrar el ciclo comando-respuesta con el reloj que origino el mensaje.

### Cambio 4 - Blindaje de UID y carga en el puente JS

#### Codigo anterior
```ts
import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
```

```ts
export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string }) => void
  ): Promise<any> & any;
}
```

```ts
let listenerAdded = false;
```

```ts
  WearOsBridge.addListener("onCommandReceived", async (data: { command: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const store = useAppStore.getState();
```

```ts
      await WearOsBridge.sendResponse({
        response: JSON.stringify(result.response),
      });
```

```ts
    } catch (err) {
      console.error("Error al procesar comando de Wear OS:", err);
    }
```

#### Codigo nuevo
```ts
import { registerPlugin, Capacitor } from "@capacitor/core";
import { useAppStore } from "./store";
import { processWatchCommand } from "../logic/watch-command-processor";
import type { WatchCommand, WatchCommandResponse } from "../shared/watch-commands";
import { auth } from "./firebase";
```

```ts
export interface WearOsBridgePlugin {
  setPrepared(options: { uid: string }): Promise<void>;
  sendResponse(options: { response: string; nodeId?: string }): Promise<void>;
  addListener(
    eventName: "onCommandReceived",
    listenerFunc: (data: { command: string; nodeId?: string }) => void
  ): Promise<any> & any;
}
```

```ts
let listenerAdded = false;
let preparedUid: string | null = null;
```

```ts
function readOperationId(command: unknown): string {
  if (!command || typeof command !== "object") return "";
  const value = (command as { operationId?: unknown }).operationId;
  return typeof value === "string" ? value : "";
}

function errorResponse(operationId: string, code: string, message: string): WatchCommandResponse {
  return {
    type: "ERROR",
    operationId,
    code,
    message,
  };
}

async function sendResponse(response: WatchCommandResponse, nodeId?: string): Promise<void> {
  await WearOsBridge.sendResponse({
    nodeId,
    response: JSON.stringify(response),
  });
}
```

```ts
  preparedUid = uid;
```

```ts
  WearOsBridge.addListener("onCommandReceived", async (data: { command: string; nodeId?: string }) => {
    try {
      const command = JSON.parse(data.command) as WatchCommand;
      const operationId = readOperationId(command);
      const store = useAppStore.getState();
      const authUid = auth.currentUser?.uid ?? null;

      if (!authUid || !preparedUid || authUid !== preparedUid) {
        await sendResponse(errorResponse(
          operationId,
          "AUTH_UID_MISMATCH",
          "Usuario movil no coincide con el puente del reloj",
        ), data.nodeId);
        return;
      }

      if (!store.dataLoaded) {
        await sendResponse(errorResponse(
          operationId,
          "DATA_NOT_LOADED",
          "Datos del usuario no cargados",
        ), data.nodeId);
        return;
      }
```

```ts
      await sendResponse(result.response, data.nodeId);
```

```ts
    } catch (err) {
      console.error("Error al procesar comando de Wear OS:", err);
      await sendResponse(errorResponse(
        "",
        "INVALID_COMMAND",
        "Comando del reloj invalido",
      ), data.nodeId);
    }
```

#### Por que se cambio
Antes el puente aceptaba comandos del reloj sin validar el usuario autenticado real ni que el store tuviera los datos cargados. Ahora un comando no puede tocar `current` ni `history` si el UID no coincide o si `dataLoaded` aun no esta activo.

### Cambio 5 - Esperar OK antes de cambiar pantalla en Wear

#### Codigo anterior
```kt
onSave = { amount, note ->
    sendAddEntry(selectedCategory.value, amount, note)
    currentScreen.value = ScreenState.ACTIVE_TURNO
},
```

```kt
onConfirm = { dinero, km ->
    sendEndTurno(dinero, km)
    currentScreen.value = ScreenState.NO_CONNECTED
},
```

```kt
} else if ("OK" == json.optString("type")) {
    requestStatus()
} else if ("ERROR" == json.optString("type")) {
```

#### Codigo nuevo
```kt
onSave = { amount, note ->
    sendAddEntry(selectedCategory.value, amount, note)
},
```

```kt
onConfirm = { dinero, km ->
    sendEndTurno(dinero, km)
},
```

```kt
} else if ("OK" == json.optString("type")) {
    currentScreen.value = ScreenState.ACTIVE_TURNO
    requestStatus()
} else if ("ERROR" == json.optString("type")) {
```

#### Por que se cambio
El reloj cambiaba de pantalla como si una entrada o cierre se hubiera aplicado antes de recibir confirmacion del movil. Ahora espera `OK` del movil antes de volver al flujo activo y despues pide estado real.

### Cambio 6 - Enviar comandos Wear a un unico nodo

#### Codigo anterior
```kt
val data = commandJson.toByteArray(StandardCharsets.UTF_8)
for (node in nodes) {
    Wearable.getMessageClient(this)
        .sendMessage(node.id, "/watch-command", data)
}
```

#### Codigo nuevo
```kt
val data = commandJson.toByteArray(StandardCharsets.UTF_8)
val node = nodes.first()
Wearable.getMessageClient(this)
    .sendMessage(node.id, "/watch-command", data)
    .addOnFailureListener {
        isConnected.value = false
        currentScreen.value = ScreenState.NO_CONNECTED
    }
```

#### Por que se cambio
Emitir un comando mutativo a todos los nodos conectados podia enviar la misma orden a mas de un dispositivo. Ahora se envia a un unico nodo conectado y si el envio falla el reloj vuelve al estado seguro de no conectado.

### Cambio 7 - Limpieza Wear sin codigo inutil

#### Codigo anterior
```kt
private var selectedCategoryBgColor = mutableStateOf(ColorPropinaBg)
```

```kt
categoryBgColor = selectedCategoryBgColor.value,
```

```kt
categoryBgColor: Color,
```

```kt
import androidx.wear.compose.material.*
```

```xml
<activity
    android:name="com.mijornada.app.WearMainActivity"
    android:exported="true"
    android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
```

#### Codigo nuevo
```kt
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.*
```

```xml
<activity
    android:name="com.mijornada.app.WearMainActivity"
    android:exported="true"
    android:taskAffinity="com.mijornada.app.watch"
    android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
```

#### Por que se cambio
Se elimino el estado/parametro de color de fondo que no se usaba, se importo `ScalingLazyColumn` desde el paquete no obsoleto y se anadio `taskAffinity` para resolver el aviso Wear Recents de lint.

### Cambio 8 - Archivo ProGuard de Wear

#### Codigo anterior
`No existia proguard-rules.pro en android/wear.`

#### Codigo nuevo
```pro
# Reglas especificas del modulo Wear OS.
# Se mantiene el archivo porque build.gradle lo referencia en release.
```

#### Por que se cambio
`android/wear/build.gradle` referenciaba `proguard-rules.pro` en release. Se creo el archivo para que la configuracion no apunte a un fichero ausente.

### Cambio 9 - Tests del puente Wear

#### Codigo anterior
`No existia watch-bridge.test.ts en src/__tests__.`

#### Codigo nuevo
```ts
describe("watch-bridge", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    capacitorMock.listener = null;
    capacitorMock.isNative = true;
    firebaseMock.auth.currentUser = { uid: "uid-preparado" };
```

```ts
  it("rechaza comandos si el UID autenticado no coincide con el UID preparado", async () => {
```

```ts
  it("rechaza comandos si los datos del usuario aun no estan cargados", async () => {
```

```ts
  it("responde con error si el comando recibido no es JSON valido", async () => {
```

#### Por que se cambio
Se anadieron regresiones para probar que el puente del reloj no modifica el store si el UID no coincide, si los datos no estan cargados o si el comando recibido no es JSON valido.

### Cambio 10 - Tests Android/Wear de integracion

#### Codigo anterior
`No existia android-wear-bridge.test.ts en src/__tests__.`

#### Codigo nuevo
```ts
describe("Android Wear bridge", () => {
  it("registra WearOsBridgePlugin en MainActivity para que Capacitor lo cargue", () => {
```

```ts
  it("no cambia pantallas de trabajo del reloj antes de recibir OK del movil", () => {
```

```ts
  it("envia cada comando del reloj a un unico nodo conectado", () => {
```

#### Por que se cambio
Se anadieron regresiones de integracion para fijar el registro del plugin nativo, evitar pantallas optimistas antes del `OK` del movil y evitar comandos enviados a varios nodos.
## 2026-06-03 00:04 - Cambiar identidad visual del taxi

**Archivos modificados:** `src/components/brand-assets.tsx`, `src/main.tsx`, `src/screens/home-screen.tsx`, `src/screens/settings-screen.tsx`, `android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt`, `src/__tests__/brand-assets.test.ts`

### Cambio 1 - Componente de marca del taxi

#### Código anterior
`No existía BrandTaxiIcon ni BrandTaxiLogo en src/components/brand-assets.tsx.`

#### Código nuevo
```tsx
import type { CSSProperties, FC } from "react";

const BRAND_MINI_20 = "/brand/brand-taxi-mini-20.png";
const BRAND_MINI_18 = "/brand/brand-taxi-mini-18.png";
const BRAND_LOGO = "/brand/brand-taxi-logo.png";

type BrandTaxiIconProps = {
  size?: 18 | 20 | 24 | 28 | number;
  variant?: "primary" | "alternate";
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiIcon: FC<BrandTaxiIconProps> = ({
  size = 20,
  variant = "primary",
  alt = "Taxi",
  style,
}) => (
  <img
    src={variant === "alternate" ? BRAND_MINI_18 : BRAND_MINI_20}
    width={size}
    height={size}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      objectFit: "contain",
      flexShrink: 0,
      ...style,
    }}
  />
);

type BrandTaxiLogoProps = {
  width?: number;
  alt?: string;
  style?: CSSProperties;
};

export const BrandTaxiLogo: FC<BrandTaxiLogoProps> = ({
  width = 156,
  alt = "Mi Turno Taxi",
  style,
}) => (
  <img
    src={BRAND_LOGO}
    width={width}
    alt={alt}
    decoding="async"
    draggable={false}
    style={{
      display: "block",
      width,
      maxWidth: "100%",
      height: "auto",
      objectFit: "contain",
      margin: "0 auto",
      ...style,
    }}
  />
);
```

#### Por qué se cambió
Se centralizó la identidad visual del taxi para usar el mini icono principal de 20px, conservar la variante de 18px y reutilizar el logo grande sin duplicar rutas ni dejar emojis como marca visual.

### Cambio 2 - Icono de cabecera principal

#### Código anterior
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
```

```tsx
              🚕{" "}
              {new Date()
```

#### Código nuevo
```tsx
import { IconNoteAdd, IconTaxiBadgeNeon, IconRoad } from "./components/summary-icons";
import { BrandTaxiIcon } from "./components/brand-assets";
```

```tsx
              <BrandTaxiIcon size={20} style={{ marginRight: 5, transform: "translateY(-1px)" }} />
              {new Date()
```

#### Por qué se cambió
Se sustituyó el emoji de la cabecera principal por el mini icono de taxi de 20px elegido para que la cabecera use un asset propio y coherente con el resto de la marca.

### Cambio 3 - Logo de la pantalla Home

#### Código anterior
```tsx
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgendaNeon } from "../components/home-icons";
```

```tsx
          <div style={{ fontSize: 88, lineHeight: 1, marginBottom: 18 }}>
            🚕
          </div>
```

#### Código nuevo
```tsx
import { IconRocket, IconPlay, IconClipboard, IconChart, IconReservaWrite, IconAgendaNeon } from "../components/home-icons";
import { BrandTaxiLogo } from "../components/brand-assets";
```

```tsx
          <BrandTaxiLogo width={168} style={{ marginBottom: 18 }} />
```

#### Por qué se cambió
Se sustituyó el emoji grande de la pantalla Home por el logo nuevo del taxi para que la pantalla principal muestre una imagen de marca propia.

### Cambio 4 - Logo de Ajustes

#### Código anterior
```tsx
import { hapticDanger, hapticKey, hapticOpen, hapticSave } from "../services/haptics";
```

```tsx
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚕</div>
```

#### Código nuevo
```tsx
import { hapticDanger, hapticKey, hapticOpen, hapticSave } from "../services/haptics";
import { BrandTaxiLogo } from "../components/brand-assets";
```

```tsx
          <BrandTaxiLogo width={120} style={{ marginBottom: 12 }} />
```

#### Por qué se cambió
Se sustituyó el emoji de la tarjeta de Ajustes por el mismo logo visual usado en Home para mantener una identidad coherente.

### Cambio 5 - Logo inicial de Wear

#### Código anterior
```kt
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
```

```kt
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
```

```kt
import androidx.wear.compose.material.Text
import com.mijornada.app.theme.*
```

```kt
            Text("🚕", fontSize = 34.sp)
            Spacer(modifier = Modifier.height(5.dp))
```

#### Código nuevo
```kt
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
```

```kt
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
```

```kt
import androidx.wear.compose.material.Text
import com.mijornada.app.R
import com.mijornada.app.theme.*
```

```kt
            BrandTaxiLogo()
            Spacer(modifier = Modifier.height(5.dp))
```

```kt
@Composable
private fun BrandTaxiLogo() {
    Image(
        painter = painterResource(id = R.drawable.brand_taxi_logo),
        contentDescription = "Mi Turno Taxi",
        contentScale = ContentScale.Fit,
        modifier = Modifier
            .fillMaxWidth(0.66f)
            .height(58.dp)
    )
}
```

#### Por qué se cambió
Se sustituyó el emoji de la pantalla inicial del reloj por un recurso nativo del taxi, optimizado para Wear OS y cargado desde `R.drawable.brand_taxi_logo`.

### Cambio 6 - Pruebas de identidad visual

#### Código anterior
`No existía src/__tests__/brand-assets.test.ts.`

#### Código nuevo
```ts
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");

describe("brand taxi assets", () => {
  it("centraliza los assets visuales del taxi para movil web y reloj", () => {
    const brandAssets = readFileSync(
      resolve(root, "src/components/brand-assets.tsx"),
      "utf8",
    );

    expect(brandAssets).toContain("BrandTaxiIcon");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-20.png");
    expect(brandAssets).toContain("/brand/brand-taxi-mini-18.png");
    expect(brandAssets).toContain("/brand/brand-taxi-logo.png");
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-20.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-mini-18.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/brand/brand-taxi-logo.png"))).toBe(true);
  });

  it("sustituye los emojis de marca por assets propios en pantallas visibles", () => {
    const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
    const home = readFileSync(resolve(root, "src/screens/home-screen.tsx"), "utf8");
    const settings = readFileSync(resolve(root, "src/screens/settings-screen.tsx"), "utf8");
    const wearHome = readFileSync(
      resolve(root, "android/wear/src/main/java/com/mijornada/app/screens/NoActiveTurnoScreen.kt"),
      "utf8",
    );

    expect(main).toContain("<BrandTaxiIcon size={20}");
    expect(home).toContain("<BrandTaxiLogo");
    expect(settings).toContain("<BrandTaxiLogo");
    expect(wearHome).toContain("BrandTaxiLogo(");
    expect(home).not.toContain("🚕");
    expect(settings).not.toContain("🚕");
    expect(wearHome).not.toContain("🚕");
  });

  it("mantiene iconos launcher actualizados para PWA Android y Wear", () => {
    expect(existsSync(resolve(root, "public/icon-192.png"))).toBe(true);
    expect(existsSync(resolve(root, "public/icon-512.png"))).toBe(true);
    expect(existsSync(resolve(root, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"))).toBe(true);
    expect(existsSync(resolve(root, "android/wear/src/main/res/mipmap-xxxhdpi/ic_launcher.png"))).toBe(true);
  });
});
```

#### Por qué se cambió
Se añadió cobertura para verificar que la identidad visual queda centralizada, que las pantallas visibles usan los assets nuevos y que existen iconos launcher para PWA, Android móvil y Wear.
