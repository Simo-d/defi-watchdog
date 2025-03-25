import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '../../hooks/useWallet';



export default function Header() {
  const { account, connect, disconnect } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const router = useRouter();
  const [chainId, setChainId] = useState(null);
const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  // Handle scroll for transparent to solid header transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainId = parseInt(chainId, 16);
          setChainId(currentChainId);
          setIsCorrectNetwork(currentChainId === 146); // Sonic chain ID
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };
    
    checkNetwork();
    
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, []);
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);
// Add this function in Header.js
const handleNetworkSwitch = async () => {
  const SONIC_CHAIN_ID = 146; // Sonic Chain ID
  
  if (!account || !window.ethereum) return;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SONIC_CHAIN_ID.toString(16)}` }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.message.includes('wallet_addEthereumChain')) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${SONIC_CHAIN_ID.toString(16)}`,
            chainName: 'Sonic',
            nativeCurrency: {
              name: 'SONIC',
              symbol: 'SONIC',
              decimals: 18
            },
            rpcUrls: ['https://mainnet.sonic.io/rpc'],
            blockExplorerUrls: ['https://sonicscan.org/']
          }],
        });
      } catch (addError) {
        setConnectionError('Could not add Sonic network to your wallet. Please add it manually.');
      }
    } else {
      setConnectionError('Failed to switch to Sonic network. Please try again.');
    }
  }
};
  // Menu items
  const menuItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/audit', label: 'Audit' },
    { path: '/how-it-works', label: 'How It Works' }
  ];

  // Handle wallet connection with simpler, direct approach
  const handleWalletConnect = async () => {
    // If already connected, disconnect
    if (account) {
      disconnect();
      return;
    }
    
    // Otherwise try to connect
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Direct ethereum connection for maximum compatibility
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Try the most reliable method first
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          // If we get here, connection was successful
          console.log("Connected to wallet:", accounts[0]);
          
          // Let the context know we're connected (if not auto-detected)
          if (typeof connect === 'function') {
            await connect();
          }
        } catch (requestError) {
          console.error("Error requesting accounts:", requestError);
          throw new Error("Wallet connection failed. Please check your wallet extension.");
        }
      } else {
        throw new Error("No wallet detected. Please install MetaMask or another Web3 wallet.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Format account address for display
  const formatAccount = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/90 backdrop-blur-md shadow-md py-3' 
        : 'bg-gradient-to-b from-gray-300/70 to-transparent py-5'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div className="relative">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <span className="text-xs">🤖</span>
            </div>
          </div>
          <span className={`ml-2 font-semibold text-lg transition-colors duration-300 ${
            scrolled ? 'text-gray-800' : 'text-white drop-shadow-sm'
          }`}>
            DeFi<span className={`${scrolled ? 'text-blue-600' : 'text-blue-400'}`}>Watchdog</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`
                relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300
                ${router.pathname === item.path 
                  ? scrolled ? 'text-blue-600' : 'text-blue-400'
                  : scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white hover:text-white'}
                ${router.pathname === item.path && scrolled ? 'bg-blue-50' : ''}
                ${router.pathname === item.path && !scrolled ? 'bg-white/20 backdrop-filter backdrop-blur-sm' : ''}
                hover:bg-opacity-10 hover:bg-white
                ${!scrolled && 'drop-shadow-sm'}
              `}
            >
              {item.label}
              {router.pathname === item.path && (
                <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  scrolled ? 'bg-blue-500' : 'bg-blue-400'
                } transform translate-y-1 rounded`}></span>
              )}
            </Link>
          ))}
        </nav>

        {/* Wallet Button and Mobile Menu Toggle */}
        <div className="flex items-center">
          {/* Simple Wallet Connect Button */}
          <button
            onClick={handleWalletConnect}
            disabled={isConnecting}
            className={`
              mr-2 md:mr-0 rounded-lg py-2 px-4 text-sm font-medium transition-all duration-300 flex items-center
              ${account 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : !scrolled
                  ? 'bg-blue-500 text-white shadow-md hover:shadow-lg hover:bg-blue-600'
                  : 'bg-blue-600 text-white shadow-md hover:shadow-lg hover:bg-blue-700'}
              ${isConnecting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {account ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                {formatAccount(account)}
              </>
            ) : isConnecting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect Wallet
              </>
            )}
          </button>
          {account && (
            <div className="flex items-center mr-2">
              <div className={`px-2 py-1 rounded-l-full text-xs font-medium ${
                isCorrectNetwork 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {isCorrectNetwork ? 'Sonic' : 'Wrong Network'}
              </div>
              {!isCorrectNetwork && (
                <button
                  onClick={handleNetworkSwitch}
                  className="px-2 py-1 rounded-r-full text-xs font-medium bg-blue-500 text-white border border-blue-600 hover:bg-blue-600 transition-colors"
                >
                  Switch
                </button>
              )}
            </div>
          )}
          {/* Connection Error Indicator (if any) */}
          {connectionError && !account && (
            <div className="hidden md:block absolute top-20 right-4 bg-red-100 text-red-700 p-2 rounded-md text-xs border border-red-200 max-w-xs">
              {connectionError}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className={`inline-flex items-center justify-center p-2 rounded-md md:hidden ${
              scrolled ? 'text-gray-700' : 'text-white'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <div className="relative w-6 h-5">
              <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'rotate-45 translate-y-2' : '-translate-y-2'}`}></span>
              <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out ${mobileMenuOpen ? '-rotate-45 translate-y-2' : 'translate-y-2'}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container mx-auto px-4 py-3 bg-white shadow-lg rounded-b-xl mt-2">
          <nav className="flex flex-col space-y-3">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={`
                  px-4 py-2 rounded-md font-medium text-sm
                  ${router.pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
                `}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Error Message (if any) in Mobile Menu */}
            {connectionError && !account && (
              <div className="px-4 py-2 text-xs text-red-600 bg-red-50 rounded-md mt-2">
                {connectionError}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}