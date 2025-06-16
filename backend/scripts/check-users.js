require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
    try {
        // Verbindung zur Datenbank herstellen
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Alle Benutzer anzeigen
        const users = await User.find({});
        console.log('Found users:', users);

        // Test-Benutzer suchen
        const testUser = await User.findOne({ username: 'testuser' });
        console.log('Test user found:', testUser);

        // Verbindung schließen
        await mongoose.connection.close();
        console.log('MongoDB Verbindung geschlossen');
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

// Script ausführen
checkUsers();
