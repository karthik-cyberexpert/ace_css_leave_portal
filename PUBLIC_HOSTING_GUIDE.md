# 🌐 ACE CSS Leave Portal - PUBLIC HOSTING DEPLOYMENT GUIDE

## 🎯 **NEW! Automated Configuration System**

Your Leave Portal now features an **intelligent auto-configuration system** that works with **any hosting environment**!

✨ **Key Features:**
- 🔍 **Auto-detects your public IP** or domain
- 🔧 **Generates all configuration files** automatically
- 🌐 **Works with any hosting provider** (AWS, DigitalOcean, VPS, etc.)
- 🔒 **Creates secure JWT secrets** automatically
- 📧 **Configures email notifications** (optional)
- 🚀 **One-command deployment**

---

## 🚀 **Quick Start (Recommended)**

### **Step 1: Run the Auto-Configurator**
```bash
# Navigate to your project directory
cd /path/to/Leave_portal

# Run the intelligent configuration script
node configure-hosting.js
```

The script will:
- 🔍 **Detect your public IP automatically**
- 🔧 **Ask for your hosting preferences**
- 📝 **Generate all configuration files**
- 🎯 **Create deployment scripts**
- ✅ **Set up validation tools**

### **Step 2: Deploy Your Application**
```bash
# Linux/macOS
./start-production.sh

# Windows
start-production.bat
```

### **Step 3: Validate Everything Works**
```bash
# Run the validation script
node validate-configuration.js
```

**That's it! Your Leave Portal is now live! 🎉**

---

## 📋 **Manual Configuration (Advanced Users)**

If you prefer manual configuration or need custom settings:

### **Step 4: Configure Database**
```sql
-- Login to MySQL
mysql -u root -p

-- Create database and user
CREATE DATABASE IF NOT EXISTS cyber_security_leave_portal;
CREATE USER 'leave_portal'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON cyber_security_leave_portal.* TO 'leave_portal'@'localhost';
FLUSH PRIVILEGES;
EXIT;

-- Import schema
mysql -u root -p cyber_security_leave_portal < rebuilt_schema.sql
```

### **Step 5: Start Your Application**
```bash
./start-production.sh
```

---

## 🌐 **Access Your Leave Portal**

Once deployed, your application will be accessible at:
- **🏠 Main Website**: `http://YOUR_PUBLIC_IP:8080`
- **🔧 API Endpoint**: `http://YOUR_PUBLIC_IP:3002`
- **📊 Health Check**: `http://YOUR_PUBLIC_IP:3002/health`

---

## 🔐 **Security Features Included**

### **Production Security**
- ✅ **Helmet.js**: Security headers
- ✅ **Rate Limiting**: DDoS protection
- ✅ **CORS**: Strict origin control
- ✅ **Compression**: Optimized responses
- ✅ **JWT Authentication**: Secure tokens
- ✅ **Input Validation**: XSS protection
- ✅ **File Upload Security**: Type restrictions

### **Firewall Configuration**
```bash
# Automatically configured ports
Port 22   - SSH Access
Port 80   - HTTP (optional)
Port 443  - HTTPS (optional)
Port 3002 - Backend API
Port 8080 - Frontend Application
```

---

## 📊 **Performance Features**

### **Frontend Optimizations**
- ✅ **Production Build**: Minified & optimized
- ✅ **Code Splitting**: Faster loading
- ✅ **Asset Compression**: Reduced bundle size
- ✅ **Cache Headers**: Browser caching

### **Backend Optimizations**
- ✅ **PM2 Clustering**: Multi-core utilization
- ✅ **Connection Pooling**: Database efficiency
- ✅ **Memory Management**: Automatic restarts
- ✅ **Process Monitoring**: Self-healing

---

## 🛠️ **Management Commands**

### **Application Control**
```bash
./start-production.sh      # Start the application
./stop-production.sh       # Stop the application
./restart-production.sh    # Restart the application
./status-production.sh     # Check status
```

### **PM2 Process Management**
```bash
pm2 status                 # View all processes
pm2 logs                   # View all logs
pm2 logs backend          # Backend logs only
pm2 logs frontend         # Frontend logs only
pm2 monit                 # Real-time monitoring
```

