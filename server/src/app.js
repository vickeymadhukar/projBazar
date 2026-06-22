// ─────────────────────────────────────────────────────────────────────────────
//  src/app.js
//  Express application factory
// ─────────────────────────────────────────────────────────────────────────────
import express           from 'express';
import cors              from 'cors';
import helmet            from 'helmet';
import morgan            from 'morgan';
import cookieParser      from 'cookie-parser';
import rateLimit         from 'express-rate-limit';
import passport          from 'passport';

import configureCloudinary from './config/cloudinary.js';
import configurePassport   from './config/passport.js';
import apiRoutes           from './routes/index.js';
import globalErrorHandler  from './middleware/error.middleware.js';

// ── Initialise third-party services ──────────────────────────────────────────
configureCloudinary();
configurePassport();   // Register Google OAuth strategy

// ── Express App ───────────────────────────────────────────────────────────────
const app = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// credentials:true is REQUIRED so browser sends HttpOnly cookies cross-origin
app.use(
  cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cookie Parser (MUST be before routes — reads HttpOnly cookie for auth) ────
app.use(cookieParser());

// ── Passport (stateless — no session needed; sessions=false in routes) ────────
app.use(passport.initialize());
// NOTE: we do NOT use passport.session() — JWT in HttpOnly cookie is stateless

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs:        parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:             parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false, statusCode: 429,
    message: 'Too many requests. Please try again later.',
  },
});

// Stricter limit for auth endpoints (prevents brute-force)
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             20,              // max 20 login/register attempts per 15 min
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false, statusCode: 429,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

app.use('/api',            apiLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false, statusCode: 404,
    message: 'Route not found',
  });
});

// ── Global Error Handler (MUST be last) ──────────────────────────────────────
app.use(globalErrorHandler);

export default app;
