// src/lib/deepseek.js
import fetch from 'node-fetch';

// Deepseek API configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-00cdc9ed60f040b29f0719c993b651fa';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Analyzes smart contract code using Deepseek API
 * @param {string} sourceCode - The contract source code
 * @param {string} contractName - The name of the contract
 * @param {object} options - Additional options for the analysis
 * @returns {Promise<object>} The analysis results
 */
export async function analyzeWithDeepseek(sourceCode, contractName, options = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Deepseek API key not found. Please check your .env file.');
  }
  
  try {
    console.log(`Starting Deepseek analysis for contract: ${contractName}`);
    
    // Define the system prompt for the AI
    const systemPrompt = `
      You are an expert smart contract auditor with deep knowledge of Solidity and blockchain security.
      Your task is to analyze smart contracts and identify potential security risks, vulnerabilities, 
      or suspicious patterns that might indicate malicious intent.

      Focus on detecting:
      1. Owner privileges that could be abused (e.g., unlimited minting, ability to freeze funds)
      2. Hidden backdoors or rug pull mechanisms
      3. Code that prevents users from selling tokens
      4. Unusual or excessive fees
      5. Functions that can drain user funds
      6. Other common vulnerabilities (reentrancy, front-running, etc.)

      Format your response in JSON with the following structure:
      {
        "overview": "Brief explanation of what the contract does",
        "contractType": "Main type of contract (ERC20, ERC721, etc.)",
        "keyFeatures": ["List of main features"],
        "risks": [
          {
            "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
            "title": "Short title for the issue",
            "description": "Description of the risk",
            "codeReference": "The relevant code snippet or function name",
            "impact": "What could happen if exploited",
            "recommendation": "How to fix this issue"
          }
        ],
        "securityScore": 1-100 (higher is safer),
        "riskLevel": "Safe|Low Risk|Medium Risk|High Risk",
        "explanation": "Explanation of the overall assessment"
      }
    `;

    // Truncate code if needed
    let contractCodeTruncated = sourceCode;
    if (sourceCode.length > 30000) {
      const halfSize = 15000;
      contractCodeTruncated = sourceCode.substring(0, halfSize) + 
        "\n\n... [Code truncated due to size limits] ...\n\n" + 
        sourceCode.substring(sourceCode.length - halfSize);
    }

    // Prepare the request payload according to Deepseek's API
    const payload = {
      model: options.model || "deepseek-coder",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this ${contractName} smart contract:\n\n\`\`\`solidity\n${contractCodeTruncated}\n\`\`\`` }
      ],
      temperature: options.temperature || 0.1,
      max_tokens: options.max_tokens || 4000,
      response_format: { type: "json_object" }
    };

    // Make the API request
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Deepseek API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extract content from Deepseek response
    const content = data.choices[0].message.content;
    const analysis = JSON.parse(content);

    return {
      source: 'Deepseek',
      ...analysis,
      rawResponse: data // Include raw response for debugging
    };
  } catch (error) {
    console.error("Error analyzing contract with Deepseek:", error);
    
    // Return a basic structure with the error
    return {
      source: 'Deepseek',
      overview: "Analysis failed",
      contractType: "Unknown",
      risks: [],
      securityScore: 0,
      riskLevel: "Unknown",
      explanation: `Analysis failed: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Extracts a simple summary from the contract for display purposes
 * @param {string} sourceCode - The contract source code
 * @returns {Promise<string>} A simple explanation of the contract
 */
export async function getContractSummaryWithDeepseek(sourceCode) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('Deepseek API key not found. Please check your .env file.');
  }
  
  try {
    const payload = {
      model: "deepseek-coder",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that explains smart contracts in simple terms."
        },
        { 
          role: "user", 
          content: `Summarize what this smart contract does in 2-3 sentences, in very simple terms for non-technical users:\n\n${sourceCode.substring(0, 15000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Deepseek API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error summarizing contract with Deepseek:", error);
    return "Could not generate summary for this contract.";
  }
}

/**
 * Validates findings with Deepseek for consensus
 * @param {string} sourceCode - The contract source code
 * @param {object} aiAnalysisResults - Initial analysis results to validate
 * @returns {Promise<object>} Validated analysis results
 */
export async function validateFindingsWithDeepseek(sourceCode, aiAnalysisResults) {
  try {
    // Only validate if we have findings to validate
    if (!aiAnalysisResults.findings || aiAnalysisResults.findings.length === 0) {
      return aiAnalysisResults;
    }
    
    // Prepare the validation prompt
    const validationPrompt = `
      I need you to validate the following security findings for this smart contract:
      
      Contract Code:
      \`\`\`solidity
      ${sourceCode.slice(0, 10000)}${sourceCode.length > 10000 ? '...(truncated)' : ''}
      \`\`\`
      
      Previous Analysis Findings:
      ${JSON.stringify(aiAnalysisResults.findings, null, 2)}
      
      For each finding, indicate whether you:
      1. CONFIRM - You agree with the finding
      2. DISPUTE - You disagree with the finding
      3. MODIFY - You agree but suggest modifications to severity or details
      
      Explain your reasoning for each and provide your own assessment if you dispute or modify.
      
      Format your response as JSON with these fields:
      {
        "validatedFindings": [
          {
            "originalFinding": (copy of the original finding),
            "validationResult": "CONFIRM|DISPUTE|MODIFY",
            "reasoning": "Your reasoning",
            "modifiedFinding": (modified version if applicable)
          }
        ],
        "missedFindings": [
          (any new findings you identified that were missed)
        ]
      }
    `;
    
    const payload = {
      model: "deepseek-coder",
      messages: [
        { role: "user", content: validationPrompt }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Deepseek API validation request failed with status ${response.status}`);
    }

    const data = await response.json();
    const validationResults = JSON.parse(data.choices[0].message.content);
    
    // Merge the validated findings into the final results
    return mergeValidatedFindings(aiAnalysisResults, validationResults);
  } catch (error) {
    console.error("Validation failed with Deepseek:", error);
    // Return original findings if validation fails
    return aiAnalysisResults;
  }
}

/**
 * Merge the validated findings into the final results
 */
function mergeValidatedFindings(aiAnalysisResults, validationResults) {
  const mergedFindings = [];
  
  // Process validated findings
  if (validationResults.validatedFindings) {
    for (const validatedFinding of validationResults.validatedFindings) {
      if (validatedFinding.validationResult === "CONFIRM") {
        // Add confirmed finding as-is
        mergedFindings.push(validatedFinding.originalFinding);
      } else if (validatedFinding.validationResult === "MODIFY" && validatedFinding.modifiedFinding) {
        // Add the modified version
        mergedFindings.push(validatedFinding.modifiedFinding);
      }
      // Disputed findings are excluded
    }
  }
  
  // Add any missed findings
  if (validationResults.missedFindings) {
    mergedFindings.push(...validationResults.missedFindings);
  }
  
  // If no findings passed validation, return the original findings
  if (mergedFindings.length === 0) {
    return aiAnalysisResults;
  }
  
  // Return merged results
  return {
    ...aiAnalysisResults,
    findings: mergedFindings
  };
}