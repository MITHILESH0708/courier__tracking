const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We added a fallback string here so it connects even if .env is glitchy!
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/courier-tracking';
        await mongoose.connect(uri);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;