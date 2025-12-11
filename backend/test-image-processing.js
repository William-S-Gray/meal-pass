const Jimp = require('jimp');
const jsQR = require('jsqr');

console.log('Testing image processing libraries...');

// Test Jimp
try {
  console.log('Jimp version:', Jimp.constructor.name);
  console.log('Jimp methods available:');
  console.log('- read:', typeof Jimp.read);
  console.log('- constructor:', typeof Jimp.constructor);
} catch (error) {
  console.error('Error testing Jimp:', error);
}

// Test jsQR
try {
  console.log('jsQR available:', !!jsQR);
  console.log('jsQR type:', typeof jsQR);
} catch (error) {
  console.error('Error testing jsQR:', error);
}

console.log('Test complete');