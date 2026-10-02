// src/utils/dbConnect.js
import mongoose from 'mongoose';

// Next.js dev (and serverless) reloads modules and serves requests in parallel,
// so a plain `let isConnected` flag is not enough: several requests reach
// `mongoose.connect()` before the first one resolves, and each model operation
// issued in the meantime sits in mongoose's buffer until it trips
// `bufferTimeoutMS` ("Operation `x.find()` buffering timed out after 10000ms").
// Caching the in-flight *promise* on globalThis makes every caller await the
// same connection attempt, and surviving HMR keeps a single pool per process.
const globalForMongoose = globalThis;

if (!globalForMongoose._mongooseConn) {
  globalForMongoose._mongooseConn = { conn: null, promise: null };
}

const cached = globalForMongoose._mongooseConn;

const dbConnect = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("❌ MONGODB_URI not set in environment variables");

    cached.promise = mongoose
      .connect(uri, {
        dbName: "sanjeeda", // Optional: name of your database
        // Surface an unreachable cluster as a real error instead of letting
        // queued operations expire against the 10s buffer timeout.
        serverSelectionTimeoutMS: 15000,
      })
      .then((mongooseInstance) => {
        console.log("🅼🅾🅽🅶🅾🅳🅱 ✅ 🅳🅰🆃🅰🅱🅰🆂✅ Connected!");
        return mongooseInstance;
      })
      .catch((err) => {
        // Clear the cache so the next request retries instead of awaiting a
        // permanently rejected promise.
        cached.promise = null;
        console.error("🅼🅾🅽🅶🅾🅳🅱 ❌ Connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default dbConnect;
