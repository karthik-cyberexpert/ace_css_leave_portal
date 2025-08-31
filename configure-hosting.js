#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Predefined configuration for this specific deployment
const DEPLOYMENT_CONFIG = {
    PUBLIC_IP: '210.212.246.131',
    FRONTEND_PORT: 8085,
    BACKEND_PORT: 3009,
    DATABASE_PORT: 3307,
    REDIRECT_PORT: 8080  // Keep redirect port as 8080 for compatibility
};

console.log('🚀 ACE CSS Leave Portal - Auto Configuration');
console.log('=' .repeat(50));
console.log(`📍 Using predefined IP: ${DEPLOYMENT_CONFIG.PUBLIC_IP}`);
console.log(`🔌 Frontend Port: ${DEPLOYMENT_CONFIG.FRONTEND_PORT}`);
console.log(`🔌 Backend Port: ${DEPLOYMENT_CONFIG.BACKEND_PORT}`);
console.log(`🔌 Database Port: ${DEPLOYMENT_CONFIG.DATABASE_PORT}`);
console.log('=' .repeat(50));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question, defaultValue = '') {
    return new Promise((resolve) => {
        const displayDefault = defaultValue ? ` (default: ${defaultValue})` : '';
        rl.question(`${question}${displayDefault}: `, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

function generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

function createEnvironmentFile(config) {
    const envContent = `# ACE CSS Leave Portal - Production Configuration
# Auto-generated on ${new Date().toISOString()}

# Server Configuration
PUBLIC_IP=${config.publicIp}
VITE_PUBLIC_IP=${config.publicIp}
PROTOCOL=${config.protocol}
DOMAIN=${config.domain || config.publicIp}

# Port Configuration
FRONTEND_PORT=${config.frontendPort}
BACKEND_PORT=${config.backendPort}
DATABASE_PORT=${config.databasePort}
REDIRECT_PORT=${config.redirectPort}

# Vite Configuration
VITE_FRONTEND_PORT=${config.frontendPort}
VITE_BACKEND_PORT=${config.backendPort}
VITE_PROTOCOL=${config.protocol}
VITE_API_BASE_URL=${config.protocol}://${config.publicIp}:${config.backendPort}

# Database Configuration
DB_HOST=localhost
DB_PORT=${config.databasePort}
DB_NAME=leave_portal
DB_USER=root
DB_PASSWORD=${config.dbPassword}

# Security Configuration
JWT_SECRET=${config.jwtSecret}
SESSION_SECRET=${config.sessionSecret}

# CORS Configuration
CORS_ORIGIN=${config.protocol}://${config.publicIp}:${config.frontendPort}
ALLOWED_ORIGINS=${config.protocol}://${config.publicIp}:${config.frontendPort},${config.protocol}://localhost:${config.frontendPort}

# Email Configuration (Optional)
EMAIL_HOST=${config.emailHost}
EMAIL_PORT=${config.emailPort}
EMAIL_USER=${config.emailUser}
EMAIL_PASSWORD=${config.emailPassword}
EMAIL_FROM=${config.emailFrom}

# Production Environment
NODE_ENV=production
`;

    fs.writeFileSync('.env.production', envContent);
    console.log('✅ Created .env.production');
}

function createStartScript(config) {
    // Linux start script
    const linuxScript = `#!/bin/bash
echo "🚀 Starting ACE CSS Leave Portal in Production Mode..."
echo "📍 Server: ${config.protocol}://${config.publicIp}:${config.frontendPort}"
echo "🔧 Backend: ${config.protocol}://${config.publicIp}:${config.backendPort}"

# Load environment variables
if [ -f .env.production ]; then
    export \$(cat .env.production | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env.production not found!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Start services with PM2
echo "🚀 Starting services..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.production.js

# Show status
pm2 status
pm2 logs --lines 20

echo ""
echo "🎉 Leave Portal is now running!"
echo "🌐 Frontend: ${config.protocol}://${config.publicIp}:${config.frontendPort}"
echo "🔧 Backend:  ${config.protocol}://${config.publicIp}:${config.backendPort}"
echo ""
echo "📊 Monitor with: pm2 status"
echo "📝 View logs with: pm2 logs"
echo "🛑 Stop with: pm2 stop all"
`;

    // Windows start script
    const windowsScript = `@echo off
echo 🚀 Starting ACE CSS Leave Portal in Production Mode...
echo 📍 Server: ${config.protocol}://${config.publicIp}:${config.frontendPort}
echo 🔧 Backend: ${config.protocol}://${config.publicIp}:${config.backendPort}

REM Check for .env.production
if not exist .env.production (
    echo ❌ .env.production not found!
    pause
    exit /b 1
)

echo ✅ Environment configuration found

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

if not exist backend\\node_modules (
    echo 📦 Installing backend dependencies...
    cd backend
    npm install
    cd ..
)

REM Build frontend
echo 🏗️ Building frontend...
npm run build

REM Start services with PM2
echo 🚀 Starting services...
pm2 delete all >nul 2>&1
pm2 start ecosystem.config.production.js

REM Show status
pm2 status
pm2 logs --lines 20

echo.
echo 🎉 Leave Portal is now running!
echo 🌐 Frontend: ${config.protocol}://${config.publicIp}:${config.frontendPort}
echo 🔧 Backend:  ${config.protocol}://${config.publicIp}:${config.backendPort}
echo.
echo 📊 Monitor with: pm2 status
echo 📝 View logs with: pm2 logs
echo 🛑 Stop with: pm2 stop all
echo.
pause
`;

    fs.writeFileSync('start-production.sh', linuxScript, { mode: 0o755 });
    fs.writeFileSync('start-production.bat', windowsScript);
    console.log('✅ Created start-production.sh and start-production.bat');
}

function createValidationScript(config) {
    const validationScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 ACE CSS Leave Portal - Configuration Validation');
console.log('=' .repeat(50));

const checks = [];
const warnings = [];
const errors = [];

// Check .env.production exists
if (fs.existsSync('.env.production')) {
    checks.push('✅ .env.production exists');
    
    const envContent = fs.readFileSync('.env.production', 'utf8');
    
    // Check required variables
    const requiredVars = [
        'PUBLIC_IP', 'FRONTEND_PORT', 'BACKEND_PORT', 'DATABASE_PORT',
        'JWT_SECRET', 'DB_PASSWORD', 'CORS_ORIGIN'
    ];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(\`\${varName}=\`) && !envContent.includes(\`\${varName}=\${\`)) {
            checks.push(\`✅ \${varName} is configured\`);
        } else {
            errors.push(\`❌ \${varName} is missing or not configured\`);
        }
    });
    
    // Check for placeholder values
    if (envContent.includes('your_db_password_here')) {
        warnings.push('⚠️ Database password appears to be placeholder');
    }
    
} else {
    errors.push('❌ .env.production does not exist');
}

// Check PM2 ecosystem config
if (fs.existsSync('ecosystem.config.production.js')) {
    checks.push('✅ PM2 ecosystem config exists');
} else {
    errors.push('❌ ecosystem.config.production.js does not exist');
}

// Check Vite configs
if (fs.existsSync('vite.config.production.ts')) {
    checks.push('✅ Production Vite config exists');
} else {
    warnings.push('⚠️ vite.config.production.ts does not exist');
}

// Check backend server files
if (fs.existsSync('backend/server.production.js')) {
    checks.push('✅ Production backend server exists');
} else {
    errors.push('❌ backend/server.production.js does not exist');
}

// Check start scripts
if (fs.existsSync('start-production.sh') || fs.existsSync('start-production.bat')) {
    checks.push('✅ Start scripts exist');
} else {
    warnings.push('⚠️ No start scripts found');
}

// Display results
console.log('\\n📋 Configuration Checks:');
checks.forEach(check => console.log(check));

if (warnings.length > 0) {
    console.log('\\n⚠️ Warnings:');
    warnings.forEach(warning => console.log(warning));
}

if (errors.length > 0) {
    console.log('\\n❌ Errors:');
    errors.forEach(error => console.log(error));
    console.log('\\n🔧 Please fix the above errors before deployment.');
    process.exit(1);
} else if (warnings.length > 0) {
    console.log('\\n✅ Configuration is valid with some warnings.');
    console.log('🚀 You can proceed with deployment.');
} else {
    console.log('\\n🎉 Configuration is perfect! Ready to deploy.');
}

console.log('\\n📍 Expected URLs:');
console.log(\`🌐 Frontend: ${config.protocol}://${config.publicIp}:${config.frontendPort}\`);
console.log(\`🔧 Backend:  ${config.protocol}://${config.publicIp}:${config.backendPort}\`);
`;

    fs.writeFileSync('validate-configuration.js', validationScript, { mode: 0o755 });
    console.log('✅ Created validate-configuration.js');
}

async function main() {
    try {
        console.log('\n🔧 Configuring hosting settings...\n');

        // Use predefined values with minimal prompts for optional settings
        const config = {
            publicIp: DEPLOYMENT_CONFIG.PUBLIC_IP,
            frontendPort: DEPLOYMENT_CONFIG.FRONTEND_PORT,
            backendPort: DEPLOYMENT_CONFIG.BACKEND_PORT,
            databasePort: DEPLOYMENT_CONFIG.DATABASE_PORT,
            redirectPort: DEPLOYMENT_CONFIG.REDIRECT_PORT,
            protocol: await prompt('Protocol (http/https)', 'http'),
            domain: '', // Will use IP if not provided
            dbPassword: await prompt('Database password', 'your_secure_db_password'),
            jwtSecret: generateSecureSecret(64),
            sessionSecret: generateSecureSecret(32),
            emailHost: await prompt('Email SMTP host (optional)', ''),
            emailPort: await prompt('Email SMTP port (optional)', '587'),
            emailUser: await prompt('Email username (optional)', ''),
            emailPassword: await prompt('Email password (optional)', ''),
            emailFrom: await prompt('Email from address (optional)', '')
        };

        console.log('\n🏗️ Creating configuration files...\n');

        createEnvironmentFile(config);
        createStartScript(config);
        createValidationScript(config);

        console.log('\n🎉 Configuration Complete!\n');
        console.log('📁 Files created:');
        console.log('   ✅ .env.production');
        console.log('   ✅ start-production.sh (Linux)');
        console.log('   ✅ start-production.bat (Windows)');
        console.log('   ✅ validate-configuration.js');

        console.log('\n🚀 Next steps:');
        console.log('   1. Review the generated .env.production file');
        console.log('   2. Update database password if needed');
        console.log('   3. Run: node validate-configuration.js');
        console.log('   4. Deploy: start-production.bat (Windows) or ./start-production.sh (Linux)');

        console.log('\n📍 Your portal will be available at:');
        console.log(`   🌐 Frontend: ${config.protocol}://${config.publicIp}:${config.frontendPort}`);
        console.log(`   🔧 Backend:  ${config.protocol}://${config.publicIp}:${config.backendPort}`);

    } catch (error) {
        console.error('\n❌ Configuration failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = { DEPLOYMENT_CONFIG };
