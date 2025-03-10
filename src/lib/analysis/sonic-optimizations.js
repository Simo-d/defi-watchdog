// lib/analysis/sonic-optimizations.js
export const sonicOptimizationRules = [
    {
      pattern: /gas\s*=\s*[0-9]+/g,
      title: "Sonic Gas Optimization",
      description: "Sonic blockchain has different gas dynamics than Ethereum",
      recommendation: "Consider using dynamic gas estimation for Sonic",
      sonicSpecific: true
    },
    {
      pattern: /block\.timestamp/g,
      title: "Sonic Timestamp Usage",
      description: "Sonic has faster block times than Ethereum",
      recommendation: "Adjust time-dependent logic for Sonic's sub-second finality",
      sonicSpecific: true
    },
    // More Sonic-specific rules
  ];