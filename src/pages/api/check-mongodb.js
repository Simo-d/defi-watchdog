// pages/api/check-mongodb.js
import { checkMongoDB } from '../../lib/database';

export default async function handler(req, res) {
  // Only accessible in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'This endpoint is only available in development mode' });
  }
  
  try {
    const status = await checkMongoDB();
    return res.status(200).json(status);
  } catch (error) {
    console.error('Error checking MongoDB:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}