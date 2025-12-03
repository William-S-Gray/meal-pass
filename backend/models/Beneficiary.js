const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  group: {
    type: String,
    required: false,
    trim: true,
    maxlength: [50, 'Group cannot be more than 50 characters']
  },
  uniqueId: {
    type: String,
    required: [true, 'Unique ID is required'],
    unique: true,
    trim: true
  },
  qrCodeUrl: {
    type: String,
    required: [true, 'QR Code URL is required']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
beneficiarySchema.index({ uniqueId: 1 });
beneficiarySchema.index({ group: 1 });
beneficiarySchema.index({ createdAt: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);