import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { storageService } from '@/services/storageService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storageService.getUser();
      setUser(savedUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (name: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      points: 0,
      badges: [],
    };
    await storageService.saveUser(newUser);
    setUser(newUser);
  };

  const logout = async () => {
    await storageService.clearUser();
    setUser(null);
  };

  const updateUser = async (updatedUser: User) => {
    await storageService.saveUser(updatedUser);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
