@echo off
echo Restarting ACE CSS Leave Portal on College Server...
pm2 restart ecosystem.config.production.js --env production
echo ??? ACE CSS Leave Portal restarted
pause
