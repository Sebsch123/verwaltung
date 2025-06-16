const User = require('../models/User');

const userService = {
    // Benutzer finden
    async findUser(username) {
        try {
            console.log('Searching for user:', username);
            const user = await User.findOne({ username });
            console.log('Found user:', user ? user.username : 'not found');
            return user;
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    },

    // Benutzer erstellen
    async createUser(userData) {
        try {
            console.log('Creating new user:', userData.username);
            const user = new User(userData);
            await user.save();
            console.log('User created:', user.username);
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
};

module.exports = userService;
