const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false,
            trim: true
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        bio: {
            type: String,
            default: "",
            trim: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            default: "user",
            enum: ["user", "admin"]
        },
        resetPasswordToken: {
            type: String,
            default: null
        },
        resetPasswordExpire: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

userSchema.pre('save', async function() {
    try {
        if (this.isModified('firstName') || this.isModified('lastName')) {
            this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
        }

        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 12);
        }
    } catch (err) {
        throw err;
    }
});

module.exports = mongoose.model("User", userSchema);