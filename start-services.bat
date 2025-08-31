@echo off
title ACE CSS Leave Portal - Service Manager

echo ?? Starting ACE CSS Leave Portal Services...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ? Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ? Node.js found
echo.

REM Clean up existing processes
echo ?? Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

REM Start Backend Server
echo ?? Starting Backend Server on port 3009...
if exist backend\server.js (
    start "Backend Server" cmd /k "cd backend && node server.js"
    echo ? Backend server started
) else (
    echo ? Backend server file not found!
)

timeout /t 3 >nul

REM Start Frontend Server  
echo ?? Starting Frontend Server on port 8085...
if exist package.json (
    start "Frontend Server" cmd /k "npm run preview"
    echo ? Frontend server started
) else (
    echo ? package.json not found!
)

timeout /t 5 >nul

REM Start Redirect Server (requires admin)
echo ?? Starting Redirect Server on port 80...
if exist redirect-server.js (
    start "Redirect Server" cmd /k "node redirect-server.js"
    echo ? Redirect server started
) else (
    echo ? redirect-server.js not found!
)

timeout /t 3 >nul

echo.
echo ?? All services started!
echo.
echo ?? Access URLs:
echo    ?? Main Access (no port): http://192.168.46.89
echo    ?? Frontend Direct: http://192.168.46.89:8085
echo    ?? Backend API: http://192.168.46.89:3009
echo    ?? Health Check: http://192.168.46.89:3009/health
echo.
echo ?? To check running services:
echo    netstat -ano ^| findstr ":80\|:3009\|:8085"
echo.
echo ??  Keep service windows open or they will stop!
echo.

pause
