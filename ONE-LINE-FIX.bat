# ONE-LINE-FIX.bat
# Run this as Administrator to fix port redirection

@echo off
echo ?? Fixing port redirection (80 -> 8085)...

REM Add port proxy rule
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=8085 connectaddress=127.0.0.1

if %errorlevel% equ 0 (
    echo ? Port redirection added successfully!
    echo    http://192.168.46.89 will now redirect to port 8085
) else (
    echo ? Failed to add port redirection
    echo    Make sure you're running as Administrator
)

REM Add firewall rules
echo.
echo ?? Adding firewall rules...
netsh advfirewall firewall add rule name="Leave Portal Port 80" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Leave Portal Port 8085" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name="Leave Portal Port 3009" dir=in action=allow protocol=TCP localport=3009

echo.
echo ?? Current port proxy rules:
netsh interface portproxy show all

echo.
echo ?? Fix complete! Now http://192.168.46.89 should work without port numbers.
echo.
pause
