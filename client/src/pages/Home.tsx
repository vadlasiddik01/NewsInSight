import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import TopicFilter from '../components/TopicFilter';
import SentimentTabs from '../components/SentimentTabs';
import StatsCard from '../components/StatsCard';
import MobileNavigation from '../components/MobileNavigation';
import { useAuth } from '../lib/auth';
import styles from '../styles/Home.module.css';
import { ArticleWithSentiment, Stats } from '@shared/schema';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const articlesPerPage = 9;

  // Fetch articles with filters
  const { data: articles, isLoading: articlesLoading, refetch } = useQuery<ArticleWithSentiment[]>({
    queryKey: ['/api/articles', selectedTopic, selectedSentiment, searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTopic) params.append('topic', selectedTopic);
      if (selectedSentiment) params.append('sentiment', selectedSentiment);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', articlesPerPage.toString());
      params.append('offset', ((currentPage - 1) * articlesPerPage).toString());
      
      setIsSearching(!!searchQuery);
      
      const response = await fetch(`/api/articles?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      
      return response.json();
    },
    enabled: true
  });

  // Fetch stats if authenticated
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    enabled: isAuthenticated
  });

  // Fetch topics
  const topics = ['Technology', 'Business', 'Science', 'Health', 'Politics'];

  // Sort articles
  const sortedArticles = React.useMemo(() => {
    if (!articles) return [];
    
    return [...articles].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else if (sortBy === 'sentiment') {
        const sentimentScore = (article: ArticleWithSentiment) => {
          const score = article.sentiment?.score;
          return score ? parseFloat(score) : 0.5;
        };
        return sentimentScore(b) - sentimentScore(a);
      } else if (sortBy === 'relevance') {
        // Simple implementation - could be more complex in real app
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      return 0;
    });
  }, [articles, sortBy]);

  const totalPages = Math.ceil((articles?.length || 0) / articlesPerPage);

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic === selectedTopic ? '' : topic);
    setCurrentPage(1);
  };

  const handleSentimentChange = (sentiment: string) => {
    setSelectedSentiment(sentiment === selectedSentiment ? '' : sentiment);
    setCurrentPage(1);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // No longer need these functions since search is handled in Header

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(!!query);
    setCurrentPage(1);
    refetch();
  };

  return (
    <div className={styles.container}>
      <Header onSearch={handleSearch} />
      
      <main className={styles.main}>
        <div className={styles.dashboardContainer}>
          {/* Dashboard header with stats */}
          <div className={styles.dashboardHeader}>
            <h2 className={styles.dashboardTitle}>Your News Digest</h2>
            
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <StatsCard 
                title="Articles Today" 
                value={stats?.articlesToday || 0} 
                icon="articles" 
                loading={statsLoading} 
              />
              <StatsCard 
                title="Positive News" 
                value={`${stats?.positiveNews || 0}%`} 
                icon="positive" 
                loading={statsLoading} 
              />
              <StatsCard 
                title="Active Topics" 
                value={stats?.activeTopics || 0} 
                icon="topics" 
                loading={statsLoading} 
              />
            </div>
          </div>
          
          {/* Filter and sort controls */}
          <div className={styles.filterContainer}>
            <TopicFilter 
              topics={topics} 
              selectedTopic={selectedTopic} 
              onTopicChange={handleTopicChange} 
            />
            
            <div className={styles.sortContainer}>
              <label htmlFor="sortOptions" className={styles.sortLabel}>Sort by:</label>
              <select 
                id="sortOptions" 
                className={styles.sortSelect} 
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="newest">Newest First</option>
                <option value="sentiment">Sentiment</option>
                <option value="relevance">Relevance</option>
              </select>
            </div>
          </div>
          
          {/* Sentiment filter tabs */}
          <SentimentTabs 
            selectedSentiment={selectedSentiment} 
            onSentimentChange={handleSentimentChange} 
          />
          
          {/* News article grid */}
          <div className={styles.articlesGrid}>
            {articlesLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage}></div>
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonTitle}></div>
                    <div className={styles.skeletonText}></div>
                    <div className={styles.skeletonText}></div>
                  </div>
                </div>
              ))
            ) : sortedArticles.length > 0 ? (
              sortedArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className={styles.noResults}>
                <p>No articles found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
          
          {/* Pagination controls */}
          {!articlesLoading && articles && articles.length > 0 && (
            <div className={styles.pagination}>
              <button 
                className={styles.paginationButton} 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={`page-${page}`} 
                  className={`${styles.paginationButton} ${currentPage === page ? styles.activePage : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className={styles.paginationButton} 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
};

export default Home;
