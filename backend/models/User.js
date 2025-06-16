const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Login & Basic Info
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // Unique Employee ID
    employeeId: {
        type: String,
        unique: true,
        sparse: true // allow missing on existing docs
    },
    roles: {
        type: [String],
        enum: ['admin', 'employee', 'manager'],
        default: ['employee']
    },
    status: {
        type: String,
        enum: ['aktiv', 'inaktiv', 'beurlaubt', 'karenz'],
        default: 'aktiv'
    },

    // Personal Data (Stammdaten)
    geburtsdatum: {
        type: Date
    },
    adresse: {
        strasse: { type: String, trim: true },
        plz: { type: String, trim: true },
        stadt: { type: String, trim: true },
        land: { type: String, trim: true, default: 'Deutschland' }
    },

    // Company Data
    eintrittsdatum: {
        type: Date,
        default: Date.now
    },
    austrittsdatum: {
        type: Date
    },
    position: {
        type: String,
        trim: true
    },
    abteilung: {
        type: String,
        trim: true
    },

    // Financial Data (Sensitive)
    gehalt: {
        type: Number
    },
    iban: {
        type: String, // Should be encrypted in a real app
        trim: true
    },

    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fullName
userSchema.virtual('fullName')
    .get(function() {
        return `${this.firstName || ''} ${this.lastName || ''}`.trim();
    })
    .set(function(name) {
        if (!name) return;
        const parts = name.trim().split(' ');
        this.firstName = parts.shift();
        this.lastName = parts.join(' ');
    });

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        // If first/last missing but virtual fullName set via setter already handled; nothing else needed here.

        // Auto-generate employeeId if missing
        if (!this.employeeId) {
            // Find the smallest free employee ID
            const docs = await this.constructor.find({ employeeId: { $exists: true } }).sort({ employeeId: 1 }).select('employeeId');
            let expected = 1;
            for (const doc of docs) {
                const num = parseInt(doc.employeeId, 10);
                if (num === expected) {
                    expected++;
                } else if (num > expected) {
                    break;
                }
            }
            this.employeeId = expected.toString().padStart(5, '0');
        }

        // Hash password only if modified
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        const valid = await bcrypt.compare(candidatePassword, this.password);
        console.log('Password comparison result:', valid);
        return valid;
    } catch (error) {
        console.error('Error comparing password:', error);
        return false;
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
