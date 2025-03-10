// src/pages/dashboard.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import styles from '../styles/components/All.module.css';

// Dashboard page component
export default function Dashboard() {
  const router = useRouter();
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [sonicAnalyses, setSonicAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zerebyAgentStatus, setZerebyAgentStatus] = useState({ active: false, lastUpdated: null });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Check ZerePy agent status
    async function checkAgentStatus() {
      try {
        const response = await fetch('/api/zerebro/status');
        if (response.ok) {
          const data = await response.json();
          setZerebyAgentStatus({
            active: data.active,
            lastUpdated: data.lastUpdated
          });
        }
      } catch (error) {
        console.error('Error checking ZerePy agent status:', error);
      }
    }
    
    // Fetch dashboard data
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch recent analyses
        const recentResponse = await fetch('/api/reports/recent');
        if (!recentResponse.ok) {
          throw new Error(`Error fetching recent reports: ${recentResponse.statusText}`);
        }
        
        const recentData = await recentResponse.json();
        setRecentAnalyses(recentData.reports || []);
        
        // Extract Sonic analyses
        const sonicOnly = recentData.reports.filter(report => report.network === 'sonic');
        setSonicAnalyses(sonicOnly);
        
        // Fetch statistics
        const statsResponse = await fetch('/api/stats');
        if (!statsResponse.ok) {
          throw new Error(`Error fetching stats: ${statsResponse.statusText}`);
        }
        
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkAgentStatus();
    fetchDashboardData();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Helper to format address
  const formatAddress = (address) => {
    if (!address) return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get reports based on active tab
  const getReports = () => {
    if (activeTab === 'sonic') {
      return sonicAnalyses;
    }
    return recentAnalyses;
  };

  return (
    <Layout>
      <Head>
        <title>Dashboard - DeFi Watchdog</title>
      </Head>
      
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Contract Security Dashboard</h1>
        
        {/* ZerePy Agent Status */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          backgroundColor: zerebyAgentStatus.active ? '#ecfdf5' : '#fef2f2',
          borderRadius: '0.375rem',
          marginBottom: '1.5rem',
          border: `1px solid ${zerebyAgentStatus.active ? '#d1fae5' : '#fee2e2'}`,
        }}>
          <div style={{ 
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: zerebyAgentStatus.active ? '#10b981' : '#ef4444',
            marginRight: '0.75rem'
          }} />
          <div>
            <span style={{ 
              fontSize: '0.95rem', 
              fontWeight: '600',
              color: zerebyAgentStatus.active ? '#065f46' : '#991b1b' 
            }}>
              {zerebyAgentStatus.active ? 'ZerePy Agent Active' : 'ZerePy Agent Inactive'} 
            </span>
            {zerebyAgentStatus.lastUpdated && (
              <span style={{ 
                fontSize: '0.85rem', 
                color: zerebyAgentStatus.active ? '#065f46' : '#991b1b',
                marginLeft: '0.5rem',
                opacity: 0.8
              }}>
                Last updated: {formatDate(zerebyAgentStatus.lastUpdated)}
              </span>
            )}
          </div>
          
          {zerebyAgentStatus.active && (
            <span style={{
              marginLeft: 'auto',
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center'
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.25rem' }}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sonic Analysis Ready
            </span>
          )}
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '0.5rem', 
              padding: '1.25rem', 
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Contracts Analyzed
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827' }}>
                {stats.totalAnalyzed || 0}
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '0.5rem', 
              padding: '1.25rem', 
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Sonic Contracts
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#8b5cf6' }}>
                {stats.sonicContracts || 0}
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '0.5rem', 
              padding: '1.25rem', 
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Critical Vulnerabilities
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#ef4444' }}>
                {stats.criticalVulnerabilities || 0}
              </div>
            </div>
            
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '0.5rem', 
              padding: '1.25rem', 
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Average Security Score
              </div>
              <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#10b981' }}>
                {stats.averageSecurityScore || 0}/100
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'all' ? '2px solid #0284c7' : 'none',
              fontWeight: activeTab === 'all' ? 'bold' : 'normal',
              color: activeTab === 'all' ? '#0284c7' : '#6b7280',
              cursor: 'pointer'
            }}
          >
            All Contracts
          </button>
          
          <button
            onClick={() => setActiveTab('sonic')}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'sonic' ? '2px solid #8b5cf6' : 'none',
              fontWeight: activeTab === 'sonic' ? 'bold' : 'normal',
              color: activeTab === 'sonic' ? '#8b5cf6' : '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.25rem' }}>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sonic Contracts
          </button>
        </div>
        
        {/* Recent Analyses Table */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {activeTab === 'sonic' ? 'Recent Sonic Contract Analyses' : 'Recent Contract Analyses'}
            </h2>
          </div>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ 
                display: 'inline-block',
                width: '2rem', 
                height: '2rem', 
                borderRadius: '50%', 
                border: '3px solid #e5e7eb',
                borderTopColor: '#8b5cf6',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ marginTop: '1rem' }}>Loading dashboard data...</p>
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c', backgroundColor: '#fee2e2' }}>
              <p>Error loading dashboard: {error}</p>
            </div>
          ) : getReports().length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              <p>No {activeTab === 'sonic' ? 'Sonic ' : ''}contract analyses found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Contract</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Network</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Security Score</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Analysis Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getReports().map((report, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>
                        <div style={{ fontWeight: '500' }}>{report.contractName || 'Unknown Contract'}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{formatAddress(report.address)}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {report.network === 'sonic' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.25rem' }}>
                              <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Sonic
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: '#e5e7eb',
                            color: '#4b5563',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {report.network || 'Ethereum'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#111827' }}>
                        {report.analysis?.contractType || report.contractType || 'Unknown'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{ 
                            width: '3rem',
                            height: '0.5rem',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              height: '100%',
                              width: `${report.securityScore || 0}%`,
                              backgroundColor: getScoreColor(report.securityScore || 0)
                            }} />
                          </div>
                          <span style={{ 
                            fontWeight: '600',
                            color: getScoreColor(report.securityScore || 0)
                          }}>
                            {report.securityScore || 0}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {formatDate(report.createdAt)}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Link 
                          href={`/audit?address=${report.address}&network=${report.network}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#0284c7',
                            color: 'white',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            textDecoration: 'none'
                          }}
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Analyze New Contract Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          <Link 
            href="/audit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0284c7',
              color: 'white',
              borderRadius: '0.375rem',
              fontSize: '1rem',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            Analyze New Contract
          </Link>
        </div>
      </div>
    </Layout>
  );
}

// Helper function to get color based on security score
function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 50) return '#f59e0b'; // Orange
  return '#ef4444'; // Red
}