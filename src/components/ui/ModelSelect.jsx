import { Cpu } from 'lucide-react';

export function ModelSelect({ value, models, onChange, loading, disabled }) {
  return (
    <label className="relative flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
      <Cpu className="shrink-0 text-violet-500" size={16} aria-hidden="true" />
      <span className="sr-only">AI model</span>
      <select
        aria-label="AI model"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
        className="focus-ring min-w-0 max-w-60 flex-1 bg-transparent py-2 text-sm font-medium outline-none disabled:cursor-wait disabled:opacity-70"
      >
        {loading && <option value={value}>Loading models…</option>}
        {!loading && !models.some((model) => model.id === value) && (
          <option value={value}>{value}</option>
        )}
        {!loading &&
          models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} · {model.provider}
            </option>
          ))}
      </select>
    </label>
  );
}
