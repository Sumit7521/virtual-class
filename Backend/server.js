import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import aiRoutes from './routes/ai.js';
import { router as meetRoutes, initSocket } from './routes/meet.js';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Enhanced CORS configuration for better deployment support
const getConfiguredOrigins = () => {
  // Parse from environment variable
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  }

  // Default origins for development
  const defaultOrigins = [
    'http://localhost:5173',        // Vite default port
    'http://localhost:5174',        // Vite alternative port
    'http://localhost:3000',        // React default port
    'http://localhost:3001',        // Common alternative port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://immersio-omega.vercel.app',  // Production frontend
  ];

  // Add vercel.app domains for deployment
  if (process.env.VERCEL_URL) {
    defaultOrigins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Add netlify.app domains
  if (process.env.NETLIFY) {
    defaultOrigins.push(`https://${process.env.URL}`);
  }

  return [...new Set(defaultOrigins)]; // Remove duplicates
};

const ALLOWED_ORIGINS = getConfiguredOrigins();
console.log('🔧 Configured ALLOWED_ORIGINS:', ALLOWED_ORIGINS);

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`🌐 CORS request from origin: ${origin}`);
    
    // Allow requests with no origin (server-to-server, Postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin (server-to-server)');
      return callback(null, true);
    }

    // Development mode - more permissive
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Development mode - allowing origin:', origin);
      return callback(null, true);
    }

    // Production mode - strict origin checking
    const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
      // Case-insensitive comparison
      const normalizedOrigin = origin.toLowerCase();
      const normalizedAllowed = allowedOrigin.toLowerCase();
      
      // Exact match
      if (normalizedOrigin === normalizedAllowed) {
        return true;
      }
      
      // Wildcard subdomain support (e.g., *.vercel.app)
      if (normalizedAllowed.includes('*')) {
        const regexPattern = normalizedAllowed
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(normalizedOrigin);
      }
      
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ Allowing configured origin:', origin);
      return callback(null, true);
    }

    console.warn(`❌ Blocked CORS request from: ${origin}`);
    console.warn(`❌ Allowed origins are: ${ALLOWED_ORIGINS.join(', ')}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Length',
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  optionsSuccessStatus: 200,
  maxAge: 600 // 10 minutes
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Add manual CORS headers as backup
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && ALLOWED_ORIGINS.some(allowed => origin.toLowerCase().includes(allowed.toLowerCase()))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  next();
});

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