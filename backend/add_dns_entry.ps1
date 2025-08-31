# PowerShell script to add ace.cs.leaveportal.local to hosts file
# Run as Administrator to enable DNS resolution for public access

Write-Host "=== ACE CSS Leave Portal DNS Setup ==="
Write-Host "Setting up DNS resolution for ace.cs.leaveportal.local"
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$serverIP = "210.212.246.131"
$dnsName = "ace.cs.leaveportal.local"
$dnsEntry = "$serverIP $dnsName"

# Test connectivity to server first
Write-Host "Testing connectivity to server ($serverIP)..."
try {
    $pingResult = Test-NetConnection -ComputerName $serverIP -InformationLevel Quiet
    if ($pingResult) {
        Write-Host "✓ Server is reachable" -ForegroundColor Green
    } else {
        Write-Host "✗ Cannot reach server at $serverIP" -ForegroundColor Red
        Write-Host "Please check your network connection" -ForegroundColor Yellow
        Read-Host "Press Enter to continue anyway"
    }
} catch {
    Write-Host "Warning: Could not test connectivity" -ForegroundColor Yellow
}

# Backup hosts file
$backupPath = "$hostsPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
try {
    Copy-Item $hostsPath $backupPath
    Write-Host "✓ Hosts file backed up to: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not create backup" -ForegroundColor Yellow
}

# Check if entry already exists
$hostsContent = Get-Content $hostsPath
$entryExists = $false
foreach ($line in $hostsContent) {
    if ($line -match $dnsName -and $line -match $serverIP) {
        $entryExists = $true
        break
    }
}

if (-not $entryExists) {
    Write-Host "Adding DNS entry for $dnsName..."
    try {
        Add-Content -Path $hostsPath -Value ""
        Add-Content -Path $hostsPath -Value "# ACE CSS Leave Portal - Public Access (Added $(Get-Date))"
        Add-Content -Path $hostsPath -Value $dnsEntry
        Write-Host "✓ DNS entry added successfully!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to add DNS entry: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✓ DNS entry already exists in hosts file" -ForegroundColor Green
}

# Flush DNS cache
Write-Host "Flushing DNS cache..."
try {
    ipconfig /flushdns | Out-Null
    Write-Host "✓ DNS cache flushed" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not flush DNS cache" -ForegroundColor Yellow
}

# Test DNS resolution
Write-Host "Testing DNS resolution..."
try {
    $resolved = [System.Net.Dns]::GetHostAddresses($dnsName)
    if ($resolved -and $resolved[0].ToString() -eq $serverIP) {
        Write-Host "✓ DNS resolution working: $dnsName -> $serverIP" -ForegroundColor Green
    } else {
        Write-Host "✗ DNS resolution failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ DNS resolution test failed: $_" -ForegroundColor Red
}

# Test HTTP connectivity
Write-Host "Testing HTTP connectivity..."
try {
    $webTest = Test-NetConnection -ComputerName $dnsName -Port 80 -InformationLevel Quiet
    if ($webTest) {
        Write-Host "✓ HTTP connection successful" -ForegroundColor Green
        Write-Host "" 
        Write-Host "SUCCESS! You can now access:" -ForegroundColor Green
        Write-Host "  http://$dnsName" -ForegroundColor Cyan
    } else {
        Write-Host "✗ HTTP connection failed" -ForegroundColor Red
        Write-Host "The DNS is resolved but the web server is not accessible" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Could not test HTTP connectivity" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"
