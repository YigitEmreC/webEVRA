@echo off
rem Double-click to preview the website on this computer.
rem Needs Python (https://www.python.org/downloads/). Close the window to stop.
title Website preview
cd /d "%~dp0"

set "PY="
py -3 --version >nul 2>&1 && set "PY=py -3"
if not defined PY python --version >nul 2>&1 && set "PY=python"

if not defined PY (
  echo.
  echo   Python is needed to preview the website.
  echo   Install it from https://www.python.org/downloads/
  echo   and tick "Add python.exe to PATH" during setup. Then try again.
  echo.
  pause
  exit /b 1
)

%PY% tools\serve.py %*
if errorlevel 1 pause
