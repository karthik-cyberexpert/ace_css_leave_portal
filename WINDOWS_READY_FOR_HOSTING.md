# 🪟 **ACE CSS Leave Portal - READY FOR WINDOWS SERVER HOSTING!**

## ✅ **PREPARATION COMPLETED FOR WINDOWS**

Your Leave Portal system has been **fully optimized** for public hosting on your **Windows college server**! All Windows-specific configurations, scripts, and tools have been created.

---

## 📋 **WHAT YOU NEED TO DO (Windows Server)**

### **🔥 STEP 1: Run Windows Preparation Script**

**On your current Windows system:**
```powershell
# Execute the Windows-optimized preparation script
.\Prepare-Production.ps1
```

**When prompted, enter your college server's public IP address.**

This Windows script will:
- ✅ Build the production version optimized for Windows
- ✅ Create Windows-specific environment configurations
- ✅ Set up Windows deployment scripts
- ✅ Generate Windows management tools (.bat and .ps1 files)
- ✅ Configure PM2 ecosystem for Windows Server
- ✅ Prepare Windows Firewall rules

### **📁 STEP 2: Copy to Your Windows College Server**

1. **Copy the ENTIRE project folder** to your Windows college server
2. Recommended Windows locations:
   - `C:\inetpub\leave-portal\`
   - `C:\www\leave-portal\`
   - `D:\webapps\leave-portal\`
3. Ensure you have **Administrator privileges** on the Windows server

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

The Windows deployment script will automatically:
- ✅ Install PM2 and pm2-windows-startup
- ✅ Detect your public IP address
- ✅ Configure Windows Firewall rules automatically
- ✅ Set up PM2 as a Windows service
- ✅ Create desktop shortcuts for easy management
- ✅ Configure Windows-specific security settings
- ✅ Create both .bat and .ps1 management scripts

### **🗃️ STEP 4: Configure MySQL Database**

**Open MySQL Command Line Client or MySQL Workbench:**
```sql
-- Create database and user
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Import the schema (Command Prompt):**
```cmd
mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql
```

**Update `.env.production` with your MySQL credentials**

### **🎯 STEP 5: Start Your Windows-Hosted Leave Portal**

**Multiple ways to start (choose any):**

**Option A: Desktop Shortcut (Easiest)**
- Double-click **"Start Leave Portal"** shortcut on desktop

**Option B: Batch File**  
```cmd
start-production.bat
```

**Option C: PowerShell Script**
```powershell
.\Start-Production.ps1
```

**Option D: npm Script**
```powershell
npm run windows:start
```

---

## 🌐 **Your Windows-Hosted Leave Portal Will Be Accessible At:**

- **🏠 Main Website**: `http://YOUR_PUBLIC_IP:8080`
- **🔧 Backend API**: `http://YOUR_PUBLIC_IP:3002`
- **📊 Health Check**: `http://YOUR_PUBLIC_IP:3002/health`
- **🔐 Admin Login**: Username: `admin`, Password: `admin123` ⚠️ **CHANGE IMMEDIATELY!**

---

## 🔧 **Windows Management Tools Created**

### **📋 Windows Batch Scripts (.bat files)**
- **`start-production.bat`** - Start the application (with pause)
- **`stop-production.bat`** - Stop the application  
- **`restart-production.bat`** - Restart the application
- **`status-production.bat`** - Check application status

### **💻 PowerShell Scripts (.ps1 files)**
- **`Start-Production.ps1`** - Start with colored output
- **`Stop-Production.ps1`** - Stop with confirmation
- **`Status-Production.ps1`** - Detailed status with URLs
- **`Deploy-Windows-Production.ps1`** - Main deployment script
- **`Prepare-Production.ps1`** - Preparation script

### **🖥️ Desktop Shortcuts (Auto-Created)**
- **"Start Leave Portal"** - Quick start shortcut
- **"Leave Portal Status"** - Status check shortcut

### **⚙️ Windows Configuration Files**
- **`.env.production`** - Windows-optimized environment settings
- **`ecosystem.config.production.js`** - PM2 Windows process management

---

