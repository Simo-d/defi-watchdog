// pages/api/start-analysis.js
export const config = {
    maxDuration: 60
  };
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { address } = req.body;
    const jobId = `job-${address}-${Date.now()}`;
    
    // Store the job in a database or cache
    await storeJob(jobId, { status: 'pending', address });
    
    // Start the analysis in the background (without awaiting)
    runAnalysisInBackground(jobId, address);
    
    // Return immediately with the job ID
    return res.status(200).json({ success: true, jobId });
  }
  
  // pages/api/analysis-status.js
  export default async function handler(req, res) {
    const { jobId } = req.query;
    
    const job = await getJobStatus(jobId);
    
    return res.status(200).json(job);
  }