# Quick-Start.ps1 - Install dependencies and start all services

Write-Host "?? ACE CSS Leave Portal - Quick Start Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check Node.js
try {
     = node --version
    Write-Host "? Node.js found: " -ForegroundColor Green
} catch {
    Write-Host "? Node.js not found! Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "?? Installing frontend dependencies..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    npm install
    if (1 -eq 0) {
        Write-Host "? Frontend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "? Failed to install frontend dependencies" -ForegroundColor Red
    }
} else {
    Write-Host "? package.json not found!" -ForegroundColor Red
}

# Install backend dependencies
Write-Host ""
Write-Host "?? Installing backend dependencies..." -ForegroundColor Cyan
if (Test-Path "backend/package.json") {
    cd backend
    npm install
    if (1 -eq 0) {
        Write-Host "? Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "? Failed to install backend dependencies" -ForegroundColor Red
    }
    cd ..
} else {
    Write-Host "? backend/package.json not found!" -ForegroundColor Red
}

# Build frontend for production
Write-Host ""
Write-Host "??? Building frontend for production..." -ForegroundColor Cyan
npm run build
if (1 -eq 0) {
    Write-Host "? Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "?? Frontend build had issues, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "?? Cleaning up existing Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "?? Starting services..." -ForegroundColor Green

# Start Backend Server
Write-Host "?? Starting Backend Server (port 3009)..." -ForegroundColor Cyan
if (Test-Path "backend/server.js") {
     = Start-Job -ScriptBlock {
        param()
        Set-Location 
        cd backend
        node server.js
    } -ArgumentList Microsoft.PowerShell.Core\FileSystem::\\192.168.46.89\d\Leave_portal
    Write-Host "? Backend server starting..." -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "? Backend server not found!" -ForegroundColor Red
}

# Start Frontend Server
Write-Host "?? Starting Frontend Server (port 8085)..." -ForegroundColor Cyan
 = Start-Job -ScriptBlock {
    param()
    Set-Location 
    npm run preview -- --host 0.0.0.0 --port 8085
} -ArgumentList Microsoft.PowerShell.Core\FileSystem::\\192.168.46.89\d\Leave_portal
Write-Host "? Frontend server starting..." -ForegroundColor Green
Start-Sleep -Seconds 5

# Check if services are running
Write-Host ""
Write-Host "?? Checking services..." -ForegroundColor Cyan

 = Get-NetTCPConnection -LocalPort 3009 -ErrorAction SilentlyContinue
 = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue

if () {
    Write-Host "? Backend running on port 3009" -ForegroundColor Green
} else {
    Write-Host "? Backend not running on port 3009" -ForegroundColor Red
}

if () {
    Write-Host "? Frontend running on port 8085" -ForegroundColor Green
} else {
    Write-Host "? Frontend not running on port 8085" -ForegroundColor Red
}

# Start Redirect Server
Write-Host ""
Write-Host "?? Starting Redirect Server (port 80)..." -ForegroundColor Cyan
Write-Host "??  This requires Administrator privileges!" -ForegroundColor Yellow

try {
     = Start-Job -ScriptBlock {
        param()
        Set-Location 
        node redirect-server.js
    } -ArgumentList Microsoft.PowerShell.Core\FileSystem::\\192.168.46.89\d\Leave_portal -RunAs32
    Write-Host "? Redirect server starting..." -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "? Failed to start redirect server. Try running as Administrator." -ForegroundColor Red
    Write-Host "   You can start it manually: node redirect-server.js" -ForegroundColor Gray
}

Write-Host ""
Write-Host "?? Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "?? Access URLs:" -ForegroundColor Yellow
Write-Host "   ?? Main Access: http://192.168.46.89" -ForegroundColor White
Write-Host "   ?? Frontend Direct: http://192.168.46.89:8085" -ForegroundColor White  
Write-Host "   ?? Backend API: http://192.168.46.89:3009" -ForegroundColor White
Write-Host "   ?? Health Check: http://192.168.46.89:3009/health" -ForegroundColor White
Write-Host ""
Write-Host "?? Manual Commands:" -ForegroundColor Gray
Write-Host "   Check ports: netstat -ano | findstr \":80\|:3009\|:8085\"" -ForegroundColor Gray
Write-Host "   Start redirect: node redirect-server.js (as admin)" -ForegroundColor Gray
Write-Host ""

# Wait for user input to stop services
Read-Host "Services are running! Press Enter to stop all services"

# Cleanup
Write-Host "?? Stopping all services..." -ForegroundColor Yellow
Get-Job | Stop-Job
Get-Job | Remove-Job
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "? All services stopped" -ForegroundColor Green
