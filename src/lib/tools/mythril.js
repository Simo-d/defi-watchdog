// src/lib/tools/mythril.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analyze a smart contract using Mythril
 * @param {string} sourceCode - The contract source code
 * @returns {Promise<object>} Mythril analysis results
 */
export async function analyzeWithMythril(sourceCode) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary directory and file
      const tempDir = path.join(os.tmpdir(), `mythril-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'Contract.sol');
      fs.writeFileSync(tempFile, sourceCode);

      // Execute Mythril (this requires myth to be installed)
      // Use --solv to specify Solidity compiler version if needed
      const result = execSync(`myth analyze ${tempFile} --execution-timeout 60 --json`, { 
        encoding: 'utf-8'
      });
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
      
      // Parse the JSON output
      const mythrilOutput = JSON.parse(result);
      
      // Transform Mythril output to our expected format
      const transformedOutput = transformMythrilOutput(mythrilOutput);
      
      resolve({
        source: 'Mythril',
        ...transformedOutput
      });
    } catch (error) {
      console.error("Error running Mythril:", error);
      reject(new Error(`Mythril analysis failed: ${error.message}`));
    }
  });
}

/**
 * Transform Mythril JSON output to our expected format
 */
function transformMythrilOutput(mythrilOutput) {
  // Map Mythril severity levels to our format
  const severityMapping = {
    'High': 'CRITICAL',
    'Medium': 'HIGH',
    'Low': 'MEDIUM',
    'Informational': 'INFO'
  };
  
  // Extract detected issues
  const risks = [];
  
  if (Array.isArray(mythrilOutput.issues)) {
    mythrilOutput.issues.forEach(issue => {
      const severity = severityMapping[issue.severity] || 'INFO';
      
      risks.push({
        severity,
        title: issue.title || issue.swc_title || "Unknown issue",
        description: issue.description,
        codeReference: `${issue.filename}:${issue.lineno}`,
        impact: issue.extra_info || "Not specified",
        recommendation: issue.description_head || "Fix the identified issue"
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
    overview: "Mythril symbolic execution analysis",
    contractType: "Solidity Contract",
    risks,
    securityScore,
    riskLevel,
    explanation: `Mythril identified ${risks.length} potential issues through symbolic execution analysis.`
  };
}