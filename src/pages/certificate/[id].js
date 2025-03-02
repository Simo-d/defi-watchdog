import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/layout/Layout';
import { useContract } from '../../hooks/useContract';

export default function CertificatePage() {
  const router = useRouter();
  const { id } = router.query;
  const { contract } = useContract();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!id || !contract) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // For demo purposes, create a mock certificate
        // In a real app, you would get this data from the contract
        setCertificate({
          id,
          contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token for demo
          owner: '0x7823453F21',
          network: 'goerli',
          date: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id, contract]);

  if (loading) {
    return (
      <Layout>
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
          <p>Loading certificate...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
          <h1>Certificate Error</h1>
          <p style={{ color: '#EF4444' }}>{error}</p>
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => router.push('/audit')}
              style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Back to Audit
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!certificate) {
    return (
      <Layout>
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', textAlign: 'center' }}>
          <p>Certificate not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Certificate #{id} - DeFi Watchdog</title>
        <meta name="description" content={`Safety certificate for contract ${certificate.contractAddress}`} />
      </Head>

      <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F0FDF4'
          }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>
                DeFi Watchdog Safety Certificate
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                NFT ID: #{id}
              </p>
            </div>
            <div style={{ 
              backgroundColor: '#D1FAE5',
              borderRadius: '9999px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid white'
            }}>
              <svg 
                style={{ height: '1.5rem', width: '1.5rem', color: '#10B981' }} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <div style={{ padding: '1.5rem', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', marginBottom: '1rem' }}>
              <div style={{ width: '33%', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>
                Contract Address
              </div>
              <div style={{ width: '67%', fontSize: '0.875rem', color: '#111827' }}>
                {certificate.contractAddress}
              </div>
            </div>
            <div style={{ display: 'flex', marginBottom: '1rem' }}>
              <div style={{ width: '33%', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>
                Certificate Owner
              </div>
              <div style={{ width: '67%', fontSize: '0.875rem', color: '#111827' }}>
                {certificate.owner}
              </div>
            </div>
            <div style={{ display: 'flex', marginBottom: '1rem' }}>
              <div style={{ width: '33%', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>
                Analysis Date
              </div>
              <div style={{ width: '67%', fontSize: '0.875rem', color: '#111827' }}>
                {new Date(certificate.date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', marginBottom: '1rem' }}>
              <div style={{ width: '33%', fontSize: '0.875rem', fontWeight: '500', color: '#6B7280' }}>
                Security Status
              </div>
              <div style={{ width: '67%', fontSize: '0.875rem', color: '#111827', display: 'flex', alignItems: 'center' }}>
                <span style={{ 
                  backgroundColor: '#D1FAE5',
                  color: '#064E3B',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  marginRight: '0.5rem'
                }}>
                  Safe
                </span>
                No critical vulnerabilities detected
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', backgroundColor: '#F9FAFB', textAlign: 'center' }}>
            <button
              onClick={() => router.push('/audit')}
              style={{
                backgroundColor: '#4F46E5',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Audit Another Contract
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
