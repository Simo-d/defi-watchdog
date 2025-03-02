// src/lib/openai.js
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes smart contract code using OpenAI API
 * @param {string} sourceCode - The contract source code
 * @param {string} contractName - The name of the contract
 * @returns {Promise<object>} The analysis results
 */
export async function analyzeSmartContract(sourceCode, contractName) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please check your .env.local file.');
  }
  
  try {
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
            "severity": "Critical|High|Medium|Low|None",
            "description": "Description of the risk",
            "codeReference": "The relevant code snippet or function name"
          }
        ],
        "securityScore": 1-100 (higher is safer),
        "riskLevel": "Safe|Medium Risk|High Risk",
        "explanation": "Explanation of the overall assessment"
      }
    `;

    // Define the user message with the contract code
    const userMessage = `
      Please analyze this ${contractName} smart contract:

      \`\`\`solidity
      ${sourceCode}
      \`\`\`
    `;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Can also use gpt-3.5-turbo for lower cost
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1, // Low temperature for more deterministic responses
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    // Parse the JSON response
    const analysisText = response.choices[0].message.content;
    const analysis = JSON.parse(analysisText);

    return {
      ...analysis,
      rawSourceCode: sourceCode,
    };
  } catch (error) {
    console.error("Error analyzing contract:", error);
    throw new Error("Failed to analyze smart contract code: " + error.message);
  }
}

/**
 * Extracts a simple summary from the contract for display purposes
 * @param {string} sourceCode - The contract source code
 * @returns {Promise<string>} A simple explanation of the contract
 */
export async function getContractSummary(sourceCode) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please check your .env.local file.');
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use cheaper model for simple summarization
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that explains smart contracts in simple terms."
        },
        { 
          role: "user", 
          content: `Summarize what this smart contract does in 2-3 sentences, in very simple terms for non-technical users:\n\n${sourceCode}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error summarizing contract:", error);
    return "Could not generate summary for this contract.";
  }
}

/**
 * Extracts highlighted risk sections from the contract code
 * @param {string} sourceCode - The contract source code
 * @param {Array} risks - The risks identified in the analysis
 * @returns {Promise<Array>} Code snippets with context
 */
export async function highlightRiskyCode(sourceCode, risks) {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }
  
  if (!risks || risks.length === 0 || risks[0].severity === "None") {
    return [];
  }

  try {
    const significantRisks = risks.filter(risk => 
      ["Critical", "High", "Medium"].includes(risk.severity)
    );
    
    if (significantRisks.length === 0) return [];

    const risksText = significantRisks.map(r => 
      `${r.severity}: ${r.description} (${r.codeReference})`
    ).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Extract relevant code snippets that show identified risks in a smart contract."
        },
        { 
          role: "user", 
          content: `
            Based on the following risks found in a smart contract:
            ${risksText}
            
            Extract up to 3 of the most important code snippets from this contract that clearly demonstrate these risks.
            Return results as a JSON array of objects with "title", "code", and "explanation" fields.
            
            Contract code:
            ${sourceCode}
          `
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.snippets || [];
  } catch (error) {
    console.error("Error highlighting risky code:", error);
    return [];
  }
}
