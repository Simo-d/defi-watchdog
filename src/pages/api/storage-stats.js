// pages/api/storage-stats.js
import { getAuditStats } from '../../lib/localStorage';

export default async function handler(req, res) {
  // Only accessible in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'This endpoint is only available in development mode' });
  }
  
  try {
    const stats = await getAuditStats();
    return res.status(200).json({
      success: true,
      stats,
      message: 'Storage is working properly'
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'Error checking storage'
    });
  }
}