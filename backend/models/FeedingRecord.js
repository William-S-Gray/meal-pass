const mongoose = require('mongoose');

const feedingRecordSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    index: true // Add index for uniqueId
  },
  beneficiary: {
    name: String,
    group: String,
    uniqueId: String
  },
  date: {
    type: String,
    required: true,
    index: true // Add index for date
  },
  fedAt: {
    type: Date,
    required: true,
    index: true // Add index for fedAt
  },
  method: {
    type: String,
    required: true,
    enum: ['scan', 'manual'],
    index: true // Add index for method
  },
  deviceId: {
    type: String,
    required: true,
    index: true // Add index for deviceId
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate feedings - this ensures uniqueness
feedingRecordSchema.index({ uniqueId: 1, date: 1 }, { unique: true });

// Index for querying by date range
feedingRecordSchema.index({ date: 1, fedAt: -1 });

// Additional indexes for common queries
feedingRecordSchema.index({ deviceId: 1, fedAt: -1 }); // For querying by device
feedingRecordSchema.index({ 'beneficiary.uniqueId': 1, fedAt: -1 }); // For querying by beneficiary

module.exports = mongoose.model('FeedingRecord', feedingRecordSchema);