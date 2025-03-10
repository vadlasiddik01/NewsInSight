import React from 'react';
import styles from '../styles/SentimentTabs.module.css';

interface SentimentTabsProps {
  selectedSentiment: string;
  onSentimentChange: (sentiment: string) => void;
}

const SentimentTabs: React.FC<SentimentTabsProps> = ({ selectedSentiment, onSentimentChange }) => {
  return (
    <div className={styles.container}>
      <button 
        className={`${styles.tab} ${!selectedSentiment ? styles.active : ''}`}
        onClick={() => onSentimentChange('')}
      >
        All Sentiment
      </button>
      
      <button 
        className={`${styles.tab} ${selectedSentiment === 'positive' ? styles.active : ''}`}
        onClick={() => onSentimentChange('positive')}
      >
        <span className={styles.sentimentIndicator}>
          <span className={`${styles.dot} ${styles.positive}`}></span>
          Positive
        </span>
      </button>
      
      <button 
        className={`${styles.tab} ${selectedSentiment === 'neutral' ? styles.active : ''}`}
        onClick={() => onSentimentChange('neutral')}
      >
        <span className={styles.sentimentIndicator}>
          <span className={`${styles.dot} ${styles.neutral}`}></span>
          Neutral
        </span>
      </button>
      
      <button 
        className={`${styles.tab} ${selectedSentiment === 'negative' ? styles.active : ''}`}
        onClick={() => onSentimentChange('negative')}
      >
        <span className={styles.sentimentIndicator}>
          <span className={`${styles.dot} ${styles.negative}`}></span>
          Negative
        </span>
      </button>
    </div>
  );
};

export default SentimentTabs;
