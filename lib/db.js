// lib/db.js

import mongoose from "mongoose";
import { MongoClient } from "mongodb";

/* =========================
   ENV CHECK
========================= */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI");
}

/* =========================
   MONGOOSE CACHE
========================= */
let mongooseCache = global.mongoose;

if (!mongooseCache) {
  mongooseCache = global.mongoose = { conn: null, promise: null };
}

/* =========================
   MONGOOSE CONNECTION
========================= */
export async function connectMongoose() {
  if (mongooseCache.conn) return mongooseCache.conn;

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
  } catch (err) {
    mongooseCache.promise = null; // reset on failure
    throw err;
  }

  return mongooseCache.conn;
}

/* =========================
   MONGODB CLIENT (NextAuth)
========================= */
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
  });

  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

/* =========================
   EXPORTS
========================= */
export default clientPromise;
export { clientPromise };