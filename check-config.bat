@echo off
echo =======================================================
echo  ACE CSS Leave Portal - Configuration Verification
echo =======================================================
echo.

set CONFIG_OK=1

echo Checking Configuration Files...
echo.

REM Check .env.production exists
if exist .env.production (
    echo [OK] .env.production exists
    findstr /C:"PUBLIC_IP=210.212.246.131" .env.production >nul
    if %ERRORLEVEL%==0 (
        echo [OK] Public IP is set to 210.212.246.131
    ) else (
        echo [ERROR] Public IP is not set to 210.212.246.131
        set CONFIG_OK=0
    )
    
    findstr /C:"FRONTEND_PORT=8085" .env.production >nul
    if %ERRORLEVEL%==0 (
        echo [OK] Frontend port is set to 8085
    ) else (
        echo [ERROR] Frontend port is not set to 8085
        set CONFIG_OK=0
    )
    
    findstr /C:"BACKEND_PORT=3009" .env.production >nul
    if %ERRORLEVEL%==0 (
        echo [OK] Backend port is set to 3009
    ) else (
        echo [ERROR] Backend port is not set to 3009
        set CONFIG_OK=0
    )
    
    findstr /C:"DB_PORT=3306" .env.production >nul
    if %ERRORLEVEL%==0 (
        echo [OK] Database port is set to 3306
    ) else (
        echo [ERROR] Database port is not set to 3306
        set CONFIG_OK=0
    )
) else (
    echo [ERROR] .env.production does not exist
    set CONFIG_OK=0
)

REM Check configure-hosting.js exists
if exist configure-hosting.js (
    echo [OK] configure-hosting.js exists
) else (
    echo [ERROR] configure-hosting.js does not exist
    set CONFIG_OK=0
)

REM Check PM2 ecosystem config
if exist ecosystem.config.production.js (
    echo [OK] PM2 ecosystem config exists
) else (
    echo [ERROR] ecosystem.config.production.js does not exist
    set CONFIG_OK=0
)

REM Check backend server files
if exist backend\server.production.js (
    echo [OK] Production backend server exists
) else (
    echo [ERROR] backend\server.production.js does not exist
    set CONFIG_OK=0
)

REM Check start scripts
if exist start-production.bat (
    echo [OK] Start scripts exist
) else (
    echo [WARN] No start scripts found
)

echo.
echo Expected URLs:
echo Frontend: http://210.212.246.131:8085
echo Backend:  http://210.212.246.131:3009
echo Database: localhost:3306
echo.

if %CONFIG_OK%==1 (
    echo Configuration Status: READY FOR DEPLOYMENT
    echo.
    echo Next Steps:
    echo 1. Ensure MySQL is running on port 3306
    echo 2. Run: start-production.bat
    echo 3. Check PM2 status with: pm2 status
    echo 4. View logs with: pm2 logs
) else (
    echo Configuration Status: NEEDS FIXES
    echo Please fix the above errors before deployment.
)

echo.
pause
