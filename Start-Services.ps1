# Start-Services.ps1 - Start all Leave Portal services

Write-Host "?? Starting ACE CSS Leave Portal Services..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
try {
     = node --version
    Write-Host "? Node.js found: " -ForegroundColor Green
} catch {
    Write-Host "? Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Function to check if port is available
function Test-Port {
    param()
     = Test-NetConnection -ComputerName localhost -Port  -InformationLevel Quiet -WarningAction SilentlyContinue
    return !
}

# Stop any existing Node.js processes on our ports
Write-Host "?? Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    .ProcessName -eq "node"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Start Backend Server (Port 3009)
Write-Host "?? Starting Backend Server on port 3009..." -ForegroundColor Cyan
 = Join-Path Microsoft.PowerShell.Core\FileSystem::\\192.168.46.89\d\Leave_portal "backend"
if (Test-Path ) {
    cd 
    Start-Process -FilePath "node" -ArgumentList "server.js" -WindowStyle Minimized
    cd ..
    Write-Host "? Backend server started" -ForegroundColor Green
} else {
    Write-Host "? Backend folder not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Start Frontend Server (Port 8085)
Write-Host "?? Starting Frontend Server on port 8085..." -ForegroundColor Cyan
if (Test-Path "package.json") {
    # Try to start with npm
    Start-Process -FilePath "npm" -ArgumentList "run", "preview" -WindowStyle Minimized
    Write-Host "? Frontend server started" -ForegroundColor Green
} else {
    Write-Host "? package.json not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 5

# Start Redirect Server (Port 80)
Write-Host "?? Starting Redirect Server on port 80..." -ForegroundColor Cyan
if (Test-Path "redirect-server.js") {
    Start-Process -FilePath "node" -ArgumentList "redirect-server.js" -Verb RunAs -WindowStyle Minimized
    Write-Host "? Redirect server started (requires admin)" -ForegroundColor Green
} else {
    Write-Host "? redirect-server.js not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "?? All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "?? Access URLs:" -ForegroundColor Yellow
Write-Host "   ?? Main Access (no port): http://192.168.46.89" -ForegroundColor White
Write-Host "   ?? Frontend Direct: http://192.168.46.89:8085" -ForegroundColor White
Write-Host "   ?? Backend API: http://192.168.46.89:3009" -ForegroundColor White
Write-Host "   ?? Health Check: http://192.168.46.89:3009/health" -ForegroundColor White
Write-Host ""
Write-Host "?? To check running services:" -ForegroundColor Gray
Write-Host "   netstat -ano | findstr \":80\|:3009\|:8085\"" -ForegroundColor Gray
Write-Host ""
Write-Host "??  Keep this PowerShell window open or services will stop!" -ForegroundColor Yellow

# Keep script running
Read-Host "Press Enter to stop all services"

# Cleanup
Write-Host "?? Stopping all services..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "? All services stopped" -ForegroundColor Green
