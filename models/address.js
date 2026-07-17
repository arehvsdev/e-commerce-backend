const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        country: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Country',
            required: true
        },
        cityState: {
            type: String,
            required: true,
            trim: true
        },
        postalCode: {
            type: String,
            required: true,
            trim: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Address', addressSchema);
