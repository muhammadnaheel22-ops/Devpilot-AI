import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const getInitialTheme = () => localStorage.getItem('devpilot-theme') || 'system';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && systemDark);
    root.classList.toggle('dark', dark);
    localStorage.setItem('devpilot-theme', theme);
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
