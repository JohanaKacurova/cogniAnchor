import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export interface ColorTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
}

export interface TextScale {
  id: string;
  name: string;
  multiplier: number;
}

export const textScales: TextScale[] = [
  { id: 'normal', name: 'Normal', multiplier: 1.0 },
  { id: 'large', name: 'Large', multiplier: 1.3 },
  { id: 'extra-large', name: 'Extra Large', multiplier: 1.6 },
];

export const colorThemes: ColorTheme[] = [
  {
    id: 'blue',
    name: 'Ocean Blue',
    colors: {
      primary: '#4682B4',
      secondary: '#87CEEB',
      background: '#F5F5DC',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#6B7280',
      border: '#E6E6FA',
      accent: '#87CEEB',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      primary: '#9370DB',
      secondary: '#DDA0DD',
      background: '#F8F0FF',
      surface: '#FFFFFF',
      text: '#2C3E50',
      textSecondary: '#6B7280',
      border: '#E6E6FA',
      accent: '#DDA0DD',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
  },
  {
    id: 'cream',
    name: 'Warm Cream',
    colors: {
      primary: '#D2691E',
      secondary: '#F4A460',
      background: '#FFF8DC',
      surface: '#FFFFFF',
      text: '#8B4513',
      textSecondary: '#A0522D',
      border: '#F0E68C',
      accent: '#F4A460',
      success: '#228B22',
      warning: '#FF8C00',
      error: '#DC143C',
    },
  },
];

interface ThemeContextType {
  currentTheme: ColorTheme;
  currentTextScale: TextScale;
  calmMode: boolean;
  setTheme: (themeId: string) => void;
  setTextScale: (scaleId: string) => void;
  setCalmMode: (enabled: boolean) => void;
  scaleText: (baseSize: number) => number;
  getCalmModeStyles: () => ViewStyle;
  getCalmModeTextColor: () => string;
  getCalmModeSecondaryTextColor: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(colorThemes[0]);
  const [currentTextScale, setCurrentTextScale] = useState<TextScale>(textScales[0]);
  const [calmMode, setCalmModeState] = useState<boolean>(false);

  const setTheme = (themeId: string) => {
    const theme = colorThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  const setTextScale = (scaleId: string) => {
    const scale = textScales.find(s => s.id === scaleId);
    if (scale) {
      setCurrentTextScale(scale);
    }
  };

  const setCalmMode = (enabled: boolean) => {
    setCalmModeState(enabled);
  };

  const scaleText = (baseSize: number) => {
    return Math.round(baseSize * currentTextScale.multiplier);
  };

  const getCalmModeStyles = (): ViewStyle => {
    if (!calmMode) return {};
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      opacity: 0.8,
    };
  };

  const getCalmModeTextColor = () => {
    if (!calmMode) return currentTheme.colors.text;
    return '#E0E0E0';
  };

  // Accessible secondary text color for Calm Mode
  const getCalmModeSecondaryTextColor = () => {
    if (!calmMode) return currentTheme.colors.textSecondary;
    return '#BDBDBD'; // High-contrast light gray for secondary text in Calm Mode
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      currentTextScale, 
      calmMode,
      setTheme, 
      setTextScale, 
      setCalmMode,
      scaleText,
      getCalmModeStyles,
      getCalmModeTextColor,
      getCalmModeSecondaryTextColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}