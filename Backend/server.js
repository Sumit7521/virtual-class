import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import aiRoutes from './routes/ai.js';
import { router as meetRoutes } from './routes/meet.js'; // only router here
import { initSocket } from './sockets/socketInit.js';     // <-- correct path for Socket.IO
import { corsOptions } from './config/corsConfig.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Apply CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static('public'));

// Routes
app.use('/api', aiRoutes);
app.use('/api/meet', meetRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'Video Call & AI Chat Backend',
    status: 'Running',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error handler
app.use(errorHandler);

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// HTTP server + Socket.IO
const server = http.createServer(app);
initSocket(server); // initialize Socket.IO

// Start server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
