# 🌐 ACE CSS Leave Portal - LAN Access Setup

## ✅ Current Configuration (Host Machine)
- **Domain**: `ace.cs.leaveportal.local`
- **IP Address**: `192.168.46.89`
- **Backend Server**: Running on port 3002
- **DNS**: Configured in hosts file
- **Status**: Ready for LAN access ✅

## 🖥️ Host Machine Setup (COMPLETE)
Your host machine is already configured with:
```
192.168.46.89 ace.cs.leaveportal.local
```

## 📱 Setup Instructions for OTHER LAN Devices

### For Windows Devices:
1. **Open Command Prompt as Administrator**
2. **Edit the hosts file**:
   ```cmd
   notepad C:\Windows\System32\drivers\etc\hosts
   ```
3. **Add this line at the end**:
   ```
   192.168.46.89 ace.cs.leaveportal.local
   ```
4. **Save and close**
5. **Flush DNS cache**:
   ```cmd
   ipconfig /flushdns
   ```

### For Mac/Linux Devices:
1. **Open Terminal**
2. **Edit hosts file with sudo**:
   ```bash
   sudo nano /etc/hosts
   ```
3. **Add this line**:
   ```
   192.168.46.89 ace.cs.leaveportal.local
   ```
4. **Save and exit** (Ctrl+X, Y, Enter in nano)
5. **Flush DNS cache**:
   - **Mac**: `sudo dscacheutil -flushcache`
   - **Linux**: `sudo systemctl restart systemd-resolved`

### For Android Devices:
1. **Root Required** or use a DNS override app
2. **Alternative**: Use IP directly `http://192.168.46.89:3002`

### For iOS Devices:
1. **Requires jailbreak** for hosts file editing
2. **Alternative**: Use IP directly `http://192.168.46.89:3002`

## 🔥 Windows Firewall Configuration (Host Machine)
Make sure Windows Firewall allows your Node.js server:

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="ACE CSS Leave Portal" dir=in action=allow protocol=TCP localport=3002
netsh advfirewall firewall add rule name="ACE CSS Frontend" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Node.js" dir=in action=allow program="C:\Program Files\nodejs\node.exe"
```

## 🌍 Access URLs

### From Host Machine:
- Backend API: `http://localhost:3002`
- Frontend: `http://ace.cs.leaveportal.local`

### From Other LAN Devices:
- Backend API: `http://192.168.46.89:3002`
- Frontend: `http://ace.cs.leaveportal.local` (after hosts file setup)
- Direct IP: `http://192.168.46.89` (if you have a frontend server on port 80)

## 🚀 Starting the Servers

### Backend (Already Running):
```bash
cd D:\copied\backend
node server.js
```

### Frontend (if separate):
```bash
# Start your frontend server (React, Vue, etc.)
# Make sure it connects to: http://192.168.46.89:3002
npm start
```

## 📋 Testing Checklist

### On Host Machine:
- [ ] ✅ Backend server running on port 3002
- [ ] ✅ DNS resolves: `ping ace.cs.leaveportal.local`
- [ ] ✅ Website accessible: `http://ace.cs.leaveportal.local`

### On Other LAN Devices:
- [ ] Hosts file updated
- [ ] DNS cache flushed
- [ ] Can ping: `ping ace.cs.leaveportal.local`
- [ ] Website loads: `http://ace.cs.leaveportal.local`
- [ ] API accessible: `http://192.168.46.89:3002`

## 🛠️ Troubleshooting

### Common Issues:

1. **"Site can't be reached"**
   - Check Windows Firewall
   - Verify hosts file entry
   - Try direct IP: `http://192.168.46.89:3002`

2. **DNS not resolving**
   - Flush DNS cache
   - Check hosts file syntax (no extra spaces)
   - Restart network adapter

3. **API calls failing**
   - Backend should accept requests from all origins (already configured)
   - Check browser console for CORS errors

4. **Mobile devices can't access**
   - Use direct IP: `http://192.168.46.89:3002`
   - Consider setting up router-level DNS

## 📊 Server Status Commands

Check if backend is running:
```powershell
# Check port 3002
netstat -an | findstr :3002

# Test API endpoint
curl http://192.168.46.89:3002
```

## 🔄 Alternative: Router-Level DNS (Advanced)

Instead of editing each device's hosts file, you can:
1. Access your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Find DNS or DHCP settings
3. Add custom DNS entry: `ace.cs.leaveportal.local -> 192.168.46.89`
4. Restart router and reconnect all devices

---

## 🎉 Success!
Your ACE CSS Leave Portal is now accessible across your LAN using the domain `ace.cs.leaveportal.local`!

**Quick Test**: Open a browser on any configured LAN device and go to:
`http://ace.cs.leaveportal.local`
