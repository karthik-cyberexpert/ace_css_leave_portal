# 🎓 ACE CSS Leave Portal - Simple Student Guide

**A step-by-step guide that anyone can follow!**

This guide will help you deploy the Leave Portal on your college Windows server. Think of it like following a recipe - just follow each step carefully!

---

## 📚 **What is this Leave Portal?**

The Leave Portal is a web application that helps students apply for leave and teachers manage those applications. It's like having a digital form system that works on the internet!

**What you'll have when finished:**
- A website where students can apply for leave
- A system where teachers can approve/reject applications
- Everything running on your college server
- Access via: `http://portal.yourcollege.edu` (clean, professional URL!)

---

## 🛠️ **STEP 1: Get Ready (Prerequisites)**

Before we start cooking, let's gather all ingredients! You need these programs on your Windows college server:

### **Install these first (in this order):**

1. **Node.js (JavaScript Runtime)**
   - Go to: https://nodejs.org/
   - Download the **LTS version** (recommended for most users)
   - Run the installer and click "Next, Next, Finish"
   - **What it does**: Runs our application code

2. **MySQL Database (Data Storage)**
   - Go to: https://dev.mysql.com/downloads/mysql/
   - Download **MySQL Community Server**
   - During installation, remember your **root password**!
   - **Port**: Set to **3307** (not the default 3307)
   - **What it does**: Stores all student and leave data

3. **Nginx (Web Server)**
   - Go to: https://nginx.org/en/download.html
   - Download **nginx/Windows** (latest stable version)
   - Extract to `C:\nginx` folder
   - **What it does**: Makes your website accessible without port numbers

---

## 🚀 **STEP 2: Prepare Your Project**

### **On your current computer:**

1. **Open PowerShell** (Right-click Start menu → Windows PowerShell)

2. **Navigate to your project folder:**
   ```powershell
   cd "\\192.168.46.89\d\Leave_portal"
   ```

3. **Run the preparation script:**
   ```powershell
   .\Prepare-Production.ps1
   ```

4. **Enter your college server IP when asked** (something like: 203.194.112.45)

5. **Wait for it to finish** (it will install things and build your project)

### **What happens here?**
- Your project gets ready for the college server
- All files get prepared and optimized
- Configuration files get created with your server details

---

## 📦 **STEP 3: Copy to College Server**

1. **Copy the entire project folder** to your college server
   - **Destination**: `D:\leave-portal` (on college server)
   - You can use USB, network share, or any file transfer method

2. **Make sure you copied everything**, including:
   - All the `.bat` files (start-production.bat, etc.)
   - The `.env.production` file
   - All folders (backend, frontend, node_modules if present)

---

## 💻 **STEP 4: Deploy on College Server**

### **On the college Windows server:**

1. **Open PowerShell as Administrator** 
   - Right-click **PowerShell** → "Run as Administrator"
   - Click "Yes" when Windows asks for permission

2. **Go to your project folder:**
   ```powershell
   cd "D:\leave-portal"
   ```

3. **Run the magic deployment script:**
   ```powershell
   .\Deploy-Windows-Production.ps1
   ```

4. **Answer the questions:**
   - **Public IP**: Your college server's internet IP (like 203.194.112.45)
   - **Domain**: Your desired website name (like portal.yourcollege.edu)
     - Leave empty if you only want to use IP address

5. **Wait patiently** - this installs PM2, configures firewall, creates scripts!

### **What happens here?**
- PM2 gets installed (manages your application)
- Windows Firewall gets configured
- Management scripts get created
- Desktop shortcuts get created
- Everything gets ready to run!

---

## 🗄️ **STEP 5: Setup Database**

**Don't worry - it's easier than it sounds!**

1. **Open MySQL Command Line Client** or **MySQL Workbench**

