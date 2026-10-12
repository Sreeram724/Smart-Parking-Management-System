@echo off
title ParkPulse Full-Stack Launcher
echo ===================================================
echo 🚗 Launching ParkPulse Smart Parking Prototype
echo ===================================================

echo [*] Freeing ports 5000, 4000, 5173 from previous runs...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

timeout /t 1 /nobreak >nul

echo [1/3] Starting Python Flask API Backend (Port 5000)...
start "ParkPulse Backend (Flask:5000)" cmd /k "cd /d %~dp0backend-flask && python app.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Node.js Real-time Gateway (Port 4000)...
start "ParkPulse Realtime Gateway (Socket.io:4000)" cmd /k "cd /d %~dp0realtime-service && npm start"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend React Application (Port 5173)...
start "ParkPulse Frontend (Vite:5173)" cmd /k "cd /d %~dp0frontend-react && npm run dev -- --open"

echo.
echo ===================================================
echo  All 3 services are active!
echo  Frontend URL: http://localhost:5173
echo  Flask API:    http://localhost:5000/api
echo  WebSocket:    ws://localhost:4000
echo ===================================================
pause
