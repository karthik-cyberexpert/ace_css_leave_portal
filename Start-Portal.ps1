# Set environment variables
$env:NODE_ENV = "production"
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = "Ace_cs@2025"
$env:DB_NAME = "cyber_security_leave_portal"
$env:DB_PORT = "3307"
$env:PORT = "3009"
$env:HOST = "0.0.0.0"
$env:JWT_SECRET = "ACE_CSS_LEAVE_PORTAL_JWT_SECRET_WIN_COLLEGE_743036"
$env:VITE_API_URL = "http://210.212.246.131:3009"
$env:SERVER_IP = "210.212.246.131"
$env:CORS_ORIGIN = "http://210.212.246.131:8085,http://210.212.246.131:3000,http://localhost:8085,http://localhost:3000,http://210.212.246.131"

Write-Host "🚀 Starting ACE CSS Leave Portal..." -ForegroundColor Cyan
Write-Host "Environment: $env:NODE_ENV" -ForegroundColor Green
Write-Host "Database: $env:DB_HOST:$env:DB_PORT" -ForegroundColor Green
Write-Host "Server IP: $env:SERVER_IP" -ForegroundColor Green

# Start backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "backend/server.production.js" -NoNewWindow

# Wait a moment for backend to start
Start-Sleep -Seconds 5

# Start frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process -FilePath "npx" -ArgumentList "vite","preview","--host","0.0.0.0","--port","8085" -NoNewWindow

Write-Host ""
Write-Host "✅ Leave Portal Started Successfully!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://210.212.246.131:8085" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://210.212.246.131:3009" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://210.212.246.131:3009/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Login: admin / admin123" -ForegroundColor Yellow
