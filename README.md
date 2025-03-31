# DeFi Watchdog - Smart Contract Security Guardian

## Overview

DeFi Watchdog is an autonomous security solution that protects blockchain ecosystems through continuous smart contract monitoring and analysis. Powered by the ZerePy framework, our AI agent performs both on-chain and social actions to identify vulnerabilities, prevent exploits, and alert communities about potential risks.

Unlike traditional audits that provide only point-in-time security, DeFi Watchdog delivers 24/7 protection that evolves alongside emerging threats. Our platform leverages high-performance blockchain capabilities to enable real-time contract analysis, blockchain-specific optimizations, and immediate protective actions when vulnerabilities are detected.

## Linea Integration

DeFi Watchdog now secures the Linea network, bringing autonomous smart contract security to one of the most promising Ethereum Layer 2 scaling solutions. By integrating with Linea's infrastructure, our AI-powered guardian provides specialized protection tailored to Linea's unique zkEVM architecture and growing DeFi ecosystem.

### Linea Contract Address

The DeFi Watchdog monitoring contract is deployed on Linea at:
[0x497ACc3197984E3a47139327ef665DA3357187c9](https://lineascan.build/address/0x497ACc3197984E3a47139327ef665DA3357187c9)

https://lineascan.build/address/0x497ACc3197984E3a47139327ef665DA3357187c9

## Key Features

- **Real-time Contract Analysis**: Analyzes smart contracts as they're deployed and continuously monitors for emerging threats
- **Blockchain-Specific Optimizations**: Provides tailored optimization suggestions for different blockchain architectures
- **Autonomous Monitoring**: Uses the ZerePy framework to monitor ecosystems without user intervention
- **Community Protection**: Immediately alerts communities and developers when vulnerabilities are detected
- **Dual-Action System**: Performs both on-chain actions (flagging, prevention) and social actions (alerts, guidance)

### Linea-Specific Features

Our integration with Linea includes specialized capabilities:

- **Linea-Optimized Analysis**: Security scanning calibrated for Linea's zkEVM environment
- **Gas Efficiency Recommendations**: Tailored optimization suggestions that account for Linea's fee structure
- **Ecosystem Monitoring**: Continuous surveillance of Linea's growing DeFi landscape
- **Rapid Response**: Leveraging Linea's fast finality for immediate protective actions

## Project Structure

```
defi-watchdog/
├── src/
│   ├── pages/
│   │   ├── audit.js                  # Main contract audit page
│   │   ├── dashboard.js              # Dashboard with agent status
│   │   ├── api/
│   │   │   ├── analyze.js            # Standard analysis endpoint
│   │   │   ├── zerebro/             
│   │   │   │   ├── analyze.js        # Blockchain-specific analysis
│   │   │   │   ├── status.js         # ZerePy agent status
│   │   │   │   ├── generate-patch.js # Optimized fixes
│   │   │   │   └── monitor/
│   │   │   │       └── toggle.js     # Toggle monitoring
│   │   │   └── linea/
│   │   │       └── gas-optimizations.js # Linea optimizations
│   ├── components/
│   │   └── layout/
│   │       └── Header.js             # Updated header with wallet 
│   ├── hooks/
│   │   ├── useWallet.js              # Wallet integration hook
│   │   └── useContract.js            # Contract interaction
│   ├── context/
│   │   └── WalletContext.js          # Wallet provider
│   └── lib/
│       └── zerebro/
│           └── agent.js              # ZerePy agent utilities
└── contracts/
    └── DeFiWatchdog.sol              # Main contract deployed on Linea
```

## Setup Instructions

1. **Install Dependencies**

```bash
npm install
```

2. **Start the Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### Standard Analysis Endpoint
- **Path:** `/api/analyze`
- **Method:** POST
- **Description:** Analyzes contracts on Ethereum, with forwarding to ZerePy for Linea contracts

### ZerePy Analysis Endpoint
- **Path:** `/api/zerebro/analyze`
- **Method:** POST
- **Description:** Provides blockchain-specific contract analysis

### ZerePy Status Endpoint
- **Path:** `/api/zerebro/status`
- **Method:** GET
- **Description:** Returns ZerePy agent status and capabilities

### Linea Gas Optimizations Endpoint
- **Path:** `/api/linea/gas-optimizations`
- **Method:** GET
- **Description:** Retrieves Linea-specific gas optimization suggestions

## Security Features

- **Vulnerability Detection**: Identifies common security issues including reentrancy, overflow/underflow, and access control problems
- **Gas Optimization**: Provides suggestions for reducing gas costs specific to each blockchain
- **Risk Scoring**: Assigns a comprehensive risk score to contracts based on multiple security factors
- **Historical Analysis**: Tracks changes in contract security over time
- **Custom Rules Engine**: Allows for the creation of custom security rules and checks

## About the Team

DeFi Watchdog is built by a team of blockchain security experts and AI specialists led by Mohamed, a fullstack developer and project manager passionate about blockchain security. The team is focused on creating tools that make blockchain ecosystems safer and more accessible.

## Contact & Support

- **GitHub**: [github.com/defi-watchdog](https://github.com/simo-d/defi-watchdog)
- **Email**: mohamedajguernoun@gmail.com

