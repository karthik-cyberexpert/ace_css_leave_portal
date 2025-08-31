@echo off
echo Stopping ACE CSS Leave Portal on College Server...
pm2 stop ecosystem.config.production.js
echo ??? ACE CSS Leave Portal stopped
pause
