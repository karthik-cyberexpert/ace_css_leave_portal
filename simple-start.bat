@echo off
echo Starting Leave Portal Backend...
start /B node backend/server.production.js
timeout /t 3
echo.
echo Starting Leave Portal Frontend...
start /B npx vite preview --host 0.0.0.0 --port 8085
timeout /t 5
echo.
echo Leave Portal Started!
echo Frontend: http://210.212.246.131:8085
echo Backend: http://210.212.246.131:3009
echo Health: http://210.212.246.131:3009/health
echo.
pause
