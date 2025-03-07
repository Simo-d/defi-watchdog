// lib/localStorage.js
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from './database';
import AuditReport from '../models/AuditReport';

// Base directory for local storage
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data', 'audits');

// Ensure the data directory exists
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (error) {
  console.error('Error creating data directory:', error);
}

/**
 * Save audit report to storage (MongoDB or local filesystem)
 * @param {object} report - Audit report data
 * @returns {Promise<object>} Saved report data
 */
export async function saveAuditReport(report) {
  try {
    // Try to save to MongoDB first
    const connection = await connectToDatabase();
    
    if (connection) {
      // MongoDB is available, use it
      const auditReport = new AuditReport({
        ...report,
        createdAt: new Date()
      });
      
      const savedReport = await auditReport.save();
      return savedReport;
    } else {
      // Fall back to local storage
      return saveToLocalStorage(report);
    }
  } catch (error) {
    console.error('Error saving audit report to database:', error);
    // Fall back to local storage
    return saveToLocalStorage(report);
  }
}

/**
 * Save audit report to local filesystem
 * @param {object} report - Audit report data
 * @returns {Promise<object>} Saved report with ID
 */
async function saveToLocalStorage(report) {
  try {
    // Generate report ID if not present
    const reportWithId = {
      ...report,
      _id: report._id || uuidv4(),
      createdAt: report.createdAt || new Date()
    };
    
    // Create directory for this contract if it doesn't exist
    const contractDir = path.join(DATA_DIR, report.address.toLowerCase());
    fs.mkdirSync(contractDir, { recursive: true });
    
    // Save report to file
    const fileName = `${Date.now()}.json`;
    const filePath = path.join(contractDir, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(reportWithId, null, 2));
    console.log(`Report saved to ${filePath}`);
    
    return reportWithId;
  } catch (error) {
    console.error('Error saving to local storage:', error);
    throw error;
  }
}

/**
 * Check if an audit report exists
 * @param {object} query - Query parameters
 * @returns {Promise<boolean>} Whether a report exists
 */
export async function auditReportExists(query) {
  try {
    // Try MongoDB first
    const connection = await connectToDatabase();
    
    if (connection) {
      const count = await AuditReport.countDocuments(query);
      return count > 0;
    } else {
      // Fall back to local storage check
      return checkLocalStorageForReport(query);
    }
  } catch (error) {
    console.error('Error checking if audit report exists:', error);
    // Fall back to local storage check
    return checkLocalStorageForReport(query);
  }
}

/**
 * Check if a report exists in local storage
 * @param {object} query - Query parameters
 * @returns {Promise<boolean>} Whether a report exists
 */
function checkLocalStorageForReport(query) {
  try {
    if (!query.address) {
      return false;
    }
    
    const contractDir = path.join(DATA_DIR, query.address.toLowerCase());
    
    if (!fs.existsSync(contractDir)) {
      return false;
    }
    
    // Check if any files exist
    const files = fs.readdirSync(contractDir);
    return files.length > 0;
  } catch (error) {
    console.error('Error checking local storage:', error);
    return false;
  }
}

/**
 * Find the most recent audit report
 * @param {object} query - Query parameters
 * @returns {Promise<object|null>} Most recent audit report or null
 */
export async function findMostRecentAuditReport(query) {
  try {
    // Try MongoDB first
    const connection = await connectToDatabase();
    
    if (connection) {
      const report = await AuditReport.findOne(query).sort({ createdAt: -1 });
      return report ? report.toObject() : null;
    } else {
      // Fall back to local storage
      return findMostRecentFromLocalStorage(query);
    }
  } catch (error) {
    console.error('Error finding most recent audit report:', error);
    // Fall back to local storage
    return findMostRecentFromLocalStorage(query);
  }
}

/**
 * Find the most recent audit report from local storage
 * @param {object} query - Query parameters
 * @returns {Promise<object|null>} Most recent audit report or null
 */
function findMostRecentFromLocalStorage(query) {
  try {
    if (!query.address) {
      return null;
    }
    
    const contractDir = path.join(DATA_DIR, query.address.toLowerCase());
    
    if (!fs.existsSync(contractDir)) {
      return null;
    }
    
    // Get all files and sort by name (which includes timestamp)
    const files = fs.readdirSync(contractDir).sort().reverse();
    
    if (files.length === 0) {
      return null;
    }
    
    // Load the most recent file
    const filePath = path.join(contractDir, files[0]);
    const reportData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Check if it meets source code hash criteria
    if (query.sourceCodeHash && reportData.sourceCodeHash !== query.sourceCodeHash) {
      return null;
    }
    
    // Check createdAt date criteria
    if (query.createdAt && query.createdAt.$gte) {
      const reportDate = new Date(reportData.createdAt);
      const minDate = new Date(query.createdAt.$gte);
      
      if (reportDate < minDate) {
        return null;
      }
    }
    
    return reportData;
  } catch (error) {
    console.error('Error finding from local storage:', error);
    return null;
  }
}

