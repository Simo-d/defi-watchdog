import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useWallet } from '../hooks/useWallet';
import MintButton from '../components/certificate/MintButton';
import styles from '../styles/components/All.module.css';
import { useContract } from '../hooks/useContract';
import { ethers } from 'ethers';
// MultiAI Analysis Progress component
function MultiAIProgress({ isRunning }) {
  const [stage, setStage] = useState(0);
  const stages = [
    "Analyzing with OpenAI...",
    "Analyzing with Deepseek...",
    "Analyzing with Mistral...",
    "Running static analysis tools...",
    "AIs discussing findings...",
    "Reconciling analyses...",
    "Generating final report..."
  ];
  
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setStage(prev => (prev + 1) % (stages.length - 1));
      }, 3000); // Change stage every 3 seconds for visual effect
    } else {
      setStage(0);
    }
    
    return () => clearInterval(timer);
  }, [isRunning, stages.length]);
  
  if (!isRunning) return null;
  
  return (
    <div style={{ 
      marginTop: '1rem', 
      padding: '1rem', 
      backgroundColor: '#f0f7ff', 
      borderRadius: '8px',
      border: '1px solid #bae6fd'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          border: '3px solid #38bdf8',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
          marginRight: '1rem'
        }} />
        <h3 style={{ margin: 0, color: '#0284c7' }}>Multi-AI Analysis in Progress</h3>
      </div>
      
      <div style={{ marginBottom: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          <strong>Current stage:</strong> {stages[stage]}
        </p>
      </div>
      
      <div style={{ height: '8px', backgroundColor: '#e0f2fe', borderRadius: '4px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${((stage + 1) / stages.length) * 100}%`, 
            backgroundColor: '#0284c7',
            transition: 'width 0.5s ease-in-out'
          }} 
        />
      </div>
      
      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
        Multiple AI models are analyzing your contract and discussing findings to provide the most accurate assessment.
      </p>
    </div>
  );
}
// Replace the EnhancedMintButton in audit.js with this implementation
function EnhancedMintButton({ contractAddress }) {
  const router = useRouter();
  const { account, connect } = useWallet();
  const { mintFee, mintCertificate, loading: contractLoading } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  async function handleMint() {
    // Check if wallet is connected
    if (!account) {
      try {
        await connect();
        return; // Return after connecting to allow the user to approve the connection first
      } catch (err) {
        console.error('Failed to connect wallet:', err);
        return;
      }
    }

    setIsLoading(true);
    setNetworkError(null);

    try {
      console.log('Starting mint process for:', contractAddress);
      
      // Call the actual mintCertificate function from useContract
      const tokenId = await mintCertificate(contractAddress);
      console.log('Mint successful, token ID:', tokenId);
      
      // Redirect to the certificate page after successful transaction
      router.push(`/certificate/${tokenId}`);
    } catch (err) {
      console.error('Minting error:', err);
      
      // Check if it's a network-related error
      if (err.message && (
          err.message.includes('network') || 
          err.message.includes('chain') || 
          err.message.includes('Sonic')
        )) {
        setNetworkError(err.message);
      } else {
        alert(`Minting failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (contractLoading) {
    return (
      <button
        disabled
        style={{
          backgroundColor: '#9CA3AF',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          opacity: 0.75,
          cursor: 'not-allowed'
        }}
      >
        Loading...
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleMint}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#9CA3AF' : '#10B981',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? (
          <>
            <svg 
              style={{ 
                animation: 'spin 1s linear infinite',
                marginRight: '0.5rem',
                height: '1rem',
                width: '1rem'
              }} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                style={{ opacity: 0.25 }} 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                style={{ opacity: 0.75 }} 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Minting...
          </>
        ) : account ? (
          'Mint Safety Certificate'
        ) : (
          'Connect Wallet to Mint'
        )}
      </button>
      
      {account && (
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>
          Fee: {mintFee ? ethers.utils.formatEther(mintFee) : '0.01'} ETH
        </p>
      )}
      
      {networkError && (
        <div style={{ 
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#FEF2F2',
          borderRadius: '0.375rem',
          color: '#B91C1C',
          fontSize: '0.875rem',
          border: '1px solid #FEE2E2'
        }}>
          {networkError}
        </div>
      )}
    </div>
  );
}
function ImprovedSafeResult({ result }) {
  const { account } = useWallet();
  
  console.log("SafeResult rendering, wallet account:", account);

  return (
    <div style={{ 
      backgroundColor: '#FFFFFF', 
      borderRadius: '0.5rem', 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }}>
      {/* Main content remains same */}
      <div style={{ 
        padding: '1.5rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
            Contract Analysis Results
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {result.contractName} ({result.address.substring(0, 6)}...{result.address.slice(-4)})
          </p>
        </div>
        <div>
          <span style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: '#D1FAE5',
            color: '#064E3B'
          }}>
            <svg 
              style={{ height: '1rem', width: '1rem', marginRight: '0.25rem' }} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Safe
          </span>
        </div>
      </div>

      {/* Contract overview */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
          Contract Overview
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.25rem' }}>
              Contract Name
            </div>
            <div style={{ fontSize: '0.875rem', color: '#111827' }}>
              {result.contractName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.25rem' }}>
              Contract Type
            </div>
            <div style={{ fontSize: '0.875rem', color: '#111827' }}>
              {result.analysis.contractType || 'Unknown'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.25rem' }}>
              Security Score
            </div>
            <div style={{ fontSize: '0.875rem', color: '#111827', display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#10B981', fontWeight: '600' }}>{result.analysis.securityScore}/100</span>
              <svg 
                style={{ height: '1rem', width: '1rem', color: '#10B981', marginLeft: '0.25rem' }} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6B7280', marginBottom: '0.25rem' }}>
              Compiler Version
            </div>
            <div style={{ fontSize: '0.875rem', color: '#111827' }}>
              {result.compiler}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
          AI Analysis
        </h4>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#F0FDF4', borderRadius: '0.5rem', border: '1px solid #D1FAE5' }}>
          <div style={{ display: 'flex' }}>
            <svg 
              style={{ height: '1.25rem', width: '1.25rem', color: '#10B981', marginRight: '0.5rem', flexShrink: 0 }} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#065F46' }}>This contract appears safe</h5>
              <p style={{ fontSize: '0.875rem', color: '#047857', marginTop: '0.25rem' }}>
                Our AI analysis did not detect any significant security risks or malicious patterns in this contract.
              </p>
            </div>
          </div>
        </div>

        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>What this contract does:</h5>
        <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '1rem' }}>{result.summary}</p>

        <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>Security Assessment:</h5>
        <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>{result.analysis.explanation}</p>
      </div>

      {/* Footer with mint button */}
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#F9FAFB', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <a 
          href={result.etherscanUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            backgroundColor: '#FFFFFF',
            color: '#4B5563',
            border: '1px solid #D1D5DB',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          View on Etherscan
        </a>
        
        {/* Use the enhanced mint button here */}
        <EnhancedMintButton contractAddress={result.address} />
      </div>
    </div>
  );
}
// Analysis Discussion component
function AnalysisDiscussion({ discussion }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!discussion) return null;
  
  return (
    <div style={{ 
      marginTop: '1.5rem', 
      padding: '1rem', 
      backgroundColor: '#f8fafc', 
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: expanded ? '1rem' : '0'
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          AI Analysis Discussion
        </h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {expanded ? 'Hide Details' : 'Show Details'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ 
              marginLeft: '0.25rem',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
      
      {!expanded ? (
        <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0.5rem 0 0' }}>
          Multiple AI models analyzed this contract and reached a consensus. Click "Show Details" to see their discussion.
        </p>
      ) : (
        <div style={{ fontSize: '0.9rem', color: '#334155' }}>
          <div style={{ 
            padding: '0.75rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            whiteSpace: 'pre-line'
          }}>
            {discussion}
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: '0 0 0.5rem' }}>
              How Multi-AI Analysis Works:
            </h4>
            <ol style={{ margin: '0', paddingLeft: '1.5rem' }}>
              <li>Multiple AI models analyze your contract independently</li>
              <li>Static analysis tools provide additional security checks</li>
              <li>All findings are collected and compared</li>
              <li>AIs discuss and reconcile different perspectives</li>
              <li>False positives are eliminated</li>
              <li>A final consensus report is generated with validated findings</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// Severity badge component for risk categories
function SeverityBadge({ severity }) {
  const severityColorMap = {
    CRITICAL: '#FF3B30',
    HIGH: '#FF9500',
    MEDIUM: '#FFCC00',
    LOW: '#34C759',
    INFO: '#007AFF'
  };
  
  const normalizedSeverity = severity.toUpperCase();
  
  return (
    <span style={{
      backgroundColor: severityColorMap[normalizedSeverity] || '#6C757D',
      color: '#FFFFFF',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      display: 'inline-block',
      marginLeft: '8px'
    }}>
      {normalizedSeverity}
    </span>
  );
}

// Risk summary component
function RiskSummary({ findingCounts }) {
  const counts = findingCounts || { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px', 
        backgroundColor: '#FFEEEE',
        borderRadius: '4px',
        minWidth: '120px'
      }}>
        <span style={{ marginRight: '8px' }}>🟥</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Critical</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{counts.critical || 0}</div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px', 
        backgroundColor: '#FFF8EE',
        borderRadius: '4px',
        minWidth: '120px'
      }}>
        <span style={{ marginRight: '8px' }}>🟧</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>High</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{counts.high || 0}</div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px', 
        backgroundColor: '#FFFBEE',
        borderRadius: '4px',
        minWidth: '120px'
      }}>
        <span style={{ marginRight: '8px' }}>🟨</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Medium</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{counts.medium || 0}</div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '8px', 
        backgroundColor: '#F0FFF5',
        borderRadius: '4px',
        minWidth: '120px'
      }}>
        <span style={{ marginRight: '8px' }}>🟩</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Low</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{counts.low || 0}</div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Finding card component with consensus indicator
function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);
  
  // Extract consensus information if available
  const hasConsensus = finding.consensus !== undefined;
  const consensusText = finding.consensus || '';
  let consensusLevel = 'unknown';
  
  if (consensusText.includes('all') || consensusText.includes('All') || consensusText.match(/(\d+)\/\d+/) && consensusText.match(/(\d+)\/\d+/)[1] > 2) {
    consensusLevel = 'high';
  } else if (consensusText.includes('multiple') || consensusText.includes('Multiple') || consensusText.match(/2\/\d+/)) {
    consensusLevel = 'medium';
  } else if (consensusText.includes('single') || consensusText.includes('Single') || consensusText.includes('Only')) {
    consensusLevel = 'low';
  }
  
  // Map consensus level to color and icon
  const consensusInfo = {
    high: { color: '#059669', text: 'High Consensus', icon: '⭐⭐⭐' },
    medium: { color: '#0284c7', text: 'Medium Consensus', icon: '⭐⭐' },
    low: { color: '#6366f1', text: 'Single AI Detection', icon: '⭐' },
    unknown: { color: '#64748b', text: 'Consensus Unknown', icon: ''}
  }[consensusLevel];
  
  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px',
      backgroundColor: '#FFFFFF'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>{finding.title || finding.description.substring(0, 40)}</h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {hasConsensus && (
            <span style={{ 
              color: consensusInfo.color, 
              fontSize: '0.7rem', 
              marginRight: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: `${consensusInfo.color}15`
            }}>
              {consensusInfo.icon} {consensusInfo.text}
            </span>
          )}
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>
      
      <p style={{ fontSize: '0.875rem', margin: '8px 0' }}>{finding.description}</p>
      
      {hasConsensus && !expanded && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>
          <strong>AI Consensus:</strong> {finding.consensus}
        </div>
      )}
      
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #D1D5DB',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          View Details
        </button>
      ) : (
        <>
          {finding.impact && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Impact</h4>
              <p style={{ fontSize: '0.875rem', margin: '4px 0' }}>{finding.impact}</p>
            </div>
          )}
          
          {finding.codeReference && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Code Reference</h4>
              <p style={{ fontSize: '0.875rem', margin: '4px 0' }}>{finding.codeReference}</p>
            </div>
          )}
          
          {finding.codeSnippet && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Code</h4>
              <pre style={{ 
                backgroundColor: '#F8F9FA',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.75rem',
                margin: '4px 0'
              }}>
                {finding.codeSnippet}
              </pre>
            </div>
          )}
          
          {finding.recommendation && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Recommendation</h4>
              <p style={{ fontSize: '0.875rem', margin: '4px 0' }}>{finding.recommendation}</p>
            </div>
          )}
          
          {hasConsensus && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>AI Consensus</h4>
              <p style={{ fontSize: '0.875rem', margin: '4px 0' }}>{finding.consensus}</p>
            </div>
          )}
          
          <button
            onClick={() => setExpanded(false)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              marginTop: '16px',
              cursor: 'pointer'
            }}
          >
            Show Less
          </button>
        </>
      )}
    </div>
  );
}

// AI Patch Generator component
function PatchGenerator({ findings, contractAddress, network }) {
  const [loading, setLoading] = useState(false);
  const [fixes, setFixes] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter only findings that might have code fixes
  const fixableFindings = findings.filter(finding => 
    finding.severity === 'CRITICAL' || 
    finding.severity === 'HIGH' || 
    finding.severity === 'MEDIUM'
  );
  
  async function generatePatches() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: contractAddress,
          network,
          findings: fixableFindings
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate patches');
      }
      
      const data = await response.json();
      
      if (data.fixes && Array.isArray(data.fixes)) {
        setFixes(data.fixes);
      } else {
        throw new Error('Invalid fix data received');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error generating patches:', err);
    } finally {
      setLoading(false);
    }
  }
  
  // Fix card component
  function FixCard({ fix }) {
    const [expanded, setExpanded] = useState(false);
    
    return (
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#FFFFFF'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
            {fix.findingTitle || "Code Fix"}
          </h3>
          {fix.severity && <SeverityBadge severity={fix.severity} />}
        </div>
        
        <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '16px' }}>
          <strong>Changes: </strong> 
          {fix.diffSummary || 'Code modifications to fix the issue'}
        </p>
        
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            View Fix Details
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
              <div style={{ flex: 1, padding: '12px', backgroundColor: '#FFEEEE', borderRadius: '4px', marginRight: '4px', overflow: 'auto' }}>
                <div style={{ color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Original Code:</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{fix.originalCode}</pre>
              </div>
              <div style={{ flex: 1, padding: '12px', backgroundColor: '#EEFFEE', borderRadius: '4px', marginLeft: '4px', overflow: 'auto' }}>
                <div style={{ color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Fixed Code:</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{fix.fixedCode}</pre>
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>Explanation</h4>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{fix.explanation}</p>
            </div>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(fix.fixedCode)
                  .then(() => alert('Fixed code copied to clipboard!'))
                  .catch(err => console.error('Failed to copy: ', err));
              }}
              style={{
                backgroundColor: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                marginTop: '12px',
                marginRight: '8px',
                cursor: 'pointer'
              }}
            >
              Copy Fix
            </button>
            
            <button
              onClick={() => setExpanded(false)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                marginTop: '12px',
                cursor: 'pointer'
              }}
            >
              Show Less
            </button>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
          AI-Generated Fixes ({fixableFindings.length} available)
        </h3>
        
        <button
          onClick={generatePatches}
          disabled={loading || fixableFindings.length === 0}
          style={{
            backgroundColor: '#0284c7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            cursor: fixableFindings.length === 0 ? 'not-allowed' : 'pointer',
            opacity: fixableFindings.length === 0 ? 0.5 : 1
          }}
        >
          {loading ? 'Generating...' : 'Generate Fixes'}
        </button>
      </div>
      
      {fixableFindings.length === 0 && (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          color: '#4B5563'
        }}>
          <p>No critical or high-risk issues found to fix.</p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#FEE2E2', 
          color: '#B91C1C',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}
      
      {loading && (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          color: '#4B5563'
        }}>
          <p style={{ margin: 0 }}>Generating fixes... This may take up to a minute.</p>
        </div>
      )}
      
      {fixes.length > 0 && !loading && (
        <div>
          {fixes.map((fix, index) => (
            <FixCard key={index} fix={fix} />
          ))}
        </div>
      )}
    </div>
  );
}

// Audit History component
function AuditHistory({ contractAddress, network }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchHistory() {
      if (!contractAddress) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/audit-history?address=${contractAddress}&network=${network || 'mainnet'}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch audit history');
        }
        
        const data = await response.json();
        
        if (data.history && Array.isArray(data.history)) {
          setHistory(data.history);
        } else {
          setHistory([]);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching audit history:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [contractAddress, network]);
  
  function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  }
  
  return (
    <div style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>Audit History</h3>
      
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <p>Loading audit history...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px' }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      ) : history.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
          <p>No previous audits found for this contract.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.875rem' }}>Date</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '0.875rem' }}>Score</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.875rem' }}>Risk Level</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '0.875rem' }}>Findings</th>
              </tr>
            </thead>
            <tbody>
              {history.map((audit, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '12px 8px', fontSize: '0.875rem' }}>
                    {formatDate(audit.createdAt)}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.875rem', textAlign: 'center' }}>
                    {audit.securityScore}/100
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.875rem' }}>
                    <span style={{ 
                      color: audit.riskLevel === 'Safe' ? '#10B981' : 
                              audit.riskLevel === 'Low Risk' ? '#F59E0B' : 
                              audit.riskLevel === 'Medium Risk' ? '#EF4444' : '#B91C1C',
                      fontWeight: 'bold'
                    }}>
                      {audit.riskLevel}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '0.875rem' }}>
                    {audit.analysis?.findingCounts ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {audit.analysis.findingCounts.critical > 0 && (
                          <span style={{ color: '#B91C1C' }}>
                            {audit.analysis.findingCounts.critical} Critical
                          </span>
                        )}
                        {audit.analysis.findingCounts.high > 0 && (
                          <span style={{ color: '#C2410C' }}>
                            {audit.analysis.findingCounts.high} High
                          </span>
                        )}
                        {audit.analysis.findingCounts.medium > 0 && (
                          <span style={{ color: '#B45309' }}>
                            {audit.analysis.findingCounts.medium} Medium
                          </span>
                        )}
                      </div>
                    ) : (
                      'Unknown'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ZerePy Agent Status component
function ZerePyAgentStatus({ isActive, lastUpdated }) {
  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      padding: '0.5rem',
      backgroundColor: isActive ? '#ecfdf5' : '#fef2f2',
      borderRadius: '0.375rem',
      marginBottom: '1rem',
      border: `1px solid ${isActive ? '#d1fae5' : '#fee2e2'}`,
    }}>
      <div style={{ 
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: isActive ? '#10b981' : '#ef4444',
        marginRight: '0.5rem'
      }} />
      <span style={{ fontSize: '0.875rem', color: isActive ? '#065f46' : '#991b1b' }}>
        {isActive ? 'ZerePy Agent Active' : 'ZerePy Agent Inactive'} 
        {lastUpdated && ` - Last updated: ${new Date(lastUpdated).toLocaleString()}`}
      </span>
    </div>
  );
}

// SonicNetworkBadge component to emphasize Sonic blockchain integration
function NetworkBadge({ network }) {
  const isSonic = network === 'sonic';
  const isLinea = network === 'linea' || network === 'mainnet';
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      backgroundColor: isSonic ? '#8b5cf6' : isLinea ? '#2563eb' : '#e5e7eb',
      color: (isSonic || isLinea) ? 'white' : '#4b5563',
      fontWeight: 'bold',
      fontSize: '0.75rem',
      marginLeft: '0.5rem'
    }}>
      {isSonic ? (
        <>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.25rem' }}>
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sonic Blockchain
        </>
      ) : isLinea ? (
        <>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.25rem' }}>
            <path d="M12 22V2M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Linea Blockchain
        </>
      ) : 'Ethereum'}
    </div>
  );
}

// Sonic-specific Gas Optimization component
function SonicGasOptimizations({ contractAddress, show }) {
  const [optimizations, setOptimizations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (show && contractAddress) {
      fetchOptimizations();
    }
  }, [show, contractAddress]);
  
  async function fetchOptimizations() {
    setLoading(true);
    try {
      const response = await fetch(`/api/sonic/gas-optimizations?address=${contractAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Sonic gas optimizations');
      }
      
      const data = await response.json();
      setOptimizations(data.optimizations || []);
    } catch (error) {
      console.error('Error fetching Sonic gas optimizations:', error);
    } finally {
      setLoading(false);
    }
  }
  
  if (!show) return null;
  
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sonic-Specific Optimizations
      </h3>
      
      {loading ? (
        <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p>Loading Sonic optimizations...</p>
        </div>
      ) : optimizations.length === 0 ? (
        <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
          <p style={{ margin: 0 }}>No Sonic-specific optimizations available for this contract.</p>
        </div>
      ) : (
        <div>
          {optimizations.map((opt, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '1rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                border: '1px solid #e5e7eb' 
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>{opt.title}</h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>{opt.description}</p>
              
              {opt.codeSnippet && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Original Code:</div>
                  <pre style={{ 
                    backgroundColor: '#f1f5f9', 
                    padding: '0.5rem', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    overflow: 'auto'
                  }}>
                    {opt.codeSnippet}
                  </pre>
                </div>
              )}
              
              {opt.sonicOptimizedCode && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Sonic-Optimized Code:</div>
                  <pre style={{ 
                    backgroundColor: '#ecfdf5', 
                    padding: '0.5rem', 
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    overflow: 'auto'
                  }}>
                    {opt.sonicOptimizedCode}
                  </pre>
                </div>
              )}
              
              {opt.gasSavings && (
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#047857'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                    <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />
                  </svg>
                  Estimated Gas Savings: {opt.gasSavings} (~{opt.costSavings || '0.01'} ETH at current prices)
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Autonomous Monitoring Control component
function AutonomousMonitoring({ contractAddress, network, isEnabled, onToggle }) {
  const [isActive, setIsActive] = useState(isEnabled);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleToggle = async () => {
    setIsLoading(true);
    try {
      // Call API to toggle monitoring state
      const response = await fetch('/api/zerebro/monitor/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: contractAddress,
          network,
          enabled: !isActive
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle monitoring');
      }
      
      setIsActive(!isActive);
      if (onToggle) onToggle(!isActive);
      
    } catch (error) {
      console.error('Error toggling monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.5rem',
      marginTop: '1.5rem',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
              <path d="M19 11V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
              <circle cx="16" cy="16" r="6" />
              <path d="M16 14v4" />
              <path d="M16 22v.01" />
            </svg>
            ZerePy Autonomous Monitoring
          </div>
        </h3>
        <div>
          <button
            onClick={handleToggle}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: isActive ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <>
                <svg 
                  style={{ 
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.25rem',
                    height: '0.875rem',
                    width: '0.875rem'
                  }} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    style={{ opacity: 0.25 }} 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    style={{ opacity: 0.75 }} 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : isActive ? 'Disable Monitoring' : 'Enable Monitoring'}
          </button>
        </div>
      </div>
      
      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
        {isActive ? 
          'This contract is being continuously monitored by our ZerePy AI agent. You will receive alerts for any suspicious activities or vulnerabilities detected.' : 
          'Enable autonomous monitoring to have our ZerePy AI agent continuously check this contract for security issues and malicious activities.'}
      </p>
      
      {isActive && (
        <div style={{ 
          marginTop: '0.75rem', 
          padding: '0.5rem',
          backgroundColor: '#f0fdfa',
          borderRadius: '0.375rem',
          border: '1px solid #d1fae5',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', color: '#047857' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Monitoring active since {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Audit() {
  const router = useRouter();
  const { account, connect } = useWallet();
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  // 1. Add ZerePy agent status state
  const [zerebyAgentStatus, setZerebyAgentStatus] = useState({ active: false, lastUpdated: null });
  // 2. Add ZerePy status check in useEffect
  useEffect(() => {
    console.log("Audit component mounted, checking wallet connection");
    console.log("Current wallet account:", account);
    
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
    
    checkAgentStatus();
  }, [account]);

  
  // Create refs at the component's top level
  const prevAddressRef = useRef(null);
  const prevNetworkRef = useRef(null);

  // Detect if address is provided in URL query
  useEffect(() => {
    if (router.query.address) {
      const currentAddress = router.query.address;
      const currentNetwork = router.query.network || 'mainnet';
      
      // Only make the API call if the address or network has changed
      if (prevAddressRef.current !== currentAddress || 
          prevNetworkRef.current !== currentNetwork) {
        
        setAddress(currentAddress);
        if (router.query.network) {
          setNetwork(currentNetwork);
        }
        
        // Update our refs
        prevAddressRef.current = currentAddress;
        prevNetworkRef.current = currentNetwork;
        
        // Auto-analyze if address is provided via URL
        handleSubmit(null, currentAddress, currentNetwork);
      }
    }
  }, [router.query]);

  // Check wallet connection on component mount
  useEffect(() => {
    console.log("Audit component mounted, checking wallet connection");
    console.log("Current wallet account:", account);
  }, [account]);

  async function handleSubmit(e, addressOverride, networkOverride) {
    if (e) e.preventDefault();
    
    const contractAddress = addressOverride || address.trim();
    const contractNetwork = networkOverride || network;

    const apiEndpoint = contractNetwork === 'sonic' 
      ? '/api/zerebro/analyze' 
      : '/api/analyze';
    
    if (!contractAddress) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Call the actual API endpoint to analyze the contract
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: contractAddress,
          network: contractNetwork
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze contract');
      }
      
      const data = await response.json();
      setResult(data);
      console.log("Audit result:", {
        isSafe: data.isSafe,
        securityScore: data.securityScore || data.analysis?.securityScore,
        riskLevel: data.riskLevel
      });
      
      // Force the contract to be considered safe if the security score is high enough
      if (data.analysis?.securityScore >= 70 || data.securityScore >= 70) {
        data.isSafe = true;
      }
      // Update the URL without reloading the page
      router.push({
        pathname: router.pathname,
        query: { address: contractAddress, network: contractNetwork }
      }, undefined, { shallow: true });
    } catch (err) {
      console.error('Error analyzing contract:', err);
      setError(err.message || 'An error occurred while analyzing the contract');
    } finally {
      setIsLoading(false);
    }
  }

  // Group findings by severity
  function groupFindingsBySeverity(findings) {
    const findingsBySeverity = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
      INFO: []
    };
    
    // Count findings for each severity level
    const findingCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };
    
    // Organize findings by severity
    (findings || []).forEach(finding => {
      const severity = finding.severity?.toUpperCase();
      
      if (severity && findingsBySeverity[severity]) {
        findingsBySeverity[severity].push(finding);
        
        // Update counts
        if (severity === 'CRITICAL') findingCounts.critical++;
        else if (severity === 'HIGH') findingCounts.high++;
        else if (severity === 'MEDIUM') findingCounts.medium++;
        else if (severity === 'LOW') findingCounts.low++;
        else if (severity === 'INFO') findingCounts.info++;
      } else {
        // Default to LOW if severity not specified
        findingsBySeverity.LOW.push({...finding, severity: 'LOW'});
        findingCounts.low++;
      }
    });
    
    return { findingsBySeverity, findingCounts };
  }

  const { findingsBySeverity, findingCounts } = result?.analysis?.risks 
    ? groupFindingsBySeverity(result.analysis.risks) 
    : { findingsBySeverity: {}, findingCounts: {} };

  // Log account status to help debugging
  console.log("Current wallet account in Audit component:", account);
  console.log("Is result safe?", result?.isSafe);

  return (
    <Layout>
      <Head>
        <title>Contract Audit - DeFi Watchdog</title>
        {/* Add CSS for the spinner animation */}
        <style jsx global>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Head>
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Smart Contract Audit</h1>
        <p style={{ marginBottom: '2rem' }}>Enter a smart contract address to analyze:</p>
        
        {!result ? (
          <div style={{ maxWidth: '800px', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <ZerePyAgentStatus 
              isActive={zerebyAgentStatus.active} 
              lastUpdated={zerebyAgentStatus.lastUpdated} 
            />
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="contract-address" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Contract Address
                </label>
                <input 
                  type="text" 
                  id="contract-address"
                  placeholder="0x..." 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #ccc', 
                    borderRadius: '0.25rem'
                  }} 
                />
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="network" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Network
                </label>
                <select
                  id="network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #ccc', 
                    borderRadius: '0.25rem'
                  }}
                >
                  <option value="mainnet">Linea Mainnet</option>
                  <option value="sonic">Sonic</option>
                </select>
              </div>
              
              {error && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: '0.375rem', color: '#991B1B' }}>
                  <p style={{ fontWeight: '500' }}>{error}</p>
                </div>
              )}
              
              {/* Add the MultiAI Progress indicator */}
              {isLoading && <MultiAIProgress isRunning={isLoading} />}
              
              <button 
                type="submit"
                disabled={isLoading || !address.trim()}
                style={{ 
                  backgroundColor: '#0284c7', 
                  color: 'white', 
                  padding: '0.75rem 1.5rem', 
                  border: 'none', 
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  opacity: isLoading || !address.trim() ? '0.7' : '1',
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '1.5rem'
                }}
              >
                {isLoading && (
                  <svg 
                    style={{ 
                      animation: 'spin 1s linear infinite',
                      marginRight: '0.5rem',
                      height: '1rem',
                      width: '1rem'
                    }} 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      style={{ opacity: 0.25 }} 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    ></circle>
                    <path 
                      style={{ opacity: 0.75 }} 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isLoading ? 'Analyzing...' : 'Analyze Contract'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ maxWidth: '1000px' }}>
            {result.isSafe ? (
              <ImprovedSafeResult result={result} />
            ) : (
              <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #eee', backgroundColor: '#fef2f2' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Contract Analysis Results <NetworkBadge network={network} /> </h2>
                    <p style={{ color: '#6b7280' }}>{result.contractName} ({result.address.substring(0, 6)}...{result.address.slice(-4)})</p>
                  </div>
                  <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Risks Detected
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 'normal' }}>Contract Name</h3>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{result.contractName}</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 'normal' }}>Contract Type</h3>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{result.analysis.contractType}</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 'normal' }}>Compiler Version</h3>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{result.compiler}</p>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: 'normal' }}>Security Score</h3>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#ef4444' }}>{result.analysis.securityScore}/100</p>
                    </div>
                  </div>
                </div>
                
                {/* Tab Navigation */}
                <div style={{ borderBottom: '1px solid #eee' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
                    <button
                      onClick={() => setActiveTab('overview')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'overview' ? '2px solid #0284c7' : 'none',
                        fontWeight: activeTab === 'overview' ? 'bold' : 'normal',
                        color: activeTab === 'overview' ? '#0284c7' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Overview
                    </button>
                    {network === 'sonic' && (
                    <button
                      onClick={() => setActiveTab('sonic')}
                      style={{
                        padding: '1rem',
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
                        Sonic Optimizations
                      </button>
                    )}

                    <button
                      onClick={() => setActiveTab('findings')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'findings' ? '2px solid #0284c7' : 'none',
                        fontWeight: activeTab === 'findings' ? 'bold' : 'normal',
                        color: activeTab === 'findings' ? '#0284c7' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      Findings
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('fixes')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'fixes' ? '2px solid #0284c7' : 'none',
                        fontWeight: activeTab === 'fixes' ? 'bold' : 'normal',
                        color: activeTab === 'fixes' ? '#0284c7' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      AI Fixes
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('history')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'history' ? '2px solid #0284c7' : 'none',
                        fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                        color: activeTab === 'history' ? '#0284c7' : '#6b7280',
                        cursor: 'pointer'
                      }}
                    >
                      History
                    </button>
                  </div>
                </div>
                
                {/* Tab Content */}
                <div style={{ padding: '1.5rem' }}>
                  {activeTab === 'overview' && (
                    <>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>AI Analysis</h3>
                      
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>What this contract does:</h4>
                        <p>{result.analysis.overview || result.summary}</p>
                      </div>
                      
                      {/* Add Analysis Discussion component here */}
                      {result.analysis.analysisDiscussion && (
                        <AnalysisDiscussion discussion={result.analysis.analysisDiscussion} />
                      )}
                      
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Security Assessment:</h4>
                        <p>{result.analysis.explanation}</p>
                      </div>
                      
                      {/* Risk Summary */}
                      {(findingCounts.critical > 0 || findingCounts.high > 0 || findingCounts.medium > 0) && (
                        <div style={{ marginTop: '1.5rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Risk Summary:</h4>
                          <RiskSummary findingCounts={findingCounts} />
                        </div>
                      )}
                      
                      {result.analysis.risks && result.analysis.risks.length > 0 && (
                        <div style={{ 
                          marginTop: '1.5rem', 
                          backgroundColor: '#fee2e2',
                          padding: '1rem',
                          borderRadius: '0.375rem'
                        }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#991b1b' }}>
                            Identified Risks:
                          </h4>
                          <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                            {result.analysis.risks.map((risk, index) => (
                              <li key={index} style={{ marginBottom: '0.5rem' }}>
                                <strong>{risk.severity}:</strong> {risk.description} 
                                {risk.codeReference && <span style={{ color: '#6b7280' }}> ({risk.codeReference})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'sonic' && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Sonic-Specific Optimizations
                      </h3>
                      
                      <SonicGasOptimizations 
                        contractAddress={result.address} 
                        show={true} 
                      />
                      
                      <div style={{ marginTop: '2rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Autonomous Monitoring</h4>
                        <AutonomousMonitoring 
                          contractAddress={result.address} 
                          network={network} 
                          isEnabled={false} 
                          onToggle={() => {}} 
                        />
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'findings' && (
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Detailed Findings</h3>
                      
                      <RiskSummary findingCounts={findingCounts} />
                      
                      {/* Display findings by severity */}
                      {Object.keys(findingsBySeverity).map(severity => (
                        findingsBySeverity[severity].length > 0 && (
                          <div key={severity} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              marginBottom: '0.75rem',
                              color: severity === 'CRITICAL' ? '#991b1b' :
                                    severity === 'HIGH' ? '#c2410c' :
                                    severity === 'MEDIUM' ? '#b45309' :
                                    severity === 'LOW' ? '#166534' : '#1e40af'
                            }}>
                              {severity.charAt(0) + severity.slice(1).toLowerCase()} Issues ({findingsBySeverity[severity].length})
                            </h4>
                            
                            {findingsBySeverity[severity].map((finding, index) => (
                              <FindingCard key={index} finding={finding} />
                            ))}
                          </div>
                        )
                      ))}
                      
                      {(!result.analysis.risks || result.analysis.risks.length === 0) && (
                        <div style={{ 
                          padding: '24px', 
                          textAlign: 'center', 
                          backgroundColor: '#F3F4F6',
                          borderRadius: '8px',
                          color: '#4B5563'
                        }}>
                          <p>No specific issues found in this contract!</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'fixes' && (
                    <PatchGenerator 
                      findings={result.analysis.risks || []} 
                      contractAddress={result.address} 
                      network={network}
                    />
                  )}
                  
                  {activeTab === 'history' && (
                    <AuditHistory 
                      contractAddress={result.address} 
                      network={network}
                    />
                  )}
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#f9fafb' }}>
                  <a 
                    href={result.etherscanUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      color: '#4b5563',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    View on Etherscan
                  </a>
                </div>
              </div>
            )}
            
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setResult(null)}
                style={{ 
                  display: 'inline-flex',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  color: '#4b5563',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Analyze Another Contract
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}