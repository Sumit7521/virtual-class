import { Server } from 'socket.io';

const activeRooms = new Map();
let io; // Socket.IO instance

export function initSocket(server) {
  const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://virtual-class-nu.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // server-to-server
        if (process.env.NODE_ENV === 'development') return callback(null, true); // allow all dev
        const allowed = ALLOWED_ORIGINS.some(o => o.toLowerCase() === origin.toLowerCase());
        if (allowed) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000
  });

  io.on('connection', (socket) => handleConnection(socket));

  io.engine.on('connection_error', (err) => console.error('❌ Socket.IO connection error:', err));

  console.log('🚀 Socket.IO initialized successfully');
  return io;
}

// Handle all Socket.IO events per connection
function handleConnection(socket) {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => joinRoom(socket, roomId));
  socket.on('signal', ({ target, signal }) => io.to(target).emit('signal', { signal, from: socket.id }));
  socket.on('chat', ({ message, username }) => sendChat(socket, message, username));
  socket.on('leave-room', () => leaveRoom(socket));
  socket.on('disconnect', () => leaveRoom(socket));
  socket.on('error', (err) => console.error(`❌ Socket error ${socket.id}:`, err));
}

// Room join logic
function joinRoom(socket, roomId) {
  const previousRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
  previousRooms.forEach(r => {
    socket.leave(r);
    socket.to(r).emit('user-disconnected', socket.id);
  });

  socket.join(roomId);
  socket.roomId = roomId;

  if (!activeRooms.has(roomId)) activeRooms.set(roomId, new Set());
  activeRooms.get(roomId).add(socket.id);

  socket.to(roomId).emit('user-connected', socket.id);
  socket.emit('room-joined', { roomId, userCount: activeRooms.get(roomId).size });
  console.log(`🎯 Room ${roomId} has ${activeRooms.get(roomId).size} users`);
}

// Chat relay
function sendChat(socket, message, username) {
  const roomId = socket.roomId || Array.from(socket.rooms).find(r => r !== socket.id);
  if (!roomId) return console.warn(`❌ No room found for chat from ${socket.id}`);
  socket.to(roomId).emit('chat', { message, username, timestamp: new Date().toISOString() });
}

// Leave or disconnect logic
function leaveRoom(socket) {
  const roomId = socket.roomId;
  if (!roomId || !activeRooms.has(roomId)) return;

  socket.leave(roomId);
  socket.to(roomId).emit('user-disconnected', socket.id);
  activeRooms.get(roomId).delete(socket.id);
  if (activeRooms.get(roomId).size === 0) activeRooms.delete(roomId);

  socket.roomId = null;
  console.log(`🗑️ User ${socket.id} left room ${roomId}`);
}

export { io, activeRooms };
