import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  red: '\x1b[31m%s\x1b[0m',
  green: '\x1b[32m%s\x1b[0m',
  yellow: '\x1b[33m%s\x1b[0m',
  blue: '\x1b[34m%s\x1b[0m',
  magenta: '\x1b[35m%s\x1b[0m',
  cyan: '\x1b[36m%s\x1b[0m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupProduction() {
  console.log(colors.cyan, '🚀 ACE CSS Leave Portal - Production Setup');
  console.log(colors.cyan, '==========================================');
  console.log();

  try {
    // Get public IP from user
    let publicIP;
    while (true) {
      publicIP = await askQuestion('Enter your college\'s public IP address: ');
      
      if (!publicIP) {
        console.log(colors.red, '❌ Public IP cannot be empty!');
        continue;
      }

      // Basic IP validation
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(publicIP)) {
        console.log(colors.red, '❌ Please enter a valid IP address (e.g., 203.0.113.10)');
        continue;
      }

      const parts = publicIP.split('.');
      if (parts.some(part => parseInt(part) > 255)) {
        console.log(colors.red, '❌ Please enter a valid IP address (each part should be 0-255)');
        continue;
      }

      break;
    }

    console.log(colors.green, `✅ Using public IP: ${publicIP}`);
    console.log();

    // Get database password
    const dbPassword = await askQuestion('Enter MySQL root password (leave empty if no password): ');
    
    // Get email configuration
    console.log(colors.yellow, '\n📧 Email Configuration (Optional - for notifications):');
    const smtpUser = await askQuestion('SMTP Email (leave empty to skip): ');
    let smtpPass = '';
    if (smtpUser) {
      smtpPass = await askQuestion('SMTP Password: ');
    }

    console.log(colors.yellow, '\n🔧 Configuring production environment...');

    // Update .env.production
    const envProductionPath = path.join(__dirname, '..', '.env.production');
    let envContent = fs.readFileSync(envProductionPath, 'utf8');
    
    envContent = envContent.replace(/YOUR_PUBLIC_IP/g, publicIP);
    envContent = envContent.replace('DB_PASSWORD=your_mysql_password', `DB_PASSWORD=${dbPassword}`);
    
    if (smtpUser) {
      envContent = envContent.replace('SMTP_USER=your_email@gmail.com', `SMTP_USER=${smtpUser}`);
      envContent = envContent.replace('SMTP_PASS=your_email_password', `SMTP_PASS=${smtpPass}`);
    }

    fs.writeFileSync(envProductionPath, envContent);
    console.log(colors.green, '✅ Updated .env.production');

    // Update vite.config.production.ts
    const viteConfigPath = path.join(__dirname, '..', 'vite.config.production.ts');
    let viteContent = fs.readFileSync(viteConfigPath, 'utf8');
    viteContent = viteContent.replace(/YOUR_PUBLIC_IP/g, publicIP);
    fs.writeFileSync(viteConfigPath, viteContent);
    console.log(colors.green, '✅ Updated vite.config.production.ts');

    // Create logs directory
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    console.log(colors.green, '✅ Created logs directory');

    // Create production start script
    const startScript = `@echo off
echo Starting ACE CSS Leave Portal in Production Mode
echo ================================================
echo.
echo Public IP: ${publicIP}
echo Frontend: http://${publicIP}:8080
echo Backend: http://${publicIP}:3002
echo Health Check: http://${publicIP}:3002/health
echo.
echo Starting servers...
npm run start
pause
`;

    fs.writeFileSync(path.join(__dirname, '..', 'start-production.bat'), startScript);
    console.log(colors.green, '✅ Created start-production.bat');

    // Create production status check script
    const statusScript = `@echo off
echo ACE CSS Leave Portal - Status Check
echo ====================================
echo.
echo Testing connectivity to ${publicIP}...
echo.
ping -n 4 ${publicIP}
echo.
echo Testing backend health...
curl -f http://${publicIP}:3002/health
echo.
echo Testing frontend...
curl -f http://${publicIP}:8080
echo.
pause
`;

    fs.writeFileSync(path.join(__dirname, '..', 'check-status.bat'), statusScript);
    console.log(colors.green, '✅ Created check-status.bat');

    // Create firewall configuration script
    const firewallScript = `# ACE CSS Leave Portal - Windows Firewall Configuration
# Run as Administrator

Write-Host "Configuring Windows Firewall for ACE CSS Leave Portal..." -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Allow inbound traffic on port 8080 (Frontend)
New-NetFirewallRule -DisplayName "ACE CSS Leave Portal Frontend" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
Write-Host "✅ Allowed port 8080 (Frontend)" -ForegroundColor Green

# Allow inbound traffic on port 3002 (Backend)
New-NetFirewallRule -DisplayName "ACE CSS Leave Portal Backend" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow
Write-Host "✅ Allowed port 3002 (Backend)" -ForegroundColor Green

# Allow inbound traffic on port 3306 (MySQL)
New-NetFirewallRule -DisplayName "MySQL Server" -Direction Inbound -Protocol TCP -LocalPort 3306 -Action Allow
Write-Host "✅ Allowed port 3306 (MySQL)" -ForegroundColor Green

Write-Host ""
Write-Host "Firewall configuration completed!" -ForegroundColor Green
Write-Host "Your portal is now accessible from:" -ForegroundColor Yellow
Write-Host "  Frontend: http://${publicIP}:8080" -ForegroundColor White
Write-Host "  Backend:  http://${publicIP}:3002" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue..."
`;

    fs.writeFileSync(path.join(__dirname, '..', 'configure-firewall.ps1'), firewallScript);
    console.log(colors.green, '✅ Created configure-firewall.ps1');

    // Create installation guide
    const installGuide = `# ACE CSS Leave Portal - Production Installation Guide

## 🚀 Quick Start

Your Leave Portal system has been configured with the following settings:

**Public Access URLs:**
- Frontend: http://${publicIP}:8080
- Backend API: http://${publicIP}:3002
- Health Check: http://${publicIP}:3002/health

## 📋 Installation Steps

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Windows Firewall (Run as Administrator)
\`\`\`powershell
# Right-click PowerShell -> Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\\configure-firewall.ps1
\`\`\`

### 3. Setup Database
Make sure MySQL is running and accessible. The system will connect to:
- Host: 192.168.46.89
- Database: cyber_security_leave_portal
- Port: 3306

### 4. Start Production Server
\`\`\`bash
# Option 1: Use the batch file
start-production.bat

# Option 2: Use npm directly
npm run start
\`\`\`

### 5. Verify Installation
\`\`\`bash
# Check system status
check-status.bat

# Or manually test:
curl http://${publicIP}:3002/health
\`\`\`

## 🔧 Configuration Files

- \`.env.production\` - Production environment variables
- \`vite.config.production.ts\` - Frontend production config
- \`backend/server.production.js\` - Backend production server

## 🔐 Security Features Enabled

- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Security headers (Helmet.js)
- ✅ CORS protection
- ✅ Request compression
- ✅ JWT session management
- ✅ Input validation and sanitization
- ✅ Comprehensive logging

## 🌐 Network Access

The system is configured to accept connections from:
- Local network (192.168.x.x)
- Public IP (${publicIP})
- Localhost (for maintenance)

## 📊 Monitoring

- **Logs**: Check \`logs/app.log\` for system logs
- **Health Check**: Visit http://${publicIP}:3002/health
- **System Status**: Run \`check-status.bat\`

## 🚨 Troubleshooting

### Cannot Access from Public IP
1. Check Windows Firewall: \`configure-firewall.ps1\`
2. Verify router port forwarding (if behind NAT)
3. Check ISP blocking policies

### Database Connection Issues
1. Verify MySQL is running on 192.168.46.89
2. Check database credentials in \`.env.production\`
3. Ensure database \`cyber_security_leave_portal\` exists

### Application Errors
1. Check logs in \`logs/app.log\`
2. Verify all dependencies are installed: \`npm install\`
3. Check Node.js version (requires Node 14+)

## 📞 Support

For technical support or issues:
1. Check the logs: \`logs/app.log\`
2. Run health check: \`check-status.bat\`
3. Review the troubleshooting guides in the documentation

---
**Generated on:** ${new Date().toLocaleString()}
**Public IP:** ${publicIP}
**Version:** 2.1.0 Production Ready
`;

    fs.writeFileSync(path.join(__dirname, '..', 'PRODUCTION_SETUP_COMPLETE.md'), installGuide);
    console.log(colors.green, '✅ Created PRODUCTION_SETUP_COMPLETE.md');

    console.log();
    console.log(colors.cyan, '🎉 Production Setup Complete!');
    console.log(colors.cyan, '=============================');
    console.log();
    console.log(colors.green, '✅ All configuration files updated');
    console.log(colors.green, '✅ Scripts generated');
    console.log(colors.green, '✅ Documentation created');
    console.log();
    console.log(colors.yellow, '📋 Next Steps:');
    console.log(colors.white, '1. Install dependencies: npm install');
    console.log(colors.white, '2. Configure firewall: configure-firewall.ps1 (Run as Admin)');
    console.log(colors.white, '3. Start production server: start-production.bat');
    console.log(colors.white, '4. Test access: check-status.bat');
    console.log();
    console.log(colors.magenta, `🌐 Your portal will be accessible at: http://${publicIP}:8080`);
    console.log(colors.magenta, `📊 Health check: http://${publicIP}:3002/health`);
    console.log();
    console.log(colors.cyan, '📚 See PRODUCTION_SETUP_COMPLETE.md for detailed instructions');

  } catch (error) {
    console.log(colors.red, `❌ Setup failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run setup
setupProduction().catch(console.error);
