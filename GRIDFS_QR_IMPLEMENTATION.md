# 📦 GridFS QR Code Implementation Summary

## 🔧 Backend Components

### 1. GridFS Connection Helper (`backend/utils/gridfs.js`)
```javascript
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const logger = require('./logger');

let gfs;
let gridFsBucket;

// Initialize GridFS
const initGridFS = async () => {
  try {
    // Wait for mongoose connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connection.asPromise();
    }

    // Create GridFS stream
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection('uploads'); // Collection name for GridFS files

    // Create GridFS bucket for streaming
    gridFsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    logger.info('GridFS initialized successfully');
  } catch (error) {
    logger.error('Error initializing GridFS:', error);
    throw error;
  }
};

// Get GridFS stream instance
const getGfs = () => {
  if (!gfs) {
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  return gfs;
};

// Get GridFS bucket instance
const getGridFsBucket = () => {
  if (!gridFsBucket) {
    throw new Error('GridFS Bucket not initialized. Call initGridFS() first.');
  }
  return gridFsBucket;
};

// Create GridFS storage for multer
const createGridFsStorage = () => {
  return new GridFsStorage({
    url: process.env.MONGODB_URI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        // Generate filename
        const filename = file.originalname;
        
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    }
  });
};

module.exports = {
  initGridFS,
  getGfs,
  getGridFsBucket,
  createGridFsStorage
};
```

### 2. QR Generation Service (`backend/services/qrService.js`)
```javascript
const QRCode = require('qrcode');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { getGridFsBucket } = require('../utils/gridfs');

/**
 * Generate QR code for a unique ID and store it in GridFS
 * @param {string} uniqueId - Unique identifier to encode in QR code
 * @returns {string} Filename of the generated QR code in GridFS
 */
const generateQRCode = async (uniqueId) => {
  try {
    logger.info('Generating QR code and storing in GridFS', { uniqueId });
    
    // Generate QR code as buffer
    const buffer = await QRCode.toBuffer(uniqueId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Get GridFS bucket
    const gridFsBucket = getGridFsBucket();
    
    // Generate filename
    const fileName = `qr-\${uniqueId.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    
    // Create upload stream
    const uploadStream = gridFsBucket.openUploadStream(fileName, {
      metadata: {
        uniqueId: uniqueId,
        createdAt: new Date()
      }
    });
    
    // Write buffer to GridFS
    await new Promise((resolve, reject) => {
      uploadStream.end(buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    logger.info('QR code generated and saved to GridFS successfully', { uniqueId, fileName });
    return fileName;
  } catch (error) {
    logger.error('Error generating QR code in GridFS', { uniqueId, error: error.message });
    throw error;
  }
};

/**
 * Get QR code from GridFS by filename
 * @param {string} fileName - Name of the QR code file in GridFS
 * @returns {Promise<Buffer>} Buffer containing the QR code image
 */
const getQRCodeFromGridFS = async (fileName) => {
  try {
    logger.info('Retrieving QR code from GridFS', { fileName });
    
    // Get GridFS bucket
    const gridFsBucket = getGridFsBucket();
    
    // Create download stream
    const downloadStream = gridFsBucket.openDownloadStreamByName(fileName);
    
    // Collect data chunks
    const chunks = [];
    return new Promise((resolve, reject) => {
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        logger.info('QR code retrieved from GridFS successfully', { fileName });
        resolve(buffer);
      });
      
      downloadStream.on('error', (error) => {
        logger.error('Error retrieving QR code from GridFS', { fileName, error: error.message });
        reject(error);
      });
    });
  } catch (error) {
    logger.error('Error retrieving QR code from GridFS', { fileName, error: error.message });
    throw error;
  }
};

module.exports = {
  generateQRCode,
  getQRCodeFromGridFS
};
```

### 3. Controller Endpoint (`backend/controllers/employeeController.js`)
```javascript
/**
 * @desc    Download QR code for employee by uniqueId
 * @route   GET /api/employees/uid/:uid/qrcode
 * @access  Private
 */
