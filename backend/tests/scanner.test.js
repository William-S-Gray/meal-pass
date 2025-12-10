const request = require('supertest');
const express = require('express');
const scanRoutes = require('../routes/scanRoutes');

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api', scanRoutes);

describe('Scanner API', () => {
  // Test that the scan endpoint exists
  test('POST /api/scan should exist', async () => {
    const response = await request(app)
      .post('/api/scan')
      .expect(400); // Expect 400 since no file is provided
    
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  });

  // Test that the scan endpoint handles missing files correctly
  test('POST /api/scan without file should return error', async () => {
    const response = await request(app)
      .post('/api/scan')
      .expect(400);
    
    expect(response.body).toEqual({
      success: false,
      message: 'No image file provided'
    });
  });

  // Test that the scan endpoint handles wrong file types
  test('POST /api/scan with wrong file type should return error', async () => {
    const response = await request(app)
      .post('/api/scan')
      .attach('image', Buffer.from('not an image'), 'test.txt')
      .expect(500); // Multer will reject non-image files
    
    // The exact error message might vary, but we expect an error
    expect(response.status).toBe(500);
  });
});