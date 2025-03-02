import React, { createContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // Initialize provider from window.ethereum (if available)
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(ethersProvider);

          // Get the network/chain ID
          const network = await ethersProvider.getNetwork();
          setChainId(network.chainId);

          // Check if already connected
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setSigner(ethersProvider.getSigner());
          }
        } catch (err) {
          console.error('Error initializing provider:', err);
        }
      }
    };

    initProvider();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && provider) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(provider.getSigner());
        } else {
          setAccount(null);
          setSigner(null);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider]);

  // Function to connect wallet
  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No Ethereum wallet found. Please install MetaMask.');
      return Promise.reject(new Error('No Ethereum wallet found'));
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(ethersProvider);
        setSigner(ethersProvider.getSigner());
        setAccount(accounts[0]);
        
        // Get the network/chain ID
        const network = await ethersProvider.getNetwork();
        setChainId(network.chainId);
        
        return accounts[0]; // Return the connected account
      }
      throw new Error('No accounts found');
    } catch (err) {
      console.error('Error connecting wallet:', err);
      
      let errorMessage = 'Error connecting wallet. Please try again.';
      if (err.code === 4001) {
        errorMessage = 'You rejected the connection request.';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // Function to disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setSigner(null);
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        signer,
        isConnecting,
        error,
        chainId,
        connect,
        disconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
