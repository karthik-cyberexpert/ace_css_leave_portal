# 🔐 Security Hardening Guide for ACE CS Leave Portal

This guide provides comprehensive security hardening steps and best practices for your leave portal application.

## 🚨 Immediate Actions Required

### 1. Fix Git Repository Access
First, resolve the git ownership issue:
```powershell
git config --global --add safe.directory "C:/ACE_Hosur/Projects/ACE_cs_leaveportal"
```

### 2. Rotate All Exposed Secrets
**⚠️ CRITICAL**: The following secrets were exposed in your repository and must be rotated immediately:

- **Database Password**: `Ace_cs@2025` 
- **SMTP Credentials**: `adhiyamaancyber@gmail.com` with app password `clvl ovxg iocd atan`
- **Public IP**: `210.212.246.131`

**Actions to take:**
1. Change MySQL root password
2. Regenerate Gmail app-specific password or use different email account
3. Update all environment files with new credentials

### 3. Clean Git History
Remove secrets from git history (⚠️ **Backup first**):
```powershell
# Install git-filter-repo if not available
# pip install git-filter-repo

# Remove sensitive files from history
git filter-repo --path .env.production.template --invert-paths
git filter-repo --path .env --invert-paths
git filter-repo --path .env.production --invert-paths

# Force push (only if you control all clones)
git push origin --force --all
```

## 🛡️ Security Enhancements Applied

### Environment Security
- ✅ Updated `.gitignore` to exclude all `.env*` files (except templates)
- ✅ Scrubbed real credentials from `.env.production.template`
- ✅ Created secure `.env.example` for development
- ✅ Added comprehensive environment variable documentation

### Network Security
- ✅ Removed wildcard host allowances from Vite config
- ✅ Environment-driven allowed hosts configuration
- ✅ Proper CORS origin validation

### Backend Security Module
- ✅ Created `backend/config/security.js` with:
  - Helmet security headers (CSP, HSTS, XSS protection)
  - Strict CORS configuration
  - Rate limiting (general + auth-specific)
  - Request sanitization and suspicious pattern detection
  - Security event logging
  - Response compression

## 🔧 Implementation Steps

### 1. Apply Backend Security Middleware

Edit your `backend/server.js` to include the security middleware:

```javascript
// Add at the top of server.js
const { applySecurityMiddleware } = require('./config/security');

// After creating the Express app but before routes
const app = express();

// Apply security middleware (add this line)
applySecurityMiddleware(app);

// ... rest of your middleware and routes
```

### 2. Environment Configuration

Create your environment files:

```powershell
# For local development
cp .env.example .env
# Edit .env with your local settings

# For production
cp .env.production.template .env.production
# Edit .env.production with your production settings
```

### 3. Generate Strong Secrets

Generate secure JWT secret:
```powershell
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 2: Using OpenSSL (if available)
openssl rand -base64 48
```

### 4. Database Security

**Secure your MySQL installation:**
```sql
-- Change root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_strong_password';

-- Create dedicated application user
CREATE USER 'leaveportal'@'localhost' IDENTIFIED BY 'strong_app_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON cyber_security_leave_portal.* TO 'leaveportal'@'localhost';
FLUSH PRIVILEGES;
```

### 5. File Upload Security

The uploads directory is now excluded from git. Ensure proper permissions:
```powershell
# Windows - restrict access to uploads directory
icacls "backend\uploads" /grant:r "Users:(R,W)" /t
```

## 🔍 Security Checklist

### Authentication & Authorization
- [ ] Change default admin credentials (`admin/admin123`)
- [ ] Implement strong password policy
- [ ] Add 2FA for admin accounts
- [ ] Set up session timeout
- [ ] Implement account lockout after failed attempts

### Network Security
- [ ] Enable HTTPS in production
- [ ] Configure reverse proxy (nginx/IIS)
- [ ] Set up firewall rules
- [ ] Disable unnecessary ports
- [ ] Use VPN for admin access

### Application Security
- [ ] Apply security middleware from `backend/config/security.js`
- [ ] Validate and sanitize all inputs
- [ ] Implement CSRF protection
- [ ] Add request size limits
- [ ] Configure secure headers

### Database Security
- [ ] Use dedicated database user (not root)
- [ ] Enable database SSL/TLS
- [ ] Regular database backups
- [ ] Encrypt sensitive data at rest
- [ ] Monitor database access logs

### File Security
- [ ] Restrict file upload types
- [ ] Scan uploaded files for malware
- [ ] Store uploads outside web root
- [ ] Implement file size limits
- [ ] Generate unique filenames

### Monitoring & Logging
- [ ] Set up centralized logging
- [ ] Monitor authentication attempts
- [ ] Log file access and modifications
- [ ] Set up alerts for suspicious activity
- [ ] Regular security audit logs

## 🚀 Production Deployment Security

### 1. Server Hardening
```powershell
# Update system
# Windows Update or WSUS

# Configure Windows Firewall
New-NetFirewallRule -DisplayName "Leave Portal Backend" -Direction Inbound -Protocol TCP -LocalPort 3009 -Action Allow
New-NetFirewallRule -DisplayName "Leave Portal Frontend" -Direction Inbound -Protocol TCP -LocalPort 8085 -Action Allow
```

### 2. SSL/TLS Configuration
- Obtain SSL certificates (Let's Encrypt or commercial)
- Configure HTTPS redirects
- Set SECURE_COOKIES=true in production
- Enable HSTS headers

### 3. Process Management
- Use PM2 with cluster mode (already configured)
- Set up process monitoring
- Configure automatic restarts
- Implement health checks

### 4. Reverse Proxy Setup
Consider setting up nginx or IIS as reverse proxy:
- SSL termination
- Request buffering
- Static file serving
- Load balancing

## 📊 Security Monitoring

### Log Analysis
Monitor these log patterns:
- Failed authentication attempts
- Rate limit violations
- Suspicious request patterns
- File upload activities
- Admin access events

### Health Checks
Implement monitoring for:
- Application availability
- Database connectivity
- File system permissions
- SSL certificate expiry
- Security header presence

## 🔄 Regular Maintenance

### Monthly Tasks
- [ ] Rotate JWT secrets
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Check for security advisories
- [ ] Backup verification

### Quarterly Tasks
- [ ] Penetration testing
- [ ] Security policy review
- [ ] User access audit
- [ ] Disaster recovery test
- [ ] Security training updates

## 📞 Incident Response

### Security Incident Checklist
1. **Isolate** - Disconnect affected systems
2. **Assess** - Determine scope and impact
3. **Contain** - Prevent further damage
4. **Eradicate** - Remove threats
5. **Recover** - Restore normal operations
6. **Learn** - Document and improve

### Emergency Contacts
- System Administrator
- Database Administrator
- Security Team
- Legal/Compliance Team

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MySQL Security Guide](https://dev.mysql.com/doc/refman/8.0/en/security-guidelines.html)

---

## ⚡ Quick Security Wins

1. **Right Now**: Fix git access and rotate secrets
2. **Next**: Apply security middleware to server.js
3. **Today**: Set up proper environment files
4. **This Week**: Enable HTTPS and configure firewall
5. **This Month**: Implement monitoring and backups

Remember: Security is an ongoing process, not a one-time setup!
