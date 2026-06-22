// ─────────────────────────────────────────────────────────────────────────────
//  src/server.js
//  Application entry point
//  Loads env → connects DB → connects Redis → starts HTTP server → init Socket.io
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config'; // loads .env BEFORE anything else
import http        from 'http';
import app         from './app.js';
import connectDB   from './config/db.js';
import { redis }   from './config/redis.js';
import initSocket  from './socket/index.js';
import { initPubSub } from './services/pubsub.service.js';

const PORT = process.env.PORT || 5000;

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Connect Redis (lazy — triggers on first command; ping to verify early)
    await redis.ping();
    console.log('✅ Redis ping OK');

    // Initialize Pub/Sub event broker
    initPubSub();

    // 3. Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // 4. Attach Socket.io to the HTTP server
    const io = await initSocket(httpServer);

    // Attach io to app so controllers can emit events: req.app.get('io')
    app.set('io', io);

    // 5. Start listening
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 ProjBazaar server running`);
      console.log(`   Mode        : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   HTTP        : http://localhost:${PORT}`);
      console.log(`   Health      : http://localhost:${PORT}/api/health`);
      console.log(`   Frontend    : ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
    });

    // ── Graceful Shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}. Shutting down gracefully…`);
      httpServer.close(async () => {
        await redis.quit();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

bootstrap();
