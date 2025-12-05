Meal Track System – Africa Accommodation Providers

A modern web-based meal tracking system that registers Employees, generates QR codes/Barcodes, validates meal access based on validity period, and enables fast scanning for feeding authorization.

📌 System Overview

The Meal Track System allows Africa Accommodation Providers to register employees, generate unique meal access IDs, and validate feeding eligibility. It uses QR/Barcode scanning to prevent duplicate or expired feeding attempts.

🎯 Core Objectives

Track meals provided daily to sponsored employees.

Prevent fraudulent meal access using QR/Barcode validation.

Allow scanning via mobile phone or barcode device.

Generate a printable ID card format for each employee.

🚀 Key Features
🔐 Authentication & Branding

✔ Business name displayed on login page & main dashboard:
Africa Accommodation Providers
✔ Admin authentication required to access system.

🧾 Employee Registration

✔ Employees are registered with a Unique Household Identifier (instead of “Household”).
✔ Generates Unique Employee Meal ID automatically.
✔ Admin must set a Validity Period on registration.
✔ System auto-generates QR/Barcode linked to the unique ID.

🕒 Validity Management

✔ Admin must enter a Validity Period (Start & End Date).
✔ System checks expiration before approving meal feeding.
✔ If expired → Feeding is Denied Automatically.

📱 Meal Scanning & Validation

✔ Scan via mobile phone camera (QR code).
✔ Also supports barcode scanning devices.
✔ Validates ID → logs feeding entry once per meal period (optional future feature: breakfast/lunch/dinner).

🪪 ID Card Printout

✔ Print page is formatted like an ID card, containing:

Business Logo + Name (Africa Accommodation Providers)

Employee Name

Unique Household Identifier

Employee Meal ID

QR/Barcode

Validity Period
✔ Printable in A6 / Badge Size.

📊 Admin Dashboard

✔ Summary: Total Employees, Valid, Expired
✔ Search employees by name, ID, or household identifier
✔ Download reports (future enhancement)

🛠️ Tech Stack (Suggested)
Category	Tech
Frontend	React.js
Backend	Node.js / Express OR Django (depending on your system choice)
Database	MongoDB
QR/Barcode	qrcode, jsbarcode, or backend libs
Authentication	JWT / Session
Deployment	Render / Vercel / Netlify
📁 Project Structure (Example)
meal-track-system/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/ (QR/Barcode generators)
│   └── server.js
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── App.jsx
└── README.md

🔄 API Endpoints (Example)
Method	Endpoint	Description
POST	/api/auth/login	Admin login
POST	/api/employees/register	Register employee w/ validity + household identifier
GET	/api/employees/:id/qrcode	Get QR/Barcode
POST	/api/scan	Validate access + log feeding
GET	/api/employees	List employees
PUT	/api/employees/:id	Update validity or details
🛡️ Validation Checks Triggered on Scan
Condition	Status
ID Exists	✔ Approved
Validity Expired	❌ Denied
Invalid QR/Barcode	❌ Denied
Already Fed (optional)	⚠ Warning
🖨️ Printable ID Format (Layout Example)
| AFRICA ACCOMMODATION PROVIDERS |
| [Logo]                          |
| EMPLOYEE NAME: John Doe        |
| MEAL ID: AAP-BNF-2025-XXXXX     |
| HOUSEHOLD ID: HH-77839          |
| VALID: 01/02/2025 - 31/12/2025 |
| [QR Code / Barcode]             |

🎉 Future Enhancements (Optional)

⬜ Multi-meal logging (Break/Lunch/Dinner)
⬜ Mobile App for Scanning
⬜ SMS notification before validity expiry
⬜ Automatic renewal system

📄 License

This system is licensed for Africa Accommodation Providers internal use only