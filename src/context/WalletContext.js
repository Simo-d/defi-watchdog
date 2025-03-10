import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

export const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Define event handlers using useCallback to prevent re-creation
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      if (provider) {
        setSigner(provider.getSigner());
      }
    } else {
      setAccount(null);
      setSigner(null);
    }
  }, [provider]);

  const handleChainChanged = useCallback((newChainId) => {
    setChainId(parseInt(newChainId, 16));
    // Only reload if we already have an account connected
    if (account) {
      window.location.reload();
    }
  }, [account]);

  const handleDisconnect = useCallback((error) => {
    setAccount(null);
    setSigner(null);
    setError("Wallet disconnected");
  }, []);

  // Improved wallet detection function
  const detectWallets = useCallback(async () => {
    const wallets = [];
    
    if (typeof window === 'undefined') return wallets;
    
    // Check if EIP-1193 provider exists at all
    if (!window.ethereum) {
      setError("No Web3 wallet detected. Please install MetaMask or another wallet.");
      return wallets;
    }

    
    try {
      // Handle multiple providers case (like MetaMask + Coinbase)
      if (window.ethereum.providers) {
        
        for (const provider of window.ethereum.providers) {
          let name = "Unknown Wallet";
          let icon = "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg";
          
          if (provider.isMetaMask) {
            name = "MetaMask";
            icon = "https://metamask.io/images/metamask-fox.svg";
          } else if (provider.isCoinbaseWallet) {
            name = "Coinbase Wallet";
            icon = "https://www.coinbase.com/assets/favicon-32.png";
          } else if (provider.isWalletConnect) {
            name = "WalletConnect";
            icon = "https://walletconnect.org/walletconnect-logo.png";
          }
          
          wallets.push({ name, icon, provider });
        }
      } else {
        // Single provider case
        let name = "Browser Wallet";
        let icon = "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg";
        
        if (window.ethereum.isMetaMask) {
          name = "MetaMask";
          icon = "https://metamask.io/images/metamask-fox.svg";
        } else if (window.ethereum.isCoinbaseWallet || window.coinbaseWalletExtension) {
          name = "Coinbase Wallet";
          icon = "https://www.coinbase.com/assets/favicon-32.png";
        } else if (window.ethereum.isWalletConnect) {
          name = "WalletConnect";
          icon = "https://walletconnect.org/walletconnect-logo.png";
        }
        
        wallets.push({ name, icon, provider: window.ethereum });
      }
    } catch (err) {
      console.error("Error detecting wallets:", err);
      // Fallback to generic provider
      if (window.ethereum) {
        wallets.push({
          name: "Browser Wallet",
          icon: "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg",
          provider: window.ethereum
        });
      }
    }
    
    setAvailableWallets(wallets);
    return wallets;
  }, []);

  // Check for available wallet providers
  useEffect(() => {
    detectWallets();
    
    // Re-check wallets when visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        detectWallets();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [detectWallets]);

  // Initialize provider if already connected
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;
      
      try {
        const ethereum = window.ethereum;
        
        // Create ethers provider
        const ethersProvider = new ethers.providers.Web3Provider(ethereum, "any");
        setProvider(ethersProvider);

        // Get the network/chain ID
        const network = await ethersProvider.getNetwork().catch(() => ({ chainId: 0 }));
        setChainId(network.chainId);

        // Check if already connected
        const accounts = await ethereum.request({ 
          method: 'eth_accounts' 
        }).catch((err) => {
          console.error("Error getting accounts:", err);
          return [];
        });
        
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setSigner(ethersProvider.getSigner());
        }

        // Set up event listeners
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);
        
      } catch (err) {
        console.error('Error initializing provider:', err);
      }
    };

    initProvider();

    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // Enhanced connect to wallet function
  const connectToWallet = async (walletProvider) => {
    setIsConnecting(true);
    setError(null);
    setConnectionAttempts(prev => prev + 1);
    
    
    if (!walletProvider) {
      const error = "No wallet provider specified";
      console.error(error);
      setError(error);
      setIsConnecting(false);
      throw new Error(error);
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection timed out after 15 seconds")), 15000)
    );
    
    try {
      // First check if the provider is accessible
      if (typeof walletProvider.request !== 'function') {
        throw new Error("Invalid wallet provider: missing request method");
      }
      
      // Race the connection with the timeout
      const accounts = await Promise.race([
        walletProvider.request({ method: 'eth_requestAccounts' }),
        timeoutPromise
      ]);
      
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }
      
      const account = accounts[0];
      setAccount(account);
      
      // Get provider and signer
      const provider = new ethers.providers.Web3Provider(walletProvider, "any");
      const signer = provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);
      
      // Get the network/chain ID
      const network = await provider.getNetwork();
      setChainId(network.chainId);
      
      return account;
    } catch (error) {
      console.error("Wallet connection error:", error);
      
      // Provide more specific error messages
      if (error.code === 4001) {
        setError("You rejected the connection request. Please approve the connection in your wallet.");
      } else if (error.code === -32002) {
        setError("Connection request already pending. Please open your wallet extension and confirm the connection.");
      } else if (error.message.includes("timed out")) {
        setError("Connection timed out. Please check if your wallet is responding and try again.");
      } else if (typeof window.ethereum === 'undefined') {
        setError("No wallet detected. Please install MetaMask or another Web3 wallet.");
      } else {
        setError(error.message || "Failed to connect wallet");
      }
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Improved connect function
  const connect = async (walletName) => {
    try {
      // Detect wallets again to make sure we have the latest
      const wallets = await detectWallets();
      
      if (wallets.length === 0) {
        const error = "No wallet extensions detected. Please install MetaMask or another Web3 wallet.";
        setError(error);
        throw new Error(error);
      }
      
      // If wallet name is provided, find that specific wallet
      if (walletName) {
        const selectedWallet = wallets.find(w => w.name === walletName);
        if (selectedWallet) {
          return connectToWallet(selectedWallet.provider);
        } else {
          const error = `Wallet "${walletName}" not found or not installed`;
          setError(error);
          throw new Error(error);
        }
      }
      
      // If no specific wallet requested but we have available wallets, use the first one
      if (wallets.length > 0) {
        return connectToWallet(wallets[0].provider);
      }
    } catch (error) {
      console.error("Error in connect function:", error);
      setError(error.message || "Failed to connect to wallet");
      throw error;
    }
  };

  // Function to disconnect wallet
  const disconnect = () => {
    setAccount(null);
    setSigner(null);
    setError(null);
  };

  // Function to switch chains
  const switchChain = async (chainId) => {
    if (!provider || !window.ethereum) {
      setError("No wallet connected");
      return false;
    }
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error("Error switching chain:", error);
      setError(`Failed to switch network: ${error.message}`);
      return false;
    }
  };

  // Debug helper function
  const getEthereumObject = () => {
    return window.ethereum;
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
        disconnect,
        switchChain,
        availableWallets,
        connectToWallet,
        connectionAttempts,
        detectWallets,
        getEthereumObject
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}