@echo off
chcp 65001 >nul
title Diagnostico Mi Turno Reloj

set "ADB=C:\Users\carlo\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set "OUT=%USERPROFILE%\Desktop\diagnostico_reloj"

echo ============================================
echo  DIAGNOSTICO Mi Turno Reloj
echo ============================================
echo.

if not exist "%ADB%" (
  echo [ERROR] No se encontro adb en: %ADB%
  pause
  exit /b 1
)

if not exist "%OUT%" mkdir "%OUT%"
echo Resultados se guardaran en: %OUT%
echo.

echo [1/6] Dispositivos conectados:
"%ADB%" devices -l
"%ADB%" devices -l > "%OUT%\devices.txt"
echo.
echo (lista guardada en devices.txt)
echo.
echo IMPORTANTE: anota arriba los serials reales de tu movil y reloj.
echo.
pause

echo.
set /p MOVIL=Escribe el SERIAL del movil (ejemplo RFCY917BCSP):
set /p RELOJ=Escribe IP:PUERTO del reloj (ejemplo 192.168.3.59:40749):

if "%MOVIL%"=="" (
  echo [ERROR] No escribiste el serial del movil.
  pause
  exit /b 1
)

echo.
echo Movil: %MOVIL%
echo Reloj: %RELOJ%
echo.
pause

echo.
echo [2/6] Verificando registro de Mi Turno en Wear Data Layer (movil)...
"%ADB%" -s %MOVIL% shell dumpsys activity service com.google.android.gms/.wearable.service.WearableService > "%OUT%\dumpsys_movil.txt" 2>&1
echo Salida completa guardada en dumpsys_movil.txt
findstr /I "mijornada" "%OUT%\dumpsys_movil.txt" > "%OUT%\mijornada_movil.txt"
echo.
echo --- Lineas con "mijornada" en el dump del movil: ---
type "%OUT%\mijornada_movil.txt"
echo --- fin ---
echo.
pause

echo.
echo [3/6] Verificando registro de Mi Turno en Wear Data Layer (reloj)...
if "%RELOJ%"=="" (
  echo Saltado: no hay reloj.
) else (
  "%ADB%" -s %RELOJ% shell dumpsys activity service com.google.android.gms/.wearable.service.WearableService > "%OUT%\dumpsys_reloj.txt" 2>&1
  echo Salida completa guardada en dumpsys_reloj.txt
  findstr /I "mijornada" "%OUT%\dumpsys_reloj.txt" > "%OUT%\mijornada_reloj.txt"
  echo.
  echo --- Lineas con "mijornada" en el dump del reloj: ---
  type "%OUT%\mijornada_reloj.txt"
  echo --- fin ---
)
echo.
pause

echo.
echo [4/6] Limpiando buffer de logcat en ambos dispositivos...
"%ADB%" -s %MOVIL% logcat -c
if not "%RELOJ%"=="" "%ADB%" -s %RELOJ% logcat -c
echo OK
echo.
pause

echo.
echo [5/6] CAPTURA en 15 segundos.
echo.
echo  -^> En cuanto pulses una tecla:
echo     1. Toca "Reintentar" en el reloj inmediatamente.
echo     2. Manten Mi Turno abierto en el movil.
echo     3. Espera 15 segundos sin tocar nada.
echo.
pause

echo Iniciando captura...
timeout /t 15 /nobreak

echo.
echo [6/6] Recogiendo logs...
"%ADB%" -s %MOVIL% logcat -d > "%OUT%\logcat_movil_completo.txt" 2>&1
"%ADB%" -s %MOVIL% logcat -d WearListenerService:V WearCommandWorker:V WatchNativeCommandHandler:V WatchRepository:V WearOsBridgePlugin:V AndroidRuntime:E *:S > "%OUT%\logcat_movil_filtrado.txt" 2>&1
if not "%RELOJ%"=="" (
  "%ADB%" -s %RELOJ% logcat -d > "%OUT%\logcat_reloj_completo.txt" 2>&1
  "%ADB%" -s %RELOJ% logcat -d WearMainActivity:V MobileResponseService:V WatchOutbox:V OutboxWorker:V AndroidRuntime:E *:S > "%OUT%\logcat_reloj_filtrado.txt" 2>&1
)

echo.
echo ============================================
echo  Diagnostico completo.
echo ============================================
echo.
echo Archivos en: %OUT%
echo.
dir /B "%OUT%"
echo.
echo PASOS FINALES:
echo  1. Abre la carpeta: %OUT%
echo  2. Selecciona todos los archivos, clic derecho ^> Enviar a ^> Carpeta comprimida.
echo  3. Pasa el ZIP a Claude.
echo.
pause
