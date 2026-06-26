import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Always return 'Light' to enforce Light Mode only.
  const [savedTheme] = useState('Light');
  const [appliedTheme] = useState('Light');

  // Force Light mode classes on document element when mounted
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }, []);

  // No-op handlers to preserve components' code compatibility
  const syncTheme = async () => {};
  const updateTheme = async () => {};
  const previewTheme = () => {};
  const resetTheme = () => {};

  return (
    <ThemeContext.Provider value={{
      theme: savedTheme,
      appliedTheme,
      updateTheme,
      previewTheme,
      resetTheme,
      syncTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
