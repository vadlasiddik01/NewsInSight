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
   * Generate a simple sentiment analysis for the article
   * In a real application, this would be replaced with an AI service
   */
  private async generateSimpleSentiment(articleId: number, title: string, content: string): Promise<void> {
    try {
      // Simple positive and negative word lists
      const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'breakthrough', 'win', 'improve', 'benefit', 'happy', 'best'];
      const negativeWords = ['bad', 'worst', 'terrible', 'negative', 'fail', 'crisis', 'problem', 'issue', 'threat', 'risk', 'danger', 'fear', 'conflict'];
      
      const fullText = `${title} ${content}`.toLowerCase();
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      // Count positive and negative words
      positiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = fullText.match(regex);
        if (matches) {
          positiveCount += matches.length;
        }
      });
      
      negativeWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = fullText.match(regex);
        if (matches) {
          negativeCount += matches.length;
        }
      });
      
      // Determine sentiment
      let sentiment: string;
      let explanation: string;
      let score: string;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = ((0.5 + (positiveCount / (positiveCount + negativeCount || 1)) / 2)).toFixed(2);
        explanation = `This article contains more positive language than negative language. Found ${positiveCount} positive terms and ${negativeCount} negative terms.`;
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = ((0.5 - (negativeCount / (positiveCount + negativeCount || 1)) / 2)).toFixed(2);
        explanation = `This article contains more negative language than positive language. Found ${negativeCount} negative terms and ${positiveCount} positive terms.`;
      } else {
        sentiment = 'neutral';
        score = '0.5';
        explanation = 'This article contains balanced language or not enough sentiment indicators.';
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