import { useState } from 'react';
import toast from 'react-hot-toast';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [compact, setCompact] = useState(localStorage.getItem('devpilot-compact') === '1');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');

  const save = async () => {
    try {
      localStorage.setItem('devpilot-compact', compact ? '1' : '0');
      await updateUserProfile({ displayName, photoURL: photoURL || null });
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted mt-2">
        Manage appearance, account, privacy, and application preferences.
      </p>

      <div className="mt-6 space-y-5">
        <section className="panel p-5">
          <h2 className="text-lg font-bold">Appearance</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['light', 'dark', 'system'].map((option) => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`rounded-xl border p-4 text-left capitalize ${
                  theme === option ? 'border-violet-500 bg-violet-500/10' : 'border-[var(--border)]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <label className="mt-5 flex items-center justify-between rounded-xl border border-[var(--border)] p-4">
            <span>
              <span className="font-semibold">Compact interface</span>
              <span className="text-muted mt-1 block text-sm">
                Reduce spacing in dense dashboards.
              </span>
            </span>
            <input
              type="checkbox"
              checked={compact}
              onChange={(event) => setCompact(event.target.checked)}
              className="h-5 w-5 accent-violet-600"
            />
          </label>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-bold">Account</h2>
          <div className="mt-4 flex flex-col gap-4 rounded-xl bg-[var(--surface)] p-4 sm:flex-row sm:items-center">
            <div className="h-20 w-20 shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-2xl font-bold text-white">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Display name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
              />
              <label className="mt-3 block text-sm font-medium">Profile image URL</label>
              <input
                value={photoURL}
                onChange={(event) => setPhotoURL(event.target.value)}
                placeholder="https://example.com/avatar.png"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
              />
              <div className="text-muted mt-2 text-sm">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
            <ShieldCheck size={18} />
            Secure Neon account and HTTP-only session active
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={save}>Save account</Button>
            <Button
              variant="danger"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut size={17} /> Sign out
            </Button>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-bold">Privacy & security</h2>
          <ul className="text-muted mt-4 space-y-3 text-sm leading-6">
            <li>• OpenRouter API keys are read only by server-side code.</li>
            <li>• Passwords are hashed on the server and sessions use HTTP-only cookies.</li>
            <li>• Neon data is accessed only through authenticated Vercel API routes.</li>
            <li>
              • AI requests are size-limited, validated, rate-limited, and protected with security
              headers.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