/**
 * Find multiple audit reports
 * @param {object} query - Query parameters
 * @param {object} options - Options (sortBy, sortDesc, limit)
 * @returns {Promise<Array>} Array of audit reports
 */
export async function findAuditReports(query, options = {}) {
  try {
    // Try MongoDB first
    const connection = await connectToDatabase();
    
    if (connection) {
      const sortField = options.sortBy || 'createdAt';
      const sortDirection = options.sortDesc ? -1 : 1;
      const limit = options.limit || 10;
      
      const reports = await AuditReport.find(query)
        .sort({ [sortField]: sortDirection })
        .limit(limit);
      
      return reports.map(report => report.toObject());
    } else {
      // Fall back to local storage
      return findReportsFromLocalStorage(query, options);
    }
  } catch (error) {
    console.error('Error finding audit reports:', error);
    // Fall back to local storage
    return findReportsFromLocalStorage(query, options);
  }
}

/**
 * Find audit reports from local storage
 * @param {object} query - Query parameters
 * @param {object} options - Options (sortBy, sortDesc, limit)
 * @returns {Promise<Array>} Array of audit reports
 */
function findReportsFromLocalStorage(query, options = {}) {
  try {
    if (!query.address) {
      return [];
    }
    
    const contractDir = path.join(DATA_DIR, query.address.toLowerCase());
    
    if (!fs.existsSync(contractDir)) {
      return [];
    }
    
    // Get all files
    const files = fs.readdirSync(contractDir);
    
    if (files.length === 0) {
      return [];
    }
    
    // Load all reports
    const reports = files.map(file => {
      const filePath = path.join(contractDir, file);
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    });
    
    // Sort reports
    const sortField = options.sortBy || 'createdAt';
    const sortDirection = options.sortDesc ? -1 : 1;
    
    reports.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return -1 * sortDirection;
      if (aValue > bValue) return 1 * sortDirection;
      return 0;
    });
    
    // Apply limit
    const limit = options.limit || 10;
    return reports.slice(0, limit);
  } catch (error) {
    console.error('Error finding from local storage:', error);
    return [];
  }
}

/**
 * Get audit storage statistics
 * @returns {Promise<object>} Storage statistics
 */
export async function getAuditStats() {
  try {
    // Try MongoDB first
    const connection = await connectToDatabase();
    
    if (connection) {
      const totalCount = await AuditReport.countDocuments();
      const recentCount = await AuditReport.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const averageScore = await AuditReport.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$securityScore' } } }
      ]);
      
      const riskLevelCounts = await AuditReport.aggregate([
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
      ]);
      
      return {
        totalReports: totalCount,
        reportsLast24h: recentCount,
        averageSecurityScore: averageScore.length > 0 ? averageScore[0].avgScore : 0,
        riskLevelDistribution: riskLevelCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } else {
      // Fall back to local storage stats
      return getLocalStorageStats();
    }
  } catch (error) {
    console.error('Error getting audit stats:', error);
    // Fall back to local storage stats
    return getLocalStorageStats();
  }
}

/**
 * Get local storage statistics
 * @returns {Promise<object>} Storage statistics
 */
function getLocalStorageStats() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return {
        totalReports: 0,
        reportsLast24h: 0,
        averageSecurityScore: 0,
        riskLevelDistribution: {}
      };
    }
    
    // Get all contract directories
    const contractDirs = fs.readdirSync(DATA_DIR);
    
    // Calculate stats
    let totalReports = 0;
    let reportsLast24h = 0;
    let totalScore = 0;
    const riskLevelCounts = {};
    
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // Process each contract directory
    contractDirs.forEach(dir => {
      const contractDir = path.join(DATA_DIR, dir);
      
      if (fs.statSync(contractDir).isDirectory()) {
        const files = fs.readdirSync(contractDir);
        
        files.forEach(file => {
          totalReports++;
          
          // Load report
          const filePath = path.join(contractDir, file);
          const reportData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Check if recent
          const reportDate = new Date(reportData.createdAt).getTime();
          if (reportDate >= oneDayAgo) {
            reportsLast24h++;
          }
          
          // Add to score
          totalScore += reportData.securityScore || 0;
          
          // Count risk levels
          const riskLevel = reportData.riskLevel || 'Unknown';
          riskLevelCounts[riskLevel] = (riskLevelCounts[riskLevel] || 0) + 1;
        });
      }
    });
    
    return {
      totalReports,
      reportsLast24h,
      averageSecurityScore: totalReports > 0 ? totalScore / totalReports : 0,
      riskLevelDistribution: riskLevelCounts
    };
  } catch (error) {
    console.error('Error getting local storage stats:', error);
    return {
      totalReports: 0,
      reportsLast24h: 0,
      averageSecurityScore: 0,
      riskLevelDistribution: {},
      error: error.message
    };
  }
}