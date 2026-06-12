@echo off
setlocal enabledelayedexpansion
title Diagnostico esfera Mi Turno

set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if not exist "%ADB%" set "ADB=adb"

set /p WATCH=Escribe IP:PUERTO del reloj (ej. 192.168.3.59:41177):
if not defined WATCH (
  echo [ERROR] No se indico IP:PUERTO.
  pause
  exit /b 1
)

echo --- Conectando a !WATCH! ---
"%ADB%" connect !WATCH!
echo.

echo --- 1. Version de Android / Wear OS del reloj ---
"%ADB%" -s !WATCH! shell getprop ro.build.version.release
"%ADB%" -s !WATCH! shell getprop ro.build.version.sdk
"%ADB%" -s !WATCH! shell getprop ro.product.model
echo.

echo --- 2. APK de la esfera (com.mijornada.app.esfera) instalado ---
"%ADB%" -s !WATCH! shell "dumpsys package com.mijornada.app.esfera | grep -iE 'versionName|lastUpdateTime'"
echo.

echo --- 3. Esfera activa ahora mismo ---
"%ADB%" -s !WATCH! shell "dumpsys wallpaper | grep -iE 'mijornada|component' | head -5"
echo.

echo Pasa esta salida a Claude si algo no cuadra.
pause
