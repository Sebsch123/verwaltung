require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function testPassword() {
    try {
        // Verbindung zur Datenbank herstellen
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Test-Benutzer suchen
        const testUser = await User.findOne({ username: 'testuser' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        // Passwort testen
        const valid = await bcrypt.compare('password', testUser.password);
        console.log('Password valid:', valid);

        // Verbindung schließen
        await mongoose.connection.close();
        console.log('MongoDB Verbindung geschlossen');
    } catch (error) {
        console.error('Error testing password:', error);
        process.exit(1);
    }
}

// Script ausführen
testPassword();
