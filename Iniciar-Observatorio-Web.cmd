@echo off
setlocal
chcp 65001 > nul
set "SCRIPT=%~dp0scripts\start-web-share.ps1"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
exit /b %ERRORLEVEL%
