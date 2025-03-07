// components/PatchGenerator.js
import React, { useState } from 'react';
import { SeverityBadge } from './RiskCategory';

// Helper to create a diff viewer with highlighting
function DiffView({ original, fixed }) {
  if (!original || !fixed) return null;
  
  return (
    <div style={{ display: 'flex', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.875rem' }}>
      <div style={{ flex: 1, padding: '12px', backgroundColor: '#FFEEEE', borderRadius: '4px', marginRight: '4px', overflow: 'auto' }}>
        <div style={{ color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Original Code:</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{original}</pre>
      </div>
      <div style={{ flex: 1, padding: '12px', backgroundColor: '#EEFFEE', borderRadius: '4px', marginLeft: '4px', overflow: 'auto' }}>
        <div style={{ color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Fixed Code:</div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{fixed}</pre>
      </div>
    </div>
  );
}

// Component for a single fix
function FixCard({ fix, onApply }) {
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
          {fix.findingTitle}
        </h3>
        {fix.severity && <SeverityBadge severity={fix.severity} />}
      </div>
      
      <p style={{ fontSize: '0.875rem', color: '#4B5563', marginBottom: '16px' }}>
        <strong>Changes: </strong> 
        {fix.diffSummary || 'Code modifications to fix the issue'}
      </p>
      
      {expanded ? (
        <>
          <DiffView original={fix.originalCode} fixed={fix.fixedCode} />
          
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>Explanation</h4>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>{fix.explanation}</p>
          </div>
          
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
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
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
          
          <button
            onClick={() => onApply(fix)}
            style={{
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Apply Fix
          </button>
        </div>
      )}
    </div>
  );
}

// Main component
export default function PatchGenerator({ findings, contractAddress, network }) {
  const [loading, setLoading] = useState(false);
  const [fixes, setFixes] = useState([]);
  const [error, setError] = useState(null);
  const [sourceCode, setSourceCode] = useState(null);
  const [fixedCode, setFixedCode] = useState(null);
  
  // Filter only findings that have code snippets
  const fixableFindings = findings.filter(finding => 
    finding.codeSnippet && 
    (finding.severity === 'CRITICAL' || finding.severity === 'HIGH' || finding.severity === 'MEDIUM')
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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate patches');
      }
      
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
  
  async function handleApplyFix(fix) {
    // If we don't have the source code yet, fetch it
    if (!sourceCode) {
      try {
        const response = await fetch('/api/contract-source', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            address: contractAddress,
            network
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch contract source');
        }
        
        setSourceCode(data.sourceCode);
        
        // Now apply the fix
        const appliedCode = applyFixToSource(data.sourceCode, fix);
        setFixedCode(appliedCode);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching source code:', err);
      }
    } else {
      // Apply the fix to the existing source code
      const appliedCode = applyFixToSource(sourceCode, fix);
      setFixedCode(appliedCode);
    }
  }
  
  // Simple function to apply a fix (in a real application, you would use a proper diffing library)
  function applyFixToSource(source, fix) {
    if (!fix.originalCode || !fix.fixedCode) {
      return source;
    }
    
    // Very simple replacement - in a real app, this would need to be much more sophisticated
    return source.replace(fix.originalCode, fix.fixedCode);
  }
  
  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
          AI-Generated Fixes ({fixableFindings.length} available)
        </h2>
        
        <button
          onClick={generatePatches}
          disabled={loading || fixableFindings.length === 0}
          style={{
            backgroundColor: '#3B82F6',
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
          <p>No fixable issues found in this contract!</p>
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
            <FixCard 
              key={index} 
              fix={fix} 
              onApply={handleApplyFix}
            />
          ))}
        </div>
      )}
      
      {fixedCode && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
            Fixed Contract Code
          </h2>
          <div style={{ 
            backgroundColor: '#F8FAFC', 
            padding: '16px', 
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            <pre style={{ 
              fontSize: '0.875rem', 
              fontFamily: 'monospace',
              margin: 0
            }}>
              {fixedCode}
            </pre>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(fixedCode)
                  .then(() => alert('Fixed code copied to clipboard!'))
                  .catch(err => console.error('Failed to copy: ', err));
              }}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Copy Fixed Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}