@echo off
echo ======================================
echo    ACE CSS Leave Portal - STARTUP    
echo ======================================

REM Set environment variables
set NODE_ENV=production
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=Ace_cs@2025
set DB_NAME=cyber_security_leave_portal
set DB_PORT=3307
set PORT=3009
set JWT_SECRET=ACE_CSS_LEAVE_PORTAL_JWT_SECRET_WIN_COLLEGE_743036
set VITE_API_URL=http://210.212.246.131:3009

echo Starting Backend Server...
start /B "Leave Portal Backend" node backend/server.production.js

echo Waiting for backend to initialize...
timeout /t 8 /nobreak

echo Starting Frontend with Proxy Fix...
start /B "Leave Portal Frontend" node fix-server.js

echo.
echo ======================================
echo        PORTAL STARTED SUCCESSFULLY!
echo ======================================
echo.
echo Frontend: http://210.212.246.131:8085
echo Backend:  http://210.212.246.131:3009
echo Health:   http://210.212.246.131:3009/health
echo.
echo Default Login:
echo Username: admin
echo Password: admin123
echo.
echo ======================================
pause
