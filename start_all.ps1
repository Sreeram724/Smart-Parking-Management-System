Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🚗 Launching ParkPulse Smart Parking Prototype" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Clean up any existing stale processes on ports 5000, 4000, 5173
Write-Host "[*] Checking and freeing ports 5000, 4000, and 5173..." -ForegroundColor Gray
foreach ($port in @(5000, 4000, 5173)) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Milliseconds 800

Write-Host "[1/3] Starting Python Flask API Backend (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend-flask'; python app.py"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Node.js Real-time Gateway (Port 4000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\realtime-service'; npm start"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting Frontend React Application (Port 5173)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend-react'; npm run dev -- --open"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "🚀 All services launched in dedicated consoles!" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173"
Write-Host "Flask API: http://localhost:5000/api"
Write-Host "Socket.io: ws://localhost:4000"
Write-Host "===================================================" -ForegroundColor Green
