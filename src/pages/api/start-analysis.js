// pages/api/start-analysis.js
import { storeJob, runAnalysisInBackground } from '../../lib/jobs';

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