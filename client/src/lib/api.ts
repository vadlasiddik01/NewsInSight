import axios from 'axios';
import { ArticleWithSentiment, Stats, UserPreferences } from '@shared/schema';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
});

// Auth API
export const loginUser = async (username: string, password: string) => {
  const response = await api.post('/api/login', { username, password });
  return response.data;
};

export const registerUser = async (userData: any) => {
  const response = await api.post('/api/register', userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/api/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/me');
  return response.data;
};

// Articles API
export const getArticles = async (params?: { topic?: string, sentiment?: string, limit?: number, offset?: number }): Promise<ArticleWithSentiment[]> => {
  const response = await api.get('/api/articles', { params });
  return response.data;
};

export const getSavedArticles = async (params?: { limit?: number, offset?: number }): Promise<ArticleWithSentiment[]> => {
  const response = await api.get('/api/articles/saved', { params });
  return response.data;
};

export const updateArticleInteraction = async (articleId: number, data: { isSaved?: boolean, isRead?: boolean }) => {
  const response = await api.post(`/api/articles/${articleId}/interaction`, data);
  return response.data;
};

// Preferences API
export const getUserPreferences = async (): Promise<UserPreferences> => {
  const response = await api.get('/api/preferences');
  return response.data;
};

export const updateUserPreferences = async (data: Partial<UserPreferences>) => {
  const response = await api.put('/api/preferences', data);
  return response.data;
};

// Stats API
export const getUserStats = async (): Promise<Stats> => {
  const response = await api.get('/api/stats');
  return response.data;
};

export default api;
