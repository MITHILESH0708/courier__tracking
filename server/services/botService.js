const Groq = require('groq-sdk');
const Order = require('../models/Order');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });

const chatWithBot = async (trackingId, messages) => {
    if (!process.env.GROQ_API_KEY) {
        return "I am currently offline as the API key is not configured.";
    }

    try {
        let orderContext = "No tracking ID provided.";
        if (trackingId) {
            const order = await Order.findOne({ trackingId }).populate('courier', 'name');
            if (order) {
                orderContext = `
                Order Details:
                - Tracking ID: ${order.trackingId}
                - Status: ${order.status.replace(/_/g, ' ').toUpperCase()}
                - Courier Name: ${order.courier ? order.courier.name : 'Unassigned'}
                - ETA: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString() : 'N/A'}
                - Drop Address: ${order.drop.address}
                `;
            } else {
                orderContext = "Tracking ID provided is invalid.";
            }
        }

        const systemPrompt = `You are an AI customer support assistant for a courier service. 
        You MUST only answer questions related to delivery, status, delays, and general courier support. 
        If a user asks about anything else, politely decline.
        Do NOT invent any order data. Use ONLY the following real-time data:
        ${orderContext}`;

        // Groq expects standard OpenAI-style message formatting
        const groqMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            }))
        ];

        const response = await groq.chat.completions.create({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
            messages: groqMessages,
            max_tokens: 300,
        });

        return response.choices[0]?.message?.content || "Sorry, I couldn't process that.";
    } catch (error) {
        console.error("Bot API Error:", error);
        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    }
};

module.exports = { chatWithBot };