# 🚀 ACE CSS Leave Portal - Production Deployment Guide

## Overview
This guide will help you deploy the Leave Portal System for production use through your college's public IP address. The system has been pre-configured with production-ready security features, optimizations, and monitoring.

## ⚡ Quick Setup (5 Minutes)

### Step 1: Run the automated setup
```bash
npm run setup:prod
```

This will prompt you to enter:
- **Your college's public IP address** (e.g., 203.0.113.10)
- **MySQL root password** (leave empty if no password)
- **Email configuration** (optional, for notifications)

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Windows Firewall
```powershell
# Right-click PowerShell -> "Run as Administrator"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\configure-firewall.ps1
```

### Step 4: Start the production server
```bash
.\start-production.bat
```

### Step 5: Test the deployment
```bash
.\check-status.bat
```

**🎉 Done!** Your portal is now accessible at `http://YOUR_PUBLIC_IP:8085`

---

## 🔧 Manual Setup (If needed)

### Prerequisites
- Windows Server/Desktop with internet access
- Node.js 14+ installed
- MySQL Server running on 192.168.46.89
- Administrator privileges for firewall configuration

### 1. Environment Configuration

Edit `.env.production` and replace `YOUR_PUBLIC_IP` with your actual public IP:

```env
# Replace YOUR_PUBLIC_IP with your actual IP
PUBLIC_IP=203.0.113.10  # Example IP
VITE_API_URL=http://203.0.113.10:3009
VITE_APP_URL=http://203.0.113.10:8085
```

### 2. Network Configuration

#### Windows Firewall Rules
```powershell
# Allow frontend (port 8085)
New-NetFirewallRule -DisplayName "ACE CSS Leave Portal Frontend" -Direction Inbound -Protocol TCP -LocalPort 8085 -Action Allow

# Allow backend (port 3009)
New-NetFirewallRule -DisplayName "ACE CSS Leave Portal Backend" -Direction Inbound -Protocol TCP -LocalPort 3009 -Action Allow

# Allow MySQL (port 3307)
New-NetFirewallRule -DisplayName "MySQL Server" -Direction Inbound -Protocol TCP -LocalPort 3307 -Action Allow
```

#### Router Configuration (If Behind NAT)
If your server is behind a router, configure port forwarding:
- Port 8085 → Server IP:8085 (Frontend)
- Port 3009 → Server IP:3009 (Backend)
- Port 3307 → Database Server:3307 (MySQL)

### 3. Start Production Services

#### Option A: Using batch file
```bash
.\start-production.bat
```

#### Option B: Manual startup
```bash
# Start backend
npm run server:prod

# Start frontend (in another terminal)
npm run preview:prod
```

---

## 🌐 Network Architecture

```
Internet → Router → Your Server (192.168.46.89)
                      ├─ Frontend: Port 8085
                      ├─ Backend: Port 3009
                      └─ MySQL: Port 3307
```

**Public Access Points:**
- **Frontend**: `http://YOUR_PUBLIC_IP:8085`
- **Backend API**: `http://YOUR_PUBLIC_IP:3009`
- **Health Check**: `http://YOUR_PUBLIC_IP:3009/health`

---

## 🔐 Security Features

### Enabled by Default
- ✅ **Rate Limiting**: 100 requests per 15 minutes per IP
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options
- ✅ **CORS Protection**: Only allows specified origins
- ✅ **Request Compression**: Reduces bandwidth usage
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Session Management**: Single active session per user
- ✅ **Input Validation**: Prevents SQL injection and XSS
- ✅ **Error Handling**: No sensitive information leaked

### Production Security Checklist
- [ ] Change default admin password after first login
- [ ] Configure strong JWT secret in `.env.production`
- [ ] Set up HTTPS (optional but recommended)
- [ ] Configure email notifications for admin alerts
- [ ] Regular database backups
- [ ] Monitor system logs
- [ ] Keep Node.js and dependencies updated

---

