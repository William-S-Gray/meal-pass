const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  group: {
    type: String,
    required: [true, 'Group is required'],
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
  photoUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
beneficiarySchema.index({ uniqueId: 1 });
beneficiarySchema.index({ group: 1 });
beneficiarySchema.index({ createdAt: 1 });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);