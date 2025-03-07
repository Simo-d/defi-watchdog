// pages/api/analyze.js
import { auditSmartContract } from '../../lib/analyzer';
import { saveAuditReport, findMostRecentAuditReport } from '../../lib/localStorage';
import crypto from 'crypto';

// Active requests tracking
const activeRequests = new Map();
export const config = {
  maxDuration: 300 // 5 minutes maximum duration for this endpoint
};
export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the incoming request (without sensitive data)
    console.log('Analyze API called', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      env: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasEtherscanKey: !!process.env.ETHERSCAN_API_KEY,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
    const { address, network = 'mainnet', forceRefresh = false, useMultiAI = false } = req.body;

    // Validate inputs
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid contract address',
        address: address || '',
        network: network,
        contractName: "Invalid Contract",
        contractType: "Invalid",
        analysis: {
          contractType: "Invalid",
          overview: "Invalid contract address provided",
          keyFeatures: [],
          risks: [],
          securityScore: 0,
          riskLevel: "Unknown"
        },
        securityScore: 0,
        riskLevel: "Unknown",
        isSafe: false
      });
    }
    
    // Create a unique key for this request
    const requestKey = `${address.toLowerCase()}-${network}-${useMultiAI ? 'multi' : 'single'}`;

    // Check if we already have an in-progress request for this address
    if (activeRequests.has(requestKey)) {
      console.log(`Request already in progress for ${requestKey}, waiting...`);
      // Wait for the existing request to complete
      const result = await activeRequests.get(requestKey);
      return res.status(200).json(result);
    }
    
    // Create a promise for this request
    const requestPromise = (async () => {
      try {
        // Check if we have a recent audit for this contract
        if (!forceRefresh) {
          const existingAudit = await findMostRecentAuditReport({
            address: address.toLowerCase(),
            network,
            // Only use reports from the last 7 days
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          });
          
          if (existingAudit) {
            console.log(`Found recent audit for ${address} on ${network}`);
            return {
              ...existingAudit,
              isFromCache: true,
              cachedAt: existingAudit.createdAt
            };
          }
        }
        
        // If we get here, we need to perform a new audit
        console.log(`Performing new audit for ${address} on ${network}`);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Analysis timed out after 60 seconds")), 60000);
        });
        
        // Race between the analysis and the timeout
        const auditResults = await Promise.race([
          auditSmartContract(address, network, { useMultiAI }),
          timeoutPromise
        ]);        
        // Save to local storage
        try {
          await saveAuditReport(auditResults);
          console.log(`Saved audit report for ${address} on ${network}`);
        } catch (storageError) {
          console.error('Error saving audit report to storage:', storageError);
          // Continue even if saving fails
        }
        
        return auditResults;
      } catch (error) {
        console.error('Error during audit:', error);
        throw error;
      }
    })();
    
    // Store the promise in the map
    activeRequests.set(requestKey, requestPromise);
    
    // Wait for the request to complete
    const result = await requestPromise;
    
    // Always remove the request from the map when done
    activeRequests.delete(requestKey);
    
    return res.status(200).json(result);
  // In your analyze.js API handler's catch block
} catch (error) {
  console.error('Error in audit endpoint:', error);
  const errorMessage = error.message || 'Unknown error occurred';
  const isTimeout = errorMessage.includes('timed out');
  
  // Return a structured error response
  return res.status(isTimeout ? 504 : 500).json({
    success: false,
    error: errorMessage,
    address: req.body.address || '',
    network: req.body.network || 'mainnet',
    contractName: "Error",
    contractType: "Unknown",
    analysis: {
      contractType: "Unknown",
      overview: isTimeout 
        ? "The analysis timed out. This contract may be too complex or large to analyze quickly."
        : "An error occurred during analysis",
      keyFeatures: [],
      risks: [],
      securityScore: 0,
      riskLevel: "Unknown",
      explanation: "Error: " + errorMessage
    },
    securityScore: 0,
    riskLevel: "Unknown",
    isSafe: false
  });
}
}