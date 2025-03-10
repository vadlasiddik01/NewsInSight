import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '../lib/auth';
import { useToast } from '@/hooks/use-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavigation from '../components/MobileNavigation';
import styles from '../styles/Preferences.module.css';
import { UserPreferences } from '@shared/schema';

const Preferences = () => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Fetch user preferences
  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences'],
    enabled: isAuthenticated
  });
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string>('');
  const [sources, setSources] = useState<string>('');
  
  // Update state when preferences are loaded
  React.useEffect(() => {
    if (preferences) {
      setSelectedTopics(preferences.topics || []);
      setKeywords((preferences.keywords || []).join(', '));
      setSources((preferences.sources || []).join(', '));
    }
  }, [preferences]);
  
  // Available topics
  const availableTopics = [
    'Technology', 'Business', 'Science', 'Health', 
    'Politics', 'Entertainment', 'Sports', 'World', 
    'Environment', 'Education'
  ];
  
  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const res = await apiRequest('PUT', '/api/preferences', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      toast({
        title: 'Preferences updated',
        description: 'Your news preferences have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update preferences. Please try again.',
      });
    }
  });
  
  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic) 
        : [...prev, topic]
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse comma-separated lists
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const sourceArray = sources.split(',').map(s => s.trim()).filter(Boolean);
    
    updatePreferencesMutation.mutate({
      topics: selectedTopics,
      keywords: keywordArray,
      sources: sourceArray
    });
  };
  
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Header />
        <main className={styles.main}>
          <div className={styles.loading}>Loading preferences...</div>
        </main>
        <MobileNavigation />
        <Footer />
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Header />
      
      <main className={styles.main}>
        <div className={styles.preferencesContainer}>
          <h1 className={styles.title}>News Preferences</h1>
          <p className={styles.subtitle}>Customize your news feed to see what matters most to you</p>
          
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Topics</h2>
              <p className={styles.sectionDescription}>
                Select the topics you're interested in
              </p>
              
              <div className={styles.topicsGrid}>
                {availableTopics.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    className={`${styles.topicButton} ${selectedTopics.includes(topic) ? styles.selected : ''}`}
                    onClick={() => handleTopicToggle(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Keywords</h2>
              <p className={styles.sectionDescription}>
                Enter specific keywords to follow (comma-separated)
              </p>
              
              <textarea
                className={styles.textarea}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="AI, climate change, electric vehicles"
              />
            </div>
            
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>News Sources</h2>
              <p className={styles.sectionDescription}>
                Enter preferred news sources (comma-separated)
              </p>
              
              <textarea
                className={styles.textarea}
                value={sources}
                onChange={(e) => setSources(e.target.value)}
                placeholder="BBC, CNN, The Guardian"
              />
            </div>
            
            <div className={styles.actions}>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={updatePreferencesMutation.isPending}
              >
                {updatePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <MobileNavigation />
      <Footer />
    </div>
  );
};

export default Preferences;
