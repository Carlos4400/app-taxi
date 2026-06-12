@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Instalar esfera Mi Turno (Watch Face Format)

set "ROOT=C:\Users\carlo\Desktop\APP Taxi"
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" set "ADB=adb"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "APK=%ROOT%\android\watchface\build\outputs\apk\debug\watchface-debug.apk"

echo ============================================
echo  Instalar esfera Mi Turno (formato nuevo)
echo ============================================
echo.

echo [1/3] Compilando esfera...
pushd "%ROOT%\android"
call gradlew.bat :watchface:assembleDebug --console=plain
set "BUILD_RC=%errorlevel%"
popd
if not "%BUILD_RC%"=="0" (
  echo [ERROR] La compilacion fallo con codigo %BUILD_RC%.
  pause
  exit /b %BUILD_RC%
)

if not exist "%APK%" (
  echo [ERROR] APK no generado en %APK%
  pause
  exit /b 1
)

echo.
echo [2/3] Conectando al reloj...
set /p WATCH=Escribe IP:PUERTO del reloj (ej. 192.168.3.59:41177):
if not defined WATCH (
  echo [ERROR] No se indico IP:PUERTO.
  pause
  exit /b 1
)
"%ADB%" connect !WATCH!

echo.
echo [3/3] Instalando esfera...
"%ADB%" -s !WATCH! install -r "%APK%"
if errorlevel 1 (
  echo [ERROR] La instalacion fallo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo  LISTO. En el reloj: manten pulsada la esfera,
echo  desliza al final y toca "+ Anadir esfera".
echo  "Mi Turno" aparecera en la lista.
echo ============================================
pause
