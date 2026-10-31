const express = require('express');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Public: Track an order by ID
router.get('/track/:trackingId', async (req, res) => {
    try {
        const order = await Order.findOne({ trackingId: req.params.trackingId }).populate('courier', 'name');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Create new order
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const trackingId = 'CT-' + Math.floor(100000 + Math.random() * 900000);
        const order = new Order({ ...req.body, trackingId, statusHistory: [{ status: 'placed', time: new Date() }] });
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Get all orders
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const orders = await Order.find().populate('courier', 'name').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: Assign courier
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { courier: req.body.courierId }, 
            { new: true }
        ).populate('courier', 'name');
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Courier: Get my assigned orders
router.get('/my', protect, authorize('courier'), async (req, res) => {
    try {
        const orders = await Order.find({ courier: req.user.id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Courier: Update status
router.put('/:id/status', protect, authorize('courier'), async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, courier: req.user.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = req.body.status;
        order.statusHistory.push({ status: req.body.status, time: new Date() });
        await order.save();

        // Broadcast status update
        const io = req.app.get('io');
        io.to(`track:${order.trackingId}`).emit('status:update', { status: order.status, history: order.statusHistory });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;