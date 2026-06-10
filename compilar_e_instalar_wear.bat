@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "WATCH=192.168.3.59:36317"
set "APK=android\wear\build\outputs\apk\debug\wear-debug.apk"

echo ==========================================================
echo  APP Taxi - Compilar e instalar APK del reloj
echo  Reloj objetivo: %WATCH%
echo ==========================================================
echo.

REM === 1. Localizar adb ===
set "ADB="
for %%P in (
    "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
    "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb.exe"
    "C:\Android\platform-tools\adb.exe"
    "C:\Program Files\Android\Android Studio\plugins\Android\lib\adb.exe"
    "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe"
) do (
    if exist %%P set "ADB=%%~P"
)

if "%ADB%"=="" (
    where adb >nul 2>&1
    if !errorlevel! equ 0 set "ADB=adb"
)

if "%ADB%"=="" (
    echo [ERROR] No se ha encontrado adb.exe en las rutas habituales ni en PATH.
    echo Instala "Android SDK Platform-Tools" o anyade adb al PATH y vuelve a ejecutar.
    pause
    exit /b 1
)

echo [OK] adb encontrado en: %ADB%
echo.

REM === 2. Conectar al reloj ===
echo --- Conectando a %WATCH% ---
"%ADB%" connect %WATCH%
if errorlevel 1 (
    echo [ERROR] No se pudo conectar al reloj. Verifica IP y puerto.
    pause
    exit /b 1
)
echo.
"%ADB%" devices
echo.

REM === 3. Compilar wear ===
if not exist "android\gradlew.bat" (
    echo [ERROR] No se encuentra android\gradlew.bat
    pause
    exit /b 1
)

echo --- Compilando :wear:assembleDebug ---
pushd android
call gradlew.bat :wear:assembleDebug
set "BUILD_RC=%errorlevel%"
popd

if not "%BUILD_RC%"=="0" (
    echo [ERROR] La compilacion fallo con codigo %BUILD_RC%.
    pause
    exit /b %BUILD_RC%
)
echo.

if not exist "%APK%" (
    echo [ERROR] APK no generado en %APK%
    pause
    exit /b 1
)

REM === 4. Instalar ===
echo --- Instalando APK en el reloj ---
"%ADB%" -s %WATCH% install -r "%APK%"
if errorlevel 1 (
    echo.
    echo [WARN] install -r fallo. Probando uninstall + install limpio...
    "%ADB%" -s %WATCH% uninstall com.mijornada.app
    "%ADB%" -s %WATCH% install "%APK%"
    if errorlevel 1 (
        echo [ERROR] La instalacion fallo.
        pause
        exit /b 1
    )
)

echo.
echo ==========================================================
echo  LISTO - APK instalado en el reloj
echo  Abre la app "Mi Turno" en el reloj y verifica el badge
echo  "Sincronizando" al anyadir entradas con el movil apagado.
echo ==========================================================
pause
