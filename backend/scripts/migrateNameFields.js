/*
  Migration Script: Split fullName into firstName and lastName fields on existing users.
  Usage:
      node backend/scripts/migrateNameFields.js

  The script will:
  1. Connect to MongoDB using the same URI as in server.js (env var MONGO_URI or default localhost).
  2. Find all users where fullName exists but firstName/lastName are missing.
  3. Split fullName on the first space (" ") and assign the parts.
  4. Save the documents (triggers pre-save hook that also keeps fullName in sync).
*/

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const path = require('path');

// Import the same User model
const User = require(path.resolve(__dirname, '../models/User'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/verwaltung';

(async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    const users = await User.find({ fullName: { $exists: true, $ne: '' }, $or: [ { firstName: { $exists: false } }, { lastName: { $exists: false } } ] });

    console.log(`Users to migrate: ${users.length}`);

    for (const user of users) {
      const parts = user.fullName.trim().split(' ');
      user.firstName = user.firstName || parts.shift();
      user.lastName = user.lastName || parts.join(' ');
      // Saving triggers the pre-save hook to sync fullName again
      await user.save();
      console.log(`Migrated user ${user._id}: ${user.firstName} ${user.lastName}`);
    }

    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
})();
