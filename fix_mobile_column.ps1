# PowerShell script to fix the missing mobile column in staff table

Write-Host "Adding mobile column to staff table..." -ForegroundColor Yellow

# SQL commands to add the mobile column
$sqlCommands = @"
USE cyber_security_leave_portal;
ALTER TABLE staff ADD COLUMN mobile VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number' AFTER username;
SELECT 'Mobile column added successfully to staff table!' as STATUS;
DESCRIBE staff;
"@

# Save SQL to temporary file
$tempSqlFile = "D:\copied\temp_add_mobile.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "SQL commands created. Now running MySQL..." -ForegroundColor Green

try {
    # Try to run MySQL with password prompt
    Write-Host "Please enter your MySQL root password when prompted..." -ForegroundColor Cyan
    & mysql -u root -p -e $sqlCommands
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully added mobile column to staff table!" -ForegroundColor Green
        Write-Host "The staff update API should now work correctly." -ForegroundColor Green
    } else {
        Write-Host "❌ There was an error running the MySQL command." -ForegroundColor Red
        Write-Host "Please run this command manually in MySQL:" -ForegroundColor Yellow
        Write-Host $sqlCommands -ForegroundColor White
    }
} catch {
    Write-Host "❌ Error executing MySQL command: $($_)" -ForegroundColor Red
    Write-Host "Please run these commands manually in your MySQL client:" -ForegroundColor Yellow
    Write-Host $sqlCommands -ForegroundColor White
} finally {
    # Clean up temp file
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile -Force
    }
}

Write-Host "`n🔧 Next steps:" -ForegroundColor Blue
Write-Host "1. If the command succeeded, try updating staff records again" -ForegroundColor White
Write-Host "2. If it failed, copy and paste the SQL commands above into your MySQL client" -ForegroundColor White
Write-Host "3. Your staff update functionality should now work correctly" -ForegroundColor White
