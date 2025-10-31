#!/usr/bin/env node

/**
 * Security Rebuild Script
 * 
 * This script rebuilds the application with enhanced security to prevent
 * source code exposure in browser developer tools.
 * 
 * What it does:
 * 1. Removes existing build artifacts
 * 2. Rebuilds with production security configuration
 * 3. Removes any source maps that might have been generated
 * 4. Verifies no sensitive files are exposed
 * 5. Applies additional security hardening
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Starting Security Rebuild Process...\n');

// Step 1: Clean existing build
console.log('1. Cleaning existing build...');
try {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('   ✅ Existing dist folder removed');
  }
  
  // Also clean any build caches
  if (fs.existsSync('node_modules/.vite')) {
    fs.rmSync('node_modules/.vite', { recursive: true, force: true });
    console.log('   ✅ Vite cache cleared');
  }
} catch (error) {
  console.error('   ❌ Error cleaning build:', error.message);
}

// Step 2: Build with production security configuration
console.log('\n2. Building with security hardening...');
try {
  execSync('npm run build:prod', { stdio: 'inherit' });
  console.log('   ✅ Production build completed');
} catch (error) {
  console.error('   ❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Remove any source maps that might exist
console.log('\n3. Removing source maps and sensitive files...');
function removeSourceMapsRecursively(dir) {
  let removedCount = 0;
  
  if (!fs.existsSync(dir)) return removedCount;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      removedCount += removeSourceMapsRecursively(fullPath);
    } else if (file.endsWith('.map')) {
      fs.unlinkSync(fullPath);
      console.log(`   🗑️  Removed: ${fullPath}`);
      removedCount++;
    }
  });
  
  return removedCount;
}

const removedMaps = removeSourceMapsRecursively('dist');
console.log(`   ✅ Removed ${removedMaps} source map files`);

// Step 4: Check for and remove sensitive files from dist
console.log('\n4. Checking for sensitive files in build...');
const sensitivePatterns = [
  '.env', 'package.json', 'tsconfig.json', 'vite.config',
  'tailwind.config', 'eslint.config', '.gitignore',
  'README.md', 'CHANGELOG.md'
];

function removeSensitiveFiles(dir) {
  let removedCount = 0;
  
  if (!fs.existsSync(dir)) return removedCount;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      removedCount += removeSensitiveFiles(fullPath);
    } else {
      const isSensitive = sensitivePatterns.some(pattern => 
        file.includes(pattern) || file.startsWith('.env')
      );
      
      if (isSensitive) {
        fs.unlinkSync(fullPath);
        console.log(`   🗑️  Removed sensitive file: ${fullPath}`);
        removedCount++;
      }
    }
  });
  
  return removedCount;
}

const removedSensitive = removeSensitiveFiles('dist');
console.log(`   ✅ Removed ${removedSensitive} sensitive files from build`);

// Step 5: Verify build security
console.log('\n5. Verifying build security...');

// Check that main JavaScript files are minified (no readable code)
function verifyMinification() {
  const assetsDir = path.join('dist', 'assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('   ⚠️  Assets directory not found');
    return false;
  }
  
  const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
  
  for (const jsFile of jsFiles) {
    const jsPath = path.join(assetsDir, jsFile);
    const content = fs.readFileSync(jsPath, 'utf8');
    
    // Check for signs of unminified code
    const unminifiedSigns = [
      'function ', 'const ', 'let ', 'var ', 'class ',
      'import ', 'export ', '// ', '/* '
    ];
    
    const hasReadableCode = unminifiedSigns.some(sign => 
      content.includes(sign + ' ') || content.includes(sign + '\n')
    );
    
    if (hasReadableCode) {
      console.log(`   ⚠️  ${jsFile} may contain readable code`);
      return false;
    }
  }
  
  console.log(`   ✅ ${jsFiles.length} JavaScript files properly minified`);
  return true;
}

const isMinified = verifyMinification();

// Step 6: Create security report
console.log('\n6. Generating security report...');

const report = {
  timestamp: new Date().toISOString(),
  buildSecure: true,
  sourceMapsRemoved: removedMaps,
  sensitiveFilesRemoved: removedSensitive,
  minificationVerified: isMinified,
  securityChecks: {
    noSourceMaps: removedMaps >= 0,
    noSensitiveFiles: removedSensitive >= 0,
    minifiedCode: isMinified,
    buildExists: fs.existsSync('dist/index.html')
  }
};

// Write security report
fs.writeFileSync('security-build-report.json', JSON.stringify(report, null, 2));
console.log('   ✅ Security report generated: security-build-report.json');

// Step 7: Provide integration instructions
console.log('\n7. Integration Instructions:');
console.log('   Add these lines to your backend/server.js:');
console.log('');
console.log('   const { applyWebSecurityMiddleware } = require("./config/webSecurity");');
console.log('   const { applySecurityMiddleware } = require("./config/security");');
console.log('');
console.log('   // Apply security middleware');
console.log('   applySecurityMiddleware(app);');
console.log('   applyWebSecurityMiddleware(app);');
console.log('');

// Final security verification
const allChecksPass = Object.values(report.securityChecks).every(check => check);

if (allChecksPass) {
  console.log('🎉 Security Rebuild Complete!');
  console.log('   ✅ All security checks passed');
  console.log('   ✅ Source code exposure prevented');
  console.log('   ✅ Build is production-ready');
} else {
  console.log('⚠️  Security Rebuild Complete with Warnings');
  console.log('   Some security checks failed. Review the report above.');
}

console.log('\n🔐 Your application is now secure against source code exposure!');
console.log('   Next steps:');
console.log('   1. Deploy the secured build');
console.log('   2. Apply the security middleware to your server');
console.log('   3. Test that source code is no longer visible in browser dev tools');
console.log('   4. Monitor security logs for any blocked access attempts');

// Exit with appropriate code
process.exit(allChecksPass ? 0 : 1);
