import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import aiRoutes from './routes/ai.js';
import { router as meetRoutes, initSocket } from './routes/meet.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Parse allowed origins from .env with fallbacks
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
    'https://immersio-omega.vercel.app',  // Your frontend URL - CRITICAL!
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ];

console.log('🔧 Configured ALLOWED_ORIGINS:', ALLOWED_ORIGINS);

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`🌐 CORS request from origin: ${origin}`);
    
    // Allow server-to-server requests or Postman (no origin)
    if (!origin) {
      console.log('✅ Allowing request with no origin (server-to-server)');
      return callback(null, true);
    }

    // Development: allow localhost/127.0.0.1
    if (process.env.NODE_ENV === 'development') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        console.log('✅ Allowing development origin:', origin);
        return callback(null, true);
      }
    }

    // Check allowed origins (case-insensitive)
    const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => 
      allowedOrigin.toLowerCase() === origin.toLowerCase()
    );
    
    if (isAllowed) {
      console.log('✅ Allowing configured origin:', origin);
      return callback(null, true);
    }

    console.warn(`❌ Blocked CORS request from: ${origin}`);
    console.warn(`❌ Allowed origins are: ${ALLOWED_ORIGINS.join(', ')}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Apply CORS first
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} from ${req.get('Origin') || 'no-origin'}`);
  next();
});

// Routes
app.use('/api', aiRoutes);
app.use('/api/meet', meetRoutes);

// Serve static files
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Video Call & AI Chat Backend Server',
    status: 'Running',
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: ALLOWED_ORIGINS,
    endpoints: {
      health: '/api/meet/health',
      ai_chat: '/api/ask',
      check_room: '/api/meet/check-room/:roomId'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      error: 'CORS Error: Origin not allowed',
      allowedOrigins: ALLOWED_ORIGINS
    });
  }
  
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// HTTP server + Socket.IO
const server = http.createServer(app);
initSocket(server);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔒 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`\n📋 Test your API:`);
  console.log(`   Health: http://${HOST}:${PORT}/api/meet/health`);
  console.log(`   Check room: http://${HOST}:${PORT}/api/meet/check-room/test`);
});