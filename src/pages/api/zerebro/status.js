// pages/api/zerebro/status.js
export default async function handler(req, res) {
    try {
      // Check Sonic RPC connection
      let sonicStatus = false;
      try {
        // Try a simple request to Sonic RPC
        const response = await fetch(process.env.SONIC_RPC_URL || 'https://rpc.soniclabs.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: []
          })
        });
        
        if (response.ok) {
          sonicStatus = true;
        }
      } catch (sonicError) {
        console.error('Sonic RPC connection error:', sonicError);
      }
      
      // Return status with Sonic availability information
      return res.status(200).json({
        active: true,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0',
        sonicAvailable: sonicStatus,
        capabilities: [
          'contract-analysis',
          'autonomous-monitoring',
          'gas-optimization',
          sonicStatus ? 'sonic-integration' : 'sonic-integration-unavailable'
        ]
      });
    } catch (error) {
      console.error('Error checking ZerePy agent status:', error);
      return res.status(500).json({ error: error.message || 'An error occurred' });
    }
  }