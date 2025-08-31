# 🚀 Complete Step-by-Step Guide: Deploy Leave Portal on Windows Server

**📖 This guide is written for beginners - like explaining to a 10th standard student!**

---

## 📋 What You Need Before Starting

Before you begin, make sure you have these things:

### ✅ **Required Software (Must Have)**
1. **Windows Computer** - Windows 10 or Windows Server
2. **Administrator Access** - You must be able to run programs "as administrator"
3. **Internet Connection** - To download software and detect your public IP
4. **Node.js** - Download from https://nodejs.org/ (get the LTS version)
5. **MySQL Database** - Download from https://dev.mysql.com/downloads/mysql/

### 📝 **Information You'll Need**
- Your **Public IP Address** (the script will help find this)
- Your **MySQL Password** (you'll set this during MySQL installation)

---

## 🎯 Step 1: Install Required Software

### **1.1 Install Node.js**
1. Go to https://nodejs.org/
2. Download the **LTS version** (usually the green button)
3. Run the downloaded file (.msi)
4. Click "Next" → "Next" → "Install" 
5. Wait for installation to complete
6. Click "Finish"

**✅ Test if Node.js is installed:**
- Press `Windows Key + R`
- Type `cmd` and press Enter
- Type `node --version` and press Enter
- You should see something like `v18.17.0`

### **1.2 Install MySQL**
1. Go to https://dev.mysql.com/downloads/mysql/
2. Download **MySQL Installer for Windows**
3. Run the installer
4. Choose **"Developer Default"** setup
5. Keep clicking "Next" until you reach "Accounts and Roles"
6. **IMPORTANT:** Set a root password and remember it! (e.g., `MyPassword123`)
7. Complete the installation

**✅ Test if MySQL is working:**
- Press `Windows Key + R`
- Type `services.msc` and press Enter
- Look for "MySQL80" or similar - it should be "Running"

---

## 🎯 Step 2: Prepare Your Leave Portal Files

### **2.1 Get Administrator Access**
1. Find PowerShell in Start Menu
2. **Right-click** on PowerShell
3. Choose **"Run as administrator"**
4. Click "Yes" if Windows asks permission

### **2.2 Navigate to Your Project**
In the PowerShell window, type:
```powershell
cd "\\192.168.46.89\d\Leave_portal"
```
Press Enter. You should now be in your project folder.

---

## 🎯 Step 3: Run the Deployment Script

### **3.1 Start the Deployment**
In PowerShell (as administrator), type:
```powershell
.\Deploy-Windows-College-Server.ps1
```
Press Enter.

### **3.2 Follow the Script Instructions**

**When the script asks about IP address:**
- It will try to find your **public IP** automatically
- It might show something like: "Detected your public IP: 203.0.113.1"
- It will ask: "Use public IP (203.0.113.1)? Enter 'y' for yes, or type your preferred IP address"

**Choose your option:**
- Type `y` and press Enter to use your public IP (recommended for internet access)
- OR type your specific IP address if you know it

**The script will then:**
- ✅ Check if Node.js is installed
- ✅ Install PM2 (a tool to run your website 24/7)
- ✅ Build your website files
- ✅ Configure Windows Firewall
- ✅ Create management scripts
- ✅ Create desktop shortcuts

### **3.3 Wait for Completion**
The script will show many messages. Wait until you see:
```
🎉 ACE CSS Leave Portal Windows College Server Deployment
   COMPLETED SUCCESSFULLY!
```

---

## 🎯 Step 4: Setup Your Database

### **4.1 Open MySQL Command Line**
1. Press `Windows Key`
2. Type "MySQL Command Line Client"
3. Click on it
4. Enter your MySQL root password (the one you set during installation)

### **4.2 Create Your Database**
Type these commands one by one (press Enter after each):

```sql
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
```

```sql
CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'MySecurePassword123';
```

```sql
GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';
```

```sql
FLUSH PRIVILEGES;
```

```sql
exit;
```

### **4.3 Import the Database Structure**
In PowerShell (still as administrator), type:
```powershell
mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql
```
- Enter your MySQL root password when asked
- Wait for it to complete (no error messages = success!)

### **4.4 Update Configuration File**
1. In your project folder, find the file called `.env.production`
2. Open it with Notepad
3. Find the line: `DB_PASSWORD=your_secure_mysql_password_here`
4. Change it to: `DB_PASSWORD=MySecurePassword123` (use your actual password)
5. Save the file

---

## 🎯 Step 5: Start Your Website

### **5.1 Start the Leave Portal**
You have three easy ways to start:

**Method 1: Use Desktop Shortcut**
- Look on your desktop for "Start Leave Portal - College Server"
- Double-click it

**Method 2: Use Batch File**
- In PowerShell, type: `.\start-college-server.bat`

**Method 3: Use PowerShell Script**
- In PowerShell, type: `.\Start-College-Server.ps1`

### **5.2 Check if it's Working**
After starting, you should see messages like:
```
✅ ACE CSS Leave Portal started successfully!
🌐 Frontend: http://YOUR_IP:8085
🔧 Backend API: http://YOUR_IP:3009
```

---

## 🎯 Step 6: Access Your Website

### **6.1 Open Your Website**
1. Open any web browser (Chrome, Firefox, Edge)
2. Type in the address bar: `http://YOUR_PUBLIC_IP`
3. Press Enter

**Example:** If your IP is 203.0.113.1, type: `http://203.0.113.1`

**Note:** You don't need to add any port number! The system automatically redirects to the correct port.

### **6.2 Login as Admin**
When the website opens:
- **Username:** admin
- **Password:** admin123
- Click "Login"

**⚠️ IMPORTANT:** Change this password immediately after first login!

---

## 🎯 Step 7: Managing Your Website

### **How to Start the Website**
- Double-click desktop shortcut "Start Leave Portal - College Server"
- OR run: `start-college-server.bat`

### **How to Stop the Website**
- Double-click desktop shortcut "Leave Portal Status - College Server"
- Then run: `stop-college-server.bat`

### **How to Check if Website is Running**
- Run: `status-college-server.bat`
- Look for "online" status

### **How to Restart the Website**
- Run: `restart-college-server.bat`

---

## 🆘 Troubleshooting (If Something Goes Wrong)

### **Problem: "Node.js is not installed"**
**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install it
3. Restart PowerShell as administrator
4. Run the deployment script again

### **Problem: "MySQL not found"**
**Solution:**
1. Install MySQL from https://dev.mysql.com/downloads/mysql/
2. Make sure MySQL service is running
3. Run the deployment script again

### **Problem: "Permission denied" or "Access denied"**
**Solution:**
1. Make sure you're running PowerShell **as administrator**
2. Right-click PowerShell → "Run as administrator"

### **Problem: Website not accessible from other computers**
**Solution:**
1. Check Windows Firewall settings
2. Make sure ports 8085 and 3009 are allowed
3. The deployment script should do this automatically

### **Problem: Database connection failed**
**Solution:**
1. Check if MySQL is running (services.msc)
2. Verify password in `.env.production` file
3. Make sure database was created correctly

### **Problem: Can't access website**
**Solution:**
1. Check if the services are running: `pm2 status`
2. Look at logs: `pm2 logs`
3. Try restarting: `restart-college-server.bat`

---

## 📊 Understanding Your Setup

### **What Ports Does Your Website Use?**
- **Port 80:** This redirects to the main website (no port needed in URL)
- **Port 8085:** This is where the website actually runs
- **Port 3009:** This is where the backend API runs (for data)
- **Port 3307:** This is where MySQL database runs

### **What is PM2?**
PM2 is a tool that keeps your website running 24/7, even if there are errors or the computer restarts.

### **Where are the Website Files?**
- Main files: In your current folder (`\\192.168.46.89\d\Leave_portal`)
- Logs: In the `logs` folder
- Configuration: `.env.production` file

### **What is Your Public IP?**
Your public IP is the address that people from the internet use to access your server. The script automatically detects this.

---

## ✅ Success Checklist

After completing all steps, you should have:

- [ ] Node.js installed and working
- [ ] MySQL installed and running  
- [ ] Database created and configured
- [ ] Deployment script completed successfully
- [ ] Website accessible at `http://YOUR_IP` (no port needed)
- [ ] Admin login working (admin/admin123)
- [ ] Desktop shortcuts created
- [ ] PM2 keeping your site running 24/7

---

## 🎉 Congratulations!

You have successfully deployed the ACE CSS Leave Portal on your Windows server! 

**Your website is now:**
- ✅ Running 24/7 automatically
- ✅ Accessible from the internet (if using public IP)
- ✅ Secured with firewall rules
- ✅ Ready for students and staff to use

**Next Steps:**
1. Change the admin password
2. Test the website with different browsers
3. Share the website URL with your users
4. Monitor the logs regularly

**Remember:**
- Students and staff access: `http://YOUR_PUBLIC_IP` (no port needed)
- You can always check status using the desktop shortcuts
- Keep your MySQL password secure
- Regular backups are recommended

**Need Help?**
- Check the logs in the `logs` folder
- Run `status-college-server.bat` to see what's running
- Look at the troubleshooting section above

---

**📚 Additional Files Created:**
- `start-college-server.bat` - Starts the website
- `stop-college-server.bat` - Stops the website  
- `status-college-server.bat` - Shows website status
- `.env.production` - Configuration file
- `ecosystem.config.production.js` - PM2 configuration

You're all set! 🚀
