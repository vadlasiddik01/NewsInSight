import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertUserSchema, 
  insertUserPreferencesSchema,
  insertUserArticleInteractionSchema
} from "@shared/schema";
import { newsService } from "./services/newsService";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import { z } from "zod";

// Declare session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

// Helper function to validate request body
function validateRequest<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: () => void) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  };
}

// Authentication middleware
const authenticateUser = (req: Request, res: Response, next: () => void) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up session
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "news-digest-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
    store: new SessionStore({ checkPeriod: 86400000 }),
  }));
  
  // Authentication routes
  app.post("/api/register", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName
      });
      
      // Initialize user preferences
      await storage.createUserPreferences({
        userId: user.id,
        topics: ["Technology", "Business", "Science", "Health", "Politics"],
        keywords: [],
        sources: []
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/login", validateRequest(loginSchema), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });
  
  // User preferences routes
  app.get("/api/preferences", authenticateUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      res.status(200).json(preferences);
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });
  
  app.put("/api/preferences", authenticateUser, validateRequest(insertUserPreferencesSchema.partial()), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { topics, keywords, sources } = req.body;
      
      const updatedPreferences = await storage.updateUserPreferences(userId, {
        topics,
        keywords,
        sources
      });
      
      if (!updatedPreferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      res.status(200).json(updatedPreferences);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });
  
  // Articles routes
  app.get("/api/articles", async (req, res) => {
    try {
      const { topic, sentiment, search, limit = "10", offset = "0" } = req.query;
      const userId = req.session.userId;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      let articles;
      
      if (search) {
        // Get articles by search term
        // First, fetch new articles from NewsAPI based on the search term
        try {
          console.log(`User searched for: "${search}"`);
          
          // Fetch from NewsAPI if the search term is substantial
          if (search.toString().length >= 3) {
            const searchResponse = await newsService.fetchEverything(search.toString(), 5);
            await newsService.processAndSaveArticles(searchResponse, "search");
          }
        } catch (searchError) {
          console.error("Error fetching search results from API:", searchError);
          // Continue with local search even if API fails
        }
        
        // Get articles from database that match the search term
        const allArticles = await storage.getArticles(100, 0); // Get more to filter
        
        // Filter articles that match the search term in title or content
        const searchTerms = search.toString().toLowerCase().split(' ');
        
        const matchedArticles = allArticles.filter(article => {
          const titleMatches = searchTerms.some(term => 
            article.title.toLowerCase().includes(term)
          );
          
          const contentMatches = searchTerms.some(term => 
            article.content.toLowerCase().includes(term)
          );
          
          return titleMatches || contentMatches;
        });
        
        // Get sentiment data for matched articles
        const articlesWithSentiment = await Promise.all(
          matchedArticles.slice(offsetNum, offsetNum + limitNum).map(async article => {
            const sentiment = await storage.getArticleSentiment(article.id);
            const interaction = userId ? await storage.getUserArticleInteraction(userId, article.id) : undefined;
            return { ...article, sentiment, interaction };
          })
        );
        
        articles = articlesWithSentiment;
      } else if (topic && sentiment) {
        // Get articles by topic and sentiment
        const articlesByTopic = await storage.getArticlesWithSentimentByTopic(
          topic as string, 
          userId,
          100, // Get more to filter by sentiment
          0
        );
        
        articles = articlesByTopic
          .filter(article => article.sentiment?.sentiment === sentiment)
          .slice(offsetNum, offsetNum + limitNum);
      } else if (topic) {
        // Get articles by topic
        articles = await storage.getArticlesWithSentimentByTopic(
          topic as string, 
          userId,
          limitNum, 
          offsetNum
        );
      } else if (sentiment) {
        // Get articles by sentiment
        articles = await storage.getArticlesWithSentimentBySentiment(
          sentiment as string, 
          userId,
          limitNum, 
          offsetNum
        );
      } else {
        // Get all articles
        articles = await storage.getArticlesWithSentiment(
          userId,
          limitNum, 
          offsetNum
        );
      }
      
      res.status(200).json(articles);
    } catch (error) {
      console.error("Get articles error:", error);
      res.status(500).json({ message: "Failed to get articles" });
    }
  });
  
  app.get("/api/articles/saved", authenticateUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { limit = "10", offset = "0" } = req.query;
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      const savedArticles = await storage.getSavedArticlesWithSentiment(
        userId,
        limitNum,
        offsetNum
      );
      
      res.status(200).json(savedArticles);
    } catch (error) {
      console.error("Get saved articles error:", error);
      res.status(500).json({ message: "Failed to get saved articles" });
    }
  });
  
  // User article interactions routes
  app.post("/api/articles/:articleId/interaction", authenticateUser, validateRequest(insertUserArticleInteractionSchema.partial()), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const articleId = parseInt(req.params.articleId, 10);
      const { isSaved, isRead } = req.body;
      
      // Check if article exists
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if interaction exists
      const existingInteraction = await storage.getUserArticleInteraction(userId, articleId);
      
      let interaction;
      if (existingInteraction) {
        // Update existing interaction
        interaction = await storage.updateUserArticleInteraction(userId, articleId, {
          isSaved: isSaved !== undefined ? isSaved : existingInteraction.isSaved,
          isRead: isRead !== undefined ? isRead : existingInteraction.isRead
        });
      } else {
        // Create new interaction
        interaction = await storage.createUserArticleInteraction({
          userId,
          articleId,
          isSaved: isSaved || false,
          isRead: isRead || false
        });
      }
      
      res.status(200).json(interaction);
    } catch (error) {
      console.error("Update article interaction error:", error);
      res.status(500).json({ message: "Failed to update article interaction" });
    }
  });
  
  // Stats route
  app.get("/api/stats", authenticateUser, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const stats = await storage.getUserStats(userId);
      res.status(200).json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });
  
  // News API integration routes
  app.get("/api/news/refresh", async (req, res) => {
    try {
      // Check if this is an admin request or restrict as needed
      const apiKey = req.query.key;
      if (apiKey !== process.env.ADMIN_API_KEY && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Define how many articles per category to fetch (default 5)
      const articlesPerCategory = req.query.count ? parseInt(req.query.count as string, 10) : 5;
      
      // Start the news update process (can be done asynchronously)
      newsService.fetchAndUpdateAllNews(articlesPerCategory)
        .catch(error => console.error("Background news update failed:", error));
      
      res.status(200).json({ message: "News update initiated. Check logs for progress." });
    } catch (error) {
      console.error("News refresh error:", error);
      res.status(500).json({ message: "Failed to refresh news" });
    }
  });
  
  // Category-specific news refresh
  app.get("/api/news/refresh/:category", async (req, res) => {
    try {
      const { category } = req.params;
      
      // Check if this is an admin request or restrict as needed
      const apiKey = req.query.key;
      if (apiKey !== process.env.ADMIN_API_KEY && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      // Define how many articles to fetch (default 10)
      const articleCount = req.query.count ? parseInt(req.query.count as string, 10) : 10;
      
      // Fetch news for specific category
      const newsResponse = await newsService.fetchTopHeadlinesByCategory(category, articleCount);
      await newsService.processAndSaveArticles(newsResponse, category);
      
      res.status(200).json({ message: `News refreshed for category: ${category}` });
    } catch (error) {
      console.error(`News refresh error for category ${req.params.category}:`, error);
      res.status(500).json({ message: "Failed to refresh category news" });
    }
  });
  
  // Initialize newsService and add some articles on startup
  setTimeout(() => {
    console.log("Initializing news feed with latest articles...");
    newsService.fetchAndUpdateAllNews(3) // Fetch 3 articles for each category
      .then(() => console.log("Initial news feed populated successfully"))
      .catch(error => console.error("Failed to populate initial news feed:", error));
  }, 5000); // Wait 5 seconds after server starts to fetch news
  
  return httpServer;
}
