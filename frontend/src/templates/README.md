# Meal Pass Beneficiary Card Sheet Generator

This package provides a print-ready card sheet template for generating beneficiary ID cards for the Meal Pass Program.

## Features

- **Print-Ready**: Designed for A4 paper with proper margins and layout
- **Responsive Grid**: 4 cards per row, 5-6 rows per page (20-30 cards total)
- **Card Size**: 85mm x 55mm (credit card size)
- **High Print Quality**: Optimized for 300 DPI printing
- **Cross-Browser Compatible**: Works in Chrome, Firefox, Safari
- **No Backend Required**: Pure HTML/CSS/JS solution

## Files Included

1. `cardSheet.html` - Main HTML template
2. `cardSheet.css` - Print-optimized styles
3. `generateCardSheet.js` - JavaScript generator for browser use
4. `generateCardSheetNode.js` - Node.js script for server-side generation
5. `sample-usage.html` - Demo page with form interface

## Usage

### Browser Usage

1. Include the JavaScript file in your HTML:
```html
<script src="./generateCardSheet.js"></script>
```

2. Call the generator function with beneficiary data:
```javascript
const beneficiaries = [
  { name: "John Doe", uniqueId: "MP-001", qrCodeUrl: "https://example.com/qr1.png" },
  { name: "Jane Smith", uniqueId: "MP-002", qrCodeUrl: "https://example.com/qr2.png" }
];

generateCardSheet(beneficiaries);
```

### Node.js Usage

Run the script directly:
```bash
npm run generate-cards
```

Or use it programmatically:
```javascript
const { generateCardSheet } = require('./generateCardSheetNode.js');

const beneficiaries = [
  { name: "John Doe", uniqueId: "MP-001", qrCodeUrl: "https://example.com/qr1.png" },
  { name: "Jane Smith", uniqueId: "MP-002", qrCodeUrl: "https://example.com/qr2.png" }
];

generateCardSheet(beneficiaries, './output/cards.html');
```

## Printing Instructions

1. Open the generated HTML file in Google Chrome
2. Press `Ctrl+P` (or `Cmd+P` on Mac) to open Print dialog
3. Set these options:
   - Destination: "Save as PDF" (for digital) or your printer
   - Layout: Portrait
   - Paper size: A4
   - Margins: Default
4. Click "Save" or "Print"

## Customization

You can modify the `cardSheet.css` file to customize:
- Card dimensions
- Colors and fonts
- Layout (grid columns/rows)
- Margins and spacing

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for server-side generation)

## Support

For issues or feature requests, please contact the development team.