@echo off
echo Starting ACE CSS Leave Portal on College Server...
pm2 start ecosystem.config.production.js --env production
pm2 save
echo.
echo SUCCESS ACE CSS Leave Portal started successfully on Windows College Server!
echo FRONTEND Main Access (no port needed): http://210.212.246.131
echo FRONTEND Frontend Direct: http://210.212.246.131:8085
echo BACKEND Backend API: http://210.212.246.131:3009
echo HEALTH Health Check: http://210.212.246.131:3009/health
echo PM2 PM2 Status: pm2 status
echo.
echo Students and staff can access the portal at: http://210.212.246.131
pause
