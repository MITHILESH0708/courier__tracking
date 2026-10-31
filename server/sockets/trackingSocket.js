const Order = require('../models/Order');
const User = require('../models/User');
const { calculateETA } = require('../utils/eta');

// Setup Socket.io logic
const setupSockets = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Customer joins tracking room
        socket.on('track:join', (trackingId) => {
            socket.join(`track:${trackingId}`);
            console.log(`Joined room track:${trackingId}`);
        });

        // Admin joins admin room
        socket.on('admin:join', () => {
            socket.join('admin');
        });

        // Courier sends live location
        socket.on('courier:location', async (data) => {
            const { orderId, lat, lng, courierId } = data;
            
            try {
                // Update courier global location
                await User.findByIdAndUpdate(courierId, {
                    currentLocation: { lat, lng, updatedAt: new Date() },
                    isSharingLocation: true
                });

                // Update order location & ETA if active
                if (orderId) {
                    const order = await Order.findById(orderId);
                    if (order && !['delivered', 'placed'].includes(order.status)) {
                        order.currentLocation = { lat, lng, updatedAt: new Date() };
                        order.estimatedDelivery = calculateETA(lat, lng, order.drop.lat, order.drop.lng);
                        await order.save();

                        // Broadcast to customer
                        io.to(`track:${order.trackingId}`).emit('location:update', {
                            lat, lng, eta: order.estimatedDelivery
                        });
                    }
                }

                // Broadcast to admin map
                io.to('admin').emit('admin:location_update', { courierId, lat, lng });

            } catch (err) {
                console.error('Location update error:', err);
            }
        });

        // Courier stops sharing
        socket.on('courier:stop', async (courierId) => {
            await User.findByIdAndUpdate(courierId, { isSharingLocation: false });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

module.exports = setupSockets;