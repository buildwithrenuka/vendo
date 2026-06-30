import { useEffect, useState } from "react";
import type { FormField, FormSchemaPayload } from "@vendo/forms";
import {
  FIELD_CATALOG,
  FIELD_CATALOG_GROUPS,
  SUPPLIER_STARTER_FIELDS,
  defaultField,
  makeFieldId,
} from "@vendo/forms";
import { Button, Card, Input, SectionHeader, Badge } from "../ui";
import { FormFieldEditor } from "./FormFieldEditor";
import { FormPreview } from "./FormPreview";

type Props = {
  initialSchema?: FormSchemaPayload;
  publishedVersion?: number | null;
  publishedAt?: string | null;
  onSave: (schema: FormSchemaPayload, publish: boolean) => Promise<void>;
};

export function OnboardingFormBuilder({
  initialSchema,
  publishedVersion,
  publishedAt,
  onSave,
}: Props) {
  const [title, setTitle] = useState(initialSchema?.title ?? "Supplier Onboarding");
  const [description, setDescription] = useState(initialSchema?.description ?? "");
  const [fields, setFields] = useState<FormField[]>(initialSchema?.fields ?? SUPPLIER_STARTER_FIELDS);
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  const [tab, setTab] = useState<"design" | "preview">("design");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialSchema) return;
    setTitle(initialSchema.title);
    setDescription(initialSchema.description ?? "");
    setFields(initialSchema.fields);
  }, [initialSchema]);

  const selected = fields.find((f) => f.id === selectedId) ?? null;

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addField = (type: FormField["type"]) => {
    const field = defaultField(type);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  };

  const removeField = (id: string) => {
    setFields((prev) =>
      prev
        .filter((f) => f.id !== id)
        .map((f) => (f.conditionalParentId === id ? { ...f, conditionalParentId: "" } : f)),
    );
    if (selectedId === id) setSelectedId(null);
  };

  const moveField = (id: string, direction: -1 | 1) => {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const duplicateField = (id: string) => {
    const source = fields.find((f) => f.id === id);
    if (!source) return;
    const copy: FormField = { ...source, id: makeFieldId(), label: `${source.label} (copy)` };
    const index = fields.findIndex((f) => f.id === id);
    setFields((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
  };

  const save = async (publish: boolean) => {
    setSaving(true);
    try {
      await onSave({ title, description, fields }, publish);
    } finally {
      setSaving(false);
    }
  };

  const schema: FormSchemaPayload = { title, description, fields };

  return (
    <Card id="form-builder">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Onboarding form"
          description="Fields suppliers fill when they join."
        />
        {publishedVersion != null && (
          <Badge tone="accent" className="shrink-0">
            Live v{publishedVersion}
            {publishedAt ? ` · ${new Date(publishedAt).toLocaleDateString()}` : ""}
          </Badge>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Input label="Form title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="mb-4 flex gap-1 rounded-xl border border-[var(--color-border)] bg-black/20 p-1">
        {(["design", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "bg-white/10 text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
            onClick={() => setTab(t)}
          >
            {t === "design" ? "Design" : "Preview"}
          </button>
        ))}
      </div>

      {tab === "preview" ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-black/20 p-5">
          <p className="mb-4 text-xs text-[var(--color-ink-muted)]">
            Interactive preview — test conditional fields by filling values below.
          </p>
          <FormPreview
            schema={schema}
            values={previewValues}
            onChange={(fieldId, value) => setPreviewValues((prev) => ({ ...prev, [fieldId]: value }))}
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[200px_minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {FIELD_CATALOG_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.types.map((type) => {
                    const item = FIELD_CATALOG.find((f) => f.type === type);
                    if (!item) return null;
                    return (
                      <button
                        key={type}
                        type="button"
                        className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs transition hover:border-[var(--color-copper)]/30 hover:bg-white/5"
                        onClick={() => addField(type)}
                        title={item.label}
                      >
                        {item.icon} {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
              Form fields ({fields.length})
            </p>
            {fields.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">No fields yet — add from the left.</p>
            ) : (
              fields.map((field, index) => {
                const catalog = FIELD_CATALOG.find((f) => f.type === field.type);
                return (
                  <div
                    key={field.id}
                      className={`rounded-lg border px-2 py-1.5 ${
                      selectedId === field.id
                        ? "border-[var(--color-copper)]/40 bg-[var(--color-copper)]/8"
                        : "border-transparent hover:bg-white/4"
                    }`}
                  >
                    <div
                      className="flex cursor-pointer items-center justify-between gap-2 text-sm"
                      onClick={() => setSelectedId(field.id)}
                    >
                      <span className="min-w-0 truncate">
                        {index + 1}. {field.label}
                        <span className="ml-1 text-xs text-[var(--color-ink-muted)]">
                          ({catalog?.label ?? field.type})
                        </span>
                        {field.required && <span className="text-red-500"> *</span>}
                        {field.conditionalParentId && <span className="ml-1 text-[var(--color-copper)]">◇</span>}
                      </span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          className="px-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); moveField(field.id, -1); }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="px-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                          disabled={index === fields.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveField(field.id, 1); }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="px-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                          onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          className="px-1 text-xs text-red-600"
                          onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] p-3">
            {selected ? (
              <FormFieldEditor
                field={selected}
                allFields={fields}
                onChange={(patch) => updateField(selected.id, patch)}
              />
            ) : (
              <p className="text-sm text-[var(--color-ink-muted)]">Select a field to customize it.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={saving} onClick={() => save(false)}>
          Save draft
        </Button>
        <Button disabled={saving || fields.length === 0} onClick={() => save(true)}>
          Publish new version
        </Button>
        <p className="w-full text-xs text-[var(--color-ink-muted)]">
          Draft saves your work. Publish pushes a new version — new invites get the latest form.
        </p>
      </div>
    </Card>
  );
}
