const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

describe('Feeding API', () => {
  let server;
  let authToken;
  let testBeneficiary;

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

    // Create a test beneficiary
    testBeneficiary = await Beneficiary.create({
      name: 'John Doe',
      gender: 'male',
      age: 30,
      uniqueId: 'BEN-001'
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await FeedingRecord.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await Beneficiary.deleteMany({});
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/feeding/scan', () => {
    it('should create a feeding record when scanning valid QR code', async () => {
      const res = await request(app)
        .post('/api/feeding/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          uniqueId: 'BEN-001',
          deviceId: 'test-device',
          method: 'scan'
        })
        .expect(201);

      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message', 'Feeding recorded successfully.');

      // Verify the feeding record was created
      const feedingRecord = await FeedingRecord.findOne({ uniqueId: 'BEN-001' });
      expect(feedingRecord).toBeTruthy();
      expect(feedingRecord.method).toBe('scan');
    });

    it('should prevent duplicate feeding for the same day', async () => {
      // First scan
      await request(app)
        .post('/api/feeding/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          uniqueId: 'BEN-001',
          deviceId: 'test-device',
          method: 'scan'
        })
        .expect(201);

      // Second scan (should fail)
      const res = await request(app)
        .post('/api/feeding/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          uniqueId: 'BEN-001',
          deviceId: 'test-device',
          method: 'scan'
        })
        .expect(200);

      expect(res.body).toHaveProperty('status', 'already_fed');
      expect(res.body).toHaveProperty('message', 'Beneficiary already fed today.');
    });

    it('should return error for non-existent beneficiary', async () => {
      const res = await request(app)
        .post('/api/feeding/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          uniqueId: 'NON-EXISTENT',
          deviceId: 'test-device',
          method: 'scan'
        })
        .expect(404);

      expect(res.body).toHaveProperty('status', 'not_found');
      expect(res.body).toHaveProperty('message', 'Beneficiary not found');
    });

    it('should fail with invalid method', async () => {
      const res = await request(app)
        .post('/api/feeding/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          uniqueId: 'BEN-001',
          deviceId: 'test-device',
          method: 'invalid-method'
        })
        .expect(400);

      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body).toHaveProperty('message', 'Method must be either "scan" or "manual"');
    });
  });

  describe('DELETE /api/feeding/record/:uniqueId', () => {
    it('should remove a feeding record', async () => {
      // First create a feeding record
      await request(app)
        .post('/api/feeding/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          uniqueId: 'BEN-001',
          deviceId: 'test-device',
          method: 'manual'
        })
        .expect(201);

      // Then remove it
      const res = await request(app)
        .delete(`/api/feeding/record/BEN-001`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message', 'Feeding record removed successfully');

      // Verify the feeding record was removed
      const feedingRecord = await FeedingRecord.findOne({ uniqueId: 'BEN-001' });
      expect(feedingRecord).toBeFalsy();
    });

    it('should return error when trying to remove non-existent feeding record', async () => {
      const res = await request(app)
        .delete(`/api/feeding/record/BEN-001`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('error', 'No feeding record found for today');
    });
  });

  describe('GET /api/feeding/today', () => {
    it('should get all feeding records for today', async () => {
      // Create test feeding records
      await FeedingRecord.create([
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiary._id,
          date: new Date().toISOString().split('T')[0],
          fedAt: new Date(),
          method: 'scan',
          deviceId: 'device-1'
        },
        {
          uniqueId: 'BEN-002',
          beneficiary: testBeneficiary._id,
          date: new Date().toISOString().split('T')[0],
          fedAt: new Date(),
          method: 'manual',
          deviceId: 'device-2'
        }
      ]);

      const res = await request(app)
        .get('/api/feeding/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('uniqueId');
      expect(res.body.data[1]).toHaveProperty('uniqueId');
    });
  });

  describe('GET /api/feeding/beneficiary/:uniqueId', () => {
    it('should get feeding history for a beneficiary', async () => {
      // Create test feeding records for the beneficiary
      const today = new Date().toISOString().split('T')[0];
      await FeedingRecord.create([
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiary._id,
          date: today,
          fedAt: new Date(),
          method: 'scan',
          deviceId: 'device-1'
        },
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiary._id,
          date: '2025-12-01',
          fedAt: new Date('2025-12-01'),
          method: 'manual',
          deviceId: 'device-2'
        }
      ]);

      const res = await request(app)
        .get(`/api/feeding/beneficiary/BEN-001`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('uniqueId', 'BEN-001');
      expect(res.body.data[1]).toHaveProperty('uniqueId', 'BEN-001');
    });
  });
});