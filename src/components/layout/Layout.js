import React from 'react';
import Header from './Header';
import Footer from './Footer';
import styles from '../../styles/components/All.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
