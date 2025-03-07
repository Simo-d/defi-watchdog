// Smart Contract AI Audit System
// This system uses AI to analyze smart contract code and identify security vulnerabilities
import config from './config';
import { getContractSource, getContractInfo, getEtherscanUrl } from './etherscan';
import connectToDatabase from './database';
import AuditReport from '../models/AuditReport';
import { multiAIAudit, adaptMultiAIResults } from './multi-ai-audit';

// Configuration for AI models
const AI_CONFIG = {
  primary: {
    model: config.ai.openai.model,
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  },
  secondary: {
    model: config.ai.openai.fallbackModel,
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  }
};

// Common vulnerability patterns to check
const VULNERABILITY_PATTERNS = {
  reentrancy: {
    pattern: /(\bexternal\b.*?\bcall\b.*?{[^}]*?\bbalance\b)|(\bexternal\b.*?\bcall\b.*?{[^}]*?\btransfer\b)/i,
    description: "Potential reentrancy vulnerability detected. The contract may call external contracts before state changes."
  },
  txOrigin: {
    pattern: /tx\.origin/i,
    description: "Usage of tx.origin for authorization. This is unsafe as it can lead to phishing attacks."
  },
  uncheckedReturn: {
    pattern: /\.call\{[^}]*\}\([^;]*\)[^;]*;(?![^;]*require)/i,
    description: "Unchecked return value from low-level call. Always check return values from external calls."
  },
  unsafeArithmetic: {
    pattern: /(?<!\busing\s+SafeMath\b)(\b\w+\s*\+=|\b\w+\s*\-=|\b\w+\s*\*=|\b\w+\s*\/=)/i,
    description: "Possible integer overflow/underflow. Consider using SafeMath or Solidity 0.8+ for checked arithmetic."
  },
  timestampDependence: {
    pattern: /block\.timestamp|now/i,
    description: "Timestamp dependence detected. Miners can manipulate timestamps slightly."
  },
  assemblyUsage: {
    pattern: /assembly\s*{/i,
    description: "Assembly code used. This requires careful auditing as it bypasses Solidity safety features."
  },
  delegatecall: {
    pattern: /\.delegatecall/i,
    description: "Usage of delegatecall. This is a powerful feature that can be dangerous if misused."
  },
  selfdestruct: {
    pattern: /selfdestruct|suicide/i,
    description: "Contract can self-destruct. Ensure proper access controls around this functionality."
  }
};

// Risk severity levels
const RISK_LEVELS = {
  CRITICAL: {
    name: "Critical",
    description: "Severe vulnerabilities that will likely lead to loss of funds or contract control",
    score: 10
  },
  HIGH: {
    name: "High",
    description: "Serious vulnerabilities that could lead to loss of funds or contract control",
    score: 7
  },
  MEDIUM: {
    name: "Medium",
    description: "Vulnerabilities that could cause contract malfunction or limited impact issues",
    score: 4
  },
  LOW: {
    name: "Low",
    description: "Issues that don't pose immediate risk but should be addressed",
    score: 1
  },
  INFO: {
    name: "Informational",
    description: "Best practice suggestions and informational findings",
    score: 0
  }
};

/**
 * Main audit function that orchestrates the entire analysis process
 */
