import { languageGroups } from '../../constants/languages';
export function LanguageSelect({ value, onChange, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`themed-select focus-ring rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--foreground)] outline-none ${className}`}
    >
      {languageGroups.map((group) => (
        <optgroup label={group.label} key={group.label}>
          {group.options.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
