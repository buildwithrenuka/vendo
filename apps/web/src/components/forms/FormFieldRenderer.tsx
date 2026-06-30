import { useState } from "react";
import type { FormField } from "@vendo/forms";
import { isStructuralField, validateFieldValue } from "@vendo/forms";
import { Input, Textarea } from "../ui";

const selectClass =
  "app-field w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition";

type Props = {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function FormFieldRenderer({ field, value, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  if (isStructuralField(field)) {
    return (
      <div className="border-t border-[var(--color-border)] pt-5">
        <h3 className="font-semibold text-[var(--color-copper)]">{field.label}</h3>
        {field.sectionDescription && (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{field.sectionDescription}</p>
        )}
      </div>
    );
  }

  const validate = (v: unknown) => setError(validateFieldValue(field, v));
  const strValue = Array.isArray(value) ? value : String(value ?? "");

  if (field.type === "textarea") {
    return (
      <div>
        <Textarea
          label={field.label + (field.required ? " *" : "")}
          value={String(strValue)}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => validate(e.target.value)}
        />
        {field.helperText && !error && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{field.helperText}</p>}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</span>
        <select
          className={selectClass}
          value={String(strValue)}
          onChange={(e) => { onChange(e.target.value); validate(e.target.value); }}
        >
          <option value="">{field.placeholder || "Select…"}</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </label>
    );
  }

  if (field.type === "multi_select") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</span>
        <select
          multiple
          className={`${selectClass} min-h-[88px]`}
          value={selected}
          onChange={(e) => {
            const next = Array.from(e.target.selectedOptions).map((o) => o.value);
            onChange(next);
            validate(next);
          }}
        >
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {field.helperText && !error && <p className="text-xs text-[var(--color-ink-muted)]">{field.helperText}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </label>
    );
  }

  if (field.type === "radio") {
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</legend>
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]">
            <input
              type="radio"
              name={field.id}
              className="accent-[var(--color-copper)]"
              checked={value === opt}
              onChange={() => { onChange(opt); validate(opt); }}
            />
            {opt}
          </label>
        ))}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </fieldset>
    );
  }

  if (field.type === "checkbox") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</legend>
        {field.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 text-sm text-[var(--color-ink-muted)]">
            <input
              type="checkbox"
              className="accent-[var(--color-copper)]"
              checked={selected.includes(opt)}
              onChange={() => {
                const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt];
                onChange(next);
                validate(next);
              }}
            />
            {opt}
          </label>
        ))}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </fieldset>
    );
  }

  if (field.type === "file") {
    return (
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{field.label}{field.required ? " *" : ""}</span>
        <input
          type="file"
          className="app-field w-full rounded-xl border px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-copper)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-zinc-900"
          onChange={(e) => { onChange(e.target.files?.[0]?.name ?? ""); validate(e.target.files?.[0]?.name ?? ""); }}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </label>
    );
  }

  const inputType = field.type === "email" ? "email"
    : field.type === "phone" ? "tel"
    : field.type === "number" || field.type === "currency" ? "number"
    : field.type === "date" ? "date"
    : field.type === "url" ? "url"
    : "text";

  return (
    <div>
      <Input
        label={field.label + (field.required ? " *" : "")}
        type={inputType}
        value={String(strValue)}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => validate(e.target.value)}
      />
      {field.helperText && !error && <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{field.helperText}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
