import express from 'express';
import { Server } from 'socket.io';

const router = express.Router();
const activeRooms = new Map();
let io; // will be initialized later

// Initialize Socket.IO on an existing HTTP server
function initSocket(server) {
  // Parse allowed origins with fallbacks for Socket.IO
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
      'https://immersio-omega.vercel.app',  // Your frontend URL
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ];

  console.log('🔧 Socket.IO CORS configured for:', ALLOWED_ORIGINS);

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        console.log(`🔌 Socket.IO connection from origin: ${origin}`);
        
        if (!origin) {
          console.log('✅ Socket.IO: Allowing connection with no origin');
          return callback(null, true);
        }

        // Development mode - more permissive
        if (process.env.NODE_ENV === 'development') {
          if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/)) {
            console.log('✅ Socket.IO: Allowing development origin:', origin);
            return callback(null, true);
          }
          // Allow all in development
          console.log('✅ Socket.IO: Allowing all origins in development');
          return callback(null, true);
        }

        // Check allowed origins (case-insensitive)
        const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => 
          allowedOrigin.toLowerCase() === origin.toLowerCase()
        );

        if (isAllowed) {
          console.log('✅ Socket.IO: Allowing configured origin:', origin);
          return callback(null, true);
        }

        console.warn(`❌ Socket.IO: Blocked connection from: ${origin}`);
        console.warn(`❌ Socket.IO: Allowed origins are: ${ALLOWED_ORIGINS.join(', ')}`);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type'],
    },
    // Additional Socket.IO configuration for better reliability
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowRequest: (req, callback) => {
      // Additional validation if needed
      console.log(`🔍 Socket.IO connection attempt from: ${req.headers.origin}`);
      callback(null, true);
    }
  });

  io.on('connection', (socket) => {
    console.log(`👤 User connected: ${socket.id} from ${socket.handshake.headers.origin}`);

    socket.on('join-room', (roomId) => {
      console.log(`🏠 User ${socket.id} joining room ${roomId}`);

      // Leave previous rooms
      const previousRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      previousRooms.forEach(r => {
        socket.leave(r);
        socket.to(r).emit('user-disconnected', socket.id);
        console.log(`👋 User ${socket.id} left room ${r}`);
      });

      // Join new room
      socket.join(roomId);
      socket.roomId = roomId;

      // Track active rooms
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add(socket.id);

      console.log(`🎯 Room ${roomId} now has ${activeRooms.get(roomId).size} users`);

      // Notify others in the room
      socket.to(roomId).emit('user-connected', socket.id);
      
      // Send confirmation to the user
      socket.emit('room-joined', { 
        roomId, 
        userCount: activeRooms.get(roomId).size 
      });
    });

    socket.on('signal', ({ target, signal }) => {
      console.log(`📡 Relaying signal from ${socket.id} to ${target}`);
      io.to(target).emit('signal', { signal, from: socket.id });
    });

    socket.on('chat', ({ message, username }) => {
      const roomId = socket.roomId || Array.from(socket.rooms).find(r => r !== socket.id);
      if (roomId) {
        console.log(`💬 Chat message in room ${roomId} from ${username}: ${message.substring(0, 50)}...`);
        socket.to(roomId).emit('chat', { message, username, timestamp: new Date().toISOString() });
      } else {
        console.warn(`❌ No room found for chat from ${socket.id}`);
      }
    });

    socket.on('leave-room', () => {
      const roomId = socket.roomId;
      if (roomId) {
        console.log(`👋 User ${socket.id} leaving room ${roomId}`);
        socket.leave(roomId);
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // Clean up room tracking
        if (activeRooms.has(roomId)) {
          activeRooms.get(roomId).delete(socket.id);
          if (activeRooms.get(roomId).size === 0) {
            activeRooms.delete(roomId);
            console.log(`🗑️ Removed empty room: ${roomId}`);
          }
        }
        socket.roomId = null;
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`👤 User disconnected: ${socket.id}, reason: ${reason}`);
      const roomId = socket.roomId;
      if (roomId) {
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // Clean up room tracking
        if (activeRooms.has(roomId)) {
          activeRooms.get(roomId).delete(socket.id);
          if (activeRooms.get(roomId).size === 0) {
            activeRooms.delete(roomId);
            console.log(`🗑️ Removed empty room: ${roomId}`);
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  // Log Socket.IO server events
  io.engine.on('connection_error', (err) => {
    console.error('❌ Socket.IO connection error:', err);
  });

  console.log('🚀 Socket.IO server initialized successfully');
}

// REST endpoints using the same router
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeRooms: activeRooms.size,
    totalConnections: io ? io.engine.clientsCount : 0,
    environment: process.env.NODE_ENV || 'development',
    roomDetails: Array.from(activeRooms.entries()).map(([roomId, users]) => ({
      roomId,
      userCount: users.size
    }))
  };
  
  console.log('🏥 Health check:', health);
  res.json(health);
});

router.get('/check-room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const exists = activeRooms.has(roomId);
  const userCount = exists ? activeRooms.get(roomId).size : 0;
  
  console.log(`🔍 Room check: ${roomId} - exists: ${exists}, users: ${userCount}`);
  
  const response = {
    exists,
    userCount,
    roomId,
    timestamp: new Date().toISOString()
  };
  
  // Add CORS headers manually as backup
  res.header('Access-Control-Allow-Origin', req.get('Origin'));
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.json(response);
});

// Add a test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Meet API is working!',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')
  });
});

export { router, initSocket };