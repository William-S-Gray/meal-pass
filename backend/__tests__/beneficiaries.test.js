const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Beneficiary = require('../models/Beneficiary');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

describe('Beneficiaries API', () => {
  let server;
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mealpass_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test admin user for authentication
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const testAdmin = new Admin({
      username: 'testadmin',
      password: hashedPassword,
      role: 'admin',
      name: 'Test Admin'
    });
    
    await testAdmin.save();

    // Get auth token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testadmin',
        password: 'password123'
      });

    authToken = res.body.token;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await Beneficiary.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/beneficiaries', () => {
    it('should create a new beneficiary', async () => {
      const res = await request(app)
        .post('/api/beneficiaries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          gender: 'male',
          age: 30
        })
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', 'John Doe');
      expect(res.body.data).toHaveProperty('uniqueId');
      expect(res.body.data).toHaveProperty('qrCodeUrl');
      expect(res.body.data.active).toBe(true);
    });

    it('should fail to create beneficiary with missing required fields', async () => {
      const res = await request(app)
        .post('/api/beneficiaries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe'
          // Missing gender and age
        })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/beneficiaries', () => {
    it('should get all beneficiaries', async () => {
      // Create test beneficiaries
      await Beneficiary.create([
        { name: 'John Doe', gender: 'male', age: 30, uniqueId: 'BEN-001' },
        { name: 'Jane Smith', gender: 'female', age: 25, uniqueId: 'BEN-002' }
      ]);

      const res = await request(app)
        .get('/api/beneficiaries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[1]).toHaveProperty('name');
    });

    it('should paginate beneficiaries', async () => {
      // Create multiple test beneficiaries
      const beneficiaries = [];
      for (let i = 1; i <= 15; i++) {
        beneficiaries.push({
          name: `Beneficiary ${i}`,
          gender: i % 2 === 0 ? 'male' : 'female',
          age: 20 + i,
          uniqueId: `BEN-${i.toString().padStart(3, '0')}`
        });
      }
      await Beneficiary.create(beneficiaries);

      const res = await request(app)
        .get('/api/beneficiaries?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 10);
      expect(res.body.data).toHaveLength(10);
      expect(res.body.pagination).toHaveProperty('page', 1);
      expect(res.body.pagination).toHaveProperty('limit', 10);
      expect(res.body.pagination).toHaveProperty('total', 15);
    });
  });

  describe('GET /api/beneficiaries/:id', () => {
    it('should get a single beneficiary by ID', async () => {
      const beneficiary = await Beneficiary.create({
        name: 'John Doe',
        gender: 'male',
        age: 30,
        uniqueId: 'BEN-001'
      });

      const res = await request(app)
        .get(`/api/beneficiaries/${beneficiary._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', 'John Doe');
      expect(res.body.data).toHaveProperty('_id', beneficiary._id.toString());
    });

    it('should return 404 for non-existent beneficiary', async () => {
      const fakeId = '5f9d88e1a1b2c3d4e5f6g7h8';

      const res = await request(app)
        .get(`/api/beneficiaries/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Beneficiary not found');
    });
  });

  describe('PUT /api/beneficiaries/:id', () => {
    it('should update a beneficiary', async () => {
      const beneficiary = await Beneficiary.create({
        name: 'John Doe',
        gender: 'male',
        age: 30,
        uniqueId: 'BEN-001'
      });

      const res = await request(app)
        .put(`/api/beneficiaries/${beneficiary._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Smith',
          gender: 'male',
          age: 31
        })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('name', 'John Smith');
      expect(res.body.data).toHaveProperty('age', 31);
    });

    it('should fail to update non-existent beneficiary', async () => {
      const fakeId = '5f9d88e1a1b2c3d4e5f6g7h8';

      const res = await request(app)
        .put(`/api/beneficiaries/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Smith',
          gender: 'male',
          age: 31
        })
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Beneficiary not found');
    });
  });

  describe('DELETE /api/beneficiaries/:id', () => {
    it('should delete (soft delete) a beneficiary', async () => {
      const beneficiary = await Beneficiary.create({
        name: 'John Doe',
        gender: 'male',
        age: 30,
        uniqueId: 'BEN-001'
      });

      const res = await request(app)
        .delete(`/api/beneficiaries/${beneficiary._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);

      // Verify the beneficiary is now inactive
      const updatedBeneficiary = await Beneficiary.findById(beneficiary._id);
      expect(updatedBeneficiary.active).toBe(false);
    });

    it('should fail to delete non-existent beneficiary', async () => {
      const fakeId = '5f9d88e1a1b2c3d4e5f6g7h8';

      const res = await request(app)
        .delete(`/api/beneficiaries/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'Beneficiary not found');
    });
  });
});