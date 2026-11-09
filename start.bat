@echo off
title Foto GPS - Server
echo Memulai server Foto GPS...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan! Silakan install Node.js terlebih dahulu.
    pause
    exit /b
)
node server.js
pause
