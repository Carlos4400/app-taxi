@echo off
chcp 65001 >nul
title Actualizar APP en GitHub
set "ROOT=C:\Users\carlo\Desktop\APP Taxi"
set "PROJ=%ROOT%\android"
if not defined JAVA_HOME (
  if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
)
cd /d "%ROOT%"

echo === 1/4  typecheck ===
call npm run typecheck || ( echo [ERROR] typecheck. No se sube nada. & pause & exit /b 1 )

echo === 2/4  tests (todos) ===
call npm test || ( echo [ERROR] tests. No se sube nada. & pause & exit /b 1 )

echo === 3/4  build movil ===
call npm run build || ( echo [ERROR] build movil. No se sube nada. & pause & exit /b 1 )

echo === 4/4  build reloj ===
cd /d "%PROJ%"
call gradlew.bat :wear:assembleDebug || ( echo [ERROR] build reloj. No se sube nada. & pause & exit /b 1 )
cd /d "%ROOT%"

echo.
echo === TODO VERDE. Subiendo a GitHub ===
git add -A
git commit -m "actualizar app (movil + reloj)"
git push origin main
echo.
echo ============================================
echo  HECHO. Revisa Actions en GitHub.
echo ============================================
pause
