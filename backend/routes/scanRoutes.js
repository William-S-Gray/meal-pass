const express = require('express');
const router = express.Router();
const multer = require('multer');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const { BrowserQRCodeReader } = require('@zxing/library');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// QR/Barcode scanning endpoint
router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Process image with Jimp
    const image = await Jimp.read(req.file.buffer);
    const { data, width, height } = image.bitmap;

    // Attempt QR code detection with jsQR
    let qrResult = jsQR(data, width, height);
    
    if (qrResult) {
      return res.json({
        success: true,
        data: qrResult.data,
        type: 'QR_CODE',
        bounds: qrResult.location
      });
    }

    // Fallback to ZXing for barcode detection
    try {
      const codeReader = new BrowserQRCodeReader();
      // Note: ZXing library usage might need adjustment based on actual implementation
      // This is a simplified example
      const luminanceSource = new com.google.zxing.BufferedImageLuminanceSource(image);
      const binaryBitmap = new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(luminanceSource));
      
      // This is pseudocode - actual implementation would depend on ZXing JS library specifics
      // const result = codeReader.decode(binaryBitmap);
      
      // if (result) {
      //   return res.json({
      //     success: true,
      //     data: result.getText(),
      //     type: result.getBarcodeFormat().toString(),
      //     bounds: null
      //   });
      // }
    } catch (zxingError) {
      // ZXing couldn't decode either
      console.log('ZXing decode error:', zxingError);
    }

    // No codes detected
    return res.json({
      success: false,
      message: 'No QR code or barcode detected in image'
    });
  } catch (error) {
    console.error('Scan processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing scan request'
    });
  }
});

module.exports = router;