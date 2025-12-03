const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Beneficiary = require('./backend/models/Beneficiary');
const FeedingRecord = require('./backend/models/FeedingRecord');
const Admin = require('./backend/models/Admin');
const { generateUniqueId } = require('./backend/utils/idGenerator');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mealpass', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  try {
    console.log('Connected to MongoDB');

    // Clear existing data
    await Beneficiary.deleteMany({});
    await FeedingRecord.deleteMany({});
    await Admin.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator'
    });
    
    await admin.save();
    console.log('Created admin user');

    // Create 30 test beneficiaries
    const beneficiaries = [];
    const groups = ['Group A', 'Group B', 'Group C', 'Group D', 'Group E'];
    const genders = ['male', 'female'];
    
    for (let i = 1; i <= 30; i++) {
      const beneficiary = {
        name: `Beneficiary ${i}`,
        gender: genders[Math.floor(Math.random() * genders.length)],
        age: Math.floor(Math.random() * 50) + 18, // Age between 18-67
        group: groups[Math.floor(Math.random() * groups.length)],
        uniqueId: generateUniqueId()
      };
      
      beneficiaries.push(beneficiary);
    }
    
    const createdBeneficiaries = await Beneficiary.insertMany(beneficiaries);
    console.log(`Created ${createdBeneficiaries.length} beneficiaries`);

    // Create 50 feeding records
    const feedingRecords = [];
    const today = new Date();
    const dates = [];
    
    // Generate dates for the past 10 days
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    for (let i = 1; i <= 50; i++) {
      const randomBeneficiary = createdBeneficiaries[Math.floor(Math.random() * createdBeneficiaries.length)];
      const randomDate = dates[Math.floor(Math.random() * dates.length)];
      const dateString = randomDate.toISOString().split('T')[0];
      
      const feedingRecord = {
        uniqueId: randomBeneficiary.uniqueId,
        beneficiary: randomBeneficiary._id,
        date: dateString,
        fedAt: randomDate,
        method: Math.random() > 0.5 ? 'scan' : 'manual',
        deviceId: `device-${Math.floor(Math.random() * 5) + 1}`
      };
      
      feedingRecords.push(feedingRecord);
    }
    
    await FeedingRecord.insertMany(feedingRecords);
    console.log(`Created ${feedingRecords.length} feeding records`);

    console.log('Test data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
});