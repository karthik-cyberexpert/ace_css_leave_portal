@echo off
echo ========================================================
echo   ACE CSS Leave Portal - College Deployment Script
echo ========================================================
echo   IP: 210.212.246.131
echo   Frontend Port: 8085
echo   Backend Port: 3009  
echo   Database Port: 3307
echo ========================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found! Please run this script from the Leave_portal directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [INFO] Starting deployment process...
echo.

REM Step 1: Check Node.js
echo [STEP 1] Checking Node.js and npm...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed or not in PATH!
    echo Please install Node.js which includes npm
    pause
    exit /b 1
)

echo [OK] Node.js and npm are available
echo.

REM Step 2: Check MySQL
echo [STEP 2] Checking MySQL database...
netstat -an | findstr ":3307" >nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] MySQL might not be running on port 3307
    echo Please ensure MySQL is running on port 3307 before continuing
    echo.
    echo Press any key to continue anyway, or Ctrl+C to stop...
    pause >nul
)

echo [OK] Port 3307 appears to be in use (MySQL likely running)
echo.

REM Step 3: Install dependencies
echo [STEP 3] Installing frontend dependencies...
echo This may take a few minutes...
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [OK] Frontend dependencies installed
echo.

echo [STEP 4] Installing backend dependencies...
cd backend
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [OK] Backend dependencies installed
echo.

REM Step 4: Build frontend
echo [STEP 5] Building frontend for production...
npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to build frontend
    pause
    exit /b 1
)

echo [OK] Frontend built successfully
echo.

REM Step 5: Install PM2
echo [STEP 6] Installing PM2 process manager...
npm list -g pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing PM2...
    npm install -g pm2
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install PM2. You may need administrator privileges.
        echo Try running this script as administrator or install PM2 manually:
        echo npm install -g pm2
        pause
        exit /b 1
    )
)

echo [OK] PM2 is ready
echo.

REM Step 6: Deploy with PM2
echo [STEP 7] Deploying application with PM2...
echo Stopping any existing processes...
pm2 delete all >nul 2>&1

echo Starting new processes...
pm2 start ecosystem.config.production.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start services with PM2
    echo Check ecosystem.config.production.js exists and is valid
    pause
    exit /b 1
)

echo.
echo [STEP 8] Checking deployment status...
pm2 status

echo.
echo ========================================================
echo                 🎉 DEPLOYMENT COMPLETE! 🎉
echo ========================================================
echo.
echo Your Leave Portal is now running at:
echo   🌐 Frontend: http://210.212.246.131:8085
echo   🔧 Backend:  http://210.212.246.131:3009
echo.
echo Management Commands:
echo   📊 Check status:    pm2 status
echo   📝 View logs:       pm2 logs  
echo   🔄 Restart:         pm2 restart all
echo   🛑 Stop:            pm2 stop all
echo.
echo ========================================================
echo   College Leave Portal is LIVE! 🎓✨
echo ========================================================
echo.

echo Testing local connectivity...
echo Checking if frontend is responding...
curl -s http://localhost:8085 >nul 2>&1
if %ERRORLEVEL% eq 0 (
    echo [OK] Frontend is responding locally
) else (
    echo [INFO] Frontend may still be starting up
)

echo.
echo [IMPORTANT] For external access:
echo 1. Ensure Windows Firewall allows ports 8085 and 3009
echo 2. Contact college IT if external access is blocked
echo 3. Test from outside: http://210.212.246.131:8085
echo.

echo Deployment completed! Press any key to exit...
pause >nul
