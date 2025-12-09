const request = require('supertest');
const express = require('express');

// Create a simple mock server for testing
const mockApp = express();
mockApp.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

mockApp.get('/api/employees', (req, res) => {
  res.status(200).json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  });
});

describe('Mock Server Tests', () => {
  it('should return 200 OK for health check', async () => {
    const response = await request(mockApp)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return empty employees array', async () => {
    const response = await request(mockApp)
      .get('/api/employees')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });
});