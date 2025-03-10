// pages/api/dashboard/stats.js
export default function handler(req, res) {
  // Mock data for dashboard stats
  const stats = {
    totalContracts: 120,
    auditedContracts: 95,
    pendingAudits: 25,
    securityScore: 85,
    recentActivities: [
      { id: 1, action: 'Audit completed', contract: '0x123...', date: '2023-10-01' },
      { id: 2, action: 'Audit started', contract: '0x456...', date: '2023-10-02' },
      // Add more recent activities here
    ]
  };

  res.status(200).json(stats);
}