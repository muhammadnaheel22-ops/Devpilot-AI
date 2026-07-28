import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
export function PublicNav() {
  const { theme, setTheme } = useTheme();
  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <button
            className="focus-ring rounded-xl p-2.5 hover:bg-violet-500/10"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
