// lib/database.js
import mongoose from 'mongoose';
import config from './config';

/**
 * Global connection reference
 */
let cachedConnection = null;

/**
 * Connect to MongoDB database
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedConnection) {
    return cachedConnection;
  }

  // Check if we have a MongoDB URI
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI not found, using localStorage fallback instead');
    return null;
  }

  try {
    // Connect to MongoDB - removed deprecated options
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    // Cache the connection
    cachedConnection = connection;
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    // Enhanced error logging
    if (error.code === 'EREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`MongoDB connection error: Can't connect to ${error.hostname || 'database server'}: ${error.message}`);
    } else {
      console.error('MongoDB connection error:', error);
    }
    
    return null;
  }
}

/**
 * Check MongoDB connection status
 * @returns {Promise<object>} Connection status
 */
export async function checkMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      return {
        connected: false,
        usingLocalStorage: true,
        message: 'MONGODB_URI not found, using localStorage fallback'
      };
    }
    
    const startTime = Date.now();
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // Set a shorter timeout for connection testing
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      connected: true,
      usingLocalStorage: false,
      message: 'Successfully connected to MongoDB',
      responseTime: `${responseTime}ms`,
      version: connection.version || 'Unknown'
    };
  } catch (error) {
    return {
      connected: false,
      usingLocalStorage: true,
      message: `Failed to connect to MongoDB: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  } finally {
    // Close connection if it was just for testing
    if (!cachedConnection) {
      try {
        await mongoose.disconnect();
      } catch (error) {
        console.warn('Error disconnecting from MongoDB:', error);
      }
    }
  }
}

/**
 * Close the database connection
 */
async function closeDatabaseConnection() {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('MongoDB connection closed');
  }
}

export default connectToDatabase;
export { closeDatabaseConnection };