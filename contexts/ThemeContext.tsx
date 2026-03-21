import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, getShadows, type ThemeColors, type ColorScheme } from '@/constants/theme';

const THEME_STORAGE_KEY = '@nard_theme_preference';

interface ThemeContextType {
  colors: ThemeColors;
  shadows: ReturnType<typeof getShadows>;
  scheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [userPreference, setUserPreference] = useState<ColorScheme | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark') {
        setUserPreference(value);
      }
    });
  }, []);

  const scheme: ColorScheme = userPreference ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = useCallback(() => {
    const next = scheme === 'dark' ? 'light' : 'dark';
    setUserPreference(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, [scheme]);

  const value: ThemeContextType = {
    colors: getColors(scheme),
    shadows: getShadows(scheme),
    scheme,
    isDark: scheme === 'dark',
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
