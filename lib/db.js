// lib/db.js - FOR MONGODB ADAPTER (native driver) AND Mongoose
import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside Netlify settings.')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise
let mongooseConn = null

// ✅ GLOBAL CACHES (CRITICAL FIX)
global._mongoClientPromise ??= null
global._mongooseConn ??= null

// MongoDB Native Driver + Mongoose
if (process.env.NODE_ENV === 'development') {
  // ---- MongoClient (dev)
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise

  // ---- Mongoose (dev)
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
  }
  mongooseConn = global._mongooseConn
} else {
  // ---- MongoClient (prod) ✅ FIXED: CACHE IT
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise

  // ---- Mongoose (prod) ✅ FIXED: CACHE IT
  if (!global._mongooseConn) {
    global._mongooseConn = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
  }
  mongooseConn = global._mongooseConn
}

// Helper function to ensure Mongoose is connected
export async function connectMongoose() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  // Currently connecting
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', () => resolve(mongoose.connection))
      mongoose.connection.once('error', reject)
    })
  }

  // Not connected → wait for cached promise
  try {
    await mongooseConn
    return mongoose.connection
  } catch (error) {
    console.error('Mongoose connection error:', error)
    throw error
  }
}

// Check Mongoose connection status
export function isMongooseConnected() {
  return mongoose.connection.readyState === 1
}

// Export MongoDB native driver promise
export default clientPromise
export { connectMongoose, isMongooseConnected }
