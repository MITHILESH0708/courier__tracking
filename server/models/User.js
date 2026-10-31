const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'courier'], required: true },
    isSharingLocation: { type: Boolean, default: false },
    currentLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);