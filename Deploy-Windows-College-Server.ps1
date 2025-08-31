# =====================================================
# ACE CSS LEAVE PORTAL - WINDOWS COLLEGE SERVER DEPLOYMENT
# =====================================================
# This script deploys the Leave Portal for Windows college server
# Run this script on your Windows college server as Administrator

param(
    [string]$ServerIP = "",
    [switch]$SkipFirewall,
    [switch]$SkipService,
    [string]$InstallPath = "D:\leave-portal"
)

# Require Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 ACE CSS Leave Portal - Windows College Server Deployment" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
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

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

Write-Status "Starting Windows College Server deployment..."

# Get current script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Step "Checking Prerequisites..."

# Check Node.js
try {
    $nodeVersion = & node --version
    Write-Status "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 16+ first."
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version
    Write-Status "npm found: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Check for PM2
try {
    $pm2Version = & pm2 --version
    Write-Status "PM2 found: $pm2Version"
} catch {
    Write-Warning "PM2 not found. Installing PM2 globally..."
    try {
        npm install -g pm2
        npm install -g pm2-windows-startup
        Write-Status "PM2 installed successfully"
    } catch {
        Write-Error "Failed to install PM2: $_"
        exit 1
    }
}

# Check MySQL
try {
    $mysqlVersion = & mysql --version
    Write-Status "MySQL found: $mysqlVersion"
} catch {
    Write-Warning "MySQL not found. Please ensure MySQL is installed and running."
    Write-Host "Download MySQL from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
}

# Get server IP configuration
Write-Step "Configuring Server Access..."

if (-not $ServerIP) {
    Write-Host "" 
    Write-Host "🌐 IP Address Configuration" -ForegroundColor Cyan
    Write-Host "You can use either:" -ForegroundColor Gray
    Write-Host "  • Public IP (for internet access): e.g., 203.0.113.1" -ForegroundColor Gray
    Write-Host "  • Local IP (for college network): e.g., 192.168.46.89" -ForegroundColor Gray
    Write-Host ""
    
    # Try to detect public IP first
    try {
        $PublicIP = (Invoke-WebRequest -Uri "https://ipinfo.io/ip" -UseBasicParsing -TimeoutSec 10).Content.Trim()
        Write-Host "Detected your public IP: $PublicIP" -ForegroundColor Yellow
        
        # Also show local IP
        try {
            $LocalIP = (Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null}).IPv4Address.IPAddress
            Write-Host "Detected your local IP: $LocalIP" -ForegroundColor Yellow
        } catch {
            Write-Warning "Could not detect local IP"
        }
        
        Write-Host ""
        $choice = Read-Host "Use public IP ($PublicIP)? Enter 'y' for yes, or type your preferred IP address"
        
        if ($choice -eq 'y' -or $choice -eq 'Y' -or $choice -eq 'yes') {
            $ServerIP = $PublicIP
        } elseif ($choice -and $choice.Trim() -ne "") {
            $ServerIP = $choice.Trim()
        } else {
            $ServerIP = $PublicIP
        }
    } catch {
        Write-Warning "Could not detect public IP automatically."
        $ServerIP = Read-Host "Please enter your server's IP address (public or local)"
    }
}

if (-not $ServerIP) {
    Write-Error "No IP address provided. Cannot continue."
    exit 1
}

# Validate IP address
if ($ServerIP -notmatch '^(\d{1,3}\.){3}\d{1,3}$') {
    Write-Error "Invalid IP address format: $ServerIP"
    exit 1
}

Write-Status "Using server IP address: $ServerIP"

# Create production environment file for Windows college server
Write-Step "Creating Production Environment Configuration..."

$envContent = @"
# =====================================================
# ACE CSS LEAVE PORTAL - WINDOWS COLLEGE SERVER CONFIG
# =====================================================
# Generated on $(Get-Date) for Windows College Server

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_mysql_password_here
DB_NAME=cyber_security_leave_portal
DB_PORT=3307

# JWT Configuration - CHANGE THIS TO A STRONG SECRET!
JWT_SECRET=ACE_CSS_LEAVE_PORTAL_JWT_SECRET_WIN_COLLEGE_$(Get-Random -Minimum 100000 -Maximum 999999)

# Server Configuration  
PORT=3009
NODE_ENV=production
HOST=0.0.0.0

# Network Configuration
SERVER_IP=$ServerIP
ACCESS_PROTOCOL=http

# Frontend Configuration
VITE_API_URL=http://$ServerIP:3009

# CORS Origins (College network friendly)
CORS_ORIGIN=http://$ServerIP:8085,http://$ServerIP:3000,http://localhost:8085,http://localhost:3000,http://$ServerIP