async function auditSmartContract(address, network = 'mainnet', options = {}) {
  console.log(`Starting audit for contract: ${address} on ${network}`);
  const startTime = Date.now();
  
  try {
    // 1. Fetch contract source code from blockchain explorer
    const contractData = await getContractSource(address, network);
    const contractInfo = await getContractInfo(address, network);
    
    if (!contractData.sourceCode || contractData.sourceCode === '') {
      console.warn('Contract source code not verified or available');
      return {
        success: false,
        address,
        network,
        contractName: `Contract-${address.slice(0, 8)}`,
        contractType: "Unverified Contract",
        compiler: "Unknown",
        analysis: {
          contractType: "Unverified Contract",
          overview: "Contract source code is not verified or available",
          keyFeatures: [],
          implementationDetails: {},
          risks: [],
          securityConsiderations: {},
          securityScore: 0,
          riskLevel: "Unknown",
          explanation: "This contract does not have verified source code available. Consider using a verified contract or verify this contract on the blockchain explorer.",
          codeQuality: {}
        },
        securityScore: 0,
        riskyCodeSnippets: [],
        riskLevel: "Unknown", 
        isSafe: false,
        analysisTime: "0s",
        error: "Contract source code not verified or available",
        timestamp: new Date().toISOString()
      };
    }
    
    // 2. Parse the contract and extract key components
    const contractMetadata = parseContractMetadata(contractData, contractInfo);
    
    // 3. Perform initial static analysis
    const staticAnalysisResults = performStaticAnalysis(contractData.sourceCode);
    
    // 4. Run AI-powered analysis using either traditional or multi-AI approach
    let aiAnalysisResults;
    let validatedResults;

    if (options.useMultiAI) {
      console.log("Using multi-AI analysis system...");
      try {
        // Call the multi-AI analysis with reconciliation
        const multiAIResults = await multiAIAudit(contractData.sourceCode, contractMetadata.name, true);
        
        // Map the multi-AI result format to our existing format
        aiAnalysisResults = adaptMultiAIResults(multiAIResults);
        validatedResults = aiAnalysisResults; // No need for additional validation
      } catch (error) {
        console.error("Multi-AI analysis failed, falling back to traditional pipeline:", error);
        // Continue with the traditional pipeline
        aiAnalysisResults = await performAIAnalysis(contractData, contractMetadata, staticAnalysisResults);
        validatedResults = await validateFindings(contractData, aiAnalysisResults);
      }
    } else {
      // Traditional analysis pipeline
      aiAnalysisResults = await performAIAnalysis(contractData, contractMetadata, staticAnalysisResults);
      validatedResults = await validateFindings(contractData, aiAnalysisResults);
    }
    
    // 6. Generate comprehensive report
    const securityScore = calculateSecurityScore(validatedResults);
    const report = generateAuditReport(contractMetadata, validatedResults, securityScore);
    
    const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // 7. Return the final audit results
    return {
      success: true,
      address,
      network,
      contractName: contractMetadata.name,
      contractType: contractMetadata.type,
      compiler: contractMetadata.compiler,
      analysis: report,
      securityScore,
      riskyCodeSnippets: extractRiskyCodeSnippets(contractData.sourceCode, validatedResults),
      riskLevel: determineOverallRiskLevel(securityScore),
      isSafe: securityScore > 80,
      analysisTime: `${analysisTime}s`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Audit failed:", error);
    return {
      success: false,
      address,
      network,
      contractName: `Contract-${address.slice(0, 8)}`,
      contractType: "Unknown",
      compiler: "Unknown",
      analysis: {
        contractType: "Unknown",
        overview: "Could not analyze contract",
        keyFeatures: [],
        implementationDetails: {},
        risks: [],
        securityConsiderations: {},
        securityScore: 0,
        riskLevel: "Unknown",
        explanation: "An error occurred during analysis: " + error.message,
        codeQuality: {}
      },
      securityScore: 0,
      riskyCodeSnippets: [],
      riskLevel: "Unknown",
      isSafe: false,
      analysisTime: "0s",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Parse contract metadata from the fetched source code
 */
function parseContractMetadata(contractData, contractInfo) {
  // Extract basic contract information
  const name = contractData.contractName || `Contract-${contractData.address.slice(0, 8)}`;
  const compiler = contractData.compiler || 'Unknown';
  
  // Try to determine contract type based on implemented interfaces and patterns
  let contractType = determineContractType(contractData.sourceCode);
  
  return {
    name,
    address: contractData.address,
    compiler,
    type: contractType,
    creationDate: contractInfo.createdAt || null,
    creator: contractInfo.creator || null,
    verificationDate: contractData.verifiedAt || null,
    isProxy: contractData.isProxy || false
  };
}

/**
 * Determine the contract type based on implemented interfaces and code patterns
 */
function determineContractType(sourceCode) {
  // Check for common contract types based on interface implementations
  if (sourceCode.includes("IERC20") || sourceCode.includes("ERC20") || 
      sourceCode.match(/function\s+transfer\s*\(\s*address\s+.*,\s*uint/)) {
    return "ERC20 Token";
  }
  
  if (sourceCode.includes("IERC721") || sourceCode.includes("ERC721") ||
      sourceCode.match(/function\s+ownerOf\s*\(\s*uint/)) {
    return "ERC721 NFT";
  }
  
  if (sourceCode.includes("IERC1155") || sourceCode.includes("ERC1155")) {
    return "ERC1155 Multi-Token";
  }
  
  if (sourceCode.includes("swap") && (sourceCode.includes("pair") || sourceCode.includes("router"))) {
    return "DEX / AMM";
  }
  
  if (sourceCode.includes("borrow") && sourceCode.includes("collateral")) {
    return "Lending Protocol";
  }
  
  if (sourceCode.includes("stake") || sourceCode.includes("reward")) {
    return "Staking / Yield";
  }
  
  if (sourceCode.includes("governance") || sourceCode.includes("proposal") || sourceCode.includes("vote")) {
    return "Governance";
  }
  
  if (sourceCode.includes("proxy") || sourceCode.includes("implementation") || sourceCode.includes("delegatecall")) {
    return "Proxy / Upgradeable";
  }
  
  return "Custom Contract";
}

/**
 * Perform static analysis on the contract code
 */
function performStaticAnalysis(sourceCode) {
  const findings = [];
  
  // Check for known vulnerability patterns
  for (const [vulnType, vulnInfo] of Object.entries(VULNERABILITY_PATTERNS)) {
    const matches = sourceCode.match(vulnInfo.pattern);
    if (matches) {
      findings.push({
        type: vulnType,
        description: vulnInfo.description,
        severity: determineSeverity(vulnType),
        lineNumbers: findLineNumbers(sourceCode, matches),
        confidence: "Medium"
      });
    }
  }
  
  // Check for other security indicators
  const hasOwner = sourceCode.includes("owner") || sourceCode.includes("Ownable");
  const hasAccessControl = sourceCode.includes("AccessControl") || sourceCode.includes("onlyOwner") || sourceCode.includes("onlyRole");
  const hasOpenZeppelin = sourceCode.includes("@openzeppelin");
  const hasSelfDestruct = sourceCode.includes("selfdestruct") || sourceCode.includes("suicide");
  
  // Add general observations
  findings.push({
    type: "generalObservation",
    description: `Contract ${hasOwner ? "has" : "does not have"} owner functionality`,
    severity: "INFO",
    confidence: "High"
  });
  
  if (hasAccessControl) {
    findings.push({
      type: "generalObservation",
      description: "Contract implements access control mechanisms",
      severity: "INFO",
      confidence: "High"
    });
  }
  
  if (hasOpenZeppelin) {
    findings.push({
      type: "generalObservation",
      description: "Contract uses OpenZeppelin libraries which is a good security practice",
      severity: "INFO",
      confidence: "High"
    });
  }
  
  if (hasSelfDestruct) {
    findings.push({
      type: "securityIssue",
      description: "Contract can be self-destructed. Ensure proper access controls.",
      severity: "MEDIUM",
      confidence: "High"
    });
  }
  
  return findings;
}

/**
 * Helper to determine severity based on vulnerability type
 */
function determineSeverity(vulnType) {
  const severityMap = {
    reentrancy: "HIGH",
    txOrigin: "MEDIUM",
    uncheckedReturn: "MEDIUM",
    unsafeArithmetic: "MEDIUM",
    timestampDependence: "LOW",
    assemblyUsage: "INFO",
    delegatecall: "HIGH",
    selfdestruct: "MEDIUM"
  };
  
  return severityMap[vulnType] || "INFO";
}

/**
 * Find line numbers for matched patterns
 */
function findLineNumbers(sourceCode, matches) {
  if (!matches || !matches.length) return [];
  
  const lines = sourceCode.split('\n');
  const lineNumbers = [];
  
  for (const match of matches) {
    // Find which line contains this match
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for newline
      if (charCount >= sourceCode.indexOf(match)) {
        lineNumbers.push(i + 1);
        break;
      }
    }
  }
  
  return lineNumbers;
}

/**
 * Perform AI-powered analysis on the contract code
 */
async function performAIAnalysis(contractData, contractMetadata, staticAnalysisResults) {
  try {
    // Prepare the AI prompt with the contract code and initial findings
    const prompt = generateAIPrompt(contractData, contractMetadata, staticAnalysisResults);
    
    // Try the primary AI model first
    let aiResponse;
    try {
      console.log("Attempting analysis with primary AI model...");
      aiResponse = await callAIModel(AI_CONFIG.primary, prompt);
    } catch (primaryError) {
      console.warn("Primary AI model failed:", primaryError);
      
      // Try the secondary AI model as backup
      console.log("Falling back to secondary AI model...");
      try {
        aiResponse = await callAIModel(AI_CONFIG.secondary, prompt);
      } catch (secondaryError) {
        console.error("Secondary AI model also failed:", secondaryError);
        throw new Error("All AI models failed");
      }
    }
    
    // Parse the AI response to extract structured findings
    const aiResults = parseAIResponse(aiResponse);
    
    // If AI analysis had no findings, add the static analysis findings
    if (!aiResults.findings || aiResults.findings.length === 0) {
      console.log("AI analysis returned no findings, using static analysis findings");
      aiResults.findings = staticAnalysisResults.map(finding => ({
        title: finding.type,
        description: finding.description,
        severity: finding.severity,
        impact: "Potential security issue detected by static analysis",
        recommendation: "Review code related to this pattern"
      }));
    }
    
    return aiResults;
  } catch (error) {
    console.error("AI analysis failed:", error);
    
    // Create a meaningful report from static analysis as fallback
    return createStaticAnalysisReport(staticAnalysisResults, contractMetadata.type);
  }
}

function createStaticAnalysisReport(staticAnalysisResults, contractType) {
  // Convert static findings to structured format
  const structuredFindings = staticAnalysisResults.map(finding => ({
    title: finding.type,
    description: finding.description,
    severity: finding.severity,
    impact: "Potential security issue detected by static analysis",
    recommendation: "Review code related to this pattern"
  }));
  
  // Count findings by severity
  const severityCounts = {
    CRITICAL: structuredFindings.filter(f => f.severity === "CRITICAL").length,
    HIGH: structuredFindings.filter(f => f.severity === "HIGH").length,
    MEDIUM: structuredFindings.filter(f => f.severity === "MEDIUM").length,
    LOW: structuredFindings.filter(f => f.severity === "LOW").length,
    INFO: structuredFindings.filter(f => f.severity === "INFO").length
  };
  
  // Calculate a basic score based on findings
  let score = 80; // Start with a decent score
  score -= severityCounts.CRITICAL * 15;
  score -= severityCounts.HIGH * 10;
  score -= severityCounts.MEDIUM * 5;
  score -= severityCounts.LOW * 2;
  score = Math.max(30, Math.min(score, 90)); // Keep between 30 and 90
  
  return {
    findings: structuredFindings,
    overallAssessment: `This is a ${contractType} contract that has been analyzed using static analysis only. AI-powered analysis was unavailable.`,
    securityScore: score,
    contractType: contractType,
    findingCounts: {
      critical: severityCounts.CRITICAL,
      high: severityCounts.HIGH,
      medium: severityCounts.MEDIUM,
      low: severityCounts.LOW,
      info: severityCounts.INFO
    }
  };
}

/**
 * Generate a comprehensive prompt for the AI model
 */
function generateAIPrompt(contractData, contractMetadata, staticAnalysisResults) {
  return `
    I need you to analyze this Ethereum smart contract and identify any security vulnerabilities, design issues, or best practice violations. 
    Here's the contract metadata:
    - Name: ${contractMetadata.name}
    - Address: ${contractMetadata.address}
    - Compiler: ${contractMetadata.compiler}
    - Type: ${contractMetadata.type}
    
    Initial static analysis found these potential issues:
    ${JSON.stringify(staticAnalysisResults, null, 2)}
    
    Here's the contract source code:
    \`\`\`solidity
    ${contractData.sourceCode}
    \`\`\`
    
    Please analyze this code thoroughly and identify any:
    1. Security vulnerabilities (e.g., reentrancy, integer overflow/underflow, access control issues)
    2. Gas optimization opportunities
    3. Logic errors or bugs
    4. Centralization risks
    5. Code quality issues
    
    For each finding:
    - Describe the issue
    - Rate its severity (Critical, High, Medium, Low, Informational)
    - Explain the potential impact
    - Provide the relevant code snippet
    - Suggest a fix
    
    Also provide an overall assessment of the contract's security and a score from 0-100.
    
    Format your response as structured JSON with these fields:
    {
      "findings": [
        {
          "title": "Finding title",
          "description": "Detailed description",
          "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
          "impact": "Impact description",
          "codeSnippet": "Relevant code",
          "lineNumbers": [line numbers if identifiable],
          "recommendation": "How to fix"
        }
      ],
      "overallAssessment": "Overall security assessment",
      "securityScore": 85,
      "contractType": "More specific contract type if identifiable"
    }
  `;
}

/**
 * Call an AI model with the provided prompt
 */
async function callAIModel(aiConfig, prompt) {
  try {
    console.log(`Calling AI API: ${aiConfig.endpoint}`);
    
    // Check if API key is available
    if (!aiConfig.apiKey) {
      console.warn(`No API key provided for ${aiConfig.endpoint}`);
      throw new Error("Missing API key");
    }
    
    // Check if prompt is too long (rough estimate)
    if (prompt.length > 100000) {
      console.warn("Prompt is very long, might exceed token limits");
      // Truncate the prompt if it's too long
      prompt = prompt.substring(0, 90000) + "\n\n[Content truncated due to length]";
    }
    
    // Anthropic Claude API call
    if (aiConfig.endpoint.includes('anthropic')) {
      console.log(`Using Anthropic API with model: ${aiConfig.model}`);
      
      // Log request details for debugging (removing sensitive info)
      console.log("Request headers:", {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        // Don't log the actual API key
        "x-api-key": aiConfig.apiKey ? "[REDACTED]" : "MISSING"
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      try{
        const response = await fetch(aiConfig.endpoint, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "x-api-key": aiConfig.apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000
          })
        });
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

      
      // Handle non-OK responses
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorBody);
        
        throw new Error(`API request failed with status ${response.status}: ${errorBody.substring(0, 200)}`);
      }
      
      const data = await response.json();
      return data.content[0].text;
    } 
    // OpenAI GPT API call
    else if (aiConfig.endpoint.includes('openai')) {
      console.log(`Using OpenAI API with model: ${aiConfig.model}`);
      
      const response = await fetch(aiConfig.endpoint, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4000,
          temperature: 0.2
        })
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API request failed with status ${response.status}:`, errorBody);
        
        throw new Error(`API request failed with status ${response.status}: ${errorBody.substring(0, 200)}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    }
    
    throw new Error("Unsupported AI provider");
  } catch (error) {
    console.error("AI API call failed:", error);
    
    // Return a fallback response that won't break the application
    return JSON.stringify({
      findings: [
        {
          title: "Static Analysis Only",
          description: "AI analysis was not available. This is a static analysis only.",
          severity: "INFO",
          impact: "Limited analysis without AI capabilities",
          recommendation: "Consider checking AI API configuration or try again later."
        }
      ],
      overallAssessment: "This is a limited analysis based on static code patterns only. AI-powered analysis was unavailable.",
      securityScore: 60, // Neutral score
      contractType: "Unknown" // Will be determined by other functions
    });
  }
}

/**
 * Parse the AI response into structured findings
 */
function parseAIResponse(aiResponse) {
  try {
    // Extract JSON from the response
    const jsonMatch = aiResponse.match(/```json([\s\S]*?)```/) || 
                     aiResponse.match(/{[\s\S]*"findings"[\s\S]*}/) ||
                     aiResponse.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonContent = jsonMatch[0].replace(/```json|```/g, '');
      return JSON.parse(jsonContent);
    }
    
    // If we couldn't extract proper JSON, try to parse the text response
    return {
      findings: [
        {
          title: "AI Analysis",
          description: aiResponse.slice(0, 500) + '...',
          severity: "INFO",
          impact: "Unable to properly parse AI response",
          recommendation: "Review the AI output manually"
        }
      ],
      overallAssessment: "AI response format was not as expected",
      securityScore: 50
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return {
      findings: [
        {
          title: "AI Response Parsing Error",
          description: "Failed to parse AI response: " + error.message,
          severity: "INFO",
          impact: "Unable to use AI findings",
          recommendation: "Check AI system configuration"
        }
      ],
      overallAssessment: "Error in AI response processing",
      securityScore: 50
    };
  }
}

/**
 * Validate findings with a second AI model for consensus
 */
async function validateFindings(contractData, aiAnalysisResults) {
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
      ${contractData.sourceCode.slice(0, 10000)}${contractData.sourceCode.length > 10000 ? '...(truncated)' : ''}
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
    
    // Call the secondary AI model
    const validationResponse = await callAIModel(AI_CONFIG.secondary, validationPrompt);
    
    // Parse the validation response
    const validationResults = parseValidationResponse(validationResponse);
    
    // Merge the validated findings into the final results
    return mergeValidatedFindings(aiAnalysisResults, validationResults);
  } catch (error) {
    console.error("Validation failed:", error);
    // Return original findings if validation fails
    return aiAnalysisResults;
  }
}

/**
 * Parse the validation response from the second AI model
 */
function parseValidationResponse(validationResponse) {
  try {
    // Extract JSON from the response
    const jsonMatch = validationResponse.match(/```json([\s\S]*?)```/) || 
                     validationResponse.match(/{[\s\S]*"validatedFindings"[\s\S]*}/) ||
                     validationResponse.match(/{[\s\S]*}/);
    
    if (jsonMatch) {
      const jsonContent = jsonMatch[0].replace(/```json|```/g, '');
      return JSON.parse(jsonContent);
    }
    
    // Default response if proper JSON couldn't be extracted
    return {
      validatedFindings: [],
      missedFindings: []
    };
  } catch (error) {
    console.error("Failed to parse validation response:", error);
    return {
      validatedFindings: [],
      missedFindings: []
    };
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

/**
 * Calculate an overall security score based on findings
 */
function calculateSecurityScore(analysisResults) {
  // Start with a perfect score
  let score = 100;
  
  // Deduct points based on finding severity
  for (const finding of analysisResults.findings || []) {
    const severityDeduction = {
      "CRITICAL": 20,
      "HIGH": 10,
      "MEDIUM": 5,
      "LOW": 2,
      "INFO": 0
    };
    
    score -= severityDeduction[finding.severity] || 0;
  }
  
  // Use the AI-provided score if available and within reason
  if (analysisResults.securityScore !== undefined) {
    // Take the average between our calculated score and the AI score
    score = Math.round((score + analysisResults.securityScore) / 2);
  }
  
  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine the overall risk level based on security score
 */
/**
 * Determine the overall risk level based on security score
 */
function determineOverallRiskLevel(securityScore) {
    if (securityScore >= 90) return "Safe";
    if (securityScore >= 75) return "Low Risk";
    if (securityScore >= 60) return "Medium Risk";
    return "High Risk";
  }
  
  /**
   * Extract risky code snippets for highlighting in the UI
   */
  function extractRiskyCodeSnippets(sourceCode, validatedResults) {
    const snippets = [];
    const lines = sourceCode.split('\n');
    
    // Extract high and critical severity findings for code snippets
    for (const finding of validatedResults.findings || []) {
      if (["CRITICAL", "HIGH", "MEDIUM"].includes(finding.severity) && finding.codeSnippet) {
        snippets.push({
          title: finding.title,
          code: finding.codeSnippet,
          explanation: finding.description,
          lineNumbers: finding.lineNumbers || []
        });
      } else if (["CRITICAL", "HIGH", "MEDIUM"].includes(finding.severity) && finding.lineNumbers) {
        // If we have line numbers but no snippet, extract from source
        const relevantLines = finding.lineNumbers.map(lineNum => {
          const startLine = Math.max(0, lineNum - 2);
          const endLine = Math.min(lines.length - 1, lineNum + 2);
          return lines.slice(startLine, endLine + 1).join('\n');
        }).join('\n...\n');
        
        if (relevantLines) {
          snippets.push({
            title: finding.title,
            code: relevantLines,
            explanation: finding.description,
            lineNumbers: finding.lineNumbers
          });
        }
      }
    }
    
    return snippets;
  }
  
  /**
   * Generate the final audit report
   */
  function generateAuditReport(contractMetadata, validatedResults, securityScore) {
    // Group findings by severity
    const findingsBySeverity = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
      INFO: []
    };
    
    for (const finding of validatedResults.findings || []) {
      if (findingsBySeverity[finding.severity]) {
        findingsBySeverity[finding.severity].push(finding);
      } else {
        findingsBySeverity.INFO.push(finding);
      }
    }
    
    // Count findings by severity
    const findingCounts = {
      critical: findingsBySeverity.CRITICAL.length,
      high: findingsBySeverity.HIGH.length,
      medium: findingsBySeverity.MEDIUM.length,
      low: findingsBySeverity.LOW.length,
      info: findingsBySeverity.INFO.length
    };
    
    // Determine key features based on contract type
    const keyFeatures = determineKeyFeatures(contractMetadata.type, validatedResults);
    
    // Create implementation details
    const implementationDetails = {
      standard: determineStandard(contractMetadata.type, validatedResults),
      extensions: determineExtensions(validatedResults),
      patternUsage: determinePatternsUsed(validatedResults),
      accessControl: determineAccessControl(validatedResults),
      upgradeability: determineUpgradeability(validatedResults)
    };
    
    // Generate the overall risk level
    const riskLevel = determineOverallRiskLevel(securityScore);
    
    // Format findings for the report
    const formattedFindings = Object.entries(findingsBySeverity)
      .filter(([_, findings]) => findings.length > 0)
      .map(([severity, findings]) => {
        return findings.map(finding => ({
          severity,
          description: finding.description,
          codeReference: finding.codeSnippet ? "Affected code identified" : "See full report",
          impact: finding.impact || "Could affect contract operations",
          recommendation: finding.recommendation || "Review and fix the issue"
        }));
      })
      .flat();
    
    // Gather security considerations
    const securityConsiderations = extractSecurityConsiderations(validatedResults);
    
    // Assess code quality
    const codeQuality = assessCodeQuality(validatedResults);
    
    // Create the final report structure
    return {
      overview: validatedResults.overallAssessment || 
                `This ${contractMetadata.type} contract has been analyzed and shows ${riskLevel.toLowerCase()} security risk with a score of ${securityScore}/100.`,
      contractType: contractMetadata.type,
      keyFeatures,
      implementationDetails,
      risks: formattedFindings,
      securityConsiderations,
      securityScore,
      riskLevel,
      explanation: validatedResults.overallAssessment || 
                  `This contract implements ${implementationDetails.standard} with ${formattedFindings.length} identified issues. ${securityScore >= 80 ? 'The contract generally follows best practices.' : 'There are several issues that should be addressed.'}`,
      codeQuality,
      findingCounts
    };
  }
  
  /**
   * Determine key features based on contract type and findings
   */
  function determineKeyFeatures(contractType, validatedResults) {
    // Default features based on contract type
    const defaultFeatures = {
      "ERC20 Token": [
        "Token transfers and approvals",
        "Balance tracking per address",
        "Allowance mechanism for delegated spending"
      ],
      "ERC721 NFT": [
        "NFT minting, transferring, and burning",
        "Token metadata management",
        "Ownership tracking per token ID"
      ],
      "DEX / AMM": [
        "Token swapping with price discovery",
        "Liquidity provision and withdrawal",
        "Fee collection mechanism"
      ],
      "Lending Protocol": [
        "Asset deposits and withdrawals",
        "Collateralized borrowing",
        "Interest accrual mechanisms"
      ],
      "Staking / Yield": [
        "Token staking",
        "Reward distribution",
        "Locking periods"
      ],
      "Governance": [
        "Proposal creation and voting",
        "Execution of passed proposals",
        "Voting power calculation"
      ],
      "Custom Contract": [
        "Custom token functionality",
        "Application-specific logic"
      ]
    };
    
    // Start with default features for the contract type
    let features = defaultFeatures[contractType] || defaultFeatures["Custom Contract"];
    
    // Add additional features based on findings
    if (validatedResults.findings) {
      for (const finding of validatedResults.findings) {
        if (finding.severity === "INFO" && finding.description.includes("feature")) {
          const featureMatch = finding.description.match(/feature: ([^\.]+)/);
          if (featureMatch && featureMatch[1] && !features.includes(featureMatch[1])) {
            features.push(featureMatch[1]);
          }
        }
      }
    }
    
    return features;
  }
  
  /**
   * Determine the standard implemented by the contract
   */
  function determineStandard(contractType, validatedResults) {
    const standardMap = {
      "ERC20 Token": "ERC20",
      "ERC721 NFT": "ERC721",
      "ERC1155 Multi-Token": "ERC1155",
      "DEX / AMM": "Custom AMM",
      "Lending Protocol": "Custom lending implementation",
      "Staking / Yield": "Custom staking protocol",
      "Governance": "Custom governance mechanism",
      "Proxy / Upgradeable": "Proxy pattern"
    };
    
    return standardMap[contractType] || "Custom implementation";
  }
  
  /**
   * Determine extensions used in the contract
   */
  function determineExtensions(validatedResults) {
    const extensions = [];
    
    // Check findings for mentions of extensions
    if (validatedResults.findings) {
      for (const finding of validatedResults.findings) {
        if (finding.severity === "INFO") {
          // Look for OpenZeppelin extensions
          const ozMatch = finding.description.match(/uses\s+OpenZeppelin['s]*\s+([A-Za-z0-9]+)/i);
          if (ozMatch && ozMatch[1] && !extensions.includes(ozMatch[1])) {
            extensions.push(ozMatch[1]);
          }
          
          // Look for other extensions
          const extMatch = finding.description.match(/implements\s+([A-Za-z0-9]+)\s+extension/i);
          if (extMatch && extMatch[1] && !extensions.includes(extMatch[1])) {
            extensions.push(extMatch[1]);
          }
        }
      }
    }
    
    return extensions.length > 0 ? extensions : ["No extensions identified"];
  }
  
  /**
   * Determine patterns used in the contract
   */
  function determinePatternsUsed(validatedResults) {
    // Default to a generic description
    let patternUsage = "Uses standard implementation patterns with some customizations.";
    
    // Check findings for mentions of patterns
    if (validatedResults.findings) {
      for (const finding of validatedResults.findings) {
        if (finding.severity === "INFO" && finding.description.includes("pattern")) {
          const patternMatch = finding.description.match(/uses\s+([^\.\,]+)\s+pattern/i);
          if (patternMatch && patternMatch[1]) {
            patternUsage = `Uses ${patternMatch[1]} pattern with custom functionality.`;
            break;
          }
        }
      }
    }
    
    return patternUsage;
  }
  
  /**
   * Determine access control mechanisms used in the contract
   */
  function determineAccessControl(validatedResults) {
    let accessControl = "Undetermined access control mechanism.";
    
    // Look for mentions of access control in findings
    if (validatedResults.findings) {
      for (const finding of validatedResults.findings) {
        if (finding.description.includes("access control") || 
            finding.description.includes("permission") ||
            finding.description.includes("authorization")) {
          
          if (finding.description.includes("role-based")) {
            accessControl = "Role-based access control for administrative functions.";
            break;
          } else if (finding.description.includes("ownable") || finding.description.includes("onlyOwner")) {
            accessControl = "Owner-controlled contract with privileged functions.";
            break;
          } else if (finding.description.includes("governance")) {
            accessControl = "Governance-controlled with voting mechanism for changes.";
            break;
          }
        }
      }
    }
    
    return accessControl;
  }
  
  /**
   * Determine if the contract is upgradeable
   */
  function determineUpgradeability(validatedResults) {
    let upgradeability = "Non-upgradeable contract with fixed implementation.";
    
    // Look for mentions of upgradeability in findings
    if (validatedResults.findings) {
      for (const finding of validatedResults.findings) {
        if (finding.description.includes("proxy") || 
            finding.description.includes("upgrade") ||
            finding.description.includes("implementation")) {
          
          if (finding.description.includes("transparent proxy")) {
            upgradeability = "Upgradeable using transparent proxy pattern.";
            break;
          } else if (finding.description.includes("UUPS")) {
            upgradeability = "Upgradeable using UUPS (Universal Upgradeable Proxy Standard).";
            break;
          } else if (finding.description.includes("beacon proxy")) {
            upgradeability = "Upgradeable using beacon proxy pattern.";
            break;
          } else if (finding.description.includes("proxy")) {
            upgradeability = "Upgradeable using proxy pattern.";
            break;
          }
        }
      }
    }
    
    return upgradeability;
  }
  
  /**
   * Extract security considerations from the findings
   */
  function extractSecurityConsiderations(validatedResults) {
    // Default security considerations
    const considerations = {
      transferMechanisms: "Standard transfer implementations.",
      reentrancyProtection: "No specific reentrancy protections noted.",
      arithmeticSafety: "Standard arithmetic operations.",
      accessControls: "Basic access controls implemented."
    };
    
    // Update based on findings
    if (validatedResults.findings) {
      for (const finding of validatedResults.findings) {
        if (finding.description.includes("reentrancy")) {
          considerations.reentrancyProtection = finding.severity === "CRITICAL" || finding.severity === "HIGH"
            ? "Vulnerable to reentrancy attacks."
            : "Implements nonReentrant modifiers on critical functions.";
        }
        
        if (finding.description.includes("overflow") || finding.description.includes("underflow")) {
          considerations.arithmeticSafety = finding.severity === "CRITICAL" || finding.severity === "HIGH"
            ? "Vulnerable to arithmetic overflow/underflow."
            : "Uses SafeMath or Solidity 0.8+ for overflow protection.";
        }
        
        if (finding.description.includes("access control")) {
          considerations.accessControls = finding.severity === "CRITICAL" || finding.severity === "HIGH"
            ? "Insufficient access controls for critical functions."
            : "Proper access controls with role-based permissions.";
        }
      }
    }
    
    return considerations;
  }
  
  /**
   * Assess code quality based on findings
   */
  function assessCodeQuality(validatedResults) {
    // Default quality assessment
    const quality = {
      readability: "Medium",
      modularity: "Medium",
      testCoverage: "Unknown",
      documentation: "Limited"
    };
    
    // Update based on findings
    if (validatedResults.findings) {
      let codeQualityIssues = 0;
      let documentationIssues = 0;
      
      for (const finding of validatedResults.findings) {
        if (finding.description.includes("code quality") || 
            finding.description.includes("readability") ||
            finding.description.includes("maintainability")) {
          codeQualityIssues++;
        }
        
        if (finding.description.includes("documentation") || 
            finding.description.includes("comment") ||
            finding.description.includes("NatSpec")) {
          documentationIssues++;
        }
      }
      
      // Update readability based on issues found
      if (codeQualityIssues === 0) {
        quality.readability = "High";
        quality.modularity = "Good";
      } else if (codeQualityIssues > 3) {
        quality.readability = "Low";
        quality.modularity = "Poor";
      }
      
      // Update documentation assessment
      if (documentationIssues === 0) {
        quality.documentation = "Well-documented with NatSpec comments";
      } else if (documentationIssues > 3) {
        quality.documentation = "Poorly documented, lacking necessary comments";
      } else {
        quality.documentation = "Partially documented with some comments";
      }
    }
    
    return quality;
  }
  
  // Export all necessary functions
  export {
    auditSmartContract,
    determineOverallRiskLevel,
    extractRiskyCodeSnippets
  };