import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { InsertUser, LoginData, User } from '@shared/schema';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<User>;
  register: (data: InsertUser) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  login: async () => { throw new Error('Not implemented'); },
  register: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); },
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Fetch current user data
  const { data: user, isLoading, isError, refetch } = useQuery<User>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/me', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Update authentication state when user data changes
  useEffect(() => {
    setIsAuthenticated(!!user && !isError);
  }, [user, isError]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const res = await apiRequest('POST', '/api/login', data);
      return res.json();
    },
    onSuccess: () => {
      refetch(); // Refetch user data after login
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest('POST', '/api/register', data);
      return res.json();
    },
    onSuccess: () => {
      refetch(); // Refetch user data after registration
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/logout', {});
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.removeQueries({ queryKey: ['/api/preferences'] });
      queryClient.removeQueries({ queryKey: ['/api/articles/saved'] });
    },
  });
  
  // Auth methods
  const login = async (data: LoginData) => {
    return loginMutation.mutateAsync(data);
  };
  
  const register = async (data: InsertUser) => {
    return registerMutation.mutateAsync(data);
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const contextValue: AuthContextType = {
    isAuthenticated,
    user: user || null,
    isLoading,
    login,
    register,
    logout,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
