// src/lib/tools/slither.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analyze a smart contract using Slither
 * @param {string} sourceCode - The contract source code
 * @returns {Promise<object>} Slither analysis results
 */
export async function analyzeWithSlither(sourceCode) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary directory and file
      const tempDir = path.join(os.tmpdir(), `slither-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'Contract.sol');
      fs.writeFileSync(tempFile, sourceCode);

      // Execute slither (this requires slither to be installed on the server)
      const result = execSync(`slither ${tempFile} --json -`, { encoding: 'utf-8' });
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      // Parse the JSON output
      const slitherOutput = JSON.parse(result);
      
      // Transform Slither output to our expected format
      const transformedOutput = transformSlitherOutput(slitherOutput);
      
      resolve({
        source: 'Slither',
        ...transformedOutput
      });
    } catch (error) {
      console.error("Error running Slither:", error);
      reject(new Error(`Slither analysis failed: ${error.message}`));
    }
  });
}

/**
 * Transform Slither JSON output to our expected format
 */
function transformSlitherOutput(slitherOutput) {
  // Map Slither detectors to severity levels
  const severityMapping = {
    'High': 'CRITICAL',
    'Medium': 'HIGH',
    'Low': 'MEDIUM',
    'Informational': 'LOW'
  };
  
  // Extract detected issues
  const risks = [];
  
  if (slitherOutput.detectors) {
    slitherOutput.detectors.forEach(detector => {
      const severity = severityMapping[detector.impact] || 'INFO';
      
      detector.results.forEach(result => {
        risks.push({
          severity,
          title: detector.check,
          description: result.description,
          codeReference: result.elements.map(el => el.name).join(', '),
          impact: detector.impact_description || "Not specified",
          recommendation: detector.confidence_description || "Review the identified issue"
        });
      });
    });
  }
  
  // Basic contract info
  const contractsInfo = slitherOutput.contracts || [];
  const contractName = contractsInfo.length > 0 ? contractsInfo[0].name : "Unknown";
  
  // Calculate security score (100 - weighted sum of issues)
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
    overview: `Slither static analysis of ${contractName} contract`,
    contractType: contractsInfo.length > 0 ? "Solidity Contract" : "Unknown",
    risks,
    securityScore,
    riskLevel,
    explanation: `Slither identified ${risks.length} issues with this contract.`
  };
}