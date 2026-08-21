import { useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { uploadUserAsset } from '../services/userDataService';
import { readStoredValue, writeStoredValue } from '../utils/storage';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout, updateUserProfile, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [compact, setCompact] = useState(readStoredValue('devpilot-compact') === '1');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    try {
      writeStoredValue('devpilot-compact', compact ? '1' : '0');
      document.documentElement.classList.toggle('compact', compact);
      await updateUserProfile({ displayName });
      toast.success('Settings saved');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const photoURL = await uploadUserAsset(user?.uid, file);
      await updateUserProfile({ photoURL });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
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
            <div className="relative h-20 w-20 shrink-0">
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
              <label className="absolute -bottom-2 -right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-violet-600 text-white shadow-lg">
                <Camera size={17} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => uploadAvatar(event.target.files?.[0])}
                />
              </label>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Display name</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 outline-none"
              />
              <div className="text-muted mt-2 text-sm">{user?.email}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
            <ShieldCheck size={18} />
            {isFirebaseConfigured
              ? 'Firebase authentication and cloud storage configured'
              : 'Demo authentication active'}
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
            <li>• Gemini API keys are read only by server-side code.</li>
            <li>• The client sends a Firebase ID token when real authentication is enabled.</li>
            <li>• Firestore and Storage rules restrict each user to their own data.</li>
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
