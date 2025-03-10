import axios from 'axios';
import { storage } from '../storage';
import { InsertArticle, InsertArticleSentiment } from '@shared/schema';

// Define the response type for NewsAPI
interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: {
    source: {
      id: string | null;
      name: string;
    };
    author: string | null;
    title: string;
    description: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
  }[];
}

// Categories defined by NewsAPI
const newsCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];

/**
 * Service to fetch news from NewsAPI.org and store in database
 */
export class NewsService {
  private apiKey: string;
  private baseUrl: string = 'https://newsapi.org/v2';
  
  constructor() {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('NEWS_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }
  
  /**
   * Fetch top headlines from NewsAPI.org by category
   */
  async fetchTopHeadlinesByCategory(category: string, pageSize: number = 10): Promise<NewsApiResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/top-headlines`, {
        params: {
          country: 'us', // Use US as default country
          category,
          pageSize,
          apiKey: this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching top headlines for ${category}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch everything based on keyword
   */
  async fetchEverything(query: string, pageSize: number = 10): Promise<NewsApiResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/everything`, {
        params: {
          q: query,
          pageSize,
          apiKey: this.apiKey,
          language: 'en',
          sortBy: 'publishedAt'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching articles for query ${query}:`, error);
      throw error;
    }
  }
  
  /**
   * Process news articles and save to database
   */
  async processAndSaveArticles(newsResponse: NewsApiResponse, category: string): Promise<void> {
    if (newsResponse.status !== 'ok' || !newsResponse.articles.length) {
      console.warn(`No articles found or invalid response for category: ${category}`);
      return;
    }
    
    console.log(`Processing ${newsResponse.articles.length} articles for category: ${category}`);
    
    for (const article of newsResponse.articles) {
      try {
        // Skip articles with missing required data
        if (!article.title || !article.url || !article.source.name) {
          console.warn('Skipping article with missing data:', article.title);
          continue;
        }
        
        // Format article data for insertion
        const insertArticle: InsertArticle = {
          title: article.title,
          content: article.content || article.description || 'No content available',
          summary: article.description || 'No summary available',
          sourceUrl: article.url,
          sourceName: article.source.name,
          imageUrl: article.urlToImage || undefined,
          topic: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize the category
          publishedAt: new Date(article.publishedAt)
        };
        
        // Save the article
        const savedArticle = await storage.createArticle(insertArticle);
        
        // Generate a simple sentiment analysis (in a real app, you'd use an AI service)
        await this.generateSimpleSentiment(savedArticle.id, insertArticle.title, insertArticle.content);
        
        console.log(`Saved article: ${savedArticle.id} - ${savedArticle.title}`);
      } catch (error) {
        console.error(`Error saving article "${article.title}":`, error);
      }
    }
  }
  
  /**
   * Generate an enhanced sentiment analysis for the article
   * Uses a more sophisticated approach with contextual analysis
   */
  private async generateSimpleSentiment(articleId: number, title: string, content: string): Promise<void> {
    try {
      // Extended positive and negative word lists for better coverage
      const positiveWords = [
        'good', 'great', 'excellent', 'positive', 'success', 'breakthrough', 'win', 'improve', 'benefit', 'happy', 'best',
        'advantage', 'achievement', 'advance', 'approval', 'beautiful', 'brilliant', 'celebrate', 'confidence', 'delight',
        'effective', 'elegant', 'encouraging', 'enjoyable', 'exciting', 'extraordinary', 'fantastic', 'favorable', 'fortunate',
        'friendly', 'fun', 'generous', 'genius', 'genuine', 'glorious', 'grateful', 'gratitude', 'growth', 'harmony',
        'heal', 'healthy', 'helpful', 'honor', 'hopeful', 'impressive', 'incredible', 'innovative', 'inspiring', 'integrity',
        'intelligence', 'joy', 'kind', 'leadership', 'love', 'luxury', 'meaningful', 'miracle', 'motivation', 'natural',
        'nice', 'novel', 'nurture', 'optimistic', 'outstanding', 'passion', 'peaceful', 'perfect', 'pleasant', 'pleased',
        'pleasure', 'plentiful', 'positive', 'powerful', 'precious', 'premium', 'progress', 'promising', 'prosper', 'protect',
        'proud', 'quality', 'recommend', 'recovery', 'refund', 'reliable', 'remarkable', 'resolve', 'respect', 'restore',
        'reward', 'rich', 'safe', 'satisfaction', 'save', 'secure', 'shiny', 'significant', 'solution', 'special',
        'strong', 'stunning', 'substantial', 'succeed', 'support', 'surprise', 'terrific', 'thrill', 'top', 'tremendous',
        'triumph', 'trust', 'truth', 'useful', 'value', 'victory', 'vital', 'wealth', 'welcome', 'well', 'wonderful', 'worthy'
      ];
      
      const negativeWords = [
        'bad', 'worst', 'terrible', 'negative', 'fail', 'crisis', 'problem', 'issue', 'threat', 'risk', 'danger', 'fear', 'conflict',
        'abuse', 'accident', 'accuse', 'addict', 'afraid', 'aggression', 'agony', 'alarm', 'alienate', 'anger', 'annoy',
        'anxious', 'apprehension', 'arrogant', 'assault', 'atrocious', 'attack', 'awful', 'awkward', 'betray', 'blame',
        'bother', 'brutal', 'burden', 'careless', 'chaos', 'cheat', 'collapse', 'complain', 'complex', 'concern', 'condemn',
        'confuse', 'corrupt', 'crash', 'crazy', 'critical', 'cruel', 'damage', 'defeat', 'defect', 'defensive', 'delay',
        'demanding', 'deny', 'depress', 'destroy', 'difficulty', 'disappoint', 'disaster', 'disclose', 'discourage', 'disease',
        'disgusting', 'dishonest', 'dismal', 'dissatisfy', 'distress', 'disturb', 'divorce', 'doubt', 'dread', 'dull',
        'embarrass', 'emergency', 'enemy', 'enrage', 'error', 'evil', 'exhausted', 'expensive', 'explode', 'failure',
        'false', 'fatal', 'fault', 'fear', 'fierce', 'fight', 'filthy', 'flaw', 'forbid', 'fraud', 'fright', 'frustrate',
        'greedy', 'grief', 'grim', 'gross', 'guilty', 'harm', 'harsh', 'hate', 'hazard', 'helpless', 'horrible', 'hostile',
        'humiliate', 'hurt', 'ignore', 'ill', 'immoral', 'impair', 'impatient', 'imperfect', 'impossible', 'incompetent', 'inferior',
        'injure', 'insane', 'insecure', 'invalid', 'irresponsible', 'irritate', 'jail', 'kill', 'lie', 'limit', 'lonely',
        'loss', 'malicious', 'mediocre', 'mess', 'miserable', 'mistake', 'mistrust', 'moody', 'nasty', 'negate', 'neglect',
        'nervous', 'nightmare', 'objection', 'odious', 'offend', 'oppose', 'oppressive', 'ordeal', 'outrage', 'pain', 'panic',
        'paralyze', 'pathetic', 'peril', 'perish', 'pernicious', 'pessimistic', 'petty', 'poison', 'poor', 'prejudice', 'pressure',
        'primitive', 'profane', 'prohibit', 'punish', 'quarrel', 'rage', 'reject', 'remorse', 'repulsive', 'resent', 'resist',
        'revenge', 'ridicule', 'rot', 'rotten', 'rude', 'sad', 'savage', 'scare', 'scratch', 'severe', 'shatter', 'shock',
        'sick', 'sloppy', 'sneer', 'steal', 'stern', 'sticky', 'stingy', 'strain', 'stress', 'strict', 'struggle', 'stubborn',
        'stupid', 'subjugate', 'suffer', 'suspicious', 'tedious', 'tense', 'terribl', 'terror', 'threaten', 'tired', 'torture',
        'toxic', 'tragic', 'trauma', 'treacherous', 'trouble', 'turmoil', 'ugly', 'uncertain', 'uncomfortable', 'undermine',
        'undesirable', 'unfair', 'unfortunate', 'unhappy', 'unhealthy', 'unpleasant', 'unprofessional', 'unsatisfactory', 'unsuccessful',
        'unwanted', 'unwelcome', 'upset', 'urgent', 'vain', 'vicious', 'victim', 'vile', 'violent', 'waste', 'weak', 'weary',
        'wicked', 'woe', 'worry', 'worthless', 'wound', 'wreck', 'wrong'
      ];
      
      // Context intensifiers and modifiers for more nuanced analysis
      const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'truly', 'completely', 'highly', 'utterly'];
      const negators = ['not', 'no', 'never', 'neither', 'nor', 'barely', 'hardly', 'scarcely', "doesn't", "don't", "didn't", "isn't", "aren't", "wasn't", "weren't"];
      
      // Topic/domain specific sentiment words
      const topicSentiment: {
        [key: string]: {
          positive: string[],
          negative: string[]
        }
      } = {
        technology: {
          positive: ['innovative', 'breakthrough', 'efficient', 'user-friendly', 'cutting-edge', 'revolutionary', 'seamless', 'optimized'],
          negative: ['bug', 'crash', 'vulnerability', 'exploit', 'obsolete', 'incompatible', 'glitch', 'malware']
        },
        business: {
          positive: ['profit', 'growth', 'expansion', 'investment', 'partnership', 'dividend', 'sustainable'],
          negative: ['bankruptcy', 'debt', 'deficit', 'lawsuit', 'downturn', 'recession', 'inflation', 'layoffs']
        },
        health: {
          positive: ['recovery', 'treatment', 'cure', 'effective', 'prevention', 'wellness', 'healthy'],
          negative: ['disease', 'infection', 'outbreak', 'contamination', 'epidemic', 'pandemic', 'terminal', 'illness']
        },
        politics: {
          positive: ['bipartisan', 'cooperation', 'peace', 'agreement', 'reform', 'progress', 'leadership'],
          negative: ['scandal', 'corruption', 'controversy', 'tension', 'protest', 'conflict', 'crisis', 'deadlock']
        }
      };
      
      const fullText = `${title} ${content}`.toLowerCase();
      const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      let positiveScore = 0;
      let negativeScore = 0;
      let contextualMatches: {sentence: string, sentiment: string, reason: string}[] = [];
      
      // Analyze each sentence for context-aware sentiment
      sentences.forEach(sentence => {
        const words = sentence.toLowerCase().split(/\s+/);
        let sentencePositiveScore = 0;
        let sentenceNegativeScore = 0;
        let negationActive = false;
        let intensifierActive = false;
        
        // Check for negation and intensifiers
        for (let i = 0; i < words.length; i++) {
          const word = words[i].replace(/[^\w']/g, '');
          
          // Check for negation
          if (negators.includes(word)) {
            negationActive = true;
            continue;
          }
          
          // Check for intensifiers
          if (intensifiers.includes(word)) {
            intensifierActive = true;
            continue;
          }
          
          // Apply sentiment based on context
          if (positiveWords.includes(word)) {
            if (negationActive) {
              sentenceNegativeScore += 1;
              contextualMatches.push({
                sentence: sentence.trim(),
                sentiment: 'negative',
                reason: `"${word}" is positive but negated by preceding words`
              });
            } else {
              const value = intensifierActive ? 2 : 1;
              sentencePositiveScore += value;
              if (intensifierActive) {
                contextualMatches.push({
                  sentence: sentence.trim(),
                  sentiment: 'positive',
                  reason: `"${word}" is positive and intensified`
                });
              }
            }
          } else if (negativeWords.includes(word)) {
            if (negationActive) {
              sentencePositiveScore += 0.5; // Negated negative is less positive than a direct positive
              contextualMatches.push({
                sentence: sentence.trim(),
                sentiment: 'positive',
                reason: `"${word}" is negative but negated by preceding words`
              });
            } else {
              const value = intensifierActive ? 2 : 1;
              sentenceNegativeScore += value;
              if (intensifierActive) {
                contextualMatches.push({
                  sentence: sentence.trim(),
                  sentiment: 'negative',
                  reason: `"${word}" is negative and intensified`
                });
              }
            }
          }
          
          // Reset contextual flags after 3 words or at end of sentence
          if (i - negators.indexOf(words[i - 1]) > 3) {
            negationActive = false;
          }
          
          if (i - intensifiers.indexOf(words[i - 1]) > 2) {
            intensifierActive = false;
          }
        }
        
        positiveScore += sentencePositiveScore;
        negativeScore += sentenceNegativeScore;
      });
      
      // Add domain-specific sentiment analysis
      Object.keys(topicSentiment).forEach(topic => {
        topicSentiment[topic].positive.forEach((word: string) => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          const matches = fullText.match(regex);
          if (matches) {
            positiveScore += matches.length * 1.5; // Domain-specific words have higher weight
            contextualMatches.push({
              sentence: `${topic}-related positive term`,
              sentiment: 'positive',
              reason: `Domain-specific positive term "${word}" found (${matches.length} occurrences)`
            });
          }
        });
        
        topicSentiment[topic].negative.forEach((word: string) => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          const matches = fullText.match(regex);
          if (matches) {
            negativeScore += matches.length * 1.5; // Domain-specific words have higher weight
            contextualMatches.push({
              sentence: `${topic}-related negative term`,
              sentiment: 'negative',
              reason: `Domain-specific negative term "${word}" found (${matches.length} occurrences)`
            });
          }
        });
      });
      
      // For headline analysis - headlines have more impact
      const headlinePositiveWords = positiveWords.filter(word => title.toLowerCase().includes(word));
      const headlineNegativeWords = negativeWords.filter(word => title.toLowerCase().includes(word));
      
      if (headlinePositiveWords.length > 0) {
        positiveScore += headlinePositiveWords.length * 2;
        contextualMatches.push({
          sentence: title,
          sentiment: 'positive',
          reason: `Headline contains positive terms: ${headlinePositiveWords.join(', ')}`
        });
      }
      
      if (headlineNegativeWords.length > 0) {
        negativeScore += headlineNegativeWords.length * 2;
        contextualMatches.push({
          sentence: title,
          sentiment: 'negative',
          reason: `Headline contains negative terms: ${headlineNegativeWords.join(', ')}`
        });
      }
      
      // Generate detailed explanation with examples
      let detailedExplanation = '';
      if (contextualMatches.length > 0) {
        // Sort by sentiment and limit to top 3 examples of each
        const positiveExamples = contextualMatches.filter(m => m.sentiment === 'positive').slice(0, 3);
        const negativeExamples = contextualMatches.filter(m => m.sentiment === 'negative').slice(0, 3);
        
        if (positiveExamples.length > 0) {
          detailedExplanation += 'Positive elements: ';
          detailedExplanation += positiveExamples.map(e => e.reason).join('; ');
          detailedExplanation += '. ';
        }
        
        if (negativeExamples.length > 0) {
          detailedExplanation += 'Negative elements: ';
          detailedExplanation += negativeExamples.map(e => e.reason).join('; ');
          detailedExplanation += '.';
        }
      }
      
      // Determine sentiment
      let sentiment: string;
      let explanation: string;
      let score: string;
      
      // Calculate normalized score (0 to 1)
      const totalScore = positiveScore + negativeScore;
      let normalizedScore = 0.5; // Default neutral
      
      if (totalScore > 0) {
        normalizedScore = positiveScore / totalScore;
      }
      
      // Apply thresholds for sentiment classification
      if (normalizedScore >= 0.67) {
        sentiment = 'positive';
        score = normalizedScore.toFixed(2);
        explanation = `This article has a positive tone. ${detailedExplanation}`;
      } else if (normalizedScore <= 0.33) {
        sentiment = 'negative';
        score = normalizedScore.toFixed(2);
        explanation = `This article has a negative tone. ${detailedExplanation}`;
      } else {
        sentiment = 'neutral';
        score = normalizedScore.toFixed(2);
        explanation = `This article has a balanced or neutral tone. ${detailedExplanation}`;
      }
      
      // Save sentiment analysis
      const sentimentData: InsertArticleSentiment = {
        articleId,
        sentiment,
        explanation,
        score
      };
      
      await storage.createArticleSentiment(sentimentData);
    } catch (error) {
      console.error(`Error generating sentiment for article ${articleId}:`, error);
    }
  }
  
  /**
   * Fetch and update news for all categories
   */
  async fetchAndUpdateAllNews(articlesPerCategory: number = 5): Promise<void> {
    console.log('Starting news update for all categories...');
    
    for (const category of newsCategories) {
      try {
        console.log(`Fetching news for category: ${category}`);
        const newsResponse = await this.fetchTopHeadlinesByCategory(category, articlesPerCategory);
        await this.processAndSaveArticles(newsResponse, category);
      } catch (error) {
        console.error(`Failed to update news for category ${category}:`, error);
      }
    }
    
    console.log('News update completed for all categories.');
  }
}

// Create a singleton instance
export const newsService = new NewsService();