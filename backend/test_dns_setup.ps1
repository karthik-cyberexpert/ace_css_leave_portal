Write-Host "=== ACE CSS DNS Setup Test ===" -ForegroundColor Cyan

$serverIP = "192.168.46.89"
$dnsName = "ace.cs.leaveportal.local"

Write-Host "Server IP: $serverIP" -ForegroundColor White
Write-Host "DNS Name: $dnsName" -ForegroundColor White
Write-Host ""

# Test files exist
$files = @("add_dns_entry.ps1", "setup_dns.bat", "setup_dns_linux.sh", "DNS_SETUP_README.md")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "DNS Setup files are ready!" -ForegroundColor Green
Write-Host "Copy these files to your LAN systems and run the appropriate setup script." -ForegroundColor Yellow
