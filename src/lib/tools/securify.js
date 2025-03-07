// src/lib/tools/securify.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analyze a smart contract using Securify
 * @param {string} sourceCode - The contract source code
 * @returns {Promise<object>} Securify analysis results
 */
export async function executeSecurify(sourceCode) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary directory and file
      const tempDir = path.join(os.tmpdir(), `securify-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'Contract.sol');
      fs.writeFileSync(tempFile, sourceCode);

      // Execute Securify (this assumes Securify is installed or available as a Docker container)
      // Adjust the command based on how Securify is installed in your environment
      const result = execSync(`securify ${tempFile} --json`, { 
        encoding: 'utf-8' 
      });
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      // Parse the JSON output
      const securifyOutput = JSON.parse(result);
      
      // Transform Securify output to our expected format
      const transformedOutput = transformSecurifyOutput(securifyOutput);
      
      resolve({
        source: 'Securify',
        ...transformedOutput
      });
    } catch (error) {
      console.error("Error running Securify:", error);
      reject(new Error(`Securify analysis failed: ${error.message}`));
    }
  });
}

/**
 * Transform Securify JSON output to our expected format
 */
function transformSecurifyOutput(securifyOutput) {
  // Map Securify patterns to severity levels
  const patternSeverity = {
    'DAO': 'CRITICAL',
    'TODAmount': 'HIGH', 
    'TODReceiver': 'HIGH',
    'TODTransfer': 'HIGH',
    'UnhandledException': 'HIGH',
    'UnrestrictedEtherFlow': 'CRITICAL',
    'UnrestrictedWrite': 'HIGH',
    'RepeatedCall': 'MEDIUM',
    'TxOrigin': 'MEDIUM',
    'UnsafeCallToUntrustedContract': 'MEDIUM',
    'UnrestrictedSelfdestruct': 'CRITICAL'
  };
  
  // Extract detected issues
  const risks = [];
  
  // Securify outputs results per contract and per pattern
  if (securifyOutput.results) {
    Object.keys(securifyOutput.results).forEach(contractName => {
      const contractResults = securifyOutput.results[contractName];
      
      Object.keys(contractResults).forEach(pattern => {
        const patternResult = contractResults[pattern];
        
        // Only include violations (not warnings or safe findings)
        if (patternResult.violations && patternResult.violations.length > 0) {
          const severity = patternSeverity[pattern] || 'MEDIUM';
          
          risks.push({
            severity,
            title: `${pattern} vulnerability`,
            description: getPatternDescription(pattern),
            codeReference: `${contractName}: ${patternResult.violations.join(', ')}`,
            impact: getPatternImpact(pattern),
            recommendation: getPatternRecommendation(pattern)
          });
        }
      });
    });
  }
  
  // Calculate security score
  const issueWeights = {
    'CRITICAL': 25,
    'HIGH': 15, 
    'MEDIUM': 5,
    'LOW': 1,
    'INFO': 0
  };
  
  let totalWeight = 0;
  risks.forEach(risk => {
    totalWeight += issueWeights[risk.severity] || 0;
  });
  
  const securityScore = Math.max(0, Math.min(100, 100 - totalWeight));
  
  // Determine risk level
  let riskLevel = "Safe";
  if (securityScore < 40) riskLevel = "High Risk";
  else if (securityScore < 70) riskLevel = "Medium Risk";
  else if (securityScore < 90) riskLevel = "Low Risk";
  
  return {
    overview: "Securify formal verification analysis",
    contractType: "Solidity Contract",
    risks,
    securityScore,
    riskLevel,
    explanation: `Securify identified ${risks.length} potential vulnerabilities through formal verification.`
  };
}

// Helper functions for pattern descriptions
function getPatternDescription(pattern) {
  const descriptions = {
    'DAO': 'The contract may be vulnerable to DAO-style reentrancy attacks.',
    'TODAmount': 'Transaction ordering dependency affecting the amount of Ether transferred.',
    'TODReceiver': 'Transaction ordering dependency affecting the receiver of Ether.',
    'TODTransfer': 'Transaction ordering dependency affecting Ether transfers.',
    'UnhandledException': 'Low-level calls do not properly check for success.',
    'UnrestrictedEtherFlow': 'Unrestricted Ether flow to external destinations.',
    'UnrestrictedWrite': 'State variables can be modified by unauthorized parties.',
    'RepeatedCall': 'The contract makes repeated calls to the same function which could be consolidated.',
    'TxOrigin': 'Usage of tx.origin for authorization.',
    'UnsafeCallToUntrustedContract': 'Calls to untrusted contracts without proper validation.',
    'UnrestrictedSelfdestruct': 'The contract can be destroyed by unauthorized parties.'
  };
  
  return descriptions[pattern] || `Vulnerability related to ${pattern} pattern.`;
}

function getPatternImpact(pattern) {
  const impacts = {
    'DAO': 'Attackers could drain funds from the contract through recursive calls.',
    'TODAmount': 'Attackers could manipulate transaction ordering to receive more Ether than intended.',
    'TODReceiver': 'Attackers could manipulate transaction ordering to redirect Ether to their address.',
    'TODTransfer': 'Attackers could manipulate transaction ordering to affect Ether transfers.',
    'UnhandledException': 'Failed operations might not be detected, leading to inconsistent state.',
    'UnrestrictedEtherFlow': 'Unauthorized parties could withdraw Ether from the contract.',
    'UnrestrictedWrite': 'Attackers could modify critical state variables, compromising the contract.',
    'RepeatedCall': 'Higher gas costs and potential for inconsistent state.',
    'TxOrigin': 'Phishing attacks could trick users into executing malicious transactions.',
    'UnsafeCallToUntrustedContract': 'Malicious contracts could manipulate the calling contract.',
    'UnrestrictedSelfdestruct': 'Unauthorized destruction of the contract, rendering it unusable and losing all Ether.'
  };
  
  return impacts[pattern] || "Could impact contract security or functionality.";
}

function getPatternRecommendation(pattern) {
  const recommendations = {
    'DAO': 'Implement checks-effects-interactions pattern and use reentrancy guards.',
    'TODAmount': 'Avoid relying on exact balances before transfers. Consider using pull payment patterns.',
    'TODReceiver': 'Implement pull payment patterns instead of direct transfers.',
    'TODTransfer': 'Avoid assumptions about transaction ordering and use pull payment patterns.',
    'UnhandledException': 'Check return values of all low-level calls or use require statements.',
    'UnrestrictedEtherFlow': 'Implement proper access controls for functions that transfer Ether.',
    'UnrestrictedWrite': 'Add access modifiers to functions that modify critical state variables.',
    'RepeatedCall': 'Consolidate multiple calls to the same function where possible.',
    'TxOrigin': 'Use msg.sender instead of tx.origin for authorization.',
    'UnsafeCallToUntrustedContract': 'Validate external contracts before interaction or avoid calling untrusted contracts.',
    'UnrestrictedSelfdestruct': 'Add proper access controls to functions that can destroy the contract.'
  };
  
  return recommendations[pattern] || "Review and fix the identified vulnerability.";
}