import Head from 'next/head';
import Layout from '../components/layout/Layout';
import styles from '../styles/components/All.module.css';

export default function HowItWorks() {
  const steps = [
    {
      title: "Input Contract Address",
      description: "Paste the address of any verified smart contract you want to analyze."
    },
    {
      title: "AI Analysis",
      description: "Our AI engine analyzes the contract code for functionality and security risks."
    },
    {
      title: "Review Results",
      description: "Get a plain-English explanation of what the contract does and any risks it poses."
    },
    {
      title: "Certificate (Optional)",
      description: "For safe contracts, mint an NFT certificate as proof of auditing."
    }
  ];

  const faq = [
    {
      question: "How accurate is the AI analysis?",
      answer: 
        "Our AI is trained on thousands of smart contracts and common vulnerability patterns. While it can identify many security issues, it\"s not a substitute for a professional manual audit for critical contracts. It\"s designed to give you a quick first assessment to identify obvious red flags."
    },
    {
      question: "Can I analyze any contract?",
      answer: 
        "You can analyze any contract that has verified source code on Etherscan or other supported block explorers. Contracts without verified source code cannot be analyzed."
    },
    {
      question: "What networks are supported?",
      answer: 
        "We currently support Ethereum Mainnet, Goerli, Sepolia, Polygon, Arbitrum, and Optimism."
    },
    {
      question: "What are the NFT certificates?",
      answer: 
        "For contracts that pass our security checks, you can mint an NFT certificate as proof that the contract was audited. This certificate contains information about the audit."
    }
  ];

  return (
    <Layout>
      <Head>
        <title>How It Works - DeFi Watchdog</title>
        <meta name="description" content="Learn how DeFi Watchdog analyzes smart contracts using AI." />
      </Head>

      <div className={styles.hero} style={{ padding: "3rem 0" }}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>How DeFi Watchdog Works</h1>
          <p className={styles.heroSubtitle}>
            Protecting your investments with AI-powered contract analysis
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "3rem auto", padding: "0 1rem" }}>
        <div style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "1.5rem" }}>The Process</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            {steps.map((step, index) => (
              <div key={index} style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ 
                    width: "2rem", 
                    height: "2rem", 
                    borderRadius: "9999px", 
                    backgroundColor: "#0284c7", 
                    color: "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    marginRight: "0.75rem",
                    fontWeight: "bold"
                  }}>
                    {index + 1}
                  </div>
                  <h3 style={{ fontWeight: "600", fontSize: "1.125rem" }}>{step.title}</h3>
                </div>
                <p style={{ color: "#6b7280" }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "1.5rem" }}>Frequently Asked Questions</h2>
          <div style={{ display: "grid", gap: "1.5rem" }}>
            {faq.map((item, index) => (
              <div key={index} style={{ background: "white", padding: "1.5rem", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ fontWeight: "600", fontSize: "1.125rem", marginBottom: "0.5rem" }}>{item.question}</h3>
                <p style={{ color: "#6b7280" }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
