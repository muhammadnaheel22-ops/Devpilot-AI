import { useMemo } from 'react';
import { Cpu } from 'lucide-react';

export function ModelSelect({ value, models, onChange, loading, disabled, label = 'AI model' }) {
  const providers = useMemo(
    () =>
      models.reduce((groups, model) => {
        (groups[model.provider] ||= []).push(model);
        return groups;
      }, {}),
    [models],
  );
  const selected = models.find((model) => model.id === value);

  return (
    <label className="relative flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
      <Cpu className="shrink-0 text-violet-500" size={16} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
        className="model-select focus-ring min-w-0 w-full flex-1 bg-transparent py-2 text-sm font-medium outline-none disabled:cursor-wait disabled:opacity-70"
      >
        {loading && <option value={value}>Loading models…</option>}
        {!loading && !value && <option value="">Select a model…</option>}
        {!loading && value && !selected && <option value={value}>{value}</option>}
        {!loading &&
          Object.entries(providers).map(([provider, providerModels]) => (
            <optgroup key={provider} label={provider}>
              {providerModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} · FREE · {model.contextLength?.toLocaleString() || '?'} context
                  tokens
                </option>
              ))}
            </optgroup>
          ))}
      </select>
    </label>
  );
}
