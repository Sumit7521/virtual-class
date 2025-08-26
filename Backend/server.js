import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import aiRoutes from './routes/ai.js';
import { router as meetRoutes, initSocket } from './routes/meet.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse allowed origins from .env
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const corsOptions = {
  origin: function(origin, callback) {
    // Allow server-to-server requests or Postman (no origin)
    if (!origin) return callback(null, true);

    // Development: allow localhost/127.0.0.1
    if (process.env.NODE_ENV === 'development') {
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
        return callback(null, true);
      }
    }

    // Production: check allowed origins
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', aiRoutes);
app.use('/api/meet', meetRoutes);

// Static files (optional)
app.use(express.static('public'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Video Call & AI Chat Backend Server',
    status: 'Running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/meet/health',
      ai_chat: '/api/ask',
      check_room: '/api/meet/check-room/:roomId'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// HTTP server + socket.io
const server = http.createServer(app);
initSocket(server);

// Host for local vs production
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔒 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
