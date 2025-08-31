@echo off
:: =====================================================
:: ACE CSS LEAVE PORTAL - PRODUCTION PREPARATION SCRIPT
:: =====================================================
:: This script prepares the Leave Portal for production deployment
:: Run this on Windows before copying to your Linux server

echo.
echo 🚀 ACE CSS Leave Portal - Production Preparation
echo ================================================
echo.

:: Set the directory to the script location
cd /d "%~dp0"

:: Colors not available in Windows batch, using simple echo
echo [INFO] Preparing Leave Portal for production deployment...

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo [INFO] Node.js found: 
node --version

:: Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo [INFO] npm found:
npm --version

:: Prompt for public IP address
echo.
echo [INPUT] Please enter your college server's PUBLIC IP address:
set /p PUBLIC_IP="Public IP: "

if "%PUBLIC_IP%"=="" (
    echo [ERROR] No IP address provided. Cannot continue.
    pause
    exit /b 1
)

echo [INFO] Using IP address: %PUBLIC_IP%

:: Create production environment file
echo [STEP] Creating production environment configuration...

(
echo # =====================================================
echo # ACE CSS LEAVE PORTAL - PRODUCTION CONFIGURATION
echo # =====================================================
echo # Generated on %date% %time%
echo.
echo # Database Configuration
echo DB_HOST=localhost
echo DB_USER=root
echo DB_PASSWORD=your_secure_mysql_password_here
echo DB_NAME=cyber_security_leave_portal
echo DB_PORT=3307
echo.
echo # JWT Configuration - IMPORTANT: Change this to a strong secret
echo JWT_SECRET=ACE_CSS_LEAVE_PORTAL_JWT_SECRET_PRODUCTION_2025
echo.
echo # Server Configuration
echo PORT=3009
echo NODE_ENV=production
echo HOST=0.0.0.0
echo.
echo # Public IP Configuration
echo PUBLIC_IP=%PUBLIC_IP%
echo DOMAIN=%PUBLIC_IP%
echo.
echo # Frontend Configuration
echo VITE_API_URL=http://%PUBLIC_IP%:3009
echo.
echo # CORS Origins
echo CORS_ORIGIN=http://%PUBLIC_IP%:8085,http://%PUBLIC_IP%:3000,http://localhost:8085
echo.
echo # Security Settings
echo SECURE_COOKIES=false
echo TRUST_PROXY=true
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # File Upload Settings
echo MAX_FILE_SIZE=10485760
echo UPLOAD_PATH=/uploads
echo.
echo # Session Settings
echo SESSION_TIMEOUT=86400000
echo.
echo # Email Configuration ^(Optional^)
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USER=your_email@gmail.com
echo SMTP_PASS=your_app_password
echo SMTP_FROM=your_email@gmail.com
) > .env.production

echo [INFO] Production environment file created: .env.production

:: Install dependencies
echo [STEP] Installing dependencies...
npm install

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo [INFO] Dependencies installed successfully

:: Build frontend for production
echo [STEP] Building frontend for production...
npm run build:prod

if errorlevel 1 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)

echo [INFO] Frontend build completed successfully

:: Create PM2 ecosystem file
echo [STEP] Creating PM2 ecosystem configuration...

(
echo module.exports = {
echo   apps: [
echo     {
echo       name: 'ace-css-leave-portal-backend',
echo       script: './backend/server.production.js',
echo       instances: 'max',
echo       exec_mode: 'cluster',
echo       env: {
echo         NODE_ENV: 'production',
echo         PORT: 3009,
echo         PUBLIC_IP: '%PUBLIC_IP%'
echo       },
echo       env_production: {
echo         NODE_ENV: 'production',
echo         PORT: 3009,
echo         PUBLIC_IP: '%PUBLIC_IP%'
echo       },
echo       error_file: './logs/backend-error.log',
echo       out_file: './logs/backend-out.log',
echo       log_file: './logs/backend-combined.log',
echo       time: true,
echo       max_memory_restart: '1G',
echo       restart_delay: 4000,
echo       max_restarts: 10,
echo       min_uptime: '10s'
echo     },
echo     {
echo       name: 'ace-css-leave-portal-frontend',
echo       script: 'npx',
echo       args: 'vite preview --config vite.config.production.ts',
echo       instances: 1,
echo       exec_mode: 'fork',
echo       env: {
echo         NODE_ENV: 'production',
echo         VITE_API_URL: 'http://%PUBLIC_IP%:3009',
echo         PUBLIC_IP: '%PUBLIC_IP%'
echo       },
echo       error_file: './logs/frontend-error.log',
echo       out_file: './logs/frontend-out.log',
echo       log_file: './logs/frontend-combined.log',
echo       time: true,
echo       max_memory_restart: '500M',
echo       restart_delay: 4000,
echo       max_restarts: 10,
echo       min_uptime: '10s'
echo     }
echo   ]
echo };
) > ecosystem.config.production.js

echo [INFO] PM2 ecosystem configuration created

:: Create management scripts for Linux
echo [STEP] Creating Linux management scripts...

