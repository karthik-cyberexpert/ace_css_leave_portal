@echo off
mysql -u root -p < "corrected_schema.sql"
echo Database import completed!
pause
