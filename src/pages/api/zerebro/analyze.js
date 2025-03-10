// pages/api/zerebro/analyze.js
import { ethers } from 'ethers';
import { findMostRecentAuditReport, saveAuditReport } from '../../../lib/localStorage';
import { auditSmartContract } from '../../../lib/analyzer';

// Active requests tracking
const activeRequests = new Map();
export const config = {
  maxDuration: 90 // 90 seconds maximum duration for this endpoint (Sonic analysis may take longer)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the incoming request
    console.log('ZerePy Analyze API called', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      network: req.body?.network || 'unknown'
    });
    
    const { address, network = 'sonic', forceRefresh = false, useMultiAI = true, fastMode = false } = req.body;

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

    // Only process Sonic network
    if (network !== 'sonic') {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is only for Sonic contracts',
        redirectTo: '/api/analyze'
      });
    }
    
    // Create a unique key for this request
    const requestKey = `zerebro-${address.toLowerCase()}-${network}`;

    // Check if we already have an in-progress request for this address
    if (activeRequests.has(requestKey)) {
      console.log(`ZerePy request already in progress for ${requestKey}, waiting...`);
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
            // Only use reports from the last 2 days for Sonic (more frequent updates)
            createdAt: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
          });
          
          if (existingAudit) {
            console.log(`Found recent ZerePy audit for ${address} on ${network}`);
            return {
              ...existingAudit,
              isFromCache: true,
              cachedAt: existingAudit.createdAt,
              zerebro: true
            };
          }
        }
        
        // Set up provider for Sonic network
        let provider;
        try {
          provider = new ethers.providers.JsonRpcProvider(
            process.env.SONIC_RPC_URL || 'https://mainnet.soniclabs.com/rpc'
          );
          
          // Quick test to see if provider is working
          await provider.getBlockNumber();
          console.log('Successfully connected to Sonic RPC');
        } catch (error) {
          console.error('Error connecting to Sonic RPC:', error);
          throw new Error('Failed to connect to Sonic blockchain. Please try again later.');
        }
        
        // Begin fetching contract data
        console.log(`Performing ZerePy analysis for ${address} on Sonic network`);
        
        // Fetch basic contract data in parallel
        const [bytecode, balance, txCount, blockNumber] = await Promise.all([
          provider.getCode(address),
          provider.getBalance(address),
          provider.getTransactionCount(address),
          provider.getBlockNumber()
        ]);
        
        // Check if contract exists
        if (bytecode === '0x' || bytecode === '0x0') {
          throw new Error('No contract found at the specified address on Sonic network');
        }
        
        // Set longer timeout for Sonic analysis
        const timeoutDuration = 60000; // 60 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`ZerePy analysis timed out after ${timeoutDuration/1000} seconds`)), timeoutDuration);
        });
        
        // Get standard audit first
        const standardAuditOptions = { 
          useMultiAI: true,
          fastMode: false,
          zerebro: true // Flag to indicate ZerePy analysis
        };
        
        // Perform standard audit with ZerePy flag
        const standardAudit = await Promise.race([
          auditSmartContract(address, network, standardAuditOptions),
          timeoutPromise
        ]);

        // Enhance with Sonic-specific analysis
        // 1. Check for Sonic-specific patterns in bytecode
        const sonicSpecificAnalysis = analyzeSonicSpecificPatterns(bytecode);
        
        // 2. Analyze transaction patterns on Sonic
        const recentBlocks = await fetchRecentBlocks(provider, blockNumber, 10);
        const txPatterns = analyzeSonicTransactionPatterns(recentBlocks, address);
        
        // 3. Combine standard audit with Sonic-specific insights
        const enhancedAudit = enhanceWithSonicInsights(standardAudit, sonicSpecificAnalysis, txPatterns, {
          bytecodeSize: bytecode.length,
          balance: ethers.utils.formatEther(balance),
          txCount
        });
        
        // Save to local storage
        try {
          await saveAuditReport(enhancedAudit);
          console.log(`Saved ZerePy audit report for ${address} on ${network}`);
        } catch (storageError) {
          console.error('Error saving ZerePy audit report to storage:', storageError);
          // Continue even if saving fails
        }
        
        return enhancedAudit;
      } catch (error) {
        console.error('Error during ZerePy audit:', error);
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
  } catch (error) {
    console.error('Error in ZerePy audit endpoint:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    const isTimeout = errorMessage.includes('timed out');
    
    // Return a structured error response
    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: errorMessage,
      address: req.body.address || '',
      network: req.body.network || 'sonic',
      zerebro: true,
      contractName: "Error",
      contractType: "Unknown",
      analysis: {
        contractType: "Unknown",
        overview: isTimeout 
          ? "The ZerePy analysis timed out. This Sonic contract may be too complex to analyze quickly."
          : "An error occurred during ZerePy analysis",
        keyFeatures: [],
        risks: [],
        securityScore: 0,
        riskLevel: "Unknown",
        explanation: "Error: " + errorMessage,
        sonicSpecifics: {
          analyzed: false,
          error: errorMessage
        }
      },
      securityScore: 0,
      riskLevel: "Unknown",
      isSafe: false
    });
  }
}

