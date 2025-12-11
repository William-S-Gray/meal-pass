const Jimp = require('jimp');

// Test Jimp functionality
async function testJimp() {
  try {
    console.log('Testing Jimp...');
    
    // Create a simple test image
    const image = new Jimp(100, 100, 0xFFFFFFFF, (err, image) => {
      if (err) {
        console.error('Error creating image:', err);
        return;
      }
      
      console.log('Jimp is working correctly');
      console.log('Image created with dimensions:', image.bitmap.width, 'x', image.bitmap.height);
    });
  } catch (error) {
    console.error('Jimp test failed:', error);
  }
}

testJimp();