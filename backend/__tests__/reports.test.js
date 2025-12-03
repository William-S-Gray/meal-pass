const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Beneficiary = require('../models/Beneficiary');
const FeedingRecord = require('../models/FeedingRecord');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

describe('Reports API', () => {
  let server;
  let authToken;
  let testBeneficiaries = [];

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

    // Create test beneficiaries
    testBeneficiaries = await Beneficiary.create([
      { name: 'John Doe', gender: 'male', age: 30, uniqueId: 'BEN-001' },
      { name: 'Jane Smith', gender: 'female', age: 25, uniqueId: 'BEN-002' },
      { name: 'Bob Johnson', gender: 'male', age: 35, uniqueId: 'BEN-003' }
    ]);
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

  describe('GET /api/reports/today', () => {
    it('should get today\'s feeding report', async () => {
      // Create test feeding records for today
      const today = new Date().toISOString().split('T')[0];
      await FeedingRecord.create([
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiaries[0]._id,
          date: today,
          fedAt: new Date(),
          method: 'scan',
          deviceId: 'device-1'
        },
        {
          uniqueId: 'BEN-002',
          beneficiary: testBeneficiaries[1]._id,
          date: today,
          fedAt: new Date(),
          method: 'manual',
          deviceId: 'device-2'
        }
      ]);

      const res = await request(app)
        .get('/api/reports/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalFed', 2);
      expect(res.body.data).toHaveProperty('byGroup');
      expect(res.body.data).toHaveProperty('byGender');
      expect(res.body.data.feedingRecords).toHaveLength(2);
    });
  });

  describe('GET /api/reports/date-range', () => {
    it('should get feeding records for a date range', async () => {
      // Create test feeding records for different dates
      await FeedingRecord.create([
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiaries[0]._id,
          date: '2025-12-01',
          fedAt: new Date('2025-12-01'),
          method: 'scan',
          deviceId: 'device-1'
        },
        {
          uniqueId: 'BEN-002',
          beneficiary: testBeneficiaries[1]._id,
          date: '2025-12-02',
          fedAt: new Date('2025-12-02'),
          method: 'manual',
          deviceId: 'device-2'
        },
        {
          uniqueId: 'BEN-003',
          beneficiary: testBeneficiaries[2]._id,
          date: '2025-12-03',
          fedAt: new Date('2025-12-03'),
          method: 'scan',
          deviceId: 'device-3'
        }
      ]);

      const res = await request(app)
        .get('/api/reports/date-range?from=2025-12-01&to=2025-12-02')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('date');
      expect(res.body.data[1]).toHaveProperty('date');
    });
  });

  describe('GET /api/reports/beneficiary/:uniqueId', () => {
    it('should get feeding history for a specific beneficiary', async () => {
      // Create test feeding records for a beneficiary
      await FeedingRecord.create([
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiaries[0]._id,
          date: '2025-12-01',
          fedAt: new Date('2025-12-01'),
          method: 'scan',
          deviceId: 'device-1'
        },
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiaries[0]._id,
          date: '2025-12-02',
          fedAt: new Date('2025-12-02'),
          method: 'manual',
          deviceId: 'device-2'
        }
      ]);

      const res = await request(app)
        .get('/api/reports/beneficiary/BEN-001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count', 2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('uniqueId', 'BEN-001');
      expect(res.body.data[1]).toHaveProperty('uniqueId', 'BEN-001');
    });
  });

  describe('GET /api/reports/statistics', () => {
    it('should get overall statistics', async () => {
      // Create test feeding records
      await FeedingRecord.create([
        {
          uniqueId: 'BEN-001',
          beneficiary: testBeneficiaries[0]._id,
          date: '2025-12-01',
          fedAt: new Date('2025-12-01'),
          method: 'scan',
          deviceId: 'device-1'
        },
        {
          uniqueId: 'BEN-002',
          beneficiary: testBeneficiaries[1]._id,
          date: '2025-12-01',
          fedAt: new Date('2025-12-01'),
          method: 'manual',
          deviceId: 'device-2'
        }
      ]);

      const res = await request(app)
        .get('/api/reports/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('totalBeneficiaries');
      expect(res.body.data).toHaveProperty('totalFedToday');
      expect(res.body.data).toHaveProperty('totalFeedingRecords');
    });
  });
});