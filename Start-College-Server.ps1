# ACE CSS Leave Portal - College Server Start Script
Write-Host "Starting ACE CSS Leave Portal on College Server..." -ForegroundColor Cyan
pm2 start ecosystem.config.production.js --env production
pm2 save
Write-Host ""
Write-Host "âœ… ACE CSS Leave Portal started successfully!" -ForegroundColor Green
Write-Host "ðŸŒ Main Access (no port needed): http://210.212.246.131" -ForegroundColor Yellow
Write-Host "ðŸŒ Frontend Direct: http://" -ForegroundColor Yellow
Write-Host "ðŸ”§ Backend API: http://" -ForegroundColor Yellow
Write-Host "ðŸ“Š Health Check: http:///health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Students and staff can now access the portal at: http://210.212.246.131" -ForegroundColor Cyan
Write-Host "ðŸ“‹ PM2 Status: pm2 status" -ForegroundColor Gray