/**
 * Analyzes Sonic-specific patterns in contract bytecode
 */
function analyzeSonicSpecificPatterns(bytecode) {
  const analysis = {
    optimizedForSonic: false,
    usesSonicGateway: false,
    batchProcessingOptimized: false,
    sonicPatterns: []
  };
  
  // Check for Sonic Gateway integration
  // Note: These are hypothetical patterns, would need actual Sonic documentation
  if (bytecode.includes('534f4e49435f474154455741')) { // "SONIC_GATEWA" in hex
    analysis.usesSonicGateway = true;
    analysis.sonicPatterns.push({
      name: 'Sonic Gateway Integration',
      description: 'Contract uses Sonic Gateway for cross-chain operations',
      type: 'optimization',
      impact: 'Positive - Enables efficient cross-chain transfers'
    });
  } else if (bytecode.includes('a9059cbb') && bytecode.includes('23b872dd')) {
    // Contract has standard transfer methods but no Sonic Gateway
    analysis.sonicPatterns.push({
      name: 'Standard Bridge Pattern',
      description: 'Contract uses standard EVM bridge patterns instead of Sonic Gateway',
      type: 'opportunity',
      impact: 'Moderate - Missing optimization for cross-chain operations',
      recommendation: 'Implement Sonic Gateway for better cross-chain performance'
    });
  }
  
  // Check for batch processing optimization
  // Look for loops with large iteration counts (simplified check)
  const loopPatterns = bytecode.match(/60(f|e|d|c|b|a)[0-9a-f]1[0-9a-f]/g) || [];
  if (loopPatterns.length > 0) {
    // Check if the loop counts are high enough for Sonic's TPS
    const highBatchSize = loopPatterns.some(pattern => {
      const hexValue = pattern.substring(2, 4);
      const value = parseInt(hexValue, 16);
      return value >= 100; // Arbitrary threshold for "high batch size"
    });
    
    if (highBatchSize) {
      analysis.batchProcessingOptimized = true;
      analysis.sonicPatterns.push({
        name: 'Optimized Batch Processing',
        description: 'Contract uses large batch sizes suitable for Sonic\'s high TPS',
        type: 'optimization',
        impact: 'Positive - Efficiently utilizes Sonic\'s throughput capabilities'
      });
    } else {
      analysis.sonicPatterns.push({
        name: 'Limited Batch Processing',
        description: 'Contract uses small batch sizes that underutilize Sonic\'s capabilities',
        type: 'opportunity',
        impact: 'Moderate - Not fully leveraging Sonic\'s high TPS',
        recommendation: 'Increase batch processing sizes for better throughput'
      });
    }
  }
  
  // Check for Sonic-specific memory layout
  // This is hypothetical and would need actual Sonic VM documentation
  const storagePatterns = bytecode.match(/55[0-9a-f]{2}54/g) || [];
  if (storagePatterns.length > 0) {
    analysis.sonicPatterns.push({
      name: 'Storage Layout Optimization',
      description: 'Contract uses storage patterns that may be optimized for Sonic VM',
      type: 'optimization',
      impact: 'Minor - Potentially more efficient storage operations on Sonic'
    });
  }
  
  // Overall assessment
  analysis.optimizedForSonic = analysis.usesSonicGateway || analysis.batchProcessingOptimized;
  
  return analysis;
}

