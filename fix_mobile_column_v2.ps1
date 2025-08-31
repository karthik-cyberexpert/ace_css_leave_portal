# PowerShell script to fix the missing mobile column in staff table

Write-Host "Adding mobile column to staff table..." -ForegroundColor Yellow

# SQL commands to add the mobile column
$sqlCommand = "USE cyber_security_leave_portal; ALTER TABLE staff ADD COLUMN mobile VARCHAR(20) DEFAULT NULL COMMENT 'Mobile phone number' AFTER username; SELECT 'Mobile column added successfully!' as STATUS; DESCRIBE staff;"

Write-Host "Running MySQL command..." -ForegroundColor Green

try {
    # Try to run MySQL with password prompt
    Write-Host "Please enter your MySQL root password when prompted..." -ForegroundColor Cyan
    & mysql -u root -p -e $sqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success! Mobile column added to staff table!" -ForegroundColor Green
        Write-Host "The staff update API should now work correctly." -ForegroundColor Green
    } else {
        Write-Host "Error running the MySQL command." -ForegroundColor Red
        Write-Host "Please run this command manually in MySQL:" -ForegroundColor Yellow
        Write-Host $sqlCommand -ForegroundColor White
    }
} catch {
    Write-Host "Error executing MySQL: $_" -ForegroundColor Red
    Write-Host "Please run this command manually:" -ForegroundColor Yellow
    Write-Host $sqlCommand -ForegroundColor White
}

Write-Host "`nNext steps:" -ForegroundColor Blue
Write-Host "1. If successful, try updating staff records again" -ForegroundColor White
Write-Host "2. If failed, run the SQL command manually in MySQL client" -ForegroundColor White
