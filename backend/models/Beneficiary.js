const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    index: true // Add index for uniqueId
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true // Add index for name
  },

  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other'],
    index: true // Add index for gender
  },
  group: {
    type: String,
    required: false, // Explicitly set as not required
    trim: true,
    index: true // Add index for group
  },
  qrCodeUrl: {
    type: String
  },
  photo: {
    type: String
  },
  active: {
    type: Boolean,
    default: true,
    index: true // Add index for active status
  }
}, {
  timestamps: true
});

// Add indexes for common query fields
beneficiarySchema.index({ name: 1 });
beneficiarySchema.index({ group: 1 });
beneficiarySchema.index({ createdAt: -1 }); // For sorting by creation date
beneficiarySchema.index({ uniqueId: 1, active: 1 }); // Composite index for common queries

module.exports = mongoose.model('Beneficiary', beneficiarySchema);