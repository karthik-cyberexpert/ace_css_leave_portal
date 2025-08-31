# 🪟 **ACE CSS Leave Portal - WINDOWS SERVER HOSTING GUIDE**

## 🎯 **Quick Start for Windows Server Hosting**

Your Leave Portal system has been **fully prepared** for public hosting on your **Windows college server**! All the necessary configurations and scripts have been created specifically for Windows environments.

---

## 📋 **What You Need to Do Next**

### **🔥 STEP 1: Prepare on Current System**

**On your current Windows system:**
```powershell
# Execute the PowerShell preparation script
.\Prepare-Production.ps1
```

**When prompted, enter your college server's public IP address.**

This will:
- ✅ Build the production version of your app
- ✅ Create Windows-specific environment configurations
- ✅ Set up deployment scripts
- ✅ Generate Windows management tools
- ✅ Configure PM2 ecosystem for Windows

### **📁 STEP 2: Copy to Your Windows College Server**

1. **Copy the ENTIRE project folder** to your Windows college server
2. Recommended location: `C:\inetpub\leave-portal\` or `C:\www\leave-portal\`
3. Ensure you have **Administrator privileges** on the server

### **⚡ STEP 3: Deploy on Your Windows College Server**

**Open PowerShell as Administrator and run:**
```powershell
# Navigate to your project directory
cd C:\path\to\your\leave-portal\

# Run the Windows deployment script
.\Deploy-Windows-Production.ps1
```

**Or specify your public IP directly:**
```powershell
.\Deploy-Windows-Production.ps1 -PublicIP "YOUR_PUBLIC_IP"
```

The deployment script will automatically:
- ✅ Install PM2 and required dependencies
- ✅ Detect your public IP (or use provided IP)
- ✅ Configure Windows Firewall rules
- ✅ Set up PM2 as Windows service
- ✅ Create desktop shortcuts
- ✅ Configure security settings

### **🗃️ STEP 4: Configure Database**

**Open MySQL Command Line Client or MySQL Workbench:**
```sql
-- Create database and user
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';
FLUSH PRIVILEGES;
EXIT;

-- Import the schema (run in Command Prompt)
mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql
```

**Update `.env.production` with your MySQL credentials**

### **🎯 STEP 5: Start Your Leave Portal**

**Use any of these methods:**

**Option A: Desktop Shortcut**
- Double-click "Start Leave Portal" shortcut on desktop

**Option B: Batch Script**  
```cmd
start-production.bat
```

**Option C: PowerShell Script**
```powershell
.\Start-Production.ps1
```

---

## 🌐 **Your Leave Portal Will Be Accessible At:**

- **🏠 Main Website**: `http://YOUR_PUBLIC_IP:8080`
- **🔧 Backend API**: `http://YOUR_PUBLIC_IP:3002`
- **📊 Health Check**: `http://YOUR_PUBLIC_IP:3002/health`
- **🔐 Admin Login**: Username: `admin`, Password: `admin123`

---

## 🔧 **Windows Management Tools Created**

### **📋 Batch Scripts (.bat files)**
- **`start-production.bat`** - Start the application
- **`stop-production.bat`** - Stop the application
- **`restart-production.bat`** - Restart the application  
- **`status-production.bat`** - Check application status

### **💻 PowerShell Scripts (.ps1 files)**
- **`Start-Production.ps1`** - Start with colored output
- **`Stop-Production.ps1`** - Stop with status
- **`Status-Production.ps1`** - Detailed status check

### **🖥️ Desktop Shortcuts**
- **"Start Leave Portal"** - Quick start shortcut
- **"Leave Portal Status"** - Status check shortcut

### **⚙️ Configuration Files**
- **`.env.production`** - Production environment settings
- **`ecosystem.config.production.js`** - PM2 process management for Windows

---

## 🔐 **Windows Security Features**

Your Leave Portal includes **Windows-optimized security**:

