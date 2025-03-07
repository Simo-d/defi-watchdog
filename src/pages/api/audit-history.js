// pages/api/audit-history.js (with localStorage)
import { findAuditReports } from '../../lib/localStorage';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, network, limit = 10 } = req.query;
    
    // Validate inputs
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid contract address'
      });
    }
    
    // Fetch audit history
    const auditHistory = await findAuditReports(
      { 
        address: address.toLowerCase(),
        network
      },
      { 
        sortBy: 'createdAt', 
        sortDesc: true,
        limit: parseInt(limit) 
      }
    );
    
    return res.status(200).json({
      success: true,
      address,
      network,
      history: auditHistory
    });
  } catch (error) {
    console.error('Error fetching audit history:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}