// lib/sonic-integration.js
export async function connectToSonic() {
    const sonicRpcUrl = process.env.SONIC_RPC_URL || 'https://mainnet.soniclabs.com/rpc';
    
    try {
      // Test connection to Sonic RPC
      const response = await fetch(sonicRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      });
      
      const data = await response.json();
      return {
        connected: true,
        blockNumber: parseInt(data.result, 16),
        chainId: 'sonic'
      };
    } catch (error) {
      console.error('Failed to connect to Sonic blockchain:', error);
      return { connected: false, error: error.message };
    }
  }