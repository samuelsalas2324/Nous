@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Subiendo Nous a GitHub: samuelsalas2324
echo ============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git no esta instalado. Descargalo en https://git-scm.com/download/win
  echo y vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

set GE=
for /f "delims=" %%i in ('git config --global user.email') do set GE=%%i
if not defined GE (
  echo Primero configura tu identidad de Git, una sola vez:
  echo   git config --global user.name "Tu Nombre"
  echo   git config --global user.email "tu-correo@ejemplo.com"
  echo Luego vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

if not exist .git git init -b main
git add .
git commit -m "Nous: landing y cerebro de IA"

where gh >nul 2>nul
if errorlevel 1 goto sin_gh

gh auth status >nul 2>nul
if errorlevel 1 gh auth login
gh repo create samuelsalas2324/nous-site --private --source=. --push
goto fin

:sin_gh
echo.
echo No tienes GitHub CLI. Haz esto:
echo   1. Crea un repositorio VACIO llamado nous-site en https://github.com/new
echo      sin README, sin .gitignore y sin licencia. Marcalo como privado.
echo   2. Ejecuta en esta carpeta:
echo        git remote add origin https://github.com/samuelsalas2324/nous-site.git
echo        git push -u origin main

:fin
echo.
pause
