import { useId, type SelectHTMLAttributes } from 'react';
import type { Language } from '../../types/translation';

interface LanguageSelectorProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  languages: Language[];
  value: string;
  onChange: (value: string) => void;
}

export function LanguageSelector({
  label,
  languages,
  value,
  onChange,
  ...props
}: LanguageSelectorProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        {...props}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}