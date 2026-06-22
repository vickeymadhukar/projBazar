// ─────────────────────────────────────────────────────────────────────────────
//  src/config/db.js
//  MongoDB connection — non-blocking retry so server stays up during Atlas
//  Network Access propagation or temporary connection issues.
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';

const RETRY_DELAY_MS   = 5000;  // 5 seconds between retries
const MAX_RETRIES      = 10;    // keep trying longer (Atlas can be slow to propagate)

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,  // 8s to select a server
      socketTimeoutMS:          45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — attempting reconnect…');
      connectDB();
    });

  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(RETRY_DELAY_MS * (retryCount + 1), 30000); // cap at 30s
      console.log(`🔄 Retrying in ${delay / 1000}s… (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => connectDB(retryCount + 1), delay);
    } else {
      // Log the failure but DON'T exit — server stays up for Redis/Socket health
      console.error('💀 Max MongoDB retries reached. Server running without DB.');
      console.error('   → Fix MongoDB Atlas Network Access and restart the server.');
    }
  }
};

export default connectDB;
