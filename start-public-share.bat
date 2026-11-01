@echo off
title AI Smart Learning System - Public Internet Share
color 0a

echo =========================================================
echo    AI Smart Learning System - Public Online Sharer
echo =========================================================
echo.

cd /d "%~dp0"

echo Starting server...
start "" /b node src/server.js
timeout /t 2 /nobreak >nul

echo Starting Public Tunnel...
echo Anyone in the world can access your website through this link!
echo.

call npx.cmd --yes localtunnel --port 3000
pause
