@echo off
echo ACE CSS Leave Portal - College Server Status:
echo ===============================================
pm2 status
echo.
echo ???? Main Access (no port needed): http://210.212.246.131
echo ???? Frontend Direct: http://
echo ???? Backend API: http://
echo ???? Health Check: http:///health
echo.
echo ???? Logs:
echo   pm2 logs ace-css-leave-portal-backend
echo   pm2 logs ace-css-leave-portal-frontend
echo   pm2 logs ace-css-leave-portal-redirect
echo.
echo Students and staff access URL: http://210.212.246.131
pause
