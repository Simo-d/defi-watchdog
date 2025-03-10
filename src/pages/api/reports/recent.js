// src/pages/api/reports/recent.js
export default async function handler(req, res) {
    try {
      // In a real implementation, you'd fetch this from your database
      // For now, we'll return mock data that matches your expected format
      
      const mockReports = [
        {
          address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
          network: "mainnet",
          contractName: "Uniswap V2 Router",
          contractType: "DEX Router",
          analysis: {
            contractType: "DEX Router",
            securityScore: 85,
            riskLevel: "Low"
          },
          securityScore: 85,
          riskLevel: "Low",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          network: "mainnet",
          contractName: "Uniswap Token",
          contractType: "ERC20 Token",
          analysis: {
            contractType: "ERC20 Token",
            securityScore: 92,
            riskLevel: "Safe"
          },
          securityScore: 92,
          riskLevel: "Safe",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
        },
        {
          address: "0x4846A3B8D7E3D76500A794b9A2C5a4F58ECB2b67",
          network: "sonic", 
          contractName: "SonicSwap Router",
          contractType: "DEX Router",
          analysis: {
            contractType: "DEX Router",
            securityScore: 78,
            riskLevel: "Low"
          },
          securityScore: 78,
          riskLevel: "Low",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
          zerebro: true
        },
        {
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          network: "mainnet",
          contractName: "Wrapped Ether",
          contractType: "ERC20 Token",
          analysis: {
            contractType: "ERC20 Token",
            securityScore: 90,
            riskLevel: "Safe"
          },
          securityScore: 90,
          riskLevel: "Safe",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
        },
        {
          address: "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a",
          network: "sonic",
          contractName: "SonicToken",
          contractType: "ERC20 Token",
          analysis: {
            contractType: "ERC20 Token",
            securityScore: 88,
            riskLevel: "Low"
          },
          securityScore: 88,
          riskLevel: "Low",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          zerebro: true
        },
        {
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          network: "mainnet",
          contractName: "Dai Stablecoin",
          contractType: "ERC20 Token",
          analysis: {
            contractType: "ERC20 Token",
            securityScore: 95,
            riskLevel: "Safe"
          },
          securityScore: 95,
          riskLevel: "Safe",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        },
        {
          address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          network: "mainnet",
          contractName: "Wrapped BTC",
          contractType: "ERC20 Token",
          analysis: {
            contractType: "ERC20 Token",
            securityScore: 93,
            riskLevel: "Safe"
          },
          securityScore: 93,
          riskLevel: "Safe",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() // 1.5 days ago
        },
        {
          address: "0x56E8b196503b6E2Da09d403F4BeC233C2B8DBFC5",
          network: "sonic",
          contractName: "SonicStaking",
          contractType: "Staking Contract",
          analysis: {
            contractType: "Staking Contract",
            securityScore: 75,
            riskLevel: "Medium"
          },
          securityScore: 75,
          riskLevel: "Medium",
          isSafe: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(), // ~2 days ago
          zerebro: true
        }
      ];
      
      return res.status(200).json({ reports: mockReports });
    } catch (error) {
      console.error('Error fetching recent reports:', error);
      return res.status(500).json({ error: error.message || 'Error fetching reports' });
    }
  }