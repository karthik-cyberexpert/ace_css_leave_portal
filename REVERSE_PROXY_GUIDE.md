# 🌐 Reverse Proxy Setup Guide for Domain Access

When using a custom domain for your Leave Portal, you'll need to configure a reverse proxy to hide the port numbers and provide clean URLs like `http://portal.yourcollege.edu` instead of `http://portal.yourcollege.edu:8080`.

## 🚀 Nginx Configuration (Recommended)

Nginx is the recommended reverse proxy solution for the Leave Portal due to its simplicity and performance.

### Prerequisites for Windows
- Download Nginx for Windows: https://nginx.org/en/download.html
- Extract to `C:\nginx` or your preferred location

### Step 1: Install Nginx on Windows

1. **Download Nginx:**
   ```bash
   # Download from https://nginx.org/en/download.html
   # Extract to C:\nginx
   ```

2. **Test Nginx installation:**
   ```cmd
   cd C:\nginx
   nginx.exe -t
   ```

### Step 2: Configure Nginx for Leave Portal

Edit `C:\nginx\conf\nginx.conf` or create a new configuration file:

```nginx
# Leave Portal Nginx Configuration
http {
    upstream leave_portal_frontend {
        server 127.0.0.1:8080;
    }
    
    upstream leave_portal_backend {
        server 127.0.0.1:3002;
    }

    server {
        listen 80;
        server_name portal.yourcollege.edu;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Frontend proxy (main application)
        location / {
            proxy_pass http://leave_portal_frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # API proxy (backend services)
        location /api/ {
            proxy_pass http://leave_portal_backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
            
            # CORS headers for API
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization";
        }
        
        # Handle preflight requests
        location ~ ^/api.*$ {
            if ($request_method = OPTIONS) {
                add_header Access-Control-Allow-Origin *;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
                add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization";
                add_header Content-Length 0;
                add_header Content-Type text/plain;
                return 200;
            }
        }

        # Static files and assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://leave_portal_frontend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Error pages
        error_page 502 503 504 /50x.html;
        location = /50x.html {
            root C:/nginx/html;
        }
    }
}

events {
    worker_connections 1024;
}
```

### Step 3: Create Nginx Service (Windows)

Create a batch script to manage Nginx as a Windows service:

**start-nginx.bat:**
```batch
@echo off
echo Starting Nginx for Leave Portal...
cd /d C:\nginx
start "" nginx.exe
echo Nginx started successfully!
echo Access Leave Portal at: http://portal.yourcollege.edu
pause
```

**stop-nginx.bat:**
```batch
@echo off
echo Stopping Nginx...
cd /d C:\nginx
nginx.exe -s quit
echo Nginx stopped successfully!
pause
```

**reload-nginx.bat:**
```batch
@echo off
echo Reloading Nginx configuration...
cd /d C:\nginx
nginx.exe -t
if %errorlevel% == 0 (
    nginx.exe -s reload
    echo Nginx configuration reloaded successfully!
) else (
    echo Nginx configuration test failed!
)
pause
```

### Step 4: Start Nginx

1. **Test configuration:**
   ```cmd
   cd C:\nginx
   nginx.exe -t
   ```

2. **Start Nginx:**
   ```cmd
   nginx.exe
   ```

3. **Or use the batch script:**
   ```cmd
   start-nginx.bat
   ```

## 🪟 Windows Server (IIS) Alternative Configuration

### Prerequisites
- Windows Server with IIS installed
- URL Rewrite Module for IIS
- Application Request Routing (ARR) for IIS

### Step 1: Install Required IIS Modules

1. **Download and install URL Rewrite Module:**
   - Go to: https://www.iis.net/downloads/microsoft/url-rewrite
   - Download and install the module

2. **Download and install Application Request Routing:**
   - Go to: https://www.iis.net/downloads/microsoft/application-request-routing
   - Download and install ARR

### Step 2: Enable Proxy Functionality

1. Open **IIS Manager**
2. Click on your server name in the left panel
3. Double-click **Application Request Routing Cache**
4. Click **Server Proxy Settings** in the right panel
5. Check **Enable proxy**
6. Click **Apply**

### Step 3: Create Website

1. In IIS Manager, right-click **Sites** → **Add Website**
2. Configure:
   - **Site name:** Leave Portal
   - **Physical path:** `D:\leave-portal\public` (create empty folder)
   - **Binding:** 
     - Type: HTTP
     - IP Address: All Unassigned
     - Port: 80
     - Host name: `portal.yourcollege.edu`

### Step 4: Configure URL Rewrite Rules

