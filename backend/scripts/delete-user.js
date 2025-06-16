require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function deleteUser() {
    try {
        // Verbindung zur Datenbank herstellen
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Test-Benutzer löschen
        const result = await User.deleteOne({ username: 'testuser' });
        console.log('User deleted:', result.deletedCount);

        // Verbindung schließen
        await mongoose.connection.close();
        console.log('MongoDB Verbindung geschlossen');
    } catch (error) {
        console.error('Error deleting user:', error);
        process.exit(1);
    }
}

// Script ausführen
deleteUser();
