# Employee ID Card Templates

This directory contains templates for generating printable employee ID cards for the Meal Pass system.

## Files

- `EmployeeIDCard.tsx` - React component for individual employee ID cards
- `cardSheet.html` - HTML template for printing multiple employee cards on a single sheet
- `cardSheet.css` - CSS styling for the card sheet
- `generateCardSheet.js` - JavaScript function to generate card sheets
- `generateCardSheetNode.js` - Node.js script for server-side card sheet generation
- `sample-usage.html` - Example usage of the card sheet generator

## Usage

### Browser Usage

1. Include the JavaScript file in your HTML:
```html
<script src="./generateCardSheet.js"></script>
```

2. Call the generator function with employee data:
```javascript
const employees = [
  { name: "John Doe", uniqueId: "MP-001", qrCodeUrl: "https://example.com/qr1.png" },
  { name: "Jane Smith", uniqueId: "MP-002", qrCodeUrl: "https://example.com/qr2.png" }
];

generateCardSheet(employees);
```

### Node.js Usage

Run the script directly:
```bash
node generateCardSheetNode.js
```

Or import the function in your Node.js application:
```javascript
const { generateCardSheet } = require('./generateCardSheetNode.js');

const employees = [
  { name: "John Doe", uniqueId: "MP-001", qrCodeUrl: "https://example.com/qr1.png" },
  { name: "Jane Smith", uniqueId: "MP-002", qrCodeUrl: "https://example.com/qr2.png" }
];

const htmlContent = generateCardSheet(employees);
// Save htmlContent to a file or send as HTTP response
```

## Customization

You can customize the appearance by modifying:
- `cardSheet.css` - Change fonts, colors, layout
- `cardSheet.html` - Modify the overall structure
- `EmployeeIDCard.tsx` - Adjust the React component for individual cards

## Printing

The card sheet is designed to print on standard A4 paper with 4 columns and 6 rows of cards (24 cards per sheet). Each card measures 85mm x 55mm, which is the standard credit card size.

To print:
1. Open the generated HTML file in a browser
2. Use Ctrl+P (Cmd+P on Mac) to open the print dialog
3. Select your printer and paper size (A4 recommended)
4. Set margins to "None" or "Minimum"
5. Enable "Background graphics" if available
6. Print

## Troubleshooting

If QR codes are not displaying:
- Check that the URLs are accessible
- Verify that the image URLs are absolute (starting with http:// or https://)
- The fallback SVG will display "CRC Not Found" if images fail to load