1. Select your new website in IIS Manager
2. Double-click **URL Rewrite**
3. Click **Add Rule(s)** → **Reverse Proxy**

#### Frontend Proxy Rule
- **Inbound rule name:** Frontend Proxy
- **Server name or IP:** `localhost:8080`
- **Pattern:** `^(?!api/)(.*)`
- **Rewrite URL:** `http://localhost:8080/{R:1}`

#### API Proxy Rule  
- **Inbound rule name:** API Proxy
- **Server name or IP:** `localhost:3002`
- **Pattern:** `^api/(.*)`
- **Rewrite URL:** `http://localhost:3002/{R:1}`

### Step 5: web.config Example

Your site should have a `web.config` file like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- API Proxy Rule -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:3002/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_ORIGINAL_HOST" value="{HTTP_HOST}" />
                        <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
                        <set name="HTTP_X_FORWARDED_PROTO" value="{REQUEST_SCHEME}" />
                    </serverVariables>
                </rule>
                
                <!-- Frontend Proxy Rule -->
                <rule name="Frontend Proxy" stopProcessing="true">
                    <match url="^(?!api/)(.*)" />
                    <action type="Rewrite" url="http://localhost:8080/{R:1}" />
                    <serverVariables>
                        <set name="HTTP_X_ORIGINAL_HOST" value="{HTTP_HOST}" />
                        <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
                        <set name="HTTP_X_FORWARDED_PROTO" value="{REQUEST_SCHEME}" />
                    </serverVariables>
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
```

## 🔄 Testing Your Nginx Setup

After configuring Nginx:

1. **Start your Leave Portal:**
   ```batch
   start-production.bat
   ```

2. **Start Nginx:**
   ```batch
   start-nginx.bat
   ```

3. **Test direct access (should work):**
   - Frontend: `http://your-ip:8080`
   - Backend: `http://your-ip:3002`

4. **Test domain access (should work after proxy):**
   - Frontend: `http://portal.yourcollege.edu`
   - Backend API: `http://portal.yourcollege.edu/api`

## 🛠️ Nginx Management Commands

```batch
# Test configuration
nginx.exe -t

# Start Nginx
nginx.exe

# Reload configuration
nginx.exe -s reload

# Stop Nginx
nginx.exe -s quit

# Force stop
nginx.exe -s stop
```

## 📁 Nginx Directory Structure

```
C:\nginx\
├── conf\nginx.conf          # Main configuration
├── logs\access.log          # Access logs
├── logs\error.log           # Error logs
├── html\                    # Static files
├── nginx.exe                # Main executable
├── start-nginx.bat          # Start script
├── stop-nginx.bat           # Stop script
└── reload-nginx.bat         # Reload script
```

## 🔄 Testing Your Setup

After configuring the reverse proxy:

1. **Start your Leave Portal:**
   ```batch
   start-production.bat
   ```

2. **Test direct access (should work):**
   - Frontend: `http://your-ip:8080`
   - Backend: `http://your-ip:3002`

3. **Test domain access (should work after proxy):**
   - Frontend: `http://portal.yourcollege.edu`
   - Backend API: `http://portal.yourcollege.edu/api`

## 🛠️ Troubleshooting

### Common Issues:

1. **502 Bad Gateway:**
   - Check if Leave Portal is running (`pm2 status`)
   - Verify ports 8080 and 3002 are accessible

2. **404 Not Found:**
   - Check URL rewrite rules
   - Verify ARR is enabled

3. **CORS Errors:**
   - Update `.env.production` with your domain
   - Restart Leave Portal after changes

### Verification Commands:

```batch
# Check if services are running
pm2 status

# Check if ports are listening
netstat -an | findstr ":8080"
netstat -an | findstr ":3002"

# Test backend directly
curl http://localhost:3002/health

# Test frontend directly  
curl http://localhost:8080
```

## 🔒 SSL/HTTPS Setup

For production, you should enable HTTPS:

1. **Get SSL Certificate** (Let's Encrypt, commercial CA, etc.)
2. **Install certificate in IIS**
3. **Update binding to HTTPS (port 443)**
4. **Update Leave Portal environment:**
   ```bash
   # In .env.production
   HTTPS_ENABLED=true
   ACCESS_PROTOCOL=https
   VITE_API_URL=https://portal.yourcollege.edu/api
   ```

## 📋 Summary

With reverse proxy configured:
- ✅ Clean URLs: `http://portal.yourcollege.edu`  
- ✅ No ports visible to users
- ✅ Professional appearance
- ✅ API accessible at `/api` path
- ✅ Frontend accessible at root `/`

Your Leave Portal will be accessible via your custom domain without showing any port numbers! 🎉
