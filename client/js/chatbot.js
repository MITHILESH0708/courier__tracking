const chatWindow = document.getElementById('chatbot-window');
const chatBtn = document.getElementById('chatbot-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
let chatHistory = [];

// Toggle chat window
chatBtn.addEventListener('click', () => {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
});

// Append message to UI
const appendMessage = (text, role) => {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to history (keep last 6 for context)
    chatHistory.push({ role, text });
    if(chatHistory.length > 6) chatHistory.shift();
};

// Send message to backend API
const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;
    
    appendMessage(text, 'user');
    chatInput.value = '';

    try {
        const response = await fetch('/api/bot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                trackingId: currentTrackingId, // from tracking.js
                messages: chatHistory
            })
        });
        const data = await response.json();
        appendMessage(data.reply, 'bot');
    } catch (err) {
        appendMessage("Error reaching server.", 'bot');
    }
};

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});