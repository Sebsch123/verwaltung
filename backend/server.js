require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const User = require('./models/User');
const userService = require('./services/userService');

const app = express();

// === MIDDLEWARE ===
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005'],
    credentials: true,
}));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// === AUTH MIDDLEWARE ===
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ message: 'Kein Token, Autorisierung verweigert' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.status(403).json({ message: 'Token ist nicht gültig' });
        }
        req.user = user;
        next();
    });
};

// === API ROUTES ===

app.get('/', (req, res) => {
    res.json({ message: 'API is running...' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for user: '${username}'`);

        if (!username || !password) {
            return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich' });
        }

        const user = await userService.findUser(username.trim());
        if (!user) {
            console.log(`Login failed: User '${username}' not found.`);
            return res.status(401).json({ message: 'Ungültiger Benutzername oder Passwort' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log(`Login failed: Invalid password for user '${username}'.`);
            return res.status(401).json({ message: 'Ungültiger Benutzername oder Passwort' });
        }

        user.lastLogin = new Date();
        await user.save();

        const payload = { username: user.username, roles: user.roles };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log(`Login successful for user '${username}'.`);
        res.json({
            token,
            user: { username: user.username, roles: user.roles }
        });

    } catch (error) {
        console.error('Login server error:', error);
        res.status(500).json({ message: 'Server-Fehler beim Login' });
    }
});

app.get('/api/modules', authenticateToken, (req, res) => {
    console.log(`Modules requested by user: ${req.user.username}`);
    const modules = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            enabled: true,
            subItems: []
        },
        {
            id: 'unternehmen',
            name: 'Unternehmen',
            enabled: true,
            subItems: [
                { id: 'mitarbeiter', name: 'Mitarbeiter', enabled: true }
            ]
        }
    ];
    res.json(modules);
});

// Route to get the next available employee ID (any authenticated user)
app.get('/api/users/next-employee-id', authenticateToken, async (req, res) => {
    try {
        const docs = await User.find({ employeeId: { $exists: true } }).sort({ employeeId: 1 }).select('employeeId');
        let expected = 1;
        for (const doc of docs) {
            const num = parseInt(doc.employeeId, 10);
            if (num === expected) {
                expected++;
            } else if (num > expected) {
                break;
            }
        }
        const nextId = expected.toString().padStart(5, '0');
        res.json({ nextEmployeeId: nextId });
    } catch (error) {
        console.error('Error fetching next employee ID:', error);
        res.status(500).json({ message: 'Fehler beim Ermitteln der nächsten Mitarbeiter-ID.', error: error.message });
    }
});

app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        // Ensure only admins can access this list
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({ message: 'Zugriff verweigert: Administratorrechte erforderlich.' });
        }
        
        console.log(`User list requested by admin: ${req.user.username}`);
        // Find all users, but exclude the password field for security
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen der Benutzerliste.', error: error.message });
    }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
    if (!req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Zugriff verweigert' });
    }
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching single user:', error);
        res.status(500).json({ message: 'Fehler beim Abrufen des Benutzers.', error: error.message });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    if (!req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Zugriff verweigert' });
    }
    try {
        const updateData = req.body;

        // Optional: Remove fields that should not be updated directly by the user, like password
        delete updateData.password;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, // Use $set to only update fields present in the request
            { new: true, runValidators: true, context: 'query' } 
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        res.json({ message: 'Benutzer erfolgreich aktualisiert', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        // Duplicate key error (e.g., employeeId already exists)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.employeeId) {
            return res.status(400).json({ message: 'Die Mitarbeiter-ID ist bereits vergeben. Bitte wählen Sie eine andere.' });
        }
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Benutzers.', error: error.message });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    // Only admins allowed
    if (!req.user.roles || !req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Zugriff verweigert: Administratorrechte erforderlich.' });
    }

    try {
        const { username, password, firstName, lastName, email, roles = ['employee'], ...rest } = req.body;

        if (!username || !password || !firstName || !lastName || !email) {
            return res.status(400).json({ message: 'Pflichtfelder fehlen (username, password, firstName, lastName, email).' });
        }

        // Ensure username unique
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({ message: 'Benutzername existiert bereits.' });
        }

        const newUser = new User({
            username,
            password, // will be hashed by pre-save hook
            firstName,
            lastName,
            email,
            roles,
            ...rest
        });

        await newUser.save();

        // Exclude password in response
        const userObj = newUser.toObject();
        delete userObj.password;

        res.status(201).json(userObj);
    } catch (error) {
        console.error('Error creating new user:', error);
        // Duplicate key error (e.g., username or employeeId exists)
        if (error.code === 11000) {
            if (error.keyPattern && error.keyPattern.employeeId) {
                return res.status(400).json({ message: 'Die Mitarbeiter-ID ist bereits vergeben. Bitte wählen Sie eine andere.' });
            }
            if (error.keyPattern && error.keyPattern.username) {
                return res.status(400).json({ message: 'Der Benutzername ist bereits vergeben.' });
            }
            if (error.keyPattern && error.keyPattern.email) {
                return res.status(400).json({ message: 'Die E-Mail ist bereits vergeben.' });
            }
            return res.status(400).json({ message: 'Daten sind bereits vergeben.' });
        }
        res.status(500).json({ message: 'Fehler beim Erstellen des Benutzers.', error: error.message });
    }
});

// Route to reset password and send email
const crypto = require('crypto');
const nodemailer = require('nodemailer');

app.post('/api/users/:id/reset-password', authenticateToken, async (req, res) => {
    // Only admins allowed
    if (!req.user.roles || !req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Zugriff verweigert: Administratorrechte erforderlich.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }

        // Generate new random password
        const newPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
        user.password = newPassword;
        await user.save();

        // Send email
        const smtpHost = process.env.SMTP_HOST || '';
        const smtpUser = process.env.SMTP_USER || '';
        const smtpPass = process.env.SMTP_PASS || '';

        if (smtpHost && smtpUser && smtpPass) {
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            const mailOptions = {
                from: smtpUser,
                to: user.email,
                subject: 'Ihr neues Passwort',
                text: `Hallo ${user.fullName || user.username},\n\nIhr Passwort wurde zurückgesetzt. Ihr neues Passwort lautet: ${newPassword}\nBitte melden Sie sich an und ändern Sie es umgehend.`,
            };

            await transporter.sendMail(mailOptions);
        } else {
            console.log('SMTP nicht konfiguriert. Neues Passwort:', newPassword);
        }

        res.json({ message: 'Passwort zurückgesetzt und E-Mail versendet.' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Fehler beim Zurücksetzen des Passworts.', error: error.message });
    }
});

// Route to delete a user (admin only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Zugriff verweigert: Administratorrechte erforderlich.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Benutzer nicht gefunden' });

        if (user.username === 'admin') {
            return res.status(400).json({ message: 'Der System-Admin-Benutzer kann nicht gelöscht werden.' });
        }

        await user.deleteOne();
        res.json({ message: 'Benutzer erfolgreich gelöscht.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Fehler beim Löschen des Benutzers.', error: error.message });
    }
});

// One-off route: assign employee IDs to users that don't have one yet
app.post('/api/users/assign-employee-ids', authenticateToken, async (req, res) => {
    if (!req.user.roles || !req.user.roles.includes('admin')) {
        return res.status(403).json({ message: 'Zugriff verweigert: Administratorrechte erforderlich.' });
    }

    try {
        // Determine the next employee ID
        const lastWithId = await User.findOne({ employeeId: { $exists: true } }).sort({ employeeId: -1 }).select('employeeId');
        let next = 1;
        if (lastWithId && lastWithId.employeeId) {
            const parsed = parseInt(lastWithId.employeeId, 10);
            if (!isNaN(parsed)) next = parsed + 1;
        }

        // Find users without an employeeId
        const usersWithoutId = await User.find({ $or: [ { employeeId: { $exists: false } }, { employeeId: null } ] }).sort({ createdAt: 1 });

        for (const user of usersWithoutId) {
            user.employeeId = next.toString().padStart(5, '0');
            next++;
            await user.save();
        }

        res.json({ message: 'Employee IDs assigned', updated: usersWithoutId.length });
    } catch (error) {
        console.error('Error assigning employee IDs:', error);
        res.status(500).json({ message: 'Fehler beim Zuweisen von Mitarbeiter-IDs.', error: error.message });
    }
});

// === ERROR HANDLING & SERVER START ===

app.use((req, res, next) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({ message: 'Ein interner Serverfehler ist aufgetreten.' });
});

const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 3009;
        app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION! Shutting down...', { reason, promise });
    process.exit(1);
});
