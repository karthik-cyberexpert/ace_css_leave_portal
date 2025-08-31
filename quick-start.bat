@echo off
echo Setting up environment...
set NODE_ENV=production
set VITE_API_URL=http://210.212.246.131:3009
set DB_HOST=localhost
set DB_USER=root
set DB_PASSWORD=Ace_cs@2025
set DB_NAME=cyber_security_leave_portal
set DB_PORT=3307
set PORT=3009
set JWT_SECRET=ACE_CSS_LEAVE_PORTAL_JWT_SECRET_WIN_COLLEGE_743036

echo Starting backend...
start /B "Backend" node backend/server.production.js

echo Waiting for backend to start...
timeout /t 5

echo Starting frontend...
start /B "Frontend" npx vite preview --host 0.0.0.0 --port 8085

echo.
echo Portal started!
echo Frontend: http://210.212.246.131:8085
echo Backend: http://210.212.246.131:3009
echo.
echo Press any key to continue...
pause
