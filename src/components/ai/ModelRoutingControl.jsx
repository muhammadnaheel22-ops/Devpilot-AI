import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Search, X } from 'lucide-react';
import { ModelSelect } from '../ui/ModelSelect';

const modes = [
  { id: 'auto', label: 'Auto', detail: 'Free router chooses' },
  { id: 'manual', label: 'Manual', detail: 'Use one free model' },
  { id: 'fallback', label: 'Fallback', detail: 'Try free models in order' },
];

export function ModelRoutingControl({ routing, setRouting, models, loading, disabled }) {
  const [query, setQuery] = useState('');
  const [candidate, setCandidate] = useState('');
  const filteredModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return models;
    return models.filter((model) =>
      [model.id, model.name, model.provider, model.description]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [models, query]);
  const modelById = useMemo(() => new Map(models.map((model) => [model.id, model])), [models]);
  const availableFallbacks = filteredModels.filter(
    (model) => model.id !== routing.primaryModel && !routing.fallbackModels.includes(model.id),
  );
  const selectModels = (value) => {
    if (!value || filteredModels.some((model) => model.id === value)) return filteredModels;
    const selected = modelById.get(value);
    return selected ? [selected, ...filteredModels] : filteredModels;
  };
  const updateFallback = (index, direction) => {
    setRouting((current) => {
      const fallbackModels = [...current.fallbackModels];
      const target = index + direction;
      if (target < 0 || target >= fallbackModels.length) return current;
      [fallbackModels[index], fallbackModels[target]] = [
        fallbackModels[target],
        fallbackModels[index],
      ];
      return { ...current, fallbackModels };
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Model routing</div>
          <div className="text-muted text-xs">
            {loading ? 'Loading free OpenRouter models…' : `${models.length} free text models`}
          </div>
        </div>
        <div className="flex rounded-xl border border-[var(--border)] p-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              title={mode.detail}
              disabled={disabled || loading}
              onClick={() => setRouting((current) => ({ ...current, mode: mode.id }))}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                routing.mode === mode.id
                  ? 'bg-violet-600 text-white'
                  : 'text-muted hover:bg-violet-500/10'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {routing.mode === 'auto' ? (
        <p className="text-muted mt-3 text-sm">
          OpenRouter’s free router selects an available zero-cost model for each prompt.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3">
            <Search size={16} className="text-muted" aria-hidden="true" />
            <span className="sr-only">Search OpenRouter models</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={disabled || loading}
              placeholder="Search free models by name or provider…"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
            />
          </label>
          <div className="grid gap-2 lg:grid-cols-[150px_1fr] lg:items-center">
            <span className="text-sm font-medium">Primary model</span>
            <ModelSelect
              label="Primary OpenRouter model"
              value={routing.primaryModel}
              models={selectModels(routing.primaryModel)}
              onChange={(primaryModel) =>
                setRouting((current) => ({
                  ...current,
                  primaryModel,
                  fallbackModels: current.fallbackModels.filter((model) => model !== primaryModel),
                }))
              }
              loading={loading}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {routing.mode === 'fallback' && (
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <ModelSelect
              label="Add fallback model"
              value={candidate}
              models={availableFallbacks}
              onChange={setCandidate}
              loading={loading}
              disabled={disabled || routing.fallbackModels.length >= 5}
            />
            <button
              type="button"
              disabled={!candidate || disabled || routing.fallbackModels.length >= 5}
              onClick={() => {
                setRouting((current) => ({
                  ...current,
                  fallbackModels: [...current.fallbackModels, candidate],
                }));
                setCandidate('');
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Plus size={16} /> Add fallback
            </button>
          </div>
          {routing.fallbackModels.length ? (
            <ol className="space-y-2">
              {routing.fallbackModels.map((modelId, index) => (
                <li
                  key={modelId}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-500/10 font-bold text-violet-500">
                    {index + 2}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {modelById.get(modelId)?.name || modelId}
                  </span>
                  <button
                    type="button"
                    aria-label={`Move ${modelId} up`}
                    disabled={disabled || index === 0}
                    onClick={() => updateFallback(index, -1)}
                    className="rounded-lg p-1 disabled:opacity-30"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${modelId} down`}
                    disabled={disabled || index === routing.fallbackModels.length - 1}
                    onClick={() => updateFallback(index, 1)}
                    className="rounded-lg p-1 disabled:opacity-30"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${modelId}`}
                    disabled={disabled}
                    onClick={() =>
                      setRouting((current) => ({
                        ...current,
                        fallbackModels: current.fallbackModels.filter((model) => model !== modelId),
                      }))
                    }
                    className="rounded-lg p-1 text-red-500"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-amber-500">
              Add at least one free fallback. Until then, requests use the primary model only.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
