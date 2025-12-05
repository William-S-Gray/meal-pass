# Manual Test Cases

This document outlines the manual test cases for verifying the functionality of the Meal Pass system.

## 1. Employee Management

### TC-EMP-001: Register New Employee
**Preconditions**: User is logged in with admin or volunteer role
**Steps**:
1. Navigate to "Register Employee" page
2. Fill in all required fields (Full Name, Unique ID, Valid Until date)
3. Click "Register Employee"
**Expected Result**: Employee is created successfully, QR code is generated, success message displayed

### TC-EMP-002: Edit Employee Information
**Preconditions**: Employee exists in database
**Steps**:
1. Navigate to employee list
2. Click "Edit" on an employee
3. Modify one or more fields
4. Click "Save Changes"
**Expected Result**: Employee information is updated, success message displayed

### TC-EMP-003: Delete Employee
**Preconditions**: Employee exists in database
**Steps**:
1. Navigate to employee list
2. Click "Delete" on an employee
3. Confirm deletion
**Expected Result**: Employee is marked as inactive, removed from active lists

### TC-EMP-004: Load All Employees
**Preconditions**: Multiple employees exist in database
**Steps**:
1. Navigate to employees list page
**Expected Result**: All active employees are displayed with correct information

### TC-EMP-005: Fetch Single Employee
**Preconditions**: Employee exists in database
**Steps**:
1. Navigate to employee profile page with valid UID
**Expected Result**: Correct employee details are displayed

### TC-EMP-006: Catch Duplicate Unique IDs
**Preconditions**: Employee with specific unique ID exists
**Steps**:
1. Attempt to create new employee with same unique ID
**Expected Result**: Error message displayed, duplicate creation prevented

### TC-EMP-007: QR Code Generation Works
**Preconditions**: Employee exists
**Steps**:
1. View employee profile
2. Check that QR code is displayed
3. Download QR code
**Expected Result**: QR code is visible and downloadable, contains correct unique ID

## 2. QR Code Scanning

### TC-QR-001: Valid Code Scanned
**Preconditions**: Employee with valid QR code exists
**Steps**:
1. Navigate to QR scanner
2. Scan valid QR code
**Expected Result**: Success message, feeding record created, employee marked as fed

### TC-QR-002: Already-Fed Scan
**Preconditions**: Employee already fed today
**Steps**:
1. Navigate to QR scanner
2. Scan QR code of already-fed employee
**Expected Result**: Warning message displayed, no duplicate record created

### TC-QR-003: Invalid Code Scanned
**Preconditions**: None
**Steps**:
1. Navigate to QR scanner
2. Scan invalid/nonexistent QR code
**Expected Result**: Error message displayed, no feeding record created

### TC-QR-004: Expired Employee Access
**Preconditions**: Employee with expired access exists
**Steps**:
1. Navigate to QR scanner
2. Scan QR code of expired employee
**Expected Result**: Error message displayed, no feeding record created

## 3. Manual Entry

### TC-MAN-001: Valid Manual Entry
**Preconditions**: Employee exists in database
**Steps**:
1. Navigate to QR scanner
2. Switch to manual entry mode
3. Enter valid employee ID
4. Click "Submit"
**Expected Result**: Success message, feeding record created, employee marked as fed

### TC-MAN-002: Invalid Manual Entry
**Preconditions**: None
**Steps**:
1. Navigate to QR scanner
2. Switch to manual entry mode
3. Enter invalid/nonexistent employee ID
4. Click "Submit"
**Expected Result**: Error message displayed, no feeding record created

### TC-MAN-003: Bulk Manual Entry
**Preconditions**: Multiple employees exist in database
**Steps**:
1. Navigate to QR scanner
2. Switch to manual entry mode
3. Toggle bulk entry mode
4. Enter multiple valid employee IDs (comma-separated)
5. Click "Submit"
**Expected Result**: Success message for each employee, feeding records created

## 4. Reports & Statistics

### TC-REP-001: View Daily Reports
**Preconditions**: Feeding records exist for today
**Steps**:
1. Navigate to Reports page
2. View today's feeding records
**Expected Result**: All today's feeding records are displayed correctly

### TC-REP-002: Export Reports to CSV
**Preconditions**: Feeding records exist
**Steps**:
1. Navigate to Reports page
2. Apply any filters if desired
3. Click "Export to CSV"
**Expected Result**: CSV file is downloaded containing filtered data

### TC-STAT-001: View Statistics Dashboard
**Preconditions**: Feeding records exist
**Steps**:
1. Navigate to Statistics page (admin only)
2. View dashboard metrics
**Expected Result**: All statistics are calculated and displayed correctly

### TC-STAT-002: Filter Statistics by Date Range
**Preconditions**: Feeding records exist across multiple dates
**Steps**:
1. Navigate to Statistics page
2. Select date range
3. Click "Apply Filter"
**Expected Result**: Statistics are recalculated for selected date range

## 5. Printing

### TC-PRN-001: Print Single Employee Card
**Preconditions**: Employee exists
**Steps**:
1. Navigate to employee profile
2. Click "Print Card"
**Expected Result**: PDF download starts with correctly formatted employee card

### TC-PRN-002: Print Multiple Employee Cards
**Preconditions**: Multiple employees exist
**Steps**:
1. Navigate to employee list
2. Select multiple employees
3. Click "Print Selected Cards"
**Expected Result**: PDF download starts with correctly formatted employee cards for selected employees

## 6. Navigation & UI

### TC-UI-001: Responsive Design
**Preconditions**: None
**Steps**:
1. Access application on desktop browser
2. Access application on mobile device
3. Access application on tablet
**Expected Result**: Application is usable and properly formatted on all device sizes

### TC-UI-002: Role-Based Access Control
**Preconditions**: Users exist with different roles (admin, volunteer, reporter)
**Steps**:
1. Log in as admin
2. Navigate to restricted pages
3. Log in as volunteer
4. Attempt to access admin-only pages
5. Log in as reporter
6. Attempt to access admin/volunteer pages
**Expected Result**: Users can only access pages appropriate to their role

### TC-UI-003: Session Management
**Preconditions**: User is logged in
**Steps**:
1. Leave application idle for extended period
2. Attempt to perform action
**Expected Result**: User is redirected to login page due to session timeout

## 7. Authentication

### TC-AUTH-001: Successful Login
**Preconditions**: Valid admin credentials exist
**Steps**:
1. Navigate to login page
2. Enter valid credentials
3. Click "Login"
**Expected Result**: User is redirected to dashboard, session established

### TC-AUTH-002: Failed Login
**Preconditions**: None
**Steps**:
1. Navigate to login page
2. Enter invalid credentials
3. Click "Login"
**Expected Result**: Error message displayed, login not successful

### TC-AUTH-003: Logout
**Preconditions**: User is logged in
**Steps**:
1. Click "Logout" button
**Expected Result**: User is redirected to login page, session destroyed