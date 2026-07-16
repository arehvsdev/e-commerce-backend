const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: false,
            trim: true
        },
        firstName: {
            type: String,
            default: "",
            trim: true
        },
        lastName: {
            type: String,
            default: "",
            trim: true
        },
        bio: {
            type: String,
            default: "",
            trim: true
        },
        country: {
            type: String,
            default: "",
            trim: true
        },
        cityState: {
            type: String,
            default: "",
            trim: true
        },
        postalCode: {
            type: String,
            default: "",
            trim: true
        },
        taxId: {
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
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);