# Security Settings
SECURE_COOKIES=false
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Session Settings
SESSION_TIMEOUT=86400000

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com

# Windows College Server Specific Settings
WINDOWS_SERVICE=true
LOG_LEVEL=info
COLLEGE_NETWORK=true
"@

$envContent | Out-File -FilePath ".env.production" -Encoding UTF8
Write-Status "Production environment file created: .env.production"

# Install dependencies
Write-Step "Installing Dependencies..."
try {
    npm install --production=false
    Write-Status "Dependencies installed successfully"
} catch {
    Write-Error "Failed to install dependencies: $_"
    exit 1
}

# Build frontend for production
Write-Step "Building Frontend for Production..."
try {
    npm run build:prod
    Write-Status "Frontend build completed successfully"
} catch {
    Write-Error "Frontend build failed: $_"
    exit 1
}

# Create PM2 ecosystem file for Windows College Server
Write-Step "Creating PM2 Ecosystem Configuration..."

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
        SERVER_IP: '$ServerIP'
      },
      env_production: {
        NODE_ENV: 'production', 
        PORT: 3009,
        SERVER_IP: '$ServerIP'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log', 
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    },
    {
      name: 'ace-css-leave-portal-frontend',
      script: 'node_modules/.bin/vite',
      args: 'preview --config vite.config.production.ts --host 0.0.0.0 --port 8085',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'http://$ServerIP:3009',
        SERVER_IP: '$ServerIP'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log', 
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    },
    {
      name: 'ace-css-leave-portal-redirect',
      script: 'node',
      args: '-e "const http = require(\'http\'); const server = http.createServer((req, res) => { res.writeHead(301, { \'Location\': \'http://$ServerIP:8085\' + req.url }); res.end(); }); server.listen(80, \'0.0.0.0\', () => console.log(\'Redirect server running on port 80\'));"',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SERVER_IP: '$ServerIP'
      },
      error_file: './logs/redirect-error.log',
      out_file: './logs/redirect-out.log',
      log_file: './logs/redirect-combined.log',
      time: true,
      max_memory_restart: '100M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    }
  ]
};
"@

$ecosystemContent | Out-File -FilePath "ecosystem.config.production.js" -Encoding UTF8
Write-Status "PM2 ecosystem configuration created"

# Create logs directory
$logsDir = "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Name $logsDir | Out-Null
    Write-Status "Logs directory created"
}

# Configure Windows Firewall for college network
if (-not $SkipFirewall) {
    Write-Step "Configuring Windows Firewall for College Network..."
    
    try {
        # Remove existing rules to avoid conflicts
        netsh advfirewall firewall delete rule name="ACE CSS Leave Portal Frontend" 2>$null
        netsh advfirewall firewall delete rule name="ACE CSS Leave Portal Backend" 2>$null
        netsh advfirewall firewall delete rule name="ACE CSS Leave Portal Redirect" 2>$null
        netsh advfirewall firewall delete rule name="Node.js College Server" 2>$null
        
        # Add new firewall rules for updated ports
        netsh advfirewall firewall add rule name="ACE CSS Leave Portal Frontend" dir=in action=allow protocol=TCP localport=8085
        netsh advfirewall firewall add rule name="ACE CSS Leave Portal Backend" dir=in action=allow protocol=TCP localport=3009
        netsh advfirewall firewall add rule name="ACE CSS Leave Portal Redirect" dir=in action=allow protocol=TCP localport=80
        netsh advfirewall firewall add rule name="Node.js College Server" dir=in action=allow program="$env:ProgramFiles\nodejs\node.exe"
        
        Write-Status "Windows Firewall configured for college network (ports 80, 8085, 3009, 3307)"
    } catch {
        Write-Warning "Could not configure Windows Firewall automatically: $_"
        Write-Host "Please manually allow ports 8085 and 3009 in Windows Firewall" -ForegroundColor Yellow
    }
}

# Setup PM2 as Windows service for college server
if (-not $SkipService) {
    Write-Step "Setting up PM2 Windows Service for College Server..."
    
    try {
        # Install PM2 as Windows service
        pm2-startup install
        Write-Status "PM2 Windows service installed for college server"
    } catch {
        Write-Warning "Could not install PM2 Windows service: $_"
        Write-Host "PM2 will still work but won't auto-start on server boot" -ForegroundColor Yellow
    }
}

# Create Windows management scripts for college server
Write-Step "Creating College Server Management Scripts..."

