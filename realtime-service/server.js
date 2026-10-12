const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP and Socket.IO Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allows React Vite dev server (e.g. http://localhost:5173)
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Socket.io Connection & Event Handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] 🟢 Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);

  // Optional: Join a specific zone room (e.g., 'Zone A', 'Zone B')
  socket.on('join_zone', (zoneName) => {
    if (zoneName) {
      socket.join(zoneName);
      console.log(`[Socket.io] Client ${socket.id} joined room: ${zoneName}`);
    }
  });

  socket.on('leave_zone', (zoneName) => {
    if (zoneName) {
      socket.leave(zoneName);
      console.log(`[Socket.io] Client ${socket.id} left room: ${zoneName}`);
    }
  });

  // Health ping from client
  socket.on('ping_check', (data) => {
    socket.emit('pong_check', { time: new Date().toISOString(), echo: data });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] 🔴 Client disconnected: ${socket.id} (${reason}) (Remaining: ${io.engine.clientsCount})`);
  });
});

// Internal webhook endpoint called by Python Flask backend when a slot changes
app.post('/api/broadcast-slot', (req, res) => {
  const slotData = req.body;

  if (!slotData || !slotData.spot_number) {
    return res.status(400).json({ success: false, message: 'Invalid slot update payload.' });
  }

  console.log(`[Broadcast] ⚡ Slot updated: ${slotData.spot_number} (${slotData.zone}) -> Status: ${slotData.status}`);

  // 1. Broadcast to ALL connected clients
  io.emit('slot_updated', slotData);

  // 2. Broadcast to specific zone room if provided
  if (slotData.zone) {
    io.to(slotData.zone).emit('zone_slot_updated', slotData);
  }

  return res.status(200).json({
    success: true,
    message: 'Slot broadcasted successfully via WebSockets',
    connected_clients: io.engine.clientsCount,
    slot: slotData
  });
});

// Service Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Smart Parking Real-Time Socket Gateway',
    connected_clients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Handle server port errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n===================================================`);
    console.log(`⚠️  Notice: Port ${PORT} is already in use by an active Real-time Gateway.`);
    console.log(`   The gateway on port ${PORT} is already up and listening.`);
    console.log(`===================================================\n`);
    process.exit(0);
  } else {
    console.error('[Socket Gateway Error]', err);
    process.exit(1);
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Smart Parking Real-time Gateway running on port ${PORT}`);
  console.log(`   WebSocket URL: ws://localhost:${PORT}`);
  console.log(`   Webhook URL:   http://localhost:${PORT}/api/broadcast-slot`);
  console.log(`===================================================`);
});
