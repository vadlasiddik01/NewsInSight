import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferences
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  topics: text("topics").array(),
  keywords: text("keywords").array(),
  sources: text("sources").array(),
});

// News articles
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name").notNull(),
  imageUrl: text("image_url"),
  topic: text("topic").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow(),
});

// Article sentiment analysis
export const articleSentiments = pgTable("article_sentiments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  sentiment: text("sentiment").notNull(), // positive, negative, neutral
  explanation: text("explanation"),
  score: text("score"),
  processedAt: timestamp("processed_at").defaultNow(),
});

// User article interactions (saved, read, etc.)
export const userArticleInteractions = pgTable("user_article_interactions", {
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
  isSaved: boolean("is_saved").default(false),
  isRead: boolean("is_read").default(false),
  interactedAt: timestamp("interacted_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.articleId] }),
}));

// Stats type for displaying on dashboard
export type Stats = {
  articlesToday: number;
  positiveNews: number;
  activeTopics: number;
};

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  topics: true,
  keywords: true,
  sources: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  fetchedAt: true,
});

export const insertArticleSentimentSchema = createInsertSchema(articleSentiments).omit({
  id: true,
  processedAt: true,
});

export const insertUserArticleInteractionSchema = createInsertSchema(userArticleInteractions);

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertArticleSentiment = z.infer<typeof insertArticleSentimentSchema>;
export type InsertUserArticleInteraction = z.infer<typeof insertUserArticleInteractionSchema>;
export type LoginData = z.infer<typeof loginSchema>;

export type User = typeof users.$inferSelect;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type ArticleSentiment = typeof articleSentiments.$inferSelect;
export type UserArticleInteraction = typeof userArticleInteractions.$inferSelect;

// Article with sentiment combined type
export type ArticleWithSentiment = Article & {
  sentiment?: ArticleSentiment;
  interaction?: UserArticleInteraction;
};
