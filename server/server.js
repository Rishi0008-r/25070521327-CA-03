const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { initTrainSockets } = require('./sockets/trainSocket');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach socket io instance to express app
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Real-time socket event handlers
initTrainSockets(io);

// REST API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/trains', require('./routes/trainRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Real-Time Train Ticket Booking and Tracking System API',
    timestamp: new Date().toISOString(),
    socketClients: io.engine ? io.engine.clientsCount : 0,
  });
});

// Serve Client Static Build (Single-Server Setup)
const clientDist = fs.existsSync(path.join(__dirname, '../client/dist'))
  ? path.join(__dirname, '../client/dist')
  : path.join(__dirname, '../frontend/dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Client-side Single Page Application (SPA) routing for all non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family:sans-serif; text-align:center; padding: 40px; background:#0f172a; color:#f8fafc; min-height:100vh;">
        <h1 style="color:#38bdf8;">🚆 ConfirmRail Unified Server is Running</h1>
        <p style="color:#94a3b8;">Frontend static bundle not found. Run <code>npm run build</code> to build it.</p>
        <p><a href="/api/health" style="color:#38bdf8;">Test API Health Status</a></p>
      </div>
    `);
  });
}

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found on ConfirmRail Server' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5001;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n\x1b[31m✖ Port ${PORT} is already in use by another instance.\x1b[0m`);
    console.error(`\x1b[33m💡 Hint: Stop any existing terminal or kill the process on port ${PORT} before starting.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.error('Server network error:', err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\n\x1b[35m========================================================\x1b[0m`);
  console.log(`\x1b[32m🚆 CONFIRMRAIL UNIFIED SERVER RUNNING ON PORT ${PORT}\x1b[0m`);
  console.log(`\x1b[36m🌐 Website Link: http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[33m⚡ Real-Time Socket.io: ws://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[32m✔ Single Server Setup Active (No separate frontend/backend needed)\x1b[0m`);
  console.log(`\x1b[35m========================================================\n\x1b[0m`);
});
