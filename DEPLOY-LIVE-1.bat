@echo off
@echo on
REM ========================================================================
REM   ACE CSS LEAVE PORTAL - SINGLE PRODUCTION DEPLOYMENT SCRIPT
REM ========================================================================
REM   This script will make your website live on the internet
REM   Target IP: 210.212.246.131 (from .env.production)
REM   Frontend: http://210.212.246.131:8085
REM   Backend:  http://210.212.246.131:3009
REM   Database: localhost:3307
REM ========================================================================

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo                  DEPLOY LEAVE PORTAL LIVE ON INTERNET
echo ========================================================================
echo   Making your Leave Portal LIVE on the internet...
echo   Target: http://210.212.246.131:8085
echo ========================================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Please run this script from the Leave_portal directory.
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

if not exist ".env.production" (
    echo [ERROR] .env.production not found!
    echo This file contains your server configuration.
    echo.
    pause
    exit /b 1
)

echo [OK] Configuration files found
echo.

REM Read IP from .env.production
for /f "tokens=2 delims==" %%a in ('findstr "PUBLIC_IP=" .env.production') do set PUBLIC_IP=%%a
echo [INFO] Using IP address: !PUBLIC_IP!
echo.

REM Step 1: System Requirements Check
echo ========================================================================
echo [STEP 1] CHECKING SYSTEM REQUIREMENTS
echo ========================================================================

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
echo [OK] Node.js found: !NODE_VERSION!

REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm is not installed!
    echo Please install Node.js which includes npm.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
echo [OK] npm found: !NPM_VERSION!
echo.

REM Step 2: Database Check
echo ========================================================================
echo [STEP 2] CHECKING DATABASE CONNECTION
echo ========================================================================

netstat -an | findstr ":3307" >nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] MySQL might not be running on port 3307
    echo Please ensure MySQL is running before the website can work properly.
    echo.
    echo Do you want to continue anyway? (Y/N)
    set /p CONTINUE="Continue? "
    if /i "!CONTINUE!" neq "Y" (
        echo Deployment cancelled.
        pause
        exit /b 1
    )
) else (
    echo [OK] Database appears to be running on port 3307
)
echo.

REM Step 3: Install Dependencies
echo ========================================================================
echo [STEP 3] INSTALLING DEPENDENCIES
echo ========================================================================

echo Installing frontend dependencies...
npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    echo.
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

if not exist "backend" (
    echo [ERROR] Backend directory not found!
    pause
    exit /b 1
)

echo Installing backend dependencies...
pushd backend
npm install
set BACKEND_ERROR=!ERRORLEVEL!
popd

if !BACKEND_ERROR! neq 0 (
    echo [ERROR] Failed to install backend dependencies
    echo.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

REM Step 4: Build for Production
echo ========================================================================
echo [STEP 4] BUILDING FOR PRODUCTION
echo ========================================================================

echo Building frontend for production...
npm run build:prod
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed
    echo.
    pause
    exit /b 1
)
echo [OK] Frontend built successfully
echo.

REM Step 5: PM2 Setup
echo ========================================================================
echo [STEP 5] SETTING UP PROCESS MANAGER (PM2)
echo ========================================================================

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing PM2 globally...
    npm install -g pm2
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install PM2
        echo You may need to run this script as Administrator
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%a in ('pm2 --version') do set PM2_VERSION=%%a
echo [OK] PM2 ready: v!PM2_VERSION!
echo.

REM Step 6: Deploy Application
echo ========================================================================
echo [STEP 6] DEPLOYING APPLICATION
echo ========================================================================

echo Stopping any existing processes...
pm2 delete all >nul 2>&1
echo Previous processes cleaned up

if not exist "ecosystem.config.production.js" (
    echo [ERROR] ecosystem.config.production.js not found!
    echo This file is required for deployment.
    echo.
    pause
    exit /b 1
)

echo Starting production services...
pm2 start ecosystem.config.production.js --env production
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start services
    echo Checking PM2 logs for details:
    pm2 logs --err --lines 5 2>nul
    echo.
    pause
    exit /b 1
)

echo Saving PM2 configuration...
pm2 save >nul 2>&1
echo [OK] Services started successfully
echo.

REM Step 7: Configure Windows Firewall (Optional)
echo ========================================================================
echo [STEP 7] CONFIGURING FIREWALL (OPTIONAL)
echo ========================================================================

echo Do you want to configure Windows Firewall to allow access? (Y/N)
set /p FIREWALL="Configure firewall? "
if /i "!FIREWALL!" == "Y" (
    echo Configuring firewall rules...
    netsh advfirewall firewall add rule name="Leave Portal 8085" dir=in action=allow protocol=TCP localport=8085 >nul 2>&1
    netsh advfirewall firewall add rule name="Leave Portal 3009" dir=in action=allow protocol=TCP localport=3009 >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        echo [OK] Firewall rules added
    ) else (
        echo [WARNING] Failed to add firewall rules (may need Administrator)
        echo You can manually open ports 8085 and 3009 in Windows Firewall
    )
) else (
    echo [SKIPPED] Firewall configuration skipped
    echo Make sure ports 8085 and 3009 are accessible if needed
)
echo.

REM Step 8: Health Check
echo ========================================================================
echo [STEP 8] PERFORMING HEALTH CHECK
echo ========================================================================

echo Checking service status...
pm2 status
echo.

echo Testing local connectivity...
timeout /t 3 >nul

echo Checking backend health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3009/health' -TimeoutSec 5 -UseBasicParsing; Write-Host '[OK] Backend is responding' } catch { Write-Host '[WARNING] Backend may still be starting' }" 2>nul

echo Checking frontend...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8085' -TimeoutSec 5 -UseBasicParsing; Write-Host '[OK] Frontend is responding' } catch { Write-Host '[WARNING] Frontend may still be starting' }" 2>nul
echo.

REM Final Status
echo ========================================================================
echo                 DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================================================
echo.
echo Your ACE CSS Leave Portal is now LIVE on the internet!
echo.
echo ACCESS URLS:
echo   Main Portal:    http://!PUBLIC_IP!:8085
echo   API Backend:    http://!PUBLIC_IP!:3009
echo   Health Check:   http://!PUBLIC_IP!:3009/health
echo.
echo MANAGEMENT COMMANDS:
echo   Check Status:   pm2 status
echo   View Logs:      pm2 logs
echo   Restart:        pm2 restart all
echo   Stop:           pm2 stop all
echo.
echo DEFAULT LOGIN (CHANGE IMMEDIATELY):
echo   Username: admin
echo   Password: admin123
echo.
echo ========================================================================
echo         Your Leave Portal is ready for students and faculty!
echo ========================================================================
echo.
echo IMPORTANT NOTES:
echo - Students/Faculty can access: http://!PUBLIC_IP!:8085
echo - Change default admin password immediately
echo - Ensure MySQL database is properly configured
echo - Monitor logs with: pm2 logs
echo.
echo Press any key to exit...
pause >nul
