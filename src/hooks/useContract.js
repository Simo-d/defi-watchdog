import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
// Add this near the top of your useContract.js file
const SONIC_CHAIN_ID = 146; // Replace with the actual Sonic chain ID
// Hardcoded contract ABI for when the import fails
const FALLBACK_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "contractAddress", "type": "address"}],
    "name": "mintCertificate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "mintFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export function useContract() {
  const { account, signer, provider } = useWallet();
  const [contract, setContract] = useState(null);
  const [mintFee, setMintFee] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAvailable, setWalletAvailable] = useState(false);

  // Get contract address from environment variable
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  useEffect(() => {
    const initContract = async () => {
      try {
        // First check if we have window.ethereum available
        if (typeof window !== 'undefined' && window.ethereum) {
          setWalletAvailable(true);

          try {
            // Create ethers provider from MetaMask
            const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Request account access - wrapped in try/catch to handle user rejection
            try {
              await window.ethereum.request({ method: 'eth_requestAccounts' });
            } catch (requestError) {
              console.log('User declined to connect wallet:', requestError);
              // Continue in view-only mode
              setupViewOnlyMode();
              return;
            }
            
            // Get the signer
            const ethereumSigner = ethereumProvider.getSigner();
            
            // Check if contract address is configured
            if (!contractAddress) {
              console.warn('Contract address not configured in environment variables');
              setupMockContract();
              return;
            }
            
            // Try to import contract ABI, or use fallback
            let contractAbi = FALLBACK_ABI;
            try {
              // Try to dynamically import the contract ABI
              const contractJson = await import('../contracts/DeFiWatchdogCertificate.json');
              if (contractJson && contractJson.default) {
                contractAbi = contractJson.default;
              } else if (contractJson) {
                contractAbi = contractJson;
              }
            } catch (importError) {
              console.warn('Could not import contract ABI, using fallback ABI', importError);
            }
            
            // Create contract instance with the real address
            const contractInstance = new ethers.Contract(
              contractAddress,
              contractAbi,
              ethereumSigner
            );
            
            // Get mint fee from contract
            let fee;
            try {
              fee = await contractInstance.mintFee();
            } catch (feeError) {
              console.warn('Error getting mint fee, using default', feeError);
              fee = ethers.utils.parseEther('0.01');
            }
            
            // Get connected account
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const currentAccount = accounts[0];
            
            // Check if connected wallet is owner
            let ownerStatus = false;
            if (currentAccount) {
              try {
                const owner = await contractInstance.owner();
                ownerStatus = owner.toLowerCase() === currentAccount.toLowerCase();
              } catch (err) {
                console.warn('Error checking contract owner:', err);
              }
            }
            
            setContract(contractInstance);
            setMintFee(fee);
            setIsOwner(ownerStatus);
            setError(null);
          } catch (initError) {
            console.error('Error during contract initialization:', initError);
            setError(initError.message);
            setupMockContract();
          }
        } else {
          // No wallet is available
          console.warn('No wallet detected, using view-only mode');
          setWalletAvailable(false);
          setupViewOnlyMode();
        }
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError(err.message);
        setupMockContract();
      } finally {
        setLoading(false);
      }
    };

    // Helper function to set up a mock contract
    const setupMockContract = () => {
      setContract({
        mintCertificate: async (address, options) => {
          console.log(`Mock mint certificate for ${address} with value ${options?.value}`);
          return {
            wait: async () => ({
              events: [{ event: 'CertificateMinted', args: { tokenId: ethers.BigNumber.from(1) } }]
            })
          };
        },
        mintFee: async () => ethers.utils.parseEther('0.01')
      });
      setMintFee(ethers.utils.parseEther('0.01'));
      setIsOwner(false);
    };

    // Helper function for view-only mode
    const setupViewOnlyMode = () => {
      setContract({
        mintCertificate: async () => {
          throw new Error('Wallet not connected');
        },
        mintFee: async () => ethers.utils.parseEther('0.01')
      });
      setMintFee(ethers.utils.parseEther('0.01'));
      setIsOwner(false);
    };

    initContract();
  }, [account, contractAddress]);

  // Function to mint a certificate

  const mintCertificate = async (contractAddress) => {
    // Define Sonic chain ID
    const SONIC_CHAIN_ID = 146;
    
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    // Check if demo mode is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    if (demoMode) {
      console.log('Demo mode - returning mock token ID without wallet interaction');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "1";
    }
    
    // Ensure we have a wallet available
    if (!walletAvailable) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }
    
    // Ensure we're connected to wallet
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Check if we're on the Sonic network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);
        
        // If not on Sonic network, try to switch
        if (currentChainId !== SONIC_CHAIN_ID) {
          console.log(`Switching to Sonic network (${SONIC_CHAIN_ID}) from current network (${currentChainId})`);
          
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${SONIC_CHAIN_ID.toString(16)}` }],
            });
            
            // Wait for chain to switch (important!)
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Switched to Sonic network');
            
          } catch (switchError) {
            console.log('Error switching chain:', switchError);
            
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902 || 
                switchError.message.includes('wallet_addEthereumChain') ||
                switchError.message.includes('Unrecognized chain ID')) {
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
                
                // Wait for chain to be added
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Added Sonic network to wallet');
                
              } catch (addError) {
                console.error('Error adding chain:', addError);
                throw new Error('Could not add Sonic network to your wallet. Please add it manually.');
              }
            } else {
              throw new Error('Failed to switch to Sonic network. Please switch manually.');
            }
          }
          
          // Re-initialize the provider after network switch
          const ethereumProvider = new ethers.providers.Web3Provider(window.ethereum);
          const ethereumSigner = ethereumProvider.getSigner();
          const updatedContract = new ethers.Contract(
            contractAddress,
            contract.interface,
            ethereumSigner
          );
          
          // Try the transaction with the updated contract
          return mintWithContract(updatedContract, contractAddress);
        }
      } catch (requestError) {
        console.error('Connection or network switching error:', requestError);
        throw requestError;
      }
    } else {
      throw new Error('Wallet not installed');
    }
    
    // Helper function to execute the mint with a given contract
    async function mintWithContract(contractToUse, address) {
      try {
        console.log('Calling contract.mintCertificate with address:', address);
        console.log('Using mint fee:', mintFee.toString());
        
        // Call mintCertificate function on the contract
        const tx = await contractToUse.mintCertificate(address, {
          value: mintFee,
        });
        
        console.log('Transaction sent:', tx.hash);
        
        // Wait for transaction to be mined
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        // Find the CertificateMinted event to get the tokenId
        const event = receipt.events.find(
          event => event.event === 'CertificateMinted'
        );
        
        if (!event) {
          console.warn('Certificate minting event not found in transaction');
          return "1"; // Fallback ID
        }
        
        return event.args.tokenId.toString();
      } catch (error) {
        console.error('Error during minting:', error);
        throw error;
      }
    }
    
    // If we're already on the right network, proceed with the original contract
    return mintWithContract(contract, contractAddress);
  };

  return {
    contract,
    mintFee,
    isOwner,
    loading,
    error,
    walletAvailable,
    mintCertificate
  };
}