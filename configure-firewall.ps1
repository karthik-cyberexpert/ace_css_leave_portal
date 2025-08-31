# PowerShell script to configure Windows Firewall for ACE CSS Leave Portal LAN access
# Run this script as Administrator

Write-Host "=== Configuring Windows Firewall for LAN Access ===" -ForegroundColor Green

try {
    # Allow Node.js server on port 3009
    netsh advfirewall firewall add rule name="ACE CSS Leave Portal Backend" dir=in action=allow protocol=TCP localport=3009
    Write-Host "✅ Added firewall rule for backend (port 3009)" -ForegroundColor Green
    
    # Allow frontend server on port 80 (if needed)
    netsh advfirewall firewall add rule name="ACE CSS Leave Portal Frontend HTTP" dir=in action=allow protocol=TCP localport=80
    Write-Host "✅ Added firewall rule for frontend HTTP (port 80)" -ForegroundColor Green
    
    # Allow frontend server on port 8085 (common development port)
    netsh advfirewall firewall add rule name="ACE CSS Leave Portal Frontend Dev" dir=in action=allow protocol=TCP localport=8085
    Write-Host "✅ Added firewall rule for frontend development (port 8085)" -ForegroundColor Green
    
    # Allow Node.js executable
    $nodePath = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($nodePath) {
        netsh advfirewall firewall add rule name="Node.js for ACE CSS Portal" dir=in action=allow program="$nodePath"
        Write-Host "✅ Added firewall rule for Node.js executable: $nodePath" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node.js executable not found in PATH" -ForegroundColor Yellow
    }
    
    Write-Host "`n🎉 Firewall configuration completed!" -ForegroundColor Green
    Write-Host "Your ACE CSS Leave Portal is now accessible from other devices on your LAN." -ForegroundColor White
    
} catch {
    Write-Host "❌ Error configuring firewall: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please run this script as Administrator." -ForegroundColor Yellow
}

Write-Host "`n=== Manual Commands (if script fails) ===" -ForegroundColor Cyan
Write-Host "Run these commands as Administrator:" -ForegroundColor White
Write-Host "netsh advfirewall firewall add rule name=`"ACE CSS Backend`" dir=in action=allow protocol=TCP localport=3009" -ForegroundColor Yellow
Write-Host "netsh advfirewall firewall add rule name=`"ACE CSS Frontend`" dir=in action=allow protocol=TCP localport=80" -ForegroundColor Yellow