const downloadQRCodeByUid = async (req, res, next) => {
  try {
    const { uid } = req.params;
    
    const employee = await employeeService.getByUniqueId(uid);
    if (!employee) {
      logger.warn('Employee not found for QR code download by UID', { uid });
      return sendError(res, 404, 'Employee not found');
    }
    
    // Check if QR code exists
    if (!employee.qrFileName) {
      logger.warn('QR code filename not found for employee by UID - regenerating', { uid, employee });
      
      // Generate new QR code
      const qrFileName = await qrService.generateQRCode(uid);
      
      // Update employee with new QR filename
      await Employee.updateOne(
        { uniqueId: uid },
        { qrFileName: qrFileName }
      );
      
      employee.qrFileName = qrFileName;
      logger.info('QR code regenerated and saved to GridFS', { uid, qrFileName });
    }
    
    // Set proper headers for file download
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Get QR code from GridFS
    const qrBuffer = await qrService.getQRCodeFromGridFS(employee.qrFileName);
    
    // Set content type and serve file
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', \`attachment; filename="\${employee.qrFileName}"\`);
    
    // Send the image buffer
    res.send(qrBuffer);
  } catch (error) {
    logger.error('Error in downloadQRCodeByUid:', error);
    sendError(res, 500, error.message);
  }
};
```

### 4. Route Registration (`backend/routes/employeeRoutes.js`)
```javascript
// QR Code download route by UID
router.route('/uid/:uid/qrcode')
  .get(authMiddleware, downloadQRCodeByUid);
```

### 5. CORS Configuration (`backend/server.js`)
```javascript
// Enable CORS with specific options for better security
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace("https://", "http://"),
    "https://meal-pass-frontend.onrender.com" // Explicitly allow production frontend
  ],
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, Accept, Origin, X-Requested-With",
  exposedHeaders: ["Content-Disposition"],
  credentials: true
}));

// Handle CORS preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://meal-pass-frontend.onrender.com');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
```

## 🎨 Frontend Components

### 1. QR Download Function (`frontend/src/lib/api.ts`)
```typescript
// ============ QR CODE FUNCTIONS ============
export async function downloadQRCode(employeeId: string, employeeUid: string): Promise<void> {
  try {
    // Use the new endpoint that accepts uniqueId instead of _id
    const response = await apiClient.get(\`/api/employees/uid/\${employeeUid}/qrcode\`, {
      responseType: 'blob'
    });
    
    // Create blob from response
    const blob = response.data;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`employee-qr-\${employeeUid}.png\`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    handleApiError(error);
    throw error; // Re-throw to maintain existing error handling
  }
}
```

### 2. Download Button Component (`frontend/src/components/DownloadQRButton.tsx`)
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadQRCode as downloadQRCodeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface DownloadQRButtonProps {
  employeeId: string;
  employeeUid: string;
  fileName?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

export default function DownloadQRButton({
  employeeId,
  employeeUid,
  fileName = \`employee-qr-\${employeeUid}.png\`,
  variant = "outline",
  size = "default",
  className = "",
  disabled = false
}: DownloadQRButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadQRCodeApi(employeeId, employeeUid);
      toast({
        title: 'Success',
        description: 'QR code downloaded successfully'
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to download QR code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Downloading...
        </div>
      ) : (
        <div className="flex items-center">
          <Download className="mr-2 h-4 w-4" />
          Download QR
        </div>
      )}
    </Button>
  );
}
```

## 🌐 Environment Variables

### Backend (.env)
```
MONGO_URI=<Atlas Connection String>
BASE_URL=https://meal-backend-9zm8.onrender.com
FRONTEND_URL=https://meal-pass-frontend.onrender.com
```

### Frontend (.env)
```
VITE_BASE_URL=https://meal-backend-9zm8.onrender.com
```

## 🧪 Test Steps for Render Deployment

1. **Verify MongoDB Atlas Connection**:
   - Ensure `MONGO_URI` is correctly set in Render environment variables
   - Test connection with MongoDB Compass or similar tool

2. **Deploy Backend to Render**:
   - Push code to GitHub repository
   - Connect Render to repository
   - Set environment variables in Render dashboard

3. **Test QR Code Generation**:
   - Create a new employee via the API
   - Verify QR code is generated and stored in GridFS
   - Check MongoDB Atlas for uploaded files in `uploads.files` and `uploads.chunks` collections

4. **Test QR Code Download**:
   - Make GET request to `/api/employees/uid/{uid}/qrcode`
   - Verify PNG image is returned with proper headers
   - Test fallback regeneration by manually removing `qrFileName` from employee document

5. **Test Frontend Integration**:
   - Deploy frontend to Render
   - Navigate to employee profile
   - Click "Download QR" button
   - Verify PNG file downloads correctly

## 🚀 Key Benefits

✅ **Persistent Storage**: QR codes stored in MongoDB GridFS survive Render deployments
✅ **Automatic Regeneration**: Missing QR codes are automatically regenerated
✅ **Secure Streaming**: QR codes streamed directly from database with proper headers
✅ **CORS Compliant**: Proper CORS setup for production domains
✅ **Environment Aware**: Works in development and production environments
✅ **Logging**: Comprehensive logging for debugging and monitoring

## 📋 Migration Notes

- All existing QR code serving routes using `/qrcodes/` have been removed
- All QR code requests now go through the new GridFS streaming endpoint
- Existing employees without QR codes will have them automatically generated on first download
- No local file system writes - fully compatible with Render's ephemeral filesystem