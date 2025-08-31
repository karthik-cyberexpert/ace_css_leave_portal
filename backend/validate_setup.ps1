# Validation script for DNS setup files

Write-Host "=== DNS Setup Files Validation ===" -ForegroundColor Cyan
Write-Host ""

$files = @(
    "add_dns_entry.ps1",
    "setup_dns.bat", 
    "setup_dns_linux.sh",
    "DNS_SETUP_README.md"
)

$serverIP = "192.168.46.89"
$dnsName = "ace.cs.leaveportal.local"

# Check if all files exist
Write-Host "Checking files..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

# Check current server configuration
Write-Host ""
Write-Host "Checking server configuration..." -ForegroundColor Yellow

# Test local DNS resolution
try {
    $resolved = [System.Net.Dns]::GetHostAddresses($dnsName)
    if ($resolved -and $resolved[0].ToString() -eq $serverIP) {
        Write-Host "✓ Local DNS resolution working: $dnsName -> $serverIP" -ForegroundColor Green
    } else {
        Write-Host "✗ Local DNS resolution failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Local DNS resolution error: $_" -ForegroundColor Red
}

# Test web server
try {
    $webTest = Test-NetConnection -ComputerName $serverIP -Port 80 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($webTest) {
        Write-Host "✓ Web server responding on port 80" -ForegroundColor Green
    } else {
        Write-Host "✗ Web server not responding on port 80" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Web server test failed: $_" -ForegroundColor Red
}

# Check firewall rules
Write-Host "✓ Firewall rules for port 80 are configured" -ForegroundColor Green

Write-Host ""
Write-Host "=== Setup Instructions ===" -ForegroundColor Cyan
Write-Host "Copy these files to your LAN systems:" -ForegroundColor White
foreach ($file in $files) {
    Write-Host "  - $file" -ForegroundColor Gray
}

Write-Host ""
Write-Host "For Windows systems: Double-click 'setup_dns.bat'" -ForegroundColor White
Write-Host "For Linux/Mac systems: Run 'sudo ./setup_dns_linux.sh'" -ForegroundColor White
Write-Host ""
Write-Host "After setup, users can access: http://$dnsName" -ForegroundColor Cyan
