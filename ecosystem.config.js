module.exports = {
  apps: [
    {
      // Backend Application
      name: 'ace-css-leave-portal-backend',
      script: 'backend/server.production.js',
      instances: 'max', // Uses all CPU cores
      exec_mode: 'cluster',
      
      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Logging (Windows paths)
      log_file: './logs/backend-combined.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3009,
        HOST: '0.0.0.0'
      },
      
      // Advanced Options
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Auto-restart on file changes (disabled for production)
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Source map support
      source_map_support: true,
      
      // Windows specific settings
      windowsHide: true,
      
      // Instance variables
      instance_var: 'INSTANCE_ID'
    },
    
    {
      // Frontend Application (Vite Preview Server)
      name: 'ace-css-leave-portal-frontend',
      script: 'node_modules/.bin/vite',
      args: 'preview --config vite.config.production.ts --host 0.0.0.0 --port 8085',
      instances: 1, // Single instance for frontend on college server
      exec_mode: 'fork',
      
      // Process Management
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      
      // Logging (Windows paths)
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 8085,
        HOST: '0.0.0.0'
      },
      
      // Advanced Options
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Windows specific settings
      windowsHide: true
    }
  ]
};
