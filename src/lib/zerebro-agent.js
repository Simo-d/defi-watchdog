// lib/zerebro-agent.js
export async function initializeZerebroAgent() {
    try {
      const response = await fetch('/api/zerebro/initialize', {
        method: 'POST',
      });
      return response.json();
    } catch (error) {
      console.error('Failed to initialize Zerebro agent:', error);
      return { success: false, error: error.message };
    }
  }
  
  export async function analyzeContractWithZerebro(contractAddress, contractCode) {
    try {
      const response = await fetch('/api/zerebro/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: contractAddress,
          code: contractCode,
        }),
      });
      return response.json();
    } catch (error) {
      console.error('Error analyzing with Zerebro agent:', error);
      return { success: false, error: error.message };
    }
  }