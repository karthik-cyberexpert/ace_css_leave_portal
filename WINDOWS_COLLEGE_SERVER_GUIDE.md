# ACE CSS Leave Portal - Windows College Server Deployment Guide

## Overview
This guide provides instructions for deploying the ACE CSS Leave Portal on a Windows college server environment. All DNS functions have been removed and the deployment is optimized specifically for Windows server systems.

## Prerequisites
- Windows Server (2019 or later recommended)
- Administrator access
- Node.js 16+ installed
- MySQL Server installed and running
- PowerShell 5.1 or later

## Quick Start

### 1. Deploy the Application
Run the main deployment script as Administrator:
```powershell
.\Deploy-Windows-College-Server.ps1
```

Or with specific server IP:
```powershell
.\Deploy-Windows-College-Server.ps1 -ServerIP "192.168.46.89"
```

### 2. Configure Database
After deployment, configure MySQL:
1. Open MySQL Command Line Client or MySQL Workbench
2. Run these commands:
```sql
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';
FLUSH PRIVILEGES;
```
3. Import the schema: `mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql`
4. Update `.env.production` with your MySQL credentials

### 3. Start the Application
Use any of these methods:
- Double-click desktop shortcut "Start Leave Portal - College Server"
- Run: `start-college-server.bat`
- Run: `Start-College-Server.ps1`

## Management Scripts

### Batch Files (.bat)
- `start-college-server.bat` - Start the portal
- `stop-college-server.bat` - Stop the portal
- `restart-college-server.bat` - Restart the portal
- `status-college-server.bat` - Check status

### PowerShell Files (.ps1)
- `Start-College-Server.ps1` - Start the portal
- `Stop-College-Server.ps1` - Stop the portal
- `Status-College-Server.ps1` - Check status

## Access URLs
After successful deployment:
- **Students & Staff Frontend:** `http://YOUR_SERVER_IP:8085`
- **Backend API:** `http://YOUR_SERVER_IP:3009`
- **Health Check:** `http://YOUR_SERVER_IP:3009/health`

## File Structure
```
Leave_portal/
├── Deploy-Windows-College-Server.ps1     # Main deployment script
├── ecosystem.config.js                    # PM2 configuration (Windows)
├── ecosystem.config.production.js         # Production PM2 config
├── .env.production                         # Production environment
├── start-college-server.bat               # Start script
├── stop-college-server.bat                # Stop script
├── restart-college-server.bat             # Restart script
├── status-college-server.bat              # Status script
├── Start-College-Server.ps1               # PowerShell start script
├── Stop-College-Server.ps1                # PowerShell stop script
├── Status-College-Server.ps1              # PowerShell status script
└── logs/                                   # Application logs
```

## What Was Removed
✅ **Removed DNS functions** - No more DNS configuration scripts
✅ **Removed Linux deployment** - All Linux-specific scripts removed
✅ **Simplified networking** - Direct IP-based access only
✅ **Removed complex domain handling** - Streamlined for college network

## Default Login
- **Username:** admin
- **Password:** admin123
- ⚠️ **IMPORTANT:** Change this password immediately after first login!

## Firewall Configuration
The deployment script automatically configures Windows Firewall to allow:
- Port 8085 (Frontend)
- Port 3009 (Backend)
- Node.js executable

## Troubleshooting

### Application Won't Start
1. Check if MySQL is running: `services.msc` → find MySQL
2. Verify Node.js is installed: `node --version`
3. Check PM2 status: `pm2 status`
4. View logs: `pm2 logs`

### Can't Access from Other Computers
1. Verify Windows Firewall allows ports 8085 and 3009
2. Check if Windows Defender is blocking connections
3. Ensure server IP is correct in network configuration

### Database Connection Issues
1. Verify MySQL credentials in `.env.production`
2. Test MySQL connection: `mysql -u root -p`
3. Check if database exists and user has permissions

## PM2 Commands
- `pm2 status` - View all processes
- `pm2 logs` - View logs
- `pm2 restart all` - Restart all processes
- `pm2 stop all` - Stop all processes
- `pm2 delete all` - Remove all processes

## Support
For issues specific to the Windows college server deployment:
1. Check the logs in the `logs/` directory
2. Run `Status-College-Server.ps1` to get system information
3. Verify all prerequisites are installed

## Security Notes
- Change default admin password immediately
- Keep MySQL credentials secure
- Regular backups recommended
- Update Node.js and dependencies regularly
- Monitor logs for suspicious activity

---
**Generated for Windows College Server Environment - No DNS Functions**
