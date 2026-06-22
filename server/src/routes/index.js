// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/index.js
//  Central route aggregator — mounts all feature routers under /api
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import listingRoutes from './listing.routes.js';
import notificationRoutes from './notification.routes.js';

import mongoose from 'mongoose';
import { redis } from '../config/redis.js';

// TODO: Uncomment as each phase is built
// import conversationRoutes from './conversation.routes.js';
// import messageRoutes      from './message.routes.js';
// import transactionRoutes  from './transaction.routes.js';
// import reviewRoutes       from './review.routes.js';
// import adminRoutes        from './admin.routes.js';

const router = Router();

// ── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  let redisStatus = 'disconnected';
  try {
    const ping = await redis.ping();
    if (ping === 'PONG') redisStatus = 'connected';
  } catch (err) {
    redisStatus = 'disconnected';
  }

  res.json({
    success:     true,
    message:     'ProjBazaar API is running 🚀',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis:    redisStatus,
    }
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/notifications', notificationRoutes);

// ── Feature Routes (activate as phases are built) ─────────────────────────────
// router.use('/listings',      listingRoutes);
// router.use('/conversations', conversationRoutes);
// router.use('/messages',      messageRoutes);
// router.use('/transactions',  transactionRoutes);
// router.use('/reviews',       reviewRoutes);
// router.use('/admin',         adminRoutes);

export default router;
