import type { FormField } from "@vendo/forms";
import {
  CONDITIONAL_OPERATORS,
  FIELD_CATALOG,
  VALIDATION_PRESETS,
  fieldHasOptions,
} from "@vendo/forms";
import { Button, Input, Textarea } from "../ui";

function OptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const update = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Options</p>
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm"
            value={opt}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => onChange(options.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        variant="secondary"
        className="text-xs"
        type="button"
        onClick={() => onChange([...options, `Option ${options.length + 1}`])}
      >
        + Add option
      </Button>
    </div>
  );
}

type Props = {
  field: FormField;
  allFields: FormField[];
  onChange: (patch: Partial<FormField>) => void;
};

export function FormFieldEditor({ field, allFields, onChange }: Props) {
  const typeLabel = FIELD_CATALOG.find((f) => f.type === field.type)?.label ?? field.type;
  const isLayout = field.type === "section" || field.type === "page_break";
  const parentCandidates = allFields.filter(
    (f) => f.id !== field.id && f.type !== "section" && f.type !== "page_break" && f.type !== "section_divider",
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {typeLabel} settings
      </p>

      <Input
        label={field.type === "page_break" ? "Page title" : "Label"}
        value={field.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />

      {(field.type === "section" || field.type === "page_break") && (
        <Textarea
          label="Description"
          rows={2}
          value={field.sectionDescription}
          onChange={(e) => onChange({ sectionDescription: e.target.value })}
        />
      )}

      {!isLayout && (
        <>
          <Input
            label="Placeholder"
            value={field.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
          <Textarea
            label="Helper text"
            rows={2}
            value={field.helperText}
            onChange={(e) => onChange({ helperText: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ required: e.target.checked })}
            />
            Required
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Field width</span>
            <select
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              value={field.fieldWidth}
              onChange={(e) => onChange({ fieldWidth: e.target.value as FormField["fieldWidth"] })}
            >
              <option value="full">Full width</option>
              <option value="half">Half width</option>
            </select>
          </label>

          {fieldHasOptions(field.type) && (
            <OptionsEditor options={field.options} onChange={(options) => onChange({ options })} />
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium">Validation</span>
            <select
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              value={field.validationPreset}
              onChange={(e) => onChange({ validationPreset: e.target.value as FormField["validationPreset"] })}
            >
              {VALIDATION_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          {field.validationPreset === "custom" && (
            <Input
              label="Custom regex"
              value={field.customPattern}
              onChange={(e) => onChange({ customPattern: e.target.value })}
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min length"
              type="number"
              value={String(field.minLength || "")}
              onChange={(e) => onChange({ minLength: Number(e.target.value) || 0 })}
            />
            <Input
              label="Max length"
              type="number"
              value={String(field.maxLength || "")}
              onChange={(e) => onChange({ maxLength: Number(e.target.value) || 0 })}
            />
          </div>

          <Input
            label="Custom error message"
            value={field.errorMessage}
            onChange={(e) => onChange({ errorMessage: e.target.value })}
            placeholder="Shown when validation fails"
          />

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream)]/50 p-3">
            <p className="text-sm font-medium">Conditional visibility</p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              Show this field only when another field matches a rule.
            </p>
            <label className="mt-2 block space-y-1">
              <span className="text-xs font-medium">When field</span>
              <select
                className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm"
                value={field.conditionalParentId}
                onChange={(e) => onChange({ conditionalParentId: e.target.value })}
              >
                <option value="">Always show</option>
                {parentCandidates.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </label>
            {field.conditionalParentId && (
              <>
                <label className="mt-2 block space-y-1">
                  <span className="text-xs font-medium">Operator</span>
                  <select
                    className="w-full rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-sm"
                    value={field.conditionalOperator}
                    onChange={(e) => onChange({ conditionalOperator: e.target.value as FormField["conditionalOperator"] })}
                  >
                    {CONDITIONAL_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </label>
                {!["is_empty", "is_not_empty"].includes(field.conditionalOperator) && (
                  <div className="mt-2">
                    <Input
                      label="Value"
                      value={field.conditionalValue}
                      onChange={(e) => onChange({ conditionalValue: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
