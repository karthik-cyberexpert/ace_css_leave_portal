# PowerShell script to configure Windows Firewall for ACE CSS Leave Portal LAN access
# Run this script as Administrator

Write-Host "=== Configuring Windows Firewall for ACE CSS Leave Portal ===" -ForegroundColor Green

try {
    # Allow backend server on port 3009
    netsh advfirewall firewall add rule name="ACE CSS Backend (3009)" dir=in action=allow protocol=TCP localport=3009
    Write-Host "✅ Added firewall rule for backend (port 3009)" -ForegroundColor Green
    
    # Allow frontend Vite server on port 8085
    netsh advfirewall firewall add rule name="ACE CSS Frontend (8085)" dir=in action=allow protocol=TCP localport=8085
    Write-Host "✅ Added firewall rule for Vite frontend (port 8085)" -ForegroundColor Green
    
    # Allow HTTP on port 80 (if needed later)
    netsh advfirewall firewall add rule name="ACE CSS HTTP (80)" dir=in action=allow protocol=TCP localport=80
    Write-Host "✅ Added firewall rule for HTTP (port 80)" -ForegroundColor Green
    
    # Allow Node.js executable
    $nodePath = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($nodePath) {
        netsh advfirewall firewall add rule name="Node.js for ACE CSS Portal" dir=in action=allow program="$nodePath"
        Write-Host "✅ Added firewall rule for Node.js: $nodePath" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Node.js executable not found in PATH" -ForegroundColor Yellow
    }
    
    Write-Host "`n🎉 Firewall configuration completed!" -ForegroundColor Green
    Write-Host "Your ACE CSS Leave Portal is now accessible from LAN devices." -ForegroundColor White
    
} catch {
    Write-Host "❌ Error configuring firewall: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please run this script as Administrator." -ForegroundColor Yellow
}

Write-Host "`n=== Access URLs ===" -ForegroundColor Cyan
Write-Host "Frontend (Main Website): http://192.168.46.89:8085" -ForegroundColor Green
Write-Host "Backend API: http://192.168.46.89:3009" -ForegroundColor Green
Write-Host "Custom Domain: http://ace.cs.leaveportal.local:8085" -ForegroundColor Yellow

Write-Host "`n=== Testing Commands ===" -ForegroundColor Blue
Write-Host "Test frontend: curl http://192.168.46.89:8085" -ForegroundColor White
Write-Host "Test backend: curl http://192.168.46.89:3009" -ForegroundColor White
Write-Host "Test domain: ping ace.cs.leaveportal.local" -ForegroundColor White
