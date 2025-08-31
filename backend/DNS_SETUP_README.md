# ACE CSS Leave Portal - Public DNS Setup

This guide helps you set up DNS resolution for `ace.cs.leaveportal.local` on all systems for public access.

## Problem
The domain `ace.cs.leaveportal.local` works on the server (210.212.246.131) but not on other systems because they don't know how to resolve this domain name.

## Solution
We need to add a DNS entry to the hosts file on each client system that maps:
```
210.212.246.131 ace.cs.leaveportal.local
```

## Quick Setup

### For Windows Systems
1. **Easy Method**: Double-click `setup_dns.bat` 
   - It will automatically request administrator privileges
   - Follow the prompts

2. **Manual Method**: 
   - Right-click PowerShell and "Run as Administrator"
   - Navigate to this folder
   - Run: `.\add_dns_entry.ps1`

### For Linux/Mac Systems
1. Make the script executable: `chmod +x setup_dns_linux.sh`
2. Run with sudo: `sudo ./setup_dns_linux.sh`

### Manual Method (Any System)
If the scripts don't work, you can manually add the entry:

**Windows**: Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator)
**Linux/Mac**: Edit `/etc/hosts` (as root/sudo)

Add this line:
```
210.212.246.131 ace.cs.leaveportal.local
```

Then flush DNS cache:
- **Windows**: `ipconfig /flushdns`
- **Linux**: `sudo systemctl flush-dns` or `sudo service nscd restart`
- **Mac**: `sudo dscacheutil -flushcache`

## Verification

After setup, test these commands:

1. **Test connectivity**: `ping 210.212.246.131`
2. **Test DNS resolution**: `nslookup ace.cs.leaveportal.local`
3. **Test web access**: Open `http://ace.cs.leaveportal.local` in browser

## Files Included

- `add_dns_entry.ps1` - PowerShell script for Windows
- `setup_dns.bat` - Batch file that runs PowerShell as admin
- `setup_dns_linux.sh` - Shell script for Linux/Mac
- `DNS_SETUP_README.md` - This instruction file

## Server Information

- **Server IP**: 210.212.246.131
- **Domain**: ace.cs.leaveportal.local
- **Web Server Port**: 80 (HTTP)
- **Network**: Public Internet Access

## Troubleshooting

### DNS Resolution Fails
- Check if the hosts file was modified correctly
- Flush DNS cache
- Restart the system if needed

### Can Ping IP but Not Domain
- The hosts file entry is missing or incorrect
- DNS cache needs to be flushed

### Can Resolve DNS but Website Doesn't Load
- Check if Windows Firewall is blocking connections on the server
- Test with: `telnet 210.212.246.131 80`

### Permission Denied Errors
- Scripts must run as Administrator (Windows) or root (Linux/Mac)
- Use "Run as Administrator" or `sudo`

## Network-Wide Solutions (Advanced)

### Router DNS Configuration
If your router supports it, add a DNS entry in your router's configuration:
- This option is not available for public IP setup
- Look for "Local DNS" or "DNS Configuration"
- Use DNS hosting service instead for public access

### Windows DNS Server
If you have Windows Server, you can set up proper DNS zones.

## Security Notes

- The scripts create backups of your hosts file before making changes
- All changes are logged with timestamps
- You can restore from backup if needed

## Support

If you encounter issues:
1. Check the backup files created by the scripts
2. Verify the server (210.212.246.131) is accessible
3. Ensure you have the correct network configuration
4. Check Windows Firewall settings on the server

---

**Created**: $(Get-Date)  
**Server**: 210.212.246.131
**Domain**: ace.cs.leaveportal.local
