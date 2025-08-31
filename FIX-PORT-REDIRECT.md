# ?? PORT REDIRECTION FIX - Instructions

## ? Problem: Port 80 not redirecting to 8085

The issue is that the redirect server isn't running properly. Here are 3 solutions:

---

## ?? SOLUTION 1: Use Windows Port Proxy (RECOMMENDED)

This uses Windows built-in port forwarding (no Node.js required):

### Step 1: Run as Administrator
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to your project folder

### Step 2: Setup Port Redirection
`powershell
# Run this command
.\Setup-Port-Redirect.ps1
`

**OR manually:**
`powershell
# Add port forwarding rule
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=8085 connectaddress=127.0.0.1

# Add firewall rules
netsh advfirewall firewall add rule name="Leave Portal Port 80" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Leave Portal Port 8085" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name="Leave Portal Port 3009" dir=in action=allow protocol=TCP localport=3009
`

### Step 3: Start Your Services
Make sure your frontend is running on port 8085:
`powershell
# Start frontend on port 8085
npm run preview -- --port 8085

# Start backend on port 3009  
cd backend
node server.js
`

---

## ?? SOLUTION 2: Install Node.js and Use Redirect Server

### Step 1: Install Node.js
1. Download from: https://nodejs.org
2. Install with default settings
3. Restart PowerShell

### Step 2: Start Services
`powershell
# Install dependencies
npm install
cd backend
npm install
cd ..

# Start all services
.\Quick-Start.ps1
`

---

## ?? SOLUTION 3: Manual IIS Setup (Advanced)

If you have IIS available:

### Step 1: Enable IIS URL Rewrite
1. Install IIS URL Rewrite module
2. Open IIS Manager

### Step 2: Add Rewrite Rule
Add this to web.config:
`xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Redirect to 8085" stopProcessing="true">
          <match url=".*" />
          <action type="Redirect" url="http://192.168.46.89:8085/{R:0}" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
`

---

## ? TESTING

After setup, test these URLs:

1. **http://192.168.46.89** - Should redirect to port 8085
2. **http://192.168.46.89:8085** - Direct frontend access
3. **http://192.168.46.89:3009** - Backend API
4. **http://192.168.46.89:3009/health** - Health check

---

## ?? TROUBLESHOOTING

### Check if ports are listening:
`powershell
netstat -ano | findstr ":80\|:8085\|:3009"
`

### Check port proxy rules:
`powershell
netsh interface portproxy show all
`

### Remove port proxy (if needed):
`powershell
netsh interface portproxy delete v4tov4 listenport=80
`

---

## ?? QUICK FIX

**Fastest solution right now:**

1. Run as Administrator:
   `powershell
   netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=8085 connectaddress=127.0.0.1
   `

2. Make sure your frontend is running on port 8085

3. Test: http://192.168.46.89

That's it! The port redirection should work immediately.

---

*This will make http://192.168.46.89 automatically redirect to port 8085*
