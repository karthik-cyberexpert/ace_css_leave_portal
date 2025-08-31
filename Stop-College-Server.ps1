# ACE CSS Leave Portal - College Server Stop Script
Write-Host "Stopping ACE CSS Leave Portal on College Server..." -ForegroundColor Cyan
pm2 stop ecosystem.config.production.js
Write-Host "âœ… ACE CSS Leave Portal stopped" -ForegroundColor Green
