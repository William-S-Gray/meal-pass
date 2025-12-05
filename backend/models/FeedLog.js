const mongoose = require('mongoose');

const feedLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  uniqueId: {
    type: String,
    required: true,
    trim: true
  },
  fedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  servedBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
feedLogSchema.index({ employeeId: 1 });
feedLogSchema.index({ uniqueId: 1 });
feedLogSchema.index({ fedAt: 1 });
feedLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('FeedLog', feedLogSchema);