// pages/api/generate-patch.js
import { getContractSource } from '../../lib/etherscan';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, network = 'mainnet', findings = [] } = req.body;

    // Validate inputs
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid contract address'
      });
    }
    
    if (!findings || !Array.isArray(findings) || findings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No findings provided to fix'
      });
    }

    // Get contract source code
    const contractData = await getContractSource(address, network);
    
    if (!contractData.sourceCode) {
      return res.status(404).json({
        success: false,
        error: 'Contract source code not found or not verified'
      });
    }

    // Generate fixes for each finding
    const fixes = await generateFixes(contractData.sourceCode, findings);

    return res.status(200).json({
      success: true,
      address,
      network,
      fixes
    });
  } catch (error) {
    console.error('Error generating patches:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating patches'
    });
  }
}

/**
 * Generate fixes for security findings
 * @param {string} sourceCode - Contract source code
 * @param {Array} findings - Security findings to fix
 * @returns {Promise<Array>} Generated fixes
 */
async function generateFixes(sourceCode, findings) {
  // Filter to only include fixable findings (Critical, High, Medium)
  const fixableFindings = findings.filter(finding => 
    ['CRITICAL', 'HIGH', 'MEDIUM'].includes(finding.severity?.toUpperCase())
  );
  
  if (fixableFindings.length === 0) {
    return [];
  }

  // Process up to 5 findings at most
  const selectedFindings = fixableFindings.slice(0, 5);
  
  // Generate fixes in parallel
  const fixPromises = selectedFindings.map(finding => 
    generateFixForFinding(sourceCode, finding)
  );
  
  // Wait for all fixes to be generated
  const fixes = await Promise.all(fixPromises);
  
  // Filter out any failures
  return fixes.filter(Boolean);
}

/**
 * Generate a fix for a single finding
 * @param {string} sourceCode - Contract source code
 * @param {object} finding - Security finding to fix
 * @returns {Promise<object|null>} Generated fix or null if failed
 */
async function generateFixForFinding(sourceCode, finding) {
  try {
    // Create prompt for the AI model
    const prompt = `
      I need you to fix a security vulnerability in this smart contract. 
      
      The issue is:
      Severity: ${finding.severity}
      Description: ${finding.description}
      ${finding.impact ? `Impact: ${finding.impact}` : ''}
      ${finding.codeReference ? `Code Reference: ${finding.codeReference}` : ''}
      ${finding.recommendation ? `Recommendation: ${finding.recommendation}` : ''}
      
      Here's the contract code:
      \`\`\`solidity
      ${sourceCode}
      \`\`\`
      
      Please provide a fix in the following JSON format:
      {
        "findingTitle": "Brief title of the issue",
        "severity": "${finding.severity}",
        "originalCode": "The vulnerable code that needs to be changed",
        "fixedCode": "The corrected code with the fix applied",
        "diffSummary": "Brief explanation of what changed",
        "explanation": "Detailed explanation of why this fix addresses the vulnerability"
      }
      
      Focus only on fixing the specific vulnerability mentioned, not other issues. Make minimal changes necessary to fix the issue.
    `;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", 
      messages: [
        { role: "system", content: "You are an expert smart contract security auditor who can fix vulnerabilities in Solidity code." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    // Parse the response
    const fix = JSON.parse(response.choices[0].message.content);
    
    // Add basic validation
    if (!fix.originalCode || !fix.fixedCode) {
      console.warn('AI generated an invalid fix:', fix);
      return null;
    }
    
    return fix;
  } catch (error) {
    console.error('Error generating fix for finding:', error);
    return null;
  }
}