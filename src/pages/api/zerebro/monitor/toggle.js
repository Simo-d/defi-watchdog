// pages/api/zerebro/monitor/toggle.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  
    try {
      const { address, network, enabled } = req.body;
  
      if (!address) {
        return res.status(400).json({ error: 'Contract address is required' });
      }
  
      // In a real implementation, this would enable/disable monitoring with your ZerePy agent
      // For demo purposes, we're returning a success response
  
      return res.status(200).json({
        success: true,
        address,
        network,
        monitoringEnabled: enabled,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling ZerePy monitoring:', error);
      return res.status(500).json({ error: error.message || 'Failed to toggle monitoring' });
    }
  }