:: Create start script
(
echo #!/bin/bash
echo echo "Starting ACE CSS Leave Portal..."
echo pm2 start ecosystem.config.production.js --env production
echo pm2 save
echo echo "✅ ACE CSS Leave Portal started successfully!"
echo echo "🌐 Frontend: http://%PUBLIC_IP%:8085"
echo echo "🔧 Backend API: http://%PUBLIC_IP%:3009"
echo echo "📊 Health Check: http://%PUBLIC_IP%:3009/health"
echo echo "📋 PM2 Status: pm2 status"
) > start-production.sh

:: Create stop script
(
echo #!/bin/bash
echo echo "Stopping ACE CSS Leave Portal..."
echo pm2 stop ecosystem.config.production.js
echo echo "✅ ACE CSS Leave Portal stopped"
) > stop-production.sh

:: Create restart script
(
echo #!/bin/bash
echo echo "Restarting ACE CSS Leave Portal..."
echo pm2 restart ecosystem.config.production.js --env production
echo echo "✅ ACE CSS Leave Portal restarted"
) > restart-production.sh

:: Create status script
(
echo #!/bin/bash
echo echo "ACE CSS Leave Portal Status:"
echo echo "============================"
echo pm2 status
echo echo ""
echo echo "🌐 Frontend: http://%PUBLIC_IP%:8085"
echo echo "🔧 Backend API: http://%PUBLIC_IP%:3009"
echo echo "📊 Health Check: http://%PUBLIC_IP%:3009/health"
echo echo ""
echo echo "📝 Logs:"
echo echo "  pm2 logs ace-css-leave-portal-backend"
echo echo "  pm2 logs ace-css-leave-portal-frontend"
) > status-production.sh

echo [INFO] Linux management scripts created

:: Create logs directory
if not exist "logs" mkdir logs

:: Create quick setup instructions file
echo [STEP] Creating setup instructions...

(
echo # ACE CSS LEAVE PORTAL - PRODUCTION DEPLOYMENT INSTRUCTIONS
echo # =========================================================
echo.
echo Your Leave Portal has been prepared for production deployment!
echo.
echo ## What was created:
echo - .env.production: Production environment configuration
echo - ecosystem.config.production.js: PM2 process management
echo - deploy-production.sh: Automated deployment script
echo - start-production.sh: Start the application
echo - stop-production.sh: Stop the application  
echo - restart-production.sh: Restart the application
echo - status-production.sh: Check application status
echo - dist/: Production build files
echo.
echo ## Your Configuration:
echo - Public IP: %PUBLIC_IP%
echo - Frontend URL: http://%PUBLIC_IP%:8085
echo - Backend API: http://%PUBLIC_IP%:3009
echo - Health Check: http://%PUBLIC_IP%:3009/health
echo.
echo ## Next Steps:
echo.
echo 1. Copy the entire project folder to your Linux server
echo 2. On the Linux server, run: chmod +x *.sh
echo 3. Run the deployment script: ./deploy-production.sh
echo 4. Configure MySQL database ^(follow the script instructions^)
echo 5. Update .env.production with your MySQL credentials
echo 6. Start the application: ./start-production.sh
echo.
echo ## Default Admin Login:
echo - Username: admin
echo - Password: admin123
echo - ⚠️ CHANGE THIS AFTER FIRST LOGIN!
echo.
echo ## Management Commands ^(on Linux server^):
echo - Start: ./start-production.sh
echo - Stop: ./stop-production.sh  
echo - Restart: ./restart-production.sh
echo - Status: ./status-production.sh
echo.
echo ## Important Notes:
echo - Make sure MySQL is installed and running on the server
echo - Ensure ports 22, 80, 443, 3009, 8085 are open in firewall
echo - Update JWT_SECRET in .env.production to a strong secret
echo - Configure email settings if you want notifications
echo.
echo Your Leave Portal is ready for production hosting! 🚀
) > PRODUCTION_SETUP_INSTRUCTIONS.md

echo [INFO] Setup instructions created: PRODUCTION_SETUP_INSTRUCTIONS.md

:: Final summary
echo.
echo 🎉 ===============================================
echo    ACE CSS Leave Portal Production Preparation
echo    COMPLETED SUCCESSFULLY!
echo ================================================
echo.
echo ✅ Production build completed
echo ✅ Environment configuration created  
echo ✅ PM2 ecosystem configured
echo ✅ Management scripts created
echo ✅ Setup instructions created
echo.
echo 🔧 NEXT STEPS:
echo 1. Copy this entire folder to your Linux server
echo 2. Run: chmod +x *.sh
echo 3. Run: ./deploy-production.sh
echo 4. Configure MySQL and start the application
echo.
echo 🌐 YOUR ACCESS URLS:
echo    Frontend: http://%PUBLIC_IP%:8085
echo    Backend API: http://%PUBLIC_IP%:3009
echo    Health Check: http://%PUBLIC_IP%:3009/health
echo.
echo 📋 Read PRODUCTION_SETUP_INSTRUCTIONS.md for detailed steps
echo.
echo ================================================
echo 🚀 Ready for production deployment!
echo ================================================
echo.
pause
