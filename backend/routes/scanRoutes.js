const express = require('express');
const router = express.Router();
const multer = require('multer');
const Jimp = require('jimp');
const jsQR = require('jsqr');
const Quagga = require('quagga').default;

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
    // Get scan mode from form data or default to 'both'
    const scanMode = req.body.scanMode || 'both';
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Process image with Jimp
    const image = await Jimp.read(req.file.buffer);
    const { data, width, height } = image.bitmap;

    // Attempt QR code detection with jsQR if scan mode allows
    if (scanMode === 'qr' || scanMode === 'both') {
      let qrResult = jsQR(data, width, height);
      
      if (qrResult) {
        return res.json({
          success: true,
          data: qrResult.data,
          type: 'QR_CODE',
          bounds: qrResult.location
        });
      }
    }

    // Attempt barcode detection with Quagga if scan mode allows
    if (scanMode === 'barcode' || scanMode === 'both') {
      try {
        // Convert Jimp image to format suitable for Quagga
        const imageData = {
          data: data,
          width: width,
          height: height
        };

        // Configure Quagga for barcode detection
        const config = {
          inputStream: {
            size: 800,
            singleChannel: false
          },
          locator: {
            patchSize: "medium",
            halfSample: true
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
              'i2of5_reader'
            ]
          },
          locate: true
        };

        // Process with Quagga
        const barcodeResult = await new Promise((resolve) => {
          Quagga.decodeSingle({
            ...config,
            src: imageData
          }, (result) => {
            resolve(result);
          });
        });

        if (barcodeResult && barcodeResult.codeResult) {
          return res.json({
            success: true,
            data: barcodeResult.codeResult.code,
            type: barcodeResult.codeResult.format,
            bounds: barcodeResult.box
          });
        }
      } catch (quaggaError) {
        // Quagga couldn't decode
        console.log('Quagga decode error:', quaggaError);
      }
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