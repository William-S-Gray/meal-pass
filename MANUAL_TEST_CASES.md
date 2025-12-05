# Meal Pass Application - Manual Test Cases

## 1. Authentication

### TC-AUTH-001: Login Success
**Preconditions**: Valid admin credentials exist in database
**Steps**:
1. Navigate to login page
2. Enter valid username and password
3. Click "Login" button
**Expected Result**: User is redirected to dashboard, authentication token is stored

### TC-AUTH-002: Login Failure
**Preconditions**: None
**Steps**:
1. Navigate to login page
2. Enter invalid username/password combination
3. Click "Login" button
**Expected Result**: Error message displayed, user remains on login page

### TC-AUTH-003: Token Expiration
**Preconditions**: User is logged in with expired token
**Steps**:
1. Wait for token to expire (or manually expire it)
2. Attempt to access protected route
**Expected Result**: Redirected to login page with session expired message

### TC-AUTH-004: Protected Route Rejection
**Preconditions**: User is not authenticated
**Steps**:
1. Directly navigate to protected route (e.g., /dashboard)
**Expected Result**: Redirected to login page

## 2. Beneficiaries

### TC-BEN-001: Create Beneficiary
**Preconditions**: User is authenticated as admin
**Steps**:
1. Navigate to "Register Beneficiary" page
2. Fill in all required fields (name, gender, age/group)
3. Click "Register" button
**Expected Result**: Beneficiary is created, QR code is generated, success message displayed

### TC-BEN-002: Edit Beneficiary
**Preconditions**: Beneficiary exists in database
**Steps**:
1. Navigate to beneficiary list
2. Click "Edit" on a beneficiary
3. Modify one or more fields
4. Save changes
**Expected Result**: Beneficiary information is updated, confirmation message displayed

### TC-BEN-003: Delete Beneficiary
**Preconditions**: Beneficiary exists in database
**Steps**:
1. Navigate to beneficiary list
2. Click "Delete" on a beneficiary
3. Confirm deletion
**Expected Result**: Beneficiary is marked as inactive, removed from active lists

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

## 3. QR Code Scanning

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

### TC-QR-003: Unknown UniqueId Scan
**Preconditions**: QR code with non-existent unique ID
**Steps**:
1. Navigate to QR scanner
2. Scan QR code with invalid unique ID
**Expected Result**: Error message displayed, no record created

### TC-QR-004: Scanner Offline
**Preconditions**: Internet connection lost
**Steps**:
1. Navigate to QR scanner
2. Attempt to scan QR code
**Expected Result**: Offline error message, retry option provided

### TC-QR-005: Manual Entry Fallback
**Preconditions**: Camera not available or malfunctioning
**Steps**:
1. Navigate to QR scanner
2. Switch to manual entry mode
3. Enter valid unique ID
4. Submit
**Expected Result**: Same result as scanning, feeding record created

## 4. Feeding Records

### TC-FEED-001: Create Record
**Preconditions**: Employee exists
**Steps**:
1. Scan valid QR code or use manual entry
2. Submit feeding
**Expected Result**: Feeding record created with correct timestamp and employee info

### TC-FEED-002: Prevent Double Feeding
**Preconditions**: Employee already fed today
**Steps**:
1. Attempt to feed same employee again
**Expected Result**: Error/warning message, no duplicate record created

### TC-FEED-003: Date-Based Lookups
**Preconditions**: Feeding records exist for multiple dates
**Steps**:
1. Navigate to "Fed Today" or "Feeding History" page
2. Filter by specific date range
**Expected Result**: Only records within date range displayed

### TC-FEED-004: Reports Accuracy
**Preconditions**: Multiple feeding records exist
**Steps**:
1. Generate daily report
2. Compare with actual database records
**Expected Result**: Report matches database records exactly

### TC-FEED-005: Undo Feeding (if implemented)
**Preconditions**: Employee was fed today
**Steps**:
1. Navigate to employee profile or feeding list
2. Click "Undo" or "Mark as not fed"
**Expected Result**: Feeding record removed, employee marked as not fed

## 5. Reports

### TC-REP-001: Daily Report
**Preconditions**: Feeding records exist for today
**Steps**:
1. Navigate to daily report page
**Expected Result**: All feeding records for today displayed accurately

### TC-REP-002: Range Report
**Preconditions**: Feeding records exist for multiple dates
**Steps**:
1. Navigate to reports page
2. Select date range
3. Generate report
**Expected Result**: All feeding records within date range displayed

### TC-REP-003: Statistics
**Preconditions**: Multiple feeding records exist
**Steps**:
1. Navigate to statistics/dashboard page
**Expected Result**: Charts and statistics display accurate data

### TC-REP-004: Export PDF/CSV
**Preconditions**: Feeding records exist
**Steps**:
1. Navigate to report page
2. Click "Export PDF" or "Export CSV"
**Expected Result**: File downloads with correct data in proper format

## 6. Bulk Printing

### TC-PRINT-001: 20–30 Card Sheet Template
**Preconditions**: Multiple employees exist
**Steps**:
1. Navigate to bulk print page
2. Select multiple employees
3. Generate print sheet
**Expected Result**: A4 sheet with 20-30 cards properly formatted

### TC-PRINT-002: Print Resolution Tests
**Preconditions**: Print template generated
**Steps**:
1. Print generated template
2. Check print quality
**Expected Result**: Text and QR codes清晰可读, no blurriness

### TC-PRINT-003: Alignment Tests
**Preconditions**: Print template generated
**Steps**:
1. Print generated template
2. Check card alignment on page
**Expected Result**: Cards aligned properly with consistent margins

### TC-PRINT-004: Single Card Export
**Preconditions**: Employee exists
**Steps**:
1. Navigate to employee profile
2. Click "Print Card"
**Expected Result**: Single card template generated with correct employee info

## 7. UI Tests

### TC-UI-001: Navigation
**Preconditions**: User is logged in
**Steps**:
1. Use all navigation elements (sidebar, top menu, breadcrumbs)
**Expected Result**: All navigation works correctly, pages load without errors

### TC-UI-002: Pagination
**Preconditions**: More than 10 employees exist
**Steps**:
1. Navigate to employees list
2. Use pagination controls
**Expected Result**: Correct items displayed per page, pagination controls work

### TC-UI-003: Search & Filtering
**Preconditions**: Multiple employees exist
**Steps**:
1. Use search bar to find employee
2. Use filters (department, position, etc.)
**Expected Result**: Search/filter results are accurate and update in real-time

### TC-UI-004: Toast/Alerts
**Preconditions**: Various actions that trigger messages
**Steps**:
1. Perform actions that should trigger messages (success, error, warning)
**Expected Result**: Appropriate toast/alert messages displayed with correct content

### TC-UI-005: Loading States
**Preconditions**: Slow network connection or large data sets
**Steps**:
1. Perform actions that require API calls
**Expected Result**: Loading spinners or placeholders displayed during data fetch