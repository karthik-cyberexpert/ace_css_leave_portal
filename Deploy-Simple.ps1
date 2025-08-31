# ACE CSS Leave Portal - Simple Deployment Script
Write-Host "========================================================"
Write-Host "  ACE CSS Leave Portal - College Deployment" 
Write-Host "  IP: 210.212.246.131 | Ports: 8085, 3009, 3307"
Write-Host "========================================================"
Write-Host

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found!" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Starting deployment process..." -ForegroundColor Green

# Step 1: Check Node.js and npm
Write-Host "[STEP 1] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Node.js not found" }
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found! Install from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $npmVersion = & npm --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "npm not found" }
    Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm not found! Install Node.js" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Check MySQL
Write-Host "[STEP 2] Checking MySQL on port 3307..." -ForegroundColor Yellow
$mysqlCheck = netstat -an | Select-String ":3307"
if ($mysqlCheck) {
    Write-Host "[OK] MySQL is running on port 3307" -ForegroundColor Green
} else {
    Write-Host "[WARNING] MySQL might not be running on port 3307" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        exit 1
    }
}

# Step 3: Install dependencies
Write-Host "[STEP 3] Installing frontend dependencies..." -ForegroundColor Yellow
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green

# Step 4: Backend dependencies
Write-Host "[STEP 4] Installing backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Push-Location "backend"
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install backend dependencies" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
}

# Step 5: Build frontend
Write-Host "[STEP 5] Building frontend..." -ForegroundColor Yellow
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to build frontend" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Frontend built successfully" -ForegroundColor Green

# Step 6: Install PM2
Write-Host "[STEP 6] Installing PM2..." -ForegroundColor Yellow
$pm2Check = & npm list -g pm2 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing PM2 globally..." -ForegroundColor Cyan
    & npm install -g pm2
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install PM2. Run as Administrator" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host "[OK] PM2 ready" -ForegroundColor Green

# Step 7: Deploy with PM2
Write-Host "[STEP 7] Deploying with PM2..." -ForegroundColor Yellow
& pm2 delete all 2>$null

if (Test-Path "ecosystem.config.production.js") {
    & pm2 start ecosystem.config.production.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to start with PM2" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[ERROR] ecosystem.config.production.js not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 8: Show status
Write-Host "[STEP 8] Checking status..." -ForegroundColor Yellow
& pm2 status

Write-Host
Write-Host "========================================================"
Write-Host "                DEPLOYMENT COMPLETE!"
Write-Host "========================================================"
Write-Host "Your Leave Portal is running at:" -ForegroundColor Green
Write-Host "  Frontend: http://210.212.246.131:8085" -ForegroundColor Cyan
Write-Host "  Backend:  http://210.212.246.131:3009" -ForegroundColor Cyan
Write-Host
Write-Host "Management Commands:" -ForegroundColor Yellow
Write-Host "  Check status: pm2 status"
Write-Host "  View logs:    pm2 logs"
Write-Host "  Restart:      pm2 restart all"
Write-Host "  Stop:         pm2 stop all"
Write-Host "========================================================"

Read-Host "Press Enter to finish"