# Start script
$startScript = @"
@echo off
echo Starting ACE CSS Leave Portal on College Server...
pm2 start ecosystem.config.production.js --env production
pm2 save
echo.
echo ✅ ACE CSS Leave Portal started successfully on Windows College Server!
echo 🌐 Main Access (no port needed): http://$ServerIP
echo 🌐 Frontend Direct: http://$ServerIP:8085
echo 🔧 Backend API: http://$ServerIP:3009
echo 📊 Health Check: http://$ServerIP:3009/health
echo 📋 PM2 Status: pm2 status
echo.
echo Students and staff can access the portal at: http://$ServerIP
pause
"@
$startScript | Out-File -FilePath "start-college-server.bat" -Encoding ASCII

# Stop script
$stopScript = @"
@echo off
echo Stopping ACE CSS Leave Portal on College Server...
pm2 stop ecosystem.config.production.js
echo ✅ ACE CSS Leave Portal stopped
pause
"@
$stopScript | Out-File -FilePath "stop-college-server.bat" -Encoding ASCII

# Restart script  
$restartScript = @"
@echo off
echo Restarting ACE CSS Leave Portal on College Server...
pm2 restart ecosystem.config.production.js --env production
echo ✅ ACE CSS Leave Portal restarted
pause
"@
$restartScript | Out-File -FilePath "restart-college-server.bat" -Encoding ASCII

# Status script
$statusScript = @"
@echo off
echo ACE CSS Leave Portal - College Server Status:
echo ===============================================
pm2 status
echo.
echo 🌐 Main Access (no port needed): http://$ServerIP
echo 🌐 Frontend Direct: http://$ServerIP:8085
echo 🔧 Backend API: http://$ServerIP:3009
echo 📊 Health Check: http://$ServerIP:3009/health
echo.
echo 📝 Logs:
echo   pm2 logs ace-css-leave-portal-backend
echo   pm2 logs ace-css-leave-portal-frontend
echo   pm2 logs ace-css-leave-portal-redirect
echo.
echo Students and staff access URL: http://$ServerIP
pause
"@
$statusScript | Out-File -FilePath "status-college-server.bat" -Encoding ASCII

Write-Status "College server management scripts created"

# Create PowerShell management scripts
$psStartScript = @"
# ACE CSS Leave Portal - College Server Start Script
Write-Host "Starting ACE CSS Leave Portal on College Server..." -ForegroundColor Cyan
pm2 start ecosystem.config.production.js --env production
pm2 save
Write-Host ""
Write-Host "✅ ACE CSS Leave Portal started successfully!" -ForegroundColor Green
Write-Host "🌐 Main Access (no port needed): http://$ServerIP" -ForegroundColor Yellow
Write-Host "🌐 Frontend Direct: http://$ServerIP:8085" -ForegroundColor Yellow
Write-Host "🔧 Backend API: http://$ServerIP:3009" -ForegroundColor Yellow
Write-Host "📊 Health Check: http://$ServerIP:3009/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Students and staff can now access the portal at: http://$ServerIP" -ForegroundColor Cyan
Write-Host "📋 PM2 Status: pm2 status" -ForegroundColor Gray
"@
$psStartScript | Out-File -FilePath "Start-College-Server.ps1" -Encoding UTF8

$psStopScript = @"
# ACE CSS Leave Portal - College Server Stop Script
Write-Host "Stopping ACE CSS Leave Portal on College Server..." -ForegroundColor Cyan
pm2 stop ecosystem.config.production.js
Write-Host "✅ ACE CSS Leave Portal stopped" -ForegroundColor Green
"@
$psStopScript | Out-File -FilePath "Stop-College-Server.ps1" -Encoding UTF8

$psStatusScript = @"
# ACE CSS Leave Portal - College Server Status Script
Write-Host "ACE CSS Leave Portal - College Server Status:" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
pm2 status
Write-Host ""
Write-Host "🌐 Main Access (no port needed): http://$ServerIP" -ForegroundColor Yellow
Write-Host "🌐 Frontend Direct: http://$ServerIP:8085" -ForegroundColor Yellow
Write-Host "🔧 Backend API: http://$ServerIP:3009" -ForegroundColor Yellow
Write-Host "📊 Health Check: http://$ServerIP:3009/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Gray
Write-Host "  pm2 logs ace-css-leave-portal-backend" -ForegroundColor Gray
Write-Host "  pm2 logs ace-css-leave-portal-frontend" -ForegroundColor Gray
Write-Host "  pm2 logs ace-css-leave-portal-redirect" -ForegroundColor Gray
Write-Host ""
Write-Host "Students and staff access URL: http://$ServerIP" -ForegroundColor Cyan
"@
$psStatusScript | Out-File -FilePath "Status-College-Server.ps1" -Encoding UTF8

Write-Status "PowerShell college server management scripts created"

# Database setup instructions
Write-Step "Database Setup Instructions for College Server..."

