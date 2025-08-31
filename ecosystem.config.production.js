// Load environment variables
require('dotenv').config({ path: '.env.production' });

module.exports = {
  apps: [
    {
      name: 'ace-css-leave-portal-backend',
      script: './backend/server.production.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.BACKEND_PORT || process.env.PORT || 3009,
        PUBLIC_IP: process.env.PUBLIC_IP || 'localhost',
        SERVER_IP: process.env.SERVER_IP || process.env.PUBLIC_IP || 'localhost',
        DOMAIN: process.env.DOMAIN || process.env.PUBLIC_IP || 'localhost'
      },
      env_production: {
        NODE_ENV: 'production', 
        PORT: process.env.BACKEND_PORT || process.env.PORT || 3009,
        PUBLIC_IP: process.env.PUBLIC_IP || 'localhost',
        SERVER_IP: process.env.SERVER_IP || process.env.PUBLIC_IP || 'localhost',
        DOMAIN: process.env.DOMAIN || process.env.PUBLIC_IP || 'localhost'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log', 
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    },
    {
      name: 'ace-css-leave-portal-frontend',
      script: 'node_modules/.bin/vite',
      args: `preview --config vite.config.production.ts --host 0.0.0.0 --port ${process.env.FRONTEND_PORT || 8085}`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PUBLIC_IP: process.env.PUBLIC_IP || 'localhost',
        SERVER_IP: process.env.SERVER_IP || process.env.PUBLIC_IP || 'localhost',
        DOMAIN: process.env.DOMAIN || process.env.PUBLIC_IP || 'localhost',
        FRONTEND_PORT: process.env.FRONTEND_PORT || 8085,
        BACKEND_PORT: process.env.BACKEND_PORT || process.env.PORT || 3009,
        ACCESS_PROTOCOL: process.env.ACCESS_PROTOCOL || 'http',
        VITE_API_URL: process.env.VITE_API_URL || `${process.env.ACCESS_PROTOCOL || 'http'}://${process.env.PUBLIC_IP || 'localhost'}:${process.env.BACKEND_PORT || process.env.PORT || 3009}`
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log', 
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    },
    {
      name: 'ace-css-leave-portal-redirect',
      script: 'node',
      args: `-e "const http = require('http'); const publicIp = '${process.env.PUBLIC_IP || 'localhost'}'; const frontendPort = '${process.env.FRONTEND_PORT || 8085}'; const protocol = '${process.env.ACCESS_PROTOCOL || 'http'}'; const server = http.createServer((req, res) => { res.writeHead(301, { 'Location': protocol + '://' + publicIp + ':' + frontendPort + req.url }); res.end(); }); server.listen(${process.env.REDIRECT_PORT || 80}, '0.0.0.0', () => console.log('Redirect server running on port ${process.env.REDIRECT_PORT || 80}'));"`,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PUBLIC_IP: process.env.PUBLIC_IP || 'localhost',
        SERVER_IP: process.env.SERVER_IP || process.env.PUBLIC_IP || 'localhost',
        FRONTEND_PORT: process.env.FRONTEND_PORT || 8085,
        REDIRECT_PORT: process.env.REDIRECT_PORT || 80,
        ACCESS_PROTOCOL: process.env.ACCESS_PROTOCOL || 'http'
      },
      error_file: './logs/redirect-error.log',
      out_file: './logs/redirect-out.log',
      log_file: './logs/redirect-combined.log',
      time: true,
      max_memory_restart: '100M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      // Windows specific settings
      windowsHide: true,
      autorestart: true
    }
  ]
};