## 📊 Monitoring & Maintenance

### Health Check
Visit `http://YOUR_PUBLIC_IP:3009/health` to check system status:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": "connected",
  "version": "2.1.0"
}
```

### Log Files
- **Application Logs**: `logs/app.log`
- **Error Logs**: Console output and `logs/app.log`
- **Access Logs**: Included in application logs

### System Monitoring
```bash
# Check system status
.\check-status.bat

# View recent logs
Get-Content logs\app.log -Tail 50

# Monitor real-time logs
Get-Content logs\app.log -Wait
```

---

## 🚨 Troubleshooting

### Cannot Access from Internet
1. **Check Windows Firewall**:
   ```powershell
   Get-NetFirewallRule -DisplayName "*ACE CSS*"
   ```

2. **Test Local Access**:
   ```bash
   curl http://localhost:8085
   curl http://localhost:3009/health
   ```

3. **Verify Port Forwarding**: Check your router's admin panel

4. **Check ISP Blocking**: Some ISPs block certain ports

### Database Connection Issues
1. **Test MySQL Connection**:
   ```bash
   mysql -h 192.168.46.89 -u root -p
   ```

2. **Check Database Exists**:
   ```sql
   SHOW DATABASES LIKE 'cyber_security_leave_portal';
   ```

3. **Verify Credentials**: Check `.env.production` file

### Application Won't Start
1. **Check Node.js Version**:
   ```bash
   node --version  # Should be 14+
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Check Ports in Use**:
   ```bash
   netstat -an | findstr "8085\|3009"
   ```

### Performance Issues
1. **Monitor System Resources**:
   - CPU usage < 80%
   - RAM usage < 8GB
   - Disk space > 10GB free

2. **Database Optimization**:
   ```sql
   -- Check active connections
   SHOW PROCESSLIST;
   
   -- Optimize tables
   OPTIMIZE TABLE users, students, leave_requests, od_requests;
   ```

---

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks
1. **Weekly**:
   - Check system logs
   - Monitor disk space
   - Backup database

2. **Monthly**:
   - Update Node.js dependencies: `npm update`
   - Review security logs
   - Clean old log files

3. **Quarterly**:
   - Update Node.js version
   - Security audit
   - Performance review

### Backup Strategy
```bash
# Database backup
mysqldump -h 192.168.46.89 -u root -p cyber_security_leave_portal > backup_$(date +%Y%m%d).sql

# File backups
# Backup uploads directory
robocopy "backend\uploads" "backups\uploads_$(date +%Y%m%d)" /E

# Configuration backup
copy .env.production backups\
copy logs\app.log backups\
```

---

## 📞 Support & Contact

### Getting Help
1. **Check Documentation**: Review all `.md` files in the project
2. **Check Health Status**: `http://YOUR_PUBLIC_IP:3009/health`
3. **Review Logs**: `logs/app.log`
4. **Run Diagnostics**: `.\check-status.bat`

### Common Support Scenarios
- **Login Issues**: Check user credentials in database
- **File Upload Problems**: Check disk space and permissions
- **Performance Issues**: Review logs and system resources
- **Network Problems**: Test firewall and connectivity

---

## 📋 Production Checklist

### Pre-Deployment
- [ ] Public IP address obtained
- [ ] DNS configured (optional)
- [ ] Firewall rules configured
- [ ] Database server accessible
- [ ] SSL certificate installed (optional)

### Deployment
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database schema imported
- [ ] Default admin account secured
- [ ] Firewall rules applied
- [ ] Services started

### Post-Deployment
- [ ] Health check passes
- [ ] External access verified
- [ ] Login functionality tested
- [ ] File uploads working
- [ ] Email notifications configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented

---

**🎯 Your Leave Portal is now production-ready!**

Access your system at: `http://YOUR_PUBLIC_IP:8085`

Default login: `admin` / `admin123` (Change immediately!)

---

*Generated by ACE CSS Leave Portal Setup v2.1.0*
