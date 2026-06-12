import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  shopId: string | null;
  shopName: string | null;
  ownerName: string | null;
  login: (shopId: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const isValid = await apiClient.verifyToken();
      if (isValid) {
        const me = await apiClient.getMe();
        setShopId(me.shop_id);
        setShopName(me.shop_name);
        setOwnerName(me.owner_name);
        setIsAuthenticated(true);
      } else {
        apiClient.clearToken();
        setIsAuthenticated(false);
      }
    } catch {
      apiClient.clearToken();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (shopIdInput: string, password: string) => {
    try {
      const response = await apiClient.login({ shop_id: shopIdInput, password });
      apiClient.setToken(response.token);
      setShopId(response.shop_id);
      setShopName(response.shop_name);
      setOwnerName(response.owner_name);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiClient.clearToken();
    setIsAuthenticated(false);
    setShopId(null);
    setShopName(null);
    setOwnerName(null);
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        shopId,
        shopName,
        ownerName,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
