const bcrypt = require('bcryptjs');

async function generateHash() {
    const password = "password";
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Generated hash: ${hash}`);
}

generateHash();
