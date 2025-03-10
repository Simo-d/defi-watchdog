// src/pages/api/stats.js
export default async function handler(req, res) {
    try {
      // In a real implementation, you'd calculate these stats from your database
      // For now, we'll return mock statistics
      
      const mockStats = {
        totalAnalyzed: 142,
        sonicContracts: 23,
        criticalVulnerabilities: 11,
        highVulnerabilities: 34,
        mediumVulnerabilities: 56,
        totalVulnerabilities: 101,
        averageSecurityScore: 83,
        last24Hours: {
          analyzed: 12,
          vulnerabilities: 8
        },
        last7Days: {
          analyzed: 47,
          vulnerabilities: 31
        }
      };
      
      return res.status(200).json(mockStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({ error: error.message || 'Error fetching statistics' });
    }
  }