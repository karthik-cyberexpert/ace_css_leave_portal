# ACE CSS Leave Portal - Configuration Verification Script
# PowerShell version for Windows environments

Write-Host "🔍 ACE CSS Leave Portal - Configuration Verification" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Green

$configOk = $true
$warnings = @()
$errors = @()

Write-Host "`n📋 Checking Configuration Files..." -ForegroundColor Cyan

# Check .env.production exists
if (Test-Path ".env.production") {
    Write-Host "✅ .env.production exists" -ForegroundColor Green
    
    # Read and parse .env.production
    $envContent = Get-Content ".env.production" -Raw
    
    # Check for your specific IP and ports
    if ($envContent -match "PUBLIC_IP=210\.212\.246\.131") {
        Write-Host "✅ Public IP is set to 210.212.246.131" -ForegroundColor Green
    } else {
        $errors += "❌ Public IP is not set to 210.212.246.131"
    }
    
    if ($envContent -match "FRONTEND_PORT=8085") {
        Write-Host "✅ Frontend port is set to 8085" -ForegroundColor Green
    } else {
        $errors += "❌ Frontend port is not set to 8085"
    }
    
    if ($envContent -match "BACKEND_PORT=3009") {
        Write-Host "✅ Backend port is set to 3009" -ForegroundColor Green
    } else {
        $errors += "❌ Backend port is not set to 3009"
    }
    
    if ($envContent -match "DB_PORT=3307") {
        Write-Host "✅ Database port is set to 3307" -ForegroundColor Green
    } else {
        $errors += "❌ Database port is not set to 3307"
    }
    
    if ($envContent -match "JWT_SECRET=") {
        Write-Host "✅ JWT Secret is configured" -ForegroundColor Green
    } else {
        $errors += "❌ JWT Secret is missing"
    }
    
} else {
    $errors += "❌ .env.production does not exist"
}

# Check configure-hosting.js exists
if (Test-Path "configure-hosting.js") {
    Write-Host "✅ configure-hosting.js exists" -ForegroundColor Green
    
    $configContent = Get-Content "configure-hosting.js" -Raw
    if ($configContent -match "210\.212\.246\.131") {
        Write-Host "✅ Configure script has your IP hardcoded" -ForegroundColor Green
    } else {
        $warnings += "⚠️ Configure script may not have hardcoded IP"
    }
} else {
    $errors += "❌ configure-hosting.js does not exist"
}

# Check PM2 ecosystem config
if (Test-Path "ecosystem.config.production.js") {
    Write-Host "✅ PM2 ecosystem config exists" -ForegroundColor Green
} else {
    $errors += "❌ ecosystem.config.production.js does not exist"
}

# Check Vite configs
if (Test-Path "vite.config.production.ts") {
    Write-Host "✅ Production Vite config exists" -ForegroundColor Green
} else {
    $warnings += "⚠️ vite.config.production.ts does not exist"
}

# Check backend server files
if (Test-Path "backend/server.production.js") {
    Write-Host "✅ Production backend server exists" -ForegroundColor Green
} else {
    $errors += "❌ backend/server.production.js does not exist"
}

# Check start scripts
if ((Test-Path "start-production.sh") -or (Test-Path "start-production.bat")) {
    Write-Host "✅ Start scripts exist" -ForegroundColor Green
} else {
    $warnings += "⚠️ No start scripts found"
}

# Display results
if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️ Warnings:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
}

if ($errors.Count -gt 0) {
    Write-Host "`n❌ Errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    Write-Host "`n🔧 Please fix the above errors before deployment." -ForegroundColor Red
    $configOk = $false
} elseif ($warnings.Count -gt 0) {
    Write-Host "`n✅ Configuration is valid with some warnings." -ForegroundColor Yellow
    Write-Host "🚀 You can proceed with deployment." -ForegroundColor Green
} else {
    Write-Host "`n🎉 Configuration is perfect! Ready to deploy." -ForegroundColor Green
}

Write-Host "`n📍 Expected URLs:" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://210.212.246.131:8085" -ForegroundColor White
Write-Host "🔧 Backend:  http://210.212.246.131:3009" -ForegroundColor White
Write-Host "📊 Database: localhost:3307" -ForegroundColor White

if ($configOk) {
    Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Ensure MySQL is running on port 3307" -ForegroundColor White
    Write-Host "2. Run: start-production.bat" -ForegroundColor White
    Write-Host "3. Check PM2 status with: pm2 status" -ForegroundColor White
    Write-Host "4. View logs with: pm2 logs" -ForegroundColor White
}

Write-Host "`n" -NoNewline
if ($configOk) {
    Write-Host "Configuration Status: " -NoNewline -ForegroundColor White
    Write-Host "READY FOR DEPLOYMENT ✅" -ForegroundColor Green
} else {
    Write-Host "Configuration Status: " -NoNewline -ForegroundColor White
    Write-Host "NEEDS FIXES ❌" -ForegroundColor Red
}

# Pause to allow reading
Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
