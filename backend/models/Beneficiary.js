const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  uniqueId: {
    type: String,
    required: [true, 'Unique ID is required'],
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  age: {
    type: Number,
    required: false
  },
  photo: {
    type: String, // URL to photo
    required: false
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