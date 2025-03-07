// lib/jobs.js
import { auditSmartContract } from './analyzer';
import { saveAuditReport } from './localStorage';

// In-memory job storage (replace with database in production)
const jobs = new Map();

export async function storeJob(jobId, jobData) {
  jobs.set(jobId, jobData);
  return jobId;
}

export async function getJobStatus(jobId) {
  return jobs.get(jobId) || null;
}

export async function updateJobStatus(jobId, status, data = {}) {
  const job = jobs.get(jobId);
  if (job) {
    const updatedJob = { ...job, status, ...data, updatedAt: new Date().toISOString() };
    jobs.set(jobId, updatedJob);
    return updatedJob;
  }
  return null;
}

export async function runAnalysisInBackground(jobId, address, network = 'mainnet', options = {}) {
  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing');
    
    // Perform the actual audit
    const auditResults = await auditSmartContract(address, network, options);
    
    // Save the audit results
    try {
      await saveAuditReport(auditResults);
    } catch (error) {
      console.error('Error saving audit report:', error);
    }
    
    // Update job status to completed with results
    await updateJobStatus(jobId, 'completed', { results: auditResults });
    
    return auditResults;
  } catch (error) {
    console.error('Error in background analysis:', error);
    
    // Update job status to failed
    await updateJobStatus(jobId, 'failed', { 
      error: error.message,
      errorDetail: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    throw error;
  }
}