Write-Warning "Please configure MySQL database manually:"
Write-Host "========================================"
Write-Host "1. Open MySQL Command Line Client or MySQL Workbench"
Write-Host "2. Run these commands:"
Write-Host ""
Write-Host "   CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;" -ForegroundColor Cyan
Write-Host "   CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'your_secure_password';" -ForegroundColor Cyan
Write-Host "   GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';" -ForegroundColor Cyan
Write-Host "   FLUSH PRIVILEGES;" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Import the schema:" -ForegroundColor Yellow
Write-Host "   mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Update .env.production with your MySQL credentials" -ForegroundColor Yellow
Write-Host "========================================"

# Create desktop shortcuts for college server admin
Write-Step "Creating Desktop Shortcuts for College Server Admin..."

$WshShell = New-Object -comObject WScript.Shell

# Start shortcut
$StartShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Start Leave Portal - College Server.lnk")
$StartShortcut.TargetPath = "$ScriptDir\start-college-server.bat"
$StartShortcut.WorkingDirectory = $ScriptDir
$StartShortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,25"
$StartShortcut.Description = "Start ACE CSS Leave Portal on College Server"
$StartShortcut.Save()

# Status shortcut  
$StatusShortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Leave Portal Status - College Server.lnk")
$StatusShortcut.TargetPath = "$ScriptDir\status-college-server.bat"
$StatusShortcut.WorkingDirectory = $ScriptDir
$StatusShortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,23"
$StatusShortcut.Description = "Check ACE CSS Leave Portal Status on College Server"
$StatusShortcut.Save()

Write-Status "Desktop shortcuts created for college server admin"

# Final summary
Write-Host ""
Write-Host "🎉 ==========================================================" -ForegroundColor Green
Write-Host "   ACE CSS Leave Portal Windows College Server Deployment" -ForegroundColor Green
Write-Host "   COMPLETED SUCCESSFULLY!" -ForegroundColor Green  
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Success "✅ Production build completed"
Write-Success "✅ Environment configuration created"
Write-Success "✅ PM2 ecosystem configured for college server" 
Write-Success "✅ Windows Firewall configured for college network"
Write-Success "✅ College server management scripts created"
Write-Success "✅ Desktop shortcuts created for admin"
Write-Host ""
Write-Host "🔧 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Configure your MySQL database (see instructions above)"
Write-Host "2. Update .env.production with your MySQL credentials"
Write-Host "3. Start the application: start-college-server.bat or Start-College-Server.ps1"
Write-Host ""
Write-Host "🌐 COLLEGE NETWORK ACCESS URLS:" -ForegroundColor Cyan
Write-Host "   Main Access (Students `& Staff): http://$ServerIP" -ForegroundColor White
Write-Host "   Frontend Direct: http://$ServerIP:8085" -ForegroundColor White
Write-Host "   Backend API: http://$ServerIP:3009" -ForegroundColor White
Write-Host "   Health Check: http://$ServerIP:3009/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 MANAGEMENT COMMANDS:" -ForegroundColor Magenta
Write-Host "   Start: start-college-server.bat or Start-College-Server.ps1"
Write-Host "   Stop: stop-college-server.bat or Stop-College-Server.ps1" 
Write-Host "   Status: status-college-server.bat or Status-College-Server.ps1"
Write-Host "   Restart: restart-college-server.bat"
Write-Host ""
Write-Host "📝 DEFAULT ADMIN LOGIN:" -ForegroundColor Red
Write-Host "   Username: admin"
Write-Host "   Password: admin123"
Write-Host "   ⚠️  CHANGE THIS AFTER FIRST LOGIN!"
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🚀 Your Leave Portal is ready for Windows College Server!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""

# Ask if user wants to start now
$startNow = Read-Host "Would you like to start the Leave Portal on the college server now? (y/n)"
if ($startNow -eq 'y' -or $startNow -eq 'Y' -or $startNow -eq 'yes') {
    Write-Host ""
    Write-Host "🚀 Starting Leave Portal on College Server..." -ForegroundColor Cyan
    try {
        pm2 start ecosystem.config.production.js --env production
        pm2 save
        Write-Host ""
        Write-Success "✅ Leave Portal started successfully on college server!"
        Write-Host "🌐 Students and staff can access at: http://$ServerIP" -ForegroundColor Yellow
    } catch {
        Write-Error "Failed to start: $_"
        Write-Host "You can start manually using: start-college-server.bat" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "To start later, run: start-college-server.bat" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 For detailed documentation, see:" -ForegroundColor Gray
Write-Host "   - WINDOWS_HOSTING_GUIDE.md"
Write-Host "   - PRODUCTION_SETUP_INSTRUCTIONS.md"
Write-Host ""
