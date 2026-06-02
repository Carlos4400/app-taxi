@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Validar + instalar app en el reloj (Xiaomi Watch 5)

set "ADB=C:\Users\carlo\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "ROOT=C:\Users\carlo\Desktop\APP Taxi"
set "PROJ=%ROOT%\android"
set "WATCH="

if not defined JAVA_HOME (
  if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
  )
)
echo JAVA_HOME = %JAVA_HOME%
echo.

echo === 1/6  Comprobando tipos del movil (tsc) ===
cd /d "%ROOT%"
call npx tsc --noEmit
if errorlevel 1 (
  echo.
  echo [ERROR] Hay errores de TypeScript. Copia el error y enviamelo.
  pause
  exit /b 1
)
echo   OK tipos correctos
echo.

echo === 2/6  Tests del puente del reloj (vitest) ===
call npx vitest run src/__tests__/watch-command-processor.test.ts
if errorlevel 1 (
  echo.
  echo [ERROR] Han fallado tests. Copia el error y enviamelo.
  pause
  exit /b 1
)
echo   OK tests en verde
echo.

echo === 3/6  Detectando reloj Wear OS ===
if not exist "%ADB%" ( echo [ERROR] adb no encontrado en %ADB% & pause & exit /b 1 )
"%ADB%" devices
for /f "skip=1 tokens=1,2,*" %%a in ('"%ADB%" devices -l') do (
  echo %%a %%b %%c | findstr /i "model:Xiaomi_Watch_5 device:blenny" >nul
  if not errorlevel 1 if "%%b"=="device" if not defined WATCH set "WATCH=%%a"
)
if not defined WATCH (
  echo.
  set /p WATCH=Escribe la IP:PUERTO del reloj que ves en Depuracion por Wi-Fi: 
  if not defined WATCH ( echo [ERROR] No se indico reloj & pause & exit /b 1 )
  "%ADB%" connect !WATCH!
)
echo Reloj seleccionado: !WATCH!
"%ADB%" devices
echo.

echo === 4/6  Compilando modulo wear ===
cd /d "%PROJ%"
call gradlew.bat :wear:assembleDebug
if errorlevel 1 (
  echo.
  echo [ERROR] La compilacion del reloj ha fallado. Copia el error y enviamelo.
  pause
  exit /b 1
)
echo.

echo === 5/6  Buscando el APK ===
set "APK="
for /r "%PROJ%\wear\build\outputs\apk\debug" %%f in (*.apk) do set "APK=%%f"
if not defined APK ( echo [ERROR] APK no encontrado & pause & exit /b 1 )
echo APK: !APK!
echo.

echo === 6/6  Instalando en el reloj ===
"%ADB%" -s !WATCH! install -r "!APK!"
echo.
echo ============================================
echo  TERMINADO. Abre la app en el reloj.
echo ============================================
pause
