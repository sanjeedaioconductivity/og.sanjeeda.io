// src/utils/dbConnect.js
import mongoose from 'mongoose';

let isConnected = false;

const dbConnect = async () => {
  if (isConnected) return;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("❌ MONGODB_URI not set in environment variables");

    await mongoose.connect(uri, {
      dbName: "sanjeeda", // Optional: name of your database
    });

    isConnected = true;
    console.log("🅼🅾🅽🅶🅾🅳🅱 ✅ 🅳🅰🆃🅰🅱🅰🆂✅ Connected!");

  } catch (err) {
    console.error("🅼🅾🅽🅶🅾🅳🅱 ❌ Connection error:", err);

  }
};

export default dbConnect;
