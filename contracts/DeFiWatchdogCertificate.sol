// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin ERC721, Ownable, and ReentrancyGuard implementations
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DeFiWatchdogCertificate is ERC721, Ownable, ReentrancyGuard {
    // Counter for generating unique token IDs
    uint256 private _tokenIds;

    // Minting fee for issuing a certificate (in wei)
    uint256 public mintFee;

    // Mapping from NFT token ID to the audited contract address that it certifies
    mapping(uint256 => address) public auditedContract;

    // Mapping to track if a contract address already has a certificate (to prevent duplicates)
    mapping(address => bool) public hasCertificate;

    // Event to log the minting of a new certificate NFT
    event CertificateMinted(uint256 indexed tokenId, address indexed auditedContract, address indexed recipient);
    
    // Event to log fee changes
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);
    
    // Event to log fee withdrawals
    event FeesWithdrawn(address indexed owner, uint256 amount);

    /**
     * @dev Constructor sets the NFT collection name, symbol, and initial minting fee.
     * The Ownable constructor will set the deployer as the initial owner.
     * @param _mintFee The fee (in wei) required to mint a certificate NFT.
     */
    constructor(uint256 _mintFee) ERC721("Safe Contract Certificate", "SCC") Ownable(msg.sender) {
        mintFee = _mintFee;
        _tokenIds = 0;  // start token IDs from 1 on first mint
    }

    /**
     * @dev Allows the owner to update the minting fee if needed.
     * This function is restricted to the contract owner.
     * @param _mintFee The new fee amount (in wei) for minting.
     */
    function setMintFee(uint256 _mintFee) external onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = _mintFee;
        emit MintFeeUpdated(oldFee, _mintFee);
    }

    /**
     * @dev Checks if the given address is a contract.
     * @param addr The address to check.
     * @return True if the address is a contract, false otherwise.
     */
    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    /**
     * @dev Mints a new "Safe Contract Certificate" NFT for a given contract address.
     * Requirements: caller must send enough ETH to cover the mintFee, 
     * and the audited contract must not already have a certificate.
     * @param contractAddress The address of the smart contract that was audited and deemed safe.
     * @return tokenId The unique ID of the newly minted certificate NFT.
     */
    function mintCertificate(address contractAddress) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintFee, "Insufficient minting fee");
        require(contractAddress != address(0), "Audited address is zero");
        require(isContract(contractAddress), "Address is not a contract");
        require(!hasCertificate[contractAddress], "Certificate already exists for this contract");

        // Increment token ID counter to get a new ID
        _tokenIds += 1;
        uint256 newTokenId = _tokenIds;

        // Record the audited contract address in mappings
        auditedContract[newTokenId] = contractAddress;
        hasCertificate[contractAddress] = true;

        // Mint the ERC-721 token to the caller (msg.sender)
        _safeMint(msg.sender, newTokenId);

        // Emit an event for off-chain indexing (includes the audited contract address)
        emit CertificateMinted(newTokenId, contractAddress, msg.sender);

        return newTokenId;
    }

    /**
     * @dev Withdraws all accumulated minting fees to the contract owner's address.
     * Only the owner can call this. Uses nonReentrant to prevent reentrancy attacks.
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees available for withdrawal");

        // Transfer the entire balance to the owner
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(owner(), balance);
    }

    /**
     * @dev Returns the total number of certificates minted.
     */
    function totalCertificates() external view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Fallback function to accept direct ETH transfers.
     * Allows the contract to receive ETH directly. This could happen if someone 
     * sends ETH to the contract by mistake or as a donation.
     */
    receive() external payable {
        // Accept direct deposits. These can be withdrawn by the owner via withdrawFees().
    }
}
