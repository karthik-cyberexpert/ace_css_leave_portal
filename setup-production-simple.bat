@echo off
echo ACE CSS Leave Portal - Production Setup
echo =========================================
echo.
echo This script will make your Leave Portal web-ready for public access
echo.
pause

echo.
echo Step 1: Installing production dependencies...
call npm install dotenv express-rate-limit helmet compression --save
if errorlevel 1 (
    echo Failed to install dependencies. Please check Node.js installation.
    pause
    exit /b 1
)

echo.
echo Step 2: Running production setup...
node scripts/setup-production.js

echo.
echo Setup complete! Check the generated files:
echo - .env.production (configured with your IP)
echo - start-production.bat (to start the server)
echo - configure-firewall.ps1 (to open firewall ports)
echo - check-status.bat (to test connectivity)
echo.
echo IMPORTANT: Run configure-firewall.ps1 as Administrator to open firewall ports
echo.
pause
