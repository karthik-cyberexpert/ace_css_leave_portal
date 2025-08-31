# 🎯 How to Hide Port from URL

## Current Status
- ✅ Working: `http://ace.cs.leaveportal.local:8085`
- 🎯 Goal: `http://ace.cs.leaveportal.local` (no port)

## 🚀 **Option 1: Windows Port Forwarding (Recommended)**

This is the easiest solution that keeps your Vite server on port 8085 but forwards port 80 to it.

### Steps:
1. **Run as Administrator**:
   ```powershell
   # Right-click PowerShell -> Run as Administrator
   powershell.exe -ExecutionPolicy Bypass -File "D:\copied\setup-port-forwarding.ps1"
   ```

2. **Start your servers normally**:
   ```bash
   npm run dev-full
   ```

3. **Access without port**:
   - `http://ace.cs.leaveportal.local` ✅ (no port needed!)
   - `http://192.168.46.89` ✅ (direct IP, no port)

### How it works:
- Windows forwards requests from port 80 → port 8085
- Your Vite server still runs on 8085
- Users see clean URLs without `:8085`

---

## 🔧 **Option 2: Run Vite on Port 80 Directly**

This changes Vite to run on port 80 directly (requires admin privileges).

### Steps:
1. **I already updated vite.config.ts** (reverted for now)
2. **Run servers as Administrator**:
   ```powershell
   # Right-click PowerShell -> Run as Administrator  
   powershell.exe -ExecutionPolicy Bypass -File "D:\copied\start-servers-admin.ps1"
   ```

### Pros/Cons:
- ✅ **Pro**: Direct port 80, no forwarding needed
- ❌ **Con**: Requires running Node.js as Administrator
- ❌ **Con**: More complex setup

---

## 🏆 **RECOMMENDED: Use Option 1 (Port Forwarding)**

It's safer, easier, and works better for development.

### Quick Setup:
```powershell
# 1. Run as Administrator (one time setup)
powershell.exe -ExecutionPolicy Bypass -File "D:\copied\setup-port-forwarding.ps1"

# 2. Start your servers normally
npm run dev-full

# 3. Access your site
# http://ace.cs.leaveportal.local  (no port!)
```

## 🌐 **Final URLs After Setup**

### Your Computer:
- **Clean URL**: `http://ace.cs.leaveportal.local` ⭐
- **Direct IP**: `http://192.168.46.89` ⭐
- **Backend API**: `http://192.168.46.89:3009`

### Other LAN Devices:
After adding `192.168.46.89 ace.cs.leaveportal.local` to their hosts file:
- **Clean URL**: `http://ace.cs.leaveportal.local` ⭐
- **Direct IP**: `http://192.168.46.89` ⭐

## 🛠️ **Troubleshooting**

### Port forwarding not working:
```powershell
# Check current rules
netsh interface portproxy show v4tov4

# Remove and re-add
netsh interface portproxy delete v4tov4 listenport=80
netsh interface portproxy add v4tov4 listenport=80 connectport=8085 connectaddress=127.0.0.1
```

### Remove port forwarding:
```powershell
netsh interface portproxy delete v4tov4 listenport=80
```

---

## 🎉 **Result**

After setup, you can share these clean URLs:
- **Main site**: `http://ace.cs.leaveportal.local`
- **For mobile**: `http://192.168.46.89`

**No more ugly port numbers! 🚀**
