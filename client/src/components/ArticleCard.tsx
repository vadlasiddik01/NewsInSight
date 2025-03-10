import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '../lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ArticleWithSentiment, InsertUserArticleInteraction } from '@shared/schema';
import styles from '../styles/ArticleCard.module.css';

interface ArticleCardProps {
  article: ArticleWithSentiment;
  showSavedIndicator?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, showSavedIndicator = false }) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Format relative time
  const formattedTime = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  
  // Get sentiment data
  const sentiment = article.sentiment?.sentiment || 'neutral';
  const isSaved = article.interaction?.isSaved || false;
  
  // Sentiment styling
  const getSentimentStyles = () => {
    switch (sentiment) {
      case 'positive':
        return {
          className: styles.positive,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.sentimentIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.865-1.271L5 7.583V5.698m0 0L9.5 9.5M5 5.698V5a2 2 0 012-2h7.5a2 2 0 012 2v.618" />
            </svg>
          ),
          label: 'Positive'
        };
      case 'negative':
        return {
          className: styles.negative,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.sentimentIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          ),
          label: 'Negative'
        };
      default:
        return {
          className: styles.neutral,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.sentimentIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7l4-4m0 0l4 4m-4-4v18" />
            </svg>
          ),
          label: 'Neutral'
        };
    }
  };
  
  const sentimentData = getSentimentStyles();
  
  // Get topic class for styling
  const getTopicClass = () => {
    switch (article.topic.toLowerCase()) {
      case 'technology':
        return styles.topicTech;
      case 'business':
        return styles.topicBusiness;
      case 'science':
        return styles.topicScience;
      case 'health':
        return styles.topicHealth;
      case 'politics':
        return styles.topicPolitics;
      default:
        return styles.topicDefault;
    }
  };
  
  // Interaction mutation
  const interactionMutation = useMutation({
    mutationFn: async (data: Partial<InsertUserArticleInteraction>) => {
      const res = await apiRequest('POST', `/api/articles/${article.id}/interaction`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/articles/saved'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'An error occurred while saving the article.',
      });
    }
  });
  
  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      toast({
        variant: 'default',
        title: 'Authentication required',
        description: 'Please log in to save articles.',
      });
      return;
    }
    
    interactionMutation.mutate({
      articleId: article.id,
      isSaved: !isSaved
    });
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.sourceUrl
      }).catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(article.sourceUrl);
      toast({
        title: 'Link copied',
        description: 'Article link copied to clipboard',
      });
    }
  };
  
  return (
    <div className={styles.card}>
      <img 
        src={article.imageUrl} 
        alt={article.title} 
        className={styles.image}
      />
      
      <div className={styles.content}>
        <div className={styles.metadata}>
          <span className={`${styles.topic} ${getTopicClass()}`}>
            {article.topic}
          </span>
          <span className={styles.time}>{formattedTime}</span>
          <span className={`${styles.sentiment} ${sentimentData.className}`}>
            {sentimentData.icon}
            {sentimentData.label}
          </span>
        </div>
        
        <h3 className={styles.title}>{article.title}</h3>
        
        <p className={styles.summary}>{article.summary}</p>
        
        <div className={styles.footer}>
          <span className={styles.source}>{article.sourceName}</span>
          
          <div className={styles.actions}>
            <button 
              className={`${styles.actionButton} ${isSaved ? styles.saved : ''}`}
              onClick={handleSaveToggle}
              aria-label={isSaved ? 'Unsave article' : 'Save article'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill={isSaved ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button 
              className={styles.actionButton}
              onClick={handleShare}
              aria-label="Share article"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
        
        {showSavedIndicator && isSaved && (
          <div className={styles.savedIndicator}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.savedIcon} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" clipRule="evenodd" />
            </svg>
            Saved
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleCard;
