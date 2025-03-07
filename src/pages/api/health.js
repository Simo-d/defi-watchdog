export default function handler(req, res) {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasEtherscan: !!process.env.ETHERSCAN_API_KEY
      }
    });
  }