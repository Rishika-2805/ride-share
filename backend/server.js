// backend/server.js
require('dotenv').config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please create a .env file in the backend directory with JWT_SECRET');
  console.error('Example: JWT_SECRET=your-secret-jwt-key-change-this-in-production');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI environment variable is not set!');
  console.error('Please create a .env file in the backend directory with MONGO_URI');
  console.error('Example: MONGO_URI=mongodb://localhost:27017/ride-share');
  process.exit(1);
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const ridesRoutes = require('./routes/rides');     // should export a function: (io) => router
const chatRoutes = require('./routes/chat');       // should export a function: (io) => router

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || '*';

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN, methods: ['GET', 'POST'] },
});

// Middlewares
app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes (if a route file expects `io`, pass it)
app.use('/api/auth', authRoutes);
app.use('/api/rides', ridesRoutes(io));
app.use('/api/chat', chatRoutes(io));

// Start DB + server
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to DB', err);
    process.exit(1);
  });

/**
 * Socket.IO events
 *
 * Socket events for carpool/member sharing:
 * - 'new_shared_ride': Emitted when a new ride is created (broadcasted to all riders)
 * - 'ride_member_joined': Emitted when a member joins a ride
 */
io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  // Optional: register rider socket for targeted notifications
  socket.on('register_rider', async ({ riderId }) => {
    console.log('rider register attempt:', riderId);
    // Future: Store socketId in User model for targeted notifications
  });

  // Clean up on disconnect
  socket.on('disconnect', async (reason) => {
    try {
      console.log(`socket disconnected ${socket.id} (${reason})`);
    } catch (err) {
      console.error('disconnect cleanup error:', err);
    }
  });
});