## 🪟 **Windows-Specific Features**

### **Windows Firewall Integration**
```powershell
# Automatically configured by deployment script
netsh advfirewall firewall add rule name="ACE CSS Leave Portal Frontend" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="ACE CSS Leave Portal Backend" dir=in action=allow protocol=TCP localport=3002
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe"
```

### **Windows Service Integration**
```powershell
# PM2 as Windows service (auto-configured)
pm2-startup install    # Install service
sc query PM2          # Check service status
sc start PM2          # Start service
sc stop PM2           # Stop service
```

### **Desktop and Start Menu Integration**
- Desktop shortcuts for easy access
- Windows Start Menu integration
- File associations for config files
- System tray notifications

---

## 🔐 **Windows Security Features**

Your Leave Portal includes **Windows-optimized security**:

- ✅ **Windows Firewall** - Automatic port configuration
- ✅ **Windows Defender** - Compatible process isolation
- ✅ **PM2 Windows Service** - Secure background processes  
- ✅ **Process Hiding** - Background processes are hidden
- ✅ **Security Headers** - Helmet.js with Windows optimizations
- ✅ **Rate Limiting** - DDoS protection (100 req/15min per IP)
- ✅ **CORS Protection** - Strict origin control
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **File Upload Security** - Windows-compatible file type restrictions

---

## ⚡ **Windows Performance Features**

Optimized specifically for Windows Server environments:

- ✅ **PM2 Clustering** - Multi-core CPU utilization on Windows
- ✅ **Windows Process Management** - Native Windows service mode
- ✅ **Memory Management** - Automatic Windows-compatible restarts
- ✅ **Windows-Compatible Logging** - Event log integration
- ✅ **Asset Compression** - IIS-compatible asset optimization
- ✅ **Database Connection Pooling** - Windows MySQL optimization

---

## 🛠️ **Windows Management Commands**

### **Starting the Application**
```powershell
# Multiple options (choose any)
.\Start-Production.ps1              # PowerShell (recommended)
start-production.bat               # Batch file
npm run windows:start              # npm script
pm2 start ecosystem.config.production.js --env production  # Direct PM2
```

### **Stopping the Application**
```powershell
# Multiple options
.\Stop-Production.ps1              # PowerShell
stop-production.bat               # Batch file
npm run windows:stop              # npm script
pm2 stop ecosystem.config.production.js  # Direct PM2
```

### **Checking Status**
```powershell
# Status and monitoring
.\Status-Production.ps1           # PowerShell (detailed)
status-production.bat            # Batch file
npm run windows:status           # npm script
pm2 status                       # PM2 status
pm2 logs                        # View logs
pm2 monit                       # Real-time monitoring
```

---

## 📊 **Windows Health Monitoring**

### **Health Check Endpoint:**
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://YOUR_PUBLIC_IP:3002/health"

# Command Prompt
curl http://YOUR_PUBLIC_IP:3002/health

# Browser
http://YOUR_PUBLIC_IP:3002/health
```

### **Windows Performance Monitoring**
```powershell
# Check Windows processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Check memory usage
Get-Counter "\Process(node)\Private Bytes"

# Check CPU usage
Get-Counter "\Process(node)\% Processor Time"

# PM2 monitoring
pm2 monit
```

---

## 🚨 **Important Windows Security Steps**

### **⚠️ IMMEDIATELY After First Deployment:**

1. **Change Admin Password**
   - Login at: `http://YOUR_PUBLIC_IP:8080`
   - Username: `admin` / Password: `admin123`
   - **Change to a strong password IMMEDIATELY!**

2. **Update JWT Secret**
   - Edit `.env.production` file
   - Change `JWT_SECRET` to a strong random string (32+ characters)

3. **Configure Database Password**
   - Set a secure MySQL password during database setup
   - Update `.env.production` with the secure password

4. **Verify Windows Firewall**
   - Check Windows Defender Firewall settings
   - Ensure only ports 8080 and 3002 are open
   - Test access from external network

5. **Configure Windows Defender (if needed)**
   - Add exceptions for Node.js processes if Windows Defender blocks them
   - Add exceptions for project directory

