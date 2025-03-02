import React, { useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function AuditForm({ onSubmit, isLoading, error }) {
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('mainnet');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (address.trim()) {
      onSubmit(address.trim(), network);
    }
  };

  const sampleAddresses = {
    'mainnet': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI token
    'goerli': '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // WETH on Goerli
    'sepolia': '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', // WETH on Sepolia
    'polygon': '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
  };

  const handleUseSample = () => {
    setAddress(sampleAddresses[network] || sampleAddresses.mainnet);
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Contract Analysis</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Enter the address of any verified smart contract to get an AI-powered security analysis.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div>
            <label htmlFor="contract-address" className="block text-sm font-medium text-gray-700">
              Contract Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                name="contract-address"
                id="contract-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`block w-full pr-10 focus:outline-none sm:text-sm rounded-md ${
                  error
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="0x1234..."
                aria-describedby="contract-address-description"
              />
              {error && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="mt-1 flex justify-between">
              <p className="text-sm text-gray-500" id="contract-address-description">
                Enter a verified contract address on the selected network.
              </p>
              <button
                type="button"
                onClick={handleUseSample}
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Use sample address
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="network" className="block text-sm font-medium text-gray-700">
              Network
            </label>
            <select
              id="network"
              name="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="mainnet">Ethereum Mainnet</option>
              <option value="goerli">Goerli Testnet</option>
              <option value="sepolia">Sepolia Testnet</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
            </select>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error analyzing contract</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-primary-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-800">What happens next?</h3>
                <div className="mt-2 text-sm text-primary-700">
                  <p>
                    We'll fetch the contract's verified source code from Etherscan and analyze it using our
                    AI to identify potential risks and security issues.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !address.trim()}
              className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading || !address.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze Contract'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
