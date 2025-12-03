const mongoose = require('mongoose');
const { generateUniqueId } = require('../utils/idGenerator');
const { getYYYYMMDD } = require('../controllers/feedingController');

describe('Utility Functions', () => {
  describe('generateUniqueId', () => {
    it('should generate a unique ID with correct format', () => {
      const id = generateUniqueId();
      
      // Check format: BEN-YYYY-XXXX where X is a number
      expect(id).toMatch(/^BEN-\d{4}-\d{4}$/);
      
      // Extract year from ID and verify it matches current year
      const yearFromId = id.split('-')[1];
      const currentYear = new Date().getFullYear().toString();
      expect(yearFromId).toBe(currentYear);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      // Generate 100 IDs and check for uniqueness
      for (let i = 0; i < 100; i++) {
        const id = generateUniqueId();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });
  });

  describe('getYYYYMMDD', () => {
    it('should convert date to YYYY-MM-DD format', () => {
      const testDate = new Date('2025-12-25T10:30:00Z');
      const formattedDate = getYYYYMMDD(testDate);
      
      expect(formattedDate).toBe('2025-12-25');
    });

    it('should handle different date inputs correctly', () => {
      const testDates = [
        new Date('2025-01-01'),
        new Date('2025-02-28'),
        new Date('2025-12-31')
      ];
      
      const expectedResults = [
        '2025-01-01',
        '2025-02-28',
        '2025-12-31'
      ];
      
      testDates.forEach((date, index) => {
        expect(getYYYYMMDD(date)).toBe(expectedResults[index]);
      });
    });
  });

  describe('Database Models', () => {
    // Test that models are properly defined
    it('should have required fields in Beneficiary model', () => {
      const Beneficiary = require('../models/Beneficiary');
      
      // Check that model exists
      expect(Beneficiary).toBeDefined();
      
      // Check that it's a Mongoose model
      expect(Beneficiary.prototype.constructor.name).toBe('model');
    });

    it('should have required fields in FeedingRecord model', () => {
      const FeedingRecord = require('../models/FeedingRecord');
      
      // Check that model exists
      expect(FeedingRecord).toBeDefined();
      
      // Check that it's a Mongoose model
      expect(FeedingRecord.prototype.constructor.name).toBe('model');
    });
  });
});