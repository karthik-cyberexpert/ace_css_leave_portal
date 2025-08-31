# =====================================================
# ACE CSS LEAVE PORTAL - PRODUCTION PREPARATION SCRIPT
# =====================================================
# PowerShell version for Windows systems
# This script prepares the Leave Portal for production deployment

param(
    [string]$PublicIP = ""
)

Write-Host ""
Write-Host "🚀 ACE CSS Leave Portal - Production Preparation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

Write-Status "Preparing Leave Portal for production deployment..."

# Check prerequisites
Write-Step "Checking Prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Status "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Status "npm found: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Get public IP if not provided
if (-not $PublicIP) {
    Write-Host ""
    $PublicIP = Read-Host "Please enter your college server's PUBLIC IP address"
}

if (-not $PublicIP) {
    Write-Error "No IP address provided. Cannot continue."
    exit 1
}

Write-Status "Using IP address: $PublicIP"

# Validate IP address format
if ($PublicIP -notmatch '^(\d{1,3}\.){3}\d{1,3}$') {
    Write-Error "Invalid IP address format: $PublicIP"
    exit 1
}

# Create production environment file
Write-Step "Creating Production Environment Configuration..."

$envContent = @"
# =====================================================
# ACE CSS LEAVE PORTAL - PRODUCTION CONFIGURATION
# =====================================================
# Generated on $(Get-Date)

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_mysql_password_here
DB_NAME=cyber_security_leave_portal
DB_PORT=3307

# JWT Configuration - IMPORTANT: Change this to a strong secret
JWT_SECRET=ACE_CSS_LEAVE_PORTAL_JWT_SECRET_PRODUCTION_2025_$(Get-Random -Minimum 100000 -Maximum 999999)

# Server Configuration
PORT=3009
NODE_ENV=production
HOST=0.0.0.0

# Public IP Configuration
PUBLIC_IP=$PublicIP
DOMAIN=$PublicIP

# Frontend Configuration
VITE_API_URL=http://$PublicIP`:3009

# CORS Origins
CORS_ORIGIN=http://$PublicIP`:8085,http://$PublicIP`:3000,http://localhost:8085

# Security Settings
SECURE_COOKIES=false
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/uploads

# Session Settings
SESSION_TIMEOUT=86400000

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Status "Production environment file created: .env.production"

# Install dependencies
Write-Step "Installing dependencies..."
try {
    npm install
    Write-Status "Dependencies installed successfully"
} catch {
    Write-Error "Failed to install dependencies: $_"
    exit 1
}

# Build frontend for production
Write-Step "Building frontend for production..."
try {
    npm run build:prod
    Write-Status "Frontend build completed successfully"
} catch {
    Write-Error "Frontend build failed: $_"
    exit 1
}

# Create PM2 ecosystem file for Windows
Write-Step "Creating PM2 ecosystem configuration..."

$ecosystemContent = @"
module.exports = {
  apps: [
    {
      name: 'ace-css-leave-portal-backend',
      script: './backend/server.production.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3009,
        PUBLIC_IP: '$PublicIP'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3009,
        PUBLIC_IP: '$PublicIP'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    },
    {
      name: 'ace-css-leave-portal-frontend',
      script: 'node_modules/.bin/vite.cmd',
      args: 'preview --config vite.config.production.ts --host 0.0.0.0',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'http://$PublicIP`:3009',
        PUBLIC_IP: '$PublicIP'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    }
  ]
};
"@

$ecosystemContent | Out-File -FilePath "ecosystem.config.production.js" -Encoding UTF8
Write-Status "PM2 ecosystem configuration created"

# Create management scripts for Linux
Write-Step "Creating Linux management scripts..."

# Start script
@"
#!/bin/bash
echo "Starting ACE CSS Leave Portal..."
pm2 start ecosystem.config.production.js --env production
pm2 save
echo "✅ ACE CSS Leave Portal started successfully!"
echo "🌐 Frontend: http://$PublicIP`:8085"
echo "🔧 Backend API: http://$PublicIP`:3009"
echo "📊 Health Check: http://$PublicIP`:3009/health"
echo "📋 PM2 Status: pm2 status"
"@ | Out-File -FilePath "start-production.sh" -Encoding UTF8

# Stop script
@"
#!/bin/bash
echo "Stopping ACE CSS Leave Portal..."
pm2 stop ecosystem.config.production.js
echo "✅ ACE CSS Leave Portal stopped"
"@ | Out-File -FilePath "stop-production.sh" -Encoding UTF8

