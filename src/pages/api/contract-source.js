// pages/api/contract-source.js
import { getContractSource } from '../../lib/etherscan';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, network = 'mainnet' } = req.body;
    
    // Validate inputs
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid contract address' });
    }
    
    // Fetch contract source code
    const contractData = await getContractSource(address, network);
    
    if (!contractData.sourceCode || contractData.sourceCode === '') {
      return res.status(404).json({ error: 'Contract source code not available' });
    }
    
    return res.status(200).json({
      success: true,
      address,
      network,
      sourceCode: contractData.sourceCode,
      contractName: contractData.contractName,
      compiler: contractData.compiler
    });
  } catch (error) {
    console.error('Error fetching contract source:', error);
    return res.status(500).json({ error: error.message });
  }
}