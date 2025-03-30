// pages/api/analyze.js
import { auditSmartContract } from './analyze-helpers';
import { saveAuditReport, findMostRecentAuditReport } from '../../lib/localStorage';

// Active requests tracking
const activeRequests = new Map();
export const config = {
  maxDuration: 60 // 60 seconds maximum duration for this endpoint
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
    
    const { address, network = 'linea', forceRefresh = false, useMultiAI = false, fastMode = true } = req.body;

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
    
    // NEW: Redirect Sonic network requests to ZerePy endpoint
    if (network === 'sonic') {
      try {
        // Forward to the ZerePy endpoint
        console.log('Redirecting Sonic network request to ZerePy endpoint');
        
        const zerebyResponse = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/zerebro/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address,
            network,
            forceRefresh,
            useMultiAI,
            fastMode
          }),
        });
        
        if (!zerebyResponse.ok) {
          throw new Error(`ZerePy analysis failed with status ${zerebyResponse.status}`);
        }
        
        const zerebyResult = await zerebyResponse.json();
        return res.status(200).json(zerebyResult);
      } catch (zerebyError) {
        console.error('Error in ZerePy redirection:', zerebyError);
        // Continue with regular analysis if ZerePy fails
        console.log('Falling back to standard analysis for Sonic network');
      }
    } 
    // Handle Linea (previously 'mainnet') the same way we handled mainnet before
    else if (network === 'linea' || network === 'mainnet') {
      // Proceed with regular analysis flow (no changes needed)
      console.log(`Performing standard analysis for ${network === 'mainnet' ? 'Linea (mainnet)' : 'Linea'} network`);
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
        console.log(`Performing ${fastMode ? 'fast' : 'detailed'} audit for ${address} on ${network}`);

        const timeoutDuration = fastMode ? 45000 : 90000; // 25 seconds for fast mode
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Analysis timed out after ${timeoutDuration/1000} seconds`)), timeoutDuration);
        });
        
        // Pass fast mode to audit function
        const auditOptions = { 
          useMultiAI, 
          fastMode,
          skipValidation: fastMode // Skip the secondary AI validation in fast mode
        };
        
        // Race between analysis and timeout
        const auditResults = await Promise.race([
          auditSmartContract(address, network, auditOptions),
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
      network: req.body.network || 'linea', // Changed default from 'mainnet' to 'linea'
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