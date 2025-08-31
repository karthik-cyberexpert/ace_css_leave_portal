#!/bin/bash

# Script to add ace.cs.leaveportal.local to hosts file on Linux/Mac
# Run with: sudo ./setup_dns_linux.sh

echo "=== ACE CSS Leave Portal DNS Setup ==="
echo "Setting up DNS resolution for ace.cs.leaveportal.local"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "ERROR: This script must be run as root (use sudo)"
    echo "Usage: sudo ./setup_dns_linux.sh"
    exit 1
fi

HOSTS_FILE="/etc/hosts"
SERVER_IP="210.212.246.131"
DNS_NAME="ace.cs.leaveportal.local"
DNS_ENTRY="$SERVER_IP $DNS_NAME"

# Test connectivity to server first
echo "Testing connectivity to server ($SERVER_IP)..."
if ping -c 1 -W 3 $SERVER_IP > /dev/null 2>&1; then
    echo "✓ Server is reachable"
else
    echo "✗ Cannot reach server at $SERVER_IP"
    echo "Please check your network connection"
    read -p "Press Enter to continue anyway..."
fi

# Backup hosts file
BACKUP_FILE="$HOSTS_FILE.backup.$(date +%Y%m%d_%H%M%S)"
cp "$HOSTS_FILE" "$BACKUP_FILE"
echo "✓ Hosts file backed up to: $BACKUP_FILE"

# Check if entry already exists
if grep -q "$DNS_NAME" "$HOSTS_FILE" && grep -q "$SERVER_IP.*$DNS_NAME" "$HOSTS_FILE"; then
    echo "✓ DNS entry already exists in hosts file"
else
    echo "Adding DNS entry for $DNS_NAME..."
    echo "" >> "$HOSTS_FILE"
    echo "# ACE CSS Leave Portal - Public Access (Added $(date))" >> "$HOSTS_FILE"
    echo "$DNS_ENTRY" >> "$HOSTS_FILE"
    echo "✓ DNS entry added successfully!"
fi

# Flush DNS cache (if available)
echo "Flushing DNS cache..."
if command -v systemctl > /dev/null 2>&1; then
    # SystemD systems
    if systemctl is-active --quiet systemd-resolved; then
        systemctl flush-dns || echo "Warning: Could not flush systemd-resolved cache"
    fi
elif command -v service > /dev/null 2>&1; then
    # SysV systems
    if service nscd status > /dev/null 2>&1; then
        service nscd restart || echo "Warning: Could not restart nscd"
    fi
fi

# On macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    dscacheutil -flushcache || echo "Warning: Could not flush macOS DNS cache"
fi

echo "✓ DNS cache flush attempted"

# Test DNS resolution
echo "Testing DNS resolution..."
if nslookup "$DNS_NAME" > /dev/null 2>&1; then
    RESOLVED_IP=$(nslookup "$DNS_NAME" | grep "Address:" | tail -1 | awk '{print $2}')
    if [ "$RESOLVED_IP" = "$SERVER_IP" ]; then
        echo "✓ DNS resolution working: $DNS_NAME -> $SERVER_IP"
    else
        echo "✗ DNS resolution returned wrong IP: $RESOLVED_IP"
    fi
else
    echo "✗ DNS resolution failed"
fi

# Test HTTP connectivity
echo "Testing HTTP connectivity..."
if command -v curl > /dev/null 2>&1; then
    if curl -s -I "http://$DNS_NAME" > /dev/null 2>&1; then
        echo "✓ HTTP connection successful"
        echo ""
        echo "SUCCESS! You can now access:"
        echo "  http://$DNS_NAME"
    else
        echo "✗ HTTP connection failed"
        echo "The DNS is resolved but the web server is not accessible"
    fi
elif command -v wget > /dev/null 2>&1; then
    if wget --spider "http://$DNS_NAME" > /dev/null 2>&1; then
        echo "✓ HTTP connection successful"
        echo ""
        echo "SUCCESS! You can now access:"
        echo "  http://$DNS_NAME"
    else
        echo "✗ HTTP connection failed"
        echo "The DNS is resolved but the web server is not accessible"
    fi
else
    echo "Warning: Could not test HTTP connectivity (no curl or wget found)"
fi

echo ""
echo "Setup completed!"
echo "If you encounter issues, check the backup file: $BACKUP_FILE"
