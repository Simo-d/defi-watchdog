import React from 'react';
import Link from 'next/link';
import { useWallet } from '../../hooks/useWallet';
import styles from '../../styles/components/All.module.css';

export default function Header() {
  const { account, connect, disconnect } = useWallet();

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div>
          <Link href="/" className={styles.logo}>
            DeFi Watchdog
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Home</Link>
          <Link href="/audit" className={styles.navLink}>Audit</Link>
          <Link href="/how-it-works" className={styles.navLink}>How It Works</Link>
        </nav>
        <div>
          {account ? (
            <button
              onClick={disconnect}
              className={styles.button}
            >
              {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            </button>
          ) : (
            <button
              onClick={connect}
              className={styles.button}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