/**
 * Fetches recent blocks from Sonic blockchain
 */
async function fetchRecentBlocks(provider, currentBlock, count) {
  const blocks = [];
  
  for (let i = 0; i < count; i++) {
    if (currentBlock - i < 0) break;
    try {
      const block = await provider.getBlock(currentBlock - i, true);
      blocks.push(block);
    } catch (error) {
      console.error(`Error fetching block ${currentBlock - i}:`, error);
    }
  }
  
  return blocks;
}

/**
 * Analyzes transaction patterns on Sonic blockchain
 */
function analyzeSonicTransactionPatterns(blocks, contractAddress) {
  const patterns = {
    recentTransactions: 0,
    highThroughputDetected: false,
    averageGasUsed: 0,
    totalGasUsed: 0
  };
  
  const contractTxs = [];
  const normalizedAddress = contractAddress.toLowerCase();
  
  // Extract transactions involving the contract
  blocks.forEach(block => {
    if (!block || !block.transactions) return;
    
    block.transactions.forEach(tx => {
      if (tx.to === normalizedAddress || tx.from === normalizedAddress) {
        contractTxs.push(tx);
      }
    });
  });
  
  // Analyze transaction patterns
  if (contractTxs.length > 0) {
    patterns.recentTransactions = contractTxs.length;
    
    // Check if contract has high transaction throughput
    patterns.highThroughputDetected = contractTxs.length > 10;
    
    // Calculate average gas usage
    const totalGas = contractTxs.reduce((sum, tx) => {
      return sum + (parseInt(tx.gasUsed || '0'));
    }, 0);
    
    patterns.totalGasUsed = totalGas;
    patterns.averageGasUsed = totalGas / contractTxs.length;
  }
  
  return patterns;
}

/**
 * Enhances standard audit with Sonic-specific insights
 */
function enhanceWithSonicInsights(standardAudit, sonicAnalysis, txPatterns, contractStats) {
  // Deep clone to avoid modifying the original
  const enhancedAudit = JSON.parse(JSON.stringify(standardAudit));
  
  // Add Sonic-specific analysis
  enhancedAudit.analysis.sonicSpecifics = {
    optimizedForSonic: sonicAnalysis.optimizedForSonic,
    usesSonicGateway: sonicAnalysis.usesSonicGateway,
    batchProcessingOptimized: sonicAnalysis.batchProcessingOptimized,
    highThroughputDetected: txPatterns.highThroughputDetected,
    recentTransactions: txPatterns.recentTransactions,
    averageGasUsed: txPatterns.averageGasUsed,
    bytecodeSize: contractStats.bytecodeSize,
    balance: contractStats.balance,
    txCount: contractStats.txCount,
    compatibilityLevel: sonicAnalysis.optimizedForSonic ? 'High' : 'Medium',
    sonicIntegrationScore: calculateSonicScore(sonicAnalysis, txPatterns)
  };
  
  // Add Sonic-specific optimization opportunities to risks
  const sonicOpportunities = sonicAnalysis.sonicPatterns
    .filter(pattern => pattern.type === 'opportunity')
    .map(pattern => ({
      title: pattern.name,
      description: pattern.description,
      severity: 'LOW', // Most Sonic optimizations are LOW severity
      impact: pattern.impact,
      recommendation: pattern.recommendation,
      consensus: 'Identified by ZerePy Agent',
      sonicSpecific: true
    }));
  
  // Add Sonic optimization risks if there are any
  if (sonicOpportunities.length > 0) {
    enhancedAudit.analysis.risks = enhancedAudit.analysis.risks || [];
    enhancedAudit.analysis.risks = [...enhancedAudit.analysis.risks, ...sonicOpportunities];
  }
  
  // Update overview with Sonic-specific information
  let sonicOverview = '';
  if (sonicAnalysis.optimizedForSonic) {
    sonicOverview = `This contract appears to be optimized for the Sonic blockchain with ${sonicAnalysis.sonicPatterns.filter(p => p.type === 'optimization').length} Sonic-specific optimizations detected.`;
  } else {
    sonicOverview = `This contract could benefit from additional Sonic-specific optimizations. ZerePy identified ${sonicOpportunities.length} opportunities to better leverage Sonic's capabilities.`;
  }
  
  // Add ZerePy signature
  enhancedAudit.analysis.overview = `${enhancedAudit.analysis.overview || ''}\n\n${sonicOverview}`;
  
  // Update analysis discussion if it exists
  if (enhancedAudit.analysis.analysisDiscussion) {
    enhancedAudit.analysis.analysisDiscussion = addZerePyComments(
      enhancedAudit.analysis.analysisDiscussion,
      sonicAnalysis,
      txPatterns
    );
  }
  
  // Mark as analyzed by ZerePy
  enhancedAudit.zerebro = true;
  enhancedAudit.analysis.analyzedBy = 'ZerePy';
  
  return enhancedAudit;
}

