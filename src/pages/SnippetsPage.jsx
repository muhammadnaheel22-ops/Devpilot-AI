import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, Download, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { deleteUserSnippet, getUserSnippets } from '../services/userDataService';
import { exportJson } from '../utils/export';

export default function SnippetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [queryText, setQueryText] = useState('');
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['snippets', user?.uid],
    queryFn: () => getUserSnippets(user?.uid),
    enabled: Boolean(user?.uid),
  });
  const removeMutation = useMutation({
    mutationFn: (id) => deleteUserSnippet(user?.uid, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['snippets', user?.uid] }),
    onError: (error) => toast.error(error.message),
  });
  const results = useMemo(
    () =>
      items.filter((item) =>
        `${item.title} ${item.language} ${item.tags?.join(' ')}`
          .toLowerCase()
          .includes(queryText.toLowerCase()),
      ),
    [items, queryText],
  );

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold">Saved Snippets</h1>
          <p className="text-muted mt-2">
            Search, copy, delete, sync, and export generated code and documentation.
          </p>
        </div>
        <button
          onClick={() => exportJson(items, 'devpilot-snippets.json')}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 font-semibold"
        >
          <Download size={17} /> Export all
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
        <Search size={18} />
        <input
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          placeholder="Search snippets"
          className="w-full bg-transparent py-3 outline-none"
        />
      </div>

      <div className="mt-5 grid gap-4">
        {isLoading ? (
          <div className="panel min-h-72 shimmer" />
        ) : results.length ? (
          results.map((item) => (
            <article key={item.id} className="panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
                <div>
                  <h2 className="font-bold">{item.title}</h2>
                  <div className="text-muted mt-1 text-xs">
                    {item.language} · {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="rounded-lg p-2 hover:bg-violet-500/10"
                    onClick={() => {
                      navigator.clipboard.writeText(item.content);
                      toast.success('Copied');
                    }}
                    aria-label="Copy snippet"
                  >
                    <Copy size={17} />
                  </button>
                  <button
                    className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                    onClick={() => removeMutation.mutate(item.id)}
                    aria-label="Delete snippet"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <pre className="font-mono scrollbar-thin max-h-80 overflow-auto whitespace-pre-wrap p-4 text-sm">
                {item.content}
              </pre>
            </article>
          ))
        ) : (
          <div className="panel grid min-h-72 place-items-center text-center">
            <div>
              <p className="font-bold">No saved snippets</p>
              <p className="text-muted mt-2 text-sm">Save a result from any AI module.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
