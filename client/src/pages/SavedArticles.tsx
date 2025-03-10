import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import MobileNavigation from '../components/MobileNavigation';
import { useAuth } from '../lib/auth';
import styles from '../styles/Home.module.css';
import { ArticleWithSentiment } from '@shared/schema';

const SavedArticles = () => {
  const { isAuthenticated } = useAuth();
  
  // Fetch saved articles
  const { data: savedArticles, isLoading } = useQuery<ArticleWithSentiment[]>({
    queryKey: ['/api/articles/saved'],
    queryFn: async () => {
      const response = await fetch('/api/articles/saved', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved articles');
      }
      
      return response.json();
    },
    enabled: isAuthenticated
  });
  
  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.dashboardContainer}>
          <div className={styles.dashboardHeader}>
            <h2 className={styles.dashboardTitle}>Saved Articles</h2>
            <p className={styles.dashboardSubtitle}>
              Articles you've saved for later reading
            </p>
          </div>
          
          {/* Articles grid */}
          <div className={styles.articlesGrid}>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonText}></div>
                    <div className={styles.skeletonText}></div>
                  </div>
                </div>
              ))
            ) : savedArticles && savedArticles.length > 0 ? (
              savedArticles.map(article => (
                <ArticleCard key={article.id} article={article} showSavedIndicator={true} />
              ))
            ) : (
              <div className={styles.noResults}>
                <svg xmlns="http://www.w3.org/2000/svg" className={styles.noResultsIcon} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" clipRule="evenodd" />
                </svg>
                <p>You haven't saved any articles yet.</p>
                <p className={styles.noResultsSubtext}>
                  Browse the news feed and click the bookmark icon to save articles for later.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
};

export default SavedArticles;
