// src/lib/multi-ai-audit.js
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import config from './config';

const execAsync = promisify(exec);

// Initialize API clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use enabledModels from config for HuggingFace
const huggingface = process.env.HUGGINGFACE_API_KEY 
  ? new HfInference(process.env.HUGGINGFACE_API_KEY)
  : null;

/**
 * Analyze a smart contract using multiple AI models and tools
 * @param {string} sourceCode - The contract source code
 * @param {string} contractName - The name of the contract
 * @param {boolean} useTools - Whether to use external security tools
 * @returns {Promise<object>} Consolidated analysis results
 */
export async function multiAIAudit(sourceCode, contractName, useTools = true) {
  try {
    console.log("Starting multi-AI audit for", contractName);
    
    // Check if multiAiConsensus feature is enabled in config
    const useMultiAI = config.features.multiAiConsensus;
    if (!useMultiAI) {
      console.log("Multi-AI consensus disabled in config, running single AI analysis");
      const analysis = await analyzeWithOpenAI(sourceCode, contractName);
      return {
        overview: analysis.overview || "Analysis performed with a single AI model",
        contractType: analysis.contractType || "Unknown",
        keyFeatures: analysis.keyFeatures || [],
        analysisDiscussion: "Single AI analysis performed due to configuration settings",
        consolidatedRisks: analysis.risks || [],
        securityScore: analysis.securityScore || 50,
        riskLevel: analysis.riskLevel || "Unknown",
        explanation: analysis.explanation || "Analysis performed with a single AI model"
      };
    }
    
    // Step 1: Run parallel analyses from different AI models and tools
    const analysisPromises = [
      analyzeWithOpenAI(sourceCode, contractName),
    ];

    // Add Deepseek analysis if HuggingFace API key is available and model is enabled
    if (huggingface && config.ai.huggingface.enabledModels.includes('deepseek-ai/deepseek-coder-33b-instruct')) {
      analysisPromises.push(
        analyzeWithDeepseek(sourceCode, contractName).catch(err => ({
          source: 'Deepseek',
          error: err.message,
          risks: []
        }))
      );
    }

    // Add Mistral analysis if enabled
    if (huggingface && config.ai.huggingface.enabledModels.includes('mistralai/Mistral-7B-Instruct-v0.2')) {
      analysisPromises.push(
        analyzeWithMistral(sourceCode, contractName).catch(err => ({
          source: 'Mistral',
          error: err.message,
          risks: []
        }))
      );
    }

    // Add tool-based analyses if requested and enabled in config
    if (useTools && config.analysis.enableTools) {
      try {
        // Check if slither is installed
        await execAsync('slither --version');
        analysisPromises.push(
          analyzeWithSlither(sourceCode).catch(err => ({
            source: 'Slither',
            error: err.message,
            risks: []
          }))
        );
      } catch (err) {
        console.warn("Slither not installed, skipping slither analysis");
      }

      try {
        // Check if mythril is installed
        await execAsync('myth version');
        analysisPromises.push(
          analyzeWithMythril(sourceCode).catch(err => ({
            source: 'Mythril',
            error: err.message,
            risks: []
          }))
        );
      } catch (err) {
        console.warn("Mythril not installed, skipping mythril analysis");
      }
    }

    // Execute all analyses in parallel
    const analysisResults = await Promise.all(analysisPromises);
    console.log(`Completed ${analysisResults.length} analyses`);

    // Step 2: Have the AIs discuss and reconcile their findings
    const consolidatedAnalysis = await reconcileAnalyses(analysisResults, sourceCode);

    return consolidatedAnalysis;
  } catch (error) {
    console.error("Error in multi-AI audit:", error);
    throw new Error("Multi-AI audit failed: " + error.message);
  }
}

/**
 * Analyze with OpenAI (GPT-4)
 */