2. **Copy and paste these commands one by one:**
   ```sql
   CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
   CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'your_strong_password';
   GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Import the database structure:**
   ```bash
   mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql
   ```

4. **Update your password in the configuration:**
   - Open `.env.production` file
   - Find the line: `DB_PASSWORD=your_secure_mysql_password_here`
   - Replace with your actual MySQL password
   - Save the file

### **What happens here?**
- Creates a special database for the leave portal
- Creates a user account for the application
- Gives proper permissions
- Sets up all the tables and structure

---

## 🌐 **STEP 6: Setup Nginx (For Pretty URLs)**

**Only do this if you entered a domain name in Step 4!**

1. **Check that Nginx is installed** at `C:\nginx`

2. **Copy the generated configuration:**
   - Find the file `nginx-leave-portal.conf` in your project
   - Copy its contents
   - Open `C:\nginx\conf\nginx.conf`
   - Replace everything with the copied content
   - Save the file

3. **Test Nginx configuration:**
   ```cmd
   cd C:\nginx
   nginx.exe -t
   ```
   - Should say "configuration file test is successful"

### **What happens here?**
- Nginx learns how to handle your website
- URLs become clean (no :8085 port numbers)
- Everything looks professional!

---

## ▶️ **STEP 7: Start Everything**

**The exciting moment - let's start your Leave Portal!**

### **Method 1: Use Desktop Shortcuts (Easiest)**
- Double-click **"Start Leave Portal"** on desktop
- Wait for it to say "started successfully"

### **Method 2: Use Batch Files**
- Double-click `start-production.bat`
- Wait for success message

### **Method 3: Use PowerShell**
```powershell
.\Start-Production.ps1
```

### **If you have a domain, also start Nginx:**
- Double-click `start-nginx.bat`
- Or run: `.\start-nginx.bat`

---

## 🎉 **STEP 8: Test Your Website**

**Time to see if everything works!**

### **If you used IP only:**
- Open browser and go to: `http://YOUR_IP:8085`
- Example: `http://203.194.112.45:8085`

### **If you used a domain:**
- Open browser and go to: `http://portal.yourcollege.edu`
- (Make sure DNS is pointing to your server IP)

### **What you should see:**
- A login page for the Leave Portal
- **Default login**: 
  - Username: `admin`  
  - Password: `admin123`
  - **⚠️ CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!**

---

## 🔧 **Daily Management (Easy!)**

### **Starting the Portal:**
- Double-click "Start Leave Portal" on desktop
- Or run: `start-production.bat`

### **Stopping the Portal:**
- Double-click "Leave Portal Status" on desktop  
- Or run: `stop-production.bat`

### **Checking if it's running:**
- Double-click "Leave Portal Status" on desktop
- Or run: `status-production.bat`

### **If you use Nginx (domain):**
- Start: `start-nginx.bat`
- Stop: `stop-nginx.bat`
- Check: `nginx-status.bat`

---

## 🆘 **Help! Something Went Wrong**

### **Portal won't start?**
1. Check if MySQL is running
2. Make sure you updated the password in `.env.production`
3. Run `status-production.bat` to see what's wrong

### **Can't access the website?**
1. Check Windows Firewall - ports 8085 and 3009 should be allowed
2. Make sure your IP address is correct
3. Try accessing with IP:port first: `http://YOUR_IP:8085`

### **Domain not working?**
1. Check if DNS A record points to your server IP
2. Make sure Nginx is running: `nginx-status.bat`
3. Try the IP version first to make sure the portal works

### **Database errors?**
1. Make sure MySQL is running on port 3307
2. Check your password in `.env.production`
3. Make sure you imported the schema file

---

## 📱 **What Students and Teachers Can Do**

### **Students can:**
- Apply for different types of leave
- Upload supporting documents
- Track application status
- View their leave history

### **Teachers/Admins can:**
- Review leave applications
- Approve or reject with comments
- View student details
- Generate reports

---

## 🔐 **Important Security Notes**

1. **Change the default admin password immediately!**
2. **Use a strong MySQL password**
3. **Keep your server updated**
4. **Backup your database regularly**

---

## 🎯 **Summary - You Did It!**

**Congratulations! You now have:**

✅ A professional Leave Portal running on your server  
✅ Clean URLs (if using domain)  
✅ Student and teacher access  
✅ Database for storing all data  
✅ Management scripts for easy control  
✅ Desktop shortcuts for convenience  

**Your college now has a modern, digital leave management system!** 

Students can apply online, teachers can manage efficiently, and everything is stored safely in your database.

---

## 📞 **Need More Help?**

- Check the `REVERSE_PROXY_GUIDE.md` for Nginx details
- Check the `WINDOWS_HOSTING_GUIDE.md` for advanced options
- All management scripts have clear output messages
- Every batch file shows you what it's doing

**Remember: Technology is like a bicycle - once you learn it, you never forget! 🚴‍♂️**