- ✅ **Windows Firewall** - Automatic port configuration
- ✅ **PM2 Windows Service** - Auto-start on boot
- ✅ **Process Isolation** - Hidden background processes
- ✅ **Security Headers** - Helmet.js protection
- ✅ **Rate Limiting** - DDoS protection
- ✅ **CORS Protection** - Strict origin control
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **File Upload Security** - Type and size restrictions

---

## ⚡ **Windows Performance Features**

Optimized specifically for Windows Server:

- ✅ **PM2 Clustering** - Multi-core CPU utilization
- ✅ **Windows Process Management** - Background service mode
- ✅ **Memory Management** - Automatic process restarts
- ✅ **Log Management** - Structured Windows-compatible logging
- ✅ **Asset Compression** - Reduced bundle sizes
- ✅ **Database Connection Pooling** - Optimized connections

---

## 🛠️ **Management Commands**

### **Starting the Application**
```powershell
# PowerShell
.\Start-Production.ps1

# Command Prompt  
start-production.bat

# PM2 Direct
pm2 start ecosystem.config.production.js --env production
```

### **Stopping the Application**
```powershell
# PowerShell
.\Stop-Production.ps1

# Command Prompt
stop-production.bat

# PM2 Direct
pm2 stop ecosystem.config.production.js
```

### **Checking Status**
```powershell
# PowerShell
.\Status-Production.ps1

# Command Prompt
status-production.bat

# PM2 Direct
pm2 status
pm2 logs
```

### **Restarting After Changes**
```powershell
# PowerShell
pm2 restart ecosystem.config.production.js --env production

# Command Prompt
restart-production.bat
```

---

## 🪟 **Windows-Specific Features**

### **Windows Firewall Configuration**
The deployment script automatically configures:
```powershell
# Frontend access (port 8080)
netsh advfirewall firewall add rule name="ACE CSS Leave Portal Frontend" dir=in action=allow protocol=TCP localport=8080

# Backend API access (port 3002)  
netsh advfirewall firewall add rule name="ACE CSS Leave Portal Backend" dir=in action=allow protocol=TCP localport=3002

# Node.js executable
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe"
```

### **Windows Service Integration**
PM2 is configured as a Windows service:
```powershell
# Install PM2 as Windows service
pm2-startup install

# Service management
sc query PM2
sc start PM2
sc stop PM2
```

### **Desktop Integration**
- Desktop shortcuts for easy access
- Windows notification area integration
- File association for configuration files

---

## 🚨 **Important Windows Security Notes**

### **⚠️ IMMEDIATELY After First Deployment:**

1. **Change Admin Password**
   - Login with: `admin` / `admin123`
   - Change to a strong password immediately

2. **Update JWT Secret**
   - Edit `.env.production` 
   - Change `JWT_SECRET` to a strong random string

3. **Configure Database Password**
   - Set a secure MySQL password
   - Update `.env.production` with the password

4. **Verify Windows Firewall**
   - Check Windows Defender Firewall settings
   - Ensure only necessary ports are open
   - Test from external network

5. **Configure Windows Defender**
   - Add exceptions for Node.js processes if needed
   - Add exceptions for project directory

---

## 📊 **Health Monitoring**

### **Health Check Endpoint:**
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://YOUR_PUBLIC_IP:3002/health"

# Command Prompt
curl http://YOUR_PUBLIC_IP:3002/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-14T09:00:00.000Z",
  "uptime": 3600,
  "environment": "production", 
  "database": "connected",
  "version": "2.1.0"
}
```

### **Windows Performance Monitoring**
```powershell
# Check PM2 processes
pm2 monit

# View logs
pm2 logs

# Check Windows processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Check memory usage
Get-Counter "\Process(node)\Private Bytes"
```

---

## 🔄 **Updates and Maintenance**

### **Updating the Application**
```powershell
# Stop the application
.\Stop-Production.ps1

# Pull new code (if using Git)
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
npm run build:prod

# Restart application  
.\Start-Production.ps1
```

### **Database Backups**
```cmd
REM Create backup
mysqldump -u root -p cyber_security_leave_portal > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql

REM Restore backup
mysql -u root -p cyber_security_leave_portal < backup_20250114.sql
```

### **Log Management**
```powershell
# View recent logs
Get-Content .\logs\backend-combined.log -Tail 50

