const express = require('express');
const { chatWithBot } = require('../services/botService');
const router = express.Router();

// Public: Chat with bot
router.post('/chat', async (req, res) => {
    try {
        const { trackingId, messages } = req.body;
        const reply = await chatWithBot(trackingId, messages);
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;