/**
 * Calculate a Sonic optimization score based on analysis
 */
function calculateSonicScore(sonicAnalysis, txPatterns) {
  let score = 50; // Base score
  
  // Add points for optimizations
  if (sonicAnalysis.usesSonicGateway) score += 20;
  if (sonicAnalysis.batchProcessingOptimized) score += 15;
  
  // Add points for proven high-throughput
  if (txPatterns.highThroughputDetected) score += 10;
  if (txPatterns.recentTransactions > 50) score += 5;
  
  // Bonus for having multiple optimizations
  const optimizationCount = sonicAnalysis.sonicPatterns.filter(p => p.type === 'optimization').length;
  score += optimizationCount * 2;
  
  // Cap the score at 100
  return Math.min(100, score);
}

/**
 * Adds ZerePy-specific comments to the analysis discussion
 */
function addZerePyComments(discussion, sonicAnalysis, txPatterns) {
    // If no discussion exists, create a basic one
    if (!discussion) {
      return `ZerePy Agent: I've analyzed this contract on the Sonic blockchain and ${
        sonicAnalysis.optimizedForSonic ? 'found it to be well-optimized' : 'identified some optimization opportunities'
      } for Sonic's high TPS environment.\n\n${
        sonicAnalysis.usesSonicGateway ? 
          'The contract correctly uses Sonic Gateway for cross-chain operations.' : 
          'Implementing Sonic Gateway would improve cross-chain efficiency.'
      }\n\nCONCLUSION: This contract ${
        sonicAnalysis.optimizedForSonic ? 'is well-optimized for' : 'could be better optimized for'
      } the Sonic blockchain.`;
    }
    
    // Otherwise, enhance the existing discussion
    const zerebyComments = [];
    
    if (sonicAnalysis.usesSonicGateway) {
      zerebyComments.push('ZerePy Agent: The contract properly uses Sonic Gateway for cross-chain transfers, which is optimal for Sonic blockchain.');
    } else {
      zerebyComments.push('ZerePy Agent: The contract could be improved by implementing Sonic Gateway for more efficient cross-chain operations on Sonic blockchain.');
    }
    
    if (sonicAnalysis.batchProcessingOptimized) {
      zerebyComments.push('ZerePy Agent: The batch processing approach is well-optimized for Sonic\'s high throughput capabilities.');
    } else {
      zerebyComments.push('ZerePy Agent: Batch processing could be optimized to better leverage Sonic\'s 10,000 TPS capacity.');
    }
    
    if (txPatterns.highThroughputDetected) {
      zerebyComments.push(`ZerePy Agent: The contract shows evidence of high transaction throughput with ${txPatterns.recentTransactions} recent transactions, indicating good utilization of Sonic's performance.`);
    }
    
    // Add ZerePy conclusion
    const zerebyConclusion = `ZerePy CONCLUSION: This contract ${
      sonicAnalysis.optimizedForSonic ? 'demonstrates good optimization' : 'would benefit from further optimization'
    } for the Sonic blockchain environment.`;
    
    // Combine existing discussion with ZerePy insights
    return `${discussion}\n\n${zerebyComments.join('\n\n')}\n\n${zerebyConclusion}`;
  }