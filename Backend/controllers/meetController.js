import { activeRooms, io } from '../sockets/socketInit.js';

// Health endpoint
export const healthCheck = (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeRooms: activeRooms.size,
    totalConnections: io ? io.engine.clientsCount : 0,
    environment: process.env.NODE_ENV || 'development',
    roomDetails: Array.from(activeRooms.entries()).map(([roomId, users]) => ({
      roomId,
      userCount: users.size
    }))
  });
};

// Check specific room
export const checkRoom = (req, res) => {
  const { roomId } = req.params;
  const exists = activeRooms.has(roomId);
  const userCount = exists ? activeRooms.get(roomId).size : 0;

  res.header('Access-Control-Allow-Origin', req.get('Origin'));
  res.header('Access-Control-Allow-Credentials', 'true');

  res.json({ exists, userCount, roomId, timestamp: new Date().toISOString() });
};

// Simple test endpoint
export const testEndpoint = (req, res) => {
  res.json({
    message: 'Meet API is working!',
    timestamp: new Date().toISOString(),
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')
  });
};
