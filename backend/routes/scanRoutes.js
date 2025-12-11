const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Jimp } = require('jimp');
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
    console.log('Received scan request');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null);
    
    // Get scan mode from form data or default to 'both'
    const scanMode = req.body.scanMode || 'both';
    console.log('Scan mode:', scanMode);
    
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Process image with Jimp
    console.log('Processing image with Jimp...');
    const image = await Jimp.read(req.file.buffer);
    console.log('Jimp processing complete');
    let { data, width, height } = image.bitmap;
    console.log('Image dimensions:', width, 'x', height);

    // Attempt QR code detection with jsQR if scan mode allows
    if (scanMode === 'qr' || scanMode === 'both') {
      // Try multiple preprocessing approaches for better QR detection
      let qrResult = jsQR(data, width, height);
      
      // If initial detection fails, try with contrast adjustment
      if (!qrResult) {
        try {
          const contrastImage = image.clone();
          contrastImage.contrast(0.3); // Increase contrast
          const contrastBitmap = contrastImage.bitmap;
          qrResult = jsQR(contrastBitmap.data, contrastBitmap.width, contrastBitmap.height);
        } catch (contrastError) {
          console.log('Contrast adjustment failed:', contrastError);
        }
      }
      
      // If still no result, try with brightness adjustment
      if (!qrResult) {
        try {
          const brightImage = image.clone();
          brightImage.brightness(0.2); // Increase brightness
          const brightBitmap = brightImage.bitmap;
          qrResult = jsQR(brightBitmap.data, brightBitmap.width, brightBitmap.height);
        } catch (brightError) {
          console.log('Brightness adjustment failed:', brightError);
        }
      }
      
      // Try grayscale conversion as last resort
      if (!qrResult) {
        try {
          const grayImage = image.clone();
          grayImage.grayscale();
          const grayBitmap = grayImage.bitmap;
          qrResult = jsQR(grayBitmap.data, grayBitmap.width, grayBitmap.height);
        } catch (grayError) {
          console.log('Grayscale conversion failed:', grayError);
        }
      }
      
      if (qrResult) {
        // Validate that we have a proper uniqueId
        if (qrResult.data && qrResult.data.trim().length > 0) {
          return res.json({
            success: true,
            data: qrResult.data.trim(),
            type: 'QR_CODE',
            bounds: qrResult.location
          });
        }
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

        // If primary detection fails, try with enhanced preprocessing
        if ((!barcodeResult || !barcodeResult.codeResult) && (scanMode === 'barcode' || scanMode === 'both')) {
          try {
            // Try with contrast enhancement
            const contrastImage = image.clone();
            contrastImage.contrast(0.3);
            const contrastBitmap = contrastImage.bitmap;
            const contrastImageData = {
              data: contrastBitmap.data,
              width: contrastBitmap.width,
              height: contrastBitmap.height
            };
            
            const contrastBarcodeResult = await new Promise((resolve) => {
              Quagga.decodeSingle({
                ...config,
                src: contrastImageData
              }, (result) => {
                resolve(result);
              });
            });
            
            if (contrastBarcodeResult && contrastBarcodeResult.codeResult) {
              Object.assign(barcodeResult, contrastBarcodeResult);
            }
          } catch (contrastError) {
            console.log('Contrast enhancement for barcode failed:', contrastError);
          }
        }

        if (barcodeResult && barcodeResult.codeResult) {
          // Validate that we have a proper code
          if (barcodeResult.codeResult.code && barcodeResult.codeResult.code.trim().length > 0) {
            return res.json({
              success: true,
              data: barcodeResult.codeResult.code.trim(),
              type: barcodeResult.codeResult.format,
              bounds: barcodeResult.box
            });
          }
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
        console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error processing scan request'
    });
  }
});

module.exports = router;