### **System Service**
```bash
sudo systemctl start ace-css-leave-portal     # Start service
sudo systemctl stop ace-css-leave-portal      # Stop service
sudo systemctl status ace-css-leave-portal    # Check service status
sudo systemctl enable ace-css-leave-portal    # Enable auto-start
```

---

## 📝 **Configuration Files**

### **Environment Configuration**
- `.env.production` - Production environment variables
- `ecosystem.config.production.js` - PM2 process configuration

### **Key Settings**
```env
# Your server configuration
PUBLIC_IP=your.server.ip.address
DOMAIN=your.server.ip.address
VITE_API_URL=http://your.server.ip.address:3002

# Security settings
NODE_ENV=production
JWT_SECRET=strong_random_secret
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🎯 **Default Login Credentials**

### **Administrator Access**
- **Username**: `admin`
- **Password**: `admin123`

### **⚠️ IMPORTANT SECURITY STEPS**
1. **Change default admin password** immediately after first login
2. **Update JWT_SECRET** in `.env.production` to a strong random string
3. **Configure MySQL password** in environment file
4. **Set up SSL certificate** for HTTPS (optional but recommended)

---

## 🔍 **Health Monitoring**

### **Health Check Endpoint**
```bash
curl http://your.server.ip.address:3002/health
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

---

## 📱 **Multi-Device Access**

Your Leave Portal will be accessible from:
- **Desktop Computers**: Full functionality
- **Laptops**: Complete interface
- **Tablets**: Responsive design
- **Mobile Phones**: Mobile-optimized UI
- **Any device with web browser** on the internet

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using port 8080 or 3002
sudo lsof -i :8080
sudo lsof -i :3002

# Kill process if needed
sudo kill -9 PID_NUMBER
```

#### **Database Connection Error**
```bash
# Check MySQL service
sudo systemctl status mysql
sudo systemctl start mysql

# Test database connection
mysql -u leave_portal -p cyber_security_leave_portal
```

#### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R www-data:www-data /path/to/leave-portal/
sudo chmod +x *.sh
```

#### **PM2 Issues**
```bash
# Restart PM2
pm2 kill
pm2 start ecosystem.config.production.js --env production

# Reset PM2
pm2 delete all
pm2 start ecosystem.config.production.js --env production
```

### **Log Files**
```bash
# Application logs
tail -f logs/backend-combined.log
tail -f logs/frontend-combined.log

# System logs
sudo journalctl -u ace-css-leave-portal -f
```

---

## 🔄 **Updates and Maintenance**

### **Updating the Application**
```bash
# Stop the application
./stop-production.sh

# Pull new code (if using Git)
git pull origin main

# Install new dependencies
npm install

# Rebuild frontend
npm run build:prod

# Restart application
./start-production.sh
```

### **Database Backups**
```bash
# Create backup
mysqldump -u root -p cyber_security_leave_portal > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u root -p cyber_security_leave_portal < backup_20250114.sql
```

---

## 🎉 **Success Checklist**

- ✅ Application accessible via public IP
- ✅ Both frontend (8080) and backend (3002) running
- ✅ Database connection successful
- ✅ Admin login working
- ✅ Health check endpoint responding
- ✅ PM2 processes stable
- ✅ Firewall properly configured
- ✅ SSL certificate installed (optional)
- ✅ Backups configured
- ✅ Monitoring set up

---

## 📞 **Support Information**

### **System Requirements**
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Node.js**: 16.x or higher
- **MySQL**: 8.0 or higher
- **Memory**: 2GB RAM minimum
- **Storage**: 10GB free space
- **Network**: Public IP with internet access

### **Ports Required**
- **22**: SSH access
- **80**: HTTP (optional)
- **443**: HTTPS (optional)
- **3002**: Backend API
- **8080**: Frontend application
- **3306**: MySQL (local only)

---

## 🚀 **Your Leave Portal is Ready!**

Your ACE CSS Leave Portal is now:
- 🌐 **Publicly accessible** from anywhere on the internet
- 🔒 **Secure** with production-grade security features
- 📱 **Mobile-friendly** with responsive design
- ⚡ **High-performance** with PM2 clustering
- 🔧 **Easy to manage** with included scripts
- 📊 **Monitored** with health checks and logging

**Access your portal at**: `http://YOUR_PUBLIC_IP:8080`

---

*Generated automatically by ACE CSS Leave Portal Production Setup*
