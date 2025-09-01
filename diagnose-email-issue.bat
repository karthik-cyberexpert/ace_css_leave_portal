@echo off
echo ====================================================
echo EMAIL SYSTEM DIAGNOSIS FOR ACE CSS LEAVE PORTAL
echo ====================================================
echo.

echo This script will help diagnose email sending issues during login.
echo.

pause

echo.
echo [1/4] Running basic email diagnosis...
echo ====================================================
node test-email-diagnosis.js
echo.

pause

echo.
echo [2/4] Testing login email service...
echo ====================================================
node test-login-email.js
echo.

pause

echo.
echo [3/4] Running comprehensive email system fix...
echo ====================================================
node fix-email-system.js
echo.

pause

echo.
echo [4/4] Final recommendations...
echo ====================================================
echo.
echo If all tests passed but emails still don't send during login:
echo.
echo 1. Check server console logs during actual login
echo 2. Look in email spam/junk folder  
echo 3. Verify the email function is being called in server.js
echo 4. Try logging in with a different user account
echo.
echo Common issues:
echo - Gmail App Password incorrect or expired
echo - Windows Firewall blocking SMTP
echo - Antivirus blocking email sending
echo - Network connectivity issues
echo - Emails going to spam folder
echo.
echo If none of the tests worked, check:
echo - Gmail 2FA is enabled
echo - App Password is correctly set in .env file
echo - Internet connection is stable
echo.

pause
echo.
echo Diagnosis complete! Check the console output above for details.
pause
