const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const Admin = require('../models/Admin');

describe('Authentication API', () => {
  let server;
  let testAdmin;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mealpass_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    testAdmin = new Admin({
      username: 'testadmin',
      password: hashedPassword,
      role: 'admin',
      name: 'Test Admin'
    });
    
    await testAdmin.save();
  });

  afterAll(async () => {
    // Clean up test data
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('username', 'testadmin');
      expect(res.body.data).toHaveProperty('role', 'admin');
    });

    it('should fail login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        })
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin'
          // Missing password
        })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Protected Routes', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token for testing protected routes
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'password123'
        });
      
      authToken = res.body.token;
    });

    it('should allow access to protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/beneficiaries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
    });

    it('should reject access to protected route without token', async () => {
      const res = await request(app)
        .get('/api/beneficiaries')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Not authorized to access this route');
    });

    it('should reject access to protected route with invalid token', async () => {
      const res = await request(app)
        .get('/api/beneficiaries')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Not authorized to access this route');
    });
  });
});