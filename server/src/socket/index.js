// ─────────────────────────────────────────────────────────────────────────────
//  src/socket/index.js
//  Socket.io initialisation — foundation for Phase 2 real-time chat
//
//  Auth strategy (Phase 2): read JWT from socket handshake cookie,
//  verify with jsonwebtoken, attach user to socket before allowing connection.
// ─────────────────────────────────────────────────────────────────────────────
import { Server } from 'socket.io';
import { REDIS_KEYS } from '../constants/index.js';


let ioInstance = null;

/**
 * Initialises Socket.io on the HTTP server.
 * Returns the io instance so it can be attached to app for use in controllers.
 *
 * @param {http.Server} httpServer - The Node HTTP server (from server.js)
 * @returns {import('socket.io').Server} io
 */
const initSocket = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods:     ['GET', 'POST'],
    },
    // Ping settings — keep connections alive through proxies
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── Redis Adapter (for multi-instance horizontal scaling) ─────────────────
  // When you have multiple server instances (e.g. on Railway/Render),
  // Socket.io events are published via Redis so all instances see them.
  // TODO (Phase 2): Uncomment when adding multi-instance deployment
  //
  // try {
  //   const pubClient = createClient({ url: process.env.REDIS_URL });
  //   const subClient = pubClient.duplicate();
  //   await Promise.all([pubClient.connect(), subClient.connect()]);
  //   io.adapter(createAdapter(pubClient, subClient));
  //   console.log('✅ Socket.io Redis adapter attached');
  // } catch (err) {
  //   console.warn('⚠️  Redis adapter not attached — single-instance mode:', err.message);
  // }

  // ── Auth Middleware Placeholder ───────────────────────────────────────────
  // Phase 2: Read JWT cookie from socket handshake headers, verify with
  // jsonwebtoken, look up user in MongoDB, attach to socket.user
  //
  // io.use(async (socket, next) => {
  //   try {
  //     const cookies = cookie.parse(socket.handshake.headers.cookie || '');
  //     const token = cookies.token;
  //     if (!token) return next(new Error('Authentication token missing'));
  //     const decoded = verifyToken(token);
  //     const user = await User.findById(decoded.id).lean();
  //     if (!user) return next(new Error('User not found'));
  //     socket.user = user;
  //     next();
  //   } catch (err) {
  //     next(new Error('Socket authentication failed'));
  //   }
  // });


  // ── Connection Lifecycle ──────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user room for private notifications
    socket.on('register-user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Socket ${socket.id} joined room user:${userId}`);
      }
    });

    // TODO (Phase 2): store userId → socketId in Redis
    // if (socket.user) {
    //   redis.hset(REDIS_KEYS.ONLINE_USERS, socket.user._id.toString(), socket.id);
    // }

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} — reason: ${reason}`);

      // TODO (Phase 2): remove from Redis online-users hash
      // if (socket.user) {
      //   redis.hdel(REDIS_KEYS.ONLINE_USERS, socket.user._id.toString());
      // }
    });

    // TODO (Phase 2): register chat and offer event handlers here
    // import './handlers/chat.handler.js'
    // import './handlers/offer.handler.js'
  });

  console.log('✅ Socket.io initialised');
  ioInstance = io;
  return io;
};

export const getIO = () => ioInstance;

export default initSocket;