async function analyzeWithOpenAI(sourceCode, contractName) {
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

  // Handle large contracts by truncating if needed
  let contractCodeTruncated = sourceCode;
  if (sourceCode.length > config.analysis.maxCodeSize) {
    const halfSize = config.analysis.maxCodeSize / 2;
    contractCodeTruncated = sourceCode.substring(0, halfSize) + 
      "\n\n... [Code truncated due to size limits] ...\n\n" + 
      sourceCode.substring(sourceCode.length - halfSize);
  }

  const response = await openai.chat.completions.create({
    model: config.ai.openai.model, 
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please analyze this ${contractName} smart contract:\n\n\`\`\`solidity\n${contractCodeTruncated}\n\`\`\`` }
    ],
    temperature: config.ai.openai.temperature || 0.1,
    max_tokens: config.ai.openai.maxTokens || 4000,
    response_format: { type: "json_object" },
  });

  const analysis = JSON.parse(response.choices[0].message.content);
  return {
    source: 'OpenAI',
    ...analysis
  };
}

/**
 * Analyze with Deepseek
 */
async function analyzeWithDeepseek(sourceCode, contractName) {
  try {
    if (!huggingface) {
      throw new Error("HuggingFace API key not provided");
    }

    const response = await huggingface.textGeneration({
      model: "deepseek-ai/deepseek-coder-33b-instruct",
      inputs: `<|im_start|>system
You are an expert smart contract auditor. Analyze the following ${contractName} contract for security vulnerabilities.
Focus on: reentrancy, arithmetic issues, access control, front-running, and any custom vulnerabilities.
Return your analysis in JSON format with fields: overview, contractType, risks (array with severity, title, description, codeReference, impact, recommendation for each), securityScore (1-100), and riskLevel.
<|im_end|>
<|im_start|>user
\`\`\`solidity
${sourceCode}
\`\`\`
<|im_end|>
<|im_start|>assistant`,
      parameters: {
        max_new_tokens: 2000,
        temperature: 0.1,
      }
    });
    
    // Extract JSON from response
    const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Deepseek response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Normalize the format to match our expected structure
    const normalizedRisks = (analysis.risks || []).map(risk => ({
      ...risk,
      severity: risk.severity.toUpperCase(),
    }));

    return {
      source: 'Deepseek',
      ...analysis,
      risks: normalizedRisks
    };
  } catch (error) {
    console.error("Error analyzing with Deepseek:", error);
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
 * Analyze with Mistral
 */
async function analyzeWithMistral(sourceCode, contractName) {
  try {
    if (!huggingface) {
      throw new Error("HuggingFace API key not provided");
    }

    const response = await huggingface.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      inputs: `<s>[INST] You are an expert smart contract auditor. Analyze this ${contractName} contract for security issues:

\`\`\`solidity
${sourceCode}
\`\`\`

Provide your analysis in this JSON format:
{
  "overview": "Brief explanation of what the contract does",
  "contractType": "Main type of contract (ERC20, ERC721, etc.)",
  "risks": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "title": "Short title for the issue",
      "description": "Description of the risk",
      "codeReference": "The relevant code snippet or function name"
    }
  ],
  "securityScore": 1-100 (higher is safer),
  "riskLevel": "Safe|Low Risk|Medium Risk|High Risk",
  "explanation": "Explanation of the overall assessment"
}
[/INST]</s>`,
      parameters: {
        max_new_tokens: 2000,
        temperature: 0.1,
        return_full_text: false
      }
    });
    
    // Extract JSON from response
    const jsonMatch = response.generated_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Mistral response");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Normalize the format
    const normalizedRisks = (analysis.risks || []).map(risk => ({
      ...risk,
      severity: risk.severity.toUpperCase(),
      impact: risk.impact || "Not specified",
      recommendation: risk.recommendation || "Not provided"
    }));

    return {
      source: 'Mistral',
      ...analysis,
      risks: normalizedRisks
    };
  } catch (error) {
    console.error("Error analyzing with Mistral:", error);
    return {
      source: 'Mistral',
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
 * Analyze a smart contract using Slither
 */
async function analyzeWithSlither(sourceCode) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary directory and file
      const tempDir = path.join(os.tmpdir(), `slither-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'Contract.sol');
      fs.writeFileSync(tempFile, sourceCode);

      // Execute slither
      exec(`slither ${tempFile} --json -`, (error, stdout, stderr) => {
        // Clean up
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn("Error cleaning up temporary files:", cleanupError);
        }
        
        if (error) {
          console.warn(`Slither error: ${stderr}`);
          reject(new Error(`Slither analysis failed: ${error.message}`));
          return;
        }

        try {
          // Parse the JSON output
          const slitherOutput = JSON.parse(stdout);
          
          // Transform Slither output to our expected format
          const transformedOutput = transformSlitherOutput(slitherOutput);
          
          resolve({
            source: 'Slither',
            ...transformedOutput
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse Slither output: ${parseError.message}`));
        }
      });
    } catch (error) {
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
          codeReference: result.elements ? result.elements.map(el => el.name).join(', ') : "Unknown",
          impact: detector.impact_description || "Not specified",
          recommendation: result.recommendation || detector.confidence_description || "Review the identified issue"
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

/**
 * Analyze a smart contract using Mythril
 */
async function analyzeWithMythril(sourceCode) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary directory and file
      const tempDir = path.join(os.tmpdir(), `mythril-${uuidv4()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      const tempFile = path.join(tempDir, 'Contract.sol');
      fs.writeFileSync(tempFile, sourceCode);

      // Execute mythril
      exec(`myth analyze ${tempFile} --execution-timeout 60 --json`, (error, stdout, stderr) => {
        // Clean up
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (cleanupError) {
          console.warn("Error cleaning up temporary files:", cleanupError);
        }
        
        if (error) {
          console.warn(`Mythril error: ${stderr}`);
          reject(new Error(`Mythril analysis failed: ${error.message}`));
          return;
        }

        try {
          // Parse the JSON output
          const mythrilOutput = JSON.parse(stdout);
          
          // Transform Mythril output to our expected format
          const transformedOutput = transformMythrilOutput(mythrilOutput);
          
          resolve({
            source: 'Mythril',
            ...transformedOutput
          });
        } catch (parseError) {
          reject(new Error(`Failed to parse Mythril output: ${parseError.message}`));
        }
      });
    } catch (error) {
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

/**
 * Have the AIs discuss and reconcile their findings
 */
async function reconcileAnalyses(analysisResults, sourceCode) {
  // Format all the analyses into a structured input
  const analysesText = analysisResults.map(analysis => {
    return `Source: ${analysis.source}
Contract Type: ${analysis.contractType || "Not specified"}
Security Score: ${analysis.securityScore || "Not provided"}
Risk Level: ${analysis.riskLevel || "Not specified"}
Overview: ${analysis.overview || "Not provided"}
Explanation: ${analysis.explanation || "Not provided"}
Risks (${(analysis.risks || []).length}):
${(analysis.risks || []).map(risk => `- [${risk.severity}] ${risk.title || risk.description}: ${risk.description} (${risk.codeReference || "No reference"})`).join("\n")}
`;
  }).join("\n\n===\n\n");

  const systemPrompt = `
    You are a panel of expert smart contract auditors reviewing multiple analyses of the same contract.
    Your task is to synthesize these analyses, identify agreements and disagreements,
    eliminate false positives, and produce a consolidated report.
    
    For each identified risk:
    1. Evaluate if multiple AIs/tools agree on this risk
    2. Determine if the risk is valid by reviewing the code yourself
    3. Assess the proper severity level
    4. Provide an accurate description, impact assessment, and recommendation
    
    Disagreements between analysis sources should be addressed explicitly in your reasoning.
    The final report should only include validated vulnerabilities with proper severity ratings.
    
    Format your response in JSON with the following structure:
    {
      "overview": "Brief explanation of what the contract does",
      "contractType": "Main type of contract (ERC20, ERC721, etc.)",
      "keyFeatures": ["List of main features"],
      "analysisDiscussion": "Summary of how different sources agreed/disagreed about key issues",
      "consolidatedRisks": [
        {
          "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
          "title": "Clear title for the issue",
          "description": "Detailed description of the risk",
          "codeReference": "The relevant code snippet or function name",
          "impact": "What could happen if exploited",
          "recommendation": "How to fix this issue",
          "consensus": "How many sources identified this issue"
        }
      ],
      "securityScore": 1-100 (higher is safer),
      "riskLevel": "Safe|Low Risk|Medium Risk|High Risk",
      "explanation": "Explanation of the overall assessment"
    }
  `;

  try {
    // Truncate the source code if it's too large
    let truncatedSourceCode = sourceCode;
    const maxCodeSize = Math.min(25000, config.analysis.maxCodeSize || 25000);
    
    if (sourceCode.length > maxCodeSize) {
      truncatedSourceCode = sourceCode.substring(0, maxCodeSize / 2) + 
        "\n\n... [Code truncated due to size limits] ...\n\n" + 
        sourceCode.substring(sourceCode.length - maxCodeSize / 2);
    }

    const response = await openai.chat.completions.create({
      model: config.ai.openai.fallbackModel || "gpt-4-turbo", // Use the more capable model for reconciliation
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here are multiple analyses of a smart contract:\n\n${analysesText}\n\nThe source code being analyzed is:\n\n\`\`\`solidity\n${truncatedSourceCode}\n\`\`\`${sourceCode.length > maxCodeSize ? '\n[Source code truncated due to length]' : ''}\n\nReconcile these analyses and provide a consolidated report.` }
      ],
      temperature: 0.2,
      max_tokens: config.ai.openai.maxTokens || 4000,
      response_format: { type: "json_object" },
    });
  
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error reconciling analyses:", error);
    
    // Fallback to best individual analysis if reconciliation fails
    console.log("Falling back to best individual analysis");
    
    // Sort analyses by score (highest first) and pick the best one
    const validAnalyses = analysisResults.filter(a => !a.error && a.risks && a.risks.length > 0);
    if (validAnalyses.length === 0) {
      throw new Error("No valid analyses available");
    }
    
    const bestAnalysis = validAnalyses.sort((a, b) => (b.securityScore || 0) - (a.securityScore || 0))[0];
    
    // Convert to consolidated format
    return {
      overview: bestAnalysis.overview || "Analysis based on best individual audit result",
      contractType: bestAnalysis.contractType || "Unknown",
      keyFeatures: bestAnalysis.keyFeatures || [],
      analysisDiscussion: "Reconciliation failed, using results from " + bestAnalysis.source,
      consolidatedRisks: (bestAnalysis.risks || []).map(risk => ({
        ...risk,
        consensus: `Identified by ${bestAnalysis.source}`
      })),
      securityScore: bestAnalysis.securityScore || 50,
      riskLevel: bestAnalysis.riskLevel || "Unknown",
      explanation: bestAnalysis.explanation || `Based on analysis from ${bestAnalysis.source} as reconciliation failed.`
    };
  }
}

/**
 * Adapt the multi-AI results to match the format expected by the existing system
 */
export function adaptMultiAIResults(consolidatedResults) {
  return {
    findings: consolidatedResults.consolidatedRisks.map(risk => ({
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      impact: risk.impact,
      recommendation: risk.recommendation,
      codeReference: risk.codeReference
    })),
    overallAssessment: consolidatedResults.explanation,
    analysisDiscussion: consolidatedResults.analysisDiscussion,
    securityScore: consolidatedResults.securityScore,
    contractType: consolidatedResults.contractType,
    keyFeatures: consolidatedResults.keyFeatures || []
  };
}