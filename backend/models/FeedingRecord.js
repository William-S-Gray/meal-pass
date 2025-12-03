const mongoose = require('mongoose');

const feedingRecordSchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    trim: true
  },
  beneficiary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Beneficiary',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  fedAt: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['scan', 'manual'],
    required: true
  },
  deviceId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
feedingRecordSchema.index({ uniqueId: 1, date: 1 });

module.exports = mongoose.model('FeedingRecord', feedingRecordSchema);