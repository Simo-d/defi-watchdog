import React from 'react';
import styles from '../../styles/components/All.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.copyright}>
          &copy; 2023 DeFi Watchdog. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
