const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/train_ticket_booking';

  try {
    // Attempt connecting to the user's local or Atlas MongoDB with a 2.5-second timeout
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`\x1b[32m✔ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}\x1b[0m`);
    console.log(`\x1b[36mℹ Ready for inspection in MongoDB Compass at: ${primaryUri}\x1b[0m`);

    // Verify data exists; if empty, auto-seed
    const Train = require('../models/Train');
    const trainCount = await Train.countDocuments();
    if (trainCount === 0 && !global.__isSeeding) {
      const seedData = require('../seed');
      console.log(`\x1b[35m🌱 Auto-seeding initial railway fleet & stations into database...\x1b[0m`);
      await seedData();
    }

    return conn;
  } catch (error) {
    console.warn(`\x1b[33m⚠ Local standalone mongod on ${primaryUri} not running (${error.message}).\x1b[0m`);
    console.log(`\x1b[36m⚡ Spinning up MongoDB Server on port 27017 for Compass & App...\x1b[0m`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      try {
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'train_ticket_booking',
          },
        });
      } catch (portError) {
        // Fallback to auto-assigned port if 27017 is blocked
        mongoMemoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'train_ticket_booking',
          },
        });
      }

      const baseUri = mongoMemoryServer.getUri().replace(/\/$/, '');
      const memoryUri = `${baseUri}/train_ticket_booking`;
      const conn = await mongoose.connect(memoryUri);
      console.log(`\x1b[32m✔ MongoDB Server listening at: ${memoryUri}\x1b[0m`);
      console.log(`\x1b[36m✔ Compass Connection String: mongodb://127.0.0.1:27017/train_ticket_booking\x1b[0m`);

      // Automatically seed the data into instance so the app is immediately ready!
      if (!global.__isSeeding) {
        const seedData = require('../seed');
        console.log(`\x1b[35m🌱 Auto-seeding initial trains, schedules & tickets into database...\x1b[0m`);
        await seedData();
      }

      return conn;
    } catch (fallbackError) {
      console.error(`\x1b[31m✖ Failed to initialize MongoDB: ${fallbackError.message}\x1b[0m`);
    }
  }
};

module.exports = connectDB;
