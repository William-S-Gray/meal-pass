const request = require('supertest');
const express = require('express');
const scanRoutes = require('../routes/scanRoutes');

// Create a test app
const app = express();
app.use('/api', scanRoutes);

describe('Scan Routes', () => {
  describe('POST /api/scan', () => {
    it('should return 400 if no image file is provided', async () => {
      const response = await request(app)
        .post('/api/scan')
        .expect(400);
      
      expect(response.body).toEqual({
        success: false,
        message: 'No image file provided'
      });
    });

    it('should return 400 if file is not an image', async () => {
      const response = await request(app)
        .post('/api/scan')
        .attach('image', Buffer.from('test'), 'test.txt')
        .expect(400);
    });

    // Note: Testing actual QR code scanning would require mocking the libraries
    // or providing actual test images, which is beyond the scope of this basic test
  });
});