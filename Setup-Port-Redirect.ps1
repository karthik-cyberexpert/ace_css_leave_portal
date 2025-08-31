# Setup-Port-Redirect.ps1 - Use Windows Port Proxy for redirection

Write-Host "?? Setting up Windows Port Proxy for Leave Portal" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
 = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
 = .IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not ) {
    Write-Host "? This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "   Please right-click PowerShell and 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "? Running as Administrator" -ForegroundColor Green
Write-Host ""

# Remove any existing port proxy rules
Write-Host "?? Removing existing port proxy rules..." -ForegroundColor Yellow
try {
    netsh interface portproxy delete v4tov4 listenport=80 2>
    Write-Host "? Cleaned existing rules" -ForegroundColor Green
} catch {
    Write-Host "??  No existing rules to clean" -ForegroundColor Gray
}

# Add new port proxy rule
Write-Host ""
Write-Host "?? Adding port proxy rule: 80 -> 8085..." -ForegroundColor Cyan
try {
    netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=8085 connectaddress=127.0.0.1
    if (1 -eq 0) {
        Write-Host "? Port proxy rule added successfully!" -ForegroundColor Green
    } else {
        throw "netsh command failed"
    }
} catch {
    Write-Host "? Failed to add port proxy rule: " -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Configure Windows Firewall
Write-Host ""
Write-Host "?? Configuring Windows Firewall..." -ForegroundColor Cyan
try {
    # Remove old rules
    netsh advfirewall firewall delete rule name="Leave Portal Port 80" 2>
    netsh advfirewall firewall delete rule name="Leave Portal Port 8085" 2>
    netsh advfirewall firewall delete rule name="Leave Portal Port 3009" 2>
    
    # Add new rules
    netsh advfirewall firewall add rule name="Leave Portal Port 80" dir=in action=allow protocol=TCP localport=80
    netsh advfirewall firewall add rule name="Leave Portal Port 8085" dir=in action=allow protocol=TCP localport=8085
    netsh advfirewall firewall add rule name="Leave Portal Port 3009" dir=in action=allow protocol=TCP localport=3009
    
    Write-Host "? Firewall rules configured" -ForegroundColor Green
} catch {
    Write-Host "? Failed to configure firewall: " -ForegroundColor Red
}

# Show current proxy rules
Write-Host ""
Write-Host "?? Current port proxy rules:" -ForegroundColor Yellow
netsh interface portproxy show all

Write-Host ""
Write-Host "?? Port redirection setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "?? Configuration Summary:" -ForegroundColor Yellow
Write-Host "   • Port 80 -> Port 8085 (automatic redirect)" -ForegroundColor White
Write-Host "   • Windows Firewall configured for ports 80, 8085, 3009" -ForegroundColor White
Write-Host ""
Write-Host "?? Access URLs:" -ForegroundColor Yellow
Write-Host "   • Main Access: http://192.168.46.89 (redirects to 8085)" -ForegroundColor White
Write-Host "   • Direct Frontend: http://192.168.46.89:8085" -ForegroundColor White
Write-Host "   • Backend API: http://192.168.46.89:3009" -ForegroundColor White
Write-Host ""
Write-Host "??  Important Notes:" -ForegroundColor Yellow
Write-Host "   • Make sure your frontend server is running on port 8085" -ForegroundColor White
Write-Host "   • Make sure your backend server is running on port 3009" -ForegroundColor White
Write-Host "   • Port redirection will work even after restart" -ForegroundColor White
Write-Host ""
Write-Host "?? To remove redirection later:" -ForegroundColor Gray
Write-Host "   netsh interface portproxy delete v4tov4 listenport=80" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
