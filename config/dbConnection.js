const config = require('../config/index');
const mongoose = require('mongoose');

const connectDB = async () => {
    console.log('Connecting to MongoDB...');
    if (!config.MONGO_URI) {
        console.error('Error: MONGO_URI is not defined. Cannot connect to database.');
        process.exit(1);
    }
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log('MongoDB connection established successfully.');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectDB;