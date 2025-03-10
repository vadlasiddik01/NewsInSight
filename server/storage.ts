import {
  users, type User, type InsertUser,
  userPreferences, type UserPreferences, type InsertUserPreferences,
  articles, type Article, type InsertArticle,
  articleSentiments, type ArticleSentiment, type InsertArticleSentiment,
  userArticleInteractions, type UserArticleInteraction, type InsertUserArticleInteraction,
  type ArticleWithSentiment, type Stats
} from "@shared/schema";

// Storage interface with CRUD methods
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // User preferences operations
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Article operations
  getArticle(id: number): Promise<Article | undefined>;
  getArticles(limit?: number, offset?: number): Promise<Article[]>;
  getArticlesByTopic(topic: string, limit?: number, offset?: number): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  
  // Article sentiment operations
  getArticleSentiment(articleId: number): Promise<ArticleSentiment | undefined>;
  createArticleSentiment(sentiment: InsertArticleSentiment): Promise<ArticleSentiment>;
  
  // User article interaction operations
  getUserArticleInteraction(userId: number, articleId: number): Promise<UserArticleInteraction | undefined>;
  createUserArticleInteraction(interaction: InsertUserArticleInteraction): Promise<UserArticleInteraction>;
  updateUserArticleInteraction(userId: number, articleId: number, interaction: Partial<InsertUserArticleInteraction>): Promise<UserArticleInteraction | undefined>;
  getSavedArticles(userId: number, limit?: number, offset?: number): Promise<Article[]>;
  
  // Combined operations
  getArticlesWithSentiment(userId?: number, limit?: number, offset?: number): Promise<ArticleWithSentiment[]>;
  getArticlesWithSentimentByTopic(topic: string, userId?: number, limit?: number, offset?: number): Promise<ArticleWithSentiment[]>;
  getArticlesWithSentimentBySentiment(sentiment: string, userId?: number, limit?: number, offset?: number): Promise<ArticleWithSentiment[]>;
  getSavedArticlesWithSentiment(userId: number, limit?: number, offset?: number): Promise<ArticleWithSentiment[]>;
  
  // Stats operations
  getUserStats(userId: number): Promise<Stats>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userPreferences: Map<number, UserPreferences>;
  private articles: Map<number, Article>;
  private articleSentiments: Map<number, ArticleSentiment>;
  private userArticleInteractions: Map<string, UserArticleInteraction>;
  private userCurrentId: number;
  private articleCurrentId: number;
  private userPrefCurrentId: number;
  private sentimentCurrentId: number;
  
  constructor() {
    this.users = new Map();
    this.userPreferences = new Map();
    this.articles = new Map();
    this.articleSentiments = new Map();
    this.userArticleInteractions = new Map();
    this.userCurrentId = 1;
    this.articleCurrentId = 1;
    this.userPrefCurrentId = 1;
    this.sentimentCurrentId = 1;
    
    // Add some initial data for testing
    this.setupInitialData();
  }
  
  private setupInitialData() {
    // Example topics
    const topics = ["Technology", "Business", "Science", "Health", "Politics"];
    
    // Example sources
    const sources = ["TechDaily", "Financial Times", "Health Journal", "NASA News", "Political Review", "Tech Chronicle"];
    
    // Example sentiments
    const sentiments = ["positive", "negative", "neutral"];
    
    // Example images
    const images = [
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400&q=80",
      "https://images.unsplash.com/photo-1589758438368-0ad531db3366?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400&q=80",
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400&q=80",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400&q=80",
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400&q=80",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400&q=80"
    ];
    
    // Example articles
    const exampleArticles = [
      {
        title: "AI Breakthrough Promises More Efficient Computing",
        content: "Researchers have developed a new algorithm that could reduce energy consumption in AI systems by up to 70%, potentially revolutionizing the industry's environmental impact.",
        sourceUrl: "https://techdaily.com/ai-breakthrough",
        sourceName: "TechDaily",
        imageUrl: images[0],
        topic: "Technology",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        sentiment: "positive",
        explanation: "The article focuses on positive technological advancement with environmental benefits."
      },
      {
        title: "Markets React to Economic Uncertainty as Inflation Rises",
        content: "Global markets showed volatility today as inflation figures exceeded expectations, raising concerns about potential interest rate hikes and economic slowdown.",
        sourceUrl: "https://ft.com/markets-inflation",
        sourceName: "Financial Times",
        imageUrl: images[1],
        topic: "Business",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        sentiment: "negative",
        explanation: "Article discusses economic concerns and market volatility with negative outlook."
      },
      {
        title: "New Study Examines Long-term Effects of Remote Work on Health",
        content: "Researchers have published findings from a three-year study on how remote work affects physical and mental health, with mixed results showing both positive and negative impacts.",
        sourceUrl: "https://healthjournal.com/remote-work-study",
        sourceName: "Health Journal",
        imageUrl: images[2],
        topic: "Health",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        sentiment: "neutral",
        explanation: "Article presents balanced view with both positive and negative aspects."
      },
      {
        title: "Mars Rover Discovers Evidence of Ancient Water Flows",
        content: "NASA's latest Mars rover has uncovered compelling evidence of ancient waterways, strengthening theories about past habitability on the red planet and potential for future exploration.",
        sourceUrl: "https://nasa.gov/mars-discovery",
        sourceName: "NASA News",
        imageUrl: images[3],
        topic: "Science",
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        sentiment: "positive",
        explanation: "Discovery represents scientific progress with positive implications for space exploration."
      },
      {
        title: "Climate Legislation Stalls Amid Partisan Divide",
        content: "The latest climate bill has failed to pass, highlighting the growing partisan divide on environmental policy as scientists warn time is running out to address global warming effects.",
        sourceUrl: "https://politicalreview.com/climate-bill",
        sourceName: "Political Review",
        imageUrl: images[4],
        topic: "Politics",
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        sentiment: "negative",
        explanation: "Article highlights political failure and negative implications for environmental policy."
      },
      {
        title: "Major Tech Companies Announce Joint Cybersecurity Initiative",
        content: "Several leading tech firms have formed an alliance to develop new cybersecurity standards and tools, though experts remain divided on whether the effort will lead to meaningful improvements.",
        sourceUrl: "https://techchronicle.com/cybersecurity-alliance",
        sourceName: "Tech Chronicle",
        imageUrl: images[5],
        topic: "Technology",
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        sentiment: "neutral",
        explanation: "Article presents industry initiative with balanced perspective on potential outcomes."
      }
    ];
    
    // Create example articles and sentiments
    exampleArticles.forEach(article => {
      const { sentiment, explanation, ...articleData } = article;
      const createdArticle = this.createArticle({
        ...articleData,
        summary: articleData.content.substring(0, 150) + "..."
      });
      
      this.createArticleSentiment({
        articleId: createdArticle.id,
        sentiment: sentiment,
        explanation: explanation,
        score: ((sentiment === "positive" ? 0.8 : sentiment === "negative" ? 0.2 : 0.5) + Math.random() * 0.2).toFixed(2)
      });
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // User preferences operations
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId
    );
  }
  
  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.userPrefCurrentId++;
    const newPreferences: UserPreferences = { ...preferences, id };
    this.userPreferences.set(id, newPreferences);
    return newPreferences;
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const existing = await this.getUserPreferences(userId);
    if (!existing) return undefined;
    
    const updated: UserPreferences = { ...existing, ...preferences };
    this.userPreferences.set(existing.id, updated);
    return updated;
  }
  
  // Article operations
  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }
  
  async getArticles(limit = 10, offset = 0): Promise<Article[]> {
    return Array.from(this.articles.values())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async getArticlesByTopic(topic: string, limit = 10, offset = 0): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.topic === topic)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
  }
  
  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleCurrentId++;
    const newArticle: Article = { ...article, id, fetchedAt: new Date() };
    this.articles.set(id, newArticle);
    return newArticle;
  }
  
  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const existing = await this.getArticle(id);
    if (!existing) return undefined;
    
    const updated: Article = { ...existing, ...article };
    this.articles.set(id, updated);
    return updated;
  }
  
  // Article sentiment operations
  async getArticleSentiment(articleId: number): Promise<ArticleSentiment | undefined> {
    return Array.from(this.articleSentiments.values()).find(
      (sentiment) => sentiment.articleId === articleId
    );
  }
  
  async createArticleSentiment(sentiment: InsertArticleSentiment): Promise<ArticleSentiment> {
    const id = this.sentimentCurrentId++;
    const newSentiment: ArticleSentiment = { ...sentiment, id, processedAt: new Date() };
    this.articleSentiments.set(id, newSentiment);
    return newSentiment;
  }
  
  // User article interaction operations
  async getUserArticleInteraction(userId: number, articleId: number): Promise<UserArticleInteraction | undefined> {
    const key = `${userId}-${articleId}`;
    return this.userArticleInteractions.get(key);
  }
  
  async createUserArticleInteraction(interaction: InsertUserArticleInteraction): Promise<UserArticleInteraction> {
    const { userId, articleId } = interaction;
    const key = `${userId}-${articleId}`;
    const newInteraction: UserArticleInteraction = { ...interaction, interactedAt: new Date() };
    this.userArticleInteractions.set(key, newInteraction);
    return newInteraction;
  }
  
  async updateUserArticleInteraction(userId: number, articleId: number, interaction: Partial<InsertUserArticleInteraction>): Promise<UserArticleInteraction | undefined> {
    const key = `${userId}-${articleId}`;
    const existing = this.userArticleInteractions.get(key);
    if (!existing) return undefined;
    
    const updated: UserArticleInteraction = { ...existing, ...interaction, interactedAt: new Date() };
    this.userArticleInteractions.set(key, updated);
    return updated;
  }
  
  async getSavedArticles(userId: number, limit = 10, offset = 0): Promise<Article[]> {
    const savedInteractions = Array.from(this.userArticleInteractions.values())
      .filter(interaction => interaction.userId === userId && interaction.isSaved);
    
    const savedArticleIds = savedInteractions.map(interaction => interaction.articleId);
    
    return Array.from(this.articles.values())
      .filter(article => savedArticleIds.includes(article.id))
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
  }
  
  // Combined operations
  async getArticlesWithSentiment(userId?: number, limit = 10, offset = 0): Promise<ArticleWithSentiment[]> {
    const articles = await this.getArticles(limit, offset);
    return Promise.all(articles.map(async article => {
      const sentiment = await this.getArticleSentiment(article.id);
      const interaction = userId ? await this.getUserArticleInteraction(userId, article.id) : undefined;
      return { ...article, sentiment, interaction };
    }));
  }
  
  async getArticlesWithSentimentByTopic(topic: string, userId?: number, limit = 10, offset = 0): Promise<ArticleWithSentiment[]> {
    const articles = await this.getArticlesByTopic(topic, limit, offset);
    return Promise.all(articles.map(async article => {
      const sentiment = await this.getArticleSentiment(article.id);
      const interaction = userId ? await this.getUserArticleInteraction(userId, article.id) : undefined;
      return { ...article, sentiment, interaction };
    }));
  }
  
  async getArticlesWithSentimentBySentiment(sentimentType: string, userId?: number, limit = 10, offset = 0): Promise<ArticleWithSentiment[]> {
    const allArticles = await this.getArticles(100, 0); // Get more articles to filter
    const sentiments = Array.from(this.articleSentiments.values());
    
    const matchingSentimentArticleIds = sentiments
      .filter(s => s.sentiment === sentimentType)
      .map(s => s.articleId);
    
    const filteredArticles = allArticles
      .filter(article => matchingSentimentArticleIds.includes(article.id))
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
    
    return Promise.all(filteredArticles.map(async article => {
      const sentiment = await this.getArticleSentiment(article.id);
      const interaction = userId ? await this.getUserArticleInteraction(userId, article.id) : undefined;
      return { ...article, sentiment, interaction };
    }));
  }
  
  async getSavedArticlesWithSentiment(userId: number, limit = 10, offset = 0): Promise<ArticleWithSentiment[]> {
    const savedArticles = await this.getSavedArticles(userId, limit, offset);
    return Promise.all(savedArticles.map(async article => {
      const sentiment = await this.getArticleSentiment(article.id);
      const interaction = await this.getUserArticleInteraction(userId, article.id);
      return { ...article, sentiment, interaction };
    }));
  }
  
  // Stats operations
  async getUserStats(userId: number): Promise<Stats> {
    // Get all articles from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allArticles = Array.from(this.articles.values());
    const todayArticles = allArticles.filter(article => article.publishedAt >= today);
    
    // Get user preferences to count active topics
    const userPrefs = await this.getUserPreferences(userId);
    const activeTopics = userPrefs?.topics?.length || 0;
    
    // Count positive news percentage
    const allSentiments = Array.from(this.articleSentiments.values());
    const positiveSentiments = allSentiments.filter(s => s.sentiment === "positive");
    const positivePercentage = Math.round((positiveSentiments.length / allSentiments.length) * 100);
    
    return {
      articlesToday: todayArticles.length,
      positiveNews: positivePercentage,
      activeTopics
    };
  }
}

export const storage = new MemStorage();
