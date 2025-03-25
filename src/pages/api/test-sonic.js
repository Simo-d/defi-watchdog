// pages/api/test-sonic.js
export default async function handler(req, res) {
    try {
      const address = req.query.address || '0xb99e5534d42500eb1d5820fba3bb8416ccb76396';
      const apiKey = process.env.SONICSCAN_API_KEY;
      
      console.log('Testing SonicScan API connection...');
      
      // Test SonicScan API
      const apiResponse = await fetch(
        `https://api.sonicscan.org/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
      );
      
      const apiData = await apiResponse.json();
      
      // Test multiple Sonic RPC endpoints
      const rpcUrls = [
        process.env.SONIC_RPC_URL,
        'https://mainnet.sonic.io/rpc',
        'https://rpc.sonic.io',
        'https://mainnet.soniclabs.com/rpc',
        'https://rpc.soniclabs.com'
      ].filter(Boolean);
      
      const rpcResults = [];
      
      for (const url of rpcUrls) {
        try {
          const rpcResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: []
            })
          });
          
          const rpcData = await rpcResponse.json();
          rpcResults.push({
            url,
            success: !!rpcData.result,
            block: rpcData.result ? parseInt(rpcData.result, 16) : null,
            error: rpcData.error || null
          });
        } catch (rpcError) {
          rpcResults.push({
            url,
            success: false,
            error: rpcError.message
          });
        }
      }
      
      return res.status(200).json({
        timestamp: new Date().toISOString(),
        environment: {
          SONIC_RPC_URL: process.env.SONIC_RPC_URL ? 'Set' : 'Not set',
          SONICSCAN_API_KEY: process.env.SONICSCAN_API_KEY ? 'Set' : 'Not set'
        },
        sonicscan: {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          data: apiData,
          hasResult: !!apiData.result && !!apiData.result[0],
          resultKeys: apiData.result && apiData.result[0] ? Object.keys(apiData.result[0]) : []
        },
        rpc: {
          results: rpcResults
        }
      });
    } catch (error) {
      return res.status(500).json({ 
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  }