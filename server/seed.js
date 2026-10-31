require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Order = require('./models/Order');

const connectDB = require('./config/db');

// Seed database with default admin, couriers and orders
const seed = async () => {
    await connectDB();

    try {
        await User.deleteMany();
        await Order.deleteMany();

        const hashPassword = async (pwd) => await bcrypt.hash(pwd, 10);

        const admin = await User.create({
            name: 'Admin User', email: 'admin@test.com', password: await hashPassword('password123'), role: 'admin'
        });

        const courier1 = await User.create({
            name: 'John Courier', email: 'john@test.com', password: await hashPassword('password123'), role: 'courier'
        });

        const courier2 = await User.create({
            name: 'Sarah Courier', email: 'sarah@test.com', password: await hashPassword('password123'), role: 'courier'
        });

        await Order.create({
            trackingId: 'CT-123456',
            senderName: 'Alice', receiverName: 'Bob', receiverPhone: '555-0101',
            pickup: { address: 'London Bridge', lat: 51.5079, lng: -0.0877 },
            drop: { address: 'Hyde Park', lat: 51.5073, lng: -0.1657 },
            courier: courier1._id,
            status: 'in_transit',
            statusHistory: [{ status: 'placed', time: new Date() }, { status: 'picked_up', time: new Date() }],
            currentLocation: { lat: 51.5079, lng: -0.0877, updatedAt: new Date() }
        });

        await Order.create({
            trackingId: 'CT-987654',
            senderName: 'Charlie', receiverName: 'Dave', receiverPhone: '555-0202',
            pickup: { address: 'Tower of London', lat: 51.5081, lng: -0.0759 },
            drop: { address: 'Regents Park', lat: 51.5313, lng: -0.1569 },
            status: 'placed'
        });

        console.log('Database seeded successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();