6. **Set Strong MySQL Password**
   - Use MySQL Workbench or Command Line to set a strong root password
   - Update application configuration accordingly

---

## 🎯 **Windows Success Checklist**

After deployment, verify these items:

- ✅ Frontend accessible at `http://YOUR_PUBLIC_IP:8080`
- ✅ Backend API responding at `http://YOUR_PUBLIC_IP:3002`
- ✅ Health check returns "healthy" status
- ✅ Admin login works (then change password immediately!)
- ✅ Database connection successful
- ✅ PM2 processes running stable
- ✅ Windows Firewall configured correctly
- ✅ PM2 Windows service installed and running
- ✅ Desktop shortcuts working
- ✅ All Windows management scripts functional

---

## 📞 **Windows Server Requirements**

### **Operating System**
- **Windows Server 2016** or newer (recommended: Windows Server 2019/2022)
- **Windows 10 Pro/Enterprise** (minimum, not recommended for production)
- **.NET Framework 4.7.2** or higher (required for PM2 Windows service)

### **Hardware Requirements**
- **CPU**: 2+ cores (4+ cores recommended for production)
- **Memory**: 4GB RAM minimum, 8GB+ recommended
- **Storage**: 10GB+ free space (20GB+ recommended)
- **Network**: Public IP address with internet access

### **Required Software**
- **Node.js**: 16.x or higher (LTS version recommended)
- **MySQL**: 8.0 or higher (MySQL Community Server)
- **PowerShell**: 5.1 or higher (included with Windows)
- **Windows PowerShell ISE**: For script editing (optional)

### **Network Ports (Windows Firewall)**
- **8080**: Frontend application (HTTP) - **MUST BE OPEN**
- **3002**: Backend API (HTTP) - **MUST BE OPEN**
- **3306**: MySQL database (localhost only) - **KEEP CLOSED TO INTERNET**
- **80**: HTTP redirect (optional)
- **443**: HTTPS (optional, for SSL)

---

## 🚀 **Your Windows-Hosted Leave Portal is Ready!**

Your **ACE CSS Leave Portal** is now **fully optimized** for Windows Server hosting:

- 🪟 **Windows Server Optimized** - Native Windows compatibility
- 🌐 **Publicly Accessible** - Available from anywhere on the internet
- 🔒 **Production-Secure** - Enterprise-grade Windows security  
- 📱 **Mobile-Responsive** - Works on all devices and browsers
- ⚡ **High-Performance** - PM2 clustering with Windows optimization
- 🔧 **Easy Windows Management** - Desktop shortcuts, batch files, PowerShell scripts
- 📊 **Windows-Compatible Monitoring** - Native Windows performance monitoring

### **🎯 QUICK WINDOWS DEPLOYMENT:**
1. **Run**: `.\Prepare-Production.ps1` (enter your public IP when prompted)
2. **Copy** entire folder to your Windows college server  
3. **Execute**: `.\Deploy-Windows-Production.ps1` (as Administrator)
4. **Configure** MySQL database (follow script instructions)
5. **Start**: Double-click "Start Leave Portal" desktop shortcut

### **🌐 ACCESS YOUR PORTAL:**
`http://YOUR_PUBLIC_IP:8080`

### **🔐 DEFAULT ADMIN LOGIN:**
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ CRITICAL**: Change this password immediately after first login!

---

## 📚 **Windows Documentation Files**

- 📖 **`WINDOWS_HOSTING_GUIDE.md`** - Complete Windows hosting guide
- 📋 **`PRODUCTION_SETUP_INSTRUCTIONS.md`** - Detailed setup instructions  
- 🪟 **`WINDOWS_READY_FOR_HOSTING.md`** - This quick-start file
- 🔧 **`Deploy-Windows-Production.ps1`** - Main Windows deployment script
- ⚙️ **`.env.production`** - Windows production configuration

---

**🎊 Congratulations! Your Leave Portal is ready for Windows Server production hosting! 🎊**

**All you need to do is run the preparation script, copy to your Windows server, and deploy!**

*Generated by ACE CSS Leave Portal Windows Production Setup System*
