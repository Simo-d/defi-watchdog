import { useState } from 'react';
import { useRouter } from 'next/router';
import { useContract } from '../../hooks/useContract';
import { useWallet } from '../../hooks/useWallet';
import { ethers } from 'ethers';

export default function MintButton({ contractAddress }) {
  const router = useRouter();
  const { account } = useWallet();
  const { mintFee, mintCertificate, loading: contractLoading } = useContract();
  const [isLoading, setIsLoading] = useState(false);

  async function handleMint() {
    // For demo purposes
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    
    if (demoMode) {
      // In demo mode, just redirect to a sample certificate page
      router.push('/certificate/1');
      return;
    }
    
    if (!account) {
      // If wallet is not connected, do nothing (user should connect wallet first)
      console.log('Wallet not connected');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting mint process for:', contractAddress);
      
      // Call mintCertificate function from our hook without showing any alerts
      const tokenId = await mintCertificate(contractAddress);
      console.log('Mint successful, token ID:', tokenId);
      
      // Redirect to the certificate page after successful transaction
      router.push(`/certificate/${tokenId}`);
    } catch (err) {
      // Log error but don't show alert
      console.error('Minting error:', err);
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
        disabled={isLoading || !account}
        style={{
          backgroundColor: isLoading || !account ? '#9CA3AF' : '#10B981',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          cursor: isLoading || !account ? 'not-allowed' : 'pointer',
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
    </div>
  );
}