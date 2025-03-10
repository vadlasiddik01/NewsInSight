import React from 'react';
import styles from '../styles/TopicFilter.module.css';

interface TopicFilterProps {
  topics: string[];
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
}

const TopicFilter: React.FC<TopicFilterProps> = ({ topics, selectedTopic, onTopicChange }) => {
  return (
    <div className={styles.container}>
      <button 
        className={`${styles.topicButton} ${!selectedTopic ? styles.active : ''}`}
        onClick={() => onTopicChange('')}
      >
        All Topics
      </button>
      
      {topics.map(topic => (
        <button 
          key={topic}
          className={`${styles.topicButton} ${selectedTopic === topic ? styles.active : ''}`}
          onClick={() => onTopicChange(topic)}
        >
          {topic}
        </button>
      ))}
    </div>
  );
};

export default TopicFilter;
