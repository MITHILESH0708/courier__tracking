const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    trackingId: { type: String, required: true, unique: true },
    senderName: String,
    receiverName: String,
    receiverPhone: String,
    pickup: { address: String, lat: Number, lng: Number },
    drop: { address: String, lat: Number, lng: Number },
    courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { 
        type: String, 
        enum: ['placed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'],
        default: 'placed'
    },
    statusHistory: [{ status: String, time: Date }],
    currentLocation: { lat: Number, lng: Number, updatedAt: Date },
    estimatedDelivery: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);