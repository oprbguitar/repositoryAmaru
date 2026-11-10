@echo off
setlocal
chcp 65001 > nul
rem Doble clic: ver docs/local-development.md
set "SCRIPT=%~dp0scripts\stop-local-server.ps1"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "CODE=%ERRORLEVEL%"
if not "%CODE%"=="0" pause
exit /b %CODE%
