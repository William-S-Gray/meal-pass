const request = require('supertest');
const app = require('../server');

describe('Employee API', () => {
  it('should return empty array when no employees exist', async () => {
    const response = await request(app)
      .get('/api/employees')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });
});