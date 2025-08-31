# 🚀 Leave Portal - Quick Reference Card

## 📋 Essential Commands

### **Start the Website**
```bash
.\start-college-server.bat
```
or double-click desktop shortcut

### **Stop the Website**
```bash
.\stop-college-server.bat
```

### **Check Status**
```bash
.\status-college-server.bat
```

### **Restart Everything**
```bash
.\restart-college-server.bat
```

---

## 🌐 Access URLs

**Replace `YOUR_IP` with your actual IP address**

- **Main Website:** `http://YOUR_IP` (no port needed)
- **Admin Login:** `http://YOUR_IP` (admin/admin123)
- **Frontend Direct:** `http://YOUR_IP:8085`
- **Backend API:** `http://YOUR_IP:3009`
- **API Health:** `http://YOUR_IP:3009/health`

---

## 🔧 PM2 Commands (Advanced)

```bash
pm2 status          # See all processes
pm2 logs            # View logs
pm2 restart all     # Restart all services
pm2 stop all        # Stop all services
pm2 delete all      # Remove all processes
```

---

## 📁 Important Files

- **Configuration:** `.env.production`
- **Start Script:** `start-college-server.bat`
- **Logs:** `logs/` folder
- **Database Schema:** `rebuilt_schema.sql`

---

## 🆘 Quick Fixes

### **Website Not Loading?**
1. Check status: `.\status-college-server.bat`
2. Restart: `.\restart-college-server.bat`
3. Check firewall (ports 80, 8085, 3009)

### **Database Issues?**
1. Check MySQL is running: `services.msc`
2. Verify password in `.env.production`
3. Re-import schema: `mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql`

### **Can't Access from Internet?**
1. Verify your public IP
2. Check router port forwarding
3. Check Windows Firewall

---

## 📞 Default Login

- **Username:** `admin`
- **Password:** `admin123`
- **⚠️ CHANGE THIS IMMEDIATELY!**

---

## 🔥 Emergency Stop Everything

```bash
pm2 kill
```

Then restart with: `.\start-college-server.bat`
