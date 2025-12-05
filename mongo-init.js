// Create database and user for Meal Pass application
db = db.getSiblingDB('mealpass');

// Create a user for the application
db.createUser({
  user: 'mealpass_user',
  pwd: 'mealpass_password',
  roles: [
    {
      role: 'readWrite',
      db: 'mealpass'
    }
  ]
});

// Create collections with indexes
db.createCollection('employees');
db.createCollection('feedingrecords');
db.createCollection('feedlogs');

// Create indexes
db.employees.createIndex({ "uniqueId": 1 }, { unique: true });
db.employees.createIndex({ "name": 1 });
db.employees.createIndex({ "gender": 1 });
db.employees.createIndex({ "department": 1 });
db.employees.createIndex({ "createdAt": 1 });

db.feedingrecords.createIndex({ "uniqueId": 1, "date": 1 });
db.feedingrecords.createIndex({ "employee": 1 });
db.feedingrecords.createIndex({ "date": 1 });
db.feedingrecords.createIndex({ "fedAt": 1 });

db.feedlogs.createIndex({ "employeeId": 1 });
db.feedlogs.createIndex({ "uniqueId": 1 });
db.feedlogs.createIndex({ "fedAt": 1 });
db.feedlogs.createIndex({ "createdAt": 1 });

print('Database initialized successfully');