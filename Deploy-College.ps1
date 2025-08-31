# ACE CSS Leave Portal - College Deployment Script (PowerShell)
# Works with network drives and UNC paths

Write-Host "========================================================"  -ForegroundColor Green
Write-Host "  ACE CSS Leave Portal - College Deployment Script"      -ForegroundColor Green
Write-Host "========================================================"  -ForegroundColor Green
Write-Host "  IP: 210.212.246.131"                                   -ForegroundColor Cyan
Write-Host "  Frontend Port: 8085"                                    -ForegroundColor Cyan  
Write-Host "  Backend Port: 3009"                                     -ForegroundColor Cyan
Write-Host "  Database Port: 3307"                                    -ForegroundColor Cyan
Write-Host "========================================================"  -ForegroundColor Green
Write-Host

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the Leave_portal directory." -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Starting deployment process..." -ForegroundColor Green
Write-Host

# Step 1: Check Node.js
Write-Host "[STEP 1] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Node.js not found" }
    Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "npm not found" }
    Write-Host "[OK] npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js which includes npm" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host

# Step 2: Check MySQL
Write-Host "[STEP 2] Checking MySQL database..." -ForegroundColor Yellow
$mysqlCheck = netstat -an | Select-String ":3307"
if (-not $mysqlCheck) {
    Write-Host "[WARNING] MySQL might not be running on port 3307" -ForegroundColor Yellow
    Write-Host "Please ensure MySQL is running on port 3307 before continuing" -ForegroundColor Yellow
    Write-Host
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Port 3307 is in use (MySQL likely running)" -ForegroundColor Green
}

Write-Host

# Step 3: Install frontend dependencies
Write-Host "[STEP 3] Installing frontend dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Cyan

try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host

# Step 4: Install backend dependencies
Write-Host "[STEP 4] Installing backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Push-Location "backend"
    try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "backend npm install failed" }
        Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
} else {
    Write-Host "[WARNING] Backend directory not found" -ForegroundColor Yellow
}

Write-Host

# Step 5: Build frontend
Write-Host "[STEP 5] Building frontend for production..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "build failed" }
    Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to build frontend" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host

# Step 6: Install PM2
Write-Host "[STEP 6] Installing PM2 process manager..." -ForegroundColor Yellow
try {
    $pm2Check = npm list -g pm2 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installing PM2..." -ForegroundColor Cyan
        npm install -g pm2
        if ($LASTEXITCODE -ne 0) { throw "PM2 install failed" }
    }
    Write-Host "[OK] PM2 is ready" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install PM2. You may need administrator privileges." -ForegroundColor Red
    Write-Host "Try running PowerShell as administrator or install PM2 manually:" -ForegroundColor Yellow
    Write-Host "npm install -g pm2" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host

# Step 7: Deploy with PM2
Write-Host "[STEP 7] Deploying application with PM2..." -ForegroundColor Yellow
Write-Host "Stopping any existing processes..." -ForegroundColor Cyan
pm2 delete all 2>$null

if (Test-Path "ecosystem.config.production.js") {
    Write-Host "Starting new processes..." -ForegroundColor Cyan
    try {
        pm2 start ecosystem.config.production.js
        if ($LASTEXITCODE -ne 0) { throw "PM2 start failed" }
    } catch {
        Write-Host "[ERROR] Failed to start services with PM2" -ForegroundColor Red
        Write-Host "Check ecosystem.config.production.js exists and is valid" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[ERROR] ecosystem.config.production.js not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host

# Step 8: Check status
Write-Host "[STEP 8] Checking deployment status..." -ForegroundColor Yellow
pm2 status

Write-Host
Write-Host "========================================================"  -ForegroundColor Green
Write-Host "                 🎉 DEPLOYMENT COMPLETE! 🎉"               -ForegroundColor Green  
Write-Host "========================================================"  -ForegroundColor Green
Write-Host
Write-Host "Your Leave Portal is now running at:" -ForegroundColor Cyan
Write-Host "  🌐 Frontend: http://210.212.246.131:8085" -ForegroundColor White
Write-Host "  🔧 Backend:  http://210.212.246.131:3009" -ForegroundColor White
Write-Host
Write-Host "Management Commands:" -ForegroundColor Cyan
Write-Host "  📊 Check status:    pm2 status" -ForegroundColor White
Write-Host "  📝 View logs:       pm2 logs" -ForegroundColor White
Write-Host "  🔄 Restart:         pm2 restart all" -ForegroundColor White
Write-Host "  🛑 Stop:            pm2 stop all" -ForegroundColor White
Write-Host
Write-Host "========================================================"  -ForegroundColor Green
Write-Host "   College Leave Portal is LIVE! 🎓✨"                    -ForegroundColor Green
Write-Host "========================================================"  -ForegroundColor Green
Write-Host

# Test connectivity
Write-Host "Testing local connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8085" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Frontend is responding locally" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Frontend may still be starting up" -ForegroundColor Yellow
}

Write-Host
Write-Host "[IMPORTANT] For external access:" -ForegroundColor Red
Write-Host "1. Ensure Windows Firewall allows ports 8085 and 3009" -ForegroundColor White
Write-Host "2. Contact college IT if external access is blocked" -ForegroundColor White  
Write-Host "3. Test from outside: http://210.212.246.131:8085" -ForegroundColor White
Write-Host

Write-Host "Deployment completed! Press Enter to exit..." -ForegroundColor Green
Read-Host
