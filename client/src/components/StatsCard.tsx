import React from 'react';
import styles from '../styles/StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: 'articles' | 'positive' | 'topics';
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, loading = false }) => {
  const renderIcon = () => {
    switch (icon) {
      case 'articles':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'positive':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'topics':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getIconContainerClass = () => {
    switch (icon) {
      case 'articles':
        return styles.iconArticles;
      case 'positive':
        return styles.iconPositive;
      case 'topics':
        return styles.iconTopics;
      default:
        return '';
    }
  };
  
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={`${styles.iconContainer} ${getIconContainerClass()}`}>
          {renderIcon()}
        </div>
        <div className={styles.textContent}>
          <p className={styles.title}>{title}</p>
          {loading ? (
            <div className={styles.skeleton}></div>
          ) : (
            <p className={styles.value}>{value}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
