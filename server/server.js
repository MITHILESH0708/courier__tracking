require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const setupSockets = require('./sockets/trackingSocket');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const botRoutes = require('./routes/botRoutes');

// Init app
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Attach io to app so routes can use it
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Connect to DB
connectDB();

// Setup Sockets
setupSockets(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bot', botRoutes);

// Fallback to index.html for unknown frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));