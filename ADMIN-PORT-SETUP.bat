@echo off
REM ========================================================================
REM   ADMIN TOOLS - Port 80 Redirection Setup (Run as Administrator)
REM ========================================================================
REM   This script sets up port 80 redirection so users don't need :8085
REM   Must be run as Administrator!
REM ========================================================================

echo ========================================================================
echo             ADMIN SETUP - Port 80 Redirection
echo ========================================================================
echo.
echo This will redirect port 80 to 8085 so users can access:
echo http://210.212.246.131 instead of http://210.212.246.131:8085
echo.
echo IMPORTANT: This must be run as Administrator!
echo.
pause

echo Setting up port redirection...
netsh interface portproxy add v4tov4 listenport=80 listenaddress=0.0.0.0 connectport=8085 connectaddress=127.0.0.1

if %errorlevel% equ 0 (
    echo [SUCCESS] Port redirection added successfully!
    echo Users can now access: http://210.212.246.131
) else (
    echo [ERROR] Failed to add port redirection
    echo Make sure you're running as Administrator
)

echo.
echo Adding firewall rules...
netsh advfirewall firewall add rule name="Leave Portal Port 80" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Leave Portal Port 8085" dir=in action=allow protocol=TCP localport=8085  
netsh advfirewall firewall add rule name="Leave Portal Port 3009" dir=in action=allow protocol=TCP localport=3009

echo.
echo Current port proxy rules:
netsh interface portproxy show all

echo.
echo [COMPLETE] Setup finished!
echo Users can now access the portal at: http://210.212.246.131
echo.
pause
