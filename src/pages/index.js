import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import styles from '../styles/components/All.module.css';

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>DeFi Watchdog - AI-Powered Smart Contract Auditor</title>
        <meta name="description" content="DeFi Watchdog uses AI to analyze smart contracts and explain risks in plain English." />
      </Head>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            AI-Powered Smart Contract Security Auditor
          </h1>
          <p className={styles.heroSubtitle}>
            Understand smart contracts in plain English before you interact with them.
          </p>
          <div>
            <Link href="/audit" className={styles.primaryButton}>
              Start Auditing
            </Link>
            <a href="#how-it-works" className={styles.secondaryButton}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section>
        <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' }}>
          <h2>Securing DeFi One Contract at a Time</h2>
          <p>
            DeFi Watchdog uses advanced AI to analyze smart contracts and explain potential risks in simple language.
            Our system helps you understand what a contract does and identify any security issues before you interact with it.
          </p>
        </div>
      </section>
    </Layout>
  );
}
