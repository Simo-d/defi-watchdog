// components/RiskCategory.js
import React from 'react';

const severityColorMap = {
  CRITICAL: '#FF3B30', // Red
  HIGH: '#FF9500',     // Orange
  MEDIUM: '#FFCC00',   // Yellow
  LOW: '#34C759',      // Green
  INFO: '#007AFF'      // Blue
};

const severityIconMap = {
  CRITICAL: '🟥',
  HIGH: '🟧',
  MEDIUM: '🟨',
  LOW: '🟩',
  INFO: '🟦'
};

const severityDescriptions = {
  CRITICAL: 'Severe vulnerabilities that will lead to immediate loss of funds, contract lockup, or complete control by attacker',
  HIGH: 'Serious vulnerabilities that could lead to potential loss of funds or contract control',
  MEDIUM: 'Vulnerabilities that could cause contract malfunction or limited impact issues',
  LOW: 'Issues that don\'t pose immediate risk but should be addressed',
  INFO: 'Best practice suggestions and informational findings'
};

export function SeverityBadge({ severity }) {
  const normalizedSeverity = severity.toUpperCase();
  
  return (
    <span 
      style={{
        backgroundColor: severityColorMap[normalizedSeverity] || '#6C757D',
        color: '#FFFFFF',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        display: 'inline-block'
      }}
    >
      {normalizedSeverity}
    </span>
  );
}

export function FindingCard({ finding }) {
  const normalizedSeverity = finding.severity.toUpperCase();
  
  return (
    <div 
      style={{
        border: `1px solid ${severityColorMap[normalizedSeverity] || '#6C757D'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#FFFFFF'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
          {severityIconMap[normalizedSeverity]} {finding.title}
        </h3>
        <SeverityBadge severity={normalizedSeverity} />
      </div>
      
      <p style={{ fontSize: '0.875rem', margin: '8px 0' }}>{finding.description}</p>
      
      <div style={{ marginTop: '12px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Impact</h4>
        <p style={{ fontSize: '0.875rem', margin: '4px 0' }}>{finding.impact}</p>
      </div>
      
      {finding.codeSnippet && (
        <div style={{ marginTop: '12px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Code</h4>
          <pre 
            style={{ 
              backgroundColor: '#F8F9FA',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.75rem',
              margin: '4px 0'
            }}
          >
            {finding.codeSnippet}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '12px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Recommendation</h4>
        <p style={{ fontSize: '0.875rem', margin: '4px 0' }}>{finding.recommendation}</p>
      </div>
      
      {finding.suggestedFix && (
        <div style={{ marginTop: '12px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '4px 0' }}>Suggested Fix</h4>
          <pre 
            style={{ 
              backgroundColor: '#F8F9FA',
              padding: '8px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.75rem',
              margin: '4px 0'
            }}
          >
            {finding.suggestedFix}
          </pre>
        </div>
      )}
    </div>
  );
}

export function RiskCategorySummary({ findingCounts }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px' }}>Risk Categories</h3>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '8px', 
            backgroundColor: severityColorMap.CRITICAL + '20',
            borderRadius: '4px',
            minWidth: '140px'
          }}
        >
          <span style={{ marginRight: '8px' }}>🟥</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Critical</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{findingCounts.critical || 0}</div>
          </div>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '8px', 
            backgroundColor: severityColorMap.HIGH + '20',
            borderRadius: '4px',
            minWidth: '140px'
          }}
        >
          <span style={{ marginRight: '8px' }}>🟧</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>High</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{findingCounts.high || 0}</div>
          </div>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '8px', 
            backgroundColor: severityColorMap.MEDIUM + '20',
            borderRadius: '4px',
            minWidth: '140px'
          }}
        >
          <span style={{ marginRight: '8px' }}>🟨</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Medium</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{findingCounts.medium || 0}</div>
          </div>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '8px', 
            backgroundColor: severityColorMap.LOW + '20',
            borderRadius: '4px',
            minWidth: '140px'
          }}
        >
          <span style={{ marginRight: '8px' }}>🟩</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Low</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{findingCounts.low || 0}</div>
          </div>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '8px', 
            backgroundColor: severityColorMap.INFO + '20',
            borderRadius: '4px',
            minWidth: '140px'
          }}
        >
          <span style={{ marginRight: '8px' }}>🟦</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>Info</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{findingCounts.info || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RiskCategories({ findings }) {
  // Group findings by severity
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
  findings.forEach(finding => {
    const severity = finding.severity.toUpperCase();
    
    if (findingsBySeverity[severity]) {
      findingsBySeverity[severity].push(finding);
      
      // Update counts
      if (severity === 'CRITICAL') findingCounts.critical++;
      else if (severity === 'HIGH') findingCounts.high++;
      else if (severity === 'MEDIUM') findingCounts.medium++;
      else if (severity === 'LOW') findingCounts.low++;
      else if (severity === 'INFO') findingCounts.info++;
    }
  });
  
  // Order of severity for display
  const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
  
  return (
    <div>
      <RiskCategorySummary findingCounts={findingCounts} />
      
      {severityOrder.map(severity => (
        findingsBySeverity[severity].length > 0 && (
          <div key={severity} style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              color: severityColorMap[severity],
              display: 'flex',
              alignItems: 'center'
            }}>
              {severityIconMap[severity]} {severity.charAt(0) + severity.slice(1).toLowerCase()} Issues ({findingsBySeverity[severity].length})
            </h2>
            <p style={{ fontSize: '0.875rem', marginBottom: '16px', color: '#4B5563' }}>
              {severityDescriptions[severity]}
            </p>
            
            {findingsBySeverity[severity].map((finding, index) => (
              <FindingCard key={index} finding={finding} />
            ))}
          </div>
        )
      ))}
      
      {findings.length === 0 && (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          color: '#4B5563'
        }}>
          <p>No issues found in this contract!</p>
        </div>
      )}
    </div>
  );
}