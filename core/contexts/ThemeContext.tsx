import React, { createContext, useContext } from 'react';

const defaultTheme = {
  colors: {
    primary: '#007AFF',
    background: '#fff',
    textSecondary: '#888',
    border: '#eee',
  },
};

const ThemeContext = createContext({
  currentTheme: defaultTheme,
  scaleText: (size: number) => size,
  calmMode: false,
  getCalmModeStyles: () => ({}),
  getCalmModeTextColor: () => defaultTheme.colors.primary,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{
    currentTheme: defaultTheme,
    scaleText: (size: number) => size,
    calmMode: false,
    getCalmModeStyles: () => ({}),
    getCalmModeTextColor: () => defaultTheme.colors.primary,
  }}>
    {children}
  </ThemeContext.Provider>
);

export default ThemeContext; 