# Bulk Upload File Troubleshooting Guide

## Issue: File not uploading or being processed

If you're experiencing issues with the bulk student upload feature where files aren't being uploaded or processed, follow these troubleshooting steps:

### 1. Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try uploading a file and look for error messages
4. Look for specific console logs that should appear:
   - "Dialog opened, checking browser compatibility:"
   - "File input clicked"
   - "File change event triggered"
   - "Selected file:" followed by file details

### 2. Browser Compatibility Check
The console should show these compatibility checks when the dialog opens:
- FileReader support: should be `true`
- File API support: should be `true`
- User agent: shows your browser version

### 3. Common Issues and Solutions

#### Issue: File input doesn't respond to clicks
- **Cause**: Browser security restrictions or CSS conflicts
- **Solution**: Try in a different browser (Chrome, Firefox, Edge)
- **Test**: Use the test file at `test_file_upload.html` to verify basic file upload works

#### Issue: File is selected but not processed
- **Symptoms**: Console shows "Selected file:" but process doesn't continue
- **Check**: Ensure file extension is .csv, .xlsx, or .json
- **Check**: File size should be reasonable (under 10MB)

#### Issue: "No file selected" error
- **Cause**: File input state is not being updated properly
- **Solution**: 
  1. Close and reopen the dialog
  2. Try clicking directly on the file input area
  3. Clear browser cache and reload

#### Issue: File reads but data is empty
- **Check**: Console logs for "Processing data:" to see if data is being parsed
- **Verify**: File format matches the expected structure
- **Download**: Use the template download feature to get the correct format

### 4. File Format Requirements

Your file must have these exact column headers:
- `name` - Student's full name
- `registerNumber` - Unique student registration number
- `tutorName` - Name of the assigned tutor (must match existing tutor)
- `year` - Academic year (1, 2, 3, or 4)
- `username` - Unique username for login
- `password` - Password for the student account
- `profilePhoto` - (Optional) URL to profile photo

### 5. Sample Test Data

Create a test CSV file with this content:
```csv
name,registerNumber,tutorName,year,username,password,profilePhoto
John Doe,S101,Dr. Smith,1,john.d,password123,
Jane Smith,S102,Dr. Brown,2,jane.s,password456,
```

### 6. Step-by-Step Testing

1. **Open the bulk upload dialog**
   - Check console for compatibility messages
   
2. **Click the file input**
   - Should see "File input clicked" in console
   
3. **Select a test file**
   - Should see "File change event triggered" and file details
   - Should see "File accepted, setting file state"
   - Should see file name and size displayed in the UI
   
4. **Click "Process File"**
   - Should see "Processing file:" with file details
   - Should see "Reading file..." status
   - Should see "Parsing file content..." status
   - Should see processed student data in the preview table

### 7. Alternative Solutions

If the issue persists:

1. **Try the simple test file**: Open `test_file_upload.html` in your browser to test basic file upload functionality

2. **Check file permissions**: Ensure the file you're trying to upload isn't locked or in use by another application

3. **Try a different file format**: If CSV doesn't work, try Excel (.xlsx) or JSON format

4. **Clear browser data**: Clear cookies, cache, and reload the page

5. **Disable browser extensions**: Some ad blockers or security extensions might interfere with file uploads

### 8. Getting Help

If none of these solutions work, please provide:
1. Browser type and version (from console User agent log)
2. Any error messages from the browser console
3. File format and size you're trying to upload
4. Screenshot of the bulk upload dialog

The enhanced debugging code will now provide detailed console logs to help identify exactly where the process is failing.
