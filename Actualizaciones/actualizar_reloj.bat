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
