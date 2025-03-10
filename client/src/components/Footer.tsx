import React from 'react';
import { Link } from 'wouter';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.row}>
          <div className={styles.column}>
            <div className={styles.logoContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.logo} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
              <h3 className={styles.logoText}>NewsInsight</h3>
            </div>
            <p className={styles.description}>
              Personalized news with AI-powered summarization and sentiment analysis
            </p>
          </div>
          
          <div className={styles.column}>
            <h4 className={styles.title}>Navigation</h4>
            <ul className={styles.links}>
              <li><Link href="/" className={styles.link}>Home</Link></li>
              <li><Link href="/saved" className={styles.link}>Saved Articles</Link></li>
              <li><Link href="/preferences" className={styles.link}>Preferences</Link></li>
            </ul>
          </div>
          
          <div className={styles.column}>
            <h4 className={styles.title}>Account</h4>
            <ul className={styles.links}>
              <li><Link href="/login" className={styles.link}>Login</Link></li>
              <li><Link href="/register" className={styles.link}>Register</Link></li>
            </ul>
          </div>
          
          <div className={styles.column}>
            <h4 className={styles.title}>Legal</h4>
            <ul className={styles.links}>
              <li><Link href="/terms" className={styles.link}>Terms of Service</Link></li>
              <li><Link href="/privacy" className={styles.link}>Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.copyright}>
          <p>&copy; {new Date().getFullYear()} NewsInsight. All rights reserved.</p>
          <p>Powered by Nhost, OpenRouter & n8n</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
