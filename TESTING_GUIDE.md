# QR Code GridFS Implementation Testing Guide

This guide provides instructions for testing the new GridFS-based QR code storage implementation.

## Prerequisites

1. Ensure MongoDB Atlas is properly configured
2. Verify the backend is running with GridFS initialized
3. Confirm the frontend is connected to the backend

## Testing Scenarios

### 1. Employee Registration with QR Code Generation

**Test**: Register a new employee and verify QR code is stored in GridFS

**Steps**:
1. Navigate to the employee registration page
2. Fill in employee details (name, gender, valid until date)
3. Submit the form
4. Check that:
   - Employee is created successfully
   - QR code is generated
   - QR code is stored in MongoDB GridFS
   - Employee document contains `qrFileName` field

**Expected Result**: 
- Employee created with QR code stored in GridFS
- `qrFileName` field in employee document points to GridFS file

### 2. QR Code Download

**Test**: Download QR code from the employee profile page

**Steps**:
1. Navigate to an employee's profile page
2. Click the "Download QR" button
3. Check that:
   - QR code downloads as PNG file
   - File name matches expected format (`qr-{employeeId}.png`)
   - Downloaded image is a valid QR code

**Expected Result**: 
- QR code downloads successfully as PNG file
- File can be opened and scanned

### 3. QR Code Persistence

**Test**: Verify QR codes persist after server restart

**Steps**:
1. Register a new employee and download their QR code
2. Restart the backend server
3. Try to download the same QR code
4. Check that:
   - QR code is still available for download
   - Same QR code content is returned

**Expected Result**: 
- QR codes remain available after server restart
- No "404 Not Found" errors

### 4. QR Code Scanning

**Test**: Scan QR code using the scanner page

**Steps**:
1. Navigate to the QR scanner page
2. Start the camera
3. Scan a printed or displayed QR code
4. Check that:
   - Employee information is displayed
   - Feeding record is created
   - Success message is shown

**Expected Result**: 
- QR code scans successfully
- Employee data is retrieved
- Feeding record is logged

### 5. Mobile Compatibility

**Test**: Verify QR code works on mobile devices

**Steps**:
1. Access the application on a mobile device
2. Navigate to employee profile
3. Download QR code
4. Scan QR code with mobile camera
5. Check that:
   - QR code downloads correctly on mobile
   - Mobile camera can scan the QR code
   - Application functions properly on mobile

**Expected Result**: 
- Full functionality on mobile devices
- QR codes scannable with mobile cameras

## API Endpoints to Test

### POST /api/employees
- Creates employee and stores QR code in GridFS
- Returns employee with `qrFileName` field

### GET /api/employees/:id/qrcode
- Retrieves QR code from GridFS
- Returns PNG image file

### GET /api/employees/uid/:uid/qrcode
- Retrieves QR code from GridFS by unique ID
- Returns PNG image file

## Postman Collection

Import the following requests into Postman for automated testing:

```json
{
  "info": {
    "name": "Meal Pass QR GridFS Tests",
    "_postman_id": "qr-gridfs-tests",
    "description": "Collection for testing GridFS QR code implementation",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register Employee",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test Employee\",\n  \"gender\": \"Male\",\n  \"validUntil\": \"2026-12-31\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{base_url}}/api/employees",
          "host": ["{{base_url}}"],
          "path": ["api", "employees"]
        }
      },
      "response": []
    },
    {
      "name": "Download QR Code by ID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/employees/:id/qrcode",
          "host": ["{{base_url}}"],
          "path": ["api", "employees", ":id", "qrcode"]
        }
      },
      "response": []
    },
    {
      "name": "Download QR Code by UID",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/employees/uid/:uid/qrcode",
          "host": ["{{base_url}}"],
          "path": ["api", "employees", "uid", ":uid", "qrcode"]
        }
      },
      "response": []
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **QR Code Not Found (404)**:
   - Verify GridFS initialization in server logs
   - Check that `qrFileName` field exists in employee document
   - Confirm MongoDB connection string is correct

2. **Download Fails**:
   - Check browser console for errors
   - Verify CORS headers are properly configured
   - Ensure employee has valid `qrFileName`

3. **Mobile Scanning Issues**:
   - Check camera permissions
   - Ensure adequate lighting
   - Verify QR code quality (high contrast, clear)

### Verification Commands

Check GridFS files in MongoDB:
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Switch to database
use your-database-name

# List GridFS files
db.uploads.files.find()
```

## Success Criteria

All tests should pass with:
- ✅ No 404 errors for QR code downloads
- ✅ QR codes stored persistently in GridFS
- ✅ Successful downloads on all devices
- ✅ Proper scanning functionality
- ✅ Mobile compatibility
- ✅ Fast loading times