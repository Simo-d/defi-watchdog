// pages/api/audit-settings.js
export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    // Return available AI models and analysis options
    return res.status(200).json({
      aiSystems: [
        {
          id: 'multi-ai',
          name: 'Multi-AI Consensus System',
          description: 'Combines multiple AI models including GPT-4, Deepseek, and Mistral along with static analysis tools for enhanced security coverage.',
          default: true,
          features: [
            'Multiple AI models analyzing the same contract',
            'Static analysis tool integration',
            'AI consensus through discussion',
            'False positive reduction',
            'Comprehensive vulnerability detection'
          ]
        },
        {
          id: 'standard',
          name: 'Standard Dual-AI Audit',
          description: 'Uses GPT-3.5 with GPT-4 validation for thorough security analysis.',
          default: false,
          features: [
            'Primary analysis with GPT-3.5-Turbo',
            'Validation with GPT-4',
            'Pattern-based static analysis',
            'Fast processing time'
          ]
        }
      ],
      tools: [
        {
          id: 'slither',
          name: 'Slither',
          description: 'Static analysis framework for Solidity, detecting common vulnerabilities and optimization issues.',
          enabled: true
        },
        {
          id: 'mythril',
          name: 'Mythril',
          description: 'Security analysis tool for EVM bytecode using symbolic execution and SMT solving.',
          enabled: true
        }
      ],
      options: {
        showAiDiscussion: true,
        detailedRiskLevels: true,
        useMultipleAiModels: true
      }
    });
  }