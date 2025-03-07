// models/AuditReport.js
import mongoose from 'mongoose';

const AuditReportSchema = new mongoose.Schema({
  // Contract info
  address: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  network: {
    type: String,
    required: true,
    default: 'mainnet',
    index: true
  },
  contractName: {
    type: String,
    required: true
  },
  contractType: {
    type: String,
    required: true
  },
  compiler: String,
  sourceCodeHash: String,
  
  // Audit results
  analysis: {
    overview: String,
    contractType: String,
    keyFeatures: [String],
    implementationDetails: {
      standard: String,
      extensions: [String],
      patternUsage: String,
      accessControl: String,
      upgradeability: String
    },
    risks: [{
      severity: {
        type: String,
        enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
      },
      description: String,
      codeReference: String,
      impact: String,
      recommendation: String
    }],
    securityConsiderations: {
      transferMechanisms: String,
      reentrancyProtection: String,
      arithmeticSafety: String,
      accessControls: String
    },
    securityScore: Number,
    riskLevel: String,
    explanation: String,
    codeQuality: {
      readability: String,
      modularity: String,
      testCoverage: String,
      documentation: String
    },
    findingCounts: {
      critical: Number,
      high: Number,
      medium: Number,
      low: Number,
      info: Number
    }
  },
  
  // Metadata
  securityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskyCodeSnippets: [{
    title: String,
    code: String,
    explanation: String,
    lineNumbers: [Number]
  }],
  riskLevel: {
    type: String,
    enum: ['Safe', 'Low Risk', 'Medium Risk', 'High Risk', 'Unknown']
  },
  isSafe: {
    type: Boolean,
    default: false
  },
  analysisTime: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  aiModel: {
    type: String,
    default: 'gpt-4'
  },
  toolsUsed: [String]
});

// Create compound index for faster lookups
AuditReportSchema.index({ address: 1, network: 1, createdAt: -1 });

// Check if the model is already defined
const AuditReport = mongoose.models.AuditReport || mongoose.model('AuditReport', AuditReportSchema);

export default AuditReport;