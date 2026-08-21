import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Search, Star } from 'lucide-react';
import { promptLibrary } from '../constants/prompts';
import { readStoredJson, writeStoredJson } from '../utils/storage';
export default function PromptLibraryPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [favorites, setFavorites] = useState(() =>
    readStoredJson('devpilot-prompt-favorites', [], Array.isArray),
  );
  const categories = ['All', ...new Set(promptLibrary.map((p) => p.category))];
  const results = useMemo(
    () =>
      promptLibrary.filter(
        (p) =>
          (category === 'All' || p.category === category) &&
          `${p.title} ${p.prompt}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, category],
  );
  const toggle = (title) => {
    const next = favorites.includes(title)
      ? favorites.filter((x) => x !== title)
      : [...favorites, title];
    setFavorites(next);
    writeStoredJson('devpilot-prompt-favorites', next);
  };
  return (
    <div>
      <h1 className="text-3xl font-bold">Prompt Library</h1>
      <p className="text-muted mt-2">
        Reusable, structured prompts for engineering, study, interviews, and DevOps.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts"
            className="w-full bg-transparent py-3 outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          {categories.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {results.map((item) => (
          <article key={item.title} className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-lg bg-violet-500/12 px-2 py-1 text-xs font-semibold text-violet-500">
                  {item.category}
                </span>
                <h2 className="mt-3 text-lg font-bold">{item.title}</h2>
              </div>
              <button
                onClick={() => toggle(item.title)}
                className={favorites.includes(item.title) ? 'text-amber-500' : 'text-muted'}
              >
                <Star fill={favorites.includes(item.title) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-muted mt-4 whitespace-pre-wrap text-sm leading-6">{item.prompt}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(item.prompt);
                toast.success('Prompt copied');
              }}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-500"
            >
              <Copy size={16} />
              Copy prompt
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
