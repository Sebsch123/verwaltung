require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createTestUser() {
    try {
        // Verbindung zur Datenbank herstellen
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Test-Benutzer löschen
        await User.deleteOne({ username: 'testuser' });
        console.log('Old test user deleted');

        // Passwort hashen
        const password = 'password';
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Generated hash:', hashedPassword);

        // Test-Benutzer erstellen
        const testUser = new User({
            username: 'testuser',
            password: hashedPassword,
            email: 'test@example.com',
            fullName: 'Test User',
            roles: ['admin']
        });

        // Benutzer speichern
        await testUser.save();
        console.log('Test-Benutzer erfolgreich erstellt:', testUser);

        // Verbindung schließen
        await mongoose.connection.close();
        console.log('MongoDB Verbindung geschlossen');
    } catch (error) {
        console.error('Fehler beim Erstellen des Test-Benutzers:', error);
        process.exit(1);
    }
}

// Script ausführen
createTestUser();
