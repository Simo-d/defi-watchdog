import React from 'react';
import MintButton from '../certificate/MintButton';
import { useWallet } from '../hooks/useWallet';

export default function SafeResult({ result }) {
  const { account } = useWallet();
  
  console.log("SafeResult rendering, wallet account:", account);

  return (
    <div style={{ 
      backgroundColor: '#FFFFFF', 
      borderRadius: '0.5rem', 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }}>
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
        
        <MintButton contractAddress={result.address} />
      </div>
    </div>
  );
}