# Clear old logs
Remove-Item .\logs\*.log -Exclude *$(Get-Date -Format "yyyyMMdd")*
```

---

## 🚨 **Troubleshooting Windows Issues**

### **Port Already in Use**
```powershell
# Check what's using ports 8080 or 3002
netstat -ano | findstr :8080
netstat -ano | findstr :3002

# Kill process if needed
taskkill /F /PID [PID_NUMBER]
```

### **PM2 Service Issues**
```powershell
# Restart PM2 service
Restart-Service PM2

# Reinstall PM2 service
pm2-startup uninstall
pm2-startup install

# Check service status
Get-Service PM2
```

### **Windows Firewall Issues**
```powershell
# Check firewall rules
netsh advfirewall firewall show rule name="ACE CSS Leave Portal Frontend"
netsh advfirewall firewall show rule name="ACE CSS Leave Portal Backend"

# Manually add rules if needed
netsh advfirewall firewall add rule name="Leave Portal" dir=in action=allow protocol=TCP localport=8080,3002
```

### **MySQL Connection Issues**
```powershell
# Test MySQL connection
mysql -u leave_portal -p -e "SELECT 1;"

# Check MySQL service
Get-Service MySQL*
Start-Service MySQL80

# Check MySQL logs
Get-EventLog -LogName Application -Source MySQL*
```

---

## 🎯 **Success Checklist for Windows**

After deployment, verify:

- ✅ Frontend accessible at `http://YOUR_PUBLIC_IP:8080`
- ✅ Backend API responding at `http://YOUR_PUBLIC_IP:3002`  
- ✅ Health check returns "healthy" status
- ✅ Admin login works (change password immediately!)
- ✅ Database connection successful
- ✅ PM2 processes running stable
- ✅ Windows Firewall configured correctly
- ✅ PM2 Windows service installed
- ✅ Desktop shortcuts working
- ✅ SSL certificate installed (optional)

---

## 📞 **Windows Server Requirements**

### **Minimum System Requirements**
- **OS**: Windows Server 2016+ or Windows 10 Pro+
- **CPU**: 2+ cores recommended
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB free space
- **Network**: Public IP with internet access
- **.NET Framework**: 4.7.2 or higher (for PM2 Windows service)

### **Required Software**
- **Node.js**: 16.x or higher (LTS recommended)
- **MySQL**: 8.0 or higher  
- **Git**: For updates (optional)
- **PowerShell**: 5.1 or higher

### **Network Ports**
- **8080**: Frontend application (HTTP)
- **3002**: Backend API (HTTP)
- **3306**: MySQL (localhost only)
- **80**: HTTP redirect (optional)
- **443**: HTTPS (optional)

---

## 🚀 **Your Windows-Hosted Leave Portal is Ready!**

Your **ACE CSS Leave Portal** is now:
- 🪟 **Optimized for Windows Server** hosting  
- 🌐 **Publicly accessible** from anywhere on the internet
- 🔒 **Production-secure** with Windows-specific security
- 📱 **Mobile-responsive** for all devices
- ⚡ **High-performance** with PM2 clustering
- 🔧 **Easy to manage** with Windows tools
- 📊 **Monitored** with Windows-compatible logging

### **🎯 QUICK DEPLOYMENT SUMMARY:**
1. **Run**: `.\Prepare-Production.ps1` (enter your public IP)
2. **Copy** entire folder to your Windows server
3. **Execute**: `.\Deploy-Windows-Production.ps1` (as Administrator)
4. **Configure** MySQL database
5. **Start**: Double-click desktop shortcut or run `start-production.bat`

### **🌐 ACCESS AT:**
`http://YOUR_PUBLIC_IP:8080`

### **🔐 DEFAULT LOGIN:**
- Username: `admin`
- Password: `admin123`
- ⚠️ **CHANGE IMMEDIATELY AFTER FIRST LOGIN!**

---

**🎊 Congratulations! Your Leave Portal is ready for Windows Server hosting! 🎊**

*Generated by ACE CSS Leave Portal Windows Production Setup*
