require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected for script.');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const ensureAdminUser = async () => {
    const adminUsername = 'admin';
    try {
        let adminUser = await User.findOne({ username: adminUsername });
        if (!adminUser) {
            console.log(`Admin user '${adminUsername}' not found. Creating...`);
            adminUser = new User({
                username: adminUsername,
                password: 'adminadmin', // Will be hashed by pre-save hook
                email: 'admin@system.local',
                fullName: 'System Administrator',
                roles: ['admin'],
                status: 'aktiv',
            });
            await adminUser.save();
            console.log(`Admin user '${adminUsername}' created successfully.`);
        } else {
            console.log(`Admin user '${adminUsername}' already exists.`);
        }
    } catch (error) {
        console.error(`Error ensuring admin user:`, error);
    }
};

const resetTestUser = async () => {
    const testUsername = 'testuser';
    const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password',
        roles: ['employee'],
        status: 'aktiv',
        geburtsdatum: new Date('1990-01-15'),
        adresse: {
            strasse: 'Testweg 1',
            plz: '12345',
            ort: 'Teststadt',
            land: 'Deutschland'
        },
        telefon: '0123456789',
        eintrittsdatum: new Date('2022-08-01'),
        austrittsdatum: null,
        position: 'Softwareentwickler',
        abteilung: 'IT',
        beschaeftigungsgrad: 100,
        vorgesetzter: 'Max Mustermann',
        gehalt: 60000,
        iban: 'DE89370400440532013000',
        bankname: 'Test Bank',
        sozialversicherungsnummer: '12345678A987'
    };

    try {
        let user = await User.findOne({ username: testUsername });
        if (user) {
            console.log(`User '${testUsername}' found. Updating...`);
            Object.assign(user, userData);
            await user.save(); // pre-save hook will hash password if changed
            console.log(`User '${testUsername}' updated successfully.`);
        } else {
            console.log(`User '${testUsername}' not found. Creating...`);
            const newUser = new User({ username: testUsername, ...userData });
            await newUser.save();
            console.log(`User '${testUsername}' created successfully.`);
        }
    } catch (error) {
        console.error('Error resetting test user:', error);
    }
};

const main = async () => {
    await connectDB();
    await ensureAdminUser();
    await resetTestUser();
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
};

main();
