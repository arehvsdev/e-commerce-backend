const config = require('../config/index');
const mongoose = require('mongoose');

const connectDB = async () => {
    if (!config.MONGO_URI) {
        console.error('Error: MONGO_URI is not defined. Cannot connect to database.');
        process.exit(1);
    }
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectDB;