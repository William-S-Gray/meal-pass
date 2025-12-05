const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: false,
    trim: true
  },
  department: {
    type: String,
    required: false,
    trim: true
  },
  position: {
    type: String,
    required: false,
    trim: true
  },
  validUntil: {
    type: Date,
    required: true,
    index: true // Add index for validity checking
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
employeeSchema.index({ name: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ createdAt: -1 }); // For sorting by creation date
employeeSchema.index({ uniqueId: 1, active: 1 }); // Composite index for common queries
employeeSchema.index({ validUntil: 1 }); // Index for validity checking

module.exports = mongoose.model('Employee', employeeSchema);