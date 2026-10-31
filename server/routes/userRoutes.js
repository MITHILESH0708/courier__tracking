const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Admin: Get all couriers
router.get('/couriers', protect, authorize('admin'), async (req, res) => {
    try {
        const couriers = await User.find({ role: 'courier' }).select('-password');
        res.json(couriers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;