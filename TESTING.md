# Testing Guide for Meal Tracking System

This document outlines the test cases to verify the functionality of the Meal Tracking System for Africa Accommodation Providers.

## Test Environment Setup

1. Ensure MongoDB is running
2. Start the backend server: `cd backend && npm run dev`
3. Start the frontend: `cd frontend && npm run dev`

## Test Cases

### 1. Employee Registration

**Test Case 1.1: Successful Employee Registration**
- Navigate to "Register New Employee" page
- Fill in all required fields:
  - Full Name: "John Doe"
  - Validity Period: Future date (e.g., 1 year from today)
- Submit the form
- **Expected Result**: 
  - Employee is created successfully
  - QR code is generated
  - Success message is displayed

**Test Case 1.2: Employee Registration with Optional Fields**
- Navigate to "Register New Employee" page
- Fill in all required fields plus optional fields:
  - Full Name: "Jane Smith"
  - Unique Identifier: "EMP-001"
  - Phone: "+1234567890"
  - Department: "Housekeeping"
  - Position: "Supervisor"
  - Validity Period: Future date
- Submit the form
- **Expected Result**: 
  - Employee is created with all provided information
  - QR code is generated
  - Success message is displayed

### 2. Validity Period Validation

**Test Case 2.1: Valid Employee Access**
- Register an employee with a future validity date
- Scan the employee's QR code
- **Expected Result**: 
  - Meal is recorded successfully
  - Success message is displayed

**Test Case 2.2: Expired Employee Access**
- Register an employee with a past validity date
- Scan the employee's QR code
- **Expected Result**: 
  - Error message: "Employee meal access expired"
  - Meal is NOT recorded

### 3. Duplicate Unique Identifier Prevention

**Test Case 3.1: Duplicate Unique Identifier**
- Register an employee with Unique Identifier "EMP-001"
- Try to register another employee with the same Unique Identifier "EMP-001"
- **Expected Result**: 
  - Error message indicating duplicate identifier
  - Second employee is NOT created

### 4. QR Scan Functionality

**Test Case 4.1: Valid QR Scan**
- Register an employee
- Navigate to QR Scanner page
- Scan the employee's QR code
- **Expected Result**: 
  - Employee information is displayed
  - Meal is recorded if employee is valid
  - Success message is shown

**Test Case 4.2: Invalid QR Scan**
- Scan a non-existent QR code
- **Expected Result**: 
  - Error message: "Employee not found in system"

### 5. Manual Entry Functionality

**Test Case 5.1: Valid Manual Entry**
- Register an employee
- Navigate to QR Scanner page
- Enter the employee's Unique Identifier manually
- Submit
- **Expected Result**: 
  - Employee information is displayed
  - Meal is recorded if employee is valid
  - Success message is shown

**Test Case 5.2: Invalid Manual Entry**
- Navigate to QR Scanner page
- Enter a non-existent Unique Identifier
- Submit
- **Expected Result**: 
  - Error message: "Employee not found in system"

### 6. ID Card Printing

**Test Case 6.1: View Employee Profile**
- Register an employee
- Navigate to employee list
- Click on the employee to view their profile
- **Expected Result**: 
  - Employee details are displayed
  - QR code is visible
  - Validity date is shown

**Test Case 6.2: Print Employee ID Card**
- From employee profile page, click "Print Card"
- **Expected Result**: 
  - Print dialog opens
  - ID card is formatted correctly with:
    - Business Name: "Africa Accommodation Providers"
    - Employee Name
    - Unique Identifier
    - Validity Date
    - QR Code

### 7. Employee Management

**Test Case 7.1: Edit Employee Information**
- Register an employee
- Navigate to employee profile
- Click "Edit"
- Modify some information (e.g., phone number)
- Save changes
- **Expected Result**: 
  - Employee information is updated
  - Success message is displayed

**Test Case 7.2: Delete Employee**
- Register an employee
- Navigate to employee list
- Delete the employee
- **Expected Result**: 
  - Employee is removed from the list
  - Success message is displayed

### 8. Feeding Records

**Test Case 8.1: View Today's Feeding Records**
- Feed several employees
- Navigate to "Fed Today" page
- **Expected Result**: 
  - All fed employees are listed
  - Timestamps are accurate

**Test Case 8.2: View Employee Feeding History**
- Feed an employee multiple times on different days
- View the employee's profile
- Check "Feed History" section
- **Expected Result**: 
  - All feeding records for the employee are displayed
  - Dates and times are accurate

### 9. User Interface

**Test Case 9.1: Login Page**
- Navigate to login page
- **Expected Result**: 
  - Business header is displayed: "Africa Accommodation Providers - Meal Track System"

**Test Case 9.2: Dashboard**
- Login to the system
- **Expected Result**: 
  - Dashboard header shows: "Africa Accommodation Providers"
  - Logged-in user name is displayed
  - Quick action buttons are functional

### 10. Responsive Design

**Test Case 10.1: Mobile View**
- Access the system on a mobile device or resize browser to mobile width
- **Expected Result**: 
  - Layout adapts to mobile screen
  - Buttons and forms are appropriately sized for touch
  - Navigation is intuitive

**Test Case 10.2: Tablet View**
- Access the system on a tablet or resize browser to tablet width
- **Expected Result**: 
  - Layout adapts to tablet screen
  - Content is properly arranged
  - Navigation is intuitive

## Automated Testing

Run the test suite:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Test Data Cleanup

After testing, you may want to clear the test data:
```bash
# Clear MongoDB test data
mongo mealtrack-test --eval "db.dropDatabase()"
```

## Troubleshooting

**Issue**: QR code not scanning
- **Solution**: Check camera permissions and lighting conditions

**Issue**: Employee not found error
- **Solution**: Verify the Unique Identifier is correct and employee exists

**Issue**: Expired access error
- **Solution**: Check the validity period and update if necessary

**Issue**: Printing issues
- **Solution**: Check printer settings and paper size (should be ID card format)