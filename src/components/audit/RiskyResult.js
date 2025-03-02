import React from 'react';
import { ExclamationIcon } from '@heroicons/react/24/solid';

export default function RiskyResult({ result }) {
  // Helper function to get color based on risk severity
  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-yellow-500';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-red-50">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Contract Analysis Results
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {result.contractName} ({result.address.substring(0, 6)}...{result.address.slice(-4)})
          </p>
        </div>
        <div>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <ExclamationIcon className="h-5 w-5 mr-1" />
            Risks Detected
          </span>
        </div>
      </div>

      <div className="border-t border-red-200 px-4 py-5 sm:p-6 bg-red-50">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Warning: Security Risks Detected</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Our AI analysis has identified potential security risks in this contract. 
                  Exercise caution before interacting with it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">
              Contract Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {result.contractName}
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">
              Contract Type
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {result.analysis.contractType || 'Unknown'}
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">
              Compiler Version
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {result.compiler}
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">
              Security Score
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="font-semibold text-red-600">{result.analysis.securityScore}/100</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          AI Analysis
        </h3>

        <div className="prose max-w-none text-gray-500">
          <h4 className="text-gray-900 font-medium">What this contract does:</h4>
          <p>{result.summary}</p>

          <h4 className="text-gray-900 font-medium mt-4">Security Assessment:</h4>
          <p>{result.analysis.explanation}</p>

          {result.analysis.risks && result.analysis.risks.length > 0 && (
            <div className="mt-4 bg-red-50 p-4 rounded-md">
              <h4 className="text-red-800 font-medium">
                Identified Risks:
              </h4>
              <ul className="list-disc pl-5 mt-2">
                {result.analysis.risks.map((risk, index) => (
                  <li 
                    key={index} 
                    className={getSeverityColor(risk.severity)}
                  >
                    <strong>{risk.severity}:</strong> {risk.description} 
                    {risk.codeReference && <span className="text-gray-500"> ({risk.codeReference})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.analysis.riskyCodeSnippets && result.analysis.riskyCodeSnippets.length > 0 && (
            <div className="mt-6">
              <h4 className="text-gray-900 font-medium">Risky Code Sections:</h4>
              {result.analysis.riskyCodeSnippets.map((snippet, index) => (
                <div key={index} className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h5 className="font-medium text-red-700">{snippet.title}</h5>
                  <pre className="mt-2 bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
                    {snippet.code}
                  </pre>
                  <p className="mt-2 text-sm text-gray-700">{snippet.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <a 
            href={result.etherscanUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View on Etherscan
          </a>
          <button 
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={() => window.print()}
          >
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
