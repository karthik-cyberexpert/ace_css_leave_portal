# PowerShell script to start ACE CSS Leave Portal servers with port 80
# This script must be run as Administrator to bind to port 80

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator to use port 80!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use port 8085 instead (doesn't require admin):" -ForegroundColor Cyan
    Write-Host "Change port back to 8085 in vite.config.ts and run: npm run dev-full" -ForegroundColor White
    exit 1
}

Write-Host "✅ Running as Administrator - Starting servers..." -ForegroundColor Green

# Configure Windows Firewall for port 80
Write-Host "Configuring Windows Firewall for port 80..." -ForegroundColor Cyan
try {
    netsh advfirewall firewall add rule name="ACE CSS Port 80" dir=in action=allow protocol=TCP localport=80
    Write-Host "✅ Firewall configured for port 80" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Firewall configuration failed, but continuing..." -ForegroundColor Yellow
}

# Change to project directory
Set-Location "D:\copied"

Write-Host "Starting ACE CSS Leave Portal servers..." -ForegroundColor Green
Write-Host "Backend: http://192.168.46.89:3009" -ForegroundColor White  
Write-Host "Frontend: http://ace.cs.leaveportal.local (port 80)" -ForegroundColor White
Write-Host ""

# Start the development servers
try {
    npm run dev-full
} catch {
    Write-Host "❌ Failed to start servers" -ForegroundColor Red
    Write-Host "Make sure you're in the correct directory: D:\copied" -ForegroundColor Yellow
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
