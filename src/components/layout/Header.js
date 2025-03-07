import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '../../hooks/useWallet';

export default function Header() {
  const { account, connect, disconnect } = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  // Handle scroll for transparent to solid header transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check on mount
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [router.pathname]);

  // Menu items
  const menuItems = [
    { path: '/', label: 'Home' },
    { path: '/audit', label: 'Audit' },
    { path: '/how-it-works', label: 'How It Works' }
  ];

  // Handle wallet connection
  const handleWalletClick = () => {
    if (account) {
      disconnect();
    } else {
      connect();
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
          <button
            onClick={handleWalletClick}
            className={`
              mr-2 md:mr-0 rounded-lg py-2 px-4 text-sm font-medium transition-all duration-300 flex items-center
              ${account 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : !scrolled
                  ? 'bg-blue-500 text-white shadow-md hover:shadow-lg hover:bg-blue-600'
                  : 'bg-blue-600 text-white shadow-md hover:shadow-lg hover:bg-blue-700'}
            `}
          >
            {account ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                {formatAccount(account)}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect
              </>
            )}
          </button>

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
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container mx-auto px-4 py-3 bg-white shadow-lg rounded-b-xl mt-2">
          <nav className="flex flex-col space-y-3 pb-3">
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
          </nav>
        </div>
      </div>
    </header>
  );
}