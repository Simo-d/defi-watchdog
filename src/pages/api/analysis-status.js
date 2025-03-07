// pages/api/analysis-status.js
import { getJobStatus } from '../../lib/jobs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = req.query;
  
  if (!jobId) {
    return res.status(400).json({ error: 'Missing jobId parameter' });
  }
  
  const job = await getJobStatus(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  return res.status(200).json(job);
}