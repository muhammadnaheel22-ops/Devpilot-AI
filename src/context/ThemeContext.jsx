import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readStoredValue, writeStoredValue } from '../utils/storage';

const ThemeContext = createContext(null);
const themes = new Set(['light', 'dark', 'system']);
const getInitialTheme = () => {
  const saved = readStoredValue('devpilot-theme', 'system');
  return themes.has(saved) ? saved : 'system';
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (event) => setSystemDark(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
    writeStoredValue('devpilot-theme', theme);
  }, [resolvedTheme, theme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
