import { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export declare const useThemeContext: () => ThemeContextType; 