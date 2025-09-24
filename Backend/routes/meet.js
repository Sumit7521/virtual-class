import express from 'express';
import { healthCheck, checkRoom, testEndpoint } from '../controllers/meetController.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/check-room/:roomId', checkRoom);
router.get('/test', testEndpoint);

export { router };
