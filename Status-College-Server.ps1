# ACE CSS Leave Portal - College Server Status Script
Write-Host "ACE CSS Leave Portal - College Server Status:" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
pm2 status
Write-Host ""
Write-Host "ðŸŒ Main Access (no port needed): http://210.212.246.131" -ForegroundColor Yellow
Write-Host "ðŸŒ Frontend Direct: http://" -ForegroundColor Yellow
Write-Host "ðŸ”§ Backend API: http://" -ForegroundColor Yellow
Write-Host "ðŸ“Š Health Check: http:///health" -ForegroundColor Yellow
Write-Host ""
Write-Host "ðŸ“ Logs:" -ForegroundColor Gray
Write-Host "  pm2 logs ace-css-leave-portal-backend" -ForegroundColor Gray
Write-Host "  pm2 logs ace-css-leave-portal-frontend" -ForegroundColor Gray
Write-Host "  pm2 logs ace-css-leave-portal-redirect" -ForegroundColor Gray
Write-Host ""
Write-Host "Students and staff access URL: http://210.212.246.131" -ForegroundColor Cyan