# Restart script
@"
#!/bin/bash
echo "Restarting ACE CSS Leave Portal..."
pm2 restart ecosystem.config.production.js --env production
echo "✅ ACE CSS Leave Portal restarted"
"@ | Out-File -FilePath "restart-production.sh" -Encoding UTF8

# Status script
@"
#!/bin/bash
echo "ACE CSS Leave Portal Status:"
echo "============================"
pm2 status
echo ""
echo "🌐 Frontend: http://$PublicIP`:8085"
echo "🔧 Backend API: http://$PublicIP`:3009"
echo "📊 Health Check: http://$PublicIP`:3009/health"
echo ""
echo "📝 Logs:"
echo "  pm2 logs ace-css-leave-portal-backend"
echo "  pm2 logs ace-css-leave-portal-frontend"
"@ | Out-File -FilePath "status-production.sh" -Encoding UTF8

Write-Status "Linux management scripts created"

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Name "logs" | Out-Null
}

# Create setup instructions
Write-Step "Creating setup instructions..."

$instructionsContent = @"
# ACE CSS LEAVE PORTAL - PRODUCTION DEPLOYMENT INSTRUCTIONS
# =========================================================

Your Leave Portal has been prepared for production deployment!

## What was created:
- .env.production: Production environment configuration
- ecosystem.config.production.js: PM2 process management
- deploy-production.sh: Automated deployment script
- start-production.sh: Start the application
- stop-production.sh: Stop the application
- restart-production.sh: Restart the application
- status-production.sh: Check application status
- dist/: Production build files

## Your Configuration:
- Public IP: $PublicIP
- Frontend URL: http://$PublicIP`:8085
- Backend API: http://$PublicIP`:3009
- Health Check: http://$PublicIP`:3009/health

## Next Steps:

1. Copy the entire project folder to your Windows college server (D:\\leave-portal)
2. On the Windows server, open PowerShell as Administrator
3. Run the deployment script: .\\Deploy-Windows-Production.ps1
4. Configure MySQL database (follow the script instructions)
5. Update .env.production with your MySQL credentials
6. Start the application: ./start-production.sh

## Default Admin Login:
- Username: admin
- Password: admin123
- ⚠️ CHANGE THIS AFTER FIRST LOGIN!

## Management Commands (on Linux server):
- Start: ./start-production.sh
- Stop: ./stop-production.sh
- Restart: ./restart-production.sh
- Status: ./status-production.sh

## Important Notes:
- Make sure MySQL is installed and running on the server
- Ensure ports 22, 80, 443, 3009, 8085 are open in firewall
- Update JWT_SECRET in .env.production to a strong secret
- Configure email settings if you want notifications

Your Leave Portal is ready for production hosting! 🚀
"@

$instructionsContent | Out-File -FilePath "PRODUCTION_SETUP_INSTRUCTIONS.md" -Encoding UTF8
Write-Status "Setup instructions created: PRODUCTION_SETUP_INSTRUCTIONS.md"

# Final summary
Write-Host ""
Write-Host "🎉 ===============================================" -ForegroundColor Green
Write-Host "   ACE CSS Leave Portal Production Preparation" -ForegroundColor Green
Write-Host "   COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Status "✅ Production build completed"
Write-Status "✅ Environment configuration created"
Write-Status "✅ PM2 ecosystem configured"
Write-Status "✅ Management scripts created"
Write-Status "✅ Setup instructions created"
Write-Host ""
Write-Host "🔧 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Copy this entire folder to your Windows college server (D:\\leave-portal)"
Write-Host "2. Run PowerShell as Administrator"
Write-Host "3. Run: .\\Deploy-Windows-Production.ps1"
Write-Host "4. Configure MySQL and start the application"
Write-Host ""
Write-Host "🌐 YOUR ACCESS URLS:" -ForegroundColor Cyan
Write-Host "   Frontend: http://$PublicIP`:8085"
Write-Host "   Backend API: http://$PublicIP`:3009"
Write-Host "   Health Check: http://$PublicIP`:3009/health"
Write-Host ""
Write-Host "📋 Read PRODUCTION_SETUP_INSTRUCTIONS.md for detailed steps"
Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "🚀 Ready for production deployment!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Show file list
Write-Host ""
Write-Host "📁 Files created for production:" -ForegroundColor Magenta
Get-ChildItem | Where-Object { $_.Name -match "(\.env\.production|ecosystem\.config\.production\.js|.*-production\.sh|PRODUCTION.*\.md|deploy-production\.sh)" } | Select-Object Name, Length | Format-Table -AutoSize
