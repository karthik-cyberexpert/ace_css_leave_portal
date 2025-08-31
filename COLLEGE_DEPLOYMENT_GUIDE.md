# 🎓 ACE CSS Leave Portal - College System Deployment Guide

## 📍 **Your Current Setup**
- **College IP**: 210.212.246.131
- **Frontend Port**: 8085
- **Backend Port**: 3009
- **Database Port**: 3306

## 🚀 **Step-by-Step Deployment Process**

### **Phase 1: System Requirements Check**

Since you're already in your college system, you need to ensure the following are installed:

#### **1.1 Check Node.js and npm**
Open Command Prompt (cmd) and check:
```cmd
node --version
npm --version
```

If not available, you'll need to:
- Install Node.js from https://nodejs.org/ (if you have admin access)
- Or ask your system administrator to install it

#### **1.2 Check MySQL Database**
```cmd
# Check if MySQL is running on port 3307
netstat -an | findstr ":3307"

# Or check MySQL service
sc query MySQL80
```

### **Phase 2: Database Setup**

#### **2.1 Start MySQL on Port 3307**
If MySQL isn't running on port 3307, you'll need to:

**Option A: Modify MySQL Configuration**
1. Open MySQL configuration file (`my.ini` or `my.cnf`)
2. Change port to 3307:
```ini
[mysqld]
port=3307
```
3. Restart MySQL service

**Option B: Start MySQL with Custom Port**
```cmd
mysqld --port=3307
```

#### **2.2 Create Database**
Connect to MySQL and run:
```sql
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
USE cyber_security_leave_portal;

-- Your database will be automatically set up by the application
```

### **Phase 3: Application Deployment**

#### **3.1 Install Dependencies**
Open Command Prompt in your project directory and run:
```cmd
cd \\192.168.46.89\d\Leave_portal

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### **3.2 Build Frontend**
```cmd
npm run build
```

#### **3.3 Install PM2 (Process Manager)**
```cmd
npm install -g pm2
```

#### **3.4 Deploy Application**
**Option A: Use Batch Script (Easiest)**
```cmd
start-production.bat
```

**Option B: Manual Steps**
```cmd
# Start all services with PM2
pm2 start ecosystem.config.production.js

# Check status
pm2 status

# View logs
pm2 logs
```

### **Phase 4: Network Configuration**

#### **4.1 Windows Firewall (If Needed)**
If external access is blocked, open Windows Firewall and allow:
- Port 8085 (Frontend)
- Port 3009 (Backend)

```cmd
# Command line method (run as administrator)
netsh advfirewall firewall add rule name="Leave Portal Frontend" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name="Leave Portal Backend" dir=in action=allow protocol=TCP localport=3009
```

#### **4.2 College Network Configuration**
You may need to contact your college IT department to:
- Open ports 8085 and 3009 on the college firewall
- Ensure external access to IP 210.212.246.131
- Configure router port forwarding if needed

### **Phase 5: Testing and Verification**

#### **5.1 Local Testing**
```cmd
# Check if services are running
pm2 status

# Test frontend locally
# Open browser: http://localhost:8085

# Test backend API locally  
# Open browser: http://localhost:3009/health
```

#### **5.2 External Testing**
From another computer/phone outside college network:
- Frontend: http://210.212.246.131:8085
- Backend API: http://210.212.246.131:3009

### **Phase 6: Troubleshooting**

#### **6.1 Common Issues**

**Issue**: "Port already in use"
**Solution**: 
```cmd
# Check what's using the port
netstat -ano | findstr ":8085"
netstat -ano | findstr ":3009"

# Kill process if needed (replace PID)
taskkill /PID [process_id] /F
```

**Issue**: "Cannot connect from external network"
**Solution**:
1. Check Windows Firewall settings
2. Contact college IT for network configuration
3. Verify IP address is correct: `ipconfig`

**Issue**: "Database connection failed"
**Solution**:
1. Ensure MySQL is running on port 3307
2. Check database credentials in `.env.production`
3. Create database if it doesn't exist

#### **6.2 Log Checking**
```cmd
# View application logs
pm2 logs

# View specific service logs
pm2 logs ace-css-leave-portal-backend
pm2 logs ace-css-leave-portal-frontend

# View error logs only
pm2 logs --err
```

## 🎯 **Quick Deployment Checklist**

- [ ] Node.js and npm installed
- [ ] MySQL running on port 3307
- [ ] Database `cyber_security_leave_portal` created
- [ ] Dependencies installed (`npm install`)
- [ ] Frontend built (`npm run build`)
- [ ] PM2 installed (`npm install -g pm2`)
- [ ] Services started (`start-production.bat`)
- [ ] Firewall ports opened (8085, 3009)
- [ ] External access tested

## 📞 **Need Help?**

If you encounter issues:
1. Run the verification script: `.\check-config.bat`
2. Check PM2 logs: `pm2 logs`
3. Verify network connectivity: `ping 210.212.246.131`
4. Contact college IT if network access is blocked

## 🎉 **Success URLs**

Once deployed, your Leave Portal will be live at:
- **Students/Staff Access**: http://210.212.246.131:8085
- **API Endpoint**: http://210.212.246.131:3009
- **Admin Panel**: http://210.212.246.131:8085/admin

---

**Your Leave Portal is ready to serve the entire college! 🎓✨**
