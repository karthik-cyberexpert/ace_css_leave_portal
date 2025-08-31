# 🎯 ACE CSS Leave Portal - COMPLETE LAN Setup Guide

## ✅ Current Status: FULLY CONFIGURED ✅

Your ACE CSS Leave Portal is now properly configured for LAN access with the custom domain!

### 📊 Configuration Summary:
- **Domain**: `ace.cs.leaveportal.local`
- **IP Address**: `192.168.46.89`
- **Frontend (Vite)**: Port 8085 ✅
- **Backend (Node.js)**: Port 3009 ✅
- **DNS**: Configured ✅
- **Environment**: Set up with `.env.local` ✅

## 🌐 **CORRECT ACCESS URLS**

### 🏠 From Your Host Machine:
- **🌐 Main Website**: `http://ace.cs.leaveportal.local:8085` ⭐ **USE THIS**
- **🔧 Backend API**: `http://ace.cs.leaveportal.local:3009`
- **📱 Direct IP Website**: `http://192.168.46.89:8085`
- **🔗 Direct IP API**: `http://192.168.46.89:3009`

### 📱 From Other LAN Devices:
1. **Add to hosts file**: `192.168.46.89 ace.cs.leaveportal.local`
2. **Access website**: `http://ace.cs.leaveportal.local:8085`
3. **Or use direct IP**: `http://192.168.46.89:8085`

## 🚀 **How to Start/Restart Your Servers**

### Method 1: Full Development (Recommended)
```bash
cd D:\copied
npm run dev-full
```

### Method 2: Individual Servers
```bash
# Terminal 1 - Backend
cd D:\copied
npm run server

# Terminal 2 - Frontend  
cd D:\copied
npm run dev
```

## 🔥 **Windows Firewall Setup**

**Run this command as Administrator:**
```powershell
powershell.exe -ExecutionPolicy Bypass -File "D:\copied\configure-firewall-complete.ps1"
```

**Or manually add these rules:**
```powershell
netsh advfirewall firewall add rule name="ACE CSS Frontend (8085)" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name="ACE CSS Backend (3009)" dir=in action=allow protocol=TCP localport=3009
```

## 📋 **LAN Device Setup Instructions**

### Windows Devices:
1. **Run Command Prompt as Administrator**
2. **Edit hosts file**:
   ```cmd
   notepad C:\Windows\System32\drivers\etc\hosts
   ```
3. **Add this line**:
   ```
   192.168.46.89 ace.cs.leaveportal.local
   ```
4. **Save and flush DNS**:
   ```cmd
   ipconfig /flushdns
   ```

### Mac/Linux Devices:
1. **Edit hosts file**:
   ```bash
   sudo nano /etc/hosts
   ```
2. **Add this line**:
   ```
   192.168.46.89 ace.cs.leaveportal.local
   ```
3. **Save and flush DNS**:
   - **Mac**: `sudo dscacheutil -flushcache`
   - **Linux**: `sudo systemctl restart systemd-resolved`

### Mobile Devices:
- **Use direct IP**: `http://192.168.46.89:8085`

## 🧪 **Testing Your Setup**

### Test Frontend:
```powershell
# Test with custom domain
curl http://ace.cs.leaveportal.local:8085

# Test with direct IP
curl http://192.168.46.89:8085
```

### Test Backend:
```powershell
# Test API with custom domain
curl http://ace.cs.leaveportal.local:3009

# Test API with direct IP
curl http://192.168.46.89:3009
```

### Test DNS:
```powershell
ping ace.cs.leaveportal.local
nslookup ace.cs.leaveportal.local
```

## 📱 **Access From Different Devices**

| Device Type | URL to Use | Setup Required |
|-------------|------------|----------------|
| **Your Computer** | `http://ace.cs.leaveportal.local:8085` | ✅ Ready |
| **Other PC (Windows)** | `http://ace.cs.leaveportal.local:8085` | Hosts file + Firewall |
| **Mac/Linux** | `http://ace.cs.leaveportal.local:8085` | Hosts file |
| **Android/iOS** | `http://192.168.46.89:8085` | None (direct IP) |
| **Any Device** | `http://192.168.46.89:8085` | None (direct IP) |

## 🛠️ **Troubleshooting**

### ❌ "Site can't be reached"
1. **Check servers are running**: `npm run dev-full`
2. **Run firewall script as Administrator**
3. **Try direct IP**: `http://192.168.46.89:8085`
4. **Check Windows Defender/Antivirus**

### ❌ "JavaScript must be enabled"
- This is normal - just the loading message
- Wait for the React app to load

### ❌ "Failed to update staffs"
- ✅ **Backend is ready** (mobile column exists)
- ✅ **Database is configured**
- Check frontend authentication and error console

### ❌ API calls failing
- Check `.env.local` file exists with correct `VITE_API_URL`
- Restart frontend server after env changes
- Check browser network tab for 404/CORS errors

## 📂 **Files Created**
- ✅ `.env.local` - Frontend environment config
- ✅ `configure-firewall-complete.ps1` - Firewall setup
- ✅ `FINAL_SETUP_GUIDE.md` - This guide
- ✅ Updated hosts file

## 🎉 **SUCCESS CONFIRMATION**

**To confirm everything is working:**

1. ✅ **Servers running**: You should see both Vite and Node.js running
2. ✅ **Domain resolves**: `ping ace.cs.leaveportal.local` works
3. ✅ **Website loads**: `http://ace.cs.leaveportal.local:8085` opens your app
4. ✅ **API works**: Login and staff updates function properly

---

## 🌟 **FINAL RESULT**

**Your ACE CSS Leave Portal is now accessible via:**
- **Primary URL**: `http://ace.cs.leaveportal.local:8085`
- **Backup URL**: `http://192.168.46.89:8085`

**From any device on your LAN after hosts file setup! 🚀**
