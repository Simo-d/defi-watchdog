import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { useWallet } from '../hooks/useWallet';
import MintButton from '../components/certificate/MintButton';
import styles from '../styles/components/All.module.css';

export default function Audit() {
  const router = useRouter();
  const { account, connect } = useWallet();
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    setError(null);
    
    try {
      // Call the actual API endpoint to analyze the contract
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address.trim(),
          network: network
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze contract');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error analyzing contract:', err);
      setError(err.message || 'An error occurred while analyzing the contract');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Contract Audit - DeFi Watchdog</title>
      </Head>
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '1rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Smart Contract Audit</h1>
        <p style={{ marginBottom: '2rem' }}>Enter a smart contract address to analyze:</p>
        
        {!result ? (
          <div style={{ maxWidth: '800px', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                  <option value="mainnet">Ethereum Mainnet</option>
                  <option value="goerli">Goerli Testnet</option>
                  <option value="sepolia">Sepolia Testnet</option>
                  <option value="polygon">Polygon</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="optimism">Optimism</option>
                  <option value="linea-mainnet">Linea Mainnet</option>
                  <option value="linea-testnet">Linea Testnet</option>
                  <option value="linea-sepolia">Linea Sepolia</option>
                </select>
              </div>
              
              {error && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: '0.375rem', color: '#991B1B' }}>
                  <p style={{ fontWeight: '500' }}>{error}</p>
                </div>
              )}
              
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
                  alignItems: 'center'
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
            <div style={{ background: 'white', borderRadius: '0.5rem', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #eee', backgroundColor: result.isSafe ? '#f0fdf4' : '#fef2f2' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Contract Analysis Results</h2>
                  <p style={{ color: '#6b7280' }}>{result.contractName} ({result.address.substring(0, 6)}...{result.address.slice(-4)})</p>
                </div>
                <div style={{ 
                  backgroundColor: result.isSafe ? '#dcfce7' : '#fee2e2', 
                  color: result.isSafe ? '#166534' : '#991b1b',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  {result.isSafe ? 'Safe' : 'Risks Detected'}
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
                    <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{result.analysis.securityScore}/100</p>
                  </div>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>AI Analysis</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>What this contract does:</h4>
                  <p>{result.summary}</p>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Security Assessment:</h4>
                  <p>{result.analysis.explanation}</p>
                </div>
                
                {result.analysis.risks && result.analysis.risks.length > 0 && (
                  <div style={{ 
                    marginTop: '1.5rem', 
                    backgroundColor: result.isSafe ? '#f9fafb' : '#fee2e2',
                    padding: '1rem',
                    borderRadius: '0.375rem'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: result.isSafe ? '#111827' : '#991b1b' }}>
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
                
                {result.isSafe && (
                  <MintButton contractAddress={result.address} />
                )}
              </div>
            </div>
            
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