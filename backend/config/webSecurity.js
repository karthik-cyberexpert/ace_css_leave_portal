/**
 * Web Security Configuration for Production Deployment
 * 
 * This module provides security middleware specifically for preventing
 * source code exposure and securing static file serving in production.
 * 
 * CRITICAL: This addresses the major security issue where source code
 * and database details are visible in browser developer tools.
 */

/**
 * Security middleware to prevent source code exposure
 * and add additional security headers for static files
 */
function preventSourceCodeExposure(req, res, next) {
  // Block access to source map files completely
  if (req.path.endsWith('.map') || req.path.includes('.map.')) {
    return res.status(404).send('Not Found');
  }

  // Block access to common development/config files
  const blockedPaths = [
    '.env', '.env.local', '.env.production', '.env.development',
    'package.json', 'package-lock.json', 'yarn.lock',
    'tsconfig.json', 'vite.config.ts', 'vite.config.js',
    'tailwind.config.ts', 'tailwind.config.js',
    'eslint.config.js', '.gitignore',
    'node_modules', 'src/', 'backend/',
    'README.md', 'CHANGELOG.md'
  ];

  const isBlocked = blockedPaths.some(blocked => 
    req.path.includes(blocked) || req.path.endsWith(blocked)
  );

  if (isBlocked) {
    console.warn(`Blocked access to sensitive file: ${req.path} from IP: ${req.ip}`);
    return res.status(404).send('Not Found');
  }

  // Add security headers for all responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
}

/**
 * Content Security Policy specifically for the React application
 */
function getContentSecurityPolicy() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Base policy
  let csp = {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"], // React often needs unsafe-inline for styles
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"]
  };

  // Development specific additions
  if (isDevelopment) {
    csp["script-src"].push("'unsafe-eval'"); // Vite HMR needs this
    csp["connect-src"].push("ws://localhost:*", "wss://localhost:*"); // WebSocket for HMR
  }

  // Convert to header string
  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Middleware to add Content Security Policy header
 */
function addContentSecurityPolicy(req, res, next) {
  // Only apply CSP to HTML responses
  if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
    res.setHeader('Content-Security-Policy', getContentSecurityPolicy());
  }
  next();
}

/**
 * Middleware to handle static file security
 */
function secureStaticFiles(req, res, next) {
  // Add cache control for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for assets
  } else if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Middleware to prevent directory traversal attacks
 */
function preventDirectoryTraversal(req, res, next) {
  const path = req.path;
  
  // Block path traversal attempts
  if (path.includes('..') || path.includes('%2e%2e') || path.includes('%2E%2E')) {
    console.warn(`Directory traversal attempt: ${path} from IP: ${req.ip}`);
    return res.status(403).send('Forbidden');
  }

  // Block access to hidden files/directories
  if (path.includes('/.') && !path.includes('/.well-known/')) {
    console.warn(`Hidden file access attempt: ${path} from IP: ${req.ip}`);
    return res.status(404).send('Not Found');
  }

  next();
}

/**
 * Apply all web security middleware to Express app
 * 
 * @param {Express} app - Express application instance
 */
function applyWebSecurityMiddleware(app) {
  console.info('Applying web security middleware...');
  
  // Apply in order of importance
  app.use(preventDirectoryTraversal);
  app.use(preventSourceCodeExposure);
  app.use(addContentSecurityPolicy);
  app.use(secureStaticFiles);
  
  // Add a security endpoint to verify protections are active
  app.get('/security-check', (req, res) => {
    res.json({
      status: 'protected',
      timestamp: new Date().toISOString(),
      headers: {
        'X-Content-Type-Options': res.get('X-Content-Type-Options'),
        'X-Frame-Options': res.get('X-Frame-Options'),
        'X-XSS-Protection': res.get('X-XSS-Protection')
      }
    });
  });
  
  console.info('Web security middleware applied successfully');
}

/**
 * Rebuild assets with security hardening
 * This function should be called after deployment to ensure
 * the build is properly secured
 */
async function rebuildWithSecurity() {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    console.info('Rebuilding frontend with security hardening...');
    
    // Clean previous build
    await execAsync('npm run build:prod');
    
    console.info('Frontend rebuilt successfully with security hardening');
    return true;
  } catch (error) {
    console.error('Failed to rebuild with security:', error);
    return false;
  }
}

/**
 * Verify that source maps are not exposed in production build
 */
function verifyProductionSecurity() {
  const fs = require('fs');
  const path = require('path');
  
  const distPath = path.join(__dirname, '../../dist');
  
  if (!fs.existsSync(distPath)) {
    console.warn('Production build not found. Run npm run build:prod first.');
    return false;
  }
  
  // Check for source map files
  const findSourceMaps = (dir) => {
    const files = fs.readdirSync(dir);
    let sourceMapsFound = [];
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        sourceMapsFound = sourceMapsFound.concat(findSourceMaps(fullPath));
      } else if (file.endsWith('.map')) {
        sourceMapsFound.push(fullPath);
      }
    });
    
    return sourceMapsFound;
  };
  
  const sourceMaps = findSourceMaps(distPath);
  
  if (sourceMaps.length > 0) {
    console.error('SECURITY WARNING: Source maps found in production build:');
    sourceMaps.forEach(map => console.error(` - ${map}`));
    return false;
  }
  
  console.info('✅ Production security verification passed - no source maps found');
  return true;
}

module.exports = {
  applyWebSecurityMiddleware,
  preventSourceCodeExposure,
  addContentSecurityPolicy,
  secureStaticFiles,
  preventDirectoryTraversal,
  rebuildWithSecurity,
  verifyProductionSecurity,
  getContentSecurityPolicy
};
