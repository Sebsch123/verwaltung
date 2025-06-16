/*
  Migration Script: Remove fullName field from existing users
  Usage:
      node backend/scripts/removeFullNameField.js

  The script will:
  1. Connect to MongoDB
  2. Remove fullName field from all documents in users collection
*/

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/verwaltung';

(async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB.');

    // Get reference to users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Remove fullName field from all documents
    const result = await usersCollection.updateMany(
      {},
      { $unset: { fullName: "" } }
    );
    
    console.log(`Removed fullName from ${result.modifiedCount} documents`);
    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
})();
