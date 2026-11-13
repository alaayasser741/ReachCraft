import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  themeOverlay: Theme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('reachcraft_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark for a modern sleek night mode experience
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [themeOverlay, setThemeOverlay] = useState<Theme | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('reachcraft_theme', theme);
  }, [theme]);

  const triggerTransition = (target: Theme) => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    setThemeOverlay(target);

    window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 500);

    window.setTimeout(() => {
      setThemeOverlay(null);
    }, 850);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    triggerTransition(next);
    setThemeState(next);
  };

  const setTheme = (newTheme: Theme) => {
    triggerTransition(newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, themeOverlay }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
